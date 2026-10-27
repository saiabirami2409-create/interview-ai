import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { getBehavioralQuestionsForRole } from "@/server/ai/behavioral-evaluator";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to start behavioral round", 401);
  }

  try {
    const body = await req.json();
    const role = (body.role || body.targetRole || "Software Engineer").trim();
    const company = (body.company || "Google").trim();
    const parentAssessmentId = body.fromSession || body.parentAssessmentId || null;

    // Check if an active behavioral session exists for this parent or user
    let session = null;
    if (parentAssessmentId) {
      session = await prisma.interviewSession.findFirst({
        where: {
          userId: auth.user.id,
          parentAssessmentId,
          interviewType: "BEHAVIORAL",
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
      const templates = getBehavioralQuestionsForRole(role, 5);

      session = await prisma.interviewSession.create({
        data: {
          userId: auth.user.id,
          title: `Round 2 — ${role} Behavioral Interview (${company})`,
          targetRole: role,
          companyName: company,
          interviewType: "BEHAVIORAL",
          difficulty: "INTERMEDIATE",
          questionCount: templates.length,
          timeLimitMinutes: 25,
          status: "IN_PROGRESS",
          startedAt: new Date(),
          parentAssessmentId,
          roundProgress: JSON.stringify({
            technical: "COMPLETED",
            behavioral: "IN_PROGRESS",
            hr: "NOT_ATTEMPTED",
          }),
          questions: {
            create: templates.map((t, idx) => ({
              orderIndex: idx,
              questionText: t.questionText,
              category: t.category,
              difficulty: "INTERMEDIATE",
              relevantSkills: JSON.stringify([t.competency, "STAR Method", "Leadership"]),
              expectedCriteria: t.expectedCriteria,
              hints: t.hints,
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
    console.error("Behavioral start error:", error);
    return apiError("BEHAVIORAL_START_FAILED", error.message || "Failed to start behavioral round", 500);
  }
}
