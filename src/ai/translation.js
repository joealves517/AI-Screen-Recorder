/**
 * AI Translation — Translate transcript segments to different languages.
 * Uses Gemini for high-quality, context-aware translation.
 * Preserves segment timestamps so subtitles stay in sync.
 */

import { generateText } from "./client";
import { getAIConfig } from "./config";

/**
 * All supported languages, grouped by region for UI display.
 * Gemini handles virtually every language, so we can offer a wide selection.
 */
const SUPPORTED_LANGUAGES = {
  // East Asia
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  // Southeast Asia
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  ms: "Malay",
  fil: "Filipino",
  my: "Burmese",
  km: "Khmer",
  lo: "Lao",
  // South Asia
  hi: "Hindi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
  ne: "Nepali",
  si: "Sinhala",
  // Europe — Western
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  // Europe — Nordic
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  // Europe — Eastern
  ru: "Russian",
  pl: "Polish",
  uk: "Ukrainian",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
  hr: "Croatian",
  bg: "Bulgarian",
  sk: "Slovak",
  lt: "Lithuanian",
  lv: "Latvian",
  et: "Estonian",
  el: "Greek",
  // Middle East & Africa
  ar: "Arabic",
  he: "Hebrew",
  fa: "Persian",
  tr: "Turkish",
  sw: "Swahili",
  am: "Amharic",
  // Central Asia
  ka: "Georgian",
  az: "Azerbaijani",
  uz: "Uzbek",
  kk: "Kazakh",
};

/**
 * Language groups for UI dropdown organization.
 */
export const LANGUAGE_GROUPS = [
  {
    label: "East Asia",
    languages: ["ja", "ko", "zh", "zh-TW"],
  },
  {
    label: "Southeast Asia",
    languages: ["vi", "th", "id", "ms", "fil", "my", "km", "lo"],
  },
  {
    label: "South Asia",
    languages: ["hi", "bn", "ta", "te", "ur", "ne", "si"],
  },
  {
    label: "Western Europe",
    languages: ["en", "es", "fr", "de", "it", "pt", "nl"],
  },
  {
    label: "Nordic",
    languages: ["sv", "da", "no", "fi"],
  },
  {
    label: "Eastern Europe",
    languages: ["ru", "pl", "uk", "cs", "ro", "hu", "hr", "bg", "sk", "lt", "lv", "et", "el"],
  },
  {
    label: "Middle East & Africa",
    languages: ["ar", "he", "fa", "tr", "sw", "am"],
  },
  {
    label: "Central Asia",
    languages: ["ka", "az", "uz", "kk"],
  },
];

/**
 * @typedef {Object} Segment
 * @property {number} start
 * @property {number} end
 * @property {string} text
 */

/**
 * Translate transcript segments to a target language.
 * Preserves timestamps — only the text is translated.
 *
 * @param {Segment[]} segments - Source segments with timestamps
 * @param {string} targetLang - Target language code (e.g. "vi", "ja")
 * @param {object} [options]
 * @param {function} [options.onProgress] - Progress callback (0-100)
 * @returns {Promise<{translatedSegments: Segment[], targetLang: string, targetLangName: string}>}
 */
export const translate = async (segments, targetLang, options = {}) => {
  const config = await getAIConfig();
  if (!config.enabled || !config.features.translation) {
    throw new Error("Translation is disabled");
  }

  if (!segments || segments.length === 0) {
    throw new Error("No segments to translate");
  }

  const targetLangName = SUPPORTED_LANGUAGES[targetLang] || targetLang;
  const { onProgress } = options;

  if (onProgress) onProgress(10);

  // Build a compact payload: only index + text (timestamps stay client-side)
  const textsToTranslate = segments.map((s, i) => ({ i, t: s.text }));
  const jsonPayload = JSON.stringify(textsToTranslate);

  // Split into chunks if extremely long
  const maxChars = 15000;
  if (jsonPayload.length <= maxChars) {
    if (onProgress) onProgress(30);
    const translatedTexts = await translateChunk(jsonPayload, targetLangName);
    if (onProgress) onProgress(100);

    const translatedSegments = mergeTranslatedTexts(segments, translatedTexts);
    return { translatedSegments, targetLang, targetLangName };
  }

  // Process in batches for very long transcripts
  const batchSize = 50;
  const allTranslated = [];

  for (let i = 0; i < textsToTranslate.length; i += batchSize) {
    const batch = textsToTranslate.slice(i, i + batchSize);
    const batchJSON = JSON.stringify(batch);
    const translated = await translateChunk(batchJSON, targetLangName);
    allTranslated.push(...translated);

    if (onProgress) {
      const pct = 10 + Math.round(((i + batchSize) / textsToTranslate.length) * 85);
      onProgress(Math.min(pct, 95));
    }
  }

  if (onProgress) onProgress(100);

  const translatedSegments = mergeTranslatedTexts(segments, allTranslated);
  return { translatedSegments, targetLang, targetLangName };
};

/**
 * Get the list of supported languages.
 */
export const getSupportedLanguages = () => ({ ...SUPPORTED_LANGUAGES });

/**
 * Translate a batch of {i, t} objects, return {i, t} with translated text.
 */
const translateChunk = async (jsonPayload, targetLangName) => {
  const response = await generateText(
    `Translate each "t" field to ${targetLangName}. Keep the "i" index unchanged.
Return ONLY a valid JSON array of objects with "i" and "t" fields.
No markdown, no commentary.

${jsonPayload}`,
    {
      systemInstruction:
        "You are a professional translator. Translate accurately while preserving the original meaning, tone, and context. Output only the JSON array.",
      maxTokens: 8192,
      temperature: 0.3,
    }
  );

  return parseTranslatedResponse(response, jsonPayload);
};

/**
 * Parse translated response, with fallback for malformed output.
 */
const parseTranslatedResponse = (rawText, originalPayload) => {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }

  // Fallback: return original texts unchanged
  try {
    return JSON.parse(originalPayload);
  } catch {
    return [];
  }
};

/**
 * Merge translated texts back into segments, preserving original timestamps.
 */
const mergeTranslatedTexts = (originalSegments, translatedTexts) => {
  const textMap = new Map();
  translatedTexts.forEach((item) => {
    if (item && typeof item.i === "number" && typeof item.t === "string") {
      textMap.set(item.i, item.t);
    }
  });

  return originalSegments.map((seg, idx) => ({
    start: seg.start,
    end: seg.end,
    text: textMap.get(idx) || seg.text,
  }));
};
