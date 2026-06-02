import React, { useState, useEffect, useContext, useRef } from "react";

// Context
import { contentStateContext } from "../context/ContentState";

const COUNTDOWN_TIME = 3;
const DEBUG_START_FLOW =
  typeof window !== "undefined" ? !!window.AISR_DEBUG_RECORDER : false;

const Countdown = () => {
  const [contentState, setContentState] = useContext(contentStateContext);
  const [count, setCount] = useState(COUNTDOWN_TIME);
  const [showFlash, setShowFlash] = useState(false);

  const intervalRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const cancelledRef = useRef(false);
  const finishRef = useRef(null);
  const activeRef = useRef(false);
  const runIdRef = useRef(0);

  // Only clear countdown-specific timers, never the post-countdown dispatch
  const cleanupTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  };

  const logStartFlow = (event, data = {}) => {
    if (!DEBUG_START_FLOW) return;
    const payload = { ts: Date.now(), event, ...data };
    console.info("[AISR][StartFlow]", payload);
    try {
      const update = {
        startFlowDebug: { ...(data || {}), event, ts: payload.ts },
      };
      if (event === "countdown_start") update.countdownVisibleAt = payload.ts;
      else if (event === "countdown_end") update.countdownHiddenAt = payload.ts;
      chrome.storage.local.set(update);
    } catch {}
  };

  useEffect(() => {
    activeRef.current = contentState.countdownActive;
    cancelledRef.current = contentState.countdownCancelled;
    finishRef.current = contentState.onCountdownFinished;
  }, [
    contentState.countdownActive,
    contentState.countdownCancelled,
    contentState.onCountdownFinished,
  ]);

  const handleCancel = () => {
    if (contentState.countdownActive || contentState.isCountdownVisible) {
      cleanupTimers();
      setCount(COUNTDOWN_TIME);
      setShowFlash(false);
      logStartFlow("countdown_cancel", { visible: false });
      contentState.cancelCountdown();
    }
  };

  useEffect(() => {
    if (!contentState.countdownActive) {
      cleanupTimers();
      return;
    }

    cleanupTimers();
    setCount(COUNTDOWN_TIME);
    setShowFlash(false);
    runIdRef.current += 1;
    const runId = runIdRef.current;
    logStartFlow("countdown_start", { visible: true });

    let currentCount = COUNTDOWN_TIME;

    intervalRef.current = setInterval(() => {
      if (runIdRef.current !== runId || cancelledRef.current) return;
      currentCount -= 1;

      if (currentCount <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        // Show flash effect
        setShowFlash(true);

        // After flash (300ms), hide UI and dispatch start signal
        finishTimeoutRef.current = setTimeout(() => {
          if (cancelledRef.current || !activeRef.current) return;

          // Call onCountdownFinished (plays beep sound)
          finishRef.current?.();

          // Hide the countdown UI
          setContentState((prev) => ({
            ...prev,
            isCountdownVisible: false,
            countdownActive: false,
          }));

          const endedAt = Date.now();
          logStartFlow("countdown_end", { visible: false, endedAt });
          chrome.storage.local.set({
            countdownFinishedAt: endedAt,
            lastCountdownStartGate: {
              endedAt,
              countdownHiddenAt: endedAt,
              startDispatchedAt: endedAt,
              overlayVisible: false,
              ts: endedAt,
            },
          });

          // Wait for paint after hiding, then send the start signal
          // Using rAF ensures the countdown overlay is fully gone before
          // the recording begins (avoids capturing countdown frame).
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (cancelledRef.current) return;
              chrome.runtime
                .sendMessage({ type: "countdown-finished", endedAt })
                .catch(() => {});
            });
          });

          finishTimeoutRef.current = null;
        }, 300);

        return;
      }

      setCount(currentCount);
    }, 1000);

    return cleanupTimers;
  }, [contentState.countdownActive]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupTimers;
  }, []);

  return (
    <div
      className={`countdown ${contentState.countdownActive ? "recording-countdown" : ""}`}
      onClick={handleCancel}
    >
      {contentState.isCountdownVisible && (
        <div className="camera-ui-container">
          {count > 0 && !showFlash && (
            <div key={count} className="camera-number">
              {count}
            </div>
          )}
          {showFlash && <div className="camera-flash"></div>}
        </div>
      )}
    </div>
  );
};

export default Countdown;

