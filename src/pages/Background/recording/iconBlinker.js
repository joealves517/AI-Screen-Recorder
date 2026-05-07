let blinkInterval = null;
let canvas = null;
let ctx = null;
let startTime = 0;

export const startBlinkingIcon = () => {
  if (blinkInterval) return;

  // Initialize OffscreenCanvas for drawing the icon (supported in MV3 Service Workers)
  if (!canvas) {
    try {
      canvas = new OffscreenCanvas(32, 32);
      ctx = canvas.getContext("2d", { willReadFrequently: true });
    } catch (err) {
      console.warn("OffscreenCanvas not supported, falling back to static icon.", err);
      chrome.action.setIcon({ path: "assets/recording-logo.png" });
      return; // Fallback for browsers that don't support it
    }
  }

  startTime = Date.now();
  
  // Update the icon at ~15fps for a smooth fade
  blinkInterval = setInterval(() => {
    if (!ctx || !canvas) return;
    
    // Calculate smooth fade using sine wave (period = 2000ms)
    // Values range from 0.2 to 1.0
    const elapsed = Date.now() - startTime;
    const alpha = 0.2 + 0.8 * ((Math.sin(elapsed / 300) + 1) / 2);

    // Clear canvas
    ctx.clearRect(0, 0, 32, 32);
    
    // Draw red recording dot
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#ef4444"; // Red color
    ctx.fill();

    // Get ImageData and set it as the extension icon
    try {
      const imageData = ctx.getImageData(0, 0, 32, 32);
      chrome.action.setIcon({ imageData });
    } catch (e) {
      console.error("Failed to set blinking icon", e);
    }
  }, 66); // ~15 FPS
};

export const stopBlinkingIcon = () => {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
  // Restore the original official app icon
  chrome.action.setIcon({ path: "assets/icon-34.png" }).catch(() => {});
};
