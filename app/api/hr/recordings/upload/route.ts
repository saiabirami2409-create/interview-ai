import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { prisma } from "@/server/db/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    const sessionId = (formData.get("sessionId") as string) || null;
    const jobRole = (formData.get("jobRole") as string) || null;
    const titleInput = (formData.get("title") as string) || null;
    const durationInput = formData.get("duration");
    const duration = durationInput ? Math.round(Number(durationInput)) : 0;

    if (!file) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    // Limit to 100MB
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Video recording exceeds maximum size limit of 100MB" },
        { status: 400 }
      );
    }

    const recordingId = `rec_${crypto.randomBytes(12).toString("hex")}`;
    const userStorageDir = path.join(process.cwd(), "storage", "recordings", auth.user.id);
    await fs.mkdir(userStorageDir, { recursive: true });

    // Sanitize extension
    const ext = file.name?.endsWith(".mp4") ? "mp4" : "webm";
    const filename = `${recordingId}.${ext}`;
    const targetFilePath = path.join(userStorageDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetFilePath, buffer);

    const title =
      titleInput ||
      (jobRole ? `HR Round - ${jobRole}` : "HR Interview Recording");

    const recording = await prisma.hrRecording.create({
      data: {
        id: recordingId,
        userId: auth.user.id,
        hrSessionId: sessionId || undefined,
        title,
        jobRole,
        fileLocation: path.relative(process.cwd(), targetFilePath).replace(/\\/g, "/"),
        duration,
        fileSize: file.size,
        mediaType: file.type || (ext === "mp4" ? "video/mp4" : "video/webm"),
        status: "COMPLETED",
      },
    });

    try {
      await prisma.auditEvent.create({
        data: {
          userId: auth.user.id,
          action: "HR_RECORDING_SAVED",
          details: `Saved HR interview recording ${recordingId} (${(file.size / (1024 * 1024)).toFixed(1)} MB, ${duration}s)`,
        },
      });
    } catch {
      // Non-critical audit log
    }

    return NextResponse.json({
      success: true,
      data: { recording },
    });
  } catch (error: any) {
    console.error("Failed to upload HR recording:", error);
    return NextResponse.json(
      { error: "Failed to process and store recording" },
      { status: 500 }
    );
  }
}
