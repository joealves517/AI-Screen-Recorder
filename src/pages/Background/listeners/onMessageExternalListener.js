/**
 * Cross-extension message handler.
 * Responds to PING from sister extensions (BlackNote, Spark AI)
 * to enable ecosystem feature detection.
 */
export const onMessageExternalListener = () => {
  chrome.runtime.onMessageExternal.addListener(
    (message, _sender, sendResponse) => {
      if (message?.type === "PING") {
        sendResponse({ pong: true });
        return;
      }
    }
  );
};
