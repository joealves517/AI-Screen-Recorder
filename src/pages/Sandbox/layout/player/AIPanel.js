import React, { useContext, useState, useEffect, useCallback } from "react";
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
  ListIcon as ListChecks,
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
  BookmarkIcon as Bookmark
} from "lucide-animated";

import blackNoteIconUrl from "../../../../assets/blacknote-icon.png";
import sparkAiIconUrl from "../../../../assets/spark-ai-icon.svg";

const BlackNoteIcon = ({ size = 20 }) => <img src={blackNoteIconUrl} width={size} height={size} alt="BlackNote" style={{ objectFit: 'contain' }} />;
const SparkAIIcon = ({ size = 20 }) => <img src={sparkAiIconUrl} width={size} height={size} alt="Spark AI" style={{ objectFit: 'contain' }} />;

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
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  color: "#334155",
  backgroundColor: "#f8fafc",
  outline: "none",
  cursor: "pointer",
};

const applyButtonStyle = (disabled) => ({
  padding: "9px 16px",
  background: "#3b82f6",
  color: "white",
  borderRadius: "8px",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: disabled ? "not-allowed" : "pointer",
  whiteSpace: "nowrap",
  transition: "background 0.2s",
});

const downloadButtonStyle = {
  padding: "8px 10px",
  background: "#f1f5f9",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  transition: "background 0.2s",
};

const errorBannerStyle = (bgColor, textColor) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: textColor,
  fontSize: "12px",
  padding: "12px 14px",
  background: bgColor,
  borderRadius: "10px",
  marginBottom: "12px",
  flexWrap: "wrap",
});

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
            {search === "" && (
              <div
                onClick={() => handleSelect("original")}
                style={{
                  padding: "8px 12px",
                  fontSize: "13px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  background: value === "original" ? "#f1f5f9" : "transparent",
                  fontWeight: value === "original" ? "600" : "400",
                  color: "#334155"
                }}
                onMouseOver={(e) => { if (value !== "original") e.currentTarget.style.background = "#f8fafc" }}
                onMouseOut={(e) => { if (value !== "original") e.currentTarget.style.background = "transparent" }}
              >
                Original Language
              </div>
            )}
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

  // Core data — segments carry timestamps for accurate subtitles
  const [segments, setSegments] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [actionItems, setActionItems] = useState(null);
  const [titleData, setTitleData] = useState(null);
  const [error, setError] = useState(null);

  // Translation state
  const [targetLang, setTargetLang] = useState("vi");
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

  const locked = !segments;
  const allLanguages = getSupportedLanguages();

  // Detect user tier on mount
  useEffect(() => {
    chrome.storage.local.get(
      ["isLoggedIn", "isSubscribed", "quotaExhausted"],
      (result) => {
        if (!result.isLoggedIn) setUserTier("guest");
        else if (result.isSubscribed && !result.quotaExhausted) setUserTier("pro");
        else setUserTier("free");
      }
    );
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
      if (cache.targetLang) setTargetLang(cache.targetLang);

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
        targetLang,
        translatedSegments,
        subtitlesApplied,
      },
    });
  }, [segments, transcript, summary, actionItems, titleData, targetLang, translatedSegments, subtitlesApplied]);

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
        default: !isOriginal, // Auto-switch to translation
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
          setSegments(newSegments);
          setTranscript(newTranscript);
          setIsProcessing(false);
          setActiveTask("");
          setError(null);

          // Auto-apply original subtitles to video
          if (newSegments.length > 0) {
            applySegmentsToPlayer(newSegments, true, "en");
          }
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

        case "ai-translate-result": {
          const translated = event.data.translatedSegments || [];
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

        default:
          if (type && type.endsWith("-error")) {
            handleAIError(event.data.error);
            setIsProcessing(false);
            setActiveTask("");
          }
          break;
      }
    },
    [setContentState]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // --- Error handling — always show user-friendly messages, never raw errors ---

  const handleAIError = (errorMsg) => {
    // Normalize all errors to a single flag — raw messages are never displayed
    setError("SERVER_ERROR");
  };

  const renderSmartError = () => {
    if (!error) return null;

    if (userTier === "guest") {
      return (
        <div style={errorBannerStyle("#f0f9ff", "#0369a1")}>
          <AnimatedIcon animation="none">
            <Info size={14} style={{ flexShrink: 0 }} />
          </AnimatedIcon>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Server is currently overloaded
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Sign in to enjoy a better and more stable AI experience.
            </div>
          </div>
          <button
            onClick={() => chrome.runtime.sendMessage({ type: "handle-login" })}
            style={ctaButtonStyle("#3b82f6")}
          >
            <AnimatedIcon animation="none">
              <LogIn size={12} />
            </AnimatedIcon> Sign in
          </button>
        </div>
      );
    }

    if (userTier === "free") {
      return (
        <div style={errorBannerStyle("#fffbeb", "#92400e")}>
          <AnimatedIcon animation="none">
            <Crown size={14} style={{ flexShrink: 0 }} />
          </AnimatedIcon>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Server is currently overloaded
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Upgrade to Pro for priority processing and higher limits.
            </div>
          </div>
          <button
            onClick={() => chrome.runtime.sendMessage({ type: "handle-upgrade" })}
            style={ctaButtonStyle("#f59e0b")}
          >
            <AnimatedIcon animation="none">
              <Crown size={12} />
            </AnimatedIcon> Upgrade
          </button>
        </div>
      );
    }

    // Pro tier — quota exhausted
    return (
      <div style={errorBannerStyle("#f0f9ff", "#0369a1")}>
        <AnimatedIcon animation="none">
          <Info size={14} style={{ flexShrink: 0 }} />
        </AnimatedIcon>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Your priority quota has been used up
          </div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            You have been switched to the standard tier. Please try again later or contact support.
          </div>
        </div>
      </div>
    );
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

  const handleDownloadHardcoded = async () => {
    const segs = translatedSegments || segments;
    if (!segs || segs.length === 0) return;

    const source = contentState.blob || contentState.webm || contentState.rawBlob;
    if (!source) {
      return;
    }
    const videoBlob = source instanceof Blob ? source : new Blob([source], { type: "video/webm" });

    const formatAssTime = (ms) => {
      const d = new Date(ms);
      const h = Math.floor(ms / 3600000);
      const m = d.getUTCMinutes().toString().padStart(2, "0");
      const s = d.getUTCSeconds().toString().padStart(2, "0");
      const cs = Math.floor(d.getUTCMilliseconds() / 10).toString().padStart(2, "0");
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

    // Using Satoshi-Bold for a premium look
    let assData = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Satoshi,${subFontSize * 2},${primaryAss},&H000000FF,&H00000000,${backAss},-1,0,0,0,100,100,0,0,3,1,0,2,10,10,${subMarginBottom * 2},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    segs.forEach((seg) => {
      const start = formatAssTime(seg.start);
      const end = formatAssTime(seg.end);
      const text = seg.text.replace(/\n/g, "\\N");
      assData += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
    });

    setContentState((prev) => ({
      ...prev,
      downloading: true,
      isFfmpegRunning: true,
      processingProgress: 0,
    }));

    const title = contentState.title || "ai-recording";
    window.parent.postMessage({
      type: "burn-subtitles",
      blob: videoBlob,
      assData,
      title
    }, "*");
  };

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

  // --- Render helpers ---

  const renderButton = ({ Icon, title, description, onClick, taskKey, disabled, showLockText, rightAction }) => (
    <div
      role="button"
      className={styles.button}
      onClick={disabled ? undefined : onClick}
      style={{
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "opacity 0.2s ease",
      }}
    >
      <div className={styles.buttonLeft}>
        <AnimatedIcon animation="none">
          <Icon size={20} strokeWidth={2} color={disabled ? "#94a3b8" : "#6366f1"} />
        </AnimatedIcon>
      </div>
      <div className={styles.buttonMiddle}>
        <div className={styles.buttonTitle}>
          {activeTask === taskKey
            ? taskKey === "transcribe"
              ? `Generating (${progress}%)`
              : `${title}...`
            : title}
        </div>
        <div
          className={styles.buttonDescription}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          {showLockText ? (
            <>
              <AnimatedIcon animation="none">
                <Lock size={12} />
              </AnimatedIcon> Generate subtitles first
            </>
          ) : (
            description
          )}
        </div>
      </div>
      <div className={styles.buttonRight} style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {rightAction || (
          <AnimatedIcon animation="none">
            <ChevronRight size={20} strokeWidth={2} color="#cbd5e1" />
          </AnimatedIcon>
        )}
      </div>
    </div>
  );

  const renderResultOrSkeleton = (content, taskKey) => {
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
    if (!content) return null;
    return (
      <div
        style={{
          padding: "16px",
          background: "linear-gradient(135deg, #f8fafc 0%, rgba(248, 250, 252, 0) 100%)",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          fontSize: "13px",
          color: "#334155",
          marginTop: "2px",
          marginBottom: "4px",
        }}
      >
        {content}
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
      `}</style>
      <div
        className={styles.sectionTitle}
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <AnimatedIcon animation="none">
          <Sparkles size={18} color="#eab308" fill="#fef08a" />
        </AnimatedIcon> AI Intelligence
      </div>

      {/* Smart error banner */}
      {renderSmartError()}

      {/* Button list */}
      <div
        className={styles.buttonWrap}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {/* 1. Generate Subtitles (was "Generate Transcript") */}
        {renderButton({
          Icon: AudioLines,
          title: segments ? "Subtitles Generated" : "Generate Subtitles",
          description:
            activeTask === "transcribe"
              ? "Gemini AI is processing..."
              : segments
              ? "Transcription complete."
              : "Auto-transcribe & add subtitles to video.",
          onClick: segments ? undefined : handleTranscribe,
          taskKey: "transcribe",
          disabled: isProcessing && activeTask !== "transcribe",
          showLockText: false,
          rightAction: segments ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadSubtitles(translatedSegments || segments);
              }}
              title="Download .SRT"
              style={downloadButtonStyle}
              onMouseOver={(e) => (e.currentTarget.style.background = "#e2e8f0")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            >
              <AnimatedIcon animation="none">
                <Download size={16} color="#475569" />
              </AnimatedIcon>
            </button>
          ) : undefined,
        })}

        {/* Subtitle status */}
        {subtitlesApplied && !translatedSegments && (
          <div style={statusStyle}>
            <AnimatedIcon animation="none">
              <Sparkles size={14} />
            </AnimatedIcon> Subtitles applied to video!
          </div>
        )}

        {/* 2. Translate & Add Subtitles */}
        <div
          style={{
            padding: "16px",
            background: "#fff",
            borderRadius: "12px",
            opacity: locked ? 0.45 : 1,
            pointerEvents: locked ? "none" : "auto",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)",
            transition: "opacity 0.2s ease",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              fontSize: "14px",
              color: "#0f172a",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {locked ? (
              <AnimatedIcon animation="none">
                <Lock size={16} color="#94a3b8" />
              </AnimatedIcon>
            ) : (
              <AnimatedIcon animation="none">
                <Languages size={18} color="#3b82f6" />
              </AnimatedIcon>
            )}
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
              disabled={isProcessing || locked}
              style={applyButtonStyle(isProcessing || locked)}
              onMouseOver={(e) => {
                if (!locked && !isProcessing)
                  e.currentTarget.style.background = "#2563eb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#3b82f6";
              }}
            >
              {activeTask === "translate" ? "Translating..." : "Apply"}
            </button>
            {subtitlesApplied && translatedSegments && (
              <button
                onClick={() => handleDownloadSubtitles(translatedSegments)}
                title="Download translated .SRT"
                style={downloadButtonStyle}
                onMouseOver={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              >
                <AnimatedIcon animation="none">
                  <Download size={18} color="#475569" />
                </AnimatedIcon>
              </button>
            )}
          </div>
          {subtitlesApplied && translatedSegments && (
            <div style={statusStyle}>
              <AnimatedIcon animation="none">
                <Sparkles size={14} />
              </AnimatedIcon> Translated subtitles applied!
            </div>
          )}

          {/* Subtitle Styling Settings */}
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                color: "#475569",
                fontSize: "13px",
                fontWeight: "500",
              }}
              onClick={() => setSubSettingsOpen(!subSettingsOpen)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AnimatedIcon animation="none">
                  <Settings size={14} />
                </AnimatedIcon>
                Subtitle Styling
              </div>
              <AnimatedIcon animation="none">
                {subSettingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </AnimatedIcon>
            </div>

            {subSettingsOpen && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "#334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Font Color</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {["#FFFFFF", "#000000", "#FDE047", "#EF4444", "#3B82F6", "#22C55E"].map(color => (
                      <div
                        key={color}
                        onClick={() => setSubFontColor(color)}
                        style={{
                          width: "20px", height: "20px", borderRadius: "50%",
                          backgroundColor: color, cursor: "pointer",
                          border: subFontColor === color ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                          boxShadow: subFontColor === color ? "0 0 0 2px #fff inset" : "none"
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                  <span>Background Color</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {["#000000", "#FFFFFF", "#1E293B", "#DC2626", "#2563EB", "#16A34A"].map(color => (
                      <div
                        key={color}
                        onClick={() => setSubBgColor(color)}
                        style={{
                          width: "20px", height: "20px", borderRadius: "50%",
                          backgroundColor: color, cursor: "pointer",
                          border: subBgColor === color ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                          boxShadow: subBgColor === color ? "0 0 0 2px #fff inset" : "none"
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Bg Opacity ({subBgOpacity}%)</span>
                  <input
                    type="range"
                    min="0" max="100"
                    value={subBgOpacity}
                    onChange={(e) => setSubBgOpacity(e.target.value)}
                    style={{ width: "100px", cursor: "pointer" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Font Size ({subFontSize}px)</span>
                  <input
                    type="range"
                    min="14" max="48"
                    value={subFontSize}
                    onChange={(e) => setSubFontSize(e.target.value)}
                    style={{ width: "100px", cursor: "pointer" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Margin Bottom ({subMarginBottom}px)</span>
                  <input
                    type="range"
                    min="0" max="100"
                    value={subMarginBottom}
                    onChange={(e) => setSubMarginBottom(e.target.value)}
                    style={{ width: "100px", cursor: "pointer" }}
                  />
                </div>

                {/* Burn-in Button */}
                <button
                  onClick={handleDownloadHardcoded}
                  disabled={contentState.isFfmpegRunning || contentState.downloading}
                  style={{
                    ...applyButtonStyle(contentState.isFfmpegRunning || contentState.downloading),
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#10b981", // distinct green color
                  }}
                >
                  <AnimatedIcon animation="none">
                    <Download size={16} />
                  </AnimatedIcon>
                  {contentState.isFfmpegRunning ? `Rendering Video (${contentState.processingProgress || 0}%)` : "Hardcode & Download Video"}
                </button>

                <div style={{ marginTop: "4px", fontSize: "11px", color: "#64748b", fontStyle: "italic", lineHeight: "1.4", textAlign: "center" }}>
                  * The live preview is shown on the video player above. These styles will be hardcoded into the video when downloading.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Chat with Video (Spark AI) ─── */}
        {segments && transcript && (
          <div
            role="button"
            className={styles.button}
            onClick={() => openSparkAI(segments, contentState.title)}
            style={{ cursor: "pointer", transition: "opacity 0.2s ease" }}
          >
            <div className={styles.buttonLeft}>
              <AnimatedIcon animation="none">
                <SparkAIIcon size={20} />
              </AnimatedIcon>
            </div>
            <div className={styles.buttonMiddle}>
              <div className={styles.buttonTitle}>Chat with Video</div>
              <div className={styles.buttonDescription} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                Ask AI anything about this recording
              </div>
            </div>
          </div>
        )}

        {/* 3. Summarize — result appears inline below */}
        {renderButton({
          Icon: summary ? BlackNoteIcon : FileText,
          title: summary ? "Save Summary" : "Summarize Video",
          description: summary
            ? "Save to BlackNote"
            : activeTask === "summarize"
              ? "Reading transcript..."
              : "Get a quick summary of the video.",
          onClick: summary
            ? () => sendToBlackNote("Video Summary", summary)
            : handleSummarize,
          taskKey: "summarize",
          disabled: locked || (isProcessing && activeTask !== "summarize"),
          showLockText: locked,
        })}
        {renderResultOrSkeleton(
          summary && (
            <>
              <strong>Summary:</strong>
              <div
                style={{ marginTop: "4px", lineHeight: "1.5" }}
                dangerouslySetInnerHTML={{ __html: marked.parse(summary) }}
              />
            </>
          ),
          "summarize"
        )}

        {/* 4. Key Takeaways — result appears inline below */}
        {renderButton({
          Icon: actionItems ? BlackNoteIcon : ListChecks,
          title: actionItems ? "Save Takeaways" : "Key Takeaways",
          description: actionItems
            ? "Save to BlackNote"
            : activeTask === "action-items"
              ? "Analyzing transcript..."
              : "Extract bullet points & to-dos.",
          onClick: actionItems
            ? () => sendToBlackNote("Video Key Takeaways", actionItems)
            : handleActionItems,
          taskKey: "action-items",
          disabled: locked || (isProcessing && activeTask !== "action-items"),
          showLockText: locked,
        })}
        {renderResultOrSkeleton(
          actionItems && (
            <>
              <strong>Key Takeaways:</strong>
              <div
                style={{ marginTop: "4px", lineHeight: "1.5" }}
                dangerouslySetInnerHTML={{ __html: marked.parse(actionItems) }}
              />
            </>
          ),
          "action-items"
        )}

        {/* 5. Smart Title — result appears inline below */}
        {renderButton({
          Icon: titleData ? BlackNoteIcon : TextSelect,
          title: titleData ? "Save Title" : "Smart Title & Details",
          description: titleData
            ? "Save to BlackNote"
            : activeTask === "title"
              ? "Crafting metadata..."
              : "Generate YouTube-ready title.",
          onClick: titleData
            ? () => sendToBlackNote(titleData.title, `**${titleData.title}**\n\n${titleData.description}`)
            : handleGenerateTitle,
          taskKey: "title",
          disabled: locked || (isProcessing && activeTask !== "title"),
          showLockText: locked,
        })}
        {renderResultOrSkeleton(
          titleData && (
            <>
              <strong>Title:</strong>
              <p style={{ marginTop: "4px", fontSize: "15px", fontWeight: "bold" }}>
                {titleData.title}
              </p>
              <strong style={{ display: "block", marginTop: "8px" }}>Description:</strong>
              <p style={{ marginTop: "4px", lineHeight: "1.5" }}>{titleData.description}</p>
            </>
          ),
          "title"
        )}
      </div>
    </div>
  );
};

export default AIPanel;
