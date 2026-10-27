import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

    return NextResponse.json({
      success: true,
      isOnline: isConfigured,
      hasApiKey: isConfigured,
      model: isConfigured ? "gemini-2.5-flash" : "offline-coach",
      provider: isConfigured ? "Google Gemini AI" : "InterviewAI Offline Coach",
      statusText: isConfigured
        ? "Online • Connected to Gemini 2.5 Flash"
        : "Offline Coach Mode • Configure GEMINI_API_KEY for live AI",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        isOnline: false,
        error: "Failed to resolve chatbot status",
      },
      { status: 500 }
    );
  }
}
