import { GoogleGenAI } from "@google/genai";
import {
  AIProvider,
  GenerateQuestionsInput,
  GeneratedQuestion,
  EvaluateAnswerInput,
  EvaluationResult,
  GenerateReportInput,
  SessionReportResult,
} from "./types";
import { calculateWeightedOverallScore, determineReadinessLevel } from "./rubrics";
import { DeterministicDemoProvider } from "./demo-provider";

export class GoogleGeminiProvider implements AIProvider {
  name = "Google Gemini Live Intelligence Provider";
  private fallback = new DeterministicDemoProvider();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateQuestions(params: GenerateQuestionsInput): Promise<GeneratedQuestion[]> {
    if (!this.apiKey) {
      return this.fallback.generateQuestions(params);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      const isTechnical = params.interviewType === "TECHNICAL";

      let prompt = "";
      if (isTechnical) {
        prompt = `You are a Principal Software Engineer and Bar-Raiser Interviewer at a top-tier technology company (Google, Meta, Stripe).
Generate ${params.questionCount} high-value Multiple-Choice Questions (MCQs) for a technical interview round for the role of: "${params.targetRole}".

Target Seniority/Difficulty: ${params.difficulty}
${params.focusArea ? `Priority Focus Area: "${params.focusArea}"` : ""}
${params.jobDescription ? `Company Job Description Extract:\n"""${params.jobDescription.slice(0, 1500)}"""` : ""}
${params.resumeText ? `Candidate Resume / Background Extract:\n"""${params.resumeText.slice(0, 1500)}"""` : ""}

CRITICAL REQUIREMENTS FOR TECHNICAL MCQ GENERATION:
1. Frequently Asked & High-Value: Focus on practical problem-solving, architectural trade-offs, concurrency race conditions, database indexing and query plans, memory leaks, event loop lag, system reliability, or API security. Avoid trivia or basic definition questions.
2. Exactly 4 Options: Provide exactly 4 plausible answer options (A, B, C, D) in the "options" array.
3. Realistic Distractors: Exactly one option must be the optimal engineering approach. The other three options must represent common developer misconceptions, anti-patterns, or subtle bugs.
4. Correct Option Index: Provide "correctOptionIndex" as an integer (0, 1, 2, or 3) indicating the zero-based index of the correct option.
5. In-Depth Explanation: Provide a comprehensive "explanation" detailing why the correct option is right, and specifically why each distractor is suboptimal or incorrect.
6. Non-Repeating: Ensure all ${params.questionCount} questions test distinct concepts without repetition.

Return STRICT JSON matching this schema:
[
  {
    "orderIndex": 1,
    "questionText": "string (Scenario or technical problem)",
    "category": "string (e.g. High-Concurrency Systems, PostgreSQL MVCC, React Engine, Distributed Caching)",
    "difficulty": "${params.difficulty}",
    "relevantSkills": ["string", "string"],
    "hints": "string (Constructive architectural hint)",
    "options": [
      "string (Option A)",
      "string (Option B)",
      "string (Option C)",
      "string (Option D)"
    ],
    "correctOptionIndex": 0,
    "explanation": "string (Comprehensive technical explanation of the correct choice and why distractors fail)"
  }
]`;
      } else {
        prompt = `You are a Principal Software Engineer and Bar-Raiser Interviewer at a top-tier technology company (Google, Meta, Stripe).
Generate ${params.questionCount} deeply realistic, scenario-based interview questions for a candidate interviewing for the role of: "${params.targetRole}".

Round Type: ${params.interviewType} (BEHAVIORAL, HR, or PROJECT_BASED)
Target Seniority/Difficulty: ${params.difficulty}
${params.focusArea ? `Priority Focus Area to Probe: "${params.focusArea}"` : ""}
${params.jobDescription ? `Company Job Description Extract:\n"""${params.jobDescription.slice(0, 1500)}"""` : ""}
${params.resumeText ? `Candidate Resume / Background Extract:\n"""${params.resumeText.slice(0, 1500)}"""` : ""}

CRITICAL REQUIREMENTS FOR QUESTION REALISM:
1. Ask about specific challenging interpersonal, organizational, or architectural dilemmas requiring the STAR framework (Situation, Task, Action, Result).
2. Ground the questions directly in the candidate's resume projects/skills and the target job description if provided.

Return STRICT JSON matching this schema:
[
  {
    "orderIndex": 1,
    "questionText": "string (The detailed scenario-based question)",
    "category": "string (e.g. Technical Leadership, Stakeholder Conflict, System Architecture)",
    "difficulty": "${params.difficulty}",
    "relevantSkills": ["string", "string"],
    "expectedCriteria": "string (Specific technical or behavioral points the candidate must touch upon to pass)",
    "hints": "string (A constructive hint guiding the candidate toward the core architectural principle)"
  }
]`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed) && parsed.length > 0) {
        if (isTechnical) {
          // Validate technical MCQs
          const validMcqs = parsed.filter(
            (q: any) =>
              typeof q.questionText === "string" &&
              q.questionText.trim().length > 0 &&
              Array.isArray(q.options) &&
              q.options.length === 4 &&
              typeof q.correctOptionIndex === "number" &&
              q.correctOptionIndex >= 0 &&
              q.correctOptionIndex <= 3 &&
              typeof q.explanation === "string" &&
              q.explanation.trim().length > 0
          );

          if (validMcqs.length > 0) {
            return validMcqs.map((q: any, idx: number) => {
              const options = q.options.map((opt: any) => String(opt).trim());
              const correctOptionIndex = Math.min(Math.max(q.correctOptionIndex, 0), 3);
              const explanation = String(q.explanation).trim();
              const criteria = JSON.stringify({
                isMcq: true,
                options,
                correctOptionIndex,
                explanation,
                criteriaText: q.expectedCriteria || "Identify the optimal engineering approach and explain trade-offs.",
              });

              return {
                orderIndex: idx + 1,
                questionText: q.questionText.trim(),
                category: q.category || "System Architecture",
                difficulty: params.difficulty,
                relevantSkills: Array.isArray(q.relevantSkills) ? q.relevantSkills : [],
                expectedCriteria: criteria,
                hints: q.hints || undefined,
                isMcq: true,
                options,
                correctOptionIndex,
                explanation,
              };
            });
          }
        } else {
          return parsed.map((q: any, idx: number) => ({
            orderIndex: idx + 1,
            questionText: q.questionText,
            category: q.category || "System Engineering",
            difficulty: params.difficulty,
            relevantSkills: Array.isArray(q.relevantSkills) ? q.relevantSkills : [],
            expectedCriteria: q.expectedCriteria || "Clear structured technical explanation",
            hints: q.hints || undefined,
            isMcq: false,
          }));
        }
      }
    } catch (err) {
      console.warn("Gemini question generation error, falling back to High-Fidelity Simulation Provider:", err);
    }

    return this.fallback.generateQuestions(params);
  }

  async evaluateAnswer(params: EvaluateAnswerInput): Promise<EvaluationResult> {
    if (!this.apiKey) {
      return this.fallback.evaluateAnswer(params);
    }

    // If MCQ question, evaluate with deterministic accuracy
    if (params.selectedOptionIndex !== undefined || (params.expectedCriteria && params.expectedCriteria.startsWith("{\"isMcq\":true"))) {
      return this.fallback.evaluateAnswer(params);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      const prompt = `You are an elite Technical Hiring Committee Lead evaluating a candidate's answer during a placement interview.

Question Asked:
"${params.questionText}"

Category: ${params.category}
Interview Round: ${params.interviewType}
Difficulty: ${params.difficulty}
Expected Evaluation Rubric Criteria:
"${params.expectedCriteria}"

Candidate's Submitted Answer:
"""
${params.answerText}
"""

Evaluate this answer strictly and objectively on a 0 - 100 scale across all 5 rubric axes:
1. relevanceScore (0-100): Did they answer the exact problem asked without drifting?
2. technicalScore (0-100): Accurate use of computer science fundamentals, system design principles, protocols, algorithms, and trade-offs.
3. completenessScore (0-100): Did they address edge cases, failure states, scalability, and recovery?
4. communicationScore (0-100): Structured clarity, logical progression, professional tone (or STAR framework if behavioral/HR).
5. reasoningScore (0-100): Logical defense of why their chosen approach is superior to alternatives.

Identify:
- strengths: 2-3 specific technical or structural strengths demonstrated in their answer.
- weaknesses: 1-3 concrete omissions, vague assertions, or architectural vulnerabilities in their response.
- missingConcepts: 2-4 specific terminology, protocols, or edge cases they neglected to mention.
- improvementSuggestions: 2 actionable pieces of advice on how to elevate this response to a top 5% candidate standard.
- modelAnswerOutline: A concise, exemplary 95+ model answer outline detailing the exact technical architecture or STAR story structure.
- recommendedTopics: 2-3 focused topics the candidate should drill to address their gaps.

Return STRICT JSON matching this format:
{
  "relevanceScore": number,
  "technicalScore": number,
  "completenessScore": number,
  "communicationScore": number,
  "reasoningScore": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingConcepts": ["string"],
  "improvementSuggestions": ["string"],
  "modelAnswerOutline": "string",
  "recommendedTopics": ["string"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      const parsed = JSON.parse(text);

      const relevanceScore = Math.min(Math.max(parsed.relevanceScore || 70, 0), 100);
      const technicalScore = Math.min(Math.max(parsed.technicalScore || 70, 0), 100);
      const completenessScore = Math.min(Math.max(parsed.completenessScore || 70, 0), 100);
      const communicationScore = Math.min(Math.max(parsed.communicationScore || 70, 0), 100);
      const reasoningScore = Math.min(Math.max(parsed.reasoningScore || 70, 0), 100);

      const overallScore = calculateWeightedOverallScore(
        {
          relevance: relevanceScore,
          technical: technicalScore,
          completeness: completenessScore,
          communication: communicationScore,
          reasoning: reasoningScore,
        },
        params.interviewType
      );

      return {
        relevanceScore,
        technicalScore,
        completenessScore,
        communicationScore,
        reasoningScore,
        overallScore,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
          ? parsed.strengths
          : ["Directly engaged with the fundamental question premise."],
        weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
          ? parsed.weaknesses
          : ["Could elaborate further on operational edge cases and failure modes."],
        missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : [],
        improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : [],
        modelAnswerOutline: parsed.modelAnswerOutline || "1. Core Definition. 2. Mechanism. 3. Edge Cases. 4. Trade-off Retrospective.",
        recommendedTopics: Array.isArray(parsed.recommendedTopics) && parsed.recommendedTopics.length > 0
          ? parsed.recommendedTopics
          : [params.category || "System Architecture"],
        isSimulated: false,
      };
    } catch (err) {
      console.warn("Gemini evaluation error, falling back to High-Fidelity Simulation Provider:", err);
    }

    return this.fallback.evaluateAnswer(params);
  }

  async generateSessionReport(params: GenerateReportInput): Promise<SessionReportResult> {
    if (!this.apiKey) {
      return this.fallback.generateSessionReport(params);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      const prompt = `You are the Lead Hiring Committee Director at a top technology company.
Synthesize an executive interview performance evaluation report for a placement candidate who just completed a mock interview round for the role of "${params.targetRole}".

Round Type: ${params.interviewType}
Evaluations Data Across Questions:
${JSON.stringify(params.evaluations, null, 2)}

Synthesize:
1. Overall Diagnostic Summary (2-3 paragraphs analyzing their placement readiness, technical precision, and communication presence).
2. Top 3 Strengths across the session.
3. Top 3 Critical Weaknesses or Knowledge Gaps.
4. Top 3 High-Priority Actionable Recommendations.

Return STRICT JSON matching this format:
{
  "readinessLevel": "string (Placement Ready | Developing Placement Competence | Foundational Practice Required | Early Preparation Stage)",
  "readinessSummary": "string",
  "topStrengths": ["string", "string", "string"],
  "criticalWeaknesses": ["string", "string", "string"],
  "keyRecommendations": ["string", "string", "string"],
  "suggestedNextRole": "string"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      const parsed = JSON.parse(text);

      const evals = params.evaluations;
      const avgOverall = Math.round(evals.reduce((acc, e) => acc + e.overallScore, 0) / (evals.length || 1));
      const avgTech = Math.round(evals.reduce((acc, e) => acc + e.technicalScore, 0) / (evals.length || 1));
      const avgComm = Math.round(evals.reduce((acc, e) => acc + e.communicationScore, 0) / (evals.length || 1));
      const avgRel = Math.round(evals.reduce((acc, e) => acc + e.relevanceScore, 0) / (evals.length || 1));
      const avgComp = Math.round(evals.reduce((acc, e) => acc + e.completenessScore, 0) / (evals.length || 1));

      const readinessFallback = determineReadinessLevel(avgOverall);

      return {
        overallScore: avgOverall,
        technicalScore: avgTech,
        communicationScore: avgComm,
        relevanceScore: avgRel,
        completenessScore: avgComp,
        readinessLevel: parsed.readinessLevel || readinessFallback.level,
        readinessSummary: parsed.readinessSummary || readinessFallback.summary,
        topStrengths: Array.isArray(parsed.topStrengths) ? parsed.topStrengths : ["Good foundational understanding."],
        criticalWeaknesses: Array.isArray(parsed.criticalWeaknesses) ? parsed.criticalWeaknesses : ["Needs deeper system edge case analysis."],
        keyRecommendations: Array.isArray(parsed.keyRecommendations) ? parsed.keyRecommendations : ["Practice structured STAR responses."],
        suggestedNextRole: parsed.suggestedNextRole || params.targetRole,
        isSimulated: false,
      };
    } catch (err) {
      console.warn("Gemini session report generation error, falling back to Simulation Provider:", err);
    }

    return this.fallback.generateSessionReport(params);
  }
}
