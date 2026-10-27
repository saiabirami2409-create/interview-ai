import { GoogleGenAI } from "@google/genai";
import {
  GeneratedQuestion,
  GeneratedQuestionSchema,
  QuestionCategory,
  calculateDifficultyDistribution,
} from "@/lib/api-schemas";
import { ROLE_MCQ_BANKS } from "./mcq-bank";

export interface GenerateMcqsOptions {
  jobRole: string;
  topics: string[];
  questionCount: number;
  intermediateCount?: number;
  advancedCount?: number;
  categories?: QuestionCategory[];
}

export interface GenerationResult {
  questions: GeneratedQuestion[];
  model: string;
  attempt: number;
  isFallback: boolean;
}

/**
 * Clean potential markdown wrappers and formatting artifacts from AI responses
 */
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Generate technical interview MCQs using the Google Gemini API with schema validation
 */
export async function generateMcqsWithGemini(
  options: GenerateMcqsOptions
): Promise<GenerationResult> {
  const { jobRole, topics, questionCount, categories = [] } = options;

  const distribution = calculateDifficultyDistribution(questionCount);
  const intermediateCount = options.intermediateCount ?? distribution.intermediateCount;
  const advancedCount = options.advancedCount ?? distribution.advancedCount;

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key configured, use our high-fidelity fallback generator
  if (!apiKey) {
    return {
      questions: generateFallbackQuestions(options, intermediateCount, advancedCount),
      model: "deterministic-simulation-v2",
      attempt: 1,
      isFallback: true,
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are a Senior Technical Interviewer and Expert Question Setter at a top technology company (Google, Stripe, Meta).
Your role is to author original, high-quality, practical, interview-grade Multiple-Choice Questions (MCQs) for candidates interviewing for technical software engineering and data roles.

STRICT RULES:
1. Exact Question Count: You must return an array containing EXACTLY ${questionCount} questions.
2. Difficulty Distribution:
   - Exactly ${intermediateCount} questions marked with difficulty: "Intermediate"
   - Exactly ${advancedCount} questions marked with difficulty: "Advanced"
3. Options: Each question must provide exactly 4 distinct answer options: "A", "B", "C", and "D".
4. Correct Option: Exactly one option must be the correct answer ("A", "B", "C", or "D").
5. In-Depth Explanation: Each question MUST include a detailed, educational explanation specifying why the correct option is optimal and why the other three plausible distractors are suboptimal or incorrect.
6. Relevant Technical Scenarios: Focus on core concepts, technical reasoning, code-output prediction, edge cases, distributed systems, memory/time complexity, and performance optimization.
7. Role & Topic Grounding: All questions must be grounded in the target role: "${jobRole}" and focus on selected topics: ${topics.join(", ")}.
8. Return ONLY a valid JSON array matching the specified structure without extra markdown or commentary outside the JSON array.`;

  const userPrompt = `Generate ${questionCount} technical interview MCQs for the job role: "${jobRole}".

Target Technical Topics:
${topics.map((t) => `- ${t}`).join("\n")}

${categories.length > 0 ? `Target Question Categories:\n${categories.map((c) => `- ${c}`).join("\n")}\n` : ""}

Required Difficulty Distribution:
- Intermediate Questions: ${intermediateCount}
- Advanced Questions: ${advancedCount}

JSON Structure to return:
[
  {
    "question": "...",
    "topic": "...",
    "difficulty": "Intermediate",
    "options": {
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    },
    "correctOption": "A",
    "explanation": "...",
    "hint": "..."
  }
]`;

  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      const cleaned = cleanJsonText(text);
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error("Gemini response is not a JSON array");
      }

      // Validate each question against our Zod schema
      const validatedQuestions: GeneratedQuestion[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        // Normalize correctOption / correct_option casing
        if (typeof item.correctOption === "string") {
          item.correctOption = item.correctOption.trim().toUpperCase();
        } else if (typeof item.correct_option === "string") {
          item.correctOption = item.correct_option.trim().toUpperCase();
        }

        // Normalize hint / hints
        if (!item.hint && item.hints) {
          item.hint = item.hints;
        } else if (!item.hints && item.hint) {
          item.hints = item.hint;
        } else if (!item.hint && !item.hints) {
          item.hint = `Focus on ${item.topic || topics[0] || "core fundamentals"} and consider edge cases.`;
          item.hints = item.hint;
        }

        // Normalize difficulty
        if (item.difficulty && typeof item.difficulty === "string") {
          const lower = item.difficulty.toLowerCase();
          item.difficulty = lower.includes("adv") ? "Advanced" : "Intermediate";
        } else {
          item.difficulty = i < intermediateCount ? "Intermediate" : "Advanced";
        }
        // Assign topic if missing
        if (!item.topic || typeof item.topic !== "string") {
          item.topic = topics[i % topics.length] || "General Engineering";
        }

        const res = GeneratedQuestionSchema.safeParse(item);
        if (res.success) {
          validatedQuestions.push(res.data);
        } else {
          console.warn(`Question validation failed on item ${i}:`, res.error.issues);
        }
      }

      if (validatedQuestions.length >= questionCount) {
        // Enforce the difficulty distribution if model was slightly off
        const trimmed = validatedQuestions.slice(0, questionCount);
        let intCount = 0;
        let advCount = 0;
        trimmed.forEach((q) => {
          if (q.difficulty === "Intermediate") intCount++;
          else advCount++;
        });

        // Ensure proper distribution
        trimmed.forEach((q, idx) => {
          if (idx < intermediateCount) {
            q.difficulty = "Intermediate";
          } else {
            q.difficulty = "Advanced";
          }
        });

        return {
          questions: trimmed,
          model: "gemini-2.5-flash",
          attempt,
          isFallback: false,
        };
      } else {
        throw new Error(
          `Expected ${questionCount} valid questions, but only ${validatedQuestions.length} passed schema validation`
        );
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini MCQ generation attempt ${attempt} failed:`, err?.message || err);
    }
  }

  console.warn("All Gemini generation attempts exhausted. Using validated fallback question bank:", lastError?.message);
  return {
    questions: generateFallbackQuestions(options, intermediateCount, advancedCount),
    model: "deterministic-simulation-v2",
    attempt: maxAttempts,
    isFallback: true,
  };
}

/**
 * Generate high-quality fallback questions matching the exact requested counts and difficulty distribution
 */
export function generateFallbackQuestions(
  options: GenerateMcqsOptions,
  intermediateCount: number,
  advancedCount: number
): GeneratedQuestion[] {
  const { jobRole, topics, questionCount } = options;

  // Search in predefined role banks
  const matchedRoleKey =
    Object.keys(ROLE_MCQ_BANKS).find(
      (k) =>
        k.toLowerCase() === jobRole.toLowerCase() ||
        jobRole.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(jobRole.toLowerCase())
    ) || "Full-Stack Developer";

  const bank = ROLE_MCQ_BANKS[matchedRoleKey] || ROLE_MCQ_BANKS["Full-Stack Developer"];

  const questions: GeneratedQuestion[] = [];
  const totalNeeded = questionCount;

  for (let i = 0; i < totalNeeded; i++) {
    const isAdv = i >= intermediateCount;
    const diff = isAdv ? "Advanced" : "Intermediate";
    const selectedTopic = topics[i % topics.length] || `${jobRole} Core`;

    const template = bank[i % bank.length];

    questions.push({
      questionId: `q_${i + 1}`,
      question: template.q,
      topic: selectedTopic,
      difficulty: diff,
      options: {
        A: template.options[0],
        B: template.options[1],
        C: template.options[2],
        D: template.options[3],
      },
      correctOption: (["A", "B", "C", "D"][template.correctOptionIndex] as "A" | "B" | "C" | "D"),
      explanation: template.explanation,
      hint: (template as any).hints || `Focus on ${selectedTopic} principles and runtime execution order.`,
      hints: (template as any).hints || `Focus on ${selectedTopic} principles and runtime execution order.`,
      category: isAdv ? "performance_optimization" : "core_concepts",
    });
  }

  return questions;
}

/**
 * Generate personalized AI feedback report using Gemini
 */
export async function generatePersonalizedFeedbackWithGemini(params: {
  jobRole: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  percentage: number;
  accuracy: number;
  topicBreakdown: Array<{ topic: string; total: number; correct: number; percentage: number }>;
  difficultyBreakdown: Array<{ difficulty: "Intermediate" | "Advanced"; total: number; correct: number; percentage: number }>;
}): Promise<{
  overallSummary: string;
  strongestSkills: string[];
  areasForImprovement: string[];
  recommendedTopics: string[];
  suggestedNextAssessment: {
    jobRole: string;
    topics: string[];
    difficulty: "Intermediate" | "Advanced";
  };
}> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Deterministic fallback generator if no key is present or on API error
  const fallbackFeedback = () => {
    const { jobRole, percentage, topicBreakdown } = params;
    const sortedTopics = [...topicBreakdown].sort((a, b) => b.percentage - a.percentage);
    const strongTopics = sortedTopics.filter((t) => t.percentage >= 70).map((t) => t.topic);
    const weakTopics = sortedTopics.filter((t) => t.percentage < 70).map((t) => t.topic);

    const strongest =
      strongTopics.length > 0
        ? strongTopics.slice(0, 3)
        : [sortedTopics[0]?.topic || `${jobRole} Foundations`];

    const areas =
      weakTopics.length > 0
        ? weakTopics.slice(0, 3)
        : ["Edge-case handling", "Asynchronous race conditions", "Time/Space trade-offs"];

    const recommended =
      weakTopics.length > 0
        ? weakTopics.slice(0, 3)
        : ["System Architecture & Optimization", "Advanced Memory Management", "Concurrency Control"];

    let summary = "";
    if (percentage >= 85) {
      summary = `Outstanding technical performance! You achieved ${percentage}% accuracy on the ${jobRole} assessment, showcasing deep comprehension of core systems and advanced architectural trade-offs. Your performance indicates excellent interview readiness for competitive software engineering rounds.`;
    } else if (percentage >= 70) {
      summary = `Solid technical performance. You scored ${percentage}% on the ${jobRole} assessment, demonstrating a firm grasp of foundational principles with minor blind spots in complex concurrency and system optimization edge cases.`;
    } else if (percentage >= 50) {
      summary = `Moderate progress with clear potential. You scored ${percentage}% on the ${jobRole} assessment. You answered foundational questions accurately, but struggled with advanced optimization, code output predictions, and architectural trade-offs under timed conditions.`;
    } else {
      summary = `Foundational practice recommended. You scored ${percentage}% on the ${jobRole} assessment. Focusing on targeted drills in ${areas.join(", ")} will significantly boost your technical reasoning before real interview rounds.`;
    }

    return {
      overallSummary: summary,
      strongestSkills: strongest,
      areasForImprovement: areas,
      recommendedTopics: recommended,
      suggestedNextAssessment: {
        jobRole,
        topics: recommended.slice(0, 2),
        difficulty: (percentage >= 75 ? "Advanced" : "Intermediate") as "Intermediate" | "Advanced",
      },
    };
  };

  if (!apiKey) {
    return fallbackFeedback();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Principal Software Engineer and Bar-Raiser Technical Interviewer.
Synthesize personalized, objective, educational interview feedback for a candidate who just completed a technical multiple-choice assessment for the role of: "${params.jobRole}".

Actual Candidate Performance Data:
- Total Questions: ${params.totalQuestions}
- Correct Answers: ${params.correctAnswers}
- Incorrect Answers: ${params.incorrectAnswers}
- Unanswered: ${params.unansweredQuestions}
- Final Score: ${params.score}/${params.totalQuestions}
- Accuracy: ${params.accuracy}%
- Percentage: ${params.percentage}%

Topic-Wise Breakdown:
${JSON.stringify(params.topicBreakdown, null, 2)}

Difficulty Breakdown:
${JSON.stringify(params.difficultyBreakdown, null, 2)}

REQUIREMENTS:
1. Base feedback strictly on the provided real assessment data. Do NOT fabricate statistics or claim hiring outcomes.
2. Provide a 2-3 paragraph "overallSummary" highlighting their strengths, technical reasoning, and specific conceptual gaps.
3. List 2-3 "strongestSkills" (specific technical topics where they performed well).
4. List 2-3 "areasForImprovement" (topics/concepts where mistakes occurred).
5. List 2-3 "recommendedTopics" to drill next.
6. Provide "suggestedNextAssessment" with role, topics, and difficulty.

Return STRICT JSON matching this format:
{
  "overallSummary": "string",
  "strongestSkills": ["string"],
  "areasForImprovement": ["string"],
  "recommendedTopics": ["string"],
  "suggestedNextAssessment": {
    "jobRole": "string",
    "topics": ["string"],
    "difficulty": "Intermediate"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = cleanJsonText(response.text || "");
    const parsed = JSON.parse(text);

    return {
      overallSummary: parsed.overallSummary || fallbackFeedback().overallSummary,
      strongestSkills: Array.isArray(parsed.strongestSkills) && parsed.strongestSkills.length > 0
        ? parsed.strongestSkills
        : fallbackFeedback().strongestSkills,
      areasForImprovement: Array.isArray(parsed.areasForImprovement) && parsed.areasForImprovement.length > 0
        ? parsed.areasForImprovement
        : fallbackFeedback().areasForImprovement,
      recommendedTopics: Array.isArray(parsed.recommendedTopics) && parsed.recommendedTopics.length > 0
        ? parsed.recommendedTopics
        : fallbackFeedback().recommendedTopics,
      suggestedNextAssessment: {
        jobRole: parsed.suggestedNextAssessment?.jobRole || params.jobRole,
        topics: Array.isArray(parsed.suggestedNextAssessment?.topics) && parsed.suggestedNextAssessment.topics.length > 0
          ? parsed.suggestedNextAssessment.topics
          : fallbackFeedback().suggestedNextAssessment.topics,
        difficulty: parsed.suggestedNextAssessment?.difficulty === "Advanced" ? "Advanced" : "Intermediate",
      },
    };
  } catch (err) {
    console.warn("Gemini feedback generation error, using fallback feedback:", err);
    return fallbackFeedback();
  }
}

/**
 * Direct questions array generator for unit tests and direct callers
 */
export async function generateTechnicalMCQsWithGemini(
  options: GenerateMcqsOptions
): Promise<GeneratedQuestion[]> {
  const result = await generateMcqsWithGemini(options);
  return result.questions;
}
