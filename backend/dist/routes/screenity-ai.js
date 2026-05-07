/**
 * Screenity AI Routes — Premium tier (Vertex AI, requires auth + credits).
 * Endpoints: transcribe, summarize, translate, title-generate.
 * Token-based billing: deduct credits based on actual token usage.
 * When credits exhausted, gracefully fallback to free Gemini API.
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createOrUpdateUser, deductCreditsByEmail, logUsage, } from "../services/firestore.js";
import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import { calculateTokenCost } from "../services/token-cost.js";
const router = Router();
const vertexAI = new GoogleGenAI({
    vertexai: true,
    project: config.gcp.projectId,
    location: config.gcp.region,
});
// Free-tier Gemini client (API key based) for fallback
const freeAI = new GoogleGenAI({
    apiKey: "AIzaSyB9Idi7DYIkSWnl1urpImbCIhNMztPVFSU",
});
const PREMIUM_MODEL = "gemini-2.5-flash";
const FREE_MODEL = "gemini-2.5-flash-lite";
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
// ─── Transcribe (audio → timestamped segments) ─────────────────────
router.post("/transcribe", requireAuth, async (req, res) => {
    const authReq = req;
    const { audioBase64, mimeType, language } = req.body;
    if (!audioBase64) {
        res.status(400).json({ error: "missing_audio" });
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
        const languageHint = language ? `The audio is in ${language}. ` : "";
        const response = await client.models.generateContent({
            model,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${languageHint}Transcribe all spoken words in this recording with accurate timestamps.

Return the result as a JSON array of segments. Each segment has:
- "start": start time in seconds (float, e.g. 0.0, 2.5)
- "end": end time in seconds (float)
- "text": the spoken text for that time range

Keep each segment short (1-2 sentences max) so subtitles are readable.
If there is no speech, return an empty array: []

Return ONLY the raw JSON array. No markdown code blocks, no commentary.`,
                        },
                        {
                            inlineData: {
                                mimeType: mimeType || "audio/webm",
                                data: audioBase64,
                            },
                        },
                    ],
                },
            ],
            config: {
                temperature: 0.1,
                maxOutputTokens: 8192,
            },
        });
        const rawText = response.text || "[]";
        const segments = parseSegments(rawText);
        const transcript = segments.map((s) => s.text).join(" ");
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
        res.json({ segments, transcript });
    }
    catch (error) {
        console.error("[Screenity AI] Transcribe error:", error);
        res.status(500).json({ error: "transcription_failed" });
    }
});
// ─── Summarize ──────────────────────────────────────────────────────
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
        let prompt = "";
        if (style === "keypoints") {
            prompt = `Extract the key points from this video transcript as a bullet-point list. Each point should be a concise, actionable insight:\n\n${transcript}`;
        }
        else if (style === "chapters") {
            prompt = `Generate YouTube-style smart chapters for this video transcript. Format as a bulleted list with clear, catchy titles for each section:\n\n${transcript}`;
        }
        else if (style === "social") {
            prompt = `Repurpose this video transcript into an engaging, professional social media post (e.g., for LinkedIn or Twitter). Include a catchy hook, main takeaways, and relevant hashtags:\n\n${transcript}`;
        }
        else if (style === "quiz") {
            prompt = `Based on this video transcript, generate a short interactive quiz with 3 multiple choice questions to test the viewer's knowledge. Provide the questions first, then list the correct answers at the end:\n\n${transcript}`;
        }
        else {
            prompt = `Summarize the following video transcript in 2-3 sentences:\n\n${transcript}`;
        }
        const response = await client.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are a concise content summarizer. Create clear, accurate summaries.",
                temperature: 0.5,
                maxOutputTokens: 1024,
            },
        });
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
        res.json({ summary: (response.text || "").trim() });
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
        const response = await client.models.generateContent({
            model,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Translate each "t" field to ${targetLang}. Keep the "i" index unchanged.
Return ONLY a valid JSON array of objects with "i" and "t" fields.
No markdown, no commentary.

${JSON.stringify(textsPayload)}`,
                        },
                    ],
                },
            ],
            config: {
                systemInstruction: "You are a professional translator. Output only the JSON array.",
                temperature: 0.3,
                maxOutputTokens: 8192,
            },
        });
        const rawText = (response.text || "[]").trim();
        const translatedTexts = parseJSON(rawText);
        const textMap = new Map();
        translatedTexts.forEach((item) => {
            if (typeof item.i === "number" && typeof item.t === "string") {
                textMap.set(item.i, item.t);
            }
        });
        const translatedSegments = segments.map((seg, idx) => ({
            start: seg.start,
            end: seg.end,
            text: textMap.get(idx) || seg.text,
        }));
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
        const response = await client.models.generateContent({
            model,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Based on the following video transcript, generate:
1. A concise, descriptive title (max 60 characters)
2. A brief description (max 200 characters)
3. 3-5 relevant tags

Transcript:
${contextText}

Respond in this exact JSON format:
{"title": "...", "description": "...", "tags": ["...", "..."]}`,
                        },
                    ],
                },
            ],
            config: {
                systemInstruction: "You are a content metadata specialist. Generate clear, SEO-friendly titles and descriptions. Always respond in valid JSON format.",
                temperature: 0.6,
                maxOutputTokens: 256,
            },
        });
        const rawText = (response.text || "{}").trim();
        const result = parseJSON(rawText);
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
// ─── Helpers ────────────────────────────────────────────────────────
function parseSegments(rawText) {
    const cleaned = stripMarkdownFences(rawText);
    try {
        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed))
            return [];
        return parsed
            .filter((s) => s && typeof s.text === "string" && s.text.trim().length > 0)
            .map((s) => ({
            start: typeof s.start === "number" ? Math.max(0, s.start) : 0,
            end: typeof s.end === "number" ? Math.max(0, s.end) : 0,
            text: s.text.trim(),
        }));
    }
    catch {
        return [];
    }
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