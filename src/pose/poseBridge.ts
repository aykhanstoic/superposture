import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { PoseLandmarks } from "@/types";

export const WASM_BASE = "/mediapipe/wasm";
export const POSE_MODEL = "/mediapipe/pose_landmarker_lite.task";

export const INFERENCE_SIZE = 320;

const LANDMARK_INDICES = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
} as const;

function extractLandmarks(
  result: ReturnType<PoseLandmarker["detectForVideo"]>,
): PoseLandmarks | null {
  if (!result.landmarks.length) return null;

  const landmarks = result.landmarks[0];
  const worldLandmarks = result.worldLandmarks[0];

  const getPoint = (index: number) => {
    const lm = landmarks[index];
    const wlm = worldLandmarks?.[index];
    return {
      x: lm.x,
      y: lm.y,
      visibility: wlm ? Math.min(1, Math.abs(wlm.z) < 1 ? 0.9 : 0.7) : 0.8,
    };
  };

  return {
    nose: getPoint(LANDMARK_INDICES.nose),
    leftEye: getPoint(LANDMARK_INDICES.leftEye),
    rightEye: getPoint(LANDMARK_INDICES.rightEye),
    leftEar: getPoint(LANDMARK_INDICES.leftEar),
    rightEar: getPoint(LANDMARK_INDICES.rightEar),
    leftShoulder: getPoint(LANDMARK_INDICES.leftShoulder),
    rightShoulder: getPoint(LANDMARK_INDICES.rightShoulder),
  };
}

export class PoseBridge {
  private landmarker: PoseLandmarker | null = null;
  private inferenceCanvas: HTMLCanvasElement;
  private timestampMs = 0;

  constructor() {
    this.inferenceCanvas = document.createElement("canvas");
    this.inferenceCanvas.width = INFERENCE_SIZE;
    this.inferenceCanvas.height = INFERENCE_SIZE;
  }

  async initialize(): Promise<void> {
    if (this.landmarker) return;

    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    const options = {
      baseOptions: {
        modelAssetPath: POSE_MODEL,
        delegate: "GPU" as const,
      },
      runningMode: "VIDEO" as const,
      numPoses: 1,
      minPoseDetectionConfidence: 0.55,
      minPosePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    };

    try {
      this.landmarker = await PoseLandmarker.createFromOptions(vision, options);
    } catch {
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: "CPU" },
      });
    }
  }

  detect(video: HTMLVideoElement): PoseLandmarks | null {
    if (!this.landmarker || video.readyState < 2) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    const ctx = this.inferenceCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, vw, vh, 0, 0, INFERENCE_SIZE, INFERENCE_SIZE);

    this.timestampMs += 33;
    const result = this.landmarker.detectForVideo(
      this.inferenceCanvas,
      this.timestampMs,
    );
    return extractLandmarks(result);
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
