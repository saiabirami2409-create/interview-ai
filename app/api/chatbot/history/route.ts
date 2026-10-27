import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function GET(req: Request) {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json({
        success: true,
        messages: [],
        isGuest: true,
      });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    const whereClause: any = { userId: user.id };
    if (conversationId) {
      whereClause.conversationId = conversationId;
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      take: 60,
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.sender as "user" | "assistant",
      content: m.message,
      context: m.context,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      success: true,
      messages: formatted,
      isGuest: false,
    });
  } catch (err: any) {
    console.error("Chatbot history API error:", err);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      await prisma.chatMessage.deleteMany({
        where: {
          userId: user.id,
          conversationId,
        },
      });
    } else {
      await prisma.chatMessage.deleteMany({
        where: { userId: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (err: any) {
    console.error("Chatbot clear history error:", err);
    return NextResponse.json(
      { error: "Failed to clear chat history" },
      { status: 500 }
    );
  }
}
