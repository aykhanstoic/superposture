import type { PostureResult } from "@/types";
import { getStatusFromScore, lerp } from "@/utils";

// Time-constant of the display-score EMA. dt-aware so the smoothing feels the
// same whether the scheduler is ticking at 50ms or 1s. Kept mild: enough to
// take the twitch out of the number, not enough to stop it reacting — a long
// constant made the score feel numb and unable to reach poor territory.
const SCORE_TAU_S = 1.1;

/** Lightweight dt-aware EMA on the final numeric score for stable UI display. */
export class ScoreSmoother {
  private score: number | null = null;
  private lastTimestampMs: number | null = null;

  smooth(result: PostureResult, timestampMs: number): PostureResult {
    if (this.score === null || this.lastTimestampMs === null) {
      this.score = result.score;
    } else {
      const dtS = Math.max(1e-3, (timestampMs - this.lastTimestampMs) / 1000);
      const alpha = 1 - Math.exp(-dtS / SCORE_TAU_S);
      this.score = lerp(this.score, result.score, alpha);
    }
    this.lastTimestampMs = timestampMs;

    const score = Math.round(this.score);

    return {
      ...result,
      score,
      status: getStatusFromScore(score),
    };
  }

  reset(): void {
    this.score = null;
    this.lastTimestampMs = null;
  }
}
