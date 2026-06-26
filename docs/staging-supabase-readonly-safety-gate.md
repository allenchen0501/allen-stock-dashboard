# Staging Supabase Read-only Safety Gate

本文件定義 Allen Stock Dashboard 的 **Staging Supabase Read-only Safety Gate**（未來啟用 staging Supabase read-only 整合前，必須先通過的前置安全門）。
V44 把這個安全門收斂成 spec-only contract、pure deterministic builder、validator 與本文件。

**本階段（V44）只定義 staging Supabase read-only 前置安全門。本輪不實際連 Supabase、不讀 env、不新增 API route、不新增 UI、不新增 SQL migration、不修改現有 production routes、不切換 /api/portfolio、不建立 runtime、不寫 DB。
這一版不是 staging Supabase 實作；不是 RLS matrix 實作；不是 production 真實資料上線。**

相關文件：
[Preview Deployment Readiness](./preview-deployment-readiness.md)、
[Production Alias Safety Smoke Test Evidence](./production-alias-safety-smoke-test-evidence.md)、
[Runtime Pilot Monitoring UI](./runtime-pilot-monitoring-ui.md)、
[First Authorized Source Dry-Run API](./first-authorized-source-dry-run-api.md)。

---

## A. Purpose

- V44 是 staging Supabase read-only safety gate。
- V44 不是正式真實資料上線。
- V44 只定義「未來要連 staging Supabase 且僅 read-only」之前必須先過的安全門。
- staging Supabase 僅為 planned；本輪不連任何 Supabase。
- fixture/mock UI 仍維持現狀。
- production alias safety smoke test evidence 仍維持 V43 結論。

---

## B. Scope Boundary

- V44 不接 production Supabase。
- V44 不連 staging Supabase。
- V44 不讀 Supabase env key。
- V44 不寫 staging。
- V44 不寫 production。
- V44 不切換 /api/portfolio。
- V44 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V44 不讀 env key。
- V44 不新增 SQL migration。
- V44 不新增 API route。
- V44 不新增 UI。
- V44 不接真實行情。
- V44 不產生買賣指令。
- V44 不自動下單。

---

## C. Staging Boundary

- `deploymentTarget` = staging
- `stagingSupabasePlanned` = true
- `stagingSupabaseConnected` = false
- `stagingReadPerformed` = false
- `stagingWritePerformed` = false

說明：

- 僅限 staging Supabase；不碰 production。
- staging Supabase 連線只是 planned，尚未啟用。

---

## D. Read-only Boundary

- 未來啟用時僅允許 read-only（select）。
- 禁止 insert / upsert / update / delete。
- `stagingReadPerformed` = false（V44 不做任何讀取）。
- `stagingWritePerformed` = false。
- `databaseWritePerformed` = false。
- read-only 僅為 intent；no write、no staging write、no production write。

---

## E. Production Isolation Boundary

- `productionSupabaseConnected` = false。
- `productionWritePerformed` = false。
- production alias `allen-stock-dashboard.vercel.app` 不變。
- fixture/mock UI 仍維持現狀。
- production alias safety smoke test evidence 仍維持 V43 結論。

---

## F. Guards

No-write proof：

- writeAttempted = false。
- stagingWritePerformed = false。
- productionWritePerformed = false。
- databaseWritePerformed = false。

API switch guard：

- `portfolioApiSwitched` = false（no api switch）。
- /api/portfolio sourceMode 維持 fixture。
- `realMarketDataEnabled` = false（no real market data）。

Runtime guard：

- `runtimeCreated` = false。
- 無 quote polling / scheduler / webhook / crawler / connector runtime。

Env guard：

- `envReadPerformed` = false（no env key）。
- supabaseEnvKeyRead = false。
- `requestPerformed` = false。

---

## G. Rollback / Kill Switch & Manual Review Checklist

Rollback / kill switch：

- 記錄啟用前的 previous commit hash。
- 可 redeploy previous GitHub commit。
- kill switch 可立即停止 staging Supabase read-only 嘗試。
- 偵測到任何 write / production 連線 / env 讀取 / api switch 則 block gate。

Manual review：

- 人工確認僅 staging、不碰 production。
- 人工確認 read-only、無任何 write 路徑。
- 人工確認 production alias / fixture mock UI 不變。
- 人工確認不讀 env / Supabase env key。
- 人工確認 kill switch 與 rollback 可用。

---

## H. Safety Language

- Staging Supabase Read-only Safety Gate
- staging Supabase
- read-only
- not production trading system
- no real market data
- no Supabase connection
- no env key
- no write
- no staging write
- no production write
- no api switch
- no buy/sell command
- no auto order
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## I. Decision

- `decision` 預設 READY_FOR_REVIEW。
- 允許 READY_FOR_REVIEW / NO_GO / BLOCKED / NOT_REVIEWED。
- V44 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## J. Future Gate

### V45 Staging Supabase RLS Manual Matrix

- 下一階段才是 V45 Staging Supabase RLS Manual Matrix。
- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
