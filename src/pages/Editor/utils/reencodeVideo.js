import { Conversion, Input, BlobSource, Output, BufferTarget, WebMOutputFormat, ALL_FORMATS } from "mediabunny";

async function reencodeVideo(ffmpeg, blob) {
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
        forceTranscode: true,
      },
      audio: {
        forceTranscode: true,
      }
    });

    await conversion.execute();

    return new Blob([target.buffer], { type: "video/webm" });
  } catch (error) {
    console.error("Error re-encoding video:", error);
    return null;
  }
}

export default reencodeVideo;
