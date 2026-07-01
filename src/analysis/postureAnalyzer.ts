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
  slouchAngle: number;
  shoulderUnevenness: number;
  leanOffset: number;
  neckAngle: number;
}

const BASE_THRESHOLDS: ThresholdConfig = {
  forwardHeadRatio: 0.18,
  slouchAngle: 15,
  shoulderUnevenness: 0.04,
  leanOffset: 0.06,
  neckAngle: 35,
};

function getThresholds(sensitivity: Sensitivity): ThresholdConfig {
  const m = getSensitivityMultiplier(sensitivity);
  return {
    forwardHeadRatio: BASE_THRESHOLDS.forwardHeadRatio / m,
    slouchAngle: BASE_THRESHOLDS.slouchAngle / m,
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

function torsoVerticalAngle(shoulderMid: Point2D, hipMid: Point2D): number {
  const dx = shoulderMid.x - hipMid.x;
  const dy = shoulderMid.y - hipMid.y;
  const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
  return (angleRad * 180) / Math.PI;
}

export function analyzePosture(
  landmarks: PoseLandmarks,
  sensitivity: Sensitivity = "medium",
): PostureResult {
  const thresholds = getThresholds(sensitivity);
  const issues: PostureIssue[] = [];

  const requiredPoints = [
    landmarks.nose,
    landmarks.leftShoulder,
    landmarks.rightShoulder,
    landmarks.leftHip,
    landmarks.rightHip,
  ];

  const allVisible = requiredPoints.every((p) => isLandmarkVisible(p));
  if (!allVisible) {
    return {
      score: 50,
      status: "fair",
      issues: [],
      timestamp: Date.now(),
    };
  }

  const shoulderMid = midpoint(landmarks.leftShoulder, landmarks.rightShoulder);
  const hipMid = midpoint(landmarks.leftHip, landmarks.rightHip);
  const earMid = midpoint(landmarks.leftEar, landmarks.rightEar);
  const shoulderWidth = distance(landmarks.leftShoulder, landmarks.rightShoulder);
  const torsoHeight = distance(shoulderMid, hipMid);

  if (shoulderWidth === 0 || torsoHeight === 0) {
    return {
      score: 50,
      status: "fair",
      issues: [],
      timestamp: Date.now(),
    };
  }

  // Forward head: horizontal offset of ears relative to shoulders
  const forwardOffset = Math.abs(earMid.x - shoulderMid.x) / shoulderWidth;
  const forwardConfidence = clamp(
    (forwardOffset - thresholds.forwardHeadRatio * 0.5) /
      (thresholds.forwardHeadRatio * 0.5),
    0,
    1,
  );
  const forwardIssue = createIssue("forward_head", forwardConfidence);
  if (forwardIssue) issues.push(forwardIssue);

  // Slouching: torso deviates from vertical
  const slouchAngle = torsoVerticalAngle(shoulderMid, hipMid);
  const slouchConfidence = clamp(
    (slouchAngle - thresholds.slouchAngle * 0.5) /
      (thresholds.slouchAngle * 0.5),
    0,
    1,
  );
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

  // Leaning left/right
  const leanOffset = (shoulderMid.x - hipMid.x) / shoulderWidth;
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

  // Excessive neck angle
  const neckAngle = angleBetween(
    landmarks.nose,
    earMid,
    shoulderMid,
  );
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
