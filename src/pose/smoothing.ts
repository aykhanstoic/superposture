import type { Point2D, PoseLandmarks } from "@/types";

const SMOOTHING_ALPHA = 0.2;

export class LandmarkSmoother {
  private previous: Partial<PoseLandmarks> = {};

  smooth(landmarks: PoseLandmarks): PoseLandmarks {
    const result = {} as PoseLandmarks;

    for (const key of Object.keys(landmarks) as (keyof PoseLandmarks)[]) {
      const current = landmarks[key];
      const prev = this.previous[key];

      if (!prev) {
        result[key] = { ...current };
      } else {
        result[key] = {
          x: lerp(prev.x, current.x, SMOOTHING_ALPHA),
          y: lerp(prev.y, current.y, SMOOTHING_ALPHA),
          visibility: current.visibility,
        };
      }

      this.previous[key] = result[key];
    }

    return result;
  }

  reset(): void {
    this.previous = {};
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

export function distance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(a: Point2D, b: Point2D, c: Point2D): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAb = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCb = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  if (magAb === 0 || magCb === 0) return 0;
  const cos = clamp(dot / (magAb * magCb), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isLandmarkVisible(point: Point2D, threshold = 0.5): boolean {
  return (point.visibility ?? 1) >= threshold;
}
