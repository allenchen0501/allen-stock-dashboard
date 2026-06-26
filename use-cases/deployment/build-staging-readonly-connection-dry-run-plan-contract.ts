/**
 * Staging Read-only Connection Dry-run Plan Contract Builder — V57
 *
 * Pure builder. Returns a deterministic dry-run PLAN (28 steps across 13 phases).
 * Because manual sign-off evidence is still not provided, the manual-signoff /
 * final-go-no-go steps remain BLOCKED / NOT_READY, so the default decision is
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
  STAGING_READONLY_DRY_RUN_PLAN_SAFETY_LABELS,
} from "./staging-readonly-connection-dry-run-plan-contract";
import type {
  StagingReadonlyDryRunPlanAllowedOperation,
  StagingReadonlyDryRunPlanBundle,
  StagingReadonlyDryRunPlanDecision,
  StagingReadonlyDryRunPlanPhase,
  StagingReadonlyDryRunPlanStatus,
  StagingReadonlyDryRunPlanStep,
} from "./staging-readonly-connection-dry-run-plan-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStagingReadonlyConnectionDryRunPlanContractInput {
  generatedAt?: string;
}

interface StepDef {
  stepId: string;
  phase: StagingReadonlyDryRunPlanPhase;
  title: string;
  objective: string;
  allowedOperation: StagingReadonlyDryRunPlanAllowedOperation;
  status: StagingReadonlyDryRunPlanStatus;
  blocksDryRunExecution: boolean;
  manualReviewRequired: boolean;
}

const NOTE = "spec-only plan：不實際連線、不讀 env、不建立 Supabase client、不執行 dry-run。";
const FORBIDDEN_OP = "no actual connection / no env read / no Supabase client / no DB write / no /api/portfolio switch";
const KILL = "kill switch must be able to stop the future dry-run at this step";
const ROLLBACK = "revert to previous commit; keep fixture/hardcoded as source of truth";
const EVIDENCE = "capture manual review notes + screenshots/records outside code (no secrets in repo)";

function step(
  order: number,
  d: StepDef,
  requiredBeforeStep: string,
  expectedInput: string,
  expectedOutput: string,
): StagingReadonlyDryRunPlanStep {
  return {
    stepId: d.stepId,
    order,
    phase: d.phase,
    title: d.title,
    objective: d.objective,
    requiredBeforeStep,
    expectedInput,
    expectedOutput,
    executionMode: d.status === "PASS" ? "SPEC_ONLY" : "FUTURE_DRY_RUN_ONLY",
    allowedOperation: d.allowedOperation,
    forbiddenOperation: FORBIDDEN_OP,
    killSwitchBehavior: KILL,
    rollbackBehavior: ROLLBACK,
    evidenceToCapture: EVIDENCE,
    status: d.status,
    blocksDryRunExecution: d.blocksDryRunExecution,
    blocksActualConnection: true,
    blocksProductionReadiness: true,
    manualReviewRequired: d.manualReviewRequired,
    notes: NOTE,
  };
}

const STEP_DEFS: StepDef[] = [
  { stepId: "confirm-v56-spec-exists", phase: "PRECHECK", title: "confirm V56 manual sign-off spec exists", objective: "確認 V56 manual sign-off evidence spec 存在", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PASS", blocksDryRunExecution: false, manualReviewRequired: false },
  { stepId: "confirm-signoff-evidence-absent", phase: "PRECHECK", title: "confirm manual sign-off evidence is not provided", objective: "確認 manual sign-off evidence 尚未提供", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "BLOCKED", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "block-dry-run-until-signoff", phase: "MANUAL_SIGNOFF", title: "block dry-run execution until manual sign-off evidence exists", objective: "在 sign-off evidence 提供前阻斷 dry-run execution", allowedOperation: "NO_OPERATION", status: "BLOCKED", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "verify-supabase-project-identity", phase: "ENVIRONMENT_REVIEW", title: "verify staging Supabase project identity outside code", objective: "於 code 外確認 staging Supabase 專案身分", allowedOperation: "MANUAL_DASHBOARD_REVIEW_ONLY", status: "NOT_READY", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "verify-staging-url", phase: "ENVIRONMENT_REVIEW", title: "verify staging URL outside code", objective: "於 code 外確認 staging Supabase URL", allowedOperation: "MANUAL_DASHBOARD_REVIEW_ONLY", status: "NOT_READY", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "define-env-var-names", phase: "ENVIRONMENT_REVIEW", title: "define env variable names without reading env", objective: "定義 env 變數名稱但不讀取 env", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "verify-no-service-role", phase: "ROLE_REVIEW", title: "verify no service_role in app runtime", objective: "確認 app runtime 不使用 service_role", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PASS", blocksDryRunExecution: false, manualReviewRequired: false },
  { stepId: "verify-dashboard-readonly-role", phase: "ROLE_REVIEW", title: "verify dashboard_readonly_app role", objective: "確認 dashboard_readonly_app role 已建立", allowedOperation: "MANUAL_DASHBOARD_REVIEW_ONLY", status: "NOT_READY", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "verify-rls-select-only", phase: "RLS_REVIEW", title: "verify RLS select-only policy", objective: "確認 RLS 僅允許 select-only", allowedOperation: "MANUAL_DASHBOARD_REVIEW_ONLY", status: "NOT_READY", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "verify-write-blocked", phase: "RLS_REVIEW", title: "verify insert / update / delete blocked", objective: "確認寫入操作於 staging 一律 blocked", allowedOperation: "MANUAL_DASHBOARD_REVIEW_ONLY", status: "NOT_READY", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "define-supabase-client-boundary", phase: "DRY_RUN_PREPARATION", title: "define future Supabase client boundary without creating client", objective: "定義未來 Supabase client 邊界但不建立 client", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "define-fixture-baseline-capture", phase: "DRY_RUN_PREPARATION", title: "define fixture/hardcoded baseline capture", objective: "定義 fixture/hardcoded baseline 擷取方式", allowedOperation: "INTERNAL_FIXTURE_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "define-readonly-probe-plan", phase: "READ_ONLY_PROBE_PLAN", title: "define read-only select probe plan without executing it", objective: "定義 read-only select probe 計畫但不執行", allowedOperation: "SELECT_ONLY_FUTURE_PLAN", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "define-freshness-checks", phase: "READ_ONLY_PROBE_PLAN", title: "define staging result freshness checks", objective: "定義 staging 結果新鮮度檢查", allowedOperation: "SELECT_ONLY_FUTURE_PLAN", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "define-shadow-comparison", phase: "SHADOW_COMPARISON_PLAN", title: "define fixture vs staging shadow comparison", objective: "定義 fixture vs staging shadow 比對", allowedOperation: "INTERNAL_FIXTURE_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "define-mismatch-classification", phase: "SHADOW_COMPARISON_PLAN", title: "define mismatch classification", objective: "定義 mismatch 分類（不得自動 promote staging）", allowedOperation: "INTERNAL_FIXTURE_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "define-empty-stale-error-fallback", phase: "ERROR_HANDLING", title: "define empty / stale / error fallback behavior", objective: "定義 empty/stale/error 降級（不得覆蓋 hardcoded）", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "define-kill-switch-stop", phase: "KILL_SWITCH", title: "define kill switch stop point", objective: "定義 kill switch 中止點（預設 enabled）", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "define-rollback-plan", phase: "ROLLBACK", title: "define rollback plan", objective: "定義 rollback 步驟（回前一 commit、保留 fixture）", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "define-evidence-capture-format", phase: "EVIDENCE_CAPTURE", title: "define evidence capture format", objective: "定義 evidence capture 格式（secrets 不入 repo）", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: false },
  { stepId: "keep-portfolio-source-mode-hardcoded", phase: "PRECHECK", title: "keep PORTFOLIO_SOURCE_MODE hardcoded", objective: "PORTFOLIO_SOURCE_MODE 維持 hardcoded", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PASS", blocksDryRunExecution: false, manualReviewRequired: false },
  { stepId: "keep-portfolio-api-unchanged", phase: "PRECHECK", title: "keep /api/portfolio unchanged", objective: "/api/portfolio 不得切換", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PASS", blocksDryRunExecution: false, manualReviewRequired: false },
  { stepId: "keep-production-readiness-blocked", phase: "PRECHECK", title: "keep production readiness blocked", objective: "productionReadinessAllowed 維持 false", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PASS", blocksDryRunExecution: false, manualReviewRequired: false },
  { stepId: "keep-real-market-data-disabled", phase: "PRECHECK", title: "keep real market data disabled", objective: "realMarketDataEnabled 維持 false", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PASS", blocksDryRunExecution: false, manualReviewRequired: false },
  { stepId: "keep-buy-sell-disabled", phase: "PRECHECK", title: "keep buy/sell command generation disabled", objective: "buySellCommandGenerated 維持 false", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PASS", blocksDryRunExecution: false, manualReviewRequired: false },
  { stepId: "keep-auto-order-disabled", phase: "PRECHECK", title: "keep auto order disabled", objective: "autoOrderRequested 維持 false", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PASS", blocksDryRunExecution: false, manualReviewRequired: false },
  { stepId: "final-go-no-go-review", phase: "FINAL_GO_NO_GO", title: "define final GO/NO-GO review", objective: "定義最終 GO/NO-GO 人工複核（目前 NO_GO）", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "BLOCKED", blocksDryRunExecution: true, manualReviewRequired: true },
  { stepId: "confirm-actual-connection-future", phase: "FINAL_GO_NO_GO", title: "confirm actual connection remains future work", objective: "確認 actual connection 仍是未來工作", allowedOperation: "DOCUMENT_REVIEW_ONLY", status: "PLANNED", blocksDryRunExecution: true, manualReviewRequired: true },
];

/**
 * Builds a deterministic staging read-only connection dry-run plan bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no clock
 * is read.
 */
export function buildStagingReadonlyConnectionDryRunPlanContract(
  input: BuildStagingReadonlyConnectionDryRunPlanContractInput = {},
): StagingReadonlyDryRunPlanBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const planSteps: StagingReadonlyDryRunPlanStep[] = STEP_DEFS.map((d, idx) =>
    step(
      idx + 1,
      d,
      "preceding plan steps reviewed; V54 checklist + V55 gate + V56 sign-off spec referenced",
      "prior spec contracts + manual review notes (no env, no Supabase, no real data)",
      "documented plan output + evidence-to-capture definition (no execution)",
    ),
  );

  // decision: any dry-run-execution-blocking step that is not yet cleared
  // (BLOCKED / NOT_READY) → NO_GO. Manual sign-off + final go/no-go steps are
  // BLOCKED, so the default decision is NO_GO.
  const anyBlocking = planSteps.some(
    (s) => s.blocksDryRunExecution && (s.status === "BLOCKED" || s.status === "NOT_READY"),
  );
  const decision: StagingReadonlyDryRunPlanDecision = anyBlocking ? "NO_GO" : "READY_FOR_REVIEW";

  return {
    contractVersion: "V57",
    planName: "Staging Read-only Connection Dry-run Plan",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    planSteps,

    dryRunPlanDefined: true,
    actualDryRunExecuted: false,
    actualConnectionImplemented: false,
    actualConnectionAttempted: false,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    manualSignoffEvidenceProvided: false,
    v56ManualSignoffSpecExists: true,
    v55ConnectionReviewGateExists: true,
    v55Decision: "NO_GO",
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

    futureGate: "V58 Manual Sign-off Evidence Instance / V58 Staging Read-only Dry-run Execution Gate",
    safetyLabels: [...STAGING_READONLY_DRY_RUN_PLAN_SAFETY_LABELS],
  };
}
