/**
 * Premium Vertex AI Gemini — for paid users with credits.
 * Adapted for BlackNote: AI writing assistant prompts.
 */
interface StreamCallbacks {
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (error: Error) => void;
}
export declare function streamWritingAI(text: string, option: string, callbacks: StreamCallbacks, abortSignal?: AbortSignal, command?: string): Promise<void>;
export {};
//# sourceMappingURL=vertex-ai.d.ts.map