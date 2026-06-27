/**
 * Staging Read-only Dry-run Execution Evidence Spec Contract — V59
 *
 * Read-model TypeScript contract defining WHICH execution evidence must be
 * collected AFTER a future staging read-only dry-run is actually executed
 * (read-only probe, no-write proof, RLS select-only, role, shadow comparison,
 * mismatch, stale/empty/error fallback, kill switch, rollback, etc.). This file
 * contains TYPES + a few static safety CONSTANTS ONLY. It declares no runtime,
 * performs no fetch, imports no Supabase client, reads no environment keys, calls
 * Date.now on nothing, writes no data, and connects to nothing.
 *
 * V59 is the execution evidence STRUCTURE, NOT an execution evidence instance and
 * NOT an actual dry-run execution. No execution / sign-off / connection flag is
 * ever flipped to true: the dry-run has not been executed, so the default
 * decision is NO_GO; actualDryRunExecuted, actualDryRunEvidenceProvided,
 * stagingConnectionAllowed, stagingConnectionReviewAllowed and
 * stagingDryRunExecutionAllowed are all false; production readiness remains
 * blocked. V58 execution gate exists but execution remains blocked; V57 dry-run
 * plan exists but execution remains blocked.
 *
 * See: docs/staging-readonly-dry-run-execution-evidence-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type StagingReadonlyDryRunExecutionEvidenceDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V59 can never decide a
// production go-live.
export type StagingReadonlyDryRunExecutionEvidenceDecision =
  | "NO_GO"
  | "READY_FOR_REVIEW"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type StagingReadonlyDryRunExecutionEvidenceCategory =
  | "EXECUTION_IDENTITY"
  | "MANUAL_SIGNOFF"
  | "READ_ONLY_PROBE"
  | "NO_WRITE_PROOF"
  | "RLS_POLICY"
  | "ROLE_ACCESS"
  | "SHADOW_COMPARISON"
  | "MISMATCH_CLASSIFICATION"
  | "STALE_EMPTY_ERROR_FALLBACK"
  | "KILL_SWITCH"
  | "ROLLBACK"
  | "PORTFOLIO_SOURCE_MODE"
  | "API_ROUTE_SAFETY"
  | "DATA_SOURCE_SAFETY"
  | "TRADING_SAFETY"
  | "FINAL_REVIEW";

export type StagingReadonlyDryRunExecutionEvidenceStatus =
  | "NOT_PROVIDED"
  | "NOT_REVIEWED"
  | "BLOCKED"
  | "PASS"
  | "FAIL"
  | "WARNING";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StagingReadonlyDryRunExecutionEvidenceItem {
  evidenceItemId: string;
  category: StagingReadonlyDryRunExecutionEvidenceCategory;
  title: string;
  requiredEvidence: string;
  acceptedEvidenceFormat: string;
  expectedState: string;
  providedState: string;
  status: StagingReadonlyDryRunExecutionEvidenceStatus;
  requiredAfterDryRunExecution: boolean;
  blocksEvidenceAcceptance: boolean;
  blocksProductionReadiness: boolean;
  manualReviewRequired: boolean;
  failureAction: string;
  notes: string;
}

export interface StagingReadonlyDryRunExecutionEvidenceSpecBundle {
  contractVersion: "V59";
  specName: "Staging Read-only Dry-run Execution Evidence Spec";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: StagingReadonlyDryRunExecutionEvidenceDecision;

  evidenceItems: StagingReadonlyDryRunExecutionEvidenceItem[];

  // Frozen top-level safety flags.
  dryRunExecutionEvidenceSpecDefined: true;
  actualDryRunExecuted: false;
  actualDryRunEvidenceProvided: false;
  actualConnectionImplemented: false;
  actualConnectionAttempted: false;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  manualSignoffEvidenceProvided: false;
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

export const STAGING_READONLY_DRY_RUN_EXECUTION_EVIDENCE_SPEC_CONTRACT_VERSION = "V59" as const;

export const STAGING_READONLY_DRY_RUN_EXECUTION_EVIDENCE_SPEC_DEPLOYMENT_TARGET = "staging" as const;

export const STAGING_READONLY_DRY_RUN_EXECUTION_EVIDENCE_SPEC_CATEGORIES: readonly StagingReadonlyDryRunExecutionEvidenceCategory[] = [
  "EXECUTION_IDENTITY",
  "MANUAL_SIGNOFF",
  "READ_ONLY_PROBE",
  "NO_WRITE_PROOF",
  "RLS_POLICY",
  "ROLE_ACCESS",
  "SHADOW_COMPARISON",
  "MISMATCH_CLASSIFICATION",
  "STALE_EMPTY_ERROR_FALLBACK",
  "KILL_SWITCH",
  "ROLLBACK",
  "PORTFOLIO_SOURCE_MODE",
  "API_ROUTE_SAFETY",
  "DATA_SOURCE_SAFETY",
  "TRADING_SAFETY",
  "FINAL_REVIEW",
] as const;

export const STAGING_READONLY_DRY_RUN_EXECUTION_EVIDENCE_SPEC_ALLOWED_DECISIONS: readonly StagingReadonlyDryRunExecutionEvidenceDecision[] = [
  "NO_GO",
  "READY_FOR_REVIEW",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every staging read-only dry-run execution evidence
 * spec surface must keep these negations intact.
 */
export const STAGING_READONLY_DRY_RUN_EXECUTION_EVIDENCE_SPEC_SAFETY_LABELS = [
  "Staging Read-only Dry-run Execution Evidence Spec",
  "execution evidence structure",
  "not execution evidence instance",
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
  "V58 execution gate exists but execution remains blocked",
  "V57 dry-run plan exists but execution remains blocked",
  "manualSignoffRequired = true",
  "manualSignoffCompleted = false",
  "manualSignoffEvidenceProvided = false",
  "actualDryRunExecuted = false",
  "actualDryRunEvidenceProvided = false",
  "stagingConnectionAllowed = false",
  "stagingConnectionReviewAllowed = false",
  "stagingDryRunExecutionAllowed = false",
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
 * any staging read-only dry-run execution evidence spec surface.
 */
export const STAGING_READONLY_DRY_RUN_EXECUTION_EVIDENCE_SPEC_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
