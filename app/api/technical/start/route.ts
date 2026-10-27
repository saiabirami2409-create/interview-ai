import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { generateMcqsWithGemini } from "@/server/ai/gemini-mcq";
import { calculateDifficultyDistribution } from "@/lib/api-schemas";
import { recordQuestionsAsked } from "@/server/ai/duplicate-prevention";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to start technical round", 401);
  }

  try {
    const body = await req.json();

    let jobRole = (body.jobRole || "Software Engineer").trim();
    if (jobRole.toLowerCase() === "custom" && body.customJobRole?.trim()) {
      jobRole = body.customJobRole.trim();
    }

    let topics: string[] = Array.isArray(body.topics) && body.topics.length > 0
      ? body.topics
      : ["Core Technical Concepts"];

    if (body.customTopic?.trim() && !topics.includes(body.customTopic.trim())) {
      topics.push(body.customTopic.trim());
    }

    const questionCount = [5, 10, 15, 20].includes(Number(body.questionCount))
      ? Number(body.questionCount)
      : 10;

    const durationMinutes = [10, 15, 20, 30].includes(Number(body.durationMinutes))
      ? Number(body.durationMinutes)
      : 15;

    const experienceLevel = body.experienceLevel || "FRESHER";
    const assessmentMode = body.assessmentMode === "EXAM" ? "EXAM" : "PRACTICE";

    // Adjust difficulty distribution based on experience level
    let intermediatePct = 60;
    let advancedPct = 40;
    if (experienceLevel === "SENIOR" || experienceLevel === "MID") {
      intermediatePct = 40;
      advancedPct = 60;
    } else if (experienceLevel === "INTERN") {
      intermediatePct = 80;
      advancedPct = 20;
    }

    const distribution = calculateDifficultyDistribution(questionCount, intermediatePct, advancedPct);

    // 1. Generate questions dynamically using Gemini (or high-fidelity fallback)
    const generationResult = await generateMcqsWithGemini({
      jobRole,
      topics,
      questionCount,
      intermediateCount: distribution.intermediateCount,
      advancedCount: distribution.advancedCount,
    });

    const deadlineAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // 2. Persist in InterviewSession
    const session = await prisma.interviewSession.create({
      data: {
        userId: auth.user.id,
        title: `Round 1 — ${jobRole} Technical Assessment`,
        targetRole: jobRole,
        interviewType: "TECHNICAL",
        difficulty: experienceLevel === "SENIOR" ? "ADVANCED" : "INTERMEDIATE",
        questionCount,
        timeLimitMinutes: durationMinutes,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        assessmentMode,
        selectedTopics: JSON.stringify(topics),
        roundProgress: JSON.stringify({
          technical: "IN_PROGRESS",
          behavioral: "NOT_ATTEMPTED",
          hr: "NOT_ATTEMPTED",
        }),
        questions: {
          create: generationResult.questions.map((q, idx) => ({
            orderIndex: idx,
            questionText: q.question,
            category: "technical_mcq",
            difficulty: q.difficulty || (idx < distribution.intermediateCount ? "Intermediate" : "Advanced"),
            relevantSkills: JSON.stringify([q.topic || topics[0] || "General"]),
            expectedCriteria: "Accurate option selection with conceptual reasoning",
            hints: `Hint: Focus on ${q.topic || "core fundamentals"} and consider edge cases.`,
            options: JSON.stringify(q.options),
            correctOption: q.correctOption,
            explanation: q.explanation,
            topic: q.topic || topics[0] || "General",
          })),
        },
      },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Record questions asked to prevent future duplicates
    await recordQuestionsAsked(
      auth.user.id,
      "TECHNICAL",
      generationResult.questions.map((q) => ({
        questionText: q.question,
        topic: q.topic || topics[0] || "General",
        difficulty: q.difficulty || "INTERMEDIATE",
      }))
    );

    // 3. Return sanitized questions (if in EXAM mode, omit correctOption and explanation)
    const sanitizedQuestions = session.questions.map((q) => {
      let parsedOptions: Record<string, string> = { A: "", B: "", C: "", D: "" };
      try {
        if (q.options) parsedOptions = JSON.parse(q.options);
      } catch {}

      return {
        id: q.id,
        orderIndex: q.orderIndex,
        questionText: q.questionText,
        difficulty: q.difficulty,
        topic: q.topic || "General",
        options: parsedOptions,
        hints: q.hints,
        ...(assessmentMode === "PRACTICE"
          ? {
              correctOption: q.correctOption,
              explanation: q.explanation,
            }
          : {}),
      };
    });

    return apiSuccess({
      sessionId: session.id,
      assessment: {
        id: session.id,
        jobRole,
        topics,
        questionCount,
        durationMinutes,
        assessmentMode,
        startedAt: session.startedAt?.toISOString(),
        deadlineAt: deadlineAt.toISOString(),
      },
      questions: sanitizedQuestions,
    });
  } catch (error: any) {
    console.error("Technical start error:", error);
    return apiError("TECHNICAL_START_FAILED", error.message || "Failed to start technical assessment", 500);
  }
}
