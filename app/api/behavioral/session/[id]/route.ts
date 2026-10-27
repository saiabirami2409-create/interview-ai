import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getBehavioralSession } from "@/server/db/behavioral";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  const { id: sessionId } = await params;

  try {
    const session = await getBehavioralSession(sessionId, auth.user.id);
    if (!session) {
      return apiError("SESSION_NOT_FOUND", "Behavioral session not found or access denied", 404);
    }

    return apiSuccess({ session });
  } catch (err: any) {
    console.error("Fetch behavioral session error:", err);
    return apiError("FETCH_FAILED", err.message || "Failed to retrieve session", 500);
  }
}
