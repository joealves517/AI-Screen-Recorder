/**
 * Groq Whisper Smart Queue — dual-model rotation with rate limit handling.
 *
 * Strategy:
 * - Rotates between whisper-large-v3-turbo and whisper-large-v3 (separate RPM quotas = 2x bandwidth)
 * - Tracks per-model request count within sliding 60s windows
 * - On 429 (rate limited): exponential backoff retry, auto-switch to alternate model
 * - Safety margin: 18 RPM per model (actual limit: 20)
 */
import Groq from "groq-sdk";
import { toFile } from "groq-sdk/uploads";
import { config } from "../config/index.js";
const MODELS = ["whisper-large-v3-turbo", "whisper-large-v3"];
const RPM_SAFETY_LIMIT = 18; // Leave 2 RPM headroom per model
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1500;
const groq = new Groq({ apiKey: config.groq.apiKey });
// Per-model sliding window counters
const usage = new Map();
function resetIfExpired(model) {
    const now = Date.now();
    const current = usage.get(model);
    if (!current || now - current.windowStart > 60_000) {
        const fresh = { count: 0, windowStart: now };
        usage.set(model, fresh);
        return fresh;
    }
    return current;
}
function pickAvailableModel() {
    for (const model of MODELS) {
        const u = resetIfExpired(model);
        if (u.count < RPM_SAFETY_LIMIT)
            return model;
    }
    // All models at capacity — return first (retry logic will handle 429)
    return MODELS[0];
}
function trackRequest(model) {
    const u = resetIfExpired(model);
    u.count++;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Determine file extension from MIME type for Groq's file detection.
 */
function mimeToExtension(mimeType) {
    const map = {
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/wav": "wav",
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/mp4": "m4a",
        "audio/m4a": "m4a",
        "audio/flac": "flac",
    };
    return map[mimeType] || "mp3";
}
/**
 * Transcribe audio via Groq Whisper with dual-model rotation and retry.
 */
export async function transcribeWithGroq(audioBase64, mimeType = "audio/mpeg") {
    const buffer = Buffer.from(audioBase64, "base64");
    const ext = mimeToExtension(mimeType);
    const filename = `audio.${ext}`;
    return executeWithRetry(buffer, filename, 0);
}
async function executeWithRetry(buffer, filename, attempt) {
    const model = pickAvailableModel();
    try {
        const file = await toFile(buffer, filename);
        const result = await groq.audio.transcriptions.create({
            file,
            model,
            response_format: "verbose_json",
            timestamp_granularities: ["segment"],
            temperature: 0,
        });
        trackRequest(model);
        // Map Groq's verbose_json segments to our format
        const segments = (result.segments || []).map((seg) => ({
            start: typeof seg.start === "number" ? Math.max(0, seg.start) : 0,
            end: typeof seg.end === "number" ? Math.max(0, seg.end) : 0,
            text: (seg.text || "").trim(),
        })).filter((seg) => seg.text.length > 0);
        const transcript = segments.map((s) => s.text).join(" ");
        return {
            segments,
            transcript,
            language: result.language || "auto",
        };
    }
    catch (err) {
        const isRateLimit = err?.status === 429 || err?.statusCode === 429;
        if (isRateLimit && attempt < MAX_RETRIES) {
            // Mark current model as exhausted
            const u = resetIfExpired(model);
            u.count = RPM_SAFETY_LIMIT;
            const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
            console.warn(`[GroqQueue] Rate limited on ${model}, retry ${attempt + 1}/${MAX_RETRIES} after ${backoffMs}ms`);
            await sleep(backoffMs);
            return executeWithRetry(buffer, filename, attempt + 1);
        }
        console.error(`[GroqQueue] Transcription failed on ${model}:`, err?.message);
        throw err;
    }
}
//# sourceMappingURL=groq-queue.js.map