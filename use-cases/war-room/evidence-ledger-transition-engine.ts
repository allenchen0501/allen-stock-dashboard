/**
 * Evidence Ledger Transition Engine — V71
 *
 * Pure, deterministic functions over the V70 evidence ledger. NO side effects, NO
 * I/O of their own (file existence is supplied by an injected predicate). They never
 * connect, fetch, read env, read a clock, or write data. They only PREVIEW what a
 * transition would look like and recompute aggregate counts / decision — the real
 * ledger is never mutated, and the decision stays NO_GO.
 */

import type {
  UnifiedConnectionEvidenceCategory,
  UnifiedConnectionEvidenceLedger,
} from "./unified-connection-evidence-ledger-contract";
import type {
  EvidenceLedgerRecalculationResult,
  EvidenceSourceContractIntegrityItem,
  EvidenceTransitionInput,
  EvidenceTransitionResult,
  SourceContractKind,
} from "./evidence-ledger-transition-contract";

/**
 * Previews a single evidence transition WITHOUT mutating the ledger. The proposed
 * acceptance is reflected only in `acceptedInPreview`; actualLedgerMutated stays
 * false and production blockers remain.
 */
export function applyEvidenceTransitionPreview(
  ledger: UnifiedConnectionEvidenceLedger,
  input: EvidenceTransitionInput,
): EvidenceTransitionResult {
  const item = ledger.evidenceItems.find((i) => i.evidenceId === input.evidenceId);
  const previousStatus = item ? item.evidenceStatus : "(unknown)";

  // Production blockers that are still pending (ledger is NOT mutated). If the
  // previewed item is itself a blocker and is "accepted" in preview, show one fewer.
  const blockers = ledger.evidenceItems.filter((i) => i.blocksProductionSwitch && i.evidenceAccepted === false);
  const previewClearsOne = input.proposedEvidenceAccepted && item != null && item.blocksProductionSwitch;
  const blocksStillRemaining = Math.max(0, blockers.length - (previewClearsOne ? 1 : 0));

  return {
    evidenceId: input.evidenceId,
    previousStatus,
    proposedStatus: input.proposedEvidenceStatus,
    acceptedInPreview: input.proposedEvidenceAccepted === true,
    transitionMode: "PREVIEW_ONLY",
    actualLedgerMutated: false,
    runtimeEnabled: false,
    operationalUseAllowed: false,
    manualReviewRequired: true,
    blocksStillRemaining,
    reasonText:
      `preview-only：proposed ${input.proposedEvidenceStatus}（accepted=${input.proposedEvidenceAccepted}），` +
      `但 actualLedgerMutated=false、ledger decision 仍 NO_GO；尚有 ${blocksStillRemaining} 項 production blocker 未清除。`,
  };
}

/** Recomputes category aggregates from the (unmutated) ledger items. */
export function recalculateEvidenceCategories(
  ledger: UnifiedConnectionEvidenceLedger,
): UnifiedConnectionEvidenceCategory[] {
  const byId = new Map<string, typeof ledger.evidenceItems>();
  for (const item of ledger.evidenceItems) {
    const arr = byId.get(item.category) ?? [];
    arr.push(item);
    byId.set(item.category, arr);
  }
  const categories: UnifiedConnectionEvidenceCategory[] = [];
  for (const [categoryId, arr] of byId) {
    // evidenceAccepted is literal-false in V70; widen to boolean for counting.
    const accepted = arr.filter((i) => (i.evidenceAccepted as boolean) === true).length;
    categories.push({
      categoryId,
      title: ledger.evidenceCategories.find((c) => c.categoryId === categoryId)?.title ?? categoryId,
      itemCount: arr.length,
      completedCount: 0,
      pendingCount: arr.length - accepted,
      categoryStatus: "PENDING",
      blocksStagingConnection: arr.some((i) => i.blocksStagingConnection),
      blocksRealQuoteConnection: arr.some((i) => i.blocksRealQuoteConnection),
      blocksProductionSwitch: arr.some((i) => i.blocksProductionSwitch),
    });
  }
  return categories;
}

/**
 * Recomputes ledger-level counts + decision. Decision is NO_GO unless every evidence
 * item is accepted AND manually signed off — which never happens in spec mode, so it
 * always returns NO_GO. All connection flags stay false.
 */
export function recalculateLedgerDecision(
  ledger: UnifiedConnectionEvidenceLedger,
): EvidenceLedgerRecalculationResult {
  const items = ledger.evidenceItems;
  const totalEvidenceCount = items.length;
  // evidenceAccepted / manualSignoffCompleted are literal-false in V70; widen to boolean.
  const acceptedCount = items.filter((i) => (i.evidenceAccepted as boolean) === true).length;
  const rejectedCount = 0;
  const completedCount = items.filter(
    (i) => (i.evidenceAccepted as boolean) === true && (i.manualSignoffCompleted as boolean) === true,
  ).length;
  const pendingCount = totalEvidenceCount - completedCount;

  // Even if (hypothetically) all accepted, manualSignoffCompleted is literal-false in
  // V70 items, so this never becomes true — decision remains NO_GO.
  const everyCompleted = totalEvidenceCount > 0 && completedCount === totalEvidenceCount;

  return {
    totalEvidenceCount,
    completedCount,
    pendingCount,
    acceptedCount,
    rejectedCount,
    stagingConnectionAllowed: false,
    realQuoteConnectionAllowed: false,
    productionSwitchAllowed: false,
    decision: everyCompleted ? "NO_GO" : "NO_GO",
    manualSignoffCompleted: false,
    actualEvidenceAttached: false,
    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    fetchPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    productionReady: false,
  };
}

function kindForPath(path: string): SourceContractKind {
  return path.endsWith(".ts") ? "contract" : "doc";
}

/**
 * Checks that every (evidenceId, sourceContract) pair points at an existing file.
 * File existence is supplied via the injected `fileExists` predicate so this stays
 * pure and testable.
 */
export function validateEvidenceSourceContractIntegrity(
  ledger: UnifiedConnectionEvidenceLedger,
  fileExists: (relPath: string) => boolean,
): EvidenceSourceContractIntegrityItem[] {
  const items: EvidenceSourceContractIntegrityItem[] = [];
  for (const item of ledger.evidenceItems) {
    for (const sourceContractPath of item.sourceContracts) {
      const exists = fileExists(sourceContractPath);
      items.push({
        evidenceId: item.evidenceId,
        sourceContractPath,
        sourceContractExists: exists,
        sourceContractKind: kindForPath(sourceContractPath),
        referencedVersion: item.requiredByVersions.join("/"),
        integrityStatus: exists ? "OK" : "MISSING",
        missingReason: exists ? "" : `sourceContract 路徑不存在：${sourceContractPath}`,
      });
    }
  }
  return items;
}
