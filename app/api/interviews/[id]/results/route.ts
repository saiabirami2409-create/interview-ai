import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getAssessmentResults } from "@/server/db/assessments";

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
    const results = await getAssessmentResults(assessmentId, auth.user.id);
    if (!results) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment results not found or access denied", 404);
    }

    return apiSuccess(results);
  } catch (err: any) {
    console.error("Fetch results error:", err);
    return apiError("RESULTS_FETCH_FAILED", err.message || "Failed to retrieve results", 500);
  }
}
