import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { prisma } from "@/server/db/prisma";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { Readable } from "stream";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const recording = await prisma.hrRecording.findUnique({
      where: { id },
    });

    if (!recording || recording.userId !== auth.user.id) {
      return NextResponse.json(
        { error: "Recording not found or access denied" },
        { status: 404 }
      );
    }

    const fileName = path.basename(recording.fileLocation);
    const absoluteFilePath = path.join(
      process.cwd(),
      "storage",
      "recordings",
      auth.user.id,
      fileName
    );

    try {
      await fsp.access(absoluteFilePath);
    } catch {
      return NextResponse.json(
        { error: "Recording file not found on storage" },
        { status: 404 }
      );
    }

    const stat = await fsp.stat(absoluteFilePath);
    const nodeStream = fs.createReadStream(absoluteFilePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    const safeTitle = (recording.title || "hr-recording")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");
    const ext = recording.mediaType?.includes("mp4") ? "mp4" : "webm";
    const downloadFilename = `${safeTitle}-${recording.id.slice(-6)}.${ext}`;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        "Content-Length": stat.size.toString(),
        "Content-Type": recording.mediaType || "video/webm",
      },
    });
  } catch (error: any) {
    console.error("Failed to download recording:", error);
    return NextResponse.json(
      { error: "Failed to download recording file" },
      { status: 500 }
    );
  }
}
