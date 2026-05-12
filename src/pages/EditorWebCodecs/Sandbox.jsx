import React, { useEffect, useRef } from "react";

import addAudioToVideo from "./utils/addAudioToVideo";
import convertWebmToMp4 from "./utils/convertWebmToMp4";
import cropVideo from "./utils/cropVideo";
import cutVideo from "./utils/cutVideo";
import muteVideo from "./utils/muteVideo";
import reencodeVideo from "./utils/reencodeVideo";
import toGIF from "./utils/toGIF";
import burnSubtitles from "./utils/burnSubtitles";
import getFrame from "./utils/getFrame";
import hasAudio from "./utils/hasAudio";
import convertMp4ToWebm from "./utils/convertMp4ToWebm";
import blobToArrayBuffer from "./utils/blobToArrayBuffer";

const API_BASE = process.env.AISR_API_BASE_URL;

/**
 * Determine the correct Cloud Run endpoint (free vs premium)
 * and build appropriate headers based on auth state.
 */
const getCloudRunConfig = async () => {
  const { aisrToken, isLoggedIn, isSubscribed } = await chrome.storage.local.get([
    "aisrToken",
    "isLoggedIn",
    "isSubscribed"
  ]);

  // Only route to Premium Vertex AI if they are actively subscribed
  if (isLoggedIn && aisrToken) {
    if (isSubscribed) {
      return {
        endpoint: `${API_BASE}/api/screenity`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aisrToken}`,
        },
      };
    } else {
      // Free tier — auth required to prevent abuse
      return {
        endpoint: `${API_BASE}/api/screenity/free`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aisrToken}`,
        },
      };
    }
  }

  throw new Error("Authentication required to use Smart AI features.");
};

/**
 * Helper to fetch with auto auth retry on 401
 */
const fetchWithAuthRetry = async (path, options = {}, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    const { endpoint, headers } = await getCloudRunConfig();
    const response = await fetch(`${endpoint}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    
    if (response.status === 401 && i < retries) {
      // Try to refresh auth via background script
      const refreshResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "refresh-auth" }, resolve);
      });
      if (refreshResult && refreshResult.authenticated) {
        continue; // Retry with new token
      }
    }
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `API ${response.status}`);
    }
    
    return response;
  }
};

/**
 * Convert a Blob to base64 string (without data URL prefix).
 */
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });

const Sandbox = () => {
  const iframeRef = useRef(null);
  const triggerLoad = useRef(false);
  const ffmpegInstance = useRef(null);
  const mediabunnyLoaded = useRef(false);
  const cachedVoiceoverRef = useRef(null); // { base64, mimeType }

  const sendMessage = (message) => {
    iframeRef.current?.contentWindow?.postMessage(message, "*");
  };

  const loadFfmpeg = async () => {
    if (mediabunnyLoaded.current || !triggerLoad.current) return;
    try {
      mediabunnyLoaded.current = true;
      sendMessage({ type: "processor-loaded" });
    } catch (error) {
      sendMessage({
        type: "processor-load-error",
        error: error instanceof Error ? error.message : JSON.stringify(error),
        fallback: true,
      });
    }
  };

  function isMp4Blob(blob) {
    return blob
      .slice(4, 8)
      .text()
      .then((t) => t === "ftyp");
  }

  const toBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const base64ToWebmBlob = (base64) => {
    const dataURLRegex = /^data:.+;base64,/;
    if (dataURLRegex.test(base64)) base64 = base64.replace(dataURLRegex, "");
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: "video/webm" });
  };

  const onMessage = async (message) => {
    try {
      switch (message.type) {
        case "load-ffmpeg":
          triggerLoad.current = true;
          await loadFfmpeg();
          break;

        case "add-audio-to-video": {
          const blob = await addAudioToVideo(
            ffmpegInstance.current,
            message.blob,
            message.audio,
            message.duration,
            message.volume,
            message.replaceAudio,
            (progress) =>
              sendMessage({
                type: "processor-progress",
                progress: Math.round(progress * 100),
              })
          );
          const base64 = await toBase64(blob);
          sendMessage({
            type: "updated-blob",
            base64,
            topLevel: true,
            fromAudio: true,
            _opId: message._opId,
          });
          break;
        }

        case "compress-video": {
          const rawBlob = await fetch(message.base64).then((r) => r.blob());

          const compressed = await reencodeVideo(
            ffmpegInstance.current,
            rawBlob,
            null,
            (progress) =>
              sendMessage({
                type: "compression-progress",
                progress: Math.round(progress * 100),
              })
          );
          const base64 = await toBase64(compressed);
          sendMessage({
            type: "updated-blob",
            base64,
            topLevel: true,
            _opId: message._opId,
          });
          break;
        }

        case "base64-to-blob": {
          const rawBlob = await fetch(message.base64).then((r) => r.blob());

          const header = await rawBlob.slice(4, 8).text();
          const looksMp4 = header === "ftyp";

          if (looksMp4) {
            sendMessage({
              type: "updated-blob",
              base64: message.base64,
              topLevel: true,
            });
            break;
          }

          const webmBlob = base64ToWebmBlob(message.base64);
          const mp4Blob = await convertWebmToMp4(webmBlob, (progress) =>
            sendMessage({
              type: "processor-progress",
              progress: Math.round(progress * 100),
            })
          );

          const base64 = await toBase64(mp4Blob);
          sendMessage({ type: "updated-blob", base64, topLevel: true });
          break;
        }

        case "blob-to-array-buffer": {
          const arrayBuffer = await blobToArrayBuffer(
            ffmpegInstance.current,
            message.blob
          );
          sendMessage({ type: "updated-array-buffer", arrayBuffer });
          break;
        }

        case "crop-video": {
          const blob = await cropVideo(
            ffmpegInstance.current,
            message.blob,
            {
              x: message.x,
              y: message.y,
              width: message.width,
              height: message.height,
            },
            (progress) => sendMessage({ type: "processor-progress", progress })
          );
          const base64 = await toBase64(blob);
          sendMessage({ type: "updated-blob", base64, topLevel: true, _opId: message._opId });
          break;
        }

        case "cut-video": {
          const blob = await cutVideo(
            ffmpegInstance.current,
            message.blob,
            message.startTime,
            message.endTime,
            message.cut,
            message.duration,
            message.encode,
            (progress) => sendMessage({ type: "processor-progress", progress })
          );
          const base64 = await toBase64(blob);
          sendMessage({
            type: "updated-blob",
            base64,
            addToHistory: true,
            topLevel: true,
            _opId: message._opId,
          });
          break;
        }

        case "get-frame": {
          const blob = await getFrame(
            ffmpegInstance.current,
            message.blob,
            message.time
          );
          sendMessage({ type: "new-frame", frame: blob });
          break;
        }

        case "burn-subtitles": {
          try {
            const blob = await burnSubtitles(
              ffmpegInstance.current,
              message.blob,
              message.assData,
              (progress) => sendMessage({ type: "processor-progress", progress })
            );
            const base64 = await toBase64(blob);

            sendMessage({
              type: "download-mp4",
              base64,
              topLevel: true,
              isBurned: true,
              title: message.title,
            });
          } catch (error) {
            sendMessage({
              type: "processor-error",
              error: error instanceof Error ? error.message : JSON.stringify(error),
            });
          }
          break;
        }

        case "set-saved-state": {
          if (!message.saved) {
            window.onbeforeunload = function (e) {
              e.preventDefault();
              e.returnValue = "";
              return "";
            };
          } else {
            window.onbeforeunload = null;
          }
          break;
        }

        case "has-audio": {
          const audio = await hasAudio(ffmpegInstance.current, message.video);
          sendMessage({ type: "updated-has-audio", hasAudio: audio });
          break;
        }

        case "mute-video": {
          const blob = await muteVideo(
            ffmpegInstance.current,
            message.blob,
            message.startTime,
            message.endTime,
            message.duration,
            (progress) => sendMessage({ type: "processor-progress", progress })
          );
          const base64 = await toBase64(blob);
          sendMessage({
            type: "updated-blob",
            base64,
            addToHistory: true,
            topLevel: true,
            _opId: message._opId,
          });
          break;
        }

        case "reencode-video": {
          const blob = await reencodeVideo(
            ffmpegInstance.current,
            message.blob,
            message.duration,
            (progress) =>
              sendMessage({
                type: "processor-progress",
                progress: Math.round(progress * 100),
              })
          );
          const base64 = await toBase64(blob);
          sendMessage({ type: "updated-blob", base64, topLevel: true, _opId: message._opId });
          break;
        }

        case "to-gif": {
          const blob = await toGIF(ffmpegInstance.current, message.blob);
          const base64 = await toBase64(blob);
          sendMessage({ type: "download-gif", base64 });
          break;
        }

        case "to-webm": {
          if (message.blob?.type === "video/webm") {
            const base64 = await toBase64(message.blob);
            sendMessage({ type: "download-webm", base64 });
            return;
          }

          const result = await convertMp4ToWebm(message.blob, (progress) =>
            sendMessage({
              type: "processor-progress",
              progress: Math.round(progress * 100),
            })
          );

          const base64 = await toBase64(result);
          sendMessage({ type: "download-webm", base64 });
          break;
        }

        case "ai-transcribe": {
          try {
            const videoBlob = message.blob;
            if (!videoBlob) {
              sendMessage({ type: "ai-transcribe-error", error: "No video blob provided" });
              break;
            }

            sendMessage({ type: "ai-transcribe-progress", progress: 2 });

            // Import MP3 compression utilities (replaces old WAV pipeline)
            const { prepareAudioChunks, getAudioDuration } = await import("./utils/audioCompress");

            // Free tier: client-side 20-minute duration check
            const { isSubscribed } = await chrome.storage.local.get("isSubscribed");
            const duration = await getAudioDuration(videoBlob);

            if (!isSubscribed && duration > 1200) {
              sendMessage({
                type: "ai-transcribe-error",
                error: "FREE_LIMIT_EXCEEDED",
                maxMinutes: 20,
              });
              break;
            }

            sendMessage({ type: "ai-transcribe-progress", progress: 5 });

            // 1. Extract audio → compress to MP3 64kbps chunks (20-min each)
            const chunks = await prepareAudioChunks(videoBlob, (msg) => {
              sendMessage({ type: "ai-transcribe-progress", progress: 10, statusMessage: msg });
            });

            if (chunks.length === 0) {
              throw new Error("No audio found in recording");
            }

            let allSegments = [];
            let allTranscript = "";

            // 2. Process each chunk with auto-retry (3 attempts, exponential backoff)
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const progressBase = 15 + Math.floor((i / chunks.length) * 80);
              sendMessage({ type: "ai-transcribe-progress", progress: progressBase });

              let success = false;
              let attempt = 1;
              let data = null;

              while (!success && attempt <= 3) {
                try {
                  const response = await fetchWithAuthRetry("/transcribe", {
                    method: "POST",
                    body: JSON.stringify({
                      audioBase64: chunk.base64,
                      mimeType: chunk.mimeType,
                      language: message.language || "",
                      audioDurationSec: chunk.durationSec,
                    }),
                  });

                  data = await response.json();
                  success = true;
                } catch (err) {
                  if (attempt >= 3) throw err;

                  console.warn(`[AISR] Transcribe retry ${attempt}/3:`, err?.message);
                  sendMessage({
                    type: "ai-transcribe-progress",
                    progress: progressBase,
                    statusMessage: `Retrying (${attempt}/3)...`,
                  });
                  await new Promise((r) => setTimeout(r, attempt * 3000));
                  attempt++;
                }
              }

              // Adjust timestamps: add chunk offset for multi-chunk recordings
              if (data?.segments && Array.isArray(data.segments)) {
                console.log("[AISR] API segments for chunk", i, "offset", chunk.startSec, ":", JSON.stringify(data.segments.slice(0, 3)));
                data.segments.forEach((seg) => {
                  allSegments.push({
                    start: seg.start + chunk.startSec,
                    end: seg.end + chunk.startSec,
                    text: seg.text,
                  });
                  allTranscript += seg.text + " ";
                });
              }
            }

            sendMessage({ type: "ai-transcribe-progress", progress: 100 });

            sendMessage({
              type: "ai-transcribe-result",
              segments: allSegments,
              transcript: allTranscript.trim(),
              language: message.language || "auto",
            });
          } catch (err) {
            sendMessage({
              type: "ai-transcribe-error",
              error: err.message || "Transcription failed",
            });
          }
          break;
        }

        case "ai-summarize": {
          try {
            const response = await fetchWithAuthRetry("/summarize", {
              method: "POST",
              body: JSON.stringify({ transcript: message.transcript, style: "summary" }),
            });
            const { summary } = await response.json();
            sendMessage({ type: "ai-summarize-result", summary });
          } catch (err) {
            sendMessage({ type: "ai-summarize-error", error: err.message });
          }
          break;
        }

        case "ai-action-items": {
          try {
            const response = await fetchWithAuthRetry("/summarize", {
              method: "POST",
              body: JSON.stringify({ transcript: message.transcript, style: "keypoints" }),
            });
            const { summary } = await response.json();
            sendMessage({ type: "ai-action-items-result", summary });
          } catch (err) {
            sendMessage({ type: "ai-action-items-error", error: err.message });
          }
          break;
        }

        case "ai-chapters": {
          try {
            const response = await fetchWithAuthRetry("/summarize", {
              method: "POST",
              body: JSON.stringify({ transcript: message.transcript, style: "chapters" }),
            });
            const { summary } = await response.json();
            sendMessage({ type: "ai-chapters-result", summary });
          } catch (err) {
            sendMessage({ type: "ai-chapters-error", error: err.message });
          }
          break;
        }

        case "ai-social": {
          try {
            const response = await fetchWithAuthRetry("/summarize", {
              method: "POST",
              body: JSON.stringify({ transcript: message.transcript, style: "social" }),
            });
            const { summary } = await response.json();
            sendMessage({ type: "ai-social-result", summary });
          } catch (err) {
            sendMessage({ type: "ai-social-error", error: err.message });
          }
          break;
        }

        case "ai-quiz":
        case "ai-meeting-minutes": {
          try {
            const response = await fetchWithAuthRetry("/summarize", {
              method: "POST",
              body: JSON.stringify({ transcript: message.transcript, style: "meeting_minutes" }),
            });
            const { summary } = await response.json();
            sendMessage({ type: "ai-meeting-minutes-result", summary });
          } catch (err) {
            sendMessage({ type: "ai-meeting-minutes-error", error: err.message });
          }
          break;
        }

        case "ai-voiceover": {
          try {
            sendMessage({ type: "ai-voiceover-progress", status: "generating" });
            const response = await fetchWithAuthRetry("/voiceover", {
              method: "POST",
              body: JSON.stringify({
                transcript: message.transcript,
                voice: message.voice || "autumn",
              }),
            });
            const { audioBase64, mimeType } = await response.json();

            // Cache the audio for later apply
            cachedVoiceoverRef.current = { base64: audioBase64, mimeType };

            // Send base64 string (NOT Blob) back — Blob can't cross postMessage boundary
            sendMessage({
              type: "ai-voiceover-result",
              audioBase64,
              mimeType,
            });
          } catch (err) {
            sendMessage({ type: "ai-voiceover-error", error: err.message });
          }
          break;
        }

        case "ai-apply-voiceover": {
          try {
            const cached = cachedVoiceoverRef.current;
            if (!cached) {
              sendMessage({ type: "ai-apply-voiceover-error", error: "No voiceover audio cached" });
              break;
            }

            // Convert cached base64 → Blob
            const byteChars = atob(cached.base64);
            const byteArr = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
            const audioBlob = new Blob([byteArr], { type: cached.mimeType });

            // Use addAudioToVideo to replace audio track
            const resultBlob = await addAudioToVideo(
              ffmpegInstance.current,
              message.videoBlob,
              audioBlob,
              message.duration,
              1.0,
              true, // replaceAudio
              (progress) =>
                sendMessage({ type: "processor-progress", progress: Math.round(progress * 100) })
            );

            const base64 = await toBase64(resultBlob);
            sendMessage({
              type: "updated-blob",
              base64,
              topLevel: false,
              fromAudio: true,
              _opId: message._opId,
            });
          } catch (err) {
            sendMessage({ type: "ai-apply-voiceover-error", error: err.message });
          }
          break;
        }

        case "ai-title": {
          try {
            const response = await fetchWithAuthRetry("/title", {
              method: "POST",
              body: JSON.stringify({ transcript: message.transcript }),
            });
            const result = await response.json();
            sendMessage({ type: "ai-title-result", result });
          } catch (err) {
            sendMessage({ type: "ai-title-error", error: err.message });
          }
          break;
        }

        case "ai-translate": {
          try {
            const response = await fetchWithAuthRetry("/translate", {
              method: "POST",
              body: JSON.stringify({
                segments: message.segments,
                targetLang: message.targetLang,
              }),
            });
            const { translatedSegments } = await response.json();
            sendMessage({ type: "ai-translate-result", translatedSegments });
          } catch (err) {
            sendMessage({ type: "ai-translate-error", error: err.message });
          }
          break;
        }

        case "ecosystem-relay": {
          // Relay cross-extension messages from the sandboxed AIPanel
          // Route through background service worker for reliable external messaging
          const { targetExtensionIds, payload, fallbackUrl } = message;
          if (targetExtensionIds && targetExtensionIds.length > 0 && payload) {
            const ids = targetExtensionIds;
            let currentIndex = 0;

            const tryNextId = () => {
              if (currentIndex >= ids.length) {
                if (fallbackUrl) {
                  chrome.tabs.create({ url: fallbackUrl });
                }
                return;
              }

              const currentId = ids[currentIndex];
              try {
                chrome.runtime.sendMessage(currentId, payload, (response) => {
                  if (chrome.runtime.lastError || !response) {
                    currentIndex++;
                    tryNextId();
                  } else {
                    sendMessage({ type: "ecosystem-relay-response", response });
                  }
                });
              } catch {
                currentIndex++;
                tryNextId();
              }
            };
            
            tryNextId();
          }
          break;
        }

        default:
          break;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("too long")) {
        sendMessage({ type: "edit-too-long", _opId: message._opId });
      } else {
        sendMessage({ type: "processor-error", error: errMsg, _opId: message._opId });
      }
    }
  };

  useEffect(() => {
    const handler = (event) => onMessage(event.data);
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div>
      <iframe
        ref={iframeRef}
        src={`sandbox.html${window.location.search || ""}`}
        allowFullScreen
        style={{
          width: "100%",
          border: "none",
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

export default Sandbox;
