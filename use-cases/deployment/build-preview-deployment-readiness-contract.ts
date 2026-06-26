/**
 * Preview Deployment Readiness Contract Builder — V42
 *
 * Pure builder. Returns a deterministic preview-deployment-readiness bundle.
 * Default decision is READY_FOR_REVIEW: the checklist is defined but the
 * preview deploy still requires a human go/no-go.
 *
 * This is NOT a runtime and triggers NO deploy. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; production writes are always BLOCKED
 *   - No buy/sell commands; no auto orders
 */

import {
  PREVIEW_DEPLOYMENT_READINESS_SAFETY_LABELS,
} from "./preview-deployment-readiness-contract";
import type {
  PreviewDeploymentManualCheck,
  PreviewDeploymentReadinessBundle,
  PreviewDeploymentReadinessGate,
  PreviewDeploymentRollbackCheck,
  PreviewDeploymentRouteCheck,
  PreviewDeploymentUiCheck,
} from "./preview-deployment-readiness-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildPreviewDeploymentReadinessContractInput {
  generatedAt?: string;
}

function gate(
  gateId: PreviewDeploymentReadinessGate["gateId"],
  title: string,
  critical: boolean,
  notes: string,
): PreviewDeploymentReadinessGate {
  return { gateId, title, status: "NOT_REVIEWED", critical, evidence: null, notes };
}

function pageCheck(routePath: string, expectedResponse: string): PreviewDeploymentRouteCheck {
  return {
    routePath,
    routeType: "page",
    expectedResponse,
    fixtureOnly: true,
    readsExternalData: false,
    readsSupabase: false,
    readsEnvKey: false,
    writesData: false,
    buySellCommandGenerated: false,
  };
}

function apiCheck(routePath: string, expectedResponse: string): PreviewDeploymentRouteCheck {
  return {
    routePath,
    routeType: "internal_api",
    expectedResponse,
    fixtureOnly: true,
    readsExternalData: false,
    readsSupabase: false,
    readsEnvKey: false,
    writesData: false,
    buySellCommandGenerated: false,
  };
}

function uiCheck(sectionName: string): PreviewDeploymentUiCheck {
  return {
    sectionName,
    mustDisplayFixtureWarning: true,
    notTradeAdvice: true,
    productionWriteBlocked: true,
  };
}

function manualCheck(checkId: string, description: string): PreviewDeploymentManualCheck {
  return { checkId, description, required: true };
}

function rollbackCheck(
  checkId: string,
  description: string,
  blocksDeployOnFailure: boolean,
): PreviewDeploymentRollbackCheck {
  return { checkId, description, blocksDeployOnFailure };
}

/**
 * Builds a deterministic preview-deployment-readiness bundle. All timestamps
 * come from `input.generatedAt` (or a fixed fallback string); no clock is read.
 */
export function buildPreviewDeploymentReadinessContract(
  input: BuildPreviewDeploymentReadinessContractInput = {},
): PreviewDeploymentReadinessBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const gates: PreviewDeploymentReadinessGate[] = [
    gate("BUILD_PASS", "npm run build 成功", true, "next build 必須通過。"),
    gate("CORE_TESTS_PASS", "核心 checker 全綠", true, "全套 npm run test:* 必須 PASS。"),
    gate("RUNTIME_UI_PASS", "Runtime Pilot UI checker 通過", true, "readiness / monitoring UI checker 必須 PASS。"),
    gate("FIRST_AUTHORIZED_SOURCE_UI_PASS", "First Authorized Source UI checker 通過", true, "API + monitoring UI checker 必須 PASS。"),
    gate("FIXTURE_ONLY_DISCLOSURE", "fixture-only 揭露存在", true, "每個區塊保留 fixture data 不是即時資料。"),
    gate("NO_REAL_DATA", "未接真實資料", true, "preview 部署不接任何真實行情資料源。"),
    gate("NO_RUNTIME", "未建立 runtime", true, "無 quote polling / scheduler / webhook / crawler / connector runtime。"),
    gate("NO_SUPABASE", "未連 Supabase", true, "routes 不建立 Supabase client。"),
    gate("NO_ENV_READ", "未讀 env secret", false, "routes 不讀取部署環境 secret。"),
    gate("NO_SQL_MIGRATION", "未新增 SQL migration", false, "本輪不新增資料庫 migration。"),
    gate("NO_DATABASE_WRITE", "未寫入資料庫", true, "無 insert / upsert / update / delete。"),
    gate("NO_BUY_SELL_COMMAND", "未產生買賣指令", true, "buySellCommandGenerated 必須 false。"),
    gate("NO_AUTO_ORDER", "未自動下單", true, "autoOrderRequested 必須 false。"),
    gate("PRODUCTION_WRITE_BLOCKED", "production write 一律 BLOCKED", true, "productionWritePerformed 必須 false。"),
    gate("ROUTE_SMOKE_TESTS_DEFINED", "route smoke test checklist 已定義", false, "頁面與 internal API routes 已列入 smoke test。"),
    gate("MANUAL_POST_DEPLOY_CHECKLIST_DEFINED", "post-deploy 人工檢查已定義", false, "部署後人工驗證清單已定義。"),
    gate("ROLLBACK_PLAN_DEFINED", "rollback / redeploy 計畫已定義", false, "可回滾到前一個 GitHub commit。"),
  ];

  const routeChecks: PreviewDeploymentRouteCheck[] = [
    pageCheck("/", "首頁可 build 並回傳靜態頁面。"),
    pageCheck("/holdings", "holdings page 渲染全部 fixture-only 卡片。"),
    apiCheck("/api/portfolio/holding-defense", "mock_or_contract / fixture-only payload。"),
    apiCheck("/api/portfolio/intraday-defense", "mock_or_contract / fixture-only payload。"),
    apiCheck("/api/portfolio/runtime-pilot-dry-run", "mock_or_contract / fixture-only payload。"),
    apiCheck("/api/portfolio/first-authorized-source-dry-run", "mock_or_contract / fixture-only payload。"),
  ];

  const uiChecks: PreviewDeploymentUiCheck[] = [
    uiCheck("Portfolio Valuation Radar"),
    uiCheck("Holding Defense Tracker"),
    uiCheck("Intraday Defense Tracker"),
    uiCheck("Runtime Pilot Readiness"),
    uiCheck("Runtime Pilot Monitoring"),
    uiCheck("First Authorized Source Dry-Run Monitoring"),
  ];

  const manualChecks: PreviewDeploymentManualCheck[] = [
    manualCheck("home-page-open", "首頁 / 可開啟。"),
    manualCheck("holdings-page-open", "holdings page 可開啟。"),
    manualCheck("holding-defense-api-open", "/api/portfolio/holding-defense 可開啟。"),
    manualCheck("intraday-defense-api-open", "/api/portfolio/intraday-defense 可開啟。"),
    manualCheck("runtime-pilot-dry-run-api-open", "/api/portfolio/runtime-pilot-dry-run 可開啟。"),
    manualCheck("first-authorized-source-api-open", "/api/portfolio/first-authorized-source-dry-run 可開啟。"),
    manualCheck("fixture-warning-visible", "頁面顯示 fixture data 不是即時資料 warning banner。"),
    manualCheck("no-trade-disclosure-visible", "頁面顯示不產生買賣指令 / 不自動下單 / 不替代投資判斷。"),
    manualCheck("production-write-blocked-visible", "頁面顯示 production write 一律 BLOCKED。"),
  ];

  const rollbackChecks: PreviewDeploymentRollbackCheck[] = [
    rollbackCheck("record-previous-commit", "記錄部署前的 previous commit hash。", false),
    rollbackCheck("redeploy-previous-commit", "可 redeploy previous GitHub commit。", false),
    rollbackCheck("block-if-warning-disappears", "若 fixture-only warning banner 消失則停止公開分享。", true),
    rollbackCheck("block-if-build-fails", "build 失敗則 block deployment。", true),
    rollbackCheck("block-if-checker-fails", "任何 checker 失敗則 block deployment。", true),
    rollbackCheck("block-if-route-reads-env", "任何 route 讀 env 則 block deployment。", true),
    rollbackCheck("block-if-route-imports-supabase", "任何 route import Supabase 則 block deployment。", true),
    rollbackCheck("block-if-route-fetches-external", "任何 route fetch 外部 URL 則 block deployment。", true),
    rollbackCheck("block-if-buy-sell-possible", "buySellCommandGenerated 可能變 true 則 block deployment。", true),
    rollbackCheck("block-if-auto-order-possible", "autoOrderRequested 可能變 true 則 block deployment。", true),
    rollbackCheck("block-if-production-write-possible", "productionWritePerformed 可能變 true 則 block deployment。", true),
  ];

  return {
    contractVersion: "V42",
    deploymentTarget: "preview",
    deploymentProvider: "vercel_or_nextjs_compatible",
    generatedAt,
    decision: "READY_FOR_REVIEW",
    gates,
    routeChecks,
    uiChecks,
    manualChecks,
    rollbackChecks,
    productionDataEnabled: false,
    runtimeEnabled: false,
    externalMarketDataEnabled: false,
    supabaseEnabled: false,
    databaseWriteEnabled: false,
    buySellCommandEnabled: false,
    autoOrderEnabled: false,
    productionWritePerformed: false,
    requestPerformed: false,
    supabaseConnected: false,
    safetyLabels: [...PREVIEW_DEPLOYMENT_READINESS_SAFETY_LABELS],
  };
}
