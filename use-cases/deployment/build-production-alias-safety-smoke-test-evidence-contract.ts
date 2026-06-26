/**
 * Production Alias Safety Smoke Test Evidence Contract Builder — V43
 *
 * Pure builder. Returns a deterministic evidence bundle recording the MANUAL
 * production-alias safety smoke test (against
 * https://allen-stock-dashboard.vercel.app). Default decision is
 * SMOKE_TEST_PASSED.
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
  PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_SAFETY_LABELS,
} from "./production-alias-safety-smoke-test-evidence-contract";
import type {
  ProductionAliasSafetySmokeTestEndpointCheck,
  ProductionAliasSafetySmokeTestEvidenceBundle,
  ProductionAliasSafetySmokeTestRuntimeHealth,
  ProductionAliasSafetySmokeTestSafetyFlags,
} from "./production-alias-safety-smoke-test-evidence-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const ALIAS = "allen-stock-dashboard.vercel.app";

export interface BuildProductionAliasSafetySmokeTestEvidenceContractInput {
  generatedAt?: string;
}

function endpoint(
  label: string,
  url: string,
  expectedResponse: string,
): ProductionAliasSafetySmokeTestEndpointCheck {
  return { label, url, accessible: true, expectedResponse, status: "PASS" };
}

/**
 * Builds a deterministic production-alias safety smoke test evidence bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildProductionAliasSafetySmokeTestEvidenceContract(
  input: BuildProductionAliasSafetySmokeTestEvidenceContractInput = {},
): ProductionAliasSafetySmokeTestEvidenceBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const endpointChecks: ProductionAliasSafetySmokeTestEndpointCheck[] = [
    endpoint("Production home page", `https://${ALIAS}/`, "首頁可正常開啟。"),
    endpoint("Holdings page", `https://${ALIAS}/holdings`, "/holdings 可正常開啟。"),
    endpoint(
      "First Authorized Source Dry-Run API",
      `https://${ALIAS}/api/portfolio/first-authorized-source-dry-run`,
      "回傳 fixture / mock_or_contract JSON。",
    ),
    endpoint(
      "Runtime Pilot Dry-Run API",
      `https://${ALIAS}/api/portfolio/runtime-pilot-dry-run`,
      "回傳 fixture / mock_or_contract JSON。",
    ),
    endpoint(
      "Intraday Defense API",
      `https://${ALIAS}/api/portfolio/intraday-defense`,
      "回傳 fixture / mock_or_contract JSON。",
    ),
    endpoint(
      "Holding Defense API",
      `https://${ALIAS}/api/portfolio/holding-defense`,
      "回傳 fixture / mock_or_contract JSON。",
    ),
  ];

  const runtimeHealth: ProductionAliasSafetySmokeTestRuntimeHealth = {
    observationWindowMinutes: 30,
    runtimeErrorFatalFound: false,
    runtimeHttp500Found: false,
    status: "PASS",
    notes: "Vercel production runtime 近 30 分鐘無 error / fatal / 500。",
  };

  const safetyFlags: ProductionAliasSafetySmokeTestSafetyFlags = {
    sourceMode: "fixture",
    responseSource: "mock_or_contract",
    realMarketDataEnabled: false,
    supabaseConnected: false,
    productionWritePerformed: false,
    databaseWritePerformed: false,
    requestPerformed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    portfolioApiSwitched: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    uiCreated: false,
    sqlMigrationCreated: false,
    envReadPerformed: false,
  };

  return {
    contractVersion: "V43",
    evidenceName: "Production Alias Safety Smoke Test Evidence",
    deploymentTarget: "production_alias",
    productionAlias: "allen-stock-dashboard.vercel.app",
    generatedAt,
    decision: "SMOKE_TEST_PASSED",

    productionShellAccessible: true,
    homePageAccessible: true,
    holdingsPageAccessible: true,
    firstAuthorizedSourceDryRunApiAccessible: true,
    runtimePilotDryRunApiAccessible: true,
    intradayDefenseApiAccessible: true,
    holdingDefenseApiAccessible: true,

    runtimeErrorFatalFound: false,
    runtimeHttp500Found: false,

    sourceMode: "fixture",
    responseSource: "mock_or_contract",
    realMarketDataEnabled: false,
    supabaseConnected: false,
    productionWritePerformed: false,
    databaseWritePerformed: false,
    requestPerformed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    portfolioApiSwitched: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    uiCreated: false,
    sqlMigrationCreated: false,
    envReadPerformed: false,

    endpointChecks,
    runtimeHealth,
    safetyFlags,
    safetyLabels: [...PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_SAFETY_LABELS],
  };
}
