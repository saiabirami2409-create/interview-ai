import { NextRequest } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getAdminQuestionReports } from "@/server/db/practice";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession();
    // Allow admin review (or review access for test/demo environments)
    const data = await getAdminQuestionReports();
    return apiSuccess(data);
  } catch (err: any) {
    console.error("Admin fetch reports error:", err);
    return apiError("ADMIN_FETCH_FAILED", err.message || "Failed to load admin reports", 500);
  }
}
