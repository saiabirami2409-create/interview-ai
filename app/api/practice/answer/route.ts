import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { submitPracticeAnswer } from "@/server/db/practice";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      questionId,
      selectedLetter,
      shuffledIndices,
      timeSpentSec = 0,
      isBookmarked = false,
    } = body;

    if (!sessionId || !questionId || !selectedLetter || !shuffledIndices) {
      return apiError("INVALID_PAYLOAD", "Missing required fields for answer submission", 400);
    }

    const evaluation = await submitPracticeAnswer({
      sessionId,
      questionId,
      selectedLetter,
      shuffledIndices,
      timeSpentSec,
      isBookmarked,
    });

    return apiSuccess(evaluation);
  } catch (err: any) {
    console.error("Practice answer submission error:", err);
    return apiError("SUBMIT_FAILED", err.message || "Failed to evaluate practice answer", 500);
  }
}
