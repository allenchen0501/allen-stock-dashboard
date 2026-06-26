/**
 * Staging Read-only Connection Review Gate Contract Builder — V55
 *
 * Pure builder. Returns a deterministic connection-review gate. Because there is
 * no manual sign-off evidence yet, the manual-signoff requirement items remain
 * NOT_REVIEWED / BLOCKED and block the connection review, so the default decision
 * is NO_GO, stagingConnectionAllowed is false, and stagingConnectionReviewAllowed
 * is false.
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
  STAGING_READONLY_CONNECTION_REVIEW_GATE_SAFETY_LABELS,
} from "./staging-readonly-connection-review-gate-contract";
import type {
  StagingReadonlyConnectionReviewCategory,
  StagingReadonlyConnectionReviewDecision,
  StagingReadonlyConnectionReviewGateBundle,
  StagingReadonlyConnectionReviewRequirementItem,
  StagingReadonlyConnectionReviewStatus,
} from "./staging-readonly-connection-review-gate-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStagingReadonlyConnectionReviewGateContractInput {
  generatedAt?: string;
}

interface ItemDef {
  requirementId: string;
  category: StagingReadonlyConnectionReviewCategory;
  title: string;
  sourceVersion: string;
  requiredBeforeConnectionReview: boolean;
  requiredBeforeActualConnection: boolean;
  expectedState: string;
  actualState: string;
  status: StagingReadonlyConnectionReviewStatus;
  blocksConnectionReview: boolean;
  blocksActualConnection: boolean;
  blocksProductionReadiness: boolean;
  manualReviewRequired: boolean;
  notes: string;
}

const NOTE = "review gate only；不實際連線、不讀 env、不建立 Supabase client、不寫 DB。";

const ITEM_DEFS: ItemDef[] = [
  { requirementId: "v54-checklist-passed", category: "V54_CHECKLIST", title: "V54 checklist exists and passed", sourceVersion: "V54", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "v54ChecklistPassed = true", actualState: "true", status: "PASS", blocksConnectionReview: true, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "v54-production-readiness-blocked", category: "V54_CHECKLIST", title: "V54 production readiness remains blocked", sourceVersion: "V54", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "v54ChecklistProductionReady = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "manual-signoff-required", category: "MANUAL_SIGNOFF", title: "manual signoff is required", sourceVersion: "V55", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "manualSignoffRequired = true", actualState: "manualSignoffRequired = true", status: "NOT_REVIEWED", blocksConnectionReview: true, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "manual-signoff-not-completed", category: "MANUAL_SIGNOFF", title: "manual signoff is not completed", sourceVersion: "V55", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "manualSignoffCompleted = false", actualState: "false", status: "NOT_REVIEWED", blocksConnectionReview: true, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "manual-signoff-evidence-not-provided", category: "MANUAL_SIGNOFF", title: "manual signoff evidence is not provided", sourceVersion: "V55", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "manualSignoffEvidenceProvided = false", actualState: "false", status: "NOT_REVIEWED", blocksConnectionReview: true, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "connection-review-blocked-without-signoff", category: "MANUAL_SIGNOFF", title: "staging connection review remains blocked without signoff", sourceVersion: "V55", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "stagingConnectionReviewAllowed = false", actualState: "false", status: "BLOCKED", blocksConnectionReview: true, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "actual-connection-blocked", category: "SUPABASE_PROJECT", title: "actual staging connection remains blocked", sourceVersion: "V55", requiredBeforeConnectionReview: false, requiredBeforeActualConnection: true, expectedState: "stagingConnectionAllowed = false", actualState: "false", status: "BLOCKED", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "supabase-project-identity-verified", category: "SUPABASE_PROJECT", title: "staging Supabase project identity must be manually verified", sourceVersion: "V55", requiredBeforeConnectionReview: false, requiredBeforeActualConnection: true, expectedState: "manually verified outside code", actualState: "NOT_REVIEWED", status: "NOT_REVIEWED", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "supabase-url-verified-outside-code", category: "SUPABASE_PROJECT", title: "staging Supabase URL must be manually verified outside code", sourceVersion: "V55", requiredBeforeConnectionReview: false, requiredBeforeActualConnection: true, expectedState: "manually verified outside code", actualState: "NOT_REVIEWED", status: "NOT_REVIEWED", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "no-supabase-client-in-v55", category: "SUPABASE_PROJECT", title: "no Supabase client may be created in V55", sourceVersion: "V55", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "no Supabase client created", actualState: "none", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "no-env-read-in-v55", category: "ENVIRONMENT_VARIABLES", title: "env variables must not be read in V55", sourceVersion: "V55", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "envReadPerformed = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "rls-select-only-verified", category: "RLS_POLICY", title: "RLS select-only policy must be manually verified", sourceVersion: "V45", requiredBeforeConnectionReview: false, requiredBeforeActualConnection: true, expectedState: "select-only RLS manually verified", actualState: "NOT_REVIEWED", status: "NOT_REVIEWED", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "anon-service-role-not-used", category: "ROLE_ACCESS", title: "staging anon key / service role key must not be used in app runtime", sourceVersion: "V45", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "anonRoleAllowed = false; serviceRoleAllowedInAppRuntime = false", actualState: "false / false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "dashboard-readonly-role-required", category: "ROLE_ACCESS", title: "dashboard_readonly_app role must be used for future read-only review", sourceVersion: "V45", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "dashboardReadonlyRoleRequired = true", actualState: "true", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "write-operations-blocked", category: "READ_ONLY_OPERATION", title: "insert / update / delete must remain blocked", sourceVersion: "V47", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "writeOperationsBlocked = true", actualState: "true", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "actual-connection-dry-run-future", category: "READ_ONLY_OPERATION", title: "actual connection dry-run remains future work", sourceVersion: "V55", requiredBeforeConnectionReview: false, requiredBeforeActualConnection: true, expectedState: "future work (V56+)", actualState: "NOT_REVIEWED", status: "NOT_REVIEWED", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
  { requirementId: "no-request-in-v55", category: "DATA_SOURCE_SAFETY", title: "no request may be performed in V55", sourceVersion: "V55", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "requestPerformed = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "future-review-shadow-only", category: "SHADOW_ONLY", title: "future connection review must be shadow-only", sourceVersion: "V48", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "shadowOnlyRequired = true", actualState: "true", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "fixture-not-overridden", category: "SHADOW_ONLY", title: "fixture/hardcoded must not be overridden by staging", sourceVersion: "V48", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "fixture/hardcoded CanBeOverriddenByStaging = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "mismatch-not-promote", category: "SHADOW_ONLY", title: "mismatch must not promote staging", sourceVersion: "V48", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "mismatchCanPromoteStaging = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "empty-stale-error-no-override", category: "SHADOW_ONLY", title: "empty / stale / error must not override hardcoded", sourceVersion: "V49", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "empty/stale/errorResultCanOverrideHardcoded = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "kill-switch-enabled", category: "KILL_SWITCH", title: "kill switch must be enabled", sourceVersion: "V49", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "killSwitchDefaultEnabled = true", actualState: "true", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "portfolio-source-mode-hardcoded", category: "PORTFOLIO_SOURCE_MODE", title: "PORTFOLIO_SOURCE_MODE must remain hardcoded", sourceVersion: "V47", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "portfolioApiMustRemainHardcoded = true", actualState: "true", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "portfolio-api-not-switched", category: "API_ROUTE_SAFETY", title: "/api/portfolio must not be switched", sourceVersion: "V47", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "portfolioApiSwitched = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "shadow-route-fixture-only", category: "API_ROUTE_SAFETY", title: "shadow runner API route remains fixture-only", sourceVersion: "V51", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "route fixture-only / mock_or_contract", actualState: "fixture-only", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "monitoring-ui-fixture-only", category: "UI_SAFETY", title: "monitoring UI remains fixture-only and no new UI is added", sourceVersion: "V52", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "uiCreated = false; monitoring UI internal-only", actualState: "fixture-only", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "real-market-data-disabled", category: "DATA_SOURCE_SAFETY", title: "real market data remains disabled", sourceVersion: "V42", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "realMarketDataEnabled = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "buy-sell-disabled", category: "DATA_SOURCE_SAFETY", title: "buy/sell command generation remains disabled", sourceVersion: "V42", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "buySellCommandGenerated = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "auto-order-disabled", category: "DATA_SOURCE_SAFETY", title: "auto order remains disabled", sourceVersion: "V42", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "autoOrderRequested = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "production-readiness-blocked", category: "PRODUCTION_READINESS", title: "production readiness remains blocked", sourceVersion: "V55", requiredBeforeConnectionReview: true, requiredBeforeActualConnection: true, expectedState: "productionReadinessAllowed = false", actualState: "false", status: "PASS", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: false, notes: NOTE },
  { requirementId: "rollback-plan-required", category: "ROLLBACK_PLAN", title: "rollback plan must exist before actual connection", sourceVersion: "V55", requiredBeforeConnectionReview: false, requiredBeforeActualConnection: true, expectedState: "rollback plan defined and manually reviewed", actualState: "NOT_REVIEWED", status: "NOT_REVIEWED", blocksConnectionReview: false, blocksActualConnection: true, blocksProductionReadiness: true, manualReviewRequired: true, notes: NOTE },
];

/**
 * Builds a deterministic staging read-only connection review gate bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no clock
 * is read.
 */
export function buildStagingReadonlyConnectionReviewGateContract(
  input: BuildStagingReadonlyConnectionReviewGateContractInput = {},
): StagingReadonlyConnectionReviewGateBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const requirementItems: StagingReadonlyConnectionReviewRequirementItem[] = ITEM_DEFS.map((d) => ({ ...d }));

  // decision: any item that blocks connection review and is not PASS → NO_GO.
  // Manual-signoff items are NOT_REVIEWED / BLOCKED and block connection review,
  // so the default decision is NO_GO until manual sign-off evidence is provided.
  const anyBlockingNotPass = requirementItems.some((i) => i.blocksConnectionReview && i.status !== "PASS");
  const decision: StagingReadonlyConnectionReviewDecision = anyBlockingNotPass ? "NO_GO" : "READY_FOR_REVIEW";

  return {
    contractVersion: "V55",
    gateName: "Staging Read-only Connection Review Gate",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    requirementItems,

    connectionReviewGateDefined: true,
    actualConnectionImplemented: false,
    actualConnectionAttempted: false,
    stagingConnectionAllowed: false,
    stagingConnectionReviewAllowed: false,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    manualSignoffEvidenceProvided: false,
    v54ChecklistPassed: true,
    v54ChecklistProductionReady: false,
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
    fixtureCanBeOverriddenByStaging: false,
    hardcodedCanBeOverriddenByStaging: false,
    mismatchCanPromoteStaging: false,
    dryRunCanPromoteStaging: false,
    emptyResultCanOverrideHardcoded: false,
    staleResultCanOverrideHardcoded: false,
    errorResultCanOverrideHardcoded: false,
    serviceRoleAllowedInAppRuntime: false,
    anonRoleAllowed: false,
    dashboardReadonlyRoleRequired: true,
    readOnlySelectOnlyRequired: true,
    writeOperationsBlocked: true,
    shadowOnlyRequired: true,
    portfolioApiMustRemainHardcoded: true,

    futureGate: "V56 Manual Sign-off Evidence / V56 Staging Read-only Connection Dry-run Plan",
    safetyLabels: [...STAGING_READONLY_CONNECTION_REVIEW_GATE_SAFETY_LABELS],
  };
}
