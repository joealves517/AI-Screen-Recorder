/**
 * Free Tier AI Service for AI Screen Recorder
 * Uses Groq API as primary for fast, free text generation with Model Rotation.
 * Fallbacks to Gemini API for large contexts or multimodal requests.
 *
 * Adapted from BlackNote for video/recording analysis context.
 */
interface StreamCallbacks {
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (error: Error) => void;
}
export declare function streamFreeRecordingAI(text: string, option: string, callbacks: StreamCallbacks, abortSignal?: AbortSignal, history?: {
    role: string;
    content: string;
}[]): Promise<void>;
export {};
//# sourceMappingURL=gemini-free.d.ts.map