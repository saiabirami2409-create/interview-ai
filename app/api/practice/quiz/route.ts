import { NextRequest } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { startPracticeSession } from "@/server/db/practice";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession();
    const body = await req.json();

    const {
      topic = "all",
      subtopics = [],
      difficulty = "ALL",
      questionCount = 10,
      timeLimitMinutes,
    } = body;

    const result = await startPracticeSession({
      userId: user?.id,
      topic,
      subtopics,
      difficulty,
      questionCount: Number(questionCount) || 10,
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
    });

    return apiSuccess({
      session: result.session,
      questions: result.questions,
    });
  } catch (err: any) {
    console.error("Start practice quiz error:", err);
    return apiError("PRACTICE_START_FAILED", err.message || "Failed to initialize practice quiz", 500);
  }
}
