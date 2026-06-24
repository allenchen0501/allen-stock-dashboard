/**
 * War Room Read Model Contract Builder — V20 contract / V22 fixture adapters
 *
 * Pure builder. Returns a WarRoomIntelligenceSnapshot-shaped payload for the
 * /api/war-room contract endpoint. As of V22 it sources its section/item data
 * from the deterministic fixture adapters (buildWarRoomEngineFixtureBundle) so
 * the UI can render a non-empty shape.
 *
 * The API contract version stays V20; fixtureAdapterVersion records the V22
 * fixture layer. responseSource stays mock_or_contract; sourceMode is now
 * "fixture". This is NOT real market data and NOT investment advice.
 *
 * Constraints (enforced by the V20 + V22 checkers):
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No runtime builder import (no buildPortfolioValuationSummaryContract)
 *   - No data writes
 *   - No buy/sell commands; no DANGER level in fixture mode
 *   - highConfidenceConclusionAllowed stays false
 */

import type {
  WarRoomAlertLevel,
  WarRoomIntelligenceSnapshot,
  WarRoomMarketStatus,
  WarRoomMode,
} from "./war-room-intelligence-contract";
import { buildWarRoomEngineFixtureBundle } from "./war-room-engine-fixture-adapters";

export interface BuildWarRoomReadModelContractInput {
  mode?: string | null;
  generatedAt?: string;
}

export interface BuildWarRoomReadModelContractOutput
  extends WarRoomIntelligenceSnapshot {
  apiContractVersion: "V20";
  responseSource: "mock_or_contract";
  sourceMode: "fixture";
  fixtureAdapterVersion: "V22";
  positionStrategyFixtureVersion: "V26";
}

const VALID_MODES: readonly WarRoomMode[] = [
  "PREMARKET",
  "INTRADAY",
  "POSTMARKET",
  "REALTIME_ALERT",
];

function normalizeMode(mode: string | null | undefined): WarRoomMode {
  if (mode != null && (VALID_MODES as readonly string[]).includes(mode)) {
    return mode as WarRoomMode;
  }
  // Invalid / missing mode never throws — it falls back to PREMARKET.
  return "PREMARKET";
}

// Market status & primary alert are fixture-only and never DANGER.
function marketStatusFor(mode: WarRoomMode): WarRoomMarketStatus {
  switch (mode) {
    case "INTRADAY":
    case "REALTIME_ALERT":
      return "DEFENSIVE";
    default:
      return "NEUTRAL";
  }
}

function primaryAlertFor(mode: WarRoomMode): WarRoomAlertLevel {
  switch (mode) {
    case "INTRADAY":
    case "REALTIME_ALERT":
      return "WARNING";
    default:
      return "WATCH";
  }
}

/**
 * Builds a fixture-backed War Room read model snapshot. Item arrays are
 * non-empty (sourced from the V22 fixture adapters), every section is at most
 * WARNING, and the read-only invariant flags are literal false.
 */
export function buildWarRoomReadModelContract(
  input: BuildWarRoomReadModelContractInput = {},
): BuildWarRoomReadModelContractOutput {
  const warRoomMode = normalizeMode(input.mode);
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  const bundle = buildWarRoomEngineFixtureBundle(warRoomMode, generatedAt);

  return {
    snapshotId: `war-room-${warRoomMode}-fixture`,
    generatedAt,
    warRoomMode,
    marketStatus: marketStatusFor(warRoomMode),
    primaryAlertLevel: primaryAlertFor(warRoomMode),

    marketStatusLight: bundle.marketStatusLight,
    realtimeAlerts: bundle.realtimeAlerts,
    portfolioRiskRadar: bundle.portfolioRiskRadar,
    researchTopPicks: bundle.researchTopPicks,
    technicalRiskRewardCandidates: bundle.technicalRiskRewardCandidates,
    avoidList: bundle.avoidList,
    nextObservationPoints: bundle.nextObservationPoints,

    portfolioRiskItems: bundle.portfolioRiskItems,
    researchTopPickItems: bundle.researchTopPickItems,
    technicalCandidateItems: bundle.technicalCandidateItems,
    intradayAlertItems: bundle.intradayAlertItems,
    avoidItems: bundle.avoidItems,
    observationPoints: bundle.observationPoints,

    // V26: Position Strategy Plan fixture integration.
    positionStrategyPlans: bundle.positionStrategyPlans,
    entryObservationPlans: bundle.entryObservationPlans,
    holdingDefensePlans: bundle.holdingDefensePlans,
    profitProtectionPlans: bundle.profitProtectionPlans,
    riskReductionPlans: bundle.riskReductionPlans,
    positionNoTouchPlans: bundle.positionNoTouchPlans,
    positionDataInsufficientPlans: bundle.positionDataInsufficientPlans,

    sourceSummary: bundle.sourceSummary,
    dataQualitySummary: bundle.dataQualitySummary,

    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,

    apiContractVersion: "V20",
    responseSource: "mock_or_contract",
    sourceMode: "fixture",
    fixtureAdapterVersion: "V22",
    positionStrategyFixtureVersion: "V26",
  };
}
