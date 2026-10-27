import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { completePracticeSession } from "@/server/db/practice";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, totalTimeSpentSeconds = 0 } = body;

    if (!sessionId) {
      return apiError("INVALID_PAYLOAD", "Session ID is required to complete practice quiz", 400);
    }

    const summary = await completePracticeSession({
      sessionId,
      totalTimeSpentSeconds: Number(totalTimeSpentSeconds) || 0,
    });

    return apiSuccess(summary);
  } catch (err: any) {
    console.error("Complete practice session error:", err);
    return apiError("COMPLETE_FAILED", err.message || "Failed to complete practice session", 500);
  }
}
