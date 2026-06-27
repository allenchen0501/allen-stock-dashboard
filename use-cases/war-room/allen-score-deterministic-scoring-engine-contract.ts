/**
 * Allen Score Deterministic Scoring Engine Contract — V62
 *
 * Read-model TypeScript contract for the deterministic scoring engine verification
 * bundle. TYPES + static CONSTANTS ONLY. No runtime, no fetch, no Supabase client,
 * no env reads, no clock reads, no DB writes, no connection.
 *
 * The engine itself (pure functions) lives in `allen-score-scoring-engine.ts`.
 * This contract describes the verification bundle that proves grade consistency:
 * every candidate total equals its sub-score sum, every grade matches the score,
 * and every pool matches the grade. fixture/mock score is not operational data.
 *
 * See: docs/allen-score-deterministic-scoring-engine.md
 */

import type {
  AllenScoreEngineGrade,
  AllenScoreEnginePool,
  CandidateScoringBreakdown,
} from "./allen-score-scoring-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AllenScoreEngineDecision = "READY_FOR_UI_REVIEW" | "NO_GO";

export interface AllenScoreGradeThresholds {
  aGradeThreshold: 80;
  bGradeMin: 70;
  bGradeMax: 79;
  cGradeMin: 60;
  cGradeMax: 69;
  avoidBelow: 60;
}

/** Consistency invariants the engine + builder must satisfy. */
export interface AllenScoreScoringConsistency {
  everyCandidateTotalEqualsSum: boolean;
  everyCandidateGradeMatchesScore: boolean;
  everyCandidatePoolMatchesGrade: boolean;
  aPoolOnlyAGradeAndScoreGte80: boolean;
  bPoolOnlyBGrade70To79: boolean;
  cPoolOnlyCGrade60To69: boolean;
  riskBlocklistOnlyAvoidScoreLt60: boolean;
  noCandidateBothPositionAndSystemCandidate: boolean;
  pnlComputableFalseForAllSystemCandidates: boolean;
  systemCandidatesHaveNoSharesOrCost: boolean;
  fixtureMockWarningVisible: boolean;
}

export interface AllenScoreDeterministicScoringEngineBundle {
  contractVersion: "V62";
  engineName: "Allen Score Deterministic Scoring Engine";
  generatedAt: string;
  decision: AllenScoreEngineDecision;

  totalScore: 100;
  thresholds: AllenScoreGradeThresholds;
  gradePoolMap: Record<AllenScoreEngineGrade, AllenScoreEnginePool>;

  breakdowns: CandidateScoringBreakdown[];
  consistency: AllenScoreScoringConsistency;

  // Locked safety flags.
  systemCandidateIsNotPosition: true;
  noFakePnlAllowed: true;
  sampleScoreIsFixtureOnly: true;
  mockDataMustBeLabeled: true;
  fixtureDataMustBeLabeled: true;
  realDataConnected: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionTradingReady: false;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ALLEN_SCORE_DETERMINISTIC_SCORING_ENGINE_CONTRACT_VERSION = "V62" as const;

export const ALLEN_SCORE_ENGINE_NAME = "Allen Score Deterministic Scoring Engine" as const;

export const ALLEN_SCORE_ENGINE_SAFETY_LABELS = [
  "Allen Score Deterministic Scoring Engine",
  "totalScore equals sub-score sum",
  "grade must match score",
  "pool must match grade",
  "system candidate is not position",
  "可逢低布局不等於已買進",
  "no fake PnL",
  "pnlComputable false",
  "fixture/mock score is not operational data",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
] as const;
