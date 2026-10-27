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
      return apiError("NOT_FOUND", "Behavioral session not found", 404);
    }

    // Calculate aggregate scores
    const evaluatedAnswers = session.questions
      .map((q) => q.answer?.evaluation)
      .filter(Boolean);

    let averageBehavioralScore = 75; // default benchmark if no evaluations
    let situationAvg = 75;
    let taskAvg = 75;
    let actionAvg = 75;
    let resultAvg = 75;
    let relevanceAvg = 80;

    if (evaluatedAnswers.length > 0) {
      const sum = evaluatedAnswers.reduce((acc, curr) => acc + (curr?.overallScore || 0), 0);
      averageBehavioralScore = Math.round(sum / evaluatedAnswers.length);

      const sitSum = evaluatedAnswers.reduce((acc, curr) => acc + (curr?.situationScore || curr?.relevanceScore || 75), 0);
      situationAvg = Math.round(sitSum / evaluatedAnswers.length);

      const taskSum = evaluatedAnswers.reduce((acc, curr) => acc + (curr?.taskScore || curr?.communicationScore || 75), 0);
      taskAvg = Math.round(taskSum / evaluatedAnswers.length);

      const actSum = evaluatedAnswers.reduce((acc, curr) => acc + (curr?.actionScore || curr?.technicalScore || 75), 0);
      actionAvg = Math.round(actSum / evaluatedAnswers.length);

      const resSum = evaluatedAnswers.reduce((acc, curr) => acc + (curr?.resultScore || curr?.reasoningScore || 75), 0);
      resultAvg = Math.round(resSum / evaluatedAnswers.length);

      const relSum = evaluatedAnswers.reduce((acc, curr) => acc + (curr?.starRelevanceScore || curr?.relevanceScore || 80), 0);
      relevanceAvg = Math.round(relSum / evaluatedAnswers.length);
    }

    // Update Round Progress
    let progress: Record<string, string> = {
      technical: "COMPLETED",
      behavioral: "COMPLETED",
      hr: "NOT_ATTEMPTED",
    };
    try {
      if (session.roundProgress) progress = JSON.parse(session.roundProgress);
    } catch {}
    progress.behavioral = "COMPLETED";

    // Update session
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        behavioralScore: averageBehavioralScore,
        completedAt: new Date(),
        roundProgress: JSON.stringify(progress),
      },
    });

    // Also update parent assessment report if linked
    const targetSessionId = session.parentAssessmentId || session.id;
    await prisma.interviewReport.upsert({
      where: { sessionId: targetSessionId },
      update: {
        behavioralPercentage: averageBehavioralScore,
      },
      create: {
        sessionId: targetSessionId,
        overallScore: averageBehavioralScore,
        technicalScore: 75,
        communicationScore: averageBehavioralScore,
        relevanceScore: 80,
        completenessScore: 80,
        behavioralPercentage: averageBehavioralScore,
        overallPercentage: averageBehavioralScore,
        readinessLevel: averageBehavioralScore >= 75 ? "Placement Ready" : "Developing Competence",
        readinessSummary: `Behavioral interview completed with a STAR readiness score of ${averageBehavioralScore}%.`,
        topStrengths: JSON.stringify(["Clear structure using the STAR method.", "Strong situational awareness."]),
        criticalWeaknesses: JSON.stringify(["Incorporate more quantified metrics in the Result phase."]),
        keyRecommendations: JSON.stringify(["Proceed to the HR Director round."]),
      },
    });

    // Update Unified Candidate Performance Report
    const existingReport = await prisma.candidatePerformanceReport.findUnique({
      where: { userId: auth.user.id },
    });

    const aptScore = existingReport?.aptitudePercentage ?? null;
    const techScore = existingReport?.technicalPercentage ?? null;
    const projScore = existingReport?.projectPercentage ?? null;
    const hrScore = existingReport?.hrPercentage ?? null;

    const roundScores = [aptScore, techScore, projScore, averageBehavioralScore, hrScore].filter(
      (s): s is number => s !== null
    );
    const combinedOverall =
      roundScores.length > 0
        ? Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)
        : averageBehavioralScore;

    await prisma.candidatePerformanceReport.upsert({
      where: { userId: auth.user.id },
      create: {
        userId: auth.user.id,
        aptitudePercentage: aptScore,
        technicalPercentage: techScore,
        projectPercentage: projScore,
        behavioralPercentage: averageBehavioralScore,
        hrPercentage: hrScore,
        overallPercentage: combinedOverall,
        completedRoundsCount: roundScores.length,
      },
      update: {
        behavioralPercentage: averageBehavioralScore,
        overallPercentage: combinedOverall,
        completedRoundsCount: roundScores.length,
      },
    });

    return apiSuccess({
      sessionId,
      targetRole: session.targetRole,
      companyName: session.companyName,
      behavioralScore: averageBehavioralScore,
      starScores: {
        situation: situationAvg,
        task: taskAvg,
        action: actionAvg,
        result: resultAvg,
        relevance: relevanceAvg,
      },
      questionsCount: session.questions.length,
      evaluatedCount: evaluatedAnswers.length,
    });
  } catch (error: any) {
    console.error("End behavioral round error:", error);
    return apiError("END_BEHAVIORAL_FAILED", error.message || "Failed to conclude behavioral round", 500);
  }
}
