/**
 * AI Configuration — API key management and endpoint settings.
 * Stores API key in chrome.storage.sync for cross-device persistence.
 * Designed for easy migration from Google AI Studio to Cloud Run + Vertex AI.
 */

const STORAGE_KEYS = {
  API_KEY: "ai_apiKey",
  ENABLED: "ai_enabled",
  FEATURES: "ai_features",
};

const DEFAULT_FEATURES = {
  transcription: true,
  summarization: true,
  smartTitle: true,
  translation: true,
};

// Default API key for testing — will be replaced by user input in production
const DEFAULT_API_KEY = "AIzaSyB9Idi7DYIkSWnl1urpImbCIhNMztPVFSU";
const DEFAULT_TEXT_MODEL = "gemini-flash-lite-latest"; // For summarize, title, translate
const DEFAULT_AUDIO_MODEL = "gemini-flash-lite-latest"; // For Speech-to-Text (Transcription)

export const AI_ENDPOINTS = {
  GOOGLE_AI_STUDIO: "https://generativelanguage.googleapis.com/v1beta",
  CLOUD_RUN_BACKEND: "https://screenity-api-2wzzuvdpaq-uc.a.run.app",
};

/**
 * Retrieve the current AI configuration from storage.
 * Falls back to defaults if nothing is stored yet.
 */
export const getAIConfig = async () => {
  const result = await chrome.storage.sync.get([
    STORAGE_KEYS.API_KEY,
    STORAGE_KEYS.ENABLED,
    STORAGE_KEYS.FEATURES,
  ]);

  return {
    apiKey: result[STORAGE_KEYS.API_KEY] || DEFAULT_API_KEY,
    enabled: result[STORAGE_KEYS.ENABLED] !== false,
    features: { ...DEFAULT_FEATURES, ...result[STORAGE_KEYS.FEATURES] },
    textModel: DEFAULT_TEXT_MODEL,
    audioModel: DEFAULT_AUDIO_MODEL,
    endpoint: AI_ENDPOINTS.GOOGLE_AI_STUDIO,
  };
};

/**
 * Save AI configuration to storage.
 */
export const setAIConfig = async ({ apiKey, enabled, features }) => {
  const updates = {};
  if (apiKey !== undefined) updates[STORAGE_KEYS.API_KEY] = apiKey;
  if (enabled !== undefined) updates[STORAGE_KEYS.ENABLED] = enabled;
  if (features !== undefined) updates[STORAGE_KEYS.FEATURES] = features;
  await chrome.storage.sync.set(updates);
};

/**
 * Validate an API key by making a lightweight request.
 * Returns { valid: true } or { valid: false, error: "..." }.
 */
export const validateAPIKey = async (apiKey) => {
  try {
    const url = `${AI_ENDPOINTS.GOOGLE_AI_STUDIO}/models/${DEFAULT_TEXT_MODEL}?key=${apiKey}`;
    const response = await fetch(url);
    if (response.ok) return { valid: true };

    const body = await response.json().catch(() => ({}));
    return {
      valid: false,
      error: body?.error?.message || `HTTP ${response.status}`,
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};
