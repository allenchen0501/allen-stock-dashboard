/**
 * Institutional Research Center Contract — V18D
 *
 * Read-model TypeScript contract for the Institutional Research Center.
 * This file contains TYPES ONLY. It declares no runtime, performs no fetch,
 * imports no Supabase client, and reads no environment keys.
 *
 * The Research Center answers "which stocks are worth deeper research". It does
 * NOT answer "can I enter now". It does not produce buy points, does not produce
 * buy/sell commands, does not fabricate FactSet / consensus / broker target
 * prices, and does not render PNG / PDF / HTML cards.
 *
 * Licensed data (FactSet estimates / consensus / broker target prices) require a
 * license. When unavailable, coverage must be LICENSE_REQUIRED and the value
 * must stay null — never fabricated.
 *
 * See: docs/institutional-research-center-spec.md
 * See: docs/war-room-intelligence-architecture.md
 */

export type ResearchCoverageStatus =
  | "AVAILABLE"
  | "DATA_INSUFFICIENT"
  | "LICENSE_REQUIRED"
  | "SOURCE_CONFLICT"
  | "STALE"
  | "NOT_COVERED";

export type ResearchDataQualityStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "DATA_INSUFFICIENT"
  | "LICENSE_REQUIRED";

export type ResearchRating =
  | "S+"
  | "S"
  | "A+"
  | "A"
  | "B"
  | "C"
  | "DATA_INSUFFICIENT";

export type ResearchScoreFactor =
  | "EPS_GROWTH"
  | "TARGET_PRICE_UPSIDE"
  | "EARNINGS_CALL_OUTLOOK"
  | "AI_DIRECT_BENEFIT"
  | "REVENUE_EARNINGS_SUPPORT"
  | "PULLBACK_NOT_DEMAND_DECAY"
  | "UPSIDE_VS_RISK"
  | "INDUSTRY_LEADERSHIP";

export type AiSupplyChainTag =
  | "GB200_GB300"
  | "AI_SERVER"
  | "ASIC"
  | "CPO"
  | "OPTICAL_COMMUNICATION"
  | "COWOS"
  | "ADVANCED_PACKAGING"
  | "LIQUID_COOLING"
  | "THERMAL_MODULE"
  | "HIGH_SPEED_TRANSMISSION"
  | "PCB"
  | "CCL"
  | "MEMORY"
  | "ROBOT"
  | "EDGE_AI"
  | "PC_NB_AI"
  | "SYSTEM_INTEGRATION"
  | "DATA_INSUFFICIENT";

export type AiBenefitLevel =
  | "DIRECT"
  | "INDIRECT"
  | "THEMATIC"
  | "WEAK"
  | "DATA_INSUFFICIENT";

export type PullbackReasonType =
  | "CHIP_ADJUSTMENT"
  | "MARKET_WIDE_PULLBACK"
  | "INSTITUTIONAL_ROTATION"
  | "SECTOR_NOISE"
  | "FUNDAMENTAL_COOLING"
  | "DEMAND_DECAY"
  | "EARNINGS_RISK"
  | "DATA_INSUFFICIENT";

export interface ResearchUniverseInput {
  inputId: string;
  sourceType:
    | "UPLOADED_IMAGE"
    | "PASTED_TEXT"
    | "MANUAL_LIST"
    | "WATCHLIST"
    | "PORTFOLIO"
    | "SECTOR_BASKET";
  symbols: string[];
  createdAt: string;
  requestPerformed: false;
}

export interface ResearchFactorScore {
  factor: ResearchScoreFactor;
  stars: 0 | 1 | 2 | 3 | 4 | 5;
  reason: string;
  dataQualityStatus: ResearchDataQualityStatus;
}

export interface ResearchStockSnapshot {
  stockId: string;
  stockName: string;
  market: string;
  latestClose: number | null;
  latestCloseDate: string | null;
  marketCap: number | null;
  targetPriceLow: number | null;
  targetPriceHigh: number | null;
  targetPriceAverage: number | null;
  targetPriceSourceStatus: ResearchCoverageStatus;
  potentialUpsidePercent: number | null;
  eps2025E: number | null;
  eps2026E: number | null;
  eps2027E: number | null;
  epsGrowth2026YoY: number | null;
  epsGrowth2027YoY: number | null;
  latestMonthlyRevenue: number | null;
  previousMonthlyRevenue: number | null;
  latestMonthlyRevenueYoY: number | null;
  latestMonthlyRevenueMoM: number | null;
  previousMonthlyRevenueYoY: number | null;
  previousMonthlyRevenueMoM: number | null;
  cumulativeRevenue: number | null;
  cumulativeRevenueYoY: number | null;
  earningsCallSummary: string | null;
  earningsCallDate: string | null;
  aiSupplyChainTags: AiSupplyChainTag[];
  aiBenefitLevel: AiBenefitLevel;
  industryPosition: string | null;
  globalMarketShare: string | null;
  competitors: string[];
  pullbackReason: PullbackReasonType;
  bullishFactors: string[];
  riskFactors: string[];
  factorScores: ResearchFactorScore[];
  totalResearchScore: number | null;
  researchRating: ResearchRating;
  dataQualityStatus: ResearchDataQualityStatus;
  sourceMode: "spec_only" | "fixture" | "licensed_runtime_candidate";
  sourceNames: string[];
  asOfDate: string | null;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

export interface ResearchTopPick {
  rank: number;
  stock: ResearchStockSnapshot;
  rankingReason: string;
  notEntrySignal: true;
}

export interface ResearchCardSpec {
  width: 1080;
  height: 1920;
  format: "MOBILE_FULL_SCREEN";
  oneStockPerPage: true;
  renderPerformed: false;
  exportPerformed: false;
}
