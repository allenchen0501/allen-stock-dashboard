# Limited Live Fetch — Golden Snapshot Validation

## Purpose

- **offline deterministic parser snapshot** — drive the already-exported pure parser
  `parseLimitedLiveFetchResponse(symbol, json, now?)` with a fixed clock and a fixed
  TWSE-like mock response, and assert a golden success candidate and a golden fallback
  candidate. This proves parser / candidate output / fallback output are stable without
  touching the network.

## How it stays safe

- **no live fetch** — the validator never calls `getTwseTpexLimitedLiveFetchCandidate`
  (the only network path); it only calls the pure parser.
- **no smoke** — the manual smoke script is not invoked and is never a CI condition.
- **fixed now clock** — `() => new Date("2026-06-30T00:00:00.000Z")` is injected, so
  `receivedAt` is deterministic.
- **fixed TWSE mock response** — `ch=tse_3019.tw, c=3019, n=亞光, z=142.5, o=140.5,
  h=142.5, l=139.5, y=138, v=3010, d=20260630, t=14:30:00` plus `tlong` (epoch ms for
  2026-06-30T06:30:00.000Z, i.e. 14:30 Taipei). The allowlist reads only
  `c/z/o/h/l/y/v/tlong`.

## Success candidate snapshot

- symbol=3019, providerId=mixed-public, providerName 含 "TWSE / TPEx"
- price=142.5, open=140.5, high=142.5, low=139.5, previousClose=138, volume=3010
- sourceTimestamp=2026-06-30T06:30:00.000Z（`new Date(tlong).toISOString()`）
- receivedAt=2026-06-30T00:00:00.000Z（injected clock）
- isRealData=true, isConnected=true, isDisabled=false
- verificationStatus=LIVE_FETCH_DRY_RUN
- operationalUseAllowed=false, buySellCommandGenerated=false, autoOrderRequested=false

## Fallback candidate snapshot

- 使用 wrong-symbol mock（`c=9999`）→ parser 回 disabled scaffold candidate。
- symbol=3019, isRealData=false, isConnected=false, isDisabled=true
- receivedAt=2026-06-30T00:00:00.000Z（injected clock，deterministic fallback）
- verificationStatus=SCAFFOLD_ONLY
- operationalUseAllowed=false, buySellCommandGenerated=false, autoOrderRequested=false

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
- not production ready（`isConnected=true` 僅代表來源 fetch 成功，非 operational）

## Safety chain placement

- **golden validator remains outside safety-chain initially** — `test:limited-live-fetch-golden-snapshot`
  與 smoke script 皆 **不**納入 `npm run test:safety-chain`；safety chain CI guard 仍 18 checks。
  日後若要納入，需另開一版 integration 並通過 owner review。
