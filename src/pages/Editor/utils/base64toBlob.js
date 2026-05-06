import { Conversion, Input, BlobSource, Output, BufferTarget, WebMOutputFormat, ALL_FORMATS } from "mediabunny";

function base64ToUint8Array(base64) {
  const dataURLRegex = /^data:.+;base64,/;
  if (dataURLRegex.test(base64)) {
    base64 = base64.replace(dataURLRegex, "");
  }

  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }

  return bytes;
}

async function base64ToBlob(ffmpeg, base64) {
  try {
    const input = base64ToUint8Array(base64);
    const inputBlob = new Blob([input], { type: "video/webm" });

    const target = new BufferTarget();

    const conversion = await Conversion.init({
      input: new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(inputBlob),
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
    console.error("Error converting base64 to blob:", error);
    return null;
  }
}

export default base64ToBlob;
