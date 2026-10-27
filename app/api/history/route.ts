import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { HistoryQuerySchema } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getAssessmentHistory } from "@/server/db/assessments";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsedQuery = HistoryQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      jobRole: searchParams.get("jobRole") ?? undefined,
      topic: searchParams.get("topic") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    });

    if (!parsedQuery.success) {
      return apiError("INVALID_QUERY_PARAMS", parsedQuery.error.issues[0]?.message || "Invalid query parameters", 400);
    }

    const history = await getAssessmentHistory({
      userId: auth.user.id,
      ...parsedQuery.data,
    });

    return apiSuccess(history);
  } catch (err: any) {
    console.error("Fetch history error:", err);
    return apiError("HISTORY_FETCH_FAILED", err.message || "Failed to load assessment history", 500);
  }
}
