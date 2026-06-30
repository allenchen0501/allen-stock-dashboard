# Limited Live Fetch — Offline Mock Fetch Boundary Validation

## Purpose

- **offline mock fetch boundary validation** — monkey-patch `globalThis.fetch` with a
  canned mock, drive the real entry function `getTwseTpexLimitedLiveFetchCandidate`, and
  assert the request boundary (approved channel / GET) and safe fallback behavior.

## How it stays safe

- **no real network** — the mock never calls the original `fetch`; it returns canned
  responses only. A guard flag flips if any non-approved URL is requested (it never does).
- **no manual smoke** — the smoke script is not invoked and is not a CI condition.
- **fixed now clock** — `() => new Date("2026-06-30T00:00:00.000Z")` is injected, so
  `receivedAt` is deterministic.
- **mocked TWSE response** — `ch=tse_3019.tw, c=3019, n=亞光, z=142.5, o=140.5, h=142.5,
  l=139.5, y=138, v=3010, d=20260630, t=14:30:00` plus `tlong` (epoch ms for
  2026-06-30T06:30:00.000Z).
- the fetch mock is **restored** to the original after the test.

## Boundary cases

1. **approved channel request assertion** — success case: `fetch` called exactly once,
   URL contains `ex_ch=tse_3019.tw`, method GET, no Yahoo / Supabase / broker /
   `/api/portfolio`. Candidate: symbol=3019, price=142.5,
   sourceTimestamp=2026-06-30T06:30:00.000Z, receivedAt=2026-06-30T00:00:00.000Z,
   verificationStatus=LIVE_FETCH_DRY_RUN, isRealData=true, isConnected=true,
   isDisabled=false, operationalUseAllowed=false, buySellCommandGenerated=false,
   autoOrderRequested=false.
2. **unsupported symbol boundary** — `9999` never triggers fetch and returns a safe,
   non-operational disabled candidate.
3. **fetch error fallback** — a rejected fetch falls back to the disabled scaffold
   candidate (deterministic receivedAt, non-operational).
4. **malformed response fallback** — a response without `msgArray` (and a `json()` that
   throws) falls back to the disabled scaffold candidate, non-operational.

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

- **validator remains standalone initially** — `test:limited-live-fetch-mock-fetch-boundary`
  is NOT added to `npm run test:safety-chain`.
- **golden validator remains in safety-chain** — unchanged.
- **safety-chain remains 19 checks** — this version adds no chain entry.
