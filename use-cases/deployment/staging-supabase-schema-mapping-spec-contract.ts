/**
 * Staging Supabase Schema Mapping Spec Contract — V46
 *
 * Read-model TypeScript contract describing the schema mapping that the app
 * EXPECTS from a future staging Supabase (table x column -> type / nullability /
 * app usage / fixture+contract mapping / freshness / source-of-truth / PII).
 * This file contains TYPES + a few static safety CONSTANTS ONLY. It declares no
 * runtime, performs no fetch, imports no Supabase client, reads no environment
 * keys, calls Date.now on nothing, writes no data, and connects to nothing.
 *
 * V46 is spec-only. It is NOT a staging Supabase implementation, NOT a real SQL
 * migration, NOT real schema introspection, and NOT a production data go-live.
 * The staging Supabase connection is merely PLANNED; the mapping is DEFINED but
 * NOT yet manually verified. appWriteAllowed is always false (read-only
 * planning), production Supabase is never a mapping target, and /api/portfolio is
 * never switched.
 *
 * See: docs/staging-supabase-schema-mapping-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type StagingSupabaseSchemaMappingDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V46 can never decide a
// production go-live.
export type StagingSupabaseSchemaMappingDecision =
  | "READY_FOR_REVIEW"
  | "NO_GO"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type StagingSupabaseSchemaMappingTableName =
  | "portfolio_stocks"
  | "watchlist_stocks"
  | "market_snapshots"
  | "stock_snapshots"
  | "v85_scores";

export type StagingSupabaseSchemaMappingExpectedType =
  | "uuid"
  | "text"
  | "integer"
  | "numeric"
  | "boolean"
  | "timestamptz"
  | "date"
  | "jsonb"
  | "enum"
  | "unknown";

export type StagingSupabaseSchemaMappingAppUsage =
  | "portfolio_position"
  | "watchlist_item"
  | "market_snapshot"
  | "stock_snapshot"
  | "scoring_snapshot"
  | "runtime_metadata"
  | "audit_only"
  | "not_used_by_app";

export type StagingSupabaseSchemaMappingFreshnessRequirement =
  | "manual_review_required"
  | "latest_trading_day_required"
  | "intraday_optional"
  | "not_realtime"
  | "fixture_only_until_authorized";

export type StagingSupabaseSchemaMappingSourceOfTruth =
  | "staging_supabase_schema_spec"
  | "existing_supabase_schema_sql"
  | "fixture_contract_mapping"
  | "manual_review_required";

export type StagingSupabaseSchemaMappingPiiRisk = "none" | "low" | "medium" | "high";

export type StagingSupabaseSchemaMappingVerificationStatus =
  | "NOT_REVIEWED"
  | "PASS"
  | "FAIL"
  | "BLOCKED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StagingSupabaseSchemaMappingItem {
  tableName: StagingSupabaseSchemaMappingTableName;
  columnName: string;
  expectedType: StagingSupabaseSchemaMappingExpectedType;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  appReadAllowed: boolean;
  appWriteAllowed: false;
  appUsage: StagingSupabaseSchemaMappingAppUsage;
  mappedFixtureFields: string[];
  mappedContractFields: string[];
  freshnessRequirement: StagingSupabaseSchemaMappingFreshnessRequirement;
  sourceOfTruth: StagingSupabaseSchemaMappingSourceOfTruth;
  piiRisk: StagingSupabaseSchemaMappingPiiRisk;
  verificationStatus: StagingSupabaseSchemaMappingVerificationStatus;
  blocksRelease: boolean;
  notes: string;
}

export interface StagingSupabaseSchemaMappingPolicyRule {
  ruleId: string;
  description: string;
  blocksReleaseOnViolation: boolean;
}

export interface StagingSupabaseSchemaMappingManualCheck {
  checkId: string;
  description: string;
  required: true;
}

export interface StagingSupabaseSchemaMappingSpecBundle {
  contractVersion: "V46";
  specName: "Staging Supabase Schema Mapping Spec";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: StagingSupabaseSchemaMappingDecision;

  tables: StagingSupabaseSchemaMappingTableName[];
  schemaMappingItems: StagingSupabaseSchemaMappingItem[];
  policyRules: StagingSupabaseSchemaMappingPolicyRule[];
  manualChecks: StagingSupabaseSchemaMappingManualCheck[];

  // Frozen top-level safety flags.
  stagingSupabasePlanned: true;
  stagingSupabaseConnected: false;
  stagingSchemaMappingDefined: true;
  stagingSchemaManuallyVerified: false;
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
  realMarketDataEnabled: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_CONTRACT_VERSION = "V46" as const;

export const STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_DEPLOYMENT_TARGET = "staging" as const;

export const STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_TABLES: readonly StagingSupabaseSchemaMappingTableName[] = [
  "portfolio_stocks",
  "watchlist_stocks",
  "market_snapshots",
  "stock_snapshots",
  "v85_scores",
] as const;

export const STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_ALLOWED_DECISIONS: readonly StagingSupabaseSchemaMappingDecision[] = [
  "READY_FOR_REVIEW",
  "NO_GO",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every staging Supabase schema mapping spec surface
 * must keep these negations intact.
 */
export const STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_SAFETY_LABELS = [
  "Staging Supabase Schema Mapping Spec",
  "staging Supabase",
  "schema mapping",
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
  "fixture/mock UI 仍維持現狀",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any staging Supabase schema mapping spec surface.
 */
export const STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
