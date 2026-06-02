import React, { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { contentStateContext } from "../../context/ContentState";
import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";
import * as S from "@radix-ui/react-switch";

setWasmUrl(chrome.runtime.getURL("assets/dotlottie-player.wasm"));

/**
 * SVG Icons & Assets
 */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

import {
  LogoutIcon,
  MonitorCheckIcon,
  GaugeIcon,
  VolumeIcon,
  MaximizeIcon,
  ChevronRightIcon,
  HistoryIcon,
  ZapIcon
} from "lucide-animated";

import { AnimatedIcon } from "../../components/AnimatedIcon";
import {
  probeFastRecorderSupport,
  shouldUseFastRecorder,
  getFastRecorderStickyState,
} from "../../../../media/fastRecorderGate";

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
  borderRadius: "18px",
  border: "1px solid rgba(255, 255, 255, 0.9)",
  display: "flex",
  boxSizing: "border-box",
  userSelect: "none",
  overflow: "hidden",
});

// Standard Clean Toggle Switch (Blue & Symmetrical, matching the Record tab)
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <S.Root
    className="SwitchRoot"
    checked={checked}
    onCheckedChange={onChange}
    disabled={disabled}
    style={{
      display: "inline-flex",
      alignItems: "center",
      border: "none",
      padding: 0,
      outline: "none"
    }}
  >
    <S.Thumb className="SwitchThumb" />
  </S.Root>
);

// STUNNING Bento Settings Grid
const SettingsSection = ({
  contentState,
  setContentState,
  restore,
  width,
  height,
  RAM,
  fastRecorderInfo
}) => {
  const resizeOptions = [
    { label: "Resize window", value: "" },
    { label: "3840 x 2160 (4k)", value: "3840x2160", minW: 3840, minH: 2160 },
    { label: "1920 x 1080 (1080p)", value: "1920x1080", minW: 1920, minH: 1080 },
    { label: "1280 x 720 (720p)", value: "1280x720", minW: 1280, minH: 720 },
    { label: "640 x 480 (480p)", value: "640x480", minW: 640, minH: 480 },
    { label: "480 x 360 (360p)", value: "480x360", minW: 480, minH: 360 },
    { label: "320 x 240 (240p)", value: "320x240", minW: 320, minH: 240 },
  ];

  const handleResize = (val) => {
    if (!val) return;
    const [w, h] = val.split("x").map(Number);
    chrome.runtime.sendMessage({
      type: "resize-window",
      width: w,
      height: h,
    });
  };

  return (
    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* Settings Title */}
      <div style={{
        fontSize: "12px",
        fontFamily: '"Satoshi-Bold", sans-serif',
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        paddingLeft: "4px",
        marginBottom: "2px"
      }}>
        Recording Preferences
      </div>

      {/* Grid: 2 columns for Resolution & FPS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>

        {/* Resolution Bento Card */}
        <div style={{
          ...bentoCardStyle("rgba(255, 255, 255, 0.7)", "rgba(0, 0, 0, 0.04)"),
          flexDirection: "column",
          padding: "8px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.01), inset 0 1px 1px #ffffff",
          gap: "5px",
          cursor: "default"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "translateY(1px)" }}>
              <MonitorCheckIcon size={13} color="#6366f1" strokeWidth={2} />
            </span>
            <span style={{ fontSize: "12px", fontFamily: '"Satoshi-Medium", sans-serif', color: "#475569", lineHeight: 1 }}>Resolution</span>
          </div>
          <div style={{ position: "relative", width: "100%" }}>
            <select
              value={contentState.qualityValue || "1080p"}
              onChange={(e) => {
                const val = e.target.value;
                setContentState(prev => ({ ...prev, qualityValue: val }));
                chrome.storage.local.set({ qualityValue: val });
              }}
              style={{
                width: "100%",
                height: "32px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "9999px",
                padding: "0 28px 0 12px",
                fontSize: "12px",
                fontFamily: '"Satoshi-Medium", sans-serif',
                color: "#1e293b",
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="4k" disabled={RAM < 8 || width < 3840 || height < 2160}>4K Ultra HD</option>
              <option value="1080p" disabled={RAM < 4 || width < 1920 || height < 1080}>1080p Full HD</option>
              <option value="720p" disabled={RAM < 2 || width < 1280 || height < 720}>720p HD</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
              <option value="240p">240p</option>
            </select>
            <div style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center"
            }}>
              <ChevronRightIcon size={10} style={{ transform: "rotate(90deg)" }} />
            </div>
          </div>
        </div>

        {/* FPS Bento Card */}
        <div style={{
          ...bentoCardStyle("rgba(255, 255, 255, 0.7)", "rgba(0, 0, 0, 0.04)"),
          flexDirection: "column",
          padding: "8px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.01), inset 0 1px 1px #ffffff",
          gap: "5px",
          cursor: "default"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "translateY(1px)" }}>
              <GaugeIcon size={13} color="#db2777" strokeWidth={2} />
            </span>
            <span style={{ fontSize: "12px", fontFamily: '"Satoshi-Medium", sans-serif', color: "#475569", lineHeight: 1 }}>Frame Rate</span>
          </div>
          <div style={{ position: "relative", width: "100%" }}>
            <select
              value={contentState.fpsValue || "30"}
              onChange={(e) => {
                const val = e.target.value;
                setContentState(prev => ({ ...prev, fpsValue: val }));
                chrome.storage.local.set({ fpsValue: val });
              }}
              style={{
                width: "100%",
                height: "32px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "9999px",
                padding: "0 28px 0 12px",
                fontSize: "12px",
                fontFamily: '"Satoshi-Medium", sans-serif',
                color: "#1e293b",
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="60">60 FPS</option>
              <option value="30">30 FPS</option>
              <option value="24">24 FPS</option>
              <option value="15">15 FPS</option>
              <option value="10">10 FPS</option>
              <option value="5">5 FPS</option>
            </select>
            <div style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center"
            }}>
              <ChevronRightIcon size={10} style={{ transform: "rotate(90deg)" }} />
            </div>
          </div>
        </div>

      </div>

      {/* Row: Switches */}
      <div style={{
        ...bentoCardStyle("rgba(255, 255, 255, 0.7)", "rgba(0, 0, 0, 0.04)"),
        flexDirection: "column",
        padding: "8px 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.01), inset 0 1px 1px #ffffff",
        gap: "8px",
        cursor: "default"
      }}>

        {/* Switch 1: Include System Audio */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "translateY(1px)" }}>
              <VolumeIcon size={14} color="#64748b" strokeWidth={2} />
            </span>
            <span style={{ fontSize: "12px", fontFamily: '"Satoshi-Medium", sans-serif', color: "#475569", lineHeight: 1 }}>
              Include system audio
            </span>
          </div>
          <ToggleSwitch
            checked={contentState.systemAudio}
            onChange={(checked) => {
              setContentState(prev => ({ ...prev, systemAudio: checked }));
              chrome.storage.local.set({ systemAudio: checked });
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(0, 0, 0, 0.04)", width: "100%" }} />

        {/* Switch 2: Fast MP4 (WebCodecs) */}
        {fastRecorderInfo?.probe?.ok === true && fastRecorderInfo?.probe?.details?.selectedVideoConfig ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "translateY(1px)" }}>
                <ZapIcon size={14} color="#f59e0b" strokeWidth={2} />
              </span>
              <span style={{ fontSize: "12px", fontFamily: '"Satoshi-Medium", sans-serif', color: "#475569", lineHeight: 1 }}>
                Fast MP4 export
              </span>
            </div>
            <ToggleSwitch
              checked={contentState.useWebCodecsRecorder !== false}
              onChange={(checked) => {
                setContentState(prev => ({ ...prev, useWebCodecsRecorder: checked }));
                chrome.storage.local.set({
                  useWebCodecsRecorder: checked,
                  ...(checked ? { lastWebCodecsFailureAt: null, lastWebCodecsFailureCode: null } : {})
                });
              }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "translateY(1px)" }}>
                <ZapIcon size={14} color="#94a3b8" strokeWidth={2} />
              </span>
              <span style={{ fontSize: "12px", fontFamily: '"Satoshi-Medium", sans-serif', color: "#94a3b8", lineHeight: 1 }}>
                Fast MP4 export (Unsupported)
              </span>
            </div>
            <ToggleSwitch
              checked={false}
              disabled={true}
              onChange={() => { }}
            />
          </div>
        )}
      </div>

      {/* Row: Window Resize and Restore Last Session */}
      <div style={{ display: "grid", gridTemplateColumns: restore ? "1.2fr 0.8fr" : "1fr", gap: "8px" }}>

        {/* Resize Window Card */}
        <div style={{
          ...bentoCardStyle("rgba(255, 255, 255, 0.7)", "rgba(0, 0, 0, 0.04)"),
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.01), inset 0 1px 1px #ffffff",
          cursor: "default"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "translateY(1px)" }}>
              <MaximizeIcon size={14} color="#3b82f6" strokeWidth={2} />
            </span>
            <span style={{ fontSize: "12px", fontFamily: '"Satoshi-Medium", sans-serif', color: "#475569", lineHeight: 1 }}>Resize</span>
          </div>
          <div style={{ position: "relative", width: "60%" }}>
            <select
              value=""
              onChange={(e) => handleResize(e.target.value)}
              style={{
                width: "100%",
                height: "28px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "9999px",
                padding: "0 20px 0 8px",
                fontSize: "12px",
                fontFamily: '"Satoshi-Medium", sans-serif',
                color: "#475569",
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="">Choose...</option>
              {resizeOptions.slice(1).map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={width < opt.minW || height < opt.minH}
                >
                  {opt.label.replace("Resize window", "").trim()}
                </option>
              ))}
            </select>
            <div style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center"
            }}>
              <ChevronRightIcon size={8} style={{ transform: "rotate(90deg)" }} />
            </div>
          </div>
        </div>

        {/* Restore Last Recording Card */}
        {restore && (
          <div
            onClick={() => chrome.runtime.sendMessage({ type: "restore-recording" })}
            style={{
              background: "#f1f5f9",
              borderRadius: "9999px",
              border: "none",
              display: "flex",
              boxSizing: "border-box",
              userSelect: "none",
              overflow: "hidden",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "6px 12px",
              cursor: "pointer",
              color: "#475569",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#e2e8f0";
              e.currentTarget.style.color = "#1e293b";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.color = "#475569";
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "translateY(1px)" }}>
              <HistoryIcon size={15} color="currentColor" strokeWidth={2} />
            </span>
            <span style={{ fontSize: "12px", fontFamily: '"Satoshi-Medium", sans-serif', lineHeight: 1 }}>Restore</span>
          </div>
        )}
      </div>

    </div>
  );
};

// ─── Guest View (Not logged in) ─────────────────────────────────────
const GuestView = ({
  contentState,
  setContentState,
  restore,
  width,
  height,
  RAM,
  fastRecorderInfo
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);

  const handleLoginClick = () => {
    setIsLoggingIn(true);
    chrome.runtime.sendMessage({ type: "handle-login" }).catch(() => { });
    setTimeout(() => setIsLoggingIn(false), 10000);
  };

  return (
    <div style={{ padding: "12px 14px", boxSizing: "border-box" }}>
      {/* Elegant Standard Account Sign-in Card */}
      <div style={{
        background: "#ffffff",
        borderRadius: "24px",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        padding: "14px",
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            flexShrink: 0
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "13px", fontFamily: '"Satoshi-Bold", sans-serif', color: "#1e293b" }}>Account</div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, fontFamily: '"Satoshi-Medium", sans-serif', marginTop: "1px" }}>
              Sign in to unlock AI features.
            </p>
          </div>
        </div>

        {/* Standard Clean Google Sign-in Button */}
        <button
          onClick={handleLoginClick}
          disabled={isLoggingIn}
          style={{
            width: "100%",
            height: "32px",
            background: "rgba(48, 128, 248, 0.08)",
            color: "#3080f8",
            border: "none",
            borderRadius: "9999px",
            fontSize: "12px",
            fontFamily: '"Satoshi-Bold", sans-serif',
            cursor: isLoggingIn ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.15s ease",
            boxSizing: "border-box",
          }}
          onMouseEnter={(e) => { if (!isLoggingIn) e.currentTarget.style.background = "rgba(48, 128, 248, 0.15)"; }}
          onMouseLeave={(e) => { if (!isLoggingIn) e.currentTarget.style.background = "rgba(48, 128, 248, 0.08)"; }}
        >
          {isLoggingIn ? (
            <span
              style={{
                width: "12px",
                height: "12px",
                border: "2px solid rgba(71, 85, 105, 0.2)",
                borderTopColor: "#475569",
                borderRadius: "50%",
                display: "inline-block",
                boxSizing: "border-box",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <GoogleLogo />
          )}
          {isLoggingIn ? "Signing in..." : "Sign in with Google"}
        </button>

        {/* Privacy & License Link */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "4px", marginBottom: "0px" }}>
          <span 
            onClick={() => {
              chrome.tabs.create({ url: chrome.runtime.getURL("privacy.html") });
            }}
            style={{ 
              cursor: "pointer", 
              textDecoration: "underline", 
              color: "#94a3b8", 
              fontSize: "11px",
              fontFamily: '"Satoshi-Medium", sans-serif'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "#64748b"}
            onMouseOut={(e) => e.currentTarget.style.color = "#94a3b8"}
          >
            Privacy & License
          </span>
        </div>
      </div>

      {/* Settings Grid */}
      <SettingsSection
        contentState={contentState}
        setContentState={setContentState}
        restore={restore}
        width={width}
        height={height}
        RAM={RAM}
        fastRecorderInfo={fastRecorderInfo}
      />
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
const LoggedInView = ({
  user,
  isPro,
  quotaExhausted,
  onLogout,
  contentState,
  setContentState,
  restore,
  width,
  height,
  RAM,
  fastRecorderInfo
}) => {
  const [logoutHovered, setLogoutHovered] = useState(false);
  const name = user?.name || user?.displayName || "User";

  return (
    <div style={{ padding: "12px 14px", boxSizing: "border-box" }}>
      {/* Elegant Standard Profile Card */}
      <div style={{
        background: "#ffffff",
        borderRadius: "24px",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        padding: "14px",
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            {/* Avatar */}
            {/* Avatar with robust error fallback */}
            {user?.picture || user?.avatar ? (
              <img
                src={user.picture || user.avatar}
                alt="Avatar"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.nextSibling;
                  if (fallback) {
                    fallback.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className="avatar-fallback"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#f1f5f9",
                display: (user?.picture || user?.avatar) ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
                fontSize: "13px",
                fontFamily: '"Satoshi-Bold", sans-serif',
                flexShrink: 0,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: "13px",
                fontFamily: '"Satoshi-Bold", sans-serif',
                color: "#1e293b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {name}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#64748b",
                fontFamily: '"Satoshi-Medium", sans-serif',
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: "1px"
              }}>
                {user?.email || "Signed in"}
              </div>
            </div>
          </div>

          {/* Badge / Action */}
          <div>
            {isPro ? (
              <span style={{
                padding: "2px 8px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "9999px",
                fontSize: "11px",
                fontFamily: '"Satoshi-Bold", sans-serif',
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                Pro
              </span>
            ) : (
              <button
                onClick={() => {
                  chrome.runtime.sendMessage({ type: "handle-upgrade" }).catch(() => { });
                }}
                style={{
                  padding: "4px 10px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontFamily: '"Satoshi-Bold", sans-serif',
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#1d4ed8"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#2563eb"}
              >
                Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Divider inside Profile card */}
        <div style={{ height: "1px", background: "#f1f5f9", width: "100%" }} />

        {/* Plan status & Sign out button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontFamily: '"Satoshi-Medium", sans-serif' }}>
            {quotaExhausted ? "AI quota exceeded" : isPro ? "Premium features active" : "Free Plan"}
          </span>
          <span
            onClick={onLogout}
            onMouseEnter={() => setLogoutHovered(true)}
            onMouseLeave={() => setLogoutHovered(false)}
            style={{
              fontSize: "12px",
              fontFamily: '"Satoshi-Bold", sans-serif',
              color: logoutHovered ? "#ef4444" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.15s ease"
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <LogoutIcon size={12} strokeWidth={2} />
            </span>
            Sign out
          </span>
        </div>

        {/* Privacy & License Link */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "4px", marginBottom: "0px" }}>
          <span 
            onClick={() => {
              chrome.tabs.create({ url: chrome.runtime.getURL("privacy.html") });
            }}
            style={{ 
              cursor: "pointer", 
              textDecoration: "underline", 
              color: "#94a3b8", 
              fontSize: "11px",
              fontFamily: '"Satoshi-Medium", sans-serif'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "#64748b"}
            onMouseOut={(e) => e.currentTarget.style.color = "#94a3b8"}
          >
            Privacy & License
          </span>
        </div>
      </div>

      {/* Settings Grid */}
      <SettingsSection
        contentState={contentState}
        setContentState={setContentState}
        restore={restore}
        width={width}
        height={height}
        RAM={RAM}
        fastRecorderInfo={fastRecorderInfo}
      />
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

  // States for Settings
  const [restore, setRestore] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [RAM, setRAM] = useState(0);
  const [fastRecorderInfo, setFastRecorderInfo] = useState({
    status: null,
    probe: null,
    decision: null,
    disabled: false,
    disabledReason: null,
    disabledDetails: null,
    disabledAt: null,
  });

  const getFastRecDebug = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("fastRecDebug") === "1";
    } catch {
      return false;
    }
  };

  const hasLadderFields = (probe) => {
    if (!probe || !probe.details) return false;
    return (
      Array.isArray(probe.details.attemptSummary) &&
      probe.details.attemptSummary.length > 0 &&
      Boolean(probe.details.selectedVideoConfig)
    );
  };

  const runFastRecorderProbe = async (source = "auto") => {
    if (!contentState) return;
    const userSetting =
      contentState.useWebCodecsRecorder === true
        ? true
        : contentState.useWebCodecsRecorder === false
          ? false
          : null;
    const sticky = await getFastRecorderStickyState();
    const probe = await probeFastRecorderSupport();
    const useFast = shouldUseFastRecorder(userSetting, probe, sticky);
    const decision = {
      useFast,
      why:
        userSetting === false
          ? "user_disabled"
          : sticky?.disabled && userSetting !== true
            ? "sticky_disabled"
            : probe.ok
              ? "probe_ok"
              : "probe_failed",
      at: Date.now(),
    };
    const status = {
      userSetting,
      probe: { ...probe, at: probe.at || Date.now() },
      decision,
      disabled: Boolean(sticky?.disabled),
      disabledReason: sticky?.reason || null,
      disabledDetails: sticky?.details || null,
      disabledAt: null,
      updatedAt: Date.now(),
    };
    try {
      await chrome.storage.local.set({ fastRecorderStatus: status });
    } catch { }
    setFastRecorderInfo({
      status,
      probe: status.probe,
      decision,
      disabled: status.disabled,
      disabledReason: status.disabledReason,
      disabledDetails: status.disabledDetails,
      disabledAt: status.disabledAt,
    });
    if (getFastRecDebug()) {
      console.log("[FastRecorderStatus]", { source, status });
    }
    return status;
  };

  const migrateFastRecorderStatus = async () => {
    const existing = await chrome.storage.local.get(["fastRecorderStatus"]);
    if (existing.fastRecorderStatus) {
      const status = existing.fastRecorderStatus;
      if (!hasLadderFields(status?.probe)) {
        await runFastRecorderProbe("stale-status");
        const refreshed = await chrome.storage.local.get(["fastRecorderStatus"]);
        return refreshed.fastRecorderStatus || status;
      }
      return status;
    }
    return null;
  };

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

    // Check restore
    chrome.runtime.sendMessage({ type: "check-restore" }).then((response) => {
      setRestore(response?.restore || false);
    });

    // Detect screen width/height & RAM
    const w = window.screen.availWidth * window.devicePixelRatio;
    const h = window.screen.availHeight * window.devicePixelRatio;
    setWidth(Math.round(w));
    setHeight(Math.round(h));

    const isMac = navigator.userAgent.includes("Macintosh");
    const ram = isMac ? 32 : Number(navigator.deviceMemory) || 4;
    setRAM(ram);

    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const status = await migrateFastRecorderStatus();
      if (canceled) return;
      if (status) {
        setFastRecorderInfo({
          status,
          probe: status?.probe || null,
          decision: status?.decision || null,
          disabled: Boolean(status?.disabled),
          disabledReason: status?.disabledReason || null,
          disabledDetails: status?.disabledDetails || null,
          disabledAt: status?.disabledAt || null,
        });
      }
      const staleHours = 12;
      const probeAgeMs =
        status?.probe?.at && Number.isFinite(status.probe.at)
          ? Date.now() - status.probe.at
          : Infinity;
      const shouldRun =
        !status?.probe ||
        probeAgeMs > staleHours * 60 * 60 * 1000 ||
        !hasLadderFields(status?.probe);
      if (shouldRun) {
        await runFastRecorderProbe("effect");
      }
    })();
    return () => {
      canceled = true;
    };
  }, [contentState?.useWebCodecsRecorder]);

  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: "handle-logout" }).catch(() => { });
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
    return (
      <GuestView
        contentState={contentState}
        setContentState={setContentState}
        restore={restore}
        width={width}
        height={height}
        RAM={RAM}
        fastRecorderInfo={fastRecorderInfo}
      />
    );
  }

  return (
    <LoggedInView
      user={user}
      isPro={isPro}
      quotaExhausted={quotaExhausted}
      onLogout={handleLogout}
      contentState={contentState}
      setContentState={setContentState}
      restore={restore}
      width={width}
      height={height}
      RAM={RAM}
      fastRecorderInfo={fastRecorderInfo}
    />
  );
};

export default AccountTab;
