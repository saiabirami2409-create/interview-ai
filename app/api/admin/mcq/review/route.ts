import { NextRequest } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { adminReviewAndCorrectQuestion } from "@/server/db/practice";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession();
    const body = await req.json();

    const {
      reportId,
      questionId,
      questionText,
      codeSnippet,
      languageVersion,
      isVersionDependent,
      versionWarning,
      options,
      correctOptionIndex,
      explanation,
      optionExplanations,
      referenceTitle,
      referenceUrl,
      status = "ACTIVE",
      adminNotes,
      resolutionAction = "RESOLVED",
    } = body;

    if (!questionId || !questionText || !options || correctOptionIndex === undefined) {
      return apiError("INVALID_PAYLOAD", "Missing required question parameters for review", 400);
    }

    const reviewerName = user?.name || "Admin Reviewer";

    const updatedQuestion = await adminReviewAndCorrectQuestion({
      reportId,
      questionId,
      questionText,
      codeSnippet,
      languageVersion,
      isVersionDependent,
      versionWarning,
      options,
      correctOptionIndex: Number(correctOptionIndex),
      explanation,
      optionExplanations: optionExplanations || {},
      referenceTitle,
      referenceUrl,
      status,
      adminNotes,
      reviewerName,
      resolutionAction,
    });

    return apiSuccess({
      question: updatedQuestion,
      message: `Question updated and marked as ${status}. Report marked as ${resolutionAction}.`,
    });
  } catch (err: any) {
    console.error("Admin review question error:", err);
    return apiError("ADMIN_REVIEW_FAILED", err.message || "Failed to update question", 500);
  }
}
