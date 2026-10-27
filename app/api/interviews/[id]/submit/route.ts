import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { SubmitAssessmentRequestSchema } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";
import { submitAssessmentSession } from "@/server/db/assessments";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to submit assessment", 401);
  }

  const { id: assessmentId } = await params;

  try {
    const body = await req.json();
    const parsed = SubmitAssessmentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "INVALID_SUBMISSION_PAYLOAD",
        parsed.error.issues[0]?.message || "Invalid submission request",
        400
      );
    }

    const { answers, submissionReason } = parsed.data;

    const result = await submitAssessmentSession(
      assessmentId,
      auth.user.id,
      answers,
      submissionReason
    );

    if (!result) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found or access denied", 404);
    }

    return apiSuccess(result);
  } catch (err: any) {
    console.error("Assessment submission error:", err);
    return apiError("SUBMISSION_FAILED", err.message || "Failed to submit assessment", 500);
  }
}
