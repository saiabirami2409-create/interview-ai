import assert from "assert";

async function main() {
  console.log("=================================================");
  console.log("INTERVIEWAI: COMPREHENSIVE END-TO-END FLOW TEST");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Authenticate Candidate
  console.log("1. Authenticating test candidate...");
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "aarya.kumar@example.com",
      password: "Password123!",
      rememberMe: true,
    }),
  });

  const loginCookie = loginRes.headers.get("set-cookie") || "";
  const loginJson = await loginRes.json();
  assert(loginRes.ok, "Login failed: " + JSON.stringify(loginJson));
  console.log("✓ Login successful! User:", loginJson.data?.user?.email || loginJson.user?.email);

  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: loginCookie.split(";")[0],
  };

  // 2. Chatbot Integration
  console.log("\n2. Testing Module 1: AI Interview Assistant Chatbot & Conversation Memory...");
  
  // Status check
  const statusRes = await fetch(`${baseUrl}/api/chatbot/status`);
  const statusJson = await statusRes.json();
  assert(statusRes.ok && statusJson.success, "Chatbot status check failed");
  console.log(`✓ Chatbot Status: ${statusJson.statusText} (${statusJson.provider})`);

  // Start new conversation thread
  const convRes = await fetch(`${baseUrl}/api/chatbot/conversations`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ title: "E2E Behavioral & Technical Prep" }),
  });
  const convJson = await convRes.json();
  assert(convRes.ok && convJson.success, "Failed to create conversation thread");
  const testConvId = convJson.conversation.id;
  console.log(`✓ Conversation thread created (${testConvId}): ${convJson.conversation.title}`);

  // Send message to thread
  const chatRes = await fetch(`${baseUrl}/api/chatbot/message`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      conversationId: testConvId,
      message: "Explain the STAR method for behavioral interviews and what mistake to avoid.",
    }),
  });

  const chatJson = await chatRes.json();
  assert(chatRes.ok, "Chatbot request failed: " + JSON.stringify(chatJson));
  assert(chatJson.reply && chatJson.reply.length > 50, "Chatbot response too short");
  assert(chatJson.conversationId === testConvId, "Response must belong to requested conversationId");
  console.log("✓ Chatbot reply received:", chatJson.reply.substring(0, 100) + "...");

  // Verify conversation list includes thread
  const convListRes = await fetch(`${baseUrl}/api/chatbot/conversations`, {
    headers: authHeaders,
  });
  const convListJson = await convListRes.json();
  assert(convListRes.ok && convListJson.conversations.length > 0, "Expected at least 1 saved conversation");
  console.log(`✓ Verified ${convListJson.conversations.length} saved conversations in candidate memory.`);

  // Verify conversation detail
  const convDetailRes = await fetch(`${baseUrl}/api/chatbot/conversations/${testConvId}`, {
    headers: authHeaders,
  });
  const convDetailJson = await convDetailRes.json();
  assert(convDetailRes.ok && convDetailJson.messages.length >= 2, "Expected user and assistant messages in thread");
  console.log(`✓ Verified ${convDetailJson.messages.length} messages loaded for active thread.`);

  // 3. Technical Round Setup & Generation
  console.log("\n3. Testing Module 2: Technical Interview Round (MCQ)...");
  const techStartRes = await fetch(`${baseUrl}/api/technical/start`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      jobRole: "Python Developer",
      topics: ["Python Fundamentals", "Object-Oriented Programming", "Data Structures"],
      questionCount: 5,
      durationMinutes: 15,
      assessmentMode: "PRACTICE",
    }),
  });

  const techStartJson = await techStartRes.json();
  assert(techStartRes.ok, "Technical start failed: " + JSON.stringify(techStartJson));
  const sessionId = techStartJson.data.sessionId;
  const questions = techStartJson.data.questions;
  assert(questions.length === 5, "Expected 5 questions, got " + questions.length);
  console.log(`✓ Technical session initialized (${sessionId}) with 5 questions.`);

  // 4. Practice Mode Check Answer & Real-Time Autosave
  console.log("4. Testing Practice Mode instant answer check & autosave...");
  const firstQ = questions[0];

  // Test autosave
  const saveRes = await fetch(`${baseUrl}/api/technical/save-answer`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sessionId,
      questionId: firstQ.id,
      selectedOption: "B",
      isSkipped: false,
    }),
  });
  const saveJson = await saveRes.json();
  assert(saveRes.ok && saveJson.success, "Save answer failed: " + JSON.stringify(saveJson));
  console.log("✓ Real-time answer autosave confirmed!");

  const checkRes = await fetch(`${baseUrl}/api/technical/check-answer`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sessionId,
      questionId: firstQ.id,
      selectedOption: "A",
      hintUsed: false,
    }),
  });
  const checkJson = await checkRes.json();
  assert(checkRes.ok, "Check answer failed: " + JSON.stringify(checkJson));
  console.log("✓ Practice answer checked! Result:", checkJson.data?.isCorrect ? "Correct" : "Incorrect");

  // 5. Submit Technical Round
  console.log("5. Submitting Technical Round answers...");
  const answers: Record<string, string> = {};
  questions.forEach((q: any) => {
    answers[q.id] = q.correctOption || "A";
  });

  const techSubmitRes = await fetch(`${baseUrl}/api/technical/submit`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sessionId,
      answers,
      timeSpentSec: 180,
    }),
  });
  const techSubmitJson = await techSubmitRes.json();
  assert(techSubmitRes.ok, "Technical submit failed: " + JSON.stringify(techSubmitJson));
  console.log(`✓ Technical round submitted! Score: ${techSubmitJson.data.scorePercentage}%`);

  // 6. Behavioral Round Start
  console.log("\n6. Testing Module 3: Behavioral Interview Round...");
  const behStartRes = await fetch(`${baseUrl}/api/behavioral/start`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      role: "Python Developer",
      company: "Google",
      fromSession: sessionId,
    }),
  });
  const behStartJson = await behStartRes.json();
  assert(behStartRes.ok, "Behavioral start failed: " + JSON.stringify(behStartJson));
  const behQuestions = behStartJson.data.questions;
  console.log(`✓ Behavioral session created with ${behQuestions.length} STAR questions.`);

  // 7. Submit Behavioral STAR Answer
  console.log("7. Evaluating candidate response with STAR framework...");
  const starAnswer =
    "At my previous software internship, our data ingestion service experienced intermittent connection drops during nightly ETL jobs (Situation). " +
    "My task was to diagnose the root cause and ensure zero data loss under strict SLAs (Task). " +
    "I analyzed error logs, implemented exponential backoff retries with circuit breakers in Python, and added Prometheus metrics for socket latency (Action). " +
    "As a result, ETL job failures dropped by 98% and automated recovery occurred within 1.5 seconds without manual intervention (Result).";

  const behAnswerRes = await fetch(`${baseUrl}/api/behavioral/answer`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sessionId: behStartJson.data.sessionId,
      questionId: behQuestions[0].id,
      transcript: starAnswer,
      durationSeconds: 65,
      isTextOnly: false,
      userConsented: true,
    }),
  });
  const behAnswerJson = await behAnswerRes.json();
  assert(behAnswerRes.ok, "Behavioral answer evaluation failed: " + JSON.stringify(behAnswerJson));
  console.log("✓ Behavioral response evaluated via STAR rubric!");

  // 8. End Behavioral Round
  const behEndRes = await fetch(`${baseUrl}/api/behavioral/end`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sessionId: behStartJson.data.sessionId,
    }),
  });
  const behEndJson = await behEndRes.json();
  assert(behEndRes.ok, "Behavioral end failed: " + JSON.stringify(behEndJson));
  console.log(`✓ Behavioral round finalized! Behavioral Score: ${behEndJson.data.behavioralScore}%`);

  // 9. HR Round Start
  console.log("\n8. Testing Module 4: HR Interview Round (Sarah Jenkins)...");
  const hrStartRes = await fetch(`${baseUrl}/api/hr/start`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      role: "Python Developer",
      company: "Google",
      experienceLevel: "FRESHER",
      tone: "PROFESSIONAL",
      fromSession: sessionId,
    }),
  });
  const hrStartJson = await hrStartRes.json();
  assert(hrStartRes.ok, "HR start failed: " + JSON.stringify(hrStartJson));
  const hrQuestions = hrStartJson.data.questions;
  console.log(`✓ HR round started with ${hrQuestions.length} standard inquiries.`);

  // 10. Submit HR Answer
  console.log("9. Evaluating candidate response with HR Director 5-criteria rubric...");
  const hrAnswerText =
    "I am enthusiastic about joining Google because of your engineering excellence and commitment to scalable infrastructure. " +
    "During my university projects, I focused on high-throughput microservices. " +
    "My greatest strength is my curiosity and proactive problem solving, while I continually refine my public technical speaking.";

  const hrAnswerRes = await fetch(`${baseUrl}/api/hr/answer`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sessionId: hrStartJson.data.sessionId,
      questionId: hrQuestions[0].id,
      transcript: hrAnswerText,
      durationSeconds: 45,
    }),
  });
  const hrAnswerJson = await hrAnswerRes.json();
  assert(hrAnswerRes.ok, "HR answer evaluation failed: " + JSON.stringify(hrAnswerJson));
  console.log(`✓ HR answer scored: ${hrAnswerJson.data.evaluation.overallScore}%`);

  // 11. End HR Round & Aggregate Combined Overall Score
  console.log("10. Finalizing HR round & aggregating combined multi-round scores...");
  const hrEndRes = await fetch(`${baseUrl}/api/hr/end`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sessionId: hrStartJson.data.sessionId,
    }),
  });
  const hrEndJson = await hrEndRes.json();
  assert(hrEndRes.ok, "HR end failed: " + JSON.stringify(hrEndJson));
  console.log(`✓ HR Score: ${hrEndJson.data.hrScore}%, Combined Overall Score: ${hrEndJson.data.overallScore}%`);

  // 11b. Test HR Interview Video Recording System & Repository
  console.log("\n10b. Testing HR Interview Video Recording System & Repository...");
  const mockVideoBuffer = Buffer.from("MOCK-WEBM-VIDEO-STREAM-CONTENT-DATA-FOR-TESTING");
  const recFormData = new FormData();
  const recBlob = new Blob([mockVideoBuffer], { type: "video/webm" });
  recFormData.append("video", recBlob, "hr-interview.webm");
  recFormData.append("sessionId", hrStartJson.data.sessionId);
  recFormData.append("jobRole", "Python Developer");
  recFormData.append("title", "HR Round - Python Developer");
  recFormData.append("duration", "45");

  const recUploadRes = await fetch(`${baseUrl}/api/hr/recordings/upload`, {
    method: "POST",
    headers: { Cookie: loginCookie.split(";")[0] },
    body: recFormData,
  });
  const recUploadJson = await recUploadRes.json();
  assert(recUploadRes.ok && recUploadJson.success, "Upload recording failed: " + JSON.stringify(recUploadJson));
  const testRecordingId = recUploadJson.data.recording.id;
  console.log(`✓ Video recording uploaded successfully (ID: ${testRecordingId}, Duration: 45s).`);

  // Verify listing
  const recListRes = await fetch(`${baseUrl}/api/hr/recordings`, {
    headers: authHeaders,
  });
  const recListJson = await recListRes.json();
  assert(recListRes.ok && recListJson.data.recordings.length > 0, "Recordings list must not be empty");
  console.log(`✓ Verified ${recListJson.data.recordings.length} HR recording(s) in repository.`);

  // Verify stream with range
  const recStreamRes = await fetch(`${baseUrl}/api/hr/recordings/${testRecordingId}`, {
    headers: {
      Cookie: loginCookie.split(";")[0],
      Range: "bytes=0-15",
    },
  });
  assert(recStreamRes.status === 206 || recStreamRes.status === 200, "Recording stream failed");
  console.log("✓ Video recording streamed with HTTP status:", recStreamRes.status);

  // Verify download
  const recDlRes = await fetch(`${baseUrl}/api/hr/recordings/${testRecordingId}/download`, {
    headers: { Cookie: loginCookie.split(";")[0] },
  });
  assert(recDlRes.ok, "Recording download failed");
  assert(recDlRes.headers.get("content-disposition")?.includes("attachment"), "Must include Content-Disposition attachment");
  console.log("✓ Video recording downloaded with Content-Disposition header.");

  // Verify delete
  const recDelRes = await fetch(`${baseUrl}/api/hr/recordings/${testRecordingId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  const recDelJson = await recDelRes.json();
  assert(recDelRes.ok && recDelJson.success, "Recording deletion failed");
  console.log("✓ Video recording successfully deleted from repository & storage.");

  // 12. Final Performance Report
  console.log("\n11. Testing Module 5: Final Performance Report...");
  const reportRes = await fetch(`${baseUrl}/api/reports/${sessionId}`, {
    method: "GET",
    headers: authHeaders,
  });
  const reportJson = await reportRes.json();
  assert(reportRes.ok, "Report fetch failed: " + JSON.stringify(reportJson));
  console.log("✓ Final Performance Report retrieved:");
  console.log("   - Technical Score:", reportJson.data.scores.technical + "%");
  console.log("   - Behavioral Score:", reportJson.data.scores.behavioral + "%");
  console.log("   - HR Score:", reportJson.data.scores.hr + "%");
  console.log("   - Combined Overall Score:", reportJson.data.scores.overall + "%");
  assert(reportJson.data.formulaExplanation, "Formula explanation missing");
  console.log("   - Formula Explanation:", reportJson.data.formulaExplanation);
  assert(Array.isArray(reportJson.data.technicalQuestions), "technicalQuestions missing");
  assert(Array.isArray(reportJson.data.behavioralQuestions), "behavioralQuestions missing");
  assert(Array.isArray(reportJson.data.hrQuestions), "hrQuestions missing");
  assert(Array.isArray(reportJson.data.practicalNextSteps), "practicalNextSteps missing");
  console.log(`   - Audited Questions: Tech=${reportJson.data.technicalQuestions.length}, Beh=${reportJson.data.behavioralQuestions.length}, HR=${reportJson.data.hrQuestions.length}`);

  // 13. Verify Dashboard Statistics API
  console.log("\n12. Testing Dashboard Statistics & Cards API...");
  const dashRes = await fetch(`${baseUrl}/api/dashboard`, {
    method: "GET",
    headers: authHeaders,
  });
  const dashJson = await dashRes.json();
  assert(dashRes.ok, "Dashboard fetch failed: " + JSON.stringify(dashJson));
  console.log("✓ Dashboard Statistics verified:");
  console.log("   - Total Interviews:", dashJson.data.stats.totalInterviews);
  console.log("   - Average Performance:", dashJson.data.stats.averageScore + "%");
  console.log("   - Technical Round Score:", dashJson.data.stats.technicalRoundScore + "%");
  console.log("   - Behavioral Round Score:", dashJson.data.stats.behavioralRoundScore + "%");
  console.log("   - HR Round Score:", dashJson.data.stats.hrRoundScore + "%");
  console.log("   - Overall Improvement:", dashJson.data.stats.overallImprovement);

  console.log("\n=================================================");
  console.log("ALL 5 MODULES & USER FLOWS PASSED WITH 100% SUCCESS!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
