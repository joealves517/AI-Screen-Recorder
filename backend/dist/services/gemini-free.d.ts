/**
 * Free Tier AI Service for AI Screen Recorder
 * Route directly to Vertex AI (Gemini 3.1 Flash Lite) for text generation.
 * No API Keys, no Groq, no complex routing.
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