/**
 * Staging Read-only Dry-run Execution Gate Contract Builder — V58
 *
 * Pure builder. Returns a deterministic execution gate (26 items across 15
 * categories). Because manual sign-off evidence is still not provided, the
 * sign-off / evidence / external-verification items remain NOT_PROVIDED /
 * NOT_REVIEWED / BLOCKED and block dry-run execution, so the default decision is
 * NO_GO and every connection / dry-run-execution flag stays false. Nothing is
 * executed and nothing is connected.
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
  STAGING_READONLY_DRY_RUN_EXECUTION_GATE_SAFETY_LABELS,
} from "./staging-readonly-dry-run-execution-gate-contract";
import type {
  StagingReadonlyDryRunExecutionCategory,
  StagingReadonlyDryRunExecutionDecision,
  StagingReadonlyDryRunExecutionGateBundle,
  StagingReadonlyDryRunExecutionGateItem,
  StagingReadonlyDryRunExecutionStatus,
} from "./staging-readonly-dry-run-execution-gate-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStagingReadonlyDryRunExecutionGateContractInput {
  generatedAt?: string;
}

interface ItemDef {
  gateItemId: string;
  category: StagingReadonlyDryRunExecutionCategory;
  title: string;
  requiredEvidence: string;
  expectedState: string;
  actualState: string;
  status: StagingReadonlyDryRunExecutionStatus;
  manualReviewRequired: boolean;
}

const NOTE = "execution gate only：不實際連線、不執行 dry-run、不讀 env、不建立 Supabase client。";
const FAIL_ACTION = "block dry-run execution; keep decision NO_GO; require manual review before retry";

/** Evidence still required → NOT_PROVIDED/NOT_REVIEWED/BLOCKED, blocks execution. */
function need(
  gateItemId: string,
  category: StagingReadonlyDryRunExecutionCategory,
  title: string,
  requiredEvidence: string,
  expectedState: string,
  actualState: string,
  status: StagingReadonlyDryRunExecutionStatus,
): ItemDef {
  return { gateItemId, category, title, requiredEvidence, expectedState, actualState, status, manualReviewRequired: true };
}

/** Invariant already satisfied → PASS, still listed as a gate precondition. */
function ok(
  gateItemId: string,
  category: StagingReadonlyDryRunExecutionCategory,
  title: string,
  requiredEvidence: string,
  expectedState: string,
  actualState: string,
): ItemDef {
  return { gateItemId, category, title, requiredEvidence, expectedState, actualState, status: "PASS", manualReviewRequired: false };
}

const ITEM_DEFS: ItemDef[] = [
  ok("v57-plan-exists", "EVIDENCE_REQUIREMENTS", "V57 dry-run plan exists", "V57 dry-run plan contract present", "v57DryRunPlanExists = true", "true"),
  ok("v56-spec-exists", "EVIDENCE_REQUIREMENTS", "V56 manual sign-off evidence spec exists", "V56 manual sign-off evidence spec present", "v56ManualSignoffSpecExists = true", "true"),
  need("signoff-evidence-not-provided", "MANUAL_SIGNOFF", "manual sign-off evidence is not provided", "manual sign-off evidence package", "manualSignoffEvidenceProvided = true (future)", "not provided", "NOT_PROVIDED"),
  need("signoff-not-completed", "MANUAL_SIGNOFF", "manual sign-off is not completed", "completed sign-off record", "manualSignoffCompleted = true (future)", "false", "BLOCKED"),
  need("signer-identity-not-verified", "MANUAL_SIGNOFF", "signer identity is not verified", "verified signer identity record", "manualSignerIdentityVerified = true (future)", "false", "NOT_REVIEWED"),
  need("signer-authority-not-verified", "MANUAL_SIGNOFF", "signer authority is not verified", "verified signer authority record", "manualSignerHasAuthority = true (future)", "false", "NOT_REVIEWED"),
  need("supabase-project-identity", "SUPABASE_PROJECT", "staging Supabase project identity must be provided before execution", "staging project identity provided outside code", "project identity verified", "not provided", "NOT_PROVIDED"),
  need("staging-url-verified", "SUPABASE_PROJECT", "staging URL must be verified outside code before execution", "staging URL verified outside code", "staging URL verified", "not provided", "NOT_PROVIDED"),
  ok("no-env-read-in-v58", "ENVIRONMENT_VARIABLES", "env variables must not be read by V58", "code scan confirms no env read in app runtime", "envReadPerformed = false", "false"),
  ok("no-service-role", "ROLE_ACCESS", "service_role must not be used in app runtime", "code scan: no service_role in app runtime", "serviceRoleAllowedInAppRuntime = false", "false"),
  need("dashboard-readonly-role-required", "ROLE_ACCESS", "dashboard_readonly_app role must be required", "dashboard_readonly_app role definition", "dashboardReadonlyRoleRequired = true (verified)", "required, not yet verified", "NOT_REVIEWED"),
  need("rls-select-only-required", "RLS_POLICY", "RLS select-only policy evidence must be required", "RLS select-only policy export", "select-only RLS verified", "not provided", "NOT_PROVIDED"),
  ok("write-operations-blocked", "READ_ONLY_OPERATION", "write operations must remain blocked", "spec invariant + future RLS test", "writeOperationsBlocked = true", "true"),
  ok("future-dry-run-shadow-only", "SHADOW_ONLY", "future dry-run must be shadow-only", "spec invariant", "shadowOnlyRequired = true", "true"),
  ok("fixture-not-overridden", "SHADOW_ONLY", "fixture/hardcoded must not be overridden by staging", "spec invariant", "fixture/hardcodedCanBeOverriddenByStaging = false", "false"),
  ok("mismatch-not-promote", "SHADOW_ONLY", "mismatch must not promote staging", "spec invariant", "mismatchCanPromoteStaging = false", "false"),
  ok("empty-stale-error-no-override", "SHADOW_ONLY", "empty / stale / error must not override hardcoded", "spec invariant", "empty/stale/errorResultCanOverrideHardcoded = false", "false"),
  need("kill-switch-tested", "KILL_SWITCH", "kill switch must be enabled and tested before execution", "kill switch test record", "kill switch enabled + tested", "enabled by default; test not yet recorded", "NOT_REVIEWED"),
  need("rollback-plan-exists", "ROLLBACK", "rollback plan must exist before execution", "rollback runbook document", "rollback plan provided", "not provided", "NOT_PROVIDED"),
  ok("portfolio-source-mode-hardcoded", "PORTFOLIO_SOURCE_MODE", "PORTFOLIO_SOURCE_MODE must remain hardcoded", "spec invariant", "portfolioApiMustRemainHardcoded = true", "true"),
  ok("portfolio-api-not-switched", "API_ROUTE_SAFETY", "/api/portfolio must not be switched", "spec invariant", "portfolioApiSwitched = false", "false"),
  ok("production-readiness-blocked", "FINAL_GO_NO_GO", "production readiness remains blocked", "spec invariant", "productionReadinessAllowed = false", "false"),
  ok("real-market-data-disabled", "DATA_SOURCE_SAFETY", "real market data remains disabled", "spec invariant", "realMarketDataEnabled = false", "false"),
  ok("no-buy-sell", "TRADING_SAFETY", "buy/sell command generation remains disabled", "spec invariant", "buySellCommandGenerated = false", "false"),
  ok("no-auto-order", "TRADING_SAFETY", "auto order remains disabled", "spec invariant", "autoOrderRequested = false", "false"),
  need("final-go-no-go", "FINAL_GO_NO_GO", "final GO/NO-GO must remain NO_GO until evidence is provided", "complete sign-off evidence + manual GO decision", "GO only after all evidence PASS", "NO_GO", "BLOCKED"),
];

function toItem(d: ItemDef): StagingReadonlyDryRunExecutionGateItem {
  return {
    gateItemId: d.gateItemId,
    category: d.category,
    title: d.title,
    requiredBeforeDryRunExecution: true,
    requiredEvidence: d.requiredEvidence,
    expectedState: d.expectedState,
    actualState: d.actualState,
    status: d.status,
    // PASS invariants stay listed but no longer block; non-PASS items block.
    blocksDryRunExecution: d.status !== "PASS",
    blocksActualConnection: true,
    blocksProductionReadiness: true,
    manualReviewRequired: d.manualReviewRequired,
    failureAction: FAIL_ACTION,
    notes: NOTE,
  };
}

/**
 * Builds a deterministic staging read-only dry-run execution gate bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no clock
 * is read.
 */
export function buildStagingReadonlyDryRunExecutionGateContract(
  input: BuildStagingReadonlyDryRunExecutionGateContractInput = {},
): StagingReadonlyDryRunExecutionGateBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const gateItems: StagingReadonlyDryRunExecutionGateItem[] = ITEM_DEFS.map(toItem);

  // decision: any execution-blocking item that is not PASS → NO_GO. Sign-off /
  // evidence / final-go-no-go items block, so the default decision is NO_GO until
  // real sign-off evidence is provided (out of scope for V58).
  const anyBlocking = gateItems.some((i) => i.blocksDryRunExecution && i.status !== "PASS");
  const decision: StagingReadonlyDryRunExecutionDecision = anyBlocking ? "NO_GO" : "READY_FOR_REVIEW";

  return {
    contractVersion: "V58",
    gateName: "Staging Read-only Dry-run Execution Gate",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    gateItems,

    dryRunExecutionGateDefined: true,
    v57DryRunPlanExists: true,
    v56ManualSignoffSpecExists: true,
    v55ConnectionReviewGateExists: true,
    actualDryRunExecuted: false,
    actualConnectionImplemented: false,
    actualConnectionAttempted: false,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    manualSignoffEvidenceProvided: false,
    manualSignerIdentityVerified: false,
    manualSignerHasAuthority: false,
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

    futureGate: "V59 Manual Sign-off Evidence Instance / V59 Staging Read-only Dry-run Execution Evidence",
    safetyLabels: [...STAGING_READONLY_DRY_RUN_EXECUTION_GATE_SAFETY_LABELS],
  };
}
