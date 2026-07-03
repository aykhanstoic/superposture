import type { PostureResult } from "@/types";
import { getStatusFromScore, lerp } from "@/utils";

const SCORE_ALPHA = 0.15;

/** Lightweight EMA on the final numeric score for stable UI display. */
export class ScoreSmoother {
  private score: number | null = null;

  smooth(result: PostureResult): PostureResult {
    if (this.score === null) {
      this.score = result.score;
    } else {
      this.score = lerp(this.score, result.score, SCORE_ALPHA);
    }

    const score = Math.round(this.score);

    return {
      ...result,
      score,
      status: getStatusFromScore(score),
    };
  }

  reset(): void {
    this.score = null;
  }
}
