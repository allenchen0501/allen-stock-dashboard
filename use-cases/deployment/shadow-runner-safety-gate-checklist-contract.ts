/**
 * Shadow Runner Safety Gate Checklist Contract — V54
 *
 * Read-model TypeScript contract consolidating the V44–V53 safety invariants into
 * a single, verifiable, manually-sign-off-able checklist that gates entry into
 * V55 Staging Read-only Connection Review. This file contains TYPES + a few
 * static safety CONSTANTS ONLY. It declares no runtime, performs no fetch,
 * imports no Supabase client, reads no environment keys, calls Date.now on
 * nothing, writes no data, and connects to nothing.
 *
 * V54 is spec-only. It is NOT a new feature, NOT a staging Supabase
 * implementation, NOT a production data go-live, and NOT an actual staging
 * connection. Only when every blocking item is PASS and manualSignoffCompleted
 * is set true by a human may V55 proceed. stagingConnectionAllowed is false and
 * production readiness remains blocked.
 *
 * See: docs/shadow-runner-safety-gate-checklist.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ShadowRunnerSafetyGateDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V54 can never decide a
// production go-live.
export type ShadowRunnerSafetyGateDecision =
  | "READY_FOR_REVIEW"
  | "NO_GO"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type ShadowRunnerSafetyGateCategory =
  | "DEPLOYMENT"
  | "ROUTE"
  | "MONITORING_UI"
  | "SUPABASE_SAFETY"
  | "RLS"
  | "SCHEMA_MAPPING"
  | "ADAPTER"
  | "SHADOW_COMPARISON"
  | "SHADOW_RUNNER"
  | "API_CONTRACT"
  | "PRODUCTION_EVIDENCE"
  | "DATA_SOURCE"
  | "PORTFOLIO_SWITCH"
  | "TRADING_SAFETY"
  | "MANUAL_SIGNOFF";

export type ShadowRunnerSafetyGateStatus =
  | "PASS"
  | "FAIL"
  | "WARNING"
  | "NOT_REVIEWED"
  | "BLOCKED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ShadowRunnerSafetyGateChecklistItem {
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

export interface ShadowRunnerSafetyGateChecklistBundle {
  contractVersion: "V54";
  checklistName: "Shadow Runner Safety Gate Checklist";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: ShadowRunnerSafetyGateDecision;

  checklistItems: ShadowRunnerSafetyGateChecklistItem[];

  // Frozen top-level safety flags.
  safetyGateChecklistDefined: true;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  stagingConnectionAllowed: false;
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
  productionRouteSmokePassed: true;
  monitoringUiProductionEvidencePassed: true;

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const SHADOW_RUNNER_SAFETY_GATE_CHECKLIST_CONTRACT_VERSION = "V54" as const;

export const SHADOW_RUNNER_SAFETY_GATE_CHECKLIST_DEPLOYMENT_TARGET = "staging" as const;

export const SHADOW_RUNNER_SAFETY_GATE_CHECKLIST_CATEGORIES: readonly ShadowRunnerSafetyGateCategory[] = [
  "DEPLOYMENT",
  "ROUTE",
  "MONITORING_UI",
  "SUPABASE_SAFETY",
  "RLS",
  "SCHEMA_MAPPING",
  "ADAPTER",
  "SHADOW_COMPARISON",
  "SHADOW_RUNNER",
  "API_CONTRACT",
  "PRODUCTION_EVIDENCE",
  "DATA_SOURCE",
  "PORTFOLIO_SWITCH",
  "TRADING_SAFETY",
  "MANUAL_SIGNOFF",
] as const;

export const SHADOW_RUNNER_SAFETY_GATE_CHECKLIST_ALLOWED_DECISIONS: readonly ShadowRunnerSafetyGateDecision[] = [
  "READY_FOR_REVIEW",
  "NO_GO",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every shadow runner safety gate checklist surface must
 * keep these negations intact.
 */
export const SHADOW_RUNNER_SAFETY_GATE_CHECKLIST_SAFETY_LABELS = [
  "Shadow Runner Safety Gate Checklist",
  "staging read-only connection review",
  "final checklist",
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
  "responseSource must remain mock_or_contract",
  "sourceMode must remain fixture",
  "PORTFOLIO_SOURCE_MODE must remain hardcoded",
  "fixture/hardcoded must not be overridden by staging",
  "mismatch must not promote staging",
  "empty / stale / error result must not override hardcoded",
  "kill switch must be enabled by default",
  "manualSignoffRequired = true",
  "manualSignoffCompleted = false",
  "stagingConnectionAllowed = false",
  "production readiness remains blocked",
  "fixture/mock UI 仍維持現狀",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any shadow runner safety gate checklist surface.
 */
export const SHADOW_RUNNER_SAFETY_GATE_CHECKLIST_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
