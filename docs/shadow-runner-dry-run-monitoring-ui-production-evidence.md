# Shadow Runner Dry-run Monitoring UI Production Evidence

本文件記錄 **V53 Shadow Runner Dry-run Monitoring UI Production Evidence**：證明 V52 monitoring UI 已上 production，
且 `/holdings` 已掛載 Shadow Runner Dry-run Monitoring shell，internal endpoint
`/api/portfolio/shadow-runner-dry-run` 維持 fixture-only / mock_or_contract / safe flags。

**本階段只新增 evidence doc + validator，並更新 package.json 與 README。本輪不是新功能、不是 UI 改版、不是 API route 改版、不是 staging Supabase 實作、不是 production 真實資料上線、不是 actual shadow runner runtime、不是 actual staging connection review。**

相關文件：
[Shadow Runner Dry-run Monitoring UI](./shadow-runner-dry-run-monitoring-ui.md)、
[Shadow Runner Production Smoke Evidence](./shadow-runner-dry-run-production-smoke-evidence.md)、
[Shadow Runner Dry-run API Route](./shadow-runner-dry-run-api-route.md)、
[Shadow Runner Dry-run API Contract](./shadow-runner-dry-run-api-contract.md)。

---

## A. Scope

- V53 是 Shadow Runner Dry-run Monitoring UI Production Evidence。
- V53 不是新功能。
- V53 不新增 UI。
- V53 不新增 API route。
- V53 不連 staging Supabase。
- V53 不接 production Supabase。
- V53 不讀 Supabase env key。
- V53 不寫 staging。
- V53 不寫 production。
- V53 不新增 SQL migration。
- V53 不建立 Supabase client。
- V53 不建立 actual shadow runner runtime。
- V53 不執行 actual shadow runner。
- V53 不切換 /api/portfolio。
- V53 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V53 不接真實行情。
- V53 不產生買賣指令。
- V53 不自動下單。

---

## B. Production Deployment Evidence（externally confirmed）

以下為外部（Vercel dashboard / production HTTP）已確認之結果，記錄為 evidence；本 repo validator 不 fetch external production URL。

- production deployment commit = `740e16ba16cbd85ecb9cacc58d9d0c918e297560`
- deployment message = Add shadow runner dry-run monitoring UI
- production deployment state = READY
- production /holdings status = 200 OK
- production /holdings matched path = /holdings（`x-matched-path = /holdings`）

---

## C. Production `/holdings` HTML Contents（externally confirmed）

production `/holdings` HTML 已包含：

- Shadow Runner Dry-run Monitoring
- `/api/portfolio/shadow-runner-dry-run`
- fixture-only
- mock_or_contract
- dry-run evidence only
- no Supabase connection
- no env key
- no DB write
- no real market data
- no /api/portfolio switch
- no auto order
- V50 contract flags retained false
- production route verified separately by V51.1 smoke evidence

---

## D. Interpretation Notes

- **V50 contract flags retained false does not mean production route is missing**：V50 contract 的
  `routeCreated` / `apiRouteCreated` / `routeImplemented` 為 V50 當時語義；V51 route 已上線。
- **V51.1 production smoke verified endpoint 200**：`GET /api/portfolio/shadow-runner-dry-run` 回 HTTP 200，
  responseSource = mock_or_contract、sourceMode = fixture、safetyFlags 全 safe。
- **client component may show loading in server HTML before hydration**：monitoring UI 是 client component，
  伺服器端 HTML 可能先顯示 loading 狀態，待 hydration 後才填入資料。
- **hydration data is sourced only from internal endpoint** `/api/portfolio/shadow-runner-dry-run`：
  hydration 後的資料只來自此 internal endpoint，不來自任何外部資料源、不來自 Supabase、不來自真實行情。

---

## E. Repo-local Deterministic Evidence（validator-checked）

V53 validator 只做 repo-local deterministic 驗證（不連 production）：

- `components/shadow-runner-dry-run-monitoring.tsx` 仍含 `"use client"` / useEffect / useState /
  `fetch("/api/portfolio/shadow-runner-dry-run")` / 必要顯示欄位 / `V50 contract flags retained false`。
- component 無 forbidden token（@supabase / createClient / process.env / axios / Date.now / new Date( /
  insert( / upsert( / update( / delete( / yahoo / twse / goodinfo / investing / pchome / scheduler / webhook /
  crawler）、無外部 URL fetch。
- `app/holdings/page.tsx` 已 import 並 render `ShadowRunnerDryRunMonitoring`。
- `app/api/portfolio/shadow-runner-dry-run/route.ts` 仍存在。

---

## F. Future Gate

下一階段才是 **V54 Staging Read-only Connection Review Gate** 或 **V54 Shadow Runner Safety Gate Checklist**。

- 仍 fixture-only / mock_or_contract。
- 仍 no Supabase / no env / no DB write。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
