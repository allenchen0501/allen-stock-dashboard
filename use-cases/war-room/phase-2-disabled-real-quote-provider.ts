/**
 * Phase 2 Disabled Real Quote Provider — INTERFACE ONLY, NOT CONNECTED
 *
 * A QuoteProvider implementation whose status is DISABLED. Its getQuote NEVER
 * performs a network call — it returns a deterministic "not connected" snapshot with
 * isRealData=false and operationalUseAllowed=false. No fetch, no Supabase, no env, no
 * broker, no order.
 */

import type {
  QuoteProvider,
  ReadonlyQuoteSnapshot,
  RealQuoteProviderId,
} from "./phase-2-locked-real-quote-contract";

const NOT_CONNECTED = "(not connected)";

/**
 * Builds a deterministic disabled / not-connected snapshot. No clock, no network —
 * numeric fields are null and isRealData is false.
 */
export function buildDisabledQuoteSnapshot(
  symbol: string,
  providerId: RealQuoteProviderId,
): ReadonlyQuoteSnapshot {
  return {
    symbol,
    market: "TW",
    sourceName: "disabled / not connected",
    sourceProvider: providerId,
    price: null,
    open: null,
    high: null,
    low: null,
    previousClose: null,
    volume: null,
    sourceTimestamp: NOT_CONNECTED,
    receivedAt: NOT_CONNECTED,
    isRealData: false,
    isStale: false,
    verificationStatus: "DISABLED",
    operationalUseAllowed: false,
  };
}

/**
 * Builds the disabled real quote provider. status is DISABLED; getQuote resolves to a
 * disabled snapshot WITHOUT any network call.
 */
export function buildDisabledRealQuoteProvider(): QuoteProvider {
  return {
    providerId: "disabled",
    providerName: "Disabled Real Quote Provider (interface only, not connected)",
    status: "DISABLED",
    supports: [],
    getQuote(symbol: string): Promise<ReadonlyQuoteSnapshot> {
      // No network call — return a deterministic disabled snapshot.
      return Promise.resolve(buildDisabledQuoteSnapshot(symbol, "disabled"));
    },
  };
}
