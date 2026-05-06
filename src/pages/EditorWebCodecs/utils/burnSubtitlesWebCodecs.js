/**
 * WebCodecs Subtitle Burner
 *
 * Hardcodes subtitles into a video using the WebCodecs API instead
 * of FFmpeg.wasm. Pipeline:
 *
 *   1. Parse ASS subtitle data into structured segments
 *   2. Decode source video frame-by-frame via <video> seek
 *   3. Draw each frame onto OffscreenCanvas, overlay subtitle text
 *   4. Re-encode via VideoEncoder (hardware-accelerated)
 *   5. Mux video + audio passthrough into final MP4 via mediabunny
 *
 * This is significantly faster than FFmpeg.wasm because encoding
 * uses hardware acceleration (GPU) when available.
 */

import { parseASS, colorToRgba } from "./assParser";
import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  EncodedVideoPacketSource,
  EncodedPacket,
  AudioSampleSource,
  AudioSample,
  ALL_FORMATS,
} from "mediabunny";

/**
 * Burn subtitles into a video blob using WebCodecs.
 *
 * @param {Blob} videoBlob   - Source video blob
 * @param {string} assData   - ASS subtitle content
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Output MP4 blob with burned subtitles
 */
async function burnSubtitlesWebCodecs(videoBlob, assData, onProgress = () => {}) {
  const { styles, dialogues } = parseASS(assData);

  // ── Step 1: Probe video metadata ───────────────────────────────
  const probeVideo = document.createElement("video");
  probeVideo.muted = true;
  probeVideo.preload = "metadata";

  const videoUrl = URL.createObjectURL(videoBlob);
  const metadata = await new Promise((resolve, reject) => {
    probeVideo.onloadedmetadata = () => {
      resolve({
        width: probeVideo.videoWidth,
        height: probeVideo.videoHeight,
        duration: probeVideo.duration,
      });
    };
    probeVideo.onerror = () => reject(new Error("Failed to probe video metadata"));
    probeVideo.src = videoUrl;
  });
  probeVideo.remove();
  URL.revokeObjectURL(videoUrl);

  const { width, height, duration } = metadata;
  const fps = 30;
  const totalFrames = Math.ceil(duration * fps);
  const frameDurationUs = Math.round(1_000_000 / fps);

  onProgress(5);

  // ── Step 2: Load custom font if available ───────────────────────
  try {
    const fontUrl = chrome.runtime.getURL("assets/fonts/Satoshi-Bold.ttf");
    const fontFace = new FontFace("Satoshi", `url(${fontUrl})`);
    await fontFace.load();
    document.fonts.add(fontFace);
  } catch {
    // Font unavailable — fall back to system fonts
  }

  // ── Step 3: Setup canvas for frame compositing ─────────────────
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ── Step 4: Setup encoder ──────────────────────────────────────
  const encodedChunks = [];
  const encoderConfig = await selectEncoderConfig(width, height, fps);

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      encodedChunks.push({ chunk, meta });
    },
    error: (err) => {
      console.error("[BurnSub:WC] VideoEncoder error:", err);
    },
  });

  videoEncoder.configure(encoderConfig);

  // ── Step 5: Source video for frame extraction ──────────────────
  const sourceVideo = document.createElement("video");
  sourceVideo.muted = true;
  sourceVideo.preload = "auto";
  const srcUrl = URL.createObjectURL(videoBlob);
  sourceVideo.src = srcUrl;

  await new Promise((resolve, reject) => {
    sourceVideo.oncanplaythrough = resolve;
    sourceVideo.onerror = () => reject(new Error("Failed to load source video"));
    sourceVideo.load();
  });

  // ── Step 6: Frame-by-frame processing loop ─────────────────────
  for (let i = 0; i < totalFrames; i++) {
    const timeSec = i / fps;
    const timeUs = i * frameDurationUs;

    // Seek to target time
    await seekVideo(sourceVideo, timeSec);

    // Draw source frame
    ctx.drawImage(sourceVideo, 0, 0, width, height);

    // Find active subtitle at this time
    const activeDialogue = dialogues.find(
      (d) => timeSec >= d.start && timeSec < d.end
    );

    if (activeDialogue) {
      renderSubtitle(ctx, activeDialogue, styles, width, height);
    }

    // Create VideoFrame from composited canvas
    const frame = new VideoFrame(canvas, {
      timestamp: timeUs,
      duration: frameDurationUs,
    });

    const keyFrame = i === 0 || i % 60 === 0;
    videoEncoder.encode(frame, { keyFrame });
    frame.close();

    // Report progress (encoding is 5-85%)
    const pct = 5 + Math.floor((i / totalFrames) * 80);
    onProgress(pct);

    // Yield to event loop periodically to keep UI responsive
    if (i % 10 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // Flush remaining encoded chunks
  await videoEncoder.flush();
  videoEncoder.close();

  sourceVideo.remove();
  URL.revokeObjectURL(srcUrl);

  onProgress(88);

  // ── Step 7: Mux encoded video + original audio into MP4 ────────
  const outputBlob = await muxWithMediabunny(
    videoBlob, encodedChunks, width, height, fps, duration, onProgress
  );

  onProgress(100);
  return outputBlob;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Seek a video element to a specific time and wait for the frame.
 */
function seekVideo(video, timeSec) {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - timeSec) < 0.001) {
      resolve();
      return;
    }
    const handler = () => {
      video.removeEventListener("seeked", handler);
      resolve();
    };
    video.addEventListener("seeked", handler);
    video.currentTime = Math.min(timeSec, video.duration - 0.001);
  });
}

/**
 * Render subtitle text onto the canvas.
 */
function renderSubtitle(ctx, dialogue, stylesMap, canvasWidth, canvasHeight) {
  const style = stylesMap.get(dialogue.styleName) || stylesMap.get("Default");
  const {
    primaryColor,
    backColor,
    outlineColor,
    fontSize,
    fontName,
    bold,
    outline,
    alignment,
    marginV,
    borderStyle,
  } = style;

  // Scale font size relative to canvas height (ASS uses PlayResY=1080)
  const scaledFontSize = Math.round((fontSize / 1080) * canvasHeight);
  const fontWeight = bold ? "bold" : "normal";
  const fontFamily = `${fontName}, Satoshi, sans-serif`;

  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const lines = dialogue.text.split("\n");
  const lineHeight = scaledFontSize * 1.3;
  const totalTextHeight = lines.length * lineHeight;

  // Position: alignment 2 = bottom-center (most common for subtitles)
  const scaledMarginV = Math.round((marginV / 1080) * canvasHeight);
  let baseY;
  if (alignment <= 3) {
    // Bottom
    baseY = canvasHeight - scaledMarginV;
  } else if (alignment <= 6) {
    // Middle
    baseY = canvasHeight / 2 + totalTextHeight / 2;
  } else {
    // Top
    baseY = scaledMarginV + totalTextHeight;
  }

  const textX = canvasWidth / 2;

  lines.forEach((lineText, lineIdx) => {
    const y = baseY - (lines.length - 1 - lineIdx) * lineHeight;
    const metrics = ctx.measureText(lineText);
    const textWidth = metrics.width;

    // Background box (BorderStyle 3 = opaque box)
    if (borderStyle === 3) {
      const padding = scaledFontSize * 0.25;
      ctx.fillStyle = colorToRgba(backColor);
      ctx.fillRect(
        textX - textWidth / 2 - padding,
        y - scaledFontSize - padding * 0.3,
        textWidth + padding * 2,
        scaledFontSize + padding * 1.2
      );
    }

    // Text outline for readability
    if (outline > 0) {
      ctx.strokeStyle = colorToRgba(outlineColor);
      ctx.lineWidth = Math.max(2, outline * 2);
      ctx.lineJoin = "round";
      ctx.strokeText(lineText, textX, y);
    }

    // Primary text fill
    ctx.fillStyle = colorToRgba(primaryColor);
    ctx.fillText(lineText, textX, y);
  });
}

/**
 * Select the best H.264 encoder configuration.
 */
async function selectEncoderConfig(width, height, fps) {
  const candidates = [
    { codec: "avc1.64002A", hw: "prefer-hardware" },
    { codec: "avc1.4D401F", hw: "prefer-hardware" },
    { codec: "avc1.42E01E", hw: "prefer-hardware" },
    { codec: "avc1.64002A", hw: "prefer-software" },
    { codec: "avc1.4D401F", hw: "prefer-software" },
    { codec: "avc1.42E01E", hw: "prefer-software" },
  ];

  const base = {
    width,
    height,
    framerate: fps,
    bitrate: 8_000_000,
    bitrateMode: "constant",
    latencyMode: "quality",
  };

  for (const c of candidates) {
    const config = { ...base, codec: c.codec, hardwareAcceleration: c.hw };
    try {
      const support = await VideoEncoder.isConfigSupported(config);
      if (support?.supported) {
        return support.config || config;
      }
    } catch {
      // Try next candidate
    }
  }

  // Last resort fallback
  return { ...base, codec: "avc1.42E01E" };
}

/**
 * Mux re-encoded video chunks with the original audio into an MP4.
 * Uses mediabunny's Output pipeline — same library the project
 * already depends on for all other video operations.
 */
async function muxWithMediabunny(
  originalBlob, encodedVideoChunks, width, height, fps, duration, onProgress
) {
  const outputTarget = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target: outputTarget,
  });

  // Video track: feed pre-encoded H.264 chunks
  const videoSource = new EncodedVideoPacketSource("avc");
  output.addVideoTrack(videoSource, { frameRate: fps });

  // Audio track: decode from original, re-encode as AAC
  const audioSource = new AudioSampleSource({
    codec: "aac",
    bitrate: 128_000,
  });

  // Probe whether the original has audio
  let hasAudio = false;
  let decodedAudio = null;
  let audioSampleRate = 48000;

  try {
    const audioCtx = new AudioContext();
    const arrayBuf = await originalBlob.arrayBuffer();
    decodedAudio = await audioCtx.decodeAudioData(arrayBuf);
    audioSampleRate = decodedAudio.sampleRate;
    hasAudio = true;
    audioCtx.close().catch(() => {});
  } catch {
    hasAudio = false;
  }

  if (hasAudio) {
    output.addAudioTrack(audioSource);
  }

  await output.start();

  // Feed video chunks
  for (const { chunk, meta } of encodedVideoChunks) {
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);

    const tsSeconds = (chunk.timestamp || 0) / 1_000_000;
    const durSeconds = (chunk.duration || 0) / 1_000_000;
    const packet = new EncodedPacket(data, chunk.type, tsSeconds, durSeconds);

    await videoSource.add(packet, meta);
  }

  onProgress(92);

  // Feed audio samples from decoded original
  if (hasAudio && decodedAudio) {
    const sr = audioSampleRate;
    const totalSamples = Math.floor(duration * sr);
    const chunkSize = sr * 2; // 2-second chunks
    let written = 0;

    const channelData = decodedAudio.getChannelData(0);

    while (written < totalSamples && written < channelData.length) {
      const end = Math.min(written + chunkSize, totalSamples, channelData.length);
      const slice = channelData.slice(written, end);
      const dur = slice.length / sr;

      const sample = new AudioSample({
        data: slice,
        format: "f32-planar",
        numberOfChannels: 1,
        sampleRate: sr,
        timestamp: written / sr,
        duration: dur,
      });

      await audioSource.add(sample);
      sample.close();
      written = end;
    }
  }

  onProgress(96);

  await output.finalize();

  if (!outputTarget.buffer) {
    throw new Error("WebCodecs subtitle burn produced no output");
  }

  return new Blob([outputTarget.buffer], { type: "video/mp4" });
}

export default burnSubtitlesWebCodecs;
