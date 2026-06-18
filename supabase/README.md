# Allen Stock Dashboard — Supabase 資料庫規劃

這個目錄是 V3-1 的資料庫層規劃。`schema.sql` 使用 PostgreSQL 語法，可在 Supabase SQL Editor 執行。此版本不連接 Supabase、不包含 API key，也尚未啟用 Row Level Security（RLS）。

## 資料表

### `portfolio_stocks`

保存 Allen 的實際持股設定，包括股票代號、交易市場、平均成本、股數、部位方向與啟用狀態。`symbol + market` 為唯一組合。

### `watchlist_stocks`

保存尚未持有、但需要持續追蹤的候選股票。`sector`、`industry` 與 `tier` 可用於主升段候選池及關注層級篩選。

### `market_snapshots`

保存每日台股加權、NASDAQ、SOX、風險模式與市場分數。資料可由 Yahoo Market Provider 產生；未來台股部分可改由 TWSE 提供。

### `stock_snapshots`

保存個股每日價格、漲跌、成交量與成交值快照。主要供持股績效、技術指標、風報比與歷史回測使用。

### `v85_scores`

保存每檔股票每日的 V8.5 分項分數、總分與評級。`symbol + score_date` 唯一，重算同一天資料時可使用 upsert。

## Schema 設計原則

- 主鍵使用 UUID 與 `gen_random_uuid()`。
- 所有時間欄位使用 `timestamptz`，應以 UTC 寫入。
- 所有資料表均包含 `created_at`、`updated_at`。
- `updated_at` 由共用 trigger 自動維護。
- 每日快照使用唯一約束，避免相同來源重複寫入。
- 常用的日期、股票代號、來源、評級與啟用狀態均已建立索引。
- RLS 刻意保留為關閉狀態；正式開放前必須另行規劃角色與政策。

## 套用方式

開發階段可在新的 Supabase 專案中開啟 SQL Editor，貼上並執行 `schema.sql`。若未來改用 Supabase CLI，建議將 schema 內容轉成帶時間戳記的 migration，不要直接在正式環境手動修改資料表。

執行後可用以下查詢確認資料表：

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

## V8.5 未來資料流程

1. Market Service 每日將三大指數與市場風險寫入 `market_snapshots`。
2. Stocks Service 將持股與觀察名單行情寫入 `stock_snapshots`。
3. Goodinfo、CMoney 或其他 provider 補充產業、基本面與籌碼資料。
4. V8.5 Engine 讀取市場、個股與基本面資料，計算七個分項分數。
5. 分項、總分與評級以 upsert 寫入 `v85_scores`。
6. API Route 只讀取每檔最新分數，提供 Dashboard、風報比與候選池使用。

建議使用的 upsert 衝突鍵：

- `market_snapshots`: `(snapshot_date, source)`
- `stock_snapshots`: `(symbol, snapshot_date, source)`
- `v85_scores`: `(symbol, score_date)`

## 正式上線前

- 為匿名、登入使用者與 server role 設計 RLS policy。
- API key 僅放在伺服器端環境變數，不寫入 repository。
- 將 schema 納入 migration 流程並在 staging 環境驗證。
- 建立每日資料同步、V8.5 計算與失敗重試工作。
