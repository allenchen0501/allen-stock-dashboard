/**
 * Limited Live Fetch Dry-run Implementation Contract — SHADOW-ONLY, NON-OPERATIONAL
 *
 * Pure deterministic contract describing the locked safety envelope of the limited
 * live fetch dry-run IMPLEMENTATION (already shipped in the approved provider). This
 * lets the V73 Safety Chain CI Guard cover the implementation at the flag level — the
 * file-level enforcement (only the approved provider fetches, restricted shape, fallback)
 * lives in scripts/validate-limited-live-fetch-dry-run-implementation.ts.
 *
 * This builder is pure: it performs NO live fetch, no network, no Supabase, no env read,
 * no clock read, no DB write, no API route, no broker, no order. It only DECLARES the
 * approved shape so the guard can prove the shape never silently changes.
 *
 * See: docs/limited-live-fetch-dry-run-implementation.md
 */

export interface LimitedLiveFetchImplementationContract {
  contractVersion: "LIMITED_LIVE_FETCH_DRY_RUN_IMPLEMENTATION";
  mode: "LIMITED_LIVE_FETCH_DRY_RUN_SHADOW_ONLY";
  generatedAt: string;
  decision: "LIVE_FETCH_DRY_RUN_NON_OPERATIONAL";

  // Approved scope (single provider / single symbol / single channel).
  approvedProviderOnly: true;
  approvedProvider: "TWSE_TPEX";
  approvedProviderFile: string;
  symbol: "3019";
  channel: "tse_3019.tw";
  timeoutMs: 3000;
  maxRetries: 0;
  httpMethod: "GET";
  fallbackDisabledScaffoldCandidate: true;

  // Default behavior + shadow.
  defaultRealDataMode: "fixture";
  shadowOnly: true;
  appDefaultLiveFetch: false;
  symbolUniverseExpanded: false;
  yahooProviderAdded: false;
  secondFetchAdded: false;
  smokeScriptInSafetyChain: false;

  // Safety flags (guard-scanned — must all stay false).
  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  fetchPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  portfolioApiSwitchAllowed: false;
  brokerApiAllowed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  operationalUseAllowed: false;
  productionSwitchAllowed: false;
  productionReady: false;

  safetyLabels: string[];
}

export interface BuildLimitedLiveFetchImplementationContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

/**
 * Builds the limited live fetch dry-run implementation contract. Reads no clock, no
 * env, no network — a static declaration of the approved, shadow-only, non-operational
 * implementation shape. decision is LIVE_FETCH_DRY_RUN_NON_OPERATIONAL; default real
 * data mode is fixture; every operational / production / connection flag is false.
 */
export function buildLimitedLiveFetchImplementationContract(
  input: BuildLimitedLiveFetchImplementationContractInput = {},
): LimitedLiveFetchImplementationContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  return {
    contractVersion: "LIMITED_LIVE_FETCH_DRY_RUN_IMPLEMENTATION",
    mode: "LIMITED_LIVE_FETCH_DRY_RUN_SHADOW_ONLY",
    generatedAt,
    decision: "LIVE_FETCH_DRY_RUN_NON_OPERATIONAL",

    approvedProviderOnly: true,
    approvedProvider: "TWSE_TPEX",
    approvedProviderFile: "services/market-data/twse-tpex-verification-provider.ts",
    symbol: "3019",
    channel: "tse_3019.tw",
    timeoutMs: 3000,
    maxRetries: 0,
    httpMethod: "GET",
    fallbackDisabledScaffoldCandidate: true,

    defaultRealDataMode: "fixture",
    shadowOnly: true,
    appDefaultLiveFetch: false,
    symbolUniverseExpanded: false,
    yahooProviderAdded: false,
    secondFetchAdded: false,
    smokeScriptInSafetyChain: false,

    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    fetchPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    portfolioApiSwitchAllowed: false,
    brokerApiAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    operationalUseAllowed: false,
    productionSwitchAllowed: false,
    productionReady: false,

    safetyLabels: [
      "Limited Live Fetch Dry-run Implementation",
      "LIMITED_LIVE_FETCH_DRY_RUN_SHADOW_ONLY",
      "LIVE_FETCH_DRY_RUN_NON_OPERATIONAL",
      "approved provider only (TWSE / TPEx)",
      "first symbol 3019 only",
      "channel tse_3019.tw only",
      "GET only",
      "timeout 3000ms",
      "maxRetries 0",
      "fallback to disabled scaffold candidate",
      "shadow-only",
      "default remains fixture",
      "app does not live fetch by default",
      "symbol universe not expanded",
      "no second fetch",
      "operationalUseAllowed=false",
      "portfolioApiSwitchAllowed=false",
      "productionReady=false",
      "no broker API",
      "no buy/sell command",
      "no auto order",
      "manual smoke script is not part of safety chain",
    ],
  };
}
