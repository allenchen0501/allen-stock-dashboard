# Limited Live Fetch — Golden Fallback Matrix

## Purpose

- **offline fallback matrix for parser safety** — extend the golden snapshot validator
  with many malformed / missing / wrong-field TWSE-like responses and prove the limited
  live fetch parser always degrades to a SAFE candidate and never produces an operational
  quote.

## How it stays safe

- **fixed now clock** — `() => new Date("2026-06-30T00:00:00.000Z")` is injected, so every
  candidate's `receivedAt` is deterministic.
- **no live fetch** — only the pure `parseLimitedLiveFetchResponse` is called; the network
  path `getTwseTpexLimitedLiveFetchCandidate` is never invoked.
- **no smoke** — the manual smoke script is not run and is not a CI condition.

## Matrix cases

### Hard fallback (→ disabled scaffold candidate)

1. `empty_msgArray` — `{ msgArray: [] }`
2. `missing_msgArray` — `{ rtcode: "0000" }`
3. `wrong_symbol_c_9999` — `c="9999"`
4. `wrong_channel_tse_9999` — `ch="tse_9999.tw"` (echoes a non-3019 `c="9999"`; the symbol
   guard rejects it — the channel itself is structurally pinned to `tse_3019.tw` in the
   provider and is not read by the parser allowlist)
5. `missing_price_z` — no `z`
6. `invalid_price_dash` — `z="-"`
7. `non_numeric_price_abc` — `z="abc"`
8. `missing_tlong` — no `tlong`
9. `invalid_tlong_abc` — `tlong="abc"`
10. `malformed_root_null` — `json = null`
11. `malformed_root_array` — `json = [1,2,3]`
12. `malformed_entry_not_object` — `msgArray: ["not-an-object"]`

### Optional-field (non-operational, not a hard fallback)

- `missing_volume` — no `v`
- `non_numeric_volume` — `v="abc"`

> `volume` is OPTIONAL in the current parser: a missing / non-numeric `v` yields
> `volume=null` and a non-operational candidate, **not** a hard fallback. These cases assert
> the candidate still has `operationalUseAllowed=false`, `buySellCommandGenerated=false`,
> `autoOrderRequested=false`, and a deterministic `receivedAt`. (Making `volume` required
> would be a provider runtime change, which this version forbids.)

## Expected result

- **safe fallback only** for the hard-fallback matrix:
  `isRealData=false`, `isConnected=false`, `isDisabled=true`,
  `verificationStatus=SCAFFOLD_ONLY`, `operationalUseAllowed=false`,
  `buySellCommandGenerated=false`, `autoOrderRequested=false`,
  `receivedAt=2026-06-30T00:00:00.000Z`, `symbol=3019`.
- non-operational safe candidate for the optional-field cases.

## Scope guarantees (unchanged)

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

## Safety chain placement

- **golden validator remains outside safety-chain initially** —
  `test:limited-live-fetch-golden-snapshot` and the smoke script are NOT in
  `npm run test:safety-chain`; the safety chain CI guard remains 18 checks.
