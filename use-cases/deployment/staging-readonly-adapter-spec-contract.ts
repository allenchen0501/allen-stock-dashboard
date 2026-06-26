/**
 * Staging Read-only Adapter Spec Contract — V47
 *
 * Read-model TypeScript contract describing the FUTURE staging read-only adapter
 * interface (method shapes, output mapping back to existing fixture/contract
 * fields, and fallback / downgrade / kill-switch rules). This file contains
 * TYPES + a few static safety CONSTANTS ONLY. It declares no runtime, performs
 * no fetch, imports no Supabase client, reads no environment keys, calls Date.now
 * on nothing, writes no data, and connects to nothing.
 *
 * V47 is spec-only. It is NOT a staging Supabase implementation, NOT a real
 * Supabase client, NOT a connection review, and NOT a production data go-live.
 * The staging Supabase connection is merely PLANNED. Every adapter method is
 * select_only / read-only, PORTFOLIO_SOURCE_MODE must remain hardcoded, empty /
 * stale / error results must never override hardcoded, the kill switch can always
 * block the staging adapter, /api/portfolio is never switched, and production
 * Supabase is never an adapter target.
 *
 * See: docs/staging-readonly-adapter-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type StagingReadonlyAdapterDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V47 can never decide a
// production go-live.
export type StagingReadonlyAdapterDecision =
  | "READY_FOR_REVIEW"
  | "NO_GO"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type StagingReadonlyAdapterTableName =
  | "portfolio_stocks"
  | "watchlist_stocks"
  | "market_snapshots"
  | "stock_snapshots"
  | "v85_scores";

export type StagingReadonlyAdapterAllowedOperation = "select_only";

export type StagingReadonlyAdapterFallbackBehavior =
  | "FALLBACK_TO_HARDCODED"
  | "FALLBACK_TO_FIXTURE_CONTRACT"
  | "RETURN_DATA_INSUFFICIENT";

export type StagingReadonlyAdapterEmptyResultBehavior =
  | "DO_NOT_OVERRIDE_HARDCODED"
  | "RETURN_DATA_INSUFFICIENT";

export type StagingReadonlyAdapterStaleResultBehavior =
  | "DOWNGRADE_TO_STALE"
  | "DO_NOT_OVERRIDE_HARDCODED"
  | "RETURN_DATA_INSUFFICIENT";

export type StagingReadonlyAdapterErrorResultBehavior =
  | "FALLBACK_TO_HARDCODED"
  | "RETURN_DATA_INSUFFICIENT"
  | "BLOCK_ADAPTER";

export type StagingReadonlyAdapterKillSwitchBehavior =
  | "BLOCK_STAGING_ADAPTER"
  | "FORCE_HARDCODED_MODE";

export type StagingReadonlyAdapterSourceModeRequirement =
  | "PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED"
  | "STAGING_MODE_NOT_ENABLED"
  | "MANUAL_SIGNOFF_REQUIRED";

export type StagingReadonlyAdapterAppRouteImpact =
  | "NO_ROUTE_CHANGE"
  | "NO_API_SWITCH"
  | "INTERNAL_SPEC_ONLY";

export type StagingReadonlyAdapterVerificationStatus =
  | "NOT_REVIEWED"
  | "PASS"
  | "FAIL"
  | "BLOCKED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StagingReadonlyAdapterMethodSpec {
  methodName: string;
  tableName: StagingReadonlyAdapterTableName;
  readOnly: true;
  allowedOperation: StagingReadonlyAdapterAllowedOperation;
  inputShape: string;
  outputShape: string;
  mappedContractFields: string[];
  fallbackBehavior: StagingReadonlyAdapterFallbackBehavior;
  emptyResultBehavior: StagingReadonlyAdapterEmptyResultBehavior;
  staleResultBehavior: StagingReadonlyAdapterStaleResultBehavior;
  errorResultBehavior: StagingReadonlyAdapterErrorResultBehavior;
  killSwitchBehavior: StagingReadonlyAdapterKillSwitchBehavior;
  sourceModeRequirement: StagingReadonlyAdapterSourceModeRequirement;
  appRouteImpact: StagingReadonlyAdapterAppRouteImpact;
  verificationStatus: StagingReadonlyAdapterVerificationStatus;
  blocksRelease: boolean;
  notes: string;
}

export interface StagingReadonlyAdapterPolicyRule {
  ruleId: string;
  description: string;
  blocksReleaseOnViolation: boolean;
}

export interface StagingReadonlyAdapterManualCheck {
  checkId: string;
  description: string;
  required: true;
}

export interface StagingReadonlyAdapterSpecBundle {
  contractVersion: "V47";
  specName: "Staging Read-only Adapter Spec";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: StagingReadonlyAdapterDecision;

  adapterMethodSpecs: StagingReadonlyAdapterMethodSpec[];
  policyRules: StagingReadonlyAdapterPolicyRule[];
  manualChecks: StagingReadonlyAdapterManualCheck[];

  // Frozen top-level safety flags.
  stagingSupabasePlanned: true;
  stagingAdapterSpecDefined: true;
  stagingSupabaseConnected: false;
  stagingReadPerformed: false;
  stagingWritePerformed: false;
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
  emptyResultCanOverrideHardcoded: false;
  staleResultCanOverrideHardcoded: false;
  errorResultCanOverrideHardcoded: false;

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const STAGING_READONLY_ADAPTER_SPEC_CONTRACT_VERSION = "V47" as const;

export const STAGING_READONLY_ADAPTER_SPEC_DEPLOYMENT_TARGET = "staging" as const;

export const STAGING_READONLY_ADAPTER_SPEC_TABLES: readonly StagingReadonlyAdapterTableName[] = [
  "portfolio_stocks",
  "watchlist_stocks",
  "market_snapshots",
  "stock_snapshots",
  "v85_scores",
] as const;

export const STAGING_READONLY_ADAPTER_SPEC_ALLOWED_DECISIONS: readonly StagingReadonlyAdapterDecision[] = [
  "READY_FOR_REVIEW",
  "NO_GO",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every staging read-only adapter spec surface must keep
 * these negations intact.
 */
export const STAGING_READONLY_ADAPTER_SPEC_SAFETY_LABELS = [
  "Staging Read-only Adapter Spec",
  "staging read-only adapter",
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
  "empty result must not override hardcoded",
  "stale result must not override hardcoded",
  "error result must not override hardcoded",
  "kill switch must be able to block staging adapter",
  "fixture/mock UI 仍維持現狀",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any staging read-only adapter spec surface.
 */
export const STAGING_READONLY_ADAPTER_SPEC_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
