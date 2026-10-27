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

  const { id } = await params;

  try {
    const data = await getAssessmentResults(id, auth.user.id);
    if (!data) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found or access denied", 404);
    }

    return apiSuccess({
      assessment: data.assessment,
      result: data.result,
      links: {
        results: `/interview/results?id=${id}`,
        review: `/interview/review?id=${id}`,
      },
    });
  } catch (err: any) {
    return apiError("FETCH_FAILED", err.message || "Failed to fetch history details", 500);
  }
}
