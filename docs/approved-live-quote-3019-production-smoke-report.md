# 3019 Approved Live Quote Production Smoke Report

3019 核准真實報價線上手動刷新驗證報告。

## Purpose

- 驗證 3019 manual-refresh MVP production readiness。
- 只限 3019。
- 只限 manual refresh。
- 只限 read-only。
- 驗證 non-approved symbols are rejected。
- 驗證 default page load no fetch。
- 驗證 fallback / timeout / source_error 不崩潰。
- 不代表 production data switch。
- 不代表 /api/portfolio switch。
- 不代表交易訊號。
- 不代表買賣建議。
- 不代表自動下單。

這是一個 verification / evidence step，不是新增資料源、不是擴大股票池、不是 core 5 expansion。

## Production Deployment

- commit：36a7220
- deployment：dpl_FWMFvQd4poKngGWHBsiYTecAXdMx
- production URL：https://allen-stock-dashboard.vercel.app/
- endpoint：/api/war-room/approved-live-quote
- state：READY

## Manual Smoke Test Plan

### Case 1：approved manual request

Request：

```
GET /api/war-room/approved-live-quote?symbol=3019&mode=manual
```

Expected：

- requestPerformed may be true
- symbol = 3019
- sourceProvider = TWSE_TPEX
- approvedChannel = tse_3019.tw
- dataStatus one of：live_verified / fallback / timeout / source_error / not_available
- price may be number or null
- sourceTimestamp may be string or null
- 不得假造價格
- notTradeAdvice = true
- notEntrySignal = true
- autoOrderRequested = false

### Case 2：non-approved symbol rejected

Request：

```
GET /api/war-room/approved-live-quote?symbol=4966&mode=manual
```

Expected：

- requestPerformed = false
- dataStatus = not_available（rejected）
- no real fetch
- reason explains non-approved symbol（「非核准代號：僅核准 3019（亞光）…」）
- no price fabrication（price = null）

### Case 3：missing manual mode rejected

Request：

```
GET /api/war-room/approved-live-quote?symbol=3019
```

Expected：

- requestPerformed = false
- no real fetch
- reason explains manual mode required（「僅允許手動刷新（mode=manual）…」）

（註：query 未帶 `mode` 時，route 以 `mode ?? 'manual'` 預設為 manual；欲明確驗證「缺少 manual
模式」的拒絕分支，請用 Case 4 的 `mode=auto`。route 對任何非 `manual` 的 mode 一律拒絕且不 fetch。）

### Case 4：auto mode rejected

Request：

```
GET /api/war-room/approved-live-quote?symbol=3019&mode=auto
```

Expected：

- requestPerformed = false
- no real fetch
- reason explains manual refresh only（「僅允許手動刷新（mode=manual）…」）

### Case 5：War Room default page load

Expected：

- page load does not call approved-live-quote endpoint automatically
- only clicking 手動刷新 3019 triggers the request
- UI does not crash on fallback / timeout / source_error

## Smoke Result Section

### Real-network manual smoke（`npm run smoke:limited-live-fetch:3019`）

於 2026-07-01（UTC）執行 real-network manual smoke，結果為 **LIVE_FETCH_OK**（成功取得真實報價）：

- outcome：LIVE_FETCH_OK
- symbol：3019
- dataStatus（對應 mapper）：live_verified
- price：140（number，非假造）
- open / high / low / previousClose：143.5 / 144.5 / 140 / 142.5
- volume：3314
- sourceTimestamp：2026-07-01T06:30:00.000Z（string）
- fetchedAt / receivedAt：2026-07-01T21:24:40.621Z
- sourceProvider：TWSE_TPEX（TWSE / TPEx verification provider，limited live fetch dry-run，shadow-only）
- approvedChannel：tse_3019.tw
- verificationStatus：LIVE_FETCH_DRY_RUN（source fetch only — NOT operational）
- operationalUseAllowed：false／buySellCommandGenerated：false／autoOrderRequested：false

此為 shadow-only dry-run，NOT a buy/sell command、NOT production ready。price 為真實來源值，
未假造；若某次執行 source unavailable，只會回報 fallback / timeout / source_error / not_available，
price 一律 null。

### 若 smoke 失敗（未取得真實報價）

- 只能回報 fallback / timeout / source_error / not_available。
- 不得假造價格（price = null、sourceTimestamp = null）。
- UI 以「資料不足」安全顯示，不崩潰。

## Safety Boundary

- approved live-fetch symbols remain exactly ["3019"]。
- no 4966 / 5347 / 4979 / 2455。
- no Yahoo。
- no new provider。
- no new TPEx channel（僅 tse_3019.tw）。
- no Supabase。
- no process.env。
- no DB write。
- no broker API。
- no buy/sell command。
- no auto order。
- no production data switch。
- no /api/portfolio switch。
- fallback / timeout / source_error 不得讓 UI 崩潰。
- manual smoke not in safety-chain（本版 validator 亦不納入 safety-chain）。
- provider runtime 未修改；本版僅使用既有 approved provider / channel / timeout / fallback。
- smoke 成功不代表擴大到 core 5；不新增第二檔 approved symbol。
