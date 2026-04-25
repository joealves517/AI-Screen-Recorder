/**
 * Audio Extraction & Chunking Utility
 * Decodes video blob audio to a low sample rate (16kHz mono) to drastically reduce size.
 * Chunks the audio into 10-minute segments and converts them to standard WAV format.
 * This prevents Cloud Run/Gemini payload limits and memory crashes on long screen recordings.
 */

export async function extractAndChunkAudio(videoBlob, maxChunkDurationSec = 600) {
  // Decode audio at 16kHz to minimize memory and payload size
  // 10 minutes at 16kHz 16-bit mono = ~19 MB
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  let decodedAudio;
  
  try {
    const arrayBuffer = await videoBlob.arrayBuffer();
    decodedAudio = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close().catch(() => {});
  }

  const sampleRate = decodedAudio.sampleRate;
  const numChannels = 1; // force mono
  const duration = decodedAudio.duration;
  
  const chunks = [];
  let currentTime = 0;

  // Split into chunks (e.g. 10 minutes each)
  while (currentTime < duration) {
    const startSample = Math.floor(currentTime * sampleRate);
    const endTime = Math.min(currentTime + maxChunkDurationSec, duration);
    const endSample = Math.floor(endTime * sampleRate);
    const frameCount = endSample - startSample;

    const offlineCtx = new OfflineAudioContext(numChannels, frameCount, sampleRate);
    
    // Create source from the segment
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedAudio;
    source.connect(offlineCtx.destination);
    
    // Play only the needed segment
    source.start(0, currentTime, endTime - currentTime);
    
    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWav(renderedBuffer);
    
    chunks.push({
      blob: wavBlob,
      offset: currentTime, // used to adjust timestamps from Gemini
      duration: endTime - currentTime
    });

    currentTime = endTime;
  }

  return chunks;
}

// Convert AudioBuffer to a valid WAV blob
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const result = new Int16Array(buffer.length * numChannels);
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  // Interleave channels & convert float32 to int16
  let offset = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let s = Math.max(-1, Math.min(1, channels[channel][i]));
      result[offset++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
  }
  
  const wavBuffer = new ArrayBuffer(44 + result.length * 2);
  const view = new DataView(wavBuffer);
  
  // Write WAV Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + result.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, result.length * 2, true);
  
  // Write PCM data
  const pcmData = new Int16Array(wavBuffer, 44);
  pcmData.set(result);
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
