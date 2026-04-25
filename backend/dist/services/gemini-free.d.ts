/**
 * Gemini Free Tier — uses Google AI Studio API key (not Vertex AI).
 * Adapted for BlackNote: AI writing assistant prompts.
 */
interface StreamCallbacks {
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (error: Error) => void;
}
export declare function streamFreeWritingAI(text: string, option: string, callbacks: StreamCallbacks, abortSignal?: AbortSignal, command?: string): Promise<void>;
export {};
//# sourceMappingURL=gemini-free.d.ts.map