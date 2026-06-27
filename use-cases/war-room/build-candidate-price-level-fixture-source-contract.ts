/**
 * Candidate Price Level Fixture Source Contract Builder — V64
 *
 * Pure deterministic builder. Owns the canonical fixture price-level descriptors
 * that the V63 structured trade plan builder consumes (the price levels are no
 * longer hand-written inside the V63 builder). Also defines the future real quote
 * mapping boundary — which is NEVER crossed here.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no /api/portfolio switch; no buy/sell command; no auto order
 *   - realMappingStatus stays NOT_CONNECTED; manual sign-off flags are never flipped
 */

import { buildAllenScoreScoringModelContract } from "./build-allen-score-scoring-model-contract";
import {
  CANDIDATE_PRICE_LEVEL_FIXTURE_SOURCE_CONTRACT_NAME,
  CANDIDATE_PRICE_LEVEL_FIXTURE_SOURCE_SAFETY_LABELS,
} from "./candidate-price-level-fixture-source-contract";
import type {
  CandidatePriceLevelDescriptor,
  CandidatePriceLevelFixtureSource,
  CandidatePriceLevelFixtureSourceBundle,
  CandidatePriceLevelFixtureSourceValidation,
  CandidatePriceLevelMappingBoundary,
} from "./candidate-price-level-fixture-source-contract";
import type { TradePlanConfidence } from "./structured-candidate-trade-plan-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const FIXTURE_AS_OF = "fixture as-of：未連真實報價（fixture/mock，無實際成交時間）";
const SOURCE_LABEL = "fixture/mock price levels（contract-defined）";

export interface BuildCandidatePriceLevelFixtureSourceContractInput {
  generatedAt?: string;
}

interface DescriptorSeed {
  symbol: string;
  name: string;
  sourceDescription: string;
  confidence: TradePlanConfidence;
  buyZoneLower: number;
  buyZoneUpper: number;
  stopLossLower: number;
  stopLossUpper: number;
  targetLower: number;
  targetUpper: number;
}

/**
 * Canonical fixture price levels — the single source of truth for the V63
 * structured trade plans. These are fixture/mock numbers only; realMappingStatus
 * stays NOT_CONNECTED until a future real quote source crosses the mapping boundary.
 */
const DESCRIPTOR_SEEDS: DescriptorSeed[] = [
  { symbol: "A100", name: "A 級 sample 甲", sourceDescription: "回測 5MA 承接區（fixture）", confidence: "medium", buyZoneLower: 100, buyZoneUpper: 105, stopLossLower: 94, stopLossUpper: 98, targetLower: 112, targetUpper: 120 },
  { symbol: "A101", name: "A 級 sample 乙", sourceDescription: "回測 10MA 承接區（fixture）", confidence: "medium", buyZoneLower: 50, buyZoneUpper: 53, stopLossLower: 46, stopLossUpper: 48.5, targetLower: 58, targetUpper: 64 },
  { symbol: "B200", name: "B 級 sample 丙", sourceDescription: "回測季線承接區（fixture）", confidence: "low", buyZoneLower: 200, buyZoneUpper: 210, stopLossLower: 188, stopLossUpper: 196, targetLower: 224, targetUpper: 240 },
  { symbol: "C300", name: "C 級 sample 丁", sourceDescription: "型態待完成，暫估承接區（fixture）", confidence: "low", buyZoneLower: 75, buyZoneUpper: 78, stopLossLower: 70, stopLossUpper: 73.5, targetLower: 83, targetUpper: 88 },
];

function toDescriptor(seed: DescriptorSeed): CandidatePriceLevelDescriptor {
  return {
    symbol: seed.symbol,
    name: seed.name,
    sourceType: "fixture_mock",
    sourceLabel: SOURCE_LABEL,
    sourceDescription: seed.sourceDescription,
    fixtureAsOfText: FIXTURE_AS_OF,
    currency: "TWD",
    buyZoneLower: seed.buyZoneLower,
    buyZoneUpper: seed.buyZoneUpper,
    stopLossLower: seed.stopLossLower,
    stopLossUpper: seed.stopLossUpper,
    targetLower: seed.targetLower,
    targetUpper: seed.targetUpper,
    confidence: seed.confidence,
    operationalUseAllowed: false,
    realMappingStatus: "NOT_CONNECTED",
    futureRealSourceAllowed: false,
    generatedBuySellCommand: false,
    autoOrderRequested: false,
  };
}

function buildMappingBoundary(): CandidatePriceLevelMappingBoundary {
  return {
    realSourceCandidateName: "（未指定）future authorized TW quote source",
    expectedRealFields: ["symbol", "lastPrice", "prevClose", "intradayHigh", "intradayLow", "volume", "asOfTimestamp"],
    mappingNotConnectedReason: "尚未授權真實報價來源、尚未完成 manual sign-off、尚未通過 staging read-only review；fixture 區間不可作為正式操作依據。",
    requiredEvidenceBeforeConnection: [
      "authorized real quote source 名稱與授權範圍",
      "staging read-only connection review 通過紀錄",
      "manual sign-off evidence（人工簽核）",
      "fixture vs real shadow comparison 一致性結果",
    ],
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    stagingReadOnlyRequired: true,
    productionSwitchAllowed: false,
  };
}

function validateDescriptor(
  d: CandidatePriceLevelDescriptor,
  candidateSymbols: Set<string>,
): CandidatePriceLevelFixtureSourceValidation {
  const mapsToExistingCandidate = candidateSymbols.has(d.symbol);
  const sourceTypeFixtureMock = d.sourceType === "fixture_mock";
  const realMappingNotConnected = d.realMappingStatus === "NOT_CONNECTED";
  const operationalUseDisallowed = d.operationalUseAllowed === false;
  const futureRealSourceDisallowed = d.futureRealSourceAllowed === false;
  const noBuySellCommand = d.generatedBuySellCommand === false;
  const noAutoOrder = d.autoOrderRequested === false;
  const buyZoneOrdered = d.buyZoneLower <= d.buyZoneUpper;
  const stopBelowBuyZone = d.stopLossUpper < d.buyZoneLower;
  const targetAboveBuyZone = d.targetLower > d.buyZoneUpper;

  const valid =
    mapsToExistingCandidate &&
    sourceTypeFixtureMock &&
    realMappingNotConnected &&
    operationalUseDisallowed &&
    futureRealSourceDisallowed &&
    noBuySellCommand &&
    noAutoOrder &&
    buyZoneOrdered &&
    stopBelowBuyZone &&
    targetAboveBuyZone;

  return {
    symbol: d.symbol,
    mapsToExistingCandidate,
    sourceTypeFixtureMock,
    realMappingNotConnected,
    operationalUseDisallowed,
    futureRealSourceDisallowed,
    noBuySellCommand,
    noAutoOrder,
    buyZoneOrdered,
    stopBelowBuyZone,
    targetAboveBuyZone,
    valid,
  };
}

/**
 * Builds the candidate price level fixture source bundle. Reads no clock, no env,
 * no network — only the contract-defined fixture descriptors, cross-checked against
 * the existing V61/V62 candidate symbols.
 */
export function buildCandidatePriceLevelFixtureSourceContract(
  input: BuildCandidatePriceLevelFixtureSourceContractInput = {},
): CandidatePriceLevelFixtureSourceBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const model = buildAllenScoreScoringModelContract({ generatedAt });
  const candidateSymbols = new Set(model.dailyPools.flatMap((p) => p.candidates).map((c) => c.symbol));

  const descriptors = DESCRIPTOR_SEEDS.map(toDescriptor);
  const validations = descriptors.map((d) => validateDescriptor(d, candidateSymbols));
  const allValid = validations.every((v) => v.valid);

  const source: CandidatePriceLevelFixtureSource = {
    sourceType: "fixture_mock",
    sourceLabel: SOURCE_LABEL,
    sourceDescription: "Structured trade plan 的承接區 / 失效防守區 / 目標觀察區價位來源；fixture/mock，未連真實報價。",
    fixtureAsOfText: FIXTURE_AS_OF,
    realMappingStatus: "NOT_CONNECTED",
    futureRealSourceAllowed: false,
    operationalUseAllowed: false,
  };

  return {
    contractVersion: "V64",
    contractName: CANDIDATE_PRICE_LEVEL_FIXTURE_SOURCE_CONTRACT_NAME,
    generatedAt,
    decision: allValid ? "READY_FOR_UI_REVIEW" : "NO_GO",

    source,
    descriptors,
    mappingBoundary: buildMappingBoundary(),
    validations,
    allValid,

    fixtureOnly: true,
    operationalUseAllowed: false,
    realDataConnected: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionTradingReady: false,

    safetyLabels: [...CANDIDATE_PRICE_LEVEL_FIXTURE_SOURCE_SAFETY_LABELS],
  };
}

/** Descriptor lookup by symbol — used by the V63 builder to source price levels. */
export function buildCandidatePriceLevelDescriptorMap(
  input: BuildCandidatePriceLevelFixtureSourceContractInput = {},
): Map<string, CandidatePriceLevelDescriptor> {
  const bundle = buildCandidatePriceLevelFixtureSourceContract(input);
  return new Map(bundle.descriptors.map((d) => [d.symbol, d] as const));
}
