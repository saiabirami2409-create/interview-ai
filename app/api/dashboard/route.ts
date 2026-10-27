import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getDashboardData } from "@/server/db/assessments";
import { prisma } from "@/server/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to access dashboard", 401);
  }

  try {
    const dashboardData = await getDashboardData(auth.user.id);

    // Fetch user sessions to get latest round scores
    const userSessions = await prisma.interviewSession.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    });

    // 1. Aptitude Round
    const latestAptitude = await prisma.aptitudeAssessment.findFirst({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    });

    // 2. Technical Round
    const technicalSession = userSessions.find(
      (s) => s.interviewType === "TECHNICAL"
    );

    // 3. Project-Based Round
    const latestProject = await prisma.projectInterview.findFirst({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    });

    // 4. Behavioral Round
    const behavioralSession = userSessions.find(
      (s) => (s.interviewType === "BEHAVIORAL" && s.behavioralScore !== null) || s.behavioralScore !== null
    );

    // 5. HR Round
    const hrSession = userSessions.find(
      (s) => (s.interviewType === "HR" && s.hrScore !== null) || s.hrScore !== null
    );

    // Unified Performance Report
    const perfReport = await prisma.candidatePerformanceReport.findUnique({
      where: { userId: auth.user.id },
    });

    // Scores extraction
    const aptitudeScore = latestAptitude?.status === "COMPLETED" ? latestAptitude.score : null;
    const technicalScore = technicalSession?.technicalScore ?? (technicalSession?.status === "COMPLETED" ? technicalSession.overallScore : null);
    const projectScore = latestProject?.status === "COMPLETED" ? latestProject.score : null;
    const behavioralScore = behavioralSession?.behavioralScore ?? null;
    const hrScore = hrSession?.hrScore ?? null;

    const completedScores = [
      aptitudeScore,
      technicalScore,
      projectScore,
      behavioralScore,
      hrScore,
    ].filter((s): s is number => typeof s === "number" && s !== null);

    const fiveRoundAverage =
      completedScores.length > 0
        ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
        : null;

    // Calculate improvement
    let overallImprovement: string | null = null;
    const completedSessions = userSessions.filter((s) => s.status === "COMPLETED" && s.overallScore !== null);
    if (completedSessions.length >= 2) {
      const latest = completedSessions[0].overallScore || 0;
      const oldest = completedSessions[completedSessions.length - 1].overallScore || 0;
      const diff = latest - oldest;
      overallImprovement = diff >= 0 ? `+${diff}%` : `${diff}%`;
    } else if (completedSessions.length === 1) {
      overallImprovement = "Baseline Established";
    }

    const fiveRoundsData = {
      aptitude: {
        roundNumber: 1,
        title: "Aptitude Round",
        status: latestAptitude ? (latestAptitude.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS") : "NOT_STARTED",
        score: aptitudeScore,
        id: latestAptitude?.id || null,
        completedAt: latestAptitude?.completedAt?.toISOString() || null,
      },
      technical: {
        roundNumber: 2,
        title: "Technical Round",
        status: technicalSession ? (technicalSession.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS") : "NOT_STARTED",
        score: technicalScore,
        id: technicalSession?.id || null,
        completedAt: technicalSession?.completedAt?.toISOString() || null,
      },
      project: {
        roundNumber: 3,
        title: "Project-Based Interview",
        status: latestProject ? (latestProject.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS") : "NOT_STARTED",
        score: projectScore,
        id: latestProject?.id || null,
        completedAt: latestProject?.completedAt?.toISOString() || null,
      },
      behavioral: {
        roundNumber: 4,
        title: "Behavioral Round",
        status: behavioralSession ? (behavioralSession.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS") : "NOT_STARTED",
        score: behavioralScore,
        id: behavioralSession?.id || null,
        completedAt: behavioralSession?.completedAt?.toISOString() || null,
      },
      hr: {
        roundNumber: 5,
        title: "HR Round",
        status: hrSession ? (hrSession.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS") : "NOT_STARTED",
        score: hrScore,
        id: hrSession?.id || null,
        completedAt: hrSession?.completedAt?.toISOString() || null,
      },
    };

    const enhancedData = {
      ...dashboardData,
      fiveRounds: fiveRoundsData,
      perfReport: perfReport || null,
      stats: {
        ...dashboardData.stats,
        aptitudeRoundScore: aptitudeScore,
        technicalRoundScore: technicalScore,
        projectRoundScore: projectScore,
        behavioralRoundScore: behavioralScore,
        hrRoundScore: hrScore,
        fiveRoundAverage: fiveRoundAverage ?? dashboardData.stats.averageScore,
        completedRoundsCount: completedScores.length,
        overallImprovement,
      },
    };

    return apiSuccess(enhancedData);
  } catch (err: any) {
    console.error("Dashboard data fetch error:", err);
    return apiError("DASHBOARD_FETCH_FAILED", err.message || "Failed to load dashboard data", 500);
  }
}
