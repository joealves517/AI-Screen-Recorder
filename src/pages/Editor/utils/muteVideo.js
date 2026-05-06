import { Conversion, Input, BlobSource, Output, BufferTarget, WebMOutputFormat, ALL_FORMATS, AudioSample } from "mediabunny";

async function muteVideo(ffmpeg, videoBlob, start, end) {
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
      audio: {
        forceTranscode: true,
        process: (sample) => {
          const t = sample.timestamp;
          if (t >= start && t <= end) {
            // Replace with silence by zeroing the AudioBuffer
            const buffer = sample.toAudioBuffer();
            for (let i = 0; i < buffer.numberOfChannels; i++) {
              buffer.getChannelData(i).fill(0);
            }
            // fromAudioBuffer returns AudioSample[] — Conversion.process accepts arrays
            return AudioSample.fromAudioBuffer(buffer, t);
          }
          return sample;
        }
      }
    });

    await conversion.execute();

    return new Blob([target.buffer], { type: "video/webm" });
  } catch (error) {
    console.error("Error muting video:", error);
    return null;
  }
}

export default muteVideo;
