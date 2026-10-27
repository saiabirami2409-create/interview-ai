import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { deleteBehavioralRecording } from "@/server/db/behavioral";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to delete recording", 401);
  }

  try {
    const body = await req.json();
    const { sessionId, questionId } = body;

    if (!sessionId || !questionId) {
      return apiError("INVALID_PAYLOAD", "sessionId and questionId are required.", 400);
    }

    await deleteBehavioralRecording({
      sessionId,
      questionId,
      userId: auth.user.id,
    });

    return apiSuccess({
      message: "Recording has been permanently deleted from storage and session.",
      deletedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Delete recording error:", err);
    return apiError("DELETE_FAILED", err.message || "Failed to delete recording", 500);
  }
}
