# Preview Deployment Readiness

本文件定義 Allen Stock Dashboard 的 **Preview Deployment Readiness**（部署到 Preview / Staging 網址前的前置檢查）。
V42 把「這個 fixture-only dashboard 要怎麼安全地部署成可分享的 Preview 網站」收斂成正式 contract。

**本階段（V42）是 deployment readiness / preview launch preparation only。本輪不真的執行 Vercel deploy、不接真資料、不建立 runtime、不新增 API route、不新增 UI、不連 Supabase、不讀 env、不新增 SQL migration、不寫資料、不產生買賣指令、不自動下單。
部署後的網站仍必須標示 fixture-only / mock_or_contract，不得被描述為即時行情系統或投資建議系統。**

相關文件：
[Runtime Pilot Readiness UI](./runtime-pilot-readiness-ui.md)、
[Runtime Pilot Monitoring UI](./runtime-pilot-monitoring-ui.md)、
[First Authorized Source Dry-Run API](./first-authorized-source-dry-run-api.md)、
[First Authorized Source Dry-Run Monitoring UI](./first-authorized-source-dry-run-monitoring-ui.md)。

---

## A. Purpose

- V42 目標是讓 Allen Stock Dashboard 可以部署為 Preview / Staging 網站。
- V42 是 deployment readiness / preview launch preparation。
- V42 不接真資料。
- V42 不建立 runtime。
- V42 不新增 API route。
- V42 不新增 UI。
- V42 不連 Supabase。
- V42 不讀 env key。
- V42 不新增 SQL migration。
- V42 不寫資料。
- V42 不產生買賣指令。
- V42 不自動下單。
- V42 不代表正式真實行情上線。

---

## B. Deployment Target

- `deploymentTarget` = preview
- `deploymentProvider` = Vercel or compatible Next.js hosting（`vercel_or_nextjs_compatible`）
- `gitRemote` = GitHub
- `productionDataEnabled` = false
- `runtimeEnabled` = false
- `externalMarketDataEnabled` = false
- `supabaseEnabled` = false
- `databaseWriteEnabled` = false
- `buySellCommandEnabled` = false
- `autoOrderEnabled` = false

規則：

- Preview deployment 可以部署網站外觀與 fixture-only flow。
- Preview deployment 不代表真實資料服務啟動。
- Preview deployment 不代表 Runtime Pilot 啟動。
- Preview deployment 不代表可寫資料。
- Preview deployment 不代表產生買賣指令。
- preview deployment 不是 production trading system。

---

## C. Required Pages / Routes

Deployment 前至少確認以下頁面與 routes：

Pages：

- `/`
- `/holdings`

Internal API routes：

- `/api/portfolio/holding-defense`
- `/api/portfolio/intraday-defense`
- `/api/portfolio/runtime-pilot-dry-run`
- `/api/portfolio/first-authorized-source-dry-run`

確認：

- routes 可 build。
- routes 不連外部資料源。
- routes 回傳 fixture-only / mock_or_contract payload。
- routes 不寫資料。
- routes 不讀 Supabase。
- routes 不讀 env key。
- routes 不產生買賣指令。

---

## D. Required UI Sections

Deployment 前 holdings page 至少應顯示：

- Portfolio Valuation Radar
- Holding Defense Tracker
- Intraday Defense Tracker
- Runtime Pilot Readiness
- Runtime Pilot Monitoring
- First Authorized Source Dry-Run Monitoring

每個區塊都必須保留：

- fixture data 不是即時資料
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- production write 一律 BLOCKED
- preview deployment 不是 production trading system

---

## E. Pre-Deploy Commands

部署前必跑：

- `npm run build`
- `npm run test:runtime-pilot-readiness-ui`
- `npm run test:runtime-pilot-monitoring-ui`
- `npm run test:first-authorized-source-dry-run-api`
- `npm run test:first-authorized-source-dry-run-monitoring-ui`
- `npm run test:preview-deployment-readiness`

建議全套也跑（節選）：

- `npm run test:official-connectors`
- `npm run test:portfolio-production-readiness`
- `npm run test:portfolio-staging-rls`
- `npm run test:war-room-api-contract`
- `npm run test:holding-defense-tracker-api-contract`
- `npm run test:intraday-defense-fixture-api`
- `npm run test:runtime-pilot-readiness-checklist`
- `npm run test:runtime-pilot-dry-run-api`
- `npm run test:runtime-pilot-implementation-review`
- `npm run test:first-authorized-source-dry-run-spec`

（完整清單見 README 與 package.json 的 `test:*` scripts。）

---

## F. Manual Post-Deploy Checklist

部署完成後，人工檢查：

- 首頁可開啟。
- holdings page 可開啟。
- Holding Defense Tracker 有顯示。
- Intraday Defense Tracker 有顯示。
- Runtime Pilot Readiness 有顯示。
- Runtime Pilot Monitoring 有顯示。
- First Authorized Source Dry-Run Monitoring 有顯示。
- `/api/portfolio/holding-defense` 可開啟。
- `/api/portfolio/intraday-defense` 可開啟。
- `/api/portfolio/runtime-pilot-dry-run` 可開啟。
- `/api/portfolio/first-authorized-source-dry-run` 可開啟。
- 頁面明確顯示 fixture data 不是即時資料。
- 頁面明確顯示不產生買賣指令。
- 頁面明確顯示不自動下單。
- 頁面明確顯示不替代投資判斷。
- 頁面明確顯示 production write 一律 BLOCKED。

---

## G. Rollback / Redeploy Checklist

- `rollbackTrigger`：build 失敗、checker 失敗、warning banner 消失、route 讀 env / import Supabase / fetch 外部 URL。
- `previousCommitHash`：部署前記錄前一個 GitHub commit hash。
- redeploy previous GitHub commit：可回滾到前一個 commit 重新部署。
- disable public sharing if warning banners disappear：fixture-only warning 消失即停止公開分享。
- block deployment if build fails。
- block deployment if checker fails。
- block deployment if any route reads env。
- block deployment if any route imports Supabase。
- block deployment if any route fetches external URL。
- block deployment if buySellCommandGenerated can become true。
- block deployment if autoOrderRequested can become true。
- block deployment if productionWritePerformed can become true。

---

## H. Deployment Safety Language

- Preview Deployment Readiness
- preview deployment 不是 production trading system
- fixture data 不是即時資料
- V42 不接真資料
- V42 不建立 runtime
- V42 不寫資料
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- production write 一律 BLOCKED
- buySellCommandGenerated 必須 false
- autoOrderRequested 必須 false
- productionWritePerformed 必須 false
- requestPerformed 必須 false
- supabaseConnected 必須 false
- 資料不足就顯示資料不足

---

## I. Future Gate

### V43 Preview Deployment Smoke Test

- 驗證實際 deployed URL。
- 檢查首頁。
- 檢查 holdings page。
- 檢查 internal API routes。
- 檢查 fixture-only warnings。
- 不接真資料。
- 不建立 runtime。

### V44 First Authorized Source Connector Adapter Spec

- 仍須 source-neutral。
- 仍須 no-write。
- 仍須 no buy-sell command。
- 仍須 no auto-order。
- 仍須 kill switch 可停止。
