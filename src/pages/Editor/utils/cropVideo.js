import { Conversion, Input, BlobSource, Output, BufferTarget, WebMOutputFormat, ALL_FORMATS } from "mediabunny";

async function cropVideo(ffmpeg, videoBlob, cropParameters) {
  try {
    const target = new BufferTarget();

    const conversion = await Conversion.init({
      input: new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(videoBlob),
      }),
      output: new Output({
        target,
        format: new WebMOutputFormat(),
      }),
      video: {
        forceTranscode: true, // Need transcode to crop frames
        crop: {
          left: cropParameters.x,
          top: cropParameters.y,
          width: cropParameters.width,
          height: cropParameters.height,
        },
      },
      audio: {
        forceTranscode: false, // Stream copy the audio
      }
    });

    await conversion.execute();

    return new Blob([target.buffer], { type: "video/webm" });
  } catch (error) {
    console.error("Error cropping video:", error);
    return null;
  }
}

export default cropVideo;
