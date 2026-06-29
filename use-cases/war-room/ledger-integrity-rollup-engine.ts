/**
 * Ledger Integrity Rollup Engine — V72
 *
 * Pure, deterministic functions that roll up the V70 evidence ledger + V71 transition
 * preview / source-contract integrity into rollup items, an overall health status,
 * and safety-gate blockers. NO side effects, NO I/O. Never connects, fetches, reads
 * env, reads a clock, or writes data. Decision stays NO_GO; all blockers unresolved.
 */

import type { UnifiedConnectionEvidenceLedger } from "./unified-connection-evidence-ledger-contract";
import type { EvidenceLedgerTransitionContract } from "./evidence-ledger-transition-contract";
import type {
  LedgerIntegrityHealthStatus,
  LedgerIntegrityRollupItem,
  LedgerSafetyGateBlocker,
} from "./ledger-integrity-rollup-contract";

/**
 * Builds one rollup item per V70 evidence item, merging V71 source-contract integrity
 * (existence) and transition preview status. Every item stays observation-only.
 */
export function buildLedgerIntegrityRollup(
  ledger: UnifiedConnectionEvidenceLedger,
  transitionContract: EvidenceLedgerTransitionContract,
): LedgerIntegrityRollupItem[] {
  const integrityBySymbol = new Map<string, boolean>();
  for (const integrity of transitionContract.sourceContractIntegrityItems) {
    const prev = integrityBySymbol.get(integrity.evidenceId);
    const exists = integrity.sourceContractExists === true;
    integrityBySymbol.set(integrity.evidenceId, prev === undefined ? exists : prev && exists);
  }
  const previewBySymbol = new Map<string, string>();
  for (const preview of transitionContract.transitionPreviewResults) {
    if (!previewBySymbol.has(preview.evidenceId)) previewBySymbol.set(preview.evidenceId, preview.transitionMode);
  }

  return ledger.evidenceItems.map((item) => {
    const sourceContractExists = integrityBySymbol.get(item.evidenceId) ?? false;
    const transitionPreviewStatus = previewBySymbol.get(item.evidenceId) ?? "PREVIEW_ONLY";

    let healthStatus: LedgerIntegrityHealthStatus;
    if (!sourceContractExists) {
      healthStatus = "MISSING_SOURCE_CONTRACT";
    } else if (item.blocksProductionSwitch && item.category === "PRODUCTION_SWITCH") {
      healthStatus = "PRODUCTION_LOCKED";
    } else if (transitionPreviewStatus === "PREVIEW_ONLY" && item.evidenceStatus === "PENDING") {
      healthStatus = "PENDING_EVIDENCE";
    } else {
      healthStatus = "BLOCKED_NO_GO";
    }

    return {
      itemId: item.evidenceId,
      title: item.title,
      sourceVersion: item.requiredByVersions.join("/"),
      sourceContractPath: item.sourceContracts[0] ?? "(none)",
      sourceContractExists,
      evidenceStatus: item.evidenceStatus,
      transitionPreviewStatus,
      healthStatus,
      blockerReason:
        healthStatus === "MISSING_SOURCE_CONTRACT"
          ? `source contract 不存在：${item.sourceContracts[0] ?? "(none)"}`
          : `evidence 為 ${item.evidenceStatus}、transition 為 ${transitionPreviewStatus}（preview-only locked）`,
      operationalUseAllowed: false,
      manualReviewRequired: true,
    };
  });
}

/**
 * Derives the overall ledger health status from rollup items. Any missing source
 * contract dominates; otherwise the ledger is BLOCKED_NO_GO while all evidence is
 * pending (preview-only locked).
 */
export function deriveLedgerHealthStatus(rollupItems: LedgerIntegrityRollupItem[]): LedgerIntegrityHealthStatus {
  if (rollupItems.length === 0) return "BLOCKED_NO_GO";
  if (rollupItems.some((i) => i.healthStatus === "MISSING_SOURCE_CONTRACT")) return "MISSING_SOURCE_CONTRACT";
  // All source contracts exist but every evidence is pending → still NO_GO.
  return "BLOCKED_NO_GO";
}

/**
 * Derives the safety-gate blockers. All five required blocker types are emitted and
 * every one is unresolved while evidence is pending. PREVIEW_ONLY_LOCKED /
 * HEALTHY_SPEC_ONLY are referenced via item health, not as resolved gates.
 */
export function deriveLedgerSafetyGateBlockers(
  ledger: UnifiedConnectionEvidenceLedger,
  transitionContract: EvidenceLedgerTransitionContract,
): LedgerSafetyGateBlocker[] {
  const allIds = ledger.evidenceItems.map((i) => i.evidenceId);
  const signoffIds = ledger.evidenceItems
    .filter((i) => i.manualSignoffRequired === true && (i.evidenceId.includes("SIGNOFF") || i.evidenceId.includes("APPROVAL")))
    .map((i) => i.evidenceId);
  const stagingIds = ledger.evidenceItems.filter((i) => i.blocksStagingConnection).map((i) => i.evidenceId);
  const realQuoteIds = ledger.evidenceItems.filter((i) => i.blocksRealQuoteConnection).map((i) => i.evidenceId);
  const productionIds = ledger.evidenceItems.filter((i) => i.blocksProductionSwitch).map((i) => i.evidenceId);

  const transitionNoGo = transitionContract.ledgerDecisionAfterPreview === "NO_GO";

  return [
    {
      blockerId: "BLOCK_MANUAL_SIGNOFF",
      blockerType: "MANUAL_SIGNOFF_PENDING",
      title: "Manual sign-off pending",
      reason: `owner / final approval sign-off 尚未完成（transition preview NO_GO=${transitionNoGo}）。`,
      blocksStagingConnection: true,
      blocksRealQuoteConnection: true,
      blocksProductionSwitch: true,
      sourceEvidenceIds: signoffIds.length > 0 ? signoffIds : ["OWNER_MANUAL_SIGNOFF"],
      requiredResolution: "完成並附上 owner manual sign-off 與 production switch final approval。",
      resolved: false,
    },
    {
      blockerId: "BLOCK_EVIDENCE_PENDING",
      blockerType: "EVIDENCE_PENDING",
      title: "Evidence pending",
      reason: "20 項 evidence 全部 PENDING、未提供、未接受。",
      blocksStagingConnection: true,
      blocksRealQuoteConnection: true,
      blocksProductionSwitch: true,
      sourceEvidenceIds: allIds,
      requiredResolution: "逐項提供並接受人工 evidence。",
      resolved: false,
    },
    {
      blockerId: "BLOCK_STAGING_LOCKED",
      blockerType: "STAGING_LOCKED",
      title: "Staging connection locked",
      reason: "staging read-only 連線前置 evidence 未完成。",
      blocksStagingConnection: true,
      blocksRealQuoteConnection: false,
      blocksProductionSwitch: false,
      sourceEvidenceIds: stagingIds,
      requiredResolution: "完成 staging read-only / RLS / service role 等確認。",
      resolved: false,
    },
    {
      blockerId: "BLOCK_REAL_QUOTE_LOCKED",
      blockerType: "REAL_QUOTE_LOCKED",
      title: "Real quote connection locked",
      reason: "real quote 來源授權 / mapping review 未完成。",
      blocksStagingConnection: false,
      blocksRealQuoteConnection: true,
      blocksProductionSwitch: false,
      sourceEvidenceIds: realQuoteIds,
      requiredResolution: "完成 source authorization 與 real quote mapping review。",
      resolved: false,
    },
    {
      blockerId: "BLOCK_PRODUCTION_SWITCH_LOCKED",
      blockerType: "PRODUCTION_SWITCH_LOCKED",
      title: "Production switch locked",
      reason: "shadow comparison / rollback / kill switch / final approval 未完成。",
      blocksStagingConnection: false,
      blocksRealQuoteConnection: false,
      blocksProductionSwitch: true,
      sourceEvidenceIds: productionIds,
      requiredResolution: "完成 shadow comparison result、rollback runbook、kill switch 與 final approval。",
      resolved: false,
    },
  ];
}

/** Validates one rollup's invariants (used by the builder + validator). */
export function validateLedgerIntegrityRollup(rollup: {
  rollupItems: LedgerIntegrityRollupItem[];
  safetyGateBlockers: LedgerSafetyGateBlocker[];
  decision: string;
}): {
  rollupItemsNonEmpty: boolean;
  allRollupSourceContractsExist: boolean;
  allRollupOperationalUseFalse: boolean;
  safetyGateBlockersNonEmpty: boolean;
  allBlockersUnresolved: boolean;
  requiredBlockerTypesPresent: boolean;
  decisionNoGo: boolean;
} {
  const types = new Set(rollup.safetyGateBlockers.map((b) => b.blockerType));
  const required = ["MANUAL_SIGNOFF_PENDING", "EVIDENCE_PENDING", "STAGING_LOCKED", "REAL_QUOTE_LOCKED", "PRODUCTION_SWITCH_LOCKED"];
  return {
    rollupItemsNonEmpty: rollup.rollupItems.length > 0,
    allRollupSourceContractsExist: rollup.rollupItems.every((i) => i.sourceContractExists === true),
    allRollupOperationalUseFalse: rollup.rollupItems.every((i) => i.operationalUseAllowed === false),
    safetyGateBlockersNonEmpty: rollup.safetyGateBlockers.length > 0,
    allBlockersUnresolved: rollup.safetyGateBlockers.every((b) => b.resolved === false),
    requiredBlockerTypesPresent: required.every((t) => types.has(t as never)),
    decisionNoGo: rollup.decision === "NO_GO",
  };
}
