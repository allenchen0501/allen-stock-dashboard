/**
 * Runtime Data Pipeline Contract — V28
 *
 * Read-model TypeScript contract for the future Runtime Data Pipeline
 * governance layer. This file contains TYPES + a few static safety CONSTANTS
 * ONLY. It declares no runtime, performs no fetch, imports no Supabase client,
 * reads no environment keys, builds no data-source adapter, calls Date.now on
 * nothing, and writes no data.
 *
 * Although the name contains "Runtime", V28 is spec-only / contract-only: it
 * only describes the governance shape (source priority, price verification,
 * freshness guard, source-conflict guard, data-quality gate, consumer rules,
 * pilot-readiness checklist, production-write guard) that a future runtime must
 * satisfy BEFORE any real data is ingested. It does NOT connect to any source.
 *
 * Source governance uses GENERIC categories only (OFFICIAL_OR_LICENSED /
 * VALIDATED_SECONDARY / …). Concrete source names (TWSE / TPEx / Yahoo /
 * FinMind / TradingView / yfinance-like) live in the docs as governance notes,
 * never in this contract.
 *
 * See: docs/runtime-data-pipeline-spec.md
 * See: docs/dynamic-opportunity-price-verification-spec.md
 * See: docs/holding-defense-tracker-api-contract.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type RuntimeSourcePriority =
  | "OFFICIAL_OR_LICENSED"
  | "BROKER_OR_AUTHORIZED"
  | "VALIDATED_SECONDARY"
  | "FALLBACK_CACHE"
  | "MANUAL_VERIFIED"
  | "NOT_AVAILABLE";

export type RuntimePipelineStage =
  | "SOURCE_DISCOVERY"
  | "SOURCE_AUTHORIZATION_CHECK"
  | "RAW_INGESTION"
  | "NORMALIZATION"
  | "PRICE_VERIFICATION"
  | "FRESHNESS_CHECK"
  | "SOURCE_CONFLICT_CHECK"
  | "DATA_QUALITY_GATE"
  | "READ_MODEL_PROJECTION"
  | "CONSUMER_DELIVERY"
  | "PRODUCTION_WRITE_BLOCKED";

export type RuntimePriceVerificationStatus =
  | "VERIFIED"
  | "NOT_VERIFIED"
  | "STALE"
  | "SOURCE_CONFLICT"
  | "FALLBACK_ONLY"
  | "NOT_COVERED";

export type RuntimeFreshnessStatus =
  | "FRESH"
  | "DELAYED"
  | "STALE"
  | "SESSION_MISMATCH"
  | "UNKNOWN";

export type RuntimeSourceConflictStatus =
  | "NO_CONFLICT"
  | "MINOR_DIFFERENCE"
  | "MAJOR_CONFLICT"
  | "SESSION_MISMATCH"
  | "SOURCE_UNAVAILABLE"
  | "DATA_INSUFFICIENT";

export type RuntimeDataQualityStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "DATA_INSUFFICIENT"
  | "PRICE_NOT_VERIFIED"
  | "SOURCE_CONFLICT"
  | "STALE_DATA"
  | "FALLBACK_ONLY"
  | "NOT_COVERED";

export type RuntimeSourceConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "CONFLICTED"
  | "INSUFFICIENT";

export type RuntimeConsumerType =
  | "POSITION_STRATEGY_PLAN"
  | "DYNAMIC_OPPORTUNITY_POOL"
  | "HOLDING_DEFENSE_TRACKER"
  | "WAR_ROOM"
  | "DASHBOARD_UI"
  | "ALERT_SYSTEM";

export type RuntimePilotReadinessStatus =
  | "READY_FOR_SPEC_REVIEW"
  | "BLOCKED_BY_SOURCE_AUTHORIZATION"
  | "BLOCKED_BY_STALE_GUARD"
  | "BLOCKED_BY_CONFLICT_GUARD"
  | "BLOCKED_BY_WRITE_GUARD"
  | "BLOCKED_BY_SAFETY_GATE"
  | "DATA_INSUFFICIENT";

// ---------------------------------------------------------------------------
// Source policy
// ---------------------------------------------------------------------------

/**
 * Per-source governance policy. A validated-secondary / fallback-only source can
 * never produce a high-confidence conclusion and can never trigger a DANGER
 * alert; only official / licensed / authorized sources may.
 */
export interface RuntimeSourcePolicy {
  sourcePriority: RuntimeSourcePriority;
  sourceCategoryLabel: string;
  isOfficialOrLicensed: boolean;
  isAuthorizedProvider: boolean;
  isValidatedSecondary: boolean;
  isFallbackOnly: boolean;
  isManualVerified: boolean;
  canProduceHighConfidenceConclusion: boolean;
  canTriggerDangerAlert: boolean;
  canAllowPrecisePrice: boolean;
  requiresDowngrade: boolean;
  downgradeReason: string | null;
}

// ---------------------------------------------------------------------------
// Price verification snapshot
// ---------------------------------------------------------------------------

/**
 * The output of the future PRICE_VERIFICATION + FRESHNESS_CHECK +
 * SOURCE_CONFLICT_CHECK stages for one stock. When `priceVerified === false`,
 * `isPrecisePriceAllowed` / `riskRewardCalculationAllowed` /
 * `highConfidenceConclusionAllowed` must all be false, and stale / fallback-only
 * / source-conflict data must never set `dangerAlertAllowed`. The three
 * literal-false flags are permanent read-only invariants.
 */
export interface RuntimePriceVerificationSnapshot {
  stockId: string;
  stockName: string;
  market: string | null;

  priceVerified: boolean;
  priceVerificationStatus: RuntimePriceVerificationStatus;
  sourcePriority: RuntimeSourcePriority;
  freshnessStatus: RuntimeFreshnessStatus;
  sourceConflictStatus: RuntimeSourceConflictStatus;
  dataQualityStatus: RuntimeDataQualityStatus;
  sourceConfidence: RuntimeSourceConfidence;

  sourceTimestamp: string | null;
  priceCheckedAt: string | null;
  checkedAt: string | null;

  currentPrice: number | null;
  previousClose: number | null;
  bidPrice: number | null;
  askPrice: number | null;
  lastPrice: number | null;

  isPrecisePriceAllowed: boolean;
  riskRewardCalculationAllowed: boolean;
  dangerAlertAllowed: boolean;
  highConfidenceConclusionAllowed: boolean;

  staleReason: string | null;
  sourceConflictReason: string | null;
  fallbackReason: string | null;
  downgradeReason: string | null;
  missingDataFields: string[];
  requiredVerification: string[];

  notTradeAdvice: boolean;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Pipeline guard result
// ---------------------------------------------------------------------------

/**
 * The result of running one pipeline stage's guard. `productionWriteAllowed` is
 * a literal false in V28 — production writes are blocked until an explicit
 * future gate. The three literal-false flags are permanent read-only invariants.
 */
export interface RuntimePipelineGuardResult {
  stage: RuntimePipelineStage;
  status: RuntimeDataQualityStatus;
  passed: boolean;
  blockingReason: string | null;
  warnings: string[];
  nextRequiredAction: string | null;

  requestAllowed: boolean;
  productionWriteAllowed: false;
  dangerAlertAllowed: boolean;
  precisePriceAllowed: boolean;
  highConfidenceConclusionAllowed: boolean;

  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Consumer delivery rule
// ---------------------------------------------------------------------------

export interface RuntimeConsumerDeliveryRule {
  consumerType: RuntimeConsumerType;
  requiresPriceVerified: boolean;
  requiresFreshData: boolean;
  blocksFallbackOnlyDanger: boolean;
  blocksStaleDanger: boolean;
  blocksSourceConflictDanger: boolean;
  allowsPrecisePriceOnlyWhenVerified: boolean;
  requiresNotTradeAdvice: boolean;
}

// ---------------------------------------------------------------------------
// Pilot readiness checklist
// ---------------------------------------------------------------------------

export interface RuntimePilotReadinessChecklist {
  readinessStatus: RuntimePilotReadinessStatus;
  sourceLegalStatusReviewed: boolean;
  sourceAuthorizationReviewed: boolean;
  rateLimitPolicyReviewed: boolean;
  marketSessionHandlingDefined: boolean;
  timestampNormalizationDefined: boolean;
  staleGuardDefined: boolean;
  sourceConflictThresholdDefined: boolean;
  fallbackDowngradeDefined: boolean;
  dataQualityGateDefined: boolean;
  noWriteModeDefined: boolean;
  auditLogShapeDefined: boolean;
  rollbackPlanDefined: boolean;
  killSwitchDefined: boolean;
  buySellCommandGenerationBlocked: boolean;
  notTradeAdviceAlwaysTrue: boolean;
}

// ---------------------------------------------------------------------------
// Contract bundle
// ---------------------------------------------------------------------------

export interface RuntimeDataPipelineContractBundle {
  contractVersion: "V28";
  sourceMode: "spec_only";
  pipelineStages: RuntimePipelineStage[];
  sourcePriorities: RuntimeSourcePriority[];
  dataQualityStatuses: RuntimeDataQualityStatus[];
  priceVerificationStatuses: RuntimePriceVerificationStatus[];
  freshnessStatuses: RuntimeFreshnessStatus[];
  sourceConflictStatuses: RuntimeSourceConflictStatus[];
  consumerDeliveryRules: RuntimeConsumerDeliveryRule[];
  pilotReadinessChecklist: RuntimePilotReadinessChecklist;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const RUNTIME_DATA_PIPELINE_CONTRACT_VERSION = "V28" as const;

/**
 * The eleven allowed pipeline stages, in order.
 */
export const RUNTIME_DATA_PIPELINE_ALLOWED_STAGES: readonly RuntimePipelineStage[] = [
  "SOURCE_DISCOVERY",
  "SOURCE_AUTHORIZATION_CHECK",
  "RAW_INGESTION",
  "NORMALIZATION",
  "PRICE_VERIFICATION",
  "FRESHNESS_CHECK",
  "SOURCE_CONFLICT_CHECK",
  "DATA_QUALITY_GATE",
  "READ_MODEL_PROJECTION",
  "CONSUMER_DELIVERY",
  "PRODUCTION_WRITE_BLOCKED",
] as const;

/**
 * Source priority, highest authority first. Official / licensed feeds rank above
 * any validated secondary source; a secondary source alone may never produce a
 * high-confidence conclusion, and fallback-only data may never trigger DANGER.
 */
export const RUNTIME_DATA_PIPELINE_SOURCE_PRIORITY: readonly RuntimeSourcePriority[] = [
  "OFFICIAL_OR_LICENSED",
  "BROKER_OR_AUTHORIZED",
  "VALIDATED_SECONDARY",
  "FALLBACK_CACHE",
  "MANUAL_VERIFIED",
  "NOT_AVAILABLE",
] as const;

/**
 * The nine data-quality statuses recognised by the gate.
 */
export const RUNTIME_DATA_PIPELINE_DATA_QUALITY_STATUSES: readonly RuntimeDataQualityStatus[] = [
  "PASS",
  "WARNING",
  "FAIL",
  "DATA_INSUFFICIENT",
  "PRICE_NOT_VERIFIED",
  "SOURCE_CONFLICT",
  "STALE_DATA",
  "FALLBACK_ONLY",
  "NOT_COVERED",
] as const;

/**
 * Canonical safety labels. Every Runtime Data Pipeline surface must keep these
 * negations intact.
 */
export const RUNTIME_DATA_PIPELINE_SAFETY_LABELS = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "Runtime Data Pipeline 不是自動交易系統",
  "V28 不接真資料",
  "V28 不建立 runtime",
  "V28 不寫資料",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 時降級為 WARNING / DATA_INSUFFICIENT",
  "資料不足就顯示資料不足",
  "highConfidenceConclusionAllowed 受資料品質控制",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any Runtime Data Pipeline surface. Spec vocabulary such as runtime / request /
 * source / official / broker / secondary is deliberately NOT banned.
 */
export const RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
