/**
 * Manual Sign-off Evidence Spec Contract Builder — V56
 *
 * Pure builder. Returns a deterministic manual sign-off evidence spec. Because no
 * real sign-off evidence is provided, the evidence-required items remain
 * NOT_PROVIDED (and block manual sign-off), so the default decision is NO_GO and
 * every sign-off / connection / review-allowed flag stays false.
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
  MANUAL_SIGNOFF_EVIDENCE_SPEC_SAFETY_LABELS,
} from "./manual-signoff-evidence-spec-contract";
import type {
  ManualSignoffEvidenceCategory,
  ManualSignoffEvidenceDecision,
  ManualSignoffEvidenceRequirementItem,
  ManualSignoffEvidenceSpecBundle,
  ManualSignoffEvidenceStatus,
} from "./manual-signoff-evidence-spec-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildManualSignoffEvidenceSpecContractInput {
  generatedAt?: string;
}

interface ItemDef {
  evidenceId: string;
  category: ManualSignoffEvidenceCategory;
  title: string;
  requiredEvidence: string;
  acceptedEvidenceFormat: string;
  expectedState: string;
  providedState: string;
  status: ManualSignoffEvidenceStatus;
  requiredBeforeManualSignoff: boolean;
  requiredBeforeConnectionReview: boolean;
  requiredBeforeActualConnection: boolean;
  blocksManualSignoff: boolean;
  blocksConnectionReview: boolean;
  blocksActualConnection: boolean;
  blocksProductionReadiness: boolean;
  manualReviewRequired: boolean;
  notes: string;
}

const NOTE = "spec only：evidence 由人工於 code 外提供；本版不翻任何 sign-off / connection 旗標。";

/** Evidence still required → NOT_PROVIDED, blocks manual sign-off. */
function need(
  evidenceId: string,
  category: ManualSignoffEvidenceCategory,
  title: string,
  requiredEvidence: string,
  acceptedEvidenceFormat: string,
  expectedState: string,
): ItemDef {
  return {
    evidenceId,
    category,
    title,
    requiredEvidence,
    acceptedEvidenceFormat,
    expectedState,
    providedState: "not provided",
    status: "NOT_PROVIDED",
    requiredBeforeManualSignoff: true,
    requiredBeforeConnectionReview: true,
    requiredBeforeActualConnection: true,
    blocksManualSignoff: true,
    blocksConnectionReview: true,
    blocksActualConnection: true,
    blocksProductionReadiness: true,
    manualReviewRequired: true,
    notes: NOTE,
  };
}

/** Invariant already satisfied by prior versions → PASS, does not block. */
function ok(
  evidenceId: string,
  category: ManualSignoffEvidenceCategory,
  title: string,
  requiredEvidence: string,
  acceptedEvidenceFormat: string,
  expectedState: string,
  providedState: string,
): ItemDef {
  return {
    evidenceId,
    category,
    title,
    requiredEvidence,
    acceptedEvidenceFormat,
    expectedState,
    providedState,
    status: "PASS",
    requiredBeforeManualSignoff: true,
    requiredBeforeConnectionReview: true,
    requiredBeforeActualConnection: true,
    blocksManualSignoff: false,
    blocksConnectionReview: false,
    blocksActualConnection: false,
    blocksProductionReadiness: false,
    manualReviewRequired: false,
    notes: NOTE,
  };
}

const ITEM_DEFS: ItemDef[] = [
  need("signer-identity", "SIGNER_IDENTITY", "signer identity must be provided",
    "簽核人身分（姓名 / 角色 / 聯絡方式）", "signed document or verified identity record", "manualSignerIdentityVerified = true (future)"),
  need("signer-authority", "SIGNER_AUTHORITY", "signer authority must be provided",
    "簽核人有權限批准 staging read-only connection", "authority record / org chart reference", "manualSignerHasAuthority = true (future)"),
  ok("v55-gate-exists", "V55_GATE", "V55 gate exists",
    "V55 connection review gate contract present", "repo contract + checker PASS", "v55ConnectionReviewGatePassed = true", "true"),
  ok("v55-decision-no-go", "V55_GATE", "V55 decision is NO_GO",
    "V55 decision must be NO_GO", "builder payload decision", "v55Decision = NO_GO", "NO_GO"),
  ok("manual-signoff-not-completed", "V55_GATE", "manual signoff not completed by default",
    "manualSignoffCompleted must remain false until evidence", "builder payload flag", "manualSignoffCompleted = false", "false"),
  need("supabase-project-identity", "SUPABASE_PROJECT_IDENTITY", "staging Supabase project identity must be provided outside code",
    "staging Supabase project id 於 code 外確認", "dashboard screenshot / project ref", "project identity verified outside code"),
  need("staging-url-verification", "STAGING_URL_VERIFICATION", "staging Supabase URL must be verified outside code",
    "staging Supabase URL 於 code 外確認", "dashboard URL record", "staging URL verified outside code"),
  need("env-secret-handling", "ENVIRONMENT_SECRET_HANDLING", "environment secrets handling evidence must be provided",
    "env secret 存放於 Vercel/Supabase 受控環境、不入 repo", "secret handling policy record", "secrets handled outside repo, not read by app yet"),
  ok("anon-key-not-used", "ROLE_ACCESS", "staging anon key must not be used in app runtime",
    "anon key 不得用於 app runtime", "code scan / config record", "anonRoleAllowed = false", "false"),
  ok("service-role-not-used", "ROLE_ACCESS", "service_role key must not be used in app runtime",
    "service_role 不得用於 app runtime", "code scan / config record", "serviceRoleAllowedInAppRuntime = false", "false"),
  need("dashboard-readonly-role-identified", "ROLE_ACCESS", "dashboard_readonly_app role must be identified",
    "dashboard_readonly_app role 已建立並確認", "role definition record", "dashboard_readonly_app role identified"),
  need("rls-select-only-evidence", "RLS_SELECT_ONLY", "RLS select-only policy evidence must be provided",
    "RLS select-only policy 已人工驗證", "RLS policy export / screenshot", "select-only RLS verified"),
  need("write-blocking-evidence", "WRITE_BLOCKING", "insert / update / delete blocked evidence must be provided",
    "寫入操作於 staging 一律 blocked 的證據", "RLS / permission test record", "writeOperationsBlocked verified"),
  ok("shadow-only-required", "SHADOW_ONLY", "connection review must remain shadow-only",
    "未來 review 必須 shadow-only", "spec invariant", "shadowOnlyRequired = true", "true"),
  ok("fixture-not-overridden", "SHADOW_ONLY", "fixture/hardcoded must not be overridden by staging",
    "fixture/hardcoded 不得被 staging 覆蓋", "spec invariant", "fixture/hardcodedCanBeOverriddenByStaging = false", "false"),
  ok("mismatch-not-promote", "SHADOW_ONLY", "mismatch must not promote staging",
    "mismatch 不得 promote staging", "spec invariant", "mismatchCanPromoteStaging = false", "false"),
  ok("empty-stale-error-no-override", "SHADOW_ONLY", "empty / stale / error must not override hardcoded",
    "empty/stale/error 不得覆蓋 hardcoded", "spec invariant", "empty/stale/errorResultCanOverrideHardcoded = false", "false"),
  ok("portfolio-source-mode-hardcoded", "PORTFOLIO_SOURCE_MODE", "PORTFOLIO_SOURCE_MODE must remain hardcoded",
    "PORTFOLIO_SOURCE_MODE 維持 hardcoded", "spec invariant", "portfolioApiMustRemainHardcoded = true", "true"),
  ok("portfolio-api-not-switched", "PORTFOLIO_SOURCE_MODE", "/api/portfolio must not be switched",
    "/api/portfolio 不得切換", "spec invariant", "portfolioApiSwitched = false", "false"),
  ok("kill-switch-enabled", "KILL_SWITCH", "kill switch must be enabled",
    "kill switch 預設 enabled", "spec invariant", "killSwitchDefaultEnabled = true", "true"),
  need("rollback-plan-provided", "ROLLBACK_PLAN", "rollback plan must be provided",
    "rollback plan 已定義並人工複核", "rollback runbook document", "rollback plan provided"),
  ok("real-market-data-disabled", "DATA_SOURCE_SAFETY", "real market data remains disabled",
    "realMarketDataEnabled 維持 false", "spec invariant", "realMarketDataEnabled = false", "false"),
  ok("no-buy-sell", "TRADING_SAFETY", "no buy/sell command generation",
    "buySellCommandGenerated 維持 false", "spec invariant", "buySellCommandGenerated = false", "false"),
  ok("no-auto-order", "TRADING_SAFETY", "no auto order",
    "autoOrderRequested 維持 false", "spec invariant", "autoOrderRequested = false", "false"),
  ok("production-readiness-blocked", "PRODUCTION_READINESS", "production readiness remains blocked",
    "productionReadinessAllowed 維持 false", "spec invariant", "productionReadinessAllowed = false", "false"),
];

/**
 * Builds a deterministic manual sign-off evidence spec bundle. All timestamps
 * come from `input.generatedAt` (or a fixed fallback string); no clock is read.
 */
export function buildManualSignoffEvidenceSpecContract(
  input: BuildManualSignoffEvidenceSpecContractInput = {},
): ManualSignoffEvidenceSpecBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const evidenceRequirementItems: ManualSignoffEvidenceRequirementItem[] = ITEM_DEFS.map((d) => ({ ...d }));

  // decision: any item that blocks manual sign-off and is not PASS → NO_GO.
  // NOT_PROVIDED evidence items block sign-off, so the default decision is NO_GO
  // until real sign-off evidence is provided (out of scope for V56).
  const anyBlocking = evidenceRequirementItems.some((i) => i.blocksManualSignoff && i.status !== "PASS");
  const decision: ManualSignoffEvidenceDecision = anyBlocking ? "NO_GO" : "READY_FOR_REVIEW";

  return {
    contractVersion: "V56",
    specName: "Manual Sign-off Evidence Spec",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    evidenceRequirementItems,

    manualSignoffEvidenceSpecDefined: true,
    actualManualSignoffPerformed: false,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    manualSignoffEvidenceProvided: false,
    manualSignerIdentityVerified: false,
    manualSignerHasAuthority: false,
    v55ConnectionReviewGatePassed: true,
    v55Decision: "NO_GO",
    stagingConnectionAllowed: false,
    stagingConnectionReviewAllowed: false,
    actualConnectionImplemented: false,
    actualConnectionAttempted: false,
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

    futureGate: "V57 Manual Sign-off Evidence Instance / V57 Staging Read-only Connection Dry-run Plan",
    safetyLabels: [...MANUAL_SIGNOFF_EVIDENCE_SPEC_SAFETY_LABELS],
  };
}
