/**
 * Holding Defense Tracker Contract Builder — V27
 *
 * Pure builder. Returns a deterministic HoldingDefenseTrackerResponse for the
 * GET /api/portfolio/holding-defense contract endpoint. It sources sample data
 * from the V26 Position Strategy fixture bundle so the API shape is exercised.
 *
 * This is NOT real market data and NOT investment advice. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; no buy/sell commands; no DANGER level in fixture payload
 *   - priceVerified === false ⇒ all precise zones null; highConfidence false
 */

import { buildPositionStrategyFixtureBundle } from "../position-strategy/position-strategy-fixture-adapters";
import {
  HOLDING_DEFENSE_TRACKER_SAFETY_LABELS,
} from "./holding-defense-tracker-contract";
import type {
  HoldingDefenseAlertLevel,
  HoldingDefenseTrackerItem,
  HoldingDefenseTrackerResponse,
  HoldingDefenseTrackerState,
  HoldingDefenseTrackerSummary,
} from "./holding-defense-tracker-contract";
import type { PriceZone } from "../position-strategy/position-strategy-plan-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const FX = "fixture sample｜非即時資料｜不是投資建議";
const PRICE_SOURCE = "Fixture sample only";
const ZONE_SAFETY = "fixture sample｜非即時資料｜不是買賣指令";

const SAFETY_LABELS: string[] = [...HOLDING_DEFENSE_TRACKER_SAFETY_LABELS];

export interface BuildHoldingDefenseTrackerContractInput {
  generatedAt?: string;
}

/**
 * Builds a deterministic, mock_or_contract / fixture-only Holding Defense
 * Tracker response. All timestamps come from `input.generatedAt` (or a fixed
 * fallback string); no clock is read.
 */
export function buildHoldingDefenseTrackerContract(
  input: BuildHoldingDefenseTrackerContractInput = {},
): HoldingDefenseTrackerResponse {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  // Reuse V26 Position Strategy fixtures for stock identity / zones / impact.
  const posBundle = buildPositionStrategyFixtureBundle({ generatedAt, mode: "INTRADAY" });
  const defensePlan = posBundle.holdingDefensePlans[0];
  const profitPlan = posBundle.profitProtectionPlans[0];
  const riskPlan = posBundle.riskReductionPlans[0];
  const diPlan = posBundle.dataInsufficientPlans[0];

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

  function baseItem(
    over: Partial<HoldingDefenseTrackerItem> &
      Pick<HoldingDefenseTrackerItem, "trackerId" | "stockId" | "stockName" | "trackerState">,
  ): HoldingDefenseTrackerItem {
    return {
      alertLevel: "INFO",
      sourceMode: "fixture",
      dataQualityStatus: "WARNING",

      holdingState: "NOT_HELD",
      holdingActionState: null,
      holdingImpact: null,

      priceVerified: true,
      priceVerificationStatus: "VERIFIED",
      priceSource: PRICE_SOURCE,
      priceCheckedAt: generatedAt,

      costBasis: null,
      currentPrice: null,
      unrealizedProfitLoss: null,
      unrealizedProfitLossPercent: null,
      peakUnrealizedProfitLossPercent: null,
      drawdownFromPeakPercent: null,

      defenseZone: null,
      invalidLevel: null,
      profitProtectionZone: null,
      takeProfitZone: null,
      riskReduceZone: null,
      exitObservationZone: null,

      trendState: null,
      trendBreakWarning: null,
      shortAttackRisk: null,
      supportBreakStatus: null,
      maBreakStatus: null,
      volumeBreakdownStatus: null,
      intradayAlertLevel: null,

      riskReduceObservation: null,
      waitForReclaimCondition: null,
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

  const items: HoldingDefenseTrackerItem[] = [
    // 1) NORMAL_OBSERVATION — held in profit, not near defense.
    baseItem({
      trackerId: "hdt-normal-2454",
      stockId: "2454",
      stockName: `聯發科（${FX}）`,
      trackerState: "NORMAL_OBSERVATION",
      alertLevel: "INFO",
      holdingState: "HELD_PROFIT",
      holdingActionState: "續抱觀察",
      holdingImpact: `持股結構正常，未接近防守區（sample）；${FX}。`,
      costBasis: 1100,
      currentPrice: 1250,
      unrealizedProfitLoss: 150,
      unrealizedProfitLossPercent: 13.6,
      peakUnrealizedProfitLossPercent: 18,
      drawdownFromPeakPercent: 4,
      defenseZone: verifiedZone("防守區（防守觀察，不是自動出場）", 1180, 1200),
      invalidLevel: verifiedZone("策略失效觀察價（不是自動停損價）", 1150, 1150),
      trendState: "healthy_sample",
      nextObservation: `等待量價是否持續健康（sample）；${FX}。`,
    }),

    // 2) DEFENSE_ZONE_NEAR — sourced from V26 HOLDING_DEFENSE plan.
    baseItem({
      trackerId: "hdt-defense-near-3019",
      stockId: defensePlan.stockId,
      stockName: defensePlan.stockName,
      trackerState: "DEFENSE_ZONE_NEAR",
      alertLevel: "WATCH",
      holdingState: defensePlan.holdingState,
      holdingActionState: defensePlan.holdingActionState,
      holdingImpact: defensePlan.holdingImpact,
      costBasis: defensePlan.costBasis,
      currentPrice: defensePlan.currentPrice,
      unrealizedProfitLoss: 12,
      unrealizedProfitLossPercent: defensePlan.unrealizedProfitLossPercent,
      peakUnrealizedProfitLossPercent: 15,
      drawdownFromPeakPercent: 7,
      defenseZone: defensePlan.defenseZone,
      invalidLevel: defensePlan.invalidLevel,
      trendState: defensePlan.trendState,
      trendBreakWarning: defensePlan.trendBreakWarning,
      shortAttackRisk: defensePlan.shortAttackRisk,
      maBreakStatus: defensePlan.maBreakStatus,
      intradayAlertLevel: "WATCH",
      riskReduceObservation: defensePlan.riskReduceObservation,
      waitForReclaimCondition: defensePlan.waitForReclaimCondition,
      nextObservation: `等待站回防守區（sample）；${FX}。`,
    }),

    // 3) PROFIT_PROTECTION_ACTIVE — sourced from V26 PROFIT_PROTECTION plan.
    baseItem({
      trackerId: "hdt-profit-4966",
      stockId: profitPlan.stockId,
      stockName: profitPlan.stockName,
      trackerState: "PROFIT_PROTECTION_ACTIVE",
      alertLevel: "WATCH",
      holdingState: profitPlan.holdingState,
      holdingActionState: profitPlan.holdingActionState,
      holdingImpact: profitPlan.holdingImpact,
      costBasis: profitPlan.costBasis,
      currentPrice: profitPlan.currentPrice,
      unrealizedProfitLoss: 380,
      unrealizedProfitLossPercent: profitPlan.unrealizedProfitLossPercent,
      peakUnrealizedProfitLossPercent: 42,
      drawdownFromPeakPercent: 7.5,
      profitProtectionZone: profitPlan.profitProtectionZone,
      takeProfitZone: profitPlan.takeProfitZone,
      riskReduceZone: profitPlan.riskReduceZone,
      trendState: profitPlan.trendState,
      nextObservation: `等待是否跌破 5MA / 10MA（sample）；${FX}。`,
    }),

    // 4) RISK_REDUCTION_ACTIVE — sourced from V26 RISK_REDUCTION plan.
    baseItem({
      trackerId: "hdt-risk-2743",
      stockId: riskPlan.stockId,
      stockName: riskPlan.stockName,
      trackerState: "RISK_REDUCTION_ACTIVE",
      alertLevel: "WARNING",
      holdingState: riskPlan.holdingState,
      holdingActionState: "風險降低觀察",
      holdingImpact: riskPlan.holdingImpact,
      costBasis: riskPlan.costBasis,
      currentPrice: riskPlan.currentPrice,
      unrealizedProfitLoss: -3,
      unrealizedProfitLossPercent: riskPlan.unrealizedProfitLossPercent,
      peakUnrealizedProfitLossPercent: 6,
      drawdownFromPeakPercent: 10.5,
      exitObservationZone: riskPlan.exitObservationZone,
      riskReduceZone: riskPlan.riskReduceZone,
      invalidLevel: riskPlan.invalidLevel,
      trendState: "weakening_sample",
      trendBreakWarning: `跌破週 30MA、MACD 翻空（sample）；${FX}。`,
      riskReduceObservation: riskPlan.riskReduceObservation,
      waitForReclaimCondition: riskPlan.waitForReclaimCondition,
      nextObservation: `等待站回前波低點與週 30MA（sample）；${FX}。`,
    }),

    // 5) PRICE_NOT_VERIFIED — sourced from V26 DATA_INSUFFICIENT plan.
    baseItem({
      trackerId: "hdt-priceunverified-5347",
      stockId: diPlan.stockId,
      stockName: diPlan.stockName,
      trackerState: "PRICE_NOT_VERIFIED",
      alertLevel: "DATA_INSUFFICIENT",
      dataQualityStatus: "DATA_INSUFFICIENT",
      holdingState: "DATA_INSUFFICIENT",
      holdingImpact: `價格未驗證，無法評估防守區（sample）；${FX}。`,
      priceVerified: false,
      priceVerificationStatus: "NOT_VERIFIED",
      priceSource: null,
      priceCheckedAt: null,
      costBasis: null,
      currentPrice: null,
      unrealizedProfitLoss: null,
      unrealizedProfitLossPercent: null,
      missingDataFields: diPlan.missingDataFields,
      requiredVerification: diPlan.requiredVerification,
      nextObservation: `等待價格驗證與來源補齊（sample）；資料不足就顯示資料不足；${FX}。`,
    }),
  ];

  const countState = (s: HoldingDefenseTrackerState): number =>
    items.filter((i) => i.trackerState === s).length;

  const summary: HoldingDefenseTrackerSummary = {
    totalHoldings: items.length,
    normalObservationCount: countState("NORMAL_OBSERVATION"),
    defenseZoneNearCount: countState("DEFENSE_ZONE_NEAR"),
    defenseZoneBrokenCount: countState("DEFENSE_ZONE_BROKEN"),
    profitProtectionActiveCount: countState("PROFIT_PROTECTION_ACTIVE"),
    riskReductionActiveCount: countState("RISK_REDUCTION_ACTIVE"),
    dataInsufficientCount: countState("DATA_INSUFFICIENT"),
    priceNotVerifiedCount: countState("PRICE_NOT_VERIFIED"),
    sourceConflictCount: countState("SOURCE_CONFLICT"),
    staleDataCount: countState("STALE_DATA"),
    highConfidenceConclusionAllowed: false,
  };

  return {
    contractVersion: "V27",
    apiContractVersion: "V27",
    responseSource: "mock_or_contract",
    sourceMode: "fixture",
    generatedAt,
    trackerFixtureVersion: "V27",
    items,
    summary,
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
