/**
 * Staging Read-only Connection Dry-run Plan Contract — V57
 *
 * Read-model TypeScript contract defining the STEPS, preconditions, manual
 * checkpoints, kill-switch stop points, rollback steps, error classification, and
 * evidence-capture plan for a FUTURE staging read-only connection dry-run. This
 * file contains TYPES + a few static safety CONSTANTS ONLY. It declares no
 * runtime, performs no fetch, imports no Supabase client, reads no environment
 * keys, calls Date.now on nothing, writes no data, and connects to nothing.
 *
 * V57 is a dry-run PLAN, NOT an actual dry-run execution and NOT an actual
 * connection. No sign-off / connection / dry-run-execution flag is ever flipped
 * to true: manual sign-off evidence is still not provided, so the default
 * decision is NO_GO; stagingConnectionAllowed, stagingConnectionReviewAllowed and
 * stagingDryRunExecutionAllowed are all false; production readiness remains
 * blocked. V56 manual sign-off evidence spec exists but evidence remains not
 * provided; V55 connection review gate exists but decision remains NO_GO.
 *
 * See: docs/staging-readonly-connection-dry-run-plan.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type StagingReadonlyDryRunPlanDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V57 can never decide a
// production go-live.
export type StagingReadonlyDryRunPlanDecision =
  | "NO_GO"
  | "READY_FOR_REVIEW"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type StagingReadonlyDryRunPlanV55Decision = "NO_GO";

export type StagingReadonlyDryRunPlanPhase =
  | "PRECHECK"
  | "MANUAL_SIGNOFF"
  | "ENVIRONMENT_REVIEW"
  | "RLS_REVIEW"
  | "ROLE_REVIEW"
  | "DRY_RUN_PREPARATION"
  | "READ_ONLY_PROBE_PLAN"
  | "SHADOW_COMPARISON_PLAN"
  | "ERROR_HANDLING"
  | "KILL_SWITCH"
  | "ROLLBACK"
  | "EVIDENCE_CAPTURE"
  | "FINAL_GO_NO_GO";

export type StagingReadonlyDryRunPlanExecutionMode =
  | "SPEC_ONLY"
  | "MANUAL_ONLY"
  | "FUTURE_DRY_RUN_ONLY"
  | "NO_RUNTIME_CREATED";

export type StagingReadonlyDryRunPlanAllowedOperation =
  | "DOCUMENT_REVIEW_ONLY"
  | "MANUAL_DASHBOARD_REVIEW_ONLY"
  | "SELECT_ONLY_FUTURE_PLAN"
  | "INTERNAL_FIXTURE_ONLY"
  | "NO_OPERATION";

export type StagingReadonlyDryRunPlanStatus =
  | "PLANNED"
  | "NOT_READY"
  | "BLOCKED"
  | "READY_FOR_REVIEW"
  | "PASS"
  | "FAIL";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StagingReadonlyDryRunPlanStep {
  stepId: string;
  order: number;
  phase: StagingReadonlyDryRunPlanPhase;
  title: string;
  objective: string;
  requiredBeforeStep: string;
  expectedInput: string;
  expectedOutput: string;
  executionMode: StagingReadonlyDryRunPlanExecutionMode;
  allowedOperation: StagingReadonlyDryRunPlanAllowedOperation;
  forbiddenOperation: string;
  killSwitchBehavior: string;
  rollbackBehavior: string;
  evidenceToCapture: string;
  status: StagingReadonlyDryRunPlanStatus;
  blocksDryRunExecution: boolean;
  blocksActualConnection: boolean;
  blocksProductionReadiness: boolean;
  manualReviewRequired: boolean;
  notes: string;
}

export interface StagingReadonlyDryRunPlanBundle {
  contractVersion: "V57";
  planName: "Staging Read-only Connection Dry-run Plan";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: StagingReadonlyDryRunPlanDecision;

  planSteps: StagingReadonlyDryRunPlanStep[];

  // Frozen top-level safety flags.
  dryRunPlanDefined: true;
  actualDryRunExecuted: false;
  actualConnectionImplemented: false;
  actualConnectionAttempted: false;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  manualSignoffEvidenceProvided: false;
  v56ManualSignoffSpecExists: true;
  v55ConnectionReviewGateExists: true;
  v55Decision: "NO_GO";
  stagingConnectionAllowed: false;
  stagingConnectionReviewAllowed: false;
  stagingDryRunExecutionAllowed: false;
  productionReadinessAllowed: false;
  stagingSupabaseConnected: false;
  stagingReadPerformed: false;
  stagingWritePerformed: false;
  productionSupabaseConnected: false;
  productionWritePerformed: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  requestPerformed: false;
  apiRouteCreated: false;
  uiCreated: false;
  sqlMigrationCreated: false;
  runtimeCreated: false;
  shadowRunnerRuntimeCreated: false;
  shadowRunnerExecuted: false;
  shadowComparisonPerformed: false;
  shadowResultPersisted: false;
  portfolioApiSwitched: false;
  portfolioSourceModeChanged: false;
  realMarketDataEnabled: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  killSwitchDefaultEnabled: true;
  serviceRoleAllowedInAppRuntime: false;
  anonRoleAllowed: false;
  dashboardReadonlyRoleRequired: true;
  readOnlySelectOnlyRequired: true;
  writeOperationsBlocked: true;
  shadowOnlyRequired: true;
  portfolioApiMustRemainHardcoded: true;
  fixtureCanBeOverriddenByStaging: false;
  hardcodedCanBeOverriddenByStaging: false;
  mismatchCanPromoteStaging: false;
  dryRunCanPromoteStaging: false;
  emptyResultCanOverrideHardcoded: false;
  staleResultCanOverrideHardcoded: false;
  errorResultCanOverrideHardcoded: false;

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const STAGING_READONLY_DRY_RUN_PLAN_CONTRACT_VERSION = "V57" as const;

export const STAGING_READONLY_DRY_RUN_PLAN_DEPLOYMENT_TARGET = "staging" as const;

export const STAGING_READONLY_DRY_RUN_PLAN_PHASES: readonly StagingReadonlyDryRunPlanPhase[] = [
  "PRECHECK",
  "MANUAL_SIGNOFF",
  "ENVIRONMENT_REVIEW",
  "RLS_REVIEW",
  "ROLE_REVIEW",
  "DRY_RUN_PREPARATION",
  "READ_ONLY_PROBE_PLAN",
  "SHADOW_COMPARISON_PLAN",
  "ERROR_HANDLING",
  "KILL_SWITCH",
  "ROLLBACK",
  "EVIDENCE_CAPTURE",
  "FINAL_GO_NO_GO",
] as const;

export const STAGING_READONLY_DRY_RUN_PLAN_ALLOWED_DECISIONS: readonly StagingReadonlyDryRunPlanDecision[] = [
  "NO_GO",
  "READY_FOR_REVIEW",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every staging read-only connection dry-run plan
 * surface must keep these negations intact.
 */
export const STAGING_READONLY_DRY_RUN_PLAN_SAFETY_LABELS = [
  "Staging Read-only Connection Dry-run Plan",
  "dry-run plan",
  "not actual dry-run execution",
  "not actual connection",
  "not production trading system",
  "no real market data",
  "no Supabase connection",
  "no env key",
  "no DB write",
  "no staging write",
  "no production write",
  "no SQL migration",
  "no api switch",
  "no buy/sell command",
  "no auto order",
  "V56 manual sign-off evidence spec exists but evidence remains not provided",
  "V55 connection review gate exists but decision remains NO_GO",
  "manualSignoffRequired = true",
  "manualSignoffCompleted = false",
  "manualSignoffEvidenceProvided = false",
  "stagingConnectionAllowed = false",
  "stagingConnectionReviewAllowed = false",
  "stagingDryRunExecutionAllowed = false",
  "actualConnectionImplemented = false",
  "actualConnectionAttempted = false",
  "productionReadinessAllowed = false",
  "serviceRoleAllowedInAppRuntime = false",
  "dashboardReadonlyRoleRequired = true",
  "readOnlySelectOnlyRequired = true",
  "writeOperationsBlocked = true",
  "shadowOnlyRequired = true",
  "PORTFOLIO_SOURCE_MODE must remain hardcoded",
  "/api/portfolio must not be switched",
  "fixture/hardcoded must not be overridden by staging",
  "mismatch must not promote staging",
  "empty / stale / error result must not override hardcoded",
  "kill switch must be enabled by default",
  "fixture/mock UI 仍維持現狀",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any staging read-only connection dry-run plan surface.
 */
export const STAGING_READONLY_DRY_RUN_PLAN_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
