/**
 * Screenity AI Routes — Premium tier (Vertex AI + Groq Whisper).
 * Endpoints: transcribe, summarize, translate, title-generate.
 *
 * Transcription: Groq Whisper (free, fast, accurate timestamps).
 * Analysis: Vertex AI (premium) with Gemini API fallback when credits exhausted.
 * Free users: 20-minute video duration limit on transcription.
 * Token-based billing: deduct credits based on actual Vertex AI token usage.
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=screenity-ai.d.ts.map