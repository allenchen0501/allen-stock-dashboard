/**
 * Staging Supabase Read-only Safety Gate Contract — V44
 *
 * Read-model TypeScript contract describing the pre-flight safety gate that MUST
 * pass before any future staging Supabase read-only integration is attempted.
 * This file contains TYPES + a few static safety CONSTANTS ONLY. It declares no
 * runtime, performs no fetch, imports no Supabase client, reads no environment
 * keys, calls Date.now on nothing, writes no data, and connects to nothing.
 *
 * V44 is spec-only. It is NOT a staging Supabase implementation, NOT an RLS
 * matrix, and NOT a production data go-live. It only defines the gate. A staging
 * Supabase read-only connection is merely PLANNED — stagingSupabaseConnected is
 * false, no read/write is performed, production is fully isolated, /api/portfolio
 * is not switched, and no buy/sell command / auto order is ever produced.
 *
 * See: docs/staging-supabase-readonly-safety-gate.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type StagingSupabaseReadonlyDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V44 can never decide a
// production go-live.
export type StagingSupabaseReadonlyDecision =
  | "READY_FOR_REVIEW"
  | "NO_GO"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type StagingSupabaseReadonlyGateId =
  | "STAGING_BOUNDARY_DEFINED"
  | "READ_ONLY_BOUNDARY_DEFINED"
  | "PRODUCTION_ISOLATION_VERIFIED"
  | "NO_WRITE_PROOF_DEFINED"
  | "API_SWITCH_GUARD_DEFINED"
  | "RUNTIME_GUARD_DEFINED"
  | "ENV_GUARD_DEFINED"
  | "ROLLBACK_KILL_SWITCH_DEFINED"
  | "MANUAL_REVIEW_CHECKLIST_DEFINED";

export type StagingSupabaseReadonlyCheckStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "NOT_REVIEWED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StagingSupabaseReadonlyGate {
  gateId: StagingSupabaseReadonlyGateId;
  title: string;
  status: StagingSupabaseReadonlyCheckStatus;
  critical: boolean;
  notes: string;
}

export interface StagingSupabaseReadonlyStagingBoundary {
  deploymentTarget: "staging";
  stagingSupabasePlanned: true;
  stagingSupabaseConnected: false;
  stagingReadPerformed: false;
  stagingWritePerformed: false;
  notes: string;
}

export interface StagingSupabaseReadonlyReadOnlyBoundary {
  readOnlyIntentOnly: true;
  stagingReadPerformed: false;
  stagingWritePerformed: false;
  databaseWritePerformed: false;
  allowedOperationsWhenEnabled: string[];
  forbiddenOperations: string[];
  notes: string;
}

export interface StagingSupabaseReadonlyProductionIsolationBoundary {
  productionSupabaseConnected: false;
  productionWritePerformed: false;
  productionAliasUnchanged: true;
  fixtureMockUiUnchanged: true;
  notes: string;
}

export interface StagingSupabaseReadonlyNoWriteProof {
  writeAttempted: false;
  stagingWritePerformed: false;
  productionWritePerformed: false;
  databaseWritePerformed: false;
  blockedWriteOperations: string[];
  proofStatus: StagingSupabaseReadonlyCheckStatus;
}

export interface StagingSupabaseReadonlyApiSwitchGuard {
  portfolioApiSwitched: false;
  portfolioSourceModeUnchanged: true;
  realMarketDataEnabled: false;
  notes: string;
}

export interface StagingSupabaseReadonlyRuntimeGuard {
  runtimeCreated: false;
  quotePollingCreated: false;
  schedulerCreated: false;
  webhookCreated: false;
  crawlerCreated: false;
  connectorRuntimeCreated: false;
  notes: string;
}

export interface StagingSupabaseReadonlyEnvGuard {
  envReadPerformed: false;
  supabaseEnvKeyRead: false;
  requestPerformed: false;
  notes: string;
}

export interface StagingSupabaseReadonlyRollbackCheck {
  checkId: string;
  description: string;
  blocksGateOnFailure: boolean;
}

export interface StagingSupabaseReadonlyManualCheck {
  checkId: string;
  description: string;
  required: true;
}

export interface StagingSupabaseReadonlySafetyGateBundle {
  contractVersion: "V44";
  gateName: "Staging Supabase Read-only Safety Gate";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: StagingSupabaseReadonlyDecision;

  gates: StagingSupabaseReadonlyGate[];
  stagingBoundary: StagingSupabaseReadonlyStagingBoundary;
  readOnlyBoundary: StagingSupabaseReadonlyReadOnlyBoundary;
  productionIsolation: StagingSupabaseReadonlyProductionIsolationBoundary;
  noWriteProof: StagingSupabaseReadonlyNoWriteProof;
  apiSwitchGuard: StagingSupabaseReadonlyApiSwitchGuard;
  runtimeGuard: StagingSupabaseReadonlyRuntimeGuard;
  envGuard: StagingSupabaseReadonlyEnvGuard;
  rollbackChecks: StagingSupabaseReadonlyRollbackCheck[];
  manualChecks: StagingSupabaseReadonlyManualCheck[];

  // Frozen top-level safety flags.
  stagingSupabasePlanned: true;
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
  realMarketDataEnabled: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const STAGING_SUPABASE_READONLY_SAFETY_GATE_CONTRACT_VERSION = "V44" as const;

export const STAGING_SUPABASE_READONLY_SAFETY_GATE_DEPLOYMENT_TARGET = "staging" as const;

export const STAGING_SUPABASE_READONLY_SAFETY_GATE_ALLOWED_GATES: readonly StagingSupabaseReadonlyGateId[] = [
  "STAGING_BOUNDARY_DEFINED",
  "READ_ONLY_BOUNDARY_DEFINED",
  "PRODUCTION_ISOLATION_VERIFIED",
  "NO_WRITE_PROOF_DEFINED",
  "API_SWITCH_GUARD_DEFINED",
  "RUNTIME_GUARD_DEFINED",
  "ENV_GUARD_DEFINED",
  "ROLLBACK_KILL_SWITCH_DEFINED",
  "MANUAL_REVIEW_CHECKLIST_DEFINED",
] as const;

export const STAGING_SUPABASE_READONLY_SAFETY_GATE_ALLOWED_DECISIONS: readonly StagingSupabaseReadonlyDecision[] = [
  "READY_FOR_REVIEW",
  "NO_GO",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every staging Supabase read-only safety gate surface
 * must keep these negations intact.
 */
export const STAGING_SUPABASE_READONLY_SAFETY_GATE_SAFETY_LABELS = [
  "Staging Supabase Read-only Safety Gate",
  "staging Supabase",
  "read-only",
  "not production trading system",
  "no real market data",
  "no Supabase connection",
  "no env key",
  "no write",
  "no staging write",
  "no production write",
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
 * any staging Supabase read-only safety gate surface.
 */
export const STAGING_SUPABASE_READONLY_SAFETY_GATE_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
