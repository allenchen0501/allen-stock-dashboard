/**
 * Golden Snapshot Contract Builder — OFFLINE DETERMINISTIC PARSER SNAPSHOT
 *
 * Pure deterministic contract describing the locked state of the limited live fetch
 * golden snapshot validator (success snapshot + baseline fallback + offline fallback
 * matrix). This lets the V73 Safety Chain CI Guard cover the golden snapshot at the flag
 * level. The file-level offline assertions live in
 * scripts/validate-limited-live-fetch-golden-snapshot.ts.
 *
 * This builder is pure: NO live fetch, NO smoke, NO network, NO Supabase, NO env read,
 * NO clock read (generatedAt is passed in or a fixed string), NO DB write, NO API route,
 * NO broker, NO order. It only DECLARES the locked, offline, deterministic shape.
 *
 * See: docs/limited-live-fetch-golden-snapshot.md, docs/limited-live-fetch-golden-fallback-matrix.md
 */

export interface GoldenSnapshotContract {
  contractVersion: "GOLDEN_SNAPSHOT_LIMITED_LIVE_FETCH";
  mode: "OFFLINE_DETERMINISTIC_PARSER_SNAPSHOT";
  generatedAt: string;
  decision: "OFFLINE_DETERMINISTIC_SNAPSHOT_OK";

  // Type / offline / deterministic / parser snapshot markers.
  type: "offline-deterministic-parser-snapshot";
  offline: true;
  deterministic: true;
  parserSnapshot: true;
  fixedNow: "2026-06-30T00:00:00.000Z";

  includesSuccessSnapshot: true;
  includesFallbackSnapshot: true;
  includesFallbackMatrix: true;
  fallbackMatrixCaseCount: 12;
  optionalFieldCaseCount: 2;

  // Approved scope (unchanged).
  approvedProvider: "TWSE_TPEX";
  symbol: "3019";
  channel: "tse_3019.tw";
  timeoutMs: 3000;
  maxRetries: 0;

  // Manual / live / production markers.
  smokeManualOnly: true;
  smokeInSafetyChain: false;
  smokeInvoked: false;
  liveFetchPerformed: false;
  productionDataSwitchAllowed: false;

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

export interface BuildGoldenSnapshotContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

/**
 * Builds the golden snapshot contract. Reads no clock, no env, no network — a static
 * declaration of the offline, deterministic parser snapshot's locked state. decision is
 * OFFLINE_DETERMINISTIC_SNAPSHOT_OK; live fetch / smoke never performed; production data
 * switch not allowed; every operational / connection flag is false.
 */
export function buildGoldenSnapshotContract(
  input: BuildGoldenSnapshotContractInput = {},
): GoldenSnapshotContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  return {
    contractVersion: "GOLDEN_SNAPSHOT_LIMITED_LIVE_FETCH",
    mode: "OFFLINE_DETERMINISTIC_PARSER_SNAPSHOT",
    generatedAt,
    decision: "OFFLINE_DETERMINISTIC_SNAPSHOT_OK",

    type: "offline-deterministic-parser-snapshot",
    offline: true,
    deterministic: true,
    parserSnapshot: true,
    fixedNow: "2026-06-30T00:00:00.000Z",

    includesSuccessSnapshot: true,
    includesFallbackSnapshot: true,
    includesFallbackMatrix: true,
    fallbackMatrixCaseCount: 12,
    optionalFieldCaseCount: 2,

    approvedProvider: "TWSE_TPEX",
    symbol: "3019",
    channel: "tse_3019.tw",
    timeoutMs: 3000,
    maxRetries: 0,

    smokeManualOnly: true,
    smokeInSafetyChain: false,
    smokeInvoked: false,
    liveFetchPerformed: false,
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
      "Golden Snapshot Validator for Limited Live Fetch",
      "OFFLINE_DETERMINISTIC_PARSER_SNAPSHOT",
      "offline deterministic parser snapshot",
      "success snapshot + baseline fallback + fallback matrix",
      "fixed now 2026-06-30T00:00:00.000Z",
      "no live fetch",
      "no smoke (manual only)",
      "smoke not in safety chain",
      "no production data switch",
      "operationalUseAllowed=false",
      "productionReady=false",
      "approved provider TWSE_TPEX, symbol 3019, channel tse_3019.tw",
    ],
  };
}
