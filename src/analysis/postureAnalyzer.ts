import type {
  IssueSeverity,
  IssueType,
  Point2D,
  PoseLandmarks,
  PostureIssue,
  PostureResult,
  Sensitivity,
} from "@/types";
import { ISSUE_LABELS } from "@/types";
import { distance, isLandmarkVisible, midpoint } from "@/pose/smoothing";
import { clamp, getSensitivityMultiplier, getStatusFromScore } from "@/utils";

// All geometry runs in isotropic coordinates (x scaled by the frame aspect,
// units = fraction of frame height) and is normalized by shoulder width, so
// thresholds are true physical ratios: independent of camera resolution,
// aspect ratio, and how far the user sits from the lens.

// Absolute fallbacks, used until the per-session baseline is established and
// as a safety floor afterwards.
const SLOUCH_ABS_CLEARANCE = 0.18; // nose barely above the shoulder line
const SLOUCH_ABS_RANGE = 0.08;
const UNEVEN_BASE = 0.034;
const LEAN_BASE = 0.06;

// Baseline-relative onsets (fractional deviation from personal baseline).
// Onsets are deliberately generous: normal fidgeting and relaxed-but-fine
// sitting must not register — only clear departures from the baseline.
const SLOUCH_DEFICIT_ONSET = 0.22;
const SLOUCH_DEFICIT_RANGE = 0.32;
const FORWARD_RISE_ONSET = 0.13;
const FORWARD_RISE_RANGE = 0.24;

// A shoulder span smaller than this (in frame-height units) means the person
// is too far away / detection too unreliable to judge posture.
const MIN_SHOULDER_WIDTH = 0.05;

// Interocular distance is roughly 40% of head breadth; used only when the
// ears are not visible.
const EYE_TO_HEAD_SPAN = 2.5;

// While an issue is confidently active, its baseline must not drift toward
// the bad posture it is measuring.
const BASELINE_FREEZE_CONFIDENCE = 0.4;

interface BaselineConfig {
  betterIsHigher: boolean;
  clampMin: number;
  clampMax: number;
  warmupSamples: number;
  warmupPercentile: number;
  betterRatePerS: number;
  worseRatePerS: number;
}

/**
 * Learns the user's own "good posture" value for one metric during the
 * session. Adaptation is deliberately asymmetric: it follows improvement
 * within seconds but takes minutes to absorb degradation, so sitting badly
 * for a while cannot quietly become the new normal.
 */
class AdaptiveBaseline {
  private warmup: number[] = [];
  private value: number | null = null;

  constructor(private readonly config: BaselineConfig) {}

  get(): number | null {
    return this.value;
  }

  update(sample: number, dtS: number, freezeWorse: boolean): number | null {
    const c = this.config;

    if (this.value === null) {
      this.warmup.push(sample);
      if (this.warmup.length >= c.warmupSamples) {
        this.warmup.sort((a, b) => a - b);
        const index = Math.round(c.warmupPercentile * (this.warmup.length - 1));
        this.value = clamp(this.warmup[index], c.clampMin, c.clampMax);
        this.warmup = [];
      }
      return this.value;
    }

    const isBetter = c.betterIsHigher
      ? sample > this.value
      : sample < this.value;

    if (!isBetter && freezeWorse) return this.value;

    const rate = isBetter ? c.betterRatePerS : c.worseRatePerS;
    const alpha = 1 - Math.exp(-dtS * rate);
    this.value = clamp(
      this.value + (sample - this.value) * alpha,
      c.clampMin,
      c.clampMax,
    );
    return this.value;
  }

  reset(): void {
    this.warmup = [];
    this.value = null;
  }
}

function severityFromConfidence(confidence: number): IssueSeverity {
  if (confidence >= 0.7) return "high";
  if (confidence >= 0.4) return "medium";
  return "low";
}

function createIssue(
  type: IssueType,
  confidence: number,
): PostureIssue | null {
  if (confidence < 0.25) return null;
  return {
    type,
    label: ISSUE_LABELS[type],
    severity: severityFromConfidence(confidence),
    confidence: clamp(confidence, 0, 1),
  };
}

function neutralResult(): PostureResult {
  return {
    score: 50,
    status: "fair",
    issues: [],
    timestamp: Date.now(),
  };
}

function confidenceAbove(
  value: number,
  threshold: number,
  range: number,
): number {
  return clamp((value - threshold) / range, 0, 1);
}

function toIsotropic(point: Point2D, aspect: number): Point2D {
  return { x: point.x * aspect, y: point.y, visibility: point.visibility };
}

type HeadSpanSource = "ears" | "eyes";

export class PostureAnalyzer {
  // clampMin matches the absolute slouch floor: the baseline may adapt down
  // to any clearance the absolute detector still considers upright (covers
  // high-mounted webcams that compress clearance), but never into territory
  // that is definitionally a slouch.
  private clearanceBaseline = new AdaptiveBaseline({
    betterIsHigher: true,
    clampMin: SLOUCH_ABS_CLEARANCE,
    clampMax: 0.95,
    warmupSamples: 40,
    // Deliberately below the top of the warmup window: people sit extra
    // straight right after starting the app, and a baseline learned from
    // that pose would make their normal relaxed sitting read as a deficit.
    warmupPercentile: 0.6,
    betterRatePerS: 0.35,
    worseRatePerS: 0.0035,
  });
  private headRatioBaseline = new AdaptiveBaseline({
    betterIsHigher: false,
    clampMin: 0.28,
    clampMax: 0.6,
    warmupSamples: 40,
    warmupPercentile: 0.3,
    betterRatePerS: 0.35,
    worseRatePerS: 0.0035,
  });
  private headSpanSource: HeadSpanSource | null = null;
  private lastSlouchConfidence = 0;
  private lastForwardConfidence = 0;
  private lastTimestampMs: number | null = null;

  analyze(
    rawLandmarks: PoseLandmarks,
    aspect: number,
    sensitivity: Sensitivity = "medium",
    timestampMs: number = performance.now(),
  ): PostureResult {
    const dtS =
      this.lastTimestampMs === null
        ? 0.067
        : clamp((timestampMs - this.lastTimestampMs) / 1000, 1e-3, 2);
    this.lastTimestampMs = timestampMs;

    const m = getSensitivityMultiplier(sensitivity);
    const issues: PostureIssue[] = [];

    const coreVisible =
      isLandmarkVisible(rawLandmarks.leftShoulder) &&
      isLandmarkVisible(rawLandmarks.rightShoulder) &&
      isLandmarkVisible(rawLandmarks.nose);

    if (!coreVisible) return neutralResult();

    const nose = toIsotropic(rawLandmarks.nose, aspect);
    const leftShoulder = toIsotropic(rawLandmarks.leftShoulder, aspect);
    const rightShoulder = toIsotropic(rawLandmarks.rightShoulder, aspect);

    const shoulderMid = midpoint(leftShoulder, rightShoulder);
    const shoulderWidth = distance(leftShoulder, rightShoulder);
    if (shoulderWidth < MIN_SHOULDER_WIDTH) return neutralResult();

    // --- Slouching: head clearance above the shoulder line, judged against
    // the user's own upright baseline, with an absolute floor for deep slouch.
    const clearance = (shoulderMid.y - nose.y) / shoulderWidth;
    const clearanceBase = this.clearanceBaseline.update(
      clearance,
      dtS,
      this.lastSlouchConfidence > BASELINE_FREEZE_CONFIDENCE,
    );

    const absoluteSlouch = confidenceAbove(
      SLOUCH_ABS_CLEARANCE * m - clearance,
      0,
      SLOUCH_ABS_RANGE,
    );
    let slouchConfidence = absoluteSlouch;
    if (clearanceBase !== null && clearanceBase > 0) {
      const deficit = 1 - clearance / clearanceBase;
      slouchConfidence = Math.max(
        slouchConfidence,
        confidenceAbove(deficit, SLOUCH_DEFICIT_ONSET / m, SLOUCH_DEFICIT_RANGE),
      );
    }
    this.lastSlouchConfidence = slouchConfidence;
    const slouchIssue = createIssue("slouching", slouchConfidence);
    if (slouchIssue) issues.push(slouchIssue);

    // --- Forward head: craning toward the screen makes the head grow
    // relative to the shoulders. Judged against the user's baseline ratio;
    // no absolute variant exists because head/shoulder proportions vary
    // too much between people.
    const earsVisible =
      isLandmarkVisible(rawLandmarks.leftEar) &&
      isLandmarkVisible(rawLandmarks.rightEar);
    const eyesVisible =
      isLandmarkVisible(rawLandmarks.leftEye) &&
      isLandmarkVisible(rawLandmarks.rightEye);

    let headSpan: number | null = null;
    let source: HeadSpanSource | null = null;
    if (earsVisible) {
      headSpan = distance(
        toIsotropic(rawLandmarks.leftEar, aspect),
        toIsotropic(rawLandmarks.rightEar, aspect),
      );
      source = "ears";
    } else if (eyesVisible) {
      headSpan =
        distance(
          toIsotropic(rawLandmarks.leftEye, aspect),
          toIsotropic(rawLandmarks.rightEye, aspect),
        ) * EYE_TO_HEAD_SPAN;
      source = "eyes";
    }

    let forwardConfidence = 0;
    if (headSpan !== null && source !== null) {
      if (this.headSpanSource === null) this.headSpanSource = source;
      // The two span sources have person-specific scale offsets; only feed
      // the baseline from the source it was established with.
      if (source === this.headSpanSource) {
        const headRatio = headSpan / shoulderWidth;
        const headBase = this.headRatioBaseline.update(
          headRatio,
          dtS,
          this.lastForwardConfidence > BASELINE_FREEZE_CONFIDENCE,
        );
        if (headBase !== null && headBase > 0) {
          const rise = headRatio / headBase - 1;
          forwardConfidence = confidenceAbove(
            rise,
            FORWARD_RISE_ONSET / m,
            FORWARD_RISE_RANGE,
          );
        }
      }
    }
    this.lastForwardConfidence = forwardConfidence;
    const forwardIssue = createIssue("forward_head", forwardConfidence);
    if (forwardIssue) issues.push(forwardIssue);

    // --- Uneven shoulders: shoulder line tilt + optional ear height difference.
    const unevenThreshold = UNEVEN_BASE / m;
    const shoulderDiff =
      Math.abs(leftShoulder.y - rightShoulder.y) / shoulderWidth;
    let unevenConfidence = confidenceAbove(
      shoulderDiff,
      unevenThreshold * 0.6,
      unevenThreshold * 0.4,
    );
    if (earsVisible) {
      const earDiff =
        Math.abs(rawLandmarks.leftEar.y - rawLandmarks.rightEar.y) /
        shoulderWidth;
      unevenConfidence = Math.max(
        unevenConfidence,
        confidenceAbove(earDiff, unevenThreshold * 0.6, unevenThreshold * 0.4),
      );
    }
    const unevenIssue = createIssue("uneven_shoulders", unevenConfidence);
    if (unevenIssue) issues.push(unevenIssue);

    // --- Leaning left/right: signed nose offset from shoulder center.
    const leanThreshold = LEAN_BASE / m;
    const leanOffset = (nose.x - shoulderMid.x) / shoulderWidth;
    if (Math.abs(leanOffset) > leanThreshold * 0.6) {
      const leanIssue = createIssue(
        leanOffset < 0 ? "leaning_left" : "leaning_right",
        confidenceAbove(
          Math.abs(leanOffset),
          leanThreshold * 0.6,
          leanThreshold * 0.4,
        ),
      );
      if (leanIssue) issues.push(leanIssue);
    }

    // Dominant issue counts fully, the rest at half weight: the issue
    // signals are correlated (a slouch usually drags forward-head and lean
    // along with it), and summing them linearly double-punished one bad
    // posture into scores far below what any single signal justified.
    const penalties = issues
      .map((issue) => {
        const weight =
          issue.severity === "high" ? 20 : issue.severity === "medium" ? 14 : 8;
        return weight * issue.confidence;
      })
      .sort((a, b) => b - a);
    const penalty =
      penalties.length === 0
        ? 0
        : penalties[0] +
          0.5 * penalties.slice(1).reduce((sum, p) => sum + p, 0);

    const score = clamp(100 - penalty, 0, 100);

    return {
      score,
      status: getStatusFromScore(score),
      issues,
      timestamp: Date.now(),
    };
  }

  /** False until the session baseline exists (the ~3s warmup after the user
   * first appears); the UI shows a "calibrating" state meanwhile. */
  isCalibrated(): boolean {
    return this.clearanceBaseline.get() !== null;
  }

  reset(): void {
    this.clearanceBaseline.reset();
    this.headRatioBaseline.reset();
    this.headSpanSource = null;
    this.lastSlouchConfidence = 0;
    this.lastForwardConfidence = 0;
    this.lastTimestampMs = null;
  }
}
