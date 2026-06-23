/**
 * Technical + Risk Reward Strategy Contract — V18E
 *
 * Read-model TypeScript contract for the Technical Strategy Engine and Risk
 * Reward Engine. This file contains TYPES ONLY. It declares no runtime, performs
 * no fetch, imports no Supabase client, reads no environment keys, computes no
 * technical indicators, and fetches no K-line data.
 *
 * The Technical Strategy Engine answers "which stocks show a technical low,
 * turn-up signs, clear support, and a reasonable risk/reward worth watching".
 * It does NOT assert fundamentals, does NOT produce buy points, does NOT produce
 * an actionSignal, and does NOT produce buy/sell commands.
 *
 * See: docs/technical-risk-reward-strategy-spec.md
 * See: docs/war-room-intelligence-architecture.md
 */

export type TechnicalSetupType =
  | "DEDUCTION_THREE_LOW"
  | "KD_LOW_TURN_UP"
  | "KDJ_LOW_TURN_UP"
  | "MACD_MOMENTUM_RECOVERY"
  | "MA_RECLAIM"
  | "MA_SLOPE_IMPROVEMENT"
  | "WEEKLY_30MA_SUPPORT"
  | "DAILY_200MA_SUPPORT"
  | "VOLUME_CONTRACTION_PULLBACK"
  | "VOLUME_BREAKOUT"
  | "SUPPORT_RETEST"
  | "RESISTANCE_BREAKOUT"
  | "LOW_BASE_CONSOLIDATION"
  | "RISK_REWARD_QUALIFIED"
  | "DATA_INSUFFICIENT";

export type TechnicalDataQualityStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "DATA_INSUFFICIENT";

export type RiskRewardGrade =
  | "EXCELLENT"
  | "GOOD"
  | "QUALIFIED"
  | "UNQUALIFIED"
  | "DATA_INSUFFICIENT";

export type CandidateDecisionBoundary =
  | "OBSERVATION_ONLY"
  | "NO_TOUCH"
  | "DOWNGRADED_BY_MARKET"
  | "DOWNGRADED_BY_SECTOR"
  | "DOWNGRADED_BY_ALERT"
  | "DATA_INSUFFICIENT";

export interface TechnicalSetupSnapshot {
  stockId: string;
  stockName: string;
  market: string;
  setupTags: TechnicalSetupType[];
  deductionStatus: string | null;
  kdSignalQuality: string | null;
  kdjSignalQuality: string | null;
  macdSignalQuality: string | null;
  maSignalQuality: string | null;
  volumeSignalQuality: string | null;
  supportResistanceQuality: string | null;
  technicalScore: number | null;
  dataQualityStatus: TechnicalDataQualityStatus;
  computedAt: string | null;
  sourceMode: "spec_only" | "fixture" | "runtime_candidate";
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

export interface RiskRewardSnapshot {
  stockId: string;
  stockName: string;
  observationPrice: number | null;
  supportZoneLow: number | null;
  supportZoneHigh: number | null;
  invalidLevel: number | null;
  targetZoneLow: number | null;
  targetZoneHigh: number | null;
  risk: number | null;
  reward: number | null;
  riskRewardRatio: number | null;
  riskRewardGrade: RiskRewardGrade;
  dataQualityStatus: TechnicalDataQualityStatus;
  computedAt: string | null;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

export interface TechnicalRiskRewardCandidate {
  rank: number;
  stockId: string;
  stockName: string;
  setup: TechnicalSetupSnapshot;
  riskReward: RiskRewardSnapshot;
  decisionBoundary: CandidateDecisionBoundary;
  observationSummary: string;
  notEntrySignal: true;
  notTradeAdvice: true;
}
