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

// ─── AI Feature Item with gradient background ─────────────────────────
const AIFeatureItem = ({ icon, title, description, available, colorRgb = "59, 130, 246", isLast = false }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <div 
        role="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "12px 14px",
          borderRadius: "14px",
          // Gradient background matching icon color, fading on both sides
          background: hovered
            ? `linear-gradient(90deg, rgba(${colorRgb}, 0) 0%, rgba(${colorRgb}, 0.08) 30%, rgba(${colorRgb}, 0.08) 70%, rgba(${colorRgb}, 0) 100%)`
            : `linear-gradient(90deg, rgba(${colorRgb}, 0) 0%, rgba(${colorRgb}, 0.04) 30%, rgba(${colorRgb}, 0.04) 70%, rgba(${colorRgb}, 0) 100%)`,
          transition: "all 0.25s ease",
          cursor: "pointer",
          transform: hovered ? "scale(1.01)" : "scale(1)",
        }}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
      >
        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: `linear-gradient(135deg, rgba(${colorRgb}, 0.14) 0%, rgba(${colorRgb}, 0.05) 100%)`,
          border: `1px solid rgba(${colorRgb}, 0.1)`,
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#1F2937",
            lineHeight: "1.3",
          }}>{title}</div>
          <div style={{
            fontSize: "11.5px",
            color: "#6B7280",
            lineHeight: "1.4",
            marginTop: "2px",
          }}>{description}</div>
        </div>
        {available && (
          <div style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "rgba(52, 211, 153, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <AnimatedIcon animation="none">
              <CircleCheckIcon size={14} color="#10B981" strokeWidth={2.5} style={{ display: "flex", alignItems: "center", justifyContent: "center" }} />
            </AnimatedIcon>
          </div>
        )}
      </div>
      {/* Gradient divider fading on both edges */}
      {!isLast && (
        <div style={{
          height: "1px",
          width: "85%",
          margin: "0 auto",
          background: `linear-gradient(90deg, rgba(${colorRgb}, 0) 0%, rgba(${colorRgb}, 0.15) 50%, rgba(${colorRgb}, 0) 100%)`,
        }} />
      )}
    </>
  );
};

// ─── Guest View (Not logged in) ─────────────────────────────────────
const GuestView = () => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLoginClick = () => {
    setIsLoggingIn(true);
    chrome.runtime.sendMessage({ type: "handle-login" }).catch(() => {});
    setTimeout(() => setIsLoggingIn(false), 10000);
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* Hero */}
      <div style={{
        textAlign: "center",
        padding: "4px 16px 12px",
      }}>
        <div style={{
          margin: "0 auto 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <GeminiIcon size={36} />
        </div>
        <h3 style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#374151",
          margin: "0 0 4px",
          letterSpacing: "-0.01em",
        }}>Unlock AI Features</h3>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "0px",
        marginBottom: "14px",
      }}>
        <AIFeatureItem
          icon={<AnimatedIcon animation="none"><MicIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
          title="Smart Transcription"
          description="Auto-transcribe recordings with AI"
          available={false}
          colorRgb="59, 130, 246"
        />
        <AIFeatureItem
          icon={<AnimatedIcon animation="none"><FileTextIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
          title="AI Summarization"
          description="Get key points from long videos"
          available={false}
          colorRgb="139, 92, 246"
        />
        <AIFeatureItem
          icon={<AnimatedIcon animation="none"><SparklesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
          title="Smart Titles"
          description="Auto-generate titles & descriptions"
          available={false}
          colorRgb="245, 158, 11"
        />
        <AIFeatureItem
          icon={<AnimatedIcon animation="none"><LanguagesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
          title="Translation"
          description="Multi-language subtitle support"
          available={false}
          colorRgb="16, 185, 129"
          isLast={true}
        />
      </div>

      {/* Login CTA — Apple-style pill button */}
      <button
        onClick={handleLoginClick}
        disabled={isLoggingIn}
        style={{
          width: "100%",
          height: "44px",
          background: "#FFFFFF",
          color: isLoggingIn ? "#9CA3AF" : "#111827",
          border: "1px solid #E5E7EB",
          borderRadius: "22px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: isLoggingIn ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05), inset 0 -2px 0 rgba(0,0,0,0.02)",
        }}
        onMouseOver={(e) => !isLoggingIn && (e.currentTarget.style.background = "#F9FAFB")}
        onMouseOut={(e) => !isLoggingIn && (e.currentTarget.style.background = "#FFFFFF")}
        onMouseDown={(e) => !isLoggingIn && (e.currentTarget.style.transform = "scale(0.98)")}
        onMouseUp={(e) => !isLoggingIn && (e.currentTarget.style.transform = "scale(1)")}
      >
        {isLoggingIn ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }}
          >
            <LoaderPinwheelIcon size={18} color="#9CA3AF" strokeWidth={2} style={{ display: "flex" }} />
          </motion.span>
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
  <div style={{ padding: "16px" }}>
    {/* Greeting Section — replaces the old profile card */}
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      padding: "4px 14px 14px",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#111827",
          letterSpacing: "-0.02em",
          lineHeight: "1.3",
        }}>
          Hello, {firstName} 👋
        </div>
        <div style={{
          fontSize: "12.5px",
          color: "#6B7280",
          marginTop: "4px",
          lineHeight: "1.4",
        }}>
          {getGreetingMessage(isPro, quotaExhausted)}
        </div>
      </div>
      {/* Tier badge / Upgrade CTA */}
      <div style={{ flexShrink: 0, marginLeft: "12px", marginTop: "2px" }}>
        {isPro ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "64px", height: "64px", marginTop: "-16px", marginRight: "-8px" }}>
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
              width: "100px",
              height: "32px",
              marginTop: "-4px"
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

    {/* AI Features with gradient backgrounds */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "0px",
      marginBottom: "14px",
    }}>
      <AIFeatureItem
        icon={<AnimatedIcon animation="none"><MicIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
        title="Smart Transcription"
        description={isPro && !quotaExhausted ? "Vertex AI — high accuracy" : "Limited usage"}
        available={true}
        colorRgb="59, 130, 246"
      />
      <AIFeatureItem
        icon={<AnimatedIcon animation="none"><FileTextIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
        title="AI Summarization"
        description={isPro && !quotaExhausted ? "Advanced analysis" : "Limited usage"}
        available={true}
        colorRgb="139, 92, 246"
      />
      <AIFeatureItem
        icon={<AnimatedIcon animation="none"><SparklesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
        title="Smart Titles"
        description={isPro && !quotaExhausted ? "Premium quality" : "Limited usage"}
        available={true}
        colorRgb="245, 158, 11"
      />
      <AIFeatureItem
        icon={<AnimatedIcon animation="none"><LanguagesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
        title="Translation"
        description={isPro && !quotaExhausted ? "Unlimited" : "Limited usage"}
        available={true}
        colorRgb="16, 185, 129"
        isLast={true}
      />
    </div>

    {/* Logout — Apple-style pill button */}
    <button
      onClick={onLogout}
      style={{
        width: "100%",
        height: "40px",
        background: logoutHovered ? "#FEF2F2" : "transparent",
        color: logoutHovered ? "#DC2626" : "#6B7280",
        border: logoutHovered ? "1px solid #FECACA" : "1px solid #E5E7EB",
        borderRadius: "22px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.2s ease",
        marginTop: "4px",
      }}
      onMouseOver={() => setLogoutHovered(true)}
      onMouseOut={() => setLogoutHovered(false)}
      onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
      onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      <AnimatedIcon animation="none"><LogoutIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={16} strokeWidth={2} /></AnimatedIcon>
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
