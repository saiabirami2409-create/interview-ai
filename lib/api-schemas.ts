import { z } from "zod";

// ==========================================
// COMMON / PRIMITIVE SCHEMAS
// ==========================================

export const AnswerOptionEnum = z.enum(["A", "B", "C", "D"]);
export type AnswerOption = z.infer<typeof AnswerOptionEnum>;

export const DifficultyEnum = z.enum(["Intermediate", "Advanced"]);
export type Difficulty = z.infer<typeof DifficultyEnum>;

export const AssessmentStatusEnum = z.enum([
  "draft",
  "active",
  "submitted",
  "expired",
  "failed",
]);
export type AssessmentStatus = z.infer<typeof AssessmentStatusEnum>;

export const QuestionCategoryEnum = z.enum([
  "core_concepts",
  "code_output",
  "debugging",
  "edge_cases",
  "performance_optimization",
  "real_world_scenarios",
]);
export type QuestionCategory = z.infer<typeof QuestionCategoryEnum>;

export const PerformanceCategoryEnum = z.enum([
  "excellent",
  "very_good",
  "good",
  "needs_improvement",
  "more_practice_recommended",
]);
export type PerformanceCategory = z.infer<typeof PerformanceCategoryEnum>;

// ==========================================
// API ENVELOPES
// ==========================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
  requestId: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    details?: unknown;
  };
  requestId: string;
}

// ==========================================
// AUTHENTICATION SCHEMAS
// ==========================================

export const RegisterRequestSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be at most 100 characters"),
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .transform((val) => val.toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export interface RegisterResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
  };
  session: {
    expiresAt: string;
  };
}

export const LoginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((val) => val.toLowerCase()),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export interface LoginResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  session: {
    expiresAt: string;
  };
}

export interface LogoutResponse {
  loggedOut: true;
}

export interface SessionResponse {
  authenticated: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  expiresAt: string | null;
}

export const ForgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((val) => val.toLowerCase()),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export interface ForgotPasswordResponse {
  accepted: true;
}

export const ResetPasswordRequestSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// ==========================================
// INTERVIEW SETUP SCHEMAS
// ==========================================

export const InterviewSetupRequestSchema = z.object({
  jobRole: z.string().trim().min(1, "Target job role is required").max(100),
  topics: z
    .array(z.string().trim().min(1).max(80))
    .min(1, "At least one technical topic must be selected"),
  customJobRole: z.string().trim().max(100).optional().nullable(),
  customTopic: z.string().trim().max(100).optional().nullable(),
  questionCount: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20),
  ]),
  durationMinutes: z.union([
    z.literal(10),
    z.literal(15),
    z.literal(20),
    z.literal(30),
  ]),
  categories: z
    .array(QuestionCategoryEnum)
    .min(1, "At least one category must be selected"),
  difficultyDistribution: z
    .object({
      intermediatePercent: z.number().min(0).max(100),
      advancedPercent: z.number().min(0).max(100),
    })
    .optional(),
});

export type InterviewSetupRequest = z.infer<typeof InterviewSetupRequestSchema>;

export interface InterviewSetupValidationResponse {
  valid: true;
  normalizedSetup: {
    jobRole: string;
    topics: string[];
    questionCount: number;
    durationMinutes: number;
    categories: QuestionCategory[];
    intermediateCount: number;
    advancedCount: number;
  };
}

export type CreateAssessmentRequest = InterviewSetupRequest;

export interface CreateAssessmentResponse {
  assessment: {
    id: string;
    status: "draft" | "active";
    jobRole: string;
    topics: string[];
    questionCount: number;
    durationMinutes: number;
    startedAt: string;
    deadlineAt: string;
  };
}

export interface PublicAssessmentQuestion {
  questionId: string;
  orderIndex: number;
  question: string;
  topic: string;
  difficulty: "Intermediate" | "Advanced";
  category?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedOption?: "A" | "B" | "C" | "D" | null;
  markedForReview?: boolean;
}

export interface AssessmentResponse {
  assessment: {
    id: string;
    status: AssessmentStatus;
    jobRole: string;
    topics: string[];
    questionCount: number;
    durationMinutes: number;
    startedAt: string;
    deadlineAt: string;
    completedAt: string | null;
  };
  questions: PublicAssessmentQuestion[];
}

// ==========================================
// QUESTION GENERATION (GEMINI AI) SCHEMAS
// ==========================================

export const GenerateQuestionsRequestSchema = z.object({
  assessmentId: z.string().min(1),
  jobRole: z.string().min(1),
  topics: z.array(z.string()).min(1),
  questionCount: z.number().int().min(1).max(25),
  intermediateCount: z.number().int().min(0),
  advancedCount: z.number().int().min(0),
  categories: z.array(QuestionCategoryEnum).optional().default([]),
});

export type GenerateQuestionsRequest = z.infer<typeof GenerateQuestionsRequestSchema>;

export interface GenerateQuestionsResponse {
  assessmentId: string;
  questions: PublicAssessmentQuestion[];
  generation: {
    model: string;
    generatedAt: string;
    attempt: number;
  };
}

export const GeneratedQuestionSchema = z.object({
  questionId: z.string().optional(),
  question: z.string().trim().min(5, "Question text must be at least 5 characters"),
  topic: z.string().trim().min(1, "Topic is required"),
  difficulty: DifficultyEnum,
  options: z.object({
    A: z.string().trim().min(1, "Option A cannot be empty"),
    B: z.string().trim().min(1, "Option B cannot be empty"),
    C: z.string().trim().min(1, "Option C cannot be empty"),
    D: z.string().trim().min(1, "Option D cannot be empty"),
  }),
  correctOption: AnswerOptionEnum,
  explanation: z.string().trim().min(10, "Explanation must be at least 10 characters"),
  hint: z.string().optional(),
  hints: z.string().optional(),
  category: QuestionCategoryEnum.optional(),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

// ==========================================
// ASSESSMENT SUBMISSION & SAVING SCHEMAS
// ==========================================

export const SaveAnswersRequestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOption: AnswerOptionEnum.nullable(),
      markedForReview: z.boolean().optional(),
    })
  ),
});

export type SaveAnswersRequest = z.infer<typeof SaveAnswersRequestSchema>;

export interface SaveAnswersResponse {
  saved: true;
  savedAt: string;
  answeredCount: number;
}

export const SubmitAssessmentRequestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOption: AnswerOptionEnum.nullable(),
    })
  ),
  submissionReason: z.enum(["manual", "timeout", "session_recovery"]).default("manual"),
});

export type SubmitAssessmentRequest = z.infer<typeof SubmitAssessmentRequestSchema>;

export interface AssessmentResultSummary {
  assessmentId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  category: "excellent" | "very_good" | "good" | "needs_improvement" | "more_practice_recommended";
}

export interface SubmitAssessmentResponse {
  assessmentId: string;
  status: "submitted" | "expired";
  submittedAt: string;
  result: AssessmentResultSummary;
}

// ==========================================
// RESULTS & REVIEW SCHEMAS
// ==========================================

export interface ResultsResponse {
  assessment: {
    id: string;
    jobRole: string;
    topics: string[];
    submittedAt: string;
    status: "submitted" | "expired";
  };
  result: AssessmentResultSummary;
  topicPerformance: Array<{
    topic: string;
    total: number;
    correct: number;
    percentage: number;
  }>;
  difficultyPerformance: Array<{
    difficulty: "Intermediate" | "Advanced";
    total: number;
    correct: number;
    percentage: number;
  }>;
}

export interface ReviewResponse {
  assessmentId: string;
  questions: Array<{
    questionId: string;
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    selectedOption: "A" | "B" | "C" | "D" | null;
    correctOption: "A" | "B" | "C" | "D";
    explanation: string;
    difficulty: "Intermediate" | "Advanced";
    topic: string;
    isCorrect: boolean;
  }>;
}

// ==========================================
// DASHBOARD & HISTORY SCHEMAS
// ==========================================

export interface DashboardResponse {
  stats: {
    totalInterviews: number;
    averageScore: number | null;
    questionsPracticed: number;
    strongestSkill: string | null;
  };
  recentAssessments: Array<{
    id: string;
    jobRole: string;
    score: number;
    percentage: number;
    completedAt: string;
  }>;
  topicProgress: Array<{
    topic: string;
    attempted: number;
    correct: number;
    percentage: number;
  }>;
}

export const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  jobRole: z.string().optional(),
  topic: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z
    .enum(["completedAt_desc", "completedAt_asc", "score_desc", "score_asc"])
    .default("completedAt_desc"),
});

export type HistoryQuery = z.infer<typeof HistoryQuerySchema>;

export interface HistoryResponse {
  items: Array<{
    id: string;
    jobRole: string;
    topics: string[];
    questionCount: number;
    score: number;
    percentage: number;
    durationMinutes: number;
    completedAt: string;
    status: "submitted" | "expired";
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ==========================================
// AI FEEDBACK SCHEMAS
// ==========================================

export const GenerateFeedbackRequestSchema = z.object({
  assessmentId: z.string().min(1),
});

export type GenerateFeedbackRequest = z.infer<typeof GenerateFeedbackRequestSchema>;

export interface GenerateFeedbackResponse {
  report: {
    id: string;
    assessmentId: string;
    overallSummary: string;
    strongestSkills: string[];
    areasForImprovement: string[];
    recommendedTopics: string[];
    suggestedNextAssessment: {
      jobRole: string;
      topics: string[];
      difficulty: "Intermediate" | "Advanced";
    };
    createdAt: string;
  };
}

export interface FeedbackResponse {
  report: {
    id: string;
    assessmentId: string;
    overallSummary: string;
    strongestSkills: string[];
    areasForImprovement: string[];
    recommendedTopics: string[];
    suggestedNextAssessment: {
      jobRole: string;
      topics: string[];
      difficulty: "Intermediate" | "Advanced";
    };
    createdAt: string;
  } | null;
}

// ==========================================
// HELPER: CALCULATE DIFFICULTY DISTRIBUTION
// ==========================================

export function calculateDifficultyDistribution(
  count: number,
  interPercent = 60,
  advPercent = 40
): { intermediate: number; advanced: number; intermediateCount: number; advancedCount: number } {
  const intermediateCount = Math.round((count * interPercent) / 100);
  const advancedCount = count - intermediateCount;
  return {
    intermediate: intermediateCount,
    advanced: advancedCount,
    intermediateCount,
    advancedCount,
  };
}

// ==========================================
// HELPER: CATEGORIZE PERFORMANCE PERCENTAGE
// ==========================================

export function getPerformanceCategory(
  percentage: number
): "excellent" | "very_good" | "good" | "needs_improvement" | "more_practice_recommended" {
  if (percentage >= 90) return "excellent";
  if (percentage >= 75) return "very_good";
  if (percentage >= 60) return "good";
  if (percentage >= 40) return "needs_improvement";
  return "more_practice_recommended";
}

export const FeedbackReportSchema = z.object({
  id: z.string().min(1),
  assessmentId: z.string().min(1),
  overallSummary: z.string().min(10),
  strongestSkills: z.array(z.string()).min(1),
  areasForImprovement: z.array(z.string()).min(1),
  recommendedTopics: z.array(z.string()).min(1),
  suggestedNextAssessment: z.object({
    jobRole: z.string().min(1),
    topics: z.array(z.string()).min(1),
    difficulty: DifficultyEnum,
  }),
  createdAt: z.string(),
});
export type FeedbackReport = z.infer<typeof FeedbackReportSchema>;

// ==========================================
// CONVENIENCE SCHEMA ALIASES
// ==========================================

export const registerSchema = RegisterRequestSchema;
export const loginSchema = LoginRequestSchema;
export const forgotPasswordSchema = ForgotPasswordRequestSchema;
export const interviewSetupSchema = InterviewSetupRequestSchema;
export const generatedQuestionSchema = GeneratedQuestionSchema;
export const feedbackReportSchema = FeedbackReportSchema;
export const saveAnswersSchema = SaveAnswersRequestSchema;
export const submitAssessmentSchema = SubmitAssessmentRequestSchema;
export const aiQuestionsResponseSchema = GenerateQuestionsRequestSchema;


