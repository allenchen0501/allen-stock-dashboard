/**
 * Fixture vs Staging Shadow Comparison Spec Contract — V48
 *
 * Read-model TypeScript contract describing the FUTURE shadow comparison between
 * the existing fixture/hardcoded data and a (planned) staging read-only adapter
 * (field-level compare rules, tolerances, freshness, and fallback / downgrade /
 * kill-switch rules). This file contains TYPES + a few static safety CONSTANTS
 * ONLY. It declares no runtime, performs no fetch, imports no Supabase client,
 * reads no environment keys, calls Date.now on nothing, writes no data, and
 * connects to nothing.
 *
 * V48 is spec-only. It is NOT a staging Supabase implementation, NOT a real
 * Supabase client, NOT a connection review, and NOT a real shadow runner. The
 * comparison is never executed here. Fixture/hardcoded is the source of truth:
 * staging can NEVER override it; mismatch never auto-promotes staging; shadow
 * evidence is never persisted to a DB; the kill switch can always block the
 * shadow comparison; /api/portfolio is never switched; production Supabase is
 * never a comparison target.
 *
 * See: docs/fixture-vs-staging-shadow-comparison-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ShadowComparisonDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V48 can never decide a
// production go-live.
export type ShadowComparisonDecision =
  | "READY_FOR_REVIEW"
  | "NO_GO"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type ShadowComparisonTableName =
  | "portfolio_stocks"
  | "watchlist_stocks"
  | "market_snapshots"
  | "stock_snapshots"
  | "v85_scores";

export type ShadowComparisonFixtureSource =
  | "fixture"
  | "hardcoded"
  | "mock_or_contract";

export type ShadowComparisonStagingSource = "planned_staging_readonly_adapter";

export type ShadowComparisonMismatchBehavior =
  | "RECORD_ONLY"
  | "FLAG_FOR_MANUAL_REVIEW"
  | "DOWNGRADE_CONFIDENCE"
  | "BLOCK_PROMOTION";

export type ShadowComparisonEmptyFixtureBehavior =
  | "BLOCK_COMPARISON"
  | "RECORD_DATA_INSUFFICIENT";

export type ShadowComparisonEmptyStagingBehavior =
  | "DO_NOT_OVERRIDE_FIXTURE"
  | "RECORD_DATA_INSUFFICIENT"
  | "BLOCK_PROMOTION";

export type ShadowComparisonStaleStagingBehavior =
  | "DO_NOT_OVERRIDE_FIXTURE"
  | "DOWNGRADE_TO_STALE"
  | "RECORD_DATA_INSUFFICIENT"
  | "BLOCK_PROMOTION";

export type ShadowComparisonErrorStagingBehavior =
  | "DO_NOT_OVERRIDE_FIXTURE"
  | "FALLBACK_TO_FIXTURE"
  | "RECORD_DATA_INSUFFICIENT"
  | "BLOCK_PROMOTION";

export type ShadowComparisonPromotionBehavior =
  | "NEVER_PROMOTE_AUTOMATICALLY"
  | "MANUAL_SIGNOFF_REQUIRED";

export type ShadowComparisonPersistenceBehavior =
  | "NO_PERSISTENCE"
  | "EVIDENCE_ONLY_NO_DB_WRITE";

export type ShadowComparisonKillSwitchBehavior =
  | "BLOCK_SHADOW_COMPARISON"
  | "FORCE_FIXTURE_MODE";

export type ShadowComparisonSourceModeRequirement =
  | "PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED"
  | "STAGING_MODE_NOT_ENABLED"
  | "MANUAL_SIGNOFF_REQUIRED";

export type ShadowComparisonAppRouteImpact =
  | "NO_ROUTE_CHANGE"
  | "NO_API_SWITCH"
  | "INTERNAL_SPEC_ONLY";

export type ShadowComparisonVerificationStatus =
  | "NOT_REVIEWED"
  | "PASS"
  | "FAIL"
  | "BLOCKED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ShadowComparisonSpec {
  comparisonName: string;
  tableName: ShadowComparisonTableName;
  fixtureSource: ShadowComparisonFixtureSource;
  stagingSource: ShadowComparisonStagingSource;
  comparedFields: string[];
  numericTolerance: string;
  timestampTolerance: string;
  freshnessRequirement: string;
  mismatchBehavior: ShadowComparisonMismatchBehavior;
  emptyFixtureBehavior: ShadowComparisonEmptyFixtureBehavior;
  emptyStagingBehavior: ShadowComparisonEmptyStagingBehavior;
  staleStagingBehavior: ShadowComparisonStaleStagingBehavior;
  errorStagingBehavior: ShadowComparisonErrorStagingBehavior;
  promotionBehavior: ShadowComparisonPromotionBehavior;
  persistenceBehavior: ShadowComparisonPersistenceBehavior;
  killSwitchBehavior: ShadowComparisonKillSwitchBehavior;
  sourceModeRequirement: ShadowComparisonSourceModeRequirement;
  appRouteImpact: ShadowComparisonAppRouteImpact;
  verificationStatus: ShadowComparisonVerificationStatus;
  blocksRelease: boolean;
  notes: string;
}

export interface ShadowComparisonPolicyRule {
  ruleId: string;
  description: string;
  blocksReleaseOnViolation: boolean;
}

export interface ShadowComparisonManualCheck {
  checkId: string;
  description: string;
  required: true;
}

export interface ShadowComparisonSpecBundle {
  contractVersion: "V48";
  specName: "Fixture vs Staging Shadow Comparison Spec";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: ShadowComparisonDecision;

  comparisonSpecs: ShadowComparisonSpec[];
  policyRules: ShadowComparisonPolicyRule[];
  manualChecks: ShadowComparisonManualCheck[];

  // Frozen top-level safety flags.
  stagingSupabasePlanned: true;
  shadowComparisonSpecDefined: true;
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
  emptyResultCanOverrideHardcoded: false;
  staleResultCanOverrideHardcoded: false;
  errorResultCanOverrideHardcoded: false;

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_CONTRACT_VERSION = "V48" as const;

export const FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_DEPLOYMENT_TARGET = "staging" as const;

export const FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_TABLES: readonly ShadowComparisonTableName[] = [
  "portfolio_stocks",
  "watchlist_stocks",
  "market_snapshots",
  "stock_snapshots",
  "v85_scores",
] as const;

export const FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_ALLOWED_DECISIONS: readonly ShadowComparisonDecision[] = [
  "READY_FOR_REVIEW",
  "NO_GO",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every fixture-vs-staging shadow comparison spec
 * surface must keep these negations intact.
 */
export const FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_SAFETY_LABELS = [
  "Fixture vs Staging Shadow Comparison Spec",
  "fixture vs staging shadow comparison",
  "shadow comparison",
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
  "fixture/hardcoded must not be overridden by staging",
  "empty staging result must not override fixture/hardcoded",
  "stale staging result must not override fixture/hardcoded",
  "error staging result must not override fixture/hardcoded",
  "mismatch must not promote staging automatically",
  "shadow evidence must not be persisted to DB",
  "kill switch must be able to block shadow comparison",
  "fixture/mock UI 仍維持現狀",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any fixture-vs-staging shadow comparison spec surface.
 */
export const FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
