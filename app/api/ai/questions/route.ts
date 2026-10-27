import { NextRequest } from "next/server";
import { GenerateQuestionsRequestSchema } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/server/auth/guard";
import { generateMcqsWithGemini } from "@/server/ai/gemini-mcq";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to generate questions", 401);
  }

  try {
    const body = await req.json();
    const parsed = GenerateQuestionsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "INVALID_REQUEST",
        parsed.error.issues[0]?.message || "Invalid question generation request",
        400
      );
    }

    const {
      assessmentId,
      jobRole,
      topics,
      questionCount,
      intermediateCount,
      advancedCount,
      categories,
    } = parsed.data;

    const result = await generateMcqsWithGemini({
      jobRole,
      topics,
      questionCount,
      intermediateCount,
      advancedCount,
      categories,
    });

    const publicQuestions = result.questions.map((q, idx) => ({
      questionId: q.questionId || `q_${idx + 1}`,
      orderIndex: idx + 1,
      question: q.question,
      topic: q.topic,
      difficulty: q.difficulty,
      category: q.category,
      options: q.options,
    }));

    return apiSuccess({
      assessmentId,
      questions: publicQuestions,
      generation: {
        model: result.model,
        generatedAt: new Date().toISOString(),
        attempt: result.attempt,
      },
    });
  } catch (err: any) {
    console.error("Gemini AI Questions error:", err);
    return apiError(
      "AI_GENERATION_FAILED",
      err.message || "Failed to generate interview questions with Gemini API",
      502
    );
  }
}
