import { Conversion, Input, BlobSource, Output, BufferTarget, WebMOutputFormat, ALL_FORMATS } from "mediabunny";

async function cutVideo(ffmpeg, videoBlob, start, end, cut, duration, encode) {
  try {
    const target = new BufferTarget();
    
    // For trim mode, mediabunny has built-in `trim` config
    const trimConfig = !cut ? { start, end } : undefined;

    // For cut mode (remove middle section), we manually drop frames and adjust timestamps
    const cutAmount = end - start;

    const conversion = await Conversion.init({
      input: new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(videoBlob),
      }),
      output: new Output({
        target,
        format: new WebMOutputFormat(),
      }),
      trim: trimConfig,
      video: {
        forceTranscode: encode || cut, // Need transcode if we manually modify timestamps (cut mode)
        process: cut ? (sample) => {
          const t = sample.timestamp;
          if (t >= start && t < end) {
            return null; // Drop frame in cut region
          }
          if (t >= end) {
            sample.setTimestamp(t - cutAmount);
          }
          return sample;
        } : undefined,
      },
      audio: {
        forceTranscode: encode || cut,
        process: cut ? (sample) => {
          const t = sample.timestamp;
          if (t >= start && t < end) {
            return null; // Drop sample in cut region
          }
          if (t >= end) {
            sample.setTimestamp(t - cutAmount);
          }
          return sample;
        } : undefined,
      }
    });

    await conversion.execute();

    return new Blob([target.buffer], { type: "video/webm" });
  } catch (error) {
    console.error("Error cutting/trimming video:", error);
    return null;
  }
}

export default cutVideo;
