/**
 * Staging Read-only Dry-run Execution Evidence Spec Contract Builder — V59
 *
 * Pure builder. Returns a deterministic execution-evidence spec (24 items across
 * 16 categories). Because the dry-run has not been executed and no real sign-off
 * evidence exists, the post-execution evidence items remain NOT_PROVIDED /
 * BLOCKED and block evidence acceptance, so the default decision is NO_GO and
 * every execution / sign-off / connection flag stays false. Nothing is executed
 * and nothing is connected.
 *
 * This is NOT a runtime and connects to NOTHING. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import / no client creation
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; no buy/sell commands; no auto orders
 */

import {
  STAGING_READONLY_DRY_RUN_EXECUTION_EVIDENCE_SPEC_SAFETY_LABELS,
} from "./staging-readonly-dry-run-execution-evidence-spec-contract";
import type {
  StagingReadonlyDryRunExecutionEvidenceCategory,
  StagingReadonlyDryRunExecutionEvidenceDecision,
  StagingReadonlyDryRunExecutionEvidenceItem,
  StagingReadonlyDryRunExecutionEvidenceSpecBundle,
  StagingReadonlyDryRunExecutionEvidenceStatus,
} from "./staging-readonly-dry-run-execution-evidence-spec-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStagingReadonlyDryRunExecutionEvidenceSpecContractInput {
  generatedAt?: string;
}

interface ItemDef {
  evidenceItemId: string;
  category: StagingReadonlyDryRunExecutionEvidenceCategory;
  title: string;
  requiredEvidence: string;
  acceptedEvidenceFormat: string;
  expectedState: string;
  providedState: string;
  status: StagingReadonlyDryRunExecutionEvidenceStatus;
  manualReviewRequired: boolean;
}

const NOTE = "evidence spec only：dry-run 尚未執行；不實際連線、不讀 env、不建立 Supabase client、不寫 DB。";
const FAIL_ACTION = "block evidence acceptance; keep decision NO_GO; require manual review before retry";
const FORMAT = "captured log / record / screenshot stored outside repo (no secrets in repo)";

/** Evidence still required after a future dry-run → NOT_PROVIDED, blocks acceptance. */
function need(
  evidenceItemId: string,
  category: StagingReadonlyDryRunExecutionEvidenceCategory,
  title: string,
  requiredEvidence: string,
  expectedState: string,
  status: StagingReadonlyDryRunExecutionEvidenceStatus,
): ItemDef {
  return {
    evidenceItemId,
    category,
    title,
    requiredEvidence,
    acceptedEvidenceFormat: FORMAT,
    expectedState,
    providedState: "not provided (dry-run not executed)",
    status,
    manualReviewRequired: true,
  };
}

/** Invariant already satisfied (spec-level) → PASS. */
function ok(
  evidenceItemId: string,
  category: StagingReadonlyDryRunExecutionEvidenceCategory,
  title: string,
  requiredEvidence: string,
  expectedState: string,
  providedState: string,
): ItemDef {
  return {
    evidenceItemId,
    category,
    title,
    requiredEvidence,
    acceptedEvidenceFormat: FORMAT,
    expectedState,
    providedState,
    status: "PASS",
    manualReviewRequired: false,
  };
}

const ITEM_DEFS: ItemDef[] = [
  need("execution-id", "EXECUTION_IDENTITY", "actual dry-run execution id must be provided", "unique dry-run execution id", "execution id recorded", "NOT_PROVIDED"),
  need("manual-signoff-before-evidence", "MANUAL_SIGNOFF", "manual sign-off evidence must be provided before execution evidence can pass", "completed manual sign-off evidence package", "manual sign-off provided", "NOT_PROVIDED"),
  need("read-only-probe-result", "READ_ONLY_PROBE", "read-only probe result must be captured", "read-only probe output", "read-only probe captured", "NOT_PROVIDED"),
  need("staging-select-only-result", "READ_ONLY_PROBE", "staging select-only result must be captured", "select-only query output", "select-only result captured", "NOT_PROVIDED"),
  need("staging-result-freshness", "READ_ONLY_PROBE", "staging result freshness evidence must be captured", "freshness check output", "freshness evidence captured", "NOT_PROVIDED"),
  need("no-write-evidence", "NO_WRITE_PROOF", "no insert / update / delete evidence must be captured", "no-write proof from RLS / permission test", "no write performed", "NOT_PROVIDED"),
  need("rls-select-only-behavior", "RLS_POLICY", "RLS select-only behavior must be captured", "RLS behavior test output", "select-only RLS confirmed", "NOT_PROVIDED"),
  need("dashboard-readonly-role-evidence", "ROLE_ACCESS", "dashboard_readonly_app role evidence must be captured", "role usage record", "dashboard_readonly_app role used", "NOT_PROVIDED"),
  need("service-role-not-used-evidence", "ROLE_ACCESS", "service_role not used in app runtime evidence must be captured", "code scan + runtime record", "service_role not used", "NOT_PROVIDED"),
  need("fixture-baseline-capture", "SHADOW_COMPARISON", "fixture baseline capture evidence must be captured", "fixture baseline snapshot", "fixture baseline captured", "NOT_PROVIDED"),
  need("comparison-count-evidence", "SHADOW_COMPARISON", "fixture vs staging comparison count evidence must be captured", "comparison count report", "comparison counts captured", "NOT_PROVIDED"),
  need("mismatch-classification-evidence", "MISMATCH_CLASSIFICATION", "mismatch classification evidence must be captured", "mismatch classification report", "mismatch classified, staging not promoted", "NOT_PROVIDED"),
  need("empty-fallback-evidence", "STALE_EMPTY_ERROR_FALLBACK", "empty result fallback evidence must be captured", "empty-result fallback record", "empty does not override hardcoded", "NOT_PROVIDED"),
  need("stale-fallback-evidence", "STALE_EMPTY_ERROR_FALLBACK", "stale result fallback evidence must be captured", "stale-result fallback record", "stale does not override hardcoded", "NOT_PROVIDED"),
  need("error-fallback-evidence", "STALE_EMPTY_ERROR_FALLBACK", "error result fallback evidence must be captured", "error-result fallback record", "error does not override hardcoded", "NOT_PROVIDED"),
  need("kill-switch-evidence", "KILL_SWITCH", "kill switch evidence must be captured", "kill switch trigger / test record", "kill switch verified", "NOT_PROVIDED"),
  need("rollback-evidence", "ROLLBACK", "rollback evidence must be captured", "rollback drill record", "rollback verified", "NOT_PROVIDED"),
  need("portfolio-source-mode-evidence", "PORTFOLIO_SOURCE_MODE", "PORTFOLIO_SOURCE_MODE remains hardcoded evidence must be captured", "config snapshot", "PORTFOLIO_SOURCE_MODE hardcoded", "NOT_PROVIDED"),
  need("portfolio-api-not-switched-evidence", "API_ROUTE_SAFETY", "/api/portfolio not switched evidence must be captured", "route config snapshot", "/api/portfolio unchanged", "NOT_PROVIDED"),
  need("no-real-market-data-evidence", "DATA_SOURCE_SAFETY", "no real market data evidence must be captured", "data-source record", "realMarketDataEnabled = false", "NOT_PROVIDED"),
  need("no-buy-sell-evidence", "TRADING_SAFETY", "no buy/sell command evidence must be captured", "trading-safety record", "buySellCommandGenerated = false", "NOT_PROVIDED"),
  need("no-auto-order-evidence", "TRADING_SAFETY", "no auto order evidence must be captured", "trading-safety record", "autoOrderRequested = false", "NOT_PROVIDED"),
  need("final-review-evidence", "FINAL_REVIEW", "final GO/NO-GO review evidence must be captured", "final review record with manual decision", "final review recorded (NO_GO until all PASS)", "BLOCKED"),
  ok("production-readiness-blocked", "FINAL_REVIEW", "production readiness remains blocked", "spec invariant", "productionReadinessAllowed = false", "false"),
];

function toItem(d: ItemDef): StagingReadonlyDryRunExecutionEvidenceItem {
  return {
    evidenceItemId: d.evidenceItemId,
    category: d.category,
    title: d.title,
    requiredEvidence: d.requiredEvidence,
    acceptedEvidenceFormat: d.acceptedEvidenceFormat,
    expectedState: d.expectedState,
    providedState: d.providedState,
    status: d.status,
    requiredAfterDryRunExecution: true,
    // Non-PASS evidence blocks acceptance; PASS invariants do not.
    blocksEvidenceAcceptance: d.status !== "PASS",
    blocksProductionReadiness: true,
    manualReviewRequired: d.manualReviewRequired,
    failureAction: FAIL_ACTION,
    notes: NOTE,
  };
}

/**
 * Builds a deterministic staging read-only dry-run execution evidence spec
 * bundle. All timestamps come from `input.generatedAt` (or a fixed fallback
 * string); no clock is read.
 */
export function buildStagingReadonlyDryRunExecutionEvidenceSpecContract(
  input: BuildStagingReadonlyDryRunExecutionEvidenceSpecContractInput = {},
): StagingReadonlyDryRunExecutionEvidenceSpecBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const evidenceItems: StagingReadonlyDryRunExecutionEvidenceItem[] = ITEM_DEFS.map(toItem);

  // decision: any acceptance-blocking item that is not PASS → NO_GO. Post-execution
  // evidence is NOT_PROVIDED (dry-run not executed), so the default decision is
  // NO_GO until real evidence is provided (out of scope for V59).
  const anyBlocking = evidenceItems.some((i) => i.blocksEvidenceAcceptance && i.status !== "PASS");
  const decision: StagingReadonlyDryRunExecutionEvidenceDecision = anyBlocking ? "NO_GO" : "READY_FOR_REVIEW";

  return {
    contractVersion: "V59",
    specName: "Staging Read-only Dry-run Execution Evidence Spec",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    evidenceItems,

    dryRunExecutionEvidenceSpecDefined: true,
    actualDryRunExecuted: false,
    actualDryRunEvidenceProvided: false,
    actualConnectionImplemented: false,
    actualConnectionAttempted: false,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    manualSignoffEvidenceProvided: false,
    stagingConnectionAllowed: false,
    stagingConnectionReviewAllowed: false,
    stagingDryRunExecutionAllowed: false,
    productionReadinessAllowed: false,
    stagingSupabaseConnected: false,
    stagingReadPerformed: false,
    stagingWritePerformed: false,
    productionSupabaseConnected: false,
    productionWritePerformed: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    requestPerformed: false,
    apiRouteCreated: false,
    uiCreated: false,
    sqlMigrationCreated: false,
    runtimeCreated: false,
    shadowRunnerRuntimeCreated: false,
    shadowRunnerExecuted: false,
    shadowComparisonPerformed: false,
    shadowResultPersisted: false,
    portfolioApiSwitched: false,
    portfolioSourceModeChanged: false,
    realMarketDataEnabled: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    killSwitchDefaultEnabled: true,
    serviceRoleAllowedInAppRuntime: false,
    anonRoleAllowed: false,
    dashboardReadonlyRoleRequired: true,
    readOnlySelectOnlyRequired: true,
    writeOperationsBlocked: true,
    shadowOnlyRequired: true,
    portfolioApiMustRemainHardcoded: true,
    fixtureCanBeOverriddenByStaging: false,
    hardcodedCanBeOverriddenByStaging: false,
    mismatchCanPromoteStaging: false,
    dryRunCanPromoteStaging: false,
    emptyResultCanOverrideHardcoded: false,
    staleResultCanOverrideHardcoded: false,
    errorResultCanOverrideHardcoded: false,

    futureGate: "V60 Manual Sign-off Evidence Instance / V60 Staging Read-only Dry-run Execution Evidence Instance",
    safetyLabels: [...STAGING_READONLY_DRY_RUN_EXECUTION_EVIDENCE_SPEC_SAFETY_LABELS],
  };
}
