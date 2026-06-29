/**
 * Ledger Integrity Rollup & Safety Gate Dashboard Contract — V72
 *
 * Read-model TypeScript contract that rolls up the V70 evidence ledger + V71
 * transition preview / source-contract integrity into a single safety-gate overview.
 * TYPES + static CONSTANTS ONLY.
 *
 * This is a ROLLUP + dashboard, not a connection. No runtime, no fetch, no Supabase
 * client, no env reads, no clock reads, no DB writes, no API route. Decision stays
 * NO_GO; every gate blocker is unresolved; nothing is operational. Manual sign-off /
 * staging / real quote / production switch flags are NEVER flipped.
 *
 * See: docs/ledger-integrity-rollup.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type LedgerIntegrityHealthStatus =
  | "HEALTHY_SPEC_ONLY"
  | "PENDING_EVIDENCE"
  | "BLOCKED_NO_GO"
  | "MISSING_SOURCE_CONTRACT"
  | "PREVIEW_ONLY_LOCKED"
  | "PRODUCTION_LOCKED";

export type LedgerRollupMode = "SPEC_ONLY_SAFETY_GATE";

export type LedgerSafetyGateBlockerType =
  | "MANUAL_SIGNOFF_PENDING"
  | "EVIDENCE_PENDING"
  | "STAGING_LOCKED"
  | "REAL_QUOTE_LOCKED"
  | "PRODUCTION_SWITCH_LOCKED"
  | "SOURCE_CONTRACT_MISSING";

// ---------------------------------------------------------------------------
// Rollup item + blocker
// ---------------------------------------------------------------------------

export interface LedgerIntegrityRollupItem {
  itemId: string;
  title: string;
  sourceVersion: string;
  sourceContractPath: string;
  sourceContractExists: boolean;
  evidenceStatus: string;
  transitionPreviewStatus: string;
  healthStatus: LedgerIntegrityHealthStatus;
  blockerReason: string;
  operationalUseAllowed: false;
  manualReviewRequired: true;
}

export interface LedgerSafetyGateBlocker {
  blockerId: string;
  blockerType: LedgerSafetyGateBlockerType;
  title: string;
  reason: string;
  blocksStagingConnection: boolean;
  blocksRealQuoteConnection: boolean;
  blocksProductionSwitch: boolean;
  sourceEvidenceIds: string[];
  requiredResolution: string;
  resolved: false;
}

// ---------------------------------------------------------------------------
// Validation + rollup
// ---------------------------------------------------------------------------

export interface LedgerIntegrityRollupValidation {
  rollupItemsNonEmpty: boolean;
  rollupItemsCoverLedgerOrIntegrity: boolean;
  allRollupSourceContractsExist: boolean;
  allRollupOperationalUseFalse: boolean;
  safetyGateBlockersNonEmpty: boolean;
  allBlockersUnresolved: boolean;
  requiredBlockerTypesPresent: boolean;
  decisionNoGo: boolean;
  connectionFlagsAllFalse: boolean;
  valid: boolean;
}

export interface LedgerIntegrityRollup {
  contractVersion: "V72";
  specName: "Ledger Integrity Rollup & Safety Gate Dashboard";
  rollupMode: LedgerRollupMode;
  generatedAt: string;
  decision: "NO_GO";
  ledgerDecision: "NO_GO";
  transitionDecision: "NO_GO";

  sourceIntegrityOk: true;
  allSourceContractsExist: true;
  allEvidencePending: true;
  allTransitionsPreviewOnly: true;
  actualLedgerMutated: false;
  stagingConnectionAllowed: false;
  realQuoteConnectionAllowed: false;
  productionSwitchAllowed: false;
  operationalUseAllowed: false;
  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  fetchPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  productionReady: false;

  rollupItems: LedgerIntegrityRollupItem[];
  safetyGateBlockers: LedgerSafetyGateBlocker[];
  validation: LedgerIntegrityRollupValidation;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LEDGER_INTEGRITY_ROLLUP_CONTRACT_VERSION = "V72" as const;

export const LEDGER_INTEGRITY_ROLLUP_SPEC_NAME = "Ledger Integrity Rollup & Safety Gate Dashboard" as const;

export const LEDGER_INTEGRITY_ROLLUP_REQUIRED_BLOCKER_TYPES = [
  "MANUAL_SIGNOFF_PENDING",
  "EVIDENCE_PENDING",
  "STAGING_LOCKED",
  "REAL_QUOTE_LOCKED",
  "PRODUCTION_SWITCH_LOCKED",
] as const;

export const LEDGER_INTEGRITY_ROLLUP_SAFETY_LABELS = [
  "Ledger Integrity Rollup & Safety Gate Dashboard",
  "SPEC_ONLY_SAFETY_GATE",
  "NO_GO",
  "HEALTHY_SPEC_ONLY",
  "PENDING_EVIDENCE",
  "BLOCKED_NO_GO",
  "PREVIEW_ONLY_LOCKED",
  "PRODUCTION_LOCKED",
  "sourceIntegrityOk true",
  "allSourceContractsExist true",
  "allEvidencePending true",
  "allTransitionsPreviewOnly true",
  "actualLedgerMutated false",
  "stagingConnectionAllowed false",
  "realQuoteConnectionAllowed false",
  "productionSwitchAllowed false",
  "operationalUseAllowed false",
  "source contracts 完整，但 evidence 全部 pending，真實行情仍鎖定",
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
