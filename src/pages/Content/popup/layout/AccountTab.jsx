import React, { useContext } from "react";
import { motion } from "framer-motion";
import { contentStateContext } from "../../context/ContentState";

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

// ─── AI Feature Item (no background, bigger icon) ───────────────────
const AIFeatureItem = ({ icon, title, description, available }) => (
  <div 
    role="button"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      borderRadius: "20px",
      border: "none",
      transition: "background 0.15s ease",
      cursor: "pointer",
    }}
    onMouseOver={(e) => e.currentTarget.style.background = "#F6F7FB"}
    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
  >
    <div style={{
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: "13px",
        fontWeight: "500",
        color: "#374151",
        lineHeight: "1.3",
      }}>{title}</div>
      <div style={{
        fontSize: "11.5px",
        color: "#6B7280",
        lineHeight: "1.4",
        marginTop: "1px",
      }}>{description}</div>
    </div>
    <AnimatedIcon animation="none"><CircleCheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={16} color={available ? "#4B5563" : "#D1D5DB"} strokeWidth={1.5} /></AnimatedIcon>
  </div>
);

// ─── Guest View (Not logged in) ─────────────────────────────────────
const GuestView = () => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLoginClick = () => {
    setIsLoggingIn(true);
    chrome.runtime.sendMessage({ type: "handle-login" }).catch(() => {});
    // Reset after 10s in case the auth window is closed without completing
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
        }}>AI-Powered Recording</h3>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        marginBottom: "14px",
      }}>
        <AIFeatureItem
          icon={<AnimatedIcon animation="none"><MicIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
          title="Smart Transcription"
          description="Auto-transcribe recordings with AI"
          available={true}
        />
        <AIFeatureItem
          icon={<AnimatedIcon animation="none"><FileTextIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
          title="AI Summarization"
          description="Get key points from long videos"
          available={true}
        />
        <AIFeatureItem
          icon={<AnimatedIcon animation="none"><SparklesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
          title="Smart Titles"
          description="Auto-generate titles & descriptions"
          available={true}
        />
        <AIFeatureItem
          icon={<AnimatedIcon animation="none"><LanguagesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
          title="Translation"
          description="Multi-language subtitle support"
          available={true}
        />
      </div>

      {/* Login CTA */}
      <button
        onClick={handleLoginClick}
        disabled={isLoggingIn}
        style={{
          width: "100%",
          height: "44px",
          background: "#F3F4F6",
          color: isLoggingIn ? "#9CA3AF" : "#374151",
          border: "1px solid #E5E7EB",
          borderRadius: "99px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: isLoggingIn ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s ease",
        }}
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

      <p style={{
        fontSize: "11px",
        color: "#9CA3AF",
        textAlign: "center",
        margin: "10px 0 0",
        lineHeight: "1.4",
      }}>
        Free features available without sign-in
      </p>
    </div>
  );
};

// ─── Logged-In View ──────────────────────────────────────────────────
const LoggedInView = ({ user, isPro, onLogout }) => (
  <div style={{ padding: "16px" }}>
    {/* Profile Card */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px",
      background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
      borderRadius: "14px",
      marginBottom: "14px",
    }}>
      <img
        src={user?.avatar || user?.picture || ""}
        alt=""
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          objectFit: "cover",
          border: "2px solid #E5E7EB",
        }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "14px",
          fontWeight: "600",
          color: "#111827",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {user?.name || user?.displayName || "User"}
        </div>
        <div style={{
          fontSize: "12px",
          color: "#6B7280",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {user?.email || ""}
        </div>
      </div>
      {/* Tier Badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "99px",
        background: "#F3F4F6",
        fontSize: "11px",
        fontWeight: "700",
        color: "#6B7280",
        letterSpacing: "0.02em",
      }}>
        {isPro ? "PRO" : "FREE"}
      </div>
    </div>

    {/* AI Features */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      marginBottom: "14px",
    }}>
      <div style={{
        fontSize: "12px",
        fontWeight: "600",
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: "0 4px 4px",
      }}>AI Features</div>
      <AIFeatureItem
        icon={<AnimatedIcon animation="none"><MicIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
        title="Smart Transcription"
        description={isPro ? "Vertex AI — high accuracy" : "Limited usage"}
        available={true}
      />
      <AIFeatureItem
        icon={<AnimatedIcon animation="none"><FileTextIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
        title="AI Summarization"
        description={isPro ? "Advanced analysis" : "Limited usage"}
        available={true}
      />
      <AIFeatureItem
        icon={<AnimatedIcon animation="none"><SparklesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
        title="Smart Titles"
        description={isPro ? "Premium quality" : "Limited usage"}
        available={true}
      />
      <AIFeatureItem
        icon={<AnimatedIcon animation="none"><LanguagesIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }} size={20} strokeWidth={1.5} /></AnimatedIcon>}
        title="Translation"
        description={isPro ? "Unlimited" : "Limited usage"}
        available={true}
      />
    </div>

    {/* Upgrade Button (only for free users) */}
    {!isPro && (
      <button
        onClick={() => {
          chrome.runtime.sendMessage({ type: "handle-upgrade" }).catch(() => {});
        }}
        style={{
          width: "100%",
          height: "42px",
          background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontSize: "13px",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
          marginBottom: "10px",
          letterSpacing: "0.02em",
        }}
      >
        <AnimatedIcon animation="none"><ZapIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} strokeWidth={2} /></AnimatedIcon>
        UPGRADE TO PRO
      </button>
    )}

    {/* Logout */}
    <button
      onClick={onLogout}
      style={{
        width: "100%",
        height: "36px",
        background: "transparent",
        color: "#6B7280",
        border: "1px solid #E5E7EB",
        borderRadius: "10px",
        fontSize: "12.5px",
        fontWeight: "500",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        transition: "all 0.15s ease",
      }}
    >
      <AnimatedIcon animation="none"><LogoutIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={13} strokeWidth={2} /></AnimatedIcon>
      Sign out
    </button>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────
const AccountTab = () => {
  const [contentState, setContentState] = useContext(contentStateContext);

  const isLoggedIn = contentState.isLoggedIn;
  const isPro = isLoggedIn && contentState.isSubscribed;
  const user = contentState.aisrUser;

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
      onLogout={handleLogout}
    />
  );
};

export default AccountTab;
