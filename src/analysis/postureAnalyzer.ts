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
import {
  angleBetween,
  distance,
  isLandmarkVisible,
  midpoint,
} from "@/pose/smoothing";
import { clamp, getSensitivityMultiplier, getStatusFromScore } from "@/utils";

interface ThresholdConfig {
  forwardHeadRatio: number;
  slouchHeadDropRatio: number;
  slouchElbowForward: number;
  shoulderUnevenness: number;
  leanOffset: number;
  neckAngle: number;
}

const BASE_THRESHOLDS: ThresholdConfig = {
  forwardHeadRatio: 0.16,
  slouchHeadDropRatio: 0.22,
  slouchElbowForward: 0.12,
  shoulderUnevenness: 0.04,
  leanOffset: 0.05,
  neckAngle: 35,
};

function getThresholds(sensitivity: Sensitivity): ThresholdConfig {
  const m = getSensitivityMultiplier(sensitivity);
  return {
    forwardHeadRatio: BASE_THRESHOLDS.forwardHeadRatio / m,
    slouchHeadDropRatio: BASE_THRESHOLDS.slouchHeadDropRatio / m,
    slouchElbowForward: BASE_THRESHOLDS.slouchElbowForward / m,
    shoulderUnevenness: BASE_THRESHOLDS.shoulderUnevenness / m,
    leanOffset: BASE_THRESHOLDS.leanOffset / m,
    neckAngle: BASE_THRESHOLDS.neckAngle / m,
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
  if (confidence < 0.15) return null;
  return {
    type,
    label: ISSUE_LABELS[type],
    severity: severityFromConfidence(confidence),
    confidence: clamp(confidence, 0, 1),
  };
}

function headReference(landmarks: PoseLandmarks): Point2D {
  const earsOk =
    isLandmarkVisible(landmarks.leftEar) &&
    isLandmarkVisible(landmarks.rightEar);
  return earsOk
    ? midpoint(landmarks.leftEar, landmarks.rightEar)
    : landmarks.nose;
}

function neutralResult(): PostureResult {
  return {
    score: 50,
    status: "fair",
    issues: [],
    timestamp: Date.now(),
  };
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
  const headMid = headReference(landmarks);
  const shoulderWidth = distance(landmarks.leftShoulder, landmarks.rightShoulder);

  if (shoulderWidth === 0) {
    return neutralResult();
  }

  // Forward head: head sits ahead of shoulders (laptop posture)
  const forwardOffset = Math.abs(headMid.x - shoulderMid.x) / shoulderWidth;
  const forwardConfidence = clamp(
    (forwardOffset - thresholds.forwardHeadRatio * 0.5) /
      (thresholds.forwardHeadRatio * 0.5),
    0,
    1,
  );
  const forwardIssue = createIssue("forward_head", forwardConfidence);
  if (forwardIssue) issues.push(forwardIssue);

  // Slouching: head drops toward shoulders (no hips needed)
  // In image space y grows downward — upright = nose well above shoulders.
  const headClearance = (shoulderMid.y - landmarks.nose.y) / shoulderWidth;
  const slouchFromHeadDrop = clamp(
    (thresholds.slouchHeadDropRatio - headClearance) /
      thresholds.slouchHeadDropRatio,
    0,
    1,
  );

  // Slouching: elbows drift forward of shoulder line (rounded shoulders at desk)
  let slouchFromElbows = 0;
  const elbowsVisible =
    isLandmarkVisible(landmarks.leftElbow) &&
    isLandmarkVisible(landmarks.rightElbow);
  if (elbowsVisible) {
    const elbowMid = midpoint(landmarks.leftElbow, landmarks.rightElbow);
    const elbowForward = Math.abs(elbowMid.x - shoulderMid.x) / shoulderWidth;
    slouchFromElbows = clamp(
      (elbowForward - thresholds.slouchElbowForward * 0.5) /
        (thresholds.slouchElbowForward * 0.5),
      0,
      1,
    );
  }

  const slouchConfidence = Math.max(slouchFromHeadDrop, slouchFromElbows);
  const slouchIssue = createIssue("slouching", slouchConfidence);
  if (slouchIssue) issues.push(slouchIssue);

  // Uneven shoulders
  const shoulderDiff =
    Math.abs(landmarks.leftShoulder.y - landmarks.rightShoulder.y) /
    shoulderWidth;
  const unevenConfidence = clamp(
    (shoulderDiff - thresholds.shoulderUnevenness * 0.5) /
      (thresholds.shoulderUnevenness * 0.5),
    0,
    1,
  );
  const unevenIssue = createIssue("uneven_shoulders", unevenConfidence);
  if (unevenIssue) issues.push(unevenIssue);

  // Leaning left/right: head offset from shoulder center (upper-body only)
  const leanOffset = (headMid.x - shoulderMid.x) / shoulderWidth;
  if (leanOffset < -thresholds.leanOffset * 0.5) {
    const leanConfidence = clamp(
      Math.abs(leanOffset + thresholds.leanOffset * 0.5) /
        (thresholds.leanOffset * 0.5),
      0,
      1,
    );
    const leanIssue = createIssue("leaning_left", leanConfidence);
    if (leanIssue) issues.push(leanIssue);
  } else if (leanOffset > thresholds.leanOffset * 0.5) {
    const leanConfidence = clamp(
      (leanOffset - thresholds.leanOffset * 0.5) /
        (thresholds.leanOffset * 0.5),
      0,
      1,
    );
    const leanIssue = createIssue("leaning_right", leanConfidence);
    if (leanIssue) issues.push(leanIssue);
  }

  // Excessive neck angle: nose–head–shoulder triangle
  const neckAngle = angleBetween(landmarks.nose, headMid, shoulderMid);
  const neckConfidence = clamp(
    (neckAngle - thresholds.neckAngle) / 20,
    0,
    1,
  );
  const neckIssue = createIssue("excessive_neck_angle", neckConfidence);
  if (neckIssue) issues.push(neckIssue);

  const penalty = issues.reduce((sum, issue) => {
    const weight =
      issue.severity === "high" ? 18 : issue.severity === "medium" ? 12 : 6;
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
