import { NextResponse } from "next/server";
import { requireAuth, verifyResumeOwnership } from "@/server/auth/guard";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const resumes = await prisma.resume.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  const formatted = resumes.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    fileSize: r.fileSize,
    fileType: r.fileType,
    isPrimary: r.isPrimary,
    extractedSkills: r.extractedSkills ? JSON.parse(r.extractedSkills) : [],
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ resumes: formatted });
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get("id");

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }

    const isOwner = await verifyResumeOwnership(resumeId, auth.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Resume not found or unauthorized" }, { status: 404 });
    }

    await prisma.resume.delete({
      where: { id: resumeId },
    });

    await prisma.auditEvent.create({
      data: {
        userId: auth.user.id,
        action: "RESUME_DELETED",
        details: `Deleted resume ID: ${resumeId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume deletion error:", error);
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }

    const isOwner = await verifyResumeOwnership(id, auth.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
    }

    // Set all resumes of this user to isPrimary: false
    await prisma.resume.updateMany({
      where: { userId: auth.user.id },
      data: { isPrimary: false },
    });

    // Set target resume to isPrimary: true
    await prisma.resume.update({
      where: { id },
      data: { isPrimary: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set primary error:", error);
    return NextResponse.json({ error: "Failed to update primary resume" }, { status: 500 });
  }
}
