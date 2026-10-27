import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { parseSessionMetadata } from "@/server/db/assessments";
import { prisma } from "@/server/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  const { id: assessmentId } = await params;

  try {
    const session = await prisma.interviewSession.findFirst({
      where: { id: assessmentId, userId: auth.user.id },
      include: { report: true },
    });

    if (!session) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found or access denied", 404);
    }

    const metadata = parseSessionMetadata(session.jobDescription);

    if (metadata.aiFeedbackReport) {
      return apiSuccess({
        report: metadata.aiFeedbackReport,
      });
    }

    if (session.report) {
      const topStrengths = JSON.parse(session.report.topStrengths || "[]");
      const criticalWeaknesses = JSON.parse(session.report.criticalWeaknesses || "[]");
      const keyRecommendations = JSON.parse(session.report.keyRecommendations || "[]");

      return apiSuccess({
        report: {
          id: session.report.id,
          assessmentId,
          overallSummary: session.report.readinessSummary || "Performance analysis synthesized from assessment scores.",
          strongestSkills: topStrengths,
          areasForImprovement: criticalWeaknesses,
          recommendedTopics: keyRecommendations,
          suggestedNextAssessment: {
            jobRole: session.report.suggestedNextRole || session.targetRole,
            topics: keyRecommendations.slice(0, 2),
            difficulty: (session.report.overallScore >= 75 ? "Advanced" : "Intermediate") as "Intermediate" | "Advanced",
          },
          createdAt: session.report.createdAt.toISOString(),
        },
      });
    }

    return apiSuccess({
      report: null,
    });
  } catch (err: any) {
    console.error("Fetch feedback error:", err);
    return apiError("FEEDBACK_FETCH_FAILED", err.message || "Failed to retrieve feedback", 500);
  }
}
