/**
 * Manual smoke script — Limited Live Fetch Dry-run for symbol 3019 ONLY.
 *
 * This is a MANUAL, opt-in script. It is NOT part of `test:safety-chain`.
 * It calls the approved TWSE/TPEx provider's limited live fetch dry-run for 3019 and
 * prints the resulting candidate. On ANY failure (network, source, schema, timeout)
 * the provider returns the disabled scaffold candidate — this script never throws
 * uncaught and never fails the build.
 *
 * It does NOT: read env, connect to Supabase, write to a DB, call an API route, or
 * emit any buy/sell recommendation. shadow-only / non-operational.
 *
 * Run: npm run smoke:limited-live-fetch:3019
 */

export {};

const provider = require("../services/market-data/twse-tpex-verification-provider") as typeof import("../services/market-data/twse-tpex-verification-provider");

const SYMBOL = "3019";

async function main(): Promise<void> {
  const candidate = await provider.getTwseTpexLimitedLiveFetchCandidate(SYMBOL);
  const live = candidate.isRealData && candidate.isConnected && !candidate.isDisabled;

  console.log("Limited Live Fetch Dry-run smoke (shadow-only, non-operational)");
  console.log("---------------------------------------------------------------");
  console.log(`outcome:               ${live ? "LIVE_FETCH_OK" : "FALLBACK_SCAFFOLD"}`);
  console.log(`sourceName:            ${candidate.providerName}`);
  console.log(`symbol:                ${candidate.symbol}`);
  console.log(`price:                 ${String(candidate.price)}`);
  console.log(`open/high/low/prev:    ${String(candidate.open)} / ${String(candidate.high)} / ${String(candidate.low)} / ${String(candidate.previousClose)}`);
  console.log(`volume:                ${String(candidate.volume)}`);
  console.log(`sourceTimestamp:       ${candidate.sourceTimestamp}`);
  console.log(`receivedAt:            ${candidate.receivedAt}`);
  console.log(`verificationStatus:    ${candidate.verificationStatus}`);
  console.log(`isRealData:            ${String(candidate.isRealData)}`);
  console.log(`isConnected:           ${String(candidate.isConnected)} (source fetch only — NOT operational)`);
  console.log(`operationalUseAllowed: ${String(candidate.operationalUseAllowed)}`);
  console.log(`buySellCommand:        ${String(candidate.buySellCommandGenerated)}`);
  console.log(`autoOrderRequested:    ${String(candidate.autoOrderRequested)}`);
  console.log("---------------------------------------------------------------");
  console.log("This is NOT a buy/sell command. Shadow-only dry-run. Not production ready.");
}

main().catch((err) => {
  // Should never happen — the provider already falls back on failure. Print and exit 0
  // so a network/source failure never breaks anything.
  console.log(`smoke encountered an unexpected error (treated as fallback): ${String(err)}`);
});
