/**
 * War Room Engine Fixture Adapters — V22
 *
 * Deterministic, fixture-only sample data for the War Room read model. Used by
 * build-war-room-read-model-contract.ts so the UI can render a non-empty data
 * shape. This is NOT real market data, NOT institutional research, NOT a
 * technical signal, NOT an alert push, and NOT investment advice.
 *
 * Constraints:
 *   - Pure functions / constants only; deterministic output.
 *   - No fetch, no axios, no Supabase, no env reads, no Date.now.
 *   - No data writes, no runtime builder import, no mock-data import.
 *   - Every sample is labelled fixture / sample / 非即時資料.
 *   - dataQualityStatus is never PASS; highConfidenceConclusionAllowed is false.
 *   - No DANGER alert level in fixture mode.
 *
 * The real stock identifiers below (亞光 / 譜瑞 / 山富 / 世界 / 全新 / 華星光) are
 * used only as illustrative fixture labels — never as real prices or advice.
 */

import type {
  WarRoomAvoidItem,
  WarRoomDataQualitySummary,
  WarRoomMode,
  WarRoomObservationPoint,
  WarRoomPortfolioRiskItem,
  WarRoomSectionAvailability,
  WarRoomSourceSummary,
} from "./war-room-intelligence-contract";
import type {
  ResearchStockSnapshot,
  ResearchTopPick,
} from "../research/research-center-contract";
import type {
  RiskRewardSnapshot,
  TechnicalRiskRewardCandidate,
  TechnicalSetupSnapshot,
} from "../technical-strategy/technical-risk-reward-contract";
import type { IntradayAlertPayload } from "../intraday-alert/intraday-alert-contract";
import type { PositionStrategyPlan } from "../position-strategy/position-strategy-plan-contract";
import { buildPositionStrategyFixtureBundle } from "../position-strategy/position-strategy-fixture-adapters";

// Fixed, deterministic timestamp — no Date.now / new Date() in this adapter.
const FIXTURE_TS = "2026-06-23T00:00:00.000Z";

// Safety suffix embedded into sample labels and summaries.
const FX = "fixture sample｜非即時資料｜not trade advice";

export interface WarRoomEngineFixtureBundle {
  marketStatusLight: WarRoomSectionAvailability;
  realtimeAlerts: WarRoomSectionAvailability;
  portfolioRiskRadar: WarRoomSectionAvailability;
  researchTopPicks: WarRoomSectionAvailability;
  technicalRiskRewardCandidates: WarRoomSectionAvailability;
  avoidList: WarRoomSectionAvailability;
  nextObservationPoints: WarRoomSectionAvailability;
  portfolioRiskItems: WarRoomPortfolioRiskItem[];
  researchTopPickItems: ResearchTopPick[];
  technicalCandidateItems: TechnicalRiskRewardCandidate[];
  intradayAlertItems: IntradayAlertPayload[];
  avoidItems: WarRoomAvoidItem[];
  observationPoints: WarRoomObservationPoint[];
  sourceSummary: WarRoomSourceSummary[];
  dataQualitySummary: WarRoomDataQualitySummary;
  // V26: Position Strategy Plan fixture integration.
  positionStrategyPlans: PositionStrategyPlan[];
  entryObservationPlans: PositionStrategyPlan[];
  holdingDefensePlans: PositionStrategyPlan[];
  profitProtectionPlans: PositionStrategyPlan[];
  riskReductionPlans: PositionStrategyPlan[];
  positionNoTouchPlans: PositionStrategyPlan[];
  positionDataInsufficientPlans: PositionStrategyPlan[];
}

// ---------------------------------------------------------------------------
// Section availability
// ---------------------------------------------------------------------------

function section(
  sectionId: string,
  title: string,
  sourceEngine: string,
): WarRoomSectionAvailability {
  return {
    sectionId,
    title,
    sourceEngine,
    available: true,
    // Fixture data is never PASS.
    dataQualityStatus: "WARNING",
    fallbackUsed: true,
    unavailableReason: null,
    warnings: [`fixture-only sample，${FX}`],
    notes: ["not trade advice；資料不足就顯示資料不足。"],
  };
}

// ---------------------------------------------------------------------------
// Research fixtures
// ---------------------------------------------------------------------------

function researchStock(
  stockId: string,
  stockName: string,
  rating: ResearchStockSnapshot["researchRating"],
  score: number | null,
  quality: ResearchStockSnapshot["dataQualityStatus"],
): ResearchStockSnapshot {
  return {
    stockId,
    stockName: `${stockName}（${FX}）`,
    market: "TW",
    latestClose: null,
    latestCloseDate: null,
    marketCap: null,
    targetPriceLow: null,
    targetPriceHigh: null,
    targetPriceAverage: null,
    targetPriceSourceStatus: "LICENSE_REQUIRED",
    potentialUpsidePercent: null,
    eps2025E: null,
    eps2026E: null,
    eps2027E: null,
    epsGrowth2026YoY: null,
    epsGrowth2027YoY: null,
    latestMonthlyRevenue: null,
    previousMonthlyRevenue: null,
    latestMonthlyRevenueYoY: null,
    latestMonthlyRevenueMoM: null,
    previousMonthlyRevenueYoY: null,
    previousMonthlyRevenueMoM: null,
    cumulativeRevenue: null,
    cumulativeRevenueYoY: null,
    earningsCallSummary: null,
    earningsCallDate: null,
    aiSupplyChainTags: ["DATA_INSUFFICIENT"],
    aiBenefitLevel: "DATA_INSUFFICIENT",
    industryPosition: null,
    globalMarketShare: null,
    competitors: [],
    pullbackReason: "DATA_INSUFFICIENT",
    bullishFactors: [],
    riskFactors: [],
    factorScores: [],
    totalResearchScore: score,
    researchRating: rating,
    dataQualityStatus: quality,
    sourceMode: "fixture",
    sourceNames: ["Fixture only"],
    asOfDate: null,
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}

function researchTopPickItems(): ResearchTopPick[] {
  return [
    {
      rank: 1,
      stock: researchStock("4966", "譜瑞-KY", "A", 32, "WARNING"),
      rankingReason: `illustrative fixture only；${FX}；TOP5 Research 不等於 TOP5 Entry。`,
      notEntrySignal: true,
    },
    {
      rank: 2,
      stock: researchStock("3019", "亞光", "B", 27, "WARNING"),
      rankingReason: `illustrative fixture only；${FX}；研究面排序，不是買點。`,
      notEntrySignal: true,
    },
    {
      rank: 3,
      stock: researchStock("5347", "世界", "DATA_INSUFFICIENT", null, "DATA_INSUFFICIENT"),
      rankingReason: `illustrative fixture only；${FX}；資料不足就顯示資料不足。`,
      notEntrySignal: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// Technical fixtures
// ---------------------------------------------------------------------------

function technicalSetup(stockId: string, stockName: string): TechnicalSetupSnapshot {
  return {
    stockId,
    stockName: `${stockName}（${FX}）`,
    market: "TW",
    setupTags: ["KD_LOW_TURN_UP", "VOLUME_CONTRACTION_PULLBACK", "RISK_REWARD_QUALIFIED"],
    deductionStatus: "sample",
    kdSignalQuality: "sample",
    kdjSignalQuality: "sample",
    macdSignalQuality: "sample",
    maSignalQuality: "sample",
    volumeSignalQuality: "sample",
    supportResistanceQuality: "sample",
    technicalScore: null,
    dataQualityStatus: "WARNING",
    computedAt: FIXTURE_TS,
    sourceMode: "fixture",
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}

function riskReward(
  stockId: string,
  stockName: string,
  ratio: number,
  grade: RiskRewardSnapshot["riskRewardGrade"],
): RiskRewardSnapshot {
  return {
    stockId,
    stockName: `${stockName}（${FX}）`,
    observationPrice: null,
    supportZoneLow: null,
    supportZoneHigh: null,
    invalidLevel: null,
    targetZoneLow: null,
    targetZoneHigh: null,
    risk: null,
    reward: null,
    riskRewardRatio: ratio,
    riskRewardGrade: grade,
    dataQualityStatus: "WARNING",
    computedAt: FIXTURE_TS,
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}

function technicalCandidateItems(): TechnicalRiskRewardCandidate[] {
  const make = (
    rank: number,
    stockId: string,
    stockName: string,
    ratio: number,
    grade: RiskRewardSnapshot["riskRewardGrade"],
  ): TechnicalRiskRewardCandidate => ({
    rank,
    stockId,
    stockName: `${stockName}（${FX}）`,
    setup: technicalSetup(stockId, stockName),
    riskReward: riskReward(stockId, stockName, ratio, grade),
    decisionBoundary: "OBSERVATION_ONLY",
    observationSummary: `illustrative fixture only；${FX}；observationPrice 不是買進價、invalidLevel 不是停損價、targetZone 不是目標價。`,
    notEntrySignal: true,
    notTradeAdvice: true,
  });

  return [
    make(1, "2455", "全新", 3.1, "QUALIFIED"),
    make(2, "4979", "華星光", 3.8, "GOOD"),
    make(3, "2743", "山富", 4.2, "EXCELLENT"),
  ];
}

// ---------------------------------------------------------------------------
// Intraday alert fixtures (never DANGER)
// ---------------------------------------------------------------------------

function intradayAlertItems(): IntradayAlertPayload[] {
  return [
    {
      alertId: "fixture-alert-1",
      createdAt: FIXTURE_TS,
      marketSession: "INTRADAY",
      alertLevel: "WATCH",
      alertType: "MARKET_SURGE",
      scope: "MARKET",
      symbol: null,
      stockName: null,
      sectorName: "AI 伺服器（fixture）",
      marketIndex: null,
      currentPrice: null,
      currentIndex: null,
      changePoints: null,
      changePercent: null,
      windowMinutes: 5,
      triggerReason: `illustrative fixture only；${FX}。`,
      impactSummary: `fixture sample，非即時資料。`,
      holdingImpact: null,
      suggestedObservation: "等待 10:30 結構確認；不是買賣指令。",
      dataQualityStatus: "WARNING",
      sourceMode: "fixture",
      sourceName: "Fixture only",
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
    {
      alertId: "fixture-alert-2",
      createdAt: FIXTURE_TS,
      marketSession: "INTRADAY",
      alertLevel: "WARNING",
      alertType: "HOLDING_CRASH",
      scope: "HOLDING",
      symbol: "3019",
      stockName: `亞光（${FX}）`,
      sectorName: null,
      marketIndex: null,
      currentPrice: null,
      currentIndex: null,
      changePoints: null,
      changePercent: null,
      windowMinutes: 5,
      triggerReason: `illustrative fixture only；${FX}。`,
      impactSummary: `fixture sample，非即時資料。`,
      holdingImpact: "接近防守區（fixture 範例）。",
      suggestedObservation: "觀察是否守住支撐；Intraday Alert 不等於出場。",
      dataQualityStatus: "WARNING",
      sourceMode: "fixture",
      sourceName: "Fixture only",
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// Portfolio risk fixtures
// ---------------------------------------------------------------------------

function portfolioRiskItems(): WarRoomPortfolioRiskItem[] {
  return [
    {
      stockId: "3019",
      stockName: `亞光（${FX}）`,
      valuationTier: "資料不足",
      alertLevel: "WATCH",
      holdingImpact: "接近防守區（fixture 範例）。",
      observationSummary: `illustrative fixture only；${FX}。`,
      dataQualityStatus: "WARNING",
    },
    {
      stockId: "4966",
      stockName: `譜瑞-KY（${FX}）`,
      valuationTier: "資料不足",
      alertLevel: "INFO",
      holdingImpact: null,
      observationSummary: `illustrative fixture only；${FX}。`,
      dataQualityStatus: "WARNING",
    },
    {
      stockId: "2743",
      stockName: `山富（${FX}）`,
      valuationTier: "資料不足",
      alertLevel: "WARNING",
      holdingImpact: "觀察是否跌破防守區（fixture 範例）。",
      observationSummary: `illustrative fixture only；${FX}。`,
      dataQualityStatus: "DATA_INSUFFICIENT",
    },
  ];
}

// ---------------------------------------------------------------------------
// Avoid list fixtures
// ---------------------------------------------------------------------------

function avoidItems(): WarRoomAvoidItem[] {
  return [
    {
      stockId: null,
      stockName: null,
      reason: `風控提醒：market regime 偏弱（fixture 範例），不是賣出指令；${FX}。`,
      sourceEngine: "War Room aggregate (four engines)",
      dataQualityStatus: "WARNING",
      notExitSignal: true,
      notTradeAdvice: true,
    },
    {
      stockId: "5347",
      stockName: `世界（${FX}）`,
      reason: `風控提醒：資料不足、supportZone 不明確（fixture 範例），不代表必須出場；${FX}。`,
      sourceEngine: "Technical + Risk Reward Strategy Engine",
      dataQualityStatus: "DATA_INSUFFICIENT",
      notExitSignal: true,
      notTradeAdvice: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// Observation point fixtures
// ---------------------------------------------------------------------------

function observationPoints(): WarRoomObservationPoint[] {
  const make = (
    pointId: string,
    title: string,
    sourceEngine: string,
    observation: string,
    waitFor: string | null,
    quality: WarRoomObservationPoint["dataQualityStatus"],
  ): WarRoomObservationPoint => ({
    pointId,
    title,
    sourceEngine,
    observation: `${observation}（${FX}）`,
    waitFor,
    dataQualityStatus: quality,
    notTradeAdvice: true,
  });

  return [
    make("obs-1", "大盤結構", "Intraday Risk Crisis Alert Engine", "等待 10:30 是否站回關鍵結構", "10:30 結構確認", "WARNING"),
    make("obs-2", "持股防守", "Portfolio Valuation Engine", "等待站回防守區", "站回防守區", "WARNING"),
    make("obs-3", "技術量能", "Technical + Risk Reward Strategy Engine", "等待量縮回測", "量縮回測健康", "WARNING"),
    make("obs-4", "研究資料", "Institutional Research Center", "等待資料補齊與警報降級", "資料補齊", "DATA_INSUFFICIENT"),
  ];
}

// ---------------------------------------------------------------------------
// Source + data-quality summary fixtures
// ---------------------------------------------------------------------------

function sourceSummary(): WarRoomSourceSummary[] {
  return [
    {
      sourceName: "Portfolio Valuation Engine",
      sourceEngine: "Portfolio Valuation Engine",
      status: "WARNING",
      fallbackUsed: true,
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
    {
      sourceName: "Institutional Research Center",
      sourceEngine: "Institutional Research Center",
      status: "LICENSE_REQUIRED",
      fallbackUsed: true,
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
    {
      sourceName: "Technical + Risk Reward Strategy Engine",
      sourceEngine: "Technical + Risk Reward Strategy Engine",
      status: "WARNING",
      fallbackUsed: true,
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
    {
      sourceName: "Intraday Risk Crisis Alert Engine",
      sourceEngine: "Intraday Risk Crisis Alert Engine",
      status: "DATA_INSUFFICIENT",
      fallbackUsed: true,
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
  ];
}

function dataQualitySummary(): WarRoomDataQualitySummary {
  const sources = sourceSummary();
  const count = (s: WarRoomSourceSummary["status"]): number =>
    sources.filter((x) => x.status === s).length;
  return {
    overallStatus: "WARNING",
    passCount: 0,
    warningCount: Math.max(1, count("WARNING")),
    failCount: 0,
    dataInsufficientCount: Math.max(1, count("DATA_INSUFFICIENT")),
    licenseRequiredCount: count("LICENSE_REQUIRED"),
    // Fixture data can never authorise a high-confidence conclusion.
    highConfidenceConclusionAllowed: false,
  };
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic, fixture-only bundle for a given War Room mode. All
 * modes return fully-populated arrays so the UI shape is exercised; mode only
 * adjusts section emphasis notes. No DANGER level is ever produced.
 */
export function buildWarRoomEngineFixtureBundle(
  mode: WarRoomMode,
  generatedAt: string = FIXTURE_TS,
): WarRoomEngineFixtureBundle {
  const emphasis = `mode=${mode}｜${FX}`;

  const realtime = section("realtimeAlerts", "即時警報", "Intraday Risk Crisis Alert Engine");
  realtime.notes = [`${emphasis}`, "Intraday Alert 不等於出場；not trade advice。"];

  // V26: deterministic Position Strategy Plan fixtures (timestamps passed in).
  const positionBundle = buildPositionStrategyFixtureBundle({ generatedAt, mode });

  return {
    marketStatusLight: section("marketStatusLight", "市場狀態燈號", "Intraday Alert + Market Breadth"),
    realtimeAlerts: realtime,
    portfolioRiskRadar: section("portfolioRiskRadar", "持股風險雷達", "Portfolio Valuation Engine"),
    researchTopPicks: section("researchTopPicks", "研究 TOP5", "Institutional Research Center"),
    technicalRiskRewardCandidates: section(
      "technicalRiskRewardCandidates",
      "低檔高風報比候選",
      "Technical + Risk Reward Strategy Engine",
    ),
    avoidList: section("avoidList", "禁碰 / 避開清單", "War Room aggregate (four engines)"),
    nextObservationPoints: section("nextObservationPoints", "下一步觀察點", "War Room aggregate"),
    portfolioRiskItems: portfolioRiskItems(),
    researchTopPickItems: researchTopPickItems(),
    technicalCandidateItems: technicalCandidateItems(),
    intradayAlertItems: intradayAlertItems(),
    avoidItems: avoidItems(),
    observationPoints: observationPoints(),
    sourceSummary: sourceSummary(),
    dataQualitySummary: dataQualitySummary(),
    positionStrategyPlans: positionBundle.plans,
    entryObservationPlans: positionBundle.entryObservationPlans,
    holdingDefensePlans: positionBundle.holdingDefensePlans,
    profitProtectionPlans: positionBundle.profitProtectionPlans,
    riskReductionPlans: positionBundle.riskReductionPlans,
    positionNoTouchPlans: positionBundle.noTouchPlans,
    positionDataInsufficientPlans: positionBundle.dataInsufficientPlans,
  };
}
