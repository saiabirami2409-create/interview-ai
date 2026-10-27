import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const { id } = await params;
    const session = await prisma.projectInterview.findUnique({
      where: { id },
    });

    if (!session || session.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "Project interview not found or unauthorized", 404);
    }

    const projectDetails = JSON.parse(session.projectDetails);
    const questions = JSON.parse(session.questions);
    const candidateAnswers = session.candidateAnswers ? JSON.parse(session.candidateAnswers) : {};
    const evaluations = session.evaluations ? JSON.parse(session.evaluations) : {};
    const strengths = session.strengths ? JSON.parse(session.strengths) : [];
    const weaknesses = session.weaknesses ? JSON.parse(session.weaknesses) : [];
    const recommendations = session.recommendations ? JSON.parse(session.recommendations) : [];

    return apiSuccess({
      session: {
        id: session.id,
        projectDetails,
        questions,
        candidateAnswers,
        evaluations,
        score: session.score,
        understandingScore: session.understandingScore,
        technicalScore: session.technicalScore,
        problemSolvingScore: session.problemSolvingScore,
        implementationScore: session.implementationScore,
        contributionScore: session.contributionScore,
        strengths,
        weaknesses,
        recommendations,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      },
    });
  } catch (error: any) {
    console.error("Fetch project session error:", error);
    return apiError("FETCH_FAILED", error.message || "Failed to fetch session", 500);
  }
}
