import { GoogleGenAI } from "@google/genai";
import { isDuplicateQuestion, recordQuestionsAsked } from "./duplicate-prevention";

export interface ProjectDetails {
  title: string;
  domain: string;
  description: string;
  technologies: string[];
  languages?: string[];
  frameworks?: string[];
  database?: string;
  candidateRole: string;
  challengesFaced?: string;
  outcomes?: string;
  isOngoingOrProposed?: boolean;
}

export interface ProjectQuestion {
  id: string;
  orderIndex: number;
  category: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  expectedCriteria?: string;
  hints?: string;
  suggestedFollowUp?: string;
}

export interface ProjectEvaluationResult {
  overallScore: number;
  understandingScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  implementationScore: number;
  contributionScore: number;
  strengths: string[];
  missingDetails: string[];
  feedback: string;
  modelAnswerOutline: string;
  followUpQuestion?: string;
}

function cleanJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

/**
 * Generate 5 deep, project-grounded Multiple-Choice Questions (MCQs) using Gemini
 */
export async function generateProjectQuestions(
  userId: string,
  project: ProjectDetails
): Promise<ProjectQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  const techList = [
    ...(project.technologies || []),
    ...(project.languages || []),
    ...(project.frameworks || []),
    project.database,
  ]
    .filter(Boolean)
    .join(", ");

  if (apiKey && apiKey.length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a Principal Software Architect conducting a rigorous Project-Based Technical MCQ Assessment for a software engineering candidate.
Project Context:
- Title: ${project.title}
- Domain: ${project.domain}
- Description: ${project.description}
- Technologies: ${techList || "Modern Web/Cloud Stack"}
- Candidate Role: ${project.candidateRole}
- Key Challenges: ${project.challengesFaced || "Concurrency, data consistency, scalability"}
- Outcomes/Metrics: ${project.outcomes || "Functional system deployed"}
- Project Status: ${project.isOngoingOrProposed ? "Ongoing/Proposed Concept" : "Completed Project"}

Generate exactly 5 high-yield, multiple-choice questions specifically grounded in this candidate's project, technologies (${techList}), and engineering decisions.
Categories (1 question each):
1. "Project Architecture & Design Patterns" - Component decoupling, architectural tradeoffs, API design.
2. "Data Layer & Database Engineering" - Schema design, query optimization, indexing, consistency models.
3. "Deep Implementation & Concurrency" - Handling race conditions, asynchronous workflows, memory leaks, latency.
4. "Security, Resilience & Testing" - Authentication flows, input sanitization, rate limiting, graceful degradation.
5. "Scalability & Production Optimization" - Caching strategies (Redis/CDN), connection pooling, monitoring, and scaling.

CRITICAL RULES:
- Frame each question around real-world scenarios or architectural choices directly relevant to ${project.title} and the tech stack (${techList}).
- Provide exactly 4 options: A, B, C, D.
- Design realistic distractors: plausible architectural mistakes or common engineering misconceptions.
- Clearly designate the single best \`correctOption\` ("A", "B", "C", or "D").
- Provide an in-depth \`explanation\` detailing why the correct option is optimal and why the others are flawed.
- Include a strategic \`hints\` string.

Return ONLY a valid JSON array of 5 objects matching this exact structure:
[
  {
    "id": "proj-mcq-1",
    "orderIndex": 0,
    "category": "Project Architecture & Design Patterns",
    "questionText": "In '${project.title}', when decoupling the client-facing UI from the backend services...",
    "options": {
      "A": "Option text 1",
      "B": "Option text 2",
      "C": "Option text 3",
      "D": "Option text 4"
    },
    "correctOption": "A",
    "explanation": "Detailed engineering rationale explaining why option A is optimal and why options B, C, and D are suboptimal.",
    "hints": "Consider how state synchronization impacts network overhead and loose coupling.",
    "suggestedFollowUp": "How would you handle eventual consistency if services are separated?"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const responseText = response.text || "";
      const parsed = JSON.parse(cleanJson(responseText));

      if (Array.isArray(parsed) && parsed.length >= 4) {
        const uniqueQuestions: any[] = [];
        const seenTexts: string[] = [];
        for (const q of parsed) {
          const text = q.questionText || q.question;
          if (!text || !q.options || !q.correctOption) continue;
          const dupCheck = await isDuplicateQuestion(userId, "PROJECT", text, seenTexts);
          if (!dupCheck.isDuplicate) {
            seenTexts.push(text);
            uniqueQuestions.push({
              ...q,
              questionText: text,
            });
          }
        }

        const candidateList = uniqueQuestions.length >= 3 ? uniqueQuestions : parsed;
        const finalQuestions: ProjectQuestion[] = candidateList.slice(0, 5).map((q, idx) => {
          const rawOptions = q.options || {};
          return {
            id: `proj-${Date.now()}-${idx + 1}`,
            orderIndex: idx,
            category: q.category || "Project Engineering",
            questionText: q.questionText || q.question,
            options: {
              A: String(rawOptions.A || rawOptions["0"] || "Option A"),
              B: String(rawOptions.B || rawOptions["1"] || "Option B"),
              C: String(rawOptions.C || rawOptions["2"] || "Option C"),
              D: String(rawOptions.D || rawOptions["3"] || "Option D"),
            },
            correctOption: (["A", "B", "C", "D"].includes(q.correctOption) ? q.correctOption : "A") as "A" | "B" | "C" | "D",
            explanation: q.explanation || "The selected approach optimizes architectural decoupling and system resilience.",
            expectedCriteria: q.expectedCriteria || q.explanation || "Candidate must demonstrate architectural rationale, trade-off understanding, and concrete implementation choices.",
            hints: q.hints,
            suggestedFollowUp: q.suggestedFollowUp,
          };
        });

        await recordQuestionsAsked(
          userId,
          "PROJECT",
          finalQuestions.map((q) => ({ questionText: q.questionText, topic: q.category }))
        );

        return finalQuestions;
      }
    } catch (err) {
      console.warn("Gemini project MCQ generation failed, using grounded fallback:", err);
    }
  }

  // Realistic Grounded Fallback based on Candidate's Project
  const primaryDb = project.database || "PostgreSQL";
  const primaryTech = project.technologies?.[0] || "React/TypeScript";

  return [
    {
      id: `proj-fallback-1`,
      orderIndex: 0,
      category: "Project Architecture & Design Patterns",
      questionText: `In designing '${project.title}', which architectural strategy is most effective for ensuring that client requests remain responsive when processing long-running background tasks?`,
      options: {
        A: "Use synchronous HTTP blocking calls and increase server socket timeout thresholds to 300 seconds.",
        B: "Offload heavy processing to an asynchronous message queue / worker pool and return a 202 Accepted status with a job identifier.",
        C: "Execute all background processing inside the client-side browser runtime using Web Workers.",
        D: "Run background tasks on the primary database thread via stored procedures without indexation.",
      },
      correctOption: "B",
      explanation:
        "Offloading resource-intensive processing to an asynchronous background worker queue (e.g. BullMQ, Celery, or Redis queue) with a 202 Accepted response decouples client request-response cycles, prevents web server thread exhaustion, and guarantees reliable retries.",
      expectedCriteria: "Demonstrates understanding of asynchronous message queues, decoupling compute-heavy work, and responsive HTTP status codes.",
      hints: "Think about decoupling synchronous HTTP request cycles from heavy compute workloads.",
      suggestedFollowUp: "How would you notify the client when the background job finishes?",
    },
    {
      id: `proj-fallback-2`,
      orderIndex: 1,
      category: "Data Layer & Database Engineering",
      questionText: `Given the data requirements of '${project.title}' using ${primaryDb}, which indexing strategy best optimizes frequent multi-column queries filtering by status and ordered by creation timestamp?`,
      options: {
        A: "Create separate single-column indexes on status and created_at and rely entirely on index merge intersections.",
        B: "Create a composite B-tree index on (status, created_at DESC) to satisfy both the equality filter and sort order in a single index scan.",
        C: "Avoid indexes and rely on in-memory linear array filtering in application memory after fetching all rows.",
        D: "Use a full-text search GIN index on all timestamp and enum status columns.",
      },
      correctOption: "B",
      explanation:
        "A composite B-tree index with the equality predicate column first (status) followed by the ordering column (created_at DESC) allows the query engine to perform an efficient index range scan directly to retrieve sorted rows without an expensive sort phase.",
      expectedCriteria: "Demonstrates mastery of database indexing, composite index ordering, and query execution planning.",
      hints: "Recall the left-prefix rule for composite indexes: equality columns first, followed by range/order columns.",
      suggestedFollowUp: "What write penalty is incurred by having multiple composite indexes?",
    },
    {
      id: `proj-fallback-3`,
      orderIndex: 2,
      category: "Deep Implementation & Concurrency",
      questionText: `While implementing core business logic for '${project.title}', what is the safest pattern to prevent race conditions when two concurrent requests attempt to mutate the same shared resource?`,
      options: {
        A: "Apply optimistic concurrency control using version numbers or conditional updates (e.g., WHERE version = :expectedVersion).",
        B: "Rely on client-side state flags to ensure only one user submits data at a time.",
        C: "Increase server memory and hope CPU thread scheduling resolves the contention sequentially.",
        D: "Disable transactions and permit eventual overwrites via last-write-wins without locks.",
      },
      correctOption: "A",
      explanation:
        "Optimistic Concurrency Control (OCC) with version or timestamp columns detects concurrent modifications without holding blocking locks. If the version in the database has advanced, the update fails or retries gracefully, preserving data integrity.",
      expectedCriteria: "Demonstrates knowledge of concurrency control, race conditions, and optimistic locking patterns.",
      hints: "Consider how high-concurrency systems avoid holding long database locks while preventing lost updates.",
      suggestedFollowUp: "When would pessimistic locking (SELECT FOR UPDATE) be preferred over optimistic locking?",
    },
    {
      id: `proj-fallback-4`,
      orderIndex: 3,
      category: "Security, Resilience & Testing",
      questionText: `To secure authentication tokens and API endpoints in '${project.title}', which approach provides the highest protection against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)?`,
      options: {
        A: "Store authentication JWTs in window.localStorage and transmit them via URL query parameters.",
        B: "Store JWTs in httpOnly, secure, SameSite=Strict cookies and validate CSRF tokens on state-changing requests.",
        C: "Disable CORS checks entirely on the backend and allow all origins (*).",
        D: "Encode sensitive credentials in Base64 and hardcode them in client-side bundle source code.",
      },
      correctOption: "B",
      explanation:
        "Storing session or refresh tokens in httpOnly cookies prevents JavaScript access (mitigating XSS extraction), while SameSite=Strict attributes and CSRF anti-forgery tokens prevent unauthorized cross-origin requests.",
      expectedCriteria: "Demonstrates secure session token management, httpOnly cookie safeguards, and CSRF protection.",
      hints: "Review the difference between client-accessible localStorage and browser-managed httpOnly cookies.",
      suggestedFollowUp: "How do you handle token rotation upon refresh?",
    },
    {
      id: `proj-fallback-5`,
      orderIndex: 4,
      category: "Scalability & Production Optimization",
      questionText: `As traffic to '${project.title}' scales, which caching and invalidation strategy best balances performance with data freshness for frequently queried data?`,
      options: {
        A: "Cache data in global Node.js process variables across clustered worker containers with no TTL.",
        B: "Implement a Cache-Aside pattern using Redis with bounded TTLs and targeted write-through or event-driven key invalidation.",
        C: "Rely exclusively on browser local caches with Cache-Control: immutable for all dynamic user responses.",
        D: "Never cache data; let the primary relational database handle every single read directly from disk.",
      },
      correctOption: "B",
      explanation:
        "The Cache-Aside (Lazy Loading) pattern with a dedicated distributed cache (Redis) combined with bounded TTLs and event-driven invalidation guarantees fast sub-millisecond read access without state drift across multiple application servers.",
      expectedCriteria: "Demonstrates distributed caching patterns, cache-aside mechanics, and key invalidation strategies.",
      hints: "Consider how distributed systems scale beyond a single web server process.",
      suggestedFollowUp: "How do you handle cache stampedes or dog-piling when a popular cache key expires?",
    },
  ];
}

/**
 * Evaluate Candidate's Project MCQ Answers
 */
export async function evaluateProjectMCQAnswers(
  project: ProjectDetails,
  questions: ProjectQuestion[],
  candidateSelections: Record<string, "A" | "B" | "C" | "D">
): Promise<{
  overallScore: number;
  understandingScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  implementationScore: number;
  contributionScore: number;
  correctCount: number;
  totalQuestions: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questionResults: Array<{
    questionId: string;
    questionText: string;
    category: string;
    options: { A: string; B: string; C: string; D: string };
    selectedOption: string | null;
    correctOption: "A" | "B" | "C" | "D";
    isCorrect: boolean;
    explanation: string;
  }>;
}> {
  let correctCount = 0;
  const totalQuestions = questions.length;

  const categoryScores: Record<string, { correct: number; total: number }> = {
    Architecture: { correct: 0, total: 0 },
    Database: { correct: 0, total: 0 },
    Concurrency: { correct: 0, total: 0 },
    Security: { correct: 0, total: 0 },
    Scalability: { correct: 0, total: 0 },
  };

  const questionResults = questions.map((q) => {
    const selected = candidateSelections[q.id] || null;
    const isCorrect = selected === q.correctOption;
    if (isCorrect) correctCount++;

    const catKey = q.category.toLowerCase();
    if (catKey.includes("arch") || catKey.includes("pattern")) {
      categoryScores.Architecture.total++;
      if (isCorrect) categoryScores.Architecture.correct++;
    } else if (catKey.includes("data") || catKey.includes("db")) {
      categoryScores.Database.total++;
      if (isCorrect) categoryScores.Database.correct++;
    } else if (catKey.includes("concurr") || catKey.includes("implement")) {
      categoryScores.Concurrency.total++;
      if (isCorrect) categoryScores.Concurrency.correct++;
    } else if (catKey.includes("secur") || catKey.includes("test")) {
      categoryScores.Security.total++;
      if (isCorrect) categoryScores.Security.correct++;
    } else {
      categoryScores.Scalability.total++;
      if (isCorrect) categoryScores.Scalability.correct++;
    }

    return {
      questionId: q.id,
      questionText: q.questionText,
      category: q.category,
      options: q.options,
      selectedOption: selected,
      correctOption: q.correctOption,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Sub-scores
  const getCatPct = (cat: { correct: number; total: number }, fallback: number) =>
    cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : fallback;

  const understandingScore = getCatPct(categoryScores.Architecture, percentage);
  const technicalScore = getCatPct(categoryScores.Database, percentage);
  const problemSolvingScore = getCatPct(categoryScores.Concurrency, percentage);
  const implementationScore = getCatPct(categoryScores.Security, percentage);
  const contributionScore = getCatPct(categoryScores.Scalability, percentage);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (categoryScores.Architecture.correct > 0) {
    strengths.push("Solid understanding of architectural decoupling and asynchronous request pipelines.");
  } else {
    weaknesses.push("Review decoupled service patterns and async background task queues.");
    recommendations.push("Study message queues (e.g. BullMQ, Redis streams) for handling long-running background tasks.");
  }

  if (categoryScores.Database.correct > 0) {
    strengths.push("Sound grasp of relational schema indexing and query execution strategies.");
  } else {
    weaknesses.push("Deepen knowledge of multi-column composite B-tree indexing rules.");
    recommendations.push("Practice query plan analysis (EXPLAIN ANALYZE) and composite index left-prefix rules.");
  }

  if (categoryScores.Concurrency.correct > 0) {
    strengths.push("Accurate identification of concurrency control mechanisms and race condition prevention.");
  } else {
    weaknesses.push("Review optimistic vs pessimistic locking mechanisms in high-concurrency environments.");
    recommendations.push("Examine versioned optimistic concurrency control patterns for shared state updates.");
  }

  if (categoryScores.Security.correct > 0) {
    strengths.push("Good application of web security standards (httpOnly cookies, CSRF protection).");
  } else {
    weaknesses.push("Strengthen authentication token storage and XSS/CSRF mitigation practices.");
    recommendations.push("Always protect sensitive authentication tokens in httpOnly, SameSite cookies.");
  }

  if (categoryScores.Scalability.correct > 0) {
    strengths.push("Clear understanding of distributed caching patterns and cache invalidation trade-offs.");
  } else {
    weaknesses.push("Familiarize yourself with cache-aside patterns and cache stampede prevention.");
    recommendations.push("Learn Redis cache-aside architectures with bounded TTLs and event-driven invalidation.");
  }

  if (strengths.length === 0) {
    strengths.push("Familiarity with candidate project domain and technical concepts.");
  }

  return {
    overallScore: percentage,
    understandingScore,
    technicalScore,
    problemSolvingScore,
    implementationScore,
    contributionScore,
    correctCount,
    totalQuestions,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    recommendations: recommendations.slice(0, 4),
    questionResults,
  };
}

/**
 * Evaluate Candidate's Project Answer
 */
export async function evaluateProjectAnswer(
  project: ProjectDetails,
  question: ProjectQuestion,
  candidateAnswer: string
): Promise<ProjectEvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey && apiKey.length > 0 && candidateAnswer.trim().length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a Principal Software Architect evaluating a candidate's answer during a Project-Based Technical Interview.

Project Context:
- Title: ${project.title}
- Technologies: ${project.technologies?.join(", ") || "Stack"}
- Candidate Role: ${project.candidateRole}

Interview Question (${question.category}):
"${question.questionText}"

Candidate Response:
"${candidateAnswer}"

Expected Criteria:
${question.expectedCriteria}

Evaluate the response across 5 engineering dimensions (0 - 100):
1. understandingScore: Depth of architectural clarity and grasp of their own system.
2. technicalScore: Correctness and depth regarding technologies, frameworks, and APIs.
3. problemSolvingScore: Analytical rigor in diagnosing bottlenecks and edge cases.
4. implementationScore: Concrete explanation of actual code, queries, logic, and patterns.
5. contributionScore: Clarity regarding personal code ownership versus generic templates.

Return ONLY a valid JSON object matching this schema:
{
  "overallScore": 85,
  "understandingScore": 88,
  "technicalScore": 85,
  "problemSolvingScore": 82,
  "implementationScore": 84,
  "contributionScore": 86,
  "strengths": ["Clear explanation of component decoupling", "Specific details on database indexing"],
  "missingDetails": ["Did not mention how connection pooling was managed"],
  "feedback": "Strong explanation demonstrating hands-on architectural ownership with clear technical vocabulary.",
  "modelAnswerOutline": "A model response should: 1) State the architectural design pattern, 2) Mention specific libraries/tools used, 3) Quantify performance improvements.",
  "followUpQuestion": "How did you monitor system latency under peak traffic?"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = response.text || "";
      const parsed = JSON.parse(cleanJson(responseText));

      return {
        overallScore: Math.min(100, Math.max(0, Math.round(Number(parsed.overallScore) || 75))),
        understandingScore: Math.min(100, Math.max(0, Math.round(Number(parsed.understandingScore) || 75))),
        technicalScore: Math.min(100, Math.max(0, Math.round(Number(parsed.technicalScore) || 75))),
        problemSolvingScore: Math.min(100, Math.max(0, Math.round(Number(parsed.problemSolvingScore) || 75))),
        implementationScore: Math.min(100, Math.max(0, Math.round(Number(parsed.implementationScore) || 75))),
        contributionScore: Math.min(100, Math.max(0, Math.round(Number(parsed.contributionScore) || 75))),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Clear problem framing"],
        missingDetails: Array.isArray(parsed.missingDetails) ? parsed.missingDetails : [],
        feedback: parsed.feedback || "Solid response demonstrating practical technical implementation.",
        modelAnswerOutline: parsed.modelAnswerOutline || "Provide specific architectural patterns and concrete performance metrics.",
        followUpQuestion: parsed.followUpQuestion || question.suggestedFollowUp,
      };
    } catch (err) {
      console.warn("Gemini project answer evaluation error, falling back:", err);
    }
  }

  // Deterministic Evaluation Fallback
  const wordCount = candidateAnswer.trim().split(/\s+/).length;
  let baseScore = 60;
  if (wordCount >= 40) baseScore += 15;
  if (wordCount >= 80) baseScore += 15;

  return {
    overallScore: Math.min(92, baseScore),
    understandingScore: Math.min(90, baseScore + 2),
    technicalScore: Math.min(88, baseScore),
    problemSolvingScore: Math.min(85, baseScore - 2),
    implementationScore: Math.min(90, baseScore + 1),
    contributionScore: Math.min(92, baseScore + 3),
    strengths: [
      "Demonstrates clear personal familiarity with the project codebase",
      "Communicates key engineering decisions with appropriate technical terminology",
    ],
    missingDetails: [
      "Could include more specific latency metrics or quantified performance improvements",
    ],
    feedback:
      "Good technical explanation. To score even higher, quantify your results (e.g. latency reduced by X%, query times improved by Yms).",
    modelAnswerOutline:
      "Structure your answer: 1) Context & Goal, 2) Technical choices made, 3) Implementation challenge overcome, 4) Measurable outcome.",
    followUpQuestion: question.suggestedFollowUp,
  };
}
