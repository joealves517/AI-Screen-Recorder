import React, { useContext, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { marked } from "marked";
import styles from "../../styles/player/_RightPanel.module.scss";
import { ContentStateContext } from "../../context/ContentState";
import { LANGUAGE_GROUPS, getSupportedLanguages } from "./aiUtils";
import { AnimatedIcon } from "../../../Content/components/AnimatedIcon";
import {
  SparklesIcon as Sparkles,
  AudioLinesIcon as AudioLines,
  LanguagesIcon as Languages,
  FileTextIcon as FileText,
  UnderlineIcon as TextSelect,
  LockIcon as Lock,
  DownloadIcon as Download,
  ChevronRightIcon as ChevronRight,
  ChevronDownIcon as ChevronDown,
  SearchIcon as Search,
  CircleHelpIcon as Info,
  UserRoundCheckIcon as LogIn,
  SettingsIcon as Settings,
  ZapIcon as Crown,
  BadgeAlertIcon as AlertTriangle,
  MessageCircleIcon as MessageCircle,
  BookmarkIcon as Bookmark,
  MessageSquareMoreIcon as Share2,
  CircleHelpIcon as FileQuestion,
  ActivityIcon as Activity,
  LoaderPinwheelIcon,
  GripIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  Volume2Icon,
  XIcon,
  UsersIcon as Users,
  ClipboardCheckIcon,
  LayersIcon
} from "lucide-animated";

import blackNoteIconUrl from "../../../../assets/blacknote-icon.png";
import sparkAiIconUrl from "../../../../assets/spark-ai-icon.svg";

const BlackNoteIcon = React.forwardRef(({ size = 20 }, ref) => <img ref={ref} src={blackNoteIconUrl} width={size} height={size} alt="BlackNote" style={{ objectFit: 'contain' }} />);
const SparkAIIcon = React.forwardRef(({ size = 20 }, ref) => <img ref={ref} src={sparkAiIconUrl} width={size} height={size} alt="Spark AI" style={{ objectFit: 'contain' }} />);



// ─── Cross-Extension Ecosystem ──────────────────────────────────────
const ECOSYSTEM = {
  BLACKNOTE: {
    ids: ["cgmimbllhpkfcegecbdhldfmlfbfdhfg", "kifnbpilpjgdkjbpcejligaglcjdkjjb"],
    name: "BlackNote",
    storeUrl: "https://chromewebstore.google.com/detail/blacknote/cgmimbllhpkfcegecbdhldfmlfbfdhfg",
  },
  SPARK_AI: {
    ids: ["jaddgjjhbekcjdpmoglkeakpihbmgiah", "cainihlnefiebaigcjiniandhodkajaj"],
    name: "Spark AI",
    storeUrl: "https://chromewebstore.google.com/detail/spark-ai/jaddgjjhbekcjdpmoglkeakpihbmgiah",
  },
};

/**
 * Relay a cross-extension message through the parent frame → background script.
 * The sandbox iframe has no chrome API access, so all ecosystem
 * communication must go through postMessage.
 */
const relayEcosystemMessage = (targetExtensionIds, message, fallbackUrl) => {
  window.parent.postMessage(
    { type: "ecosystem-relay", targetExtensionIds, payload: message, fallbackUrl },
    "*"
  );
};

const sendToBlackNote = (title, content) => {
  relayEcosystemMessage(
    ECOSYSTEM.BLACKNOTE.ids,
    { type: "INSERT_TO_BLACKNOTE", payload: { title, content } },
    ECOSYSTEM.BLACKNOTE.storeUrl
  );
};

const openSparkAI = (segments, title) => {
  const formatTime = (seconds) => {
    const pad = (num) => Math.floor(num).toString().padStart(2, "0");
    const m = seconds / 60;
    const s = seconds % 60;
    return `${pad(m)}:${pad(s)}`;
  };
  const content = segments.map(seg => `[${formatTime(seg.start)}] ${seg.text}`).join("\n");

  relayEcosystemMessage(
    ECOSYSTEM.SPARK_AI.ids,
    { 
      type: "SET_EXTERNAL_CONTEXT", 
      payload: { 
        appName: "AI Screen Recorder",
        appIcon: "video",
        title: title || "Screen Recording",
        description: "Video Transcript",
        content: content
      } 
    },
    ECOSYSTEM.SPARK_AI.storeUrl
  );
};

/** Branded chip showing extension name */
const ExtensionChip = ({ name, color = "#6366f1" }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "2px 8px 2px 6px",
      borderRadius: "20px",
      fontSize: "10px",
      fontWeight: "600",
      color: color,
      background: `${color}14`,
      border: `1px solid ${color}30`,
      whiteSpace: "nowrap",
    }}
  >
    {name}
  </span>
);

// --- Inline style constants ---
const statusStyle = {
  fontSize: "13px",
  color: "#059669",
  marginTop: "10px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const selectStyle = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.9)",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02), inset 0 1px 1px rgba(255,255,255,0.8)",
  fontSize: "14px",
  color: "#334155",
  outline: "none",
  cursor: "pointer",
  transition: "all 0.2s"
};

const applyButtonStyle = (disabled) => ({
  padding: "10px 18px",
  background: disabled ? "rgba(241, 245, 249, 0.6)" : "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 1) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: disabled ? "#94a3b8" : "white",
  borderRadius: "12px",
  border: disabled ? "1px solid rgba(255, 255, 255, 0.8)" : "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: disabled ? "none" : "0 4px 12px rgba(37, 99, 235, 0.2), inset 0 1px 1px rgba(255,255,255,0.3)",
  fontSize: "14px",
  fontWeight: "600",
  cursor: disabled ? "not-allowed" : "pointer",
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  transition: "all 0.2s",
});

const downloadButtonStyle = {
  padding: "10px",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.9)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02), inset 0 1px 1px rgba(255,255,255,0.8)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  transition: "all 0.2s",
};


const ctaButtonStyle = (bgColor) => ({
  padding: "6px 12px",
  background: bgColor,
  color: "white",
  borderRadius: "6px",
  border: "none",
  fontSize: "11px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  whiteSpace: "nowrap",
});

const LanguageSelect = ({ value, onChange, disabled, options, groups }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearch("");
  };

  const filteredGroups = groups.map(group => ({
    label: group.label,
    languages: group.languages.filter(code =>
      (options[code] || code).toLowerCase().includes(search.toLowerCase())
    )
  })).filter(group => group.languages.length > 0);

  const displayValue = value === "original" ? "Original Language" : (options[value] || value);

  return (
    <div ref={dropdownRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...selectStyle,
          width: "100%",
          boxSizing: "border-box",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
          {displayValue}
        </span>
        <AnimatedIcon animation="none">
          <ChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} />
        </AnimatedIcon>
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          maxHeight: "300px"
        }}>
          <div style={{ padding: "8px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
            <AnimatedIcon animation="none">
              <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
            </AnimatedIcon>
            <input
              type="text"
              autoFocus
              placeholder="Search language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                border: "none",
                fontSize: "13px",
                outline: "none",
                background: "transparent",
                color: "#334155"
              }}
            />
          </div>
          <div style={{ overflowY: "auto", padding: "4px" }}>
            {filteredGroups.map(group => (
              <div key={group.label}>
                <div style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  marginTop: "4px"
                }}>
                  {group.label}
                </div>
                {group.languages.map(code => (
                  <div
                    key={code}
                    onClick={() => handleSelect(code)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "13px",
                      cursor: "pointer",
                      borderRadius: "4px",
                      background: value === code ? "#f1f5f9" : "transparent",
                      fontWeight: value === code ? "600" : "400",
                      paddingLeft: "16px",
                      color: "#334155"
                    }}
                    onMouseOver={(e) => { if (value !== code) e.currentTarget.style.background = "#f8fafc" }}
                    onMouseOut={(e) => { if (value !== code) e.currentTarget.style.background = "transparent" }}
                  >
                    {options[code] || code}
                  </div>
                ))}
              </div>
            ))}
            {filteredGroups.length === 0 && search !== "" && (
              <div style={{ padding: "12px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AIPanel = () => {
  const [contentState, setContentState] = useContext(ContentStateContext);

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTask, setActiveTask] = useState("");
  const [progress, setProgress] = useState(0);
  const [panelOpenState, setPanelOpenState] = useState({});
  const isPanelOpen = (key) => panelOpenState[key] !== false;
  const togglePanel = (key) => setPanelOpenState(prev => ({ ...prev, [key]: !prev[key] }));

  // Core data — segments carry timestamps for accurate subtitles
  const [segments, setSegments] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [actionItems, setActionItems] = useState(null);
  const [titleData, setTitleData] = useState(null);
  const [chapters, setChapters] = useState(null);
  const [social, setSocial] = useState(null);
  const [meetingMinutes, setMeetingMinutes] = useState(null);
  const [error, setError] = useState(null);

  // Auto-transcribe state
  const [autoTranscribeStatus, setAutoTranscribeStatus] = useState("idle");
  // "idle" | "processing" | "done" | "limit_exceeded" | "error"
  const [transcribeFinishing, setTranscribeFinishing] = useState(false);
  const [fakeProgressWidth, setFakeProgressWidth] = useState("0%");


  useEffect(() => {
    if (isProcessing && activeTask === "transcribe" && !transcribeFinishing) {
      setTimeout(() => setFakeProgressWidth("95%"), 100);
    } else if (transcribeFinishing) {
      setFakeProgressWidth("100%");
    } else {
      setFakeProgressWidth("0%");
    }
  }, [isProcessing, activeTask, transcribeFinishing]);

  /*
  // Voice Narrator state
  const [selectedVoice, setSelectedVoice] = useState("autumn");
  const [selectedTone, setSelectedTone] = useState("none");
  const [voiceoverProcessing, setVoiceoverProcessing] = useState(false);
  const [voiceoverAudioBase64, setVoiceoverAudioBase64] = useState(null);
  const [voiceoverMimeType, setVoiceoverMimeType] = useState(null);
  const [voiceoverApplied, setVoiceoverApplied] = useState(false);
  const [voiceoverPreviewing, setVoiceoverPreviewing] = useState(false);
  const voiceoverAudioRef = React.useRef(null);
  */

  // Translation state
  const [targetLang, setTargetLang] = useState("original");
  const [subtitlesApplied, setSubtitlesApplied] = useState(false);
  const [translatedSegments, setTranslatedSegments] = useState(null);

  // Subtitle styling
  const [subSettingsOpen, setSubSettingsOpen] = useState(false);
  const [subFontColor, setSubFontColor] = useState("#FFFFFF");
  const [subBgColor, setSubBgColor] = useState("#000000");
  const [subBgOpacity, setSubBgOpacity] = useState(70);
  const [subFontSize, setSubFontSize] = useState(24);
  const [subMarginBottom, setSubMarginBottom] = useState(20);

  // Live preview for subtitles
  useEffect(() => {
    let styleEl = document.getElementById("dynamic-subtitle-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-subtitle-styles";
      document.head.appendChild(styleEl);
    }
    const hex = subBgColor.replace('#', '');
    const r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);
    const bgRgba = `rgba(${r}, ${g}, ${b}, ${subBgOpacity / 100})`;

    styleEl.innerHTML = `
      ::cue {
        color: ${subFontColor} !important;
        background-color: ${bgRgba} !important;
        font-size: ${subFontSize}px !important;
      }
      .plyr__caption {
        color: ${subFontColor} !important;
        background-color: ${bgRgba} !important;
        font-size: ${subFontSize}px !important;
      }
      .plyr__captions {
        transform: translateY(-${subMarginBottom}px) !important;
      }
      video::-webkit-media-text-track-display {
        transform: translateY(-${subMarginBottom}px) !important;
      }
    `;
  }, [subFontColor, subBgColor, subBgOpacity, subFontSize, subMarginBottom]);

  // User tier for smart error messages
  const [userTier, setUserTier] = useState("guest"); // "guest" | "free" | "pro"

  const [isWebCodecs, setIsWebCodecs] = useState(false);

  const locked = !segments;
  const allLanguages = getSupportedLanguages();

  useEffect(() => {
    try {
      if (window.parent !== window && window.parent.location.pathname.includes("editorwebcodecs")) {
        setIsWebCodecs(true);
      }
    } catch (e) {
      // Cross-origin access blocked implies it might be sandboxed (Editor mode)
      setIsWebCodecs(false);
    }
  }, []);

  // Detect user tier on mount and listen for changes
  useEffect(() => {
    const updateTier = (result) => {
      if (!result.isLoggedIn) setUserTier("guest");
      else if (result.isSubscribed && !result.quotaExhausted) setUserTier("pro");
      else setUserTier("free");
    };

    chrome.storage.local.get(
      ["isLoggedIn", "isSubscribed", "quotaExhausted"],
      updateTier
    );

    const handleStorageChange = (changes, areaName) => {
      if (areaName === "local" && (changes.isLoggedIn || changes.isSubscribed || changes.quotaExhausted)) {
        chrome.storage.local.get(["isLoggedIn", "isSubscribed", "quotaExhausted"], (result) => {
          updateTier(result);
          if (result.isLoggedIn) {
            setError(null); // Clear login required error
          }
        });
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);



  // Restore AI data from cache on mount
  useEffect(() => {
    chrome.storage.local.get(["aiCache"], (result) => {
      if (!result.aiCache) return;
      const cache = result.aiCache;

      if (cache.segments) setSegments(cache.segments);
      if (cache.transcript) setTranscript(cache.transcript);
      if (cache.summary) setSummary(cache.summary);
      if (cache.actionItems) setActionItems(cache.actionItems);
      if (cache.titleData) setTitleData(cache.titleData);
      if (cache.chapters) setChapters(cache.chapters);
      if (cache.social) setSocial(cache.social);
      if (cache.meetingMinutes) setMeetingMinutes(cache.meetingMinutes);
      if (cache.targetLang) setTargetLang(cache.targetLang);
      if (cache.segments) setAutoTranscribeStatus("done");

      // Restore subtitles to video player
      if (cache.translatedSegments && cache.subtitlesApplied) {
        setTranslatedSegments(cache.translatedSegments);
        if (cache.segments) applySegmentsToPlayer(cache.segments, true, "en");
        applySegmentsToPlayer(cache.translatedSegments, false, cache.targetLang);
      } else if (cache.segments && cache.subtitlesApplied) {
        applySegmentsToPlayer(cache.segments, true, "en");
      }
    });
  }, [setContentState]);

  // Save AI data to cache on change
  useEffect(() => {
    if (!segments) return;
    chrome.storage.local.set({
      aiCache: {
        segments,
        transcript,
        summary,
        actionItems,
        titleData,
        chapters,
        social,
        meetingMinutes,
        targetLang,
        translatedSegments,
        subtitlesApplied,
      },
    });
  }, [segments, transcript, summary, actionItems, titleData, chapters, social, meetingMinutes, targetLang, translatedSegments, subtitlesApplied]);

  /**
   * Apply segments to the video player as VTT subtitles.
   */
  const applySegmentsToPlayer = async (segs, isOriginal = true, langCode = "en") => {
    const { formatToVTT } = await import("./aiUtils");
    const vttContent = formatToVTT(segs);
    const blob = new Blob([vttContent], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);

    setContentState((prev) => {
      const existingTracks = prev.subtitleTracks || [];
      const filtered = existingTracks.filter(t => t.srclang !== langCode);

      const langLabel = allLanguages[langCode] || langCode;
      const newTrack = {
        kind: "captions",
        label: isOriginal ? "AI Subtitles (EN)" : `AI Subtitles (${langLabel})`,
        srclang: langCode,
        src: url,
        default: true, // Auto-switch to newly applied track
      };

      const updatedTracks = filtered.map(t => ({ ...t, default: false }));
      updatedTracks.push(newTrack);

      return {
        ...prev,
        subtitleTracks: updatedTracks,
        subtitleVtt: url // keep for fallback if needed
      };
    });
    setSubtitlesApplied(true);
  };

  // Listen for AI results from parent page (EditorWebCodecs)
  const handleMessage = useCallback(
    async (event) => {
      const { type } = event.data || {};

      switch (type) {
        case "ai-transcribe-progress":
          setProgress(event.data.progress || 0);
          break;

        case "ai-transcribe-result": {
          const newSegments = event.data.segments || [];
          const newTranscript = event.data.transcript || "";
          
          setTranscribeFinishing(true);
          setFakeProgressWidth("100%");
          
          setTimeout(() => {
            setTranscribeFinishing(false);
            setSegments(newSegments);
            setTranscript(newTranscript);
            setIsProcessing(false);
            setActiveTask("");
            setError(null);
            setAutoTranscribeStatus("done");

            // Auto-apply original subtitles to video
            if (newSegments.length > 0) {
              applySegmentsToPlayer(newSegments, true, "en");
            }
          }, 800);
          break;
        }

        case "ai-summarize-result":
          setSummary(event.data.summary);
          setIsProcessing(false);
          setActiveTask("");
          break;

        case "ai-action-items-result":
          setActionItems(event.data.summary);
          setIsProcessing(false);
          setActiveTask("");
          break;

        case "ai-title-result":
          setTitleData(event.data.result);
          setIsProcessing(false);
          setActiveTask("");
          break;

        case "ai-chapters-result":
          setChapters(event.data.summary);
          setIsProcessing(false);
          setActiveTask("");
          break;

        case "ai-social-result":
          setSocial(event.data.summary);
          setIsProcessing(false);
          setActiveTask("");
          break;

        case "ai-quiz-result":
          setMeetingMinutes(event.data.summary);
          setIsProcessing(false);
          setActiveTask("");
          break;

        case "ai-meeting-minutes-result":
          setMeetingMinutes(event.data.summary);
          setIsProcessing(false);
          setActiveTask("");
          break;

        // For UI Testing via Console
        case "ai-test-processing":
          setSegments(null);
          setTranscript("");
          setAutoTranscribeStatus("processing");
          setIsProcessing(true);
          setActiveTask("transcribe");
          break;
          
        case "ai-test-reset":
          setSegments(null);
          setTranscript("");
          setAutoTranscribeStatus("idle");
          setSummary(null);
          setActionItems(null);
          setTitleData(null);
          setChapters(null);
          setSocial(null);
          setMeetingMinutes(null);
          break;


        case "ai-translate-result": {
          const translatedRaw = event.data.translatedSegments || [];
          const translated = translatedRaw.map((seg, i) => ({
            ...seg,
            start: seg.start !== undefined ? seg.start : segments[i]?.start,
            end: seg.end !== undefined ? seg.end : segments[i]?.end,
            duration: seg.duration !== undefined ? seg.duration : segments[i]?.duration,
          }));
          setTranslatedSegments(translated);
          setIsProcessing(false);
          setActiveTask("");

          // Auto-apply translated subtitles
          if (translated.length > 0) {
            if (segments) applySegmentsToPlayer(segments, true, "en");
            applySegmentsToPlayer(translated, false, event.data.targetLang || targetLang);
          }
          break;
        }

        case "ai-chat-result": {
          const { reply, thoughts, tool_calls } = event.data;
          
          if (thoughts) {
            dispatch({ type: "AGENT_THOUGHT", payload: { text: thoughts } });
          }
          
          dispatch({ type: "AGENT_MESSAGE", payload: { text: reply } });
          
          if (tool_calls && tool_calls.length > 0) {
            tool_calls.forEach(tool => {
              dispatch({ type: "TOOL_CALL", payload: { name: tool.name, args: tool.args } });
              
              window.parent.postMessage({
                type: "ai-execute-tool",
                name: tool.name,
                args: tool.args,
                segments,
                transcript,
                videoBlob: contentState.videoBlob,
                duration: contentState.duration
              }, "*");
            });
          }
          break;
        }

        case "ai-chat-approval-required": {
          const { toolName, args, reason } = event.data;
          dispatch({ type: "ASK_APPROVAL", payload: { toolName, args, reason } });
          break;
        }

        case "ai-execute-tool-success": {
          const { name, result } = event.data;
          dispatch({ type: "TOOL_SUCCESS", payload: { name, result } });
          
          if (name === "translate_subtitles") {
            const translatedRaw = result.translatedSegments || [];
            const translated = translatedRaw.map((seg, i) => ({
              ...seg,
              start: seg.start !== undefined ? seg.start : segments[i]?.start,
              end: seg.end !== undefined ? seg.end : segments[i]?.end,
              duration: seg.duration !== undefined ? seg.duration : segments[i]?.duration,
            }));
            setTranslatedSegments(translated);
            setTargetLang(result.targetLang);
            if (translated.length > 0) {
              if (segments) applySegmentsToPlayer(segments, true, "en");
              applySegmentsToPlayer(translated, false, result.targetLang);
            }
          } else if (name === "generate_summary") {
            const style = result.style || "summary";
            if (style === "summary") setSummary(result.summary);
            else if (style === "keypoints") setActionItems(result.summary);
            else if (style === "chapters") setChapters(result.summary);
            else if (style === "social") setSocial(result.summary);
            else if (style === "meeting_minutes") setMeetingMinutes(result.summary);
          }
          break;
        }

        case "ai-execute-tool-error": {
          const { name, error: errVal } = event.data;
          dispatch({ type: "TOOL_ERROR", payload: { name, error: errVal } });
          handleAIError(errVal);
          break;
        }

        case "ai-chat-error": {
          dispatch({ type: "SET_ERROR", payload: event.data.error });
          handleAIError(event.data.error);
          break;
        }

        default:
          if (type && type.endsWith("-error")) {
            // Handle FREE_LIMIT_EXCEEDED and recording_too_long specially
            if (event.data.error === "FREE_LIMIT_EXCEEDED" || event.data.error === "recording_too_long") {
              setAutoTranscribeStatus("limit_exceeded");
              setIsProcessing(false);
              setActiveTask("");
              return;
            }
            handleAIError(event.data.error);
            setIsProcessing(false);
            setActiveTask("");
            // setVoiceoverProcessing(false);
          }
          break;
      }
    },
    [setContentState, segments, targetLang, transcript, contentState]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // --- Error handling — always show user-friendly messages, never raw errors ---

  const handleAIError = (errorMsg) => {
    // If the error indicates an authentication failure (e.g. 401), try to auto-refresh first
    if (errorMsg && (errorMsg.includes("401") || errorMsg.includes("Auth") || errorMsg.includes("unauthorized") || errorMsg.includes("Authentication") || errorMsg.includes("invalid_token") || errorMsg.includes("token"))) {
      chrome.runtime.sendMessage({ type: "refresh-auth" }, (response) => {
        if (response && response.authenticated) {
          // Auto-refresh succeeded! Dismiss the error and notify user to retry.
          setError(null);
          chrome.runtime.sendMessage({ type: "show-toast", message: "Session auto-refreshed. Please try again." }).catch(() => {});
        } else {
          // Auto-refresh failed, force sign-in
          setUserTier("guest");
          chrome.storage.local.remove(["aisrToken", "isLoggedIn", "isSubscribed"]).catch(() => {});
          setError("SERVER_ERROR");
          setTimeout(() => {
            const alertContainer = document.getElementById("right-panel-alert-container");
            if (alertContainer) alertContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 50);
        }
      });
      return; // Skip the generic error display below while we check auth
    }

    // Normalize all errors
    if (errorMsg === "quota_exhausted" || errorMsg === "FREE_LIMIT_EXCEEDED" || (errorMsg && errorMsg.includes("limit"))) {
      setError("QUOTA_EXHAUSTED");
    } else {
      setError("SERVER_ERROR");
    }
    
    // Auto-scroll to the top to show the error banner
    setTimeout(() => {
      const alertContainer = document.getElementById("right-panel-alert-container");
      if (alertContainer) {
        alertContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 50);
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = () => {
    setIsLoggingIn(true);
    chrome.runtime.sendMessage({ type: "handle-login" }).catch(() => {});
    setTimeout(() => setIsLoggingIn(false), 10000); // Reset after 10s if no response
  };

  const renderSmartError = () => {
    if (!error) return null;
    const portalTarget = document.getElementById('right-panel-alert-container');
    if (!portalTarget) return null;

    let content = null;
    if (userTier === "guest") {
      content = (
        <div className={styles.alert}>
          <div className={styles.buttonLeft}>
            <AnimatedIcon animation="none">
              <Lock size={24} color="currentColor" />
            </AnimatedIcon>
          </div>
          <div className={styles.buttonMiddle}>
            <div className={styles.buttonTitle}>
              Sign In Required
            </div>
            <div className={styles.buttonDescription}>
              Please sign in to unlock Smart AI features.
              <div
                onClick={isLoggingIn ? undefined : handleLogin}
                style={{ cursor: isLoggingIn ? "default" : "pointer", display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", color: "#387ef7", fontWeight: 600 }}
              >
                {isLoggingIn && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, transformOrigin: "center" }}
                  >
                    <LoaderPinwheelIcon size={14} color="currentColor" />
                  </motion.div>
                )}
                {isLoggingIn ? "Signing in..." : "Sign in with Google"}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (userTier === "free") {
      if (error === "QUOTA_EXHAUSTED") {
        content = (
          <div className={styles.alert}>
            <div className={styles.buttonLeft}>
              <AnimatedIcon animation="none">
                <Crown size={24} color="currentColor" />
              </AnimatedIcon>
            </div>
            <div className={styles.buttonMiddle}>
              <div className={styles.buttonTitle}>
                Limit Reached
              </div>
              <div className={styles.buttonDescription}>
                You have reached your daily limit for free AI services. Consider upgrading to Pro for unlimited access.
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "10px" }}>
                  <div
                    onClick={() => chrome.runtime.sendMessage({ type: "handle-upgrade" }).catch(() => {})}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#387ef7", fontWeight: 600 }}
                  >
                    {chrome.i18n.getMessage("learnMoreLabel")}
                  </div>
                  <div
                    onClick={() => {
                      setError(null);
                      if (autoTranscribeStatus === "error" && (contentState.blob || contentState.rawBlob)) {
                        setAutoTranscribeStatus("processing");
                        setIsProcessing(true);
                        setActiveTask("transcribe");
                        window.parent.postMessage(
                          { type: "ai-transcribe", blob: contentState.blob || contentState.rawBlob },
                          "*"
                        );
                      }
                    }}
                    style={{ cursor: "pointer", color: "#64748b", fontWeight: 600 }}
                  >
                    Try Again
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        content = (
          <div className={styles.alert}>
            <div className={styles.buttonLeft}>
              <AnimatedIcon animation="none">
                <Info size={24} color="currentColor" />
              </AnimatedIcon>
            </div>
            <div className={styles.buttonMiddle}>
              <div className={styles.buttonTitle}>
                We are facing high traffic
              </div>
              <div className={styles.buttonDescription}>
                We are facing high traffic. Please try again later.
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "10px" }}>
                  <div
                    onClick={() => {
                      setError(null);
                      if (autoTranscribeStatus === "error" && (contentState.blob || contentState.rawBlob)) {
                        setAutoTranscribeStatus("processing");
                        setIsProcessing(true);
                        setActiveTask("transcribe");
                        window.parent.postMessage(
                          { type: "ai-transcribe", blob: contentState.blob || contentState.rawBlob },
                          "*"
                        );
                      }
                    }}
                    style={{ cursor: "pointer", color: "#387ef7", fontWeight: 600 }}
                  >
                    Try Again
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    } else {
      // PRO user: friendly error with retry
      content = (
        <div className={styles.alert}>
          <div className={styles.buttonLeft}>
            <AnimatedIcon animation="none">
              <Info size={24} color="currentColor" />
            </AnimatedIcon>
          </div>
          <div className={styles.buttonMiddle}>
            <div className={styles.buttonTitle}>
              Something went wrong
            </div>
            <div className={styles.buttonDescription}>
              We encountered a temporary issue. Your credits were not charged.
              <div
                onClick={() => {
                  setError(null);
                  // Retry last transcription if it was auto-transcribe
                  if (autoTranscribeStatus === "error" && (contentState.blob || contentState.rawBlob)) {
                    setAutoTranscribeStatus("processing");
                    setIsProcessing(true);
                    setActiveTask("transcribe");
                    window.parent.postMessage(
                      { type: "ai-transcribe", blob: contentState.blob || contentState.rawBlob },
                      "*"
                    );
                  }
                }}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", color: "#387ef7", fontWeight: 600 }}
              >
                Try Again
              </div>
            </div>
          </div>
        </div>
      );
    }

    return ReactDOM.createPortal(content, portalTarget);
  };



  // --- Handlers ---

  const handleTranscribe = () => {
    if (!contentState.blob && !contentState.rawBlob) return;
    if (isProcessing) return;

    setIsProcessing(true);
    setActiveTask("transcribe");
    setProgress(0);
    setError(null);

    window.parent.postMessage(
      { type: "ai-transcribe", blob: contentState.blob || contentState.rawBlob },
      "*"
    );
  };

  const handleApplySubtitles = async () => {
    if (locked || isProcessing) return;
    setError(null);

    if (targetLang === "original") {
      // Apply original subtitles directly
      applySegmentsToPlayer(segments, true, "en");
      setTranslatedSegments(segments);
    } else {
      setIsProcessing(true);
      setActiveTask("translate");
      window.parent.postMessage(
        { type: "ai-translate", segments, targetLang },
        "*"
      );
    }
  };

  const handleDownloadSubtitles = async (segs) => {
    if (!segs || segs.length === 0) return;
    const { formatToSRT } = await import("./aiUtils");
    const srt = formatToSRT(segs);
    const blob = new Blob([srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subtitles-${targetLang}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const segs = translatedSegments || segments;
    if (!segs || segs.length === 0) {
      setContentState(prev => prev.subtitleAssData !== null ? { ...prev, subtitleAssData: null } : prev);
      return;
    }

    const formatAssTime = (timeValue) => {
      const val = parseFloat(timeValue) || 0;
      const ms = Math.floor(val * 1000);
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, "0");
      const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
      const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
      return `${h}:${m}:${s}.${cs}`;
    };

    const hexToAssColor = (hex, opacity = 100) => {
      const cleanHex = hex.replace('#', '');
      let r, g, b;
      if (cleanHex.length === 3) {
        r = cleanHex.slice(0, 1).repeat(2);
        g = cleanHex.slice(1, 2).repeat(2);
        b = cleanHex.slice(2, 3).repeat(2);
      } else {
        r = cleanHex.slice(0, 2);
        g = cleanHex.slice(2, 4);
        b = cleanHex.slice(4, 6);
      }
      const alphaVal = Math.round(255 * (1 - (opacity / 100)));
      const a = alphaVal.toString(16).padStart(2, '0').toUpperCase();
      r = r.toUpperCase();
      g = g.toUpperCase();
      b = b.toUpperCase();
      return `&H${a}${b}${g}${r}`;
    };

    const primaryAss = hexToAssColor(subFontColor, 100);
    const backAss = hexToAssColor(subBgColor, subBgOpacity);

    let assData = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Satoshi,${subFontSize * 2},${primaryAss},&H000000FF,&H00000000,${backAss},-1,0,0,0,100,100,0,0,3,1,0,2,10,10,${subMarginBottom * 2},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

    segs.forEach((seg) => {
      const startVal = parseFloat(seg.start) || 0;
      let endVal = seg.end !== undefined ? parseFloat(seg.end) : startVal + (parseFloat(seg.duration) || 2);
      if (endVal <= startVal) endVal = startVal + 1.0;
      
      const start = formatAssTime(startVal);
      const end = formatAssTime(endVal);
      const text = (seg.text || "").replace(/\n/g, "\\N");
      assData += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
    });

    setContentState(prev => prev.subtitleAssData === assData ? prev : { ...prev, subtitleAssData: assData });
  }, [translatedSegments, segments, subFontColor, subBgColor, subBgOpacity, subFontSize, subMarginBottom, setContentState]);

  const handleSummarize = () => {
    if (locked || isProcessing || summary) return;
    setError(null);
    setIsProcessing(true);
    setActiveTask("summarize");
    window.parent.postMessage({ type: "ai-summarize", transcript }, "*");
  };

  const handleActionItems = () => {
    if (locked || isProcessing || actionItems) return;
    setError(null);
    setIsProcessing(true);
    setActiveTask("action-items");
    window.parent.postMessage({ type: "ai-action-items", transcript }, "*");
  };

  const handleGenerateTitle = () => {
    if (locked || isProcessing || titleData) return;
    setError(null);
    setIsProcessing(true);
    setActiveTask("title");
    window.parent.postMessage({ type: "ai-title", transcript }, "*");
  };

  const handleChapters = () => {
    if (locked || isProcessing || chapters) return;
    setError(null);
    setIsProcessing(true);
    setActiveTask("chapters");
    window.parent.postMessage({ type: "ai-chapters", transcript }, "*");
  };

  const handleSocial = () => {
    if (locked || isProcessing || social) return;
    setError(null);
    setIsProcessing(true);
    setActiveTask("social");
    window.parent.postMessage({ type: "ai-social", transcript }, "*");
  };

  const handleQuiz = () => {
    if (locked || isProcessing || meetingMinutes) return;
    setError(null);
    setIsProcessing(true);
    setActiveTask("meeting-minutes");
    window.parent.postMessage({ type: "ai-meeting-minutes", transcript }, "*");
  };

  const handleMeetingMinutes = () => {
    if (locked || isProcessing || meetingMinutes) return;
    setError(null);
    setIsProcessing(true);
    setActiveTask("meeting-minutes");
    window.parent.postMessage({ type: "ai-meeting-minutes", transcript }, "*");
  };

  /*
  const handleVoiceover = () => {
    if (locked || isProcessing || voiceoverProcessing) return;
    setError(null);
    setVoiceoverProcessing(true);
    setIsProcessing(true);
    setActiveTask("voiceover");
    setVoiceoverAudioBase64(null);
    setVoiceoverApplied(false);
    setVoiceoverPreviewing(false);
    const toneMap = { professional: "[professionally] ", cheerful: "[cheerful] ", dramatic: "[dramatic] ", none: "" };
    const prefix = toneMap[selectedTone] || "";
    window.parent.postMessage({
      type: "ai-voiceover",
      transcript: prefix + transcript,
      voice: selectedVoice,
    }, "*");
  };

  const handlePreviewVoiceover = () => {
    if (!voiceoverAudioBase64) return;
    if (voiceoverPreviewing) {
      if (voiceoverAudioRef.current) {
        voiceoverAudioRef.current.pause();
        voiceoverAudioRef.current.currentTime = 0;
      }
      setVoiceoverPreviewing(false);
    } else {
      const dataUrl = `data:${voiceoverMimeType || "audio/wav"};base64,${voiceoverAudioBase64}`;
      if (!voiceoverAudioRef.current) {
        voiceoverAudioRef.current = new Audio();
      }
      voiceoverAudioRef.current.src = dataUrl;
      voiceoverAudioRef.current.onended = () => setVoiceoverPreviewing(false);
      voiceoverAudioRef.current.play().catch(() => {});
      setVoiceoverPreviewing(true);
    }
  };

  const handleApplyVoiceover = () => {
    if (!voiceoverAudioBase64 || voiceoverApplied || isProcessing) return;
    setIsProcessing(true);
    setActiveTask("apply-voiceover");
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
      voiceoverAudioRef.current.currentTime = 0;
    }
    setVoiceoverPreviewing(false);
    window.parent.postMessage({
      type: "ai-apply-voiceover",
      videoBlob: contentState.blob || contentState.rawBlob,
      duration: contentState.duration,
    }, "*");
    setVoiceoverApplied(true);
    setIsProcessing(false);
    setActiveTask("");
  };

  const handleRemoveVoiceover = () => {
    setVoiceoverAudioBase64(null);
    setVoiceoverApplied(false);
    setVoiceoverPreviewing(false);
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
      voiceoverAudioRef.current = null;
    }
  };
  */

  // --- Render helpers ---

  const hexToRgba = (hex, alpha) => {
    if (!hex || !hex.startsWith("#")) return `rgba(99, 102, 241, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderButton = ({ Icon, title, description, onClick, taskKey, disabled, showLockText, rightAction, iconColor, textGradient, iconClass, isActive, isLooping, bgGradient }) => (
    <div
      role="button"
      className={styles.button}
      onClick={disabled || (isProcessing && activeTask === taskKey) ? undefined : onClick}
      style={{
        "--button-bg": disabled ? "rgba(241, 245, 249, 0.6)" : `linear-gradient(135deg, ${hexToRgba(iconColor, 0.08)} 0%, rgba(255,255,255, 0.8) 100%)`,
        "--button-hover-bg": disabled ? "rgba(241, 245, 249, 0.6)" : `linear-gradient(135deg, ${hexToRgba(iconColor, 0.15)} 0%, rgba(255,255,255, 0.9) 100%)`,
        "--button-border": disabled ? "1px solid rgba(255, 255, 255, 0.8)" : "1px solid rgba(255,255,255, 0.9)",
        "--button-shadow": disabled ? "none" : `0 8px 32px -8px ${hexToRgba(iconColor, 0.2)}, inset 0 1px 1px rgba(255,255,255, 1)`,
        opacity: disabled ? 0.7 : 1,
        cursor: disabled || (isProcessing && activeTask === taskKey) ? "default" : "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "20px",
        overflow: "visible",
        ...(isActive ? { transform: "scale(0.98)" } : {}),
      }}
    >
      <div className={styles.buttonLeft} style={{ width: "70px" }}>
        <div 
          className={`icon-color-override-${taskKey} ${iconClass || ""}`}
          style={{
            width: "42px", height: "42px",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: disabled ? "rgba(241, 245, 249, 0.8)" : `linear-gradient(135deg, ${hexToRgba(iconColor, 0.15)} 0%, rgba(255,255,255, 0.9) 100%)`,
            boxShadow: disabled ? "inset 0 1px 1px rgba(255,255,255,0.9)" : `0 4px 12px ${hexToRgba(iconColor, 0.15)}, inset 0 1px 2px rgba(255,255,255, 1)`,
            border: disabled ? "1px solid rgba(255, 255, 255, 0.8)" : "1px solid rgba(255,255,255,0.8)",
          }}
        >
          <style>{`
            .icon-color-override-${taskKey} svg {
              color: ${disabled ? "#94a3b8" : (iconColor || "#6366f1")} !important;
              stroke: ${disabled ? "#94a3b8" : (iconColor || "#6366f1")} !important;
            }
          `}</style>
          <AnimatedIcon animation="none" isActive={isActive} isLooping={isLooping}>
            <Icon 
              size={20} 
              strokeWidth={2.5} 
            />
          </AnimatedIcon>
        </div>
      </div>
      <div className={styles.buttonMiddle} style={{ flex: 1, minWidth: 0 }}>
        <div 
          className={styles.buttonTitle} 
          style={{ 
            color: disabled ? "#94a3b8" : "#0f172a",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "-0.2px"
          }}
        >
          {title}
        </div>
        <div
          className={styles.buttonDescription}
          style={{ 
            display: "flex", alignItems: "center", gap: "6px", width: "100%", 
            color: disabled ? "#94a3b8" : "#475569",
            fontWeight: 500,
            fontSize: "12px",
            marginTop: "2px"
          }}
        >
          {showLockText ? (
            <>
              <AnimatedIcon animation="none">
                <Lock size={12} />
              </AnimatedIcon> Run Smart Video Analysis first
            </>
          ) : (
            description
          )}
        </div>
      </div>
      <div className={styles.buttonRight} style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {rightAction !== undefined ? rightAction : (
          <AnimatedIcon animation="none">
            <ChevronRight size={20} strokeWidth={2} color="#cbd5e1" />
          </AnimatedIcon>
        )}
      </div>
    </div>
  );

  const renderResultOrSkeleton = (content, taskKey, rawText, titleForBlackNote, isOpen = true) => {
    if (activeTask === taskKey && !content) {
      return (
        <div
          style={{
            padding: "12px",
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: "10px",
            marginTop: "2px",
            marginBottom: "4px"
          }}
        >
          <div style={{ height: "16px", width: "40%", borderRadius: "4px", background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%", animation: "aiShimmer 1.5s infinite" }} />
          <div style={{ height: "12px", width: "100%", borderRadius: "4px", marginTop: "12px", background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%", animation: "aiShimmer 1.5s infinite" }} />
          <div style={{ height: "12px", width: "90%", borderRadius: "4px", marginTop: "8px", background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%", animation: "aiShimmer 1.5s infinite" }} />
          <div style={{ height: "12px", width: "70%", borderRadius: "4px", marginTop: "8px", background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%", animation: "aiShimmer 1.5s infinite" }} />
        </div>
      );
    }
    if (!content || !isOpen) return null;
    const getTaskColor = (key) => {
      switch(key) {
        case "chat": return "#4f46e5";
        case "meeting-minutes": return "#059669";
        case "summarize": return "#ea580c";
        case "action-items": return "#2563eb";
        case "title": return "#db2777";
        case "chapters": return "#7c3aed";
        case "social": return "#0284c7";
        default: return "#3b82f6";
      }
    };
    const color = getTaskColor(taskKey);

    return (
      <div
        style={{
          padding: "16px",
          background: `linear-gradient(135deg, ${hexToRgba(color, 0.05)} 0%, rgba(255,255,255, 0.8) 100%)`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255, 0.9)",
          boxShadow: `0 8px 32px -8px ${hexToRgba(color, 0.15)}, inset 0 1px 1px rgba(255,255,255, 1)`,
          fontSize: "13px",
          color: "#334155",
          marginTop: "2px",
          marginBottom: "4px",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{
          maxHeight: "200px",
          overflow: "hidden",
          lineHeight: "1.5",
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          WebkitMaskImage: "-webkit-linear-gradient(top, black 60%, transparent 100%)"
        }}>
          {content}
        </div>
        <button
          onClick={() => sendToBlackNote(titleForBlackNote, rawText)}
          style={{
            marginTop: "16px",
            background: "rgba(255, 255, 255, 0.7)",
            color: "#0f172a",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            borderRadius: "12px",
            padding: "8px 16px 8px 10px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "fit-content",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03), inset 0 1px 1px rgba(255,255,255,0.9)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,1)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.7)";
            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.03), inset 0 1px 1px rgba(255,255,255,0.9)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{
            width: "24px", height: "24px", borderRadius: "8px",
            background: "rgba(15, 23, 42, 0.04)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BlackNoteIcon size={14} />
          </div>
          Read More in BlackNote
        </button>
      </div>
    );
  };

  return (
    <div className={styles.section}>
      <style>{`
        @keyframes aiShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes loopWave {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-loop-wave {
          animation: loopWave 1.5s infinite ease-in-out;
        }
        .modern-slider {
          -webkit-appearance: none;
          width: 110px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          outline: none;
        }
        .modern-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.1s ease;
        }
        .modern-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
      <div
        id="ai-panel-top"
        className={styles.sectionTitle}
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        AI Intelligence
      </div>

      {/* Smart error banner */}
      {renderSmartError()}

      {/* Button list */}
      <div
        className={styles.buttonWrap}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {/* 1. Auto-transcribe status / Smart Video Analysis */}
        {!segments && autoTranscribeStatus === "limit_exceeded" && (
          <div style={{
            padding: "20px", background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            borderRadius: "12px", border: "1px solid #f59e0b33",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <AnimatedIcon animation="none"><Crown size={22} color="#d97706" /></AnimatedIcon>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "#92400e" }}>
                AI Not Available for This Recording
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#78350f", lineHeight: 1.5 }}>
              This recording exceeds the 20-minute limit for free accounts. Upgrade to PRO to unlock AI features for longer recordings.
            </div>
            <button
              onClick={() => chrome.runtime.sendMessage({ type: "handle-upgrade" }).catch(() => {})}
              style={{
                marginTop: "14px", padding: "10px 20px", background: "#d97706", color: "white",
                borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#b45309"}
              onMouseOut={(e) => e.currentTarget.style.background = "#d97706"}
            >
              <Crown size={14} /> Upgrade to PRO
            </button>
          </div>
        )}

        {!segments && autoTranscribeStatus !== "limit_exceeded" && (
          renderButton({
            Icon: isProcessing && activeTask === "transcribe" ? AudioLines : GripIcon,
            title: isProcessing && activeTask === "transcribe"
              ? "AI features will be available shortly..."
              : autoTranscribeStatus === "error"
                ? "Analysis Failed"
                : autoTranscribeStatus === "idle"
                  ? "Smart Video Analysis"
                  : "Preparing AI analysis...",
            description: isProcessing && activeTask === "transcribe" ? (
              <div style={{ flex: 1, paddingRight: "16px" }}>
                <div style={{
                  width: "100%",
                  height: "8px",
                  background: "#e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  position: "relative",
                  border: "none"
                }}>
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: fakeProgressWidth,
                    background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                    borderRadius: "12px",
                    transition: transcribeFinishing ? "width 0.4s ease-out" : "width 20s cubic-bezier(0.1, 0.9, 0.2, 1)",
                  }} />
                  {/* Highlight shimmer effect over the progress bar */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: "100%",
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "aiShimmer 2s infinite linear"
                  }} />
                </div>
              </div>
            ) : "Extract intelligence, subtitles, and metadata.",
            onClick: userTier === "guest" ? () => setError("LOGIN_REQUIRED") : handleTranscribe,
            taskKey: "transcribe",
            disabled: isProcessing && activeTask !== "transcribe",
            showLockText: false,
            rightAction: isProcessing && activeTask === "transcribe" ? <div /> : undefined,
            iconColor: isProcessing && activeTask === "transcribe" ? "#3b82f6" : null,
            isActive: isProcessing && activeTask === "transcribe",
            isLooping: false, // The lottie handles the looping now
          })
        )}

        {/* 2. Translate & Add Subtitles */}
        <div
          style={{
            padding: "16px",
            background: locked ? "rgba(241, 245, 249, 0.6)" : `linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255,255,255, 0.8) 100%)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "20px",
            opacity: locked ? 0.7 : 1,
            pointerEvents: locked ? "none" : "auto",
            border: locked ? "1px solid rgba(255, 255, 255, 0.8)" : "1px solid rgba(255,255,255, 0.9)",
            boxShadow: locked ? "none" : `0 8px 32px -8px rgba(59, 130, 246, 0.2), inset 0 1px 1px rgba(255,255,255, 1)`,
            marginBottom: "16px",
            position: "relative",
            zIndex: 50,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px",
              letterSpacing: "-0.2px"
            }}
          >
            <div style={{
              width: "42px", height: "42px",
              borderRadius: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: locked ? "rgba(241, 245, 249, 0.8)" : `linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(255,255,255, 0.9) 100%)`,
              boxShadow: locked ? "inset 0 1px 1px rgba(255,255,255,0.9)" : `0 4px 12px rgba(59, 130, 246, 0.15), inset 0 1px 2px rgba(255,255,255, 1)`,
              border: locked ? "1px solid rgba(255, 255, 255, 0.8)" : "1px solid rgba(255,255,255,0.8)",
            }}>
              {locked ? (
                <Lock size={20} color="#94a3b8" strokeWidth={2.5} />
              ) : (
                <Languages size={20} color="#3b82f6" strokeWidth={2.5} />
              )}
            </div>
            Translate & Add Subtitles
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <LanguageSelect
              value={targetLang}
              onChange={(val) => {
                setTargetLang(val);
                setSubtitlesApplied(false);
              }}
              disabled={isProcessing || locked}
              options={allLanguages}
              groups={LANGUAGE_GROUPS}
            />
            <button
              onClick={handleApplySubtitles}
              disabled={isProcessing || locked || subtitlesApplied}
              style={applyButtonStyle(isProcessing || locked || subtitlesApplied)}
              onMouseOver={(e) => {
                if (!locked && !isProcessing && !subtitlesApplied)
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(29, 78, 216, 1) 100%)";
              }}
              onMouseOut={(e) => {
                if (!locked && !isProcessing && !subtitlesApplied)
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 1) 100%)";
              }}
            >
              {activeTask === "translate" ? (
                <div style={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "center", height: 16 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                      style={{ width: 4, height: 4, backgroundColor: "rgba(0, 0, 0, 0.7)", borderRadius: "50%" }}
                    />
                  ))}
                </div>
              ) : subtitlesApplied ? "Applied" : "Apply"}
            </button>
            <button
              onClick={() => handleDownloadSubtitles(translatedSegments || segments)}
              title="Download .SRT"
              style={downloadButtonStyle}
              disabled={locked}
              onMouseOver={(e) => { if (!locked) e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%)"; }}
              onMouseOut={(e) => { if (!locked) e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)"; }}
            >
              <AnimatedIcon animation="none">
                <Download size={18} color={locked ? "#cbd5e1" : "#475569"} />
              </AnimatedIcon>
            </button>
          </div>
          {/* Subtitles & Styling */}
          <div style={{ marginTop: "16px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            
            <div
              onClick={() => setSubSettingsOpen(!subSettingsOpen)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            >
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={16} color="#64748b" /> Subtitle Styling
              </div>
              <AnimatedIcon animation="none">
                <ChevronDown size={16} color="#64748b" style={{ transform: subSettingsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </AnimatedIcon>
            </div>

            {subSettingsOpen && (
              <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.5)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.9)", display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px", color: "#475569" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>Font Color</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {["#FFFFFF", "#000000", "#FDE047", "#EF4444", "#3B82F6", "#22C55E"].map(color => (
                      <div
                        key={color}
                        onClick={() => setSubFontColor(color)}
                        style={{
                          width: "22px", height: "22px", transition: "all 0.2s ease", borderRadius: "50%",
                          backgroundColor: color, cursor: "pointer",
                          border: subFontColor === color ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                          boxShadow: subFontColor === color ? "0 0 0 2px #fff inset" : "none"
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>Background Color</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {["#000000", "#FFFFFF", "#1E293B", "#DC2626", "#2563EB", "#16A34A"].map(color => (
                      <div
                        key={color}
                        onClick={() => setSubBgColor(color)}
                        style={{
                          width: "22px", height: "22px", transition: "all 0.2s ease", borderRadius: "50%",
                          backgroundColor: color, cursor: "pointer",
                          border: subBgColor === color ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                          boxShadow: subBgColor === color ? "0 0 0 2px #fff inset" : "none"
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ height: "1px", background: "#e2e8f0", margin: "2px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>Bg Opacity <span style={{ color: "#94a3b8", fontWeight: "normal" }}>({subBgOpacity}%)</span></span>
                  <input
                    type="range"
                    min="0" max="100"
                    value={subBgOpacity}
                    onChange={(e) => setSubBgOpacity(e.target.value)}
                    className="modern-slider"
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>Font Size <span style={{ color: "#94a3b8", fontWeight: "normal" }}>({subFontSize}px)</span></span>
                  <input
                    type="range"
                    min="14" max="48"
                    value={subFontSize}
                    onChange={(e) => setSubFontSize(e.target.value)}
                    className="modern-slider"
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>Margin Bottom <span style={{ color: "#94a3b8", fontWeight: "normal" }}>({subMarginBottom}px)</span></span>
                  <input
                    type="range"
                    min="0" max="100"
                    value={subMarginBottom}
                    onChange={(e) => setSubMarginBottom(e.target.value)}
                    className="modern-slider"
                  />
                </div>
                <div style={{ height: "1px", background: "#e2e8f0" }} />
                <div>
                  <div 
                    style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "10px", fontWeight: 500 }}
                    onClick={(e) => setContentState(prev => ({ ...prev, isHardcodeEnabled: !prev.isHardcodeEnabled }))}
                  >
                    <div style={{
                      width: "36px", height: "20px",
                      background: contentState.isHardcodeEnabled ? "#10b981" : "#cbd5e1",
                      borderRadius: "20px", position: "relative",
                      transition: "background 0.2s ease"
                    }}>
                      <div style={{
                        width: "16px", height: "16px", background: "#ffffff",
                        borderRadius: "50%", position: "absolute", top: "2px",
                        left: contentState.isHardcodeEnabled ? "18px" : "2px",
                        transition: "left 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                      }} />
                    </div>
                    Hardcode subtitles on download
                  </div>

                </div>

              </div>
            )}
          </div>
        </div>

        {/* ─── Chat with Video (Spark AI) ─── */}
        {renderButton({
          Icon: SparkAIIcon,
          title: "Chat with Video",
          description: "Ask AI anything about this recording.",
          onClick: () => {
            if (!locked) openSparkAI(segments, titleData?.title || contentState.title);
          },
          taskKey: "chat",
          disabled: locked || isProcessing,
          showLockText: locked,
          bgGradient: "rgba(99, 102, 241, 0.06)",
          iconColor: "#4f46e5",
          textGradient: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
        })}

        {/* 8. Meeting Minutes (replaces Quiz) */}
        {renderButton({
          Icon: Users,
          title: "Meeting Minutes",
          description: activeTask === "meeting-minutes"
            ? "Generating meeting notes..."
            : "Generate key decisions and action items.",
          onClick: meetingMinutes ? () => togglePanel("meeting-minutes") : handleMeetingMinutes,
          taskKey: "meeting-minutes",
          disabled: locked,
          rightAction: meetingMinutes ? (
            <AnimatedIcon animation="none">
              {isPanelOpen("meeting-minutes") ? <ChevronDown size={16} color="currentColor" /> : <ChevronRight size={16} color="currentColor" />}
            </AnimatedIcon>
          ) : undefined,
          iconColor: "#059669",
          textGradient: "linear-gradient(90deg, #059669 0%, #10b981 100%)",
        })}
        {renderResultOrSkeleton(
          meetingMinutes && (
            <div
              style={{ lineHeight: "1.5" }}
              dangerouslySetInnerHTML={{ __html: marked.parse(meetingMinutes) }}
            />
          ),
          "meeting-minutes",
          meetingMinutes,
          "Meeting Minutes",
          isPanelOpen("meeting-minutes")
        )}

        {/* 3. Summarize — result appears inline below */}
        {renderButton({
          Icon: FileText,
          title: "Summarize Video",
          description: activeTask === "summarize"
            ? "Reading transcript..."
            : "Get a quick summary of the video.",
          onClick: summary ? () => togglePanel("summarize") : handleSummarize,
          taskKey: "summarize",
          disabled: locked,
          rightAction: summary ? (
            <AnimatedIcon animation="none">
              {isPanelOpen("summarize") ? <ChevronDown size={16} color="currentColor" /> : <ChevronRight size={16} color="currentColor" />}
            </AnimatedIcon>
          ) : undefined,
          iconColor: "#ea580c",
          textGradient: "linear-gradient(90deg, #ea580c 0%, #f97316 100%)",
        })}
        {renderResultOrSkeleton(
          summary && (
            <div
              style={{ lineHeight: "1.5" }}
              dangerouslySetInnerHTML={{ __html: marked.parse(summary) }}
            />
          ),
          "summarize",
          summary,
          "Video Summary",
          isPanelOpen("summarize")
        )}

        {/* 4. Key Takeaways — result appears inline below */}
        {renderButton({
          Icon: ClipboardCheckIcon,
          title: "Key Takeaways",
          description: activeTask === "action-items"
            ? "Analyzing transcript..."
            : "Extract bullet points & to-dos.",
          onClick: actionItems ? () => togglePanel("action-items") : handleActionItems,
          taskKey: "action-items",
          disabled: locked,
          rightAction: actionItems ? (
            <AnimatedIcon animation="none">
              {isPanelOpen("action-items") ? <ChevronDown size={16} color="currentColor" /> : <ChevronRight size={16} color="currentColor" />}
            </AnimatedIcon>
          ) : undefined,
          iconColor: "#3b82f6",
          textGradient: "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
        })}
        {renderResultOrSkeleton(
          actionItems && (
            <div
              style={{ lineHeight: "1.5" }}
              dangerouslySetInnerHTML={{ __html: marked.parse(actionItems) }}
            />
          ),
          "action-items",
          actionItems,
          "Video Key Takeaways",
          isPanelOpen("action-items")
        )}

        {/* 5. Smart Title — result appears inline below */}
        {renderButton({
          Icon: TextSelect,
          title: "Smart Title & Details",
          description: activeTask === "title"
            ? "Crafting metadata..."
            : "Generate YouTube-ready title.",
          onClick: titleData ? () => togglePanel("title") : handleGenerateTitle,
          taskKey: "title",
          disabled: locked,
          rightAction: titleData ? (
            <AnimatedIcon animation="none">
              {isPanelOpen("title") ? <ChevronDown size={16} color="currentColor" /> : <ChevronRight size={16} color="currentColor" />}
            </AnimatedIcon>
          ) : undefined,
          iconColor: "#db2777",
          textGradient: "linear-gradient(90deg, #db2777 0%, #f43f5e 100%)",
        })}
        {renderResultOrSkeleton(
          titleData && (
            <>
              <strong>{titleData.title}</strong>
              <div
                style={{ marginTop: "4px", lineHeight: "1.5" }}
                dangerouslySetInnerHTML={{ __html: marked.parse(titleData.description || "") }}
              />
            </>
          ),
          "title",
          titleData ? `**${titleData.title}**\n\n${titleData.description}` : "",
          titleData ? titleData.title : "",
          isPanelOpen("title")
        )}

        {/* 6. Smart Chapters */}
        {renderButton({
          Icon: LayersIcon,
          title: "Smart Chapters",
          description: activeTask === "chapters"
            ? "Structuring video..."
            : "Auto-generate YouTube timestamps.",
          onClick: chapters ? () => togglePanel("chapters") : handleChapters,
          taskKey: "chapters",
          disabled: locked,
          rightAction: chapters ? (
            <AnimatedIcon animation="none">
              {isPanelOpen("chapters") ? <ChevronDown size={16} color="currentColor" /> : <ChevronRight size={16} color="currentColor" />}
            </AnimatedIcon>
          ) : undefined,
          iconColor: "#7c3aed",
          textGradient: "linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%)",
        })}
        {renderResultOrSkeleton(
          chapters && (
            <div
              style={{ lineHeight: "1.5" }}
              dangerouslySetInnerHTML={{ __html: marked.parse(chapters) }}
            />
          ),
          "chapters",
          chapters,
          "Video Chapters",
          isPanelOpen("chapters")
        )}

        {/* 7. Social Media Post */}
        {renderButton({
          Icon: Share2,
          title: "Social Media Post",
          description: activeTask === "social"
            ? "Drafting post..."
            : "Repurpose video for LinkedIn/Twitter.",
          onClick: social ? () => togglePanel("social") : handleSocial,
          taskKey: "social",
          disabled: locked,
          rightAction: social ? (
            <AnimatedIcon animation="none">
              {isPanelOpen("social") ? <ChevronDown size={16} color="currentColor" /> : <ChevronRight size={16} color="currentColor" />}
            </AnimatedIcon>
          ) : undefined,
          iconColor: "#0284c7",
          textGradient: "linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)",
        })}
        {renderResultOrSkeleton(
          social && (
            <div
              style={{ lineHeight: "1.5" }}
              dangerouslySetInnerHTML={{ __html: marked.parse(social) }}
            />
          ),
          "social",
          social,
          "Social Media Post",
          isPanelOpen("social")
        )}



        {/* 9. AI Voice Narrator (Temporarily Disabled due to Groq API token limits) */}
        {/*
        <div
          style={{
            padding: "16px",
            background: voiceoverApplied ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#fff",
            borderRadius: "12px",
            opacity: locked ? 0.45 : 1,
            pointerEvents: locked ? "none" : "auto",
            border: voiceoverApplied ? "1px solid #86efac" : "1px solid #e2e8f0",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              fontWeight: "600", fontSize: "14px", color: "#0f172a",
              marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            {locked ? (
              <AnimatedIcon animation="none"><Lock size={16} color="#94a3b8" /></AnimatedIcon>
            ) : voiceoverApplied ? (
              <AnimatedIcon animation="none"><CheckIcon size={18} color="#16a34a" /></AnimatedIcon>
            ) : (
              <AnimatedIcon animation="none"><AudioLines size={18} color="#8b5cf6" /></AnimatedIcon>
            )}
            AI Voice Narrator
            {voiceoverApplied && (
              <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 500, marginLeft: "auto" }}>
                ✓ Applied
              </span>
            )}
          </div>

          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px", lineHeight: 1.4 }}>
            {voiceoverApplied
              ? "AI voice has been applied to your video. Download to save."
              : "Replace video narration with an AI-generated voice."}
          </div>

          {!voiceoverApplied && (
            <>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>Voice</div>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    disabled={isProcessing || locked || voiceoverProcessing}
                    style={{
                      ...selectStyle,
                      width: "100%",
                      fontSize: "13px",
                      padding: "8px 10px",
                    }}
                  >
                    <option value="autumn">🎙️ Autumn (Female)</option>
                    {userTier === "pro" && (
                      <>
                        <option value="diana">🎙️ Diana (Female)</option>
                        <option value="hannah">🎙️ Hannah (Female)</option>
                        <option value="austin">🎤 Austin (Male)</option>
                        <option value="daniel">🎤 Daniel (Male)</option>
                        <option value="troy">🎤 Troy (Male)</option>
                      </>
                    )}
                  </select>
                  {userTier !== "pro" && (
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px", fontStyle: "italic" }}>
                      Upgrade to PRO for more voices
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>Tone</div>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                    disabled={isProcessing || locked || voiceoverProcessing}
                    style={{
                      ...selectStyle,
                      width: "100%",
                      fontSize: "13px",
                      padding: "8px 10px",
                    }}
                  >
                    <option value="none">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="cheerful">Cheerful</option>
                    <option value="dramatic">Dramatic</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleVoiceover}
                disabled={locked || isProcessing || voiceoverProcessing || !transcript}
                style={{
                  width: "100%", padding: "10px",
                  background: voiceoverProcessing ? "#94a3b8" : !transcript ? "#cbd5e1" : "#8b5cf6",
                  color: "white", borderRadius: "8px", border: "none",
                  fontSize: "13px", fontWeight: 600,
                  cursor: locked || isProcessing || !transcript ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => { if (!locked && !isProcessing && transcript) e.currentTarget.style.background = "#7c3aed"; }}
                onMouseOut={(e) => { if (!locked && !isProcessing && transcript) e.currentTarget.style.background = "#8b5cf6"; }}
              >
                {voiceoverProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, transformOrigin: "center" }}
                    >
                      <LoaderPinwheelIcon size={14} color="white" />
                    </motion.div>
                    Generating voiceover...
                  </>
                ) : (
                  <>
                    <AudioLines size={14} /> {voiceoverAudioBase64 ? "Regenerate" : "Generate Voiceover"}
                  </>
                )}
              </button>
            </>
          )}

          {voiceoverAudioBase64 && !voiceoverProcessing && (
            <div style={{ marginTop: voiceoverApplied ? "0" : "12px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 12px",
                background: voiceoverApplied ? "#ffffff80" : "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "10px",
              }}>
                <button
                  onClick={handlePreviewVoiceover}
                  style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: voiceoverPreviewing ? "#ef4444" : "#8b5cf6",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  {voiceoverPreviewing
                    ? <PauseIcon size={14} color="white" />
                    : <PlayIcon size={14} color="white" />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                    {voiceoverPreviewing ? "Playing preview..." : "AI Voiceover Ready"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Voice: {selectedVoice.charAt(0).toUpperCase() + selectedVoice.slice(1)} · {selectedTone === "none" ? "Casual" : selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)}
                  </div>
                </div>
                <Volume2Icon size={16} color={voiceoverPreviewing ? "#8b5cf6" : "#94a3b8"} />
              </div>

              {!voiceoverApplied ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleApplyVoiceover}
                    disabled={isProcessing}
                    style={{
                      flex: 1, padding: "10px",
                      background: "#16a34a", color: "white",
                      borderRadius: "8px", border: "none",
                      fontSize: "13px", fontWeight: 600,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#15803d"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#16a34a"}
                  >
                    <CheckIcon size={14} /> Apply to Video
                  </button>
                  <button
                    onClick={handleRemoveVoiceover}
                    style={{
                      padding: "10px 14px",
                      background: "#f1f5f9", color: "#64748b",
                      borderRadius: "8px", border: "1px solid #e2e8f0",
                      fontSize: "13px", fontWeight: 500, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleRemoveVoiceover}
                    style={{
                      flex: 1, padding: "10px",
                      background: "#f1f5f9", color: "#64748b",
                      borderRadius: "8px", border: "1px solid #e2e8f0",
                      fontSize: "13px", fontWeight: 500, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
                  >
                    <RefreshCwIcon size={14} /> Generate New
                  </button>
                </div>
              )}
            </div>
          )}

          {!voiceoverApplied && !voiceoverAudioBase64 && (
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", fontStyle: "italic", lineHeight: 1.3 }}>
              AI will generate narration from your transcript. Preview before applying.
            </div>
          )}
        </div>
        */}

      </div>
    </div>
  );
};

export default AIPanel;
