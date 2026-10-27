import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { verifyPassword, setSessionCookie } from "@/server/auth/session";
import { apiSuccess, apiError } from "@/lib/api-response";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").transform((val) => val.toLowerCase()),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid login data",
        400
      );
    }

    const { email: normalizedEmail, password, rememberMe } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      return apiError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid email or password",
        401
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return apiError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid email or password",
        401
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      fullName: user.name,
      email: user.email,
      role: user.role,
    };

    await setSessionCookie(sessionUser);

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: "USER_LOGGED_IN",
        details: `Successful login for ${normalizedEmail}`,
      },
    });

    const sessionDurationDays = rememberMe ? 14 : 1;
    const expiresAt = new Date(Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000).toISOString();

    return apiSuccess({
      user: {
        id: user.id,
        fullName: user.name,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      session: {
        expiresAt,
      },
      profile: user.profile,
    });
  } catch (error) {
    console.error("Login error:", error);
    return apiError(
      "INTERNAL_ERROR",
      "Login failed. Please check your connection.",
      500
    );
  }
}
