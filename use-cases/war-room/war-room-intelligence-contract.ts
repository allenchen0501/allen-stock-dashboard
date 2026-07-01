/**
 * War Room Intelligence Contract — V18C (extended in V19)
 *
 * Read-model TypeScript contract for the War Room Intelligence Architecture and
 * the V19 War Room Read Model Contract. This file contains TYPES ONLY. It
 * declares no runtime, performs no fetch, imports no Supabase client, reads no
 * environment keys, and imports no runtime builder.
 *
 * The War Room is a read-only aggregation layer. It does not own data, does not
 * compute valuation formulas, does not produce technical scores, does not
 * produce institutional ratings, does not produce intraday alerts, and does not
 * produce buy/sell commands. It only integrates already-verified engine outputs.
 *
 * V19 extends this contract to converge the four input engines via type-only
 * imports:
 *   - Institutional Research Center      → ResearchTopPick
 *   - Technical + Risk Reward Strategy   → TechnicalRiskRewardCandidate
 *   - Intraday Risk Crisis Alert         → IntradayAlertPayload
 *   - Portfolio Valuation Engine         → local WarRoomPortfolioRiskItem
 *
 * See: docs/war-room-intelligence-architecture.md
 * See: docs/war-room-read-model-contract.md
 */

import type { ResearchTopPick } from "../research/research-center-contract";
import type { TechnicalRiskRewardCandidate } from "../technical-strategy/technical-risk-reward-contract";
import type { IntradayAlertPayload } from "../intraday-alert/intraday-alert-contract";
import type { PositionStrategyPlan } from "../position-strategy/position-strategy-plan-contract";
import type { HorsepowerStock } from "./build-17-horsepower-scanner-contract";

/**
 * Read-only surface of the fixture-only Allen 17-Line Power Score v1.1 scanner.
 * The War Room only SURFACES the scanner output — it is a multi-timeframe trend-
 * strength screener, not a trade signal / buy point / order command.
 */
export interface WarRoomHorsepowerScannerSummary {
  fixtureVersion: "V1_1";
  modelName: "Allen 17-Line Power Score v1.1";
  totalStocks: number;
  effectiveAttackCount: number;
  strongButOverheatedCount: number;
  overheatedCount: number;
  notTradeAdvice: true;
  notEntrySignal: true;
}

export type WarRoomMode =
  | "PREMARKET"
  | "INTRADAY"
  | "POSTMARKET"
  | "REALTIME_ALERT";

export type WarRoomMarketStatus =
  | "BULLISH"
  | "NEUTRAL"
  | "DEFENSIVE"
  | "RISK_OFF"
  | "DANGER"
  | "DATA_INSUFFICIENT";

export type WarRoomAlertLevel =
  | "INFO"
  | "WATCH"
  | "WARNING"
  | "DANGER"
  | "DATA_INSUFFICIENT";

// Extended in V19 to include LICENSE_REQUIRED (Research-sourced sections only).
export type WarRoomDataQualityStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "DATA_INSUFFICIENT"
  | "LICENSE_REQUIRED";

/**
 * Canonical ordered list of the seven War Room display zones. Useful for UI
 * iteration in future versions; declares no runtime behaviour here.
 */
export const WAR_ROOM_SECTION_IDS = [
  "marketStatusLight",
  "realtimeAlerts",
  "portfolioRiskRadar",
  "researchTopPicks",
  "technicalRiskRewardCandidates",
  "avoidList",
  "nextObservationPoints",
] as const;

export type WarRoomSectionId = (typeof WAR_ROOM_SECTION_IDS)[number];

/**
 * Describes whether a single War Room display zone can render, and at what
 * data-quality confidence. When `dataQualityStatus` is not 'PASS', the zone
 * must be degraded — never upgraded to a high-confidence conclusion.
 *
 * V19 adds `unavailableReason` and `warnings`.
 */
export interface WarRoomSectionAvailability {
  sectionId: WarRoomSectionId | string;
  title: string;
  sourceEngine: string;
  available: boolean;
  dataQualityStatus: WarRoomDataQualityStatus;
  fallbackUsed: boolean;
  unavailableReason: string | null;
  warnings: string[];
  notes: string[];
}

/**
 * Per-source provenance for the read model. The three literal-false flags are
 * permanent read-only invariants — the read model never requests, connects, or
 * writes.
 */
export interface WarRoomSourceSummary {
  sourceName: string;
  sourceEngine: string;
  status: WarRoomDataQualityStatus;
  fallbackUsed: boolean;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

/**
 * Aggregated data-quality roll-up across all sources. `highConfidenceConclusionAllowed`
 * may only be true when every required source is PASS.
 */
export interface WarRoomDataQualitySummary {
  overallStatus: WarRoomDataQualityStatus;
  passCount: number;
  warningCount: number;
  failCount: number;
  dataInsufficientCount: number;
  licenseRequiredCount: number;
  highConfidenceConclusionAllowed: boolean;
}

/**
 * One portfolio holding risk row, aggregated from the Valuation Engine and the
 * Intraday Alert Engine. The read model never derives stop-loss, target price,
 * or actionSignal from these fields.
 */
export interface WarRoomPortfolioRiskItem {
  stockId: string;
  stockName: string;
  valuationTier: string | null;
  alertLevel: WarRoomAlertLevel;
  holdingImpact: string | null;
  observationSummary: string;
  dataQualityStatus: WarRoomDataQualityStatus;
}

/**
 * One avoid / no-touch entry. `notExitSignal` and `notTradeAdvice` are literal
 * true to encode that this is a risk-control reminder, never a sell command.
 */
export interface WarRoomAvoidItem {
  stockId: string | null;
  stockName: string | null;
  reason: string;
  sourceEngine: string;
  dataQualityStatus: WarRoomDataQualityStatus;
  notExitSignal: true;
  notTradeAdvice: true;
}

/**
 * One next-observation point. Always an observation, never an immediate action;
 * `notTradeAdvice` is literal true.
 */
export interface WarRoomObservationPoint {
  pointId: string;
  title: string;
  sourceEngine: string;
  observation: string;
  waitFor: string | null;
  dataQualityStatus: WarRoomDataQualityStatus;
  notTradeAdvice: true;
}

/**
 * A single read-only War Room snapshot. Aggregates already-verified engine
 * outputs into the seven display zones plus the converged item arrays. Never
 * writes, never requests, never connects to Supabase — enforced by the
 * literal-false flags below.
 */
export interface WarRoomIntelligenceSnapshot {
  snapshotId: string;
  generatedAt: string;
  warRoomMode: WarRoomMode;
  marketStatus: WarRoomMarketStatus;
  primaryAlertLevel: WarRoomAlertLevel;

  // Seven core display zones (see Section D of the read-model contract doc).
  marketStatusLight: WarRoomSectionAvailability;
  realtimeAlerts: WarRoomSectionAvailability;
  portfolioRiskRadar: WarRoomSectionAvailability;
  researchTopPicks: WarRoomSectionAvailability;
  technicalRiskRewardCandidates: WarRoomSectionAvailability;
  avoidList: WarRoomSectionAvailability;
  nextObservationPoints: WarRoomSectionAvailability;

  // Converged item arrays sourced from the four input engines (type-only).
  portfolioRiskItems: WarRoomPortfolioRiskItem[];
  researchTopPickItems: ResearchTopPick[];
  technicalCandidateItems: TechnicalRiskRewardCandidate[];
  intradayAlertItems: IntradayAlertPayload[];
  avoidItems: WarRoomAvoidItem[];
  observationPoints: WarRoomObservationPoint[];

  // V26: Position Strategy Plan fixture integration (read-only). The War Room is
  // still a read model — it does not create plans, it only surfaces the Position
  // Strategy Fixture Adapter's output.
  positionStrategyPlans: PositionStrategyPlan[];
  entryObservationPlans: PositionStrategyPlan[];
  holdingDefensePlans: PositionStrategyPlan[];
  profitProtectionPlans: PositionStrategyPlan[];
  riskReductionPlans: PositionStrategyPlan[];
  positionNoTouchPlans: PositionStrategyPlan[];
  positionDataInsufficientPlans: PositionStrategyPlan[];
  positionStrategyFixtureVersion: "V26";

  // Allen 17-Line Power Score v1.1 fixture-only scanner (read-only surface).
  horsepowerScannerItems: HorsepowerStock[];
  horsepowerScannerSummary: WarRoomHorsepowerScannerSummary;
  horsepowerScannerFixtureVersion: "V1_1";

  // Provenance + roll-up.
  sourceSummary: WarRoomSourceSummary[];
  dataQualitySummary: WarRoomDataQualitySummary;

  // Permanent read-model safety invariants.
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}
