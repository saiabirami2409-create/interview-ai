import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { GenerateFeedbackRequestSchema } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getAssessmentResults, parseSessionMetadata } from "@/server/db/assessments";
import { generatePersonalizedFeedbackWithGemini } from "@/server/ai/gemini-mcq";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to generate feedback", 401);
  }

  try {
    const body = await req.json();
    const parsed = GenerateFeedbackRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("INVALID_REQUEST", parsed.error.issues[0]?.message || "Invalid feedback request", 400);
    }

    const { assessmentId } = parsed.data;

    const resultsData = await getAssessmentResults(assessmentId, auth.user.id);
    if (!resultsData) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found or access denied", 404);
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: assessmentId },
    });

    if (!session) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found", 404);
    }

    const metadata = parseSessionMetadata(session.jobDescription);

    // If feedback is already generated and cached, return it idempotently
    if (metadata.aiFeedbackReport) {
      return apiSuccess({
        report: metadata.aiFeedbackReport,
      });
    }

    const feedback = await generatePersonalizedFeedbackWithGemini({
      jobRole: resultsData.assessment.jobRole,
      totalQuestions: resultsData.result.totalQuestions,
      correctAnswers: resultsData.result.correctAnswers,
      incorrectAnswers: resultsData.result.incorrectAnswers,
      unansweredQuestions: resultsData.result.unansweredQuestions,
      score: resultsData.result.score,
      percentage: resultsData.result.percentage,
      accuracy: resultsData.result.accuracy,
      topicBreakdown: resultsData.topicPerformance,
      difficultyBreakdown: resultsData.difficultyPerformance,
    });

    const reportId = `fb_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const fullReport = {
      id: reportId,
      assessmentId,
      overallSummary: feedback.overallSummary,
      strongestSkills: feedback.strongestSkills,
      areasForImprovement: feedback.areasForImprovement,
      recommendedTopics: feedback.recommendedTopics,
      suggestedNextAssessment: feedback.suggestedNextAssessment,
      createdAt: new Date().toISOString(),
    };

    // Cache report inside session metadata and InterviewReport
    metadata.aiFeedbackReport = fullReport;
    await prisma.interviewSession.update({
      where: { id: assessmentId },
      data: {
        jobDescription: JSON.stringify(metadata),
      },
    });

    await prisma.interviewReport.upsert({
      where: { sessionId: assessmentId },
      create: {
        sessionId: assessmentId,
        overallScore: resultsData.result.percentage,
        technicalScore: resultsData.result.percentage,
        communicationScore: 100,
        relevanceScore: resultsData.result.accuracy,
        completenessScore: 100,
        readinessLevel: resultsData.result.category.replace("_", " ").toUpperCase(),
        readinessSummary: feedback.overallSummary,
        topStrengths: JSON.stringify(feedback.strongestSkills),
        criticalWeaknesses: JSON.stringify(feedback.areasForImprovement),
        keyRecommendations: JSON.stringify(feedback.recommendedTopics),
        suggestedNextRole: feedback.suggestedNextAssessment.jobRole,
      },
      update: {
        readinessSummary: feedback.overallSummary,
        topStrengths: JSON.stringify(feedback.strongestSkills),
        criticalWeaknesses: JSON.stringify(feedback.areasForImprovement),
        keyRecommendations: JSON.stringify(feedback.recommendedTopics),
        suggestedNextRole: feedback.suggestedNextAssessment.jobRole,
      },
    });

    return apiSuccess({
      report: fullReport,
    });
  } catch (err: any) {
    console.error("AI feedback generation error:", err);
    return apiError("AI_FEEDBACK_FAILED", err.message || "Failed to generate AI feedback", 500);
  }
}
