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

（註：本版起 route 要求 `mode` 必須**明確**為 `manual`；query 未帶 `mode`（缺少 mode）不再預設為
manual，一律拒絕且不 fetch。任何非 `manual` 的 mode 亦一律拒絕。見下方 Production Endpoint Case
Evidence 的 Case C 對「舊 deployment 預設 manual」與「本版收緊後拒絕」的差異記錄。）

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

## Production Endpoint Case Evidence

實際對 production URL endpoint 執行 GET 測試（evidence backfill）。

- Base URL：https://allen-stock-dashboard.vercel.app
- Endpoint：/api/war-room/approved-live-quote
- Deployment（執行當下）：dpl_H4sZ3WRCNuGsqtDREP6JgubrQUuc（commit dea7f4e，READY）
- 執行時間：2026-07-01（UTC，實測）
- 方法：`curl -s "<url>"`
- production endpoint is deployed and reachable（4 個 case 皆 HTTP 200，實際取得回應，非假造）。

### Case A：approved 3019 manual request

Request：

```
GET https://allen-stock-dashboard.vercel.app/api/war-room/approved-live-quote?symbol=3019&mode=manual
```

Actual response summary：

- http status：200
- symbol：3019 ｜ sourceProvider：TWSE_TPEX ｜ approvedChannel：tse_3019.tw
- dataStatus：live_verified
- price：140（number，真實來源值，未假造）
- previousClose / open / high / low / volume：142.5 / 143.5 / 144.5 / 140 / 3314
- change / changePercent：-2.5 / -1.75
- sourceTimestamp："2026-07-01T06:30:00.000Z"（string）
- fetchedAt："2026-07-01T21:40:19.450Z"
- requestPerformed：true
- safety flags：notTradeAdvice=true、notEntrySignal=true、autoOrderRequested=false、
  supabaseConnected=false、productionWritePerformed=false、brokerConnected=false、
  buySellCommandGenerated=false

→ approved request behavior verified（真實報價已驗證，read-only、shadow-only、非操作型）。

### Case B：non-approved symbol rejected

Request：

```
GET https://allen-stock-dashboard.vercel.app/api/war-room/approved-live-quote?symbol=4966&mode=manual
```

Actual response summary：

- http status：200
- dataStatus：not_available
- requestPerformed：false（no real fetch）
- price：null ｜ sourceTimestamp：null（no fabrication）
- reasonZh（uiStatusZh / sourceNoteZh）：「非核准代號：僅核准 3019（亞光），已拒絕且未進行任何真實行情請求。」
- symbol 欄位固定回 3019（endpoint 身分），但未對 4966 進行任何真實行情請求
- safety flags：notTradeAdvice=true、notEntrySignal=true、autoOrderRequested=false

→ non-approved symbol rejection verified（4966 rejected without fetch）。

### Case C：missing manual mode

Request：

```
GET https://allen-stock-dashboard.vercel.app/api/war-room/approved-live-quote?symbol=3019
```

Actual response summary（於 deployment dpl_H4sZ3WRCNuGsqtDREP6JgubrQUuc / commit dea7f4e 實測）：

- http status：200
- dataStatus：live_verified
- requestPerformed：true
- price：140 ｜ sourceTimestamp："2026-07-01T06:30:00.000Z" ｜ fetchedAt："2026-07-01T21:40:21.099Z"

→ 說明：當時部署的 route 以 `mode ?? 'manual'` 將**缺少 mode** 預設為 manual，因此 missing mode 會
fetch（live_verified）。**本版（此 commit）已收緊 route**：`mode` 必須明確為 `manual`，缺少 mode 不再
預設，改為拒絕（requestPerformed=false、reasonZh「僅允許手動刷新（mode=manual）…」、price=null、
sourceTimestamp=null、no fabrication）。此收緊後的 missing-mode 拒絕行為將於**下一次 production
deployment** 生效驗證；本次如實記錄舊部署的實際回應，未假造。UI 一律以 `&mode=manual` 呼叫，故不受影響。

### Case D：auto mode rejected

Request：

```
GET https://allen-stock-dashboard.vercel.app/api/war-room/approved-live-quote?symbol=3019&mode=auto
```

Actual response summary：

- http status：200
- dataStatus：not_available
- requestPerformed：false（no real fetch）
- price：null ｜ sourceTimestamp：null（no fabrication）
- reasonZh（uiStatusZh / sourceNoteZh）：「僅允許手動刷新（mode=manual），已拒絕且未進行任何真實行情請求。」
- safety flags：notTradeAdvice=true、notEntrySignal=true、autoOrderRequested=false

→ auto mode rejection verified（mode=auto rejected without fetch）。

## Evidence Conclusion

- production endpoint is deployed and reachable：是（4 個 case 皆 HTTP 200，實測取得回應，未假造）。
- approved request behavior verified：是（Case A → live_verified、price 140、真實來源值）。
- non-approved symbol rejection verified：是（Case B → 4966 rejected without fetch、price=null）。
- missing manual mode rejection verified：**本版 route 已收緊為缺少 mode 即拒絕**；舊部署（實測當下）
  因 `mode ?? 'manual'` 預設而 fetch，已如實記錄，收緊後的拒絕將於下一次 deployment 生效驗證。
- auto mode rejection verified：是（Case D → mode=auto rejected without fetch、price=null）。
- no price fabrication：是（所有 rejection 與 unavailable 情況 price=null、sourceTimestamp=null；
  真實報價僅記錄來源實際值）。
- approved live-fetch symbols remain exactly ["3019"]。
- manual endpoint verification is not in safety-chain。
- this is not production data switch。
- this is not /api/portfolio switch。
- this is not a trading signal。
- this is not auto order。

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
