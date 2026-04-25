/**
 * AI Client — Gemini API wrapper for text-only tasks.
 *
 * Used for:
 * - Summarization (text → summary)
 * - Smart Title generation (text → title + description)
 * - Translation (text → translated text)
 *
 * For audio/video transcription, see transcription.js
 * which uses Gemini multimodal input directly.
 */

import { getAIConfig } from "./config";

/**
 * Send a text-only request to Gemini.
 * @param {string} prompt - The user prompt
 * @param {object} [options] - Optional overrides
 * @param {string} [options.systemInstruction] - System-level instruction
 * @param {number} [options.maxTokens] - Max output tokens (default: 2048)
 * @param {number} [options.temperature] - Sampling temperature (default: 0.7)
 * @returns {Promise<string>} Generated text response
 */
export const generateText = async (prompt, options = {}) => {
  const config = await getAIConfig();
  if (!config.enabled) throw new Error("AI features are disabled");
  if (!config.apiKey) throw new Error("No API key configured");

  const { systemInstruction, maxTokens = 2048, temperature = 0.7 } = options;

  const url = `${config.endpoint}/models/${config.textModel}:generateContent?key=${config.apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const status = response.status;
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error?.message || `API Error: HTTP ${status}`;

    if (status === 429) throw new Error("QUOTA_EXCEEDED");
    if (status === 403) throw new Error("API_KEY_INVALID");
    if (status >= 500) throw new Error("SERVER_OVERLOAD");
    throw new Error(message);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from AI model");

  return text;
};
