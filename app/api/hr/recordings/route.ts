import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const recordings = await prisma.hrRecording.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            targetRole: true,
            companyName: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { recordings },
    });
  } catch (error: any) {
    console.error("Failed to fetch HR recordings:", error);
    return NextResponse.json(
      { error: "Failed to retrieve HR recordings" },
      { status: 500 }
    );
  }
}
