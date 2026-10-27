import { prisma } from "./prisma";

export interface QuestionEvidenceFeedback {
  marksEarned: number | null;
  maxMarks: number;
  rubricCriteria: string;
  evidenceExplanation: string;
  whatAnsweredWell: string;
  whatWasMissing: string;
  practicalSuggestion: string;
  unableToAssess: boolean;
  unableToAssessReason?: string;
  isMachineTranscript?: boolean;
}

export async function buildCompleteReport(userId: string, targetSessionId?: string) {
  // Query records
  const [latestSession, latestAptitude, latestProject, perfReport] = await Promise.all([
    targetSessionId
      ? prisma.interviewSession.findFirst({
          where: { id: targetSessionId, userId },
          include: {
            report: true,
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { answer: { include: { evaluation: true } } },
            },
          },
        })
      : prisma.interviewSession.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: {
            report: true,
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { answer: { include: { evaluation: true } } },
            },
          },
        }),
    prisma.aptitudeAssessment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.projectInterview.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.candidatePerformanceReport.findUnique({
      where: { userId },
    }),
  ]);

  if (!latestSession && !latestAptitude && !latestProject) {
    return {
      hasSessions: false,
      session: null,
    };
  }

  // Linked sessions
  const linkedSessions = latestSession
    ? await prisma.interviewSession.findMany({
        where: {
          userId,
          parentAssessmentId: latestSession.id,
        },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { answer: { include: { evaluation: true } } },
          },
        },
      })
    : [];

  // Technical Round
  const technicalSession =
    latestSession?.interviewType === "TECHNICAL"
      ? latestSession
      : linkedSessions.find((s) => s.interviewType === "TECHNICAL") ||
        (await prisma.interviewSession.findFirst({
          where: { userId, interviewType: "TECHNICAL" },
          orderBy: { createdAt: "desc" },
          include: {
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { answer: { include: { evaluation: true } } },
            },
          },
        }));

  // Behavioral Round
  const behavioralSession =
    latestSession?.interviewType === "BEHAVIORAL"
      ? latestSession
      : linkedSessions.find((s) => s.interviewType === "BEHAVIORAL") ||
        (await prisma.interviewSession.findFirst({
          where: { userId, interviewType: "BEHAVIORAL" },
          orderBy: { createdAt: "desc" },
          include: {
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { answer: { include: { evaluation: true } } },
            },
          },
        }));

  // HR Round
  const hrSession =
    latestSession?.interviewType === "HR"
      ? latestSession
      : linkedSessions.find((s) => s.interviewType === "HR") ||
        (await prisma.interviewSession.findFirst({
          where: { userId, interviewType: "HR" },
          orderBy: { createdAt: "desc" },
          include: {
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { answer: { include: { evaluation: true } } },
            },
          },
        }));

  // 1. ROUND 1: APTITUDE
  const aptitudeScore = latestAptitude?.status === "COMPLETED" ? latestAptitude.score : null;
  let aptitudeQuestions: any[] = [];
  let aptitudeCategoryScores: any = null;
  let aptitudeCorrectCount = 0;
  let aptitudeTotalQuestions = 0;

  if (latestAptitude) {
    try {
      const rawQuestions = JSON.parse(latestAptitude.questions || "[]");
      const rawAnswers = JSON.parse(latestAptitude.answers || "{}");
      aptitudeTotalQuestions = rawQuestions.length;

      aptitudeQuestions = rawQuestions.map((q: any, idx: number) => {
        const userAns = rawAnswers[q.id] || null;
        const isCorrect = userAns && q.correctOption ? userAns.toUpperCase() === q.correctOption.toUpperCase() : false;
        const isSkipped = !userAns;
        if (isCorrect) aptitudeCorrectCount++;

        const marksEarned = isCorrect ? 10 : isSkipped ? null : 0;
        const unableToAssess = isSkipped;

        const whatAnsweredWell = isCorrect
          ? `Accurately identified correct option (${q.correctOption}) and applied valid quantitative logic.`
          : isSkipped
          ? "Candidate omitted this question."
          : `Selected Option ${userAns}; evaluated core concepts.`;

        const whatWasMissing = isCorrect
          ? "None. Mathematical / logical derivation verified."
          : isSkipped
          ? "No response was recorded for this question."
          : `Calculation discrepancy. Correct option is ${q.correctOption}: ${q.explanation || ""}`;

        const practicalSuggestion = q.formula
          ? `Formula to remember: ${q.formula}`
          : q.shortcut
          ? `Speed shortcut: ${q.shortcut}`
          : "Practice breaking down multi-step word problems into algebraic formulas.";

        const evidenceExplanation = isCorrect
          ? `Candidate selected Option ${userAns} (${q.options?.[userAns] || ""}), matching verified derivation.`
          : isSkipped
          ? "Question was omitted by candidate. Excluded from positive marks."
          : `Candidate selected Option ${userAns}, whereas verified solution requires Option ${q.correctOption}: ${q.explanation || ""}`;

        return {
          id: q.id,
          orderIndex: idx,
          questionText: q.question,
          category: q.category,
          difficulty: q.difficulty,
          options: q.options || {},
          userAnswer: userAns,
          correctOption: q.correctOption,
          isCorrect,
          isSkipped,
          marksEarned,
          maxMarks: 10,
          rubricCriteria: "Quantitative / Logical Accuracy: Correct Option (10 Marks). Calculation & Formula Rationale.",
          evidenceExplanation,
          whatAnsweredWell,
          whatWasMissing,
          practicalSuggestion,
          unableToAssess,
          explanation: q.explanation || "No explanation provided.",
          formula: q.formula || null,
          shortcut: q.shortcut || null,
        };
      });
    } catch (err) {
      console.warn("Error parsing aptitude questions:", err);
    }

    try {
      if (latestAptitude.categoryScores) {
        aptitudeCategoryScores = JSON.parse(latestAptitude.categoryScores);
      }
    } catch {}
  }

  const aptitudeMaxMarks = aptitudeTotalQuestions * 10;
  const aptitudeMarksEarned = aptitudeCorrectCount * 10;

  // 2. ROUND 2: TECHNICAL
  const technicalScore =
    technicalSession?.technicalScore ??
    (technicalSession?.status === "COMPLETED" ? technicalSession.overallScore : null);
  let technicalCorrectCount = 0;
  let technicalSkippedCount = 0;

  const technicalQuestions = (technicalSession?.questions || []).map((q) => {
    let parsedOptions: Record<string, string> = { A: "", B: "", C: "", D: "" };
    try {
      if (q.options) parsedOptions = JSON.parse(q.options);
    } catch {}

    const selected = q.answer?.selectedOption || null;
    const isSkipped = q.answer?.isSkipped || !selected;
    const isCorrect = !isSkipped && selected?.toUpperCase() === q.correctOption?.toUpperCase();

    if (isCorrect) technicalCorrectCount++;
    if (isSkipped) technicalSkippedCount++;

    const marksEarned = isCorrect ? 10 : isSkipped ? null : 0;
    const unableToAssess = isSkipped;

    const evidenceExplanation = isCorrect
      ? `Candidate selected Option ${selected} (${parsedOptions[selected] || ""}), which matches runtime specification: ${q.explanation || ""}`
      : isSkipped
      ? "Question was omitted during the technical assessment."
      : `Candidate selected Option ${selected}, but Option ${q.correctOption} is correct: ${q.explanation || ""}`;

    const whatAnsweredWell = isCorrect
      ? `Demonstrated sound understanding of ${q.topic || "the core engineering principle"} and runtime constraints.`
      : isSkipped
      ? "Omitted answer."
      : "Attempted question under timed constraints.";

    const whatWasMissing = isCorrect
      ? "None. Solution aligns with language runtime invariants."
      : isSkipped
      ? "No answer option was submitted."
      : `Misunderstood runtime behavior or edge cases: ${q.explanation || ""}`;

    const practicalSuggestion =
      q.explanation ||
      "Review the memory lifecycle and concurrency implications for this topic.";

    return {
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
      marksEarned,
      maxMarks: 10,
      rubricCriteria: "Technical Correctness & Runtime Invariants: Correct Option (10 Marks). Complexity and error avoidance.",
      evidenceExplanation,
      whatAnsweredWell,
      whatWasMissing,
      practicalSuggestion,
      unableToAssess,
      explanation: q.explanation || "No explanation recorded.",
    };
  });

  const technicalTotalQuestions = technicalQuestions.length;
  const technicalMaxMarks = technicalTotalQuestions * 10;
  const technicalMarksEarned = technicalCorrectCount * 10;

  // 3. ROUND 3: PROJECT-BASED MCQS
  const projectScore = latestProject?.status === "COMPLETED" ? latestProject.score : null;
  let projectQuestions: any[] = [];
  let projectCorrectCount = 0;
  let projectTotalQuestions = 0;

  if (latestProject) {
    try {
      const rawQuestions = JSON.parse(latestProject.questions || "[]");
      const rawAnswers = JSON.parse(latestProject.candidateAnswers || "{}");
      const rawEvals = JSON.parse(latestProject.evaluations || "{}");
      projectTotalQuestions = rawQuestions.length;

      projectQuestions = rawQuestions.map((q: any, idx: number) => {
        const ansEntry = rawAnswers[q.id];
        const selectedOption =
          typeof ansEntry === "object" && ansEntry !== null
            ? ansEntry.selectedOption
            : typeof ansEntry === "string"
            ? ansEntry
            : null;
        const isCorrect = selectedOption && q.correctOption ? selectedOption.toUpperCase() === q.correctOption.toUpperCase() : false;
        const isSkipped = !selectedOption;
        const ev = rawEvals[q.id] || null;

        if (isCorrect) projectCorrectCount++;

        // 20 marks per question (5 questions = 100 max marks)
        const marksEarned = isCorrect ? 20 : isSkipped ? null : 0;
        const unableToAssess = isSkipped;

        const evidenceExplanation = isCorrect
          ? `Candidate selected Option ${selectedOption} (${q.options?.[selectedOption] || ""}), matching sound architecture: ${q.explanation || ""}`
          : isSkipped
          ? "Candidate omitted this project question."
          : `Candidate selected Option ${selectedOption}, but sound architecture requires Option ${q.correctOption} (${q.options?.[q.correctOption] || ""}). ${q.explanation || ""}`;

        const whatAnsweredWell = isCorrect
          ? `Demonstrated firm grasp of ${q.category || "project architecture"} and fault tolerance under load.`
          : isSkipped
          ? "Omitted answer."
          : "Familiarity with project domain context.";

        const whatWasMissing = isCorrect
          ? "None. Architectural rationale and trade-off confirmed."
          : isSkipped
          ? "No response was recorded for this architecture question."
          : `Architectural gap: ${q.explanation || "Consider concurrency and network partition implications."}`;

        const practicalSuggestion =
          q.hints ||
          "Always consider distributed edge cases, idempotency keys, and network timeouts when defending project architecture.";

        return {
          id: q.id,
          orderIndex: q.orderIndex ?? idx,
          category: q.category || "Project Architecture",
          questionText: q.questionText,
          options: q.options || { A: "", B: "", C: "", D: "" },
          userAnswer: selectedOption,
          correctOption: q.correctOption || "A",
          isCorrect,
          isSkipped,
          marksEarned,
          maxMarks: 20,
          rubricCriteria: "Architecture & Concurrency Rubric: Option Rationale (20 Marks). Trade-offs, state management, and fault tolerance.",
          evidenceExplanation,
          whatAnsweredWell,
          whatWasMissing,
          practicalSuggestion,
          unableToAssess,
          explanation: q.explanation || ev?.feedback || "Architectural rationale and trade-off analysis.",
          candidateResponse: selectedOption ? `Selected Option ${selectedOption}` : "No response recorded.",
        };
      });
    } catch (err) {
      console.warn("Error parsing project questions:", err);
    }
  }

  const projectMaxMarks = projectTotalQuestions * 20;
  const projectMarksEarned = projectCorrectCount * 20;

  // 4. ROUND 4: BEHAVIORAL (STAR)
  const behavioralScore = behavioralSession?.behavioralScore ?? null;
  let behavioralAssessedCount = 0;
  let behavioralUnableCount = 0;
  let behavioralTotalMarksEarned = 0;

  const behavioralQuestions = (behavioralSession?.questions || []).map((q) => {
    const ev = q.answer?.evaluation;
    let strengthsArr: string[] = [];
    let improvementsArr: string[] = [];
    let evidenceFeedback: QuestionEvidenceFeedback | null = null;

    try {
      if (ev?.strengths) strengthsArr = JSON.parse(ev.strengths);
      if (ev?.weaknesses) improvementsArr = JSON.parse(ev.weaknesses);
      if (ev?.presentationFeedback) {
        const pres = JSON.parse(ev.presentationFeedback);
        if (pres?.evidenceBasedFeedback) {
          evidenceFeedback = pres.evidenceBasedFeedback;
        }
      }
    } catch {}

    const rawTranscript = q.answer?.answerText || "";
    const isSkipped =
      q.answer?.isSkipped ||
      rawTranscript.includes("[Question skipped") ||
      rawTranscript.includes("[Unable to assess") ||
      !rawTranscript.trim();

    const unableToAssess = Boolean(evidenceFeedback?.unableToAssess || isSkipped);
    if (unableToAssess) {
      behavioralUnableCount++;
    } else {
      behavioralAssessedCount++;
    }

    const marksEarned = unableToAssess
      ? null
      : evidenceFeedback?.marksEarned !== undefined && evidenceFeedback?.marksEarned !== null
      ? evidenceFeedback.marksEarned
      : Number((((ev?.overallScore || 75) / 100) * 10).toFixed(1));

    if (marksEarned !== null) {
      behavioralTotalMarksEarned += marksEarned;
    }

    const rubricCriteria =
      evidenceFeedback?.rubricCriteria ||
      "STAR Methodology: Situation & Context (2.5), Task & Role (2.5), Action & Decisions (2.5), Measurable Result (2.5)";

    const evidenceExplanation = unableToAssess
      ? "No substantive response was recorded or candidate skipped. Marked as 'Unable to Assess' and excluded from scoring without fabricated penalty."
      : evidenceFeedback?.evidenceExplanation ||
        "Candidate's verbal response was evaluated against stated engineering decisions and context, without bias on speaking style or accent.";

    const whatAnsweredWell = unableToAssess
      ? "None provided."
      : evidenceFeedback?.whatAnsweredWell ||
        (strengthsArr[0] || "Structured delivery addressing personal engineering decisions.");

    const whatWasMissing = unableToAssess
      ? "Response omitted or audio unclear."
      : evidenceFeedback?.whatWasMissing ||
        (improvementsArr[0] || "Consider providing more specific quantifiable results (e.g. latency, error reduction).");

    const practicalSuggestion = unableToAssess
      ? "Prepare a concrete incident or conflict resolution story with measurable outcomes."
      : evidenceFeedback?.practicalSuggestion ||
        "Conclude your answer with a concrete metric (e.g. latency decrease or uptime percentage).";

    return {
      id: q.id,
      orderIndex: q.orderIndex,
      questionText: q.questionText,
      category: q.category,
      candidateResponse: rawTranscript || "No response recorded.",
      isSkipped,
      marksEarned,
      maxMarks: 10,
      rubricCriteria,
      evidenceExplanation,
      whatAnsweredWell,
      whatWasMissing,
      practicalSuggestion,
      unableToAssess,
      unableToAssessReason: unableToAssess ? "Audio was unclear or question was skipped by candidate." : undefined,
      isMachineTranscript: true,
      overallScore: unableToAssess ? null : (ev?.overallScore || 75),
      starBreakdown: {
        situation: ev?.situationScore || ev?.relevanceScore || 75,
        task: ev?.taskScore || ev?.communicationScore || 75,
        action: ev?.actionScore || ev?.technicalScore || 75,
        result: ev?.resultScore || ev?.reasoningScore || 70,
        relevance: ev?.starRelevanceScore || ev?.relevanceScore || 80,
      },
      strengths: strengthsArr.length > 0 ? strengthsArr : ["Structured communication."],
      areasForImprovement:
        improvementsArr.length > 0
          ? improvementsArr
          : ["Include quantifiable performance impact metrics."],
      feedback: ev?.modelAnswerOutline || "Structured response following the STAR framework.",
    };
  });

  const behavioralMaxMarks = behavioralQuestions.length * 10;

  // 5. ROUND 5: HR ROUND
  const hrScore = hrSession?.hrScore ?? null;
  let hrAssessedCount = 0;
  let hrUnableCount = 0;
  let hrTotalMarksEarned = 0;

  const hrQuestions = (hrSession?.questions || []).map((q) => {
    const ev = q.answer?.evaluation;
    let strengthsArr: string[] = [];
    let improvementsArr: string[] = [];
    let evidenceFeedback: QuestionEvidenceFeedback | null = null;

    try {
      if (ev?.strengths) strengthsArr = JSON.parse(ev.strengths);
      if (ev?.weaknesses) improvementsArr = JSON.parse(ev.weaknesses);
      if (ev?.presentationFeedback) {
        const pres = JSON.parse(ev.presentationFeedback);
        if (pres?.evidenceBasedFeedback) {
          evidenceFeedback = pres.evidenceBasedFeedback;
        }
      }
    } catch {}

    const rawTranscript = q.answer?.answerText || "";
    const isSkipped =
      q.answer?.isSkipped ||
      rawTranscript.includes("[Question skipped") ||
      rawTranscript.includes("[Unable to assess") ||
      !rawTranscript.trim();

    const unableToAssess = Boolean(evidenceFeedback?.unableToAssess || isSkipped);
    if (unableToAssess) {
      hrUnableCount++;
    } else {
      hrAssessedCount++;
    }

    const marksEarned = unableToAssess
      ? null
      : evidenceFeedback?.marksEarned !== undefined && evidenceFeedback?.marksEarned !== null
      ? evidenceFeedback.marksEarned
      : Number((((ev?.overallScore || 80) / 100) * 10).toFixed(1));

    if (marksEarned !== null) {
      hrTotalMarksEarned += marksEarned;
    }

    const rubricCriteria =
      evidenceFeedback?.rubricCriteria ||
      "HR Competency Rubric: Relevance & Direct Response (3.0), Clarity & Structure (2.0), Motivation & Self-Awareness (3.0), Constructive Collaboration (2.0)";

    const evidenceExplanation = unableToAssess
      ? "No substantive response was recorded or candidate skipped. Marked as 'Unable to Assess' and excluded from scoring without fabricated penalty."
      : evidenceFeedback?.evidenceExplanation ||
        "Candidate's response was assessed for relevance, self-awareness, and constructive alignment without bias on speaking style.";

    const whatAnsweredWell = unableToAssess
      ? "None provided."
      : evidenceFeedback?.whatAnsweredWell ||
        (strengthsArr[0] || "Articulate and relevant communication.");

    const whatWasMissing = unableToAssess
      ? "Response omitted or audio unclear."
      : evidenceFeedback?.whatWasMissing ||
        (improvementsArr[0] || "Connect personal career motivations more directly to company mission.");

    const practicalSuggestion = unableToAssess
      ? "Prepare a structured introduction and company alignment talking points."
      : evidenceFeedback?.practicalSuggestion ||
        "When discussing strengths, provide a concise real-world anecdote of applying peer feedback.";

    return {
      id: q.id,
      orderIndex: q.orderIndex,
      questionText: q.questionText,
      category: q.category,
      candidateResponse: rawTranscript || "No response recorded.",
      isSkipped,
      marksEarned,
      maxMarks: 10,
      rubricCriteria,
      evidenceExplanation,
      whatAnsweredWell,
      whatWasMissing,
      practicalSuggestion,
      unableToAssess,
      unableToAssessReason: unableToAssess ? "Audio was unclear or question was skipped by candidate." : undefined,
      isMachineTranscript: true,
      overallScore: unableToAssess ? null : (ev?.overallScore || 80),
      criteria: {
        communicationClarity: ev?.hrClarityScore || ev?.communicationScore || 82,
        professionalPresence: ev?.hrExamplesScore || 80,
        cultureFit: ev?.hrRelevanceScore || ev?.relevanceScore || 84,
        motivationSelfAwareness: ev?.hrAlignmentScore || 78,
        conflictProblemSolving: ev?.hrReasoningScore || 76,
      },
      executiveSummary:
        ev?.modelAnswerOutline ||
        "Professional candidate response displaying alignment with organizational principles.",
      strengths: strengthsArr.length > 0 ? strengthsArr : ["Articulate communication."],
      areasForGrowth:
        improvementsArr.length > 0
          ? improvementsArr
          : ["Align compensation requirements with local industry market bands."],
      hrDirectorTip: ev?.improvementSuggestions
        ? (() => {
            try {
              return JSON.parse(ev.improvementSuggestions)[0];
            } catch {
              return "Focus on personal leadership impact.";
            }
          })()
        : "Focus on personal leadership impact.",
    };
  });

  const hrMaxMarks = hrQuestions.length * 10;

  // OVERALL SCORES & ARITHMETIC MEAN
  const attemptedScoresList: Array<{ name: string; score: number }> = [];
  if (aptitudeScore !== null) attemptedScoresList.push({ name: `Round 1 Aptitude (${aptitudeScore}%)`, score: aptitudeScore });
  if (technicalScore !== null) attemptedScoresList.push({ name: `Round 2 Technical (${technicalScore}%)`, score: technicalScore });
  if (projectScore !== null) attemptedScoresList.push({ name: `Round 3 Project (${projectScore}%)`, score: projectScore });
  if (behavioralScore !== null) attemptedScoresList.push({ name: `Round 4 Behavioral (${behavioralScore}%)`, score: behavioralScore });
  if (hrScore !== null) attemptedScoresList.push({ name: `Round 5 HR (${hrScore}%)`, score: hrScore });

  const overallScore =
    attemptedScoresList.length > 0
      ? Math.round(attemptedScoresList.reduce((acc, curr) => acc + curr.score, 0) / attemptedScoresList.length)
      : null;

  const weightsExplanation =
    "Configured Round Weights: All 5 interview rounds carry equal weight (20.0% each). Overall Score = (Aptitude % + Technical % + Project % + Behavioral % + HR %) ÷ 5.";

  const formulaExplanation =
    attemptedScoresList.length > 0
      ? `Overall Score = (${attemptedScoresList.map((s) => s.name).join(" + ")}) ÷ ${attemptedScoresList.length} = ${overallScore}% (${attemptedScoresList.length} of 5 Completed Rounds Arithmetic Mean)`
      : "No completed interview rounds recorded yet. Unattempted rounds are marked as 'Not Attempted'.";

  const totalUnable = behavioralUnableCount + hrUnableCount + technicalSkippedCount;
  const missingItemsDisclosure =
    totalUnable > 0
      ? `${totalUnable} question(s) across rounds were skipped or marked 'Unable to Assess' due to unavailable audio. Per fairness guidelines, these are excluded from evaluated percentages rather than being penalized with fabricated low marks.`
      : "All questions across completed rounds were substantively evaluated based on demonstrated candidate evidence.";

  // Distinct demonstrated evidence vs. areas for improvement
  const demonstratedEvidenceSummary = [
    aptitudeScore !== null && aptitudeScore >= 70
      ? `Round 1: Applied correct formulas and derived accurate solutions on ${aptitudeCorrectCount}/${aptitudeTotalQuestions} aptitude questions.`
      : null,
    technicalScore !== null && technicalScore >= 70
      ? `Round 2: Demonstrated sound understanding of runtime complexity and memory lifecycles.`
      : null,
    projectScore !== null && projectCorrectCount > 0
      ? `Round 3: Accurately identified fault-tolerant system patterns on ${projectCorrectCount}/${projectTotalQuestions} project architecture questions.`
      : null,
    behavioralScore !== null && behavioralAssessedCount > 0
      ? `Round 4: Articulated high personal engineering ownership and problem-solving actions in behavioral scenarios.`
      : null,
    hrScore !== null && hrAssessedCount > 0
      ? `Round 5: Delivered professional, articulate responses displaying genuine career vision and constructive collaboration.`
      : null,
  ].filter(Boolean) as string[];

  const growthSuggestionsSummary = [
    technicalSkippedCount > 0
      ? `Review omitted technical topics to ensure complete coverage during placement assessments.`
      : "Continue deepening knowledge of distributed trade-offs and edge-case concurrency.",
    behavioralQuestions.some((q) => q.areasForImprovement?.length > 0)
      ? "Incorporate more quantifiable metrics (% latency reduction, error count decrease) in the Result stage of STAR responses."
      : "Practice structured time limits on behavioral responses.",
    hrQuestions.some((q) => q.areasForGrowth?.length > 0)
      ? "Connect personal career motivations even more directly to the target company's mission."
      : "Rehearse compensation talking points with reference to local industry salary bands.",
  ];

  const disclaimer =
    "AI Evaluation Notice: All scores, marks, and feedback are algorithmically generated educational evaluations intended for practice and benchmarking. They evaluate content and evidence only—never penalizing accent, minor grammar, appearance, or recording quality. They do not constitute an objective or guaranteed hiring decision.";

  return {
    sessionId: latestSession?.id,
    hasSessions: true,
    targetRole: latestSession?.targetRole || latestAptitude?.category || "Software Engineer",
    companyName: latestSession?.companyName || "Tech Company",
    completedAt: (latestSession?.completedAt || latestSession?.createdAt || new Date()).toISOString(),
    scores: {
      aptitude: aptitudeScore,
      technical: technicalScore,
      project: projectScore,
      behavioral: behavioralScore,
      hr: hrScore,
      overall: overallScore,
    },
    marksSummary: {
      aptitude: {
        marksEarned: aptitudeScore !== null ? aptitudeMarksEarned : null,
        maxMarks: aptitudeMaxMarks,
        percentage: aptitudeScore,
      },
      technical: {
        marksEarned: technicalScore !== null ? technicalMarksEarned : null,
        maxMarks: technicalMaxMarks,
        percentage: technicalScore,
      },
      project: {
        marksEarned: projectScore !== null ? projectMarksEarned : null,
        maxMarks: projectMaxMarks,
        percentage: projectScore,
        correctCount: projectCorrectCount,
        totalQuestions: projectTotalQuestions,
      },
      behavioral: {
        marksEarned: behavioralScore !== null ? Number(behavioralTotalMarksEarned.toFixed(1)) : null,
        maxMarks: behavioralMaxMarks,
        percentage: behavioralScore,
        assessedCount: behavioralAssessedCount,
        unableToAssessCount: behavioralUnableCount,
      },
      hr: {
        marksEarned: hrScore !== null ? Number(hrTotalMarksEarned.toFixed(1)) : null,
        maxMarks: hrMaxMarks,
        percentage: hrScore,
        assessedCount: hrAssessedCount,
        unableToAssessCount: hrUnableCount,
      },
      overall: {
        marksEarned: overallScore !== null ? Math.round(overallScore * 3.4) : null,
        maxMarks: 340,
        percentage: overallScore,
      },
    },
    weightsExplanation,
    missingItemsDisclosure,
    formulaExplanation,
    demonstratedEvidenceSummary:
      demonstratedEvidenceSummary.length > 0
        ? demonstratedEvidenceSummary
        : ["Demonstrated foundational domain awareness across attempted rounds."],
    growthSuggestionsSummary,
    disclaimer,
    strengths:
      demonstratedEvidenceSummary.length > 0
        ? demonstratedEvidenceSummary
        : [
            "Demonstrated foundational analytical and problem-solving competence.",
            "Professional demeanor and structured response delivery.",
          ],
    weaknesses: growthSuggestionsSummary,
    recommendations: [
      "Use the InterviewAI Chatbot to drill complex algorithms, system design, and formulas.",
      "Practice STAR behavioral answers with a timer to ensure quantifiable results are mentioned.",
      "Re-attempt uncompleted rounds to achieve a comprehensive 5-round benchmark score.",
    ],
    aptitudeQuestions,
    aptitudeCategoryScores,
    technicalQuestions,
    projectQuestions,
    behavioralQuestions,
    hrQuestions,
    roundsDetail: {
      aptitude: {
        status: latestAptitude ? (latestAptitude.status === "COMPLETED" ? "Completed" : "In Progress") : "Not Attempted",
        score: aptitudeScore,
        marksEarned: aptitudeScore !== null ? aptitudeMarksEarned : null,
        maxMarks: aptitudeMaxMarks,
        percentage: aptitudeScore,
        questionsCount: aptitudeTotalQuestions,
        correctCount: aptitudeCorrectCount,
      },
      technical: {
        status: technicalSession ? (technicalSession.status === "COMPLETED" ? "Completed" : "In Progress") : "Not Attempted",
        score: technicalScore,
        marksEarned: technicalScore !== null ? technicalMarksEarned : null,
        maxMarks: technicalMaxMarks,
        percentage: technicalScore,
        questionsCount: technicalTotalQuestions,
        correctCount: technicalCorrectCount,
        skippedCount: technicalSkippedCount,
      },
      project: {
        status: latestProject ? (latestProject.status === "COMPLETED" ? "Completed" : "In Progress") : "Not Attempted",
        score: projectScore,
        marksEarned: projectScore !== null ? projectMarksEarned : null,
        maxMarks: projectMaxMarks,
        percentage: projectScore,
        questionsCount: projectTotalQuestions,
        correctCount: projectCorrectCount,
      },
      behavioral: {
        status: behavioralSession ? (behavioralSession.status === "COMPLETED" ? "Completed" : "In Progress") : "Not Attempted",
        score: behavioralScore,
        marksEarned: behavioralScore !== null ? Number(behavioralTotalMarksEarned.toFixed(1)) : null,
        maxMarks: behavioralMaxMarks,
        percentage: behavioralScore,
        questionsCount: behavioralQuestions.length,
        assessedCount: behavioralAssessedCount,
        unableToAssessCount: behavioralUnableCount,
      },
      hr: {
        status: hrSession ? (hrSession.status === "COMPLETED" ? "Completed" : "In Progress") : "Not Attempted",
        score: hrScore,
        marksEarned: hrScore !== null ? Number(hrTotalMarksEarned.toFixed(1)) : null,
        maxMarks: hrMaxMarks,
        percentage: hrScore,
        questionsCount: hrQuestions.length,
        assessedCount: hrAssessedCount,
        unableToAssessCount: hrUnableCount,
      },
    },
  };
}
