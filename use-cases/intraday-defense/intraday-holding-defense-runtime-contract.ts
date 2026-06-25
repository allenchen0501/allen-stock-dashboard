/**
 * Intraday Holding Defense Runtime Contract — V30
 *
 * Read-model TypeScript contract for the FUTURE intraday holding-defense runtime
 * governance layer. This file contains TYPES + a few static safety CONSTANTS
 * ONLY. It declares no runtime, performs no fetch, imports no Supabase client,
 * reads no environment keys, runs no quote polling / scheduler / webhook /
 * crawler / broker connector, calls Date.now on nothing, and writes no data.
 *
 * Although the name contains "Runtime", V30 is spec-only / contract-only: it
 * only describes the alert states, trigger rules, cooldown / dedup policy,
 * data-quality downgrade rules, no-DANGER guards and pilot-readiness checklist
 * that a future intraday defense runtime must satisfy. It does NOT connect to
 * any source and does NOT produce buy/sell commands.
 *
 * Concrete source names (TWSE / TPEx / Yahoo / FinMind / TradingView /
 * yfinance-like) live in the docs as governance notes, never in this contract —
 * source governance is expressed via the generic runtime-data categories.
 *
 * See: docs/intraday-holding-defense-runtime-spec.md
 * See: docs/runtime-data-pipeline-spec.md
 * See: docs/holding-defense-tracker-api-contract.md
 */

import type {
  HoldingActionState,
  HoldingState,
  PositionStrategyDataQualityStatus,
  PriceVerificationStatus,
  PriceZone,
} from "../position-strategy/position-strategy-plan-contract";

import type {
  RuntimeFreshnessStatus,
  RuntimeSourceConflictStatus,
  RuntimeSourcePriority,
} from "../runtime-data/runtime-data-pipeline-contract";

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type IntradayHoldingDefenseState =
  | "INTRADAY_NORMAL"
  | "DEFENSE_ZONE_APPROACHING"
  | "DEFENSE_ZONE_BREACHED"
  | "INVALID_LEVEL_APPROACHING"
  | "INVALID_LEVEL_BREACHED"
  | "PROFIT_GIVEBACK_WARNING"
  | "RISK_REDUCTION_WATCH"
  | "FAST_DROP_WARNING"
  | "TREND_BREAK_WARNING"
  | "PRICE_NOT_VERIFIED"
  | "STALE_DATA"
  | "SOURCE_CONFLICT"
  | "FALLBACK_ONLY"
  | "DATA_INSUFFICIENT";

export type IntradayHoldingDefenseAlertLevel =
  | "INFO"
  | "WATCH"
  | "WARNING"
  | "DANGER"
  | "DATA_INSUFFICIENT";

export type IntradayHoldingDefenseRuntimeMode =
  | "spec_only"
  | "dry_run"
  | "runtime"
  | "disabled";

export type IntradayHoldingDefenseTriggerType =
  | "DEFENSE_ZONE_APPROACH"
  | "DEFENSE_ZONE_BREACH"
  | "INVALID_LEVEL_APPROACH"
  | "INVALID_LEVEL_BREACH"
  | "PROFIT_GIVEBACK"
  | "FAST_DROP"
  | "TREND_BREAK"
  | "DATA_QUALITY_DOWNGRADE"
  | "RECOVERY_CONDITION";

// ---------------------------------------------------------------------------
// Cooldown / dedup
// ---------------------------------------------------------------------------

export interface IntradayHoldingDefenseCooldownPolicy {
  cooldownEnabled: boolean;
  defaultCooldownSeconds: number;
  dangerCooldownSeconds: number;
  warningCooldownSeconds: number;
  watchCooldownSeconds: number;
  dedupEnabled: boolean;
  dedupWindowSeconds: number;
}

export interface IntradayHoldingDefenseDedupRecord {
  dedupKey: string;
  duplicateSuppressed: boolean;
  cooldownRemainingSeconds: number | null;
  lastAlertState: IntradayHoldingDefenseState | null;
  nextAllowedAlertAt: string | null;
}

// ---------------------------------------------------------------------------
// Trigger rule
// ---------------------------------------------------------------------------

/**
 * Governs one trigger type. A trigger may only escalate to DANGER when price is
 * verified, fresh, and not in source-conflict; the three `blocksDangerWhen…`
 * flags encode that fallback-only / stale / source-conflict data must never
 * reach DANGER.
 */
export interface IntradayHoldingDefenseTriggerRule {
  triggerType: IntradayHoldingDefenseTriggerType;
  requiredPriceVerified: boolean;
  requiredFreshness: RuntimeFreshnessStatus[];
  allowedSourceConflictStatuses: RuntimeSourceConflictStatus[];
  blocksDangerWhenFallbackOnly: boolean;
  blocksDangerWhenStale: boolean;
  blocksDangerWhenSourceConflict: boolean;
  blocksPrecisePriceWhenNotVerified: boolean;
  requiresNotTradeAdvice: boolean;
}

// ---------------------------------------------------------------------------
// Alert item
// ---------------------------------------------------------------------------

/**
 * One intraday holding-defense alert. Every price field is a PriceZone
 * observation, never a trade instruction. When `priceVerified === false`, all
 * precise zones must be null, `alertLevel` must not be DANGER, and
 * `highConfidenceConclusionAllowed` must be false. The three literal-false flags
 * are permanent read-only invariants.
 */
export interface IntradayHoldingDefenseAlertItem {
  alertId: string;
  stockId: string;
  stockName: string;

  runtimeMode: IntradayHoldingDefenseRuntimeMode;
  intradayState: IntradayHoldingDefenseState;
  alertLevel: IntradayHoldingDefenseAlertLevel;
  triggerType: IntradayHoldingDefenseTriggerType;

  trackerState: string | null;
  holdingState: HoldingState;
  holdingActionState: HoldingActionState | null;

  priceVerified: boolean;
  priceVerificationStatus: PriceVerificationStatus;
  freshnessStatus: RuntimeFreshnessStatus;
  sourceConflictStatus: RuntimeSourceConflictStatus;
  dataQualityStatus: PositionStrategyDataQualityStatus;
  sourcePriority: RuntimeSourcePriority;

  currentPrice: number | null;
  intradayHigh: number | null;
  intradayLow: number | null;
  previousClose: number | null;
  volumeRatio: number | null;
  drawdownFromPeakPercent: number | null;

  defenseZone: PriceZone | null;
  invalidLevel: PriceZone | null;
  profitProtectionZone: PriceZone | null;
  takeProfitZone: PriceZone | null;
  riskReduceZone: PriceZone | null;
  exitObservationZone: PriceZone | null;

  holdingImpact: string | null;
  trendBreakWarning: string | null;
  shortAttackRisk: string | null;
  riskReduceObservation: string | null;
  waitForReclaimCondition: string | null;
  recoveryCondition: string | null;
  nextObservation: string | null;

  dedup: IntradayHoldingDefenseDedupRecord;

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
// Runtime readiness checklist
// ---------------------------------------------------------------------------

export interface IntradayHoldingDefenseRuntimeReadinessChecklist {
  sourceAuthorizationReviewed: boolean;
  rateLimitReviewed: boolean;
  marketSessionHandlingDefined: boolean;
  timestampNormalizationDefined: boolean;
  priceFreshnessWindowDefined: boolean;
  sourceConflictThresholdDefined: boolean;
  fallbackDowngradeDefined: boolean;
  noDangerGuardDefined: boolean;
  cooldownWindowDefined: boolean;
  dedupStorageStrategyDefined: boolean;
  dryRunModeDefined: boolean;
  noWriteGuardDefined: boolean;
  auditLogShapeDefined: boolean;
  killSwitchDefined: boolean;
  rollbackPlanDefined: boolean;
  notTradeAdviceAlwaysTrue: boolean;
  buySellCommandGenerationBlocked: boolean;
}

// ---------------------------------------------------------------------------
// Spec bundle
// ---------------------------------------------------------------------------

export interface IntradayHoldingDefenseRuntimeSpecBundle {
  contractVersion: "V30";
  runtimeMode: "spec_only";
  states: IntradayHoldingDefenseState[];
  alertLevels: IntradayHoldingDefenseAlertLevel[];
  triggerRules: IntradayHoldingDefenseTriggerRule[];
  cooldownPolicy: IntradayHoldingDefenseCooldownPolicy;
  runtimeReadinessChecklist: IntradayHoldingDefenseRuntimeReadinessChecklist;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const INTRADAY_HOLDING_DEFENSE_CONTRACT_VERSION = "V30" as const;

/**
 * The fourteen allowed intraday defense states.
 */
export const INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES: readonly IntradayHoldingDefenseState[] = [
  "INTRADAY_NORMAL",
  "DEFENSE_ZONE_APPROACHING",
  "DEFENSE_ZONE_BREACHED",
  "INVALID_LEVEL_APPROACHING",
  "INVALID_LEVEL_BREACHED",
  "PROFIT_GIVEBACK_WARNING",
  "RISK_REDUCTION_WATCH",
  "FAST_DROP_WARNING",
  "TREND_BREAK_WARNING",
  "PRICE_NOT_VERIFIED",
  "STALE_DATA",
  "SOURCE_CONFLICT",
  "FALLBACK_ONLY",
  "DATA_INSUFFICIENT",
] as const;

/**
 * The five allowed alert levels. DANGER is only valid on verified / fresh /
 * no-source-conflict data.
 */
export const INTRADAY_HOLDING_DEFENSE_ALLOWED_ALERT_LEVELS: readonly IntradayHoldingDefenseAlertLevel[] = [
  "INFO",
  "WATCH",
  "WARNING",
  "DANGER",
  "DATA_INSUFFICIENT",
] as const;

/**
 * The nine trigger types.
 */
export const INTRADAY_HOLDING_DEFENSE_TRIGGER_TYPES: readonly IntradayHoldingDefenseTriggerType[] = [
  "DEFENSE_ZONE_APPROACH",
  "DEFENSE_ZONE_BREACH",
  "INVALID_LEVEL_APPROACH",
  "INVALID_LEVEL_BREACH",
  "PROFIT_GIVEBACK",
  "FAST_DROP",
  "TREND_BREAK",
  "DATA_QUALITY_DOWNGRADE",
  "RECOVERY_CONDITION",
] as const;

/**
 * Canonical safety labels. Every intraday defense surface must keep these
 * negations intact.
 */
export const INTRADAY_HOLDING_DEFENSE_SAFETY_LABELS = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "Intraday Holding Defense Runtime 不是自動交易系統",
  "V30 不接真資料",
  "V30 不建立 runtime",
  "V30 不寫資料",
  "防守區是防守觀察，不是自動出場",
  "invalidLevel 不是自動停損價",
  "takeProfitZone 不是賣出價",
  "風險降低觀察不是賣出指令",
  "FAST_DROP_WARNING 不是賣出指令",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-stop / guarantee phrases that must NEVER be
 * emitted by any intraday defense surface. Spec vocabulary such as runtime /
 * intraday / defense / source / alert is deliberately NOT banned.
 */
export const INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動停損",
] as const;
