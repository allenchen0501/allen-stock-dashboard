/**
 * Timeout Boundary Contract Builder — OFFLINE DETERMINISTIC TIMEOUT / ABORT FALLBACK
 *
 * Pure deterministic contract describing the locked state of the limited live fetch
 * offline timeout / abort boundary validator: a mocked fetch that times out / aborts
 * yields a safe, non-operational fallback candidate. This lets the V73 Safety Chain CI
 * Guard cover the boundary at the flag level. The actual mocked-fetch + faked-timer
 * assertions live in scripts/validate-limited-live-fetch-timeout-boundary.ts.
 *
 * This builder is pure: NO live fetch, NO real network, NO smoke, NO Supabase, NO env
 * read, NO clock read (generatedAt is passed in or a fixed string), NO DB write, NO API
 * route, NO broker, NO order. It only DECLARES the locked timeout-fallback shape.
 *
 * See: docs/limited-live-fetch-timeout-boundary.md
 */

export interface TimeoutBoundaryContract {
  contractVersion: "TIMEOUT_BOUNDARY_LIMITED_LIVE_FETCH";
  mode: "OFFLINE_DETERMINISTIC_TIMEOUT_BOUNDARY";
  generatedAt: string;
  decision: "OFFLINE_DETERMINISTIC_TIMEOUT_OK";

  name: "Timeout Boundary Validator for Limited Live Fetch";

  // Offline / deterministic / timeout markers.
  offline: true;
  deterministic: true;
  timeoutBoundary: true;
  mockFetchOnly: true;
  realNetworkUsed: false;
  fetchMockRestored: true;
  setTimeoutRestored: true;
  timeoutAbortSafeFallback: true;
  receivedAtDeterministic: true;
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

export interface BuildTimeoutBoundaryContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

/**
 * Builds the timeout boundary contract. Reads no clock, no env, no network — a static
 * declaration of the offline, deterministic timeout/abort fallback validator's locked
 * state. decision is OFFLINE_DETERMINISTIC_TIMEOUT_OK; real network never used; live
 * fetch / smoke never performed; every operational / connection flag is false.
 */
export function buildTimeoutBoundaryContract(
  input: BuildTimeoutBoundaryContractInput = {},
): TimeoutBoundaryContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  return {
    contractVersion: "TIMEOUT_BOUNDARY_LIMITED_LIVE_FETCH",
    mode: "OFFLINE_DETERMINISTIC_TIMEOUT_BOUNDARY",
    generatedAt,
    decision: "OFFLINE_DETERMINISTIC_TIMEOUT_OK",

    name: "Timeout Boundary Validator for Limited Live Fetch",

    offline: true,
    deterministic: true,
    timeoutBoundary: true,
    mockFetchOnly: true,
    realNetworkUsed: false,
    fetchMockRestored: true,
    setTimeoutRestored: true,
    timeoutAbortSafeFallback: true,
    receivedAtDeterministic: true,
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
      "Timeout Boundary Validator for Limited Live Fetch",
      "OFFLINE_DETERMINISTIC_TIMEOUT_BOUNDARY",
      "offline deterministic timeout / abort fallback validation",
      "mocked fetch timeout / abort (faked 3000ms timer, no real wait)",
      "timeout / abort → safe disabled scaffold candidate",
      "receivedAt deterministic",
      "fetch mock restored after test",
      "setTimeout restored after test",
      "no real network",
      "no live fetch",
      "no smoke (manual only)",
      "no production data switch",
      "operationalUseAllowed=false",
      "productionReady=false",
    ],
  };
}
