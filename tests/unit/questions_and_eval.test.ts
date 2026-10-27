import { DeterministicDemoProvider } from "../../server/ai/demo-provider";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function run() {
  console.log("Running Unit Tests: Real-World Question Generation & Evaluation Intelligence...");
  const provider = new DeterministicDemoProvider();

  // Test 1: Full-Stack Developer Technical Question Generation
  const fsQuestions = await provider.generateQuestions({
    targetRole: "Full-Stack Developer",
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    questionCount: 3,
  });
  assert(fsQuestions.length === 3, "Must generate exactly 3 questions");
  assert(fsQuestions[0].questionText.includes("concurrency") || fsQuestions[0].questionText.includes("flash sale"), "First Full-Stack question must probe real-world high-concurrency e-commerce flash sale");
  assert(fsQuestions[0].relevantSkills.length > 0, "Question must have relevant skills attached");

  // Test 2: AI / Machine Learning Engineer Technical Question Generation
  const aiQuestions = await provider.generateQuestions({
    targetRole: "AI / Machine Learning Engineer",
    interviewType: "TECHNICAL",
    difficulty: "ADVANCED",
    questionCount: 2,
  });
  assert(aiQuestions.length === 2, "Must generate 2 AI/ML questions");
  assert(aiQuestions[0].questionText.toLowerCase().includes("rag") || aiQuestions[0].questionText.toLowerCase().includes("retrieval"), "AI/ML question must probe enterprise RAG architectures");

  // Test 3: Focus Area Customization
  const focusedQuestions = await provider.generateQuestions({
    targetRole: "Backend Developer",
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    questionCount: 2,
    focusArea: "SQL Indexing & Query Plans",
  });
  assert(focusedQuestions[0].questionText.includes("SQL Indexing & Query Plans") || focusedQuestions[0].category.includes("SQL"), "Focus area must be embedded in question context");

  // Test 4: Realistic Answer Evaluation (Deep technical answer)
  const detailedAnswer = `
    In high-concurrency systems, we must decouple inventory reservation from database persistence.
    We maintain SKU stock in Redis and execute an atomic Lua script: if stock > 0, decrement by 1 and return success.
    This guarantees single-threaded atomicity in memory in under 2ms.
    Once reserved, an asynchronous event is pushed to a Kafka queue with an Idempotency-Key.
    Background workers consume the queue and write to PostgreSQL using optimistic concurrency control with a version column:
    UPDATE inventory SET stock = stock - 1, version = version + 1 WHERE sku = :sku AND version = :version.
    If payment fails or times out within 10 minutes, a compensation event increments the Redis stock back.
    The trade-off is eventual consistency in the database in exchange for 50,000 req/sec throughput.
  `;

  const evaluation = await provider.evaluateAnswer({
    questionText: fsQuestions[0].questionText,
    category: fsQuestions[0].category,
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    expectedCriteria: fsQuestions[0].expectedCriteria,
    answerText: detailedAnswer,
    timeSpentSec: 180,
  });

  assert(evaluation.overallScore >= 80, `Detailed answer should score >= 80, got ${evaluation.overallScore}`);
  assert(evaluation.technicalScore >= 85, `Technical score should be >= 85, got ${evaluation.technicalScore}`);
  assert(evaluation.strengths.length > 0, "Must provide identified strengths");
  assert(evaluation.modelAnswerOutline.length > 20, "Must provide model answer outline");

  // Test 5: Skipped Question Evaluation
  const skippedEval = await provider.evaluateAnswer({
    questionText: fsQuestions[0].questionText,
    category: fsQuestions[0].category,
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    expectedCriteria: fsQuestions[0].expectedCriteria,
    answerText: "[Candidate skipped question]",
    timeSpentSec: 10,
  });

  assert(skippedEval.overallScore === 0, `Skipped question must score 0, got ${skippedEval.overallScore}`);
  assert(skippedEval.weaknesses[0].includes("unanswered"), "Must indicate question was unanswered");

  // Test 6: Behavioral STAR Answer Evaluation
  const starAnswer = `
    Situation: During our final semester project, our product lead wanted to push unverified features right before code freeze.
    Task: As backend lead, I had to ensure our API remained reliable without alienating the product manager.
    Action: I met with the stakeholder privately with data showing latency risks, and proposed a phased release compromise where core features shipped on time and the extra feature followed a week later.
    Result: We delivered with 100% test pass rate, zero production downtime, and the follow-up feature was successfully released the next sprint.
  `;

  const behavioralEval = await provider.evaluateAnswer({
    questionText: "Tell me about a time you handled a deadline conflict.",
    category: "Stakeholder Management",
    interviewType: "BEHAVIORAL",
    difficulty: "INTERMEDIATE",
    expectedCriteria: "Uses STAR framework, balanced compromise.",
    answerText: starAnswer,
    timeSpentSec: 200,
  });

  assert(behavioralEval.communicationScore >= 85, `STAR answer communication score should be >= 85, got ${behavioralEval.communicationScore}`);

  // Test 7: Technical MCQ Question Generation Structure
  const mcqQuestions = await provider.generateQuestions({
    targetRole: "Full-Stack Developer",
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    questionCount: 4,
  });
  assert(mcqQuestions.length === 4, "Must generate exactly 4 MCQ questions");
  assert(mcqQuestions[0].isMcq === true, "Technical question must have isMcq: true");
  assert(Array.isArray(mcqQuestions[0].options) && mcqQuestions[0].options.length === 4, "Must provide exactly 4 options");
  assert(typeof mcqQuestions[0].correctOptionIndex === "number", "Must provide numeric correctOptionIndex");
  assert(typeof mcqQuestions[0].explanation === "string" && mcqQuestions[0].explanation.length > 30, "Must provide detailed explanation");

  // Test 8: Technical MCQ Correct Answer Scoring
  const correctOptionIdx = mcqQuestions[0].correctOptionIndex!;
  const correctMcqEval = await provider.evaluateAnswer({
    questionText: mcqQuestions[0].questionText,
    category: mcqQuestions[0].category,
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    expectedCriteria: mcqQuestions[0].expectedCriteria,
    answerText: `Option ${String.fromCharCode(65 + correctOptionIdx)}`,
    selectedOptionIndex: correctOptionIdx,
    timeSpentSec: 45,
  });
  assert(correctMcqEval.overallScore === 100, `Correct MCQ answer must score 100, got ${correctMcqEval.overallScore}`);
  assert(correctMcqEval.technicalScore === 100, "Technical score must be 100 for correct option");
  assert(correctMcqEval.strengths[0].includes("Correctly"), "Must identify correct answer strength");
  assert(correctMcqEval.weaknesses.length === 0, "Correct MCQ answer must have 0 weaknesses");

  // Test 9: Technical MCQ Incorrect Answer Scoring
  const wrongOptionIdx = (correctOptionIdx + 1) % 4;
  const wrongMcqEval = await provider.evaluateAnswer({
    questionText: mcqQuestions[0].questionText,
    category: mcqQuestions[0].category,
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    expectedCriteria: mcqQuestions[0].expectedCriteria,
    answerText: `Option ${String.fromCharCode(65 + wrongOptionIdx)}`,
    selectedOptionIndex: wrongOptionIdx,
    timeSpentSec: 60,
  });
  assert(wrongMcqEval.overallScore < 50, `Incorrect MCQ answer score must be < 50, got ${wrongMcqEval.overallScore}`);
  assert(wrongMcqEval.weaknesses[0].includes("instead of"), "Weakness must explain selected option vs optimal option");
  assert(wrongMcqEval.modelAnswerOutline.includes("Explanation:"), "Model answer outline must provide detailed explanation");

  // Test 10: Non-repeating Question Selection in Session
  const questionTexts = mcqQuestions.map((q) => q.questionText);
  const uniqueTexts = new Set(questionTexts);
  assert(uniqueTexts.size === mcqQuestions.length, `Questions must not repeat in a session (expected ${mcqQuestions.length} unique, got ${uniqueTexts.size})`);

  console.log("\nAll Question & Evaluation Unit Tests Passed Successfully!");
}

run().catch((e) => {
  console.error("Test failure:", e);
  process.exit(1);
});
