/**
 * Staging Supabase Schema Mapping Spec Contract Builder — V46
 *
 * Pure builder. Returns a deterministic staging Supabase schema mapping spec
 * bundle (>= 30 items across 5 tables). Default decision is READY_FOR_REVIEW:
 * the mapping is defined but not yet manually verified, every column is
 * read-only planning (appWriteAllowed = false), and production Supabase is never
 * a mapping target.
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
  STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_SAFETY_LABELS,
  STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_TABLES,
} from "./staging-supabase-schema-mapping-spec-contract";
import type {
  StagingSupabaseSchemaMappingAppUsage,
  StagingSupabaseSchemaMappingDecision,
  StagingSupabaseSchemaMappingExpectedType,
  StagingSupabaseSchemaMappingFreshnessRequirement,
  StagingSupabaseSchemaMappingItem,
  StagingSupabaseSchemaMappingManualCheck,
  StagingSupabaseSchemaMappingPiiRisk,
  StagingSupabaseSchemaMappingPolicyRule,
  StagingSupabaseSchemaMappingSourceOfTruth,
  StagingSupabaseSchemaMappingSpecBundle,
  StagingSupabaseSchemaMappingTableName,
} from "./staging-supabase-schema-mapping-spec-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStagingSupabaseSchemaMappingSpecContractInput {
  generatedAt?: string;
}

interface ColumnDef {
  columnName: string;
  expectedType: StagingSupabaseSchemaMappingExpectedType;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  appUsage: StagingSupabaseSchemaMappingAppUsage;
  mappedFixtureFields: string[];
  mappedContractFields: string[];
  freshnessRequirement: StagingSupabaseSchemaMappingFreshnessRequirement;
  sourceOfTruth?: StagingSupabaseSchemaMappingSourceOfTruth;
  piiRisk?: StagingSupabaseSchemaMappingPiiRisk;
  notes?: string;
}

function toItem(
  tableName: StagingSupabaseSchemaMappingTableName,
  c: ColumnDef,
): StagingSupabaseSchemaMappingItem {
  const piiRisk: StagingSupabaseSchemaMappingPiiRisk = c.piiRisk ?? "none";
  // Columns still gated on authorization / manual review block release; so do
  // unknown types and any high PII risk.
  const blocksRelease =
    c.expectedType === "unknown" ||
    piiRisk === "high" ||
    c.freshnessRequirement === "fixture_only_until_authorized" ||
    c.freshnessRequirement === "manual_review_required";
  return {
    tableName,
    columnName: c.columnName,
    expectedType: c.expectedType,
    nullable: c.nullable,
    isPrimaryKey: c.isPrimaryKey ?? false,
    isForeignKey: c.isForeignKey ?? false,
    appReadAllowed: true,
    appWriteAllowed: false,
    appUsage: c.appUsage,
    mappedFixtureFields: c.mappedFixtureFields,
    mappedContractFields: c.mappedContractFields,
    freshnessRequirement: c.freshnessRequirement,
    sourceOfTruth: c.sourceOfTruth ?? "fixture_contract_mapping",
    piiRisk,
    verificationStatus: "NOT_REVIEWED",
    blocksRelease,
    notes: c.notes ?? "read-only planning only；app 不得寫入、不得依賴 service_role。",
  };
}

const ID: ColumnDef = {
  columnName: "id",
  expectedType: "uuid",
  nullable: false,
  isPrimaryKey: true,
  appUsage: "runtime_metadata",
  mappedFixtureFields: [],
  mappedContractFields: [],
  freshnessRequirement: "not_realtime",
  sourceOfTruth: "existing_supabase_schema_sql",
  notes: "primary key；runtime metadata；read-only。",
};

function createdAt(): ColumnDef {
  return {
    columnName: "created_at",
    expectedType: "timestamptz",
    nullable: false,
    appUsage: "audit_only",
    mappedFixtureFields: [],
    mappedContractFields: [],
    freshnessRequirement: "not_realtime",
    sourceOfTruth: "existing_supabase_schema_sql",
    notes: "audit only；read-only。",
  };
}

function updatedAt(): ColumnDef {
  return {
    columnName: "updated_at",
    expectedType: "timestamptz",
    nullable: false,
    appUsage: "audit_only",
    mappedFixtureFields: [],
    mappedContractFields: [],
    freshnessRequirement: "not_realtime",
    sourceOfTruth: "existing_supabase_schema_sql",
    notes: "audit only；read-only。",
  };
}

const PORTFOLIO_STOCKS: ColumnDef[] = [
  ID,
  { columnName: "symbol", expectedType: "text", nullable: false, appUsage: "portfolio_position", mappedFixtureFields: ["symbol"], mappedContractFields: ["holding.symbol"], freshnessRequirement: "not_realtime" },
  { columnName: "name", expectedType: "text", nullable: false, appUsage: "portfolio_position", mappedFixtureFields: ["name"], mappedContractFields: ["holding.name"], freshnessRequirement: "not_realtime" },
  { columnName: "quantity", expectedType: "numeric", nullable: false, appUsage: "portfolio_position", mappedFixtureFields: ["quantity"], mappedContractFields: ["holding.quantity"], freshnessRequirement: "manual_review_required" },
  { columnName: "avg_cost", expectedType: "numeric", nullable: false, appUsage: "portfolio_position", mappedFixtureFields: ["avgCost"], mappedContractFields: ["holding.avgCost"], freshnessRequirement: "manual_review_required" },
  { columnName: "latest_price", expectedType: "numeric", nullable: true, appUsage: "portfolio_position", mappedFixtureFields: ["latestPrice"], mappedContractFields: ["holding.latestPrice"], freshnessRequirement: "fixture_only_until_authorized" },
  { columnName: "market_value", expectedType: "numeric", nullable: true, appUsage: "portfolio_position", mappedFixtureFields: ["marketValue"], mappedContractFields: ["holding.marketValue"], freshnessRequirement: "fixture_only_until_authorized" },
  { columnName: "unrealized_pnl", expectedType: "numeric", nullable: true, appUsage: "portfolio_position", mappedFixtureFields: ["unrealizedPnl"], mappedContractFields: ["holding.unrealizedPnl"], freshnessRequirement: "fixture_only_until_authorized" },
  createdAt(),
  updatedAt(),
];

const WATCHLIST_STOCKS: ColumnDef[] = [
  ID,
  { columnName: "symbol", expectedType: "text", nullable: false, appUsage: "watchlist_item", mappedFixtureFields: ["symbol"], mappedContractFields: ["watchlist.symbol"], freshnessRequirement: "not_realtime" },
  { columnName: "name", expectedType: "text", nullable: false, appUsage: "watchlist_item", mappedFixtureFields: ["name"], mappedContractFields: ["watchlist.name"], freshnessRequirement: "not_realtime" },
  { columnName: "watch_reason", expectedType: "text", nullable: true, appUsage: "watchlist_item", mappedFixtureFields: ["watchReason"], mappedContractFields: ["watchlist.reason"], freshnessRequirement: "not_realtime" },
  { columnName: "priority", expectedType: "integer", nullable: true, appUsage: "watchlist_item", mappedFixtureFields: ["priority"], mappedContractFields: ["watchlist.priority"], freshnessRequirement: "not_realtime" },
  { columnName: "is_active", expectedType: "boolean", nullable: false, appUsage: "watchlist_item", mappedFixtureFields: ["isActive"], mappedContractFields: ["watchlist.isActive"], freshnessRequirement: "not_realtime" },
  createdAt(),
  updatedAt(),
];

const MARKET_SNAPSHOTS: ColumnDef[] = [
  ID,
  { columnName: "market_code", expectedType: "text", nullable: false, appUsage: "market_snapshot", mappedFixtureFields: ["marketCode"], mappedContractFields: ["market.code"], freshnessRequirement: "not_realtime" },
  { columnName: "market_name", expectedType: "text", nullable: false, appUsage: "market_snapshot", mappedFixtureFields: ["marketName"], mappedContractFields: ["market.name"], freshnessRequirement: "not_realtime" },
  { columnName: "index_price", expectedType: "numeric", nullable: true, appUsage: "market_snapshot", mappedFixtureFields: ["indexPrice"], mappedContractFields: ["market.indexPrice"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "change_percent", expectedType: "numeric", nullable: true, appUsage: "market_snapshot", mappedFixtureFields: ["changePercent"], mappedContractFields: ["market.changePercent"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "snapshot_at", expectedType: "timestamptz", nullable: true, appUsage: "market_snapshot", mappedFixtureFields: ["snapshotAt"], mappedContractFields: ["market.snapshotAt"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "source_label", expectedType: "text", nullable: true, appUsage: "audit_only", mappedFixtureFields: ["sourceLabel"], mappedContractFields: ["market.sourceLabel"], freshnessRequirement: "not_realtime" },
  createdAt(),
  updatedAt(),
];

const STOCK_SNAPSHOTS: ColumnDef[] = [
  ID,
  { columnName: "symbol", expectedType: "text", nullable: false, appUsage: "stock_snapshot", mappedFixtureFields: ["symbol"], mappedContractFields: ["stock.symbol"], freshnessRequirement: "not_realtime" },
  { columnName: "price", expectedType: "numeric", nullable: true, appUsage: "stock_snapshot", mappedFixtureFields: ["price"], mappedContractFields: ["stock.price"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "change_percent", expectedType: "numeric", nullable: true, appUsage: "stock_snapshot", mappedFixtureFields: ["changePercent"], mappedContractFields: ["stock.changePercent"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "volume", expectedType: "integer", nullable: true, appUsage: "stock_snapshot", mappedFixtureFields: ["volume"], mappedContractFields: ["stock.volume"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "snapshot_at", expectedType: "timestamptz", nullable: true, appUsage: "stock_snapshot", mappedFixtureFields: ["snapshotAt"], mappedContractFields: ["stock.snapshotAt"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "source_label", expectedType: "text", nullable: true, appUsage: "audit_only", mappedFixtureFields: ["sourceLabel"], mappedContractFields: ["stock.sourceLabel"], freshnessRequirement: "not_realtime" },
  createdAt(),
  updatedAt(),
];

const V85_SCORES: ColumnDef[] = [
  ID,
  { columnName: "symbol", expectedType: "text", nullable: false, appUsage: "scoring_snapshot", mappedFixtureFields: ["symbol"], mappedContractFields: ["score.symbol"], freshnessRequirement: "not_realtime" },
  { columnName: "score", expectedType: "numeric", nullable: true, appUsage: "scoring_snapshot", mappedFixtureFields: ["score"], mappedContractFields: ["score.total"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "grade", expectedType: "text", nullable: true, appUsage: "scoring_snapshot", mappedFixtureFields: ["grade"], mappedContractFields: ["score.grade"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "technical_score", expectedType: "numeric", nullable: true, appUsage: "scoring_snapshot", mappedFixtureFields: ["technicalScore"], mappedContractFields: ["score.technical"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "chip_score", expectedType: "numeric", nullable: true, appUsage: "scoring_snapshot", mappedFixtureFields: ["chipScore"], mappedContractFields: ["score.chip"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "risk_score", expectedType: "numeric", nullable: true, appUsage: "scoring_snapshot", mappedFixtureFields: ["riskScore"], mappedContractFields: ["score.risk"], freshnessRequirement: "latest_trading_day_required" },
  { columnName: "calculated_at", expectedType: "timestamptz", nullable: true, appUsage: "scoring_snapshot", mappedFixtureFields: ["calculatedAt"], mappedContractFields: ["score.calculatedAt"], freshnessRequirement: "latest_trading_day_required" },
  createdAt(),
  updatedAt(),
];

const TABLE_COLUMNS: Record<StagingSupabaseSchemaMappingTableName, ColumnDef[]> = {
  portfolio_stocks: PORTFOLIO_STOCKS,
  watchlist_stocks: WATCHLIST_STOCKS,
  market_snapshots: MARKET_SNAPSHOTS,
  stock_snapshots: STOCK_SNAPSHOTS,
  v85_scores: V85_SCORES,
};

/**
 * Builds a deterministic staging Supabase schema mapping spec bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildStagingSupabaseSchemaMappingSpecContract(
  input: BuildStagingSupabaseSchemaMappingSpecContractInput = {},
): StagingSupabaseSchemaMappingSpecBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const tables = [...STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_TABLES];

  const schemaMappingItems: StagingSupabaseSchemaMappingItem[] = [];
  for (const tableName of tables) {
    for (const col of TABLE_COLUMNS[tableName]) {
      schemaMappingItems.push(toItem(tableName, col));
    }
  }

  // Deterministic decision: any write-allowed column → NO_GO. Manual schema
  // verification not yet done → never GO / PRODUCTION_READY (READY_FOR_REVIEW).
  const anyWriteAllowed = schemaMappingItems.some((i) => i.appWriteAllowed as boolean);
  const decision: StagingSupabaseSchemaMappingDecision = anyWriteAllowed ? "NO_GO" : "READY_FOR_REVIEW";

  const policyRules: StagingSupabaseSchemaMappingPolicyRule[] = [
    { ruleId: "no-app-write", description: "所有 appWriteAllowed 必須 false（read-only planning）。", blocksReleaseOnViolation: true },
    { ruleId: "verification-not-reviewed", description: "所有 verificationStatus 預設 NOT_REVIEWED。", blocksReleaseOnViolation: true },
    { ruleId: "manual-verify-required", description: "若 stagingSchemaManuallyVerified = false，decision 不得是 GO 或 PRODUCTION_READY。", blocksReleaseOnViolation: true },
    { ruleId: "write-forces-no-go", description: "若任何 appWriteAllowed = true，decision 必須 NO_GO。", blocksReleaseOnViolation: true },
    { ruleId: "high-pii-blocks", description: "若任何 PII risk = high，blocksRelease 必須 true。", blocksReleaseOnViolation: true },
    { ruleId: "no-service-role", description: "app 不得依賴 service_role。", blocksReleaseOnViolation: true },
    { ruleId: "read-only-planning", description: "schema mapping 只能作為 read-only planning，不得建立 migration。", blocksReleaseOnViolation: true },
    { ruleId: "unknown-type-blocks", description: "若欄位型別是 unknown，blocksRelease 必須 true 或 notes 標示 manual review required。", blocksReleaseOnViolation: true },
    { ruleId: "freshness-required", description: "若欄位是價格、成交量、分數、時間戳，freshnessRequirement 不得空白。", blocksReleaseOnViolation: true },
    { ruleId: "contract-mapping-required", description: "若欄位用於持股、防守、風報比、戰情室分數，mappedContractFields 不得空陣列。", blocksReleaseOnViolation: true },
    { ruleId: "no-production-target", description: "production Supabase 不得出現在 mapping target。", blocksReleaseOnViolation: true },
    { ruleId: "no-api-switch", description: "/api/portfolio 不得切換到 staging Supabase。", blocksReleaseOnViolation: true },
  ];

  const manualChecks: StagingSupabaseSchemaMappingManualCheck[] = [
    { checkId: "review-column-types", description: "人工確認每個欄位 expectedType 與既有 schema.sql 一致。", required: true },
    { checkId: "review-read-only", description: "人工確認所有欄位 appWriteAllowed = false。", required: true },
    { checkId: "review-contract-mapping", description: "人工確認 app-used 欄位都有 mappedContractFields。", required: true },
    { checkId: "review-freshness", description: "人工確認 price / score / volume / timestamp 欄位 freshnessRequirement 正確。", required: true },
    { checkId: "review-no-production", description: "人工確認 mapping target 不含 production Supabase。", required: true },
  ];

  return {
    contractVersion: "V46",
    specName: "Staging Supabase Schema Mapping Spec",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    tables,
    schemaMappingItems,
    policyRules,
    manualChecks,

    stagingSupabasePlanned: true,
    stagingSupabaseConnected: false,
    stagingSchemaMappingDefined: true,
    stagingSchemaManuallyVerified: false,
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
    realMarketDataEnabled: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,

    futureGate: "V47 Staging Supabase Read-only Connection Review / V47 Staging Read-only Adapter Spec",
    safetyLabels: [...STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_SAFETY_LABELS],
  };
}
