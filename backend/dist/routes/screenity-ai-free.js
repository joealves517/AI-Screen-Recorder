/**
 * Screenity AI Routes — Free tier (Groq Whisper + Gemini API key).
 * Requires auth to prevent abuse. Rate limited aggressively.
 *
 * Transcription: Groq Whisper (free, fast, accurate timestamps).
 * Analysis: Gemini flash-lite (free tier API key).
 * Duration limit: 20 minutes max per transcription request.
 */
import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../middleware/auth.js";
import { transcribeWithGemini } from "../services/gemini-transcribe.js";
// Free tier: only 'autumn' voice is available
const FREE_VOICE = "autumn";
const router = Router();
import { config } from "../config/index.js";
import { checkFreeCreditLimit, deductFreeCredits } from "../services/firestore.js";
// Shared free tier API key (synced with BlackNote production)
const ai = new GoogleGenAI({
    vertexai: true,
    project: config.gcp.projectId,
    location: config.gcp.region,
});
const MODEL = "gemini-3.1-flash-lite";
const FREE_MAX_DURATION_SEC = 1200; // 20 minutes
// ─── Transcribe (Groq Whisper) ──────────────────────────────────────
router.post("/transcribe", requireAuth, async (req, res) => {
    const { audioBase64, mimeType, audioDurationSec } = req.body;
    if (!audioBase64) {
        res.status(400).json({ error: "missing_audio" });
        return;
    }
    // Free tier: enforce 20-minute limit
    if (audioDurationSec && audioDurationSec > FREE_MAX_DURATION_SEC) {
        res.status(403).json({
            error: "recording_too_long",
            maxMinutes: 20,
            message: "Free users can only transcribe recordings up to 20 minutes. Upgrade to PRO for unlimited.",
        });
        return;
    }
    try {
        const result = await transcribeWithGemini(audioBase64, mimeType || "audio/mpeg", false);
        res.json({
            segments: result.segments,
            transcript: result.transcript,
        });
    }
    catch (error) {
        console.error("[Screenity Free] Transcribe error:", error?.message);
        res.status(500).json({
            error: "We are facing high traffic. Please try again later.",
        });
    }
});
// ─── Summarize ──────────────────────────────────────────────────────
const SUMMARIZE_PROMPTS = {
    meeting_minutes: (t) => `Generate professional Meeting Minutes from this recording transcript. Include:\n- Meeting Goal / Context\n- Key Discussion Points\n- Decisions Made\n- Action Items (as Markdown checkboxes "- [ ]")\n\n${t}`,
    summary: (t) => `Summarize the following video transcript concisely in 2-3 sentences:\n\n${t}`,
    keypoints: (t) => `Extract the key points from this video transcript as a bullet-point list. Each point should be a concise, actionable insight:\n\n${t}`,
    action_items: (t) => `Extract all action items, tasks, and to-dos from this video transcript. Format as a Markdown checklist using "- [ ] task". Group by topic if applicable:\n\n${t}`,
    chapters: (t) => `Generate YouTube-style smart chapters for this video transcript. Format as a bulleted list with clear, catchy titles for each section:\n\n${t}`,
    social: (t) => `Repurpose this video transcript into an engaging, professional social media post (e.g., for LinkedIn or Twitter). Include a catchy hook, main takeaways, and relevant hashtags:\n\n${t}`,
    quiz: (t) => `Based on this video transcript, generate a short interactive quiz with 3 multiple choice questions to test the viewer's knowledge. Provide the questions first, then list the correct answers at the end:\n\n${t}`,
};
router.post("/summarize", requireAuth, async (req, res) => {
    const authReq = req;
    const { transcript, style } = req.body;
    if (!transcript) {
        res.status(400).json({ error: "missing_transcript" });
        return;
    }
    const canProceed = await checkFreeCreditLimit(authReq.userEmail);
    if (!canProceed) {
        res.status(403).json({
            error: "quota_exhausted",
            message: "You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access."
        });
        return;
    }
    try {
        const promptFn = SUMMARIZE_PROMPTS[style || "summary"] || SUMMARIZE_PROMPTS.summary;
        const prompt = promptFn(transcript);
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are a concise content summarizer. Create clear, accurate summaries. Respond in the same language as the transcript.",
                temperature: 0.5,
                maxOutputTokens: 1024,
            },
        });
        res.json({ summary: (response.text || "").trim() });
        deductFreeCredits(authReq.userEmail, 2).catch(console.error);
    }
    catch (error) {
        console.error("[Screenity Free] Summarize error:", error);
        res.status(500).json({ error: "We are facing high traffic. Please try again later." });
    }
});
// ─── Translate ──────────────────────────────────────────────────────
router.post("/translate", requireAuth, async (req, res) => {
    const authReq = req;
    const { segments, targetLang } = req.body;
    if (!segments || !targetLang) {
        res.status(400).json({ error: "missing_params" });
        return;
    }
    const canProceed = await checkFreeCreditLimit(authReq.userEmail);
    if (!canProceed) {
        res.status(403).json({
            error: "quota_exhausted",
            message: "You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access."
        });
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
        deductFreeCredits(authReq.userEmail, 2).catch(console.error);
    }
    catch (error) {
        console.error("[Screenity Free] Translate error:", error);
        res.status(500).json({ error: "We are facing high traffic. Please try again later." });
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
    const canProceed = await checkFreeCreditLimit(authReq.userEmail);
    if (!canProceed) {
        res.status(403).json({
            error: "quota_exhausted",
            message: "You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access."
        });
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
                systemInstruction: "You are a content metadata specialist. Generate clear, SEO-friendly titles. Always respond in valid JSON format. Respond in the same language as the transcript.",
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
        deductFreeCredits(authReq.userEmail, 2).catch(console.error);
    }
    catch (error) {
        console.error("[Screenity Free] Title error:", error);
        res.status(500).json({ error: "We are facing high traffic. Please try again later." });
    }
});
// Helper function to clean markdown fences from JSON output
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