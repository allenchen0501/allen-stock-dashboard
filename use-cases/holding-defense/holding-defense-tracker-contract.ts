/**
 * Holding Defense Tracker API Contract — V27
 *
 * Read-model TypeScript contract for the Holding Defense Tracker API
 * (GET /api/portfolio/holding-defense). This file contains TYPES + a few static
 * safety CONSTANTS ONLY. It declares no runtime, performs no fetch, imports no
 * Supabase client, reads no environment keys, runs no quote polling, runs no
 * scheduler, calls Date.now on nothing, and writes no data.
 *
 * The Holding Defense Tracker describes the API shape for future intraday
 * holding-defense tracking: whether a holding is near / breaking its defense
 * zone, whether profit protection or risk reduction is active, whether price is
 * verified, and whether data is insufficient / stale / fallback-only / in
 * conflict. It is NOT an auto-trading system, does NOT produce buy/sell
 * commands, and does NOT replace investment judgement.
 *
 * V27 is contract-only / fixture-only. Precise zones are only valid when
 * priceVerified === true. fallback-only / stale / source-conflict data must
 * NEVER trigger DANGER.
 *
 * See: docs/holding-defense-tracker-api-contract.md
 * See: docs/position-strategy-plan-spec.md
 * See: docs/dynamic-opportunity-price-verification-spec.md
 */

import type {
  HoldingActionState,
  HoldingState,
  PositionStrategyDataQualityStatus,
  PriceVerificationStatus,
  PriceZone,
} from "../position-strategy/position-strategy-plan-contract";

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type HoldingDefenseTrackerState =
  | "NORMAL_OBSERVATION"
  | "DEFENSE_ZONE_NEAR"
  | "DEFENSE_ZONE_BROKEN"
  | "PROFIT_PROTECTION_ACTIVE"
  | "RISK_REDUCTION_ACTIVE"
  | "DATA_INSUFFICIENT"
  | "PRICE_NOT_VERIFIED"
  | "SOURCE_CONFLICT"
  | "STALE_DATA";

export type HoldingDefenseAlertLevel =
  | "INFO"
  | "WATCH"
  | "WARNING"
  | "DANGER"
  | "DATA_INSUFFICIENT";

export type HoldingDefenseSourceMode =
  | "spec_only"
  | "fixture"
  | "runtime"
  | "fallback";

// ---------------------------------------------------------------------------
// Tracker item
// ---------------------------------------------------------------------------

/**
 * One holding-defense tracker row. Every price field is a PriceZone observation,
 * never a trade instruction. When `priceVerified === false`, all precise zones
 * must be null and `highConfidenceConclusionAllowed` must be false. The three
 * literal-false flags are permanent read-only invariants.
 */
export interface HoldingDefenseTrackerItem {
  trackerId: string;
  stockId: string;
  stockName: string;

  trackerState: HoldingDefenseTrackerState;
  alertLevel: HoldingDefenseAlertLevel;
  sourceMode: HoldingDefenseSourceMode;
  dataQualityStatus: PositionStrategyDataQualityStatus;

  holdingState: HoldingState;
  holdingActionState: HoldingActionState | null;
  holdingImpact: string | null;

  priceVerified: boolean;
  priceVerificationStatus: PriceVerificationStatus;
  priceSource: string | null;
  priceCheckedAt: string | null;

  costBasis: number | null;
  currentPrice: number | null;
  unrealizedProfitLoss: number | null;
  unrealizedProfitLossPercent: number | null;
  peakUnrealizedProfitLossPercent: number | null;
  drawdownFromPeakPercent: number | null;

  defenseZone: PriceZone | null;
  invalidLevel: PriceZone | null;
  profitProtectionZone: PriceZone | null;
  takeProfitZone: PriceZone | null;
  riskReduceZone: PriceZone | null;
  exitObservationZone: PriceZone | null;

  trendState: string | null;
  trendBreakWarning: string | null;
  shortAttackRisk: string | null;
  supportBreakStatus: string | null;
  maBreakStatus: string | null;
  volumeBreakdownStatus: string | null;
  intradayAlertLevel: string | null;

  riskReduceObservation: string | null;
  waitForReclaimCondition: string | null;
  nextObservation: string | null;

  warnings: string[];
  missingDataFields: string[];
  requiredVerification: string[];
  safetyLabels: string[];

  notExitSignal: boolean;
  notTradeAdvice: boolean;
  highConfidenceConclusionAllowed: boolean;

  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Tracker summary
// ---------------------------------------------------------------------------

export interface HoldingDefenseTrackerSummary {
  totalHoldings: number;
  normalObservationCount: number;
  defenseZoneNearCount: number;
  defenseZoneBrokenCount: number;
  profitProtectionActiveCount: number;
  riskReductionActiveCount: number;
  dataInsufficientCount: number;
  priceNotVerifiedCount: number;
  sourceConflictCount: number;
  staleDataCount: number;
  highConfidenceConclusionAllowed: false;
}

// ---------------------------------------------------------------------------
// API response
// ---------------------------------------------------------------------------

export interface HoldingDefenseTrackerResponse {
  contractVersion: "V27";
  apiContractVersion: "V27";
  responseSource: "mock_or_contract";
  sourceMode: "fixture";
  generatedAt: string;
  trackerFixtureVersion: "V27";
  items: HoldingDefenseTrackerItem[];
  summary: HoldingDefenseTrackerSummary;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const HOLDING_DEFENSE_TRACKER_CONTRACT_VERSION = "V27" as const;

export const HOLDING_DEFENSE_TRACKER_API_PATH = "/api/portfolio/holding-defense" as const;

/**
 * The nine allowed tracker states. Anything outside this list is invalid.
 */
export const HOLDING_DEFENSE_TRACKER_ALLOWED_STATES: readonly HoldingDefenseTrackerState[] = [
  "NORMAL_OBSERVATION",
  "DEFENSE_ZONE_NEAR",
  "DEFENSE_ZONE_BROKEN",
  "PROFIT_PROTECTION_ACTIVE",
  "RISK_REDUCTION_ACTIVE",
  "DATA_INSUFFICIENT",
  "PRICE_NOT_VERIFIED",
  "SOURCE_CONFLICT",
  "STALE_DATA",
] as const;

/**
 * Canonical safety labels. Every Holding Defense Tracker surface (builder,
 * future runtime, future UI) must keep these negations intact.
 */
export const HOLDING_DEFENSE_TRACKER_SAFETY_LABELS = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "Holding Defense Tracker 不是自動交易系統",
  "防守區是防守觀察，不是自動出場",
  "策略失效觀察價不是自動停損價",
  "takeProfitZone 不是賣出價",
  "出場觀察區不是賣出價",
  "風險降低觀察不是賣出指令",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command phrases that must NEVER be emitted by any Holding
 * Defense Tracker surface. Note: 「出場 / 停損 / 賣出價」are deliberately NOT listed
 * here because the safety language uses them only inside negations
 * (e.g. 「不是自動出場」/「不是自動停損價」/「不是賣出價」). Only standalone command /
 * guarantee phrases are banned.
 */
export const HOLDING_DEFENSE_TRACKER_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動停損",
] as const;
