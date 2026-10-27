import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return apiError("BAD_REQUEST", "sessionId is required", 400);
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: {
            answer: {
              include: { evaluation: true },
            },
          },
        },
      },
    });

    if (!session || session.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "HR session not found", 404);
    }

    const evaluatedAnswers = session.questions
      .map((q) => q.answer?.evaluation)
      .filter(Boolean);

    let averageHrScore = 80;
    let clarityAvg = 82;
    let presenceAvg = 80;
    let cultureAvg = 84;
    let motivationAvg = 78;
    let conflictAvg = 76;

    if (evaluatedAnswers.length > 0) {
      const sum = evaluatedAnswers.reduce((a, b) => a + (b?.overallScore || 0), 0);
      averageHrScore = Math.round(sum / evaluatedAnswers.length);

      const clarSum = evaluatedAnswers.reduce((a, b) => a + (b?.hrClarityScore || b?.communicationScore || 80), 0);
      clarityAvg = Math.round(clarSum / evaluatedAnswers.length);

      const presSum = evaluatedAnswers.reduce((a, b) => a + (b?.hrExamplesScore || 80), 0);
      presenceAvg = Math.round(presSum / evaluatedAnswers.length);

      const cultSum = evaluatedAnswers.reduce((a, b) => a + (b?.hrRelevanceScore || 82), 0);
      cultureAvg = Math.round(cultSum / evaluatedAnswers.length);

      const motSum = evaluatedAnswers.reduce((a, b) => a + (b?.hrAlignmentScore || 80), 0);
      motivationAvg = Math.round(motSum / evaluatedAnswers.length);

      const confSum = evaluatedAnswers.reduce((a, b) => a + (b?.hrReasoningScore || 75), 0);
      conflictAvg = Math.round(confSum / evaluatedAnswers.length);
    }

    // Update Round Progress
    let progress: Record<string, string> = {
      technical: "COMPLETED",
      behavioral: "COMPLETED",
      hr: "COMPLETED",
    };
    try {
      if (session.roundProgress) progress = JSON.parse(session.roundProgress);
    } catch {}
    progress.hr = "COMPLETED";

    // Check parent assessment or previous sessions to compute overall score
    const targetSessionId = session.parentAssessmentId || session.id;
    const parentSession = session.parentAssessmentId
      ? await prisma.interviewSession.findUnique({ where: { id: session.parentAssessmentId } })
      : session;

    const technicalScore = parentSession?.technicalScore ?? null;
    const behavioralScore = parentSession?.behavioralScore ?? null;
    const hrScore = averageHrScore;

    // Calculate Combined Overall Score = (Technical % + Behavioral % + HR %) / attempted count
    const scoresToAverage = [technicalScore, behavioralScore, hrScore].filter(
      (s): s is number => typeof s === "number" && s !== null
    );
    const overallScore =
      scoresToAverage.length > 0
        ? Math.round(scoresToAverage.reduce((a, b) => a + b, 0) / scoresToAverage.length)
        : averageHrScore;

    // Update current session
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        hrScore: averageHrScore,
        overallScore,
        completedAt: new Date(),
        roundProgress: JSON.stringify(progress),
      },
    });

    // Also update parent session if distinct
    if (session.parentAssessmentId) {
      await prisma.interviewSession.update({
        where: { id: session.parentAssessmentId },
        data: {
          hrScore: averageHrScore,
          overallScore,
          roundProgress: JSON.stringify(progress),
        },
      });
    }

    // Upsert Final InterviewReport
    await prisma.interviewReport.upsert({
      where: { sessionId: targetSessionId },
      update: {
        hrPercentage: averageHrScore,
        overallPercentage: overallScore,
        overallScore,
        readinessSummary: `Full 3-Round Mock Interview Completed. Overall readiness score: ${overallScore}%. Technical: ${technicalScore ?? "N/A"}%, Behavioral: ${behavioralScore ?? "N/A"}%, HR: ${averageHrScore}%.`,
      },
      create: {
        sessionId: targetSessionId,
        overallScore,
        technicalScore: technicalScore ?? 75,
        communicationScore: averageHrScore,
        relevanceScore: 80,
        completenessScore: 80,
        technicalPercentage: technicalScore,
        behavioralPercentage: behavioralScore,
        hrPercentage: averageHrScore,
        overallPercentage: overallScore,
        readinessLevel: overallScore >= 75 ? "Placement Ready" : "Developing Placement Competence",
        readinessSummary: `Full 3-Round Mock Interview Completed. Overall readiness score: ${overallScore}%.`,
        topStrengths: JSON.stringify([
          "Consistent professional communication across all rounds.",
          "Strong situational awareness during behavioral and HR inquiries.",
        ]),
        criticalWeaknesses: JSON.stringify([
          "Continue refining quantified metrics and deepen architectural trade-offs.",
        ]),
        keyRecommendations: JSON.stringify([
          "Review detailed question explanations in the Performance Report.",
          "Use the InterviewAI Chatbot to rehearse weak technical topics.",
        ]),
      },
    });

    // Update Unified Candidate Performance Report
    const existingReport = await prisma.candidatePerformanceReport.findUnique({
      where: { userId: auth.user.id },
    });

    const aptScore = existingReport?.aptitudePercentage ?? null;
    const techScore = existingReport?.technicalPercentage ?? null;
    const projScore = existingReport?.projectPercentage ?? null;
    const behScore = existingReport?.behavioralPercentage ?? null;

    const roundScores = [aptScore, techScore, projScore, behScore, averageHrScore].filter(
      (s): s is number => s !== null
    );
    const combinedOverall =
      roundScores.length > 0
        ? Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)
        : averageHrScore;

    await prisma.candidatePerformanceReport.upsert({
      where: { userId: auth.user.id },
      create: {
        userId: auth.user.id,
        aptitudePercentage: aptScore,
        technicalPercentage: techScore,
        projectPercentage: projScore,
        behavioralPercentage: behScore,
        hrPercentage: averageHrScore,
        overallPercentage: combinedOverall,
        completedRoundsCount: roundScores.length,
      },
      update: {
        hrPercentage: averageHrScore,
        overallPercentage: combinedOverall,
        completedRoundsCount: roundScores.length,
      },
    });

    return apiSuccess({
      sessionId,
      targetSessionId,
      hrScore: averageHrScore,
      overallScore,
      criteriaAverages: {
        communicationClarity: clarityAvg,
        professionalPresence: presenceAvg,
        cultureFit: cultureAvg,
        motivationSelfAwareness: motivationAvg,
        conflictProblemSolving: conflictAvg,
      },
    });
  } catch (error: any) {
    console.error("End HR round error:", error);
    return apiError("END_HR_FAILED", error.message || "Failed to finalize HR round", 500);
  }
}
