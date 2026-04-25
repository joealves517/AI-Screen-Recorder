/**
 * AI Transcription — Speech-to-Text via Gemini API.
 *
 * Sends video/audio blob to Gemini for transcription with timestamps.
 * Returns an array of timed segments for accurate subtitle rendering.
 */

import { getAIConfig } from "./config";

/**
 * @typedef {Object} Segment
 * @property {number} start - Start time in seconds
 * @property {number} end   - End time in seconds
 * @property {string} text  - Spoken text for this segment
 */

/**
 * Transcribe a video/audio blob using Gemini API.
 *
 * @param {Blob} videoBlob - Video or audio blob to transcribe
 * @param {object} [options]
 * @param {string} [options.language] - Language hint (e.g. "en", "vi")
 * @param {function} [options.onProgress] - Progress callback (0-100)
 * @returns {Promise<{segments: Segment[], transcript: string, language: string}>}
 */
export const transcribe = async (videoBlob, options = {}) => {
  const { language = "", onProgress } = options;

  if (!videoBlob || videoBlob.size === 0) {
    throw new Error("No video data to transcribe");
  }

  if (onProgress) onProgress(10);

  const base64Data = await blobToBase64(videoBlob);
  if (onProgress) onProgress(30);

  const config = await getAIConfig();
  if (!config.apiKey) {
    throw new Error("API key not configured. Set it in AI Settings.");
  }

  if (onProgress) onProgress(40);

  const segments = await callGeminiTranscribe(
    config,
    base64Data,
    "audio/webm",
    language
  );

  if (onProgress) onProgress(100);

  const transcript = segments.map((s) => s.text).join(" ");

  return {
    segments,
    transcript: transcript.trim(),
    language: language || "auto",
  };
};

/**
 * Call Gemini API to transcribe audio/video content with timestamps.
 * @returns {Promise<Segment[]>}
 */
const callGeminiTranscribe = async (config, base64Data, mimeType, language) => {
  const url = `${config.endpoint}/models/${config.audioModel}:generateContent?key=${config.apiKey}`;

  const languageHint = language ? `The audio is in ${language}. ` : "";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${languageHint}Transcribe all spoken words in this recording with accurate timestamps.

Return the result as a JSON array of segments. Each segment has:
- "start": start time in seconds (float, e.g. 0.0, 2.5)
- "end": end time in seconds (float)
- "text": the spoken text for that time range

Keep each segment short (1-2 sentences max) so subtitles are readable.
If there is no speech, return an empty array: []

Return ONLY the raw JSON array. No markdown code blocks, no commentary.`,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const status = response.status;
    const errorMsg = errorBody?.error?.message || `API error ${status}`;

    if (status === 429) throw new Error("QUOTA_EXCEEDED");
    if (status === 403) throw new Error("API_KEY_INVALID");
    if (status >= 500) throw new Error("SERVER_OVERLOAD");
    throw new Error(`Transcription failed: ${errorMsg}`);
  }

  const result = await response.json();
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  return parseSegmentsResponse(rawText);
};

/**
 * Parse the JSON segments response from Gemini.
 * Handles markdown code blocks and malformed output gracefully.
 */
const parseSegmentsResponse = (rawText) => {
  let cleaned = rawText.trim();

  // Strip markdown code fences
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    // Validate and sanitize each segment
    return parsed
      .filter((s) => s && typeof s.text === "string" && s.text.trim().length > 0)
      .map((s) => ({
        start: typeof s.start === "number" ? Math.max(0, s.start) : 0,
        end: typeof s.end === "number" ? Math.max(0, s.end) : 0,
        text: s.text.trim(),
      }));
  } catch {
    // Fallback: treat as plain text, distribute evenly
    const plainText = cleaned.replace(/[\[\]{}]/g, "").trim();
    if (!plainText) return [];

    const sentences = plainText
      .split(/(?<=[.!?。！？])\s+/)
      .filter((s) => s.trim().length > 0);

    const estimatedDuration = plainText.split(/\s+/).length / 2.5;
    const segDuration = estimatedDuration / Math.max(sentences.length, 1);

    return sentences.map((text, i) => ({
      start: i * segDuration,
      end: (i + 1) * segDuration,
      text: text.trim(),
    }));
  }
};

/**
 * Convert a Blob to base64 string (without data URL prefix).
 */
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      const commaIndex = base64.indexOf(",");
      resolve(commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64);
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });

/**
 * Format timestamped segments into SRT subtitle format.
 * @param {Segment[]} segments - Array of timed segments
 * @returns {string} SRT formatted subtitles
 */
export const formatToSRT = (segments) => {
  if (!segments?.length) return "";

  return segments
    .map((seg, index) => {
      return [
        `${index + 1}`,
        `${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}`,
        seg.text.trim(),
        "",
      ].join("\n");
    })
    .join("\n");
};

const formatSRTTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
};

/**
 * Format timestamped segments into WebVTT subtitle format.
 * @param {Segment[]} segments - Array of timed segments
 * @returns {string} WebVTT formatted subtitles
 */
export const formatToVTT = (segments) => {
  if (!segments?.length) return "";

  let vtt = "WEBVTT\n\n";
  segments.forEach((seg) => {
    vtt += `${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}\n${seg.text.trim()}\n\n`;
  });
  return vtt;
};

const formatVTTTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
};

const pad = (num, length = 2) => String(num).padStart(length, "0");
