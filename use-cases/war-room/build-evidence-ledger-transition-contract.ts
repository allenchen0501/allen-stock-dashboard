/**
 * Evidence Ledger Transition Contract Builder — V71
 *
 * Pure deterministic builder. Produces a PREVIEW-only transition result for every
 * V70 evidence item, recomputes the (unmutated) ledger aggregate + decision, and
 * checks source-contract integrity against the repo. The real ledger is never
 * mutated; decision and ledgerDecisionAfterPreview stay NO_GO.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - File reads are existence checks over the local repo only (integrity check)
 */

import { buildUnifiedConnectionEvidenceLedgerContract } from "./build-unified-connection-evidence-ledger-contract";
import {
  applyEvidenceTransitionPreview,
  recalculateLedgerDecision,
  validateEvidenceSourceContractIntegrity,
} from "./evidence-ledger-transition-engine";
import {
  EVIDENCE_LEDGER_TRANSITION_KNOWN_VERSIONS,
  EVIDENCE_LEDGER_TRANSITION_SAFETY_LABELS,
  EVIDENCE_LEDGER_TRANSITION_SPEC_NAME,
} from "./evidence-ledger-transition-contract";
import type {
  EvidenceLedgerTransitionContract,
  EvidenceLedgerTransitionValidation,
  EvidenceTransitionResult,
} from "./evidence-ledger-transition-contract";

const fs = require("node:fs") as typeof import("node:fs");
const nodePath = require("node:path") as typeof import("node:path");

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildEvidenceLedgerTransitionContractInput {
  generatedAt?: string;
}

/** Existence check over the local repo (integrity only — no env, no network). */
function repoFileExists(relPath: string): boolean {
  try {
    return fs.statSync(nodePath.resolve(process.cwd(), relPath)).isFile();
  } catch {
    return false;
  }
}

/**
 * Builds the evidence ledger transition contract. Reads no clock, no env, no network
 * — only the V70 ledger + local source-contract existence. Everything stays NO_GO /
 * preview-only / unmutated.
 */
export function buildEvidenceLedgerTransitionContract(
  input: BuildEvidenceLedgerTransitionContractInput = {},
): EvidenceLedgerTransitionContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const ledger = buildUnifiedConnectionEvidenceLedgerContract({ generatedAt });

  // One PREVIEW-only transition per evidence item (proposing acceptance), to show
  // that even so the ledger stays NO_GO and is never mutated.
  const transitionPreviewResults: EvidenceTransitionResult[] = ledger.evidenceItems.map((item) =>
    applyEvidenceTransitionPreview(ledger, {
      evidenceId: item.evidenceId,
      proposedEvidenceStatus: "ACCEPTED_IN_PREVIEW",
      proposedEvidenceProvided: true,
      proposedEvidenceAccepted: true,
      proposedActualEvidenceAttached: false,
      proposedManualSignoffCompleted: false,
      transitionMode: "PREVIEW_ONLY",
      runtimeEnabled: false,
      operationalUseAllowed: false,
    }),
  );

  const recalculationResult = recalculateLedgerDecision(ledger);
  const sourceContractIntegrityItems = validateEvidenceSourceContractIntegrity(ledger, repoFileExists);

  // ----- validation -----
  const knownVersions = new Set(EVIDENCE_LEDGER_TRANSITION_KNOWN_VERSIONS as readonly string[]);
  const allSourceContractPairs = ledger.evidenceItems.flatMap((i) =>
    i.sourceContracts.map((p) => `${i.evidenceId}::${p}`),
  );
  const coveredPairs = new Set(sourceContractIntegrityItems.map((s) => `${s.evidenceId}::${s.sourceContractPath}`));

  const transitionPreviewResultsNonEmpty = transitionPreviewResults.length > 0;
  const allPreviewMode = transitionPreviewResults.every((r) => r.transitionMode === "PREVIEW_ONLY");
  const allActualLedgerNotMutated = transitionPreviewResults.every((r) => r.actualLedgerMutated === false);
  const recalculationCountsCorrect =
    recalculationResult.totalEvidenceCount === ledger.evidenceItems.length &&
    recalculationResult.completedCount === 0 &&
    recalculationResult.pendingCount === ledger.evidenceItems.length;
  const recalculatedDecisionNoGo = recalculationResult.decision === "NO_GO";
  const integrityItemsNonEmpty = sourceContractIntegrityItems.length > 0;
  const integrityCoversAllSourceContracts = allSourceContractPairs.every((p) => coveredPairs.has(p));
  const allSourceContractsExist = sourceContractIntegrityItems.every((s) => s.sourceContractExists === true);
  const allSourceContractKindsValid = sourceContractIntegrityItems.every(
    (s) => s.sourceContractKind === "contract" || s.sourceContractKind === "doc",
  );
  const allReferencedVersionsKnown = sourceContractIntegrityItems.every((s) =>
    s.referencedVersion.split("/").some((v) => knownVersions.has(v)),
  );

  const validation: EvidenceLedgerTransitionValidation = {
    transitionPreviewResultsNonEmpty,
    allPreviewMode,
    allActualLedgerNotMutated,
    recalculationCountsCorrect,
    recalculatedDecisionNoGo,
    integrityItemsNonEmpty,
    integrityCoversAllSourceContracts,
    allSourceContractsExist,
    allSourceContractKindsValid,
    allReferencedVersionsKnown,
    ledgerDecisionAfterPreviewNoGo: true,
    actualLedgerNotMutated: true,
    connectionFlagsAllFalse: true,
    valid: false,
  };
  validation.valid = Object.entries(validation).every(([k, v]) => k === "valid" || v === true);

  return {
    contractVersion: "V71",
    specName: EVIDENCE_LEDGER_TRANSITION_SPEC_NAME,
    transitionMode: "SPEC_ONLY_PREVIEW_NOT_CONNECTED",
    generatedAt,
    decision: "NO_GO",
    ledgerDecisionAfterPreview: "NO_GO",
    actualLedgerMutated: false,

    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    fetchPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    productionReady: false,

    transitionPreviewResults,
    recalculationResult,
    sourceContractIntegrityItems,
    validation,

    safetyLabels: [...EVIDENCE_LEDGER_TRANSITION_SAFETY_LABELS],
  };
}
