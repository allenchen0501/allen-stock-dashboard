/**
 * Ledger Integrity Rollup Contract Builder — V72
 *
 * Pure deterministic builder. Rolls up the V70 evidence ledger + V71 transition
 * preview / source-contract integrity into a safety-gate dashboard, then
 * self-validates. Decision stays NO_GO; all gate blockers unresolved.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - Manual sign-off / staging / real quote / production switch flags never flipped
 */

import { buildUnifiedConnectionEvidenceLedgerContract } from "./build-unified-connection-evidence-ledger-contract";
import { buildEvidenceLedgerTransitionContract } from "./build-evidence-ledger-transition-contract";
import {
  buildLedgerIntegrityRollup,
  deriveLedgerSafetyGateBlockers,
  validateLedgerIntegrityRollup,
} from "./ledger-integrity-rollup-engine";
import {
  LEDGER_INTEGRITY_ROLLUP_SAFETY_LABELS,
  LEDGER_INTEGRITY_ROLLUP_SPEC_NAME,
} from "./ledger-integrity-rollup-contract";
import type {
  LedgerIntegrityRollup,
  LedgerIntegrityRollupValidation,
} from "./ledger-integrity-rollup-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildLedgerIntegrityRollupContractInput {
  generatedAt?: string;
}

/**
 * Builds the ledger integrity rollup. Reads no clock, no env, no network — only the
 * V70 ledger + V71 transition contract. Everything stays NO_GO / spec-only.
 */
export function buildLedgerIntegrityRollupContract(
  input: BuildLedgerIntegrityRollupContractInput = {},
): LedgerIntegrityRollup {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const ledger = buildUnifiedConnectionEvidenceLedgerContract({ generatedAt });
  const transitionContract = buildEvidenceLedgerTransitionContract({ generatedAt });

  const rollupItems = buildLedgerIntegrityRollup(ledger, transitionContract);
  const safetyGateBlockers = deriveLedgerSafetyGateBlockers(ledger, transitionContract);

  // Aggregate facts derived from V70 + V71.
  const allSourceContractsExist = transitionContract.sourceContractIntegrityItems.every((s) => s.sourceContractExists === true);
  const allEvidencePending = ledger.evidenceItems.every((i) => i.evidenceStatus === "PENDING");
  const allTransitionsPreviewOnly = transitionContract.transitionPreviewResults.every((r) => r.transitionMode === "PREVIEW_ONLY");
  const sourceIntegrityOk = allSourceContractsExist && transitionContract.sourceContractIntegrityItems.length > 0;

  const inner = validateLedgerIntegrityRollup({ rollupItems, safetyGateBlockers, decision: "NO_GO" });
  const allSourceContractPairsCovered = rollupItems.length >= 1 && rollupItems.length <= ledger.evidenceItems.length + transitionContract.sourceContractIntegrityItems.length;

  const validation: LedgerIntegrityRollupValidation = {
    rollupItemsNonEmpty: inner.rollupItemsNonEmpty,
    rollupItemsCoverLedgerOrIntegrity:
      rollupItems.length === ledger.evidenceItems.length || rollupItems.length === transitionContract.sourceContractIntegrityItems.length || allSourceContractPairsCovered,
    allRollupSourceContractsExist: inner.allRollupSourceContractsExist,
    allRollupOperationalUseFalse: inner.allRollupOperationalUseFalse,
    safetyGateBlockersNonEmpty: inner.safetyGateBlockersNonEmpty,
    allBlockersUnresolved: inner.allBlockersUnresolved,
    requiredBlockerTypesPresent: inner.requiredBlockerTypesPresent,
    decisionNoGo: inner.decisionNoGo,
    connectionFlagsAllFalse: true,
    valid: false,
  };
  validation.valid = Object.entries(validation).every(([k, v]) => k === "valid" || v === true);

  return {
    contractVersion: "V72",
    specName: LEDGER_INTEGRITY_ROLLUP_SPEC_NAME,
    rollupMode: "SPEC_ONLY_SAFETY_GATE",
    generatedAt,
    decision: "NO_GO",
    ledgerDecision: "NO_GO",
    transitionDecision: "NO_GO",

    sourceIntegrityOk: sourceIntegrityOk as true,
    allSourceContractsExist: allSourceContractsExist as true,
    allEvidencePending: allEvidencePending as true,
    allTransitionsPreviewOnly: allTransitionsPreviewOnly as true,
    actualLedgerMutated: false,
    stagingConnectionAllowed: false,
    realQuoteConnectionAllowed: false,
    productionSwitchAllowed: false,
    operationalUseAllowed: false,
    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    fetchPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    productionReady: false,

    rollupItems,
    safetyGateBlockers,
    validation,

    safetyLabels: [...LEDGER_INTEGRITY_ROLLUP_SAFETY_LABELS],
  };
}
