import { prisma } from "./prisma";
import { CURATED_MCQ_BANK, CuratedMcqDefinition } from "../data/curated-mcq-bank";

/**
 * Seed or update the curated question bank into the database.
 * Ensures the database is continuously synced with the reviewed question set.
 */
export async function syncCuratedQuestionBank() {
  for (const q of CURATED_MCQ_BANK) {
    await prisma.curatedMcqQuestion.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        topic: q.topic,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        question: q.question,
        codeSnippet: q.codeSnippet,
        language: q.language,
        languageVersion: q.languageVersion,
        isVersionDependent: q.isVersionDependent,
        versionWarning: q.versionWarning,
        options: JSON.stringify(q.options),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        optionExplanations: JSON.stringify(q.optionExplanations),
        referenceTitle: q.referenceTitle,
        referenceUrl: q.referenceUrl,
        isReviewed: q.isReviewed,
        reviewedBy: q.reviewedBy,
        verifiedAt: new Date(),
        reviewerNotes: q.reviewerNotes,
        status: "ACTIVE",
      },
      update: {
        topic: q.topic,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        question: q.question,
        codeSnippet: q.codeSnippet,
        language: q.language,
        languageVersion: q.languageVersion,
        isVersionDependent: q.isVersionDependent,
        versionWarning: q.versionWarning,
        options: JSON.stringify(q.options),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        optionExplanations: JSON.stringify(q.optionExplanations),
        referenceTitle: q.referenceTitle,
        referenceUrl: q.referenceUrl,
        isReviewed: q.isReviewed,
        reviewedBy: q.reviewedBy,
        reviewerNotes: q.reviewerNotes,
      },
    });
  }
}

/**
 * Shuffle an array in-place using Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface ClientPracticeQuestion {
  id: string;
  topic: string;
  subtopic?: string | null;
  difficulty: string;
  question: string;
  codeSnippet?: string | null;
  language?: string | null;
  languageVersion?: string | null;
  isVersionDependent: boolean;
  versionWarning?: string | null;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  shuffledIndices: number[]; // original indices for [A, B, C, D]
  referenceTitle?: string | null;
  referenceUrl?: string | null;
  isReviewed: boolean;
  reviewedBy?: string | null;
}

/**
 * Start a new practice quiz session with topic, difficulty, and shuffled questions/options
 */
export async function startPracticeSession(params: {
  userId?: string;
  topic: string;
  subtopics?: string[];
  difficulty?: string; // ALL, BEGINNER, INTERMEDIATE, ADVANCED
  questionCount?: number;
  timeLimitMinutes?: number;
}) {
  const {
    userId,
    topic,
    subtopics = [],
    difficulty = "ALL",
    questionCount = 10,
    timeLimitMinutes,
  } = params;

  // Ensure bank is synced
  const existingCount = await prisma.curatedMcqQuestion.count();
  if (existingCount === 0) {
    await syncCuratedQuestionBank();
  }

  // Build query filter
  const where: any = {
    status: "ACTIVE",
  };

  if (topic && topic !== "all") {
    where.topic = topic;
  }

  if (difficulty && difficulty !== "ALL") {
    where.difficulty = difficulty;
  }

  // Fetch candidates from database
  let candidates = await prisma.curatedMcqQuestion.findMany({
    where,
  });

  // Fallback to all active if filtered count is less than requested
  if (candidates.length === 0) {
    candidates = await prisma.curatedMcqQuestion.findMany({
      where: { status: "ACTIVE" },
    });
  }

  // Shuffle questions randomly
  const shuffledQuestions = shuffleArray(candidates).slice(0, Math.min(questionCount, candidates.length));

  // Create session record
  const session = await prisma.practiceQuizSession.create({
    data: {
      userId: userId || null,
      topic,
      subtopics: JSON.stringify(subtopics),
      difficulty,
      totalQuestions: shuffledQuestions.length,
      timeLimitMinutes: timeLimitMinutes || null,
    },
  });

  // Prepare client-safe questions with shuffled options
  const clientQuestions: ClientPracticeQuestion[] = shuffledQuestions.map((q) => {
    const rawOptions: string[] = JSON.parse(q.options || "[]");
    
    // Create mapping [0, 1, 2, 3] and shuffle
    const optionIndices = [0, 1, 2, 3].slice(0, rawOptions.length);
    const shuffledOptionIndices = shuffleArray(optionIndices);

    const letters = ["A", "B", "C", "D"] as const;
    const optionsObj: any = {};

    shuffledOptionIndices.forEach((origIdx, pos) => {
      optionsObj[letters[pos]] = rawOptions[origIdx] || `Option ${letters[pos]}`;
    });

    return {
      id: q.id,
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      question: q.question,
      codeSnippet: q.codeSnippet,
      language: q.language,
      languageVersion: q.languageVersion,
      isVersionDependent: q.isVersionDependent,
      versionWarning: q.versionWarning,
      options: optionsObj,
      shuffledIndices: shuffledOptionIndices,
      referenceTitle: q.referenceTitle,
      referenceUrl: q.referenceUrl,
      isReviewed: q.isReviewed,
      reviewedBy: q.reviewedBy,
    };
  });

  return {
    session,
    questions: clientQuestions,
  };
}

/**
 * Validate and record an individual answer in practice mode
 */
export async function submitPracticeAnswer(params: {
  sessionId: string;
  questionId: string;
  selectedLetter: "A" | "B" | "C" | "D";
  shuffledIndices: number[]; // original indices corresponding to [A, B, C, D]
  timeSpentSec?: number;
  isBookmarked?: boolean;
}) {
  const {
    sessionId,
    questionId,
    selectedLetter,
    shuffledIndices,
    timeSpentSec = 0,
    isBookmarked = false,
  } = params;

  const question = await prisma.curatedMcqQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const letterToPos: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  const chosenPos = letterToPos[selectedLetter] ?? 0;
  const originalChosenIndex = shuffledIndices[chosenPos] ?? chosenPos;
  const isCorrect = originalChosenIndex === question.correctOptionIndex;

  // Record practice answer
  await prisma.practiceAnswer.create({
    data: {
      sessionId,
      questionId,
      selectedOptionIndex: originalChosenIndex,
      isCorrect,
      isBookmarked,
      timeSpentSec,
    },
  });

  // Decode per-option explanations
  let optionExplanations: Record<string, string> = {};
  try {
    optionExplanations = JSON.parse(question.optionExplanations || "{}");
  } catch {
    optionExplanations = {};
  }

  // Map original correct option index back to client letter (A, B, C, D)
  const letters = ["A", "B", "C", "D"] as const;
  const correctPos = shuffledIndices.indexOf(question.correctOptionIndex);
  const correctLetter = correctPos !== -1 ? letters[correctPos] : letters[question.correctOptionIndex];

  return {
    isCorrect,
    correctLetter,
    correctOptionIndex: question.correctOptionIndex,
    explanation: question.explanation,
    optionExplanations,
    referenceTitle: question.referenceTitle,
    referenceUrl: question.referenceUrl,
    languageVersion: question.languageVersion,
    isVersionDependent: question.isVersionDependent,
    versionWarning: question.versionWarning,
    isReviewed: question.isReviewed,
    reviewedBy: question.reviewedBy,
  };
}

/**
 * Complete a practice session, summarize accuracy, and identify Topics to Revisit
 */
export async function completePracticeSession(params: {
  sessionId: string;
  totalTimeSpentSeconds: number;
}) {
  const { sessionId, totalTimeSpentSeconds } = params;

  const session = await prisma.practiceQuizSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Practice session not found");
  }

  const total = session.answers.length || session.totalQuestions;
  const correct = session.answers.filter((a) => a.isCorrect).length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Identify Topics to Revisit:
  // Tally correct vs incorrect by subtopic / topic
  const topicStats: Record<string, { total: number; incorrect: number; title: string }> = {};

  for (const ans of session.answers) {
    const key = ans.question.subtopic || ans.question.topic;
    if (!topicStats[key]) {
      topicStats[key] = { total: 0, incorrect: 0, title: key };
    }
    topicStats[key].total += 1;
    if (!ans.isCorrect) {
      topicStats[key].incorrect += 1;
    }
  }

  const topicsToRevisit: string[] = Object.values(topicStats)
    .filter((s) => s.incorrect > 0 && s.incorrect / s.total >= 0.3) // >= 30% error rate
    .map((s) => s.title);

  // Update session
  const updatedSession = await prisma.practiceQuizSession.update({
    where: { id: sessionId },
    data: {
      correctCount: correct,
      scorePercentage: percentage,
      timeSpentSeconds: totalTimeSpentSeconds,
      topicsToRevisit: JSON.stringify(topicsToRevisit),
      completedAt: new Date(),
    },
  });

  return {
    session: updatedSession,
    totalQuestions: total,
    correctCount: correct,
    scorePercentage: percentage,
    timeSpentSeconds: totalTimeSpentSeconds,
    topicsToRevisit,
  };
}

/**
 * User reporting workflow: Report a flawed or ambiguous question
 */
export async function reportQuestion(params: {
  questionId: string;
  userId?: string;
  userEmail?: string;
  reason: string; // AMBIGUOUS, INCORRECT_KEY, OUTDATED_VERSION, CODE_BUG, POOR_EXPLANATION, OTHER
  userNotes: string;
  suggestedCorrection?: string;
}) {
  const { questionId, userId, userEmail, reason, userNotes, suggestedCorrection } = params;

  const report = await prisma.questionReport.create({
    data: {
      questionId,
      userId: userId || null,
      userEmail: userEmail || null,
      reason,
      userNotes,
      suggestedCorrection: suggestedCorrection || null,
      status: "PENDING_REVIEW",
    },
  });

  // Count reports on this question; if >= 3 reports, flag as UNDER_REVIEW
  const reportCount = await prisma.questionReport.count({
    where: { questionId, status: "PENDING_REVIEW" },
  });

  if (reportCount >= 3) {
    await prisma.curatedMcqQuestion.update({
      where: { id: questionId },
      data: { status: "UNDER_REVIEW" },
    });
  }

  return report;
}

/**
 * Admin workflow: Get all reported questions with review statistics
 */
export async function getAdminQuestionReports() {
  const reports = await prisma.questionReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      question: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const questionStats = {
    totalQuestions: await prisma.curatedMcqQuestion.count(),
    activeQuestions: await prisma.curatedMcqQuestion.count({ where: { status: "ACTIVE" } }),
    underReviewQuestions: await prisma.curatedMcqQuestion.count({ where: { status: "UNDER_REVIEW" } }),
    totalReports: reports.length,
    pendingReports: reports.filter((r) => r.status === "PENDING_REVIEW").length,
    resolvedReports: reports.filter((r) => r.status === "RESOLVED").length,
  };

  return {
    reports,
    stats: questionStats,
  };
}

/**
 * Admin workflow: Edit and correct a question, resolve reports, and reactivate
 */
export async function adminReviewAndCorrectQuestion(params: {
  reportId?: string;
  questionId: string;
  questionText: string;
  codeSnippet?: string;
  languageVersion?: string;
  isVersionDependent?: boolean;
  versionWarning?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  optionExplanations: Record<string, string>;
  referenceTitle?: string;
  referenceUrl?: string;
  status: "ACTIVE" | "UNDER_REVIEW" | "ARCHIVED";
  adminNotes?: string;
  reviewerName: string;
  resolutionAction: "RESOLVED" | "DISMISSED" | "KEEP_PENDING";
}) {
  const {
    reportId,
    questionId,
    questionText,
    codeSnippet,
    languageVersion,
    isVersionDependent,
    versionWarning,
    options,
    correctOptionIndex,
    explanation,
    optionExplanations,
    referenceTitle,
    referenceUrl,
    status,
    adminNotes,
    reviewerName,
    resolutionAction,
  } = params;

  // 1. Update the question
  const updatedQuestion = await prisma.curatedMcqQuestion.update({
    where: { id: questionId },
    data: {
      question: questionText,
      codeSnippet: codeSnippet || null,
      languageVersion: languageVersion || null,
      isVersionDependent: Boolean(isVersionDependent),
      versionWarning: versionWarning || null,
      options: JSON.stringify(options),
      correctOptionIndex,
      explanation,
      optionExplanations: JSON.stringify(optionExplanations),
      referenceTitle: referenceTitle || null,
      referenceUrl: referenceUrl || null,
      status,
      isReviewed: true,
      reviewedBy: reviewerName,
      verifiedAt: new Date(),
      reviewerNotes: adminNotes || "Corrected and verified by administrator.",
    },
  });

  // 2. If a specific report was addressed, update its status
  if (reportId) {
    await prisma.questionReport.update({
      where: { id: reportId },
      data: {
        status: resolutionAction,
        adminNotes,
        reviewedBy: reviewerName,
        resolvedAt: new Date(),
      },
    });
  }

  return updatedQuestion;
}
