/**
 * Premium Vertex AI Gemini — for paid users with credits.
 * Adapted for AI Screen Recorder: video/recording analysis context.
 */
interface StreamCallbacks {
    onToken: (token: string) => void;
    onDone: (usage?: {
        inputTokens: number;
        outputTokens: number;
    }) => void;
    onError: (error: Error) => void;
}
export declare function streamRecordingAI(text: string, option: string, callbacks: StreamCallbacks, abortSignal?: AbortSignal, history?: {
    role: string;
    content: string;
}[]): Promise<void>;
export {};
//# sourceMappingURL=vertex-ai.d.ts.map