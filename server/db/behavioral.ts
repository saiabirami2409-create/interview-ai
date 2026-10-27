import { prisma } from "./prisma";
import {
  getBehavioralQuestionsForRole,
  evaluateBehavioralAnswer,
  BehavioralEvaluationResult,
} from "../ai/behavioral-evaluator";
import fs from "fs";
import path from "path";

export async function createOrGetBehavioralSession(params: {
  userId: string;
  targetRole?: string;
  parentAssessmentId?: string;
}) {
  const { userId, targetRole = "Software Engineer", parentAssessmentId } = params;

  // Check if a session already exists for this parent assessment
  if (parentAssessmentId) {
    const existing = await prisma.interviewSession.findFirst({
      where: {
        userId,
        parentAssessmentId,
        interviewType: "BEHAVIORAL",
      },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            answer: {
              include: {
                evaluation: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }
  }

  // Generate 3 standard behavioral questions
  const templates = getBehavioralQuestionsForRole(targetRole, 3);

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      title: `Round 2 — ${targetRole} Behavioral & Leadership Interview`,
      targetRole,
      interviewType: "BEHAVIORAL",
      difficulty: "INTERMEDIATE",
      questionCount: templates.length,
      timeLimitMinutes: 20,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      parentAssessmentId,
      questions: {
        create: templates.map((t, idx) => ({
          orderIndex: idx,
          questionText: t.questionText,
          category: t.category,
          difficulty: "INTERMEDIATE",
          relevantSkills: JSON.stringify([t.competency, "STAR Method", "Communication"]),
          expectedCriteria: t.expectedCriteria,
          hints: t.hints,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          answer: {
            include: {
              evaluation: true,
            },
          },
        },
      },
    },
  });

  return session;
}

export async function getBehavioralSession(sessionId: string, userId: string) {
  return prisma.interviewSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          answer: {
            include: {
              evaluation: true,
            },
          },
        },
      },
      report: true,
    },
  });
}

export async function submitBehavioralAnswer(params: {
  sessionId: string;
  questionId: string;
  userId: string;
  transcript: string;
  durationSeconds: number;
  videoRecordingUrl?: string;
  isTextOnly?: boolean;
  userConsented: boolean;
}) {
  const {
    sessionId,
    questionId,
    userId,
    transcript,
    durationSeconds,
    videoRecordingUrl,
    isTextOnly = false,
    userConsented,
  } = params;

  // Verify ownership
  const question = await prisma.interviewQuestion.findFirst({
    where: {
      id: questionId,
      sessionId,
      session: {
        userId,
      },
    },
    include: {
      session: true,
    },
  });

  if (!question) {
    throw new Error("Question not found or access denied.");
  }

  // Run AI evaluation separating content and presentation
  const evalResult: BehavioralEvaluationResult = await evaluateBehavioralAnswer({
    questionText: question.questionText,
    category: question.category,
    targetRole: question.session.targetRole,
    transcript,
    durationSeconds,
    isTextOnly,
  });

  // Upsert the answer
  const existingAnswer = await prisma.interviewAnswer.findUnique({
    where: { questionId },
  });

  let answer;
  if (existingAnswer) {
    // Delete old evaluation if exists
    await prisma.answerEvaluation.deleteMany({
      where: { answerId: existingAnswer.id },
    });

    answer = await prisma.interviewAnswer.update({
      where: { id: existingAnswer.id },
      data: {
        answerText: transcript,
        timeSpentSec: durationSeconds,
        videoRecordingUrl,
        audioDurationSec: durationSeconds,
        isTextOnly,
        userConsented,
        deletedAt: null,
        evaluation: {
          create: {
            relevanceScore: evalResult.content.relevanceScore,
            technicalScore: evalResult.content.structureScore, // STAR structure
            completenessScore: evalResult.content.overallContentScore,
            communicationScore: evalResult.content.communicationScore,
            reasoningScore: evalResult.content.structureScore,
            overallScore: evalResult.content.overallContentScore,
            strengths: JSON.stringify(evalResult.content.keyStrengths),
            weaknesses: JSON.stringify(evalResult.content.areasForImprovement),
            missingConcepts: JSON.stringify(
              Object.entries(evalResult.content.starBreakdown)
                .filter(([_, v]) => !v.present)
                .map(([k]) => `Missing ${k.toUpperCase()} component`)
            ),
            improvementSuggestions: JSON.stringify(evalResult.content.areasForImprovement),
            modelAnswerOutline: evalResult.content.modelStarAnswer,
            recommendedTopics: JSON.stringify(["STAR Behavioral Framework", "Verbal Pacing"]),
            presentationFeedback: JSON.stringify({
              ...evalResult.presentationTips,
              evidenceBasedFeedback: evalResult.evidenceBasedFeedback,
            }),
          },
        },
      },
      include: {
        evaluation: true,
      },
    });
  } else {
    answer = await prisma.interviewAnswer.create({
      data: {
        questionId,
        answerText: transcript,
        timeSpentSec: durationSeconds,
        videoRecordingUrl,
        audioDurationSec: durationSeconds,
        isTextOnly,
        userConsented,
        evaluation: {
          create: {
            relevanceScore: evalResult.content.relevanceScore,
            technicalScore: evalResult.content.structureScore,
            completenessScore: evalResult.content.overallContentScore,
            communicationScore: evalResult.content.communicationScore,
            reasoningScore: evalResult.content.structureScore,
            overallScore: evalResult.content.overallContentScore,
            strengths: JSON.stringify(evalResult.content.keyStrengths),
            weaknesses: JSON.stringify(evalResult.content.areasForImprovement),
            missingConcepts: JSON.stringify(
              Object.entries(evalResult.content.starBreakdown)
                .filter(([_, v]) => !v.present)
                .map(([k]) => `Missing ${k.toUpperCase()} component`)
            ),
            improvementSuggestions: JSON.stringify(evalResult.content.areasForImprovement),
            modelAnswerOutline: evalResult.content.modelStarAnswer,
            recommendedTopics: JSON.stringify(["STAR Behavioral Framework", "Verbal Pacing"]),
            presentationFeedback: JSON.stringify({
              ...evalResult.presentationTips,
              evidenceBasedFeedback: evalResult.evidenceBasedFeedback,
            }),
          },
        },
      },
      include: {
        evaluation: true,
      },
    });
  }

  // Check if all questions in this session now have answers
  const totalQuestions = await prisma.interviewQuestion.count({
    where: { sessionId },
  });
  const answeredCount = await prisma.interviewAnswer.count({
    where: {
      question: { sessionId },
    },
  });

  if (answeredCount >= totalQuestions) {
    // Generate Overall Report
    const allAnswers = await prisma.interviewAnswer.findMany({
      where: { question: { sessionId } },
      include: { evaluation: true },
    });

    const evals = allAnswers.map((a) => a.evaluation).filter(Boolean);
    const avgOverall = Math.round(
      evals.reduce((acc, curr) => acc + (curr?.overallScore || 0), 0) / (evals.length || 1)
    );
    const avgRelevance = Math.round(
      evals.reduce((acc, curr) => acc + (curr?.relevanceScore || 0), 0) / (evals.length || 1)
    );
    const avgStructure = Math.round(
      evals.reduce((acc, curr) => acc + (curr?.technicalScore || 0), 0) / (evals.length || 1)
    );
    const avgComm = Math.round(
      evals.reduce((acc, curr) => acc + (curr?.communicationScore || 0), 0) / (evals.length || 1)
    );

    let readinessLevel = "Placement Ready";
    let readinessSummary =
      "Candidate articulated robust STAR narratives with high personal ownership, quantifiable metrics, and professional delivery.";

    if (avgOverall < 70) {
      readinessLevel = "Developing Placement Competence";
      readinessSummary =
        "Solid behavioral stories with good intent. Recommend adding more explicit quantifiable outcomes and reducing transition filler words.";
    } else if (avgOverall < 55) {
      readinessLevel = "Foundational Practice Required";
      readinessSummary =
        "Responses need stronger adherence to the STAR framework, specifically emphasizing personal actions over generalized team work.";
    }

    await prisma.interviewReport.upsert({
      where: { sessionId },
      update: {
        overallScore: avgOverall,
        technicalScore: avgStructure,
        communicationScore: avgComm,
        relevanceScore: avgRelevance,
        completenessScore: avgOverall,
        readinessLevel,
        readinessSummary,
        topStrengths: JSON.stringify([
          "Articulated authentic engineering challenges and personal ownership.",
          "Clear structure following Situation and Action phases.",
        ]),
        criticalWeaknesses: JSON.stringify([
          "Always quantify the Result with business or system metrics (% latency, hours saved).",
        ]),
        keyRecommendations: JSON.stringify([
          "Practice the 60-second STAR drill on your resume projects.",
          "Maintain comfortable eye contact toward the camera lens.",
        ]),
      },
      create: {
        sessionId,
        overallScore: avgOverall,
        technicalScore: avgStructure,
        communicationScore: avgComm,
        relevanceScore: avgRelevance,
        completenessScore: avgOverall,
        readinessLevel,
        readinessSummary,
        topStrengths: JSON.stringify([
          "Articulated authentic engineering challenges and personal ownership.",
          "Clear structure following Situation and Action phases.",
        ]),
        criticalWeaknesses: JSON.stringify([
          "Always quantify the Result with business or system metrics (% latency, hours saved).",
        ]),
        keyRecommendations: JSON.stringify([
          "Practice the 60-second STAR drill on your resume projects.",
          "Maintain comfortable eye contact toward the camera lens.",
        ]),
      },
    });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  return {
    answer,
    evalResult,
    isComplete: answeredCount >= totalQuestions,
  };
}

export async function deleteBehavioralRecording(params: {
  sessionId: string;
  questionId: string;
  userId: string;
}) {
  const { sessionId, questionId, userId } = params;

  const answer = await prisma.interviewAnswer.findFirst({
    where: {
      questionId,
      question: {
        sessionId,
        session: { userId },
      },
    },
  });

  if (!answer) {
    throw new Error("Answer not found or access denied.");
  }

  // Delete local video file if exists
  if (answer.videoRecordingUrl) {
    try {
      const relativePath = answer.videoRecordingUrl.startsWith("/")
        ? answer.videoRecordingUrl.slice(1)
        : answer.videoRecordingUrl;
      const fullPath = path.join(process.cwd(), "public", relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {
      console.warn("Could not remove video recording file:", e);
    }
  }

  return prisma.interviewAnswer.update({
    where: { id: answer.id },
    data: {
      videoRecordingUrl: null,
      deletedAt: new Date(),
    },
  });
}
