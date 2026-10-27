import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { prisma } from "@/server/db/prisma";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  // 1. Fetch completed sessions with reports
  const completedSessions = await prisma.interviewSession.findMany({
    where: {
      userId: auth.user.id,
      status: "COMPLETED",
      report: { isNot: null },
    },
    include: {
      report: true,
      questions: { select: { id: true, category: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // 2. Compute aggregations
  const totalCompleted = completedSessions.length;
  let avgOverall = 0;
  let avgTechnical = 0;
  let avgCommunication = 0;
  let avgRelevance = 0;
  let avgCompleteness = 0;

  if (totalCompleted > 0) {
    avgOverall = Math.round(
      completedSessions.reduce((acc, s) => acc + (s.report?.overallScore || 0), 0) / totalCompleted
    );
    avgTechnical = Math.round(
      completedSessions.reduce((acc, s) => acc + (s.report?.technicalScore || 0), 0) / totalCompleted
    );
    avgCommunication = Math.round(
      completedSessions.reduce((acc, s) => acc + (s.report?.communicationScore || 0), 0) / totalCompleted
    );
    avgRelevance = Math.round(
      completedSessions.reduce((acc, s) => acc + (s.report?.relevanceScore || 0), 0) / totalCompleted
    );
    avgCompleteness = Math.round(
      completedSessions.reduce((acc, s) => acc + (s.report?.completenessScore || 0), 0) / totalCompleted
    );
  }

  // 3. Format score trend data for charts
  const scoreTrend = completedSessions.map((s, idx) => ({
    date: formatDate(s.createdAt),
    score: s.report?.overallScore || 0,
    title: s.title || `Session ${idx + 1}`,
  }));

  // 4. Fetch student's topic progress
  const topicProgress = await prisma.topicProgress.findMany({
    where: { userId: auth.user.id },
    include: { topic: true },
    orderBy: { mastery: "asc" },
  });

  const formattedTopics = topicProgress.map((tp) => ({
    id: tp.topic.id,
    title: tp.topic.title,
    category: tp.topic.category,
    priority: tp.priority,
    mastery: tp.mastery,
    sessionsHad: tp.sessionsHad,
  }));

  // 5. Recent sessions
  const recentSessions = await prisma.interviewSession.findMany({
    where: { userId: auth.user.id },
    include: { report: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    metrics: {
      totalCompleted,
      avgOverall,
      avgTechnical,
      avgCommunication,
      avgRelevance,
      avgCompleteness,
      readinessBadge: avgOverall >= 80 ? "Placement Ready" : avgOverall >= 60 ? "Developing Competence" : "Initial Baseline",
    },
    scoreTrend,
    topicProgress: formattedTopics,
    recentSessions: recentSessions.map((s) => ({
      id: s.id,
      title: s.title,
      targetRole: s.targetRole,
      interviewType: s.interviewType,
      difficulty: s.difficulty,
      status: s.status,
      overallScore: s.report?.overallScore || null,
      createdAt: s.createdAt,
    })),
  });
}
