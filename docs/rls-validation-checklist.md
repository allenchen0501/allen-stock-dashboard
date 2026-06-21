# RLS Validation Checklist

本清單適用於未來 staging 對 `portfolio_stocks` 套用 `v85_portfolio_rls.sql` 前後的人工與自動驗證。V3-5.5 只建立檢核規範，不套用 migration、不建立登入。

## Authenticated owner

- [ ] Owner A 可以 select 自己的 rows，且只看到 `owner_id = auth.uid()`。
- [ ] Owner A 可以 insert 自己的 row。
- [ ] Insert 缺少 owner_id、owner_id 不等於 `auth.uid()` 或使用其他 owner 時被拒絕。
- [ ] Owner A 可以 update 自己的 row，包括將 `is_active` 改為 false。
- [ ] Owner A 無法把自己的 row 改成 Owner B。

## Deny rules

- [ ] Anon select、insert、update、delete 全部被拒絕。
- [ ] Authenticated hard delete 被拒絕；只能使用 `is_active = false` soft delete。
- [ ] Owner A 無法 select、insert、update 或 delete Owner B 的 rows。
- [ ] Client 不持有 service role key，測試也不得用 service role 繞過 RLS。

## Staging 驗證流程

1. 在隔離的 staging project 套用基礎 schema，確認 migration version。
2. 建立兩個僅供 staging 的 authenticated owners；憑證不得進 repository。
3. 以核准 manifest 建立 owner-specific seed，先跑 shape test 與 dry run。
4. 套用 RLS migration，確認 anon 沒有 privilege 或 policy。
5. 逐項執行 Owner A／Owner B select、insert、update 與跨 owner negative tests。
6. 驗證 hard delete 失敗、soft delete 成功、active-only query 排除 inactive rows。
7. 保存不含 token、成本、股數的測試證據與 policy／migration 版本。
8. 任一項失敗立即將 API mode 維持或回復 `hardcoded`，停止 V3-6 shadow rollout。

正式套用前仍需處理目前全域 unique constraint 的 multi-owner 影響；不得因測試方便建立 `using (true)`、anon policy 或 delete policy。
