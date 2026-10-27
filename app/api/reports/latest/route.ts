import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import { buildCompleteReport } from "@/server/db/report-builder";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const reportData = await buildCompleteReport(auth.user.id);
    return apiSuccess(reportData);
  } catch (err: any) {
    console.error("Fetch latest report error:", err);
    return apiError("FETCH_REPORT_FAILED", err.message || "Failed to load report", 500);
  }
}
