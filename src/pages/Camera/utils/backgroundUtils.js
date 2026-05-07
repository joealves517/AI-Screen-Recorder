import {
  FilesetResolver,
  ImageSegmenter,
} from "@mediapipe/tasks-vision";

export const loadSegmentationModel = async () => {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "./assets/mediapipeVision"
    );

    const segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "./assets/mediapipeVision/selfie_segmenter.tflite",
        delegate: "GPU",
      },
      outputCategoryMask: true,
      outputConfidenceMasks: false,
      runningMode: "VIDEO",
    });

    return segmenter;
  } catch (error) {
    console.error("Error loading segmentation model:", error);
    return null;
  }
};

// Segment directly from a video element — avoids ImageData round-trips.
// The segmentForVideo callback fires synchronously, so this returns the result directly.
export const segmentFromVideo = (videoElement, segmenter) => {
  if (!videoElement || !segmenter) return null;
  if (videoElement.readyState < 2 || videoElement.videoWidth === 0) return null;

  try {
    const timestampMs = performance.now();
    let result = null;

    segmenter.segmentForVideo(videoElement, timestampMs, (r) => {
      result = r;
    });

    if (!result || !result.categoryMask) return null;
    return result;
  } catch (error) {
    console.error("Error during segmentation:", error);
    return null;
  }
};

export const loadEffect = (effectUrl) => {
  return new Promise((resolve, reject) => {
    if (!effectUrl) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.src = effectUrl;
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      console.error("Failed to load effect image:", error);
      reject(error);
    };
  });
};
