/**
 * Burn Subtitles — WebCodecs Router
 *
 * Previously used FFmpeg.wasm to burn ASS subtitles into video.
 * Now routes through the WebCodecs-based pipeline for significantly
 * faster processing with hardware acceleration.
 *
 * The `ffmpeg` parameter is retained for API compatibility with
 * Sandbox.jsx but is not used internally.
 */
import burnSubtitlesWebCodecs from "./burnSubtitlesWebCodecs";

const burnSubtitles = async (ffmpeg, videoBlob, assData, onProgress) => {
  return burnSubtitlesWebCodecs(videoBlob, assData, onProgress);
};

export default burnSubtitles;

