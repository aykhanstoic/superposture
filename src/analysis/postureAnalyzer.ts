import type {
  IssueSeverity,
  IssueType,
  PoseLandmarks,
  PostureIssue,
  PostureResult,
  Sensitivity,
} from "@/types";
import { ISSUE_LABELS } from "@/types";
import { distance, isLandmarkVisible, midpoint } from "@/pose/smoothing";
import { clamp, getSensitivityMultiplier, getStatusFromScore } from "@/utils";

interface ThresholdConfig {
  forwardHeadRatio: number;
  slouchHeadDropRatio: number;
  shoulderUnevenness: number;
  leanOffset: number;
}

const BASE_THRESHOLDS: ThresholdConfig = {
  forwardHeadRatio: 0.14,
  slouchHeadDropRatio: 0.24,
  shoulderUnevenness: 0.045,
  leanOffset: 0.06,
};

function getThresholds(sensitivity: Sensitivity): ThresholdConfig {
  const m = getSensitivityMultiplier(sensitivity);
  return {
    forwardHeadRatio: BASE_THRESHOLDS.forwardHeadRatio / m,
    slouchHeadDropRatio: BASE_THRESHOLDS.slouchHeadDropRatio / m,
    shoulderUnevenness: BASE_THRESHOLDS.shoulderUnevenness / m,
    leanOffset: BASE_THRESHOLDS.leanOffset / m,
  };
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

export function analyzePosture(
  landmarks: PoseLandmarks,
  sensitivity: Sensitivity = "medium",
): PostureResult {
  const thresholds = getThresholds(sensitivity);
  const issues: PostureIssue[] = [];

  const shouldersVisible =
    isLandmarkVisible(landmarks.leftShoulder) &&
    isLandmarkVisible(landmarks.rightShoulder) &&
    isLandmarkVisible(landmarks.nose);

  if (!shouldersVisible) {
    return neutralResult();
  }

  const shoulderMid = midpoint(landmarks.leftShoulder, landmarks.rightShoulder);
  const shoulderWidth = distance(
    landmarks.leftShoulder,
    landmarks.rightShoulder,
  );

  if (shoulderWidth === 0) {
    return neutralResult();
  }

  // Forward head: nose ahead of shoulder center (laptop camera, x-axis)
  const forwardOffset =
    Math.abs(landmarks.nose.x - shoulderMid.x) / shoulderWidth;
  const forwardIssue = createIssue(
    "forward_head",
    confidenceAbove(
      forwardOffset,
      thresholds.forwardHeadRatio * 0.6,
      thresholds.forwardHeadRatio * 0.4,
    ),
  );
  if (forwardIssue) issues.push(forwardIssue);

  // Slouching: head drops toward shoulder line (y grows downward)
  const headClearance = (shoulderMid.y - landmarks.nose.y) / shoulderWidth;
  const slouchIssue = createIssue(
    "slouching",
    confidenceAbove(
      thresholds.slouchHeadDropRatio - headClearance,
      0,
      thresholds.slouchHeadDropRatio * 0.5,
    ),
  );
  if (slouchIssue) issues.push(slouchIssue);

  // Uneven shoulders: shoulder line tilt + optional ear height difference
  const shoulderDiff =
    Math.abs(landmarks.leftShoulder.y - landmarks.rightShoulder.y) /
    shoulderWidth;
  let unevenConfidence = confidenceAbove(
    shoulderDiff,
    thresholds.shoulderUnevenness * 0.6,
    thresholds.shoulderUnevenness * 0.4,
  );

  const earsVisible =
    isLandmarkVisible(landmarks.leftEar) &&
    isLandmarkVisible(landmarks.rightEar);
  if (earsVisible) {
    const earDiff =
      Math.abs(landmarks.leftEar.y - landmarks.rightEar.y) / shoulderWidth;
    unevenConfidence = Math.max(
      unevenConfidence,
      confidenceAbove(
        earDiff,
        thresholds.shoulderUnevenness * 0.6,
        thresholds.shoulderUnevenness * 0.4,
      ),
    );
  }

  const unevenIssue = createIssue("uneven_shoulders", unevenConfidence);
  if (unevenIssue) issues.push(unevenIssue);

  // Leaning left/right: signed nose offset from shoulder center
  const leanOffset = (landmarks.nose.x - shoulderMid.x) / shoulderWidth;
  if (leanOffset < -thresholds.leanOffset * 0.6) {
    const leanIssue = createIssue(
      "leaning_left",
      confidenceAbove(
        Math.abs(leanOffset),
        thresholds.leanOffset * 0.6,
        thresholds.leanOffset * 0.4,
      ),
    );
    if (leanIssue) issues.push(leanIssue);
  } else if (leanOffset > thresholds.leanOffset * 0.6) {
    const leanIssue = createIssue(
      "leaning_right",
      confidenceAbove(
        leanOffset,
        thresholds.leanOffset * 0.6,
        thresholds.leanOffset * 0.4,
      ),
    );
    if (leanIssue) issues.push(leanIssue);
  }

  const penalty = issues.reduce((sum, issue) => {
    const weight =
      issue.severity === "high" ? 20 : issue.severity === "medium" ? 14 : 8;
    return sum + weight * issue.confidence;
  }, 0);

  const score = clamp(100 - penalty, 0, 100);

  return {
    score,
    status: getStatusFromScore(score),
    issues,
    timestamp: Date.now(),
  };
}
