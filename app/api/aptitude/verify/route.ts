import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyAptitudeAnswer, AptitudeQuestion } from "@/server/ai/aptitude-service";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await req.json();
    const { question, selectedOption } = body;

    if (!question || !selectedOption) {
      return apiError("INVALID_INPUT", "Question data and selected option are required", 400);
    }

    const verification = verifyAptitudeAnswer(question as AptitudeQuestion, selectedOption);
    return apiSuccess(verification);
  } catch (error: any) {
    console.error("Aptitude verification error:", error);
    return apiError("VERIFY_FAILED", error.message || "Failed to verify answer", 500);
  }
}
