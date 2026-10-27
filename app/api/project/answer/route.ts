import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { evaluateProjectAnswer, ProjectDetails, ProjectQuestion } from "@/server/ai/project-service";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await req.json();
    const { sessionId, questionId, selectedOption, transcript, durationSeconds = 0 } = body;

    if (!sessionId || !questionId) {
      return apiError("INVALID_INPUT", "Session ID and question ID are required", 400);
    }

    const session = await prisma.projectInterview.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "Project interview session not found", 404);
    }

    const projectDetails: ProjectDetails = JSON.parse(session.projectDetails);
    const questions: ProjectQuestion[] = JSON.parse(session.questions);
    const currentQ = questions.find((q) => q.id === questionId);

    if (!currentQ) {
      return apiError("NOT_FOUND", "Question not found in this session", 404);
    }

    const normalizedOption = selectedOption ? String(selectedOption).toUpperCase() : null;
    const isCorrect = normalizedOption === currentQ.correctOption;

    // Update stored candidateAnswers map
    const answersMap = session.candidateAnswers ? JSON.parse(session.candidateAnswers) : {};
    answersMap[questionId] = {
      selectedOption: normalizedOption,
      transcript: transcript || (normalizedOption ? `Selected Option ${normalizedOption}` : ""),
      isCorrect,
      durationSeconds,
      submittedAt: new Date().toISOString(),
    };

    const nextIndex = Math.min(questions.length - 1, (currentQ.orderIndex ?? 0) + 1);

    await prisma.projectInterview.update({
      where: { id: sessionId },
      data: {
        candidateAnswers: JSON.stringify(answersMap),
        currentQuestionIndex: nextIndex,
      },
    });

    return apiSuccess({
      questionId,
      selectedOption: normalizedOption,
      isCorrect,
      correctOption: currentQ.correctOption,
      explanation: currentQ.explanation,
      nextQuestionIndex: nextIndex,
    });
  } catch (error: any) {
    console.error("Evaluate project answer error:", error);
    return apiError("EVAL_FAILED", error.message || "Failed to evaluate answer", 500);
  }
}
