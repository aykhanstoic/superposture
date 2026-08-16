import type { Point2D, PoseLandmarks } from "@/types";

// One Euro filter (Casiez et al., CHI 2012): velocity-adaptive low-pass —
// aggressive smoothing when the landmark is still (kills jitter that flickers
// issues on/off), minimal lag when it moves. Being dt-aware, it stays correct
// across the inference scheduler's variable tick rates (50ms–1s).
const MIN_CUTOFF_HZ = 1.0;
const BETA = 0.6;
const DERIVATIVE_CUTOFF_HZ = 1.0;
const VISIBILITY_TAU_S = 0.3;
// A gap this long means tracking was lost (idle tier / user away); snap to
// the fresh landmarks instead of dragging in seconds-old positions.
const STALE_GAP_S = 1.5;

function smoothingAlpha(cutoffHz: number, dtS: number): number {
  const r = 2 * Math.PI * cutoffHz * dtS;
  return r / (r + 1);
}

class OneEuroAxis {
  private value: number | null = null;
  private derivative = 0;

  filter(next: number, dtS: number): number {
    if (this.value === null) {
      this.value = next;
      return next;
    }
    const rawDerivative = (next - this.value) / dtS;
    this.derivative = lerp(
      this.derivative,
      rawDerivative,
      smoothingAlpha(DERIVATIVE_CUTOFF_HZ, dtS),
    );
    const cutoff = MIN_CUTOFF_HZ + BETA * Math.abs(this.derivative);
    this.value = lerp(this.value, next, smoothingAlpha(cutoff, dtS));
    return this.value;
  }

  reset(): void {
    this.value = null;
    this.derivative = 0;
  }
}

class PointFilter {
  private x = new OneEuroAxis();
  private y = new OneEuroAxis();
  private visibility: number | null = null;

  filter(point: Point2D, dtS: number): Point2D {
    const rawVisibility = point.visibility ?? 1;
    if (this.visibility === null) {
      this.visibility = rawVisibility;
    } else {
      // Plain dt-aware EMA: visibility jitter would flicker the analyzer's
      // visibility gate; velocity-adaptiveness is unnecessary here.
      const alpha = 1 - Math.exp(-dtS / VISIBILITY_TAU_S);
      this.visibility = lerp(this.visibility, rawVisibility, alpha);
    }
    return {
      x: this.x.filter(point.x, dtS),
      y: this.y.filter(point.y, dtS),
      visibility: this.visibility,
    };
  }

  reset(): void {
    this.x.reset();
    this.y.reset();
    this.visibility = null;
  }
}

const LANDMARK_KEYS: (keyof PoseLandmarks)[] = [
  "nose",
  "leftEye",
  "rightEye",
  "leftEar",
  "rightEar",
  "leftShoulder",
  "rightShoulder",
];

export class LandmarkSmoother {
  private filters = new Map<keyof PoseLandmarks, PointFilter>();
  private lastTimestampMs: number | null = null;

  smooth(landmarks: PoseLandmarks, timestampMs: number): PoseLandmarks {
    let dtS =
      this.lastTimestampMs === null
        ? 0
        : (timestampMs - this.lastTimestampMs) / 1000;
    this.lastTimestampMs = timestampMs;

    if (dtS <= 0) dtS = 1e-3;
    if (dtS > STALE_GAP_S) {
      for (const filter of this.filters.values()) filter.reset();
    }

    const result = {} as PoseLandmarks;
    for (const key of LANDMARK_KEYS) {
      let filter = this.filters.get(key);
      if (!filter) {
        filter = new PointFilter();
        this.filters.set(key, filter);
      }
      result[key] = filter.filter(landmarks[key], dtS);
    }
    return result;
  }

  reset(): void {
    for (const filter of this.filters.values()) filter.reset();
    this.lastTimestampMs = null;
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
