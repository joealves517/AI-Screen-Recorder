const burnSubtitles = async (ffmpeg, videoBlob, assData, onProgress) => {
  // Read video into memory
  const videoBuffer = await window.fetch(window.URL.createObjectURL(videoBlob)).then((res) => res.arrayBuffer());
  ffmpeg.FS("writeFile", "input.webm", new Uint8Array(videoBuffer));

  // Write ASS data
  ffmpeg.FS("writeFile", "subtitles.ass", assData);

  // Fetch font to use in ASS
  let fontBuffer;
  try {
    fontBuffer = await fetch("assets/fonts/Satoshi-Bold.ttf").then((res) => res.arrayBuffer());
    if (!ffmpeg.FS("readdir", "/").includes("fonts")) {
      ffmpeg.FS("mkdir", "/fonts");
    }
    ffmpeg.FS("writeFile", "/fonts/Satoshi-Bold.ttf", new Uint8Array(fontBuffer));
  } catch (err) {
    console.error("Could not load font", err);
  }

  // Set progress callback if provided
  if (onProgress && ffmpeg.setProgress) {
    ffmpeg.setProgress(({ ratio }) => {
      onProgress(Math.max(0, Math.min(100, Math.round(ratio * 100))));
    });
  }

  // Run FFmpeg
  // We use the 'ass' filter. The syntax is: ass=filename:fontsdir=dir
  await ffmpeg.run(
    "-i", "input.webm",
    "-vf", "ass=subtitles.ass:fontsdir=/fonts",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-c:a", "copy",
    "output.mp4"
  );

  // Read output
  const data = ffmpeg.FS("readFile", "output.mp4");

  // Cleanup
  ffmpeg.FS("unlink", "input.webm");
  ffmpeg.FS("unlink", "subtitles.ass");
  try { ffmpeg.FS("unlink", "/fonts/Satoshi-Bold.ttf"); } catch (e) {}

  return new Blob([data.buffer], { type: "video/mp4" });
};

export default burnSubtitles;
