"use client";

import { Icon } from "@iconify/react";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { gooeyToast } from "goey-toast";
import { useAI, SubtitleSegment } from "@/app/hooks/useAI";
import { getSupportedLanguages, formatToVTT, formatToSRT, LANGUAGE_GROUPS } from "@/app/lib/aiUtils";
import { useRouter } from "@/navigation";

interface AudioTrack {
  id: string;
  audioId: string;
  name: string;
  startTime: number;
  duration: number;
  trimStart?: number;
  volume: number;
  loop?: boolean;
}

interface UploadedAudio {
  id: string;
  name: string;
  url: string;
  duration: number;
}

interface AIMenuProps {
  videoUrl: string | null;
  videoDuration: number;
  audioTracks: AudioTrack[];
  uploadedAudios: UploadedAudio[];
  onAddAudioTrack?: (audioId: string) => void;
  onAudioUpload?: (file: File) => void;
  onSubtitlesChange?: (vttUrl: string | null, segments?: any[]) => void;
  subtitleSegments?: any[];
  onUpdateSubtitleSegment?: (index: number, updates: Partial<{ start: number; end: number; text: string }>) => void;
  onAddAudioTrackAtTime?: (file: File, startTime: number, duration: number) => Promise<void>;
  onToggleMuteOriginalAudio?: (mute: boolean) => void;
  muteOriginalAudio?: boolean;
}

export function AIMenu({
  videoUrl,
  videoDuration,
  audioTracks,
  uploadedAudios,
  onAddAudioTrack,
  onAudioUpload,
  onSubtitlesChange,
  subtitleSegments = [],
  onUpdateSubtitleSegment,
  onAddAudioTrackAtTime,
  onToggleMuteOriginalAudio,
  muteOriginalAudio = false,
}: AIMenuProps) {
  const t = useTranslations("aiMenu");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"subtitles" | "voiceover">("subtitles");

  // Helper to handle and display error toasts, with a "Sign In" action for authentication issues
  const showErrorToast = (title: string, err: any) => {
    const errMsg = err.message || "An unexpected error occurred.";
    const isAuthError = 
      errMsg.includes("authentication session") || 
      errMsg.includes("sign in again") || 
      err.status === 401;

    if (isAuthError) {
      gooeyToast.error("Authentication Required", {
        description: "Your session has expired. Please sign in again to continue.",
        duration: 10000, // hold longer than 4s (10 seconds)
        showProgress: true,
        action: {
          label: "Sign In",
          onClick: () => {
            router.push("/login");
          }
        }
      });
    } else {
      gooeyToast.error(title, {
        description: errMsg,
        duration: 6000 // hold longer than 4s (6 seconds) for standard errors
      });
    }
  };

  const {
    isTranscribing,
    transcribeProgress,
    transcribeStatus,
    isTranslating,
    isGeneratingVoiceover,
    isGeneratingDubbing,
    transcribeVideo,
    translateSubtitles,
    generateVoiceover,
    generateDubbing
  } = useAI();

  // 1. Declare applySubtitlesToPlayer first using useCallback so it is available safely inside useEffects and event handlers
  const applySubtitlesToPlayer = useCallback((segs: SubtitleSegment[]) => {
    if (!onSubtitlesChange) return;
    const vtt = formatToVTT(segs);
    const blob = new Blob([vtt], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    onSubtitlesChange(url, segs);
  }, [onSubtitlesChange]);

  // Synchronize subtitle segments from parent (timeline dragging/deletion/updates support)
  useEffect(() => {
    if (subtitleSegments) {
      setTranslatedSegments(subtitleSegments);
      setSegments(subtitleSegments);
      if (subtitleSegments.length === 0 && translatedSegments.length > 0) {
        setFullTranscript("");
      }
    }
  }, [subtitleSegments]);

  const handleUpdateSegment = (idx: number, updates: Partial<SubtitleSegment>) => {
    const newSegments = translatedSegments.map((seg, i) => i === idx ? { ...seg, ...updates } : seg);
    setTranslatedSegments(newSegments);
    setSegments(newSegments);
    
    if (onUpdateSubtitleSegment) {
      onUpdateSubtitleSegment(idx, updates);
    } else {
      applySubtitlesToPlayer(newSegments);
      if (videoDuration > 0) {
        localStorage.setItem(`VidFlow-subtitles-trans-${videoDuration}`, JSON.stringify(newSegments));
        localStorage.setItem(`VidFlow-subtitles-segments-${videoDuration}`, JSON.stringify(newSegments));
      }
    }
  };

  // Subtitles State (Automatically hydrate from localStorage for persistence on refresh)
  const [segments, setSegments] = useState<SubtitleSegment[]>(() => {
    if (typeof window !== "undefined" && videoDuration > 0) {
      const saved = localStorage.getItem(`VidFlow-subtitles-segments-${videoDuration}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error restoring subtitles:", e);
        }
      }
    }
    return [];
  });

  const [translatedSegments, setTranslatedSegments] = useState<SubtitleSegment[]>(() => {
    if (typeof window !== "undefined" && videoDuration > 0) {
      const saved = localStorage.getItem(`VidFlow-subtitles-trans-${videoDuration}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error restoring translated subtitles:", e);
        }
      }
    }
    return [];
  });

  const [fullTranscript, setFullTranscript] = useState(() => {
    if (typeof window !== "undefined" && videoDuration > 0) {
      return localStorage.getItem(`VidFlow-subtitles-transcript-${videoDuration}`) || "";
    }
    return "";
  });

  const [targetLang, setTargetLang] = useState("original");

  // Auto-save subtitles to localStorage when changed
  useEffect(() => {
    if (videoDuration > 0 && segments.length > 0) {
      localStorage.setItem(`VidFlow-subtitles-segments-${videoDuration}`, JSON.stringify(segments));
    }
  }, [segments, videoDuration]);

  useEffect(() => {
    if (videoDuration > 0 && translatedSegments.length > 0) {
      localStorage.setItem(`VidFlow-subtitles-trans-${videoDuration}`, JSON.stringify(translatedSegments));
    }
  }, [translatedSegments, videoDuration]);

  useEffect(() => {
    if (videoDuration > 0 && fullTranscript) {
      localStorage.setItem(`VidFlow-subtitles-transcript-${videoDuration}`, fullTranscript);
    }
  }, [fullTranscript, videoDuration]);

  // Synchronize/Restore subtitle states when switching videos or on mounting
  useEffect(() => {
    if (videoDuration > 0) {
      const savedSegs = localStorage.getItem(`VidFlow-subtitles-segments-${videoDuration}`);
      const savedTrans = localStorage.getItem(`VidFlow-subtitles-trans-${videoDuration}`);
      const savedTranscript = localStorage.getItem(`VidFlow-subtitles-transcript-${videoDuration}`);
      
      if (savedSegs) {
        try { setSegments(JSON.parse(savedSegs)); } catch (e) {}
      } else {
        setSegments([]);
      }
      
      if (savedTrans) {
        try { 
          const parsedTrans = JSON.parse(savedTrans);
          setTranslatedSegments(parsedTrans);
          // Automatically apply the restored subtitles VTT onto the Video Player upon hydration!
          if (parsedTrans.length > 0) {
            applySubtitlesToPlayer(parsedTrans);
          }
        } catch (e) {}
      } else {
        setTranslatedSegments([]);
      }
      
      if (savedTranscript) {
        setFullTranscript(savedTranscript);
      } else {
        setFullTranscript("");
      }
    } else {
      setSegments([]);
      setTranslatedSegments([]);
      setFullTranscript("");
      if (onSubtitlesChange) {
        onSubtitlesChange("");
      }
    }
  }, [videoDuration, applySubtitlesToPlayer, onSubtitlesChange]);

  const [voiceoverText, setVoiceoverText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("austin");
  const [newlyUploadedAudioId, setNewlyUploadedAudioId] = useState<string | null>(null);

  // Dubbing State
  const [showDubModal, setShowDubModal] = useState(false);
  const [selectedDubVoice, setSelectedDubVoice] = useState("austin");

  const supportedLanguages = getSupportedLanguages();

  // AI Dubbing Handler (Bulk Dubbing with exact timeline alignment)
  const handleAIDubbing = async () => {
    if (translatedSegments.length === 0) {
      gooeyToast.warning("Subtitles Required", { description: "Please generate or translate subtitles first." });
      return;
    }
    if (!onAddAudioTrackAtTime) {
      gooeyToast.error("Integration Error", { description: "Audio track callback is not configured." });
      return;
    }
    setShowDubModal(false);

    const loadingToastId = gooeyToast("AI Dubbing", {
      description: "Generating high-quality AI Voice Dubbing...",
      duration: 30000,
    });

    try {
      const dubTracks = await generateDubbing(translatedSegments, selectedDubVoice);
      if (dubTracks.length === 0) throw new Error("No speech audio returned from Google TTS");

      // Loop and insert each track sequentially
      for (const track of dubTracks) {
        const byteCharacters = atob(track.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: track.mimeType || "audio/mpeg" });
        const audioFile = new File([audioBlob], `AI-Dub-${selectedDubVoice}-${track.start}.mp3`, { type: track.mimeType || "audio/mpeg" });

        await onAddAudioTrackAtTime(audioFile, track.start, track.end - track.start);
      }

      // Automatically mute original video audio for pristine voiceover quality
      if (onToggleMuteOriginalAudio) {
        onToggleMuteOriginalAudio(true);
      }

      gooeyToast.update(loadingToastId, {
        title: "Dubbing Completed",
        type: "success",
        description: "AI Voice Dubbing applied successfully to all segments!",
        duration: 6000
      });
    } catch (err: any) {
      gooeyToast.dismiss(loadingToastId);
      showErrorToast("Dubbing Failed", err);
    }
  };

  // 1. Transcribe Handler
  const handleTranscribe = async () => {
    if (!videoUrl) {
      gooeyToast.warning("Video Required", { description: "Please upload a video first." });
      return;
    }
    try {
      setTargetLang("original");
      const { segments: newSegments, transcript } = await transcribeVideo(videoUrl);
      setSegments(newSegments);
      setTranslatedSegments(newSegments);
      setFullTranscript(transcript);
      applySubtitlesToPlayer(newSegments);
      gooeyToast.success("Transcription Added", { 
        description: "Success! Subtitles have been transcribed and applied onto the Video Player.",
        duration: 6000
      });
    } catch (err: any) {
      showErrorToast("Transcription Failed", err);
    }
  };

  // 1.5 Translate Handler
  const handleTranslate = async () => {
    if (segments.length === 0) return;
    if (targetLang === "original") {
      setTranslatedSegments(segments);
      applySubtitlesToPlayer(segments);
      gooeyToast.success("Original Applied", { 
        description: "Success! Subtitles have been reset to original and applied.",
        duration: 6000
      });
      return;
    }
    try {
      const translated = await translateSubtitles(segments, targetLang);
      setTranslatedSegments(translated);
      applySubtitlesToPlayer(translated);
      gooeyToast.success("Translation Added", { 
        description: `Success! Subtitles have been translated into ${supportedLanguages[targetLang as keyof typeof supportedLanguages] || targetLang} and applied.`,
        duration: 6000
      });
    } catch (err: any) {
      showErrorToast("Translation Failed", err);
    }
  };

  const downloadSRT = () => {
    if (translatedSegments.length === 0) return;
    const srt = formatToSRT(translatedSegments);
    const blob = new Blob([srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subtitles-${targetLang}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Voiceover Generation Handler
  const handleGenerateVoiceover = async () => {
    if (!voiceoverText.trim()) {
      gooeyToast.warning("Text Required", { description: "Please enter a text script to generate voiceover." });
      return;
    }
    try {
      const { audioBase64, mimeType } = await generateVoiceover(voiceoverText, selectedVoice);
      
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: mimeType });
      const audioFile = new File([audioBlob], `AI-Voice-${selectedVoice}-${Date.now()}.mp3`, { type: mimeType });

      if (onAudioUpload) {
        onAudioUpload(audioFile);
        setNewlyUploadedAudioId(audioFile.name);
        setVoiceoverText("");
      }
    } catch (err: any) {
      showErrorToast("Voiceover Failed", err);
    }
  };

  useEffect(() => {
    if (newlyUploadedAudioId && onAddAudioTrack) {
      const matchingAudio = uploadedAudios.find(a => a.name.startsWith("AI-Voice-"));
      if (matchingAudio) {
        onAddAudioTrack(matchingAudio.id);
        setNewlyUploadedAudioId(null);
        gooeyToast.success("Voiceover Added", { 
          description: "Success! High-quality AI Voiceover has been generated and added directly as a new track on your Timeline.",
          duration: 6000
        });
      }
    }
  }, [uploadedAudios, newlyUploadedAudioId, onAddAudioTrack]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-full overflow-hidden relative">
      
      <div className="flex items-center gap-2 text-white font-medium">
        <Icon icon="hugeicons:ai-brain-03" width="20" className="text-purple-400" />
        <span>{t("title") || "Smart AI Assistant"}</span>
      </div>

      <div className="flex bg-[#09090B] rounded-lg p-1 text-[11px] font-medium shrink-0">
        {(["subtitles", "voiceover"] as const).map((tab) => {
          const transTab = t(`tabs.${tab}`);
          const label = transTab && transTab !== `tabs.${tab}` 
            ? transTab 
            : (tab === "subtitles" ? "Subtitles" : "Voiceover");
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-md text-center cursor-pointer transition-all ${
                activeTab === tab
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        
        {/* Tab 1: AI Subtitles (Transcribe & Translate) */}
        {activeTab === "subtitles" && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 gap-4">
            <div className="bg-[#09090B]/50 border border-white/5 squircle-element p-3.5 flex flex-col gap-2">
              <h3 className="text-xs text-white font-semibold flex items-center gap-1.5">
                <Icon icon="mdi:subtitles-outline" className="text-purple-400" width="14" />
                {t("transcribe.title") || "Smart Subtitles & Translation"}
              </h3>
              <p className="text-[10px] text-white/50 leading-relaxed">
                {t("transcribe.desc") || "Extract transcripts, translate accurately into multiple languages and attach them to your video."}
              </p>
            </div>

            {isTranscribing ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#09090B] border border-white/5 squircle-element gap-4">
                <Icon icon="svg-spinners:ring-resize" width="36" className="text-purple-400" />
                <div className="text-center">
                  <div className="text-xs text-white font-medium">{t("transcribe.generating") || "Processing AI Transcription..."}</div>
                  <div className="text-[10px] text-white/40 mt-1 max-w-[200px] truncate">{transcribeStatus}</div>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${transcribeProgress}%` }}
                  />
                </div>
              </div>
            ) : segments.length > 0 ? (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 gap-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                    Subtitles ({translatedSegments.length})
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadSRT}
                      className="text-[10px] text-green-400 hover:text-green-300 font-semibold flex items-center gap-1"
                    >
                      <Icon icon="mdi:download" width="12" /> .SRT
                    </button>
                    <button 
                      onClick={handleTranscribe}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                    >
                      <Icon icon="mdi:refresh" width="12" /> Re-scan
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="flex-1 bg-[#09090B] border border-white/10 rounded-lg p-2 text-[11px] text-white/80 outline-none focus:border-purple-500/50 transition-colors"
                  >
                    {LANGUAGE_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.languages.map((code) => (
                          <option key={code} value={code}>
                            {code === "original" ? "Original Language" : supportedLanguages[code as keyof typeof supportedLanguages] || code}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <Button 
                    onClick={handleTranslate} 
                    disabled={isTranslating || targetLang === "original"}
                    className="h-[34px] px-3 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold rounded-lg shrink-0"
                  >
                    {isTranslating ? <Icon icon="svg-spinners:ring-resize" width="14" /> : "Translate"}
                  </Button>
                </div>

                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={() => {
                      applySubtitlesToPlayer(translatedSegments);
                      gooeyToast.success("Subtitles Added", { 
                        description: "Success! Subtitles have been added and applied directly to the video player.",
                        duration: 6000
                      });
                    }}
                    className="flex-1 h-[36px] bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Icon icon="mdi:subtitles-outline" width="14" />
                    <span>Apply to Video</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      if (onSubtitlesChange) {
                        onSubtitlesChange(null, []);
                      }
                      gooeyToast.info("Subtitles Cleared", { 
                        description: "Subtitles have been removed from the video player.",
                        duration: 6000
                      });
                    }}
                    className="h-[36px] px-3 bg-red-600 hover:bg-red-500 border border-red-500/20 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    title="Remove Subtitles from Video"
                  >
                    <Icon icon="lucide:trash-2" width="14" />
                  </Button>
                </div>

                <Button 
                  onClick={() => setShowDubModal(true)}
                  disabled={isGeneratingDubbing}
                  className="w-full h-[36px] bg-purple-600 hover:bg-purple-500 border border-purple-500/20 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isGeneratingDubbing ? (
                    <Icon icon="svg-spinners:ring-resize" width="14" />
                  ) : (
                    <Icon icon="solar:soundwave-bold-duotone" width="14" />
                  )}
                  <span>AI Voice Dubbing</span>
                </Button>

                <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
                  {translatedSegments.map((seg, idx) => (
                    <div 
                      key={idx} 
                      className="bg-[#09090B] border border-white/5 hover:border-white/10 squircle-element p-2.5 flex flex-col gap-2 transition-colors"
                    >
                      <div className="flex justify-between items-center text-[10px] text-white/30 font-mono">
                        <span>Segment #{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={videoDuration}
                            value={Math.round(seg.start * 10) / 10}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                handleUpdateSegment(idx, { start: val });
                              }
                            }}
                            className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-center text-white text-[10px] focus:border-purple-500/50 outline-none font-mono"
                          />
                          <span className="text-white/30 text-[9px]">-</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={videoDuration}
                            value={Math.round(seg.end * 10) / 10}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                handleUpdateSegment(idx, { end: val });
                              }
                            }}
                            className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-center text-white text-[10px] focus:border-purple-500/50 outline-none font-mono"
                          />
                          <span className="text-white/30 text-[9px]">s</span>
                        </div>
                      </div>
                      <textarea
                        value={seg.text}
                        onChange={(e) => handleUpdateSegment(idx, { text: e.target.value })}
                        rows={1}
                        className="w-full bg-transparent border-0 hover:bg-white/[0.02] focus:bg-[#050507] focus:ring-1 focus:ring-purple-500/30 rounded px-1 py-0.5 text-xs text-white/95 leading-relaxed font-medium outline-none resize-none overflow-hidden transition-colors"
                        style={{ height: 'auto' }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = `${el.scrollHeight}px`;
                          }
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${target.scrollHeight}px`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-[#09090B] border border-white/5 squircle-element gap-4">
                <Icon icon="mdi:music-note-plus" width="36" className="text-white/20" />
                <div className="text-center">
                  <p className="text-xs text-white/80 font-medium">{t("transcribe.noSubtitles") || "No Transcript Yet"}</p>
                  <p className="text-[10px] text-white/40 mt-1 max-w-[220px]">
                    {t("transcribe.subtitleHint") || "Run Smart Analysis to extract text from audio."}
                  </p>
                </div>
                <Button 
                  onClick={handleTranscribe} 
                  disabled={!videoUrl}
                  className="w-full text-xs bg-purple-600 hover:bg-purple-500 border border-purple-500/20 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Icon icon="hugeicons:ai-brain-05" width="14" />
                  <span>{t("transcribe.button") || "Smart Video Analysis"}</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Voiceover */}
        {activeTab === "voiceover" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#09090B]/50 border border-white/5 squircle-element p-3.5 flex flex-col gap-2">
              <h3 className="text-xs text-white font-semibold flex items-center gap-1.5">
                <Icon icon="mdi:microphone" className="text-purple-400" width="14" />
                {t("voiceover.title") || "AI Narrator"}
              </h3>
              <p className="text-[10px] text-white/50 leading-relaxed">
                {t("voiceover.desc") || "Convert text to high-quality speech and add it to your timeline."}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                Script Text
              </label>
              <textarea
                value={voiceoverText}
                onChange={(e) => setVoiceoverText(e.target.value)}
                placeholder={t("voiceover.placeholder") || "Type or paste your script here..."}
                rows={4}
                className="w-full bg-[#09090B] border border-white/10 rounded-lg p-3 text-xs text-white/80 placeholder:text-white/30 outline-none focus:border-purple-500/50 transition-colors resize-none custom-scrollbar"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                {t("voiceover.voice") || "Select Voice"}
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-[#09090B] border border-white/10 rounded-lg p-2.5 text-xs text-white/80 outline-none focus:border-purple-500/50 transition-colors"
              >
                <option value="austin">Austin (Male - Deep)</option>
                <option value="daniel">Daniel (Male - Standard)</option>
                <option value="troy">Troy (Female - Expressive)</option>
              </select>
            </div>

            <Button
              onClick={handleGenerateVoiceover}
              disabled={isGeneratingVoiceover || !voiceoverText.trim()}
              className="w-full text-xs bg-purple-600 hover:bg-purple-500 border border-purple-500/20 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingVoiceover ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" width="14" />
                  <span>{t("voiceover.generating") || "Generating Audio..."}</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:voice" width="14" />
                  <span>{t("voiceover.button") || "Generate & Add to Timeline"}</span>
                </>
              )}
            </Button>
          </div>
        )}

        {showDubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#09090B] border border-white/10 squircle-element p-5 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-sm text-white font-bold flex items-center gap-1.5">
                  <Icon icon="solar:soundwave-bold-duotone" className="text-purple-400" width="16" />
                  <span>AI Dubbing Voice</span>
                </h3>
                <button 
                  onClick={() => setShowDubModal(false)}
                  className="text-white/40 hover:text-white/80 transition-colors p-1"
                >
                  <Icon icon="mdi:close" width="16" />
                </button>
              </div>

              <p className="text-[10px] text-white/50 leading-relaxed">
                Select your preferred AI voice profile to dub all current subtitle segments. Voiceover will be aligned exactly with each timeline segment.
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                  Select AI Voice
                </label>
                <select
                  value={selectedDubVoice}
                  onChange={(e) => setSelectedDubVoice(e.target.value)}
                  className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-xs text-white/85 outline-none focus:border-purple-500/50 transition-colors"
                >
                  <option value="austin">Austin (Male - Deep)</option>
                  <option value="daniel">Daniel (Male - Standard)</option>
                  <option value="troy">Troy (Female - Expressive)</option>
                </select>
              </div>

              <div className="flex gap-2.5 mt-2">
                <Button
                  onClick={() => setShowDubModal(false)}
                  className="flex-1 text-xs bg-white/5 hover:bg-white/10 text-white font-semibold py-2 px-4 rounded-lg border border-white/5 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAIDubbing}
                  className="flex-1 text-xs bg-purple-600 hover:bg-purple-500 border border-purple-500/20 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Icon icon="solar:soundwave-bold-duotone" width="14" />
                  <span>Start Dubbing</span>
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
