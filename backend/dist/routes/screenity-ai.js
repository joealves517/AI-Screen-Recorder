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
import { createOrUpdateUser, deductCreditsByEmail, logUsage, checkFreeCreditLimit, deductFreeCredits, } from "../services/firestore.js";
import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import { calculateTokenCost } from "../services/token-cost.js";
import { transcribeWithGemini } from "../services/gemini-transcribe.js";
const VALID_VOICES = ["autumn", "diana", "hannah", "austin", "daniel", "troy"];
const router = Router();
const vertexAI = new GoogleGenAI({
    vertexai: true,
    project: config.gcp.projectId,
    location: config.gcp.region,
});
// Premium-tier model configuration
const PREMIUM_MODEL = "gemini-2.5-flash-lite";
// Helper to estimate tokens
function estimateTokenCount(text) {
    return Math.ceil((text?.length || 0) / 4);
}
// Helpers removed since Groq text is deleted
const FREE_MAX_DURATION_SEC = 1200; // 20 minutes
/** Pick the correct AI client and model based on whether credits are available */
function pickAIClient() {
    return { client: vertexAI, model: PREMIUM_MODEL };
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
    const usePremium = user.credits > 0;
    if (!usePremium) {
        if (audioDurationSec && audioDurationSec > FREE_MAX_DURATION_SEC) {
            res.status(403).json({
                error: "recording_too_long",
                maxMinutes: 20,
                message: "Free users can only transcribe recordings up to 20 minutes. Upgrade to PRO for unlimited.",
            });
            return;
        }
        const canProceed = await checkFreeCreditLimit(authReq.userEmail);
        if (!canProceed) {
            res.status(403).json({
                error: "You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access."
            });
            return;
        }
    }
    try {
        // Gemini Flash Lite — free/premium, deduct credits based on token cost
        const result = await transcribeWithGemini(audioBase64, mimeType || "audio/mpeg", usePremium);
        const creditsUsed = result.usage
            ? calculateTokenCost(result.usage)
            : 5;
        console.log(`[Screenity AI] Transcribe completed. Cost: ${creditsUsed} credits (tokens: ${JSON.stringify(result.usage)})`);
        if (usePremium) {
            deductCreditsByEmail(authReq.userEmail, creditsUsed).catch(console.error);
        }
        else {
            deductFreeCredits(authReq.userEmail, creditsUsed).catch(console.error);
        }
        res.json({
            segments: result.segments,
            transcript: result.transcript,
        });
    }
    catch (error) {
        console.error("[Screenity AI] Transcribe error:", error?.message);
        res.status(500).json({
            error: "We are facing high traffic. Please try again later.",
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
    if (!usePremium) {
        const canProceed = await checkFreeCreditLimit(authReq.userEmail);
        if (!canProceed) {
            res.status(403).json({
                error: "quota_exhausted",
                message: "You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access."
            });
            return;
        }
    }
    const { client, model } = pickAIClient();
    try {
        const promptFn = SUMMARIZE_PROMPTS[style || "summary"] || SUMMARIZE_PROMPTS.summary;
        const prompt = promptFn(transcript);
        const systemInstruction = "You are a concise content analyzer for a screen recording tool. Create clear, well-structured, and actionable summaries. Respond in the same language as the transcript. CRITICAL RULE: Answer naturally regarding the video content. NEVER say 'This transcript contains...' or 'The video shows...'. Speak directly about the topic.";
        let summaryText = "";
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
        else {
            deductFreeCredits(authReq.userEmail, 2).catch(console.error);
        }
        res.json({ summary: summaryText });
    }
    catch (error) {
        console.error("[Screenity AI] Summarize error:", error);
        res.status(500).json({ error: "We are facing high traffic. Please try again later." });
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
    if (!usePremium) {
        const canProceed = await checkFreeCreditLimit(authReq.userEmail);
        if (!canProceed) {
            res.status(403).json({
                error: "quota_exhausted",
                message: "You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access."
            });
            return;
        }
    }
    const { client, model } = pickAIClient();
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
        else {
            deductFreeCredits(authReq.userEmail, 2).catch(console.error);
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
    const user = await createOrUpdateUser(authReq.userId, {
        email: authReq.userEmail,
        displayName: authReq.userName,
        picture: authReq.userPicture,
    }, "AI Screen Recorder");
    const usePremium = user.credits > 0;
    if (!usePremium) {
        const canProceed = await checkFreeCreditLimit(authReq.userEmail);
        if (!canProceed) {
            res.status(403).json({
                error: "quota_exhausted",
                message: "You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access."
            });
            return;
        }
    }
    const { client, model } = pickAIClient();
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
        else {
            deductFreeCredits(authReq.userEmail, 2).catch(console.error);
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
// ─── AI Chat Agent (with structured Tool Calls) ──────────────────────
router.post("/chat", requireAuth, async (req, res) => {
    const authReq = req;
    const { history, transcript } = req.body;
    if (!history) {
        res.status(400).json({ error: "missing_history" });
        return;
    }
    const user = await createOrUpdateUser(authReq.userId, {
        email: authReq.userEmail,
        displayName: authReq.userName,
        picture: authReq.userPicture,
    }, "AI Screen Recorder");
    const usePremium = user.credits > 0;
    if (!usePremium) {
        const canProceed = await checkFreeCreditLimit(authReq.userEmail);
        if (!canProceed) {
            res.status(403).json({
                error: "quota_exhausted",
                message: "You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access."
            });
            return;
        }
    }
    const { client, model } = pickAIClient();
    try {
        const formattedHistory = history
            .map((msg) => `${msg.role === "user" ? "User" : "Agent"}: ${msg.content}`)
            .join("\n");
        const prompt = `You are a helpful AI Screen Recorder Assistant. You help users interact with their screen recording transcripts and run local tools.
Here is the video transcript:
"${transcript || "No transcript available for this video."}"

You can run these extension tools by returning structured tool calls:
1. "translate_subtitles" (args: { "targetLang": string }) - Translate subtitles to a new language. Example targetLang values: "vi" (Vietnamese), "fr" (French), "es" (Spanish), "ja" (Japanese), etc.
2. "generate_summary" (args: { "style": string }) - Re-generate a summary (styles: "summary", "keypoints", "chapters", "meeting_minutes", "social").
3. "apply_voiceover" (args: { "voice": string }) - Generate and apply AI Voice Narrator.

If the user asks you to perform one of these actions, specify the tool call in the JSON.
CRITICAL: Respond in a valid JSON object only. Do NOT output markdown code blocks like \`\`\`json.
Format of JSON:
{
  "reply": "Your conversational reply to the user...",
  "thoughts": "Your thought process about what tools to use...",
  "tool_calls": [
    {
      "name": "translate_subtitles", 
      "args": { "targetLang": "vi" }
    }
  ] // Empty array if no tools are needed.
}

Conversation History:
${formattedHistory}`;
        const systemInstruction = "You are a video assistant companion. Respond ONLY in valid JSON format. Always match the user's language in the reply. Speak naturally and concisely.";
        const response = await client.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction,
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        });
        const rawText = (response.text || "{}").trim();
        const result = parseJSON(rawText);
        if (usePremium) {
            const { creditsUsed, inputTokens, outputTokens } = extractTokenCost(response);
            deductCreditsByEmail(authReq.userEmail, creditsUsed).catch(console.error);
        }
        else {
            deductFreeCredits(authReq.userEmail, 2).catch(console.error);
        }
        res.json({
            reply: result.reply || "I'm sorry, I couldn't process that.",
            thoughts: result.thoughts || "",
            tool_calls: result.tool_calls || [],
        });
    }
    catch (error) {
        console.error("[Screenity AI] Chat agent error:", error);
        res.status(500).json({ error: "We are facing high traffic. Please try again later." });
    }
});
export default router;
//# sourceMappingURL=screenity-ai.js.map