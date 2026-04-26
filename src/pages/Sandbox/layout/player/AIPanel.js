import React, { useContext, useState, useEffect, useCallback } from "react";
import { marked } from "marked";
import styles from "../../styles/player/_RightPanel.module.scss";
import { ContentStateContext } from "../../context/ContentState";
import { LANGUAGE_GROUPS, getSupportedLanguages } from "./aiUtils";
import {
  Sparkles,
  AudioLines,
  Languages,
  FileText,
  ListChecks,
  TextSelect,
  Lock,
  Download,
  ChevronRight,
  ChevronDown,
  Search,
  Info,
  LogIn,
  Crown,
  AlertTriangle,
} from "lucide-react";

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
        <ChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} />
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
            <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
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
          <Info size={14} style={{ flexShrink: 0 }} />
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
            <LogIn size={12} /> Sign in
          </button>
        </div>
      );
    }

    if (userTier === "free") {
      return (
        <div style={errorBannerStyle("#fffbeb", "#92400e")}>
          <Crown size={14} style={{ flexShrink: 0 }} />
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
            <Crown size={12} /> Upgrade
          </button>
        </div>
      );
    }

    // Pro tier — quota exhausted
    return (
      <div style={errorBannerStyle("#f0f9ff", "#0369a1")}>
        <Info size={14} style={{ flexShrink: 0 }} />
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
        <Icon size={20} strokeWidth={2} color={disabled ? "#94a3b8" : "#6366f1"} />
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
              <Lock size={12} /> Generate subtitles first
            </>
          ) : (
            description
          )}
        </div>
      </div>
      <div className={styles.buttonRight} style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {rightAction || <ChevronRight size={20} strokeWidth={2} color="#cbd5e1" />}
      </div>
    </div>
  );

  const renderResultCard = (content, bgColor, borderColor, textColor) => {
    if (!content) return null;
    return (
      <div
        style={{
          padding: "12px",
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: "10px",
          fontSize: "13px",
          color: textColor,
          maxHeight: "160px",
          overflowY: "auto",
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
      <div
        className={styles.sectionTitle}
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <Sparkles size={18} color="#eab308" fill="#fef08a" /> AI Intelligence
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
          title: segments ? "Regenerate Subtitles" : "Generate Subtitles",
          description:
            activeTask === "transcribe"
              ? "Gemini AI is processing..."
              : "Auto-transcribe & add subtitles to video.",
          onClick: handleTranscribe,
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
              <Download size={16} color="#475569" />
            </button>
          ) : undefined,
        })}

        {/* Subtitle status */}
        {subtitlesApplied && !translatedSegments && (
          <div style={statusStyle}>
            <Sparkles size={14} /> Subtitles applied to video!
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
              <Lock size={16} color="#94a3b8" />
            ) : (
              <Languages size={18} color="#3b82f6" />
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
                <Download size={18} color="#475569" />
              </button>
            )}
          </div>
          {subtitlesApplied && translatedSegments && (
            <div style={statusStyle}>
              <Sparkles size={14} /> Translated subtitles applied!
            </div>
          )}
        </div>

        {/* 3. Summarize — result appears inline below */}
        {renderButton({
          Icon: FileText,
          title: summary ? "Summary Generated" : "Summarize Video",
          description: summary
            ? "Summary is ready."
            : activeTask === "summarize"
            ? "Reading transcript..."
            : "Get a quick summary of the video.",
          onClick: handleSummarize,
          taskKey: "summarize",
          disabled: locked || !!summary,
          showLockText: locked,
        })}
        {renderResultCard(
          summary && (
            <>
              <strong>Summary:</strong>
              <div 
                style={{ marginTop: "4px", lineHeight: "1.5" }}
                dangerouslySetInnerHTML={{ __html: marked.parse(summary) }}
              />
            </>
          ),
          "#f0fdfa",
          "#ccfbf1",
          "#134e4a"
        )}

        {/* 4. Key Takeaways — result appears inline below */}
        {renderButton({
          Icon: ListChecks,
          title: actionItems ? "Key Takeaways Generated" : "Key Takeaways",
          description: actionItems
            ? "Takeaways are ready."
            : activeTask === "action-items"
            ? "Analyzing transcript..."
            : "Extract bullet points & to-dos.",
          onClick: handleActionItems,
          taskKey: "action-items",
          disabled: locked || !!actionItems,
          showLockText: locked,
        })}
        {renderResultCard(
          actionItems && (
            <>
              <strong>Key Takeaways:</strong>
              <div 
                style={{ marginTop: "4px", lineHeight: "1.5" }}
                dangerouslySetInnerHTML={{ __html: marked.parse(actionItems) }}
              />
            </>
          ),
          "#fffbeb",
          "#fde68a",
          "#92400e"
        )}

        {/* 5. Smart Title — result appears inline below */}
        {renderButton({
          Icon: TextSelect,
          title: titleData ? "Title Generated" : "Smart Title & Details",
          description: titleData
            ? "Title is ready."
            : activeTask === "title"
            ? "Crafting metadata..."
            : "Generate YouTube-ready title.",
          onClick: handleGenerateTitle,
          taskKey: "title",
          disabled: locked || !!titleData,
          showLockText: locked,
        })}
        {renderResultCard(
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
          "#fdf4ff",
          "#f5d0fe",
          "#4a044e"
        )}
      </div>
    </div>
  );
};

export default AIPanel;
