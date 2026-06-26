/**
 * Shadow Runner Dry-run Spec Contract — V49
 *
 * Read-model TypeScript contract describing the FUTURE shadow runner dry-run
 * execution semantics (runner steps, fixture-to-fixture self-check, evidence
 * report shape, pass/mismatch/data-insufficient counts, kill-switch stop points,
 * fallback / downgrade rules). This file contains TYPES + a few static safety
 * CONSTANTS ONLY. It declares no runtime, performs no fetch, imports no Supabase
 * client, reads no environment keys, calls Date.now on nothing, writes no data,
 * and connects to nothing.
 *
 * V49 is spec-only. It is NOT a staging Supabase implementation, NOT a real
 * Supabase client, NOT a connection review, and NOT a real shadow runner
 * runtime. The runner is never executed here. The dry-run is fixture-to-fixture
 * self-check SHAPE only: it must never connect to staging, fixture/hardcoded is
 * the source of truth and can never be overridden, mismatch never promotes
 * staging, evidence is never persisted to a DB, the kill switch can always block
 * the shadow runner, /api/portfolio is never switched, and production Supabase is
 * never a runner target.
 *
 * See: docs/shadow-runner-dry-run-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ShadowRunnerDryRunDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V49 can never decide a
// production go-live.
export type ShadowRunnerDryRunDecision =
  | "READY_FOR_REVIEW"
  | "NO_GO"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type ShadowRunnerDryRunExecutionMode =
  | "SPEC_ONLY"
  | "FIXTURE_TO_FIXTURE_DRY_RUN_ONLY"
  | "NO_RUNTIME_CREATED";

export type ShadowRunnerDryRunInputSource =
  | "FIXTURE_BASELINE"
  | "MOCK_OR_CONTRACT"
  | "PREVIOUS_SPEC_CONTRACT"
  | "NO_STAGING_INPUT";

export type ShadowRunnerDryRunOutputArtifact =
  | "EVIDENCE_REPORT_SHAPE_ONLY"
  | "COUNTS_ONLY"
  | "MANUAL_REVIEW_PAYLOAD_SHAPE"
  | "NO_PERSISTENCE_ARTIFACT";

export type ShadowRunnerDryRunFailureBehavior =
  | "RECORD_DATA_INSUFFICIENT"
  | "BLOCK_PROMOTION"
  | "FORCE_FIXTURE_MODE"
  | "REQUIRE_MANUAL_REVIEW";

export type ShadowRunnerDryRunKillSwitchBehavior =
  | "BLOCK_SHADOW_RUNNER"
  | "FORCE_FIXTURE_MODE"
  | "REQUIRE_MANUAL_SIGNOFF";

export type ShadowRunnerDryRunVerificationStatus =
  | "NOT_REVIEWED"
  | "PASS"
  | "FAIL"
  | "BLOCKED";

export type ShadowRunnerDryRunSourceMode = "hardcoded" | "fixture" | "mock_or_contract";

export type ShadowRunnerDryRunRunnerMode = "dry_run_spec" | "spec_only";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ShadowRunnerDryRunStepSpec {
  stepName: string;
  order: number;
  inputSource: ShadowRunnerDryRunInputSource;
  outputArtifact: ShadowRunnerDryRunOutputArtifact;
  executionMode: ShadowRunnerDryRunExecutionMode;
  requiresSupabase: false;
  requiresEnv: false;
  performsExternalRequest: false;
  performsDbWrite: false;
  canPromoteStaging: false;
  canSwitchPortfolioApi: false;
  failureBehavior: ShadowRunnerDryRunFailureBehavior;
  killSwitchBehavior: ShadowRunnerDryRunKillSwitchBehavior;
  evidenceFields: string[];
  verificationStatus: ShadowRunnerDryRunVerificationStatus;
  blocksRelease: boolean;
  notes: string;
}

export interface ShadowRunnerDryRunEvidenceReportShape {
  reportVersion: string;
  generatedAt: string;
  sourceMode: ShadowRunnerDryRunSourceMode;
  runnerMode: ShadowRunnerDryRunRunnerMode;
  comparedTableCount: number;
  comparedFieldCount: number;
  passCount: number;
  mismatchCount: number;
  dataInsufficientCount: number;
  staleCount: number;
  errorCount: number;
  blockedCount: number;
  promotionAllowed: false;
  portfolioApiSwitchAllowed: false;
  persisted: false;
  killSwitchTriggered: boolean;
  manualReviewRequired: boolean;
  notes: string;
}

export interface ShadowRunnerDryRunPolicyRule {
  ruleId: string;
  description: string;
  blocksReleaseOnViolation: boolean;
}

export interface ShadowRunnerDryRunManualCheck {
  checkId: string;
  description: string;
  required: true;
}

export interface ShadowRunnerDryRunSpecBundle {
  contractVersion: "V49";
  specName: "Shadow Runner Dry-run Spec";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: ShadowRunnerDryRunDecision;

  runnerStepSpecs: ShadowRunnerDryRunStepSpec[];
  evidenceReportShape: ShadowRunnerDryRunEvidenceReportShape;
  policyRules: ShadowRunnerDryRunPolicyRule[];
  manualChecks: ShadowRunnerDryRunManualCheck[];

  // Frozen top-level safety flags.
  shadowRunnerDryRunSpecDefined: true;
  shadowRunnerRuntimeCreated: false;
  shadowRunnerExecuted: false;
  fixtureToFixtureSelfCheckDefined: true;
  fixtureToStagingComparisonPerformed: false;
  stagingSupabasePlanned: true;
  stagingSupabaseConnected: false;
  stagingReadPerformed: false;
  stagingWritePerformed: false;
  shadowComparisonPerformed: false;
  shadowResultPersisted: false;
  productionSupabaseConnected: false;
  productionWritePerformed: false;
  databaseWritePerformed: false;
  requestPerformed: false;
  envReadPerformed: false;
  apiRouteCreated: false;
  uiCreated: false;
  runtimeCreated: false;
  sqlMigrationCreated: false;
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

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const SHADOW_RUNNER_DRY_RUN_SPEC_CONTRACT_VERSION = "V49" as const;

export const SHADOW_RUNNER_DRY_RUN_SPEC_DEPLOYMENT_TARGET = "staging" as const;

export const SHADOW_RUNNER_DRY_RUN_SPEC_STEP_NAMES: readonly string[] = [
  "loadFixtureBaseline",
  "runFixtureToFixtureSelfCheck",
  "calculateShadowComparisonEvidence",
  "classifyMismatchAndDataInsufficient",
  "evaluateKillSwitchAndPromotionGuard",
  "buildShadowDryRunReport",
] as const;

export const SHADOW_RUNNER_DRY_RUN_SPEC_ALLOWED_DECISIONS: readonly ShadowRunnerDryRunDecision[] = [
  "READY_FOR_REVIEW",
  "NO_GO",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every shadow runner dry-run spec surface must keep
 * these negations intact.
 */
export const SHADOW_RUNNER_DRY_RUN_SPEC_SAFETY_LABELS = [
  "Shadow Runner Dry-run Spec",
  "shadow runner dry-run",
  "fixture-to-fixture self-check",
  "read-only",
  "not production trading system",
  "no real market data",
  "no Supabase connection",
  "no env key",
  "no write",
  "no staging write",
  "no production write",
  "no SQL migration",
  "no api switch",
  "no buy/sell command",
  "no auto order",
  "PORTFOLIO_SOURCE_MODE must remain hardcoded",
  "fixture-to-fixture self-check is shape-only",
  "dry-run must not connect to staging",
  "dry-run evidence must not be persisted to DB",
  "dry-run mismatch must not promote staging",
  "empty / stale / error result must not override fixture/hardcoded",
  "kill switch must be able to block shadow runner",
  "fixture/mock UI 仍維持現狀",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any shadow runner dry-run spec surface.
 */
export const SHADOW_RUNNER_DRY_RUN_SPEC_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
