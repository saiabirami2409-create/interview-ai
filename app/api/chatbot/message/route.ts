import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import {
  generateChatbotReply,
  generateConversationTitle,
} from "@/server/ai/chatbot-service";

const chatInputSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  conversationId: z.string().optional(),
  context: z.string().optional().default("GENERAL"),
  activeAssessment: z.boolean().optional().default(false),
  activeInterviewQuestion: z
    .object({
      roundNumber: z.number(),
      roundName: z.string(),
      questionId: z.string(),
      questionText: z.string(),
      category: z.string().optional(),
      options: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getServerSession();
    const body = await req.json();
    const parsed = chatInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { message, context, activeAssessment, activeInterviewQuestion } = parsed.data;
    let targetConversationId = parsed.data.conversationId;

    // Guest mode (unauthenticated visitor)
    if (!user) {
      const botResponse = await generateChatbotReply({
        message,
        context,
        activeAssessment,
        activeInterviewQuestion,
      });

      return NextResponse.json({
        success: true,
        conversationId: null,
        reply: botResponse.reply,
        intent: botResponse.intent,
        detectedAnswer: botResponse.detectedAnswer,
        suggestedFollowUps: botResponse.suggestedFollowUps || [],
        isFallback: botResponse.isFallback,
        modelUsed: botResponse.modelUsed,
        sources: botResponse.sources || [],
        searchQueries: botResponse.searchQueries || [],
        groundingUsed: Boolean(botResponse.groundingUsed),
        isGuest: true,
      });
    }

    // Authenticated user: verify or initialize conversation
    let conversation = null;
    if (targetConversationId) {
      conversation = await prisma.chatConversation.findFirst({
        where: {
          id: targetConversationId,
          userId: user.id,
        },
      });
    }

    if (!conversation) {
      const generatedTitle = generateConversationTitle(message);
      conversation = await prisma.chatConversation.create({
        data: {
          userId: user.id,
          title: generatedTitle,
        },
      });
      targetConversationId = conversation.id;
    } else if (conversation.title === "New Conversation") {
      // Update default placeholder title with the first meaningful query
      const newTitle = generateConversationTitle(message);
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { title: newTitle },
      });
    }

    // 1. Save user message to database
    await prisma.chatMessage.create({
      data: {
        userId: user.id,
        conversationId: targetConversationId,
        sender: "user",
        message,
        context,
      },
    });

    // 2. Fetch recent conversation history in this thread (last 10 turns)
    const recentHistory = await prisma.chatMessage.findMany({
      where: {
        userId: user.id,
        conversationId: targetConversationId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedHistory = recentHistory.reverse().map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.message,
    }));

    // Retrieve user's completed performance records for personalized coaching
    let userPerformanceContext = "";
    try {
      const recentAptitude = await prisma.aptitudeAssessment.findFirst({
        where: { userId: user.id, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
      });
      const recentTechnical = await prisma.interviewSession.findFirst({
        where: { userId: user.id, interviewType: "TECHNICAL", status: "COMPLETED" },
        include: { questions: { include: { answer: true } } },
        orderBy: { completedAt: "desc" },
      });
      const recentProject = await prisma.projectInterview.findFirst({
        where: { userId: user.id, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
      });

      const parts: string[] = [];
      if (recentAptitude) {
        parts.push(
          `Recent Aptitude Round: Score ${recentAptitude.score}%. Category: ${recentAptitude.category}. Correct Count: ${recentAptitude.correctCount}/${recentAptitude.totalQuestions}. Questions & Answers: ${recentAptitude.answers || "{}"}`
        );
      }
      if (recentTechnical) {
        const questionsSummary = recentTechnical.questions
          .slice(0, 5)
          .map(
            (q) =>
              `Q: "${q.questionText}" -> Candidate Choice: ${q.answer?.selectedOption || "Skipped"}, Correct: ${q.correctOption}, Explanation: ${q.explanation || ""}`
          )
          .join(" | ");
        parts.push(
          `Recent Technical Round: Score ${recentTechnical.technicalScore || recentTechnical.overallScore}%. ${questionsSummary}`
        );
      }
      if (recentProject) {
        parts.push(
          `Recent Project Round: Score ${recentProject.score}%. Recommendations: ${recentProject.recommendations || "[]"}`
        );
      }
      userPerformanceContext = parts.join("\n");
    } catch {
      // Non-critical performance context retrieval
    }

    // 3. Generate response using AI Service
    const botResponse = await generateChatbotReply({
      message,
      history: formattedHistory,
      context,
      activeAssessment,
      userPerformanceContext,
      activeInterviewQuestion,
    });

    // 4. Save assistant response to database
    const assistantRecord = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        conversationId: targetConversationId,
        sender: "assistant",
        message: botResponse.reply,
        context,
      },
    });

    // 5. Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: targetConversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      conversationId: targetConversationId,
      reply: botResponse.reply,
      intent: botResponse.intent,
      detectedAnswer: botResponse.detectedAnswer,
      messageId: assistantRecord.id,
      suggestedFollowUps: botResponse.suggestedFollowUps || [],
      isFallback: botResponse.isFallback,
      modelUsed: botResponse.modelUsed,
      sources: botResponse.sources || [],
      searchQueries: botResponse.searchQueries || [],
      groundingUsed: Boolean(botResponse.groundingUsed),
      isGuest: false,
    });
  } catch (err: any) {
    console.error("Chatbot message API error:", err);
    return NextResponse.json(
      { error: "Failed to generate chatbot response" },
      { status: 500 }
    );
  }
}
