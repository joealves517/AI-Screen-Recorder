/**
 * AI Message Handlers — Background Service Worker message routing.
 *
 * Architecture:
 * ┌──────────────────────────────────────────────────┐
 * │ LOCAL (no API key, no network)                   │
 * │ • ai-transcribe → Whisper Web Worker             │
 * │   (runs in Editor/Sandbox page, NOT here)        │
 * │                                                  │
 * │ Note: Transcription runs in the Editor context   │
 * │ because Whisper needs AudioContext + Web Worker.  │
 * │ Background SW only handles TEXT-based AI tasks.   │
 * └──────────────────────────────────────────────────┘
 * ┌──────────────────────────────────────────────────┐
 * │ CLOUD (requires API key)                         │
 * │ • ai-summarize → Gemini API                      │
 * │ • ai-generate-title → Gemini API                 │
 * │ • ai-translate → Gemini API                      │
 * └──────────────────────────────────────────────────┘
 */

import { registerMessage } from "../../../messaging/messageRouter";
import { summarize } from "../../../ai/summarization";
import { generateTitleAndDescription } from "../../../ai/titleGenerator";
import { translate, getSupportedLanguages } from "../../../ai/translation";
import { getAIConfig, setAIConfig, validateAPIKey } from "../../../ai/config";
import { formatToSRT } from "../../../ai/transcription";

export const setupAIHandlers = () => {
  // --- Configuration ---

  registerMessage("ai-get-config", async () => {
    try {
      const config = await getAIConfig();
      return { status: "ok", config };
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });

  registerMessage("ai-set-config", async (message) => {
    try {
      await setAIConfig(message.config);
      return { status: "ok" };
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });

  registerMessage("ai-validate-key", async (message) => {
    try {
      const result = await validateAPIKey(message.apiKey);
      return { status: "ok", ...result };
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });

  registerMessage("ai-get-languages", () => {
    return { status: "ok", languages: getSupportedLanguages() };
  });

  // --- SRT Formatting (no API call, just formatting) ---

  registerMessage("ai-format-srt", (message) => {
    try {
      const srt = formatToSRT(
        message.transcript,
        message.chunks || [],
        message.duration
      );
      return { status: "ok", srt };
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });

  // --- Summarization (Gemini API) ---

  registerMessage("ai-summarize", async (message) => {
    try {
      const result = await summarize(message.transcript, {
        style: message.style || "brief",
      });

      await chrome.storage.local.set({
        ai_lastSummary: result.summary,
        ai_lastSummaryAt: Date.now(),
      });

      return { status: "ok", ...result };
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });

  // --- Smart Title (Gemini API) ---

  registerMessage("ai-generate-title", async (message) => {
    try {
      const result = await generateTitleAndDescription(message.transcript);

      await chrome.storage.local.set({
        ai_lastTitle: result.title,
        ai_lastDescription: result.description,
        ai_lastTitleAt: Date.now(),
      });

      return { status: "ok", ...result };
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });

  // --- Translation (Gemini API) ---

  registerMessage("ai-translate", async (message) => {
    try {
      const result = await translate(message.text, message.targetLang, {
        sourceLang: message.sourceLang || "",
      });

      return { status: "ok", ...result };
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });

  // --- Full Text Pipeline (Gemini API) ---
  // Takes an already-transcribed text and runs summary + title in parallel.
  // Transcription is done locally in the Editor, NOT here.

  registerMessage("ai-process-text", async (message) => {
    try {
      const transcript = message.transcript;
      if (!transcript || transcript.trim().length < 10) {
        return {
          status: "ok",
          transcript,
          summary: null,
          title: null,
          description: null,
        };
      }

      // Run summary & title generation in parallel via Gemini API
      const [summaryResult, titleResult] = await Promise.allSettled([
        summarize(transcript, { style: "brief" }),
        generateTitleAndDescription(transcript),
      ]);

      const summary =
        summaryResult.status === "fulfilled"
          ? summaryResult.value.summary
          : null;
      const title =
        titleResult.status === "fulfilled"
          ? titleResult.value.title
          : null;
      const description =
        titleResult.status === "fulfilled"
          ? titleResult.value.description
          : null;
      const tags =
        titleResult.status === "fulfilled" ? titleResult.value.tags : [];

      // Persist results
      await chrome.storage.local.set({
        ai_lastTranscript: transcript,
        ai_lastSummary: summary,
        ai_lastTitle: title,
        ai_lastDescription: description,
        ai_lastProcessedAt: Date.now(),
      });

      return { status: "ok", transcript, summary, title, description, tags };
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });
};
