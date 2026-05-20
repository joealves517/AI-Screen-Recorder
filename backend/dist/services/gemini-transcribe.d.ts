interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
}
export interface GeminiTranscriptionResult {
    segments: TranscriptionSegment[];
    transcript: string;
    language: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}
export declare function transcribeWithGemini(audioBase64: string, mimeType?: string, usePremium?: boolean): Promise<GeminiTranscriptionResult>;
export {};
//# sourceMappingURL=gemini-transcribe.d.ts.map