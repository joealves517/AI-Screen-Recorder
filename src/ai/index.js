/**
 * AI Module — Central export for all AI features.
 *
 * All AI tasks use Gemini API (requires API key):
 * - transcribe: Speech-to-Text from video/audio
 * - summarize: Generate text summaries
 * - translate: Multi-language translation
 * - generateTitleAndDescription: Smart metadata generation
 */

// Transcription (Gemini API)
export { transcribe, formatToSRT, formatToVTT } from "./transcription";

// Text Intelligence (Gemini API)
export { summarize } from "./summarization";
export { generateTitleAndDescription } from "./titleGenerator";
export { translate, getSupportedLanguages, LANGUAGE_GROUPS } from "./translation";

// Configuration
export { getAIConfig, setAIConfig, validateAPIKey } from "./config";
export { generateText } from "./client";
