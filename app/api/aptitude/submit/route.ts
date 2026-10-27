import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { AptitudeQuestion } from "@/server/data/aptitude-bank";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to submit assessment", 401);
  }

  try {
    const body = await req.json();
    const { assessmentId, answers = {}, timeSpentSeconds = 0 } = body;

    if (!assessmentId) {
      return apiError("INVALID_INPUT", "Assessment ID is required", 400);
    }

    const assessment = await prisma.aptitudeAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment || assessment.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "Assessment not found or unauthorized", 404);
    }

    const questions: AptitudeQuestion[] = JSON.parse(assessment.questions);
    const correctMap: Record<string, string> = JSON.parse(assessment.correctAnswers);

    let correctCount = 0;
    const categoryStats: Record<string, { total: number; correct: number; percentage: number }> = {};

    questions.forEach((q) => {
      const cat = q.category || "General";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, correct: 0, percentage: 0 };
      }
      categoryStats[cat].total += 1;

      const userAns = answers[q.id];
      const correctAns = correctMap[q.id] || q.correctAnswer;
      if (userAns && userAns.toUpperCase() === correctAns.toUpperCase()) {
        correctCount += 1;
        categoryStats[cat].correct += 1;
      }
    });

    Object.keys(categoryStats).forEach((cat) => {
      const c = categoryStats[cat];
      c.percentage = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
    });

    const scorePercentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    // Recommendations based on performance
    const recommendations: string[] = [];
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      if (stats.percentage < 60) {
        recommendations.push(
          `Focus on ${cat} speed and shortcut formulas (currently at ${stats.percentage}%). Practice foundational problem types.`
        );
      } else if (stats.percentage >= 80) {
        recommendations.push(`Excellent mastery of ${cat} (${stats.percentage}%). Maintain momentum with timed drills.`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push("Solid all-round performance. Continue refining calculation speed under strict time limits.");
    }

    // Update assessment
    const updated = await prisma.aptitudeAssessment.update({
      where: { id: assessmentId },
      data: {
        status: "COMPLETED",
        correctCount,
        score: scorePercentage,
        answers: JSON.stringify(answers),
        categoryScores: JSON.stringify(categoryStats),
        recommendations: JSON.stringify(recommendations),
        timeSpentSeconds,
        completedAt: new Date(),
      },
    });

    // Update Unified Candidate Performance Report
    const existingReport = await prisma.candidatePerformanceReport.findUnique({
      where: { userId: auth.user.id },
    });

    const techScore = existingReport?.technicalPercentage ?? null;
    const projScore = existingReport?.projectPercentage ?? null;
    const behScore = existingReport?.behavioralPercentage ?? null;
    const hrScore = existingReport?.hrPercentage ?? null;

    // Calculate overall average of completed rounds
    const scores = [scorePercentage, techScore, projScore, behScore, hrScore].filter((s) => s !== null) as number[];
    const overallPercentage = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : scorePercentage;

    await prisma.candidatePerformanceReport.upsert({
      where: { userId: auth.user.id },
      create: {
        userId: auth.user.id,
        aptitudePercentage: scorePercentage,
        overallPercentage,
        completedRoundsCount: scores.length,
      },
      update: {
        aptitudePercentage: scorePercentage,
        overallPercentage,
        completedRoundsCount: scores.length,
      },
    });

    return apiSuccess({
      assessmentId: updated.id,
      score: scorePercentage,
      correctCount,
      totalQuestions: questions.length,
      categoryScores: categoryStats,
      recommendations,
      timeSpentSeconds,
    });
  } catch (error: any) {
    console.error("Aptitude submit error:", error);
    return apiError("SUBMIT_FAILED", error.message || "Failed to submit assessment", 500);
  }
}
