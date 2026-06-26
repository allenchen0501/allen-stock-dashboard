# Production Alias Safety Smoke Test Evidence

本文件記錄 Allen Stock Dashboard 的 **Production Alias Safety Smoke Test Evidence**（針對 production alias `https://allen-stock-dashboard.vercel.app` 已完成的人工 safety smoke test）。
V43 把 V42 Preview Deployment Readiness 之後實際完成的人工 production alias smoke test，收斂成 spec-only evidence contract、pure builder、validator 與本文件。

**本階段（V43）是 production alias safety smoke test evidence only。本輪只記錄與驗證已完成的人工 smoke test：不接真實行情、不連 Supabase、不讀 env、不新增 API route、不新增 UI、不新增 SQL migration、不修改現有 production routes、不切換 /api/portfolio、不建立 runtime、不寫 DB、不產生買賣指令、不自動下單。**

相關文件：
[Preview Deployment Readiness](./preview-deployment-readiness.md)、
[First Authorized Source Dry-Run API](./first-authorized-source-dry-run-api.md)、
[First Authorized Source Dry-Run Monitoring UI](./first-authorized-source-dry-run-monitoring-ui.md)、
[Runtime Pilot Monitoring UI](./runtime-pilot-monitoring-ui.md)。

---

## A. Purpose

- V43 是 production alias safety smoke test evidence。
- V43 不是正式真實資料上線。
- Production shell 可展示，但資料層仍為 fixture/mock safe mode。
- V43 把已完成的人工驗證收斂成 contract / builder / validator / 文件，作為後續 staging 階段的依據。
- allen-stock-dashboard.vercel.app 已人工驗證可開啟。

---

## B. Deployment Context

- `deploymentTarget` = production_alias
- `productionAlias` = allen-stock-dashboard.vercel.app
- `decision` = SMOKE_TEST_PASSED
- `sourceMode` = fixture
- `responseSource` = mock_or_contract

說明：

- Production alias 已可開啟，但只是 production shell 展示。
- 資料層仍為 fixture/mock safe mode。
- allen-stock-dashboard.vercel.app 不是 not production trading system（不是正式交易系統）。

---

## C. Manual Smoke Test Evidence

已人工驗證：

- allen-stock-dashboard.vercel.app 已人工驗證可開啟。
- 首頁（`/`）已人工驗證可開啟。
- `/holdings` 已人工驗證可開啟。
- `/api/portfolio/first-authorized-source-dry-run` 已人工驗證可回應。
- `/api/portfolio/runtime-pilot-dry-run` 已人工驗證可回應。
- `/api/portfolio/intraday-defense` 已人工驗證可回應。
- `/api/portfolio/holding-defense` 已人工驗證可回應。
- production runtime 近 30 分鐘無 error / fatal / 500。

---

## D. Safety Flags (Frozen Evidence)

人工 smoke test 當下，核心 API 仍維持安全狀態：

- `sourceMode` = fixture
- `responseSource` = mock_or_contract
- `realMarketDataEnabled` = false（no real market data）
- `supabaseConnected` = false（no Supabase）
- `productionWritePerformed` = false（no production write）
- `databaseWritePerformed` = false
- `requestPerformed` = false
- `buySellCommandGenerated` = false（no buy/sell command）
- `autoOrderRequested` = false（no auto order）
- `portfolioApiSwitched` = false
- `runtimeCreated` = false
- `apiRouteCreated` = false
- `uiCreated` = false
- `sqlMigrationCreated` = false
- `envReadPerformed` = false

---

## E. Scope Boundary

- V43 不接真實行情。
- V43 不連 Supabase。
- V43 不寫 production。
- V43 不切換 /api/portfolio。
- V43 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V43 不讀 env key。
- V43 不新增 SQL migration。
- V43 不新增 API route。
- V43 不新增 UI。
- V43 不產生買賣指令。
- V43 不自動下單。

---

## F. Safety Language

- Production Alias Safety Smoke Test Evidence
- allen-stock-dashboard.vercel.app
- fixture/mock safe mode
- not production trading system
- no real market data
- no Supabase
- no production write
- no buy/sell command
- no auto order
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## G. Future Gate

### V44 Staging Supabase Read-only Safety Gate

- 下一階段才是 V44 Staging Supabase Read-only Safety Gate。
- 僅限 staging。
- 僅限 read-only。
- 不寫 production。
- 不產生買賣指令。
- 不自動下單。
- kill switch 仍須可停止。
