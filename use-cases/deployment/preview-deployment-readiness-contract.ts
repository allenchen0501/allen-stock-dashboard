/**
 * Preview Deployment Readiness Contract — V42
 *
 * Read-model TypeScript contract describing the readiness checklist for
 * deploying Allen Stock Dashboard to a Preview / Staging URL. This file contains
 * TYPES + a few static safety CONSTANTS ONLY. It declares no runtime, performs
 * no fetch, imports no Supabase client, reads no environment keys, calls Date.now
 * on nothing, writes no data, and triggers no deploy.
 *
 * V42 is deployment-readiness / preview-launch preparation only. A preview
 * deployment publishes the site shell + fixture-only flows; it does NOT enable
 * real market data, runtime, Supabase, database writes, buy/sell commands, or
 * auto orders. preview deployment 不是 production trading system.
 *
 * See: docs/preview-deployment-readiness.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type PreviewDeploymentTarget = "preview";

export type PreviewDeploymentProvider = "vercel_or_nextjs_compatible";

export type PreviewDeploymentDecision =
  | "READY_FOR_PREVIEW_DEPLOY"
  | "NO_GO"
  | "BLOCKED"
  | "READY_FOR_REVIEW";

export type PreviewDeploymentReadinessGateId =
  | "BUILD_PASS"
  | "CORE_TESTS_PASS"
  | "RUNTIME_UI_PASS"
  | "FIRST_AUTHORIZED_SOURCE_UI_PASS"
  | "FIXTURE_ONLY_DISCLOSURE"
  | "NO_REAL_DATA"
  | "NO_RUNTIME"
  | "NO_SUPABASE"
  | "NO_ENV_READ"
  | "NO_SQL_MIGRATION"
  | "NO_DATABASE_WRITE"
  | "NO_BUY_SELL_COMMAND"
  | "NO_AUTO_ORDER"
  | "PRODUCTION_WRITE_BLOCKED"
  | "ROUTE_SMOKE_TESTS_DEFINED"
  | "MANUAL_POST_DEPLOY_CHECKLIST_DEFINED"
  | "ROLLBACK_PLAN_DEFINED";

export type PreviewDeploymentGateStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "NOT_REVIEWED"
  | "BLOCKED";

export type PreviewDeploymentRouteType = "page" | "internal_api";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PreviewDeploymentReadinessGate {
  gateId: PreviewDeploymentReadinessGateId;
  title: string;
  status: PreviewDeploymentGateStatus;
  critical: boolean;
  evidence: string | null;
  notes: string;
}

export interface PreviewDeploymentRouteCheck {
  routePath: string;
  routeType: PreviewDeploymentRouteType;
  expectedResponse: string;
  fixtureOnly: true;
  readsExternalData: false;
  readsSupabase: false;
  readsEnvKey: false;
  writesData: false;
  buySellCommandGenerated: false;
}

export interface PreviewDeploymentUiCheck {
  sectionName: string;
  mustDisplayFixtureWarning: true;
  notTradeAdvice: true;
  productionWriteBlocked: true;
}

export interface PreviewDeploymentManualCheck {
  checkId: string;
  description: string;
  required: true;
}

export interface PreviewDeploymentRollbackCheck {
  checkId: string;
  description: string;
  blocksDeployOnFailure: boolean;
}

export interface PreviewDeploymentReadinessBundle {
  contractVersion: "V42";
  deploymentTarget: "preview";
  deploymentProvider: "vercel_or_nextjs_compatible";
  generatedAt: string;
  decision: PreviewDeploymentDecision;
  gates: PreviewDeploymentReadinessGate[];
  routeChecks: PreviewDeploymentRouteCheck[];
  uiChecks: PreviewDeploymentUiCheck[];
  manualChecks: PreviewDeploymentManualCheck[];
  rollbackChecks: PreviewDeploymentRollbackCheck[];
  productionDataEnabled: false;
  runtimeEnabled: false;
  externalMarketDataEnabled: false;
  supabaseEnabled: false;
  databaseWriteEnabled: false;
  buySellCommandEnabled: false;
  autoOrderEnabled: false;
  productionWritePerformed: false;
  requestPerformed: false;
  supabaseConnected: false;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const PREVIEW_DEPLOYMENT_READINESS_CONTRACT_VERSION = "V42" as const;

export const PREVIEW_DEPLOYMENT_READINESS_ALLOWED_GATES: readonly PreviewDeploymentReadinessGateId[] = [
  "BUILD_PASS",
  "CORE_TESTS_PASS",
  "RUNTIME_UI_PASS",
  "FIRST_AUTHORIZED_SOURCE_UI_PASS",
  "FIXTURE_ONLY_DISCLOSURE",
  "NO_REAL_DATA",
  "NO_RUNTIME",
  "NO_SUPABASE",
  "NO_ENV_READ",
  "NO_SQL_MIGRATION",
  "NO_DATABASE_WRITE",
  "NO_BUY_SELL_COMMAND",
  "NO_AUTO_ORDER",
  "PRODUCTION_WRITE_BLOCKED",
  "ROUTE_SMOKE_TESTS_DEFINED",
  "MANUAL_POST_DEPLOY_CHECKLIST_DEFINED",
  "ROLLBACK_PLAN_DEFINED",
] as const;

export const PREVIEW_DEPLOYMENT_READINESS_ALLOWED_DECISIONS: readonly PreviewDeploymentDecision[] = [
  "READY_FOR_PREVIEW_DEPLOY",
  "NO_GO",
  "BLOCKED",
  "READY_FOR_REVIEW",
] as const;

/**
 * Canonical safety labels. Every preview-deployment-readiness surface must keep
 * these negations intact.
 */
export const PREVIEW_DEPLOYMENT_READINESS_SAFETY_LABELS = [
  "Preview Deployment Readiness",
  "preview deployment 不是 production trading system",
  "fixture data 不是即時資料",
  "V42 不接真資料",
  "V42 不建立 runtime",
  "V42 不寫資料",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "production write 一律 BLOCKED",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "productionWritePerformed 必須 false",
  "requestPerformed 必須 false",
  "supabaseConnected 必須 false",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any preview-deployment-readiness surface.
 */
export const PREVIEW_DEPLOYMENT_READINESS_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
