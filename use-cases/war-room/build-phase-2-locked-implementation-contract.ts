/**
 * Phase 2 Locked Implementation Contract Builder — INTERFACE ONLY, NOT CONNECTED
 *
 * Pure deterministic builder. Assembles the locked-interface contract from the
 * disabled provider + a sample shadow comparison, and self-validates. No runtime
 * connection, no fetch, no Supabase, no env, no DB, no API route, no broker, no order.
 * Default real data mode is "fixture"; shadow / real-readonly are locked; decision is
 * NO_GO.
 */

import {
  buildDisabledQuoteSnapshot,
  buildDisabledRealQuoteProvider,
} from "./phase-2-disabled-real-quote-provider";
import {
  PHASE_2_LOCKED_IMPLEMENTATION_SAFETY_LABELS,
} from "./phase-2-locked-real-quote-contract";
import type {
  Phase2LockedImplementationContract,
  Phase2LockedImplementationValidation,
  ReadonlyQuoteSnapshot,
  ShadowQuoteComparison,
} from "./phase-2-locked-real-quote-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildPhase2LockedImplementationContractInput {
  generatedAt?: string;
}

/** A fixture (mock) snapshot — the default, non-real source. */
function buildFixtureSnapshot(symbol: string): ReadonlyQuoteSnapshot {
  return {
    symbol,
    market: "TW",
    sourceName: "fixture / mock_or_contract",
    sourceProvider: "disabled",
    price: 100,
    open: 99,
    high: 101,
    low: 98,
    previousClose: 99.5,
    volume: 1000,
    sourceTimestamp: "fixture",
    receivedAt: "fixture",
    isRealData: false,
    isStale: false,
    verificationStatus: "FIXTURE_ONLY",
    operationalUseAllowed: false,
  };
}

/**
 * Builds a shadow comparison between a fixture quote and a real quote candidate. When
 * the real candidate is not real data (disabled / not connected), missingRealQuote is
 * true and the comparison downgrades — mapping back to the V67 / V68 / V69 chain. The
 * comparison is always operationalUseAllowed=false.
 */
export function buildShadowQuoteComparison(
  fixtureQuote: ReadonlyQuoteSnapshot,
  realQuoteCandidate: ReadonlyQuoteSnapshot,
): ShadowQuoteComparison {
  const missingRealQuote = realQuoteCandidate.isRealData !== true || realQuoteCandidate.price === null;
  const priceDifference =
    !missingRealQuote && fixtureQuote.price !== null && realQuoteCandidate.price !== null
      ? Math.round((realQuoteCandidate.price - fixtureQuote.price) * 100) / 100
      : null;
  const priceDifferencePercent =
    priceDifference !== null && fixtureQuote.price !== null && fixtureQuote.price !== 0
      ? Math.round((priceDifference / fixtureQuote.price) * 10000) / 100
      : null;
  const staleDetected = realQuoteCandidate.isStale === true;
  const conflictDetected = !missingRealQuote && priceDifference !== null && Math.abs(priceDifference) > 0;

  const downgradeReason = missingRealQuote
    ? "real quote missing / not connected → 對應 V67 SOURCE_CONFLICT / V68 MISSING_DATA / V69 SHOW_BLOCKED_MISSING_DATA（observation only）。"
    : staleDetected
      ? "real quote stale → 對應 V68 STALE_DATA / V69 SHOW_BLOCKED_STALE_DATA（observation only）。"
      : conflictDetected
        ? "fixture vs real 數值差異 → 對應 V67 conflict / V68 SOURCE_CONFLICT / V69 SHOW_BLOCKED_CONFLICT（observation only）。"
        : "shadow 對照一致（仍 observation only，不可作為正式操作依據）。";

  return {
    symbol: fixtureQuote.symbol,
    fixtureQuote,
    realQuoteCandidate,
    priceDifference,
    priceDifferencePercent,
    timestampDifferenceSeconds: null,
    conflictDetected,
    staleDetected,
    missingRealQuote,
    downgradeReason,
    mapsToV67V68V69: true,
    operationalUseAllowed: false,
  };
}

/** Validates the locked-interface contract invariants. */
export function validatePhase2LockedImplementationContract(
  contract: Phase2LockedImplementationContract,
): Phase2LockedImplementationValidation {
  const disabledProvider = buildDisabledRealQuoteProvider();
  const disabledSnapshot = buildDisabledQuoteSnapshot("2330", "disabled");
  const sc = contract.sampleShadowComparison;

  const v: Phase2LockedImplementationValidation = {
    contractVersionLocked: contract.contractVersion === "PHASE_2_LOCKED_INTERFACE",
    modeInterfaceOnly: contract.mode === "INTERFACE_ONLY_NOT_CONNECTED",
    decisionNoGo: contract.decision === "NO_GO",
    defaultModeFixture: contract.defaultRealDataMode === "fixture",
    shadowModeLocked: contract.shadowModeAllowed === false,
    realReadonlyLocked: contract.realReadonlyAllowed === false,
    allConnectionFlagsFalse:
      contract.realDataConnected === false &&
      contract.fetchPerformed === false &&
      contract.envReadPerformed === false &&
      contract.supabaseConnected === false &&
      contract.apiRouteCreated === false &&
      contract.portfolioApiSwitched === false &&
      contract.buySellCommandGenerated === false &&
      contract.autoOrderRequested === false &&
      contract.productionReady === false,
    disabledProviderIsDisabled: disabledProvider.status === "DISABLED",
    disabledSnapshotNotRealData: disabledSnapshot.isRealData === false,
    disabledSnapshotOperationalUseFalse: disabledSnapshot.operationalUseAllowed === false,
    shadowComparisonOperationalUseFalse: sc.operationalUseAllowed === false,
    shadowComparisonMapsToDowngrade: sc.mapsToV67V68V69 === true,
    valid: false,
  };
  v.valid = Object.entries(v).every(([k, val]) => k === "valid" || val === true);
  return v;
}

/**
 * Builds the Phase 2 locked implementation contract. Reads no clock, no env, no
 * network — only the disabled provider + a sample fixture-vs-disabled shadow
 * comparison. Everything stays NO_GO / interface-only.
 */
export function buildPhase2LockedImplementationContract(
  input: BuildPhase2LockedImplementationContractInput = {},
): Phase2LockedImplementationContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const fixtureQuote = buildFixtureSnapshot("2330");
  const disabledRealCandidate = buildDisabledQuoteSnapshot("2330", "disabled");
  const sampleShadowComparison = buildShadowQuoteComparison(fixtureQuote, disabledRealCandidate);

  const contract: Phase2LockedImplementationContract = {
    contractVersion: "PHASE_2_LOCKED_INTERFACE",
    mode: "INTERFACE_ONLY_NOT_CONNECTED",
    generatedAt,
    decision: "NO_GO",

    defaultRealDataMode: "fixture",
    shadowModeAllowed: false,
    realReadonlyAllowed: false,

    realDataConnected: false,
    fetchPerformed: false,
    envReadPerformed: false,
    supabaseConnected: false,
    apiRouteCreated: false,
    portfolioApiSwitched: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionReady: false,

    providerCatalog: [
      { providerId: "yahoo", status: "PLANNED" },
      { providerId: "twse", status: "PLANNED" },
      { providerId: "tpex", status: "PLANNED" },
      { providerId: "mixed-public", status: "PLANNED" },
      { providerId: "disabled", status: "DISABLED" },
    ],
    sampleShadowComparison,
    validation: {
      contractVersionLocked: true,
      modeInterfaceOnly: true,
      decisionNoGo: true,
      defaultModeFixture: true,
      shadowModeLocked: true,
      realReadonlyLocked: true,
      allConnectionFlagsFalse: true,
      disabledProviderIsDisabled: true,
      disabledSnapshotNotRealData: true,
      disabledSnapshotOperationalUseFalse: true,
      shadowComparisonOperationalUseFalse: true,
      shadowComparisonMapsToDowngrade: true,
      valid: true,
    },

    safetyLabels: [...PHASE_2_LOCKED_IMPLEMENTATION_SAFETY_LABELS],
  };

  contract.validation = validatePhase2LockedImplementationContract(contract);
  return contract;
}
