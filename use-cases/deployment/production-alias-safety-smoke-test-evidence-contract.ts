/**
 * Production Alias Safety Smoke Test Evidence Contract — V43
 *
 * Read-model TypeScript contract recording the MANUAL production-alias safety
 * smoke test that was performed against https://allen-stock-dashboard.vercel.app.
 * This file contains TYPES + a few static safety CONSTANTS ONLY. It declares no
 * runtime, performs no fetch, imports no Supabase client, reads no environment
 * keys, calls Date.now on nothing, writes no data, and triggers no deploy.
 *
 * V43 is production-alias safety smoke test EVIDENCE only. The production shell
 * is viewable, but the data layer is still fixture/mock safe mode: no real
 * market data, no Supabase, no production write, no buy/sell command, no auto
 * order. allen-stock-dashboard.vercel.app is NOT a production trading system.
 *
 * See: docs/production-alias-safety-smoke-test-evidence.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ProductionAliasSafetySmokeTestDeploymentTarget = "production_alias";

export type ProductionAliasSafetySmokeTestDecision =
  | "SMOKE_TEST_PASSED"
  | "SMOKE_TEST_FAILED"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type ProductionAliasSafetySmokeTestSourceMode = "fixture";

export type ProductionAliasSafetySmokeTestResponseSource = "mock_or_contract";

export type ProductionAliasSafetySmokeTestCheckStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "NOT_REVIEWED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** A single endpoint / page accessibility observation from the manual test. */
export interface ProductionAliasSafetySmokeTestEndpointCheck {
  label: string;
  url: string;
  accessible: boolean;
  expectedResponse: string;
  status: ProductionAliasSafetySmokeTestCheckStatus;
}

/** Runtime health observation window for the production alias. */
export interface ProductionAliasSafetySmokeTestRuntimeHealth {
  observationWindowMinutes: number;
  runtimeErrorFatalFound: false;
  runtimeHttp500Found: false;
  status: ProductionAliasSafetySmokeTestCheckStatus;
  notes: string;
}

/** The frozen safety-flag snapshot proven by the smoke test. */
export interface ProductionAliasSafetySmokeTestSafetyFlags {
  sourceMode: ProductionAliasSafetySmokeTestSourceMode;
  responseSource: ProductionAliasSafetySmokeTestResponseSource;
  realMarketDataEnabled: false;
  supabaseConnected: false;
  productionWritePerformed: false;
  databaseWritePerformed: false;
  requestPerformed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  portfolioApiSwitched: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  uiCreated: false;
  sqlMigrationCreated: false;
  envReadPerformed: false;
}

export interface ProductionAliasSafetySmokeTestEvidenceBundle {
  contractVersion: "V43";
  evidenceName: "Production Alias Safety Smoke Test Evidence";
  deploymentTarget: "production_alias";
  productionAlias: "allen-stock-dashboard.vercel.app";
  generatedAt: string;
  decision: ProductionAliasSafetySmokeTestDecision;

  productionShellAccessible: true;
  homePageAccessible: true;
  holdingsPageAccessible: true;
  firstAuthorizedSourceDryRunApiAccessible: true;
  runtimePilotDryRunApiAccessible: true;
  intradayDefenseApiAccessible: true;
  holdingDefenseApiAccessible: true;

  runtimeErrorFatalFound: false;
  runtimeHttp500Found: false;

  sourceMode: "fixture";
  responseSource: "mock_or_contract";
  realMarketDataEnabled: false;
  supabaseConnected: false;
  productionWritePerformed: false;
  databaseWritePerformed: false;
  requestPerformed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  portfolioApiSwitched: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  uiCreated: false;
  sqlMigrationCreated: false;
  envReadPerformed: false;

  endpointChecks: ProductionAliasSafetySmokeTestEndpointCheck[];
  runtimeHealth: ProductionAliasSafetySmokeTestRuntimeHealth;
  safetyFlags: ProductionAliasSafetySmokeTestSafetyFlags;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_CONTRACT_VERSION = "V43" as const;

export const PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_PRODUCTION_ALIAS =
  "allen-stock-dashboard.vercel.app" as const;

export const PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_ALLOWED_DECISIONS: readonly ProductionAliasSafetySmokeTestDecision[] = [
  "SMOKE_TEST_PASSED",
  "SMOKE_TEST_FAILED",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every production-alias safety smoke test evidence
 * surface must keep these negations intact.
 */
export const PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_SAFETY_LABELS = [
  "Production Alias Safety Smoke Test Evidence",
  "allen-stock-dashboard.vercel.app",
  "fixture/mock safe mode",
  "not production trading system",
  "no real market data",
  "no Supabase",
  "no production write",
  "no buy/sell command",
  "no auto order",
  "V43 不接真實行情",
  "V43 不連 Supabase",
  "V43 不寫 production",
  "V43 不切換 /api/portfolio",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any production-alias safety smoke test evidence surface.
 */
export const PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
