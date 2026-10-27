import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { buildCompleteReport } from "@/server/db/report-builder";

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
    const reportData = await buildCompleteReport(auth.user.id, sessionId);
    if (!reportData || reportData.hasSessions === false) {
      return apiError("NOT_FOUND", "Interview session not found or unauthorized", 404);
    }
    return apiSuccess(reportData);
  } catch (err: any) {
    console.error("Fetch report by ID error:", err);
    return apiError("FETCH_REPORT_FAILED", err.message || "Failed to load report", 500);
  }
}
