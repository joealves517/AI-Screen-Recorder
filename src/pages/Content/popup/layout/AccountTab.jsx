import React, { useContext } from "react";
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

// Mic icon — for Smart Transcription
const MicIcon = ({ size = 20, color = "#3080F8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

// FileText icon — for AI Summarization
const FileTextIcon = ({ size = 20, color = "#3080F8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    <line x1="10" x2="8" y1="9" y2="9"/>
    <line x1="16" x2="8" y1="13" y2="13"/>
    <line x1="16" x2="8" y1="17" y2="17"/>
  </svg>
);

// Wand icon — for Smart Titles
const WandIcon = ({ size = 20, color = "#3080F8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
    <path d="m14 7 3 3"/>
    <path d="M5 6v4"/><path d="M19 14v4"/>
    <path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/>
    <path d="M11 3H9"/>
  </svg>
);

// Languages icon — for Translation
const LanguagesIcon = ({ size = 20, color = "#3080F8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 8 6 6"/>
    <path d="m4 14 6-6 2-3"/>
    <path d="M2 5h12"/>
    <path d="M7 2h1"/>
    <path d="m22 22-5-10-5 10"/>
    <path d="M14 18h6"/>
  </svg>
);

const SparkleIcon = ({ size = 28, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
);

const CrownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-9-4 9-6-7z"/>
    <path d="M3 20h18"/>
  </svg>
);

const CheckCircleIcon = ({ size = 16, color = "#10B981" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="M22 4L12 14.01l-3-3"/>
  </svg>
);

const LogOutIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ─── AI Feature Item (no background, bigger icon) ───────────────────
const AIFeatureItem = ({ icon, title, description, available }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 8px",
    borderRadius: "10px",
    transition: "background 0.15s ease",
  }}>
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
        fontWeight: "600",
        color: "#111827",
        lineHeight: "1.3",
      }}>{title}</div>
      <div style={{
        fontSize: "11.5px",
        color: "#6B7280",
        lineHeight: "1.4",
        marginTop: "1px",
      }}>{description}</div>
    </div>
    <CheckCircleIcon color={available ? "#10B981" : "#D1D5DB"} />
  </div>
);

// ─── Guest View (Not logged in) ─────────────────────────────────────
const GuestView = () => (
  <div style={{ padding: "16px" }}>
    {/* Hero */}
    <div style={{
      textAlign: "center",
      padding: "24px 16px 20px",
    }}>
      <div style={{
        margin: "0 auto 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <SparkleIcon size={40} color="#3080F8" />
      </div>
      <h3 style={{
        fontSize: "17px",
        fontWeight: "700",
        color: "#111827",
        margin: "0 0 6px",
        letterSpacing: "-0.01em",
      }}>AI-Powered Recording</h3>
      <p style={{
        fontSize: "13px",
        color: "#6B7280",
        margin: 0,
        lineHeight: "1.5",
      }}>Sign in to unlock smarter features for your recordings</p>
    </div>

    {/* AI Features — each with a distinct Lucide icon */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      marginBottom: "18px",
    }}>
      <AIFeatureItem
        icon={<MicIcon size={22} color="#3080F8" />}
        title="Smart Transcription"
        description="Auto-transcribe recordings with AI"
        available={true}
      />
      <AIFeatureItem
        icon={<FileTextIcon size={22} color="#3080F8" />}
        title="AI Summarization"
        description="Get key points from long videos"
        available={true}
      />
      <AIFeatureItem
        icon={<WandIcon size={22} color="#3080F8" />}
        title="Smart Titles"
        description="Auto-generate titles & descriptions"
        available={true}
      />
      <AIFeatureItem
        icon={<LanguagesIcon size={22} color="#3080F8" />}
        title="Translation"
        description="Multi-language subtitle support"
        available={true}
      />
    </div>

    {/* Login CTA */}
    <button
      onClick={() => chrome.runtime.sendMessage({ type: "handle-login" })}
      style={{
        width: "100%",
        height: "44px",
        background: "#F3F4F6",
        color: "#374151",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.2s ease",
      }}
    >
      <GoogleLogo />
      Sign in with Google
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
        gap: "4px",
        padding: "4px 10px",
        borderRadius: "99px",
        background: isPro
          ? "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
          : "linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%)",
        fontSize: "11px",
        fontWeight: "700",
        color: isPro ? "#92400E" : "#1D4ED8",
        letterSpacing: "0.02em",
      }}>
        {isPro ? <CrownIcon size={12} /> : null}
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
        icon={<MicIcon size={22} color="#3080F8" />}
        title="Smart Transcription"
        description={isPro ? "Vertex AI — high accuracy" : "Gemini Flash Lite"}
        available={true}
      />
      <AIFeatureItem
        icon={<FileTextIcon size={22} color="#3080F8" />}
        title="AI Summarization"
        description={isPro ? "Advanced analysis" : "Basic summarization"}
        available={true}
      />
      <AIFeatureItem
        icon={<WandIcon size={22} color="#3080F8" />}
        title="Smart Titles"
        description={isPro ? "Premium quality" : "Auto-generated"}
        available={true}
      />
      <AIFeatureItem
        icon={<LanguagesIcon size={22} color="#3080F8" />}
        title="Translation"
        description={isPro ? "50+ languages" : "Core languages"}
        available={true}
      />
    </div>

    {/* Upgrade Button (only for free users) */}
    {!isPro && (
      <button
        onClick={() => {
          chrome.runtime.sendMessage({ type: "handle-upgrade" });
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
        <CrownIcon size={14} />
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
      <LogOutIcon size={13} />
      Sign out
    </button>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────
const AccountTab = () => {
  const [contentState, setContentState] = useContext(contentStateContext);

  const isLoggedIn = contentState.isLoggedIn;
  const isPro = isLoggedIn && contentState.isSubscribed;
  const user = contentState.screenityUser;

  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: "handle-logout" });
    setContentState((prev) => ({
      ...prev,
      isLoggedIn: false,
      isSubscribed: false,
      screenityUser: null,
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
