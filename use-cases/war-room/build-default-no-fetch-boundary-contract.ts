/**
 * Default No-Fetch Boundary Contract Builder — OFFLINE DETERMINISTIC DEFAULT RUNTIME PATH
 *
 * Pure deterministic contract describing the locked state of the limited live fetch
 * default no-fetch boundary validator: the DEFAULT runtime path (no explicit
 * dryRunLiveFetch) performs zero fetch calls and stays in the scaffold / disabled safe
 * state. This lets the V73 Safety Chain CI Guard cover the boundary at the flag level.
 * The actual spied-fetch assertions live in
 * scripts/validate-limited-live-fetch-default-no-fetch-boundary.ts.
 *
 * This builder is pure: NO live fetch, NO real network, NO smoke, NO Supabase, NO env
 * read, NO clock read (generatedAt is passed in or a fixed string), NO DB write, NO API
 * route, NO broker, NO order. It only DECLARES the locked default-path shape.
 *
 * See: docs/limited-live-fetch-default-no-fetch-boundary.md
 */

export interface DefaultNoFetchBoundaryContract {
  contractVersion: "DEFAULT_NO_FETCH_BOUNDARY_LIMITED_LIVE_FETCH";
  mode: "OFFLINE_DETERMINISTIC_DEFAULT_RUNTIME_PATH";
  generatedAt: string;
  decision: "OFFLINE_DETERMINISTIC_DEFAULT_NO_FETCH_OK";

  name: "Default No-Fetch Boundary Validator for Limited Live Fetch";

  // Offline / deterministic / default-path markers.
  offline: true;
  deterministic: true;
  defaultRuntimePath: true;
  dryRunLiveFetchDefault: false;
  defaultPathFetchCallCount: 0;
  explicitDryRunFalseFetchCallCount: 0;
  unsupportedSymbolDefaultPathSafeFallback: true;
  realNetworkUsed: false;
  fetchMockRestored: true;
  liveFetchPerformed: false;
  smokeInvoked: false;
  smokeManualOnly: true;

  // Approved scope (unchanged).
  approvedSymbol: "3019";
  approvedChannel: "tse_3019.tw";
  timeoutMs: 3000;
  maxRetries: 0;

  // Safety flags (guard-scanned — must all stay false).
  productionDataSwitchAllowed: false;
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

export interface BuildDefaultNoFetchBoundaryContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

/**
 * Builds the default no-fetch boundary contract. Reads no clock, no env, no network — a
 * static declaration of the offline, deterministic default-runtime-path validator's
 * locked state. decision is OFFLINE_DETERMINISTIC_DEFAULT_NO_FETCH_OK; default path makes
 * zero fetch calls; real network never used; live fetch / smoke never performed; every
 * operational / connection flag is false.
 */
export function buildDefaultNoFetchBoundaryContract(
  input: BuildDefaultNoFetchBoundaryContractInput = {},
): DefaultNoFetchBoundaryContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  return {
    contractVersion: "DEFAULT_NO_FETCH_BOUNDARY_LIMITED_LIVE_FETCH",
    mode: "OFFLINE_DETERMINISTIC_DEFAULT_RUNTIME_PATH",
    generatedAt,
    decision: "OFFLINE_DETERMINISTIC_DEFAULT_NO_FETCH_OK",

    name: "Default No-Fetch Boundary Validator for Limited Live Fetch",

    offline: true,
    deterministic: true,
    defaultRuntimePath: true,
    dryRunLiveFetchDefault: false,
    defaultPathFetchCallCount: 0,
    explicitDryRunFalseFetchCallCount: 0,
    unsupportedSymbolDefaultPathSafeFallback: true,
    realNetworkUsed: false,
    fetchMockRestored: true,
    liveFetchPerformed: false,
    smokeInvoked: false,
    smokeManualOnly: true,

    approvedSymbol: "3019",
    approvedChannel: "tse_3019.tw",
    timeoutMs: 3000,
    maxRetries: 0,

    productionDataSwitchAllowed: false,
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
      "Default No-Fetch Boundary Validator for Limited Live Fetch",
      "OFFLINE_DETERMINISTIC_DEFAULT_RUNTIME_PATH",
      "default runtime path performs no fetch",
      "dryRunLiveFetch default=false",
      "default path fetch call count = 0",
      "explicit dryRunLiveFetch=false fetch call count = 0",
      "unsupported symbol default path safe fallback",
      "mock fetch restored after test",
      "no real network",
      "no live fetch",
      "no smoke (manual only)",
      "no production data switch",
      "operationalUseAllowed=false",
      "productionReady=false",
    ],
  };
}
