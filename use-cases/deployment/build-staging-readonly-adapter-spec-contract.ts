/**
 * Staging Read-only Adapter Spec Contract Builder — V47
 *
 * Pure builder. Returns a deterministic staging read-only adapter spec bundle
 * (5 method specs covering 5 tables). Default decision is READY_FOR_REVIEW: the
 * adapter interface is defined but not yet reviewed/connected, every method is
 * select_only / read-only, and empty / stale / error results never override
 * hardcoded.
 *
 * This is NOT a runtime and connects to NOTHING. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import / no client creation
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes (no staging write, no production write)
 *   - No buy/sell commands; no auto orders
 */

import {
  STAGING_READONLY_ADAPTER_SPEC_SAFETY_LABELS,
} from "./staging-readonly-adapter-spec-contract";
import type {
  StagingReadonlyAdapterDecision,
  StagingReadonlyAdapterManualCheck,
  StagingReadonlyAdapterMethodSpec,
  StagingReadonlyAdapterPolicyRule,
  StagingReadonlyAdapterSpecBundle,
  StagingReadonlyAdapterTableName,
} from "./staging-readonly-adapter-spec-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStagingReadonlyAdapterSpecContractInput {
  generatedAt?: string;
}

interface MethodDef {
  methodName: string;
  tableName: StagingReadonlyAdapterTableName;
  inputShape: string;
  outputShape: string;
  mappedContractFields: string[];
}

const METHOD_DEFS: MethodDef[] = [
  {
    methodName: "getPortfolioStocksReadOnly",
    tableName: "portfolio_stocks",
    inputShape: "{ }",
    outputShape: "ReadonlyArray<PortfolioStockReadModel>",
    mappedContractFields: ["symbol", "name", "quantity", "avg_cost", "latest_price", "market_value", "unrealized_pnl"],
  },
  {
    methodName: "getWatchlistStocksReadOnly",
    tableName: "watchlist_stocks",
    inputShape: "{ }",
    outputShape: "ReadonlyArray<WatchlistStockReadModel>",
    mappedContractFields: ["symbol", "name", "watch_reason", "priority", "is_active"],
  },
  {
    methodName: "getMarketSnapshotsReadOnly",
    tableName: "market_snapshots",
    inputShape: "{ marketCode?: string }",
    outputShape: "ReadonlyArray<MarketSnapshotReadModel>",
    mappedContractFields: ["market_code", "market_name", "index_price", "change_percent", "snapshot_at", "source_label"],
  },
  {
    methodName: "getStockSnapshotsReadOnly",
    tableName: "stock_snapshots",
    inputShape: "{ symbol?: string }",
    outputShape: "ReadonlyArray<StockSnapshotReadModel>",
    mappedContractFields: ["symbol", "price", "change_percent", "volume", "snapshot_at", "source_label"],
  },
  {
    methodName: "getV85ScoresReadOnly",
    tableName: "v85_scores",
    inputShape: "{ symbol?: string }",
    outputShape: "ReadonlyArray<V85ScoreReadModel>",
    mappedContractFields: ["symbol", "score", "grade", "technical_score", "chip_score", "risk_score", "calculated_at"],
  },
];

function toMethodSpec(d: MethodDef): StagingReadonlyAdapterMethodSpec {
  return {
    methodName: d.methodName,
    tableName: d.tableName,
    readOnly: true,
    allowedOperation: "select_only",
    inputShape: d.inputShape,
    outputShape: d.outputShape,
    mappedContractFields: d.mappedContractFields,
    fallbackBehavior: "FALLBACK_TO_HARDCODED",
    emptyResultBehavior: "DO_NOT_OVERRIDE_HARDCODED",
    staleResultBehavior: "DO_NOT_OVERRIDE_HARDCODED",
    errorResultBehavior: "FALLBACK_TO_HARDCODED",
    killSwitchBehavior: "BLOCK_STAGING_ADAPTER",
    sourceModeRequirement: "PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED",
    appRouteImpact: "INTERNAL_SPEC_ONLY",
    verificationStatus: "NOT_REVIEWED",
    blocksRelease: true,
    notes:
      "read-only select_only；empty / stale / error 不得覆蓋 hardcoded；kill switch 可阻斷 staging adapter；不建立實際 client。",
  };
}

/**
 * Builds a deterministic staging read-only adapter spec bundle. All timestamps
 * come from `input.generatedAt` (or a fixed fallback string); no clock is read.
 */
export function buildStagingReadonlyAdapterSpecContract(
  input: BuildStagingReadonlyAdapterSpecContractInput = {},
): StagingReadonlyAdapterSpecBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const adapterMethodSpecs: StagingReadonlyAdapterMethodSpec[] = METHOD_DEFS.map(toMethodSpec);

  // Deterministic decision: any method that is not read-only / select_only, or
  // any behavior that could override hardcoded → NO_GO. Connection not done +
  // not reviewed → never GO / PRODUCTION_READY (READY_FOR_REVIEW).
  const anyNotReadOnly = adapterMethodSpecs.some(
    (m) => (m.readOnly as boolean) !== true || m.allowedOperation !== "select_only",
  );
  // empty / stale must not override hardcoded; error must fall back or block.
  const anyOverridesHardcoded = adapterMethodSpecs.some((m) => {
    const emptyOk =
      m.emptyResultBehavior === "DO_NOT_OVERRIDE_HARDCODED" ||
      m.emptyResultBehavior === "RETURN_DATA_INSUFFICIENT";
    const staleOk =
      m.staleResultBehavior === "DOWNGRADE_TO_STALE" ||
      m.staleResultBehavior === "DO_NOT_OVERRIDE_HARDCODED" ||
      m.staleResultBehavior === "RETURN_DATA_INSUFFICIENT";
    const errorOk =
      m.errorResultBehavior === "FALLBACK_TO_HARDCODED" ||
      m.errorResultBehavior === "RETURN_DATA_INSUFFICIENT" ||
      m.errorResultBehavior === "BLOCK_ADAPTER";
    return !(emptyOk && staleOk && errorOk);
  });
  const decision: StagingReadonlyAdapterDecision =
    anyNotReadOnly || anyOverridesHardcoded ? "NO_GO" : "READY_FOR_REVIEW";

  const policyRules: StagingReadonlyAdapterPolicyRule[] = [
    { ruleId: "read-only-all", description: "readOnly 必須全部 true。", blocksReleaseOnViolation: true },
    { ruleId: "select-only-all", description: "allowedOperation 必須全部 select_only。", blocksReleaseOnViolation: true },
    { ruleId: "source-mode-hardcoded", description: "sourceModeRequirement 必須要求 PORTFOLIO_SOURCE_MODE 維持 hardcoded 或 staging mode not enabled。", blocksReleaseOnViolation: true },
    { ruleId: "no-route-change", description: "appRouteImpact 必須全部 NO_ROUTE_CHANGE / NO_API_SWITCH / INTERNAL_SPEC_ONLY。", blocksReleaseOnViolation: true },
    { ruleId: "empty-no-override", description: "empty result 不得覆蓋 hardcoded。", blocksReleaseOnViolation: true },
    { ruleId: "stale-no-override", description: "stale result 不得覆蓋 hardcoded。", blocksReleaseOnViolation: true },
    { ruleId: "error-no-override", description: "error result 不得覆蓋 hardcoded，必須 fallback 或 block。", blocksReleaseOnViolation: true },
    { ruleId: "kill-switch-default", description: "kill switch 預設必須能阻斷 staging adapter。", blocksReleaseOnViolation: true },
    { ruleId: "contract-mapping-required", description: "mappedContractFields 對 app-used method 不得為空。", blocksReleaseOnViolation: true },
    { ruleId: "write-forces-no-go", description: "若任何 method readOnly = false 或 allowedOperation 不是 select_only，decision 必須 NO_GO。", blocksReleaseOnViolation: true },
    { ruleId: "override-forces-no-go", description: "若任何 fallback/empty/stale/error 行為允許覆蓋 hardcoded，decision 必須 NO_GO。", blocksReleaseOnViolation: true },
    { ruleId: "no-api-switch", description: "/api/portfolio 不得切換到 staging adapter。", blocksReleaseOnViolation: true },
    { ruleId: "no-production-target", description: "production Supabase 不得出現在 adapter target。", blocksReleaseOnViolation: true },
    { ruleId: "no-service-role", description: "service_role 不得被 app runtime 使用。", blocksReleaseOnViolation: true },
    { ruleId: "spec-only", description: "adapter spec 只能描述未來 read-only interface，不得建立實際 client。", blocksReleaseOnViolation: true },
  ];

  const manualChecks: StagingReadonlyAdapterManualCheck[] = [
    { checkId: "review-read-only", description: "人工確認所有 method readOnly = true、allowedOperation = select_only。", required: true },
    { checkId: "review-no-override", description: "人工確認 empty / stale / error 不覆蓋 hardcoded。", required: true },
    { checkId: "review-source-mode", description: "人工確認 PORTFOLIO_SOURCE_MODE 維持 hardcoded。", required: true },
    { checkId: "review-kill-switch", description: "人工確認 kill switch 可阻斷 staging adapter。", required: true },
    { checkId: "review-no-api-switch", description: "人工確認 /api/portfolio 不切換、不指向 production。", required: true },
  ];

  return {
    contractVersion: "V47",
    specName: "Staging Read-only Adapter Spec",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    adapterMethodSpecs,
    policyRules,
    manualChecks,

    stagingSupabasePlanned: true,
    stagingAdapterSpecDefined: true,
    stagingSupabaseConnected: false,
    stagingReadPerformed: false,
    stagingWritePerformed: false,
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
    emptyResultCanOverrideHardcoded: false,
    staleResultCanOverrideHardcoded: false,
    errorResultCanOverrideHardcoded: false,

    futureGate: "V48 Staging Read-only Connection Review / V48 Fixture vs Staging Shadow Comparison Spec",
    safetyLabels: [...STAGING_READONLY_ADAPTER_SPEC_SAFETY_LABELS],
  };
}
