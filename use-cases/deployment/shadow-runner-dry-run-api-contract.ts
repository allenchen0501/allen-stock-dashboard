/**
 * Shadow Runner Dry-run API Contract — V50
 *
 * Read-model TypeScript contract describing the FUTURE fixture-only shadow runner
 * dry-run API response (planned endpoint shape, safe response flags, evidence
 * payload shape, error/fallback behavior). This file contains TYPES + a few
 * static safety CONSTANTS ONLY. It declares no runtime, performs no fetch,
 * imports no Supabase client, reads no environment keys, calls Date.now on
 * nothing, writes no data, and adds NO actual route.
 *
 * V50 is spec-only / fixture-only. It is NOT an API route implementation, NOT a
 * staging Supabase implementation, NOT a connection review, and NOT a production
 * data go-live. The planned endpoint /api/portfolio/shadow-runner-dry-run is
 * described only — never created. responseSource stays mock_or_contract,
 * sourceMode stays fixture, PORTFOLIO_SOURCE_MODE must remain hardcoded,
 * fixture/hardcoded can never be overridden by staging, mismatch never promotes
 * staging, evidence is never persisted to a DB, and the kill switch is enabled by
 * default.
 *
 * See: docs/shadow-runner-dry-run-api-contract.md
 */

import type {
  ShadowRunnerDryRunEvidenceReportShape,
} from "./shadow-runner-dry-run-spec-contract";

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

// Note: "PRODUCTION_READY" is deliberately NOT a member — V50 can never decide a
// production go-live.
export type ShadowRunnerDryRunApiDecision =
  | "READY_FOR_REVIEW"
  | "NO_GO"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type ShadowRunnerDryRunApiResponseSource = "mock_or_contract";

export type ShadowRunnerDryRunApiSourceMode = "fixture";

export type ShadowRunnerDryRunApiMethod = "GET";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ShadowRunnerDryRunApiDryRunBundleShape {
  contractVersion: "V49";
  specName: "Shadow Runner Dry-run Spec";
  runnerMode: "dry_run_spec";
  fixtureToFixtureSelfCheckDefined: true;
  shadowRunnerRuntimeCreated: false;
  shadowRunnerExecuted: false;
  fixtureToStagingComparisonPerformed: false;
}

export interface ShadowRunnerDryRunApiSafetyFlags {
  routeCreated: false;
  requestPerformed: false;
  envReadPerformed: false;
  supabaseConnected: false;
  stagingSupabaseConnected: false;
  productionSupabaseConnected: false;
  databaseWritePerformed: false;
  shadowRunnerExecuted: false;
  shadowResultPersisted: false;
  portfolioApiSwitched: false;
  portfolioSourceModeChanged: false;
  realMarketDataEnabled: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  promotionAllowed: false;
  portfolioApiSwitchAllowed: false;
  persisted: false;
  killSwitchDefaultEnabled: true;
  fixtureCanBeOverriddenByStaging: false;
  hardcodedCanBeOverriddenByStaging: false;
  mismatchCanPromoteStaging: false;
  dryRunCanPromoteStaging: false;
  emptyResultCanOverrideHardcoded: false;
  staleResultCanOverrideHardcoded: false;
  errorResultCanOverrideHardcoded: false;
}

export interface ShadowRunnerDryRunApiResponsePayload {
  ok: true;
  apiContractVersion: "V50";
  responseSource: "mock_or_contract";
  sourceMode: "fixture";
  plannedEndpoint: "/api/portfolio/shadow-runner-dry-run";
  method: "GET";
  dryRunBundle: ShadowRunnerDryRunApiDryRunBundleShape;
  evidenceReport: ShadowRunnerDryRunEvidenceReportShape;
  safetyFlags: ShadowRunnerDryRunApiSafetyFlags;
  warnings: string[];
  nextRequiredActions: string[];
}

export interface ShadowRunnerDryRunApiPolicyRule {
  ruleId: string;
  description: string;
  blocksReleaseOnViolation: boolean;
}

export interface ShadowRunnerDryRunApiManualCheck {
  checkId: string;
  description: string;
  required: true;
}

export interface ShadowRunnerDryRunApiContractBundle {
  apiContractVersion: "V50";
  apiName: "Shadow Runner Dry-run API Contract";
  plannedEndpoint: "/api/portfolio/shadow-runner-dry-run";
  method: "GET";
  responseSource: "mock_or_contract";
  sourceMode: "fixture";
  generatedAt: string;
  decision: ShadowRunnerDryRunApiDecision;

  responsePayload: ShadowRunnerDryRunApiResponsePayload;
  policyRules: ShadowRunnerDryRunApiPolicyRule[];
  manualChecks: ShadowRunnerDryRunApiManualCheck[];

  // Frozen top-level safety flags.
  routeCreated: false;
  apiRouteCreated: false;
  routeImplemented: false;
  requestPerformed: false;
  envReadPerformed: false;
  supabaseConnected: false;
  stagingSupabaseConnected: false;
  productionSupabaseConnected: false;
  stagingReadPerformed: false;
  stagingWritePerformed: false;
  productionWritePerformed: false;
  databaseWritePerformed: false;
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
  promotionAllowed: false;
  portfolioApiSwitchAllowed: false;
  persisted: false;
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

export const SHADOW_RUNNER_DRY_RUN_API_CONTRACT_VERSION = "V50" as const;

export const SHADOW_RUNNER_DRY_RUN_API_PLANNED_ENDPOINT = "/api/portfolio/shadow-runner-dry-run" as const;

export const SHADOW_RUNNER_DRY_RUN_API_METHOD = "GET" as const;

export const SHADOW_RUNNER_DRY_RUN_API_ALLOWED_DECISIONS: readonly ShadowRunnerDryRunApiDecision[] = [
  "READY_FOR_REVIEW",
  "NO_GO",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every shadow runner dry-run API contract surface must
 * keep these negations intact.
 */
export const SHADOW_RUNNER_DRY_RUN_API_SAFETY_LABELS = [
  "Shadow Runner Dry-run API Contract",
  "shadow runner dry-run API contract",
  "planned endpoint is /api/portfolio/shadow-runner-dry-run",
  "not API route implementation",
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
  "responseSource must remain mock_or_contract",
  "sourceMode must remain fixture",
  "PORTFOLIO_SOURCE_MODE must remain hardcoded",
  "fixture/hardcoded must not be overridden by staging",
  "dry-run evidence must not be persisted to DB",
  "dry-run mismatch must not promote staging",
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
 * any shadow runner dry-run API contract surface.
 */
export const SHADOW_RUNNER_DRY_RUN_API_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
