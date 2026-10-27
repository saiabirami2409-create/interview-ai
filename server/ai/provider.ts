import { AIProvider } from "./types";
import { DeterministicDemoProvider } from "./demo-provider";
import { GoogleGeminiProvider } from "./gemini-provider";

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== "") {
    cachedProvider = new GoogleGeminiProvider(apiKey.trim());
  } else {
    cachedProvider = new DeterministicDemoProvider();
  }

  return cachedProvider;
}
