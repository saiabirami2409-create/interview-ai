import { prisma } from "./prisma";
import {
  AssessmentResponse,
  AssessmentResultSummary,
  GeneratedQuestion,
  PublicAssessmentQuestion,
  ResultsResponse,
  ReviewResponse,
  DashboardResponse,
  HistoryResponse,
  getPerformanceCategory,
  QuestionCategory,
} from "@/lib/api-schemas";

interface StoredMetadata {
  topics: string[];
  categories: QuestionCategory[];
  deadlineAt: string;
  intermediateCount: number;
  advancedCount: number;
  submissionReason?: string;
  resultSummary?: AssessmentResultSummary;
  aiFeedbackReport?: any;
}

export function parseSessionMetadata(raw: string | null): StoredMetadata {
  if (!raw) {
    return {
      topics: ["General Software Engineering"],
      categories: ["core_concepts"],
      deadlineAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      intermediateCount: 6,
      advancedCount: 4,
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      topics: [raw],
      categories: ["core_concepts"],
      deadlineAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      intermediateCount: 6,
      advancedCount: 4,
    };
  }
}

/**
 * Create a new assessment with server-side deadline and questions
 */
export async function createAssessmentSession(params: {
  userId: string;
  jobRole: string;
  topics: string[];
  questionCount: number;
  durationMinutes: number;
  categories: QuestionCategory[];
  intermediateCount: number;
  advancedCount: number;
  questions: GeneratedQuestion[];
}) {
  const {
    userId,
    jobRole,
    topics,
    questionCount,
    durationMinutes,
    categories,
    intermediateCount,
    advancedCount,
    questions,
  } = params;

  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  const metadata: StoredMetadata = {
    topics,
    categories,
    deadlineAt: deadlineAt.toISOString(),
    intermediateCount,
    advancedCount,
  };

  const title = `InterviewAI — ${jobRole} Technical Assessment`;

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      title,
      targetRole: jobRole,
      companyName: null,
      jobDescription: JSON.stringify(metadata),
      interviewType: "TECHNICAL",
      difficulty: "INTERMEDIATE",
      questionCount: questions.length,
      timeLimitMinutes: durationMinutes,
      status: "IN_PROGRESS",
      startedAt,
      questions: {
        create: questions.map((q, idx) => {
          const criteriaData = {
            isMcq: true,
            options: [q.options.A, q.options.B, q.options.C, q.options.D],
            correctOption: q.correctOption,
            explanation: q.explanation,
            topic: q.topic,
          };

          return {
            orderIndex: idx + 1,
            questionText: q.question,
            category: q.topic || "Core Concepts",
            difficulty: q.difficulty || (idx < intermediateCount ? "Intermediate" : "Advanced"),
            relevantSkills: JSON.stringify([q.topic]),
            expectedCriteria: JSON.stringify(criteriaData),
            hints: q.hint || q.hints || `Focus on ${q.topic} principles and consider edge cases.`,
            options: JSON.stringify(q.options),
            correctOption: q.correctOption,
            explanation: q.explanation,
            topic: q.topic,
          };
        }),
      },
    },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return {
    session,
    deadlineAt: deadlineAt.toISOString(),
  };
}

/**
 * Retrieve an assessment and format public vs private question details
 */
export async function getAssessmentSession(assessmentId: string, userId: string) {
  const session = await prisma.interviewSession.findFirst({
    where: { id: assessmentId, userId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          answer: true,
        },
      },
      report: true,
    },
  });

  if (!session) return null;

  const metadata = parseSessionMetadata(session.jobDescription);
  const isSubmittedOrExpired =
    session.status === "COMPLETED" || session.status === "EXPIRED" || session.status === "SUBMITTED";

  // Check if deadline passed
  const deadline = new Date(metadata.deadlineAt);
  const isPastDeadline = Date.now() > deadline.getTime();

  const publicQuestions: PublicAssessmentQuestion[] = session.questions.map((q) => {
    let options = {
      A: "Option A",
      B: "Option B",
      C: "Option C",
      D: "Option D",
    };
    let topic = q.topic || q.category;
    let difficulty: "Intermediate" | "Advanced" =
      q.difficulty === "Advanced" ? "Advanced" : "Intermediate";

    if (q.options && q.options.startsWith("{")) {
      try {
        const parsed = JSON.parse(q.options);
        if (parsed.A && parsed.B && parsed.C && parsed.D) {
          options = parsed;
        }
      } catch {}
    } else if (q.expectedCriteria && q.expectedCriteria.startsWith("{")) {
      try {
        const parsed = JSON.parse(q.expectedCriteria);
        if (Array.isArray(parsed.options) && parsed.options.length === 4) {
          options = {
            A: parsed.options[0],
            B: parsed.options[1],
            C: parsed.options[2],
            D: parsed.options[3],
          };
        }
        if (parsed.topic) topic = parsed.topic;
      } catch {}
    }

    let selectedOption: "A" | "B" | "C" | "D" | null = null;
    let markedForReview = false;

    if (q.answer?.selectedOption) {
      selectedOption = q.answer.selectedOption as any;
    } else if (q.answer?.answerText) {
      try {
        const parsedAns = JSON.parse(q.answer.answerText);
        if (parsedAns.selectedOption) selectedOption = parsedAns.selectedOption;
        if (parsedAns.markedForReview !== undefined) markedForReview = Boolean(parsedAns.markedForReview);
      } catch {
        const match = q.answer.answerText.match(/^[ABCD]$/i);
        if (match) selectedOption = match[0].toUpperCase() as any;
      }
    }

    return {
      id: q.id,
      questionId: q.id,
      orderIndex: q.orderIndex,
      question: q.questionText,
      questionText: q.questionText,
      topic,
      difficulty,
      category: q.category,
      hints: q.hints || `Focus on ${topic} principles and runtime execution order.`,
      hint: q.hints || `Focus on ${topic} principles and runtime execution order.`,
      options,
      selectedOption,
      markedForReview,
      isAnswerChecked: Boolean(q.answer?.isCorrect !== null && q.answer?.isCorrect !== undefined),
      isCorrect: q.answer?.isCorrect ?? null,
    };
  });

  return {
    assessment: {
      id: session.id,
      status: (isSubmittedOrExpired ? "submitted" : isPastDeadline ? "expired" : "active") as any,
      jobRole: session.targetRole,
      topics: metadata.topics,
      questionCount: session.questionCount,
      durationMinutes: session.timeLimitMinutes,
      startedAt: (session.startedAt || session.createdAt).toISOString(),
      deadlineAt: metadata.deadlineAt,
      completedAt: session.completedAt ? session.completedAt.toISOString() : null,
    },
    questions: publicQuestions,
    metadata,
    rawSession: session,
  };
}

/**
 * Save user answers and review markers during assessment
 */
export async function saveAssessmentAnswers(
  assessmentId: string,
  userId: string,
  answers: Array<{
    questionId: string;
    selectedOption: "A" | "B" | "C" | "D" | null;
    markedForReview?: boolean;
  }>
) {
  const session = await prisma.interviewSession.findFirst({
    where: { id: assessmentId, userId },
  });

  if (!session) return null;
  if (session.status === "COMPLETED" || session.status === "EXPIRED") {
    throw new Error("ASSESSMENT_ALREADY_SUBMITTED");
  }

  let answeredCount = 0;

  for (const ans of answers) {
    const question = await prisma.interviewQuestion.findFirst({
      where: { id: ans.questionId, sessionId: assessmentId },
    });
    if (!question) continue;

    const payload = JSON.stringify({
      selectedOption: ans.selectedOption,
      markedForReview: Boolean(ans.markedForReview),
      savedAt: new Date().toISOString(),
    });

    await prisma.interviewAnswer.upsert({
      where: { questionId: ans.questionId },
      create: {
        questionId: ans.questionId,
        answerText: payload,
        timeSpentSec: 0,
        isSkipped: ans.selectedOption === null,
      },
      update: {
        answerText: payload,
        isSkipped: ans.selectedOption === null,
      },
    });

    if (ans.selectedOption !== null) answeredCount++;
  }

  return {
    saved: true as const,
    savedAt: new Date().toISOString(),
    answeredCount,
  };
}

/**
 * Submit assessment, evaluate answers deterministically, and store report
 */
export async function submitAssessmentSession(
  assessmentId: string,
  userId: string,
  submittedAnswers: Array<{
    questionId: string;
    selectedOption: "A" | "B" | "C" | "D" | null;
  }>,
  submissionReason: "manual" | "timeout" | "session_recovery" = "manual"
) {
  const session = await prisma.interviewSession.findFirst({
    where: { id: assessmentId, userId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: { answer: true },
      },
      report: true,
    },
  });

  if (!session) return null;

  const metadata = parseSessionMetadata(session.jobDescription);

  // If already submitted, return idempotent result
  if (session.status === "COMPLETED" && metadata.resultSummary) {
    return {
      assessmentId,
      status: "submitted" as const,
      submittedAt: (session.completedAt || new Date()).toISOString(),
      result: metadata.resultSummary,
    };
  }

  // Build answer lookup from submitted payload
  const submittedMap = new Map<string, "A" | "B" | "C" | "D" | null>();
  submittedAnswers.forEach((a) => submittedMap.set(a.questionId, a.selectedOption));

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const topicStats = new Map<string, { total: number; correct: number }>();
  const difficultyStats = new Map<string, { total: number; correct: number }>([
    ["Intermediate", { total: 0, correct: 0 }],
    ["Advanced", { total: 0, correct: 0 }],
  ]);

  for (const q of session.questions) {
    let correctOption: "A" | "B" | "C" | "D" = (q.correctOption as any) || "A";
    let explanation = q.explanation || "";
    let topic = q.topic || q.category;
    const diff: "Intermediate" | "Advanced" =
      q.difficulty === "Advanced" ? "Advanced" : "Intermediate";

    if (!q.correctOption && q.expectedCriteria && q.expectedCriteria.startsWith("{")) {
      try {
        const parsed = JSON.parse(q.expectedCriteria);
        if (parsed.correctOption) correctOption = parsed.correctOption;
        if (parsed.explanation) explanation = parsed.explanation;
        if (parsed.topic) topic = parsed.topic;
      } catch {}
    }

    // Determine chosen option
    let chosenOption = submittedMap.get(q.id);
    if (chosenOption === undefined && q.answer?.answerText) {
      try {
        const parsedAns = JSON.parse(q.answer.answerText);
        chosenOption = parsedAns.selectedOption ?? null;
      } catch {}
    }

    const isUnanswered = chosenOption === null || chosenOption === undefined;
    const isCorrect = !isUnanswered && chosenOption === correctOption;

    if (isUnanswered) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    // Update topic breakdown
    const currentTopicStat = topicStats.get(topic) || { total: 0, correct: 0 };
    currentTopicStat.total++;
    if (isCorrect) currentTopicStat.correct++;
    topicStats.set(topic, currentTopicStat);

    // Update difficulty breakdown
    const currentDiffStat = difficultyStats.get(diff)!;
    currentDiffStat.total++;
    if (isCorrect) currentDiffStat.correct++;

    // Persist final answer and evaluation
    const answerTextPayload = JSON.stringify({
      selectedOption: chosenOption || null,
      correctOption,
      isCorrect,
      explanation,
    });

    const answer = await prisma.interviewAnswer.upsert({
      where: { questionId: q.id },
      create: {
        questionId: q.id,
        answerText: answerTextPayload,
        timeSpentSec: 0,
        isSkipped: isUnanswered,
      },
      update: {
        answerText: answerTextPayload,
        isSkipped: isUnanswered,
      },
    });

    // Score: 100 for correct, 0 for incorrect/unanswered
    const qScore = isCorrect ? 100 : 0;
    await prisma.answerEvaluation.upsert({
      where: { answerId: answer.id },
      create: {
        answerId: answer.id,
        relevanceScore: qScore,
        technicalScore: qScore,
        completenessScore: qScore,
        communicationScore: qScore,
        reasoningScore: qScore,
        overallScore: qScore,
        strengths: JSON.stringify(isCorrect ? ["Selected optimal technical approach"] : []),
        weaknesses: JSON.stringify(!isCorrect ? ["Incorrect option selection"] : []),
        missingConcepts: JSON.stringify([]),
        improvementSuggestions: JSON.stringify([explanation]),
        modelAnswerOutline: `Correct Option: ${correctOption}. ${explanation}`,
        recommendedTopics: JSON.stringify([topic]),
      },
      update: {
        relevanceScore: qScore,
        technicalScore: qScore,
        completenessScore: qScore,
        communicationScore: qScore,
        reasoningScore: qScore,
        overallScore: qScore,
        strengths: JSON.stringify(isCorrect ? ["Selected optimal technical approach"] : []),
        weaknesses: JSON.stringify(!isCorrect ? ["Incorrect option selection"] : []),
        improvementSuggestions: JSON.stringify([explanation]),
        modelAnswerOutline: `Correct Option: ${correctOption}. ${explanation}`,
      },
    });
  }

  const totalQuestions = session.questions.length;
  const score = correctCount; // 1 mark per question
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const attempted = correctCount + incorrectCount;
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;

  const startedTime = session.startedAt ? session.startedAt.getTime() : session.createdAt.getTime();
  const timeTakenSeconds = Math.min(
    Math.max(Math.round((Date.now() - startedTime) / 1000), 1),
    session.timeLimitMinutes * 60
  );

  const category = getPerformanceCategory(percentage);

  const resultSummary: AssessmentResultSummary = {
    assessmentId,
    totalQuestions,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unansweredQuestions: unansweredCount,
    score,
    percentage,
    accuracy,
    timeTakenSeconds,
    category,
  };

  const completedAt = new Date();
  const isExpired = submissionReason === "timeout";
  const finalStatus = isExpired ? "EXPIRED" : "COMPLETED";

  metadata.resultSummary = resultSummary;
  metadata.submissionReason = submissionReason;

  // Save session status & updated metadata
  await prisma.interviewSession.update({
    where: { id: assessmentId },
    data: {
      status: finalStatus,
      completedAt,
      jobDescription: JSON.stringify(metadata),
    },
  });

  // Persist InterviewReport
  const topStrengths: string[] = [];
  const criticalWeaknesses: string[] = [];

  topicStats.forEach((val, tName) => {
    const pct = Math.round((val.correct / val.total) * 100);
    if (pct >= 70) {
      topStrengths.push(`${tName} (${pct}% Mastery)`);
    } else {
      criticalWeaknesses.push(`${tName} (${pct}% Accuracy)`);
    }
  });

  const readinessSummary = `Candidate scored ${score}/${totalQuestions} (${percentage}%) on the ${session.targetRole} assessment under timed conditions.`;

  await prisma.interviewReport.upsert({
    where: { sessionId: assessmentId },
    create: {
      sessionId: assessmentId,
      overallScore: percentage,
      technicalScore: percentage,
      communicationScore: 100,
      relevanceScore: accuracy,
      completenessScore: Math.round((attempted / totalQuestions) * 100),
      readinessLevel: category.replace("_", " ").toUpperCase(),
      readinessSummary,
      topStrengths: JSON.stringify(topStrengths.slice(0, 3)),
      criticalWeaknesses: JSON.stringify(criticalWeaknesses.slice(0, 3)),
      keyRecommendations: JSON.stringify(
        criticalWeaknesses.length > 0
          ? [`Drill practice questions in ${criticalWeaknesses[0]}`]
          : ["Maintain high proficiency with advanced architecture questions."]
      ),
      suggestedNextRole: session.targetRole,
    },
    update: {
      overallScore: percentage,
      technicalScore: percentage,
      communicationScore: 100,
      relevanceScore: accuracy,
      completenessScore: Math.round((attempted / totalQuestions) * 100),
      readinessLevel: category.replace("_", " ").toUpperCase(),
      readinessSummary,
      topStrengths: JSON.stringify(topStrengths.slice(0, 3)),
      criticalWeaknesses: JSON.stringify(criticalWeaknesses.slice(0, 3)),
    },
  });

  // Update TopicProgress records
  for (const [topicName, val] of topicStats.entries()) {
    try {
      let prepTopic = await prisma.preparationTopic.findUnique({
        where: { title: topicName },
      });
      if (!prepTopic) {
        prepTopic = await prisma.preparationTopic.create({
          data: {
            title: topicName,
            category: "Core Technical",
            description: `Assessment topic for ${session.targetRole}`,
            difficulty: "INTERMEDIATE",
            keyPoints: JSON.stringify(["Core Concepts", "Best Practices"]),
          },
        });
      }

      const mastery = Math.round((val.correct / val.total) * 100);
      const priority = mastery < 60 ? "HIGH" : mastery < 80 ? "MEDIUM" : "LOW";

      await prisma.topicProgress.upsert({
        where: {
          userId_topicId: {
            userId,
            topicId: prepTopic.id,
          },
        },
        create: {
          userId,
          topicId: prepTopic.id,
          mastery,
          sessionsHad: 1,
          priority,
        },
        update: {
          mastery,
          sessionsHad: { increment: 1 },
          priority,
        },
      });
    } catch (e) {
      console.warn("TopicProgress update warning:", e);
    }
  }

  return {
    assessmentId,
    status: (isExpired ? "expired" : "submitted") as "submitted" | "expired",
    submittedAt: completedAt.toISOString(),
    result: resultSummary,
  };
}

/**
 * Get assessment results summary with topic and difficulty breakdowns
 */
export async function getAssessmentResults(assessmentId: string, userId: string): Promise<ResultsResponse | null> {
  const session = await prisma.interviewSession.findFirst({
    where: { id: assessmentId, userId },
    include: {
      questions: {
        include: { answer: true },
      },
      report: true,
    },
  });

  if (!session) return null;

  const metadata = parseSessionMetadata(session.jobDescription);
  let summary = metadata.resultSummary;

  // Calculate if missing
  if (!summary) {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    session.questions.forEach((q) => {
      let correctOpt = "A";
      if (q.expectedCriteria && q.expectedCriteria.startsWith("{")) {
        try {
          correctOpt = JSON.parse(q.expectedCriteria).correctOption || "A";
        } catch {}
      }
      let selected: string | null = null;
      if (q.answer?.answerText) {
        try {
          selected = JSON.parse(q.answer.answerText).selectedOption || null;
        } catch {}
      }

      if (selected === null) unanswered++;
      else if (selected === correctOpt) correct++;
      else incorrect++;
    });

    const total = session.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

    summary = {
      assessmentId,
      totalQuestions: total,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      unansweredQuestions: unanswered,
      score: correct,
      percentage,
      accuracy,
      timeTakenSeconds: session.timeLimitMinutes * 60,
      category: getPerformanceCategory(percentage),
    };
  }

  // Topic breakdown
  const topicMap = new Map<string, { total: number; correct: number }>();
  const diffMap = new Map<"Intermediate" | "Advanced", { total: number; correct: number }>([
    ["Intermediate", { total: 0, correct: 0 }],
    ["Advanced", { total: 0, correct: 0 }],
  ]);

  session.questions.forEach((q) => {
    let correctOpt = "A";
    let topic = q.category;
    if (q.expectedCriteria && q.expectedCriteria.startsWith("{")) {
      try {
        const parsed = JSON.parse(q.expectedCriteria);
        if (parsed.correctOption) correctOpt = parsed.correctOption;
        if (parsed.topic) topic = parsed.topic;
      } catch {}
    }

    let selected: string | null = null;
    if (q.answer?.answerText) {
      try {
        selected = JSON.parse(q.answer.answerText).selectedOption || null;
      } catch {}
    }

    const isCorrect = selected === correctOpt;

    const t = topicMap.get(topic) || { total: 0, correct: 0 };
    t.total++;
    if (isCorrect) t.correct++;
    topicMap.set(topic, t);

    const diff: "Intermediate" | "Advanced" =
      q.difficulty === "Advanced" ? "Advanced" : "Intermediate";
    const d = diffMap.get(diff)!;
    d.total++;
    if (isCorrect) d.correct++;
  });

  const topicPerformance = Array.from(topicMap.entries()).map(([tName, val]) => ({
    topic: tName,
    total: val.total,
    correct: val.correct,
    percentage: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
  }));

  const difficultyPerformance: Array<{
    difficulty: "Intermediate" | "Advanced";
    total: number;
    correct: number;
    percentage: number;
  }> = [
    {
      difficulty: "Intermediate",
      total: diffMap.get("Intermediate")!.total,
      correct: diffMap.get("Intermediate")!.correct,
      percentage:
        diffMap.get("Intermediate")!.total > 0
          ? Math.round(
              (diffMap.get("Intermediate")!.correct / diffMap.get("Intermediate")!.total) * 100
            )
          : 0,
    },
    {
      difficulty: "Advanced",
      total: diffMap.get("Advanced")!.total,
      correct: diffMap.get("Advanced")!.correct,
      percentage:
        diffMap.get("Advanced")!.total > 0
          ? Math.round(
              (diffMap.get("Advanced")!.correct / diffMap.get("Advanced")!.total) * 100
            )
          : 0,
    },
  ];

  return {
    assessment: {
      id: session.id,
      jobRole: session.targetRole,
      topics: metadata.topics,
      submittedAt: (session.completedAt || session.updatedAt).toISOString(),
      status: (session.status === "EXPIRED" ? "expired" : "submitted") as "submitted" | "expired",
    },
    result: summary,
    topicPerformance,
    difficultyPerformance,
  };
}

/**
 * Get question-by-question review with correct options and explanations
 */
export async function getAssessmentReview(assessmentId: string, userId: string): Promise<ReviewResponse | null> {
  const session = await prisma.interviewSession.findFirst({
    where: { id: assessmentId, userId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: { answer: true },
      },
    },
  });

  if (!session) return null;

  const questions = session.questions.map((q) => {
    let options = {
      A: "Option A",
      B: "Option B",
      C: "Option C",
      D: "Option D",
    };
    let correctOption: "A" | "B" | "C" | "D" = "A";
    let explanation = "Detailed technical explanation.";
    let topic = q.category;

    if (q.expectedCriteria && q.expectedCriteria.startsWith("{")) {
      try {
        const parsed = JSON.parse(q.expectedCriteria);
        if (Array.isArray(parsed.options) && parsed.options.length === 4) {
          options = {
            A: parsed.options[0],
            B: parsed.options[1],
            C: parsed.options[2],
            D: parsed.options[3],
          };
        }
        if (parsed.correctOption) correctOption = parsed.correctOption;
        if (parsed.explanation) explanation = parsed.explanation;
        if (parsed.topic) topic = parsed.topic;
      } catch {}
    }

    let selectedOption: "A" | "B" | "C" | "D" | null = null;
    if (q.answer?.answerText) {
      try {
        const parsedAns = JSON.parse(q.answer.answerText);
        selectedOption = parsedAns.selectedOption ?? null;
      } catch {}
    }

    const isCorrect = selectedOption === correctOption;

    return {
      questionId: q.id,
      question: q.questionText,
      options,
      selectedOption,
      correctOption,
      explanation,
      difficulty: (q.difficulty === "Advanced" ? "Advanced" : "Intermediate") as "Intermediate" | "Advanced",
      topic,
      isCorrect,
    };
  });

  return {
    assessmentId,
    questions,
  };
}

/**
 * Get dashboard statistics, recent assessments, and topic mastery based strictly on real DB records
 */
export async function getDashboardData(userId: string): Promise<DashboardResponse> {
  const completedSessions = await prisma.interviewSession.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "SUBMITTED", "EXPIRED"] },
    },
    orderBy: { completedAt: "desc" },
    include: {
      report: true,
      questions: {
        include: { answer: true },
      },
    },
  });

  const totalInterviews = completedSessions.length;

  if (totalInterviews === 0) {
    return {
      stats: {
        totalInterviews: 0,
        averageScore: null,
        questionsPracticed: 0,
        strongestSkill: null,
      },
      recentAssessments: [],
      topicProgress: [],
    };
  }

  let totalScorePercentage = 0;
  let questionsPracticed = 0;
  const topicSkillScores = new Map<string, { total: number; correct: number }>();

  const recentAssessments = completedSessions.slice(0, 5).map((s) => {
    const meta = parseSessionMetadata(s.jobDescription);
    const score = meta.resultSummary?.score ?? s.report?.overallScore ?? 0;
    const percentage = meta.resultSummary?.percentage ?? s.report?.overallScore ?? 0;

    return {
      id: s.id,
      jobRole: s.targetRole,
      score,
      percentage,
      completedAt: (s.completedAt || s.createdAt).toISOString(),
    };
  });

  completedSessions.forEach((s) => {
    const meta = parseSessionMetadata(s.jobDescription);
    const percentage = meta.resultSummary?.percentage ?? s.report?.overallScore ?? 0;
    totalScorePercentage += percentage;

    s.questions.forEach((q) => {
      if (q.answer && !q.answer.isSkipped) {
        questionsPracticed++;
      }

      let correctOpt = "A";
      let topic = q.category;
      if (q.expectedCriteria && q.expectedCriteria.startsWith("{")) {
        try {
          const parsed = JSON.parse(q.expectedCriteria);
          if (parsed.correctOption) correctOpt = parsed.correctOption;
          if (parsed.topic) topic = parsed.topic;
        } catch {}
      }

      let selected: string | null = null;
      if (q.answer?.answerText) {
        try {
          selected = JSON.parse(q.answer.answerText).selectedOption || null;
        } catch {}
      }

      const stat = topicSkillScores.get(topic) || { total: 0, correct: 0 };
      stat.total++;
      if (selected === correctOpt) stat.correct++;
      topicSkillScores.set(topic, stat);
    });
  });

  const averageScore = Math.round(totalScorePercentage / totalInterviews);

  // Find strongest skill
  let strongestSkill: string | null = null;
  let highestPct = -1;

  const topicProgress = Array.from(topicSkillScores.entries()).map(([topic, stat]) => {
    const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    if (pct > highestPct && stat.total >= 2) {
      highestPct = pct;
      strongestSkill = topic;
    }
    return {
      topic,
      attempted: stat.total,
      correct: stat.correct,
      percentage: pct,
    };
  });

  if (!strongestSkill && topicProgress.length > 0) {
    strongestSkill = topicProgress[0].topic;
  }

  return {
    stats: {
      totalInterviews,
      averageScore,
      questionsPracticed,
      strongestSkill,
    },
    recentAssessments,
    topicProgress: topicProgress.sort((a, b) => b.percentage - a.percentage),
  };
}

/**
 * Get paginated history of assessments with filters
 */
export async function getAssessmentHistory(params: {
  userId: string;
  page?: number;
  pageSize?: number;
  jobRole?: string;
  topic?: string;
  from?: string;
  to?: string;
  sort?: "completedAt_desc" | "completedAt_asc" | "score_desc" | "score_asc";
}): Promise<HistoryResponse> {
  const {
    userId,
    page = 1,
    pageSize = 10,
    jobRole,
    topic,
    from,
    to,
    sort = "completedAt_desc",
  } = params;

  const whereClause: any = {
    userId,
    status: { in: ["COMPLETED", "SUBMITTED", "EXPIRED"] },
  };

  if (jobRole) {
    whereClause.targetRole = { contains: jobRole };
  }

  if (from || to) {
    whereClause.completedAt = {};
    if (from) whereClause.completedAt.gte = new Date(from);
    if (to) whereClause.completedAt.lte = new Date(to);
  }

  const orderByClause: any = {};
  if (sort === "completedAt_asc") {
    orderByClause.completedAt = "asc";
  } else if (sort === "completedAt_desc") {
    orderByClause.completedAt = "desc";
  } else {
    orderByClause.completedAt = "desc";
  }

  const [totalItems, sessions] = await Promise.all([
    prisma.interviewSession.count({ where: whereClause }),
    prisma.interviewSession.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        report: true,
      },
    }),
  ]);

  const items = sessions.map((s) => {
    const meta = parseSessionMetadata(s.jobDescription);
    const score = meta.resultSummary?.score ?? s.report?.overallScore ?? 0;
    const percentage = meta.resultSummary?.percentage ?? s.report?.overallScore ?? 0;

    return {
      id: s.id,
      jobRole: s.targetRole,
      topics: meta.topics,
      questionCount: s.questionCount,
      score,
      percentage,
      durationMinutes: s.timeLimitMinutes,
      completedAt: (s.completedAt || s.createdAt).toISOString(),
      status: (s.status === "EXPIRED" ? "expired" : "submitted") as "submitted" | "expired",
    };
  });

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize) || 1,
    },
  };
}
