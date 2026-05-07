let device = null;
let sampler = null;
let renderPipeline = null;
let uniformBuffer = null;

// Reusable GPU textures (recreated only on dimension change)
let frameTexture = null;
let maskTexture = null;
let maskWidth = 0;
let maskHeight = 0;
let bgTexture = null;
let emptyBgTexture = null;

export const getDevice = () => device;

export const isWebGPUSupported = async () => {
  if (!navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;
    device = await adapter.requestDevice();
    return true;
  } catch (e) {
    console.warn("WebGPU initialization failed:", e);
    return false;
  }
};

export const configureCanvasContext = (context) => {
  if (!device || !context) return false;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });
  return format;
};

// WGSL shader: full-screen quad with blur + mask compositing
const shaderCode = `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)
  );
  var uv = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 1.0), vec2<f32>(1.0, 1.0), vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0), vec2<f32>(1.0, 0.0)
  );

  var output : VertexOutput;
  output.position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
  output.uv = uv[VertexIndex];
  return output;
}

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var frameTexture: texture_2d<f32>;
@group(0) @binding(2) var maskTexture: texture_2d<f32>;

struct Uniforms {
  resolution: vec2<f32>,
  blurRadius: f32,
  isVirtualBackground: f32,
}
@group(0) @binding(3) var<uniform> uniforms: Uniforms;
@group(0) @binding(4) var bgTexture: texture_2d<f32>;

// Approximate gaussian blur via weighted 5x5 sampling
fn getBlurred(uv: vec2<f32>, radius: f32) -> vec4<f32> {
  var color = vec4<f32>(0.0);
  var total = 0.0;
  let res = uniforms.resolution;

  for(var x = -2; x <= 2; x++) {
    for(var y = -2; y <= 2; y++) {
      let offset = vec2<f32>(f32(x), f32(y)) * (radius / 2.0) / res;
      let weight = 1.0 / (1.0 + f32(x*x + y*y));
      color += textureSampleLevel(frameTexture, mySampler, clamp(uv + offset, vec2<f32>(0.0), vec2<f32>(1.0)), 0.0) * weight;
      total += weight;
    }
  }
  return color / total;
}

// Edge-feathered person mask via 3x3 averaging
// MediaPipe categoryMask stores 0 or 1 as Uint8. In r8unorm, 1 maps to 1/255.
// We multiply by 255.0 in the shader to restore the original 0.0 / 1.0 range.
fn getMask(uv: vec2<f32>) -> f32 {
  var m = 0.0;
  var total = 0.0;
  let offset = 4.0 / uniforms.resolution;

  for(var x = -1; x <= 1; x++) {
    for(var y = -1; y <= 1; y++) {
      let o = vec2<f32>(f32(x), f32(y)) * offset;
      let sample = textureSampleLevel(maskTexture, mySampler, clamp(uv + o, vec2<f32>(0.0), vec2<f32>(1.0)), 0.0).r;
      m += clamp(sample * 255.0, 0.0, 1.0);
      total += 1.0;
    }
  }
  return m / total;
}

@fragment
fn fs_main(@location(0) uv : vec2<f32>) -> @location(0) vec4<f32> {
  let rawMask = getMask(uv);
  let maskVal = 1.0 - rawMask;
  let sharpColor = textureSampleLevel(frameTexture, mySampler, uv, 0.0);

  if (maskVal >= 0.95) {
    return sharpColor;
  }

  var bgColor = vec4<f32>(0.0);
  if (uniforms.isVirtualBackground > 0.5) {
    bgColor = textureSampleLevel(bgTexture, mySampler, uv, 0.0);
  } else {
    bgColor = getBlurred(uv, uniforms.blurRadius);
  }

  return mix(bgColor, sharpColor, maskVal);
}
`;

export const initWebGPUPipeline = async (format) => {
  if (!device) return false;
  if (renderPipeline) return true;

  const shaderModule = device.createShaderModule({ code: shaderCode });

  renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format }],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });

  uniformBuffer = device.createBuffer({
    size: 16, // 4 floats: blurRadius, resX, resY, isVirtualBg
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return true;
};

const getEmptyBgTexture = () => {
  if (!emptyBgTexture) {
    emptyBgTexture = device.createTexture({
      size: [1, 1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
      { texture: emptyBgTexture },
      new Uint8Array([0, 0, 0, 255]),
      { bytesPerRow: 4 },
      { width: 1, height: 1 }
    );
  }
  return emptyBgTexture;
};

export const renderWebGPU = (
  context,
  videoElement,
  segmentationResult,
  effectType,
  effectImageElement
) => {
  if (!device || !renderPipeline) return false;

  const vw = videoElement.videoWidth;
  const vh = videoElement.videoHeight;
  if (vw === 0 || vh === 0) return false;

  const canvas = context.canvas;

  // Ensure canvas matches video dimensions to prevent distortion
  if (canvas.width !== vw || canvas.height !== vh) {
    canvas.width = vw;
    canvas.height = vh;
  }

  // 1. Upload video frame
  if (!frameTexture || frameTexture.width !== vw || frameTexture.height !== vh) {
    if (frameTexture) frameTexture.destroy();
    frameTexture = device.createTexture({
      size: [vw, vh, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }
  device.queue.copyExternalImageToTexture(
    { source: videoElement },
    { texture: frameTexture },
    [vw, vh]
  );

  // 2. Upload segmentation mask
  const mask = segmentationResult.categoryMask;
  const mW = mask.width;
  const mH = mask.height;

  if (!maskTexture || maskWidth !== mW || maskHeight !== mH) {
    if (maskTexture) maskTexture.destroy();
    maskTexture = device.createTexture({
      size: [mW, mH, 1],
      format: 'r8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    maskWidth = mW;
    maskHeight = mH;
  }

  const maskData = mask.getAsUint8Array();
  device.queue.writeTexture(
    { texture: maskTexture },
    maskData,
    { bytesPerRow: mW },
    { width: mW, height: mH }
  );

  // 3. Upload background image texture (virtual bg mode only)
  let activeBgTexture = getEmptyBgTexture();
  if (effectType === 'image' && effectImageElement) {
    if (!bgTexture || bgTexture.width !== effectImageElement.width || bgTexture.height !== effectImageElement.height) {
      if (bgTexture) bgTexture.destroy();
      bgTexture = device.createTexture({
        size: [effectImageElement.width, effectImageElement.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
    device.queue.copyExternalImageToTexture(
      { source: effectImageElement },
      { texture: bgTexture },
      [effectImageElement.width, effectImageElement.height]
    );
    activeBgTexture = bgTexture;
  }

  // 4. Write uniforms
  const isVirtualBg = effectType === 'image' ? 1.0 : 0.0;
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    new Float32Array([vw, vh, 16.0, isVirtualBg])
  );

  // 5. Render pass
  const bindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: frameTexture.createView() },
      { binding: 2, resource: maskTexture.createView() },
      { binding: 3, resource: { buffer: uniformBuffer } },
      { binding: 4, resource: activeBgTexture.createView() },
    ],
  });

  const commandEncoder = device.createCommandEncoder();
  const textureView = context.getCurrentTexture().createView();

  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: textureView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  });

  passEncoder.setPipeline(renderPipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.draw(6);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);

  return true;
};
