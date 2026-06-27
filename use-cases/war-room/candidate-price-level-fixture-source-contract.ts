/**
 * Candidate Price Level Fixture Source Descriptor & Mapping Boundary Contract — V64
 *
 * Read-model TypeScript contract that extracts the structured trade plan's fixture
 * price levels (previously a hand-written PRICE_LEVELS map inside the V63 builder)
 * into an explicit fixture SOURCE descriptor, and defines the boundary that a
 * FUTURE real quote source would have to cross before it could ever replace the
 * fixture. TYPES + static CONSTANTS ONLY. No runtime, no fetch, no Supabase client,
 * no env reads, no clock reads, no DB writes.
 *
 * Everything here is fixture/mock and NOT operational data: sourceType is always
 * "fixture_mock", realMappingStatus is always "NOT_CONNECTED", operationalUseAllowed
 * and futureRealSourceAllowed are always false. Crossing the mapping boundary
 * requires a manual sign-off that is NOT completed here (manualSignoffCompleted =
 * false) and staging read-only review (stagingReadOnlyRequired = true) — this
 * contract never flips those.
 *
 * See: docs/candidate-price-level-fixture-source.md
 */

import type { TradePlanConfidence } from "./structured-candidate-trade-plan-contract";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RealMappingStatus = "NOT_CONNECTED";

/** Source-level metadata describing where these price levels come from. */
export interface CandidatePriceLevelFixtureSource {
  sourceType: "fixture_mock";
  sourceLabel: string;
  sourceDescription: string;
  fixtureAsOfText: string;
  realMappingStatus: RealMappingStatus;
  futureRealSourceAllowed: false;
  operationalUseAllowed: false;
}

/** Per-candidate fixture price level descriptor. */
export interface CandidatePriceLevelDescriptor {
  symbol: string;
  name: string;
  sourceType: "fixture_mock";
  sourceLabel: string;
  sourceDescription: string;
  fixtureAsOfText: string;
  currency: "TWD";
  buyZoneLower: number;
  buyZoneUpper: number;
  stopLossLower: number;
  stopLossUpper: number;
  targetLower: number;
  targetUpper: number;
  confidence: TradePlanConfidence;
  operationalUseAllowed: false;
  realMappingStatus: RealMappingStatus;
  futureRealSourceAllowed: false;
  generatedBuySellCommand: false;
  autoOrderRequested: false;
}

/** The boundary a future real quote source must cross — never crossed here. */
export interface CandidatePriceLevelMappingBoundary {
  realSourceCandidateName: string;
  expectedRealFields: string[];
  mappingNotConnectedReason: string;
  requiredEvidenceBeforeConnection: string[];
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  stagingReadOnlyRequired: true;
  productionSwitchAllowed: false;
}

export interface CandidatePriceLevelFixtureSourceValidation {
  symbol: string;
  mapsToExistingCandidate: boolean;
  sourceTypeFixtureMock: boolean;
  realMappingNotConnected: boolean;
  operationalUseDisallowed: boolean;
  futureRealSourceDisallowed: boolean;
  noBuySellCommand: boolean;
  noAutoOrder: boolean;
  buyZoneOrdered: boolean;
  stopBelowBuyZone: boolean;
  targetAboveBuyZone: boolean;
  valid: boolean;
}

export interface CandidatePriceLevelFixtureSourceBundle {
  contractVersion: "V64";
  contractName: "Trade Plan Fixture Source Descriptor";
  generatedAt: string;
  decision: "READY_FOR_UI_REVIEW" | "NO_GO";

  source: CandidatePriceLevelFixtureSource;
  descriptors: CandidatePriceLevelDescriptor[];
  mappingBoundary: CandidatePriceLevelMappingBoundary;
  validations: CandidatePriceLevelFixtureSourceValidation[];
  allValid: boolean;

  // Locked safety flags.
  fixtureOnly: true;
  operationalUseAllowed: false;
  realDataConnected: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionTradingReady: false;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CANDIDATE_PRICE_LEVEL_FIXTURE_SOURCE_CONTRACT_VERSION = "V64" as const;

export const CANDIDATE_PRICE_LEVEL_FIXTURE_SOURCE_CONTRACT_NAME = "Trade Plan Fixture Source Descriptor" as const;

export const CANDIDATE_PRICE_LEVEL_FIXTURE_SOURCE_SAFETY_LABELS = [
  "Trade Plan Fixture Source Descriptor",
  "Candidate Price Level Descriptor",
  "Mapping Boundary",
  "fixture-only",
  "deterministic contract",
  "fixture_mock",
  "realMappingStatus = NOT_CONNECTED",
  "未連真實報價",
  "fixture 區間不可作為正式操作依據",
  "futureRealSourceAllowed false",
  "operationalUseAllowed false",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "stagingReadOnlyRequired true",
  "productionSwitchAllowed false",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no fetch",
  "no real market data",
  "no API route",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
] as const;
