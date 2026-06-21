# Portfolio Staging Shadow

Staging shadow 用來比較經 RLS 保護的 database active Portfolio 與目前 hardcoded baseline。整個驗證期間 `/api/portfolio` 的主要資料仍由 hardcoded path 回傳。

## 驗證流程

1. 保持 `PORTFOLIO_SOURCE_MODE=hardcoded`，完成 seed shape 與人工資料核對。
2. 在 staging 套用核准的 schema／RLS migration，建立 owner-specific seed。
3. 以 authenticated owner 讀取 `portfolio_stocks where owner_id = auth.uid() and is_active = true`。
4. 將 database rows 映射為 symbol／market／name shadow contract；成本、股數與 owner 不得進 shadow report。
5. 執行 `npm run test:portfolio-shadow`，再以 staging snapshot 比對 hardcoded baseline。
6. 保存 status、difference codes、counts、snapshot ID 與 migration version，不保存敏感持股值。
7. 只有連續取得 PASS 且 RLS、Data Quality、empty fallback 與 rollback gates 全部通過，才能進入切換審查。

## 結果定義

- `PASS`：symbol／market identity 完全一致、沒有 duplicate、inactive leakage、missing 或 extra；才可進 rollout review。
- `WARNING`：identity 一致但名稱不同。可繼續調查，不允許切換，`decision_allowed = false`。
- `FAIL`：market mismatch、duplicate、inactive、missing、extra、RLS 錯誤、empty result 或 validation failure。立即阻擋切換。

Fixture suite 的預期 FAIL scenarios 通過，只代表 validator 正確辨識錯誤；實際 staging snapshot 本身必須是 PASS。

## Rollback

1. 將 `PORTFOLIO_SOURCE_MODE` 設為 `hardcoded` 或移除環境變數。
2. 停止 staging Supabase shadow reader，不改動前端 response。
3. 將有問題的 staging rows soft deactivate；禁止 hard delete。
4. 保留 migration、seed manifest checksum 與非敏感 report，以便修正後重跑。
5. 重新通過 seed shape、RLS checklist、Shadow Test 與 staging parity 前，不得啟用 Supabase response。
