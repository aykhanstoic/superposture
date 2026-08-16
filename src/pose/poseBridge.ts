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

/** One detection: landmarks in video-normalized coords + the frame aspect
 * ratio (width/height) needed to do isotropic geometry downstream. */
export interface DetectionFrame {
  landmarks: PoseLandmarks;
  aspect: number;
}

interface LetterboxLayout {
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
}

export class PoseBridge {
  private landmarker: PoseLandmarker | null = null;
  private inferenceCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private lastTimestampMs = 0;
  private layoutForWidth = 0;
  private layoutForHeight = 0;
  private layout: LetterboxLayout = {
    drawWidth: INFERENCE_SIZE,
    drawHeight: INFERENCE_SIZE,
    offsetX: 0,
    offsetY: 0,
  };

  constructor() {
    this.inferenceCanvas = document.createElement("canvas");
    this.inferenceCanvas.width = INFERENCE_SIZE;
    this.inferenceCanvas.height = INFERENCE_SIZE;
    this.ctx = this.inferenceCanvas.getContext("2d", { alpha: false });
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

  // Letterbox rather than stretch: the model sees an undistorted person, and
  // geometry stops depending on whether the webcam delivers 4:3 or 16:9.
  private updateLayout(vw: number, vh: number): void {
    if (this.layoutForWidth === vw && this.layoutForHeight === vh) return;
    this.layoutForWidth = vw;
    this.layoutForHeight = vh;

    const scale = Math.min(INFERENCE_SIZE / vw, INFERENCE_SIZE / vh);
    const drawWidth = Math.round(vw * scale);
    const drawHeight = Math.round(vh * scale);
    this.layout = {
      drawWidth,
      drawHeight,
      offsetX: Math.floor((INFERENCE_SIZE - drawWidth) / 2),
      offsetY: Math.floor((INFERENCE_SIZE - drawHeight) / 2),
    };

    if (this.ctx) {
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(0, 0, INFERENCE_SIZE, INFERENCE_SIZE);
    }
  }

  // Map a landmark from square-canvas space back to video-normalized space,
  // undoing the letterbox. Uses the model's real visibility score.
  private extractLandmarks(
    result: ReturnType<PoseLandmarker["detectForVideo"]>,
  ): PoseLandmarks | null {
    if (!result.landmarks.length) return null;

    const landmarks = result.landmarks[0];
    const { drawWidth, drawHeight, offsetX, offsetY } = this.layout;

    const getPoint = (index: number) => {
      const lm = landmarks[index];
      return {
        x: (lm.x * INFERENCE_SIZE - offsetX) / drawWidth,
        y: (lm.y * INFERENCE_SIZE - offsetY) / drawHeight,
        visibility: lm.visibility,
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

  detect(video: HTMLVideoElement): DetectionFrame | null {
    if (!this.landmarker || video.readyState < 2) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh || !this.ctx) return null;

    this.updateLayout(vw, vh);
    const { drawWidth, drawHeight, offsetX, offsetY } = this.layout;
    this.ctx.drawImage(video, 0, 0, vw, vh, offsetX, offsetY, drawWidth, drawHeight);

    // VIDEO mode uses timestamps for its internal tracking; feed real time
    // (monotonic, strictly increasing) so its temporal model sees true dt.
    const timestampMs = Math.max(performance.now(), this.lastTimestampMs + 1);
    this.lastTimestampMs = timestampMs;

    const result = this.landmarker.detectForVideo(
      this.inferenceCanvas,
      timestampMs,
    );
    const landmarks = this.extractLandmarks(result);
    if (!landmarks) return null;

    return { landmarks, aspect: vw / vh };
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
