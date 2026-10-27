import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { SaveAnswersRequestSchema } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";
import { saveAssessmentAnswers } from "@/server/db/assessments";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  const { id: assessmentId } = await params;

  try {
    const body = await req.json();
    const parsed = SaveAnswersRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "INVALID_PAYLOAD",
        parsed.error.issues[0]?.message || "Invalid answers payload",
        400
      );
    }

    const result = await saveAssessmentAnswers(assessmentId, auth.user.id, parsed.data.answers);
    if (!result) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found or access denied", 404);
    }

    return apiSuccess(result);
  } catch (err: any) {
    if (err.message === "ASSESSMENT_ALREADY_SUBMITTED") {
      return apiError("ASSESSMENT_ALREADY_SUBMITTED", "Cannot modify answers of a completed assessment", 409);
    }
    console.error("Save answers error:", err);
    return apiError("SAVE_FAILED", err.message || "Failed to save answers", 500);
  }
}
