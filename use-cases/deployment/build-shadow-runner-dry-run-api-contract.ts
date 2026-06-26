/**
 * Shadow Runner Dry-run API Contract Builder — V50
 *
 * Pure builder. Wraps the V49 shadow runner dry-run bundle into a fixture-only
 * mock_or_contract API response contract for the PLANNED endpoint
 * GET /api/portfolio/shadow-runner-dry-run. The dry-run bundle + evidence report
 * are sourced from the V49 pure builder (never duplicated / faked). Default
 * decision is READY_FOR_REVIEW: no route is created, nothing is executed, and
 * every safety flag is frozen safe.
 *
 * This is NOT a runtime and adds NO route. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; no DB persistence
 *   - No buy/sell commands; no auto orders
 */

import { buildShadowRunnerDryRunSpecContract } from "./build-shadow-runner-dry-run-spec-contract";
import {
  SHADOW_RUNNER_DRY_RUN_API_SAFETY_LABELS,
} from "./shadow-runner-dry-run-api-contract";
import type {
  ShadowRunnerDryRunApiContractBundle,
  ShadowRunnerDryRunApiDecision,
  ShadowRunnerDryRunApiDryRunBundleShape,
  ShadowRunnerDryRunApiResponsePayload,
  ShadowRunnerDryRunApiSafetyFlags,
} from "./shadow-runner-dry-run-api-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildShadowRunnerDryRunApiContractInput {
  generatedAt?: string;
}

/**
 * Builds a deterministic, fixture-only shadow runner dry-run API contract
 * bundle. The dry-run bundle + evidence report come from the V49 pure builder;
 * all timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildShadowRunnerDryRunApiContract(
  input: BuildShadowRunnerDryRunApiContractInput = {},
): ShadowRunnerDryRunApiContractBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  // dryRun spec MUST come from the V49 pure builder (never faked / bypassed).
  const v49 = buildShadowRunnerDryRunSpecContract({ generatedAt });

  const dryRunBundle: ShadowRunnerDryRunApiDryRunBundleShape = {
    contractVersion: "V49",
    specName: "Shadow Runner Dry-run Spec",
    runnerMode: "dry_run_spec",
    fixtureToFixtureSelfCheckDefined: v49.fixtureToFixtureSelfCheckDefined,
    shadowRunnerRuntimeCreated: v49.shadowRunnerRuntimeCreated,
    shadowRunnerExecuted: v49.shadowRunnerExecuted,
    fixtureToStagingComparisonPerformed: v49.fixtureToStagingComparisonPerformed,
  };

  const safetyFlags: ShadowRunnerDryRunApiSafetyFlags = {
    routeCreated: false,
    requestPerformed: false,
    envReadPerformed: false,
    supabaseConnected: false,
    stagingSupabaseConnected: false,
    productionSupabaseConnected: false,
    databaseWritePerformed: false,
    shadowRunnerExecuted: false,
    shadowResultPersisted: false,
    portfolioApiSwitched: false,
    portfolioSourceModeChanged: false,
    realMarketDataEnabled: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    promotionAllowed: false,
    portfolioApiSwitchAllowed: false,
    persisted: false,
    killSwitchDefaultEnabled: true,
    fixtureCanBeOverriddenByStaging: false,
    hardcodedCanBeOverriddenByStaging: false,
    mismatchCanPromoteStaging: false,
    dryRunCanPromoteStaging: false,
    emptyResultCanOverrideHardcoded: false,
    staleResultCanOverrideHardcoded: false,
    errorResultCanOverrideHardcoded: false,
  };

  const responsePayload: ShadowRunnerDryRunApiResponsePayload = {
    ok: true,
    apiContractVersion: "V50",
    responseSource: "mock_or_contract",
    sourceMode: "fixture",
    plannedEndpoint: "/api/portfolio/shadow-runner-dry-run",
    method: "GET",
    dryRunBundle,
    // evidenceReport shape comes straight from the V49 pure builder.
    evidenceReport: v49.evidenceReportShape,
    safetyFlags,
    warnings: [
      "planned endpoint only：route 尚未建立（routeCreated=false）。",
      "responseSource 必須維持 mock_or_contract；sourceMode 必須維持 fixture。",
      "fixture/hardcoded 不得被 staging 覆蓋；mismatch 不得 promote staging。",
      "dry-run evidence 不得寫 DB；kill switch 預設 enabled。",
    ],
    nextRequiredActions: [
      "人工複核 V44–V49 前置安全門。",
      "V51 才可實作 fixture-only API route（仍 mock_or_contract / no Supabase / no env / no DB write）。",
    ],
  };

  const decision: ShadowRunnerDryRunApiDecision = "READY_FOR_REVIEW";

  const policyRules = [
    { ruleId: "planned-endpoint", description: "plannedEndpoint 必須是 /api/portfolio/shadow-runner-dry-run。", blocksReleaseOnViolation: true },
    { ruleId: "method-get", description: "method 必須 GET。", blocksReleaseOnViolation: true },
    { ruleId: "response-source", description: "responseSource 必須 mock_or_contract。", blocksReleaseOnViolation: true },
    { ruleId: "source-mode", description: "sourceMode 必須 fixture。", blocksReleaseOnViolation: true },
    { ruleId: "no-route", description: "routeCreated / apiRouteCreated / routeImplemented 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-supabase", description: "supabase / staging / production Supabase 連線必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-write", description: "staging / production / database write 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-execute", description: "shadowRunnerRuntimeCreated / shadowRunnerExecuted / shadowComparisonPerformed / shadowResultPersisted 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-promote", description: "promotionAllowed / portfolioApiSwitchAllowed / persisted 必須 false；mismatch 不得 promote staging。", blocksReleaseOnViolation: true },
    { ruleId: "no-override", description: "fixture / hardcoded 不得被 staging 覆蓋；empty / stale / error 不得覆蓋 hardcoded。", blocksReleaseOnViolation: true },
    { ruleId: "kill-switch", description: "kill switch 預設必須 enabled。", blocksReleaseOnViolation: true },
    { ruleId: "no-api-switch", description: "/api/portfolio 不得切換到 shadow runner result。", blocksReleaseOnViolation: true },
    { ruleId: "no-production-target", description: "production Supabase 不得出現在 API target。", blocksReleaseOnViolation: true },
    { ruleId: "no-service-role", description: "service_role 不得被 app runtime 使用。", blocksReleaseOnViolation: true },
    { ruleId: "spec-only", description: "API contract 只能描述未來 route response shape，不得新增實際 route。", blocksReleaseOnViolation: true },
  ];

  const manualChecks = [
    { checkId: "review-no-route", description: "人工確認未新增實際 route、routeCreated=false。", required: true as const },
    { checkId: "review-response-source", description: "人工確認 responseSource=mock_or_contract、sourceMode=fixture。", required: true as const },
    { checkId: "review-no-override", description: "人工確認 fixture/hardcoded 不被 staging 覆蓋。", required: true as const },
    { checkId: "review-no-persist", description: "人工確認 dry-run evidence 不寫 DB、persisted=false。", required: true as const },
    { checkId: "review-kill-switch", description: "人工確認 kill switch 預設 enabled。", required: true as const },
  ];

  return {
    apiContractVersion: "V50",
    apiName: "Shadow Runner Dry-run API Contract",
    plannedEndpoint: "/api/portfolio/shadow-runner-dry-run",
    method: "GET",
    responseSource: "mock_or_contract",
    sourceMode: "fixture",
    generatedAt,
    decision,

    responsePayload,
    policyRules,
    manualChecks,

    routeCreated: false,
    apiRouteCreated: false,
    routeImplemented: false,
    requestPerformed: false,
    envReadPerformed: false,
    supabaseConnected: false,
    stagingSupabaseConnected: false,
    productionSupabaseConnected: false,
    stagingReadPerformed: false,
    stagingWritePerformed: false,
    productionWritePerformed: false,
    databaseWritePerformed: false,
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
    promotionAllowed: false,
    portfolioApiSwitchAllowed: false,
    persisted: false,
    fixtureCanBeOverriddenByStaging: false,
    hardcodedCanBeOverriddenByStaging: false,
    mismatchCanPromoteStaging: false,
    dryRunCanPromoteStaging: false,
    emptyResultCanOverrideHardcoded: false,
    staleResultCanOverrideHardcoded: false,
    errorResultCanOverrideHardcoded: false,

    futureGate: "V51 Shadow Runner Dry-run API Route",
    safetyLabels: [...SHADOW_RUNNER_DRY_RUN_API_SAFETY_LABELS],
  };
}
