/**
 * Intraday Defense Fixture Contract Builder — V31
 *
 * Pure builder. Returns a deterministic mock_or_contract / fixture-only payload
 * for the GET /api/portfolio/intraday-defense endpoint, shaped from the V30
 * Intraday Holding Defense Runtime contract.
 *
 * This is NOT real market data and NOT investment advice. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; no buy/sell commands
 *   - No DANGER from priceVerified=false / stale / source-conflict / fallback-only
 *   - priceVerified === false ⇒ all precise zones null; highConfidence false
 */

import type {
  IntradayHoldingDefenseAlertItem,
  IntradayHoldingDefenseAlertLevel,
  IntradayHoldingDefenseCooldownPolicy,
  IntradayHoldingDefenseDedupRecord,
  IntradayHoldingDefenseRuntimeReadinessChecklist,
  IntradayHoldingDefenseState,
  IntradayHoldingDefenseTriggerRule,
} from "./intraday-holding-defense-runtime-contract";
import type { PriceZone } from "../position-strategy/position-strategy-plan-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const FX = "fixture sample｜非即時資料｜不是投資建議";
const PRICE_SOURCE = "Fixture sample only";
const ZONE_SAFETY = "fixture sample｜非即時資料｜不是買賣指令";

const SAFETY_LABELS: string[] = [
  "fixture data 不是即時資料",
  "fixture data 不是投資建議",
  "不產生買賣指令",
  "防守區是防守觀察，不是自動出場",
  "invalidLevel 不是自動停損價",
  "takeProfitZone 不是賣出價",
];

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface IntradayDefenseFixtureSummary {
  totalAlerts: number;
  infoCount: number;
  watchCount: number;
  warningCount: number;
  dangerCount: number;
  dataInsufficientCount: number;
  priceNotVerifiedCount: number;
  staleDataCount: number;
  sourceConflictCount: number;
  fallbackOnlyCount: number;
  duplicateSuppressedCount: number;
  highConfidenceConclusionAllowed: false;
}

export interface IntradayDefenseFixtureResponse {
  contractVersion: "V31";
  apiContractVersion: "V31";
  responseSource: "mock_or_contract";
  sourceMode: "fixture";
  runtimeMode: "spec_only";
  generatedAt: string;
  fixtureVersion: "V31";
  alerts: IntradayHoldingDefenseAlertItem[];
  summary: IntradayDefenseFixtureSummary;
  triggerRules: IntradayHoldingDefenseTriggerRule[];
  cooldownPolicy: IntradayHoldingDefenseCooldownPolicy;
  runtimeReadinessChecklist: IntradayHoldingDefenseRuntimeReadinessChecklist;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

export interface BuildIntradayDefenseFixtureContractInput {
  generatedAt?: string;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic, fixture-only Intraday Defense payload. All timestamps
 * come from `input.generatedAt` (or a fixed fallback string); no clock is read.
 */
export function buildIntradayDefenseFixtureContract(
  input: BuildIntradayDefenseFixtureContractInput = {},
): IntradayDefenseFixtureResponse {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  function verifiedZone(zoneLabel: string, low: number, high: number): PriceZone {
    return {
      zoneLabel,
      low,
      high,
      priceVerified: true,
      priceVerificationStatus: "VERIFIED",
      priceSource: PRICE_SOURCE,
      priceCheckedAt: generatedAt,
      isPrecisePriceAllowed: true,
      safetyLabel: ZONE_SAFETY,
    };
  }

  function dedup(
    stockId: string,
    state: IntradayHoldingDefenseState,
    suppressed: boolean,
    cooldownRemaining: number | null,
  ): IntradayHoldingDefenseDedupRecord {
    return {
      dedupKey: `${stockId}|${state}`,
      duplicateSuppressed: suppressed,
      cooldownRemainingSeconds: cooldownRemaining,
      lastAlertState: suppressed ? state : null,
      nextAllowedAlertAt: cooldownRemaining != null ? generatedAt : null,
    };
  }

  function baseAlert(
    over: Partial<IntradayHoldingDefenseAlertItem> &
      Pick<
        IntradayHoldingDefenseAlertItem,
        "alertId" | "stockId" | "stockName" | "intradayState" | "alertLevel" | "triggerType" | "dedup"
      >,
  ): IntradayHoldingDefenseAlertItem {
    return {
      runtimeMode: "spec_only",
      trackerState: null,
      holdingState: "DATA_INSUFFICIENT",
      holdingActionState: null,

      priceVerified: true,
      priceVerificationStatus: "VERIFIED",
      freshnessStatus: "FRESH",
      sourceConflictStatus: "NO_CONFLICT",
      dataQualityStatus: "WARNING",
      sourcePriority: "OFFICIAL_OR_LICENSED",

      currentPrice: null,
      intradayHigh: null,
      intradayLow: null,
      previousClose: null,
      volumeRatio: null,
      drawdownFromPeakPercent: null,

      defenseZone: null,
      invalidLevel: null,
      profitProtectionZone: null,
      takeProfitZone: null,
      riskReduceZone: null,
      exitObservationZone: null,

      holdingImpact: null,
      trendBreakWarning: null,
      shortAttackRisk: null,
      riskReduceObservation: null,
      waitForReclaimCondition: null,
      recoveryCondition: null,
      nextObservation: null,

      warnings: [`fixture-only sample，${FX}`],
      missingDataFields: [],
      requiredVerification: [],
      safetyLabels: SAFETY_LABELS,

      notExitSignal: true,
      notTradeAdvice: true,
      highConfidenceConclusionAllowed: false,

      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,

      ...over,
    };
  }

  const alerts: IntradayHoldingDefenseAlertItem[] = [
    // --- verified / fresh / no-conflict samples (no DANGER) ---
    baseAlert({
      alertId: "ida-normal-2454",
      stockId: "2454",
      stockName: `聯發科（${FX}）`,
      intradayState: "INTRADAY_NORMAL",
      alertLevel: "INFO",
      triggerType: "RECOVERY_CONDITION",
      holdingState: "HELD_PROFIT",
      holdingActionState: "續抱觀察",
      currentPrice: 1250,
      previousClose: 1240,
      defenseZone: verifiedZone("防守區（防守觀察，不是自動出場）", 1180, 1200),
      invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 1150, 1150),
      holdingImpact: `持股結構正常（sample）；${FX}。`,
      nextObservation: `等待量價是否持續健康（sample）；${FX}。`,
      dedup: dedup("2454", "INTRADAY_NORMAL", false, null),
    }),
    baseAlert({
      alertId: "ida-defapproach-3019",
      stockId: "3019",
      stockName: `亞光（${FX}）`,
      intradayState: "DEFENSE_ZONE_APPROACHING",
      alertLevel: "WATCH",
      triggerType: "DEFENSE_ZONE_APPROACH",
      freshnessStatus: "DELAYED",
      holdingState: "DEFENSE_ACTIVE",
      holdingActionState: "風險降低觀察",
      currentPrice: 162,
      defenseZone: verifiedZone("防守區（防守觀察，不是自動出場）", 157, 160),
      invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 153, 153),
      holdingImpact: `接近防守區（sample）；${FX}。`,
      waitForReclaimCondition: `等待站回防守區（sample）；${FX}。`,
      dedup: dedup("3019", "DEFENSE_ZONE_APPROACHING", false, null),
    }),
    baseAlert({
      alertId: "ida-defbreach-2743",
      stockId: "2743",
      stockName: `山富（${FX}）`,
      intradayState: "DEFENSE_ZONE_BREACHED",
      alertLevel: "WARNING",
      triggerType: "DEFENSE_ZONE_BREACH",
      holdingState: "RISK_REDUCTION_ACTIVE",
      currentPrice: 64,
      defenseZone: verifiedZone("防守區（防守觀察，不是自動出場）", 65, 67),
      invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 63, 63),
      holdingImpact: `跌破防守區，防守觀察（sample）；防守區是防守觀察，不是自動出場；${FX}。`,
      riskReduceObservation: `放量跌破時進入風險降低觀察（不是賣出指令）；${FX}。`,
      dedup: dedup("2743", "DEFENSE_ZONE_BREACHED", false, 90),
    }),
    baseAlert({
      alertId: "ida-invalidbreach-6531",
      stockId: "6531",
      stockName: `愛普（${FX}）`,
      intradayState: "INVALID_LEVEL_BREACHED",
      alertLevel: "WARNING",
      triggerType: "INVALID_LEVEL_BREACH",
      holdingState: "RISK_REDUCTION_ACTIVE",
      currentPrice: 488,
      invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 495, 495),
      exitObservationZone: verifiedZone("出場觀察區（不是賣出價）", 470, 485),
      trendBreakWarning: `跌破策略失效觀察價（sample）；invalidLevel 不是自動停損價；${FX}。`,
      dedup: dedup("6531", "INVALID_LEVEL_BREACHED", false, null),
    }),
    baseAlert({
      alertId: "ida-profitgiveback-4966",
      stockId: "4966",
      stockName: `譜瑞-KY（${FX}）`,
      intradayState: "PROFIT_GIVEBACK_WARNING",
      alertLevel: "WATCH",
      triggerType: "PROFIT_GIVEBACK",
      holdingState: "PROFIT_PROTECTION_ACTIVE",
      holdingActionState: "獲利保護觀察",
      currentPrice: 1480,
      drawdownFromPeakPercent: 7.5,
      profitProtectionZone: verifiedZone("獲利保護觀察區（不是賣出價）", 1420, 1450),
      takeProfitZone: verifiedZone("takeProfitZone 分批獲利保護觀察區（takeProfitZone 不是賣出價）", 1500, 1560),
      riskReduceZone: verifiedZone("風險降低觀察區（不是賣出指令）", 1380, 1410),
      holdingImpact: `高檔回吐觀察（sample）；獲利保護觀察不是賣出指令；${FX}。`,
      dedup: dedup("4966", "PROFIT_GIVEBACK_WARNING", false, null),
    }),
    baseAlert({
      alertId: "ida-riskreduction-2455",
      stockId: "2455",
      stockName: `全新（${FX}）`,
      intradayState: "RISK_REDUCTION_WATCH",
      alertLevel: "WATCH",
      triggerType: "TREND_BREAK",
      holdingState: "RISK_REDUCTION_ACTIVE",
      holdingActionState: "風險降低觀察",
      currentPrice: 478,
      riskReduceZone: verifiedZone("風險降低觀察區（不是賣出指令）", 470, 482),
      invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 465, 465),
      riskReduceObservation: `風險升高觀察（不是賣出指令）；${FX}。`,
      dedup: dedup("2455", "RISK_REDUCTION_WATCH", false, null),
    }),
    baseAlert({
      alertId: "ida-fastdrop-3035",
      stockId: "3035",
      stockName: `智原（${FX}）`,
      intradayState: "FAST_DROP_WARNING",
      alertLevel: "WARNING",
      triggerType: "FAST_DROP",
      holdingState: "DEFENSE_ACTIVE",
      currentPrice: 612,
      intradayHigh: 660,
      intradayLow: 608,
      volumeRatio: 2.4,
      defenseZone: verifiedZone("防守區（防守觀察，不是自動出場）", 620, 635),
      invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 600, 600),
      shortAttackRisk: `短線急跌觀察（sample）；FAST_DROP_WARNING 不是賣出指令；${FX}。`,
      dedup: dedup("3035", "FAST_DROP_WARNING", false, 60),
    }),
    baseAlert({
      alertId: "ida-trendbreak-3661",
      stockId: "3661",
      stockName: `世芯-KY（${FX}）`,
      intradayState: "TREND_BREAK_WARNING",
      alertLevel: "WARNING",
      triggerType: "TREND_BREAK",
      holdingState: "RISK_REDUCTION_ACTIVE",
      currentPrice: 2980,
      defenseZone: verifiedZone("防守區（防守觀察，不是自動出場）", 3000, 3050),
      invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 2950, 2950),
      trendBreakWarning: `跌破 5MA / 10MA、MACD 轉弱（sample）；趨勢破壞警示不是賣出指令；${FX}。`,
      // demo of dedup suppression
      dedup: dedup("3661", "TREND_BREAK_WARNING", true, 120),
    }),

    // --- degraded samples (priceVerified=false ⇒ zones null, never DANGER) ---
    baseAlert({
      alertId: "ida-priceunverified-5347",
      stockId: "5347",
      stockName: `世界（${FX}）`,
      intradayState: "PRICE_NOT_VERIFIED",
      alertLevel: "DATA_INSUFFICIENT",
      triggerType: "DATA_QUALITY_DOWNGRADE",
      priceVerified: false,
      priceVerificationStatus: "NOT_VERIFIED",
      freshnessStatus: "UNKNOWN",
      dataQualityStatus: "PRICE_NOT_VERIFIED",
      sourcePriority: "NOT_AVAILABLE",
      missingDataFields: ["currentPrice", "defenseZone", "invalidLevel"],
      requiredVerification: ["official / licensed price feed"],
      holdingImpact: `價格未驗證（sample）；priceVerified = false 時不得輸出精準價位；${FX}。`,
      dedup: dedup("5347", "PRICE_NOT_VERIFIED", false, null),
    }),
    baseAlert({
      alertId: "ida-stale-4979",
      stockId: "4979",
      stockName: `華星光（${FX}）`,
      intradayState: "STALE_DATA",
      alertLevel: "WARNING",
      triggerType: "DATA_QUALITY_DOWNGRADE",
      priceVerified: false,
      priceVerificationStatus: "STALE",
      freshnessStatus: "STALE",
      dataQualityStatus: "STALE_DATA",
      sourcePriority: "VALIDATED_SECONDARY",
      warnings: [`stale data 不得觸發 DANGER（sample）；${FX}。`],
      requiredVerification: ["fresh quote refresh"],
      holdingImpact: `資料過舊（sample）；stale data 不得觸發 DANGER；${FX}。`,
      dedup: dedup("4979", "STALE_DATA", false, null),
    }),
    baseAlert({
      alertId: "ida-conflict-3596",
      stockId: "3596",
      stockName: `智易（${FX}）`,
      intradayState: "SOURCE_CONFLICT",
      alertLevel: "DATA_INSUFFICIENT",
      triggerType: "DATA_QUALITY_DOWNGRADE",
      priceVerified: false,
      priceVerificationStatus: "SOURCE_CONFLICT",
      freshnessStatus: "UNKNOWN",
      sourceConflictStatus: "MAJOR_CONFLICT",
      dataQualityStatus: "SOURCE_CONFLICT",
      sourcePriority: "VALIDATED_SECONDARY",
      warnings: [`source conflict 不得觸發 DANGER（sample）；${FX}。`],
      requiredVerification: ["source conflict resolution"],
      holdingImpact: `來源衝突（sample）；source conflict 不得觸發 DANGER；${FX}。`,
      dedup: dedup("3596", "SOURCE_CONFLICT", false, null),
    }),
    baseAlert({
      alertId: "ida-fallback-6669",
      stockId: "6669",
      stockName: `緯穎（${FX}）`,
      intradayState: "FALLBACK_ONLY",
      alertLevel: "WARNING",
      triggerType: "DATA_QUALITY_DOWNGRADE",
      priceVerified: false,
      priceVerificationStatus: "FALLBACK_ONLY",
      freshnessStatus: "DELAYED",
      // dataQualityStatus uses PositionStrategyDataQualityStatus, which has no
      // FALLBACK_ONLY member; the fallback-only condition is carried by the
      // intradayState / priceVerificationStatus / sourcePriority instead.
      dataQualityStatus: "WARNING",
      sourcePriority: "FALLBACK_CACHE",
      warnings: [`fallback-only data 不得觸發 DANGER（sample）；${FX}。`],
      requiredVerification: ["official / licensed source"],
      holdingImpact: `僅 fallback 資料（sample）；fallback-only data 不得觸發 DANGER；${FX}。`,
      dedup: dedup("6669", "FALLBACK_ONLY", false, null),
    }),
    baseAlert({
      alertId: "ida-datainsufficient-8088",
      stockId: "8088",
      stockName: `品安（${FX}）`,
      intradayState: "DATA_INSUFFICIENT",
      alertLevel: "DATA_INSUFFICIENT",
      triggerType: "DATA_QUALITY_DOWNGRADE",
      priceVerified: false,
      priceVerificationStatus: "NOT_COVERED",
      freshnessStatus: "UNKNOWN",
      dataQualityStatus: "DATA_INSUFFICIENT",
      sourcePriority: "NOT_AVAILABLE",
      missingDataFields: ["currentPrice", "defenseZone", "invalidLevel", "takeProfitZone"],
      requiredVerification: ["coverage onboarding", "official price feed"],
      holdingImpact: `資料不足（sample）；資料不足就顯示資料不足；${FX}。`,
      dedup: dedup("8088", "DATA_INSUFFICIENT", false, null),
    }),
  ];

  const countLevel = (lv: IntradayHoldingDefenseAlertLevel): number =>
    alerts.filter((a) => a.alertLevel === lv).length;
  const countState = (s: IntradayHoldingDefenseState): number =>
    alerts.filter((a) => a.intradayState === s).length;

  const summary: IntradayDefenseFixtureSummary = {
    totalAlerts: alerts.length,
    infoCount: countLevel("INFO"),
    watchCount: countLevel("WATCH"),
    warningCount: countLevel("WARNING"),
    dangerCount: countLevel("DANGER"),
    dataInsufficientCount: countLevel("DATA_INSUFFICIENT"),
    priceNotVerifiedCount: countState("PRICE_NOT_VERIFIED"),
    staleDataCount: countState("STALE_DATA"),
    sourceConflictCount: countState("SOURCE_CONFLICT"),
    fallbackOnlyCount: countState("FALLBACK_ONLY"),
    duplicateSuppressedCount: alerts.filter((a) => a.dedup.duplicateSuppressed).length,
    highConfidenceConclusionAllowed: false,
  };

  const triggerRules: IntradayHoldingDefenseTriggerRule[] = (
    [
      "DEFENSE_ZONE_APPROACH",
      "DEFENSE_ZONE_BREACH",
      "INVALID_LEVEL_APPROACH",
      "INVALID_LEVEL_BREACH",
      "PROFIT_GIVEBACK",
      "FAST_DROP",
      "TREND_BREAK",
      "DATA_QUALITY_DOWNGRADE",
      "RECOVERY_CONDITION",
    ] as const
  ).map((triggerType) => ({
    triggerType,
    requiredPriceVerified: true,
    requiredFreshness: ["FRESH", "DELAYED"],
    allowedSourceConflictStatuses: ["NO_CONFLICT", "MINOR_DIFFERENCE"],
    blocksDangerWhenFallbackOnly: true,
    blocksDangerWhenStale: true,
    blocksDangerWhenSourceConflict: true,
    blocksPrecisePriceWhenNotVerified: true,
    requiresNotTradeAdvice: true,
  }));

  const cooldownPolicy: IntradayHoldingDefenseCooldownPolicy = {
    cooldownEnabled: true,
    defaultCooldownSeconds: 300,
    dangerCooldownSeconds: 600,
    warningCooldownSeconds: 180,
    watchCooldownSeconds: 120,
    dedupEnabled: true,
    dedupWindowSeconds: 120,
  };

  const runtimeReadinessChecklist: IntradayHoldingDefenseRuntimeReadinessChecklist = {
    sourceAuthorizationReviewed: false,
    rateLimitReviewed: false,
    marketSessionHandlingDefined: true,
    timestampNormalizationDefined: true,
    priceFreshnessWindowDefined: true,
    sourceConflictThresholdDefined: true,
    fallbackDowngradeDefined: true,
    noDangerGuardDefined: true,
    cooldownWindowDefined: true,
    dedupStorageStrategyDefined: false,
    dryRunModeDefined: true,
    noWriteGuardDefined: true,
    auditLogShapeDefined: false,
    killSwitchDefined: false,
    rollbackPlanDefined: false,
    notTradeAdviceAlwaysTrue: true,
    buySellCommandGenerationBlocked: true,
  };

  return {
    contractVersion: "V31",
    apiContractVersion: "V31",
    responseSource: "mock_or_contract",
    sourceMode: "fixture",
    runtimeMode: "spec_only",
    generatedAt,
    fixtureVersion: "V31",
    alerts,
    summary,
    triggerRules,
    cooldownPolicy,
    runtimeReadinessChecklist,
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
