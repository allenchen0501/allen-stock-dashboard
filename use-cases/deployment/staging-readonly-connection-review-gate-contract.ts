/**
 * Staging Read-only Connection Review Gate Contract — V55
 *
 * Read-model TypeScript contract defining the GATE conditions, manual sign-off
 * fields, allowed/blocked states, read-only / shadow-only constraints, and
 * rollback / kill-switch / evidence requirements that must be satisfied before a
 * FUTURE staging read-only connection review. This file contains TYPES + a few
 * static safety CONSTANTS ONLY. It declares no runtime, performs no fetch,
 * imports no Supabase client, reads no environment keys, calls Date.now on
 * nothing, writes no data, and connects to nothing.
 *
 * V55 is a review gate, NOT an actual connection. There is no manual sign-off
 * evidence yet, so manualSignoffCompleted is false, stagingConnectionAllowed is
 * false, stagingConnectionReviewAllowed is false, and the default decision is
 * NO_GO. Production readiness remains blocked.
 *
 * See: docs/staging-readonly-connection-review-gate.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type StagingReadonlyConnectionReviewDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V55 can never decide a
// production go-live.
export type StagingReadonlyConnectionReviewDecision =
  | "NO_GO"
  | "READY_FOR_REVIEW"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type StagingReadonlyConnectionReviewCategory =
  | "MANUAL_SIGNOFF"
  | "V54_CHECKLIST"
  | "SUPABASE_PROJECT"
  | "ENVIRONMENT_VARIABLES"
  | "RLS_POLICY"
  | "ROLE_ACCESS"
  | "READ_ONLY_OPERATION"
  | "SHADOW_ONLY"
  | "KILL_SWITCH"
  | "PORTFOLIO_SOURCE_MODE"
  | "API_ROUTE_SAFETY"
  | "UI_SAFETY"
  | "DATA_SOURCE_SAFETY"
  | "PRODUCTION_READINESS"
  | "ROLLBACK_PLAN";

export type StagingReadonlyConnectionReviewStatus =
  | "PASS"
  | "FAIL"
  | "WARNING"
  | "NOT_REVIEWED"
  | "BLOCKED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StagingReadonlyConnectionReviewRequirementItem {
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

export interface StagingReadonlyConnectionReviewGateBundle {
  contractVersion: "V55";
  gateName: "Staging Read-only Connection Review Gate";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: StagingReadonlyConnectionReviewDecision;

  requirementItems: StagingReadonlyConnectionReviewRequirementItem[];

  // Frozen top-level safety flags.
  connectionReviewGateDefined: true;
  actualConnectionImplemented: false;
  actualConnectionAttempted: false;
  stagingConnectionAllowed: false;
  stagingConnectionReviewAllowed: false;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  manualSignoffEvidenceProvided: false;
  v54ChecklistPassed: true;
  v54ChecklistProductionReady: false;
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
  fixtureCanBeOverriddenByStaging: false;
  hardcodedCanBeOverriddenByStaging: false;
  mismatchCanPromoteStaging: false;
  dryRunCanPromoteStaging: false;
  emptyResultCanOverrideHardcoded: false;
  staleResultCanOverrideHardcoded: false;
  errorResultCanOverrideHardcoded: false;
  serviceRoleAllowedInAppRuntime: false;
  anonRoleAllowed: false;
  dashboardReadonlyRoleRequired: true;
  readOnlySelectOnlyRequired: true;
  writeOperationsBlocked: true;
  shadowOnlyRequired: true;
  portfolioApiMustRemainHardcoded: true;

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const STAGING_READONLY_CONNECTION_REVIEW_GATE_CONTRACT_VERSION = "V55" as const;

export const STAGING_READONLY_CONNECTION_REVIEW_GATE_DEPLOYMENT_TARGET = "staging" as const;

export const STAGING_READONLY_CONNECTION_REVIEW_GATE_CATEGORIES: readonly StagingReadonlyConnectionReviewCategory[] = [
  "MANUAL_SIGNOFF",
  "V54_CHECKLIST",
  "SUPABASE_PROJECT",
  "ENVIRONMENT_VARIABLES",
  "RLS_POLICY",
  "ROLE_ACCESS",
  "READ_ONLY_OPERATION",
  "SHADOW_ONLY",
  "KILL_SWITCH",
  "PORTFOLIO_SOURCE_MODE",
  "API_ROUTE_SAFETY",
  "UI_SAFETY",
  "DATA_SOURCE_SAFETY",
  "PRODUCTION_READINESS",
  "ROLLBACK_PLAN",
] as const;

export const STAGING_READONLY_CONNECTION_REVIEW_GATE_ALLOWED_DECISIONS: readonly StagingReadonlyConnectionReviewDecision[] = [
  "NO_GO",
  "READY_FOR_REVIEW",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every staging read-only connection review gate surface
 * must keep these negations intact.
 */
export const STAGING_READONLY_CONNECTION_REVIEW_GATE_SAFETY_LABELS = [
  "Staging Read-only Connection Review Gate",
  "review gate",
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
  "V54 checklist passed = true",
  "manualSignoffRequired = true",
  "manualSignoffCompleted = false",
  "manualSignoffEvidenceProvided = false",
  "stagingConnectionAllowed = false",
  "stagingConnectionReviewAllowed = false",
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
 * any staging read-only connection review gate surface.
 */
export const STAGING_READONLY_CONNECTION_REVIEW_GATE_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
