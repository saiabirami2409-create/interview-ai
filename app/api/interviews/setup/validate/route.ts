import { NextRequest } from "next/server";
import { InterviewSetupRequestSchema, calculateDifficultyDistribution } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = InterviewSetupRequestSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      });

      return apiError(
        "INVALID_SETUP_CONFIGURATION",
        parsed.error.issues[0]?.message || "Invalid interview configuration",
        400,
        fieldErrors
      );
    }

    const {
      jobRole,
      topics,
      customJobRole,
      customTopic,
      questionCount,
      durationMinutes,
      categories,
      difficultyDistribution,
    } = parsed.data;

    // Resolve custom role if chosen
    const resolvedRole =
      jobRole.toLowerCase() === "custom" && customJobRole?.trim()
        ? customJobRole.trim()
        : jobRole;

    // Include custom topic if provided
    const resolvedTopics = [...topics];
    if (customTopic?.trim() && !resolvedTopics.includes(customTopic.trim())) {
      resolvedTopics.push(customTopic.trim());
    }

    // Deduplicate topics and categories
    const uniqueTopics = Array.from(new Set(resolvedTopics));
    const uniqueCategories = Array.from(new Set(categories));

    const distribution = calculateDifficultyDistribution(
      questionCount,
      difficultyDistribution?.intermediatePercent ?? 60,
      difficultyDistribution?.advancedPercent ?? 40
    );

    return apiSuccess({
      valid: true as const,
      normalizedSetup: {
        jobRole: resolvedRole,
        topics: uniqueTopics,
        questionCount,
        durationMinutes,
        categories: uniqueCategories,
        intermediateCount: distribution.intermediateCount,
        advancedCount: distribution.advancedCount,
      },
    });
  } catch (err: any) {
    return apiError("SETUP_VALIDATION_ERROR", err.message || "Failed to validate interview setup", 500);
  }
}
