class NoiseGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Default config
    this.threshold = 0.02; // Roughly -34dB
    this.attack = 0.005;   // 5ms attack
    this.release = 0.2;    // 200ms release
    this.floor = 0.1;      // 10% volume when closed (avoid "dead silence")
    
    // Internal state
    this.envelope = 0.0;
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'threshold',
        defaultValue: 0.02,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'floor',
        defaultValue: 0.1,
        minValue: 0.0,
        maxValue: 1.0,
      }
    ];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input.length) return true;

    // Use parameters if provided via AudioParam, else fallback to instance values
    const threshold = parameters.threshold && parameters.threshold.length > 0 
      ? parameters.threshold[0] 
      : this.threshold;
      
    const floor = parameters.floor && parameters.floor.length > 0
      ? parameters.floor[0]
      : this.floor;

    // We calculate RMS for the whole block (usually 128 samples)
    let sumSquares = 0;
    const channelData = input[0];
    for (let i = 0; i < channelData.length; i++) {
      sumSquares += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sumSquares / channelData.length);

    // Determine target gain
    const isAboveThreshold = rms > threshold;
    const targetGain = isAboveThreshold ? 1.0 : floor;

    // Smooth envelope (Attack/Release)
    // AudioWorklet runs at sampleRate (e.g. 48000), but we are computing per block
    const blockDuration = channelData.length / sampleRate;
    
    const alpha = isAboveThreshold 
      ? Math.exp(-blockDuration / this.attack)
      : Math.exp(-blockDuration / this.release);

    this.envelope = alpha * this.envelope + (1.0 - alpha) * targetGain;

    // Apply smoothed gain to all channels
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = inputChannel[i] * this.envelope;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('noise-gate', NoiseGateProcessor);
