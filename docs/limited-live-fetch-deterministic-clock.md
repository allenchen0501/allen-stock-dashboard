# Limited Live Fetch — Deterministic `receivedAt` Clock Injection

## Purpose

- **make receivedAt deterministic in tests** — the limited live fetch candidate (and the
  scaffold/fallback candidate) can take an optional injected clock so `receivedAt` is
  reproducible in golden snapshot tests.
- **runtime default unchanged** — no caller passes a clock, so production/runtime behavior
  is exactly as before (`receivedAt` = real `new Date()`; scaffold `receivedAt` = the
  scaffold placeholder).

## Design

- New optional options type `PublicReadonlyQuoteCandidateOptions = { dryRunLiveFetch?: boolean; now?: () => Date }`.
- **now injection optional** — `now` is optional; when omitted the real clock is used.
- `getReadonlyQuoteCandidate(symbol, options?)`, `getTwseTpexLimitedLiveFetchCandidate(symbol, options?)`,
  `parseLimitedLiveFetchResponse(symbol, json, now?)`, and `buildTwseTpexScaffoldCandidate(symbol, now?)`
  all accept the optional clock and thread it through every fallback path.
- `resolveNow(now)` returns `now()` if provided, else `new Date()`.

## Scope guarantees (unchanged)

- **no provider expansion** — still the single approved provider.
- **no new symbol** — symbol remains 3019 only.
- **no Yahoo** — no Yahoo provider added.
- **no API route** — no API route added.
- **no /api/portfolio switch** — `/api/portfolio` untouched.
- **no Supabase** — no Supabase / createClient.
- **no process.env** — no env read.
- **no broker API** — no broker call.
- **no trading signal** — quote never feeds a trade plan.
- **no auto order** — no auto order.
- **not production ready** — productionReady stays false; `isConnected` only means the
  source fetch succeeded (not operational).
- channel tse_3019.tw, timeout 3000ms, maxRetries 0, GET only — all unchanged.
- operationalUseAllowed=false, buySellCommandGenerated=false, autoOrderRequested=false.

## Operational notes

- **smoke remains manual only** — `smoke:limited-live-fetch:3019` is never part of the
  safety chain.
- **observation validators remain outside safety-chain** — round 1 / round 2 validators
  are manual only.
- This validator (`test:limited-live-fetch-deterministic-clock`) is also NOT added to
  `test:safety-chain`; the safety chain CI guard remains 18 checks.

## Future use

- **golden snapshot tests for live candidate / fallback candidate** — inject a fixed
  `now` (e.g. `() => new Date("2026-06-23T00:00:00.000Z")`) to assert a fully deterministic
  candidate object, including `receivedAt`, for both the live-parse path and the disabled
  scaffold fallback path.
