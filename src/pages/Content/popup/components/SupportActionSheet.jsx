import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XIcon, LoaderIcon, SendIcon, MessageSquareIcon } from "lucide-react";
import { AnimatedIcon } from "./TooltipWrap";

const SUPPORT_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbww8SxkxrSOYScJNdtkhorXTqIQ10qVT8WHRgHXnrCRjyYbYhfHLWlta97sFzVk8o0pSA/exec";

export function SupportActionSheet({ onClose, user }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const textareaRef = useRef(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setStatus("loading");

    try {
      const response = await fetch(SUPPORT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name: user?.displayName || user?.name || "Guest User",
          email: user?.email || "guest@aiscreenrecorder.com",
          title: `[Screenity AI] ${title}`,
          content: content,
        }),
      });

      const text = await response.text();
      let isSuccess = false;

      try {
        const data = JSON.parse(text);
        if (data.status === "success") isSuccess = true;
      } catch {
        if (response.ok) isSuccess = true;
      }

      if (isSuccess) {
        setStatus("success");
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      console.error("Support submission failed:", err);
      setStatus("error");
      setErrorMessage(err.message || "Network error. Please try again.");
    }
  };

  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(2px)",
    zIndex: 999998,
    pointerEvents: "auto",
  };

  const sheetStyle = {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 0,
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
    zIndex: 999999,
    fontFamily: "Inter, sans-serif",
    display: "flex",
    flexDirection: "column",
    pointerEvents: "auto",
    userSelect: "auto",
  };

  const handleStyle = {
    width: "100%",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: status === "loading" ? "default" : "pointer",
  };

  const handleBarStyle = {
    width: "40px",
    height: "4px",
    backgroundColor: "#E5E7EB",
    borderRadius: "2px",
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: "#F3F4F6",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#1F2937",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
  };

  const buttonStyle = {
    width: "100%",
    height: "44px",
    marginTop: "8px",
    borderRadius: "20px",
    backgroundColor: "transparent",
    border: "1px solid #E5E7EB",
    color: "#1F2937",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "Inter, sans-serif",
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: "not-allowed",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#2563EB",
    color: "#ffffff",
    border: "none",
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        style={backdropStyle}
        onClick={status === "loading" ? undefined : onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        key="sheet"
        style={sheetStyle}
        initial={{ y: "100%", x: "-50%" }}
        animate={{ y: 0, x: "-50%" }}
        exit={{ y: "100%", x: "-50%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
      >
        <div style={handleStyle} onClick={status === "loading" ? undefined : onClose}>
          <div style={handleBarStyle} />
        </div>

        <div style={{ position: "relative", padding: "0 24px 24px 24px" }}>
          {status === "success" || status === "error" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", backgroundColor: status === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", color: status === "success" ? "#22c55e" : "#ef4444" }}>
                {status === "success" ? <CheckCircle2 size={32} /> : <XIcon size={32} />}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
                {status === "success" ? "Message Sent!" : "Failed to Send"}
              </h3>
              <p style={{ fontSize: "14px", color: "#6B7280", textAlign: "center", margin: "0 0 24px 0" }}>
                {status === "success"
                  ? "Thank you for your feedback. We'll get back to you soon."
                  : "We encountered an issue while sending your message. Please try again."}
              </p>
              <button
                onClick={status === "success" ? onClose : () => setStatus("idle")}
                style={primaryButtonStyle}
              >
                {status === "success" ? "Close" : "Try Again"}
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "16px", paddingTop: "12px", textAlign: "center" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0, letterSpacing: "-0.01em" }}>Contact Support</h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Subject"
                  style={inputStyle}
                  disabled={status === "loading"}
                />

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="How can we help you?"
                  style={{ ...inputStyle, resize: "none", minHeight: "100px" }}
                  disabled={status === "loading"}
                />

                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !content.trim() || status === "loading"}
                  style={(!title.trim() || !content.trim() || status === "loading") ? disabledButtonStyle : buttonStyle}
                  onMouseOver={(e) => {
                    if (!(!title.trim() || !content.trim() || status === "loading")) {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {status === "loading" ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "flex" }}>
                      <LoaderIcon size={16} />
                    </motion.div>
                  ) : (
                    <>
                      <SendIcon size={15} />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
