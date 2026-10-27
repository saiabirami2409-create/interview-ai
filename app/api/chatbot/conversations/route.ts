import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  try {
    const user = await getServerSession();
    if (!user) {
      // Guest mode - no saved conversations
      return NextResponse.json({
        success: true,
        conversations: [],
        isGuest: true,
      });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            message: true,
            createdAt: true,
            sender: true,
          },
        },
      },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
      lastMessage: conv.messages[0]?.message || "",
      lastMessageAt: conv.messages[0]?.createdAt || conv.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      conversations: formatted,
      isGuest: false,
    });
  } catch (err: any) {
    console.error("Chatbot conversations GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to create persistent conversations", isGuest: true },
        { status: 401 }
      );
    }

    let title = "New Conversation";
    try {
      const body = await req.json();
      if (body.title && typeof body.title === "string" && body.title.trim()) {
        title = body.title.trim().slice(0, 80);
      }
    } catch {
      // JSON body is optional
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        userId: user.id,
        title,
      },
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: 0,
      },
    });
  } catch (err: any) {
    console.error("Chatbot conversations POST error:", err);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
