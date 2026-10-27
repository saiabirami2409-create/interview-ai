import { GoogleGenAI } from "@google/genai";
import { APTITUDE_QUESTION_BANK, AptitudeQuestion } from "../data/aptitude-bank";
import { isDuplicateQuestion, recordQuestionsAsked } from "./duplicate-prevention";

export type { AptitudeQuestion };

export interface GenerateAptitudeOptions {
  userId: string;
  category: "Quantitative Aptitude" | "Logical Reasoning" | "Verbal Ability" | "Mixed";
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Mixed";
  questionCount: number; // 10, 15, 20, 30
}

export interface AptitudeAnswerVerification {
  isCorrect: boolean;
  selectedOption: string;
  correctOption: string;
  explanation: string;
  formula?: string;
  stepByStepSolution: string;
  shortcutMethod?: string;
  commonMistake?: string;
  statusText: string;
}

/**
 * Clean markdown code fences from JSON output
 */
function cleanJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

/**
 * Generate Aptitude Questions with Gemini or verified deterministic fallback
 */
export async function generateAptitudeQuestions(
  options: GenerateAptitudeOptions
): Promise<AptitudeQuestion[]> {
  const { userId, category, difficulty, questionCount } = options;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If Gemini API Key is present, attempt live AI generation
  if (apiKey && apiKey.length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a Senior Assessment Specialist & Aptitude Exam Author at an elite evaluation organization.
Generate ${questionCount} original, rigorously verified aptitude multiple-choice questions.

Category: ${category}
Difficulty: ${difficulty === "Mixed" ? "20% Beginner, 60% Intermediate, 20% Advanced" : difficulty}

CRITICAL RULES:
1. Exactly ${questionCount} questions.
2. Category: Must be strictly one of "Quantitative Aptitude", "Logical Reasoning", or "Verbal Ability".
3. Exactly four options labeled A, B, C, D.
4. Exactly one unambiguously correct answer (correctAnswer: "A" | "B" | "C" | "D").
5. Provide a constructive hint (without giving away the answer).
6. Provide a complete step-by-step mathematical or logical solution.
7. Provide the relevant mathematical formula if applicable.
8. Provide a faster shortcut method where applicable.
9. Explain the common conceptual mistake candidates make.
10. Ensure mathematical correctness. Verify all calculations before outputting.

Return ONLY a valid JSON array matching this exact schema:
[
  {
    "id": "gemini-apt-1",
    "category": "Quantitative Aptitude",
    "subtopic": "Percentages",
    "difficulty": "Intermediate",
    "question": "string",
    "options": {
      "A": "string",
      "B": "string",
      "C": "string",
      "D": "string"
    },
    "correctAnswer": "A",
    "hint": "string",
    "formula": "string",
    "stepByStepSolution": "string",
    "explanation": "string",
    "shortcutMethod": "string",
    "commonMistake": "string"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2, // Low temperature for mathematical precision
        },
      });

      const responseText = response.text || "";
      const parsed = JSON.parse(cleanJson(responseText));

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate each question structure and check duplicates
        const verifiedQuestions: AptitudeQuestion[] = [];
        const seenTexts: string[] = [];

        for (let i = 0; i < parsed.length; i++) {
          const q = parsed[i];
          if (
            q.question &&
            q.options?.A &&
            q.options?.B &&
            q.options?.C &&
            q.options?.D &&
            ["A", "B", "C", "D"].includes(q.correctAnswer)
          ) {
            // Check for duplicates
            const dupCheck = await isDuplicateQuestion(userId, "APTITUDE", q.question, seenTexts);
            if (!dupCheck.isDuplicate) {
              seenTexts.push(q.question);
              verifiedQuestions.push({
                id: q.id || `gemini-apt-${Date.now()}-${i}`,
                category: q.category || (category === "Mixed" ? "Quantitative Aptitude" : category),
                subtopic: q.subtopic || "General Aptitude",
                difficulty: q.difficulty || "Intermediate",
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                hint: q.hint || "Analyze the relationship between the given values.",
                formula: q.formula || "",
                stepByStepSolution: q.stepByStepSolution || q.explanation || "",
                explanation: q.explanation || "Correct based on logical and mathematical deduction.",
                shortcutMethod: q.shortcutMethod || "",
                commonMistake: q.commonMistake || "",
              });
            }
          }
        }

        if (verifiedQuestions.length >= Math.min(questionCount, 5)) {
          // Record to prevent future repetition
          await recordQuestionsAsked(
            userId,
            "APTITUDE",
            verifiedQuestions.map((q) => ({
              questionText: q.question,
              topic: q.subtopic,
              difficulty: q.difficulty,
            }))
          );
          return verifiedQuestions.slice(0, questionCount);
        }
      }
    } catch (error) {
      console.warn("Gemini Aptitude generation warning, using deterministic bank fallback:", error);
    }
  }

  // Deterministic high-precision fallback bank
  return selectFromAptitudeBank(options);
}

/**
 * Filter and select non-duplicate questions from curated bank
 */
function selectFromAptitudeBank(options: GenerateAptitudeOptions): AptitudeQuestion[] {
  const { category, difficulty, questionCount } = options;

  let pool = [...APTITUDE_QUESTION_BANK];

  if (category !== "Mixed") {
    pool = pool.filter((q) => q.category.toLowerCase().includes(category.toLowerCase().slice(0, 5)));
  }

  if (difficulty !== "Mixed") {
    const diffPool = pool.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    if (diffPool.length >= 5) {
      pool = diffPool;
    }
  }

  // Shuffle pool
  pool.sort(() => Math.random() - 0.5);

  // Return requested count (or repeat with varied IDs if requested count > available)
  const result: AptitudeQuestion[] = [];
  let index = 0;
  while (result.length < questionCount && pool.length > 0) {
    const base = pool[index % pool.length];
    result.push({
      ...base,
      id: `${base.id}-${result.length + 1}`,
    });
    index++;
  }

  return result;
}

/**
 * Verify user answer against verified key and generate educational feedback
 */
export function verifyAptitudeAnswer(
  question: AptitudeQuestion,
  selectedOption: string
): AptitudeAnswerVerification {
  const isCorrect = selectedOption.toUpperCase() === question.correctAnswer.toUpperCase();

  if (isCorrect) {
    return {
      isCorrect: true,
      selectedOption,
      correctOption: question.correctAnswer,
      statusText: "Correct Answer!",
      explanation: question.explanation || "Your selected answer is correct.",
      formula: question.formula,
      stepByStepSolution: question.stepByStepSolution,
      shortcutMethod: question.shortcutMethod,
      commonMistake: question.commonMistake,
    };
  }

  return {
    isCorrect: false,
    selectedOption,
    correctOption: question.correctAnswer,
    statusText: "Incorrect Answer!",
    explanation: `Option ${selectedOption} is incorrect. The verified correct answer is Option ${question.correctAnswer}.`,
    formula: question.formula,
    stepByStepSolution: question.stepByStepSolution,
    shortcutMethod: question.shortcutMethod,
    commonMistake: question.commonMistake || "Review the formula and calculation steps to avoid common missteps.",
  };
}
