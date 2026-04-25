/**
 * AI Smart Title & Description Generator.
 * Suggests relevant titles and descriptions based on video content.
 */

import { generateText } from "./client";
import { getAIConfig } from "./config";

/**
 * Generate a smart title and description from transcript.
 *
 * @param {string} transcript - Video transcript text
 * @param {object} [options]
 * @param {function} [options.onProgress] - Progress callback (0-100)
 * @returns {Promise<{title: string, description: string, tags: string[]}>}
 */
export const generateTitleAndDescription = async (transcript, options = {}) => {
  const config = await getAIConfig();
  if (!config.enabled || !config.features.smartTitle) {
    throw new Error("Smart title generation is disabled");
  }

  if (!transcript || transcript.trim().length < 10) {
    throw new Error("Transcript too short to generate title");
  }

  const { onProgress } = options;

  if (onProgress) onProgress(10);

  // Use first portion of transcript for title generation
  const contextText = transcript.slice(0, 5000);

  if (onProgress) onProgress(30);

  const rawResponse = await generateText(
    `Based on the following video transcript, generate:
1. A concise, descriptive title (max 60 characters)
2. A brief description (max 200 characters)
3. 3-5 relevant tags

Transcript:
${contextText}

Respond in this exact JSON format:
{"title": "...", "description": "...", "tags": ["...", "..."]}`,
    {
      systemInstruction:
        "You are a content metadata specialist. Generate clear, SEO-friendly titles and descriptions. Always respond in valid JSON format.",
      maxTokens: 256,
      temperature: 0.6,
    }
  );

  if (onProgress) onProgress(80);

  const parsed = parseJSONResponse(rawResponse);
  if (onProgress) onProgress(100);

  return {
    title: parsed.title || "Untitled Recording",
    description: parsed.description || "",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
  };
};

/**
 * Parse a JSON response from the AI model.
 * Handles cases where the model wraps JSON in markdown code blocks.
 */
const parseJSONResponse = (text) => {
  // Strip markdown code block wrapping if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback: extract content from malformed response
    return {
      title: extractBetween(text, '"title"', ",") || "Untitled Recording",
      description: extractBetween(text, '"description"', ",") || "",
      tags: [],
    };
  }
};

const extractBetween = (text, startKey, endChar) => {
  const startIdx = text.indexOf(startKey);
  if (startIdx === -1) return null;
  const colonIdx = text.indexOf(":", startIdx);
  if (colonIdx === -1) return null;
  const quoteStart = text.indexOf('"', colonIdx + 1);
  if (quoteStart === -1) return null;
  const quoteEnd = text.indexOf('"', quoteStart + 1);
  if (quoteEnd === -1) return null;
  return text.slice(quoteStart + 1, quoteEnd);
};
