import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getAssessmentReview } from "@/server/db/assessments";
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
      select: { status: true },
    });

    if (!session) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found or access denied", 404);
    }

    if (session.status === "IN_PROGRESS" || session.status === "DRAFT") {
      return apiError(
        "REVIEW_UNAVAILABLE_DURING_ASSESSMENT",
        "Answer review is only accessible after assessment submission or expiration",
        403
      );
    }

    const review = await getAssessmentReview(assessmentId, auth.user.id);
    if (!review) {
      return apiError("REVIEW_NOT_FOUND", "Review not found", 404);
    }

    return apiSuccess(review);
  } catch (err: any) {
    console.error("Fetch review error:", err);
    return apiError("REVIEW_FETCH_FAILED", err.message || "Failed to retrieve answer review", 500);
  }
}
