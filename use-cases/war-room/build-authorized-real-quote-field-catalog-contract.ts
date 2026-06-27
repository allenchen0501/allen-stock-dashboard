/**
 * Authorized Real Quote Field Catalog & Source Boundary Builder — V66
 *
 * Pure deterministic builder. Lists the candidate real quote sources (none
 * connected or authorized), a field catalog covering every V65 expectedRealField
 * fieldName plus operational metadata fields, and the source boundary that a future
 * real source must cross. Self-validates that everything stays NOT_CONNECTED.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - Every source stays NOT_CONNECTED / NOT_AUTHORIZED|PENDING_MANUAL_REVIEW;
 *     sign-off / staging / production flags are NEVER flipped
 */

import { buildDescriptorToRealQuoteMappingContract } from "./build-descriptor-to-real-quote-mapping-contract";
import {
  AUTHORIZED_REAL_QUOTE_FIELD_CATALOG_SAFETY_LABELS,
  AUTHORIZED_REAL_QUOTE_FIELD_CATALOG_SPEC_NAME,
  AUTHORIZED_REAL_QUOTE_SOURCE_NAMES,
} from "./authorized-real-quote-field-catalog-contract";
import type {
  AuthorizedRealQuoteFieldCatalog,
  AuthorizedRealQuoteFieldCatalogItem,
  AuthorizedRealQuoteFieldCatalogValidation,
  AuthorizedRealQuoteSourceBoundary,
  AuthorizedRealQuoteSourceCandidate,
  SourceAuthorizationStatus,
} from "./authorized-real-quote-field-catalog-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildAuthorizedRealQuoteFieldCatalogContractInput {
  generatedAt?: string;
}

const EVIDENCE_BEFORE_USE: string[] = [
  "authorized real quote source 名稱與授權範圍",
  "staging read-only connection review 通過紀錄",
  "manual sign-off evidence（人工簽核）",
  "fixture vs real shadow comparison 一致性結果",
];

// Source names (from the contract constant) for readable references below.
const YAHOO = "Yahoo Finance Taiwan candidate";
const TWSE = "TWSE official candidate";
const TPEX = "TPEx official candidate";
const GOODINFO = "Goodinfo candidate";
const SUPABASE_STAGING = "Supabase staging read-only candidate";
const BROKER = "Broker import candidate";

function sourceCandidate(
  sourceName: string,
  sourceType: string,
  sourceRole: string,
  authorizationStatus: SourceAuthorizationStatus,
  conflictPriorityRank: number,
  notes: string,
): AuthorizedRealQuoteSourceCandidate {
  return {
    sourceName,
    sourceType,
    sourceRole,
    authorizationStatus,
    connectionStatus: "NOT_CONNECTED",
    runtimeEnabled: false,
    fetchAllowed: false,
    envRequired: false,
    envReadPerformed: false,
    apiRouteRequired: false,
    apiRouteCreated: false,
    supabaseRequired: false,
    supabaseConnected: false,
    operationalUseAllowed: false,
    evidenceRequiredBeforeUse: [...EVIDENCE_BEFORE_USE],
    conflictPriorityRank,
    notes,
  };
}

function buildSourceCandidates(): AuthorizedRealQuoteSourceCandidate[] {
  return [
    sourceCandidate(TWSE, "official_exchange", "primary_price_reference", "NOT_AUTHORIZED", 1, "上市官方來源候選；spec-only，未授權、未連線。"),
    sourceCandidate(TPEX, "official_exchange", "primary_price_reference", "NOT_AUTHORIZED", 2, "上櫃官方來源候選；spec-only，未授權、未連線。"),
    sourceCandidate(YAHOO, "third_party_quote", "fallback_price_reference", "NOT_AUTHORIZED", 3, "第三方報價候選；spec-only，未授權、未連線。"),
    sourceCandidate(GOODINFO, "third_party_analytics", "support_resistance_reference", "NOT_AUTHORIZED", 4, "第三方分析候選；spec-only，未授權、未連線。"),
    sourceCandidate(SUPABASE_STAGING, "staging_read_only", "verification_and_provenance", "PENDING_MANUAL_REVIEW", 5, "staging read-only 候選；待人工審查，未連線、未讀 env。"),
    sourceCandidate(BROKER, "broker_import", "position_and_provenance", "PENDING_MANUAL_REVIEW", 6, "broker import 候選；待人工審查，未連線。"),
  ];
}

function fieldItem(
  fieldName: string,
  fieldCategory: string,
  mappedV65ExpectedFieldNames: string[],
  acceptableSources: string[],
  preferredSourceName: string,
  fallbackSourceNames: string[],
  validationRule: string,
): AuthorizedRealQuoteFieldCatalogItem {
  return {
    fieldName,
    fieldCategory,
    required: true,
    mappedV65ExpectedFieldNames,
    acceptableSources,
    preferredSourceName,
    fallbackSourceNames,
    currentStatus: "SPEC_DEFINED_NOT_CONNECTED",
    dataFreshnessRequirement: "intraday delayed acceptable；stale 超時即降級（spec-only）",
    validationRule,
    missingDataBehavior: "fallback to fixture_mock；標示 NOT_CONNECTED，不可作為正式操作依據",
    conflictBehavior: "依 conflictPriorityRank 取較高優先；衝突即降級為 NOT_CONNECTED，不 promote real",
    manualReviewRequired: true,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    stagingReadOnlyRequired: true,
    stagingReadOnlyConnected: false,
    shadowComparisonRequired: true,
    shadowComparisonCompleted: false,
    productionSwitchAllowed: false,
    operationalUseAllowed: false,
  };
}

function buildFieldCatalogItems(): AuthorizedRealQuoteFieldCatalogItem[] {
  const priceSources = [TWSE, TPEX, YAHOO];
  const refSources = [GOODINFO, TWSE];
  const metaSources = [SUPABASE_STAGING, BROKER, TWSE];
  return [
    fieldItem("lastPrice", "price", ["lastPrice"], priceSources, TWSE, [TPEX, YAHOO], "正數、currency=TWD"),
    fieldItem("closePrice", "price", ["closePrice"], priceSources, TWSE, [TPEX, YAHOO], "正數、currency=TWD"),
    fieldItem("openPrice", "price", [], priceSources, TWSE, [TPEX, YAHOO], "正數、currency=TWD"),
    fieldItem("highPrice", "price", ["highPrice"], priceSources, TWSE, [TPEX, YAHOO], "正數、>= lastPrice"),
    fieldItem("lowPrice", "price", ["lowPrice"], priceSources, TWSE, [TPEX, YAHOO], "正數、<= lastPrice"),
    fieldItem("volume", "volume", [], priceSources, TWSE, [TPEX, YAHOO], "非負整數"),
    fieldItem("referenceClose", "reference", ["referenceClose"], priceSources, TWSE, [TPEX, YAHOO], "正數、currency=TWD"),
    fieldItem("supportLevel", "support", ["supportLevel"], refSources, GOODINFO, [TWSE], "正數、為防守參考"),
    fieldItem("resistanceLevel", "target", ["resistanceLevel"], refSources, GOODINFO, [TWSE], "正數、為壓力參考"),
    fieldItem("targetModelOutput", "target", ["targetModelOutput"], [GOODINFO], GOODINFO, [], "正數、模型輸出（spec-only）"),
    fieldItem("dataTimestamp", "provenance", [], metaSources, SUPABASE_STAGING, [BROKER, TWSE], "ISO 時間字串、為資料時間"),
    fieldItem("dataSource", "provenance", [], metaSources, SUPABASE_STAGING, [BROKER, TWSE], "字串、標示來源"),
    fieldItem("verificationStatus", "provenance", [], metaSources, SUPABASE_STAGING, [BROKER, TWSE], "枚舉、標示驗證狀態"),
  ];
}

function buildSourceBoundary(): AuthorizedRealQuoteSourceBoundary {
  return {
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    stagingReadOnlyRequired: true,
    stagingReadOnlyConnected: false,
    shadowComparisonRequired: true,
    shadowComparisonCompleted: false,
    productionSwitchAllowed: false,
    serviceRoleAllowedInAppRuntime: false,
    writeOperationsAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };
}

function validateItem(
  item: AuthorizedRealQuoteFieldCatalogItem,
  knownSources: Set<string>,
): AuthorizedRealQuoteFieldCatalogValidation {
  const hasAcceptableSources = item.acceptableSources.length > 0;
  const allAcceptableSourcesKnown = item.acceptableSources.every((s) => knownSources.has(s));
  const preferredSourceKnown = knownSources.has(item.preferredSourceName);
  const currentStatusSpecDefined = item.currentStatus === "SPEC_DEFINED_NOT_CONNECTED";
  const manualSignoffRequiredOk = item.manualSignoffRequired === true;
  const manualSignoffNotCompleted = item.manualSignoffCompleted === false;
  const stagingReadOnlyRequiredOk = item.stagingReadOnlyRequired === true;
  const stagingReadOnlyNotConnected = item.stagingReadOnlyConnected === false;
  const shadowComparisonRequiredOk = item.shadowComparisonRequired === true;
  const shadowComparisonNotCompleted = item.shadowComparisonCompleted === false;
  const productionSwitchDisallowed = item.productionSwitchAllowed === false;
  const operationalUseDisallowed = item.operationalUseAllowed === false;

  const valid =
    hasAcceptableSources &&
    allAcceptableSourcesKnown &&
    preferredSourceKnown &&
    currentStatusSpecDefined &&
    manualSignoffRequiredOk &&
    manualSignoffNotCompleted &&
    stagingReadOnlyRequiredOk &&
    stagingReadOnlyNotConnected &&
    shadowComparisonRequiredOk &&
    shadowComparisonNotCompleted &&
    productionSwitchDisallowed &&
    operationalUseDisallowed;

  return {
    fieldName: item.fieldName,
    hasAcceptableSources,
    allAcceptableSourcesKnown,
    preferredSourceKnown,
    currentStatusSpecDefined,
    manualSignoffRequiredOk,
    manualSignoffNotCompleted,
    stagingReadOnlyRequiredOk,
    stagingReadOnlyNotConnected,
    shadowComparisonRequiredOk,
    shadowComparisonNotCompleted,
    productionSwitchDisallowed,
    operationalUseDisallowed,
    valid,
  };
}

/**
 * Builds the authorized real quote field catalog. Reads no clock, no env, no
 * network — only the spec-defined source candidates / field catalog, cross-checked
 * against the V65 expectedRealField names for coverage. Everything stays
 * SPEC_ONLY_NOT_CONNECTED.
 */
export function buildAuthorizedRealQuoteFieldCatalogContract(
  input: BuildAuthorizedRealQuoteFieldCatalogContractInput = {},
): AuthorizedRealQuoteFieldCatalog {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const sourceCandidates = buildSourceCandidates();
  const fieldCatalogItems = buildFieldCatalogItems();
  const knownSources = new Set(AUTHORIZED_REAL_QUOTE_SOURCE_NAMES as readonly string[]);

  const validations = fieldCatalogItems.map((item) => validateItem(item, knownSources));

  // Coverage: every V65 expectedRealField fieldName must be covered by a catalog item.
  const mapping = buildDescriptorToRealQuoteMappingContract({ generatedAt });
  const v65FieldNames = new Set(
    mapping.mappingItems.flatMap((m) => m.expectedRealFields.map((f) => f.fieldName)),
  );
  const catalogFieldNames = new Set(fieldCatalogItems.map((i) => i.fieldName));
  const coversAllV65ExpectedFields = [...v65FieldNames].every((name) => catalogFieldNames.has(name));

  const allValid = validations.every((v) => v.valid) && coversAllV65ExpectedFields;

  return {
    contractVersion: "V66",
    specName: AUTHORIZED_REAL_QUOTE_FIELD_CATALOG_SPEC_NAME,
    sourceCatalogMode: "SPEC_ONLY_NOT_CONNECTED",
    generatedAt,
    decision: allValid ? "READY_FOR_UI_REVIEW" : "NO_GO",

    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    fetchPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    productionReady: false,

    sourceCandidates,
    fieldCatalogItems,
    sourceBoundary: buildSourceBoundary(),

    validations,
    coversAllV65ExpectedFields,
    allValid,

    safetyLabels: [...AUTHORIZED_REAL_QUOTE_FIELD_CATALOG_SAFETY_LABELS],
  };
}
