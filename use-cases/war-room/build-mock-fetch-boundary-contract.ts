/**
 * Mock Fetch Boundary Contract Builder — OFFLINE DETERMINISTIC REQUEST BOUNDARY
 *
 * Pure deterministic contract describing the locked state of the limited live fetch
 * offline mock fetch boundary validator (mocked fetch only; approved-channel request
 * assertion; unsupported-symbol / fetch-error / malformed-response safe fallbacks). This
 * lets the V73 Safety Chain CI Guard cover the boundary at the flag level. The actual
 * mock-fetch assertions live in scripts/validate-limited-live-fetch-mock-fetch-boundary.ts.
 *
 * This builder is pure: NO live fetch, NO real network, NO smoke, NO Supabase, NO env
 * read, NO clock read (generatedAt is passed in or a fixed string), NO DB write, NO API
 * route, NO broker, NO order. It only DECLARES the locked offline boundary shape.
 *
 * See: docs/limited-live-fetch-mock-fetch-boundary.md
 */

export interface MockFetchBoundaryContract {
  contractVersion: "MOCK_FETCH_BOUNDARY_LIMITED_LIVE_FETCH";
  mode: "OFFLINE_DETERMINISTIC_REQUEST_BOUNDARY";
  generatedAt: string;
  decision: "OFFLINE_DETERMINISTIC_BOUNDARY_OK";

  name: "Mock Fetch Boundary Validator for Limited Live Fetch";

  // Offline / deterministic markers.
  offline: true;
  deterministic: true;
  mockFetchOnly: true;
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

  // Boundary outcomes asserted by the validator.
  fetchCalledOnceForSuccessCase: true;
  unsupportedSymbolSafeFallback: true;
  fetchErrorSafeFallback: true;
  malformedResponseSafeFallback: true;

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

export interface BuildMockFetchBoundaryContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

/**
 * Builds the mock fetch boundary contract. Reads no clock, no env, no network — a static
 * declaration of the offline, deterministic request-boundary validator's locked state.
 * decision is OFFLINE_DETERMINISTIC_BOUNDARY_OK; real network never used; live fetch /
 * smoke never performed; every operational / connection flag is false.
 */
export function buildMockFetchBoundaryContract(
  input: BuildMockFetchBoundaryContractInput = {},
): MockFetchBoundaryContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  return {
    contractVersion: "MOCK_FETCH_BOUNDARY_LIMITED_LIVE_FETCH",
    mode: "OFFLINE_DETERMINISTIC_REQUEST_BOUNDARY",
    generatedAt,
    decision: "OFFLINE_DETERMINISTIC_BOUNDARY_OK",

    name: "Mock Fetch Boundary Validator for Limited Live Fetch",

    offline: true,
    deterministic: true,
    mockFetchOnly: true,
    realNetworkUsed: false,
    fetchMockRestored: true,
    liveFetchPerformed: false,
    smokeInvoked: false,
    smokeManualOnly: true,

    approvedSymbol: "3019",
    approvedChannel: "tse_3019.tw",
    timeoutMs: 3000,
    maxRetries: 0,

    fetchCalledOnceForSuccessCase: true,
    unsupportedSymbolSafeFallback: true,
    fetchErrorSafeFallback: true,
    malformedResponseSafeFallback: true,

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
      "Mock Fetch Boundary Validator for Limited Live Fetch",
      "OFFLINE_DETERMINISTIC_REQUEST_BOUNDARY",
      "mock fetch only — no real network",
      "fetch mock restored after test",
      "approved channel tse_3019.tw request assertion",
      "fetch called once for success case",
      "unsupported symbol safe fallback",
      "fetch error safe fallback",
      "malformed response safe fallback",
      "no live fetch",
      "no smoke (manual only)",
      "no production data switch",
      "operationalUseAllowed=false",
      "productionReady=false",
    ],
  };
}
