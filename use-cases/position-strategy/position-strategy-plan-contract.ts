/**
 * Position Strategy Plan Contract — V24
 *
 * Read-model TypeScript contract for the Position Strategy Plan. This file
 * contains TYPES + a few static safety CONSTANTS ONLY. It declares no runtime,
 * performs no fetch, imports no Supabase client, reads no environment keys,
 * computes no technical indicators, reads no holdings, calculates no real-time
 * profit/loss, calls Date.now on nothing, and writes no data.
 *
 * The Position Strategy Plan turns verified technical / valuation / research /
 * holding / intraday-alert inputs into CONDITIONAL OBSERVATION PLANS:
 *   - 進場觀察區 (entry observation zone)
 *   - 轉強確認條件 (confirmation condition)
 *   - 策略失效觀察價 (invalid level — NOT an auto stop-loss)
 *   - 防守區 (defense zone)
 *   - 獲利保護區 / takeProfitZone (profit protection — NOT a sell price)
 *   - 風險降低觀察 (risk reduction observation — NOT a sell command)
 *   - 出場觀察區 (exit observation zone — NOT a sell price)
 *   - 不追價區 (no-chase zone)
 *   - 禁碰 / No Touch (risk-control reminder — NOT a sell command)
 *
 * It does NOT produce buy/sell commands, does NOT auto-trade, and does NOT
 * replace investment judgement. Precise price zones are only valid when
 * priceVerified === true. V24 is spec-only.
 *
 * NOTE: V24 only defines the Holding Defense Plan DATA CONTRACT and semantics;
 * it does NOT build a Holding Defense Tracker API. The real Holding Defense
 * Tracker API Contract is deferred to V27.
 *
 * See: docs/position-strategy-plan-spec.md
 * See: docs/technical-risk-reward-strategy-spec.md
 * See: docs/war-room-read-model-contract.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type PositionStrategyPlanType =
  | 'ENTRY_OBSERVATION'
  | 'HOLDING_DEFENSE'
  | 'PROFIT_PROTECTION'
  | 'RISK_REDUCTION'
  | 'NO_TOUCH'
  | 'DATA_INSUFFICIENT';

export type PositionStrategyDataQualityStatus =
  | 'PASS'
  | 'WARNING'
  | 'FAIL'
  | 'DATA_INSUFFICIENT'
  | 'PRICE_NOT_VERIFIED'
  | 'SOURCE_CONFLICT'
  | 'STALE_DATA';

export type PositionStrategySourceMode =
  | 'spec_only'
  | 'fixture'
  | 'runtime'
  | 'fallback';

export type PriceVerificationStatus =
  | 'VERIFIED'
  | 'NOT_VERIFIED'
  | 'STALE'
  | 'SOURCE_CONFLICT'
  | 'FALLBACK_ONLY'
  | 'NOT_COVERED';

export type PositionStrategyRiskRewardGrade =
  | 'A_PLUS'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'DATA_INSUFFICIENT';

export type HoldingState =
  | 'NOT_HELD'
  | 'HELD_PROFIT'
  | 'HELD_NEAR_COST'
  | 'HELD_LOSS'
  | 'DEFENSE_ACTIVE'
  | 'PROFIT_PROTECTION_ACTIVE'
  | 'RISK_REDUCTION_ACTIVE'
  | 'DATA_INSUFFICIENT';

export type HoldingActionState =
  | '續抱觀察'
  | '獲利保護觀察'
  | '風險降低觀察'
  | '危險觀察'
  | '資料不足';

// ---------------------------------------------------------------------------
// Price zone
// ---------------------------------------------------------------------------

/**
 * A conditional price observation zone. `low`/`high` are only meaningful when
 * `priceVerified === true` and `isPrecisePriceAllowed === true`. When price is
 * not verified, the numeric bounds must be null and only the conditional
 * `zoneLabel` / `safetyLabel` may be shown.
 *
 * A zone is NEVER a trade price. The `safetyLabel` must encode the negation,
 * e.g. "進場觀察區不是買進價" / "策略失效觀察價不是自動停損價" /
 * "觀察目標區不是目標價" / "出場觀察區不是賣出價" / "takeProfitZone 不是賣出價".
 */
export interface PriceZone {
  zoneLabel: string;
  low: number | null;
  high: number | null;
  priceVerified: boolean;
  priceVerificationStatus: PriceVerificationStatus;
  priceSource: string | null;
  priceCheckedAt: string | null;
  isPrecisePriceAllowed: boolean;
  safetyLabel: string;
}

// ---------------------------------------------------------------------------
// Position Strategy Plan
// ---------------------------------------------------------------------------

/**
 * A single conditional strategy observation plan for one stock. Every price
 * field is a PriceZone observation, never a trade instruction. The three
 * literal-false flags are permanent read-model invariants: the plan never
 * requests, connects, or writes. `highConfidenceConclusionAllowed` may only be
 * true when data quality is PASS and price is verified.
 */
export interface PositionStrategyPlan {
  planId: string;
  stockId: string;
  stockName: string;
  planType: PositionStrategyPlanType;
  sourceMode: PositionStrategySourceMode;
  dataQualityStatus: PositionStrategyDataQualityStatus;
  priceVerificationStatus: PriceVerificationStatus;
  priceVerified: boolean;
  priceSource: string | null;
  priceCheckedAt: string | null;

  currentPrice: number | null;
  costBasis: number | null;
  unrealizedProfitLossPercent: number | null;

  entryObservationZone: PriceZone | null;
  confirmationCondition: string | null;
  entryTriggerCondition: string | null;
  noChaseZone: PriceZone | null;

  defenseZone: PriceZone | null;
  invalidLevel: PriceZone | null;
  profitProtectionZone: PriceZone | null;
  takeProfitZone: PriceZone | null;
  riskReduceZone: PriceZone | null;
  exitObservationZone: PriceZone | null;
  targetObservationZone: PriceZone | null;

  riskRewardRatio: number | null;
  riskRewardGrade: PositionStrategyRiskRewardGrade;

  holdingState: HoldingState;
  holdingActionState: HoldingActionState | null;
  holdingImpact: string | null;

  trendState: string | null;
  trendBreakWarning: string | null;
  shortAttackRisk: string | null;
  supportBreakStatus: string | null;
  maBreakStatus: string | null;
  volumeBreakdownStatus: string | null;
  intradayAlertLevel: string | null;
  marketStatus: string | null;
  sectorStatus: string | null;

  riskReduceObservation: string | null;
  waitForReclaimCondition: string | null;
  trendInvalidationReason: string | null;
  noTouchReason: string | null;
  noTouchDurationHint: string | null;
  requiredRecoveryCondition: string | null;

  unavailableReason: string | null;
  missingDataFields: string[];
  requiredVerification: string[];

  setupTags: string[];
  warnings: string[];
  observationSummary: string;

  notEntrySignal: boolean;
  notExitSignal: boolean;
  notTradeAdvice: boolean;
  highConfidenceConclusionAllowed: boolean;

  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

/**
 * A bundle of plans, partitioned by plan type for read-model convenience. The
 * three literal-false flags are permanent read-model invariants.
 */
export interface PositionStrategyPlanBundle {
  generatedAt: string;
  sourceMode: PositionStrategySourceMode;
  contractVersion: 'V24';
  plans: PositionStrategyPlan[];
  entryObservationPlans: PositionStrategyPlan[];
  holdingDefensePlans: PositionStrategyPlan[];
  profitProtectionPlans: PositionStrategyPlan[];
  riskReductionPlans: PositionStrategyPlan[];
  noTouchPlans: PositionStrategyPlan[];
  dataInsufficientPlans: PositionStrategyPlan[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const POSITION_STRATEGY_CONTRACT_VERSION = 'V24' as const;

/**
 * Canonical safety labels. Every Position Strategy Plan surface (engine, future
 * fixtures, future UI) must keep these negations intact. Each line encodes that
 * an observation zone is NEVER a trade price / command.
 */
export const POSITION_STRATEGY_SAFETY_LABELS = [
  '不自動下單',
  '不產生買賣指令',
  '不替代投資判斷',
  '進場觀察區不是買進價',
  '策略失效觀察價不是自動停損價',
  '觀察目標區不是目標價',
  '出場觀察區不是賣出價',
  'takeProfitZone 不是賣出價',
  '風險降低觀察不是賣出指令',
  '禁碰不是放空建議',
  'No Touch 是風控提醒，不是賣出指令',
  '資料不足就顯示資料不足',
  'priceVerified = false 時不得輸出精準價位',
  'fallback-only data 不得觸發 DANGER',
  'stale data 不得觸發 DANGER',
] as const;

/**
 * The six allowed plan types. Anything outside this list is invalid.
 */
export const POSITION_STRATEGY_ALLOWED_PLAN_TYPES: readonly PositionStrategyPlanType[] = [
  'ENTRY_OBSERVATION',
  'HOLDING_DEFENSE',
  'PROFIT_PROTECTION',
  'RISK_REDUCTION',
  'NO_TOUCH',
  'DATA_INSUFFICIENT',
] as const;

/**
 * Imperative trade-command phrases that must NEVER be emitted by any Position
 * Strategy Plan surface. Note: 「買進價 / 賣出價 / 停損價 / 目標價」are deliberately
 * NOT listed here because the safety language uses them only inside negations
 * (e.g. 「不是買進價」/「不是目標價」). Only standalone action commands are banned.
 */
export const POSITION_STRATEGY_DISALLOWED_TERMS = [
  '強力買進',
  '必買',
  '必賣',
  '立即進場',
  '立即出場',
  '自動下單',
  '掛單買進',
  '掛單賣出',
] as const;
