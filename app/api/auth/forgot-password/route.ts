import { NextRequest } from "next/server";
import { ForgotPasswordRequestSchema } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = ForgotPasswordRequestSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const err of result.error.issues) {
        const field = err.path.join(".") || "form";
        fieldErrors[field] = fieldErrors[field] || [];
        fieldErrors[field].push(err.message);
      }
      return apiError(
        "VALIDATION_ERROR",
        "Please provide a valid email address.",
        400,
        fieldErrors
      );
    }

    // Generic success response to prevent account enumeration as specified in prompt section 24
    return apiSuccess({ accepted: true as const });
  } catch (error) {
    console.error("[ForgotPassword] Error:", error);
    return apiError(
      "INTERNAL_ERROR",
      "An unexpected error occurred. Please try again.",
      500
    );
  }
}
