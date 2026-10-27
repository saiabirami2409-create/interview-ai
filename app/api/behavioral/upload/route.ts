import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guard";
import { apiSuccess, apiError } from "@/lib/api-response";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required to upload recording", 401);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("video") as Blob | null;
    const sessionId = (formData.get("sessionId") as string)?.trim();
    const questionId = (formData.get("questionId") as string)?.trim();

    if (!file || !sessionId || !questionId) {
      return apiError(
        "INVALID_PAYLOAD",
        "Video file, sessionId, and questionId are required.",
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Secure target directory under public/uploads/recordings/[sessionId]
    const recordingsDir = path.join(process.cwd(), "public", "uploads", "recordings", sessionId);
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const filename = `${questionId}_${Date.now()}.webm`;
    const filePath = path.join(recordingsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const recordingUrl = `/uploads/recordings/${sessionId}/${filename}`;

    return apiSuccess({
      recordingUrl,
      sizeBytes: buffer.length,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Recording upload error:", err);
    return apiError("UPLOAD_FAILED", err.message || "Failed to save video recording", 500);
  }
}
