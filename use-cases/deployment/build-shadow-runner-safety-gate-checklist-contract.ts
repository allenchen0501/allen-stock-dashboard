/**
 * Shadow Runner Safety Gate Checklist Contract Builder — V54
 *
 * Pure builder. Returns a deterministic checklist consolidating the V44–V53
 * safety invariants. Evidence items are PASS; the manual-signoff items remain
 * NOT_REVIEWED / BLOCKED, so manualSignoffCompleted stays false and
 * stagingConnectionAllowed stays false. Default decision is READY_FOR_REVIEW
 * (all blocking evidence items PASS) — which never means "may connect to real
 * data".
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
  SHADOW_RUNNER_SAFETY_GATE_CHECKLIST_SAFETY_LABELS,
} from "./shadow-runner-safety-gate-checklist-contract";
import type {
  ShadowRunnerSafetyGateCategory,
  ShadowRunnerSafetyGateChecklistBundle,
  ShadowRunnerSafetyGateChecklistItem,
  ShadowRunnerSafetyGateDecision,
  ShadowRunnerSafetyGateStatus,
} from "./shadow-runner-safety-gate-checklist-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildShadowRunnerSafetyGateChecklistContractInput {
  generatedAt?: string;
}

interface ItemDef {
  itemId: string;
  category: ShadowRunnerSafetyGateCategory;
  title: string;
  sourceVersion: string;
  requiredEvidence: string;
  expectedState: string;
  actualState: string;
  status: ShadowRunnerSafetyGateStatus;
  blocksConnectionReview: boolean;
  blocksProductionReadiness: boolean;
  manualReviewRequired: boolean;
  notes: string;
}

/** Evidence item: PASS, blocks both gates, no manual review needed. */
function ev(
  itemId: string,
  category: ShadowRunnerSafetyGateCategory,
  title: string,
  sourceVersion: string,
  requiredEvidence: string,
  expectedState: string,
  actualState: string,
): ItemDef {
  return {
    itemId,
    category,
    title,
    sourceVersion,
    requiredEvidence,
    expectedState,
    actualState,
    status: "PASS",
    blocksConnectionReview: true,
    blocksProductionReadiness: true,
    manualReviewRequired: false,
    notes: "pre-connection evidence；fixture/mock safe mode；不放寬任何安全旗標。",
  };
}

/** Manual-signoff item: NOT a decision blocker, but gates via manualSignoff flags. */
function signoff(
  itemId: string,
  title: string,
  status: ShadowRunnerSafetyGateStatus,
  notes: string,
): ItemDef {
  return {
    itemId,
    category: "MANUAL_SIGNOFF",
    title,
    sourceVersion: "V54",
    requiredEvidence: "人工複核並簽核（manual sign-off）。",
    expectedState: "manual sign-off completed before staging connection review",
    actualState: "manualSignoffCompleted = false",
    status,
    blocksConnectionReview: false,
    blocksProductionReadiness: false,
    manualReviewRequired: true,
    notes,
  };
}

const ITEM_DEFS: ItemDef[] = [
  ev("deploy-ready", "DEPLOYMENT", "Vercel production deployment is READY", "V53",
    "Vercel deployment state = READY", "READY", "READY (commit 740e16b / 3ee9d0b series)"),
  ev("holdings-200", "ROUTE", "/holdings production route is 200", "V53",
    "production /holdings status", "200 OK", "200 OK"),
  ev("shadow-route-fixture-only", "ROUTE", "shadow runner API route remains fixture-only", "V51",
    "app/api/portfolio/shadow-runner-dry-run/route.ts returns mock_or_contract", "fixture-only", "fixture-only"),
  ev("monitoring-mounted", "MONITORING_UI", "Shadow Runner Monitoring UI is mounted", "V52",
    "holdings page renders ShadowRunnerDryRunMonitoring", "mounted", "mounted"),
  ev("monitoring-internal-only", "MONITORING_UI", "monitoring UI only fetches internal endpoint", "V52",
    "component fetch target", "/api/portfolio/shadow-runner-dry-run", "internal endpoint only"),
  ev("endpoint-200", "API_CONTRACT", "/api/portfolio/shadow-runner-dry-run production endpoint is 200", "V51.1",
    "production smoke evidence", "200 OK", "200 OK"),
  ev("response-source-mock", "API_CONTRACT", "responseSource remains mock_or_contract", "V50",
    "API contract responseSource", "mock_or_contract", "mock_or_contract"),
  ev("source-mode-fixture", "DATA_SOURCE", "sourceMode remains fixture", "V50",
    "API contract sourceMode", "fixture", "fixture"),
  ev("portfolio-source-mode-hardcoded", "DATA_SOURCE", "PORTFOLIO_SOURCE_MODE remains hardcoded", "V47",
    "adapter spec sourceModeRequirement", "PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED", "hardcoded"),
  ev("no-staging-supabase", "SUPABASE_SAFETY", "no staging Supabase connection has been performed", "V44",
    "stagingSupabaseConnected flag", "false", "false"),
  ev("no-production-supabase", "SUPABASE_SAFETY", "no production Supabase connection has been performed", "V43",
    "productionSupabaseConnected flag", "false", "false"),
  ev("no-env-read", "SUPABASE_SAFETY", "no env key has been read", "V44",
    "envReadPerformed flag", "false", "false"),
  ev("no-db-write", "SUPABASE_SAFETY", "no database write has been performed", "V44",
    "databaseWritePerformed flag", "false", "false"),
  ev("no-sql-migration", "SUPABASE_SAFETY", "no SQL migration was added", "V44",
    "sqlMigrationCreated flag", "false", "false"),
  ev("rls-matrix-exists", "RLS", "RLS manual matrix exists and remains pre-connection evidence", "V45",
    "staging-supabase-rls-manual-matrix contract", "defined, not connected", "pre-connection evidence"),
  ev("schema-mapping-exists", "SCHEMA_MAPPING", "schema mapping spec exists and remains pre-connection evidence", "V46",
    "staging-supabase-schema-mapping-spec contract", "defined, not connected", "pre-connection evidence"),
  ev("adapter-spec-exists", "ADAPTER", "read-only adapter spec exists and remains pre-connection evidence", "V47",
    "staging-readonly-adapter-spec contract", "defined, not connected", "pre-connection evidence"),
  ev("shadow-comparison-prevents-override", "SHADOW_COMPARISON", "fixture vs staging shadow comparison prevents staging override", "V48",
    "comparison spec override guards", "fixture/hardcoded not overridden", "prevented"),
  ev("fixture-not-overridden", "SHADOW_COMPARISON", "fixture/hardcoded cannot be overridden by staging", "V48",
    "fixtureCanBeOverriddenByStaging / hardcodedCanBeOverriddenByStaging", "false", "false"),
  ev("shadow-runner-prevents-promotion", "SHADOW_RUNNER", "shadow runner dry-run spec exists and prevents promotion", "V49",
    "dry-run spec promotion guards", "no auto promotion", "prevented"),
  ev("mismatch-no-promote", "SHADOW_RUNNER", "mismatch cannot promote staging", "V49",
    "mismatchCanPromoteStaging / dryRunCanPromoteStaging", "false", "false"),
  ev("empty-stale-error-no-override", "SHADOW_RUNNER", "empty/stale/error cannot override hardcoded", "V49",
    "empty/stale/errorResultCanOverrideHardcoded", "false", "false"),
  ev("kill-switch-default", "SHADOW_RUNNER", "kill switch default enabled", "V49",
    "killSwitchDefaultEnabled", "true", "true"),
  ev("production-route-smoke", "PRODUCTION_EVIDENCE", "production route smoke passed", "V51.1",
    "production smoke evidence checker", "passed", "productionRouteSmokePassed = true"),
  ev("monitoring-production-evidence", "PRODUCTION_EVIDENCE", "monitoring UI production evidence passed", "V53",
    "monitoring UI production evidence checker", "passed", "monitoringUiProductionEvidencePassed = true"),
  ev("portfolio-not-switched", "PORTFOLIO_SWITCH", "/api/portfolio has not been switched", "V47",
    "portfolioApiSwitched flag", "false", "false"),
  ev("no-real-market-data", "TRADING_SAFETY", "real market data has not been enabled", "V42",
    "realMarketDataEnabled flag", "false", "false"),
  ev("no-buy-sell", "TRADING_SAFETY", "no buy/sell command has been generated", "V42",
    "buySellCommandGenerated flag", "false", "false"),
  ev("no-auto-order", "TRADING_SAFETY", "no auto order has been requested", "V42",
    "autoOrderRequested flag", "false", "false"),
  signoff("manual-signoff-required", "manual signoff is required before staging connection review",
    "NOT_REVIEWED", "manualSignoffRequired = true；manualSignoffCompleted = false；待人工簽核。"),
  signoff("connection-review-blocked", "staging connection review remains blocked until V54 passes and signoff completes",
    "BLOCKED", "stagingConnectionAllowed = false；production readiness remains blocked。"),
];

/**
 * Builds a deterministic shadow runner safety gate checklist bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildShadowRunnerSafetyGateChecklistContract(
  input: BuildShadowRunnerSafetyGateChecklistContractInput = {},
): ShadowRunnerSafetyGateChecklistBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const checklistItems: ShadowRunnerSafetyGateChecklistItem[] = ITEM_DEFS.map((d) => ({ ...d }));

  // decision: any blocking item (connection-review OR production-readiness) not
  // PASS → NO_GO. Manual-signoff items intentionally do not block the decision;
  // they gate via manualSignoffCompleted / stagingConnectionAllowed (both false).
  const blocking = checklistItems.filter((i) => i.blocksConnectionReview || i.blocksProductionReadiness);
  const anyBlockingNotPass = blocking.some((i) => i.status !== "PASS");
  const decision: ShadowRunnerSafetyGateDecision = anyBlockingNotPass ? "NO_GO" : "READY_FOR_REVIEW";

  return {
    contractVersion: "V54",
    checklistName: "Shadow Runner Safety Gate Checklist",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    checklistItems,

    safetyGateChecklistDefined: true,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    stagingConnectionAllowed: false,
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
    productionRouteSmokePassed: true,
    monitoringUiProductionEvidencePassed: true,

    futureGate: "V55 Staging Read-only Connection Review Gate",
    safetyLabels: [...SHADOW_RUNNER_SAFETY_GATE_CHECKLIST_SAFETY_LABELS],
  };
}
