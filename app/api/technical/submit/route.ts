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
    const { sessionId, answers = {}, timeSpentSec = 0 } = await req.json();

    if (!sessionId) {
      return apiError("BAD_REQUEST", "sessionId is required", 400);
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          include: { answer: true },
        },
      },
    });

    if (!session || session.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "Interview session not found or unauthorized", 404);
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const questionResults = [];

    for (const q of session.questions) {
      const selected = answers[q.id] || q.answer?.selectedOption || null;
      const isSkipped = !selected;
      const isCorrect = !isSkipped && selected.toUpperCase() === q.correctOption?.toUpperCase();

      if (isSkipped) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      // Upsert Answer
      await prisma.interviewAnswer.upsert({
        where: { questionId: q.id },
        update: {
          selectedOption: selected,
          isCorrect,
          isSkipped,
          answerText: selected ? `Selected Option: ${selected}` : "Skipped",
          timeSpentSec: Math.round(timeSpentSec / session.questions.length),
          submittedAt: new Date(),
        },
        create: {
          questionId: q.id,
          selectedOption: selected,
          isCorrect,
          isSkipped,
          answerText: selected ? `Selected Option: ${selected}` : "Skipped",
          timeSpentSec: Math.round(timeSpentSec / session.questions.length),
          submittedAt: new Date(),
        },
      });

      let parsedOptions: Record<string, string> = { A: "", B: "", C: "", D: "" };
      try {
        if (q.options) parsedOptions = JSON.parse(q.options);
      } catch {}

      questionResults.push({
        id: q.id,
        orderIndex: q.orderIndex,
        questionText: q.questionText,
        difficulty: q.difficulty,
        topic: q.topic || "General",
        options: parsedOptions,
        userAnswer: selected,
        correctOption: q.correctOption,
        isCorrect,
        isSkipped,
        explanation: q.explanation,
      });
    }

    const totalQuestions = session.questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Update Round Progress
    let progress: Record<string, string> = {
      technical: "COMPLETED",
      behavioral: "NOT_ATTEMPTED",
      hr: "NOT_ATTEMPTED",
    };
    try {
      if (session.roundProgress) progress = JSON.parse(session.roundProgress);
    } catch {}
    progress.technical = "COMPLETED";

    // Update Session
    const updatedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        technicalScore: scorePercentage,
        overallScore: scorePercentage, // Will be recomputed when multi-rounds complete
        completedAt: new Date(),
        roundProgress: JSON.stringify(progress),
      },
    });

    // Create or update InterviewReport
    await prisma.interviewReport.upsert({
      where: { sessionId },
      update: {
        technicalPercentage: scorePercentage,
        overallPercentage: scorePercentage,
        overallScore: scorePercentage,
        readinessSummary: `Technical assessment completed with ${correctCount}/${totalQuestions} correct (${scorePercentage}%).`,
      },
      create: {
        sessionId,
        overallScore: scorePercentage,
        technicalScore: scorePercentage,
        communicationScore: 75,
        relevanceScore: 80,
        completenessScore: 80,
        technicalPercentage: scorePercentage,
        overallPercentage: scorePercentage,
        readinessLevel: scorePercentage >= 75 ? "Placement Ready" : "Developing Competence",
        readinessSummary: `Technical assessment completed with ${correctCount}/${totalQuestions} correct (${scorePercentage}%).`,
        topStrengths: JSON.stringify([
          `Demonstrated accurate technical knowledge in ${correctCount} of ${totalQuestions} topics.`,
        ]),
        criticalWeaknesses: JSON.stringify(
          incorrectCount > 0
            ? [`Review topics where questions were missed (${incorrectCount} incorrect).`]
            : ["Keep up strong consistency across edge cases."]
        ),
        keyRecommendations: JSON.stringify([
          "Proceed to Round 2 (Behavioral STAR Interview) to demonstrate situational problem solving.",
        ]),
      },
    });

    // Update Unified Candidate Performance Report
    const existingReport = await prisma.candidatePerformanceReport.findUnique({
      where: { userId: auth.user.id },
    });

    const aptScore = existingReport?.aptitudePercentage ?? null;
    const projScore = existingReport?.projectPercentage ?? null;
    const behScore = existingReport?.behavioralPercentage ?? null;
    const hrScore = existingReport?.hrPercentage ?? null;

    const roundScores = [aptScore, scorePercentage, projScore, behScore, hrScore].filter(
      (s): s is number => s !== null
    );
    const combinedOverall =
      roundScores.length > 0
        ? Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)
        : scorePercentage;

    await prisma.candidatePerformanceReport.upsert({
      where: { userId: auth.user.id },
      create: {
        userId: auth.user.id,
        aptitudePercentage: aptScore,
        technicalPercentage: scorePercentage,
        projectPercentage: projScore,
        behavioralPercentage: behScore,
        hrPercentage: hrScore,
        overallPercentage: combinedOverall,
        completedRoundsCount: roundScores.length,
      },
      update: {
        technicalPercentage: scorePercentage,
        overallPercentage: combinedOverall,
        completedRoundsCount: roundScores.length,
      },
    });

    return apiSuccess({
      sessionId,
      targetRole: session.targetRole,
      totalQuestions,
      correctCount,
      incorrectCount,
      skippedCount,
      scorePercentage,
      timeSpentSec,
      questions: questionResults,
    });
  } catch (error: any) {
    console.error("Technical submit error:", error);
    return apiError("TECHNICAL_SUBMIT_FAILED", error.message || "Failed to submit technical assessment", 500);
  }
}
