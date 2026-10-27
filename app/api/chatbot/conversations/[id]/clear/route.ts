import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await prisma.chatMessage.deleteMany({
      where: {
        conversationId: id,
        userId: user.id,
      },
    });

    await prisma.chatConversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Conversation messages cleared successfully",
    });
  } catch (err: any) {
    console.error("Chatbot clear messages error:", err);
    return NextResponse.json(
      { error: "Failed to clear conversation messages" },
      { status: 500 }
    );
  }
}
