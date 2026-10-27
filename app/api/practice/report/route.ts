import { NextRequest } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { reportQuestion } from "@/server/db/practice";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession();
    const body = await req.json();

    const { questionId, reason, userNotes, suggestedCorrection, userEmail } = body;

    if (!questionId || !reason || !userNotes) {
      return apiError("INVALID_PAYLOAD", "Question ID, reason category, and notes are required", 400);
    }

    const report = await reportQuestion({
      questionId,
      userId: user?.id,
      userEmail: userEmail || user?.email,
      reason,
      userNotes,
      suggestedCorrection,
    });

    return apiSuccess({
      reportId: report.id,
      message: "Report submitted successfully. Our engineering review board will review this question.",
    });
  } catch (err: any) {
    console.error("Report question error:", err);
    return apiError("REPORT_FAILED", err.message || "Failed to submit question report", 500);
  }
}
