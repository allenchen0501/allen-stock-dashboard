/**
 * Phase 2b Shadow Comparison UI Shell — View Model (fixture-only, disabled real data)
 *
 * Pure deterministic view model for the shadow comparison UI shell. The real quote
 * candidate is ALWAYS the DisabledRealQuoteProvider snapshot — there is no runtime
 * connection. No fetch, no Supabase, no env, no DB, no API route, no broker, no order.
 * decision stays NO_GO; mode INTERFACE_ONLY_NOT_CONNECTED; operationalUseAllowed=false.
 */

import { buildPhase2LockedImplementationContract } from "./build-phase-2-locked-implementation-contract";
import { buildDisabledRealQuoteProvider } from "./phase-2-disabled-real-quote-provider";
import type {
  ReadonlyQuoteSnapshot,
  RealQuoteProviderStatus,
} from "./phase-2-locked-real-quote-contract";

export interface BuildShadowQuoteComparisonViewModelInput {
  generatedAt?: string;
}

export interface ShadowQuoteComparisonViewModel {
  title: "Phase 2b Shadow Comparison UI Shell";
  contractVersion: string;
  mode: string;
  decision: string;
  defaultRealDataMode: string;

  realQuoteCandidateStatus: RealQuoteProviderStatus;

  operationalUseAllowed: false;
  realDataConnected: false;
  fetchPerformed: false;
  envReadPerformed: false;
  supabaseConnected: false;
  apiRouteCreated: false;
  portfolioApiSwitched: false;
  productionReady: false;
  mapsToV67V68V69: true;

  symbol: string;
  fixtureQuote: ReadonlyQuoteSnapshot;
  realQuoteCandidate: ReadonlyQuoteSnapshot;
  priceDifference: number | null;
  priceDifferencePercent: number | null;
  staleDetected: boolean;
  missingRealQuote: boolean;
  conflictDetected: boolean;
  downgradeReason: string;

  shellNotes: string[];
}

/**
 * Builds the shadow comparison view model. Reads no clock, no env, no network — only
 * the Phase 2 locked contract + the disabled provider. The real quote candidate is
 * fixed to the disabled (not-connected) snapshot.
 */
export function buildShadowQuoteComparisonViewModel(
  input: BuildShadowQuoteComparisonViewModelInput = {},
): ShadowQuoteComparisonViewModel {
  const contract = buildPhase2LockedImplementationContract(input);
  const provider = buildDisabledRealQuoteProvider();
  const sc = contract.sampleShadowComparison;

  return {
    title: "Phase 2b Shadow Comparison UI Shell",
    contractVersion: contract.contractVersion,
    mode: contract.mode,
    decision: contract.decision,
    defaultRealDataMode: contract.defaultRealDataMode,

    realQuoteCandidateStatus: provider.status,

    operationalUseAllowed: false,
    realDataConnected: false,
    fetchPerformed: false,
    envReadPerformed: false,
    supabaseConnected: false,
    apiRouteCreated: false,
    portfolioApiSwitched: false,
    productionReady: false,
    mapsToV67V68V69: true,

    symbol: sc.symbol,
    fixtureQuote: sc.fixtureQuote,
    realQuoteCandidate: sc.realQuoteCandidate,
    priceDifference: sc.priceDifference,
    priceDifferencePercent: sc.priceDifferencePercent,
    staleDetected: sc.staleDetected,
    missingRealQuote: sc.missingRealQuote,
    conflictDetected: sc.conflictDetected,
    downgradeReason: sc.downgradeReason,

    shellNotes: [
      "This is UI shell only",
      "Real quote is disabled",
      "Fixture remains default",
      "No trading decision",
      "No buy/sell command",
      "No auto order",
      "Not production ready",
    ],
  };
}
