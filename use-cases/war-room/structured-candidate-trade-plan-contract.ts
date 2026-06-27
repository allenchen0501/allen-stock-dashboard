/**
 * Structured Candidate Trade Plan Contract — V63
 *
 * Read-model TypeScript contract that upgrades a candidate's pullbackBuyZone /
 * riskRewardRatio / entryStrategy from free-text strings into a structured,
 * deterministic, validator-checkable shape. TYPES + static CONSTANTS ONLY. No
 * runtime, no fetch, no Supabase client, no env reads, no clock reads, no DB writes.
 *
 * Every value here is fixture/mock and is NOT operational data: sourceType is
 * always "fixture_mock" and operationalUseAllowed is always false. A trade plan is
 * an OBSERVATION structure, NOT a buy/sell command and NOT an auto order. System
 * candidates are not positions (isPosition=false, pnlComputable=false, no shares,
 * no cost basis).
 *
 * See: docs/structured-candidate-trade-plan.md
 */

import type { AllenScoreEngineGrade, AllenScoreEnginePool } from "./allen-score-scoring-engine";

// ---------------------------------------------------------------------------
// Structured pieces
// ---------------------------------------------------------------------------

export type TradePlanConfidence = "low" | "medium" | "high";

export interface StructuredBuyZone {
  lower: number;
  upper: number;
  currency: "TWD";
  basis: string;
  confidence: TradePlanConfidence;
  sourceType: "fixture_mock";
  operationalUseAllowed: false;
}

export interface StructuredRiskReward {
  stopLossLower: number;
  stopLossUpper: number;
  targetLower: number;
  targetUpper: number;
  downsideRiskPercent: number;
  upsideRewardPercent: number;
  rewardRiskRatio: number;
  sourceType: "fixture_mock";
  operationalUseAllowed: false;
}

export interface StructuredEntryStrategy {
  triggerConditionText: string;
  invalidationConditionText: string;
  observationOnlyText: string;
  sizingHintText: string;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
}

export interface CandidateTradePlan {
  symbol: string;
  name: string;
  grade: AllenScoreEngineGrade;
  allenScore: number;
  pool: AllenScoreEnginePool;
  buyZone: StructuredBuyZone;
  riskReward: StructuredRiskReward;
  entryStrategy: StructuredEntryStrategy;
  isPosition: false;
  pnlComputable: false;
  fixtureOnly: true;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface CandidateTradePlanValidation {
  symbol: string;
  buyZoneOrdered: boolean;
  stopBelowBuyZone: boolean;
  targetAboveBuyZone: boolean;
  downsideRiskPositive: boolean;
  upsideRewardPositive: boolean;
  rewardRiskRatioPositive: boolean;
  rewardRiskRatioDerivable: boolean;
  sourceTypeFixtureMock: boolean;
  operationalUseDisallowed: boolean;
  isNotPosition: boolean;
  pnlNotComputable: boolean;
  noShares: boolean;
  noCostBasis: boolean;
  noBuySellCommand: boolean;
  noAutoOrder: boolean;
  triggerNotImperativeBuy: boolean;
  observationNotOperational: boolean;
  matchesV62Candidate: boolean;
  valid: boolean;
}

export interface StructuredCandidateTradePlanBundle {
  contractVersion: "V63";
  contractName: "Structured Candidate Trade Plan";
  generatedAt: string;
  decision: "READY_FOR_UI_REVIEW" | "NO_GO";

  tradePlans: CandidateTradePlan[];
  validations: CandidateTradePlanValidation[];
  allValid: boolean;

  // Locked safety flags.
  fixtureOnly: true;
  operationalUseAllowed: false;
  systemCandidateIsNotPosition: true;
  noFakePnlAllowed: true;
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

export const STRUCTURED_CANDIDATE_TRADE_PLAN_CONTRACT_VERSION = "V63" as const;

export const STRUCTURED_CANDIDATE_TRADE_PLAN_CONTRACT_NAME = "Structured Candidate Trade Plan" as const;

/** rewardRiskRatio may differ from upside/downside by at most this (rounding). */
export const TRADE_PLAN_RATIO_TOLERANCE = 0.2;

/** Phrases that would make a trigger/observation an imperative buy/sell command. */
export const TRADE_PLAN_FORBIDDEN_COMMAND_PHRASES = [
  "買進",
  "賣出",
  "立即買",
  "馬上買",
  "立刻買",
  "下單",
  "掛單",
  "市價買",
  "buy now",
  "sell now",
  "place order",
] as const;

export const STRUCTURED_CANDIDATE_TRADE_PLAN_SAFETY_LABELS = [
  "Structured Candidate Trade Plan",
  "fixture-only",
  "deterministic contract",
  "fixture/mock 區間不可作為正式操作依據",
  "觀察策略，不是買賣指令",
  "observation only",
  "not buy/sell command",
  "system candidate is not position",
  "可逢低布局不等於已買進",
  "no fake PnL",
  "pnlComputable false",
  "no shares",
  "no cost basis",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no auto order",
] as const;
