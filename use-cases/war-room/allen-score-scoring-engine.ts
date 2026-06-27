/**
 * Allen Score Deterministic Scoring Engine — V62
 *
 * Pure, deterministic scoring functions. NO side effects, NO I/O. These functions
 * never connect to Supabase, never read env, never fetch, never read a clock, and
 * never write data. They only turn sub-scores into a total, a grade, and a pool.
 *
 * Allen Score = 100 = Technical 30 + Fundamental 25 + Chip 25 + ETF Flow 10 +
 * Market Sentiment 10. Grades: A (>=80) / B (70-79) / C (60-69) / AVOID (<60).
 *
 * scoreCandidate REJECTS invalid sub-score ranges (throws RangeError); each
 * sub-score must be within [0, its weight] and the total within [0, 100].
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllenScoreSubScores {
  technicalScore: number;
  fundamentalScore: number;
  chipScore: number;
  etfFlowScore: number;
  marketSentimentScore: number;
}

export type AllenScoreEngineGrade = "A" | "B" | "C" | "AVOID";

export type AllenScoreEnginePool =
  | "A_GRADE_MAIN_UPTREND"
  | "B_GRADE_WATCHLIST"
  | "C_GRADE_WAITING"
  | "RISK_BLOCKLIST";

/** Minimal structural shape needed to build a scoring breakdown. */
export interface ScorableCandidate extends AllenScoreSubScores {
  stockId: string;
  symbol: string;
  allenScore: number;
  isPosition: boolean;
  pnlComputable: boolean;
}

export interface CandidateScoringBreakdown extends AllenScoreSubScores {
  stockId: string;
  symbol: string;
  computedTotal: number;
  reportedTotal: number;
  totalMatches: boolean;
  engineGrade: AllenScoreEngineGrade;
  assignedPool: AllenScoreEnginePool;
  isPosition: boolean;
  pnlComputable: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Per-category maximum (= weight). A sub-score may not exceed its weight. */
export const ALLEN_SCORE_WEIGHT_LIMITS = {
  technicalScore: 30,
  fundamentalScore: 25,
  chipScore: 25,
  etfFlowScore: 10,
  marketSentimentScore: 10,
} as const;

export const ALLEN_SCORE_MAX_TOTAL = 100;
export const ALLEN_SCORE_A_THRESHOLD = 80;
export const ALLEN_SCORE_B_MIN = 70;
export const ALLEN_SCORE_B_MAX = 79;
export const ALLEN_SCORE_C_MIN = 60;
export const ALLEN_SCORE_C_MAX = 69;
export const ALLEN_SCORE_AVOID_BELOW = 60;

/** Grade → candidate pool. A => main uptrend, AVOID => risk blocklist. */
export const ALLEN_SCORE_GRADE_POOL_MAP: Record<AllenScoreEngineGrade, AllenScoreEnginePool> = {
  A: "A_GRADE_MAIN_UPTREND",
  B: "B_GRADE_WATCHLIST",
  C: "C_GRADE_WAITING",
  AVOID: "RISK_BLOCKLIST",
};

const SUBSCORE_KEYS: ReadonlyArray<keyof AllenScoreSubScores> = [
  "technicalScore",
  "fundamentalScore",
  "chipScore",
  "etfFlowScore",
  "marketSentimentScore",
];

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Returns a list of range violations for the given sub-scores. Empty list means
 * valid. Each sub-score must be a finite number within [0, its weight limit].
 */
export function validateSubScores(s: AllenScoreSubScores): string[] {
  const errors: string[] = [];
  for (const key of SUBSCORE_KEYS) {
    const value = s[key];
    const limit = ALLEN_SCORE_WEIGHT_LIMITS[key];
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(`${key} must be a finite number`);
    } else if (value < 0) {
      errors.push(`${key} must be >= 0`);
    } else if (value > limit) {
      errors.push(`${key} must be <= ${limit}`);
    }
  }
  return errors;
}

/**
 * Computes the Allen Score total from five sub-scores. Throws RangeError if any
 * sub-score is out of range or the total falls outside [0, 100]. The returned
 * total always equals the sub-score sum.
 */
export function scoreCandidate(s: AllenScoreSubScores): number {
  const errors = validateSubScores(s);
  if (errors.length > 0) {
    throw new RangeError(`Invalid sub-scores: ${errors.join("; ")}`);
  }
  const total =
    s.technicalScore + s.fundamentalScore + s.chipScore + s.etfFlowScore + s.marketSentimentScore;
  if (total < 0 || total > ALLEN_SCORE_MAX_TOTAL) {
    throw new RangeError(`totalScore ${total} is out of range [0, ${ALLEN_SCORE_MAX_TOTAL}]`);
  }
  return total;
}

/**
 * Maps a total score to its grade.
 *   totalScore >= 80         => A
 *   70 <= totalScore <= 79   => B
 *   60 <= totalScore <= 69   => C
 *   totalScore < 60          => AVOID
 */
export function gradeCandidate(totalScore: number): AllenScoreEngineGrade {
  if (totalScore >= ALLEN_SCORE_A_THRESHOLD) return "A";
  if (totalScore >= ALLEN_SCORE_B_MIN) return "B";
  if (totalScore >= ALLEN_SCORE_C_MIN) return "C";
  return "AVOID";
}

/**
 * Maps a grade to its candidate pool.
 *   A => A_GRADE_MAIN_UPTREND
 *   B => B_GRADE_WATCHLIST
 *   C => C_GRADE_WAITING
 *   AVOID => RISK_BLOCKLIST
 */
export function assignCandidatePool(grade: AllenScoreEngineGrade): AllenScoreEnginePool {
  return ALLEN_SCORE_GRADE_POOL_MAP[grade];
}

/**
 * Builds a deterministic scoring breakdown for one candidate: re-computes the
 * total from its sub-scores, derives the grade and pool, and reports whether the
 * candidate's reported total matches the computed total. Position-ness and PnL
 * computability are passed straight through (system candidates are never
 * positions and never compute PnL).
 */
export function buildCandidateScoringBreakdown(c: ScorableCandidate): CandidateScoringBreakdown {
  const subScores: AllenScoreSubScores = {
    technicalScore: c.technicalScore,
    fundamentalScore: c.fundamentalScore,
    chipScore: c.chipScore,
    etfFlowScore: c.etfFlowScore,
    marketSentimentScore: c.marketSentimentScore,
  };
  const computedTotal = scoreCandidate(subScores);
  const engineGrade = gradeCandidate(computedTotal);
  const assignedPool = assignCandidatePool(engineGrade);
  return {
    stockId: c.stockId,
    symbol: c.symbol,
    ...subScores,
    computedTotal,
    reportedTotal: c.allenScore,
    totalMatches: computedTotal === c.allenScore,
    engineGrade,
    assignedPool,
    isPosition: c.isPosition,
    pnlComputable: c.pnlComputable,
  };
}
