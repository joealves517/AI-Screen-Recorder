import React from "react";
import { Icon } from "@iconify/react";

const PrivacyLicense = () => {
  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-200 py-12 px-4 sm:px-6 lg:px-8 selection:bg-purple-500/30 selection:text-purple-200">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-purple-900/10 via-transparent to-transparent pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto bg-[#18181b] border border-white/5 rounded-3xl shadow-2xl p-6 sm:p-10 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Icon icon="solar:shield-keyhole-bold-duotone" className="size-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Privacy & License</h1>
              <p className="text-xs text-neutral-400 mt-1">Effective Date: May 3, 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href="https://github.com/joealves517/AI-Screen-Recorder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white font-semibold transition-all shadow-sm"
            >
              <Icon icon="mdi:github" className="size-4" />
              <span>View Source Code</span>
            </a>
          </div>
        </div>

        {/* Introduction */}
        <div className="space-y-6 text-sm leading-relaxed text-neutral-300">
          <p>
            Thank you for choosing <strong>AI Screen Recorder - Free MP4 Export</strong> ("the Extension"). We respect your privacy and are committed to keeping your data secure. The core principle of our extension is <strong>Local-First Processing</strong>: all of your recordings are captured and handled entirely on your own machine.
          </p>

          <hr className="border-white/5 my-8" />

          {/* Section 1: Open Source & GPL License */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Icon icon="solar:document-text-bold-duotone" className="text-purple-400 size-5" />
              <span>1. Open Source License (GNU GPL v3.0)</span>
            </h2>
            <div className="bg-purple-950/10 border border-purple-500/10 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-purple-200 leading-relaxed">
                This extension is proud to be open-source. It is based on the open-source project Screenity and is licensed under the <strong>GNU General Public License v3.0 (GPL-3.0)</strong>. 
              </p>
              <p className="text-xs text-neutral-400">
                Under the terms of the GPLv3, you have the right to inspect, modify, and redistribute the source code of this extension. Any modified versions you distribute must also be released under the GPLv3 license and make their source code publicly available.
              </p>
              <div className="pt-2">
                <a
                  href="https://github.com/joealves517/AI-Screen-Recorder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4"
                >
                  <Icon icon="solar:link-bold" className="size-3.5" />
                  Access the official GitHub repository here
                </a>
              </div>
            </div>
          </div>

          <hr className="border-white/5 my-8" />

          {/* Section 2: Data Collection & Processing */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Icon icon="solar:database-bold-duotone" className="text-purple-400 size-5" />
              <span>2. Data Collection & Processing</span>
            </h2>
            <p>
              We prioritize the protection of your content and adhere strictly to Chrome Web Store User Data policies:
            </p>
            <ul className="space-y-2.5 list-none pl-0">
              <li className="flex gap-2.5 items-start">
                <Icon icon="solar:check-circle-bold" className="text-green-500 size-4 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-white">Local Storage:</strong> All raw screen, webcam, and audio streams are processed entirely locally inside your browser using IndexedDB and WebCodecs. No video or audio files are ever uploaded or transmitted to our servers for processing.
                </span>
              </li>
              <li className="flex gap-2.5 items-start">
                <Icon icon="solar:check-circle-bold" className="text-green-500 size-4 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-white">Local-First Video Editor:</strong> Our newly integrated editor (Openvid Editor) operates entirely on your local machine. All editing functions (including cropping, splitting, adding text/stickers, applying canvas masks, and speed changes) are calculated client-side in your web browser. No draft files or video frames are ever uploaded to our servers. Project metadata and video assets are cached temporarily in your browser's IndexedDB, giving you absolute control over your media.
                </span>
              </li>
              <li className="flex gap-2.5 items-start">
                <Icon icon="solar:check-circle-bold" className="text-green-500 size-4 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-white">AI Subtitles & Voiceover:</strong> AI transcriptions, translations, and voiceovers are processed using secure API relays. The content of these media files is sent to our servers solely to run the AI inference and is immediately discarded afterward. We do not store or keep copies of your transcripts or media content on our servers.
                </span>
              </li>
              <li className="flex gap-2.5 items-start">
                <Icon icon="solar:check-circle-bold" className="text-green-500 size-4 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-white">Account Information:</strong> If you authenticate via Google OAuth (required for Pro plans and AI features), we securely collect your email, name, and profile picture to manage your subscription. We also log usage telemetry (tokens used, API call counts, timestamps) to monitor quotas.
                </span>
              </li>
            </ul>
          </div>

          <hr className="border-white/5 my-8" />

          {/* Section 3: Chrome Extension Permissions */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Icon icon="solar:settings-bold-duotone" className="text-purple-400 size-5" />
              <span>3. Permissions Justification</span>
            </h2>
            <p>
              To record and edit your screen, the Extension requests the following browser permissions. Here is exactly why they are needed:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-white mb-1">activeTab & all_urls</h4>
                <p className="text-xs text-neutral-400">Allows injecting the control panel and drawing tools onto the tab you are recording.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-white mb-1">storage & unlimitedStorage</h4>
                <p className="text-xs text-neutral-400">Saves your settings (resolutions, hotkeys) and caches large temporary video data locally before exporting.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-white mb-1">tabCapture & desktopCapture</h4>
                <p className="text-xs text-neutral-400">Required to capture the video and system audio of your screen, window, or tab when recording is triggered.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-white mb-1">downloads</h4>
                <p className="text-xs text-neutral-400">Allows saving the finished video (MP4, WebM) directly to your computer's local downloads folder.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-white mb-1">identity</h4>
                <p className="text-xs text-neutral-400">Allows Google OAuth authentication to verify your subscription tier and manage your account and AI usage limits.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-white mb-1">scripting & system.display</h4>
                <p className="text-xs text-neutral-400">Used to inject annotation tools on screen and calculate display coordinates for the custom area selection.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-white mb-1">tabs</h4>
                <p className="text-xs text-neutral-400">Required to manage, target, and open new pages (such as local export or policy pages) in separate browser tabs.</p>
              </div>
            </div>
          </div>

          <hr className="border-white/5 my-8" />

          {/* Section 4: Safety & Security */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Icon icon="solar:shield-check-bold-duotone" className="text-purple-400 size-5" />
              <span>4. Security Assurance</span>
            </h2>
            <p>
              Because your recordings reside locally inside your browser's IndexedDB, the security of your files is directly tied to your computer's security. We recommend keeping your operating system and web browser updated to protect against vulnerabilities. We do not sell, rent, or lease your account information to third-party advertisers.
            </p>
          </div>

          <hr className="border-white/5 my-8" />

          {/* Section 5: Contact Support */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Icon icon="solar:letter-bold-duotone" className="text-purple-400 size-5" />
              <span>5. Support and Contact</span>
            </h2>
            <p>
              If you have any questions, feedback, or concerns regarding this policy, please reach out to us at:
            </p>
            <p className="text-xs text-neutral-400">
              <strong>Email:</strong> <a href="mailto:alvesoscar517@gmail.com" className="text-purple-400 hover:underline">alvesoscar517@gmail.com</a>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <span>AI Screen Recorder v0.2.9</span>
          <span>© 2026. Distributed under the GNU GPL v3.0 license.</span>
        </div>
      </div>
    </div>
  );
};

export default PrivacyLicense;
