# Staging Supabase RLS Manual Matrix

本文件定義 Allen Stock Dashboard 的 **Staging Supabase RLS Manual Matrix**（未來啟用 staging Supabase read-only 連線前，必須人工逐項驗證的 RLS 存取矩陣）。
V45 把這個 RLS 人工驗證矩陣收斂成 spec-only contract、pure deterministic builder、validator 與本文件。

**本階段（V45）只定義 RLS manual matrix。本輪不實際連 Supabase、不讀 env、不新增 API route、不新增 UI、不新增 SQL migration、不修改現有 production routes、不切換 /api/portfolio、不建立 runtime、不寫 DB。
這一版不是 staging Supabase 實作；不是 production 真實資料上線；不是建立實際 RLS policy migration。**

相關文件：
[Staging Supabase Read-only Safety Gate](./staging-supabase-readonly-safety-gate.md)、
[Production Alias Safety Smoke Test Evidence](./production-alias-safety-smoke-test-evidence.md)、
[Preview Deployment Readiness](./preview-deployment-readiness.md)。

---

## A. Purpose

- V45 是 staging Supabase RLS manual matrix。
- V45 不是正式真實資料上線。
- V45 定義「未來連 staging Supabase 且僅 read-only」時，每個 table × role × operation 的預期 RLS 存取結果，供人工逐項驗證。
- staging Supabase 僅為 planned；本輪不連任何 Supabase。
- fixture/mock UI 仍維持現狀。
- V44 Staging Supabase Read-only Safety Gate 仍是前置安全門。

---

## B. Scope Boundary

- V45 不連 staging Supabase。
- V45 不接 production Supabase。
- V45 不讀 Supabase env key。
- V45 不寫 staging。
- V45 不寫 production。
- V45 不新增 SQL migration。
- V45 不建立實際 RLS policy。
- V45 不切換 /api/portfolio。
- V45 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V45 不新增 API route。
- V45 不新增 UI。
- V45 不接真實行情。
- V45 不產生買賣指令。
- V45 不自動下單。

read-only：未來啟用時僅允許 read-only select；no write / no staging write / no production write。

---

## C. Matrix Shape

每個 matrix item 至少包含：

- `tableName`
- `role`
- `operation`
- `expectedAccess`
- `actualAccess`
- `verificationStatus`
- `blocksRelease`
- `notes`

允許的 role：anon、authenticated、service_role、dashboard_readonly_app。
允許的 operation：select、insert、update、delete。
允許的 expectedAccess：ALLOW_READ_ONLY、DENY、SERVICE_ROLE_ONLY、NOT_ALLOWED_IN_APP_RUNTIME。
允許的 actualAccess：NOT_TESTED。
允許的 verificationStatus：NOT_REVIEWED、PASS、FAIL、BLOCKED。

矩陣涵蓋 staging tables：

- portfolio_stocks
- watchlist_stocks
- market_snapshots
- stock_snapshots
- v85_scores

矩陣規模：5 tables × 4 roles × 4 operations = 80 items。所有 actualAccess = NOT_TESTED，所有 verificationStatus = NOT_REVIEWED。

---

## D. Policy Expectations

- anon 對所有 table 的 select / insert / update / delete 都必須 expectedAccess = DENY。
- authenticated 對所有 table 最多只能 select = ALLOW_READ_ONLY。
- authenticated 的 insert / update / delete 必須 expectedAccess = DENY。
- dashboard_readonly_app 對所有 table 最多只能 select = ALLOW_READ_ONLY。
- dashboard_readonly_app 的 insert / update / delete 必須 expectedAccess = DENY。
- service_role 必須標示 SERVICE_ROLE_ONLY 或 NOT_ALLOWED_IN_APP_RUNTIME。
- service_role 不得被 app runtime 使用。
- write operation 不得 ALLOW_READ_ONLY。

---

## E. Loose Policy Guards

- `using (true)` 這類寬鬆 policy 必須標示 NO_GO / BLOCKED。
- public read/write 必須標示 NO_GO / BLOCKED。
- 若任何 write access 不是 DENY，decision 必須 NO_GO。
- 若 stagingRlsManuallyVerified = false，decision 不得是 GO 或 PRODUCTION_READY。

---

## F. Safety Language

- Staging Supabase RLS Manual Matrix
- staging Supabase
- RLS manual matrix
- read-only
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
- using (true)
- public read/write
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## G. Decision

- `decision` 預設 READY_FOR_REVIEW（所有 write 皆 DENY 且尚未人工驗證）。
- 允許 READY_FOR_REVIEW / NO_GO / BLOCKED / NOT_REVIEWED。
- V45 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## H. Future Gate

下一階段才是 **V46 Staging Supabase Read-only Connection Review** 或 **V46 Staging Supabase Schema Mapping Spec**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
