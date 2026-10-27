import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { requireAuth } from "@/server/auth/guard";

const profileSchema = z.object({
  college: z.string().optional().nullable(),
  degree: z.string().optional().nullable(),
  graduationYear: z.number().optional().nullable(),
  targetRole: z.string().min(1, "Target role is required"),
  experienceLevel: z.string().default("FRESHER"),
  targetCompanies: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  skills: z.array(z.string()).optional().default([]),
});

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: auth.user.id },
    include: { skills: true },
  });

  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { college, degree, graduationYear, targetRole, experienceLevel, targetCompanies, bio, skills } = parsed.data;

    const profile = await prisma.studentProfile.upsert({
      where: { userId: auth.user.id },
      create: {
        userId: auth.user.id,
        college,
        degree,
        graduationYear,
        targetRole,
        experienceLevel,
        targetCompanies,
        bio,
      },
      update: {
        college,
        degree,
        graduationYear,
        targetRole,
        experienceLevel,
        targetCompanies,
        bio,
      },
    });

    // Update skills if provided
    if (skills && skills.length > 0) {
      // Remove old skills
      await prisma.studentSkill.deleteMany({
        where: { profileId: profile.id },
      });

      // Insert new skills
      for (const skillName of skills) {
        if (skillName.trim()) {
          await prisma.studentSkill.create({
            data: {
              profileId: profile.id,
              skillName: skillName.trim(),
              proficiency: 75,
            },
          });
        }
      }
    }

    const updatedProfile = await prisma.studentProfile.findUnique({
      where: { id: profile.id },
      include: { skills: true },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Profile save error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
