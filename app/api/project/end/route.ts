import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import {
  evaluateProjectMCQAnswers,
  ProjectDetails,
  ProjectQuestion,
} from "@/server/ai/project-service";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await req.json();
    const { sessionId, answers: submittedAnswers } = body;

    if (!sessionId) {
      return apiError("INVALID_INPUT", "Session ID is required", 400);
    }

    const session = await prisma.projectInterview.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "Project interview not found", 404);
    }

    const projectDetails: ProjectDetails = JSON.parse(session.projectDetails);
    const questions: ProjectQuestion[] = JSON.parse(session.questions);

    // Merge answers from database and submitted payload
    const storedAnswers = session.candidateAnswers ? JSON.parse(session.candidateAnswers) : {};
    const candidateSelections: Record<string, "A" | "B" | "C" | "D"> = {};

    // First populate from stored answers
    Object.entries(storedAnswers).forEach(([qId, val]: [string, any]) => {
      if (val?.selectedOption) {
        candidateSelections[qId] = val.selectedOption;
      }
    });

    // Override or populate with submitted payload answers
    if (submittedAnswers && typeof submittedAnswers === "object") {
      Object.entries(submittedAnswers).forEach(([qId, opt]: [string, any]) => {
        if (opt && ["A", "B", "C", "D"].includes(String(opt).toUpperCase())) {
          candidateSelections[qId] = String(opt).toUpperCase() as "A" | "B" | "C" | "D";
          storedAnswers[qId] = {
            ...(storedAnswers[qId] || {}),
            selectedOption: candidateSelections[qId],
            submittedAt: new Date().toISOString(),
          };
        }
      });
    }

    const evaluation = await evaluateProjectMCQAnswers(
      projectDetails,
      questions,
      candidateSelections
    );

    // Update projectInterview record
    await prisma.projectInterview.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        candidateAnswers: JSON.stringify(storedAnswers),
        evaluations: JSON.stringify(evaluation.questionResults),
        score: evaluation.overallScore,
        understandingScore: evaluation.understandingScore,
        technicalScore: evaluation.technicalScore,
        problemSolvingScore: evaluation.problemSolvingScore,
        implementationScore: evaluation.implementationScore,
        contributionScore: evaluation.contributionScore,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        recommendations: JSON.stringify(evaluation.recommendations),
        completedAt: new Date(),
      },
    });

    // Update Unified Candidate Performance Report
    const existingReport = await prisma.candidatePerformanceReport.findUnique({
      where: { userId: auth.user.id },
    });

    const aptScore = existingReport?.aptitudePercentage ?? null;
    const techScore = existingReport?.technicalPercentage ?? null;
    const behScore = existingReport?.behavioralPercentage ?? null;
    const hrScore = existingReport?.hrPercentage ?? null;

    const roundScores = [
      aptScore,
      techScore,
      evaluation.overallScore,
      behScore,
      hrScore,
    ].filter((s): s is number => s !== null);

    const combinedOverall =
      roundScores.length > 0
        ? Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)
        : evaluation.overallScore;

    await prisma.candidatePerformanceReport.upsert({
      where: { userId: auth.user.id },
      create: {
        userId: auth.user.id,
        aptitudePercentage: aptScore,
        technicalPercentage: techScore,
        projectPercentage: evaluation.overallScore,
        behavioralPercentage: behScore,
        hrPercentage: hrScore,
        overallPercentage: combinedOverall,
        completedRoundsCount: roundScores.length,
      },
      update: {
        projectPercentage: evaluation.overallScore,
        overallPercentage: combinedOverall,
        completedRoundsCount: roundScores.length,
      },
    });

    return apiSuccess({
      sessionId,
      overallScore: evaluation.overallScore,
      understandingScore: evaluation.understandingScore,
      technicalScore: evaluation.technicalScore,
      problemSolvingScore: evaluation.problemSolvingScore,
      implementationScore: evaluation.implementationScore,
      contributionScore: evaluation.contributionScore,
      correctCount: evaluation.correctCount,
      totalQuestions: evaluation.totalQuestions,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      recommendations: evaluation.recommendations,
    });
  } catch (error: any) {
    console.error("End project interview error:", error);
    return apiError("END_PROJECT_FAILED", error.message || "Failed to conclude project interview", 500);
  }
}
