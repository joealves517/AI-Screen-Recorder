/**
 * Screenity AI Routes — Free tier (Gemini API key, requires auth to prevent abuse).
 * Uses the project's own API key, NOT shared with other extensions.
 * Rate limited aggressively.
 */
import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
// Screenity-specific free tier API key (isolated from BlackNote/Ask This Page)
const ai = new GoogleGenAI({
    apiKey: "AIzaSyB9Idi7DYIkSWnl1urpImbCIhNMztPVFSU",
});
const MODEL = "gemini-2.5-flash-lite";
// ─── Transcribe ─────────────────────────────────────────────────────
router.post("/transcribe", requireAuth, async (req, res) => {
    const { audioBase64, mimeType, language } = req.body;
    if (!audioBase64) {
        res.status(400).json({ error: "missing_audio" });
        return;
    }
    try {
        const languageHint = language ? `The audio is in ${language}. ` : "";
        const response = await ai.models.generateContent({
            model: MODEL,
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
        res.json({ segments, transcript });
    }
    catch (error) {
        console.error("[Screenity Free] Transcribe error:", error);
        res.status(500).json({ error: "transcription_failed" });
    }
});
// ─── Summarize ──────────────────────────────────────────────────────
router.post("/summarize", requireAuth, async (req, res) => {
    const { transcript, style } = req.body;
    if (!transcript) {
        res.status(400).json({ error: "missing_transcript" });
        return;
    }
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
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are a concise content summarizer. Create clear, accurate summaries.",
                temperature: 0.5,
                maxOutputTokens: 1024,
            },
        });
        res.json({ summary: (response.text || "").trim() });
    }
    catch (error) {
        console.error("[Screenity Free] Summarize error:", error);
        res.status(500).json({ error: "summarization_failed" });
    }
});
// ─── Translate ──────────────────────────────────────────────────────
router.post("/translate", requireAuth, async (req, res) => {
    const { segments, targetLang } = req.body;
    if (!segments || !targetLang) {
        res.status(400).json({ error: "missing_params" });
        return;
    }
    try {
        const textsPayload = segments.map((s, i) => ({
            i,
            t: s.text,
        }));
        const response = await ai.models.generateContent({
            model: MODEL,
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
        console.error("[Screenity Free] Translate error:", error);
        res.status(500).json({ error: "translation_failed" });
    }
});
// ─── Smart Title ────────────────────────────────────────────────────
router.post("/title", requireAuth, async (req, res) => {
    const { transcript } = req.body;
    if (!transcript) {
        res.status(400).json({ error: "missing_transcript" });
        return;
    }
    try {
        const contextText = transcript.slice(0, 5000);
        const response = await ai.models.generateContent({
            model: MODEL,
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
                systemInstruction: "You are a content metadata specialist. Generate clear, SEO-friendly titles. Always respond in valid JSON format.",
                temperature: 0.6,
                maxOutputTokens: 256,
            },
        });
        const rawText = (response.text || "{}").trim();
        const result = parseJSON(rawText);
        res.json({
            title: result.title || "Untitled Recording",
            description: result.description || "",
            tags: Array.isArray(result.tags) ? result.tags : [],
        });
    }
    catch (error) {
        console.error("[Screenity Free] Title error:", error);
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
//# sourceMappingURL=screenity-ai-free.js.map