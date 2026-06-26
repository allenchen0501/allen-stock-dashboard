# Shadow Runner Dry-run API Route

本文件定義 Allen Stock Dashboard 的 **Shadow Runner Dry-run API Route**（V51 實際新增的 fixture-only / mock_or_contract API route）。
V51 把 V50 Shadow Runner Dry-run API Contract 的 deterministic responsePayload 透過一個實際 route 提供出來。

**本階段（V51）是 API route implementation，但仍然 fixture-only / mock_or_contract。本輪不連 staging Supabase、不接 production Supabase、不讀 env、不寫 DB、不 fetch 外部資料、不切換 /api/portfolio、不建立實際 shadow runner runtime、不執行 shadow runner、不新增 UI、不接真實行情、不產生買賣指令、不自動下單。
這一版不是 staging Supabase 實作；不是 production 真實資料上線；不是 actual shadow runner runtime；不是 actual staging connection review。**

相關文件：
[Shadow Runner Dry-run API Contract](./shadow-runner-dry-run-api-contract.md)、
[Shadow Runner Dry-run Spec](./shadow-runner-dry-run-spec.md)、
[Fixture vs Staging Shadow Comparison Spec](./fixture-vs-staging-shadow-comparison-spec.md)。

---

## A. Purpose

- V51 是 Shadow Runner Dry-run API Route。
- V51 新增 GET /api/portfolio/shadow-runner-dry-run。
- V51 route 是 fixture-only / mock_or_contract。
- V51 route 回傳 V50 responsePayload。
- V51 不是 production 真實資料上線。
- fixture/mock UI 仍維持現狀。
- V44 / V45 / V46 / V47 / V48 / V49 / V50 仍是前置安全門。

---

## B. Route

- 路徑：`GET /api/portfolio/shadow-runner-dry-run`
- 實作檔：`app/api/portfolio/shadow-runner-dry-run/route.ts`
- 只允許 GET、HTTP status 200。
- `import buildShadowRunnerDryRunApiContract`（V50 builder），回傳 `contract.responsePayload`。
- 使用固定 generatedAt = `"2026-06-23T00:00:00.000Z"`（不讀系統時間）。
- `export const dynamic = "force-dynamic"`、`Cache-Control: no-store`。

---

## C. Scope Boundary

- V51 不連 staging Supabase。
- V51 不接 production Supabase。
- V51 不讀 Supabase env key。
- V51 不寫 staging。
- V51 不寫 production。
- V51 不新增 SQL migration。
- V51 不建立 Supabase client。
- V51 不建立 actual shadow runner runtime。
- V51 不執行 actual shadow runner。
- V51 不切換 /api/portfolio。
- V51 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V51 不新增 UI。
- V51 不接真實行情。
- V51 不產生買賣指令。
- V51 不自動下單。

---

## D. Response

route 回傳 V50 builder 的 `responsePayload`，至少包含 ok / apiContractVersion / responseSource / sourceMode / plannedEndpoint / method / dryRunBundle / evidenceReport / safetyFlags / warnings / nextRequiredActions。

規則：

- responseSource must remain mock_or_contract。
- sourceMode must remain fixture。
- PORTFOLIO_SOURCE_MODE must remain hardcoded。
- dry-run evidence must not be persisted to DB。
- dry-run mismatch must not promote staging。
- empty / stale / error result must not override hardcoded。
- kill switch must be enabled by default。

---

## E. V50 Contract Flags vs V51 Route File

- **V50 contract flags remain false** even though V51 route file exists：
  - V50 contract 的 `routeCreated` / `apiRouteCreated` / `routeImplemented` 仍維持 false。
  - V50 文件仍代表「V50 當時只是 API contract，不是 route implementation」。
  - V51 route file (`app/api/portfolio/shadow-runner-dry-run/route.ts`) 確實存在，其存在性由 V51 route checker 驗證；V50 contract flags 不因此改為 true。
- no Supabase connection / no env key / no write / no api switch 等安全旗標一律不放寬。

---

## F. Safety Language

- Shadow Runner Dry-run API Route
- GET /api/portfolio/shadow-runner-dry-run
- fixture-only
- mock_or_contract
- not production trading system
- no real market data
- no Supabase connection
- no env key
- no write
- no staging write
- no production write
- no SQL migration
- no api switch
- no buy/sell command
- no auto order
- responseSource must remain mock_or_contract
- sourceMode must remain fixture
- PORTFOLIO_SOURCE_MODE must remain hardcoded
- dry-run evidence must not be persisted to DB
- dry-run mismatch must not promote staging
- empty / stale / error result must not override hardcoded
- kill switch must be enabled by default
- V50 contract flags remain false even though V51 route file exists
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## G. Future Gate

下一階段才是 **V52 Shadow Runner Dry-run Monitoring UI** 或 **V52 Shadow Runner Dry-run API Evidence Review**。

- 仍 fixture-only / mock_or_contract。
- 仍 no Supabase / no env / no DB write。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
