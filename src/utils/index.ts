import type { PostureStatus, Sensitivity } from "@/types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getStatusFromScore(score: number): PostureStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function getSensitivityMultiplier(sensitivity: Sensitivity): number {
  switch (sensitivity) {
    case "low":
      return 0.7;
    case "high":
      return 1.3;
    default:
      return 1;
  }
}

export function getStatusColor(status: PostureStatus): string {
  switch (status) {
    case "excellent":
      return "text-score-excellent";
    case "good":
      return "text-score-good";
    case "fair":
      return "text-score-fair";
    case "poor":
      return "text-score-poor";
  }
}

export function getStatusBgColor(status: PostureStatus): string {
  switch (status) {
    case "excellent":
      return "bg-score-excellent/15 border-score-excellent/30";
    case "good":
      return "bg-score-good/15 border-score-good/30";
    case "fair":
      return "bg-score-fair/15 border-score-fair/30";
    case "poor":
      return "bg-score-poor/15 border-score-poor/30";
  }
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
