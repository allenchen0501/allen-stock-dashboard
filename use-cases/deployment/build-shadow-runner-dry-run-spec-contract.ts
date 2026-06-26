/**
 * Shadow Runner Dry-run Spec Contract Builder — V49
 *
 * Pure builder. Returns a deterministic shadow runner dry-run spec bundle (6
 * runner step specs + an evidence report shape). Default decision is
 * READY_FOR_REVIEW: the runner is never executed, the dry-run is
 * fixture-to-fixture self-check shape only, never connects to staging, never
 * promotes staging, and never persists evidence to a DB.
 *
 * This is NOT a runtime and connects to NOTHING. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import / no client creation
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes (no staging write, no production write, no DB persistence)
 *   - No buy/sell commands; no auto orders
 */

import {
  SHADOW_RUNNER_DRY_RUN_SPEC_SAFETY_LABELS,
} from "./shadow-runner-dry-run-spec-contract";
import type {
  ShadowRunnerDryRunDecision,
  ShadowRunnerDryRunEvidenceReportShape,
  ShadowRunnerDryRunFailureBehavior,
  ShadowRunnerDryRunInputSource,
  ShadowRunnerDryRunManualCheck,
  ShadowRunnerDryRunOutputArtifact,
  ShadowRunnerDryRunPolicyRule,
  ShadowRunnerDryRunSpecBundle,
  ShadowRunnerDryRunStepSpec,
} from "./shadow-runner-dry-run-spec-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildShadowRunnerDryRunSpecContractInput {
  generatedAt?: string;
}

interface StepDef {
  stepName: string;
  inputSource: ShadowRunnerDryRunInputSource;
  outputArtifact: ShadowRunnerDryRunOutputArtifact;
  failureBehavior: ShadowRunnerDryRunFailureBehavior;
  evidenceFields: string[];
}

const STEP_DEFS: StepDef[] = [
  {
    stepName: "loadFixtureBaseline",
    inputSource: "FIXTURE_BASELINE",
    outputArtifact: "NO_PERSISTENCE_ARTIFACT",
    failureBehavior: "RECORD_DATA_INSUFFICIENT",
    evidenceFields: ["baselineTableCount", "baselineFieldCount"],
  },
  {
    stepName: "runFixtureToFixtureSelfCheck",
    inputSource: "FIXTURE_BASELINE",
    outputArtifact: "COUNTS_ONLY",
    failureBehavior: "RECORD_DATA_INSUFFICIENT",
    evidenceFields: ["selfCheckPassCount", "selfCheckMismatchCount"],
  },
  {
    stepName: "calculateShadowComparisonEvidence",
    inputSource: "PREVIOUS_SPEC_CONTRACT",
    outputArtifact: "EVIDENCE_REPORT_SHAPE_ONLY",
    failureBehavior: "RECORD_DATA_INSUFFICIENT",
    evidenceFields: ["comparedTableCount", "comparedFieldCount"],
  },
  {
    stepName: "classifyMismatchAndDataInsufficient",
    inputSource: "PREVIOUS_SPEC_CONTRACT",
    outputArtifact: "COUNTS_ONLY",
    failureBehavior: "BLOCK_PROMOTION",
    evidenceFields: ["mismatchCount", "dataInsufficientCount", "staleCount", "errorCount"],
  },
  {
    stepName: "evaluateKillSwitchAndPromotionGuard",
    inputSource: "NO_STAGING_INPUT",
    outputArtifact: "MANUAL_REVIEW_PAYLOAD_SHAPE",
    failureBehavior: "FORCE_FIXTURE_MODE",
    evidenceFields: ["killSwitchTriggered", "promotionAllowed"],
  },
  {
    stepName: "buildShadowDryRunReport",
    inputSource: "MOCK_OR_CONTRACT",
    outputArtifact: "EVIDENCE_REPORT_SHAPE_ONLY",
    failureBehavior: "REQUIRE_MANUAL_REVIEW",
    evidenceFields: ["reportVersion", "passCount", "blockedCount", "manualReviewRequired"],
  },
];

function toStepSpec(d: StepDef, index: number): ShadowRunnerDryRunStepSpec {
  return {
    stepName: d.stepName,
    order: index + 1,
    inputSource: d.inputSource,
    outputArtifact: d.outputArtifact,
    executionMode: "FIXTURE_TO_FIXTURE_DRY_RUN_ONLY",
    requiresSupabase: false,
    requiresEnv: false,
    performsExternalRequest: false,
    performsDbWrite: false,
    canPromoteStaging: false,
    canSwitchPortfolioApi: false,
    failureBehavior: d.failureBehavior,
    killSwitchBehavior: "BLOCK_SHADOW_RUNNER",
    evidenceFields: d.evidenceFields,
    verificationStatus: "NOT_REVIEWED",
    blocksRelease: true,
    notes:
      "fixture-to-fixture dry-run shape only；不連 staging、不寫 DB、不 promote staging；kill switch 可阻斷。",
  };
}

/**
 * Builds a deterministic shadow runner dry-run spec bundle. All timestamps come
 * from `input.generatedAt` (or a fixed fallback string); no clock is read.
 */
export function buildShadowRunnerDryRunSpecContract(
  input: BuildShadowRunnerDryRunSpecContractInput = {},
): ShadowRunnerDryRunSpecBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const runnerStepSpecs: ShadowRunnerDryRunStepSpec[] = STEP_DEFS.map(toStepSpec);

  const evidenceReportShape: ShadowRunnerDryRunEvidenceReportShape = {
    reportVersion: "V49",
    generatedAt,
    sourceMode: "fixture",
    runnerMode: "dry_run_spec",
    // Dry-run shape: counts are zeroed placeholders (nothing executed).
    comparedTableCount: 0,
    comparedFieldCount: 0,
    passCount: 0,
    mismatchCount: 0,
    dataInsufficientCount: 0,
    staleCount: 0,
    errorCount: 0,
    blockedCount: 0,
    promotionAllowed: false,
    portfolioApiSwitchAllowed: false,
    persisted: false,
    killSwitchTriggered: false,
    manualReviewRequired: true,
    notes:
      "shape-only：dry-run 不執行、不連 staging、不寫 DB；promotion / api switch / persistence 一律 false。",
  };

  // Deterministic decision: any step that requires Supabase/env/external/DB-write
  // or can promote/switch → NO_GO. Runner not executed + not reviewed → never
  // GO / PRODUCTION_READY (READY_FOR_REVIEW).
  const anyUnsafeStep = runnerStepSpecs.some(
    (s) =>
      (s.requiresSupabase as boolean) ||
      (s.requiresEnv as boolean) ||
      (s.performsExternalRequest as boolean) ||
      (s.performsDbWrite as boolean) ||
      (s.canPromoteStaging as boolean) ||
      (s.canSwitchPortfolioApi as boolean),
  );
  const evidenceUnsafe =
    (evidenceReportShape.promotionAllowed as boolean) ||
    (evidenceReportShape.portfolioApiSwitchAllowed as boolean) ||
    (evidenceReportShape.persisted as boolean);
  const decision: ShadowRunnerDryRunDecision = anyUnsafeStep || evidenceUnsafe ? "NO_GO" : "READY_FOR_REVIEW";

  const policyRules: ShadowRunnerDryRunPolicyRule[] = [
    { ruleId: "self-check-defined", description: "fixtureToFixtureSelfCheckDefined 必須 true。", blocksReleaseOnViolation: true },
    { ruleId: "no-runtime", description: "shadowRunnerRuntimeCreated 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "not-executed", description: "shadowRunnerExecuted 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-staging-connection", description: "dry-run 只能做 fixture-to-fixture self-check shape，不得連 staging。", blocksReleaseOnViolation: true },
    { ruleId: "no-supabase-step", description: "all steps requiresSupabase 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-env-step", description: "all steps requiresEnv 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-external-step", description: "all steps performsExternalRequest 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-db-write-step", description: "all steps performsDbWrite 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "no-promote-step", description: "all steps canPromoteStaging 必須 false；dry-run mismatch 不得 promote staging。", blocksReleaseOnViolation: true },
    { ruleId: "no-api-switch-step", description: "all steps canSwitchPortfolioApi 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "evidence-no-promote", description: "evidence report promotionAllowed 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "evidence-no-api-switch", description: "evidence report portfolioApiSwitchAllowed 必須 false。", blocksReleaseOnViolation: true },
    { ruleId: "evidence-no-persist", description: "evidence report persisted 必須 false；dry-run evidence 不得寫 DB。", blocksReleaseOnViolation: true },
    { ruleId: "no-override", description: "dry-run empty/stale/error 不得覆蓋 fixture / hardcoded。", blocksReleaseOnViolation: true },
    { ruleId: "kill-switch-default", description: "kill switch 預設必須能阻斷 shadow runner。", blocksReleaseOnViolation: true },
    { ruleId: "source-mode-hardcoded", description: "PORTFOLIO_SOURCE_MODE 必須維持 hardcoded。", blocksReleaseOnViolation: true },
    { ruleId: "no-api-switch", description: "/api/portfolio 不得切換到 shadow runner result。", blocksReleaseOnViolation: true },
    { ruleId: "no-production-target", description: "production Supabase 不得出現在 runner target。", blocksReleaseOnViolation: true },
    { ruleId: "no-service-role", description: "service_role 不得被 app runtime 使用。", blocksReleaseOnViolation: true },
    { ruleId: "spec-only", description: "shadow runner spec 只能描述未來 dry-run 語意，不得建立實際 runner runtime。", blocksReleaseOnViolation: true },
  ];

  const manualChecks: ShadowRunnerDryRunManualCheck[] = [
    { checkId: "review-no-staging", description: "人工確認 dry-run 不連 staging、僅 fixture-to-fixture shape。", required: true },
    { checkId: "review-no-promote", description: "人工確認 mismatch 不 promote staging、dryRunCanPromoteStaging=false。", required: true },
    { checkId: "review-no-db-write", description: "人工確認 evidence 不寫 DB、persisted=false。", required: true },
    { checkId: "review-source-mode", description: "人工確認 PORTFOLIO_SOURCE_MODE 維持 hardcoded。", required: true },
    { checkId: "review-kill-switch", description: "人工確認 kill switch 可阻斷 shadow runner。", required: true },
  ];

  return {
    contractVersion: "V49",
    specName: "Shadow Runner Dry-run Spec",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    runnerStepSpecs,
    evidenceReportShape,
    policyRules,
    manualChecks,

    shadowRunnerDryRunSpecDefined: true,
    shadowRunnerRuntimeCreated: false,
    shadowRunnerExecuted: false,
    fixtureToFixtureSelfCheckDefined: true,
    fixtureToStagingComparisonPerformed: false,
    stagingSupabasePlanned: true,
    stagingSupabaseConnected: false,
    stagingReadPerformed: false,
    stagingWritePerformed: false,
    shadowComparisonPerformed: false,
    shadowResultPersisted: false,
    productionSupabaseConnected: false,
    productionWritePerformed: false,
    databaseWritePerformed: false,
    requestPerformed: false,
    envReadPerformed: false,
    apiRouteCreated: false,
    uiCreated: false,
    runtimeCreated: false,
    sqlMigrationCreated: false,
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

    futureGate: "V50 Staging Read-only Connection Review / V50 Shadow Runner Dry-run API Contract",
    safetyLabels: [...SHADOW_RUNNER_DRY_RUN_SPEC_SAFETY_LABELS],
  };
}
