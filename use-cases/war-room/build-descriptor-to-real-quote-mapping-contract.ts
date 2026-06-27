/**
 * Descriptor-to-Real Quote Mapping Readiness Matrix Builder — V65
 *
 * Pure deterministic builder. For every symbol that has BOTH a V64 fixture
 * descriptor and a V63 structured trade plan, it defines — spec-only — how future
 * real quote fields would map into the descriptor fields and then into the trade
 * plan fields, and self-validates that the mapping stays NOT_CONNECTED.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - realMappingStatus stays NOT_CONNECTED; sign-off / staging / production flags
 *     are NEVER flipped
 */

import { buildCandidatePriceLevelFixtureSourceContract } from "./build-candidate-price-level-fixture-source-contract";
import type { CandidatePriceLevelDescriptor } from "./candidate-price-level-fixture-source-contract";
import { buildStructuredCandidateTradePlanContract } from "./build-structured-candidate-trade-plan-contract";
import type { CandidateTradePlan } from "./structured-candidate-trade-plan-contract";
import {
  DESCRIPTOR_TO_REAL_QUOTE_MAPPING_SAFETY_LABELS,
  DESCRIPTOR_TO_REAL_QUOTE_MAPPING_SPEC_NAME,
} from "./descriptor-to-real-quote-mapping-contract";
import type {
  DescriptorFieldMapping,
  DescriptorToRealQuoteMappingItem,
  DescriptorToRealQuoteMappingMatrix,
  DescriptorToRealQuoteMappingReadinessValidation,
  RealQuoteExpectedField,
  TradePlanFieldMapping,
} from "./descriptor-to-real-quote-mapping-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildDescriptorToRealQuoteMappingContractInput {
  generatedAt?: string;
}

const REQUIRED_EVIDENCE: string[] = [
  "authorized real quote source 名稱與授權範圍",
  "staging read-only connection review 通過紀錄",
  "manual sign-off evidence（人工簽核）",
  "fixture vs real shadow comparison 一致性結果",
];

/** Expected future real quote fields (spec-only; never fetched). */
function buildExpectedRealFields(): RealQuoteExpectedField[] {
  const base = {
    required: true,
    dataFreshnessRequirement: "intraday delayed acceptable；stale 超時即降級（spec-only）",
    missingDataBehavior: "fallback to fixture_mock；標示 NOT_CONNECTED，不可作為正式操作依據",
    conflictBehavior: "來源衝突即降級為 NOT_CONNECTED，不 promote real，不切換 /api/portfolio",
    operationalUseAllowed: false as const,
  };
  return [
    { fieldName: "lastPrice", fieldCategory: "price", acceptableSources: ["real.lastPrice", "real.closePrice", "reference.close"], validationRule: "正數、currency=TWD", ...base },
    { fieldName: "closePrice", fieldCategory: "price", acceptableSources: ["real.closePrice", "reference.close"], validationRule: "正數、currency=TWD", ...base },
    { fieldName: "referenceClose", fieldCategory: "reference", acceptableSources: ["reference.close"], validationRule: "正數、currency=TWD", ...base },
    { fieldName: "lowPrice", fieldCategory: "support", acceptableSources: ["real.lowPrice", "supportLevel"], validationRule: "正數、<= lastPrice", ...base },
    { fieldName: "supportLevel", fieldCategory: "support", acceptableSources: ["supportLevel", "real.lowPrice"], validationRule: "正數、為防守參考", ...base },
    { fieldName: "highPrice", fieldCategory: "target", acceptableSources: ["real.highPrice", "resistanceLevel"], validationRule: "正數、>= lastPrice", ...base },
    { fieldName: "resistanceLevel", fieldCategory: "target", acceptableSources: ["resistanceLevel", "real.highPrice"], validationRule: "正數、為壓力參考", ...base },
    { fieldName: "targetModelOutput", fieldCategory: "target", acceptableSources: ["targetModelOutput"], validationRule: "正數、模型輸出（spec-only）", ...base },
  ];
}

/** Descriptor field → future real quote fields (6 descriptor fields). */
function buildDescriptorFieldMappings(): DescriptorFieldMapping[] {
  const common = {
    descriptorFieldType: "number",
    currentSourceType: "fixture_mock" as const,
    futureSourceType: "real_quote_pending" as const,
    manualReviewRequired: true as const,
  };
  return [
    { descriptorFieldName: "buyZoneLower", mappedExpectedRealFields: ["lastPrice", "closePrice", "referenceClose"], fallbackBehavior: "缺值即保留 fixture_mock 並標示 NOT_CONNECTED", ...common },
    { descriptorFieldName: "buyZoneUpper", mappedExpectedRealFields: ["lastPrice", "closePrice", "referenceClose"], fallbackBehavior: "缺值即保留 fixture_mock 並標示 NOT_CONNECTED", ...common },
    { descriptorFieldName: "stopLossLower", mappedExpectedRealFields: ["lowPrice", "supportLevel"], fallbackBehavior: "缺值即保留 fixture_mock 並標示 NOT_CONNECTED", ...common },
    { descriptorFieldName: "stopLossUpper", mappedExpectedRealFields: ["lowPrice", "supportLevel"], fallbackBehavior: "缺值即保留 fixture_mock 並標示 NOT_CONNECTED", ...common },
    { descriptorFieldName: "targetLower", mappedExpectedRealFields: ["highPrice", "resistanceLevel", "targetModelOutput"], fallbackBehavior: "缺值即保留 fixture_mock 並標示 NOT_CONNECTED", ...common },
    { descriptorFieldName: "targetUpper", mappedExpectedRealFields: ["highPrice", "resistanceLevel", "targetModelOutput"], fallbackBehavior: "缺值即保留 fixture_mock 並標示 NOT_CONNECTED", ...common },
  ];
}

/** Trade plan field (dotted path) ← descriptor field (6 trade plan fields). */
function buildTradePlanFieldMappings(): TradePlanFieldMapping[] {
  const common = { transformRuntimeEnabled: false as const, operationalUseAllowed: false as const };
  return [
    { tradePlanFieldName: "buyZone.lower", derivedFromDescriptorField: "buyZoneLower", deterministicTransform: "buyZone.lower = descriptor.buyZoneLower（passthrough）", ...common },
    { tradePlanFieldName: "buyZone.upper", derivedFromDescriptorField: "buyZoneUpper", deterministicTransform: "buyZone.upper = descriptor.buyZoneUpper（passthrough）", ...common },
    { tradePlanFieldName: "riskReward.stopLossLower", derivedFromDescriptorField: "stopLossLower", deterministicTransform: "riskReward.stopLossLower = descriptor.stopLossLower（passthrough）", ...common },
    { tradePlanFieldName: "riskReward.stopLossUpper", derivedFromDescriptorField: "stopLossUpper", deterministicTransform: "riskReward.stopLossUpper = descriptor.stopLossUpper（passthrough）", ...common },
    { tradePlanFieldName: "riskReward.targetLower", derivedFromDescriptorField: "targetLower", deterministicTransform: "riskReward.targetLower = descriptor.targetLower（passthrough）", ...common },
    { tradePlanFieldName: "riskReward.targetUpper", derivedFromDescriptorField: "targetUpper", deterministicTransform: "riskReward.targetUpper = descriptor.targetUpper（passthrough）", ...common },
  ];
}

function buildItem(descriptor: CandidatePriceLevelDescriptor): DescriptorToRealQuoteMappingItem {
  return {
    symbol: descriptor.symbol,
    name: descriptor.name,
    descriptorAvailable: true,
    tradePlanAvailable: true,
    realQuoteConnected: false,
    realMappingStatus: "NOT_CONNECTED",
    mappingReadiness: "SPEC_DEFINED_NOT_CONNECTED",
    expectedRealFields: buildExpectedRealFields(),
    descriptorFieldMappings: buildDescriptorFieldMappings(),
    tradePlanFieldMappings: buildTradePlanFieldMappings(),
    requiredEvidenceBeforeConnection: [...REQUIRED_EVIDENCE],
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    stagingReadOnlyRequired: true,
    stagingReadOnlyConnected: false,
    shadowComparisonRequired: true,
    shadowComparisonCompleted: false,
    productionSwitchAllowed: false,
    operationalUseAllowed: false,
    generatedBuySellCommand: false,
    autoOrderRequested: false,
  };
}

function resolveTradePlanPath(plan: CandidateTradePlan, dottedPath: string): boolean {
  let cursor: unknown = plan;
  for (const key of dottedPath.split(".")) {
    if (cursor != null && typeof cursor === "object" && key in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[key];
    } else {
      return false;
    }
  }
  return cursor !== undefined;
}

function validateItem(
  item: DescriptorToRealQuoteMappingItem,
  descriptor: CandidatePriceLevelDescriptor | undefined,
  plan: CandidateTradePlan | undefined,
): DescriptorToRealQuoteMappingReadinessValidation {
  const hasDescriptor = descriptor != null;
  const hasTradePlan = plan != null;
  const symbolConsistent =
    hasDescriptor && hasTradePlan && descriptor!.symbol === item.symbol && plan!.symbol === item.symbol;

  const expectedRealFieldsNonEmpty = item.expectedRealFields.length > 0;
  const descriptorFieldMappingsNonEmpty = item.descriptorFieldMappings.length > 0;
  const tradePlanFieldMappingsNonEmpty = item.tradePlanFieldMappings.length > 0;

  const descriptorKeys = descriptor ? new Set(Object.keys(descriptor)) : new Set<string>();
  const descriptorFieldsResolve =
    hasDescriptor && item.descriptorFieldMappings.every((m) => descriptorKeys.has(m.descriptorFieldName));
  const tradePlanFieldsResolve =
    hasTradePlan &&
    item.tradePlanFieldMappings.every(
      (m) => resolveTradePlanPath(plan!, m.tradePlanFieldName) && descriptorKeys.has(m.derivedFromDescriptorField),
    );

  const realQuoteNotConnected = item.realQuoteConnected === false;
  const realMappingNotConnected = item.realMappingStatus === "NOT_CONNECTED";
  const mappingReadinessSpecDefined = item.mappingReadiness === "SPEC_DEFINED_NOT_CONNECTED";
  const manualSignoffRequiredOk = item.manualSignoffRequired === true;
  const manualSignoffNotCompleted = item.manualSignoffCompleted === false;
  const stagingReadOnlyRequiredOk = item.stagingReadOnlyRequired === true;
  const stagingReadOnlyNotConnected = item.stagingReadOnlyConnected === false;
  const shadowComparisonRequiredOk = item.shadowComparisonRequired === true;
  const shadowComparisonNotCompleted = item.shadowComparisonCompleted === false;
  const productionSwitchDisallowed = item.productionSwitchAllowed === false;
  const operationalUseDisallowed = item.operationalUseAllowed === false;
  const noBuySellCommand = item.generatedBuySellCommand === false;
  const noAutoOrder = item.autoOrderRequested === false;

  const valid =
    hasDescriptor &&
    hasTradePlan &&
    symbolConsistent &&
    realQuoteNotConnected &&
    realMappingNotConnected &&
    mappingReadinessSpecDefined &&
    manualSignoffRequiredOk &&
    manualSignoffNotCompleted &&
    stagingReadOnlyRequiredOk &&
    stagingReadOnlyNotConnected &&
    shadowComparisonRequiredOk &&
    shadowComparisonNotCompleted &&
    productionSwitchDisallowed &&
    operationalUseDisallowed &&
    noBuySellCommand &&
    noAutoOrder &&
    expectedRealFieldsNonEmpty &&
    descriptorFieldMappingsNonEmpty &&
    tradePlanFieldMappingsNonEmpty &&
    descriptorFieldsResolve &&
    tradePlanFieldsResolve;

  return {
    symbol: item.symbol,
    hasDescriptor,
    hasTradePlan,
    symbolConsistent,
    realQuoteNotConnected,
    realMappingNotConnected,
    mappingReadinessSpecDefined,
    manualSignoffRequiredOk,
    manualSignoffNotCompleted,
    stagingReadOnlyRequiredOk,
    stagingReadOnlyNotConnected,
    shadowComparisonRequiredOk,
    shadowComparisonNotCompleted,
    productionSwitchDisallowed,
    operationalUseDisallowed,
    noBuySellCommand,
    noAutoOrder,
    expectedRealFieldsNonEmpty,
    descriptorFieldMappingsNonEmpty,
    tradePlanFieldMappingsNonEmpty,
    descriptorFieldsResolve,
    tradePlanFieldsResolve,
    valid,
  };
}

/**
 * Builds the descriptor-to-real-quote mapping readiness matrix. Reads no clock, no
 * env, no network — only the V64 descriptors + V63 trade plans, intersected by
 * symbol; everything stays spec-only and NOT_CONNECTED.
 */
export function buildDescriptorToRealQuoteMappingContract(
  input: BuildDescriptorToRealQuoteMappingContractInput = {},
): DescriptorToRealQuoteMappingMatrix {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const source = buildCandidatePriceLevelFixtureSourceContract({ generatedAt });
  const tradePlan = buildStructuredCandidateTradePlanContract({ generatedAt });
  const descriptorBySymbol = new Map(source.descriptors.map((d) => [d.symbol, d] as const));
  const planBySymbol = new Map(tradePlan.tradePlans.map((p) => [p.symbol, p] as const));

  // One mapping item per symbol that has BOTH a descriptor and a trade plan.
  const mappingItems: DescriptorToRealQuoteMappingItem[] = [];
  for (const descriptor of source.descriptors) {
    if (!planBySymbol.has(descriptor.symbol)) continue;
    mappingItems.push(buildItem(descriptor));
  }

  const validations = mappingItems.map((item) =>
    validateItem(item, descriptorBySymbol.get(item.symbol), planBySymbol.get(item.symbol)),
  );
  const allValid = validations.every((v) => v.valid);

  return {
    contractVersion: "V65",
    specName: DESCRIPTOR_TO_REAL_QUOTE_MAPPING_SPEC_NAME,
    sourceType: "fixture_mock",
    generatedAt,
    decision: "READY_FOR_UI_REVIEW",

    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    fetchPerformed: false,
    portfolioApiSwitched: false,
    productionReady: false,

    mappingItems,
    validations,
    allValid,

    safetyLabels: [...DESCRIPTOR_TO_REAL_QUOTE_MAPPING_SAFETY_LABELS],
  };
}
