export type InterviewType = "TECHNICAL" | "HR" | "BEHAVIORAL" | "PROJECT_BASED";
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface GenerateQuestionsInput {
  targetRole: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  questionCount: number;
  jobDescription?: string;
  resumeText?: string;
  focusArea?: string;
}

export interface GeneratedQuestion {
  orderIndex: number;
  questionText: string;
  category: string;
  difficulty: Difficulty;
  relevantSkills: string[];
  expectedCriteria: string;
  hints?: string;
  isMcq?: boolean;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
}

export interface EvaluateAnswerInput {
  questionText: string;
  category: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  expectedCriteria: string;
  answerText: string;
  timeSpentSec: number;
  selectedOptionIndex?: number;
}

export interface EvaluationResult {
  relevanceScore: number;       // 0 - 100
  technicalScore: number;       // 0 - 100
  completenessScore: number;    // 0 - 100
  communicationScore: number;   // 0 - 100
  reasoningScore: number;       // 0 - 100
  overallScore: number;         // Weighted composite 0 - 100
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  improvementSuggestions: string[];
  modelAnswerOutline: string;
  recommendedTopics: string[];
  isSimulated?: boolean;
}

export interface GenerateReportInput {
  targetRole: string;
  interviewType: InterviewType;
  evaluations: EvaluationResult[];
}

export interface SessionReportResult {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  relevanceScore: number;
  completenessScore: number;
  readinessLevel: string;
  readinessSummary: string;
  topStrengths: string[];
  criticalWeaknesses: string[];
  keyRecommendations: string[];
  suggestedNextRole?: string;
  isSimulated?: boolean;
}

export interface AIProvider {
  name: string;
  generateQuestions(params: GenerateQuestionsInput): Promise<GeneratedQuestion[]>;
  evaluateAnswer(params: EvaluateAnswerInput): Promise<EvaluationResult>;
  generateSessionReport(params: GenerateReportInput): Promise<SessionReportResult>;
}
