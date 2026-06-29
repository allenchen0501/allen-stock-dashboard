/**
 * Unified Connection Evidence Ledger Contract — V70
 *
 * Read-model TypeScript contract that consolidates the evidence requirements that
 * were described separately across V64–V69 into a single source of truth: what
 * human evidence must be completed before staging read-only / real quote / shadow
 * comparison / production switch. TYPES + static CONSTANTS ONLY.
 *
 * This is a PENDING ledger, not a connection. No runtime, no fetch, no Supabase
 * client, no env reads, no clock reads, no DB writes, no API route. Every evidence
 * item is PENDING / not provided / not accepted / placeholder only. The ledger
 * decision is NO_GO — connection is not allowed. Manual sign-off / staging / real
 * quote / production switch flags are NEVER flipped here.
 *
 * See: docs/unified-connection-evidence-ledger.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type EvidenceStatus = "PENDING";
export type LedgerMode = "SPEC_ONLY_PENDING_EVIDENCE";
export type EvidenceRequiredStage =
  | "STAGING_READONLY"
  | "REAL_QUOTE"
  | "SHADOW_COMPARISON"
  | "PRODUCTION_SWITCH";
export type EvidenceDependencyType = "PREREQUISITE" | "BLOCKS";

// ---------------------------------------------------------------------------
// Item / category / dependency
// ---------------------------------------------------------------------------

export interface UnifiedConnectionEvidenceItem {
  evidenceId: string;
  category: string;
  title: string;
  description: string;
  requiredBeforeStage: EvidenceRequiredStage;
  requiredByVersions: string[];
  sourceContracts: string[];
  ownerRole: string;
  evidenceStatus: EvidenceStatus;
  evidenceProvided: false;
  evidenceAccepted: false;
  manualReviewRequired: true;
  manualSignoffRequired: boolean;
  manualSignoffCompleted: false;
  blocksStagingConnection: boolean;
  blocksRealQuoteConnection: boolean;
  blocksProductionSwitch: boolean;
  riskIfMissing: string;
  allowedPlaceholder: true;
  actualEvidenceAttached: false;
}

export interface UnifiedConnectionEvidenceCategory {
  categoryId: string;
  title: string;
  itemCount: number;
  completedCount: 0;
  pendingCount: number;
  categoryStatus: "PENDING";
  blocksStagingConnection: boolean;
  blocksRealQuoteConnection: boolean;
  blocksProductionSwitch: boolean;
}

export interface UnifiedConnectionEvidenceDependency {
  dependencyId: string;
  fromEvidenceId: string;
  toEvidenceId: string;
  dependencyType: EvidenceDependencyType;
  reason: string;
}

// ---------------------------------------------------------------------------
// Validation + ledger
// ---------------------------------------------------------------------------

export interface UnifiedConnectionEvidenceLedgerValidation {
  requiredItemsPresent: boolean;
  allStatusPending: boolean;
  allEvidenceNotProvided: boolean;
  allEvidenceNotAccepted: boolean;
  allActualEvidenceNotAttached: boolean;
  allManualSignoffNotCompleted: boolean;
  allCategoriesPending: boolean;
  completedCountZero: boolean;
  categoryCountsAggregateCorrectly: boolean;
  requiredByVersionsReferenceKnown: boolean;
  sourceContractsNonEmpty: boolean;
  dependenciesReferenceExistingItems: boolean;
  noItemAllowsProductionSwitch: boolean;
  noItemAllowsRealQuoteConnection: boolean;
  noItemAllowsStagingConnection: boolean;
  decisionIsNoGo: boolean;
  valid: boolean;
}

export interface UnifiedConnectionEvidenceLedger {
  contractVersion: "V70";
  specName: "Unified Connection Evidence Ledger";
  ledgerMode: LedgerMode;
  generatedAt: string;
  decision: "NO_GO";

  stagingConnectionAllowed: false;
  realQuoteConnectionAllowed: false;
  productionSwitchAllowed: false;
  manualSignoffCompleted: false;
  actualEvidenceAttached: false;
  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  fetchPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  productionReady: false;

  evidenceItems: UnifiedConnectionEvidenceItem[];
  evidenceCategories: UnifiedConnectionEvidenceCategory[];
  dependencies: UnifiedConnectionEvidenceDependency[];
  validation: UnifiedConnectionEvidenceLedgerValidation;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const UNIFIED_CONNECTION_EVIDENCE_LEDGER_CONTRACT_VERSION = "V70" as const;

export const UNIFIED_CONNECTION_EVIDENCE_LEDGER_SPEC_NAME = "Unified Connection Evidence Ledger" as const;

/** The 20 required evidence ids (single source of truth). */
export const UNIFIED_CONNECTION_EVIDENCE_REQUIRED_IDS = [
  "OWNER_MANUAL_SIGNOFF",
  "SOURCE_AUTHORIZATION_YAHOO",
  "SOURCE_AUTHORIZATION_TWSE",
  "SOURCE_AUTHORIZATION_TPEX",
  "SOURCE_AUTHORIZATION_GOODINFO",
  "SOURCE_AUTHORIZATION_BROKER_IMPORT",
  "STAGING_SUPABASE_PROJECT_CONFIRMATION",
  "STAGING_READONLY_ROLE_CONFIRMATION",
  "RLS_SELECT_ONLY_CONFIRMATION",
  "SERVICE_ROLE_NOT_IN_APP_RUNTIME",
  "WRITE_OPERATION_BLOCK_CONFIRMATION",
  "API_ROUTE_NO_SWITCH_CONFIRMATION",
  "REAL_QUOTE_MAPPING_REVIEW",
  "SOURCE_CONFLICT_POLICY_REVIEW",
  "TRADE_PLAN_DOWNGRADE_UI_REVIEW",
  "SHADOW_COMPARISON_PLAN",
  "SHADOW_COMPARISON_RESULT_PENDING",
  "ROLLBACK_RUNBOOK",
  "KILL_SWITCH_CONFIRMATION",
  "PRODUCTION_SWITCH_FINAL_APPROVAL",
] as const;

export const UNIFIED_CONNECTION_EVIDENCE_KNOWN_VERSIONS = ["V64", "V65", "V66", "V67", "V68", "V69"] as const;

export const UNIFIED_CONNECTION_EVIDENCE_LEDGER_SAFETY_LABELS = [
  "Unified Connection Evidence Ledger",
  "SPEC_ONLY_PENDING_EVIDENCE",
  "NO_GO",
  "evidenceStatus PENDING",
  "evidenceProvided false",
  "evidenceAccepted false",
  "actualEvidenceAttached false",
  "stagingConnectionAllowed false",
  "realQuoteConnectionAllowed false",
  "productionSwitchAllowed false",
  "真實行情與 staging 連線仍需人工 evidence，不可作為正式操作依據",
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
