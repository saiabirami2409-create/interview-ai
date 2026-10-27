import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { generateTechnicalMcqReply } from "@/server/ai/mcq-chat-fallback";

interface ChatMessage {
  role: "user" | "assistant" | "model";
  content: string;
}

/**
 * COMPREHENSIVE TRAINING INSTRUCTION FOR INTERVIEWAI COACH
 * Configures Gemini into an interactive conversation partner and specialized
 * Technical-Round MCQ & Interview Coach.
 */
export const SYSTEM_INSTRUCTION = `You are InterviewAI Coach — an elite Principal Technical Interviewer, Hiring Committee Lead, and Senior Executive Career Coach on the InterviewAI platform ("Practice Smarter. Interview Better.").

CORE INTERACTION REQUIREMENTS (MANDATORY & HIGHEST PRIORITY):
- Be an interactive conversation partner.
- Ask one clear question at a time, then pause and wait for the user's answer before continuing.
- Keep your replies concise and adapt your next question to what the user says.
- If the user's request is unclear, ask a quick follow-up instead of guessing.
- Offer suggestions when they'd help, but let the user choose the direction.
- For tasks, work through them with the user step by step and check in at useful decision points.
- Avoid asking questions when you already have enough information to help.

TECHNICAL-ROUND MCQ & CODE EXPLANATION SPECIALIZATION:
When a candidate shares a multiple-choice question (MCQ), technical quiz problem, or code evaluation question:
1. BEST ANSWER IDENTIFICATION:
   - Clearly state the single best or correct option (e.g., "**Best Answer:** Option B (...)").
   - Encourage understanding instead of only giving a letter or option; never just give a lone letter or option name.

2. WHY IT IS CORRECT:
   - Explain the foundational technical reason: language specifications (ECMAScript, CPython, ANSI SQL, POSIX), runtime execution order, memory layout, call stack / event loop mechanics, or asymptotic complexity.

3. DISTRACTOR ANALYSIS (WHY OTHER OPTIONS ARE LESS SUITABLE):
   - For every other option, briefly explain why it is wrong, suboptimal, or a common misconception/pitfall.

4. ACCURACY, CONTEXT & VERSION NUANCE:
   - Provide precise, grounded technical context. Avoid inventing facts or fabricated citations.
   - Explicitly call out when an answer depends on language versions (e.g., Python 2 vs 3, ES6+, PostgreSQL vs MySQL) or when a question is ambiguous or underspecified.
   - Do not claim answers are guaranteed correct; invite users to verify important technical details, runtime quirks, and compiler outputs against official documentation.

5. ONE FOCUSED FOLLOW-UP:
   - If useful, ask exactly one focused follow-up question to test or deepen understanding (e.g., asking how to optimize it, or how a related concept behaves), while still providing the best helpful response possible from the information already provided.

6. ALWAYS REPLY GRACEFULLY:
   - Respond to every user message with either an answer, a clarification, or a brief explanation of what information is needed.
   - Malformed MCQs: If the user asks "which of the following..." but forgets to paste the options, explain the underlying technical concept, note that options are missing, and ask them to paste options A, B, C, D.
   - Greetings: Warmly welcome the candidate and state your readiness to solve MCQs or conduct mock interviews.
   - Off-topic questions: Briefly acknowledge the question and politely redirect back to technical interview preparation.

YOUR CORE MISSION:
Provide accurate, insightful, rigorous, and supportive guidance for interview, career, or job-related topics. You have deep expertise across technical domains, hiring methodologies, behavioral evaluation standards, and tech career pathways.

CORE EXPERTISE & TRAINING DOMAINS:
1. TECHNICAL CODING & ALGORITHMS:
- Data Structures: Arrays, Strings, HashMaps, Trees, Graphs, Heaps, Stacks/Queues.
- Algorithms & Complexity: Exact Time and Space Big-O with concise reasoning.
- Clean Code & Quality: Modern TypeScript/JavaScript, Python, Java, C++, Go, SQL.

2. SYSTEM DESIGN & ARCHITECTURE:
- High-level architecture, scalability, load balancing, caching (Redis), databases (SQL vs NoSQL), event streaming (Kafka), reliability, and trade-offs.

3. BEHAVIORAL & LEADERSHIP (STAR METHOD):
- Train and evaluate using the STAR Framework: Situation, Task, Action (specific individual contribution), and Result (quantifiable impact).

4. RESUME, CAREER & JOB-HUNTING:
- Resume optimization using Google's X-Y-Z formula: "Accomplished [X], as measured by [Y], by doing [Z]".
- Salary negotiation strategy, total compensation, and market benchmarks.

5. INTERACTIVE LIVE MOCK INTERVIEW MODE:
- When a candidate asks to be interviewed or says "interview me", "ask me a question", or "start a mock interview":
  • Step into the interviewer role immediately.
  • Ask ONE clear question at a time suited to their stated role and level.
  • Pause and wait for their answer before continuing.
  • When they reply, provide a concise rubric evaluation (Score, Strength, Area for Improvement, Model Answer Outline).
  • Then check in: ask if they want to move to the next question or dive deeper, letting them choose the direction.

OUTPUT & FORMATTING:
- Formatting: Clean, structured Markdown with bold highlights, short bullet points, and code snippets when relevant.
- Tone: Conversational, encouraging, sharp, and objective.
- Length: Keep responses concise and focused. Never dump large unprompted essays.`;

// In-memory sliding window rate limiter: 30 requests per minute per IP
const rateLimitWindowMs = 60 * 1000;
const rateLimitMax = 30;
const ipRequestTimestamps = new Map<string, number[]>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const timestamps = (ipRequestTimestamps.get(ip) || []).filter((t) => now - t < rateLimitWindowMs);

  if (timestamps.length >= rateLimitMax) {
    const oldest = timestamps[0];
    const resetTime = Math.max(1, Math.ceil((oldest + rateLimitWindowMs - now) / 1000));
    return { allowed: false, remaining: 0, resetTime };
  }

  timestamps.push(now);
  ipRequestTimestamps.set(ip, timestamps);
  return {
    allowed: true,
    remaining: rateLimitMax - timestamps.length,
    resetTime: Math.ceil(rateLimitWindowMs / 1000),
  };
}

/**
 * Intelligent Fallback Generator for Offline / Development Mode
 * Acts as an interactive conversation partner adhering strictly to the core interaction principles.
 */
export function generateExpertFallbackReply(query: string): string {
  const q = query.trim().toLowerCase();

  // 1. Mock interview request or role stated
  if (
    q.includes("interview me") ||
    q.includes("mock interview") ||
    q.includes("start an interview") ||
    q.includes("ask me a question")
  ) {
    if (q.includes("full-stack") || q.includes("full stack")) {
      return `Awesome, let's start a Full-Stack mock interview step by step! Here is your first question:

**How do Next.js Server Components differ from Client Components in data fetching and rendering, and when would you choose each?**

Take your time and reply with your answer whenever you're ready.`;
    }
    if (q.includes("frontend") || q.includes("react")) {
      return `Great, let's begin your Frontend & React mock interview step by step! Here is your first question:

**How does React's virtual DOM reconciliation work, and what triggers an unnecessary re-render?**

Take your time and reply whenever you are ready.`;
    }
    if (q.includes("backend") || q.includes("node")) {
      return `Great, let's do a Backend mock interview step by step! Here is your first question:

**How would you handle database connection pooling and query optimization during a sudden 10x traffic spike?**

Take your time and answer when you're ready.`;
    }

    return `I'd love to be your mock interviewer and practice step by step!

To make sure our questions match your target loop, **what specific role and seniority level are you preparing for?** (For example: Junior Frontend, Mid Full-Stack, Senior Backend, or AI/ML Engineer)`;
  }

  // 2. Behavioral / STAR Method
  if (
    q.includes("star") ||
    q.includes("behavioral") ||
    q.includes("tell me about yourself") ||
    q.includes("conflict") ||
    q.includes("failed")
  ) {
    return `The **STAR framework** breaks your response into 4 concise parts: **Situation** (15%), **Task** (15%), **Action** (50-60% — what *you* specifically did), and **Result** (15-20% — quantified impact).

We can either practice a classic behavioral question together, or refine one of your own past project stories. **Which direction would you prefer?**`;
  }

  // 3. System Design
  if (
    q.includes("system design") ||
    q.includes("scaling") ||
    q.includes("cache") ||
    q.includes("database") ||
    q.includes("kafka") ||
    q.includes("url shortener")
  ) {
    return `In system design interviews, we work through four stages: requirements & scale, high-level architecture, deep dives, and bottlenecks.

We could design a **URL shortener**, a **real-time chat system**, or a **distributed rate limiter**. **Which one would you like to build together step by step?**`;
  }

  // 4. Resume / CV optimization
  if (
    q.includes("resume") ||
    q.includes("cv") ||
    q.includes("ats") ||
    q.includes("bullet point")
  ) {
    return `For tech resumes, Google's **X-Y-Z formula** is the most effective: *"Accomplished [X], as measured by [Y], by doing [Z]"*.

**Do you have an existing bullet point you'd like us to rewrite together, or would you like an example first?**`;
  }

  // 5. Salary Negotiation
  if (
    q.includes("salary") ||
    q.includes("negotiat") ||
    q.includes("compensation") ||
    q.includes("offer") ||
    q.includes("equity")
  ) {
    return `Two key principles for salary negotiation: anchor on Total Compensation (Base + Bonus + Equity), and always counter using verified market data rather than personal feelings.

**At what stage is your current conversation — preparing before an offer, or evaluating a received offer letter?**`;
  }

  // 6. Direct concise question with enough information (avoid unnecessary questions)
  if (q.includes("hash map") || q.includes("hashmap") || q.includes("collision")) {
    return `A hash map computes an array index from a key using a hash function. When two distinct keys map to the same index (a collision), it resolves it using **separate chaining** (linked lists or balanced BSTs at each bucket) or **open addressing** (probing for the next open slot). Average lookup is O(1), degrading to O(n) or O(log n) in high-collision cases.

**Would you like to practice implementing collision resolution in code, or move to the next data structure?**`;
  }

  if (q.includes("quicksort") || q.includes("mergesort")) {
    return `**QuickSort** operates in-place with average O(n log n) time and O(log n) space, but degrades to O(n²) if pivot selection is poor. **MergeSort** is a stable sort guaranteeing O(n log n) in all cases, but requires O(n) auxiliary space.

**Would you like to trace through an example pivot partitioning, or compare another algorithm?**`;
  }

  // 7. Unclear or broad query -> ask a quick follow-up instead of guessing
  if (
    q === "help" ||
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q.includes("how does a mock interview work")
  ) {
    return `Hello! I am your interactive AI Interview Coach. I'm here to practice mock interviews, refine your technical answers, and guide your preparation step by step.

**What specific role or topic would you like to work on today?**`;
  }

  // 8. Specialized Technical MCQ Engine Analysis
  return generateTechnicalMcqReply(query);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate Limiting: 30 requests / min per IP
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: `Too many requests. Rate limit is ${rateLimitMax} requests per minute. Please try again in ${rateLimit.resetTime}s.`,
          fallbackMessage:
            "You have momentarily reached the rate limit (30 requests/min). Please pause for a few seconds before submitting your next question.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetTime),
          "X-RateLimit-Limit": String(rateLimitMax),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    // 1. Resolve API key from environment or client header override
    const clientApiKey = req.headers.get("x-gemini-api-key")?.trim();
    const envApiKey =
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      process.env.GOOGLE_GENAI_API_KEY?.trim();

    const apiKey = clientApiKey || envApiKey;

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "A non-empty 'messages' array is required.",
          },
        },
        { status: 400 }
      );
    }

    // Sanitize and bound history to recent 20 messages to control token usage
    const rawMessages: ChatMessage[] = body.messages.slice(-20);
    const validMessages = rawMessages.filter(
      (m) => typeof m.content === "string" && m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMPTY_MESSAGES",
            message: "No valid message content was provided.",
          },
        },
        { status: 400 }
      );
    }

    const latestUserMessage = validMessages[validMessages.length - 1].content.trim();

    // 2. If no Gemini API key is configured, return GEMINI_NOT_CONFIGURED status
    // along with rich domain fallback intelligence so the user is never left stranded.
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GEMINI_NOT_CONFIGURED",
            message:
              "The server-side GEMINI_API_KEY environment variable is not configured. Please set a valid Google Gemini API key to enable live AI coaching.",
            fallbackMessage: generateExpertFallbackReply(latestUserMessage),
          },
        },
        { status: 503 }
      );
    }

    // 3. Map messages into Gemini's expected alternating turn format
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    for (let i = 0; i < validMessages.length; i++) {
      const msg = validMessages[i];
      const targetRole: "user" | "model" =
        msg.role === "assistant" || msg.role === "model" ? "model" : "user";

      // If this is the first turn and it's not "user", skip it
      if (contents.length === 0 && targetRole !== "user") {
        continue;
      }

      // If the last entry has the same role, merge them to satisfy Gemini's alternating rule
      const lastEntry = contents[contents.length - 1];
      if (lastEntry && lastEntry.role === targetRole) {
        lastEntry.parts[0].text += `\n\n${msg.content.trim()}`;
      } else {
        contents.push({
          role: targetRole,
          parts: [{ text: msg.content.trim() }],
        });
      }
    }

    if (contents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CONVERSATION",
            message: "Conversation must contain at least one user query.",
          },
        },
        { status: 400 }
      );
    }

    // 4. Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey });

    // 5. Generate content with 15-second timeout resilience
    const TIMEOUT_MS = 15000;
    let timeoutTimer: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutTimer = setTimeout(() => {
        const timeoutError: any = new Error("Gemini API request timed out after 15 seconds.");
        timeoutError.name = "TimeoutError";
        reject(timeoutError);
      }, TIMEOUT_MS);
    });

    const generatePromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    try {
      const response = await Promise.race([generatePromise, timeoutPromise]);
      if (timeoutTimer) clearTimeout(timeoutTimer);

      const replyText = response.text?.trim();

      if (!replyText) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "EMPTY_AI_RESPONSE",
              message: "Received empty response from Gemini API. An answer was generated via fallback.",
              fallbackMessage: generateExpertFallbackReply(latestUserMessage),
            },
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: replyText,
        model: "gemini-2.5-flash",
        disclaimer:
          "AI responses are generated for interview practice. Verify critical specifications and compiler quirks in official documentation.",
        timestamp: new Date().toISOString(),
      });
    } catch (genError: any) {
      if (timeoutTimer) clearTimeout(timeoutTimer);

      if (genError?.name === "TimeoutError") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "REQUEST_TIMEOUT",
              message: "Gemini API request timed out after 15 seconds. Generated offline fallback reply.",
              fallbackMessage: generateExpertFallbackReply(latestUserMessage),
            },
          },
          { status: 504 }
        );
      }
      throw genError;
    }
  } catch (error: any) {
    console.error("AI Coach Chat API error:", error);

    const errorMessage = error?.message || "";
    // Reconstruct latest user message from body if available
    let latestUserMessage = "Technical interview question";
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.messages?.length > 0) {
        latestUserMessage = body.messages[body.messages.length - 1]?.content || latestUserMessage;
      }
    } catch {
      // ignore
    }

    // Handle rate limits / quota exhaustion
    if (
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("rate limit")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message:
              "The Gemini API rate limit was momentarily reached. An expert offline response has been provided.",
            fallbackMessage: generateExpertFallbackReply(latestUserMessage),
          },
        },
        { status: 429 }
      );
    }

    // Handle invalid API key
    if (
      errorMessage.includes("API key not valid") ||
      errorMessage.toLowerCase().includes("invalid api key") ||
      errorMessage.includes("403")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_API_KEY",
            message:
              "The configured Google Gemini API key is invalid or unauthorized. An expert offline response has been provided.",
            fallbackMessage: generateExpertFallbackReply(latestUserMessage),
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AI_GENERATION_FAILED",
          message:
            error?.message || "Failed to communicate with AI Coach. An expert offline response has been provided.",
          fallbackMessage: generateExpertFallbackReply(latestUserMessage),
        },
      },
      { status: 500 }
    );
  }
}

