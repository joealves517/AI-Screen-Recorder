/**
 * Premium Vertex AI Gemini — for paid users with credits.
 * Adapted for AI Screen Recorder: video/recording analysis context.
 */

import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const ai = new GoogleGenAI({
  vertexai: true,
  project: config.gcp.projectId,
  location: config.gcp.region,
});

const MODEL_NAME = "gemini-3.1-flash-lite";

const RECORDING_SYSTEM_PROMPT = `You are an expert AI assistant for a screen recording tool called AI Screen Recorder.
You help users analyze, summarize, and extract insights from their video recordings.

CRITICAL RULES:
- Respond ONLY with the requested content — no meta commentary, no explanations
- Match the user's language
- Be concise and natural — the output should feel human-written
- Use Markdown formatting for structure (headings, lists, etc.)`;

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (usage?: { inputTokens: number; outputTokens: number }) => void;
  onError: (error: Error) => void;
}

export async function streamRecordingAI(
  text: string,
  option: string,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
  history?: { role: string; content: string }[]
): Promise<void> {
  const contents: any[] = [];

  if (history && history.length > 0) {
    history.forEach(msg => {
      if (!msg.content) return;
      contents.push({
        role: msg.role === "ai" || msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    });
  }

  contents.push({ role: "user", parts: [{ text }] });

  try {
    const response = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: RECORDING_SYSTEM_PROMPT,
        temperature: 0.5,
        maxOutputTokens: 4096,
      },
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of response) {
      if (abortSignal?.aborted) {
        callbacks.onDone({ inputTokens, outputTokens });
        return;
      }

      const chunkText = chunk.text;
      if (chunkText) {
        callbacks.onToken(chunkText);
      }

      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
        outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
      }
    }

    callbacks.onDone({ inputTokens, outputTokens });
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}
