import { CURATED_MCQ_BANK, MCQ_TOPIC_METADATA } from "../../server/data/curated-mcq-bank";
import {
  syncCuratedQuestionBank,
  startPracticeSession,
  submitPracticeAnswer,
  completePracticeSession,
  reportQuestion,
  getAdminQuestionReports,
  adminReviewAndCorrectQuestion,
} from "../../server/db/practice";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runMcqPracticeTests() {
  console.log("Running Unit & Integration Tests: MCQ Practice Mode & Curated Bank...\n");

  // ==========================================
  // 1. Curated Question Bank Integrity
  // ==========================================
  console.log("--- 1. Testing Curated Question Bank Accuracy & Integrity ---");
  assert(CURATED_MCQ_BANK.length >= 10, `Curated bank should contain at least 10 reviewed questions, got ${CURATED_MCQ_BANK.length}`);

  const topicsCovered = new Set(CURATED_MCQ_BANK.map((q) => q.topic));
  for (const expectedTopic of ["programming", "dsa", "databases", "os", "networking", "system-design"]) {
    assert(topicsCovered.has(expectedTopic as any), `Topic '${expectedTopic}' must have curated questions`);
  }

  for (const q of CURATED_MCQ_BANK) {
    // Unambiguous Single Answer & 4 Options
    assert(q.question.length > 10, `Question ${q.id} must have clear question text`);
    assert(q.options.length === 4, `Question ${q.id} must have exactly 4 options`);
    assert(q.correctOptionIndex >= 0 && q.correctOptionIndex <= 3, `Question ${q.id} must have valid correctOptionIndex (0-3)`);
    assert(q.options[q.correctOptionIndex].length > 0, `Question ${q.id} correct option cannot be empty`);

    // Plausible Distractors & Per-Option Explanations
    assert(!!q.optionExplanations["0"], `Question ${q.id} must explain option 0`);
    assert(!!q.optionExplanations["1"], `Question ${q.id} must explain option 1`);
    assert(!!q.optionExplanations["2"], `Question ${q.id} must explain option 2`);
    assert(!!q.optionExplanations["3"], `Question ${q.id} must explain option 3`);

    // Reliable References & Documentation
    assert(q.referenceTitle.length > 5, `Question ${q.id} must have authoritative reference title`);
    assert(q.referenceUrl.startsWith("http"), `Question ${q.id} must have valid reference URL`);
    assert(q.isReviewed === true, `Question ${q.id} must be flagged as reviewed`);

    // Version-dependent consistency
    if (q.isVersionDependent) {
      assert(!!q.versionWarning && q.versionWarning.length > 5, `Version-dependent question ${q.id} must include versionWarning`);
    }
  }
  console.log("✓ All curated questions adhere to strict verification and reference standards.\n");

  // ==========================================
  // 2. Database Sync & Practice Session
  // ==========================================
  console.log("--- 2. Testing Practice Session & Option Shuffling ---");
  await syncCuratedQuestionBank();

  const sessionResult = await startPracticeSession({
    topic: "programming",
    difficulty: "INTERMEDIATE",
    questionCount: 3,
  });

  assert(sessionResult.questions.length > 0, "Practice session must return questions");
  assert(sessionResult.session.id.length > 0, "Practice session must have valid ID");

  const sampleQ = sessionResult.questions[0];
  assert(sampleQ.shuffledIndices.length === 4, "Question must track 4 shuffled indices");
  assert(!!sampleQ.options.A && !!sampleQ.options.B && !!sampleQ.options.C && !!sampleQ.options.D, "Question must have options A, B, C, D");

  // ==========================================
  // 3. Answer Validation & Instant Feedback
  // ==========================================
  console.log("\n--- 3. Testing Answer Submission & Instant Feedback ---");
  
  // Submit an answer
  const answerResult = await submitPracticeAnswer({
    sessionId: sessionResult.session.id,
    questionId: sampleQ.id,
    selectedLetter: "A",
    shuffledIndices: sampleQ.shuffledIndices,
    timeSpentSec: 20,
    isBookmarked: true,
  });

  assert(typeof answerResult.isCorrect === "boolean", "Answer result must return isCorrect boolean");
  assert(["A", "B", "C", "D"].includes(answerResult.correctLetter), "Must return mapped correctLetter");
  assert(answerResult.explanation.length > 10, "Must return comprehensive explanation");
  assert(!!answerResult.referenceUrl, "Must return referenceUrl");

  // ==========================================
  // 4. Session Completion & Topics to Revisit
  // ==========================================
  console.log("\n--- 4. Testing Completion & Topics to Revisit Synthesis ---");
  const completion = await completePracticeSession({
    sessionId: sessionResult.session.id,
    totalTimeSpentSeconds: 65,
  });

  assert(completion.totalQuestions > 0, "Completion must report total questions");
  assert(completion.scorePercentage >= 0 && completion.scorePercentage <= 100, "Score percentage must be between 0 and 100");
  assert(Array.isArray(completion.topicsToRevisit), "topicsToRevisit must be an array");

  // ==========================================
  // 5. User Reporting & Admin Review Workflow
  // ==========================================
  console.log("\n--- 5. Testing Question Reporting & Admin Resolution Workflow ---");
  const report = await reportQuestion({
    questionId: sampleQ.id,
    userEmail: "candidate@example.com",
    reason: "OUTDATED_VERSION",
    userNotes: "In Python 3.12, runtime output warning formatting slightly differs.",
    suggestedCorrection: "Add note regarding Python 3.12 sys.version info.",
  });

  assert(report.id.length > 0, "Report must be assigned an ID");
  assert(report.status === "PENDING_REVIEW", "New report must be PENDING_REVIEW");

  // Admin view
  const adminData = await getAdminQuestionReports();
  assert(adminData.reports.length > 0, "Admin must be able to list reports");
  assert(adminData.stats.totalQuestions > 0, "Admin stats must report total questions in bank");

  // Admin resolves report
  const resolved = await adminReviewAndCorrectQuestion({
    reportId: report.id,
    questionId: sampleQ.id,
    questionText: sampleQ.question + " [Verified]",
    options: [sampleQ.options.A, sampleQ.options.B, sampleQ.options.C, sampleQ.options.D],
    correctOptionIndex: 1,
    explanation: "Updated and re-verified by admin reviewer.",
    optionExplanations: { "0": "Wrong", "1": "Right", "2": "Wrong", "3": "Wrong" },
    status: "ACTIVE",
    adminNotes: "Clarified version-dependent behavior in Python 3.12.",
    reviewerName: "Lead Staff Engineer",
    resolutionAction: "RESOLVED",
  });

  assert(resolved.isReviewed === true, "Question must remain flagged as reviewed");
  assert(resolved.status === "ACTIVE", "Question must be active in live bank");

  console.log("\n=======================================================");
  console.log("ALL MCQ PRACTICE & ACCURACY ASSURANCE TESTS PASSED!");
  console.log("=======================================================\n");
}

runMcqPracticeTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
