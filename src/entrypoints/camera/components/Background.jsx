import React, { useRef, useEffect } from "react";
import { useCameraContext } from "../context/CameraContext";
import { segmentFromVideo } from "../utils/backgroundUtils";
import {
  isWebGPUSupported,
  initWebGPUPipeline,
  configureCanvasContext,
  renderWebGPU,
} from "../utils/webgpuUtils";

const Background = () => {
  const canvasContextRef = useRef(null);
  const webgpuReadyRef = useRef(false);

  const {
    videoRef,
    backgroundEffects,
    setBackgroundEffects,
    segmenterRef,
    blurRef,
    effectRef,
    offScreenCanvasRef,
  } = useCameraContext();
  
  const canvasRef = offScreenCanvasRef;

  // Initialize WebGPU once on mount
  useEffect(() => {
    const init = async () => {
      try {
        if (!canvasRef.current) return;

        const supported = await isWebGPUSupported();
        if (!supported) {
          console.error("WebGPU is not supported on this device. Background effects disabled.");
          setBackgroundEffects(false);
          return;
        }

        canvasContextRef.current = canvasRef.current.getContext("webgpu");
        if (!canvasContextRef.current) {
          throw new Error("Failed to get WebGPU context");
        }
        const format = configureCanvasContext(canvasContextRef.current);
        await initWebGPUPipeline(format);
        webgpuReadyRef.current = true;
      } catch (err) {
        console.error("WebGPU Initialization Failed:", err);
        setBackgroundEffects(false);
      }
    };
    init();
  }, []);

  // Render loop: segment video + render via WebGPU
  useEffect(() => {
    if (!backgroundEffects) return;

    let animFrameId;
    let running = true;
    let consecutiveErrors = 0;

    const tick = () => {
      if (!running) return;

      try {
        const video = videoRef.current;
        const segmenter = segmenterRef.current;

        if (
          video &&
          video.readyState >= 2 &&
          segmenter &&
          video.videoWidth > 0 &&
          webgpuReadyRef.current &&
          canvasContextRef.current
        ) {
          const result = segmentFromVideo(video, segmenter);

          if (result && result.categoryMask) {
            consecutiveErrors = 0;

            const effectType = blurRef.current ? "blur" : "image";
            const effectImage = blurRef.current ? null : effectRef.current;

            renderWebGPU(
              canvasContextRef.current,
              video,
              result,
              effectType,
              effectImage,
            );
          }
        }
      } catch (error) {
        consecutiveErrors++;
        console.error("Background segmentation error:", error);
        if (consecutiveErrors >= 3) {
          console.warn("Disabling background effects after repeated failures");
          setBackgroundEffects(false);
          return;
        }
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameId);
    };
  }, [backgroundEffects]);

  // Listen for Chrome extension messages
  useEffect(() => {
    const handleMessage = (request) => {
      if (request.type === "set-background-effect") {
        if (globalThis.AISR_VERBOSE_LOGS) {
          console.log("Background component received effect change message");
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 99999,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      <canvas
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "100%",
          zIndex: 999999,
          opacity: backgroundEffects ? 1 : 0,
          backgroundColor: "transparent",
        }}
        ref={canvasRef}
      ></canvas>
    </div>
  );
};

export default Background;
