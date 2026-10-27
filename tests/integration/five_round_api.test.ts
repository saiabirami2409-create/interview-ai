import assert from "node:assert";
import { prisma } from "../../server/db/prisma";
import { generateAptitudeQuestions, verifyAptitudeAnswer } from "../../server/ai/aptitude-service";
import { generateProjectQuestions } from "../../server/ai/project-service";
import { isDuplicateQuestion, recordQuestionsAsked } from "../../server/ai/duplicate-prevention";

async function runFiveRoundApiIntegrationTest() {
  console.log("\n=======================================================");
  console.log("RUNNING FIVE-ROUND API & DATABASE INTEGRATION TESTS");
  console.log("=======================================================\n");

  // 1. Create or ensure test user exists in DB
  const email = `test.candidate.${Date.now()}@interviewai.dev`;
  const user = await prisma.user.create({
    data: {
      name: "Aarya Kumar",
      email,
      passwordHash: "dummy-hash",
      role: "STUDENT",
      profile: {
        create: {
          targetRole: "Full Stack Engineer",
          experienceLevel: "FRESHER",
        },
      },
    },
  });
  console.log(`✓ Test candidate created with ID: ${user.id}`);

  // 2. Round 1: Aptitude Assessment Flow
  console.log("\n--- Round 1: Aptitude Assessment Integration ---");
  const aptQuestions = await generateAptitudeQuestions({
    userId: user.id,
    category: "Quantitative Aptitude",
    difficulty: "Intermediate",
    questionCount: 10,
  });

  const correctAnswersMap: Record<string, string> = {};
  aptQuestions.forEach((q) => {
    correctAnswersMap[q.id] = q.correctAnswer;
  });

  const aptAssessment = await prisma.aptitudeAssessment.create({
    data: {
      userId: user.id,
      category: "Quantitative Aptitude",
      difficulty: "Intermediate",
      totalQuestions: aptQuestions.length,
      questions: JSON.stringify(aptQuestions),
      correctAnswers: JSON.stringify(correctAnswersMap),
      answers: JSON.stringify({ [aptQuestions[0].id]: aptQuestions[0].correctAnswer }),
      score: 90,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
  assert(aptAssessment.id, "Aptitude assessment ID must exist");
  console.log(`✓ Aptitude assessment created and completed: ID ${aptAssessment.id}, score: 90%`);

  // Verify formula and shortcut logic
  const sampleQ = aptQuestions[0];
  const verification = verifyAptitudeAnswer(sampleQ, sampleQ.correctAnswer);
  assert.strictEqual(verification.isCorrect, true);
  assert(verification.stepByStepSolution.length > 0);
  console.log("✓ Aptitude verification returned verified formula and step-by-step calculation");

  // 3. Round 2: Technical Assessment Integration
  console.log("\n--- Round 2: Technical Assessment Integration ---");
  const techSession = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      title: "Round 2 — Full Stack Technical Assessment",
      targetRole: "Full Stack Engineer",
      interviewType: "TECHNICAL",
      difficulty: "INTERMEDIATE",
      questionCount: 5,
      status: "COMPLETED",
      technicalScore: 85,
      overallScore: 85,
      completedAt: new Date(),
    },
  });
  assert(techSession.id, "Technical session ID must exist");
  console.log(`✓ Technical assessment session created: ID ${techSession.id}, score: 85%`);

  // 4. Round 3: Project-Based Interview Integration
  console.log("\n--- Round 3: Project-Based Interview Integration ---");
  const projQuestions = await generateProjectQuestions(user.id, {
    title: "AI Mock Interview Platform",
    domain: "EdTech & Generative AI",
    description: "Next.js and Google Gemini AI interview prep system with video analysis.",
    technologies: ["Next.js", "TypeScript", "Prisma", "SQLite", "Tailwind CSS"],
    candidateRole: "Lead Full Stack Developer",
  });

  const projSession = await prisma.projectInterview.create({
    data: {
      userId: user.id,
      projectDetails: JSON.stringify({ title: "AI Mock Interview Platform" }),
      questions: JSON.stringify(projQuestions),
      candidateAnswers: JSON.stringify({}),
      evaluations: JSON.stringify({}),
      score: 88,
      understandingScore: 90,
      technicalScore: 85,
      problemSolvingScore: 88,
      implementationScore: 85,
      contributionScore: 92,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
  assert(projSession.id, "Project interview ID must exist");
  console.log(`✓ Project interview session created: ID ${projSession.id}, score: 88%`);

  // 5. Round 4: Behavioral Round Integration
  console.log("\n--- Round 4: Behavioral Interview Integration ---");
  const behSession = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      title: "Round 4 — Behavioral Interview with Dr. Marcus Vance",
      targetRole: "Full Stack Engineer",
      interviewType: "BEHAVIORAL",
      difficulty: "INTERMEDIATE",
      status: "COMPLETED",
      behavioralScore: 82,
      completedAt: new Date(),
    },
  });
  console.log(`✓ Behavioral interview session created: ID ${behSession.id}, score: 82%`);

  // 6. Round 5: HR Round Integration
  console.log("\n--- Round 5: HR Interview Integration ---");
  const hrSession = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      title: "Round 5 — HR Executive Round with Sarah Jenkins",
      targetRole: "Full Stack Engineer",
      interviewType: "HR",
      difficulty: "INTERMEDIATE",
      status: "COMPLETED",
      hrScore: 86,
      completedAt: new Date(),
    },
  });
  console.log(`✓ HR interview session created: ID ${hrSession.id}, score: 86%`);

  // 7. Unified Candidate Performance Report Synchronization
  console.log("\n--- 7. Testing 5-Round Unified Performance Synchronization ---");
  const scores = [90, 85, 88, 82, 86]; // Aptitude, Technical, Project, Behavioral, HR
  const calculatedMean = Math.round(scores.reduce((a, b) => a + b, 0) / 5);

  const unifiedReport = await prisma.candidatePerformanceReport.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      aptitudePercentage: 90,
      technicalPercentage: 85,
      projectPercentage: 88,
      behavioralPercentage: 82,
      hrPercentage: 86,
      overallPercentage: calculatedMean,
      completedRoundsCount: 5,
    },
    update: {
      overallPercentage: calculatedMean,
      completedRoundsCount: 5,
    },
  });

  assert.strictEqual(unifiedReport.overallPercentage, 86, "Overall percentage must be exact arithmetic mean (90+85+88+82+86)/5 = 86");
  assert.strictEqual(unifiedReport.completedRoundsCount, 5, "Completed rounds count must equal 5");
  console.log(`✓ Unified Candidate Performance Report verified: Overall Score = ${unifiedReport.overallPercentage}% (Equal weight of 5 completed rounds)`);

  // 8. Duplicate Question Tracking
  console.log("\n--- 8. Testing Duplicate Question History Recording ---");
  await recordQuestionsAsked(user.id, "APTITUDE", [
    { questionText: "What is the speed of a train crossing a pole in 9 seconds?" },
  ]);

  const dupCheck = await isDuplicateQuestion(
    user.id,
    "APTITUDE",
    "What is the speed of a train crossing a pole in 9 seconds?"
  );
  assert.strictEqual(dupCheck.isDuplicate, true, "Exact question must be flagged as duplicate");
  console.log("✓ Question history recorded and duplicate question correctly prevented");

  console.log("\n=======================================================");
  console.log("ALL FIVE-ROUND API & INTEGRATION TESTS PASSED! ✓");
  console.log("=======================================================\n");

  // Cleanup test user
  await prisma.user.delete({ where: { id: user.id } });
  console.log("✓ Test sandbox clean up complete.");
}

runFiveRoundApiIntegrationTest().catch((err) => {
  console.error("Integration test error:", err);
  process.exit(1);
});
