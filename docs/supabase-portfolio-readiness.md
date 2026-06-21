# Supabase Portfolio Readiness

正式將 `/api/portfolio` 的 response source 切換為 Supabase 前，以下 gates 必須全部有 staging 證據。任一項未完成、WARNING 或 FAIL，都維持 hardcoded。

## Seed PASS

- [ ] `npm run test:portfolio-seed-shape` 通過。
- [ ] 私有 seed 經 owner、symbol、market、quantity、average cost 與來源人工核對。
- [ ] Staging contract 到 `portfolio_stocks` 的欄位 mapping 已核准並測試。
- [ ] Active rows 沒有 placeholder、duplicate、zero quantity 或未確認值。
- [ ] 已賣出股票使用 `is_active = false`，沒有 hard delete。

## RLS PASS

- [ ] Authenticated owner select／insert／update 通過。
- [ ] Anon select／insert／update／delete 全部被拒絕。
- [ ] Owner A 無法讀取或修改 Owner B rows。
- [ ] Authenticated hard delete 被拒絕。
- [ ] 沒有 client-side service role key、寬鬆 policy 或 `using (true)`。

## Shadow PASS

- [ ] `npm run test:portfolio-shadow` 通過。
- [ ] 實際 staging active rows parity 為 PASS，不是 fixture suite 的預期 FAIL。
- [ ] `source = hardcoded`、`fallback_used = true` 在 shadow 期間保持不變。
- [ ] Empty、RLS blocked、repository error 與 invalid row 都能 fail closed。
- [ ] Shadow report 不包含 owner、成本、股數、token 或 key。

## Data Quality PASS

- [ ] Portfolio membership shape validation 通過。
- [ ] 未來價格 connector 有 record date、time、source、confidence 與 inference flag。
- [ ] Invalid／suspicious 不進決策；stale 只能參考。
- [ ] Official close validation 與 warning policy 已完成 staging 測試。

## Rollback ready

- [ ] `PORTFOLIO_SOURCE_MODE=hardcoded` 回復流程已演練。
- [ ] 移除環境變數時會 fallback hardcoded。
- [ ] Empty data 絕不覆蓋既有 Portfolio。
- [ ] Rollback 不刪除 seed、trade journal 或 audit evidence。
- [ ] 切換與 rollback owner、時間、版本及非敏感證據可追溯。

只有五組 gates 全部 PASS，才可提出 production Supabase mode 審查；readiness PASS 本身仍不等於自動切換授權。
