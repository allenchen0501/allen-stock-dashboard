# Limited Live Fetch 3019 Observation Round 1

## 1. Observation purpose

- Record the first observation round for 3019 limited live fetch dry-run.
- **manual smoke only** — triggered by `npm run smoke:limited-live-fetch:3019`.
- **not CI** — this observation is never run as a CI / safety-chain condition.
- **not production data switch** — the dry-run does not switch any real data mode and
  does not feed any operational surface.

This round confirms the approved provider can either return a live read-only quote in
manual smoke mode OR safely fall back to the disabled scaffold candidate.

## 2. Current approved scope

- provider=TWSE_TPEX
- symbol=3019（亞光）
- channel=tse_3019.tw
- timeoutMs=3000
- maxRetries=0
- GET only
- shadowOnly=true
- defaultRealDataMode=fixture
- operationalUseAllowed=false
- productionReady=false

/ approved provider file: `services/market-data/twse-tpex-verification-provider.ts`
（runtime 未在本 PR 修改）。

## 3. Manual smoke result

- command: `npm run smoke:limited-live-fetch:3019`
- outcome: **LIVE_FETCH_OK**
- price: 142.5
- open / high / low / previousClose: 140.5 / 142.5 / 139.5 / 138
- volume: 3010
- sourceTimestamp: 2026-06-30T06:30:00.000Z
- receivedAt: 2026-06-30T12:28:34.049Z
- verificationStatus: LIVE_FETCH_DRY_RUN
- isRealData: true
- isConnected: true（source fetch only — NOT operational）
- isDisabled: false
- operationalUseAllowed=false
- buySellCommandGenerated=false
- autoOrderRequested=false

> 註：price / sourceTimestamp 會隨盤況變動，本文件僅記錄當次觀察值；observation validator
> 不要求固定 price。若某次 smoke 失敗但安全 fallback，outcome 應記為 FALLBACK_USED、price 與
> sourceTimestamp 記為 N/A，並仍記錄 safety flags。

## 4. Safety interpretation

- successful live fetch does not mean production ready.
- source success does not mean operational use allowed.
- quote is shadow-only.
- quote must not feed trade plan.
- quote must not feed /api/portfolio.
- quote must not generate buy/sell command.
- `isConnected=true` 僅代表來源 fetch 成功，不代表 operational、不代表可作為操作依據。

## 5. Stability notes

- response had required fields: yes — `c / z / o / h / l / y / v / tlong` 皆存在且為合法字串。
- parser accepted schema: yes — field allowlist 通過，`c === "3019"`、price 與 timestamp 可解析。
- fallback path remained available: yes — 任何 timeout / 非 2xx / JSON parse / schema 失敗仍會
  回 `buildTwseTpexScaffoldCandidate`（disabled scaffold candidate）。
- timeout / error handling remained safe: yes — AbortController timeout=3000ms、maxRetries=0、
  `getTwseTpexLimitedLiveFetchCandidate` 永不 throw uncaught。

## 6. Next step options

- observe 3019 again（再做一輪 manual smoke，累積穩定度樣本）。
- add deterministic receivedAt injection for tests（讓 receivedAt 可注入，方便快照測試；目前讀時鐘）。
- prepare owner approval for second symbol, but do not implement yet（先準備第二檔的 owner approval
  文字，**尚未**實作、**不**擴大 symbol universe）。
