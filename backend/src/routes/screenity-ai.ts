/**
 * Screenity AI Routes — Premium tier (Vertex AI, requires auth + credits).
 * Endpoints: transcribe, summarize, translate, title-generate.
 */

import { Router, Request, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import {
  createOrUpdateUser,
  deductCreditsByEmail,
  addCreditsByEmail,
  logUsage,
} from "../services/firestore.js";
import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const router = Router();

const vertexAI = new GoogleGenAI({
  vertexai: true,
  project: config.gcp.projectId,
  location: config.gcp.region,
});

const MODEL = "gemini-2.5-flash";

// ─── Transcribe (audio → timestamped segments) ─────────────────────

router.post(
  "/transcribe",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { audioBase64, mimeType, language } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: "missing_audio" });
      return;
    }

    const user = await createOrUpdateUser(authReq.userId, {
      email: authReq.userEmail,
      displayName: authReq.userName,
      picture: authReq.userPicture,
    });

    // Deduct 2 credits for transcription (heavier task)
    if (user.credits < 2) {
      res.status(402).json({ error: "insufficient_credits" });
      return;
    }
    const deducted = await deductCreditsByEmail(authReq.userEmail, 2);
    if (!deducted) {
      res.status(402).json({ error: "insufficient_credits" });
      return;
    }

    try {
      const languageHint = language ? `The audio is in ${language}. ` : "";

      const response = await vertexAI.models.generateContent({
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
      const transcript = segments.map((s: any) => s.text).join(" ");

      logUsage({
        userId: authReq.userId,
        app: "screenity",
        creditsUsed: 2,
        model: MODEL,
        timestamp: new Date(),
      }).catch(console.error);

      res.json({ segments, transcript });
    } catch (error) {
      // Refund on failure
      if (user.credits > 0) {
        addCreditsByEmail(authReq.userEmail, 2).catch(console.error);
      }
      console.error("[Screenity AI] Transcribe error:", error);
      res.status(500).json({ error: "transcription_failed" });
    }
  }
);

// ─── Summarize ──────────────────────────────────────────────────────

router.post(
  "/summarize",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { transcript, style } = req.body;

    if (!transcript) {
      res.status(400).json({ error: "missing_transcript" });
      return;
    }

    const user = await createOrUpdateUser(authReq.userId, {
      email: authReq.userEmail,
      displayName: authReq.userName,
      picture: authReq.userPicture,
    });

    if (user.credits < 1) {
      res.status(402).json({ error: "insufficient_credits" });
      return;
    }
    const deducted = await deductCreditsByEmail(authReq.userEmail, 1);
    if (!deducted) {
      res.status(402).json({ error: "insufficient_credits" });
      return;
    }

    try {
      const prompt =
        style === "keypoints"
          ? `Extract the key points from this video transcript as a bullet-point list. Each point should be a concise, actionable insight:\n\n${transcript}`
          : `Summarize the following video transcript in 2-3 sentences:\n\n${transcript}`;

      const response = await vertexAI.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction:
            "You are a concise content summarizer. Create clear, accurate summaries.",
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      });

      logUsage({
        userId: authReq.userId,
        app: "screenity",
        creditsUsed: 1,
        model: MODEL,
        timestamp: new Date(),
      }).catch(console.error);

      res.json({ summary: (response.text || "").trim() });
    } catch (error) {
      if (user.credits > 0) {
        addCreditsByEmail(authReq.userEmail, 1).catch(console.error);
      }
      console.error("[Screenity AI] Summarize error:", error);
      res.status(500).json({ error: "summarization_failed" });
    }
  }
);

// ─── Translate (segments → translated segments) ─────────────────────

router.post(
  "/translate",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { segments, targetLang } = req.body;

    if (!segments || !targetLang) {
      res.status(400).json({ error: "missing_params" });
      return;
    }

    const user = await createOrUpdateUser(authReq.userId, {
      email: authReq.userEmail,
      displayName: authReq.userName,
      picture: authReq.userPicture,
    });

    if (user.credits < 1) {
      res.status(402).json({ error: "insufficient_credits" });
      return;
    }
    const deducted = await deductCreditsByEmail(authReq.userEmail, 1);
    if (!deducted) {
      res.status(402).json({ error: "insufficient_credits" });
      return;
    }

    try {
      const textsPayload = segments.map((s: any, i: number) => ({
        i,
        t: s.text,
      }));

      const response = await vertexAI.models.generateContent({
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
          systemInstruction:
            "You are a professional translator. Output only the JSON array.",
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      });

      const rawText = (response.text || "[]").trim();
      const translatedTexts = parseJSON(rawText);

      // Merge back with original timestamps
      const textMap = new Map<number, string>();
      translatedTexts.forEach((item: any) => {
        if (typeof item.i === "number" && typeof item.t === "string") {
          textMap.set(item.i, item.t);
        }
      });

      const translatedSegments = segments.map((seg: any, idx: number) => ({
        start: seg.start,
        end: seg.end,
        text: textMap.get(idx) || seg.text,
      }));

      logUsage({
        userId: authReq.userId,
        app: "screenity",
        creditsUsed: 1,
        model: MODEL,
        timestamp: new Date(),
      }).catch(console.error);

      res.json({ translatedSegments });
    } catch (error) {
      if (user.credits > 0) {
        addCreditsByEmail(authReq.userEmail, 1).catch(console.error);
      }
      console.error("[Screenity AI] Translate error:", error);
      res.status(500).json({ error: "translation_failed" });
    }
  }
);

// ─── Smart Title ────────────────────────────────────────────────────

router.post(
  "/title",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { transcript } = req.body;

    if (!transcript) {
      res.status(400).json({ error: "missing_transcript" });
      return;
    }

    const user = await createOrUpdateUser(authReq.userId, {
      email: authReq.userEmail,
      displayName: authReq.userName,
      picture: authReq.userPicture,
    });

    if (user.credits < 1) {
      res.status(402).json({ error: "insufficient_credits" });
      return;
    }
    const deducted = await deductCreditsByEmail(authReq.userEmail, 1);
    if (!deducted) {
      res.status(402).json({ error: "insufficient_credits" });
      return;
    }

    try {
      const contextText = transcript.slice(0, 5000);

      const response = await vertexAI.models.generateContent({
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
          systemInstruction:
            "You are a content metadata specialist. Generate clear, SEO-friendly titles and descriptions. Always respond in valid JSON format.",
          temperature: 0.6,
          maxOutputTokens: 256,
        },
      });

      const rawText = (response.text || "{}").trim();
      const result = parseJSON(rawText);

      logUsage({
        userId: authReq.userId,
        app: "screenity",
        creditsUsed: 1,
        model: MODEL,
        timestamp: new Date(),
      }).catch(console.error);

      res.json({
        title: result.title || "Untitled Recording",
        description: result.description || "",
        tags: Array.isArray(result.tags) ? result.tags : [],
      });
    } catch (error) {
      if (user.credits > 0) {
        addCreditsByEmail(authReq.userEmail, 1).catch(console.error);
      }
      console.error("[Screenity AI] Title error:", error);
      res.status(500).json({ error: "title_generation_failed" });
    }
  }
);

// ─── Helpers ────────────────────────────────────────────────────────

function parseSegments(rawText: string): Array<{ start: number; end: number; text: string }> {
  const cleaned = stripMarkdownFences(rawText);
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s: any) => s && typeof s.text === "string" && s.text.trim().length > 0)
      .map((s: any) => ({
        start: typeof s.start === "number" ? Math.max(0, s.start) : 0,
        end: typeof s.end === "number" ? Math.max(0, s.end) : 0,
        text: s.text.trim(),
      }));
  } catch {
    return [];
  }
}

function parseJSON(rawText: string): any {
  const cleaned = stripMarkdownFences(rawText);
  try {
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

export default router;
