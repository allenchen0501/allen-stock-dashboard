/**
 * TWSE / TPEx Verification Provider — SCAFFOLD ONLY, NOT CONNECTED
 *
 * A PublicQuoteProvider scaffold for the future official (TWSE / TPEx) verification
 * layer. getReadonlyQuoteCandidate performs NO network call — it returns a
 * scaffold-only / not-connected candidate (isRealData=false, isConnected=false,
 * isDisabled=true). No fetch, no env read, no Supabase, no DB write, no API route, no
 * order, no broker.
 */

import type {
  PublicQuoteProvider,
  PublicReadonlyQuoteCandidate,
} from "./public-quote-provider.types";

const SCAFFOLD = "(scaffold-only / not connected)";

/** Deterministic scaffold-only verification candidate. No clock, no network. */
export function buildTwseTpexScaffoldCandidate(symbol: string): PublicReadonlyQuoteCandidate {
  return {
    symbol,
    market: "TW",
    providerId: "mixed-public",
    providerName: "TWSE / TPEx verification provider (scaffold-only, not connected)",
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
 * Builds the TWSE / TPEx verification provider scaffold. runtimeStatus is
 * NOT_CONNECTED; getReadonlyQuoteCandidate resolves to a scaffold candidate WITHOUT
 * any network call.
 */
export function buildTwseTpexVerificationProviderScaffold(): PublicQuoteProvider {
  return {
    providerId: "mixed-public",
    providerName: "TWSE / TPEx verification provider (scaffold-only, not connected)",
    runtimeStatus: "NOT_CONNECTED",
    capabilities: ["OFFICIAL_VERIFICATION_CANDIDATE", "NO_ORDER", "NO_BROKER", "NO_WRITE"],
    getReadonlyQuoteCandidate(symbol: string): Promise<PublicReadonlyQuoteCandidate> {
      // No network call — scaffold only.
      return Promise.resolve(buildTwseTpexScaffoldCandidate(symbol));
    },
  };
}
