/**
 * Authorized Real Quote Field Catalog & Source Boundary Contract — V66
 *
 * Read-model TypeScript contract describing — spec-only — which data sources a
 * FUTURE real quote field would be allowed to come from, each source's current
 * authorization + connection status, missing-data / conflict behavior, and the
 * evidence required before staging read-only / shadow comparison. TYPES + static
 * CONSTANTS ONLY.
 *
 * This is a CATALOG, not a connection. No runtime, no fetch, no Supabase client, no
 * env reads, no clock reads, no DB writes, no API route, no API keys. Every source
 * candidate stays connectionStatus = "NOT_CONNECTED", authorizationStatus =
 * "NOT_AUTHORIZED" or "PENDING_MANUAL_REVIEW", runtimeEnabled = false, fetchAllowed
 * = false. Crossing into real data requires manual sign-off + staging read-only +
 * shadow comparison — none of which are flipped here.
 *
 * Layer described (extends V65):
 *   expectedRealField → authorized source candidate → authorization status →
 *   connection status → evidence requirement → mapping readiness
 *
 * See: docs/authorized-real-quote-field-catalog.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type SourceAuthorizationStatus = "NOT_AUTHORIZED" | "PENDING_MANUAL_REVIEW";
export type SourceConnectionStatus = "NOT_CONNECTED";
export type FieldCatalogCurrentStatus = "SPEC_DEFINED_NOT_CONNECTED";
export type SourceCatalogMode = "SPEC_ONLY_NOT_CONNECTED";

// ---------------------------------------------------------------------------
// Source candidate
// ---------------------------------------------------------------------------

export interface AuthorizedRealQuoteSourceCandidate {
  sourceName: string;
  sourceType: string;
  sourceRole: string;
  authorizationStatus: SourceAuthorizationStatus;
  connectionStatus: SourceConnectionStatus;
  runtimeEnabled: false;
  fetchAllowed: false;
  envRequired: false;
  envReadPerformed: false;
  apiRouteRequired: false;
  apiRouteCreated: false;
  supabaseRequired: false;
  supabaseConnected: false;
  operationalUseAllowed: false;
  evidenceRequiredBeforeUse: string[];
  conflictPriorityRank: number;
  notes: string;
}

// ---------------------------------------------------------------------------
// Field catalog item
// ---------------------------------------------------------------------------

export interface AuthorizedRealQuoteFieldCatalogItem {
  fieldName: string;
  fieldCategory: string;
  required: boolean;
  mappedV65ExpectedFieldNames: string[];
  acceptableSources: string[];
  preferredSourceName: string;
  fallbackSourceNames: string[];
  currentStatus: FieldCatalogCurrentStatus;
  dataFreshnessRequirement: string;
  validationRule: string;
  missingDataBehavior: string;
  conflictBehavior: string;
  manualReviewRequired: true;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  stagingReadOnlyRequired: true;
  stagingReadOnlyConnected: false;
  shadowComparisonRequired: true;
  shadowComparisonCompleted: false;
  productionSwitchAllowed: false;
  operationalUseAllowed: false;
}

// ---------------------------------------------------------------------------
// Source boundary
// ---------------------------------------------------------------------------

export interface AuthorizedRealQuoteSourceBoundary {
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  stagingReadOnlyRequired: true;
  stagingReadOnlyConnected: false;
  shadowComparisonRequired: true;
  shadowComparisonCompleted: false;
  productionSwitchAllowed: false;
  serviceRoleAllowedInAppRuntime: false;
  writeOperationsAllowed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
}

// ---------------------------------------------------------------------------
// Validation + catalog
// ---------------------------------------------------------------------------

export interface AuthorizedRealQuoteFieldCatalogValidation {
  fieldName: string;
  hasAcceptableSources: boolean;
  allAcceptableSourcesKnown: boolean;
  preferredSourceKnown: boolean;
  currentStatusSpecDefined: boolean;
  manualSignoffRequiredOk: boolean;
  manualSignoffNotCompleted: boolean;
  stagingReadOnlyRequiredOk: boolean;
  stagingReadOnlyNotConnected: boolean;
  shadowComparisonRequiredOk: boolean;
  shadowComparisonNotCompleted: boolean;
  productionSwitchDisallowed: boolean;
  operationalUseDisallowed: boolean;
  valid: boolean;
}

export interface AuthorizedRealQuoteFieldCatalog {
  contractVersion: "V66";
  specName: "Authorized Real Quote Field Catalog & Source Boundary";
  sourceCatalogMode: SourceCatalogMode;
  generatedAt: string;
  decision: "READY_FOR_UI_REVIEW" | "NO_GO";

  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  fetchPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  productionReady: false;

  sourceCandidates: AuthorizedRealQuoteSourceCandidate[];
  fieldCatalogItems: AuthorizedRealQuoteFieldCatalogItem[];
  sourceBoundary: AuthorizedRealQuoteSourceBoundary;

  validations: AuthorizedRealQuoteFieldCatalogValidation[];
  coversAllV65ExpectedFields: boolean;
  allValid: boolean;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUTHORIZED_REAL_QUOTE_FIELD_CATALOG_CONTRACT_VERSION = "V66" as const;

export const AUTHORIZED_REAL_QUOTE_FIELD_CATALOG_SPEC_NAME =
  "Authorized Real Quote Field Catalog & Source Boundary" as const;

/** Candidate source names (catalog only — none are connected or authorized). */
export const AUTHORIZED_REAL_QUOTE_SOURCE_NAMES = [
  "Yahoo Finance Taiwan candidate",
  "TWSE official candidate",
  "TPEx official candidate",
  "Goodinfo candidate",
  "Supabase staging read-only candidate",
  "Broker import candidate",
] as const;

export const AUTHORIZED_REAL_QUOTE_FIELD_CATALOG_SAFETY_LABELS = [
  "Authorized Real Quote Field Catalog & Source Boundary",
  "SPEC_ONLY_NOT_CONNECTED",
  "NOT_CONNECTED",
  "NOT_AUTHORIZED",
  "PENDING_MANUAL_REVIEW",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "stagingReadOnlyRequired true",
  "stagingReadOnlyConnected false",
  "shadowComparisonRequired true",
  "shadowComparisonCompleted false",
  "productionSwitchAllowed false",
  "serviceRoleAllowedInAppRuntime false",
  "writeOperationsAllowed false",
  "尚未授權任何真實行情來源，fixture 區間不可作為正式操作依據",
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
