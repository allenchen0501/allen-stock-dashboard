/**
 * Yahoo Read-only Provider — SCAFFOLD ONLY, NOT CONNECTED
 *
 * A PublicQuoteProvider scaffold for the future Yahoo read-only public quote source.
 * getReadonlyQuoteCandidate performs NO network call — it returns a scaffold-only /
 * not-connected candidate (isRealData=false, isConnected=false, isDisabled=true). No
 * fetch, no env read, no Supabase, no DB write, no API route, no order, no broker.
 */

import type {
  PublicQuoteProvider,
  PublicReadonlyQuoteCandidate,
} from "./public-quote-provider.types";

const SCAFFOLD = "(scaffold-only / not connected)";

/** Deterministic scaffold-only candidate. No clock, no network — numbers are null. */
export function buildYahooScaffoldCandidate(symbol: string): PublicReadonlyQuoteCandidate {
  return {
    symbol,
    market: "TW",
    providerId: "yahoo",
    providerName: "Yahoo read-only provider (scaffold-only, not connected)",
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

/**
 * Builds the Yahoo read-only provider scaffold. runtimeStatus is NOT_CONNECTED;
 * getReadonlyQuoteCandidate resolves to a scaffold candidate WITHOUT any network call.
 */
export function buildYahooReadonlyProviderScaffold(): PublicQuoteProvider {
  return {
    providerId: "yahoo",
    providerName: "Yahoo read-only provider (scaffold-only, not connected)",
    runtimeStatus: "NOT_CONNECTED",
    capabilities: ["READONLY_QUOTE_CANDIDATE", "NO_ORDER", "NO_BROKER", "NO_WRITE"],
    getReadonlyQuoteCandidate(symbol: string): Promise<PublicReadonlyQuoteCandidate> {
      // No network call — scaffold only.
      return Promise.resolve(buildYahooScaffoldCandidate(symbol));
    },
  };
}
