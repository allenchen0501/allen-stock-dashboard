# Allen Stock Dashboard — Supabase

本目錄包含兩階段 schema：`schema.sql` 是 V3-1 基礎資料層，`v85_pro_plus_schema.sql` 是 V3-1.5 additive migration。Pro+ 檔案不會刪除或改寫既有 V8.5 資料，但必須在基礎 schema 之後執行。

## 套用順序

在新的 Supabase 專案使用 SQL Editor：

1. 執行 `schema.sql`。
2. 執行 `v85_pro_plus_schema.sql`。
3. 再執行一次 Pro+ schema，確認可重複套用。
4. 執行下方驗證查詢。

正式環境應將兩份內容轉成帶時間戳記的 Supabase migration，先在 staging 驗證，不直接手動修改 production。

## V3-1 基礎表

| 資料表 | 用途 | upsert key |
| --- | --- | --- |
| `portfolio_stocks` | 實際持股設定 | `(symbol, market)` |
| `watchlist_stocks` | 觀察與候選股票 | `(symbol)` |
| `market_snapshots` | 指數、風險模式與市場分數 | `(snapshot_date, source)` |
| `stock_snapshots` | 個股每日價量快照 | `(symbol, snapshot_date, source)` |
| `v85_scores` | V8.5 七個分項、總分與評級 | `(symbol, score_date)` |

基礎 schema 目前未啟用 RLS，只能用於隔離的開發環境；接到正式應用前需另行補上存取政策。

## V3-1.5 Pro+ 物件

### `v85_model_runs`

記錄每次計算的模型版本、資料截止時間、狀態、標的數與來源追蹤。批次狀態可為 `queued`、`running`、`succeeded`、`partial` 或 `failed`。

### `v85_pro_plus_scores`

保留七個分項與總分，另加入信心度、資料完整度、訊號、風險層級、投資論點、證據與風險旗標。唯一鍵為 `(symbol, score_date, model_version)`，因此不同模型版本可平行驗證。

### `war_room_snapshots` / `war_room_items`

Snapshot 是一次可發布的戰情室版本；items 是市場燈號、持股、風報比、主升段與禁碰清單的排序讀取模型。UI 應只讀最後一份 `published` snapshot，不直接跨多張來源表臨時組裝。

### `research_artifacts`

登錄 Supabase Storage 物件的 bucket、路徑、類型、擁有者、MIME、大小、雜湊與保存期限。檔案本體放在私有 `war-room-artifacts` bucket；詳細規則見 [Storage Policy](../docs/storage-policy.md)。

### Views

- `latest_v85_pro_plus_scores`：每檔股票的最新 Pro+ 評分。
- `latest_published_war_room_items`：最近已發布 snapshot 的所有區塊項目。

兩個 view 均使用 `security_invoker`，不繞過底層 RLS。

## 權限與 RLS

Pro+ 五張資料表預設啟用 RLS，並撤銷 `anon`、`authenticated` 的所有權限；V3-1.5 不建立 browser 直連 policy。讀寫由受信任的 server-only service 或排程使用 service-role 執行。

- service-role key 不使用 `NEXT_PUBLIC_` 前綴。
- signed URL 只能由伺服器產生並保持短效。
- 未導入 Supabase Auth 前，不要為了讓前端方便而新增寬鬆 `select` policy。
- 啟用 Auth 後，以新的 migration 加入最小權限與 owner／tenant 條件。

## 驗證查詢

確認資料表：

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

確認 Pro+ RLS：

```sql
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'v85_model_runs',
    'v85_pro_plus_scores',
    'war_room_snapshots',
    'war_room_items',
    'research_artifacts'
  )
order by relname;
```

確認私有 bucket（只在 Supabase 執行）：

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'war-room-artifacts';
```

確認 view：

```sql
select table_name
from information_schema.views
where table_schema = 'public'
  and table_name in (
    'latest_v85_pro_plus_scores',
    'latest_published_war_room_items'
  );
```

## 建議資料流程

1. Provider 收集市場與個股資料，service 正規化後寫入快照表。
2. 建立 `v85_model_runs` 並固定 `input_cutoff_at`。
3. V8.5 Pro+ 計算評分，以唯一鍵 upsert `v85_pro_plus_scores`。
4. Composer 產生 draft snapshot 與 items，驗證區塊完整性與資料新鮮度。
5. 同一 transaction 將 snapshot 發布；API 只讀最後成功版本。
6. 清理工作依 `expires_at` 刪除過期 Storage 物件並保留 metadata。

## 上線前檢查

- 備份資料庫與 Storage，完成還原演練。
- 將 schema 納入 migration 並在 staging 重跑。
- 建立同步、計算、發布、失敗重試與過期物件清理工作。
- 為 run ID、snapshot freshness、provider 失敗與孤兒物件建立監控。
- 確認 UI 對 partial、stale、empty 與 failed 狀態都有明確呈現。
