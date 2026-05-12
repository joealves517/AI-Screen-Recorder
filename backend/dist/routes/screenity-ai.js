/**
 * Screenity AI Routes — Premium tier (Vertex AI + Groq Whisper).
 * Endpoints: transcribe, summarize, translate, title-generate.
 *
 * Transcription: Groq Whisper (free, fast, accurate timestamps).
 * Analysis: Vertex AI (premium) with Gemini API fallback when credits exhausted.
 * Free users: 20-minute video duration limit on transcription.
 * Token-based billing: deduct credits based on actual Vertex AI token usage.
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createOrUpdateUser, deductCreditsByEmail, logUsage, } from "../services/firestore.js";
import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import { calculateTokenCost } from "../services/token-cost.js";
import { transcribeWithGroq } from "../services/groq-queue.js";
import Groq from "groq-sdk";
const groqClient = new Groq({ apiKey: config.groq.apiKey });
const VALID_VOICES = ["autumn", "diana", "hannah", "austin", "daniel", "troy"];
const router = Router();
const vertexAI = new GoogleGenAI({
    vertexai: true,
    project: config.gcp.projectId,
    location: config.gcp.region,
});
// Free-tier Gemini client (API key based) for fallback
const freeAI = new GoogleGenAI({
    apiKey: "AIzaSyCO3F6Znpad9_cZo6nQyVq18kSeXjjti8Y",
});
const PREMIUM_MODEL = "gemini-2.5-flash";
const FREE_MODEL = "gemini-3.1-flash-lite";
// Groq Model Rotation List for Free Users (Text generation)
const GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768",
    "llama-3.1-8b-instant"
];
const GROQ_TOKEN_LIMIT = 6000;
// Helper to estimate tokens
function estimateTokenCount(text) {
    return Math.ceil((text?.length || 0) / 4);
}
/**
 * Executes a text generation request using Groq with model rotation on failure.
 */
async function generateTextWithGroq(systemPrompt, userPrompt, isJson = false) {
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];
    let lastError = null;
    for (let i = 0; i < GROQ_MODELS.length; i++) {
        const model = GROQ_MODELS[i];
        try {
            console.log(`[Groq Text] Trying model: ${model}`);
            const response = await groqClient.chat.completions.create({
                model: model,
                messages: messages,
                temperature: 0.5,
                max_tokens: 2048,
                response_format: isJson ? { type: "json_object" } : undefined
            });
            return response.choices[0]?.message?.content || "";
        }
        catch (error) {
            console.warn(`[Groq Text] Model ${model} failed:`, error?.message);
            lastError = error;
            // If last model, throw the error to be handled by the route
            if (i === GROQ_MODELS.length - 1) {
                throw error;
            }
        }
    }
    throw lastError;
}
const FREE_MAX_DURATION_SEC = 1200; // 20 minutes
/** Pick the correct AI client and model based on whether credits are available */
function pickAIClient(hasPremiumCredits) {
    return hasPremiumCredits
        ? { client: vertexAI, model: PREMIUM_MODEL }
        : { client: freeAI, model: FREE_MODEL };
}
/** Extract token usage from Vertex AI response and calculate credit cost */
function extractTokenCost(response) {
    const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const creditsUsed = calculateTokenCost({ inputTokens, outputTokens });
    return { creditsUsed, inputTokens, outputTokens };
}
// ─── Transcribe (audio chunk → timestamped segments via Groq Whisper) ──
router.post("/transcribe", requireAuth, async (req, res) => {
    const authReq = req;
    const { audioBase64, mimeType, audioDurationSec } = req.body;
    if (!audioBase64) {
        res.status(400).json({ error: "missing_audio" });
        return;
    }
    const user = await createOrUpdateUser(authReq.userId, {
        email: authReq.userEmail,
        displayName: authReq.userName,
        picture: authReq.userPicture,
    }, "AI Screen Recorder");
    // Free tier: enforce 20-minute limit
    const isPremium = user.tier === "premium" || user.credits > 0;
    if (!isPremium && audioDurationSec && audioDurationSec > FREE_MAX_DURATION_SEC) {
        res.status(403).json({
            error: "recording_too_long",
            maxMinutes: 20,
            message: "Free users can only transcribe recordings up to 20 minutes. Upgrade to PRO for unlimited.",
        });
        return;
    }
    try {
        // Groq Whisper — free, no credit deduction
        const result = await transcribeWithGroq(audioBase64, mimeType || "audio/mpeg");
        res.json({
            segments: result.segments,
            transcript: result.transcript,
        });
    }
    catch (error) {
        console.error("[Screenity AI] Transcribe error:", error?.message);
        const isRateLimit = error?.status === 429;
        res.status(isRateLimit ? 429 : 500).json({
            error: isRateLimit ? "rate_limited" : "transcription_failed",
        });
    }
});
// ─── Summarize ──────────────────────────────────────────────────────
const SUMMARIZE_PROMPTS = {
    meeting_minutes: (t) => `Create professional Meeting Minutes from this screen recording transcript. Include:\n- Meeting Goal / Context\n- Key Discussion Points\n- Decisions Made\n- Action Items (as Markdown checkboxes "- [ ]")\n\nTranscript:\n${t}`,
    summary: (t) => `Summarize the key points of this screen recording transcript concisely in 2-4 paragraphs.\n\nTranscript:\n${t}`,
    keypoints: (t) => `Extract the key points from this screen recording transcript as a bullet-point list. Each point should be a concise, actionable insight:\n\nTranscript:\n${t}`,
    action_items: (t) => `Extract all action items, tasks, and to-dos from this screen recording transcript. Format as a strict Markdown checklist using "- [ ] task". Group by topic if applicable:\n\nTranscript:\n${t}`,
    chapters: (t) => `Generate smart chapters for this screen recording transcript. Format as a bulleted list with clear, catchy titles for each section:\n\nTranscript:\n${t}`,
    social: (t) => `Repurpose this screen recording transcript into an engaging, professional social media post (e.g., for LinkedIn or Twitter). Include a catchy hook, main takeaways, and relevant hashtags:\n\nTranscript:\n${t}`,
    quiz: (t) => `Based on this screen recording transcript, generate a short interactive quiz with 3 multiple choice questions to test the viewer's knowledge. Provide the questions first, then list the correct answers at the end:\n\nTranscript:\n${t}`,
};
router.post("/summarize", requireAuth, async (req, res) => {
    const authReq = req;
    const { transcript, style } = req.body;
    if (!transcript) {
        res.status(400).json({ error: "missing_transcript" });
        return;
    }
    const user = await createOrUpdateUser(authReq.userId, {
        email: authReq.userEmail,
        displayName: authReq.userName,
        picture: authReq.userPicture,
    }, "AI Screen Recorder");
    const usePremium = user.credits > 0;
    const { client, model } = pickAIClient(usePremium);
    try {
        const promptFn = SUMMARIZE_PROMPTS[style || "summary"] || SUMMARIZE_PROMPTS.summary;
        const prompt = promptFn(transcript);
        const systemInstruction = "You are a concise content analyzer for a screen recording tool. Create clear, well-structured, and actionable summaries. Respond in the same language as the transcript. CRITICAL RULE: Answer naturally regarding the video content. NEVER say 'This transcript contains...' or 'The video shows...'. Speak directly about the topic.";
        let summaryText = "";
        if (!usePremium && estimateTokenCount(prompt) <= GROQ_TOKEN_LIMIT) {
            summaryText = await generateTextWithGroq(systemInstruction, prompt, false);
        }
        else {
            const response = await client.models.generateContent({
                model,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    systemInstruction,
                    temperature: 0.5,
                    maxOutputTokens: 2048,
                },
            });
            summaryText = (response.text || "").trim();
            if (usePremium) {
                const { creditsUsed, inputTokens, outputTokens } = extractTokenCost(response);
                deductCreditsByEmail(authReq.userEmail, creditsUsed).catch(console.error);
                logUsage({
                    userId: authReq.userId,
                    app: "screenity",
                    creditsUsed,
                    model,
                    timestamp: new Date(),
                    inputTokens,
                    outputTokens,
                }).catch(console.error);
            }
        }
        res.json({ summary: summaryText });
    }
    catch (error) {
        console.error("[Screenity AI] Summarize error:", error);
        res.status(500).json({ error: "summarization_failed" });
    }
});
// ─── Translate (segments → translated segments) ─────────────────────
router.post("/translate", requireAuth, async (req, res) => {
    const authReq = req;
    const { segments, targetLang } = req.body;
    if (!segments || !targetLang) {
        res.status(400).json({ error: "missing_params" });
        return;
    }
    const user = await createOrUpdateUser(authReq.userId, {
        email: authReq.userEmail,
        displayName: authReq.userName,
        picture: authReq.userPicture,
    }, "AI Screen Recorder");
    const usePremium = user.credits > 0;
    const { client, model } = pickAIClient(usePremium);
    try {
        const textsPayload = segments.map((s, i) => ({
            i,
            t: s.text,
        }));
        const prompt = `Translate each "t" field to the language with code '${targetLang}' (e.g., if 'vi' then Vietnamese). Keep the "i" index unchanged.
Return ONLY a valid JSON object containing a "translations" array.
Format: { "translations": [ {"i": index, "t": "translated text"} ] }

${JSON.stringify(textsPayload)}`;
        const systemInstruction = "You are a professional translator for screen recordings. Output only the requested JSON object.";
        let rawText = "[]";
        if (!usePremium && estimateTokenCount(prompt) <= GROQ_TOKEN_LIMIT) {
            rawText = await generateTextWithGroq(systemInstruction, prompt, true);
        }
        else {
            const response = await client.models.generateContent({
                model,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    systemInstruction,
                    temperature: 0.3,
                    maxOutputTokens: 8192,
                },
            });
            rawText = (response.text || "[]").trim();
            if (usePremium) {
                const { creditsUsed, inputTokens, outputTokens } = extractTokenCost(response);
                deductCreditsByEmail(authReq.userEmail, creditsUsed).catch(console.error);
                logUsage({
                    userId: authReq.userId,
                    app: "screenity",
                    creditsUsed,
                    model,
                    timestamp: new Date(),
                    inputTokens,
                    outputTokens,
                }).catch(console.error);
            }
        }
        const parsedJSON = parseJSON(rawText);
        const translatedTexts = Array.isArray(parsedJSON) ? parsedJSON : (parsedJSON?.translations || []);
        const textMap = new Map();
        if (Array.isArray(translatedTexts)) {
            translatedTexts.forEach((item) => {
                if (typeof item.i === "number" && typeof item.t === "string") {
                    textMap.set(item.i, item.t);
                }
            });
        }
        const translatedSegments = segments.map((seg, idx) => ({
            start: seg.start,
            end: seg.end,
            text: textMap.get(idx) || seg.text,
        }));
        res.json({ translatedSegments });
    }
    catch (error) {
        console.error("[Screenity AI] Translate error:", error);
        res.status(500).json({ error: "translation_failed" });
    }
});
// ─── Smart Title ────────────────────────────────────────────────────
router.post("/title", requireAuth, async (req, res) => {
    const authReq = req;
    const { transcript } = req.body;
    if (!transcript) {
        res.status(400).json({ error: "missing_transcript" });
        return;
    }
    const user = await createOrUpdateUser(authReq.userId, {
        email: authReq.userEmail,
        displayName: authReq.userName,
        picture: authReq.userPicture,
    }, "AI Screen Recorder");
    const usePremium = user.credits > 0;
    const { client, model } = pickAIClient(usePremium);
    try {
        const contextText = transcript.slice(0, 5000);
        const prompt = `Based on the following video transcript, generate:
1. A concise, descriptive title (max 60 characters)
2. A brief description (max 200 characters)
3. 3-5 relevant tags

Transcript:
${contextText}

Respond in this exact JSON format:
{"title": "...", "description": "...", "tags": ["...", "..."]}`;
        const systemInstruction = "You are a content metadata specialist for a screen recording app. Generate clear, SEO-friendly titles and descriptions. Always respond in valid JSON format. Respond in the same language as the transcript. Do not say 'This transcript contains', talk directly about the topic.";
        let rawText = "{}";
        if (!usePremium && estimateTokenCount(prompt) <= GROQ_TOKEN_LIMIT) {
            rawText = await generateTextWithGroq(systemInstruction, prompt, true);
        }
        else {
            const response = await client.models.generateContent({
                model,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    systemInstruction,
                    temperature: 0.6,
                    maxOutputTokens: 256,
                },
            });
            rawText = (response.text || "{}").trim();
            if (usePremium) {
                const { creditsUsed, inputTokens, outputTokens } = extractTokenCost(response);
                deductCreditsByEmail(authReq.userEmail, creditsUsed).catch(console.error);
                logUsage({
                    userId: authReq.userId,
                    app: "screenity",
                    creditsUsed,
                    model,
                    timestamp: new Date(),
                    inputTokens,
                    outputTokens,
                }).catch(console.error);
            }
        }
        const result = parseJSON(rawText);
        res.json({
            title: result.title || "Untitled Recording",
            description: result.description || "",
            tags: Array.isArray(result.tags) ? result.tags : [],
        });
    }
    catch (error) {
        console.error("[Screenity AI] Title error:", error);
        res.status(500).json({ error: "title_generation_failed" });
    }
});
// ─── Voiceover (Groq Orpheus TTS) ───────────────────────────────────
router.post("/voiceover", requireAuth, async (req, res) => {
    const { transcript, voice = "autumn" } = req.body;
    if (!transcript) {
        res.status(400).json({ error: "missing_transcript" });
        return;
    }
    if (!VALID_VOICES.includes(voice)) {
        res.status(400).json({ error: "invalid_voice", validVoices: VALID_VOICES });
        return;
    }
    try {
        // Chunk transcript into ≤ 190 char pieces (Orpheus limit: 200 chars)
        const chunks = chunkTranscriptBySentence(transcript, 190);
        const wavBuffers = [];
        for (const chunk of chunks) {
            const response = await groqClient.audio.speech.create({
                model: "canopylabs/orpheus-v1-english",
                voice: voice,
                input: chunk,
                response_format: "wav",
            });
            const buffer = Buffer.from(await response.arrayBuffer());
            wavBuffers.push(buffer);
        }
        // Concatenate WAV files (keep header from first, append raw PCM from rest)
        const combined = concatenateWavBuffers(wavBuffers);
        const base64 = combined.toString("base64");
        res.json({ audioBase64: base64, mimeType: "audio/wav" });
    }
    catch (error) {
        console.error("[Screenity AI] Voiceover error:", error?.message);
        const isRateLimit = error?.status === 429;
        res.status(isRateLimit ? 429 : 500).json({
            error: isRateLimit ? "rate_limited" : "voiceover_failed",
        });
    }
});
// ─── Helpers ────────────────────────────────────────────────────────
/**
 * Split transcript into chunks ≤ maxLen chars, preferring sentence boundaries.
 */
function chunkTranscriptBySentence(text, maxLen) {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const chunks = [];
    let current = "";
    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed)
            continue;
        if (current.length + trimmed.length + 1 <= maxLen) {
            current += (current ? " " : "") + trimmed;
        }
        else {
            if (current)
                chunks.push(current);
            // If single sentence exceeds maxLen, hard-split by words
            if (trimmed.length > maxLen) {
                const words = trimmed.split(/\s+/);
                let wordBuf = "";
                for (const word of words) {
                    if (wordBuf.length + word.length + 1 <= maxLen) {
                        wordBuf += (wordBuf ? " " : "") + word;
                    }
                    else {
                        if (wordBuf)
                            chunks.push(wordBuf);
                        wordBuf = word;
                    }
                }
                current = wordBuf;
            }
            else {
                current = trimmed;
            }
        }
    }
    if (current)
        chunks.push(current);
    return chunks;
}
/**
 * Concatenate multiple WAV buffers into one.
 * Assumes all have same sample rate/format (Orpheus outputs consistent WAV).
 */
function concatenateWavBuffers(buffers) {
    if (buffers.length === 0)
        return Buffer.alloc(0);
    if (buffers.length === 1)
        return buffers[0];
    // WAV header is 44 bytes; raw PCM data starts at byte 44
    const headerSize = 44;
    let totalDataSize = 0;
    for (const buf of buffers) {
        totalDataSize += buf.length - headerSize;
    }
    // Copy header from first file, update data size fields
    const header = Buffer.from(buffers[0].subarray(0, headerSize));
    header.writeUInt32LE(totalDataSize + headerSize - 8, 4); // RIFF chunk size
    header.writeUInt32LE(totalDataSize, 40); // data chunk size
    const result = Buffer.alloc(headerSize + totalDataSize);
    header.copy(result, 0);
    let offset = headerSize;
    for (const buf of buffers) {
        buf.copy(result, offset, headerSize);
        offset += buf.length - headerSize;
    }
    return result;
}
function parseJSON(rawText) {
    const cleaned = stripMarkdownFences(rawText);
    try {
        return JSON.parse(cleaned);
    }
    catch {
        return {};
    }
}
function stripMarkdownFences(text) {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json"))
        cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```"))
        cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```"))
        cleaned = cleaned.slice(0, -3);
    return cleaned.trim();
}
export default router;
//# sourceMappingURL=screenity-ai.js.map