import { useState } from "react";
import { prepareAudioChunks } from "../lib/audioCompress";
import { createClient } from "@/utils/supabase/client";

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

// Fallback to our new Google Cloud Run backend URL
const API_BASE = (import.meta.env?.VITE_API_BASE || "https://openvid-backend-676582412453.us-central1.run.app").replace(/\/$/, "");

export function useAI() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribeStatus, setTranscribeStatus] = useState("");

  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [isGeneratingDubbing, setIsGeneratingDubbing] = useState(false);

  // Helper to construct authorization headers using Google OAuth access token from Supabase session
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  // Robust helper to handle API responses and extract exact server error messages (e.g. Quota Exhausted)
  const handleResponse = async (response: Response, fallbackErrorMsg: string) => {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid authentication session. Please sign in again to continue.");
      }
      try {
        const errData = await response.json();
        const serverMsg = errData.message || errData.error;
        if (serverMsg) {
          throw new Error(serverMsg);
        }
      } catch (err: any) {
        // Rethrow if we created our custom Error above
        if (err.message && err.message !== "Unexpected end of JSON input" && !err.message.includes("JSON")) {
          throw err;
        }
      }
      throw new Error(`${fallbackErrorMsg} (HTTP ${response.status})`);
    }
    return response.json();
  };

  const transcribeVideo = async (videoUrl: string): Promise<{ segments: SubtitleSegment[], transcript: string }> => {
    setIsTranscribing(true);
    setTranscribeProgress(5);
    setTranscribeStatus("Downloading video for audio extraction...");

    try {
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error("Failed to load video file");
      const videoBlob = await res.blob();

      setTranscribeProgress(15);
      setTranscribeStatus("Extracting & compressing audio track...");

      const chunks = await prepareAudioChunks(videoBlob, (msg: string) => {
        setTranscribeStatus(msg);
      });

      if (chunks.length === 0) {
        throw new Error("No audio track detected in this video.");
      }

      setTranscribeProgress(40);
      setTranscribeStatus("Sending compressed audio to AI backend...");

      let allSegments: SubtitleSegment[] = [];
      let allTranscript = "";

      const headers = await getAuthHeaders();

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setTranscribeStatus(`Processing audio chunk ${i + 1}/${chunks.length}...`);

        const response = await fetch(`${API_BASE}/api/screenity/transcribe`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            audioBase64: chunk.base64,
            mimeType: chunk.mimeType,
            audioDurationSec: chunk.durationSec,
          }),
        });

        const data = await handleResponse(response, "AI Server Error");
        if (data.segments && Array.isArray(data.segments)) {
          data.segments.forEach((seg: any) => {
            allSegments.push({
              start: (seg.start || 0) + chunk.startSec,
              end: (seg.end || 0) + chunk.startSec,
              text: seg.text || "",
            });
            allTranscript += (seg.text || "") + " ";
          });
        }
        setTranscribeProgress(40 + ((i + 1) / chunks.length) * 50);
      }

      setTranscribeProgress(100);
      setTranscribeStatus("Transcription completed!");
      return { segments: allSegments, transcript: allTranscript.trim() };
    } catch (error) {
      console.error("[useAI] Transcribe error:", error);
      setTranscribeProgress(0);
      setTranscribeStatus("");
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const translateSubtitles = async (segments: SubtitleSegment[], targetLang: string): Promise<SubtitleSegment[]> => {
    setIsTranslating(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/screenity/translate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ segments, targetLang }),
      });

      const data = await handleResponse(response, "Translation failed");
      return data.translatedSegments || [];
    } catch (error) {
      console.error("[useAI] Translate error:", error);
      throw error;
    } finally {
      setIsTranslating(false);
    }
  };

  const generateInsights = async (transcript: string, style: string): Promise<string> => {
    setIsGeneratingInsights(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/screenity/summarize`, {
        method: "POST",
        headers,
        body: JSON.stringify({ transcript, style }),
      });

      const data = await handleResponse(response, "Failed to retrieve insights from server");
      return data.summary || "";
    } catch (error) {
      console.error("[useAI] Insights error:", error);
      throw error;
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const generateVoiceover = async (text: string, voice: string): Promise<{ audioBase64: string, mimeType: string }> => {
    setIsGeneratingVoiceover(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/screenity/voiceover`, {
        method: "POST",
        headers,
        body: JSON.stringify({ transcript: text, voice }),
      });

      const data = await handleResponse(response, "Failed to generate speech audio");
      return { audioBase64: data.audioBase64, mimeType: data.mimeType };
    } catch (error) {
      console.error("[useAI] Voiceover error:", error);
      throw error;
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  const generateDubbing = async (segments: SubtitleSegment[], voice: string): Promise<Array<{ start: number, end: number, audioBase64: string, mimeType: string }>> => {
    setIsGeneratingDubbing(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/screenity/dub`, {
        method: "POST",
        headers,
        body: JSON.stringify({ segments, voice }),
      });

      const data = await handleResponse(response, "Failed to generate dubbing speech tracks");
      return data.segments || [];
    } catch (error) {
      console.error("[useAI] Dubbing error:", error);
      throw error;
    } finally {
      setIsGeneratingDubbing(false);
    }
  };

  return {
    isTranscribing,
    transcribeProgress,
    transcribeStatus,
    isTranslating,
    isGeneratingInsights,
    isGeneratingVoiceover,
    isGeneratingDubbing,
    transcribeVideo,
    translateSubtitles,
    generateInsights,
    generateVoiceover,
    generateDubbing
  };
}
