# Privacy Policy for AI Screen Recorder - Free MP4 Export

**Effective Date:** May 3, 2026

Thank you for choosing **AI Screen Recorder - Free MP4 Export** ("the Extension"). We are committed to protecting your privacy and ensuring that your data remains secure. 

This Privacy Policy explains how our Extension interacts with your data. The core principle of our extension is **Local-First Processing**: we ensure that your core media files (video recordings, and audio files) are never stored, transmitted, or shared to any external servers.

---

## 1. Data Collection & Processing

**Your media content is NOT collected or stored on any cloud servers.**

- **Screen, Camera, and Audio Recordings:** All video and audio streams captured by the Extension are processed entirely locally on your device (within your browser using IndexedDB and WebCodecs APIs). Your recordings never leave your computer.
- **AI Subtitles & Summaries:** Any transcription, translation, or AI-generated summaries are processed using secure API relays. We do not store the content of your transcripts or summaries on our servers.
- **Account Management & Telemetry:** Core recording features do not require an account. However, if you choose to use our AI features or upgrade to a Pro subscription, we require you to authenticate via Google OAuth. To manage your credits and prevent abuse, our backend (Google Cloud/Firestore) collects:
  - **Basic Profile Information:** Name, Email Address, and Avatar to verify your subscription status.
  - **Usage Telemetry:** Information about your AI requests, including the number of tokens used, the AI model selected, timestamps, and cross-application usage within our ecosystem (e.g., if you also use our companion extensions). We do **not** log the content of your prompts or generated results.

## 2. Chrome Permissions Justification

To function correctly, the Extension requires certain permissions. Here is exactly how we use them:

- **`activeTab` & `<all_urls>`**: Used strictly to inject the recording toolbar and drawing annotations onto the screen you are currently recording. We do not track the websites you visit.
- **`storage` & `unlimitedStorage`**: Used exclusively to save your extension settings (e.g., preferred language, camera device) and to temporarily hold large video data files locally on your hard drive before you export them to MP4.
- **`tabCapture` & `desktopCapture`**: Used to capture the visual and audio feed of your screen when you initiate a recording. 
- **`downloads`**: Used solely to allow you to save the final recorded MP4, WEBM, or GIF files to your local download folder.
- **`scripting` & `system.display`**: Used to provide the on-screen drawing tools and to calculate screen coordinates for the "Custom Area" recording feature.
- **`clipboardWrite`**: Used only when you explicitly click "Copy" to copy generated AI summaries or debug information to your clipboard.

## 3. Third-Party Services

To provide authentication and AI capabilities, we use the following services:
- **Supabase & Google OAuth:** Used for secure user authentication and login.
- **Google Cloud & Firestore:** Used to store your account profile, subscription tier, and AI usage telemetry for rate-limiting purposes.
- **Lemon Squeezy:** Used as our merchant of record to securely process payments and manage Pro subscriptions.
- **No Advertisements:** We do not inject ads or share your data with advertisers.
- **No Media Cloud Storage:** The Extension operates media processing 100% locally. Your video files are not uploaded to AWS, Bunny.net, or any other cloud provider.

## 4. Security

Because your recordings are processed and stored locally in your browser's IndexedDB, the security of your data relies entirely on the security of your own device. We recommend keeping your computer and web browser updated to the latest versions to ensure your local files remain protected.

## 5. Changes to this Privacy Policy

We may update this Privacy Policy from time to time if we introduce new features or change how the Extension operates. However, our commitment to a **local-first, privacy-focused** experience will not change. Any updates will be reflected on this page with a revised "Effective Date."

## 6. Contact Us

If you have any questions, concerns, or technical issues regarding this Privacy Policy or the Extension, please contact us at:

**Email:** support@aiscreenrecorder.app
*(Note: As we do not collect your data, we will not be able to retrieve lost recordings for you. All data is managed locally by you.)*
