import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { prisma } from "@/server/db/prisma";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { Readable } from "stream";

export async function GET(
  req: Request,
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
    const fileSize = stat.size;
    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const nodeStream = fs.createReadStream(absoluteFilePath, { start, end });
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": recording.mediaType || "video/webm",
        },
      });
    } else {
      const nodeStream = fs.createReadStream(absoluteFilePath);
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;

      return new Response(webStream, {
        status: 200,
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Length": fileSize.toString(),
          "Content-Type": recording.mediaType || "video/webm",
        },
      });
    }
  } catch (error: any) {
    console.error("Failed to stream recording:", error);
    return NextResponse.json(
      { error: "Failed to stream video recording" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete file from disk if exists
    const fileName = path.basename(recording.fileLocation);
    const absoluteFilePath = path.join(
      process.cwd(),
      "storage",
      "recordings",
      auth.user.id,
      fileName
    );

    try {
      await fsp.unlink(absoluteFilePath);
    } catch {
      // Ignore if file doesn't exist on disk
    }

    await prisma.hrRecording.delete({
      where: { id },
    });

    try {
      await prisma.auditEvent.create({
        data: {
          userId: auth.user.id,
          action: "HR_RECORDING_DELETED",
          details: `Deleted HR interview recording ${id}`,
        },
      });
    } catch {
      // Non-critical audit log
    }

    return NextResponse.json({
      success: true,
      message: "Recording deleted successfully",
    });
  } catch (error: any) {
    console.error("Failed to delete recording:", error);
    return NextResponse.json(
      { error: "Failed to delete recording" },
      { status: 500 }
    );
  }
}
