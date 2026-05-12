/**
 * Free Tier AI Service for AI Screen Recorder
 * Uses Groq API as primary for fast, free text generation with Model Rotation.
 * Fallbacks to Gemini API for large contexts or multimodal requests.
 *
 * Adapted from BlackNote for video/recording analysis context.
 */

import { GoogleGenAI } from "@google/genai";
import { Groq } from "groq-sdk";
import { config } from "../config/index.js";

// --- Clients ---
const gemini = new GoogleGenAI({
  apiKey: "AIzaSyCO3F6Znpad9_cZo6nQyVq18kSeXjjti8Y",
});

const groq = new Groq({
  apiKey: config.groq.apiKey || process.env.GROQ_API_KEY,
});

// --- Constants ---
const GEMINI_MODEL = "gemini-3.1-flash-lite";

// Groq Model Rotation List (Ordered by preference)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
  "llama-3.1-8b-instant"
];

// Token limit threshold for Groq (approx 6000 words/tokens to be safe)
const GROQ_TOKEN_LIMIT = 6000;

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

const RECORDING_SYSTEM_PROMPT = `You are an expert AI assistant for a screen recording tool called AI Screen Recorder.
You help users analyze, summarize, and extract insights from their video recordings.

CRITICAL RULES:
- Respond ONLY with the requested content — no meta commentary, no explanations
- Match the user's language
- Be concise and natural — the output should feel human-written
- Use Markdown formatting for structure (headings, lists, etc.)`;

// Helper to estimate tokens (1 token ≈ 4 characters)
function estimateTokenCount(text: string): number {
  return Math.ceil((text?.length || 0) / 4);
}

function handleAiError(error: any, callbacks: StreamCallbacks) {
  console.error("[AI Free] Error:", error?.message || error);
  callbacks.onError(new Error("We are facing high traffic, consider upgrading to PRO to enjoy the best experience."));
}

export async function streamFreeRecordingAI(
  text: string,
  option: string,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
  history?: { role: string; content: string }[]
): Promise<void> {

  const sysInstruction = RECORDING_SYSTEM_PROMPT;

  // Token Estimation
  let totalInputTokens = estimateTokenCount(sysInstruction) + estimateTokenCount(text);
  if (history) {
    history.forEach(h => totalInputTokens += estimateTokenCount(h.content));
  }

  // Routing Logic: large context → Gemini, small context → Groq
  if (totalInputTokens > GROQ_TOKEN_LIMIT) {
    console.log(`[AI Free] Routing to Gemini (Tokens: ${totalInputTokens})`);
    return streamGemini(text, sysInstruction, callbacks, abortSignal, history);
  } else {
    console.log(`[AI Free] Routing to Groq (Tokens: ${totalInputTokens})`);
    return streamGroq(text, sysInstruction, callbacks, abortSignal, history);
  }
}

async function streamGroq(
  userPrompt: string,
  sysInstruction: string,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
  history?: { role: string; content: string }[]
) {
  const messages: any[] = [{ role: "system", content: sysInstruction }];

  if (history && history.length > 0) {
    history.forEach(msg => {
      if (!msg.content) return;
      messages.push({
        role: msg.role === "ai" || msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      });
    });
  }

  messages.push({ role: "user", content: userPrompt });

  // Model Rotation Loop
  for (let i = 0; i < GROQ_MODELS.length; i++) {
    const model = GROQ_MODELS[i];
    try {
      console.log(`[Groq] Trying model: ${model}`);
      const stream = await groq.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        if (abortSignal?.aborted) {
          callbacks.onDone();
          return;
        }
        const token = chunk.choices[0]?.delta?.content || "";
        if (token) {
          callbacks.onToken(token);
        }
      }
      callbacks.onDone();
      return; // Success — exit

    } catch (error: any) {
      console.warn(`[Groq] Model ${model} failed:`, error?.message);
      if (i === GROQ_MODELS.length - 1) {
        return handleAiError(error, callbacks);
      }
      // Loop continues to the next model
    }
  }
}

async function streamGemini(
  userPrompt: string,
  sysInstruction: string,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
  history?: { role: string; content: string }[]
) {
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

  contents.push({ role: "user", parts: [{ text: userPrompt }] });

  try {
    const response = await gemini.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        systemInstruction: sysInstruction,
        temperature: 0.5,
        maxOutputTokens: 4096,
      },
    });

    for await (const chunk of response) {
      if (abortSignal?.aborted) {
        callbacks.onDone();
        return;
      }
      const chunkText = chunk.text;
      if (chunkText) {
        callbacks.onToken(chunkText);
      }
    }
    callbacks.onDone();
  } catch (error) {
    return handleAiError(error, callbacks);
  }
}
