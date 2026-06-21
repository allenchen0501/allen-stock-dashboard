# Staging Portfolio Seed

V3-5.5 定義 staging Portfolio seed 的資料契約與人工審核規則。本階段沒有真實 seed、不連 Supabase，也不修改正式 schema。

## Seed 建立規範

- Repository 中的 `portfolio_staging_seed.example.sql` 必須保持零資料，只描述欄位與約束。
- 真實 staging seed 必須在受控、私有且可稽核的管道建立，不得 commit、貼入 issue 或寫進 log。
- 每一列都必須有可追溯來源、建立時間、更新時間及人工核對紀錄。
- `quantity` 與 `average_cost` 必須來自核准的持股紀錄，不得使用 0、隨機數、測試數或估算值充當正式資料。
- `market_type` 只允許 `TWSE`、`TPEx`、`NASDAQ`、`NYSE`；symbol 必須使用對應市場的正式代碼。
- Seed 匯入前必須先通過 `npm run test:portfolio-seed-shape`，再進行欄位 mapping、transaction dry run 與 row-level review。

目前 `public.portfolio_stocks` 使用 `name / market / shares / cost_price`，staging contract 使用 `stock_name / market_type / quantity / average_cost`，且多出 industry、opened_at 與來源欄位。V3-6 必須先核准 mapping 或新增 staging table migration；不可直接把範本套到現有正式表。

## owner_id 規則

- 必須是 staging Supabase Auth 中已核准的 authenticated user UUID。
- 必須等於執行 RLS 操作時的 `auth.uid()`。
- 禁止使用全零 UUID、臨時 UUID、共用 owner、anon identity 或 service role 代替實際 owner。
- Owner 建立、核准與撤銷需保留外部稽核紀錄；UUID 不得與 key、token 一起存入 repository。

## Active Portfolio

Active Portfolio 定義為：owner 符合目前 authenticated user、`is_active = true`、quantity 大於 0，且持股尚未完全賣出。API 未來只能讀取 active-only rows。

## 已賣出股票

- 完全賣出後將 `is_active` 更新為 `false`，不得 hard delete。
- 成交歷史應進入 `trade_journal`，Portfolio row 保留稽核關係。
- 部分賣出需更新 quantity 與成本依據，且保留來源；不得藉由刪除再新增規避歷史。

## 禁止假值

缺少 owner、quantity、average cost、opened_at 或來源時，seed 必須停止。不得填入 placeholder、示範股票、猜測成本或假股數來換取 validation PASS。
