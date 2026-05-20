import React, { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { contentStateContext } from "../../context/ContentState";
import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";

setWasmUrl(chrome.runtime.getURL("assets/dotlottie-player.wasm"));

/**
 * Lucide-style SVG icons — each feature gets a unique icon.
 */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

import { MicIcon, FileTextIcon, SparklesIcon, LanguagesIcon, ZapIcon, CircleCheckIcon, LogoutIcon, LoaderPinwheelIcon } from "lucide-animated";
import { AnimatedIcon } from "../../components/AnimatedIcon";

const GeminiIcon = ({ size = 40 }) => {
  const url =
    "chrome-extension://" +
    chrome.i18n.getMessage("@@extension_id") +
    "/assets/gemini-color.svg";
  return (
    <img
      src={url}
      alt="AI"
      width={size}
      height={size}
      style={{ display: "block", pointerEvents: "none" }}
      draggable={false}
    />
  );
};

// 3D Apple style card foundation with box-sizing border-box to prevent overflow
const bentoCardStyle = (bg, borderColor) => ({
  background: bg,
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.9)",
  display: "flex",
  boxSizing: "border-box", // Essential to prevent height spillover
  userSelect: "none",
  cursor: "pointer",
  overflow: "hidden",
});

// ─── Guest View (Not logged in) ─────────────────────────────────────
const GuestView = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);

  const handleLoginClick = () => {
    setIsLoggingIn(true);
    chrome.runtime.sendMessage({ type: "handle-login" }).catch(() => {});
    setTimeout(() => setIsLoggingIn(false), 10000);
  };

  return (
    <div style={{ padding: "12px 14px", boxSizing: "border-box" }}>
      <style>{`
        .bento-icon-mic svg {
          color: #6366F1 !important;
          stroke: #6366F1 !important;
          display: block !important;
          width: 26px !important;
          height: 26px !important;
          margin: 0 !important;
        }
        .bento-icon-file svg {
          color: #ea580c !important;
          stroke: #ea580c !important;
          display: block !important;
          width: 16px !important;
          height: 16px !important;
          margin: 0 !important;
        }
        .bento-icon-sparkles svg {
          color: #db2777 !important;
          stroke: #db2777 !important;
          display: block !important;
          width: 16px !important;
          height: 16px !important;
          margin: 0 !important;
        }
        .bento-icon-languages svg {
          color: #3b82f6 !important;
          stroke: #3b82f6 !important;
          display: block !important;
          width: 18px !important;
          height: 18px !important;
          margin: 0 !important;
        }
      `}</style>
      {/* Bento Header */}
      <div style={{
        ...bentoCardStyle("linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(219, 39, 119, 0.03) 50%, rgba(255, 255, 255, 0.8) 100%)", "rgba(99, 102, 241, 0.08)"),
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 12px",
        marginBottom: "10px",
        cursor: "default",
        boxShadow: "0 6px 20px -4px rgba(99, 102, 241, 0.1), 0 4px 12px -3px rgba(219, 39, 119, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "6px",
        }}>
          <GeminiIcon size={32} />
        </div>
        <h3 style={{
          fontSize: "14px",
          fontFamily: '"Satoshi-Bold", sans-serif',
          color: "#1e293b",
          margin: "0 0 2px",
          letterSpacing: "-0.01em",
        }}>Unlock AI Features</h3>
        <p style={{ fontSize: "11px", color: "#64748b", margin: 0, fontFamily: '"Satoshi-Medium", sans-serif', textAlign: "center" }}>
          Supercharge your workflow with advanced AI options
        </p>
      </div>

      {/* Bento Grid: Asymmetric Height-Aligned Layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
        
        {/* Row 1: Asymmetric split (Transcription left, Summarize + Titles right) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "10px", height: "140px" }}>
          
          {/* Card 1: Transcription (Left column, tall) */}
          <motion.div
            className="bento-card-item"
            whileHover={{ y: -2.5, boxShadow: "0 8px 24px -4px rgba(99, 102, 241, 0.24), inset 0 1.5px 1.5px #ffffff" }}
            whileTap={{ y: 1, boxShadow: "0 2px 4px rgba(99, 102, 241, 0.04), inset 0 1px 1px rgba(0, 0, 0, 0.05)" }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            style={{
              ...bentoCardStyle("linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(255, 255, 255, 0.85) 100%)", "rgba(99, 102, 241, 0.16)"),
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              padding: "12px 14px",
              boxShadow: "0 4px 14px -3px rgba(99, 102, 241, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.9)",
            }}
          >
            <div 
              className="bento-icon-mic"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(255, 255, 255, 0.95) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(99, 102, 241, 0.18), inset 0 1px 2px rgba(255, 255, 255, 1)",
                flexShrink: 0,
              }}
            >
              <AnimatedIcon animation="none">
                <MicIcon size={26} color="#6366F1" strokeWidth={2.5} />
              </AnimatedIcon>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b", letterSpacing: "-0.015em" }}>AI Transcribe</div>
              <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px", lineHeight: "1.3", fontFamily: '"Satoshi-Medium", sans-serif' }}>
                Speech-to-text
              </div>
            </div>
          </motion.div>

          {/* Right column: Stack of Summarize and Titles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>
            
            {/* Card 2: Summarize (Right top) */}
            <motion.div
              className="bento-card-item"
              whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.22), inset 0 1.5px 1.5px #ffffff" }}
              whileTap={{ y: 1, boxShadow: "0 2px 4px rgba(234, 88, 12, 0.04), inset 0 1px 1px rgba(0, 0, 0, 0.05)" }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              style={{
                ...bentoCardStyle("linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(255, 255, 255, 0.85) 100%)", "rgba(234, 88, 12, 0.14)"),
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                boxShadow: "0 4px 14px -3px rgba(234, 88, 12, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
              }}
            >
              <div 
                className="bento-icon-file"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(234, 88, 12, 0.22) 0%, rgba(255, 255, 255, 0.95) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 4px 10px rgba(234, 88, 12, 0.18), inset 0 1px 2px rgba(255, 255, 255, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AnimatedIcon animation="none">
                  <FileTextIcon size={16} color="#ea580c" strokeWidth={2.5} />
                </AnimatedIcon>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>AI Summary</div>
                <div style={{ fontSize: "11px", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px", fontFamily: '"Satoshi-Medium", sans-serif' }}>Key takeaways</div>
              </div>
            </motion.div>

            {/* Card 3: Smart Titles (Right bottom) */}
            <motion.div
              className="bento-card-item"
              whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(219, 39, 119, 0.22), inset 0 1.5px 1.5px #ffffff" }}
              whileTap={{ y: 1, boxShadow: "0 2px 4px rgba(219, 39, 119, 0.04), inset 0 1px 1px rgba(0, 0, 0, 0.05)" }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              style={{
                ...bentoCardStyle("linear-gradient(135deg, rgba(219, 39, 119, 0.08) 0%, rgba(255, 255, 255, 0.85) 100%)", "rgba(219, 39, 119, 0.14)"),
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                boxShadow: "0 4px 14px -3px rgba(219, 39, 119, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
              }}
            >
              <div 
                className="bento-icon-sparkles"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(219, 39, 119, 0.22) 0%, rgba(255, 255, 255, 0.95) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 4px 10px rgba(219, 39, 119, 0.18), inset 0 1px 2px rgba(255, 255, 255, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AnimatedIcon animation="none">
                  <SparklesIcon size={16} color="#db2777" strokeWidth={2.5} />
                </AnimatedIcon>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Smart Titles</div>
                <div style={{ fontSize: "11px", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px", fontFamily: '"Satoshi-Medium", sans-serif' }}>SEO metadata</div>
              </div>
            </motion.div>

          </div>

        </div>

        {/* Row 2: Translation (Full width, slim) */}
        <motion.div
          className="bento-card-item"
          whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(59, 130, 246, 0.24), inset 0 1.5px 1.5px #ffffff" }}
          whileTap={{ y: 1, boxShadow: "0 2px 4px rgba(59, 130, 246, 0.04), inset 0 1px 1px rgba(0, 0, 0, 0.05)" }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          style={{
            ...bentoCardStyle("linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.85) 100%)", "rgba(59, 130, 246, 0.16)"),
            height: "58px",
            flexDirection: "row",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            boxShadow: "0 4px 14px -3px rgba(59, 130, 246, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
          }}
        >
          <div 
            className="bento-icon-languages"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.22) 0%, rgba(255, 255, 255, 0.95) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 4px 10px rgba(59, 130, 246, 0.18), inset 0 1px 2px rgba(255, 255, 255, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AnimatedIcon animation="none">
              <LanguagesIcon size={18} color="#3b82f6" strokeWidth={2.5} />
            </AnimatedIcon>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b" }}>AI Translation</div>
            <div style={{ fontSize: "11px", color: "#475569", marginTop: "2.5px", fontFamily: '"Satoshi-Medium", sans-serif', whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Translate video
            </div>
          </div>
        </motion.div>

      </div>

      {/* Login CTA */}
      <button
        onClick={handleLoginClick}
        disabled={isLoggingIn}
        style={{
          width: "100%",
          height: "40px",
          background: isLoggingIn 
            ? "#f8fafc" 
            : (loginHovered 
                ? "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" 
                : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"),
          color: "#1e293b",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          borderRadius: "9999px",
          fontSize: "13px",
          fontFamily: '"Satoshi-Bold", sans-serif',
          cursor: isLoggingIn ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s ease",
          boxSizing: "border-box",
          boxShadow: loginHovered 
            ? "0 6px 16px -3px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04), inset 0 1px 1.5px rgba(255, 255, 255, 1)"
            : "0 3px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 3px -1px rgba(15, 23, 42, 0.03), inset 0 1px 1px rgba(255, 255, 255, 1)",
          transform: loginHovered ? "translateY(-1px)" : "translateY(0px)",
        }}
        onMouseEnter={() => setLoginHovered(true)}
        onMouseLeave={() => setLoginHovered(false)}
        onMouseDown={(e) => {
          if (!isLoggingIn) {
            e.currentTarget.style.transform = "translateY(1px)";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02), inset 0 1px 1px rgba(0, 0, 0, 0.05)";
          }
        }}
        onMouseUp={(e) => {
          if (!isLoggingIn) {
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
      >
        {isLoggingIn ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
            style={{
              width: "14px",
              height: "14px",
              border: "2px solid rgba(71, 85, 105, 0.2)",
              borderTopColor: "#475569",
              borderRadius: "50%",
              display: "inline-block",
              boxSizing: "border-box",
            }}
          />
        ) : (
          <GoogleLogo />
        )}
        {isLoggingIn ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
};

// ─── Greeting message based on user tier ─────────────────────────────
const getGreetingMessage = (isPro, quotaExhausted) => {
  if (isPro && quotaExhausted) {
    return "AI quota exceeded, renews next month";
  }
  if (isPro) {
    return "Thank you for supporting us! 💜";
  }
  return "Upgrade to unlock unlimited AI features";
};

// ─── Logged-In View ──────────────────────────────────────────────────
const LoggedInView = ({ user, isPro, quotaExhausted, onLogout }) => {
  const [logoutHovered, setLogoutHovered] = useState(false);
  const firstName = (user?.name || user?.displayName || "User").split(" ")[0];

  return (
    <div style={{ padding: "12px 14px", boxSizing: "border-box" }}>
      <style>{`
        .bento-icon-mic svg {
          color: #6366F1 !important;
          stroke: #6366F1 !important;
          display: block !important;
          width: 26px !important;
          height: 26px !important;
          margin: 0 !important;
        }
        .bento-icon-file svg {
          color: #ea580c !important;
          stroke: #ea580c !important;
          display: block !important;
          width: 16px !important;
          height: 16px !important;
          margin: 0 !important;
        }
        .bento-icon-sparkles svg {
          color: #db2777 !important;
          stroke: #db2777 !important;
          display: block !important;
          width: 16px !important;
          height: 16px !important;
          margin: 0 !important;
        }
        .bento-icon-languages svg {
          color: #3b82f6 !important;
          stroke: #3b82f6 !important;
          display: block !important;
          width: 18px !important;
          height: 18px !important;
          margin: 0 !important;
        }
        .status-check-circle svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
          display: block !important;
        }
      `}</style>
      {/* Greeting Section */}
      <div style={{
        ...bentoCardStyle("linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(219, 39, 119, 0.03) 50%, rgba(255, 255, 255, 0.8) 100%)", "rgba(99, 102, 241, 0.08)"),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        marginBottom: "10px",
        cursor: "default",
        boxShadow: "0 6px 20px -4px rgba(99, 102, 241, 0.1), 0 4px 12px -3px rgba(219, 39, 119, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "16px",
            fontFamily: '"Satoshi-Bold", sans-serif',
            color: "#1e293b",
            letterSpacing: "-0.02em",
            lineHeight: "1.2",
          }}>
            Hello, {firstName} 👋
          </div>
          <div style={{
            fontSize: "11px",
            color: "#64748b",
            marginTop: "4px",
            lineHeight: "1.3",
            fontFamily: '"Satoshi-Medium", sans-serif',
          }}>
            {getGreetingMessage(isPro, quotaExhausted)}
          </div>
        </div>
        
        {/* Tier badge / Upgrade CTA */}
        <div style={{ flexShrink: 0, marginLeft: "10px" }}>
          {isPro ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px" }}>
              <DotLottieReact src={chrome.runtime.getURL("assets/crown.json")} autoplay loop backgroundColor="transparent" style={{ width: "100%", height: "100%" }} />
            </div>
          ) : (
            <button
              onClick={() => {
                chrome.runtime.sendMessage({ type: "handle-upgrade" }).catch(() => {});
              }}
              style={{
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
                width: "80px",
                height: "26px",
                display: "block",
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <DotLottieReact src={chrome.runtime.getURL("assets/go-premium.json")} autoplay loop backgroundColor="transparent" style={{ width: "100%", height: "100%", pointerEvents: "none" }} />
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
        
        {/* Row 1: Asymmetric split (Transcription left, Summarize + Titles right) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "10px", height: "140px" }}>
          
          {/* Card 1: Transcription (Left column, tall) */}
          <motion.div
            className="bento-card-item"
            whileHover={{ y: -2.5, boxShadow: "0 8px 24px -4px rgba(99, 102, 241, 0.24), inset 0 1.5px 1.5px #ffffff" }}
            whileTap={{ y: 1, boxShadow: "0 2px 4px rgba(99, 102, 241, 0.04), inset 0 1px 1px rgba(0, 0, 0, 0.05)" }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            style={{
              ...bentoCardStyle("linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(255, 255, 255, 0.85) 100%)", "rgba(99, 102, 241, 0.16)"),
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              padding: "12px 14px",
              boxShadow: "0 4px 14px -3px rgba(99, 102, 241, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%",
            }}>
              <div 
                className="bento-icon-mic"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(255, 255, 255, 0.95) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(99, 102, 241, 0.18), inset 0 1px 2px rgba(255, 255, 255, 1)",
                  flexShrink: 0,
                }}
              >
                <AnimatedIcon animation="none">
                  <MicIcon size={26} color="#6366F1" strokeWidth={2.5} />
                </AnimatedIcon>
              </div>
              <span style={{
                fontSize: "7.5px",
                fontFamily: '"Satoshi-Bold", sans-serif',
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                color: "#ffffff",
                padding: "2px 5px",
                borderRadius: "4.5px",
                boxShadow: "0 2px 4px rgba(99, 102, 241, 0.25)",
              }}>PRO</span>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b", letterSpacing: "-0.015em" }}>AI Transcribe</div>
              <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px", lineHeight: "1.3", fontFamily: '"Satoshi-Medium", sans-serif' }}>
                Speech-to-text
              </div>
            </div>
          </motion.div>

          {/* Right column: Stack of Summarize and Titles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>
            
            {/* Card 2: Summarize (Right top) */}
            <motion.div
              className="bento-card-item"
              whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.22), inset 0 1.5px 1.5px #ffffff" }}
              whileTap={{ y: 1, boxShadow: "0 2px 4px rgba(234, 88, 12, 0.04), inset 0 1px 1px rgba(0, 0, 0, 0.05)" }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              style={{
                ...bentoCardStyle("linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(255, 255, 255, 0.85) 100%)", "rgba(234, 88, 12, 0.14)"),
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                boxShadow: "0 4px 14px -3px rgba(234, 88, 12, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
              }}
            >
              <div 
                className="bento-icon-file"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(234, 88, 12, 0.22) 0%, rgba(255, 255, 255, 0.95) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 4px 10px rgba(234, 88, 12, 0.18), inset 0 1px 2px rgba(255, 255, 255, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AnimatedIcon animation="none">
                  <FileTextIcon size={16} color="#ea580c" strokeWidth={2.5} />
                </AnimatedIcon>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>AI Summary</div>
                <div style={{ fontSize: "11px", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px", fontFamily: '"Satoshi-Medium", sans-serif' }}>
                  Key takeaways
                </div>
              </div>
            </motion.div>

            {/* Card 3: Smart Titles (Right bottom) */}
            <motion.div
              className="bento-card-item"
              whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(219, 39, 119, 0.22), inset 0 1.5px 1.5px #ffffff" }}
              whileTap={{ y: 1, boxShadow: "0 2px 4px rgba(219, 39, 119, 0.04), inset 0 1px 1px rgba(0, 0, 0, 0.05)" }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              style={{
                ...bentoCardStyle("linear-gradient(135deg, rgba(219, 39, 119, 0.08) 0%, rgba(255, 255, 255, 0.85) 100%)", "rgba(219, 39, 119, 0.14)"),
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                boxShadow: "0 4px 14px -3px rgba(219, 39, 119, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
              }}
            >
              <div 
                className="bento-icon-sparkles"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(219, 39, 119, 0.22) 0%, rgba(255, 255, 255, 0.95) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 4px 10px rgba(219, 39, 119, 0.18), inset 0 1px 2px rgba(255, 255, 255, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AnimatedIcon animation="none">
                  <SparklesIcon size={16} color="#db2777" strokeWidth={2.5} />
                </AnimatedIcon>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Smart Titles</div>
                <div style={{ fontSize: "11px", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px", fontFamily: '"Satoshi-Medium", sans-serif' }}>
                  SEO metadata
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Row 2: Translation (Full width, slim) */}
        <motion.div
          className="bento-card-item"
          whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(59, 130, 246, 0.24), inset 0 1.5px 1.5px #ffffff" }}
          whileTap={{ y: 1, boxShadow: "0 2px 4px rgba(59, 130, 246, 0.04), inset 0 1px 1px rgba(0, 0, 0, 0.05)" }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          style={{
            ...bentoCardStyle("linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.85) 100%)", "rgba(59, 130, 246, 0.16)"),
            height: "58px",
            flexDirection: "row",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            boxShadow: "0 4px 14px -3px rgba(59, 130, 246, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
          }}
        >
          <div 
            className="bento-icon-languages"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.22) 0%, rgba(255, 255, 255, 0.95) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 4px 10px rgba(59, 130, 246, 0.18), inset 0 1px 2px rgba(255, 255, 255, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AnimatedIcon animation="none">
              <LanguagesIcon size={18} color="#3b82f6" strokeWidth={2.5} />
            </AnimatedIcon>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b" }}>AI Translation</div>
            <div style={{ fontSize: "11px", color: "#475569", marginTop: "2.5px", fontFamily: '"Satoshi-Medium", sans-serif', whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Translate video
            </div>
          </div>
          {/* Status Check Icon */}
          <div 
            className="status-check-circle"
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#3b82f6",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 1px 3px rgba(59, 130, 246, 0.1), inset 0 0.5px 0.5px #ffffff",
            }}
          >
            <CircleCheckIcon 
              size={10} 
              color="#ffffff" 
              strokeWidth={3} 
              style={{ 
                display: "flex", 
                color: "#ffffff !important", 
                stroke: "#ffffff !important" 
              }} 
            />
          </div>
        </motion.div>

      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          width: "100%",
          height: "38px",
          background: logoutHovered 
            ? "linear-gradient(135deg, #fff5f5 0%, #ffebeb 100%)" 
            : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          color: logoutHovered ? "#ef4444" : "#475569",
          border: logoutHovered ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(255, 255, 255, 0.9)",
          borderRadius: "9999px",
          fontSize: "12.5px",
          fontFamily: '"Satoshi-Bold", sans-serif',
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxSizing: "border-box",
          boxShadow: logoutHovered 
            ? "0 6px 16px -3px rgba(239, 68, 68, 0.12), 0 2px 6px -1px rgba(239, 68, 68, 0.06), inset 0 1px 1.5px rgba(255, 255, 255, 1)"
            : "0 3px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 3px -1px rgba(15, 23, 42, 0.03), inset 0 1px 1px rgba(255, 255, 255, 1)",
          transform: logoutHovered ? "translateY(-1px)" : "translateY(0px)",
        }}
        onMouseEnter={() => setLogoutHovered(true)}
        onMouseLeave={() => setLogoutHovered(false)}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "translateY(1px)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(0, 0, 0, 0.05)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
      >
        <AnimatedIcon animation="none"><LogoutIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={15} strokeWidth={2.5} /></AnimatedIcon>
        Sign out
      </button>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────
const AccountTab = () => {
  const [contentState, setContentState] = useContext(contentStateContext);

  const isLoggedIn = contentState.isLoggedIn;
  const isPro = isLoggedIn && contentState.isSubscribed;
  const user = contentState.aisrUser;

  const [quotaExhausted, setQuotaExhausted] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["quotaExhausted"], (res) => {
      setQuotaExhausted(res.quotaExhausted || false);
    });
    
    const handleStorageChange = (changes, areaName) => {
      if (areaName === "local" && changes.quotaExhausted) {
        setQuotaExhausted(changes.quotaExhausted.newValue || false);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: "handle-logout" }).catch(() => {});
    setContentState((prev) => ({
      ...prev,
      isLoggedIn: false,
      isSubscribed: false,
      aisrUser: null,
      proSubscription: null,
      wasLoggedIn: false,
    }));
  };

  if (!isLoggedIn) {
    return <GuestView />;
  }

  return (
    <LoggedInView
      user={user}
      isPro={isPro}
      quotaExhausted={quotaExhausted}
      onLogout={handleLogout}
    />
  );
};

export default AccountTab;
