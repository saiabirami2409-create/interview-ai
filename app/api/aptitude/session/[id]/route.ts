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
    const { id } = await params;
    const assessment = await prisma.aptitudeAssessment.findUnique({
      where: { id },
    });

    if (!assessment || assessment.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "Assessment not found or unauthorized", 404);
    }

    const questions = JSON.parse(assessment.questions);
    const answers = assessment.answers ? JSON.parse(assessment.answers) : {};
    const categoryScores = assessment.categoryScores ? JSON.parse(assessment.categoryScores) : {};
    const recommendations = assessment.recommendations ? JSON.parse(assessment.recommendations) : [];

    return apiSuccess({
      assessment: {
        id: assessment.id,
        category: assessment.category,
        difficulty: assessment.difficulty,
        totalQuestions: assessment.totalQuestions,
        correctCount: assessment.correctCount,
        score: assessment.score,
        status: assessment.status,
        timeSpentSeconds: assessment.timeSpentSeconds,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        questions,
        answers,
        categoryScores,
        recommendations,
      },
    });
  } catch (error: any) {
    console.error("Fetch aptitude session error:", error);
    return apiError("FETCH_FAILED", error.message || "Failed to fetch session", 500);
  }
}
