import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Video, Languages, FileJson, Volume2, ShieldCheck } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
  userId?: string;
}

const CHECKOUT_BASE = "https://graphosai.lemonsqueezy.com/checkout/buy/2a8c453e-7b12-4743-bf50-8571c9cfae30";

export function UpgradeModal({ open, onOpenChange, userEmail, userId }: UpgradeModalProps) {
  const handleUpgrade = () => {
    // Construct the checkout URL with email and user ID for tracking
    const emailParam = userEmail ? `&checkout[email]=${encodeURIComponent(userEmail)}` : "";
    const userParam = userId ? `&checkout[custom][user_id]=${userId}` : "";
    const url = `${CHECKOUT_BASE}?embed=1${emailParam}${userParam}`;
    
    // Open in a new tab
    window.open(url, "_blank");
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <Dialog.Portal forceMount>
            {/* Semi-transparent dark overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99999] bg-black/45 backdrop-blur-xs"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }}
                animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }}
                transition={{ type: "spring", duration: 0.35 }}
                className="fixed top-1/2 left-1/2 z-[100000] w-full max-w-[340px] bg-white text-zinc-900 border border-zinc-100 shadow-2xl overflow-hidden rounded-[28px] outline-none"
              >
                {/* Luxury ambient gradient fades on the background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_220px_at_100%_0%,rgba(139,92,246,0.3),rgba(168,85,247,0.15)_50%,transparent_100%)] rounded-[28px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-44 h-44 bg-[radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.08),rgba(99,102,241,0.04)_50%,transparent_100%)] blur-xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-44 h-44 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),rgba(168,85,247,0.04)_50%,transparent_100%)] blur-xl pointer-events-none" />

                <div className="flex flex-col items-center px-5 pt-8 pb-7 relative z-10">
                  {/* Top Illustration */}
                  <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                    <img
                      src="/6.webp"
                      alt="Upgrade Premium Illustration"
                      className="w-full h-full object-contain select-none transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Heading */}
                  <Dialog.Title className="text-2xl font-black tracking-tight text-center text-zinc-900 leading-tight">
                    <span className="bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 bg-clip-text text-transparent font-black pr-1">
                      10X
                    </span>
                    Creative Power
                  </Dialog.Title>

                  <div className="w-full mt-5 space-y-4">
                    {/* Feature 1: Unlimited Credits */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <img
                          src="/7.webp"
                          alt="Verified"
                          className="w-4.5 h-4.5 shrink-0 object-contain select-none"
                        />
                        <span className="text-xs font-bold text-zinc-900 leading-none">
                          Unlimited Premium Credits
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-500 pl-6.5 mt-1 leading-normal">
                        High-speed AI voice dubbing, transcription & processing.
                      </span>
                    </div>

                    {/* Feature 2: Unlock Premium Features */}
                    <div className="flex flex-col w-full">
                      <div className="flex items-center gap-2">
                        <img
                          src="/7.webp"
                          alt="Verified"
                          className="w-4.5 h-4.5 shrink-0 object-contain select-none"
                        />
                        <span className="text-xs font-bold text-zinc-900 leading-none">
                          Unlock All Premium Features
                        </span>
                      </div>

                      {/* Nested List with Stand-alone Minimalist Icons */}
                      <div className="pl-6.5 mt-2.5 space-y-2.5">
                        {[
                          {
                            text: "AI Voice Dubbing & Narrator (TTS)",
                            icon: <Volume2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
                          },
                          {
                            text: "Auto Subtitle Generator with AI",
                            icon: <Video className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
                          },
                          {
                            text: "Multilingual Video Translations",
                            icon: <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
                          },
                          {
                            text: "Smart Video Insights & Summaries",
                            icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
                          },
                          {
                            text: "Pro Recording & Export Formats",
                            icon: <FileJson className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
                          },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-2.5 text-[10px] text-zinc-700">
                            {item.icon}
                            <span className="font-semibold">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="w-full mt-6">
                    <button
                      onClick={handleUpgrade}
                      className="w-full relative h-10 bg-zinc-950 hover:bg-zinc-900 text-white rounded-full flex items-center justify-center cursor-pointer active:scale-[0.99] transition-all duration-150 shadow-md border-none"
                    >
                      <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 bg-clip-text text-transparent font-black tracking-wider uppercase text-xs">
                        Upgrade Now
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}
