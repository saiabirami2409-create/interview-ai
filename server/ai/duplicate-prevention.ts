import { prisma } from "../db/prisma";

/**
 * Normalize question text for reliable fingerprinting and similarity checks
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate a deterministic fingerprint hash representation from normalized text
 */
export function generateFingerprint(text: string): string {
  const normalized = normalizeText(text);
  // Sort distinct significant words to detect reordered variants
  const words = normalized
    .split(" ")
    .filter((w) => w.length > 2)
    .sort();
  
  // Simple fast string hash
  let hash = 0;
  const str = words.join("-");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(36)}_${str.slice(0, 32)}`;
}

/**
 * Compute Jaccard word-overlap similarity coefficient (0 to 1)
 */
export function calculateSimilarity(textA: string, textB: string): number {
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);
  if (normA === normB) return 1.0;

  const setA = new Set(normA.split(" ").filter((w) => w.length > 2));
  const setB = new Set(normB.split(" ").filter((w) => w.length > 2));

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Check if a question is an exact or near duplicate of:
 * 1. Questions in the current batch/session
 * 2. Recent questions asked to this user in the same round
 */
export async function isDuplicateQuestion(
  userId: string,
  round: string,
  questionText: string,
  currentSessionQuestions: string[] = []
): Promise<{ isDuplicate: boolean; reason?: string }> {
  // 1. Check against current session questions
  for (const existing of currentSessionQuestions) {
    const sim = calculateSimilarity(questionText, existing);
    if (sim >= 0.78) {
      return { isDuplicate: true, reason: "Duplicate in current session" };
    }
  }

  // 2. Check against user's past QuestionHistory in database
  try {
    const fingerprint = generateFingerprint(questionText);
    const exactMatch = await prisma.questionHistory.findFirst({
      where: {
        userId,
        round,
        questionFingerprint: fingerprint,
      },
    });

    if (exactMatch) {
      return { isDuplicate: true, reason: "Previously asked exact question" };
    }

    // Check recent 30 questions for semantic near-duplicates
    const recentQuestions = await prisma.questionHistory.findMany({
      where: { userId, round },
      orderBy: { askedAt: "desc" },
      take: 30,
      select: { questionText: true },
    });

    for (const record of recentQuestions) {
      const sim = calculateSimilarity(questionText, record.questionText);
      if (sim >= 0.78) {
        return { isDuplicate: true, reason: "Near-duplicate from recent interview" };
      }
    }
  } catch (error) {
    console.warn("QuestionHistory check warning:", error);
  }

  return { isDuplicate: false };
}

/**
 * Record questions asked to a user to prevent future repetition
 */
export async function recordQuestionsAsked(
  userId: string,
  round: string,
  questions: Array<{ questionText: string; topic?: string; difficulty?: string }>
): Promise<void> {
  if (!userId || questions.length === 0) return;

  try {
    for (const q of questions) {
      const fingerprint = generateFingerprint(q.questionText);
      await prisma.questionHistory.create({
        data: {
          userId,
          round,
          questionText: q.questionText,
          questionFingerprint: fingerprint,
          topic: q.topic || "General",
          difficulty: q.difficulty || "INTERMEDIATE",
        },
      });
    }
  } catch (error) {
    console.warn("Failed to record QuestionHistory:", error);
  }
}
