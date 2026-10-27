import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const { sessionId, questionId, selectedOption, isSkipped = false } = await req.json();

    if (!sessionId || !questionId) {
      return apiError("BAD_REQUEST", "sessionId and questionId are required", 400);
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

    const normalizedSelected = isSkipped ? null : (selectedOption || null);
    const isCorrect =
      !isSkipped && normalizedSelected
        ? normalizedSelected.toUpperCase() === question.correctOption?.toUpperCase()
        : false;

    const answer = await prisma.interviewAnswer.upsert({
      where: { questionId },
      update: {
        selectedOption: normalizedSelected,
        isCorrect,
        isSkipped: !!isSkipped,
        answerText: isSkipped
          ? "Skipped"
          : normalizedSelected
          ? `Selected Option: ${normalizedSelected}`
          : "Unanswered",
        submittedAt: new Date(),
      },
      create: {
        questionId,
        selectedOption: normalizedSelected,
        isCorrect,
        isSkipped: !!isSkipped,
        answerText: isSkipped
          ? "Skipped"
          : normalizedSelected
          ? `Selected Option: ${normalizedSelected}`
          : "Unanswered",
        submittedAt: new Date(),
      },
    });

    return apiSuccess({
      saved: true,
      questionId,
      selectedOption: normalizedSelected,
      isSkipped: !!isSkipped,
      isCorrect,
    });
  } catch (error: any) {
    console.error("Save answer error:", error);
    return apiError("SAVE_ANSWER_FAILED", error.message || "Failed to save answer", 500);
  }
}
