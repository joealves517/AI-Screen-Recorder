import GIF from "gif.js";
import gifWorkerStr from "!!raw-loader!gif.js/dist/gif.worker.js";

async function toGIF(ffmpeg, blob) {
  return new Promise((resolve, reject) => {
    try {
      // Load the worker script via blob URL to avoid cross-origin issues in extension context
      const workerBlob = new Blob([gifWorkerStr], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(workerBlob);

      const gif = new GIF({
        workers: 4,
        quality: 10,
        workerScript: workerUrl,
        width: 640,
      });

      const videoUrl = URL.createObjectURL(blob);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      video.onloadedmetadata = () => {
        const canvas = document.createElement("canvas");
        const aspectRatio = video.videoHeight / video.videoWidth;
        canvas.width = Math.min(video.videoWidth, 640);
        canvas.height = Math.round(canvas.width * aspectRatio);
        const ctx = canvas.getContext("2d");

        // Update GIF dimensions to match the canvas
        gif.options.width = canvas.width;
        gif.options.height = canvas.height;

        const fps = 10;
        const duration = video.duration;
        const frameCount = Math.floor(duration * fps);
        const interval = 1 / fps;
        let currentFrame = 0;

        const captureFrame = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          gif.addFrame(ctx, { copy: true, delay: interval * 1000 });

          currentFrame++;
          if (currentFrame <= frameCount) {
            video.currentTime = currentFrame * interval;
          } else {
            gif.render();
          }
        };

        video.addEventListener("seeked", captureFrame);

        gif.on("finished", (gifBlob) => {
          URL.revokeObjectURL(videoUrl);
          URL.revokeObjectURL(workerUrl);
          resolve(gifBlob);
        });

        // If video starts at time 0, "seeked" won't fire for currentTime = 0.
        // We handle this by capturing the first frame directly on loadeddata,
        // then seeking to the next frame.
        video.addEventListener("loadeddata", () => {
          captureFrame();
        }, { once: true });
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        URL.revokeObjectURL(workerUrl);
        reject(new Error("Video load error for GIF export"));
      };

      video.src = videoUrl;
      video.load();
    } catch (error) {
      console.error("Error creating GIF:", error);
      reject(error);
    }
  });
}

export default toGIF;
