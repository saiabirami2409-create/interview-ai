import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding InterviewAI development database...");

  // Clean existing records
  await prisma.auditEvent.deleteMany({});
  await prisma.topicProgress.deleteMany({});
  await prisma.preparationTopic.deleteMany({});
  await prisma.interviewReport.deleteMany({});
  await prisma.answerEvaluation.deleteMany({});
  await prisma.interviewAnswer.deleteMany({});
  await prisma.interviewQuestion.deleteMany({});
  await prisma.interviewSession.deleteMany({});
  await prisma.resume.deleteMany({});
  await prisma.studentSkill.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Demo Student User: Aarya Kumar
  const user = await prisma.user.create({
    data: {
      email: "aarya.kumar@example.com",
      name: "Aarya Kumar",
      passwordHash,
      role: "STUDENT",
      profile: {
        create: {
          college: "National Institute of Technology",
          degree: "B.Tech Computer Science and Engineering",
          graduationYear: 2025,
          targetRole: "Full-Stack Developer",
          experienceLevel: "FRESHER",
          targetCompanies: "Google, Microsoft, Razorpay, Atlassian",
          bio: "Final year CS student passionate about distributed systems, React performance, and scalable API architecture.",
          skills: {
            create: [
              { skillName: "TypeScript", proficiency: 85 },
              { skillName: "React", proficiency: 90 },
              { skillName: "Node.js", proficiency: 80 },
              { skillName: "SQL & PostgreSQL", proficiency: 70 },
              { skillName: "System Design", proficiency: 65 },
            ],
          },
        },
      },
    },
    include: { profile: true },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // 2. Create Sample Resume
  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      fileName: "Aarya_Kumar_Resume_2025.pdf",
      fileSize: 245000,
      fileType: "application/pdf",
      storagePath: "resumes/aarya_kumar_resume.pdf",
      extractedText: "Aarya Kumar. Full-Stack Developer. Skills: React, Next.js, Node.js, TypeScript, PostgreSQL, Redis, Docker. Projects: DevSpace Collaboration Platform with WebSockets, Real-time E-Commerce Analytics Engine.",
      extractedSkills: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Next.js", "Redis", "Docker", "REST APIs"]),
      isPrimary: true,
    },
  });

  // 3. Create Preparation Topics
  const topicsData = [
    {
      title: "SQL Indexing & Query Optimization",
      category: "Database Engineering",
      description: "Understanding B-Tree vs Hash indexes, composite indexes, EXPLAIN query plans, and index scan vs sequential scan.",
      difficulty: "INTERMEDIATE",
      keyPoints: JSON.stringify([
        "B-Tree index structure and logarithmic lookup complexity",
        "When to use composite indexes and the leftmost prefix rule",
        "Index maintenance overhead on heavy INSERT/UPDATE workloads",
      ]),
    },
    {
      title: "React Component Lifecycle & Performance",
      category: "Frontend Architecture",
      description: "Deep dive into virtual DOM diffing, useMemo/useCallback memoization traps, and server components vs client components.",
      difficulty: "BEGINNER",
      keyPoints: JSON.stringify([
        "Reconciliation algorithm and the importance of unique keys",
        "Preventing unnecessary re-renders with React.memo",
        "Server Components streaming architecture",
      ]),
    },
    {
      title: "Time & Space Complexity in Graph Traversals",
      category: "Data Structures & Algorithms",
      description: "Analyzing BFS and DFS algorithmic complexity, recursion stack boundaries, and shortest path trade-offs.",
      difficulty: "ADVANCED",
      keyPoints: JSON.stringify([
        "O(V + E) complexity analysis for adjacency list representation",
        "Breadth-first search queue memory consumption",
        "Cycle detection in directed vs undirected graphs",
      ]),
    },
    {
      title: "STAR Behavioral Communication",
      category: "Behavioral & HR",
      description: "Structuring answers using Situation, Task, Action, and Result to convey leadership, conflict resolution, and technical ownership.",
      difficulty: "BEGINNER",
      keyPoints: JSON.stringify([
        "Clear demarcation of personal actions vs team efforts",
        "Focusing on quantifiable metrics and business impact",
        "Reflecting on trade-offs and retrospective learnings",
      ]),
    },
  ];

  for (const topic of topicsData) {
    const createdTopic = await prisma.preparationTopic.create({ data: topic });

    // Link topic progress for Aarya Kumar
    await prisma.topicProgress.create({
      data: {
        userId: user.id,
        topicId: createdTopic.id,
        priority: topic.title.includes("SQL") ? "HIGH" : "MEDIUM",
        mastery: topic.title.includes("React") ? 85 : topic.title.includes("SQL") ? 45 : 60,
        sessionsHad: topic.title.includes("SQL") ? 2 : 1,
      },
    });
  }

  // 4. Create Completed Interview Session with Evaluation & Report
  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      resumeId: resume.id,
      title: "Full-Stack Software Engineer Placement Mock",
      targetRole: "Full-Stack Developer",
      companyName: "Campus Placement Hiring Drive",
      jobDescription: "Looking for an engineer proficient in modern TypeScript, React, Node.js, and relational databases. Must possess strong problem-solving skills, API design intuition, and clear communication.",
      interviewType: "TECHNICAL",
      difficulty: "INTERMEDIATE",
      questionCount: 3,
      timeLimitMinutes: 25,
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      completedAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
  });

  // Question 1: React Component Composition & State
  const q1 = await prisma.interviewQuestion.create({
    data: {
      sessionId: session.id,
      orderIndex: 1,
      questionText: "How do you architect component state in a complex React dashboard to avoid unnecessary re-renders, and when would you favor composition over prop drilling?",
      category: "Frontend Architecture",
      difficulty: "INTERMEDIATE",
      relevantSkills: JSON.stringify(["React", "State Management", "Performance"]),
      expectedCriteria: "Candidate should explain component composition (children pattern), state lifting, context vs specialized stores, and render optimization using memoization.",
      hints: "Consider how slot-based composition decouples parent re-renders from child components.",
    },
  });

  const a1 = await prisma.interviewAnswer.create({
    data: {
      questionId: q1.id,
      answerText: "In a React dashboard, I keep state as close to where it's consumed as possible. For global state like user authentication, I use Context or a lightweight store. To avoid prop drilling without creating bloated global state, I use the component composition pattern by passing children or slots. When a component only renders children, its re-render does not cause children to re-render if their props have not changed. I also use useMemo for expensive chart transformations and useCallback for event handlers passed down.",
      timeSpentSec: 240,
      isSkipped: false,
    },
  });

  await prisma.answerEvaluation.create({
    data: {
      answerId: a1.id,
      relevanceScore: 92,
      technicalScore: 88,
      completenessScore: 82,
      communicationScore: 90,
      reasoningScore: 86,
      overallScore: 88,
      strengths: JSON.stringify([
        "Clear explanation of component composition via children pattern",
        "Accurate distinction between local state and global context",
        "Mention of render decoupling and useMemo for heavy chart calculations",
      ]),
      weaknesses: JSON.stringify([
        "Did not discuss React 18/19 concurrent features or useTransition for non-urgent dashboard filtering",
      ]),
      missingConcepts: JSON.stringify([
        "useTransition hook",
        "Server Components for data-heavy dashboard widgets",
      ]),
      improvementSuggestions: JSON.stringify([
        "Mention how React Server Components (RSC) offload initial data fetching from client state entirely.",
      ]),
      modelAnswerOutline: "A 95+ answer clearly outlines 3 layers: 1) State colocation and URL-based state (searchParams) for shareable filters, 2) Composition via slots/children to prevent intermediate re-renders, and 3) Selective memoization combined with concurrent transitions (useTransition) for fluid typing experience.",
      recommendedTopics: JSON.stringify(["React Component Lifecycle & Performance"]),
    },
  });

  // Question 2: SQL Query Optimization
  const q2 = await prisma.interviewQuestion.create({
    data: {
      sessionId: session.id,
      orderIndex: 2,
      questionText: "Suppose you have a table with 10 million interview records. A query filtering by 'target_role' and sorting by 'created_at DESC' is taking 4 seconds. How would you diagnose and optimize it?",
      category: "Database Engineering",
      difficulty: "INTERMEDIATE",
      relevantSkills: JSON.stringify(["SQL", "PostgreSQL", "Database Indexing", "Performance"]),
      expectedCriteria: "Candidate should run EXPLAIN ANALYZE, identify sequential scan or filesort, propose a composite index on (target_role, created_at DESC), and discuss index coverage.",
      hints: "Think about the order of columns in a multi-column B-Tree index.",
    },
  });

  const a2 = await prisma.interviewAnswer.create({
    data: {
      questionId: q2.id,
      answerText: "First, I would run EXPLAIN ANALYZE on the query to see the execution plan. It is likely performing a sequential scan and an expensive in-memory or on-disk sort. To optimize it, I would create an index on target_role. That should speed up the WHERE clause.",
      timeSpentSec: 180,
      isSkipped: false,
    },
  });

  await prisma.answerEvaluation.create({
    data: {
      answerId: a2.id,
      relevanceScore: 78,
      technicalScore: 65,
      completenessScore: 60,
      communicationScore: 75,
      reasoningScore: 70,
      overallScore: 68,
      strengths: JSON.stringify([
        "Correctly recognized the need for EXPLAIN ANALYZE to inspect query plan",
        "Identified sequential scan as the root latency cause",
      ]),
      weaknesses: JSON.stringify([
        "Proposed a single-column index on target_role, which still leaves a costly sort on created_at",
        "Omitted composite index order (target_role, created_at DESC)",
        "Did not discuss index scan vs bitmap index scan or LIMIT pagination implications",
      ]),
      missingConcepts: JSON.stringify([
        "Composite index (target_role, created_at DESC)",
        "Elimination of file-sort (Sort operation in EXPLAIN plan)",
        "Covering index or index-only scan",
      ]),
      improvementSuggestions: JSON.stringify([
        "Always specify composite indexes for combined filter + sort workloads. Putting created_at DESC in the index allows the engine to read pre-ordered rows directly.",
      ]),
      modelAnswerOutline: "1) Run EXPLAIN (ANALYZE, BUFFERS) to confirm Seq Scan and external sort. 2) Create a composite B-Tree index: CREATE INDEX idx_interviews_role_created ON interviews(target_role, created_at DESC). 3) Verify the execution plan switches from Seq Scan + Sort to Index Scan with Zero Sort cost. 4) Consider keyset pagination instead of OFFSET for high page numbers.",
      recommendedTopics: JSON.stringify(["SQL Indexing & Query Optimization"]),
    },
  });

  // Question 3: Behavioral STAR Ownership
  const q3 = await prisma.interviewQuestion.create({
    data: {
      sessionId: session.id,
      orderIndex: 3,
      questionText: "Tell me about a time when a critical bug occurred in a project right before a deadline. How did you diagnose it, handle team communication, and resolve it?",
      category: "Behavioral & STAR",
      difficulty: "INTERMEDIATE",
      relevantSkills: JSON.stringify(["Communication", "Problem Solving", "STAR Method", "Ownership"]),
      expectedCriteria: "Candidate should follow STAR structure: clearly define the Situation and urgency, their specific Task, the investigative and remedial Action taken, and the quantifiable Result.",
      hints: "Highlight your individual analytical contribution and how you stabilized communication.",
    },
  });

  const a3 = await prisma.interviewAnswer.create({
    data: {
      questionId: q3.id,
      answerText: "During our final semester capstone project 24 hours before demonstration, our WebSocket chat service crashed under simulated traffic. My task was to stabilize the connection. I checked the server logs and discovered an unhandled Promise rejection when users disconnected abruptly without sending an exit heartbeat. I implemented a cleanup hook and rate-limited reconnection attempts with exponential backoff. The service recovered, sustained 500 concurrent connections during the demo, and our team scored an A grade.",
      timeSpentSec: 210,
      isSkipped: false,
    },
  });

  await prisma.answerEvaluation.create({
    data: {
      answerId: a3.id,
      relevanceScore: 94,
      technicalScore: 82,
      completenessScore: 86,
      communicationScore: 88,
      reasoningScore: 85,
      overallScore: 87,
      strengths: JSON.stringify([
        "Clear STAR methodology with concrete Situation, Task, Action, and Result",
        "Specific technical diagnosis (unhandled Promise rejection + exponential backoff)",
        "Quantifiable outcome (sustained 500 concurrent connections, team achieved grade A)",
      ]),
      weaknesses: JSON.stringify([
        "Briefly mentioned team communication without explaining how stakeholders were updated during the outage",
      ]),
      missingConcepts: JSON.stringify([
        "Blameless post-mortem or automated regression test implementation",
      ]),
      improvementSuggestions: JSON.stringify([
        "Add a sentence detailing how you communicated the temporary degradation to your teammates and added a regression test to prevent recurrence.",
      ]),
      modelAnswerOutline: "Structure: S) Capstone 24h before demo with 500 simulated users dropping connections; T) Lead triage of WebSocket crash; A) Isolated uncaught rejection via server logs, added graceful cleanup handler, and set up Discord status channel for teammates; R) Zero crashes during live faculty presentation, followed by a regression test in CI.",
      recommendedTopics: JSON.stringify(["STAR Behavioral Communication"]),
    },
  });

  // 5. Generate Overall Report for the Session
  await prisma.interviewReport.create({
    data: {
      sessionId: session.id,
      overallScore: 81,
      technicalScore: 78,
      communicationScore: 85,
      relevanceScore: 88,
      completenessScore: 76,
      readinessLevel: "Placement Ready",
      readinessSummary: "Candidate demonstrates strong frontend architecture fundamentals, structured STAR behavioral articulation, and confident diagnostic reasoning. Secondary focus needed on composite database indexing and query plan analysis.",
      topStrengths: JSON.stringify([
        "Clear explanation of React component composition and state boundaries",
        "Confident STAR narrative delivery with concrete technical actions",
        "Accurate awareness of EXPLAIN ANALYZE for database query diagnosis",
      ]),
      criticalWeaknesses: JSON.stringify([
        "Composite indexing principles and index-assisted sorting",
        "Concurrency hooks in modern React frameworks",
      ]),
      keyRecommendations: JSON.stringify([
        "Complete practice drills on B-Tree composite index ordering (filter column + sort column).",
        "Review keystone pagination vs OFFSET/LIMIT for high-throughput tables.",
        "Practice trade-off defense for project architecture rounds.",
      ]),
      suggestedNextRole: "Full-Stack Software Engineer (Mid-Level)",
    },
  });

  // 6. Log an initial audit event
  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      action: "USER_SEED_INITIALIZED",
      details: "Seed script pre-populated demo student profile, resume, and completed interview.",
      ipAddress: "127.0.0.1",
    },
  });

  console.log("Database seeded successfully with student Aarya Kumar and realistic interview session data!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
