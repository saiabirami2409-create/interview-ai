import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, verifySessionOwnership } from "@/server/auth/guard";
import { prisma } from "@/server/db/prisma";
import { getAIProvider } from "@/server/ai/provider";
import { InterviewType, Difficulty } from "@/server/ai/types";

const submitAnswerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  answerText: z.string().default(""),
  selectedOptionIndex: z.number().int().min(0).max(3).optional(),
  timeSpentSec: z.number().default(0),
  isSkipped: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id: sessionId } = await params;

  const isOwner = await verifySessionOwnership(sessionId, auth.user.id);
  if (!isOwner) {
    return NextResponse.json({ error: "Unauthorized session access" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = submitAnswerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { questionId, answerText, selectedOptionIndex, timeSpentSec, isSkipped } = parsed.data;

    // Fetch the question details
    const question = await prisma.interviewQuestion.findFirst({
      where: { id: questionId, sessionId },
      include: { session: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Inspect if question is an MCQ
    let isMcq = false;
    let mcqData: {
      isMcq?: boolean;
      options?: string[];
      correctOptionIndex?: number;
      explanation?: string;
    } | null = null;

    if (question.expectedCriteria && question.expectedCriteria.startsWith("{")) {
      try {
        const parsedCriteria = JSON.parse(question.expectedCriteria);
        if (parsedCriteria.isMcq) {
          isMcq = true;
          mcqData = parsedCriteria;
        }
      } catch {}
    }

    let isCorrect = false;
    let savedAnswerText = answerText;

    if (isMcq && mcqData) {
      if (isSkipped) {
        savedAnswerText = "[Candidate skipped question]";
        isCorrect = false;
      } else if (selectedOptionIndex !== undefined) {
        isCorrect = selectedOptionIndex === mcqData.correctOptionIndex;
        const optionLetter = String.fromCharCode(65 + selectedOptionIndex);
        const optionText = mcqData.options?.[selectedOptionIndex] || "";
        savedAnswerText = JSON.stringify({
          selectedOptionIndex,
          optionLetter,
          optionText,
          isCorrect,
          correctOptionIndex: mcqData.correctOptionIndex,
          explanation: mcqData.explanation,
        });
      }
    } else if (isSkipped) {
      savedAnswerText = "[Candidate skipped question]";
    }

    // 1. Upsert Answer record (idempotent, prevents duplicates)
    const answer = await prisma.interviewAnswer.upsert({
      where: { questionId },
      create: {
        questionId,
        answerText: savedAnswerText,
        timeSpentSec,
        isSkipped,
      },
      update: {
        answerText: savedAnswerText,
        timeSpentSec,
        isSkipped,
      },
    });

    // 2. Evaluate Answer using AI Engine
    const aiProvider = getAIProvider();
    const evaluation = await aiProvider.evaluateAnswer({
      questionText: question.questionText,
      category: question.category,
      interviewType: question.session.interviewType as InterviewType,
      difficulty: question.difficulty as Difficulty,
      expectedCriteria: question.expectedCriteria,
      answerText: isSkipped ? "" : savedAnswerText,
      timeSpentSec,
      selectedOptionIndex,
    });

    // 3. Upsert AnswerEvaluation in database
    const savedEvaluation = await prisma.answerEvaluation.upsert({
      where: { answerId: answer.id },
      create: {
        answerId: answer.id,
        relevanceScore: evaluation.relevanceScore,
        technicalScore: evaluation.technicalScore,
        completenessScore: evaluation.completenessScore,
        communicationScore: evaluation.communicationScore,
        reasoningScore: evaluation.reasoningScore,
        overallScore: evaluation.overallScore,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        missingConcepts: JSON.stringify(evaluation.missingConcepts),
        improvementSuggestions: JSON.stringify(evaluation.improvementSuggestions),
        modelAnswerOutline: evaluation.modelAnswerOutline,
        recommendedTopics: JSON.stringify(evaluation.recommendedTopics),
      },
      update: {
        relevanceScore: evaluation.relevanceScore,
        technicalScore: evaluation.technicalScore,
        completenessScore: evaluation.completenessScore,
        communicationScore: evaluation.communicationScore,
        reasoningScore: evaluation.reasoningScore,
        overallScore: evaluation.overallScore,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        missingConcepts: JSON.stringify(evaluation.missingConcepts),
        improvementSuggestions: JSON.stringify(evaluation.improvementSuggestions),
        modelAnswerOutline: evaluation.modelAnswerOutline,
        recommendedTopics: JSON.stringify(evaluation.recommendedTopics),
      },
    });

    // 3b. Update or initialize student TopicProgress for recommended topics
    if (evaluation.recommendedTopics && evaluation.recommendedTopics.length > 0) {
      for (const topicTitle of evaluation.recommendedTopics) {
        if (!topicTitle || typeof topicTitle !== "string") continue;
        const cleanTitle = topicTitle.trim();
        if (!cleanTitle) continue;

        try {
          // Find or create the master PreparationTopic
          let topic = await prisma.preparationTopic.findUnique({
            where: { title: cleanTitle },
          });

          if (!topic) {
            topic = await prisma.preparationTopic.create({
              data: {
                title: cleanTitle,
                category: question.category || "System Architecture",
                description: `Targeted practice curriculum for ${cleanTitle} derived from mock interview evaluations.`,
                difficulty: question.difficulty || "INTERMEDIATE",
                keyPoints: JSON.stringify(
                  evaluation.missingConcepts && evaluation.missingConcepts.length > 0
                    ? evaluation.missingConcepts
                    : ["Core principles", "Architectural trade-offs"]
                ),
              },
            });
          }

          // Upsert student's personal TopicProgress
          const existingProgress = await prisma.topicProgress.findUnique({
            where: {
              userId_topicId: {
                userId: auth.user.id,
                topicId: topic.id,
              },
            },
          });

          const newSessionsHad = (existingProgress?.sessionsHad || 0) + 1;
          const newMastery = existingProgress
            ? Math.round(existingProgress.mastery * 0.4 + evaluation.overallScore * 0.6)
            : evaluation.overallScore;
          const newPriority = newMastery < 65 ? "HIGH" : newMastery < 80 ? "MEDIUM" : "LOW";

          await prisma.topicProgress.upsert({
            where: {
              userId_topicId: {
                userId: auth.user.id,
                topicId: topic.id,
              },
            },
            create: {
              userId: auth.user.id,
              topicId: topic.id,
              mastery: newMastery,
              sessionsHad: newSessionsHad,
              priority: newPriority,
            },
            update: {
              mastery: newMastery,
              sessionsHad: newSessionsHad,
              priority: newPriority,
            },
          });
        } catch (topicErr) {
          console.warn("Topic progress update warning:", topicErr);
        }
      }
    }

    // 4. Check if all questions in this session are now answered
    const totalQuestions = await prisma.interviewQuestion.count({
      where: { sessionId },
    });

    const answeredQuestions = await prisma.interviewAnswer.count({
      where: {
        question: { sessionId },
      },
    });

    const isSessionComplete = answeredQuestions >= totalQuestions;

    if (isSessionComplete) {
      // Gather all evaluations for the session to generate Report
      const allEvaluations = await prisma.answerEvaluation.findMany({
        where: {
          answer: {
            question: { sessionId },
          },
        },
      });

      const formattedEvals = allEvaluations.map((e) => ({
        relevanceScore: e.relevanceScore,
        technicalScore: e.technicalScore,
        completenessScore: e.completenessScore,
        communicationScore: e.communicationScore,
        reasoningScore: e.reasoningScore,
        overallScore: e.overallScore,
        strengths: JSON.parse(e.strengths),
        weaknesses: JSON.parse(e.weaknesses),
        missingConcepts: JSON.parse(e.missingConcepts),
        improvementSuggestions: JSON.parse(e.improvementSuggestions),
        modelAnswerOutline: e.modelAnswerOutline,
        recommendedTopics: JSON.parse(e.recommendedTopics),
      }));

      const reportData = await aiProvider.generateSessionReport({
        targetRole: question.session.targetRole,
        interviewType: question.session.interviewType as InterviewType,
        evaluations: formattedEvals,
      });

      // Save Report
      await prisma.interviewReport.upsert({
        where: { sessionId },
        create: {
          sessionId,
          overallScore: reportData.overallScore,
          technicalScore: reportData.technicalScore,
          communicationScore: reportData.communicationScore,
          relevanceScore: reportData.relevanceScore,
          completenessScore: reportData.completenessScore,
          readinessLevel: reportData.readinessLevel,
          readinessSummary: reportData.readinessSummary,
          topStrengths: JSON.stringify(reportData.topStrengths),
          criticalWeaknesses: JSON.stringify(reportData.criticalWeaknesses),
          keyRecommendations: JSON.stringify(reportData.keyRecommendations),
          suggestedNextRole: reportData.suggestedNextRole,
        },
        update: {
          overallScore: reportData.overallScore,
          technicalScore: reportData.technicalScore,
          communicationScore: reportData.communicationScore,
          relevanceScore: reportData.relevanceScore,
          completenessScore: reportData.completenessScore,
          readinessLevel: reportData.readinessLevel,
          readinessSummary: reportData.readinessSummary,
          topStrengths: JSON.stringify(reportData.topStrengths),
          criticalWeaknesses: JSON.stringify(reportData.criticalWeaknesses),
          keyRecommendations: JSON.stringify(reportData.keyRecommendations),
          suggestedNextRole: reportData.suggestedNextRole,
        },
      });

      // Mark session COMPLETED
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      selectedOptionIndex,
      correctOptionIndex: mcqData?.correctOptionIndex,
      explanation: mcqData?.explanation,
      evaluation: {
        ...evaluation,
        id: savedEvaluation.id,
      },
      isSessionComplete,
    });
  } catch (error) {
    console.error("Answer submission error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
