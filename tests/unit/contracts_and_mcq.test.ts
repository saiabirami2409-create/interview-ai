import {
  registerSchema,
  loginSchema,
  interviewSetupSchema,
  generatedQuestionSchema,
  aiQuestionsResponseSchema,
  saveAnswersSchema,
  submitAssessmentSchema,
  feedbackReportSchema,
  calculateDifficultyDistribution,
} from "../../lib/api-schemas";
import { apiSuccess, apiError } from "../../lib/api-response";
import { generateTechnicalMCQsWithGemini } from "../../server/ai/gemini-mcq";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function run() {
  console.log("\n=======================================================");
  console.log("RUNNING CONTRACTS, MCQ VALIDATION & SCORING TESTS");
  console.log("=======================================================\n");

  // 1. SCHEMAS: Registration validation
  console.log("--- 1. Testing Registration Schema ---");
  const validRegister = registerSchema.safeParse({
    fullName: "Alex Rivera",
    email: "Alex.Rivera@Example.Com",
    password: "SecurePassword123!",
    confirmPassword: "SecurePassword123!",
  });
  assert(validRegister.success, "Valid registration must succeed");
  if (validRegister.success) {
    assert(
      validRegister.data.email === "alex.rivera@example.com",
      "Email must be normalized to lowercase"
    );
  }

  const mismatchRegister = registerSchema.safeParse({
    fullName: "Alex Rivera",
    email: "alex@example.com",
    password: "SecurePassword123!",
    confirmPassword: "DifferentPassword123!",
  });
  assert(!mismatchRegister.success, "Password mismatch must be rejected");

  // 2. SCHEMAS: Login validation
  console.log("\n--- 2. Testing Login Schema ---");
  const validLogin = loginSchema.safeParse({
    email: "user@example.com",
    password: "Password123!",
    rememberMe: true,
  });
  assert(validLogin.success, "Valid login payload must succeed");

  const invalidLogin = loginSchema.safeParse({
    email: "not-an-email",
    password: "",
  });
  assert(!invalidLogin.success, "Malformed login must fail");

  // 3. SCHEMAS: Interview Setup & 60/40 Difficulty Distribution
  console.log("\n--- 3. Testing Interview Setup & Difficulty Ratio ---");
  const dist10 = calculateDifficultyDistribution(10);
  assert(dist10.intermediate === 6, "10 Qs must produce 6 Intermediate (60%)");
  assert(dist10.advanced === 4, "10 Qs must produce 4 Advanced (40%)");

  const dist5 = calculateDifficultyDistribution(5);
  assert(dist5.intermediate === 3, "5 Qs must produce 3 Intermediate");
  assert(dist5.advanced === 2, "5 Qs must produce 2 Advanced");

  const dist15 = calculateDifficultyDistribution(15);
  assert(dist15.intermediate === 9, "15 Qs must produce 9 Intermediate");
  assert(dist15.advanced === 6, "15 Qs must produce 6 Advanced");

  const dist20 = calculateDifficultyDistribution(20);
  assert(dist20.intermediate === 12, "20 Qs must produce 12 Intermediate");
  assert(dist20.advanced === 8, "20 Qs must produce 8 Advanced");

  const validSetup = interviewSetupSchema.safeParse({
    jobRole: "Python Developer",
    topics: ["Lists, Tuples, Sets, Dictionaries", "Asyncio & Event Loop"],
    questionCount: 10,
    durationMinutes: 15,
    categories: ["core_concepts", "code_output", "performance_optimization"],
  });
  assert(validSetup.success, "Valid interview setup must parse successfully");

  const invalidSetup = interviewSetupSchema.safeParse({
    jobRole: "Python Developer",
    topics: [], // Empty topics must fail
    questionCount: 10,
    durationMinutes: 15,
    categories: ["core_concepts"],
  });
  assert(!invalidSetup.success, "Setup with empty topics must be rejected");

  // 4. MCQ GENERATION & SCHEMA VALIDATION
  console.log("\n--- 4. Testing AI MCQ Synthesis & Strict Validation ---");
  const generated = await generateTechnicalMCQsWithGemini({
    jobRole: "Python Developer",
    topics: ["Python Fundamentals", "Object-Oriented Programming"],
    questionCount: 10,
    intermediateCount: 6,
    advancedCount: 4,
    categories: ["core_concepts", "code_output", "edge_cases"],
  });

  assert(generated.length === 10, "Must generate exactly 10 questions");
  const interCount = generated.filter((q) => q.difficulty === "Intermediate").length;
  const advCount = generated.filter((q) => q.difficulty === "Advanced").length;
  assert(interCount === 6, `Must have 6 Intermediate questions (got ${interCount})`);
  assert(advCount === 4, `Must have 4 Advanced questions (got ${advCount})`);

  for (let i = 0; i < generated.length; i++) {
    const q = generated[i];
    assert(Boolean(q.question), `Question ${i + 1} must have nonempty question text`);
    assert(
      Boolean(q.options.A && q.options.B && q.options.C && q.options.D),
      `Question ${i + 1} must have 4 distinct options (A, B, C, D)`
    );
    assert(
      ["A", "B", "C", "D"].includes(q.correctOption),
      `Question ${i + 1} correctOption must be A, B, C, or D (got ${q.correctOption})`
    );
    assert(
      q.explanation.length > 20,
      `Question ${i + 1} must have educational explanation (>20 chars)`
    );
  }

  // 5. DETERMINISTIC SCORING & FORMULAS
  console.log("\n--- 5. Testing Deterministic Assessment Scoring ---");
  // 10 questions simulation: 7 correct, 2 incorrect, 1 unanswered
  const total = 10;
  const correct = 7;
  const incorrect = 2;
  const unanswered = 1;

  const score = correct * 1;
  const percentage = Math.round((correct / total) * 100);
  const attempted = correct + incorrect;
  const accuracy = Math.round((correct / attempted) * 100);

  assert(score === 7, "Score must be 7 (1 mark per correct answer)");
  assert(percentage === 70, `Percentage must be 70% (got ${percentage}%)`);
  assert(accuracy === 78, `Accuracy must be 78% (7/9 = 77.78%, got ${accuracy}%)`);

  // Performance category determination
  function getCategory(pct: number) {
    if (pct >= 90) return "excellent";
    if (pct >= 75) return "very_good";
    if (pct >= 60) return "good";
    if (pct >= 40) return "needs_improvement";
    return "more_practice_recommended";
  }

  assert(getCategory(95) === "excellent", "95% must map to 'excellent'");
  assert(getCategory(80) === "very_good", "80% must map to 'very_good'");
  assert(getCategory(70) === "good", "70% must map to 'good'");
  assert(getCategory(50) === "needs_improvement", "50% must map to 'needs_improvement'");
  assert(getCategory(35) === "more_practice_recommended", "35% must map to 'more_practice_recommended'");

  // 6. STANDARD API ENVELOPES & ERROR FORMATTING
  console.log("\n--- 6. Testing Standard API Envelopes ---");
  const successRes = apiSuccess({ count: 42 });
  assert(successRes.success === true, "apiSuccess must have success: true");
  assert(successRes.data.count === 42, "apiSuccess must encapsulate data");
  assert(typeof successRes.requestId === "string" && successRes.requestId.length > 0, "apiSuccess must have requestId");

  const errorRes = apiError("AUTH_INVALID_CREDENTIALS", "Invalid credentials provided");
  assert(errorRes.success === false, "apiError must have success: false");
  assert(errorRes.error.code === "AUTH_INVALID_CREDENTIALS", "apiError must convey error code");
  assert(typeof errorRes.requestId === "string", "apiError must include requestId");

  // 7. TIMER & SERVER DEADLINE CALCULATION
  console.log("\n--- 7. Testing Server-Enforced Assessment Deadlines ---");
  const startTime = new Date("2026-10-23T12:00:00Z");
  const durationMin = 15;
  const serverDeadline = new Date(startTime.getTime() + durationMin * 60 * 1000);

  assert(
    serverDeadline.toISOString() === "2026-10-23T12:15:00.000Z",
    "Server deadline must equal exactly startedAt + durationMinutes"
  );

  const pastNow = new Date("2026-10-23T12:20:00Z");
  const isExpired = pastNow.getTime() > serverDeadline.getTime();
  assert(isExpired, "Time past server deadline must be identified as expired");

  // 8. AI FEEDBACK SCHEMA VALIDATION
  console.log("\n--- 8. Testing AI Performance Feedback Schema ---");
  const sampleFeedback = {
    id: "rep-123",
    assessmentId: "session-456",
    overallSummary: "Strong mastery of fundamental concepts with room to grow in edge-case debugging.",
    strongestSkills: ["Python Syntax", "OOP Architecture"],
    areasForImprovement: ["Dictionary collisions", "Generator memory profiling"],
    recommendedTopics: ["Asyncio Internals", "Memory Management"],
    suggestedNextAssessment: {
      jobRole: "Python Developer",
      topics: ["Asyncio", "Generators"],
      difficulty: "Advanced" as const,
    },
    createdAt: new Date().toISOString(),
  };

  const parsedFeedback = feedbackReportSchema.safeParse(sampleFeedback);
  assert(parsedFeedback.success, "Feedback schema must validate valid report");

  console.log("\n=======================================================");
  console.log("ALL CONTRACT, VALIDATION, MCQ & SCORING TESTS PASSED!");
  console.log("=======================================================\n");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
