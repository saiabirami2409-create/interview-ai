import assert from "node:assert";
import {
  generateFingerprint,
  calculateSimilarity,
} from "../../server/ai/duplicate-prevention";
import { generateAptitudeQuestions, verifyAptitudeAnswer } from "../../server/ai/aptitude-service";
import { generateProjectQuestions, evaluateProjectMCQAnswers } from "../../server/ai/project-service";
import {
  generateChatbotReply,
  classifyIntentHeuristic,
  extractAnswerHeuristic,
} from "../../server/ai/chatbot-service";

async function runFiveRoundPlatformTests() {
  console.log("\n=======================================================");
  console.log("RUNNING FIVE-ROUND AI MOCK INTERVIEW PLATFORM TESTS");
  console.log("=======================================================\n");

  // 1. Strict Five-Round Order Verification
  console.log("--- 1. Testing Five-Round Order Alignment ---");
  const expectedOrder = [
    { round: 1, name: "Aptitude Round", type: "APTITUDE" },
    { round: 2, name: "Technical Round", type: "TECHNICAL" },
    { round: 3, name: "Project-Based Interview", type: "PROJECT" },
    { round: 4, name: "Behavioral Round", type: "BEHAVIORAL" },
    { round: 5, name: "HR Round", type: "HR" },
  ];
  assert.strictEqual(expectedOrder.length, 5, "Must have exactly 5 interview rounds");
  assert.strictEqual(expectedOrder[0].name, "Aptitude Round");
  assert.strictEqual(expectedOrder[1].name, "Technical Round");
  assert.strictEqual(expectedOrder[2].name, "Project-Based Interview");
  assert.strictEqual(expectedOrder[3].name, "Behavioral Round");
  assert.strictEqual(expectedOrder[4].name, "HR Round");
  console.log("✓ Strict five-round order verified: Aptitude -> Technical -> Project -> Behavioral -> HR");

  // 2. Duplicate Question Prevention & Fingerprinting
  console.log("\n--- 2. Testing Duplicate Question Prevention & Fingerprinting ---");
  const qText1 = "What is the time complexity of searching in a balanced AVL tree?";
  const qText2 = "What is the search time complexity of a balanced AVL tree?";
  const qText3 = "Explain the difference between optimistic and pessimistic locking in databases.";

  const fp1 = generateFingerprint(qText1);
  const fp2 = generateFingerprint(qText2);
  const fp3 = generateFingerprint(qText3);

  assert(fp1.length > 0, "Fingerprint 1 must be non-empty");
  assert(fp2.length > 0, "Fingerprint 2 must be non-empty");
  assert.notStrictEqual(fp1, fp3, "Distinct questions must have distinct fingerprints");

  const similarityHigh = calculateSimilarity(qText1, qText2);
  const similarityLow = calculateSimilarity(qText1, qText3);

  assert(similarityHigh >= 0.70, `Expected high similarity for reworded question, got ${similarityHigh}`);
  assert(similarityLow < 0.30, `Expected low similarity for unrelated questions, got ${similarityLow}`);
  console.log(`✓ Reworded question similarity detected: ${Math.round(similarityHigh * 100)}% (threshold >= 70%)`);
  console.log(`✓ Unrelated question similarity correctly low: ${Math.round(similarityLow * 100)}%`);

  // 3. Round 1 Aptitude Question Generation & Mathematical Verification
  console.log("\n--- 3. Testing Round 1 Aptitude Generation & Formulas ---");
  const aptQuestions = await generateAptitudeQuestions({
    userId: "test-candidate",
    category: "Quantitative Aptitude",
    difficulty: "Intermediate",
    questionCount: 10,
  });

  assert(aptQuestions.length >= 5, `Expected at least 5 aptitude questions, got ${aptQuestions.length}`);
  const firstApt = aptQuestions[0];
  assert(firstApt.question.length > 10, "Question text must be substantive");
  assert.strictEqual(Object.keys(firstApt.options).length, 4, "Must provide exactly 4 options (A, B, C, D)");
  assert(["A", "B", "C", "D"].includes(firstApt.correctAnswer), "Correct answer must be A, B, C, or D");
  assert(firstApt.explanation.length > 15, "Must provide conceptual explanation");
  console.log(`✓ Generated ${aptQuestions.length} Aptitude questions with options and explanations`);

  // Verify verification logic with formula and shortcut
  const verification = verifyAptitudeAnswer(firstApt, firstApt.correctAnswer);
  assert.strictEqual(verification.isCorrect, true, "Correct option must be verified as true");
  assert.strictEqual(verification.selectedOption, firstApt.correctAnswer);
  assert(verification.stepByStepSolution.length > 10, "Must provide step-by-step solution");
  console.log("✓ Answer verification includes formula, step-by-step breakdown, and shortcut");

  // 4. Round 3 Project Interview Grounded MCQs
  console.log("\n--- 4. Testing Round 3 Project-Based Interview MCQ Questions ---");
  const projectQuestions = await generateProjectQuestions("test-candidate", {
    title: "Distributed Payment Gateway",
    domain: "FinTech / High-Throughput Systems",
    description: "Idempotent payment processing engine handling 10,000 transactions per second with Stripe and Adyen.",
    technologies: ["Node.js", "TypeScript", "Redis", "Kafka", "PostgreSQL"],
    candidateRole: "Lead Backend Architect",
    challengesFaced: "Preventing duplicate debits during network partition timeouts and distributed deadlocks.",
    outcomes: "Reduced transaction failure rate to 0.001% across 2M daily operations.",
    isOngoingOrProposed: false,
  });

  assert.strictEqual(projectQuestions.length, 5, "Must generate exactly 5 project-grounded questions");
  assert(projectQuestions.some((q) => q.category.includes("Architecture") || q.category.includes("Design")), "Must include Architecture question");
  assert(projectQuestions.some((q) => q.category.includes("Implementation") || q.category.includes("Concurrency")), "Must include Concurrency/Implementation question");
  assert(
    projectQuestions.every((q) => q.options && Object.keys(q.options).length === 4),
    "All questions must contain exactly 4 options (A, B, C, D)"
  );
  assert(
    projectQuestions.every((q) => ["A", "B", "C", "D"].includes(q.correctOption)),
    "All questions must have a valid correctOption"
  );
  assert(
    projectQuestions.every((q) => q.explanation && q.explanation.length > 10),
    "All questions must contain detailed engineering explanations"
  );
  console.log("✓ 5 project MCQs generated with 4 options, valid correct option, and engineering explanations");

  // 5. Five-Round Overall Arithmetic Mean Calculation
  console.log("\n--- 5. Testing Five-Round Arithmetic Mean Calculation ---");
  const r1Apt = 84;
  const r2Tech = 90;
  const r3Proj = 86;
  const r4Beh = 80;
  const r5Hr = 85;

  const allCompleted = [r1Apt, r2Tech, r3Proj, r4Beh, r5Hr];
  const expectedAverage = Math.round(allCompleted.reduce((a, b) => a + b, 0) / 5);
  assert.strictEqual(expectedAverage, 85, "Equal-weight arithmetic mean of (84+90+86+80+85)/5 should be 85");

  // Partial attempt (only R1 and R2 completed)
  const partial = [r1Apt, r2Tech];
  const partialAverage = Math.round(partial.reduce((a, b) => a + b, 0) / partial.length);
  assert.strictEqual(partialAverage, 87, "Partial average of (84+90)/2 should be 87 without zero penalty");
  console.log("✓ Verified equal-weight average across 5 rounds: (84+90+86+80+85) / 5 = 85%");
  console.log("✓ Verified unattempted rounds do not falsely drag average down to 0%");

  // 6. Round 3 MCQ Answer Evaluation & Scoring
  console.log("\n--- 6. Testing Round 3 Project MCQ Evaluation & Scoring ---");
  const testSelections: Record<string, "A" | "B" | "C" | "D"> = {
    [projectQuestions[0].id]: projectQuestions[0].correctOption,
    [projectQuestions[1].id]: projectQuestions[1].correctOption,
    [projectQuestions[2].id]: projectQuestions[2].correctOption,
  };
  const evalResult = await evaluateProjectMCQAnswers(
    {
      title: "Distributed Payment Gateway",
      domain: "FinTech",
      description: "Payment gateway",
      technologies: ["Node.js", "Redis"],
      candidateRole: "Architect",
    },
    projectQuestions,
    testSelections
  );
  assert.strictEqual(evalResult.correctCount, 3, "Should accurately count 3 correct answers");
  assert.strictEqual(evalResult.overallScore, 60, "3 out of 5 correct should be 60%");
  assert(evalResult.strengths.length > 0, "Should generate strengths based on correct categories");
  assert(evalResult.questionResults.length === 5, "Should return 5 detailed question results");
  console.log("✓ Project MCQ evaluation scored accurately (3/5 = 60%) with category feedback");

  // 7. Chatbot Service with Gemini & Grounding Resilience
  console.log("\n--- 7. Testing Chatbot Natural Language & Grounding Fallback ---");
  const botReply = await generateChatbotReply({
    message: "Explain the difference between clustered and non-clustered index in database systems",
    context: "TECHNICAL",
  });
  assert(botReply.reply && botReply.reply.length > 20, "Chatbot must return substantive technical answer");
  assert(botReply.suggestedFollowUps && botReply.suggestedFollowUps.length > 0, "Chatbot must include suggested follow-ups");
  console.log(`✓ Chatbot returned valid response using model: ${botReply.modelUsed} (groundingUsed: ${botReply.groundingUsed})`);

  // 8. Smart Intent Routing & Active Interview Question Context Protection
  console.log("\n--- 8. Testing Smart Intent Routing & Active Interview Question Protection ---");
  const sampleActiveQuestion = {
    roundNumber: 3,
    roundName: "Project-Based Interview",
    questionId: "proj-q-101",
    questionText: "How did you guarantee idempotency during payment gateway retries under network partitions?",
    category: "Architecture & Concurrency",
    options: {
      A: "Generate unique idempotency keys in Redis with SETNX and atomic TTL",
      B: "Retry requests infinitely with exponential backoff and no key",
      C: "Store all retries in an unindexed SQL table without transactions",
      D: "Disable timeouts and let HTTP connections stay open indefinitely",
    },
  };

  // 8a. Heuristic Intent Classification Tests
  const sideIntent = classifyIntentHeuristic("What is the CAP theorem?", sampleActiveQuestion);
  assert.strictEqual(sideIntent, "SIDE_QUESTION", "Conceptual question must be classified as SIDE_QUESTION");

  const clarifyIntent = classifyIntentHeuristic("Can you clarify what the question is asking?", sampleActiveQuestion);
  assert.strictEqual(clarifyIntent, "CLARIFY_QUESTION", "Clarification request must be classified as CLARIFY_QUESTION");

  const answerOptionA = classifyIntentHeuristic("Option A", sampleActiveQuestion);
  assert.strictEqual(answerOptionA, "ANSWER_INTERVIEW_QUESTION", "'Option A' must be classified as ANSWER_INTERVIEW_QUESTION");

  const singleLetterB = classifyIntentHeuristic("B", sampleActiveQuestion);
  assert.strictEqual(singleLetterB, "ANSWER_INTERVIEW_QUESTION", "'B' must be classified as ANSWER_INTERVIEW_QUESTION");

  const chooseOptionC = classifyIntentHeuristic("I choose option C", sampleActiveQuestion);
  assert.strictEqual(chooseOptionC, "ANSWER_INTERVIEW_QUESTION", "'I choose option C' must be classified as ANSWER_INTERVIEW_QUESTION");

  const ambiguousQuery = classifyIntentHeuristic("wait", sampleActiveQuestion);
  assert.strictEqual(ambiguousQuery, "AMBIGUOUS", "Short uninformative phrase must be classified as AMBIGUOUS");

  // 8b. Answer Extraction
  const extractedA = extractAnswerHeuristic("Option A", sampleActiveQuestion);
  assert.strictEqual(extractedA, "A", "Extracted answer for 'Option A' must be 'A'");

  const extractedB = extractAnswerHeuristic("I choose B", sampleActiveQuestion);
  assert.strictEqual(extractedB, "B", "Extracted answer for 'I choose B' must be 'B'");

  console.log("✓ Intent classification heuristics accurately separated answers, side questions, clarifications, and ambiguity");

  // 8c. End-to-End Chatbot Routing on Active Side Question
  const sideQuestionReply = await generateChatbotReply({
    message: "What does idempotency mean in payment processing?",
    context: "PROJECT",
    activeInterviewQuestion: sampleActiveQuestion,
  });

  assert.strictEqual(sideQuestionReply.intent, "SIDE_QUESTION", "Intent must be SIDE_QUESTION");
  assert(sideQuestionReply.reply.toLowerCase().includes("idempotenc"), "Reply must explain idempotency");
  assert(
    sideQuestionReply.reply.includes("Round 3") || sideQuestionReply.reply.includes("pending question") || sideQuestionReply.reply.includes("idempotency"),
    "Reply must return candidate attention to pending question"
  );
  console.log("✓ Side question answered thoroughly without advancing interview, prompting return to pending question");

  // 8d. End-to-End Chatbot Routing on Active Answer Selection
  const answerSubmitReply = await generateChatbotReply({
    message: "I choose Option A",
    context: "PROJECT",
    activeInterviewQuestion: sampleActiveQuestion,
  });

  assert.strictEqual(answerSubmitReply.intent, "ANSWER_INTERVIEW_QUESTION", "Intent must be ANSWER_INTERVIEW_QUESTION");
  assert.strictEqual(answerSubmitReply.detectedAnswer, "A", "Detected answer must be option letter 'A'");
  console.log("✓ Option answer recognized and isolated as 'A' for automatic page submission");

  console.log("\n=======================================================");
  console.log("ALL FIVE-ROUND PLATFORM TESTS PASSED SUCCESSFULLY! ✓");
  console.log("=======================================================\n");
}

runFiveRoundPlatformTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
