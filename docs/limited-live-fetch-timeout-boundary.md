# Limited Live Fetch — Offline Timeout / Abort Boundary Validation

## Purpose

- **offline timeout / abort boundary validation** — prove the limited live fetch entry
  function falls back safely when the request times out or aborts, and never produces an
  operational quote.

## How it stays safe

- **no real network** — `globalThis.fetch` is mocked; the mock never calls the original.
- **no manual smoke** — the smoke script is not invoked and is not a CI condition.
- **mocked fetch timeout / abort** — two scenarios:
  1. **real abort path** — the provider's 3000ms abort `setTimeout` is faked to fire on a
     microtask, so the internal `AbortController` actually aborts; the signal-aware mock
     fetch (which otherwise hangs) rejects with an `AbortError`.
  2. **immediate AbortError** — the mock fetch rejects immediately with an `AbortError`.
- **no real waiting** — the abort fires on a microtask, so the test never waits the real
  3000ms (and never longer).
- **timeoutMs=3000 / maxRetries=0** — unchanged in the provider (single attempt, no retry).
- the fetch + setTimeout patches are **restored** after the test.

## Expected result: safe fallback only

Both scenarios return the disabled scaffold candidate:
`symbol=3019`, `isRealData=false`, `isConnected=false`, `isDisabled=true`,
`operationalUseAllowed=false`, `buySellCommandGenerated=false`, `autoOrderRequested=false`.
`receivedAt` is **deterministic** (`2026-06-30T00:00:00.000Z`, injected clock). The
candidate is never production ready (`productionReady` is not a candidate field; the
contract-level guard keeps `productionReady=false`).

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

- **timeout validator remains standalone initially** —
  `test:limited-live-fetch-timeout-boundary` is NOT added to `npm run test:safety-chain`.
- **safety-chain remains 21 checks** — this version adds no chain entry.
