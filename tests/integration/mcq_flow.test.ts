import { prisma } from "../../server/db/prisma";
import { getAIProvider } from "../../server/ai/provider";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runIntegrationTest() {
  console.log("Starting End-to-End MCQ Technical Round Integration Verification...\n");

  // 1. Fetch or create test user
  let user = await prisma.user.findUnique({
    where: { email: "aarya.kumar@example.com" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "aarya.kumar@example.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        name: "Aarya Kumar",
        profile: {
          create: {
            targetRole: "Full-Stack Developer",
          },
        },
      },
    });
  }
  assert(!!user, "Test candidate user verified");

  // 2. Generate questions for TECHNICAL round
  const aiProvider = getAIProvider();
  const generatedQuestions = await aiProvider.generateQuestions({
    targetRole: "Full-Stack Developer",
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    questionCount: 3,
    focusArea: "High-Concurrency Systems",
  });

  assert(generatedQuestions.length === 3, `Expected 3 generated questions, got ${generatedQuestions.length}`);
  assert(generatedQuestions[0].isMcq === true, "Question 1 must have isMcq === true");
  assert(Array.isArray(generatedQuestions[0].options) && generatedQuestions[0].options.length === 4, "Question 1 must have exactly 4 options");
  assert(typeof generatedQuestions[0].correctOptionIndex === "number", "Question 1 must have numeric correctOptionIndex");
  assert(typeof generatedQuestions[0].explanation === "string" && generatedQuestions[0].explanation.length > 20, "Question 1 must have detailed explanation");

  // 3. Create InterviewSession in database
  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      title: "Full-Stack Developer — Technical MCQ Mock Round",
      targetRole: "Full-Stack Developer",
      interviewType: "TECHNICAL",
      difficulty: "INTERMEDIATE",
      questionCount: generatedQuestions.length,
      timeLimitMinutes: 30,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      questions: {
        create: generatedQuestions.map((q) => {
          const expectedCriteria = JSON.stringify({
            isMcq: true,
            options: q.options || [],
            correctOptionIndex: q.correctOptionIndex ?? 0,
            explanation: q.explanation || "",
            criteriaText: q.expectedCriteria || "",
          });
          return {
            orderIndex: q.orderIndex,
            questionText: q.questionText,
            category: q.category,
            difficulty: q.difficulty,
            relevantSkills: JSON.stringify(q.relevantSkills || []),
            expectedCriteria,
            hints: q.hints || null,
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

  assert(!!session.id, `Session created with ID: ${session.id}`);
  assert(session.questions.length === 3, "Database stored 3 questions");

  // 4. Simulate GET /api/interviews/[id] anti-cheating check on unanswered questions
  for (const q of session.questions) {
    const parsedCriteria = JSON.parse(q.expectedCriteria);
    assert(parsedCriteria.isMcq === true, "Stored question has isMcq: true");
    assert(parsedCriteria.options.length === 4, "Stored question has 4 options");
  }
  console.log("✓ Anti-cheating data structure validated in database");

  // 5. Answer Question 1 correctly
  const q1 = session.questions[0];
  const q1Criteria = JSON.parse(q1.expectedCriteria);
  const correctOptionIdx = q1Criteria.correctOptionIndex;

  const q1Answer = await prisma.interviewAnswer.create({
    data: {
      questionId: q1.id,
      answerText: JSON.stringify({
        selectedOptionIndex: correctOptionIdx,
        optionLetter: String.fromCharCode(65 + correctOptionIdx),
        optionText: q1Criteria.options[correctOptionIdx],
        isCorrect: true,
        correctOptionIndex: correctOptionIdx,
        explanation: q1Criteria.explanation,
      }),
      timeSpentSec: 35,
      isSkipped: false,
    },
  });

  const q1Eval = await aiProvider.evaluateAnswer({
    questionText: q1.questionText,
    category: q1.category,
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    expectedCriteria: q1.expectedCriteria,
    answerText: q1Answer.answerText,
    timeSpentSec: 35,
    selectedOptionIndex: correctOptionIdx,
  });

  await prisma.answerEvaluation.create({
    data: {
      answerId: q1Answer.id,
      relevanceScore: q1Eval.relevanceScore,
      technicalScore: q1Eval.technicalScore,
      completenessScore: q1Eval.completenessScore,
      communicationScore: q1Eval.communicationScore,
      reasoningScore: q1Eval.reasoningScore,
      overallScore: q1Eval.overallScore,
      strengths: JSON.stringify(q1Eval.strengths),
      weaknesses: JSON.stringify(q1Eval.weaknesses),
      missingConcepts: JSON.stringify(q1Eval.missingConcepts),
      improvementSuggestions: JSON.stringify(q1Eval.improvementSuggestions),
      modelAnswerOutline: q1Eval.modelAnswerOutline,
      recommendedTopics: JSON.stringify(q1Eval.recommendedTopics),
    },
  });

  assert(q1Eval.overallScore === 100, `Question 1 correct answer scored 100, got ${q1Eval.overallScore}`);
  assert(q1Eval.technicalScore === 100, "Question 1 technical score is 100");

  // 6. Answer Question 2 incorrectly
  const q2 = session.questions[1];
  const q2Criteria = JSON.parse(q2.expectedCriteria);
  const wrongOptionIdx = (q2Criteria.correctOptionIndex + 1) % 4;

  const q2Answer = await prisma.interviewAnswer.create({
    data: {
      questionId: q2.id,
      answerText: JSON.stringify({
        selectedOptionIndex: wrongOptionIdx,
        optionLetter: String.fromCharCode(65 + wrongOptionIdx),
        optionText: q2Criteria.options[wrongOptionIdx],
        isCorrect: false,
        correctOptionIndex: q2Criteria.correctOptionIndex,
        explanation: q2Criteria.explanation,
      }),
      timeSpentSec: 48,
      isSkipped: false,
    },
  });

  const q2Eval = await aiProvider.evaluateAnswer({
    questionText: q2.questionText,
    category: q2.category,
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    expectedCriteria: q2.expectedCriteria,
    answerText: q2Answer.answerText,
    timeSpentSec: 48,
    selectedOptionIndex: wrongOptionIdx,
  });

  await prisma.answerEvaluation.create({
    data: {
      answerId: q2Answer.id,
      relevanceScore: q2Eval.relevanceScore,
      technicalScore: q2Eval.technicalScore,
      completenessScore: q2Eval.completenessScore,
      communicationScore: q2Eval.communicationScore,
      reasoningScore: q2Eval.reasoningScore,
      overallScore: q2Eval.overallScore,
      strengths: JSON.stringify(q2Eval.strengths),
      weaknesses: JSON.stringify(q2Eval.weaknesses),
      missingConcepts: JSON.stringify(q2Eval.missingConcepts),
      improvementSuggestions: JSON.stringify(q2Eval.improvementSuggestions),
      modelAnswerOutline: q2Eval.modelAnswerOutline,
      recommendedTopics: JSON.stringify(q2Eval.recommendedTopics),
    },
  });

  assert(q2Eval.overallScore < 50, `Question 2 incorrect answer score < 50, got ${q2Eval.overallScore}`);
  assert(q2Eval.weaknesses[0].includes("instead of"), "Question 2 weakness details selected vs optimal option");

  // 7. Answer Question 3 correctly
  const q3 = session.questions[2];
  const q3Criteria = JSON.parse(q3.expectedCriteria);
  const q3CorrectIdx = q3Criteria.correctOptionIndex;

  const q3Answer = await prisma.interviewAnswer.create({
    data: {
      questionId: q3.id,
      answerText: JSON.stringify({
        selectedOptionIndex: q3CorrectIdx,
        optionLetter: String.fromCharCode(65 + q3CorrectIdx),
        optionText: q3Criteria.options[q3CorrectIdx],
        isCorrect: true,
        correctOptionIndex: q3CorrectIdx,
        explanation: q3Criteria.explanation,
      }),
      timeSpentSec: 30,
      isSkipped: false,
    },
  });

  const q3Eval = await aiProvider.evaluateAnswer({
    questionText: q3.questionText,
    category: q3.category,
    interviewType: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    expectedCriteria: q3.expectedCriteria,
    answerText: q3Answer.answerText,
    timeSpentSec: 30,
    selectedOptionIndex: q3CorrectIdx,
  });

  await prisma.answerEvaluation.create({
    data: {
      answerId: q3Answer.id,
      relevanceScore: q3Eval.relevanceScore,
      technicalScore: q3Eval.technicalScore,
      completenessScore: q3Eval.completenessScore,
      communicationScore: q3Eval.communicationScore,
      reasoningScore: q3Eval.reasoningScore,
      overallScore: q3Eval.overallScore,
      strengths: JSON.stringify(q3Eval.strengths),
      weaknesses: JSON.stringify(q3Eval.weaknesses),
      missingConcepts: JSON.stringify(q3Eval.missingConcepts),
      improvementSuggestions: JSON.stringify(q3Eval.improvementSuggestions),
      modelAnswerOutline: q3Eval.modelAnswerOutline,
      recommendedTopics: JSON.stringify(q3Eval.recommendedTopics),
    },
  });

  assert(q3Eval.overallScore === 100, `Question 3 correct answer scored 100, got ${q3Eval.overallScore}`);

  // 8. Generate and save Session Report
  const allEvaluations = [q1Eval, q2Eval, q3Eval];
  const reportData = await aiProvider.generateSessionReport({
    targetRole: "Full-Stack Developer",
    interviewType: "TECHNICAL",
    evaluations: allEvaluations,
  });

  const savedReport = await prisma.interviewReport.create({
    data: {
      sessionId: session.id,
      overallScore: reportData.overallScore,
      technicalScore: reportData.technicalScore,
      communicationScore: reportData.communicationScore,
      relevanceScore: reportData.relevanceScore,
      completenessScore: reportData.completenessScore,
      readinessLevel: reportData.readinessLevel,
      readinessSummary: reportData.readinessSummary,
      topStrengths: JSON.stringify(reportData.topStrengths),
      criticalWeaknesses: JSON.stringify(reportData.criticalWeaknesses),
      keyRecommendations: JSON.stringify(reportData.keyRecommendations),
      suggestedNextRole: reportData.suggestedNextRole,
    },
  });

  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  assert(savedReport.overallScore > 0, `Report generated with overallScore: ${savedReport.overallScore}`);
  assert(savedReport.readinessLevel.length > 0, `Report readinessLevel: ${savedReport.readinessLevel}`);

  // 9. Verify History and Analytics integration
  const completedSessions = await prisma.interviewSession.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    include: { report: true },
  });

  assert(completedSessions.some((s) => s.id === session.id), "Session successfully archived in candidate history");
  const completedSession = completedSessions.find((s) => s.id === session.id);
  assert(completedSession?.report?.overallScore === savedReport.overallScore, "Archived session report score matches generated report");

  console.log("\n✓ All End-to-End MCQ Integration Tests Passed Successfully!");
}

runIntegrationTest()
  .catch((err) => {
    console.error("Integration Test Failure:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
