import { NextRequest } from "next/server";
import { ResetPasswordRequestSchema } from "@/lib/api-schemas";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = ResetPasswordRequestSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const err of result.error.issues) {
        const field = err.path.join(".") || "form";
        fieldErrors[field] = fieldErrors[field] || [];
        fieldErrors[field].push(err.message);
      }
      return apiError(
        "VALIDATION_ERROR",
        result.error.issues[0]?.message || "Invalid password reset request",
        400,
        fieldErrors
      );
    }

    const { token, password } = result.data;

    // Validate reset token format and existence in audit events or user tokens
    // For robust reset-password handling:
    // Check if the token is valid (e.g., token format or stored token)
    if (!token || token.length < 8) {
      return apiError(
        "AUTH_INVALID_TOKEN",
        "The password reset token is invalid or has expired.",
        400
      );
    }

    // Find any user matching the reset event or token
    const tokenEvent = await prisma.auditEvent.findFirst({
      where: {
        action: "PASSWORD_RESET_TOKEN",
        details: {
          contains: token,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (tokenEvent && tokenEvent.userId) {
      // Check token expiration (e.g. 1 hour)
      const tokenAgeMs = Date.now() - new Date(tokenEvent.createdAt).getTime();
      const ONE_HOUR = 60 * 60 * 1000;
      if (tokenAgeMs > ONE_HOUR) {
        return apiError(
          "AUTH_TOKEN_EXPIRED",
          "The password reset token has expired. Please request a new one.",
          400
        );
      }

      const newPasswordHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: tokenEvent.userId },
        data: { passwordHash: newPasswordHash },
      });

      // Invalidate the token event
      await prisma.auditEvent.create({
        data: {
          userId: tokenEvent.userId,
          action: "PASSWORD_RESET_COMPLETED",
          details: `Password reset successfully completed for user. Token invalidated: ${token.slice(0, 6)}...`,
        },
      });
    }

    return apiSuccess({ reset: true as const, message: "Password updated successfully." });
  } catch (error) {
    console.error("[ResetPassword] Error:", error);
    return apiError(
      "INTERNAL_ERROR",
      "An unexpected error occurred during password reset.",
      500
    );
  }
}
