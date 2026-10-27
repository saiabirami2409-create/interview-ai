import { prisma } from "../../server/db/prisma";
import {
  generateChatbotReply,
  generateConversationTitle,
  SYSTEM_INSTRUCTION,
} from "../../server/ai/chatbot-service";
import { GET as getStatus } from "../../app/api/chatbot/status/route";
import { POST as postMessage } from "../../app/api/chatbot/message/route";
import {
  GET as getConversations,
  POST as postConversation,
} from "../../app/api/chatbot/conversations/route";
import {
  GET as getConversationDetail,
  DELETE as deleteConversation,
} from "../../app/api/chatbot/conversations/[id]/route";
import { POST as clearConversation } from "../../app/api/chatbot/conversations/[id]/clear/route";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function run() {
  console.log("\n=======================================================");
  console.log("RUNNING AI CHATBOT & CONVERSATION MEMORY TESTS");
  console.log("=======================================================\n");

  // 1. Status API Verification
  console.log("--- 1. Testing Status API (/api/chatbot/status) ---");
  const statusRes = await getStatus();
  const statusData = await statusRes.json();
  assert(statusRes.status === 200, "Status endpoint must return HTTP 200");
  assert(statusData.success === true, "Status response must indicate success: true");
  assert(typeof statusData.isOnline === "boolean", "isOnline must be a boolean");
  assert(typeof statusData.statusText === "string", "statusText must be a descriptive string");
  assert(typeof statusData.provider === "string", "provider must be specified");
  console.log(`Status Result: ${statusData.statusText} (${statusData.provider})`);

  // 2. Chatbot System Instruction & Security Boundaries
  console.log("\n--- 2. Testing Chatbot Persona, Mandated Roles & Security ---");
  const sysLower = SYSTEM_INSTRUCTION.toLowerCase();
  assert(
    sysLower.includes("interviewai assistant"),
    "System instruction must identify as InterviewAI Assistant"
  );
  assert(
    sysLower.includes("star method"),
    "System instruction must mandate STAR method for behavioral rounds"
  );
  assert(
    sysLower.includes("python") && sysLower.includes("java"),
    "System instruction must cover core programming languages"
  );
  assert(
    sysLower.includes("dbms") && sysLower.includes("acid"),
    "System instruction must cover DBMS and ACID properties"
  );
  assert(
    sysLower.includes("operating systems"),
    "System instruction must cover Operating Systems"
  );
  assert(
    sysLower.includes("assessment integrity protection"),
    "System instruction must enforce active assessment integrity protection"
  );
  assert(
    sysLower.includes("<user_query>"),
    "System instruction must isolate untrusted inputs within <user_query> boundary"
  );

  // 3. Title Generator Logic
  console.log("\n--- 3. Testing Conversation Title Synthesis ---");
  const title1 = generateConversationTitle("Explain polymorphism in Java with an example");
  assert(title1.length > 0, "Generated title must be non-empty");
  assert(title1.toLowerCase().includes("polymorphism"), "Title must capture core subject");
  const title2 = generateConversationTitle("");
  assert(title2 === "Interview Preparation", "Empty string must yield fallback title");

  // 4. Intelligence & Fallback Coaching across Modules
  console.log("\n--- 4. Testing Structured AI Coaching Responses ---");

  // A. Behavioral STAR Question
  const starReply = await generateChatbotReply({
    message: "How do I answer a behavioral question about team conflict using STAR?",
  });
  assert(starReply.reply.includes("STAR Method"), "STAR reply must explain the STAR framework");
  assert(starReply.reply.includes("Situation"), "STAR reply must contain Situation");
  assert(starReply.reply.includes("Task"), "STAR reply must contain Task");
  assert(starReply.reply.includes("Action"), "STAR reply must contain Action");
  assert(starReply.reply.includes("Result"), "STAR reply must contain Result");
  assert(
    Boolean(starReply.suggestedFollowUps && starReply.suggestedFollowUps.length > 0),
    "STAR reply must suggest follow-up questions"
  );

  // B. HR Self Introduction
  const hrReply = await generateChatbotReply({
    message: "Tell me about yourself HR pitch",
  });
  assert(
    hrReply.reply.includes("Tell Me About Yourself"),
    "HR reply must address the self-introduction prompt"
  );
  assert(
    hrReply.reply.includes("Present-Past-Future"),
    "HR reply must provide the Present-Past-Future framework"
  );

  // C. Technical Programming (Polymorphism)
  const techReply = await generateChatbotReply({
    message: "Explain polymorphism in Java and method overriding",
  });
  assert(
    techReply.reply.includes("Polymorphism"),
    "Technical reply must explain polymorphism"
  );
  assert(
    techReply.reply.includes("Compile-Time") || techReply.reply.includes("Method Overriding"),
    "Technical reply must explain method overriding / compile vs runtime"
  );

  // D. Core CS: Operating Systems
  const osReply = await generateChatbotReply({
    message: "What are the deadlock conditions in OS?",
  });
  assert(
    osReply.reply.includes("Deadlock") || osReply.reply.includes("Process"),
    "OS reply must explain deadlocks or processes"
  );
  assert(
    osReply.reply.includes("Mutual Exclusion") || osReply.reply.includes("Coffman"),
    "OS reply must list Coffman conditions or mutual exclusion"
  );

  // E. Assessment Protection Test (Socratic Hinting)
  console.log("\n--- 5. Testing Assessment Integrity & Socratic Hinting ---");
  const examReply = await generateChatbotReply({
    message: "Which option is correct for this MCQ? Option A, B, C, or D?",
    activeAssessment: true,
  });
  assert(
    examReply.reply.includes("active interview round") || examReply.reply.includes("Assessment Hint"),
    "Active assessment query must trigger assessment protection notice"
  );
  assert(
    !examReply.reply.includes("The correct answer is Option B"),
    "Active assessment query must not reveal direct answer"
  );

  // 6. Database Multi-turn Conversation Memory & Thread Isolation
  console.log("\n--- 6. Testing Database Conversation Persistence & Multi-turn Isolation ---");

  // Create or verify test user
  let testUser = await prisma.user.findFirst({
    where: { email: "chat_test_user@interviewai.io" },
  });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: "chat_test_user@interviewai.io",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyzaBCDEFGHIJKLMNOPQRSTU",
        name: "Chat Test Candidate",
        role: "CANDIDATE",
      },
    });
  }

  // Create Conversation Thread 1
  const conv1 = await prisma.chatConversation.create({
    data: {
      userId: testUser.id,
      title: "Java OOP Thread",
    },
  });
  assert(Boolean(conv1.id), "Conversation 1 created with ID");

  // Post User & Assistant Messages in Thread 1
  await prisma.chatMessage.create({
    data: {
      userId: testUser.id,
      conversationId: conv1.id,
      sender: "user",
      message: "What is an abstract class in Java?",
      context: "TECHNICAL",
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: testUser.id,
      conversationId: conv1.id,
      sender: "assistant",
      message: "An abstract class in Java is a class declared with the `abstract` keyword...",
      context: "TECHNICAL",
    },
  });

  // Create Conversation Thread 2
  const conv2 = await prisma.chatConversation.create({
    data: {
      userId: testUser.id,
      title: "STAR Behavioral Thread",
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: testUser.id,
      conversationId: conv2.id,
      sender: "user",
      message: "Give me an example of handling a missed deadline.",
      context: "BEHAVIORAL",
    },
  });

  // Verify Thread Isolation
  const thread1Messages = await prisma.chatMessage.findMany({
    where: { conversationId: conv1.id },
  });
  assert(thread1Messages.length === 2, `Thread 1 must contain exactly 2 messages (got ${thread1Messages.length})`);
  assert(thread1Messages[0].message.includes("abstract class"), "Thread 1 message content verified");

  const thread2Messages = await prisma.chatMessage.findMany({
    where: { conversationId: conv2.id },
  });
  assert(thread2Messages.length === 1, `Thread 2 must contain exactly 1 message (got ${thread2Messages.length})`);
  assert(thread2Messages[0].message.includes("missed deadline"), "Thread 2 message content verified");

  // Test Clearing Conversation Messages
  await prisma.chatMessage.deleteMany({
    where: { conversationId: conv1.id },
  });
  const afterClear = await prisma.chatMessage.findMany({
    where: { conversationId: conv1.id },
  });
  assert(afterClear.length === 0, "Thread 1 messages successfully cleared");

  // Test Deleting Conversation Thread (Cascade)
  await prisma.chatConversation.delete({
    where: { id: conv2.id },
  });
  const conv2Check = await prisma.chatConversation.findUnique({
    where: { id: conv2.id },
  });
  assert(conv2Check === null, "Thread 2 successfully deleted from database");

  const conv2MessagesCheck = await prisma.chatMessage.findMany({
    where: { conversationId: conv2.id },
  });
  assert(conv2MessagesCheck.length === 0, "Thread 2 messages deleted by cascade");

  // Clean up test user's test records
  await prisma.chatConversation.deleteMany({
    where: { userId: testUser.id },
  });

  console.log("\n=======================================================");
  console.log("ALL CHATBOT & CONVERSATION TESTS PASSED SUCCESSFULLY! ✓");
  console.log("=======================================================\n");
}

run()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
