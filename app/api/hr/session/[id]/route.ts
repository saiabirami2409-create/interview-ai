import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  const { id: sessionId } = await params;

  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          include: { answer: { include: { evaluation: true } } },
        },
        report: true,
      },
    });

    if (!session || session.userId !== auth.user.id) {
      return apiError("NOT_FOUND", "HR session not found or unauthorized", 404);
    }

    return apiSuccess({ session });
  } catch (err: any) {
    console.error("Fetch HR session error:", err);
    return apiError("FETCH_HR_FAILED", err.message || "Failed to fetch session", 500);
  }
}
