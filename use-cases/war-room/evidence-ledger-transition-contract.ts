/**
 * Evidence Ledger Transition Engine & Source Contract Integrity Contract — V71
 *
 * Read-model TypeScript contract describing — spec-only — how the V70 evidence
 * ledger would recompute its state if human evidence were provided/accepted
 * (PREVIEW ONLY, the real ledger is never mutated), plus an integrity check that the
 * V70 ledger items' sourceContracts actually point at existing contract/doc files.
 * TYPES + static CONSTANTS ONLY.
 *
 * This is a PREVIEW + integrity check, not a connection and not a real acceptance.
 * No runtime, no fetch, no Supabase client, no env reads, no clock reads, no DB
 * writes, no API route. actualLedgerMutated is always false; decision and
 * ledgerDecisionAfterPreview are always NO_GO (20 evidence items can never all be
 * completed here). Manual sign-off / staging / real quote / production switch flags
 * are NEVER flipped.
 *
 * See: docs/evidence-ledger-transition-engine.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type EvidenceTransitionMode = "PREVIEW_ONLY";
export type LedgerTransitionMode = "SPEC_ONLY_PREVIEW_NOT_CONNECTED";
export type SourceContractKind = "contract" | "doc";
export type SourceContractIntegrityStatus = "OK" | "MISSING";

// ---------------------------------------------------------------------------
// Transition input / result
// ---------------------------------------------------------------------------

export interface EvidenceTransitionInput {
  evidenceId: string;
  proposedEvidenceStatus: string;
  proposedEvidenceProvided: boolean;
  proposedEvidenceAccepted: boolean;
  proposedActualEvidenceAttached: boolean;
  proposedManualSignoffCompleted: boolean;
  transitionMode: EvidenceTransitionMode;
  runtimeEnabled: false;
  operationalUseAllowed: false;
}

export interface EvidenceTransitionResult {
  evidenceId: string;
  previousStatus: string;
  proposedStatus: string;
  acceptedInPreview: boolean;
  transitionMode: EvidenceTransitionMode;
  actualLedgerMutated: false;
  runtimeEnabled: false;
  operationalUseAllowed: false;
  manualReviewRequired: true;
  blocksStillRemaining: number;
  reasonText: string;
}

// ---------------------------------------------------------------------------
// Recalculation result
// ---------------------------------------------------------------------------

export interface EvidenceLedgerRecalculationResult {
  totalEvidenceCount: number;
  completedCount: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  stagingConnectionAllowed: false;
  realQuoteConnectionAllowed: false;
  productionSwitchAllowed: false;
  decision: "NO_GO";
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
}

// ---------------------------------------------------------------------------
// Source contract integrity
// ---------------------------------------------------------------------------

export interface EvidenceSourceContractIntegrityItem {
  evidenceId: string;
  sourceContractPath: string;
  sourceContractExists: boolean;
  sourceContractKind: SourceContractKind;
  referencedVersion: string;
  integrityStatus: SourceContractIntegrityStatus;
  missingReason: string;
}

// ---------------------------------------------------------------------------
// Validation + contract
// ---------------------------------------------------------------------------

export interface EvidenceLedgerTransitionValidation {
  transitionPreviewResultsNonEmpty: boolean;
  allPreviewMode: boolean;
  allActualLedgerNotMutated: boolean;
  recalculationCountsCorrect: boolean;
  recalculatedDecisionNoGo: boolean;
  integrityItemsNonEmpty: boolean;
  integrityCoversAllSourceContracts: boolean;
  allSourceContractsExist: boolean;
  allSourceContractKindsValid: boolean;
  allReferencedVersionsKnown: boolean;
  ledgerDecisionAfterPreviewNoGo: boolean;
  actualLedgerNotMutated: boolean;
  connectionFlagsAllFalse: boolean;
  valid: boolean;
}

export interface EvidenceLedgerTransitionContract {
  contractVersion: "V71";
  specName: "Evidence Ledger Transition Engine & Source Contract Integrity";
  transitionMode: LedgerTransitionMode;
  generatedAt: string;
  decision: "NO_GO";
  ledgerDecisionAfterPreview: "NO_GO";
  actualLedgerMutated: false;

  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  fetchPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  productionReady: false;

  transitionPreviewResults: EvidenceTransitionResult[];
  recalculationResult: EvidenceLedgerRecalculationResult;
  sourceContractIntegrityItems: EvidenceSourceContractIntegrityItem[];
  validation: EvidenceLedgerTransitionValidation;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EVIDENCE_LEDGER_TRANSITION_CONTRACT_VERSION = "V71" as const;

export const EVIDENCE_LEDGER_TRANSITION_SPEC_NAME =
  "Evidence Ledger Transition Engine & Source Contract Integrity" as const;

export const EVIDENCE_LEDGER_TRANSITION_KNOWN_VERSIONS = ["V64", "V65", "V66", "V67", "V68", "V69", "V70"] as const;

export const EVIDENCE_LEDGER_TRANSITION_SAFETY_LABELS = [
  "Evidence Ledger Transition Engine & Source Contract Integrity",
  "SPEC_ONLY_PREVIEW_NOT_CONNECTED",
  "PREVIEW_ONLY",
  "NO_GO",
  "actualLedgerMutated false",
  "ledgerDecisionAfterPreview NO_GO",
  "sourceContractIntegrityItems",
  "sourceContractExists true",
  "stagingConnectionAllowed false",
  "realQuoteConnectionAllowed false",
  "productionSwitchAllowed false",
  "productionReady false",
  "即使 preview 單項 evidence，真實行情與 staging 連線仍維持鎖定",
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
