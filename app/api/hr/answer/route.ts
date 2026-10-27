import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { evaluateHRAnswerWithGemini } from "@/server/ai/hr-service";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const { sessionId, questionId, transcript, durationSeconds = 0 } = await req.json();

    if (!sessionId || !questionId) {
      return apiError("BAD_REQUEST", "sessionId and questionId are required", 400);
    }

    if (!transcript || !transcript.trim()) {
      return apiError("EMPTY_TRANSCRIPT", "Please provide a spoken or typed answer", 400);
    }

    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: { session: true },
    });

    if (!question || question.sessionId !== sessionId) {
      return apiError("NOT_FOUND", "Question not found", 404);
    }

    // Evaluate answer with HR Director persona using Gemini
    const evaluation = await evaluateHRAnswerWithGemini({
      questionText: question.questionText,
      answerText: transcript.trim(),
      role: question.session.targetRole,
      company: question.session.companyName || "Tech Company",
      experienceLevel: "FRESHER",
    });

    // Save answer
    const answer = await prisma.interviewAnswer.upsert({
      where: { questionId },
      update: {
        answerText: transcript.trim(),
        timeSpentSec: Number(durationSeconds) || 0,
        submittedAt: new Date(),
      },
      create: {
        questionId,
        answerText: transcript.trim(),
        timeSpentSec: Number(durationSeconds) || 0,
        submittedAt: new Date(),
      },
    });

    // Save evaluation
    const answerEvaluation = await prisma.answerEvaluation.upsert({
      where: { answerId: answer.id },
      update: {
        overallScore: evaluation.overallScore ?? 0,
        relevanceScore: evaluation.criteria.cultureFit,
        technicalScore: evaluation.criteria.motivationSelfAwareness,
        completenessScore: evaluation.criteria.communicationClarity,
        communicationScore: evaluation.criteria.communicationClarity,
        reasoningScore: evaluation.criteria.conflictProblemSolving,
        hrRelevanceScore: evaluation.criteria.cultureFit,
        hrClarityScore: evaluation.criteria.communicationClarity,
        hrExamplesScore: evaluation.criteria.professionalPresence,
        hrReasoningScore: evaluation.criteria.conflictProblemSolving,
        hrAlignmentScore: evaluation.criteria.motivationSelfAwareness,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.areasForGrowth),
        missingConcepts: JSON.stringify([]),
        improvementSuggestions: JSON.stringify(evaluation.areasForGrowth),
        modelAnswerOutline: evaluation.executiveSummary,
        recommendedTopics: JSON.stringify(["Communication", "HR Leadership", "STAR Method"]),
        presentationFeedback: JSON.stringify({
          evidenceBasedFeedback: evaluation.evidenceBasedFeedback,
        }),
      },
      create: {
        answerId: answer.id,
        overallScore: evaluation.overallScore ?? 0,
        relevanceScore: evaluation.criteria.cultureFit,
        technicalScore: evaluation.criteria.motivationSelfAwareness,
        completenessScore: evaluation.criteria.communicationClarity,
        communicationScore: evaluation.criteria.communicationClarity,
        reasoningScore: evaluation.criteria.conflictProblemSolving,
        hrRelevanceScore: evaluation.criteria.cultureFit,
        hrClarityScore: evaluation.criteria.communicationClarity,
        hrExamplesScore: evaluation.criteria.professionalPresence,
        hrReasoningScore: evaluation.criteria.conflictProblemSolving,
        hrAlignmentScore: evaluation.criteria.motivationSelfAwareness,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.areasForGrowth),
        missingConcepts: JSON.stringify([]),
        improvementSuggestions: JSON.stringify(evaluation.areasForGrowth),
        modelAnswerOutline: evaluation.executiveSummary,
        recommendedTopics: JSON.stringify(["Communication", "HR Leadership", "STAR Method"]),
        presentationFeedback: JSON.stringify({
          evidenceBasedFeedback: evaluation.evidenceBasedFeedback,
        }),
      },
    });

    return apiSuccess({
      answerId: answer.id,
      evaluation,
    });
  } catch (error: any) {
    console.error("HR answer evaluation error:", error);
    return apiError("HR_EVALUATION_FAILED", error.message || "Failed to evaluate HR answer", 500);
  }
}
