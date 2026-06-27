/**
 * Staging Read-only Dry-run Execution Gate Contract — V58
 *
 * Read-model TypeScript contract defining WHAT must all be satisfied before a
 * future staging read-only dry-run may actually be executed. It is an EXECUTION
 * GATE, not the execution itself. This file contains TYPES + a few static safety
 * CONSTANTS ONLY. It declares no runtime, performs no fetch, imports no Supabase
 * client, reads no environment keys, calls Date.now on nothing, writes no data,
 * and connects to nothing.
 *
 * V58 is spec-only. No sign-off / connection / dry-run-execution flag is ever
 * flipped to true: manual sign-off evidence is still not provided, so the default
 * decision is NO_GO; stagingConnectionAllowed, stagingConnectionReviewAllowed,
 * stagingDryRunExecutionAllowed and actualDryRunExecuted are all false; production
 * readiness remains blocked. V57 dry-run plan exists but execution remains
 * blocked; V56 manual sign-off evidence spec exists but evidence remains not
 * provided.
 *
 * See: docs/staging-readonly-dry-run-execution-gate.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type StagingReadonlyDryRunExecutionDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V58 can never decide a
// production go-live.
export type StagingReadonlyDryRunExecutionDecision =
  | "NO_GO"
  | "READY_FOR_REVIEW"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type StagingReadonlyDryRunExecutionCategory =
  | "MANUAL_SIGNOFF"
  | "EVIDENCE_REQUIREMENTS"
  | "SUPABASE_PROJECT"
  | "ENVIRONMENT_VARIABLES"
  | "RLS_POLICY"
  | "ROLE_ACCESS"
  | "READ_ONLY_OPERATION"
  | "SHADOW_ONLY"
  | "KILL_SWITCH"
  | "ROLLBACK"
  | "PORTFOLIO_SOURCE_MODE"
  | "API_ROUTE_SAFETY"
  | "DATA_SOURCE_SAFETY"
  | "TRADING_SAFETY"
  | "FINAL_GO_NO_GO";

export type StagingReadonlyDryRunExecutionStatus =
  | "PASS"
  | "FAIL"
  | "WARNING"
  | "NOT_PROVIDED"
  | "NOT_REVIEWED"
  | "BLOCKED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StagingReadonlyDryRunExecutionGateItem {
  gateItemId: string;
  category: StagingReadonlyDryRunExecutionCategory;
  title: string;
  requiredBeforeDryRunExecution: boolean;
  requiredEvidence: string;
  expectedState: string;
  actualState: string;
  status: StagingReadonlyDryRunExecutionStatus;
  blocksDryRunExecution: boolean;
  blocksActualConnection: boolean;
  blocksProductionReadiness: boolean;
  manualReviewRequired: boolean;
  failureAction: string;
  notes: string;
}

export interface StagingReadonlyDryRunExecutionGateBundle {
  contractVersion: "V58";
  gateName: "Staging Read-only Dry-run Execution Gate";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: StagingReadonlyDryRunExecutionDecision;

  gateItems: StagingReadonlyDryRunExecutionGateItem[];

  // Frozen top-level safety flags.
  dryRunExecutionGateDefined: true;
  v57DryRunPlanExists: true;
  v56ManualSignoffSpecExists: true;
  v55ConnectionReviewGateExists: true;
  actualDryRunExecuted: false;
  actualConnectionImplemented: false;
  actualConnectionAttempted: false;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  manualSignoffEvidenceProvided: false;
  manualSignerIdentityVerified: false;
  manualSignerHasAuthority: false;
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

export const STAGING_READONLY_DRY_RUN_EXECUTION_GATE_CONTRACT_VERSION = "V58" as const;

export const STAGING_READONLY_DRY_RUN_EXECUTION_GATE_DEPLOYMENT_TARGET = "staging" as const;

export const STAGING_READONLY_DRY_RUN_EXECUTION_GATE_CATEGORIES: readonly StagingReadonlyDryRunExecutionCategory[] = [
  "MANUAL_SIGNOFF",
  "EVIDENCE_REQUIREMENTS",
  "SUPABASE_PROJECT",
  "ENVIRONMENT_VARIABLES",
  "RLS_POLICY",
  "ROLE_ACCESS",
  "READ_ONLY_OPERATION",
  "SHADOW_ONLY",
  "KILL_SWITCH",
  "ROLLBACK",
  "PORTFOLIO_SOURCE_MODE",
  "API_ROUTE_SAFETY",
  "DATA_SOURCE_SAFETY",
  "TRADING_SAFETY",
  "FINAL_GO_NO_GO",
] as const;

export const STAGING_READONLY_DRY_RUN_EXECUTION_GATE_ALLOWED_DECISIONS: readonly StagingReadonlyDryRunExecutionDecision[] = [
  "NO_GO",
  "READY_FOR_REVIEW",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every staging read-only dry-run execution gate surface
 * must keep these negations intact.
 */
export const STAGING_READONLY_DRY_RUN_EXECUTION_GATE_SAFETY_LABELS = [
  "Staging Read-only Dry-run Execution Gate",
  "execution gate",
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
  "V57 dry-run plan exists but execution remains blocked",
  "V56 manual sign-off evidence spec exists but evidence remains not provided",
  "manualSignoffRequired = true",
  "manualSignoffCompleted = false",
  "manualSignoffEvidenceProvided = false",
  "stagingConnectionAllowed = false",
  "stagingConnectionReviewAllowed = false",
  "stagingDryRunExecutionAllowed = false",
  "actualDryRunExecuted = false",
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
 * any staging read-only dry-run execution gate surface.
 */
export const STAGING_READONLY_DRY_RUN_EXECUTION_GATE_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
