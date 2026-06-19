# Allen Stock Dashboard — Supabase

本目錄包含三階段 schema：`schema.sql` 是 V3-1 基礎資料層，`v85_pro_plus_schema.sql` 是 V3-1.5 additive migration，`v85_pro_plus_schema_v2.sql` 是 V3-1.6 績效、技術、策略與風險補強。兩份 Pro+ migration 都不會刪除或改寫前一階段資料，但必須依序執行。

## 套用順序

在新的 Supabase 專案使用 SQL Editor：

1. 執行 `schema.sql`。
2. 執行 `v85_pro_plus_schema.sql`。
3. 執行 `v85_pro_plus_schema_v2.sql`。
4. 再依相同順序執行兩份 Pro+ migration，確認可重複套用。
5. 執行下方驗證查詢。

正式環境應將三份內容轉成帶時間戳記的 Supabase migration，先在 staging 驗證，不直接手動修改 production。V3-1.6 會先檢查 V3-1.5 的 function 與資料表是否存在，順序錯誤時會中止 transaction。

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

## V3-1.6 補強表

### `portfolio_performance_snapshots`

保存投資績效中心的投入成本、市值、已實現／未實現損益、總損益、報酬率、現金與持股水位。唯一鍵為 `(record_date, record_time, source_name)`。

### `technical_signals`

保存每檔股票每日或指定時間點的均線、月扣抵、布林、老鴨頭、洗盤、量價突破、平台突破與拉回支撐訊號。唯一鍵為 `(symbol, record_date, record_time, source_name)`。

### `strategy_patterns`

保存訊號組合在市場型態與產業分類下的樣本數、成敗數、勝率、平均報酬、平均回撤與評分。每次重算保留帶日期／時間的新統計版本。

### `market_breadth_snapshots`

保存市場漲跌家數、漲跌停、新高低家數、強弱股比例與廣度分數，可依市場、日期、時間與來源 upsert。

### `capital_management_snapshots`

保存可用現金、投入資本、總權益、單一／總部位上限、現金比率、模型建議水位與風險層級。

### `position_risk_snapshots`

保存逐檔持股成本、現價、數量、融資比例、追繳／斷頭／停損價格、預估最大回撤與風險層級。

### `strategy_validation_results`

保存每個策略訊號後 1、5、20 個交易日的價格、報酬、成功判斷、失敗原因與分數，作為策略學習引擎的不可變樣本。

### `war_room_decisions`

保存盤前、盤中、盤後或每日戰情決策，包括市場模式、建議動作與水位、強勢產業／標的、禁碰標的、風險摘要與 AI 摘要。

八張表都包含共同的資料日期／時間、來源、可信度、頻率與模型推論標記。欄位單位、六大首頁區塊資料來源、技術共振與策略學習流程見 [Database Architecture](../docs/database-architecture.md)。

## 權限與 RLS

Pro+ 五張資料表預設啟用 RLS，並撤銷 `anon`、`authenticated` 的所有權限；V3-1.5 不建立 browser 直連 policy。讀寫由受信任的 server-only service 或排程使用 service-role 執行。

V3-1.6 依階段要求不啟用 RLS，但 migration 仍撤銷八張新表的 `anon`、`authenticated` 權限，避免在 RLS 關閉時經 PostgREST 直接存取。未來若要接 Supabase Client，必須先以獨立 migration 設計 RLS，不可只重新授權 browser roles。

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

確認 V3-1.6 八張表存在且 RLS 維持關閉：

```sql
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'portfolio_performance_snapshots',
    'technical_signals',
    'strategy_patterns',
    'market_breadth_snapshots',
    'capital_management_snapshots',
    'position_risk_snapshots',
    'strategy_validation_results',
    'war_room_decisions'
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
7. 技術引擎寫入 `technical_signals`，驗證工作在 1／5／20 個交易日後寫入 `strategy_validation_results`。
8. 聚合驗證結果形成帶版本時間的 `strategy_patterns`，供後續模型 run 使用。

## 上線前檢查

- 備份資料庫與 Storage，完成還原演練。
- 將 schema 納入 migration 並在 staging 重跑。
- 建立同步、計算、發布、失敗重試與過期物件清理工作。
- 為 run ID、snapshot freshness、provider 失敗與孤兒物件建立監控。
- 確認 UI 對 partial、stale、empty 與 failed 狀態都有明確呈現。
