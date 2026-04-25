/**
 * AI Summarization — Generate summaries from video transcripts.
 * Supports multiple summary styles: brief, detailed, key-points.
 */

import { generateText } from "./client";
import { getAIConfig } from "./config";

const SUMMARY_PROMPTS = {
  brief: {
    system:
      "You are a concise content summarizer. Create clear, accurate summaries.",
    prompt: (text) =>
      `Summarize the following video transcript in 2-3 sentences:\n\n${text}`,
    maxTokens: 256,
  },
  detailed: {
    system:
      "You are an expert content analyst. Create thorough, well-structured summaries.",
    prompt: (text) =>
      `Create a detailed summary of the following video transcript. Include main topics discussed, key arguments, and conclusions:\n\n${text}`,
    maxTokens: 1024,
  },
  keypoints: {
    system:
      "You are a content analyst. Extract the most important points from content.",
    prompt: (text) =>
      `Extract the key points from this video transcript as a bullet-point list. Each point should be a concise, actionable insight:\n\n${text}`,
    maxTokens: 1024,
  },
};

/**
 * Generate a summary from a transcript.
 *
 * @param {string} transcript - Video transcript text
 * @param {object} [options]
 * @param {"brief"|"detailed"|"keypoints"} [options.style] - Summary style
 * @param {function} [options.onProgress] - Progress callback (0-100)
 * @returns {Promise<{summary: string, style: string}>}
 */
export const summarize = async (transcript, options = {}) => {
  const config = await getAIConfig();
  if (!config.enabled || !config.features.summarization) {
    throw new Error("Summarization is disabled");
  }

  if (!transcript || transcript.trim().length < 10) {
    throw new Error("Transcript too short to summarize");
  }

  const { style = "brief", onProgress } = options;
  const promptConfig = SUMMARY_PROMPTS[style] || SUMMARY_PROMPTS.brief;

  if (onProgress) onProgress(10);

  // Truncate very long transcripts to stay within model context limits
  const maxChars = 30000;
  const truncatedText =
    transcript.length > maxChars
      ? transcript.slice(0, maxChars) + "\n\n[Transcript truncated...]"
      : transcript;

  if (onProgress) onProgress(30);

  const summary = await generateText(promptConfig.prompt(truncatedText), {
    systemInstruction: promptConfig.system,
    maxTokens: promptConfig.maxTokens,
    temperature: 0.5,
  });

  if (onProgress) onProgress(100);

  return { summary: summary.trim(), style };
};
