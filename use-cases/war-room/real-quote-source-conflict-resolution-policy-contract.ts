/**
 * Real Quote Source Conflict Resolution Policy Contract — V67
 *
 * Read-model TypeScript contract describing — spec-only — how the system would, in
 * the FUTURE, resolve a conflict when multiple authorized real quote sources provide
 * the same field: priority by V66 conflictPriorityRank, plus missing / stale /
 * timestamp-mismatch / value-mismatch / unauthorized / not-connected behavior, then
 * a degraded status that BLOCKS operational use. TYPES + static CONSTANTS ONLY.
 *
 * This is a POLICY, not a connection. No runtime, no fetch, no Supabase client, no
 * env reads, no clock reads, no DB writes, no API route. Every candidate value stays
 * isAuthorized = false, isConnected = false, operationalUseAllowed = false. Resolution
 * never produces operationalUseAllowed = true; it always requires manual review +
 * sign-off (not completed here).
 *
 * Layer described (extends V66):
 *   multiple source candidate values → deterministic conflict policy →
 *   selected source / degraded status / blocked operational use
 *
 * See: docs/real-quote-source-conflict-resolution-policy.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ConflictPolicyMode = "SPEC_ONLY_NOT_CONNECTED";

export type QuoteSourceDegradedStatus =
  | "BLOCKED_NOT_CONNECTED"
  | "BLOCKED_UNAUTHORIZED"
  | "BLOCKED_MISSING_DATA"
  | "BLOCKED_STALE_DATA"
  | "DEGRADED_FIXTURE_ONLY";

// ---------------------------------------------------------------------------
// Candidate value + rule
// ---------------------------------------------------------------------------

export interface QuoteSourceCandidateValue {
  sourceName: string;
  fieldName: string;
  valueKind: string;
  valuePreview: string;
  valueTimestamp: string;
  isAvailable: boolean;
  isStale: boolean;
  isAuthorized: false;
  isConnected: false;
  sourcePriorityRank: number;
  verificationStatus: string;
  operationalUseAllowed: false;
}

export interface QuoteSourceConflictRule {
  ruleName: string;
  appliesToFieldCategory: string;
  primarySourcePriority: number;
  staleDataBehavior: string;
  missingDataBehavior: string;
  timestampMismatchBehavior: string;
  valueMismatchBehavior: string;
  unauthorizedSourceBehavior: string;
  notConnectedSourceBehavior: string;
  conflictOutcome: string;
  operationalUseAllowed: false;
}

// ---------------------------------------------------------------------------
// Resolution result
// ---------------------------------------------------------------------------

export interface QuoteSourceConflictResolutionResult {
  fieldName: string;
  conflictDetected: boolean;
  selectedSourceName: string;
  selectedValuePreview: string;
  rejectedSourceNames: string[];
  degradedStatus: QuoteSourceDegradedStatus;
  resolutionReason: string;
  verificationStatus: string;
  operationalUseAllowed: false;
  requiresManualReview: true;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  productionSwitchAllowed: false;
}

// ---------------------------------------------------------------------------
// Conflict detection (engine output)
// ---------------------------------------------------------------------------

export interface QuoteSourceConflictDetection {
  hasMissingData: boolean;
  hasStaleData: boolean;
  hasTimestampMismatch: boolean;
  hasValueMismatch: boolean;
  hasUnauthorizedSource: boolean;
  hasNotConnectedSource: boolean;
  conflictDetected: boolean;
}

// ---------------------------------------------------------------------------
// Validation + policy
// ---------------------------------------------------------------------------

export interface QuoteSourceConflictResolutionValidation {
  ranksAlignedToV66: boolean;
  sampleSourceNamesKnown: boolean;
  sampleFieldNamesKnown: boolean;
  rankSortsByPriority: boolean;
  detectsMissingData: boolean;
  detectsStaleData: boolean;
  detectsTimestampMismatch: boolean;
  detectsValueMismatch: boolean;
  detectsUnauthorizedSource: boolean;
  detectsNotConnectedSource: boolean;
  allResultsOperationalUseFalse: boolean;
  allResultsManualSignoffRequired: boolean;
  allResultsManualSignoffNotCompleted: boolean;
  allResultsProductionSwitchDisallowed: boolean;
  valid: boolean;
}

export interface QuoteSourceConflictResolutionPolicy {
  contractVersion: "V67";
  specName: "Real Quote Source Conflict Resolution Policy";
  policyMode: ConflictPolicyMode;
  sourceCatalogMode: "SPEC_ONLY_NOT_CONNECTED";
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

  conflictRules: QuoteSourceConflictRule[];
  sampleCandidateValues: QuoteSourceCandidateValue[];
  sampleResolutionResults: QuoteSourceConflictResolutionResult[];
  validation: QuoteSourceConflictResolutionValidation;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const REAL_QUOTE_SOURCE_CONFLICT_RESOLUTION_POLICY_CONTRACT_VERSION = "V67" as const;

export const REAL_QUOTE_SOURCE_CONFLICT_RESOLUTION_POLICY_SPEC_NAME =
  "Real Quote Source Conflict Resolution Policy" as const;

export const REAL_QUOTE_SOURCE_CONFLICT_RESOLUTION_POLICY_SAFETY_LABELS = [
  "Real Quote Source Conflict Resolution Policy",
  "SPEC_ONLY_NOT_CONNECTED",
  "deterministic conflict resolution",
  "conflictPriorityRank",
  "missing data",
  "stale data",
  "timestamp mismatch",
  "value mismatch",
  "unauthorized source",
  "not connected source",
  "operationalUseAllowed false",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "productionSwitchAllowed false",
  "多來源衝突解析尚未接真實資料，fixture 區間不可作為正式操作依據",
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
