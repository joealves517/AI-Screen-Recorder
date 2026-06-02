# Privacy & License for AI Screen Recorder - Free MP4 Export

**Effective Date:** May 3, 2026

Thank you for choosing **AI Screen Recorder - Free MP4 Export** ("the Extension"). We respect your privacy and are committed to keeping your data secure. 

The core principle of our extension is **Local-First Processing**: we ensure that your core media files (video recordings, and audio files) are never stored, transmitted, or shared to any external servers without your explicit action.

---

## 1. Open Source License (GNU GPL v3.0)

This extension is proud to be open-source. It is based on the open-source project Screenity and is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. 

Under the terms of the GPLv3, you have the right to inspect, modify, and redistribute the source code of this extension. Any modified versions you distribute must also be released under the GPLv3 license and make their source code publicly available.

*   **Official GitHub Repository:** [https://github.com/joealves517/AI-Screen-Recorder](https://github.com/joealves517/AI-Screen-Recorder)

---

## 2. Data Collection & Processing

We prioritize the protection of your content and adhere strictly to Chrome Web Store User Data policies:

*   **Local Storage:** All raw screen, webcam, and audio streams are processed entirely locally inside your browser using IndexedDB and WebCodecs APIs. No video or audio files are ever uploaded or transmitted to our servers for processing.
*   **Local-First Video Editor:** Our newly integrated editor (Openvid Editor) operates entirely on your local machine. All editing functions (including cropping, splitting, adding text/stickers, applying canvas masks, and speed changes) are calculated client-side in your web browser. No draft files or video frames are ever uploaded to our servers. Project metadata and video assets are cached temporarily in your browser's IndexedDB, giving you absolute control over your media.
*   **AI Subtitles & Voiceover:** AI transcriptions, translations, and voiceovers are processed using secure API relays. The content of these media files is sent to our servers solely to run the AI inference and is immediately discarded afterward. We do not store or keep copies of your transcripts or media content on our servers.
*   **Account Information:** If you authenticate via Google OAuth (required for Pro plans and AI features), we securely collect your email, name, and profile picture to manage your subscription. We also log usage telemetry (tokens used, API call counts, timestamps) to monitor quotas.

---

## 3. Chrome Extension Permissions Justification

To function correctly, the Extension requires certain permissions. Here is exactly how we use them:

*   **`activeTab` & `<all_urls>`**: Used strictly to inject the recording toolbar and drawing annotations onto the screen you are currently recording. We do not track the websites you visit.
*   **`storage` & `unlimitedStorage`**: Used exclusively to save your extension settings (e.g., preferred language, camera device) and to temporarily hold large video data files locally on your hard drive before you export them to MP4.
*   **`tabCapture` & `desktopCapture`**: Used to capture the visual and audio feed of your screen when you initiate a recording. 
*   **`downloads`**: Used solely to allow you to save the final recorded MP4, WEBM, or GIF files to your local download folder.
*   **`identity`**: Allows Google OAuth authentication to verify your subscription tier and manage your account and AI usage limits.
*   **`scripting` & `system.display`**: Used to provide the on-screen drawing tools and to calculate screen coordinates for the "Custom Area" recording feature.
*   **`tabs`**: Required to manage, target, and open new pages (such as local export or policy pages) in separate browser tabs.
*   **`clipboardWrite`**: Used only when you explicitly click "Copy" to copy generated AI summaries or debug information to your clipboard.

---

## 4. Security

Because your recordings are processed and stored locally in your browser's IndexedDB, the security of your data relies entirely on the security of your own device. We recommend keeping your computer and web browser updated to the latest versions to ensure your local files remain protected.

We do not sell, rent, or lease your account information to third-party advertisers.

---

## 5. Contact Us

If you have any questions, concerns, or technical issues regarding this Privacy Policy or the Extension, please contact us at:

*   **Email:** [alvesoscar517@gmail.com](mailto:alvesoscar517@gmail.com)
