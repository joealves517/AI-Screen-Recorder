import React, { useEffect, useRef } from "react";

const Sandbox = () => {
  const iframeRef = useRef(null);

  const sendMessage = (message) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, "*");
    }
  };

  const onMessage = async (message) => {
    if (message.type === "save-recorded-video") {
      console.log("[AISR][Parent] Received save-recorded-video from iframe. Saving to VidFlowDB...");
      const finalBlob = message.blob;
      const duration = message.duration || 0;
      
      const dbName = "VidFlowDB";
      const storeName = "videos";
      const version = 2;

      const request = indexedDB.open(dbName, version);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        
        const saveAndRedirect = (database) => {
          try {
            const transaction = database.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);

            const videoData = {
              blob: finalBlob,
              duration: duration,
              videoId: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              timestamp: Date.now(),
              isRecordedVideo: true,
              cameraBlob: null,
              cameraConfig: null,
            };

            const putRequest = store.put(videoData, "currentVideo");

            transaction.oncomplete = () => {
              database.close();
              console.log("[AISR][Parent] Successfully saved video to VidFlowDB! Redirecting parent to openvideditor...");
              const targetUrl = chrome.runtime.getURL("/openvideditor.html?page=editor");
              window.location.href = targetUrl;
            };

            transaction.onerror = (err) => {
              database.close();
              console.error("[AISR][Parent] Failed to put video in VidFlowDB:", err);
            };
          } catch (err) {
            database.close();
            console.error("[AISR][Parent] Error in saveAndRedirect transaction:", err);
          }
        };

        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          const retryRequest = indexedDB.open(dbName, version + 1);
          retryRequest.onupgradeneeded = (e) => {
            const retryDb = e.target.result;
            if (!retryDb.objectStoreNames.contains(storeName)) {
              retryDb.createObjectStore(storeName);
            }
          };
          retryRequest.onsuccess = () => {
            saveAndRedirect(retryRequest.result);
          };
          return;
        }

        saveAndRedirect(db);
      };

      request.onerror = (e) => {
        console.error("[AISR][Parent] Failed to open VidFlowDB:", e);
      };
      return;
    }

    if (message.type === "load-ffmpeg") {
      sendMessage({ type: "processor-load-error", fallback: true });
    } else if (
      message.type === "add-audio-to-video" ||
      message.type === "base64-to-blob" ||
      message.type === "crop-video" ||
      message.type === "cut-video" ||
      message.type === "mute-video" ||
      message.type === "reencode-video" ||
      message.type === "to-gif"
    ) {
      sendMessage({
        type: "processor-error",
        error:
          "Processing not available in viewer mode. Please use a modern browser (Chrome 94+) for editing features.",
      });
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
