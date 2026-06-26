# Shadow Runner Dry-run Monitoring UI

本文件定義 Allen Stock Dashboard 的 **Shadow Runner Dry-run Monitoring UI**（V52 新增的 client-side monitoring component，把 V51 fixture-only route 的 V50 responsePayload 視覺化在持股戰情頁）。

**本階段（V52）可以新增 UI，但 component 只 fetch internal endpoint /api/portfolio/shadow-runner-dry-run。本輪不連 staging Supabase、不接 production Supabase、不讀 Supabase env key、不寫 staging、不寫 production、不新增 SQL migration、不建立 Supabase client、不建立 actual shadow runner runtime、不執行 actual shadow runner、不切換 /api/portfolio、不建立 quote polling / scheduler / webhook / crawler / connector runtime、不接真實行情、不產生買賣指令、不自動下單。
這一版不是 staging Supabase 實作；不是 production 真實資料上線；不是 actual shadow runner runtime；不是 actual staging connection review。**

相關文件：
[Shadow Runner Dry-run API Route](./shadow-runner-dry-run-api-route.md)、
[Shadow Runner Dry-run API Contract](./shadow-runner-dry-run-api-contract.md)、
[Shadow Runner Production Smoke Evidence](./shadow-runner-dry-run-production-smoke-evidence.md)。

---

## A. Purpose

- V52 是 Shadow Runner Dry-run Monitoring UI。
- V52 新增 client component（`components/shadow-runner-dry-run-monitoring.tsx`）。
- V52 fetches only internal endpoint /api/portfolio/shadow-runner-dry-run。
- V52 route responseSource must remain mock_or_contract。
- V52 sourceMode must remain fixture。
- fixture/mock UI 仍維持現狀。
- V44–V51 / V51.1 仍是前置安全門。

---

## B. Component

- 檔案：`components/shadow-runner-dry-run-monitoring.tsx`
- `"use client"`、使用 React hook（useEffect / useState）。
- 只 `fetch("/api/portfolio/shadow-runner-dry-run")`（internal endpoint /api/portfolio/shadow-runner-dry-run）。
- 掛在 `app/holdings/page.tsx`，位置參考 runtime-pilot-monitoring / first-authorized-source-dry-run-monitoring。
- 不 fetch 外部 URL、不讀 env、不連 Supabase、不寫 DB、不 import route file、不 import Supabase client、不 import Yahoo provider、不建立 scheduler / webhook / crawler / connector runtime、不切換 /api/portfolio、不產生買賣指令、不自動下單。

---

## C. Displayed Fields

UI 至少顯示：title（Shadow Runner Dry-run Monitoring）、endpoint、apiContractVersion、responseSource、sourceMode、method、ok；
evidenceReport.generatedAt / runnerMode / comparedTableCount / comparedFieldCount / passCount / mismatchCount /
dataInsufficientCount / staleCount / errorCount / blockedCount / promotionAllowed / portfolioApiSwitchAllowed /
persisted / manualReviewRequired；
safetyFlags.supabaseConnected / stagingSupabaseConnected / productionSupabaseConnected / envReadPerformed /
databaseWritePerformed / shadowRunnerExecuted / shadowResultPersisted / portfolioApiSwitched / realMarketDataEnabled /
buySellCommandGenerated / autoOrderRequested / killSwitchDefaultEnabled；warnings；nextRequiredActions。

---

## D. UI States

- loading：顯示載入中。
- error：顯示「monitoring unavailable / 資料不足」；不得 fallback 到真實行情、不得呼叫其他外部資料源、不得切換任何資料源。
- success：顯示上述欄位。

---

## E. Required Labels

UI 必須清楚標示：fixture-only；mock_or_contract；no Supabase connection；no env key；no DB write；
no real market data；no /api/portfolio switch；no auto order；dry-run evidence only；
**V50 contract flags retained false**；production route verified separately by V51.1 smoke evidence。

---

## F. Safety Boundary

- V52 不連 staging Supabase。
- V52 不接 production Supabase。
- V52 不讀 Supabase env key。
- V52 不寫 staging。
- V52 不寫 production。
- V52 不新增 SQL migration。
- V52 不建立 Supabase client。
- V52 不建立 actual shadow runner runtime。
- V52 不執行 actual shadow runner。
- V52 不切換 /api/portfolio。
- V52 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V52 不接真實行情。
- V52 不產生買賣指令。
- V52 不自動下單。
- dry-run evidence must not be persisted to DB。
- dry-run mismatch must not promote staging。
- empty / stale / error result must not override hardcoded。
- kill switch must be enabled by default。
- V50 contract flags remain false even though V51 route exists。
- V51.1 production smoke verified endpoint 200。

---

## G. Future Gate

下一階段才是 **V53 Shadow Runner Dry-run Monitoring UI Production Evidence** 或 **V53 Staging Read-only Connection Review Gate**。

- 仍 fixture-only / mock_or_contract。
- 仍 no Supabase / no env / no DB write。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
