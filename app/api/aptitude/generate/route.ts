import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { generateAptitudeQuestions } from "@/server/ai/aptitude-service";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to start aptitude round", 401);
  }

  try {
    const body = await req.json();
    const category = body.category || "Mixed";
    const difficulty = body.difficulty || "Intermediate";
    const questionCount = Number(body.questionCount) || 15;
    const timeLimitMinutes = Number(body.timeLimitMinutes) || Math.max(15, questionCount);

    const questions = await generateAptitudeQuestions({
      userId: auth.user.id,
      category,
      difficulty,
      questionCount,
    });

    // Build mapping of correct answers for server-side verification
    const correctAnswersMap: Record<string, string> = {};
    questions.forEach((q) => {
      correctAnswersMap[q.id] = q.correctAnswer;
    });

    const assessment = await prisma.aptitudeAssessment.create({
      data: {
        userId: auth.user.id,
        category,
        difficulty,
        totalQuestions: questions.length,
        timeLimitMinutes,
        status: "IN_PROGRESS",
        questions: JSON.stringify(questions),
        correctAnswers: JSON.stringify(correctAnswersMap),
      },
    });

    return apiSuccess({
      assessmentId: assessment.id,
      category,
      difficulty,
      totalQuestions: questions.length,
      timeLimitMinutes,
      questions,
    });
  } catch (error: any) {
    console.error("Aptitude generation error:", error);
    return apiError("APTITUDE_GEN_FAILED", error.message || "Failed to generate aptitude questions", 500);
  }
}
