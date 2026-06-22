# Portfolio Staging RLS Validation

本文件定義 `portfolio_stocks` 在 isolated Supabase staging project 中的
RLS / grants / owner-scoped access 驗證計畫。

**本 repo 不執行任何 Supabase 連線或 migration；本文件只提供驗證步驟與 checklist。**

相關文件：
[Portfolio Production Readiness](./portfolio-production-readiness.md)、
[RLS Validation Checklist](./rls-validation-checklist.md)、
[Portfolio Staging Shadow](./portfolio-staging-shadow.md)、
[Portfolio Switch Strategy](./portfolio-switch-strategy.md)、
[Staging Portfolio Seed](./staging-portfolio-seed.md)。

---

## A. Purpose

本文件用於：

- 驗證 `portfolio_stocks` 在 **isolated Supabase staging project** 中的 RLS policy、
  grants 與 owner-scoped access 是否符合安全規範。
- 確認 `v85_portfolio_rls.sql` 套用後，anon 無法讀寫、authenticated user 只能存取自己的 rows。
- 為 V14 API switch guard 提供人工驗證證據。

本文件明確排除的事項：

- **不使用 production project**：所有操作僅限 staging project，不影響正式資料。
- **不使用真實持股 seed 進入 Git**：seed 在私有、可稽核的管道手動建立。
- **不切換 `/api/portfolio`**：API 模式維持 `hardcoded`，直到 V14 conditions 全部通過。
- **不修改 UI**：本階段只做後端 RLS 驗證，前端不變。
- **不產生任何買賣建議**：驗證結果只保存安全合規狀態，不作投資決策。

---

## B. Staging Environment Requirements

在開始任何 manual application steps 前，staging project 必須滿足以下條件：

1. **Isolated staging project**：必須是獨立的 Supabase staging project，不得直接使用 production database。
2. **Pre-migration backup / rollback plan**：套用 migration 前先確認有 backup 或可 reset 的 rollback plan。
3. **Staging-only owner IDs**：使用僅供 staging 環境的 Supabase Auth users，憑證不得進入 repository。
4. **No production data in Git**：真實 owner_id、cost_price、quantity 不得提交至任何 Git 檔案。
5. **Private / manual seed execution**：staging seed 必須在 Supabase UI 或受控管道手動執行，不透過 CI 或 script 自動化。
6. **Manual record-keeping only**：所有驗證結果以人工紀錄（spreadsheet、私有 doc）保存，不寫入 repository。
7. **Staging credentials 隔離**：staging project URL、anon key、service role key 不得與 production 共用，且不得提交至 Git。

---

## C. Manual Application Steps

以下為 staging 環境的人工操作步驟。**本 repo 不執行這些步驟；這裡只作參考計畫。**

1. **建立或確認 staging project**
   - 在 Supabase 建立全新 staging project（或確認既有 staging project 已隔離）。
   - 記錄 staging project ID 與 migration version。

2. **套用 migration**
   - 依照套用順序：`schema.sql` → `v85_pro_plus_schema.sql` → `v85_pro_plus_schema_v2.sql` → `v85_portfolio_rls.sql`。
   - 套用後確認每張表的 RLS 已啟用，且 `owner_id` 欄位存在。

3. **建立 staging-only seed**
   - 參照 `portfolio_staging_seed.example.sql` 的欄位 shape，在 Supabase SQL Editor 手動建立 2 個 staging owners（Owner A / Owner B）。
   - 每位 owner 各建立 2–3 筆 staging-only portfolio rows，quantity 與 cost_price 使用非真實的測試值（例如整數 100、整數 1000），標記來源為 `staging-test`。
   - 確認所有 rows 的 owner_id 等於對應 Supabase Auth user 的 UUID。

4. **準備三種驗證情境**
   - **anon**：使用 Supabase 的 anon key 作為 API credential。
   - **Authenticated Owner A**：使用 Owner A 的 session token。
   - **Authenticated Owner B**：使用 Owner B 的 session token（僅用於 cross-owner deny 驗證）。

5. **執行 RLS Test Matrix**（見 Section D）
   - 對每個 actor / operation 組合執行測試並記錄結果（ALLOW / DENY）。
   - 確認結果與 Expected Result 欄位一致。

6. **記錄結果**
   - 以私有文件保存：操作者、staging project ID、migration 版本、每項測試結果、時間戳記。
   - 若有 WARNING，記錄原因與下一步。
   - 若有 FAIL，立即記錄受影響的 operation 並觸發 rollback。

7. **若任一 FAIL，立即 rollback**
   - 執行 Rollback Plan（見 Section F）。
   - 維持 `PORTFOLIO_SOURCE_MODE=hardcoded` 或未設定狀態。
   - 調查根本原因後重新驗證，不得跳過直接進 V14。

---

## D. Required RLS Test Matrix

| Actor | Operation | Expected Result | Failure Severity |
|---|---|---|---|
| anon | SELECT any row | DENY | Critical — 立即 rollback |
| anon | INSERT new row | DENY | Critical — 立即 rollback |
| anon | UPDATE any row | DENY | Critical — 立即 rollback |
| anon | DELETE any row | DENY | Critical — 立即 rollback |
| Authenticated Owner A | SELECT own rows (`owner_id = auth.uid()`) | ALLOW | — |
| Authenticated Owner A | SELECT Owner B rows | DENY | Critical — Owner A 不得看到 Owner B |
| Authenticated Owner A | INSERT own row (`owner_id = auth.uid()`) | ALLOW | — |
| Authenticated Owner A | INSERT row with `owner_id = Owner B UUID` | DENY | Critical — 跨 owner insert 禁止 |
| Authenticated Owner A | UPDATE own row | ALLOW | — |
| Authenticated Owner A | UPDATE Owner B row | DENY | Critical — 跨 owner update 禁止 |
| Authenticated Owner A | Hard DELETE own row | DENY（無 delete policy）| High — hard delete 禁止 |
| Authenticated Owner A | Soft delete own row（`is_active=false`）| ALLOW via update policy | — |
| Inactive rows leakage | Active query returns inactive rows | DENY / excluded by application filter | High — inactive rows 不得進 active portfolio response |
| service role | SELECT / INSERT / UPDATE all rows | ALLOW in server/manual context only | — service role 不得出現在 browser client |

**備註：**
- `v85_portfolio_rls.sql` 明確 `drop policy if exists portfolio_owner_delete`，表示 hard delete policy 不存在；RLS 無 policy 的 DELETE 預設 deny。
- service role bypass RLS by design；只允許在 server-only 或管理員 manual 操作中使用。
- Inactive rows 的排除由 application filter（`is_active = true` query）負責；RLS 不強制限制，因此 application layer 的過濾是必要的。

---

## E. Pass / Fail Criteria

### PASS 條件（全部必須成立）

- [ ] anon 的全部操作（SELECT / INSERT / UPDATE / DELETE）均被 DENY。
- [ ] Authenticated Owner A 可以 SELECT / INSERT / UPDATE 自己的 rows。
- [ ] Authenticated Owner A 無法 SELECT 或 UPDATE Owner B 的 rows。
- [ ] Hard delete 被 DENY（無 delete policy，RLS 預設拒絕）。
- [ ] Soft delete（`is_active=false`）透過 update policy 可以執行。
- [ ] Active portfolio query 不回傳 `is_active=false` 的 rows（application filter）。
- [ ] Portfolio shadow comparison PASS（staging database rows 與 hardcoded baseline symbol / market identity 完全一致）。
- [ ] Rollback path 已驗證（切回 `hardcoded` mode 後 response source 回到 hardcoded）。

### FAIL 條件（任一成立即停止進 V14）

- [ ] anon 可以讀取任何 row。
- [ ] 發現 `using (true)` 寬鬆 policy。
- [ ] Owner A 可以讀取或修改 Owner B 的 rows。
- [ ] Empty Supabase result 覆蓋 hardcoded data（`empty_portfolio` fallback 未觸發）。
- [ ] Active response 出現 `is_active=false` 的 rows。
- [ ] Hard delete 可以執行（有 delete policy 或 RLS 未啟用）。
- [ ] Shadow comparison 出現 FAIL（symbol / market mismatch、duplicate、missing、extra）。
- [ ] 沒有可用的 rollback path（切回 `hardcoded` 後 API 仍回傳 Supabase data）。

---

## F. Rollback Plan

### 第一層：API mode rollback（即時）

- 將 `PORTFOLIO_SOURCE_MODE` 設為 `hardcoded` 或直接移除環境變數。
- 效果：API 立即回 hardcoded path，不需 UI redeploy，不需刪除 Supabase data。
- 確認：rollback 後 API response 的 `source` 欄位必須回到 `"hardcoded"`。

### 第二層：Shadow mode 停用

- 若 shadow comparison 持續 FAIL，停止啟用 `PORTFOLIO_SOURCE_MODE=shadow`。
- 保留 staging shadow reader 診斷工具，但不讓 shadow metadata 影響主 API response。

### 第三層：Staging migration rollback / reset

- 若 RLS migration 有誤，在 staging project 手動執行 rollback SQL 或 reset staging database。
- 不得對 production project 執行任何 rollback SQL。
- 記錄 migration version、rollback 時間與原因。

### 共同規則

- **不刪 production data**：任何 rollback 操作只限 staging project。
- **不需 UI redeploy 才能回 hardcoded**：API mode flag 獨立於 UI deploy。
- **Rollback 後 response source 必須回到 `hardcoded`**：由 `resolvePortfolioModeFromEnvironment()` 保證。
- **Rollback 紀錄**：記錄觸發條件、操作者、時間、前後 flag 值。

---

## G. Promotion Gate to V14

進入 V14（API Switch Guard）前，以下條件**全部**必須通過：

- [ ] **V13 本機 checker PASS**：`npm run test:portfolio-staging-rls` 輸出 `status: PASS`。
- [ ] **Staging RLS manual matrix PASS**：Section D 所有 Expected Result 驗證通過，無 FAIL。
- [ ] **Staging seed shape PASS**：`npm run test:portfolio-seed-shape` 通過，且 staging seed 已由人工核對 symbol / market / quantity / cost_price。
- [ ] **Portfolio shadow comparison PASS**：staging database rows 與 hardcoded baseline 至少連續 2 次 parity PASS，無 symbol / market drift。
- [ ] **至少連續 2 次人工驗證無 drift**：在不同時段重複執行 RLS test matrix，結果一致。
- [ ] **README / docs 清楚標記仍未切 production**：`/api/portfolio` 預設仍為 `hardcoded`，文件反映此狀態。
- [ ] **Product owner 明確確認**：Allen 人工確認 staging 驗證結果，並明確授權進入 V14 API switch guard。

V14 只做 API switch guard 的程式準備（composition root + 保護條件），**不在 V14 正式切換**；實際切換另立版本並重新確認所有 gates。
