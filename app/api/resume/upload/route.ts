import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { parseResumeBuffer } from "@/server/resume/parser";
import { prisma } from "@/server/db/prisma";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds maximum permitted size of 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseResumeBuffer(buffer, file.name, file.type);

    // Check if this is the user's first resume
    const existingCount = await prisma.resume.count({
      where: { userId: auth.user.id },
    });

    const isPrimary = existingCount === 0;

    const resume = await prisma.resume.create({
      data: {
        userId: auth.user.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        storagePath: `uploads/resumes/${auth.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        extractedText: parsed.text.slice(0, 10000), // store safe sample
        extractedSkills: JSON.stringify(parsed.skills),
        isPrimary,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: auth.user.id,
        action: "RESUME_UPLOADED",
        details: `Uploaded resume: ${file.name} (${file.size} bytes). Extracted ${parsed.skills.length} skills.`,
      },
    });

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileSize: resume.fileSize,
        isPrimary: resume.isPrimary,
        extractedSkills: parsed.skills,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload and parse resume" },
      { status: 500 }
    );
  }
}
