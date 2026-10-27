import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { STANDARD_HR_QUESTIONS } from "@/server/ai/hr-service";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to start HR round", 401);
  }

  try {
    const body = await req.json();
    const role = (body.role || "Software Engineer").trim();
    const company = (body.company || "Google").trim();
    const experienceLevel = body.experienceLevel || "FRESHER";
    const parentAssessmentId = body.fromSession || null;

    let session = null;
    if (parentAssessmentId) {
      session = await prisma.interviewSession.findFirst({
        where: {
          userId: auth.user.id,
          parentAssessmentId,
          interviewType: "HR",
        },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { answer: { include: { evaluation: true } } },
          },
        },
      });
    }

    if (!session) {
      session = await prisma.interviewSession.create({
        data: {
          userId: auth.user.id,
          title: `Round 3 — ${role} HR Director Interview (${company})`,
          targetRole: role,
          companyName: company,
          interviewType: "HR",
          difficulty: "INTERMEDIATE",
          questionCount: STANDARD_HR_QUESTIONS.length,
          timeLimitMinutes: 20,
          status: "IN_PROGRESS",
          startedAt: new Date(),
          parentAssessmentId,
          roundProgress: JSON.stringify({
            technical: "COMPLETED",
            behavioral: "COMPLETED",
            hr: "IN_PROGRESS",
          }),
          questions: {
            create: STANDARD_HR_QUESTIONS.map((q) => ({
              orderIndex: q.orderIndex,
              questionText: q.questionText,
              category: q.category,
              difficulty: "INTERMEDIATE",
              relevantSkills: JSON.stringify(["Culture Fit", "Communication", "Professional Presence"]),
              expectedCriteria: q.expectedCriteria,
              hints: "Speak authentically, maintain steady cadence, and relate your answers to team impact.",
            })),
          },
        },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { answer: { include: { evaluation: true } } },
          },
        },
      });
    }

    return apiSuccess({
      sessionId: session.id,
      title: session.title,
      targetRole: session.targetRole,
      companyName: session.companyName,
      questions: session.questions.map((q) => ({
        id: q.id,
        orderIndex: q.orderIndex,
        questionText: q.questionText,
        category: q.category,
        expectedCriteria: q.expectedCriteria,
        hints: q.hints,
        answer: q.answer
          ? {
              id: q.answer.id,
              answerText: q.answer.answerText,
              evaluation: q.answer.evaluation,
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error("HR start error:", error);
    return apiError("HR_START_FAILED", error.message || "Failed to start HR round", 500);
  }
}
