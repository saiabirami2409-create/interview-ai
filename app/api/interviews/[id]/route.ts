import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { getAssessmentSession } from "@/server/db/assessments";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;

  try {
    const data = await getAssessmentSession(id, auth.user.id);
    if (!data) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found or access denied", 404);
    }

    // Return typed success envelope + legacy session object for older views
    return NextResponse.json({
      success: true,
      data: {
        assessment: data.assessment,
        questions: data.questions,
      },
      // Legacy compatibility
      session: {
        ...data.rawSession,
        questions: data.questions.map((q) => ({
          ...q,
          questionText: q.question,
          category: q.topic,
          isMcq: true,
          options: [q.options.A, q.options.B, q.options.C, q.options.D],
        })),
        report: data.rawSession.report,
      },
      requestId: `req_${Date.now().toString(36)}`,
    });
  } catch (err: any) {
    console.error("Fetch assessment error:", err);
    return apiError("SERVER_ERROR", err.message || "Failed to load assessment", 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    const existing = await prisma.interviewSession.findFirst({
      where: { id, userId: auth.user.id },
    });

    if (!existing) {
      return apiError("ASSESSMENT_NOT_FOUND", "Assessment not found", 404);
    }

    const updated = await prisma.interviewSession.update({
      where: { id },
      data: {
        status: status || "COMPLETED",
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      },
    });

    return apiSuccess({ session: updated });
  } catch (err: any) {
    return apiError("UPDATE_FAILED", err.message || "Failed to update assessment", 500);
  }
}
