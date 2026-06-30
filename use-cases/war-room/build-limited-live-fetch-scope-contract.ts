/**
 * Limited Live Fetch Dry-run PR Scope Contract — SCOPE ONLY, NO NETWORK CODE
 *
 * Pure deterministic contract describing the locked state of the limited live fetch
 * dry-run scope: scope-only, no network code added yet, decision NO_GO. This lets the
 * V73 Safety Chain CI Guard cover the scope at the flag level (the file-level "no
 * network code" enforcement lives in scripts/validate-limited-live-fetch-dry-run-pr-scope.ts).
 *
 * No runtime, no fetch, no Supabase, no env reads, no clock reads, no DB writes, no
 * API route, no broker, no order. Owner approval is required and NOT received here.
 *
 * See: docs/limited-live-fetch-dry-run-pr-scope.md
 */

export interface LimitedLiveFetchScopeContract {
  contractVersion: "LIMITED_LIVE_FETCH_DRY_RUN_PR_SCOPE";
  mode: "SCOPE_ONLY_NO_NETWORK_CODE";
  generatedAt: string;
  decision: "NO_GO";

  defaultRealDataMode: "fixture";
  liveFetchAllowed: false;
  networkCodeAdded: false;
  realDataConnected: false;
  envReadPerformed: false;
  supabaseConnected: false;
  apiRouteCreated: false;
  portfolioApiSwitched: false;
  databaseWritePerformed: false;
  brokerApiAllowed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  operationalUseAllowed: false;
  productionReady: false;

  ownerApprovalRequired: true;
  ownerApprovalReceived: false;

  primaryCandidateSource: string;
  brokerApiPermanentlyForbidden: true;

  safetyLabels: string[];
}

export interface BuildLimitedLiveFetchScopeContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

/**
 * Builds the limited live fetch scope contract. Reads no clock, no env, no network —
 * a static declaration of the scope's locked state. decision is NO_GO; no network
 * code; default real data mode is fixture; owner approval required and not received.
 */
export function buildLimitedLiveFetchScopeContract(
  input: BuildLimitedLiveFetchScopeContractInput = {},
): LimitedLiveFetchScopeContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  return {
    contractVersion: "LIMITED_LIVE_FETCH_DRY_RUN_PR_SCOPE",
    mode: "SCOPE_ONLY_NO_NETWORK_CODE",
    generatedAt,
    decision: "NO_GO",

    defaultRealDataMode: "fixture",
    liveFetchAllowed: false,
    networkCodeAdded: false,
    realDataConnected: false,
    envReadPerformed: false,
    supabaseConnected: false,
    apiRouteCreated: false,
    portfolioApiSwitched: false,
    databaseWritePerformed: false,
    brokerApiAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    operationalUseAllowed: false,
    productionReady: false,

    ownerApprovalRequired: true,
    ownerApprovalReceived: false,

    primaryCandidateSource: "TWSE / TPEx official public read-only quote endpoint (scope-only, not connected)",
    brokerApiPermanentlyForbidden: true,

    safetyLabels: [
      "Limited Live Fetch Dry-run PR Scope",
      "SCOPE_ONLY_NO_NETWORK_CODE",
      "NO_GO",
      "no live fetch",
      "no network code",
      "no env read",
      "no Supabase connection",
      "no API route",
      "no /api/portfolio switch",
      "default remains fixture",
      "operationalUseAllowed=false",
      "productionReady=false",
      "broker API permanently forbidden",
      "required owner approval before actual limited live fetch",
    ],
  };
}
