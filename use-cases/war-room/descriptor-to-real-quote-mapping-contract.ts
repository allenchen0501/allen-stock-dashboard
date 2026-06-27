/**
 * Descriptor-to-Real Quote Mapping Readiness Matrix Contract — V65
 *
 * Read-model TypeScript contract describing — spec-only — how FUTURE real market
 * quote fields would map into the V64 fixture descriptor fields, and how those flow
 * into the V63 structured trade plan fields. TYPES + static CONSTANTS ONLY.
 *
 * This is a READINESS MATRIX, not a connection. No runtime, no fetch, no Supabase
 * client, no env reads, no clock reads, no DB writes, no API route. Every item stays
 * realQuoteConnected = false, realMappingStatus = "NOT_CONNECTED", mappingReadiness =
 * "SPEC_DEFINED_NOT_CONNECTED". Crossing into real data requires manual sign-off +
 * staging read-only + shadow comparison — none of which are flipped here.
 *
 * Three-layer data flow described:
 *   futureRealQuoteField → CandidatePriceLevelDescriptor field → CandidateTradePlan field
 *
 * See: docs/descriptor-to-real-quote-mapping-readiness.md
 */

import type { RealMappingStatus } from "./candidate-price-level-fixture-source-contract";

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type MappingReadiness = "SPEC_DEFINED_NOT_CONNECTED";
export type CurrentSourceType = "fixture_mock";
export type FutureSourceType = "real_quote_pending";

// ---------------------------------------------------------------------------
// Field-level types
// ---------------------------------------------------------------------------

export interface RealQuoteExpectedField {
  fieldName: string;
  fieldCategory: string;
  required: boolean;
  acceptableSources: string[];
  dataFreshnessRequirement: string;
  validationRule: string;
  missingDataBehavior: string;
  conflictBehavior: string;
  operationalUseAllowed: false;
}

export interface DescriptorFieldMapping {
  descriptorFieldName: string;
  descriptorFieldType: string;
  currentSourceType: CurrentSourceType;
  futureSourceType: FutureSourceType;
  mappedExpectedRealFields: string[];
  fallbackBehavior: string;
  manualReviewRequired: true;
}

export interface TradePlanFieldMapping {
  tradePlanFieldName: string;
  derivedFromDescriptorField: string;
  deterministicTransform: string;
  transformRuntimeEnabled: false;
  operationalUseAllowed: false;
}

// ---------------------------------------------------------------------------
// Item + matrix
// ---------------------------------------------------------------------------

export interface DescriptorToRealQuoteMappingItem {
  symbol: string;
  name: string;
  descriptorAvailable: true;
  tradePlanAvailable: true;
  realQuoteConnected: false;
  realMappingStatus: RealMappingStatus;
  mappingReadiness: MappingReadiness;
  expectedRealFields: RealQuoteExpectedField[];
  descriptorFieldMappings: DescriptorFieldMapping[];
  tradePlanFieldMappings: TradePlanFieldMapping[];
  requiredEvidenceBeforeConnection: string[];
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  stagingReadOnlyRequired: true;
  stagingReadOnlyConnected: false;
  shadowComparisonRequired: true;
  shadowComparisonCompleted: false;
  productionSwitchAllowed: false;
  operationalUseAllowed: false;
  generatedBuySellCommand: false;
  autoOrderRequested: false;
}

export interface DescriptorToRealQuoteMappingReadinessValidation {
  symbol: string;
  hasDescriptor: boolean;
  hasTradePlan: boolean;
  symbolConsistent: boolean;
  realQuoteNotConnected: boolean;
  realMappingNotConnected: boolean;
  mappingReadinessSpecDefined: boolean;
  manualSignoffRequiredOk: boolean;
  manualSignoffNotCompleted: boolean;
  stagingReadOnlyRequiredOk: boolean;
  stagingReadOnlyNotConnected: boolean;
  shadowComparisonRequiredOk: boolean;
  shadowComparisonNotCompleted: boolean;
  productionSwitchDisallowed: boolean;
  operationalUseDisallowed: boolean;
  noBuySellCommand: boolean;
  noAutoOrder: boolean;
  expectedRealFieldsNonEmpty: boolean;
  descriptorFieldMappingsNonEmpty: boolean;
  tradePlanFieldMappingsNonEmpty: boolean;
  descriptorFieldsResolve: boolean;
  tradePlanFieldsResolve: boolean;
  valid: boolean;
}

export interface DescriptorToRealQuoteMappingMatrix {
  contractVersion: "V65";
  specName: "Descriptor-to-Real Quote Mapping Readiness Matrix";
  sourceType: "fixture_mock";
  generatedAt: string;
  decision: "READY_FOR_UI_REVIEW";

  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  fetchPerformed: false;
  portfolioApiSwitched: false;
  productionReady: false;

  mappingItems: DescriptorToRealQuoteMappingItem[];
  validations: DescriptorToRealQuoteMappingReadinessValidation[];
  allValid: boolean;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DESCRIPTOR_TO_REAL_QUOTE_MAPPING_CONTRACT_VERSION = "V65" as const;

export const DESCRIPTOR_TO_REAL_QUOTE_MAPPING_SPEC_NAME =
  "Descriptor-to-Real Quote Mapping Readiness Matrix" as const;

export const DESCRIPTOR_TO_REAL_QUOTE_MAPPING_SAFETY_LABELS = [
  "Descriptor-to-Real Quote Mapping Readiness Matrix",
  "fixture-only",
  "deterministic contract",
  "fixture_mock",
  "real_quote_pending",
  "NOT_CONNECTED",
  "SPEC_DEFINED_NOT_CONNECTED",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "stagingReadOnlyRequired true",
  "stagingReadOnlyConnected false",
  "shadowComparisonRequired true",
  "shadowComparisonCompleted false",
  "productionSwitchAllowed false",
  "operationalUseAllowed false",
  "尚未連真實行情，fixture 區間不可作為正式操作依據",
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
