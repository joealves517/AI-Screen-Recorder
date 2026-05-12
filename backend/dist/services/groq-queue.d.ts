/**
 * Groq Whisper Smart Queue — dual-model rotation with rate limit handling.
 *
 * Strategy:
 * - Rotates between whisper-large-v3-turbo and whisper-large-v3 (separate RPM quotas = 2x bandwidth)
 * - Tracks per-model request count within sliding 60s windows
 * - On 429 (rate limited): exponential backoff retry, auto-switch to alternate model
 * - Safety margin: 18 RPM per model (actual limit: 20)
 */
interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
}
export interface GroqTranscriptionResult {
    segments: TranscriptionSegment[];
    transcript: string;
    language: string;
}
/**
 * Transcribe audio via Groq Whisper with dual-model rotation and retry.
 */
export declare function transcribeWithGroq(audioBase64: string, mimeType?: string): Promise<GroqTranscriptionResult>;
export {};
//# sourceMappingURL=groq-queue.d.ts.map