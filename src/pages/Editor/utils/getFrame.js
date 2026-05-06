/* getFrame.js */
async function getFrame(ffmpeg, videoBlob, time = 0) {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(videoBlob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      // Seek to the specified time, or end of video if time exceeds duration
      video.currentTime = Math.min(time, video.duration || time);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        // Draw the current frame to the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert the canvas to a JPEG blob
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(videoUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        }, "image/jpeg", 0.95);
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Video loading error in getFrame"));
    };

    video.src = videoUrl;
    video.load();
  });
}

export default getFrame;
