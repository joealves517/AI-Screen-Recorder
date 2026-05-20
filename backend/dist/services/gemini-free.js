/**
 * Free Tier AI Service for AI Screen Recorder
 * Route directly to Vertex AI (Gemini 3.1 Flash Lite) for text generation.
 * No API Keys, no Groq, no complex routing.
 */
import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
// --- Clients ---
const ai = new GoogleGenAI({
    vertexai: true,
    project: config.gcp.projectId,
    location: config.gcp.region,
});
// --- Constants ---
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const RECORDING_SYSTEM_PROMPT = `You are an expert AI assistant for a screen recording tool called AI Screen Recorder.
You help users analyze, summarize, and extract insights from their video recordings.

CRITICAL RULES:
- Respond ONLY with the requested content — no meta commentary, no explanations
- Match the user's language
- Be concise and natural — the output should feel human-written
- Use Markdown formatting for structure (headings, lists, etc.)`;
function handleAiError(error, callbacks) {
    console.error("[AI Free] Vertex AI Error:", error?.message || error);
    callbacks.onError(new Error("We are facing high traffic. Please try again later."));
}
export async function streamFreeRecordingAI(text, option, callbacks, abortSignal, history) {
    const sysInstruction = RECORDING_SYSTEM_PROMPT;
    return streamGemini(text, sysInstruction, callbacks, abortSignal, history);
}
async function streamGemini(userPrompt, sysInstruction, callbacks, abortSignal, history) {
    const contents = [];
    if (history && history.length > 0) {
        history.forEach(msg => {
            if (!msg.content)
                return;
            contents.push({
                role: msg.role === "ai" || msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }]
            });
        });
    }
    contents.push({ role: "user", parts: [{ text: userPrompt }] });
    try {
        const response = await ai.models.generateContentStream({
            model: GEMINI_MODEL,
            contents: contents,
            config: {
                systemInstruction: sysInstruction,
                temperature: 0.5,
                maxOutputTokens: 4096,
            },
        });
        for await (const chunk of response) {
            if (abortSignal?.aborted) {
                callbacks.onDone();
                return;
            }
            const chunkText = chunk.text;
            if (chunkText) {
                callbacks.onToken(chunkText);
            }
        }
        callbacks.onDone();
    }
    catch (error) {
        return handleAiError(error, callbacks);
    }
}
//# sourceMappingURL=gemini-free.js.map