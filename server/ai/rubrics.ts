import { InterviewType } from "./types";

export interface RubricWeight {
  relevance: number;
  technical: number;
  completeness: number;
  communication: number;
  reasoning: number;
}

export const RUBRIC_WEIGHTS: Record<InterviewType, RubricWeight> = {
  TECHNICAL: {
    relevance: 0.20,
    technical: 0.35,
    completeness: 0.20,
    communication: 0.15,
    reasoning: 0.10,
  },
  PROJECT_BASED: {
    relevance: 0.20,
    technical: 0.30,
    completeness: 0.25,
    communication: 0.15,
    reasoning: 0.10,
  },
  BEHAVIORAL: {
    relevance: 0.20,
    technical: 0.15, // Evaluates STAR situational validity
    completeness: 0.20,
    communication: 0.30,
    reasoning: 0.15,
  },
  HR: {
    relevance: 0.25,
    technical: 0.10, // General company alignment
    completeness: 0.20,
    communication: 0.35,
    reasoning: 0.10,
  },
};

export function calculateWeightedOverallScore(
  scores: {
    relevance: number;
    technical: number;
    completeness: number;
    communication: number;
    reasoning: number;
  },
  type: InterviewType
): number {
  const w = RUBRIC_WEIGHTS[type] || RUBRIC_WEIGHTS.TECHNICAL;
  const weighted =
    scores.relevance * w.relevance +
    scores.technical * w.technical +
    scores.completeness * w.completeness +
    scores.communication * w.communication +
    scores.reasoning * w.reasoning;

  return Math.round(Math.min(Math.max(weighted, 0), 100));
}

export function determineReadinessLevel(overallScore: number): {
  level: string;
  summary: string;
} {
  if (overallScore >= 85) {
    return {
      level: "Placement Ready",
      summary:
        "Outstanding performance across all evaluated dimensions. Demonstrates deep technical precision, structured delivery, and high confidence for tier-1 placement drives.",
    };
  }
  if (overallScore >= 70) {
    return {
      level: "Developing Placement Competence",
      summary:
        "Solid foundation with clear potential. Minor gaps detected in system edge cases or depth of trade-off justification. Recommended for focused topic practice before final rounds.",
    };
  }
  if (overallScore >= 50) {
    return {
      level: "Foundational Practice Required",
      summary:
        "Core knowledge is evident but structured communication (STAR) and technical depth need substantial drill sessions before facing campus placement panels.",
    };
  }
  return {
    level: "Early Preparation Stage",
    summary:
      "Significant conceptual gaps and brevity in responses. Review recommended preparation topics thoroughly and re-attempt baseline diagnostic rounds.",
  };
}
