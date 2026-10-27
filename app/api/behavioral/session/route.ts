import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createOrGetBehavioralSession } from "@/server/db/behavioral";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to start behavioral interview", 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { targetRole, parentAssessmentId } = body;

    const session = await createOrGetBehavioralSession({
      userId: auth.user.id,
      targetRole: targetRole || "Software Engineer",
      parentAssessmentId,
    });

    return apiSuccess({ session });
  } catch (err: any) {
    console.error("Failed to initialize behavioral session:", err);
    return apiError("BEHAVIORAL_INIT_FAILED", err.message || "Failed to initialize behavioral session", 500);
  }
}
