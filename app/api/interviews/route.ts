import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { InterviewSetupRequestSchema, calculateDifficultyDistribution } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createAssessmentSession } from "@/server/db/assessments";
import { generateMcqsWithGemini } from "@/server/ai/gemini-mcq";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      report: true,
      questions: {
        select: { id: true, orderIndex: true, questionText: true, category: true },
      },
    },
  });

  return apiSuccess({ sessions });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to create assessment", 401);
  }

  try {
    const rawBody = await req.json();

    // Support both new InterviewSetupRequest and legacy payload
    let jobRole = rawBody.jobRole || rawBody.targetRole || "Software Engineer";
    if (jobRole.toLowerCase() === "custom" && rawBody.customJobRole) {
      jobRole = rawBody.customJobRole.trim();
    }

    let topics: string[] = Array.isArray(rawBody.topics) && rawBody.topics.length > 0
      ? rawBody.topics
      : [rawBody.focusArea || rawBody.jobRole || "Core Technical Concepts"];

    if (rawBody.customTopic?.trim() && !topics.includes(rawBody.customTopic.trim())) {
      topics.push(rawBody.customTopic.trim());
    }

    const questionCount = [5, 10, 15, 20].includes(Number(rawBody.questionCount))
      ? Number(rawBody.questionCount)
      : 10;

    const durationMinutes = [10, 15, 20, 30].includes(Number(rawBody.durationMinutes))
      ? Number(rawBody.durationMinutes)
      : [10, 15, 20, 30].includes(Number(rawBody.timeLimitMinutes))
      ? Number(rawBody.timeLimitMinutes)
      : 15;

    const categories = Array.isArray(rawBody.categories) && rawBody.categories.length > 0
      ? rawBody.categories
      : ["core_concepts", "code_output", "debugging", "edge_cases", "performance_optimization", "real_world_scenarios"];

    const distribution = calculateDifficultyDistribution(
      questionCount,
      rawBody.difficultyDistribution?.intermediatePercent ?? 60,
      rawBody.difficultyDistribution?.advancedPercent ?? 40
    );

    // 1. Generate questions dynamically using Gemini AI
    const generationResult = await generateMcqsWithGemini({
      jobRole,
      topics,
      questionCount,
      intermediateCount: distribution.intermediateCount,
      advancedCount: distribution.advancedCount,
      categories,
    });

    // 2. Persist assessment with server-side deadline
    const { session, deadlineAt } = await createAssessmentSession({
      userId: auth.user.id,
      jobRole,
      topics,
      questionCount,
      durationMinutes,
      categories,
      intermediateCount: distribution.intermediateCount,
      advancedCount: distribution.advancedCount,
      questions: generationResult.questions,
    });

    // Envelope response matching typed contracts & backwards compatibility
    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: session.id,
          status: "active",
          jobRole,
          topics,
          questionCount: session.questionCount,
          durationMinutes,
          startedAt: (session.startedAt || session.createdAt).toISOString(),
          deadlineAt,
        },
      },
      // Legacy compatibility fields
      sessionId: session.id,
      questionCount: session.questions.length,
      requestId: `req_${Date.now().toString(36)}`,
    });
  } catch (error: any) {
    console.error("Create assessment error:", error);
    return apiError(
      "ASSESSMENT_CREATION_FAILED",
      error.message || "Failed to initialize technical interview assessment",
      500
    );
  }
}
