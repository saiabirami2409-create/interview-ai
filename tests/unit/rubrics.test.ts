import { calculateWeightedOverallScore, determineReadinessLevel, RUBRIC_WEIGHTS } from "../../server/ai/rubrics";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

console.log("Running Unit Tests: Rubric Calculations & Normalization...");

// Test 1: Rubric Weights sum to 1.0 for each round type
for (const type of ["TECHNICAL", "HR", "BEHAVIORAL", "PROJECT_BASED"] as const) {
  const w = RUBRIC_WEIGHTS[type];
  const sum = Math.round((w.relevance + w.technical + w.completeness + w.communication + w.reasoning) * 100) / 100;
  assert(sum === 1.0, `Rubric weights for ${type} must sum to 1.0 (got ${sum})`);
}

// Test 2: Calculate Weighted Score for Technical Round
const techScores = {
  relevance: 90,     // 20% -> 18
  technical: 80,     // 35% -> 28
  completeness: 70,  // 20% -> 14
  communication: 80, // 15% -> 12
  reasoning: 80,     // 10% -> 8
};
// Expected: 18 + 28 + 14 + 12 + 8 = 80
const overall = calculateWeightedOverallScore(techScores, "TECHNICAL");
assert(overall === 80, `Expected weighted overall score to be 80, got ${overall}`);

// Test 3: Calculate Weighted Score for Behavioral Round (STAR emphasis)
const behavioralScores = {
  relevance: 90,     // 20% -> 18
  technical: 70,     // 15% -> 10.5
  completeness: 80,  // 20% -> 16
  communication: 90, // 30% -> 27
  reasoning: 80,     // 15% -> 12
};
// Expected: 18 + 10.5 + 16 + 27 + 12 = 83.5 -> Math.round -> 84
const behavioralOverall = calculateWeightedOverallScore(behavioralScores, "BEHAVIORAL");
assert(behavioralOverall === 84, `Expected behavioral overall score to be 84, got ${behavioralOverall}`);

// Test 4: Readiness Level Categorization
const r1 = determineReadinessLevel(90);
assert(r1.level === "Placement Ready", `Expected 90 to be 'Placement Ready', got ${r1.level}`);

const r2 = determineReadinessLevel(75);
assert(r2.level === "Developing Placement Competence", `Expected 75 to be 'Developing Placement Competence', got ${r2.level}`);

const r3 = determineReadinessLevel(55);
assert(r3.level === "Foundational Practice Required", `Expected 55 to be 'Foundational Practice Required', got ${r3.level}`);

const r4 = determineReadinessLevel(40);
assert(r4.level === "Early Preparation Stage", `Expected 40 to be 'Early Preparation Stage', got ${r4.level}`);

console.log("\nAll Rubric Unit Tests Passed Successfully!");
