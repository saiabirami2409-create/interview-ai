import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const { id: sessionId } = await params;

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          include: { answer: true },
        },
        report: true,
      },
    });

    if (!session || session.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "Interview session not found or unauthorized", 404);
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const questions = session.questions.map((q) => {
      const selected = q.answer?.selectedOption || null;
      const isSkipped = !selected;
      const isCorrect = !isSkipped && selected.toUpperCase() === q.correctOption?.toUpperCase();

      if (isSkipped) skippedCount++;
      else if (isCorrect) correctCount++;
      else incorrectCount++;

      let parsedOptions: Record<string, string> = { A: "", B: "", C: "", D: "" };
      try {
        if (q.options) parsedOptions = JSON.parse(q.options);
      } catch {}

      return {
        id: q.id,
        orderIndex: q.orderIndex,
        questionText: q.questionText,
        difficulty: q.difficulty,
        topic: q.topic || "General",
        options: parsedOptions,
        userAnswer: selected,
        correctOption: q.correctOption,
        isCorrect,
        isSkipped,
        explanation: q.explanation,
        hintUsed: q.answer?.hintUsed || false,
      };
    });

    const totalQuestions = questions.length;
    const scorePercentage = session.technicalScore ?? Math.round((correctCount / totalQuestions) * 100);

    return apiSuccess({
      sessionId: session.id,
      targetRole: session.targetRole,
      title: session.title,
      totalQuestions,
      correctCount,
      incorrectCount,
      skippedCount,
      scorePercentage,
      completedAt: session.completedAt?.toISOString(),
      questions,
      report: session.report,
    });
  } catch (error: any) {
    console.error("Technical results error:", error);
    return apiError("TECHNICAL_RESULTS_FAILED", error.message || "Failed to fetch technical results", 500);
  }
}
