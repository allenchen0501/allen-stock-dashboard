# Limited Live Fetch — Default No-Fetch Boundary Validation

## Purpose

- **default runtime path must not fetch** — prove that without an explicit
  `dryRunLiveFetch: true`, the limited live fetch provider never touches the network,
  even for the approved symbol 3019. The default path stays in the scaffold / fixture /
  disabled safe state.

## How it stays safe

- **no real network** — `globalThis.fetch` is spied; the default path never calls it. A
  guard flag flips if fetch is ever invoked (it never is).
- **no manual smoke** — the smoke script is not invoked and is not a CI condition.
- **dryRunLiveFetch default=false** — `getReadonlyQuoteCandidate(symbol)` defaults to
  `dryRunLiveFetch=false`; live fetch only happens on an explicit opt-in.
- the fetch spy is **restored** to the original after the test.

## Boundary cases

1. **default path fetch call count = 0** — `provider.getReadonlyQuoteCandidate("3019")`
   (no options) → 0 fetch calls; safe disabled, non-operational candidate (symbol=3019).
2. **explicit dryRunLiveFetch=false fetch call count = 0** —
   `provider.getReadonlyQuoteCandidate("3019", { dryRunLiveFetch: false, now })` → 0 fetch
   calls; safe disabled candidate with deterministic `receivedAt`.
3. **unsupported symbol default path safe fallback** —
   `provider.getReadonlyQuoteCandidate("9999", { now })` → 0 fetch calls; safe disabled
   candidate.

All results are **safe scaffold / disabled / non-operational**:
`isRealData=false`, `isConnected=false`, `isDisabled=true`,
`operationalUseAllowed=false`, `buySellCommandGenerated=false`, `autoOrderRequested=false`.
(The candidate is never production ready — `productionReady` is not a candidate field;
the contract-level guard keeps `productionReady=false`.)

## Scope guarantees (unchanged)

- no provider runtime modification
- no provider expansion
- no new symbol（仍只 3019）
- no Yahoo
- no API route
- no /api/portfolio switch
- no Supabase
- no process.env
- no broker API
- no trading signal
- no auto order
- not production ready
- approved channel tse_3019.tw, timeoutMs=3000, maxRetries=0, GET only

## Safety chain placement

- **validator remains standalone initially** —
  `test:limited-live-fetch-default-no-fetch-boundary` is NOT added to
  `npm run test:safety-chain`.
- **golden validator remains in safety-chain** — unchanged.
- **mock fetch boundary validator remains in safety-chain** — unchanged.
- **safety-chain remains 20 checks** — this version adds no chain entry.
