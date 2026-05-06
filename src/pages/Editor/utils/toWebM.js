import { Conversion, Input, BlobSource, Output, BufferTarget, WebMOutputFormat, ALL_FORMATS } from "mediabunny";

async function toWebM(ffmpeg, blob) {
  try {
    const target = new BufferTarget();
    
    const conversion = await Conversion.init({
      input: new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(blob),
      }),
      output: new Output({
        target,
        format: new WebMOutputFormat(),
      }),
      video: {
        forceTranscode: true, // Transcode to VP8/VP9 for WebM compatibility
      },
      audio: {
        forceTranscode: true, // Transcode to Opus/Vorbis
      }
    });

    await conversion.execute();

    return new Blob([target.buffer], { type: "video/webm" });
  } catch (error) {
    console.error("Error converting to WebM:", error);
    return null;
  }
}

export default toWebM;
