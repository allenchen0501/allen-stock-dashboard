/**
 * Staging Supabase Read-only Safety Gate Contract Builder — V44
 *
 * Pure builder. Returns a deterministic staging Supabase read-only safety gate
 * bundle. Default decision is READY_FOR_REVIEW: the gate is defined but a staging
 * Supabase read-only connection still requires a human go/no-go.
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
  STAGING_SUPABASE_READONLY_SAFETY_GATE_SAFETY_LABELS,
} from "./staging-supabase-readonly-safety-gate-contract";
import type {
  StagingSupabaseReadonlyApiSwitchGuard,
  StagingSupabaseReadonlyEnvGuard,
  StagingSupabaseReadonlyGate,
  StagingSupabaseReadonlyManualCheck,
  StagingSupabaseReadonlyNoWriteProof,
  StagingSupabaseReadonlyProductionIsolationBoundary,
  StagingSupabaseReadonlyReadOnlyBoundary,
  StagingSupabaseReadonlyRollbackCheck,
  StagingSupabaseReadonlyRuntimeGuard,
  StagingSupabaseReadonlySafetyGateBundle,
  StagingSupabaseReadonlyStagingBoundary,
} from "./staging-supabase-readonly-safety-gate-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStagingSupabaseReadonlySafetyGateContractInput {
  generatedAt?: string;
}

function gate(
  gateId: StagingSupabaseReadonlyGate["gateId"],
  title: string,
  critical: boolean,
  notes: string,
): StagingSupabaseReadonlyGate {
  return { gateId, title, status: "NOT_REVIEWED", critical, notes };
}

function rollbackCheck(
  checkId: string,
  description: string,
  blocksGateOnFailure: boolean,
): StagingSupabaseReadonlyRollbackCheck {
  return { checkId, description, blocksGateOnFailure };
}

function manualCheck(checkId: string, description: string): StagingSupabaseReadonlyManualCheck {
  return { checkId, description, required: true };
}

/**
 * Builds a deterministic staging Supabase read-only safety gate bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildStagingSupabaseReadonlySafetyGateContract(
  input: BuildStagingSupabaseReadonlySafetyGateContractInput = {},
): StagingSupabaseReadonlySafetyGateBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const gates: StagingSupabaseReadonlyGate[] = [
    gate("STAGING_BOUNDARY_DEFINED", "staging boundary 已定義", true, "僅限 staging，staging Supabase 只是 planned。"),
    gate("READ_ONLY_BOUNDARY_DEFINED", "read-only boundary 已定義", true, "未來啟用時僅允許 read-only，禁止任何 write。"),
    gate("PRODUCTION_ISOLATION_VERIFIED", "production isolation 已確認", true, "production Supabase 未連、production alias / fixture mock UI 不變。"),
    gate("NO_WRITE_PROOF_DEFINED", "no-write proof 已定義", true, "無 staging write、無 production write、無 database write。"),
    gate("API_SWITCH_GUARD_DEFINED", "API switch guard 已定義", true, "/api/portfolio 不切換、sourceMode 不變。"),
    gate("RUNTIME_GUARD_DEFINED", "runtime guard 已定義", true, "無 quote polling / scheduler / webhook / crawler / connector runtime。"),
    gate("ENV_GUARD_DEFINED", "env guard 已定義", true, "不讀 env、不讀 Supabase env key、不發 request。"),
    gate("ROLLBACK_KILL_SWITCH_DEFINED", "rollback / kill switch 已定義", false, "可回滾到前一個 commit，kill switch 可停止。"),
    gate("MANUAL_REVIEW_CHECKLIST_DEFINED", "manual review checklist 已定義", false, "人工複核清單已定義。"),
  ];

  const stagingBoundary: StagingSupabaseReadonlyStagingBoundary = {
    deploymentTarget: "staging",
    stagingSupabasePlanned: true,
    stagingSupabaseConnected: false,
    stagingReadPerformed: false,
    stagingWritePerformed: false,
    notes: "staging Supabase 僅為 planned；V44 不連 staging Supabase。",
  };

  const readOnlyBoundary: StagingSupabaseReadonlyReadOnlyBoundary = {
    readOnlyIntentOnly: true,
    stagingReadPerformed: false,
    stagingWritePerformed: false,
    databaseWritePerformed: false,
    allowedOperationsWhenEnabled: ["select (read-only, staging only, future)"],
    forbiddenOperations: ["insert", "upsert", "update", "delete", "production write"],
    notes: "未來啟用時僅 read-only；V44 不做任何讀寫。",
  };

  const productionIsolation: StagingSupabaseReadonlyProductionIsolationBoundary = {
    productionSupabaseConnected: false,
    productionWritePerformed: false,
    productionAliasUnchanged: true,
    fixtureMockUiUnchanged: true,
    notes: "production Supabase 未連；production alias safety smoke test evidence 仍維持 V43 結論。",
  };

  const noWriteProof: StagingSupabaseReadonlyNoWriteProof = {
    writeAttempted: false,
    stagingWritePerformed: false,
    productionWritePerformed: false,
    databaseWritePerformed: false,
    blockedWriteOperations: ["staging write", "production write", "database write", "external order"],
    proofStatus: "PASS",
  };

  const apiSwitchGuard: StagingSupabaseReadonlyApiSwitchGuard = {
    portfolioApiSwitched: false,
    portfolioSourceModeUnchanged: true,
    realMarketDataEnabled: false,
    notes: "/api/portfolio 未切換；sourceMode 維持 fixture。",
  };

  const runtimeGuard: StagingSupabaseReadonlyRuntimeGuard = {
    runtimeCreated: false,
    quotePollingCreated: false,
    schedulerCreated: false,
    webhookCreated: false,
    crawlerCreated: false,
    connectorRuntimeCreated: false,
    notes: "未建立任何 runtime。",
  };

  const envGuard: StagingSupabaseReadonlyEnvGuard = {
    envReadPerformed: false,
    supabaseEnvKeyRead: false,
    requestPerformed: false,
    notes: "未讀 env key；未讀 Supabase env key；未發 request。",
  };

  const rollbackChecks: StagingSupabaseReadonlyRollbackCheck[] = [
    rollbackCheck("record-previous-commit", "記錄啟用前的 previous commit hash。", false),
    rollbackCheck("redeploy-previous-commit", "可 redeploy previous GitHub commit。", false),
    rollbackCheck("kill-switch-stop", "kill switch 可立即停止 staging Supabase read-only 嘗試。", true),
    rollbackCheck("block-if-write-detected", "偵測到任何 write 則 block gate。", true),
    rollbackCheck("block-if-production-touched", "偵測到 production Supabase 連線則 block gate。", true),
    rollbackCheck("block-if-env-read", "偵測到 env key 讀取則 block gate。", true),
    rollbackCheck("block-if-api-switched", "偵測到 /api/portfolio 切換則 block gate。", true),
  ];

  const manualChecks: StagingSupabaseReadonlyManualCheck[] = [
    manualCheck("review-staging-boundary", "人工確認僅 staging、不碰 production。"),
    manualCheck("review-read-only", "人工確認 read-only、無任何 write 路徑。"),
    manualCheck("review-production-isolation", "人工確認 production alias / fixture mock UI 不變。"),
    manualCheck("review-no-env-read", "人工確認不讀 env / Supabase env key。"),
    manualCheck("review-kill-switch", "人工確認 kill switch 與 rollback 可用。"),
  ];

  return {
    contractVersion: "V44",
    gateName: "Staging Supabase Read-only Safety Gate",
    deploymentTarget: "staging",
    generatedAt,
    decision: "READY_FOR_REVIEW",

    gates,
    stagingBoundary,
    readOnlyBoundary,
    productionIsolation,
    noWriteProof,
    apiSwitchGuard,
    runtimeGuard,
    envGuard,
    rollbackChecks,
    manualChecks,

    stagingSupabasePlanned: true,
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
    realMarketDataEnabled: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,

    futureGate: "V45 Staging Supabase RLS Manual Matrix",
    safetyLabels: [...STAGING_SUPABASE_READONLY_SAFETY_GATE_SAFETY_LABELS],
  };
}
