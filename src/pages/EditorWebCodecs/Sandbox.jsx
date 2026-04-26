import React, { useEffect, useRef } from "react";

import addAudioToVideo from "./utils/addAudioToVideo";
import convertWebmToMp4 from "./utils/convertWebmToMp4";
import cropVideo from "./utils/cropVideo";
import cutVideo from "./utils/cutVideo";
import muteVideo from "./utils/muteVideo";
import reencodeVideo from "./utils/reencodeVideo";
import toGIF from "./utils/toGIF";
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
  if (isLoggedIn && aisrToken && isSubscribed) {
    return {
      endpoint: `${API_BASE}/api/screenity`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aisrToken}`,
      },
    };
  }

  // Free/guest tier — no auth required
  return {
    endpoint: `${API_BASE}/api/screenity/free`,
    headers: {
      "Content-Type": "application/json",
    },
  };
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

  const sendMessage = (message) => {
    iframeRef.current?.contentWindow?.postMessage(message, "*");
  };

  const loadFfmpeg = async () => {
    if (mediabunnyLoaded.current || !triggerLoad.current) return;
    try {
      mediabunnyLoaded.current = true;
      sendMessage({ type: "ffmpeg-loaded" });
    } catch (error) {
      sendMessage({
        type: "ffmpeg-load-error",
        error: JSON.stringify(error),
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
                type: "ffmpeg-progress",
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
              type: "ffmpeg-progress",
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
            (progress) => sendMessage({ type: "ffmpeg-progress", progress })
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
            (progress) => sendMessage({ type: "ffmpeg-progress", progress })
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
            (progress) => sendMessage({ type: "ffmpeg-progress", progress })
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
                type: "ffmpeg-progress",
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
              type: "ffmpeg-progress",
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

            sendMessage({ type: "ai-transcribe-progress", progress: 5 });

            // 1. Extract audio and split into 10-minute chunks
            const { extractAndChunkAudio } = await import("./utils/extractAudioToChunks");
            const chunks = await extractAndChunkAudio(videoBlob, 600); // 10 min
            
            if (chunks.length === 0) {
              throw new Error("No audio found in recording");
            }

            const { endpoint, headers } = await getCloudRunConfig();
            
            let allSegments = [];
            let allTranscript = "";

            // 2. Process each chunk
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const progressBase = 10 + Math.floor((i / chunks.length) * 80);
              sendMessage({ type: "ai-transcribe-progress", progress: progressBase });

              const base64Data = await blobToBase64(chunk.blob);

              const response = await fetch(`${endpoint}/transcribe`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  audioBase64: base64Data,
                  mimeType: "audio/wav",
                  language: message.language || "",
                }),
              });

              if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `API ${response.status}`);
              }

              const { segments } = await response.json();
              
              // Adjust timestamps using chunk offset
              if (Array.isArray(segments)) {
                segments.forEach((seg) => {
                  allSegments.push({
                    start: seg.start + chunk.offset,
                    end: seg.end + chunk.offset,
                    text: seg.text
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
            const { endpoint, headers } = await getCloudRunConfig();
            const response = await fetch(`${endpoint}/summarize`, {
              method: "POST",
              headers,
              body: JSON.stringify({ transcript: message.transcript, style: "summary" }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              throw new Error(err.error || `API ${response.status}`);
            }
            const { summary } = await response.json();
            sendMessage({ type: "ai-summarize-result", summary });
          } catch (err) {
            sendMessage({ type: "ai-summarize-error", error: err.message });
          }
          break;
        }

        case "ai-action-items": {
          try {
            const { endpoint, headers } = await getCloudRunConfig();
            const response = await fetch(`${endpoint}/summarize`, {
              method: "POST",
              headers,
              body: JSON.stringify({ transcript: message.transcript, style: "keypoints" }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              throw new Error(err.error || `API ${response.status}`);
            }
            const { summary } = await response.json();
            sendMessage({ type: "ai-action-items-result", summary });
          } catch (err) {
            sendMessage({ type: "ai-action-items-error", error: err.message });
          }
          break;
        }

        case "ai-title": {
          try {
            const { endpoint, headers } = await getCloudRunConfig();
            const response = await fetch(`${endpoint}/title`, {
              method: "POST",
              headers,
              body: JSON.stringify({ transcript: message.transcript }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              throw new Error(err.error || `API ${response.status}`);
            }
            const result = await response.json();
            sendMessage({ type: "ai-title-result", result });
          } catch (err) {
            sendMessage({ type: "ai-title-error", error: err.message });
          }
          break;
        }

        case "ai-translate": {
          try {
            const { endpoint, headers } = await getCloudRunConfig();
            const response = await fetch(`${endpoint}/translate`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                segments: message.segments,
                targetLang: message.targetLang,
              }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              throw new Error(err.error || `API ${response.status}`);
            }
            const { translatedSegments } = await response.json();
            sendMessage({ type: "ai-translate-result", translatedSegments });
          } catch (err) {
            sendMessage({ type: "ai-translate-error", error: err.message });
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
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error), _opId: message._opId });
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
