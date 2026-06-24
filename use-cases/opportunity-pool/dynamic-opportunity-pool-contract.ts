/**
 * Dynamic Opportunity Pool & Price Verification Contract — V25
 *
 * Read-model TypeScript contract for the Dynamic Opportunity Pool and the Price
 * Verification layer. This file contains TYPES + a few static safety CONSTANTS
 * ONLY. It declares no runtime, performs no fetch, imports no Supabase client,
 * reads no environment keys, runs no scanner, runs no price-verification
 * runtime, calls Date.now on nothing, and writes no data.
 *
 * The Dynamic Opportunity Pool tracks CONDITIONS, not a fixed list of stocks. It
 * classifies each candidate into a pool + processing tier, records how/whether
 * its price was verified, and gates whether precise observation zones may be
 * emitted. It does NOT produce buy/sell commands, does NOT auto-trade, does NOT
 * guarantee profit, and does NOT replace investment judgement.
 *
 * Precise price zones are only allowed when priceVerified === true. When price
 * is not verified, stale, conflicted, fallback-only or not covered, the item
 * must downgrade and may only emit directional / conditional analysis.
 *
 * V25 is spec-only / contract-only.
 *
 * See: docs/dynamic-opportunity-price-verification-spec.md
 * See: docs/position-strategy-plan-spec.md
 * See: docs/technical-risk-reward-strategy-spec.md
 * See: docs/war-room-read-model-contract.md
 */

// ---------------------------------------------------------------------------
// Pool + tier enumerations
// ---------------------------------------------------------------------------

export type DynamicOpportunityPoolType =
  | 'MAIN_UPTREND_POOL'
  | 'BREAKOUT_PREP_POOL'
  | 'HOLDING_PRIORITY_POOL'
  | 'DAILY_WATCH_POOL'
  | 'LOW_COVERAGE_POOL'
  | 'NO_TOUCH_POOL'
  | 'SECTOR_ROTATION_POOL'
  | 'DATA_INSUFFICIENT_POOL';

export type OpportunityProcessingTier =
  | 'A_MAIN_UPTREND'
  | 'B_HOLDING_PRIORITY'
  | 'C_DAILY_WATCH'
  | 'D_LOW_COVERAGE'
  | 'NO_TOUCH'
  | 'DATA_INSUFFICIENT';

export type OpportunityDataQualityStatus =
  | 'PASS'
  | 'WARNING'
  | 'FAIL'
  | 'DATA_INSUFFICIENT'
  | 'PRICE_NOT_VERIFIED'
  | 'SOURCE_CONFLICT'
  | 'STALE_DATA'
  | 'NOT_COVERED'
  | 'FALLBACK_ONLY';

// ---------------------------------------------------------------------------
// Price verification enumerations
// ---------------------------------------------------------------------------

export type OpportunityPriceVerificationStatus =
  | 'VERIFIED'
  | 'NOT_VERIFIED'
  | 'STALE'
  | 'SOURCE_CONFLICT'
  | 'FALLBACK_ONLY'
  | 'NOT_COVERED';

export type PriceSourcePriority =
  | 'OFFICIAL_OR_LICENSED'
  | 'BROKER_OR_AUTHORIZED'
  | 'VALIDATED_SECONDARY'
  | 'FALLBACK_CACHE'
  | 'MANUAL_VERIFIED'
  | 'NOT_AVAILABLE';

export type PriceFreshnessStatus =
  | 'FRESH'
  | 'DELAYED'
  | 'STALE'
  | 'SESSION_MISMATCH'
  | 'UNKNOWN';

export type SourceConfidenceLevel =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'CONFLICTED'
  | 'INSUFFICIENT';

export type SectorRotationStatus =
  | 'LEADING'
  | 'IMPROVING'
  | 'NEUTRAL'
  | 'WEAKENING'
  | 'DATA_INSUFFICIENT';

// ---------------------------------------------------------------------------
// Price verification record
// ---------------------------------------------------------------------------

/**
 * A single price-verification result for one stock. `isPrecisePriceAllowed` is
 * only true when `priceVerified === true` and freshness / source confidence are
 * acceptable. Stale / conflict / fallback-only data must NEVER trigger DANGER.
 * The three literal-false flags are permanent read-only invariants.
 */
export interface PriceVerificationRecord {
  stockId: string;
  stockName: string;
  priceVerified: boolean;
  priceVerificationStatus: OpportunityPriceVerificationStatus;
  priceSourcePriority: PriceSourcePriority;
  priceSourceName: string | null;
  priceCheckedAt: string | null;
  priceFreshness: PriceFreshnessStatus;
  sourceConfidence: SourceConfidenceLevel;
  isPrecisePriceAllowed: boolean;
  sourceConflictReason: string | null;
  staleReason: string | null;
  fallbackReason: string | null;
  warningReasons: string[];
  missingDataFields: string[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Dynamic opportunity pool item
// ---------------------------------------------------------------------------

/**
 * One classified candidate in a dynamic opportunity pool. When
 * `priceVerified === false`, every precise-zone gate (entryObservationZoneAllowed
 * / invalidLevelAllowed / targetObservationZoneAllowed / riskRewardCalculationAllowed)
 * must be false and the corresponding Position Strategy Plan zones must be null.
 * The three literal-false flags are permanent read-only invariants.
 */
export interface DynamicOpportunityPoolItem {
  itemId: string;
  stockId: string;
  stockName: string;
  poolType: DynamicOpportunityPoolType;
  processingTier: OpportunityProcessingTier;
  dataQualityStatus: OpportunityDataQualityStatus;

  priceVerified: boolean;
  priceVerificationStatus: OpportunityPriceVerificationStatus;
  priceSourcePriority: PriceSourcePriority;
  priceSourceName: string | null;
  priceCheckedAt: string | null;
  priceFreshness: PriceFreshnessStatus;
  sourceConfidence: SourceConfidenceLevel;
  isPrecisePriceAllowed: boolean;

  screeningScore: number | null;
  fundamentalScore: number | null;
  technicalScore: number | null;
  chipScore: number | null;
  riskRewardScore: number | null;
  sectorScore: number | null;

  revenueMomentumStatus: string | null;
  institutionalFlowStatus: string | null;
  technicalSetupStatus: string | null;
  riskRewardRatio: number | null;
  sectorName: string | null;
  sectorRotationStatus: SectorRotationStatus | null;

  entryObservationZoneAllowed: boolean;
  invalidLevelAllowed: boolean;
  targetObservationZoneAllowed: boolean;
  riskRewardCalculationAllowed: boolean;

  screeningReasons: string[];
  warningReasons: string[];
  missingDataFields: string[];
  requiredVerification: string[];

  notEntrySignal: boolean;
  notExitSignal: boolean;
  notTradeAdvice: boolean;
  highConfidenceConclusionAllowed: boolean;

  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Sector rotation pool item
// ---------------------------------------------------------------------------

/**
 * One sector in the sector-rotation pool. A strong sector still requires
 * per-stock price verification and risk/reward confirmation — it is never a buy
 * list.
 */
export interface SectorRotationPoolItem {
  sectorName: string;
  sectorStatus: SectorRotationStatus;
  rotationStrength: number | null;
  leadingStocks: string[];
  riskWarnings: string[];
  dataQualityStatus: OpportunityDataQualityStatus;
  notTradeAdvice: boolean;
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

/**
 * A read-only bundle of all dynamic pools plus the price-verification records.
 * The three literal-false flags are permanent read-only invariants.
 */
export interface DynamicOpportunityPoolBundle {
  generatedAt: string;
  contractVersion: 'V25';
  sourceMode: 'spec_only';
  mainUptrendPool: DynamicOpportunityPoolItem[];
  breakoutPrepPool: DynamicOpportunityPoolItem[];
  holdingPriorityPool: DynamicOpportunityPoolItem[];
  dailyWatchPool: DynamicOpportunityPoolItem[];
  lowCoveragePool: DynamicOpportunityPoolItem[];
  noTouchPool: DynamicOpportunityPoolItem[];
  dataInsufficientPool: DynamicOpportunityPoolItem[];
  sectorRotationPool: SectorRotationPoolItem[];
  priceVerificationRecords: PriceVerificationRecord[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const DYNAMIC_OPPORTUNITY_CONTRACT_VERSION = 'V25' as const;

/**
 * The eight allowed dynamic pool types. Anything outside this list is invalid.
 */
export const DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES: readonly DynamicOpportunityPoolType[] = [
  'MAIN_UPTREND_POOL',
  'BREAKOUT_PREP_POOL',
  'HOLDING_PRIORITY_POOL',
  'DAILY_WATCH_POOL',
  'LOW_COVERAGE_POOL',
  'NO_TOUCH_POOL',
  'SECTOR_ROTATION_POOL',
  'DATA_INSUFFICIENT_POOL',
] as const;

/**
 * The six allowed processing tiers (A/B/C/D + the two special cases).
 */
export const DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS: readonly OpportunityProcessingTier[] = [
  'A_MAIN_UPTREND',
  'B_HOLDING_PRIORITY',
  'C_DAILY_WATCH',
  'D_LOW_COVERAGE',
  'NO_TOUCH',
  'DATA_INSUFFICIENT',
] as const;

/**
 * Price source priority, highest authority first. Official / licensed feeds rank
 * above any validated secondary source; a secondary source alone may never
 * produce a high-confidence conclusion.
 */
export const DYNAMIC_OPPORTUNITY_PRICE_SOURCE_PRIORITY: readonly PriceSourcePriority[] = [
  'OFFICIAL_OR_LICENSED',
  'BROKER_OR_AUTHORIZED',
  'VALIDATED_SECONDARY',
  'FALLBACK_CACHE',
  'MANUAL_VERIFIED',
  'NOT_AVAILABLE',
] as const;

/**
 * Canonical safety labels. Every Dynamic Opportunity Pool surface (engine,
 * future fixtures, future UI) must keep these negations intact.
 */
export const DYNAMIC_OPPORTUNITY_SAFETY_LABELS = [
  '不自動下單',
  '不產生買賣指令',
  '不替代投資判斷',
  '主升段候選不是買進清單',
  '飆股預備隊不是追價清單',
  '禁碰池是風控提醒，不是賣出指令',
  '主流產業池不是買進清單',
  '高風報比不是買進指令',
  'priceVerified = false 時不得輸出精準價位',
  'fallback-only data 不得觸發 DANGER',
  'stale data 不得觸發 DANGER',
  'source conflict 時降級為 WARNING / DATA_INSUFFICIENT',
  '資料不足就顯示資料不足',
] as const;

/**
 * Imperative trade-command phrases that must NEVER be emitted by any Dynamic
 * Opportunity Pool surface. Note: 「買進清單 / 賣出指令 / 買進指令」are deliberately
 * NOT listed here because the safety language uses them only inside negations
 * (e.g. 「不是買進清單」/「不是賣出指令」). Only standalone command / guarantee
 * phrases are banned.
 */
export const DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS = [
  '強力買進',
  '必買',
  '必賣',
  '立即進場',
  '立即出場',
  '自動下單',
  '保證獲利',
  '追價清單',
] as const;
