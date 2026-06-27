/**
 * Allen Score Deterministic Scoring Engine Contract Builder — V62
 *
 * Pure deterministic builder. Re-scores every V61 daily-pool candidate through the
 * pure engine and proves grade consistency: total == sub-score sum, grade matches
 * score, pool matches grade, and each pool contains only its own grade/score band.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no /api/portfolio switch; no buy/sell command; no auto order
 */

import { buildAllenScoreScoringModelContract } from "./build-allen-score-scoring-model-contract";
import type { AllenScoreCandidate, AllenScoreGrade, AllenScorePoolId } from "./allen-score-scoring-model-contract";
import {
  assignCandidatePool,
  buildCandidateScoringBreakdown,
  gradeCandidate,
  scoreCandidate,
  ALLEN_SCORE_A_THRESHOLD,
  ALLEN_SCORE_B_MAX,
  ALLEN_SCORE_B_MIN,
  ALLEN_SCORE_C_MAX,
  ALLEN_SCORE_C_MIN,
  ALLEN_SCORE_GRADE_POOL_MAP,
} from "./allen-score-scoring-engine";
import type { AllenScoreEngineGrade, AllenScoreEnginePool, CandidateScoringBreakdown } from "./allen-score-scoring-engine";
import {
  ALLEN_SCORE_ENGINE_NAME,
  ALLEN_SCORE_ENGINE_SAFETY_LABELS,
} from "./allen-score-deterministic-scoring-engine-contract";
import type { AllenScoreDeterministicScoringEngineBundle, AllenScoreScoringConsistency } from "./allen-score-deterministic-scoring-engine-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildAllenScoreDeterministicScoringEngineContractInput {
  generatedAt?: string;
}

/** V61 grade enum → canonical engine grade. */
const ALLEN_TO_ENGINE_GRADE: Record<AllenScoreGrade, AllenScoreEngineGrade> = {
  A_MAIN_UPTREND: "A",
  B_OBSERVE: "B",
  C_WAIT: "C",
  AVOID: "AVOID",
};

/** V61 pool id → expected engine pool. */
const ALLEN_POOL_TO_ENGINE_POOL: Record<AllenScorePoolId, AllenScoreEnginePool> = {
  A_MAIN_UPTREND_POOL: "A_GRADE_MAIN_UPTREND",
  B_OBSERVE_POOL: "B_GRADE_WATCHLIST",
  C_WAIT_POOL: "C_GRADE_WAITING",
  AVOID_POOL: "RISK_BLOCKLIST",
};

function subScoreSum(c: AllenScoreCandidate): number {
  return c.technicalScore + c.fundamentalScore + c.chipScore + c.etfFlowScore + c.marketSentimentScore;
}

/**
 * Builds the deterministic scoring engine verification bundle. Reads no clock, no
 * env, no network — only re-scores the V61 fixture candidates through the engine.
 */
export function buildAllenScoreDeterministicScoringEngineContract(
  input: BuildAllenScoreDeterministicScoringEngineContractInput = {},
): AllenScoreDeterministicScoringEngineBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const model = buildAllenScoreScoringModelContract({ generatedAt });

  const breakdowns: CandidateScoringBreakdown[] = [];

  // Per-pool consistency accumulators.
  let everyTotalEqualsSum = true;
  let everyGradeMatchesScore = true;
  let everyPoolMatchesGrade = true;
  let aPoolOk = true;
  let bPoolOk = true;
  let cPoolOk = true;
  let riskOk = true;
  let noPositionMix = true;
  let pnlAllFalse = true;
  let noSharesOrCost = true;

  for (const pool of model.dailyPools) {
    const expectedEngineGrade = ALLEN_TO_ENGINE_GRADE[pool.grade];
    const expectedEnginePool = ALLEN_POOL_TO_ENGINE_POOL[pool.poolId];

    for (const candidate of pool.candidates) {
      const breakdown = buildCandidateScoringBreakdown(candidate);
      breakdowns.push(breakdown);

      // total == sub-score sum (and reported allenScore matches computed).
      const sum = subScoreSum(candidate);
      const computed = scoreCandidate({
        technicalScore: candidate.technicalScore,
        fundamentalScore: candidate.fundamentalScore,
        chipScore: candidate.chipScore,
        etfFlowScore: candidate.etfFlowScore,
        marketSentimentScore: candidate.marketSentimentScore,
      });
      if (computed !== sum || candidate.allenScore !== sum || !breakdown.totalMatches) {
        everyTotalEqualsSum = false;
      }

      // grade matches score (engine grade from score == pool's grade).
      const engineGrade = gradeCandidate(computed);
      if (engineGrade !== expectedEngineGrade) {
        everyGradeMatchesScore = false;
      }

      // pool matches grade.
      if (assignCandidatePool(engineGrade) !== expectedEnginePool) {
        everyPoolMatchesGrade = false;
      }

      // per-band purity.
      if (pool.poolId === "A_MAIN_UPTREND_POOL" && (engineGrade !== "A" || computed < ALLEN_SCORE_A_THRESHOLD)) aPoolOk = false;
      if (pool.poolId === "B_OBSERVE_POOL" && (engineGrade !== "B" || computed < ALLEN_SCORE_B_MIN || computed > ALLEN_SCORE_B_MAX)) bPoolOk = false;
      if (pool.poolId === "C_WAIT_POOL" && (engineGrade !== "C" || computed < ALLEN_SCORE_C_MIN || computed > ALLEN_SCORE_C_MAX)) cPoolOk = false;
      if (pool.poolId === "AVOID_POOL" && (engineGrade !== "AVOID" || computed >= ALLEN_SCORE_C_MIN)) riskOk = false;

      // position / PnL safety.
      if (candidate.isPosition !== false) noPositionMix = false;
      if (candidate.pnlComputable !== false) pnlAllFalse = false;
      if (
        Object.prototype.hasOwnProperty.call(candidate, "shares") ||
        Object.prototype.hasOwnProperty.call(candidate, "averageCost") ||
        Object.prototype.hasOwnProperty.call(candidate, "costBasis")
      ) {
        noSharesOrCost = false;
      }
    }
  }

  const consistency: AllenScoreScoringConsistency = {
    everyCandidateTotalEqualsSum: everyTotalEqualsSum,
    everyCandidateGradeMatchesScore: everyGradeMatchesScore,
    everyCandidatePoolMatchesGrade: everyPoolMatchesGrade,
    aPoolOnlyAGradeAndScoreGte80: aPoolOk,
    bPoolOnlyBGrade70To79: bPoolOk,
    cPoolOnlyCGrade60To69: cPoolOk,
    riskBlocklistOnlyAvoidScoreLt60: riskOk,
    noCandidateBothPositionAndSystemCandidate: noPositionMix,
    pnlComputableFalseForAllSystemCandidates: pnlAllFalse,
    systemCandidatesHaveNoSharesOrCost: noSharesOrCost,
    fixtureMockWarningVisible: true,
  };

  const allConsistent = Object.values(consistency).every((v) => v === true);

  return {
    contractVersion: "V62",
    engineName: ALLEN_SCORE_ENGINE_NAME,
    generatedAt,
    decision: allConsistent ? "READY_FOR_UI_REVIEW" : "NO_GO",

    totalScore: 100,
    thresholds: {
      aGradeThreshold: 80,
      bGradeMin: 70,
      bGradeMax: 79,
      cGradeMin: 60,
      cGradeMax: 69,
      avoidBelow: 60,
    },
    gradePoolMap: { ...ALLEN_SCORE_GRADE_POOL_MAP },

    breakdowns,
    consistency,

    systemCandidateIsNotPosition: true,
    noFakePnlAllowed: true,
    sampleScoreIsFixtureOnly: true,
    mockDataMustBeLabeled: true,
    fixtureDataMustBeLabeled: true,
    realDataConnected: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionTradingReady: false,

    safetyLabels: [...ALLEN_SCORE_ENGINE_SAFETY_LABELS],
  };
}
