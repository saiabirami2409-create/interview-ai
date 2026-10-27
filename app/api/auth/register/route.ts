import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/session";
import { apiSuccess, apiError } from "@/lib/api-response";

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full Name must be at least 2 characters").optional(),
    name: z.string().trim().min(2, "Full Name must be at least 2 characters").optional(),
    email: z.string().trim().email("Please enter a valid email address").transform((val) => val.toLowerCase()),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().optional(),
    targetRole: z.string().optional().default("Software Engineer"),
  })
  .refine(
    (data) => {
      const resolvedName = (data.fullName || data.name || "").trim();
      return resolvedName.length >= 2;
    },
    {
      message: "Full Name is required and must be at least 2 characters",
      path: ["fullName"],
    }
  )
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== "") {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const err of parsed.error.issues) {
        const field = err.path.join(".") || "form";
        fieldErrors[field] = fieldErrors[field] || [];
        fieldErrors[field].push(err.message);
      }
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid registration data",
        400,
        fieldErrors
      );
    }

    const resolvedName = (parsed.data.fullName || parsed.data.name || "").trim();
    const normalizedEmail = parsed.data.email;
    const { password, targetRole } = parsed.data;

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return apiError(
        "AUTH_EMAIL_EXISTS",
        "An account with this email address already exists. Please sign in.",
        409
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: resolvedName,
        email: normalizedEmail,
        passwordHash,
        role: "STUDENT",
        profile: {
          create: {
            targetRole: targetRole || "Software Engineer",
            experienceLevel: "FRESHER",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        details: `User registered with email: ${normalizedEmail}`,
      },
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const responsePayload = {
      user: {
        id: user.id,
        fullName: user.name,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
      session: {
        expiresAt,
      },
      message: "Account created successfully! Please sign in with your credentials.",
    };

    return apiSuccess(responsePayload, 201);
  } catch (error) {
    console.error("Registration error:", error);
    return apiError(
      "INTERNAL_ERROR",
      "Registration failed. Please try again.",
      500
    );
  }
}
