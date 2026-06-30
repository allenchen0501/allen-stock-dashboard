/**
 * Staging Shadow Runtime Comparison Builder — SCAFFOLD ONLY, NOT CONNECTED
 *
 * Pure deterministic builders for the staging read-only shadow runtime scaffold. NO
 * live fetch, NO env read, NO Supabase, NO DB write, NO API route, NO order, NO
 * broker. Every candidate is scaffold-only / not connected; the contract decision is
 * NO_GO; default real data mode is fixture; service role is forbidden.
 */

import {
  buildYahooReadonlyProviderScaffold,
  buildYahooScaffoldCandidate,
} from "../../services/market-data/yahoo-readonly-provider";
import {
  buildTwseTpexVerificationProviderScaffold,
} from "../../services/market-data/twse-tpex-verification-provider";
import {
  STAGING_SHADOW_RUNTIME_SAFETY_LABELS,
} from "../../services/market-data/public-quote-provider.types";
import type {
  PublicQuoteProvider,
  PublicQuoteProviderId,
  PublicReadonlyQuoteCandidate,
  ShadowRuntimeComparison,
  StagingShadowRuntimeContract,
  StagingShadowRuntimeValidation,
} from "../../services/market-data/public-quote-provider.types";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const SCAFFOLD = "(scaffold-only / not connected)";

export interface BuildStagingShadowRuntimeContractInput {
  generatedAt?: string;
}

/** A scaffold-only candidate for any provider. No clock, no network. */
export function buildScaffoldOnlyQuoteCandidate(
  symbol: string,
  providerId: PublicQuoteProviderId,
): PublicReadonlyQuoteCandidate {
  return {
    symbol,
    market: "TW",
    providerId,
    providerName: `${providerId} (scaffold-only, not connected)`,
    price: null,
    open: null,
    high: null,
    low: null,
    previousClose: null,
    volume: null,
    sourceTimestamp: SCAFFOLD,
    receivedAt: SCAFFOLD,
    isRealData: false,
    isConnected: false,
    isDisabled: true,
    verificationStatus: "SCAFFOLD_ONLY",
    operationalUseAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };
}

/** A fixture (mock) candidate — the default, primary source. */
function buildFixtureCandidate(symbol: string): PublicReadonlyQuoteCandidate {
  return {
    symbol,
    market: "TW",
    providerId: "disabled",
    providerName: "fixture / mock_or_contract",
    price: 100,
    open: 99,
    high: 101,
    low: 98,
    previousClose: 99.5,
    volume: 1000,
    sourceTimestamp: "fixture",
    receivedAt: "fixture",
    isRealData: false,
    isConnected: false,
    isDisabled: true,
    verificationStatus: "NOT_CONNECTED",
    operationalUseAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };
}

export { buildYahooReadonlyProviderScaffold, buildTwseTpexVerificationProviderScaffold };

/**
 * Builds a shadow runtime comparison between a fixture quote and a real quote
 * candidate. In scaffold mode the real candidate is never real data, so the result is
 * non-operational and downgrades — mapping back to the V67 / V68 / V69 chain. Live
 * fetch / env / Supabase / api-route / portfolio-switch flags are all false.
 */
export function buildShadowRuntimeComparison(
  fixtureQuote: PublicReadonlyQuoteCandidate,
  realQuoteCandidate: PublicReadonlyQuoteCandidate,
): ShadowRuntimeComparison {
  const missing = realQuoteCandidate.isRealData !== true || realQuoteCandidate.isConnected !== true;
  const downgradeReason = missing
    ? "real quote candidate scaffold-only / not connected → 對應 V67 SOURCE_CONFLICT / V68 MISSING_DATA / V69 SHOW_BLOCKED_MISSING_DATA（observation only，non-operational）。"
    : "scaffold 對照（仍 observation only，不可作為正式操作依據）。";

  return {
    symbol: fixtureQuote.symbol,
    fixtureQuote,
    realQuoteCandidate,
    runtimeStatus: "SCAFFOLD_ONLY_NOT_CONNECTED",
    decision: "NO_GO",
    liveFetchPerformed: false,
    envReadPerformed: false,
    supabaseConnected: false,
    apiRouteCreated: false,
    portfolioApiSwitched: false,
    operationalUseAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionReady: false,
    mapsToV67V68V69: true,
    downgradeReason,
  };
}

/** Validates the staging shadow runtime contract invariants. */
export function validateStagingShadowRuntimeContract(
  contract: StagingShadowRuntimeContract,
): StagingShadowRuntimeValidation {
  const yahoo = buildYahooReadonlyProviderScaffold();
  const twse = buildTwseTpexVerificationProviderScaffold();
  const sc = contract.sampleComparison;
  const providersScaffoldOnly =
    (yahoo.runtimeStatus === "NOT_CONNECTED" || yahoo.runtimeStatus === "SCAFFOLD_ONLY") &&
    (twse.runtimeStatus === "NOT_CONNECTED" || twse.runtimeStatus === "SCAFFOLD_ONLY");

  const v: StagingShadowRuntimeValidation = {
    contractVersionScaffold: contract.contractVersion === "STAGING_SHADOW_RUNTIME_SCAFFOLD",
    modeScaffoldNotConnected: contract.mode === "SCAFFOLD_ONLY_NOT_CONNECTED",
    decisionNoGo: contract.decision === "NO_GO",
    defaultModeFixture: contract.defaultRealDataMode === "fixture",
    shadowRuntimeLocked: contract.shadowRuntimeAllowed === false,
    liveFetchLocked: contract.liveFetchAllowed === false,
    envReadLocked: contract.envReadAllowed === false,
    supabaseConnectionLocked: contract.supabaseConnectionAllowed === false,
    apiRouteLocked: contract.apiRouteAllowed === false,
    portfolioApiSwitchLocked: contract.portfolioApiSwitchAllowed === false,
    productionNotReady: contract.productionReady === false,
    serviceRoleForbidden: contract.serviceRoleForbidden === true,
    brokerApiLocked: contract.brokerApiAllowed === false,
    noBuySellCommand: contract.buySellCommandGenerated === false,
    noAutoOrder: contract.autoOrderRequested === false,
    providersScaffoldOnly,
    comparisonNonOperational: sc.operationalUseAllowed === false && sc.decision === "NO_GO",
    comparisonMapsToDowngrade: sc.mapsToV67V68V69 === true,
    valid: false,
  };
  v.valid = Object.entries(v).every(([k, val]) => k === "valid" || val === true);
  return v;
}

/**
 * Builds the staging shadow runtime contract. Reads no clock, no env, no network —
 * only the scaffold providers + a sample fixture-vs-scaffold comparison. Everything
 * stays NO_GO / scaffold-only / not connected.
 */
export function buildStagingShadowRuntimeContract(
  input: BuildStagingShadowRuntimeContractInput = {},
): StagingShadowRuntimeContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const yahoo: PublicQuoteProvider = buildYahooReadonlyProviderScaffold();
  const twse: PublicQuoteProvider = buildTwseTpexVerificationProviderScaffold();

  const fixtureQuote = buildFixtureCandidate("2330");
  const realCandidate = buildYahooScaffoldCandidate("2330");
  const sampleComparison = buildShadowRuntimeComparison(fixtureQuote, realCandidate);

  const contract: StagingShadowRuntimeContract = {
    contractVersion: "STAGING_SHADOW_RUNTIME_SCAFFOLD",
    mode: "SCAFFOLD_ONLY_NOT_CONNECTED",
    generatedAt,
    decision: "NO_GO",

    defaultRealDataMode: "fixture",
    shadowRuntimeAllowed: false,
    liveFetchAllowed: false,
    envReadAllowed: false,
    supabaseConnectionAllowed: false,
    apiRouteAllowed: false,
    portfolioApiSwitchAllowed: false,
    productionReady: false,
    serviceRoleForbidden: true,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    brokerApiAllowed: false,

    providerCatalog: [
      { providerId: yahoo.providerId, runtimeStatus: yahoo.runtimeStatus },
      { providerId: twse.providerId, runtimeStatus: twse.runtimeStatus },
      { providerId: "disabled", runtimeStatus: "DISABLED" },
    ],
    sampleComparison,
    validation: {
      contractVersionScaffold: true,
      modeScaffoldNotConnected: true,
      decisionNoGo: true,
      defaultModeFixture: true,
      shadowRuntimeLocked: true,
      liveFetchLocked: true,
      envReadLocked: true,
      supabaseConnectionLocked: true,
      apiRouteLocked: true,
      portfolioApiSwitchLocked: true,
      productionNotReady: true,
      serviceRoleForbidden: true,
      brokerApiLocked: true,
      noBuySellCommand: true,
      noAutoOrder: true,
      providersScaffoldOnly: true,
      comparisonNonOperational: true,
      comparisonMapsToDowngrade: true,
      valid: true,
    },

    safetyLabels: [...STAGING_SHADOW_RUNTIME_SAFETY_LABELS],
  };

  contract.validation = validateStagingShadowRuntimeContract(contract);
  return contract;
}
