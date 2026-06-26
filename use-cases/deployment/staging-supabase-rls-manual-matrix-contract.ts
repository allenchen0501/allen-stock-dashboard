/**
 * Staging Supabase RLS Manual Matrix Contract — V45
 *
 * Read-model TypeScript contract describing the MANUAL RLS verification matrix
 * that must be reviewed before any future staging Supabase read-only connection.
 * This file contains TYPES + a few static safety CONSTANTS ONLY. It declares no
 * runtime, performs no fetch, imports no Supabase client, reads no environment
 * keys, calls Date.now on nothing, writes no data, and connects to nothing.
 *
 * V45 is spec-only. It is NOT a staging Supabase implementation, NOT a real RLS
 * policy migration, and NOT a production data go-live. It only defines the
 * expected RLS access matrix (table x role x operation) that a human must
 * manually verify. The staging Supabase connection is merely PLANNED; the matrix
 * is DEFINED but NOT yet manually verified.
 *
 * See: docs/staging-supabase-rls-manual-matrix.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type StagingSupabaseRlsDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V45 can never decide a
// production go-live.
export type StagingSupabaseRlsDecision =
  | "READY_FOR_REVIEW"
  | "NO_GO"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type StagingSupabaseRlsTableName =
  | "portfolio_stocks"
  | "watchlist_stocks"
  | "market_snapshots"
  | "stock_snapshots"
  | "v85_scores";

export type StagingSupabaseRlsRole =
  | "anon"
  | "authenticated"
  | "service_role"
  | "dashboard_readonly_app";

export type StagingSupabaseRlsOperation = "select" | "insert" | "update" | "delete";

export type StagingSupabaseRlsExpectedAccess =
  | "ALLOW_READ_ONLY"
  | "DENY"
  | "SERVICE_ROLE_ONLY"
  | "NOT_ALLOWED_IN_APP_RUNTIME";

export type StagingSupabaseRlsActualAccess = "NOT_TESTED";

export type StagingSupabaseRlsVerificationStatus =
  | "NOT_REVIEWED"
  | "PASS"
  | "FAIL"
  | "BLOCKED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StagingSupabaseRlsMatrixItem {
  tableName: StagingSupabaseRlsTableName;
  role: StagingSupabaseRlsRole;
  operation: StagingSupabaseRlsOperation;
  expectedAccess: StagingSupabaseRlsExpectedAccess;
  actualAccess: StagingSupabaseRlsActualAccess;
  verificationStatus: StagingSupabaseRlsVerificationStatus;
  blocksRelease: boolean;
  notes: string;
}

export interface StagingSupabaseRlsPolicyRule {
  ruleId: string;
  description: string;
  blocksReleaseOnViolation: boolean;
}

export interface StagingSupabaseRlsManualCheck {
  checkId: string;
  description: string;
  required: true;
}

export interface StagingSupabaseRlsManualMatrixBundle {
  contractVersion: "V45";
  matrixName: "Staging Supabase RLS Manual Matrix";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: StagingSupabaseRlsDecision;

  tables: StagingSupabaseRlsTableName[];
  roles: StagingSupabaseRlsRole[];
  operations: StagingSupabaseRlsOperation[];
  matrixItems: StagingSupabaseRlsMatrixItem[];
  policyRules: StagingSupabaseRlsPolicyRule[];
  manualChecks: StagingSupabaseRlsManualCheck[];

  // Frozen top-level safety flags.
  stagingSupabasePlanned: true;
  stagingSupabaseConnected: false;
  stagingRlsMatrixDefined: true;
  stagingRlsManuallyVerified: false;
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

export const STAGING_SUPABASE_RLS_MANUAL_MATRIX_CONTRACT_VERSION = "V45" as const;

export const STAGING_SUPABASE_RLS_MANUAL_MATRIX_DEPLOYMENT_TARGET = "staging" as const;

export const STAGING_SUPABASE_RLS_MANUAL_MATRIX_TABLES: readonly StagingSupabaseRlsTableName[] = [
  "portfolio_stocks",
  "watchlist_stocks",
  "market_snapshots",
  "stock_snapshots",
  "v85_scores",
] as const;

export const STAGING_SUPABASE_RLS_MANUAL_MATRIX_ROLES: readonly StagingSupabaseRlsRole[] = [
  "anon",
  "authenticated",
  "service_role",
  "dashboard_readonly_app",
] as const;

export const STAGING_SUPABASE_RLS_MANUAL_MATRIX_OPERATIONS: readonly StagingSupabaseRlsOperation[] = [
  "select",
  "insert",
  "update",
  "delete",
] as const;

export const STAGING_SUPABASE_RLS_MANUAL_MATRIX_ALLOWED_DECISIONS: readonly StagingSupabaseRlsDecision[] = [
  "READY_FOR_REVIEW",
  "NO_GO",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every staging Supabase RLS manual matrix surface must
 * keep these negations intact.
 */
export const STAGING_SUPABASE_RLS_MANUAL_MATRIX_SAFETY_LABELS = [
  "Staging Supabase RLS Manual Matrix",
  "staging Supabase",
  "RLS manual matrix",
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
 * any staging Supabase RLS manual matrix surface.
 */
export const STAGING_SUPABASE_RLS_MANUAL_MATRIX_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
