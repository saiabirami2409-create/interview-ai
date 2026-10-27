import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const { sessionId, questionId, selectedOption, hintUsed } = await req.json();

    if (!sessionId || !questionId || !selectedOption) {
      return apiError("BAD_REQUEST", "sessionId, questionId, and selectedOption are required", 400);
    }

    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: { session: true },
    });

    if (!question || question.sessionId !== sessionId) {
      return apiError("NOT_FOUND", "Question not found in specified session", 404);
    }

    if (question.session.userId !== auth.user.id) {
      return apiError("FORBIDDEN", "Unauthorized access to this session", 403);
    }

    const isCorrect = selectedOption.toUpperCase() === question.correctOption?.toUpperCase();

    // Persist or update the answer
    await prisma.interviewAnswer.upsert({
      where: { questionId },
      update: {
        selectedOption,
        isCorrect,
        hintUsed: !!hintUsed,
        answerText: `Selected Option: ${selectedOption}`,
        submittedAt: new Date(),
      },
      create: {
        questionId,
        selectedOption,
        isCorrect,
        hintUsed: !!hintUsed,
        answerText: `Selected Option: ${selectedOption}`,
        submittedAt: new Date(),
      },
    });

    return apiSuccess({
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation,
      selectedOption,
    });
  } catch (error: any) {
    console.error("Check answer error:", error);
    return apiError("CHECK_ANSWER_FAILED", error.message || "Failed to check answer", 500);
  }
}
