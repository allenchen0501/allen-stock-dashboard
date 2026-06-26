/**
 * Fixture vs Staging Shadow Comparison Spec Contract Builder — V48
 *
 * Pure builder. Returns a deterministic fixture-vs-staging shadow comparison
 * spec bundle (5 comparison specs covering 5 tables). Default decision is
 * READY_FOR_REVIEW: the comparison interface is defined but never executed,
 * fixture/hardcoded is the source of truth, staging can never override it,
 * mismatch never auto-promotes staging, and shadow evidence is never persisted.
 *
 * This is NOT a runtime and connects to NOTHING. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import / no client creation
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes (no staging write, no production write, no DB persistence)
 *   - No buy/sell commands; no auto orders
 */

import {
  FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_SAFETY_LABELS,
} from "./fixture-vs-staging-shadow-comparison-spec-contract";
import type {
  ShadowComparisonDecision,
  ShadowComparisonManualCheck,
  ShadowComparisonPolicyRule,
  ShadowComparisonSpec,
  ShadowComparisonSpecBundle,
  ShadowComparisonTableName,
} from "./fixture-vs-staging-shadow-comparison-spec-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildFixtureVsStagingShadowComparisonSpecContractInput {
  generatedAt?: string;
}

interface ComparisonDef {
  comparisonName: string;
  tableName: ShadowComparisonTableName;
  comparedFields: string[];
  numericTolerance: string;
  timestampTolerance: string;
  freshnessRequirement: string;
}

const COMPARISON_DEFS: ComparisonDef[] = [
  {
    comparisonName: "comparePortfolioStocksFixtureVsStaging",
    tableName: "portfolio_stocks",
    comparedFields: ["symbol", "name", "quantity", "avg_cost", "latest_price", "market_value", "unrealized_pnl"],
    numericTolerance: "abs<=0.01 or rel<=0.001",
    timestampTolerance: "not_applicable",
    freshnessRequirement: "manual_review_required",
  },
  {
    comparisonName: "compareWatchlistStocksFixtureVsStaging",
    tableName: "watchlist_stocks",
    comparedFields: ["symbol", "name", "watch_reason", "priority", "is_active"],
    numericTolerance: "exact_match",
    timestampTolerance: "not_applicable",
    freshnessRequirement: "not_realtime",
  },
  {
    comparisonName: "compareMarketSnapshotsFixtureVsStaging",
    tableName: "market_snapshots",
    comparedFields: ["market_code", "market_name", "index_price", "change_percent", "snapshot_at", "source_label"],
    numericTolerance: "abs<=0.05 or rel<=0.001",
    timestampTolerance: "<=300s",
    freshnessRequirement: "latest_trading_day_required",
  },
  {
    comparisonName: "compareStockSnapshotsFixtureVsStaging",
    tableName: "stock_snapshots",
    comparedFields: ["symbol", "price", "change_percent", "volume", "snapshot_at", "source_label"],
    numericTolerance: "abs<=0.05 or rel<=0.001",
    timestampTolerance: "<=300s",
    freshnessRequirement: "latest_trading_day_required",
  },
  {
    comparisonName: "compareV85ScoresFixtureVsStaging",
    tableName: "v85_scores",
    comparedFields: ["symbol", "score", "grade", "technical_score", "chip_score", "risk_score", "calculated_at"],
    numericTolerance: "abs<=0.5",
    timestampTolerance: "<=86400s",
    freshnessRequirement: "latest_trading_day_required",
  },
];

function toComparisonSpec(d: ComparisonDef): ShadowComparisonSpec {
  return {
    comparisonName: d.comparisonName,
    tableName: d.tableName,
    fixtureSource: "fixture",
    stagingSource: "planned_staging_readonly_adapter",
    comparedFields: d.comparedFields,
    numericTolerance: d.numericTolerance,
    timestampTolerance: d.timestampTolerance,
    freshnessRequirement: d.freshnessRequirement,
    mismatchBehavior: "FLAG_FOR_MANUAL_REVIEW",
    emptyFixtureBehavior: "RECORD_DATA_INSUFFICIENT",
    emptyStagingBehavior: "DO_NOT_OVERRIDE_FIXTURE",
    staleStagingBehavior: "DO_NOT_OVERRIDE_FIXTURE",
    errorStagingBehavior: "FALLBACK_TO_FIXTURE",
    promotionBehavior: "NEVER_PROMOTE_AUTOMATICALLY",
    persistenceBehavior: "NO_PERSISTENCE",
    killSwitchBehavior: "BLOCK_SHADOW_COMPARISON",
    sourceModeRequirement: "PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED",
    appRouteImpact: "INTERNAL_SPEC_ONLY",
    verificationStatus: "NOT_REVIEWED",
    blocksRelease: true,
    notes:
      "shadow compare only；fixture/hardcoded 為真實來源，staging 不得覆蓋；mismatch 不得自動 promote；不寫 DB；kill switch 可阻斷。",
  };
}

/**
 * Builds a deterministic fixture-vs-staging shadow comparison spec bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildFixtureVsStagingShadowComparisonSpecContract(
  input: BuildFixtureVsStagingShadowComparisonSpecContractInput = {},
): ShadowComparisonSpecBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const comparisonSpecs: ShadowComparisonSpec[] = COMPARISON_DEFS.map(toComparisonSpec);

  // Deterministic decision: any spec whose behavior could let staging override
  // fixture/hardcoded, auto-promote, or persist → NO_GO. Connection not done +
  // not reviewed → never GO / PRODUCTION_READY (READY_FOR_REVIEW).
  const anyUnsafe = comparisonSpecs.some((s) => {
    const emptyOk =
      s.emptyStagingBehavior === "DO_NOT_OVERRIDE_FIXTURE" ||
      s.emptyStagingBehavior === "RECORD_DATA_INSUFFICIENT" ||
      s.emptyStagingBehavior === "BLOCK_PROMOTION";
    const staleOk =
      s.staleStagingBehavior === "DO_NOT_OVERRIDE_FIXTURE" ||
      s.staleStagingBehavior === "DOWNGRADE_TO_STALE" ||
      s.staleStagingBehavior === "RECORD_DATA_INSUFFICIENT" ||
      s.staleStagingBehavior === "BLOCK_PROMOTION";
    const errorOk =
      s.errorStagingBehavior === "DO_NOT_OVERRIDE_FIXTURE" ||
      s.errorStagingBehavior === "FALLBACK_TO_FIXTURE" ||
      s.errorStagingBehavior === "RECORD_DATA_INSUFFICIENT" ||
      s.errorStagingBehavior === "BLOCK_PROMOTION";
    const promoteOk = s.promotionBehavior === "NEVER_PROMOTE_AUTOMATICALLY" || s.promotionBehavior === "MANUAL_SIGNOFF_REQUIRED";
    const persistOk = s.persistenceBehavior === "NO_PERSISTENCE" || s.persistenceBehavior === "EVIDENCE_ONLY_NO_DB_WRITE";
    const stagingSourceOk = s.stagingSource === "planned_staging_readonly_adapter";
    return !(emptyOk && staleOk && errorOk && promoteOk && persistOk && stagingSourceOk);
  });
  const decision: ShadowComparisonDecision = anyUnsafe ? "NO_GO" : "READY_FOR_REVIEW";

  const policyRules: ShadowComparisonPolicyRule[] = [
    { ruleId: "compared-fields-required", description: "comparedFields 對每個 comparison 不得為空。", blocksReleaseOnViolation: true },
    { ruleId: "numeric-tolerance-required", description: "numericTolerance 必須明確定義，不能空白。", blocksReleaseOnViolation: true },
    { ruleId: "timestamp-tolerance-required", description: "timestampTolerance 必須明確定義，不能空白。", blocksReleaseOnViolation: true },
    { ruleId: "fixture-source-class", description: "fixtureSource 必須是 fixture / hardcoded / mock_or_contract 類來源。", blocksReleaseOnViolation: true },
    { ruleId: "staging-source-planned", description: "stagingSource 只能是 planned_staging_readonly_adapter，不得是 production。", blocksReleaseOnViolation: true },
    { ruleId: "mismatch-no-auto-promote", description: "mismatch 只能 record / flag / downgrade / block promotion，不得自動提升 staging。", blocksReleaseOnViolation: true },
    { ruleId: "empty-no-override", description: "empty staging 不得覆蓋 fixture / hardcoded。", blocksReleaseOnViolation: true },
    { ruleId: "stale-no-override", description: "stale staging 不得覆蓋 fixture / hardcoded。", blocksReleaseOnViolation: true },
    { ruleId: "error-no-override", description: "error staging 不得覆蓋 fixture / hardcoded。", blocksReleaseOnViolation: true },
    { ruleId: "never-auto-promote", description: "promotionBehavior 不得自動 promote staging。", blocksReleaseOnViolation: true },
    { ruleId: "no-db-write", description: "persistenceBehavior 不得寫 DB。", blocksReleaseOnViolation: true },
    { ruleId: "kill-switch-default", description: "kill switch 預設必須能阻斷 shadow comparison。", blocksReleaseOnViolation: true },
    { ruleId: "source-mode-hardcoded", description: "sourceModeRequirement 必須要求 PORTFOLIO_SOURCE_MODE 維持 hardcoded 或 staging mode not enabled。", blocksReleaseOnViolation: true },
    { ruleId: "no-route-change", description: "appRouteImpact 必須 NO_ROUTE_CHANGE / NO_API_SWITCH / INTERNAL_SPEC_ONLY。", blocksReleaseOnViolation: true },
    { ruleId: "no-api-switch", description: "/api/portfolio 不得切換到 staging shadow result。", blocksReleaseOnViolation: true },
    { ruleId: "no-production-target", description: "production Supabase 不得出現在 comparison target。", blocksReleaseOnViolation: true },
    { ruleId: "no-service-role", description: "service_role 不得被 app runtime 使用。", blocksReleaseOnViolation: true },
    { ruleId: "spec-only", description: "comparison spec 只能描述未來 shadow comparison，不得建立實際 runner。", blocksReleaseOnViolation: true },
  ];

  const manualChecks: ShadowComparisonManualCheck[] = [
    { checkId: "review-no-override", description: "人工確認 fixture/hardcoded 不被 staging 覆蓋（empty / stale / error 全降級）。", required: true },
    { checkId: "review-no-auto-promote", description: "人工確認 mismatch 不自動 promote staging。", required: true },
    { checkId: "review-no-db-write", description: "人工確認 shadow evidence 不寫 DB。", required: true },
    { checkId: "review-source-mode", description: "人工確認 PORTFOLIO_SOURCE_MODE 維持 hardcoded。", required: true },
    { checkId: "review-kill-switch", description: "人工確認 kill switch 可阻斷 shadow comparison。", required: true },
  ];

  return {
    contractVersion: "V48",
    specName: "Fixture vs Staging Shadow Comparison Spec",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    comparisonSpecs,
    policyRules,
    manualChecks,

    stagingSupabasePlanned: true,
    shadowComparisonSpecDefined: true,
    stagingSupabaseConnected: false,
    stagingReadPerformed: false,
    stagingWritePerformed: false,
    shadowComparisonPerformed: false,
    shadowResultPersisted: false,
    productionSupabaseConnected: false,
    productionWritePerformed: false,
    databaseWritePerformed: false,
    requestPerformed: false,
    envReadPerformed: false,
    apiRouteCreated: false,
    uiCreated: false,
    runtimeCreated: false,
    sqlMigrationCreated: false,
    portfolioApiSwitched: false,
    portfolioSourceModeChanged: false,
    realMarketDataEnabled: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    killSwitchDefaultEnabled: true,
    fixtureCanBeOverriddenByStaging: false,
    hardcodedCanBeOverriddenByStaging: false,
    mismatchCanPromoteStaging: false,
    emptyResultCanOverrideHardcoded: false,
    staleResultCanOverrideHardcoded: false,
    errorResultCanOverrideHardcoded: false,

    futureGate: "V49 Staging Read-only Connection Review / V49 Shadow Runner Dry-run Spec",
    safetyLabels: [...FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_SAFETY_LABELS],
  };
}
