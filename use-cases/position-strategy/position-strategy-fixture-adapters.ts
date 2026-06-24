/**
 * Position Strategy Fixture Adapters — V26
 *
 * Deterministic, fixture-only sample data for the V24 Position Strategy Plan,
 * wired together with V25 Dynamic Opportunity Pool / Price Verification semantics
 * (expressed through setupTags / warnings / priceVerificationStatus). Used by the
 * War Room engine fixture adapters so the existing /api/war-room read model and
 * War Room UI can render Position Strategy Plan examples.
 *
 * This is NOT real market data, NOT real-time quotes, NOT institutional research,
 * NOT a technical signal, and NOT investment advice.
 *
 * Constraints:
 *   - Pure functions / constants only; deterministic output.
 *   - No fetch, no axios, no Supabase, no env reads, no Date.now, no new Date.
 *   - No data writes, no runtime builder import, no mock-data import.
 *   - All timestamps (generatedAt / priceCheckedAt) are passed in by the caller.
 *   - Every sample is labelled fixture / sample / 非即時資料 / 不是投資建議.
 *   - priceVerified === false ⇒ all precise price zones are null and
 *     riskRewardRatio is null.
 *   - highConfidenceConclusionAllowed is always false; no DANGER produced.
 *
 * The real stock identifiers below (亞光 / 譜瑞 / 山富 / 世界 / 全新 / 華星光) are
 * used only as illustrative fixture labels — never as real prices or advice.
 */

import type {
  HoldingActionState,
  HoldingState,
  PositionStrategyPlan,
  PositionStrategyPlanBundle,
  PositionStrategyPlanType,
  PositionStrategyRiskRewardGrade,
  PriceVerificationStatus,
  PriceZone,
} from "./position-strategy-plan-contract";

// Safety suffix embedded into sample labels and summaries. Contains all four
// mandatory markers: fixture / sample / 非即時資料 / 不是投資建議.
const FX = "fixture sample｜非即時資料｜不是投資建議";

// Price source label for every fixture zone.
const PRICE_SOURCE = "Fixture sample only";

// Safety label embedded into every PriceZone.
const ZONE_SAFETY = "fixture sample｜非即時資料｜不是買賣指令";

export interface BuildPositionStrategyFixtureBundleInput {
  generatedAt: string;
  mode?: "PREMARKET" | "INTRADAY" | "POSTMARKET" | "REALTIME_ALERT";
}

/**
 * Builds a deterministic, fixture-only Position Strategy Plan bundle. All
 * timestamps come from `input.generatedAt`; no clock is read here. The `mode` is
 * only echoed into observation summaries — it never changes the payload shape.
 */
export function buildPositionStrategyFixtureBundle(
  input: BuildPositionStrategyFixtureBundleInput,
): PositionStrategyPlanBundle {
  const generatedAt = input.generatedAt;
  const modeNote = input.mode ?? "PREMARKET";

  // -------------------------------------------------------------------------
  // Local factories (close over generatedAt for deterministic priceCheckedAt)
  // -------------------------------------------------------------------------

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

  function basePlan(
    over: Partial<PositionStrategyPlan> &
      Pick<PositionStrategyPlan, "planId" | "stockId" | "stockName" | "planType">,
  ): PositionStrategyPlan {
    return {
      sourceMode: "fixture",
      dataQualityStatus: "WARNING",
      priceVerificationStatus: "VERIFIED",
      priceVerified: true,
      priceSource: PRICE_SOURCE,
      priceCheckedAt: generatedAt,

      currentPrice: null,
      costBasis: null,
      unrealizedProfitLossPercent: null,

      entryObservationZone: null,
      confirmationCondition: null,
      entryTriggerCondition: null,
      noChaseZone: null,

      defenseZone: null,
      invalidLevel: null,
      profitProtectionZone: null,
      takeProfitZone: null,
      riskReduceZone: null,
      exitObservationZone: null,
      targetObservationZone: null,

      riskRewardRatio: null,
      riskRewardGrade: "DATA_INSUFFICIENT",

      holdingState: "NOT_HELD",
      holdingActionState: null,
      holdingImpact: null,

      trendState: null,
      trendBreakWarning: null,
      shortAttackRisk: null,
      supportBreakStatus: null,
      maBreakStatus: null,
      volumeBreakdownStatus: null,
      intradayAlertLevel: null,
      marketStatus: null,
      sectorStatus: null,

      riskReduceObservation: null,
      waitForReclaimCondition: null,
      trendInvalidationReason: null,
      noTouchReason: null,
      noTouchDurationHint: null,
      requiredRecoveryCondition: null,

      unavailableReason: null,
      missingDataFields: [],
      requiredVerification: [],

      setupTags: [],
      warnings: [`fixture-only sample，${FX}`],
      observationSummary: "",

      notEntrySignal: false,
      notExitSignal: false,
      notTradeAdvice: true,
      highConfidenceConclusionAllowed: false,

      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,

      ...over,
    };
  }

  const fxName = (name: string): string => `${name}（${FX}）`;

  // -------------------------------------------------------------------------
  // 1) ENTRY_OBSERVATION — 全新 2455 (not held; main-uptrend candidate)
  // -------------------------------------------------------------------------

  const entry = basePlan({
    planId: "fixture-entry-2455",
    stockId: "2455",
    stockName: fxName("全新"),
    planType: "ENTRY_OBSERVATION" as PositionStrategyPlanType,
    riskRewardRatio: 3.5,
    riskRewardGrade: "A" as PositionStrategyRiskRewardGrade,
    holdingState: "NOT_HELD" as HoldingState,
    entryObservationZone: verifiedZone("進場觀察區（觀察價，不是買進價）", 480, 495),
    confirmationCondition: `站回月線且量縮回測轉強才視為轉強確認；${FX}。`,
    entryTriggerCondition: `KD 低檔改善 + MACD histogram 翻紅 + 爆量轉強（${FX}）。`,
    noChaseZone: verifiedZone("不追價區（不是放空建議）", 512, 525),
    invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 470, 470),
    targetObservationZone: verifiedZone("觀察目標區（不是目標價）", 560, 600),
    setupTags: ["MAIN_UPTREND_POOL", "BREAKOUT_PREP_POOL", "RISK_REWARD_QUALIFIED"],
    observationSummary:
      `mode=${modeNote}｜illustrative fixture only；進場觀察區不是買進價、策略失效觀察價不是自動停損價、` +
      `觀察目標區不是目標價；${FX}。`,
    notEntrySignal: true,
    notExitSignal: true,
    notTradeAdvice: true,
  });

  // -------------------------------------------------------------------------
  // 2) HOLDING_DEFENSE — 亞光 3019 (held; defense active)
  // -------------------------------------------------------------------------

  const holdingDefense = basePlan({
    planId: "fixture-defense-3019",
    stockId: "3019",
    stockName: fxName("亞光"),
    planType: "HOLDING_DEFENSE" as PositionStrategyPlanType,
    currentPrice: 162,
    costBasis: 150,
    unrealizedProfitLossPercent: 8,
    riskRewardGrade: "B" as PositionStrategyRiskRewardGrade,
    holdingState: "DEFENSE_ACTIVE" as HoldingState,
    holdingImpact: `接近防守區，持股風險升高（sample 範例）；${FX}。`,
    defenseZone: verifiedZone("防守區（防守觀察，不是自動出場）", 157, 160),
    invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 153, 153),
    trendBreakWarning: `日線量價轉弱，注意是否跌破防守區（sample）；${FX}。`,
    shortAttackRisk: `盤中被動賣壓放大時，短打回測風險升高（sample）；${FX}。`,
    riskReduceObservation: `若跌破防守區且量增，進入風險降低觀察（不是賣出指令）；${FX}。`,
    waitForReclaimCondition: `等待站回防守區並量縮才視為轉穩（sample）；${FX}。`,
    trendState: "weakening_sample",
    maBreakStatus: "below_5MA_sample",
    setupTags: ["HOLDING_PRIORITY_POOL"],
    observationSummary:
      `mode=${modeNote}｜illustrative fixture only；防守區是防守觀察，不是自動出場；${FX}。`,
    notExitSignal: true,
    notTradeAdvice: true,
  });

  // -------------------------------------------------------------------------
  // 3) PROFIT_PROTECTION — 譜瑞 4966 (held in profit; protect gains)
  // -------------------------------------------------------------------------

  const profitProtection = basePlan({
    planId: "fixture-profit-4966",
    stockId: "4966",
    stockName: fxName("譜瑞-KY"),
    planType: "PROFIT_PROTECTION" as PositionStrategyPlanType,
    currentPrice: 1480,
    costBasis: 1100,
    unrealizedProfitLossPercent: 34.5,
    riskRewardGrade: "B" as PositionStrategyRiskRewardGrade,
    holdingState: "PROFIT_PROTECTION_ACTIVE" as HoldingState,
    holdingActionState: "獲利保護觀察" as HoldingActionState,
    holdingImpact: `高檔爆量不漲，獲利保護觀察升高（sample）；${FX}。`,
    profitProtectionZone: verifiedZone("獲利保護觀察區（不是賣出價）", 1420, 1450),
    takeProfitZone: verifiedZone("takeProfitZone 分批獲利保護觀察區（takeProfitZone 不是賣出價）", 1500, 1560),
    riskReduceZone: verifiedZone("風險降低觀察區（不是賣出指令）", 1380, 1410),
    trendState: "high_level_weakening_sample",
    setupTags: ["HOLDING_PRIORITY_POOL"],
    observationSummary:
      `mode=${modeNote}｜illustrative fixture only；takeProfitZone 不是賣出價；holdingActionState 是狀態，不是買賣指令；${FX}。`,
    notExitSignal: true,
    notTradeAdvice: true,
  });

  // -------------------------------------------------------------------------
  // 4) RISK_REDUCTION — 山富 2743 (downtrend risk rising)
  // -------------------------------------------------------------------------

  const riskReduction = basePlan({
    planId: "fixture-risk-2743",
    stockId: "2743",
    stockName: fxName("山富"),
    planType: "RISK_REDUCTION" as PositionStrategyPlanType,
    currentPrice: 64,
    costBasis: 67,
    unrealizedProfitLossPercent: -4.5,
    riskRewardGrade: "C" as PositionStrategyRiskRewardGrade,
    holdingState: "RISK_REDUCTION_ACTIVE" as HoldingState,
    holdingImpact: `跌破防守區，走空風險升高（sample）；${FX}。`,
    exitObservationZone: verifiedZone("出場觀察區（不是賣出價）", 61, 63),
    riskReduceZone: verifiedZone("風險降低觀察區（不是賣出指令）", 62, 65),
    invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 60, 60),
    riskReduceObservation: `放量跌破支撐時進入風險降低觀察（不是賣出指令）；${FX}。`,
    trendInvalidationReason: `跌破週 30MA 且 MACD 翻空（sample）；${FX}。`,
    waitForReclaimCondition: `等待站回前波低點與週 30MA 才視為轉穩（sample）；${FX}。`,
    setupTags: ["DAILY_WATCH_POOL"],
    observationSummary:
      `mode=${modeNote}｜illustrative fixture only；出場觀察區不是賣出價、風險降低觀察不是賣出指令；${FX}。`,
    notExitSignal: true,
    notTradeAdvice: true,
  });

  // -------------------------------------------------------------------------
  // 5) NO_TOUCH — 華星光 4979 (avoid / no touch)
  // -------------------------------------------------------------------------

  const noTouch = basePlan({
    planId: "fixture-notouch-4979",
    stockId: "4979",
    stockName: fxName("華星光"),
    planType: "NO_TOUCH" as PositionStrategyPlanType,
    priceVerified: false,
    priceVerificationStatus: "NOT_VERIFIED" as PriceVerificationStatus,
    priceSource: null,
    dataQualityStatus: "WARNING",
    riskRewardGrade: "D" as PositionStrategyRiskRewardGrade,
    holdingState: "NOT_HELD" as HoldingState,
    noTouchReason: `放量破底 + 法人持續賣超 + MACD 翻空（sample）；${FX}。`,
    requiredRecoveryCondition: `需站回季線、量價轉強且法人翻多才解除禁碰（sample）；${FX}。`,
    noTouchDurationHint: `建議觀察至少 5–10 個交易日再重評（sample）；${FX}。`,
    setupTags: ["NO_TOUCH_POOL"],
    observationSummary:
      `mode=${modeNote}｜illustrative fixture only；禁碰池是風控提醒，不是賣出指令；禁碰不是放空建議；${FX}。`,
    notExitSignal: true,
    notTradeAdvice: true,
  });

  // -------------------------------------------------------------------------
  // 6) DATA_INSUFFICIENT — 世界 5347 (price not verified; insufficient data)
  // -------------------------------------------------------------------------

  const dataInsufficient = basePlan({
    planId: "fixture-datainsufficient-5347",
    stockId: "5347",
    stockName: fxName("世界"),
    planType: "DATA_INSUFFICIENT" as PositionStrategyPlanType,
    priceVerified: false,
    priceVerificationStatus: "NOT_VERIFIED" as PriceVerificationStatus,
    priceSource: null,
    priceCheckedAt: null,
    dataQualityStatus: "DATA_INSUFFICIENT",
    riskRewardGrade: "DATA_INSUFFICIENT" as PositionStrategyRiskRewardGrade,
    holdingState: "DATA_INSUFFICIENT" as HoldingState,
    unavailableReason: `價格未驗證 / 來源衝突，資料不足（sample）；${FX}。`,
    missingDataFields: ["currentPrice", "supportZone", "invalidLevel", "riskRewardRatio"],
    requiredVerification: [
      "official / licensed price feed",
      "source conflict resolution",
      "price freshness check",
    ],
    setupTags: ["LOW_COVERAGE_POOL", "DATA_INSUFFICIENT_POOL"],
    observationSummary:
      `mode=${modeNote}｜illustrative fixture only；priceVerified = false 時不得輸出精準價位；` +
      `資料不足就顯示資料不足；${FX}。`,
    notEntrySignal: true,
    notExitSignal: true,
    notTradeAdvice: true,
  });

  const plans: PositionStrategyPlan[] = [
    entry,
    holdingDefense,
    profitProtection,
    riskReduction,
    noTouch,
    dataInsufficient,
  ];

  const byType = (t: PositionStrategyPlanType): PositionStrategyPlan[] =>
    plans.filter((p) => p.planType === t);

  return {
    generatedAt,
    sourceMode: "fixture",
    contractVersion: "V24",
    plans,
    entryObservationPlans: byType("ENTRY_OBSERVATION"),
    holdingDefensePlans: byType("HOLDING_DEFENSE"),
    profitProtectionPlans: byType("PROFIT_PROTECTION"),
    riskReductionPlans: byType("RISK_REDUCTION"),
    noTouchPlans: byType("NO_TOUCH"),
    dataInsufficientPlans: byType("DATA_INSUFFICIENT"),
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
