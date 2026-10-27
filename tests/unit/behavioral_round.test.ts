import { evaluateBehavioralAnswer } from "../../server/ai/behavioral-evaluator";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runBehavioralTests() {
  console.log("Running Unit Tests: Behavioral Round Evaluator & Ethical AI Rules...\n");

  // Test 1: Full STAR Response Evaluation
  const starAnswer = `
    In my previous role at Acme Corp, our production payment service was experiencing intermittent timeouts during peak traffic (Situation).
    My objective as lead engineer was to identify the bottleneck and restore latency under 200ms without service disruption (Task).
    I led a root cause investigation, identified unindexed database queries, implemented Redis caching for idempotency keys, and rolled out connection pooling in staging before production deploy (Action).
    As a result, payment latency dropped by 65%, error rates fell to 0.01%, and we successfully handled Black Friday with zero downtime (Result).
  `;

  const evalResult = await evaluateBehavioralAnswer({
    questionText: "Tell me about a time you resolved a critical technical challenge under tight deadlines.",
    transcript: starAnswer,
    durationSeconds: 75,
    role: "Software Engineer",
    isTextOnly: false,
  });

  // Verify STAR scores and structure on evalResult.content
  assert(evalResult.content.structureScore >= 70, `Expected strong STAR structureScore >= 70, got ${evalResult.content.structureScore}`);
  assert(evalResult.content.relevanceScore >= 80, `Expected relevance score >= 80, got ${evalResult.content.relevanceScore}`);
  assert(evalResult.content.overallContentScore >= 70, `Expected overall content score >= 70, got ${evalResult.content.overallContentScore}`);

  // Verify all 4 STAR pillars are populated with feedback
  assert(evalResult.content.starBreakdown.situation.present, "Situation should be detected as present");
  assert(evalResult.content.starBreakdown.task.present, "Task should be detected as present");
  assert(evalResult.content.starBreakdown.action.present, "Action should be detected as present");
  assert(evalResult.content.starBreakdown.result.present, "Result should be detected as present");

  // Test 2: Pacing & Words Per Minute (WPM)
  // ~70 words in 75 seconds = ~56 WPM -> deliberate (<110)
  assert(
    evalResult.content.pacing.estimatedWpm > 0,
    `WPM should be greater than 0, got ${evalResult.content.pacing.estimatedWpm}`
  );
  assert(
    evalResult.content.pacing.pacingCategory === "deliberate" || evalResult.content.pacing.pacingCategory === "optimal",
    `Pacing should be categorized, got ${evalResult.content.pacing.pacingCategory}`
  );

  // Test 3: Optimal Pacing Scenario (135 words in 60s)
  const optimalWords = new Array(135).fill("word").join(" ");
  const optimalEval = await evaluateBehavioralAnswer({
    questionText: "Describe a project you delivered.",
    transcript: optimalWords,
    durationSeconds: 60,
  });
  assert(
    optimalEval.content.pacing.estimatedWpm === 135,
    `Expected 135 WPM, got ${optimalEval.content.pacing.estimatedWpm}`
  );
  assert(
    optimalEval.content.pacing.pacingCategory === "optimal",
    `Expected 'optimal' pacing for 135 WPM, got ${optimalEval.content.pacing.pacingCategory}`
  );

  // Test 4: Rushed Pacing Scenario (190 words in 60s)
  const rushedWords = new Array(190).fill("fast").join(" ");
  const rushedEval = await evaluateBehavioralAnswer({
    questionText: "Describe a conflict you resolved.",
    transcript: rushedWords,
    durationSeconds: 60,
  });
  assert(
    rushedEval.content.pacing.pacingCategory === "rushed",
    `Expected 'rushed' pacing for 190 WPM, got ${rushedEval.content.pacing.pacingCategory}`
  );

  // Test 5: Ethical AI Separation Rule
  // Presentation observations MUST NOT alter the candidate's core content score.
  assert(
    evalResult.presentationTips !== undefined,
    "Presentation feedback must be present"
  );
  assert(
    evalResult.presentationTips.disclaimer.includes("strictly separate"),
    "Ethical AI disclaimer must explicitly state presentation tips are strictly separate from content score"
  );
  assert(
    Array.isArray(evalResult.presentationTips.timestampedCues),
    "Timestamped suggestions must be an array"
  );
  assert(
    evalResult.presentationTips.timestampedCues.length > 0,
    "At least one timestamped suggestion should be generated"
  );

  // Test 6: Model STAR Answer & Practical Suggestions
  assert(
    evalResult.content.modelStarAnswer.length > 50,
    "Model STAR answer should provide an articulate example"
  );
  assert(
    evalResult.content.keyStrengths.length > 0,
    "Strengths array should contain positive observations"
  );
  assert(
    evalResult.content.areasForImprovement.length > 0,
    "Improvements array should contain actionable guidance"
  );

  // Test 7: Accessible Text-Only Alternative
  const textOnlyEval = await evaluateBehavioralAnswer({
    questionText: "Tell me about a time you led a team through ambiguity.",
    transcript: "In my last team (Situation), we had to pivot without clear specs (Task). I established daily syncs and iterative PRs (Action). We shipped 2 weeks early with high quality (Result).",
    durationSeconds: 45,
    isTextOnly: true,
  });
  assert(
    textOnlyEval.presentationTips.cameraAttentiveness.status === "not_applicable",
    "Camera attentiveness should be 'not_applicable' for text-only mode"
  );
  assert(
    textOnlyEval.content.overallContentScore >= 70,
    `Text-only submissions must receive full content evaluation, got ${textOnlyEval.content.overallContentScore}`
  );

  console.log("\nAll Behavioral Evaluator Unit Tests Passed Successfully!");
}

runBehavioralTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
