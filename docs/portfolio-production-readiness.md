# Portfolio Production Readiness

本文件定義 `portfolio_stocks` 正式上線前必須通過的所有 gates、允許與禁止事項，
以及最小上線排序。V12 只建立此文件與驗證腳本，不切換 API、不寫入 Supabase。

相關文件：
[Portfolio Switch Strategy](./portfolio-switch-strategy.md)、
[Staging Portfolio Seed](./staging-portfolio-seed.md)、
[RLS Validation Checklist](./rls-validation-checklist.md)、
[Portfolio Staging Shadow](./portfolio-staging-shadow.md)、
[Portfolio Seed Validation](./portfolio-seed-validation.md)、
[Schema Boundary Decisions](./schema-boundary-decisions.md)。

---

## A. Current Portfolio Status

| 項目 | 目前狀態 |
|---|---|
| `/api/portfolio` | 預設使用 hardcoded path（`PORTFOLIO_SOURCE_MODE` 未設或設為 `hardcoded`） |
| 主資料來源 | hardcoded baseline symbols（3019、4966、5347、2455、4979） |
| `portfolio_stocks` | 目標權威來源，schema 已建立，但尚未正式切換 |
| Supabase mode | 需通過 seed / RLS / shadow / rollback 全部 gates 後才可啟用 |
| 真實持股資料 | 未寫入 repository，未套用 production seed |
| RLS migration | `v85_portfolio_rls.sql` 已備妥，尚未套用至 staging 或 production |
| Shadow comparison | fixture-only 測試可執行（`npm run test:portfolio-shadow`），staging snapshot 未完成 |

---

## B. Production Readiness Gates

### Gate 1：Schema Gate

- [ ] `portfolio_stocks` 欄位需符合 `PortfolioRepository.getActivePortfolioStocks()` 與 `GetActivePortfolioUseCase` 所需。
- [ ] 欄位清單確認：`id`、`symbol`、`name`、`market`、`cost_price`、`shares`、`position_type`、`is_active`、`created_at`、`updated_at`（`PORTFOLIO_COLUMNS` 常數定義）。
- [ ] `owner_id` 欄位已加入（`v85_portfolio_rls.sql` 新增），且不允許 NULL active rows。
- [ ] `(symbol, market)` unique constraint 在 single-owner 場景下仍有效；多 owner 場景需另立 migration。
- [ ] 不允許任何 placeholder 值（`0`、`1`、假成本、假股數）通過 schema constraint。

### Gate 2：Seed Gate

- [ ] 真實持股資料**不得提交至 Git**；只有 shape-only example 存在 repository。
- [ ] `supabase/seeds/portfolio_staging_seed.example.sql` 必須保持零列、rollback guarded，通過 `npm run test:portfolio-seed-shape`。
- [ ] 實際 seed 必須在 Supabase 私有管道手動建立，並由 Allen 人工核對每一列的 quantity 與 average_cost。
- [ ] Seed 匯入前：先 dry run、確認 symbol+market unique key 無衝突、再執行 shape test。
- [ ] Seed 匯入後：hardcoded parity check 必須通過（五檔 symbol/market identity 一致）。
- [ ] `quantity` 與 `average_cost` 必須來自核准的持股紀錄，禁止估算值或測試數。

### Gate 3：RLS / Grants Gate

- [ ] `portfolio_stocks` 必須 `enable row level security`（已在 `v85_portfolio_rls.sql` 定義）。
- [ ] 不得建立 `using (true)` 或對 `anon` role 開放的 policy。
- [ ] Owner select / insert / update policy 均以 `owner_id = auth.uid()` 限制範圍。
- [ ] 不得存在 hard delete policy；刪除須以 `is_active = false` soft delete 實施。
- [ ] Staging 驗證：Owner A 不得讀取 Owner B 的 rows；anon 的全部操作均須被拒絕。
- [ ] 服務端不持有 service-role key，測試不得以 service role 繞過 RLS。

### Gate 4：Shadow Parity Gate

- [ ] Database active rows 必須與 hardcoded baseline 做 symbol / market identity parity comparison。
- [ ] **FAIL 條件**：missing、extra、duplicate、inactive leakage、market mismatch。
- [ ] **WARNING 條件**：name mismatch（identity 仍相符）。
- [ ] **PASS 前不得切換 API**：必須連續多個交易日取得 PASS，且 RLS / empty fallback / rollback gates 均已通過。
- [ ] Shadow report 不得包含 cost、shares、owner_id 或任何敏感欄位。

### Gate 5：API Switch Gate

- [ ] `PORTFOLIO_SOURCE_MODE` 支援 `hardcoded | shadow | supabase` 三模式（已實作於 `portfolio-mode.ts`）。
- [ ] 預設值必須是 `hardcoded`；未設、未知值、RLS 錯誤一律 fallback hardcoded 並告警。
- [ ] `shadow` 模式只附加 metadata，不改變主 response data；shadow log 不含 cost、shares 或 token。
- [ ] `supabase` 模式的 empty / error 結果必須 fallback hardcoded，不得以空清單覆蓋既有 Portfolio。
- [ ] `GetActivePortfolioUseCase.executeWithHardcodedFallback()` 涵蓋：`repository_error`、`empty_portfolio`、`inactive_record`、`validation_failed` 四種 fallback 條件。

### Gate 6：Rollback Gate

- [ ] 一鍵回復：只需將 `PORTFOLIO_SOURCE_MODE` 設為 `hardcoded` 或移除環境變數。
- [ ] Rollback 不刪除資料、不回滾 seed、不需 UI redeploy。
- [ ] Rollback 後 response source 必須回到 `hardcoded`，API 回傳結果與 rollback 前一致。
- [ ] Rollback 觸發條件（任一成立即回復）：
  - Database empty、RLS permission denied、owner mismatch。
  - Symbol set mismatch、inactive row 外洩、cost / shares 異常。
  - `invalid` / `suspicious` 資料被標成 decision-ready。
  - Warning / FAIL 未附 `data_warning`。
  - Error rate / latency / stale rate 超過核准門檻。
- [ ] 切換與 rollback 需保留紀錄：flag 前後值、操作者、時間、release 版本、seed checksum、核准者。

---

## C. Allowed / Forbidden Actions

### Allowed（本階段與 V12）

- 建立 readiness 文件（本文件）。
- 新增 `npm run test:portfolio-production-readiness` fixture-only 驗證腳本。
- 讀取現有 SQL / seed / RLS 檔案做形狀核查（不連 Supabase、不讀 env key）。
- 更新 README 版本紀錄。
- 在本機執行 `test:portfolio-shadow`、`test:portfolio-seed-shape` 等現有測試。

### Forbidden（現階段）

- 寫入真實持股資料（quantity、cost_price、owner_id 值）至任何 SQL 或 Git 檔案。
- commit 包含真實 cost / quantity / owner_id 值的任何檔案。
- 切換 `/api/portfolio` 的主路徑至 `supabase` 模式。
- 新增前端 UI 元件或 API route。
- 套用任何 migration 到遠端 Supabase（包括 `v85_portfolio_rls.sql`）。
- 新增 `using (true)` 或開放 anon 的 RLS policy。
- 建立 cron 排程或自動化 seed 寫入。
- 讀取 `SUPABASE_SERVICE_ROLE_KEY` 或任何 env key。

---

## D. Recommended Rollout Order

以下排序確保每一步都有明確的 gate 和可驗證的 PASS 條件，任一步驟失敗即停止。

1. **Schema / RLS shape verification**（本機）
   - 執行 `npm run test:portfolio-production-readiness` 確認所有本機 shape checks PASS。
   - 執行 `npm run test:portfolio-seed-shape` 確認 seed example shape 無誤。

2. **Private / manual seed（Supabase 外部流程，不進 Git）**
   - 在私有稽核管道建立 staging seed manifest。
   - 人工核對每一列的 symbol、market、quantity、cost_price、position_type、opened_at。
   - 執行 transaction dry run 確認無 unique constraint 衝突。

3. **Staging shadow comparison（Supabase staging，不連 production）**
   - 在隔離 staging project 套用 `schema.sql` → Pro+ schema → `v85_portfolio_rls.sql`。
   - 建立 owner-specific seed，以 authenticated client 驗證 RLS。
   - 執行 `npm run test:portfolio-shadow`（staging snapshot 版本）。
   - 確認 symbol / market identity parity = PASS，連續多個交易日無 mismatch。

4. **Shadow mode API metadata only**
   - 設定 `PORTFOLIO_SOURCE_MODE=shadow`，確認主 response 不變，只附加 shadow metadata。
   - 監控 shadow log 的 parity status、latency 與 error rate，至少觀察 5 個交易日。

5. **Supabase mode guarded rollout**
   - 所有 Gates 1～4 全部通過後，設定 `PORTFOLIO_SOURCE_MODE=supabase`。
   - 以 `executeWithHardcodedFallback()` 保護 empty / error / validation_failed 回退。
   - 監控 API response source、error rate 與 fallback 觸發率。

6. **Monitor / rollback**
   - 保持 rollback 能力（`PORTFOLIO_SOURCE_MODE=hardcoded`）在整個觀察期間可用。
   - 記錄每次模式切換的操作者、時間與原因。
   - 穩定運行至少 10 個交易日後，才可考慮移除 hardcoded fallback path。
