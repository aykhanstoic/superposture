import type { PostureResult } from "@/types";

export type InferenceTier = "idle" | "stable" | "normal" | "degrading";

export function tierIntervalMs(tier: InferenceTier): number {
  switch (tier) {
    case "idle":
      return 1000; // 1 fps — nobody in frame; just watch for someone returning
    case "stable":
      return 125; // 8 fps
    case "normal":
      return 67; // ~15 fps
    case "degrading":
      return 50; // 20 fps
  }
}

export interface SchedulerState {
  tier: InferenceTier;
  lastScore: number | null;
  lastScoreAt: number;
  stableGoodSince: number | null;
  noPoseSince: number | null;
}

export function createSchedulerState(): SchedulerState {
  return {
    tier: "normal",
    lastScore: null,
    lastScoreAt: 0,
    stableGoodSince: null,
    noPoseSince: null,
  };
}

export function computeTier(
  state: SchedulerState,
  result: PostureResult | null,
  now: number,
): InferenceTier {
  if (!result) {
    if (state.noPoseSince === null) state.noPoseSince = now;
    if (now - state.noPoseSince >= 2000) return "idle";
    return state.tier === "idle" ? "idle" : "normal";
  }

  state.noPoseSince = null;

  if (result.score < 50) return "degrading";

  const scoreDrop =
    state.lastScore !== null &&
    state.lastScore - result.score > 5 &&
    now - state.lastScoreAt < 2000;

  if (result.score < 70 || scoreDrop) return "degrading";

  if (result.issues.some((i) => i.severity === "high")) return "degrading";

  const hasNotableIssue = result.issues.some((i) => i.confidence > 0.4);

  if (result.score >= 70 && !hasNotableIssue) {
    if (state.stableGoodSince === null) state.stableGoodSince = now;
    if (now - state.stableGoodSince >= 5000) return "stable";
  } else {
    state.stableGoodSince = null;
  }

  return "normal";
}

export function updateSchedulerScore(
  state: SchedulerState,
  score: number,
  now: number,
): void {
  state.lastScore = score;
  state.lastScoreAt = now;
}
