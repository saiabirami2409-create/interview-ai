import { POST } from "../../app/api/chat/route";
import { NextRequest } from "next/server";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function run() {
  console.log("\n=======================================================");
  console.log("RUNNING AI CHATBOT INTEGRATION TESTS");
  console.log("=======================================================\n");

  // 1. Missing or empty messages validation
  console.log("--- 1. Testing Empty / Malformed Payload Validation ---");
  const emptyReq = new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [] }),
  });

  const emptyRes = await POST(emptyReq);
  const emptyJson = await emptyRes.json();
  assert(emptyRes.status === 400 || emptyRes.status === 503, "Empty messages must be rejected");
  assert(!emptyJson.success, "Payload must indicate success: false");

  // 2. Secret safety & configuration test
  console.log("\n--- 2. Testing Server-Side API Key & Secret Safety ---");
  const validReq = new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "How does a mock interview work?" }],
    }),
  });

  const validRes = await POST(validReq);
  const validJson = await validRes.json();

  if (process.env.GEMINI_API_KEY) {
    assert(validRes.status === 200, "Valid request with GEMINI_API_KEY must return HTTP 200");
    assert(validJson.success === true, "Must return success: true");
    assert(typeof validJson.message === "string", "Must return string reply from Gemini");
    assert(validJson.model === "gemini-2.5-flash", "Must use gemini-2.5-flash");
  } else {
    assert(
      validRes.status === 503,
      "Without GEMINI_API_KEY, must return HTTP 503 GEMINI_NOT_CONFIGURED"
    );
    assert(
      validJson.error?.code === "GEMINI_NOT_CONFIGURED",
      "Must return clear error code GEMINI_NOT_CONFIGURED"
    );
    assert(
      typeof validJson.error?.fallbackMessage === "string",
      "Must return interactive fallbackMessage"
    );
  }

  // 3. Testing Interactive Conversation Partner System Instruction
  console.log("\n--- 3. Testing Interactive Conversation Partner System Instruction ---");
  const { SYSTEM_INSTRUCTION, generateExpertFallbackReply } = await import(
    "../../app/api/chat/route"
  );

  const sysLower = SYSTEM_INSTRUCTION.toLowerCase();
  assert(
    sysLower.includes("interactive conversation partner"),
    "System instruction must enforce interactive conversation partner"
  );
  assert(
    sysLower.includes("one clear question at a time"),
    "System instruction must require asking one clear question at a time"
  );
  assert(
    sysLower.includes("pause and wait"),
    "System instruction must require pausing and waiting for the user's answer"
  );
  assert(
    sysLower.includes("concise"),
    "System instruction must require concise replies"
  );
  assert(
    sysLower.includes("adapt your next question"),
    "System instruction must require adapting the next question to what the user says"
  );
  assert(
    sysLower.includes("quick follow-up instead of guessing"),
    "System instruction must specify asking quick follow-ups instead of guessing"
  );
  assert(
    sysLower.includes("let the user choose the direction"),
    "System instruction must state offering suggestions while letting the user choose"
  );
  assert(
    sysLower.includes("step by step"),
    "System instruction must instruct working through tasks step by step"
  );
  assert(
    sysLower.includes("check in at useful decision points"),
    "System instruction must instruct checking in at decision points"
  );
  assert(
    sysLower.includes("avoid asking questions when you already have enough information"),
    "System instruction must instruct avoiding redundant questions when enough info is present"
  );

  // 4. Testing Interactive Fallback Reply Behavior
  console.log("\n--- 4. Testing Interactive Fallback Partner Behavior ---");
  const mockInterviewReply = generateExpertFallbackReply("interview me");
  assert(
    mockInterviewReply.includes("what specific role and seniority level"),
    "Mock interview prompt must ask one clarifying question about role & level"
  );
  assert(
    (mockInterviewReply.match(/\?/g) || []).length === 1,
    "Mock interview prompt must ask exactly one question at a time"
  );

  const fullStackReply = generateExpertFallbackReply("start a full-stack mock interview");
  assert(
    fullStackReply.includes("Next.js Server Components differ from Client Components"),
    "Full-stack interview must adapt and ask targeted first question"
  );
  assert(
    (fullStackReply.match(/\?/g) || []).length === 1,
    "Full-stack interview must ask exactly one question"
  );

  const sysDesignReply = generateExpertFallbackReply("let's do system design");
  assert(
    sysDesignReply.includes("Which one would you like to build together step by step?"),
    "System design must offer suggestions and let user choose direction"
  );
  assert(
    (sysDesignReply.match(/\?/g) || []).length === 1,
    "System design must ask exactly one question"
  );

  const conciseTechReply = generateExpertFallbackReply("How does a hash map handle collisions?");
  assert(
    conciseTechReply.includes("separate chaining") || conciseTechReply.includes("chaining"),
    "Direct technical question must provide concise answer"
  );
  assert(
    conciseTechReply.length < 800,
    "Direct technical answer must remain concise (< 800 chars)"
  );

  const unclearReply = generateExpertFallbackReply("help");
  assert(
    unclearReply.includes("What specific role or topic would you like to work on today?"),
    "Unclear request must ask a quick follow-up question instead of guessing"
  );

  // 5. Testing Technical MCQ Solving & Distractor Analysis
  console.log("\n--- 5. Testing Technical MCQ Solving & Distractor Analysis ---");
  const pythonMcq = `What happens when you call def append_item(val, target_list=[]) in Python?
A) A new list is created on every function call
B) The same list is reused across calls and retains appended items
C) It raises a SyntaxError at runtime
D) It returns None`;

  const pythonReply = generateExpertFallbackReply(pythonMcq);
  assert(
    pythonReply.toLowerCase().includes("best answer"),
    "MCQ reply must prominently identify the Best Answer"
  );
  assert(
    pythonReply.toLowerCase().includes("why it is correct"),
    "MCQ reply must explain why the answer is correct"
  );
  assert(
    pythonReply.toLowerCase().includes("less suitable") || pythonReply.toLowerCase().includes("distractor"),
    "MCQ reply must provide distractor analysis explaining why other options are less suitable"
  );
  assert(
    pythonReply.toLowerCase().includes("function definition time") || pythonReply.toLowerCase().includes("__defaults__"),
    "MCQ explanation must ground in Python runtime specifics"
  );
  assert(
    pythonReply.includes("?"),
    "MCQ reply must conclude with a focused follow-up question"
  );

  // SQL Isolation Levels MCQ
  const sqlMcq = "Which transaction isolation level eliminates non-repeatable reads according to ANSI SQL-92?";
  const sqlReply = generateExpertFallbackReply(sqlMcq);
  assert(
    sqlReply.toLowerCase().includes("repeatable read"),
    "SQL isolation reply must identify Repeatable Read / Serializable"
  );
  assert(
    sqlReply.toLowerCase().includes("dirty read") || sqlReply.toLowerCase().includes("phantom read"),
    "SQL isolation reply must contrast anomalies across levels"
  );

  // JS Event Loop MCQ
  const jsMcq = `What is the console output order for:
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
A) 1, 2, 3, 4
B) 1, 4, 3, 2
C) 1, 3, 4, 2
D) 1, 4, 2, 3`;
  const jsReply = generateExpertFallbackReply(jsMcq);
  assert(
    jsReply.includes("1, 4, 3, 2"),
    "JS Event Loop reply must identify the correct execution order 1, 4, 3, 2"
  );
  assert(
    jsReply.toLowerCase().includes("microtask"),
    "JS Event Loop reply must explain microtask queue mechanics"
  );

  // 6. Testing Malformed MCQ Graceful Handling
  console.log("\n--- 6. Testing Malformed MCQ Handling ---");
  const malformedMcq = "Which of the following will prevent SQL injection in Node.js?";
  const malformedReply = generateExpertFallbackReply(malformedMcq);
  assert(
    malformedReply.toLowerCase().includes("options") || malformedReply.toLowerCase().includes("missing"),
    "Malformed MCQ missing options must explain what is missing"
  );
  assert(
    malformedReply.length > 50,
    "Malformed question must still offer core conceptual explanation"
  );

  // 7. Testing Off-Topic Redirection
  console.log("\n--- 7. Testing Off-Topic Redirection ---");
  const offTopicQuery = "What is the weather like in Seattle today?";
  const offTopicReply = generateExpertFallbackReply(offTopicQuery);
  assert(
    offTopicReply.toLowerCase().includes("interview") || offTopicReply.toLowerCase().includes("technical"),
    "Off-topic question must politely redirect to technical interview preparation"
  );

  // 8. Testing System Instruction MCQ Requirements
  console.log("\n--- 8. Testing System Instruction MCQ Contract Requirements ---");
  assert(
    sysLower.includes("best answer"),
    "System instruction must require identifying the best answer"
  );
  assert(
    sysLower.includes("why it is correct"),
    "System instruction must require explaining why it is correct"
  );
  assert(
    sysLower.includes("distractor analysis") || sysLower.includes("why other options are less suitable"),
    "System instruction must require distractor analysis"
  );
  assert(
    sysLower.includes("encourage understanding"),
    "System instruction must encourage understanding rather than just giving a letter"
  );
  assert(
    sysLower.includes("do not claim answers are guaranteed correct") || sysLower.includes("verify"),
    "System instruction must caution against guaranteeing correctness"
  );

  // 9. Testing Rate Limiting (30 requests/min per IP)
  console.log("\n--- 9. Testing IP Rate Limiting ---");
  const testIp = `192.168.100.${Date.now() % 250}`;
  let wasRateLimited = false;
  let lastStatus = 200;

  for (let i = 0; i < 35; i++) {
    const rateReq = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Test ping" }],
      }),
    });
    const res = await POST(rateReq);
    if (res.status === 429) {
      wasRateLimited = true;
      lastStatus = 429;
      const json = await res.json();
      assert(json.error?.code === "RATE_LIMITED", "Must return RATE_LIMITED error code");
      assert(typeof json.error?.fallbackMessage === "string", "Must provide fallbackMessage even when rate limited");
      break;
    }
  }

  assert(wasRateLimited, "Rate limiter must trigger HTTP 429 after 30 requests/minute");
  assert(lastStatus === 429, "Must return HTTP status 429");

  console.log("\n=======================================================");
  console.log("ALL AI CHATBOT & MCQ UPGRADE TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

