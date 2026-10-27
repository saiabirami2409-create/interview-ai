import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { submitBehavioralAnswer } from "@/server/db/behavioral";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to submit answer", 401);
  }

  try {
    const body = await req.json();
    const {
      sessionId,
      questionId,
      transcript,
      durationSeconds = 0,
      videoRecordingUrl,
      isTextOnly = false,
      userConsented = true,
    } = body;

    if (!sessionId || !questionId) {
      return apiError("INVALID_PAYLOAD", "sessionId and questionId are required.", 400);
    }

    if (!transcript && !videoRecordingUrl && !isTextOnly) {
      return apiError(
        "EMPTY_ANSWER",
        "Please provide a spoken or typed response before submitting.",
        400
      );
    }

    const result = await submitBehavioralAnswer({
      sessionId,
      questionId,
      userId: auth.user.id,
      transcript: (transcript || "").trim(),
      durationSeconds: Math.max(Number(durationSeconds) || 0, 0),
      videoRecordingUrl,
      isTextOnly: Boolean(isTextOnly),
      userConsented: Boolean(userConsented),
    });

    return apiSuccess(result);
  } catch (err: any) {
    console.error("Submit behavioral answer error:", err);
    return apiError("SUBMIT_ANSWER_FAILED", err.message || "Failed to evaluate answer", 500);
  }
}
