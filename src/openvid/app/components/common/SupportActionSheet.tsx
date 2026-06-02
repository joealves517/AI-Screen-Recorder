"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { gooeyToast } from "goey-toast";
import "goey-toast/styles.css";

interface SupportActionSheetProps {
  user: any;
  displayName: string;
  onClose: () => void;
}

export function SupportActionSheet({ user, displayName, onClose }: SupportActionSheetProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (!title.trim() || !content.trim() || isSending) return;
    setIsSending(true);

    // 1. Immediately close the support sheet
    onClose();

    const SUPPORT_WEBHOOK_URL = import.meta.env.VITE_SUPPORT_WEBHOOK_URL || "";

    const sendPromise = (async () => {
      // Small artificial delay to allow bottom sheet to slide down smoothly
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await fetch(SUPPORT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name: displayName || "Guest User",
          email: user?.email || "guest@vidflow.com",
          title: `[VidFlow] ${title}`,
          content: content
        })
      });

      const text = await response.text();
      let isSuccess = false;

      try {
        const data = JSON.parse(text);
        if (data.status === "success") isSuccess = true;
      } catch {
        if (response.ok) isSuccess = true;
      }

      if (!isSuccess) {
        throw new Error("Failed to send feedback");
      }
    })();

    gooeyToast.promise(sendPromise, {
      loading: "Sending Message...",
      success: "Message Sent!",
      error: "Failed to Send",
      description: {
        loading: "Please wait while we send your feedback...",
        success: "Thank you for your feedback. We'll get back to you soon.",
        error: "We encountered an issue while sending your message. Please try again."
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Bottom Sheet Drawer */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:w-[420px] sm:-translate-x-1/2 bg-neutral-900 border-t border-white/10 rounded-t-[24px] shadow-2xl z-[9999] overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
      >
        {/* Handle Bar */}
        <div className="w-full flex justify-center py-3 cursor-pointer group" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <div className="mb-4">
            <h3 className="text-[17px] font-bold text-white tracking-tight text-center">Contact Support</h3>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Subject"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-neutral-500 outline-none focus:border-blue-500/50 transition-colors"
            />
            
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="How can we help you?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-neutral-500 outline-none focus:border-blue-500/50 transition-colors resize-none min-h-[100px]"
            />

            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || isSending}
              className="w-full h-11 mt-1 flex items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white cursor-pointer shadow-lg"
            >
              <Icon icon="solar:send-linear" className="size-4" />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
