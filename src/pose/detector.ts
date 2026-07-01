import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { PoseLandmarks, Point2D } from "@/types";

const POSE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const LANDMARK_INDICES = {
  nose: 0,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
} as const;

export class PoseDetector {
  private landmarker: PoseLandmarker | null = null;
  private lastDetectionTime = 0;
  private readonly targetFps = 25;
  private readonly frameInterval = 1000 / this.targetFps;

  async initialize(): Promise<void> {
    if (this.landmarker) return;

    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    const options = {
      baseOptions: {
        modelAssetPath: POSE_LANDMARKER_MODEL,
        delegate: "GPU" as const,
      },
      runningMode: "VIDEO" as const,
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
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

  detect(
    video: HTMLVideoElement,
    timestamp: number,
  ): PoseLandmarks | null {
    if (!this.landmarker || video.readyState < 2) return null;

    const now = performance.now();
    if (now - this.lastDetectionTime < this.frameInterval) return null;
    this.lastDetectionTime = now;

    const result = this.landmarker.detectForVideo(video, timestamp);
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
      leftEar: getPoint(LANDMARK_INDICES.leftEar),
      rightEar: getPoint(LANDMARK_INDICES.rightEar),
      leftShoulder: getPoint(LANDMARK_INDICES.leftShoulder),
      rightShoulder: getPoint(LANDMARK_INDICES.rightShoulder),
      leftElbow: getPoint(LANDMARK_INDICES.leftElbow),
      rightElbow: getPoint(LANDMARK_INDICES.rightElbow),
    };
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}

function toCanvas(point: Point2D, width: number, height: number) {
  return { x: point.x * width, y: point.y * height };
}

export function drawLandmarks(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: PoseLandmarks | null,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!landmarks) return;

  const w = canvas.width;
  const h = canvas.height;

  const points = [
    landmarks.nose,
    landmarks.leftEar,
    landmarks.rightEar,
    landmarks.leftShoulder,
    landmarks.rightShoulder,
    landmarks.leftElbow,
    landmarks.rightElbow,
  ].map((p) => toCanvas(p, w, h));

  const connections: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 2],
    [3, 4],
    [3, 5],
    [4, 6],
    [0, 3],
    [0, 4],
  ];

  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 2;
  for (const [a, b] of connections) {
    ctx.beginPath();
    ctx.moveTo(points[a].x, points[a].y);
    ctx.lineTo(points[b].x, points[b].y);
    ctx.stroke();
  }

  ctx.fillStyle = "#a5b4fc";
  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const TRACKED_LANDMARK_KEYS = Object.keys(
  LANDMARK_INDICES,
) as (keyof PoseLandmarks)[];
