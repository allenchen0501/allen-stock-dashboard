# Database Architecture

本文件定義 Allen Stock Dashboard 從 V3-1 到 V3-1.6 的資料庫分層、資料流與保存邊界。V3-1.6 是 V3-1.5 的 additive extension，不取代既有 schema，也不代表 UI 已接上 Supabase。

## Schema 演進

### V3-1：原始 schema

`supabase/schema.sql` 建立最小可用資料層：

- `portfolio_stocks`：目前實際持股設定。
- `watchlist_stocks`：尚未持有的觀察標的。
- `market_snapshots`：指數、風險模式與市場分數。
- `stock_snapshots`：個股每日價量快照。
- `v85_scores`：V8.5 七個分項、總分與評級。

這一層回答「持有什麼、觀察什麼、行情如何、基礎模型評分是多少」。

### V3-1.5：V8.5 Pro+ schema

`supabase/v85_pro_plus_schema.sql` 加入可追溯計算與發布邊界：

- `v85_model_runs`：模型批次、資料截止時間與來源追蹤。
- `v85_pro_plus_scores`：信心度、資料完整度、證據、論點與風險旗標。
- `war_room_snapshots`、`war_room_items`：一致且可發布的戰情室 read model。
- `research_artifacts`：私有 Storage 物件登錄。
- latest-score 與 latest-published-war-room views。

這一層回答「這個結論由哪批資料與哪個模型產生、是否完整、目前 UI 應讀哪一版」。

### V3-1.6：補強 schema

`supabase/v85_pro_plus_schema_v2.sql` 補齊未來 2～3 年的績效、技術、策略學習與風險歷史：

| 資料表 | 責任 |
| --- | --- |
| `portfolio_performance_snapshots` | 投入成本、市值、已實現／未實現損益、報酬率與水位 |
| `technical_signals` | 每檔每日技術條件是否成立 |
| `strategy_patterns` | 訊號組合在市場型態／產業下的統計摘要 |
| `market_breadth_snapshots` | 漲跌、新高低、強弱股比例與廣度分數 |
| `capital_management_snapshots` | 現金、投入資本、總權益、實際與建議水位 |
| `position_risk_snapshots` | 單一部位融資、追繳、斷頭、停損與預估回撤 |
| `strategy_validation_results` | 訊號後 1／5／20 個交易日結果 |
| `war_room_decisions` | 每日或盤中決策、產業／標的清單、風險與 AI 摘要 |

## 共通時間與來源欄位

V3-1.6 每張表都有 `record_date`、`record_time`、`source_name`、`source_type`、`source_confidence`、`data_frequency` 與 `is_model_inference`。

- `record_date` / `record_time`：資料所描述的市場時間，producer 必須明確以 `Asia/Taipei` 產生；不可依賴資料庫 session timezone 推測。
- `created_at` / `updated_at`：系統稽核時間，使用 `timestamptz` 並以 UTC 保存。
- `source_name`：具體來源或計算器名稱，例如 `twse`、`yahoo-finance`、`v85-pro-plus`。
- `source_type`：來源類型，例如 provider、manual、calculated、model、imported。
- `source_confidence`：0～100 的來源可信度百分比，不等同模型勝率。
- `data_frequency`：資料頻率，例如 intraday、daily、weekly、backtest。
- `is_model_inference`：`false` 表示觀測／計算事實，`true` 表示模型推論。

所有 `ratio`、`rate`、`confidence`、`win_rate` 與 `score` 欄位均保存「百分比值」而非 0～1 小數，例如 82.5% 寫為 `82.5`。`average_drawdown` 使用負百分比；`max_drawdown_estimate` 使用正的損失幅度。

## Portfolio、Watchlist、Trade Journal

三者不可混用：

| 領域 | 回答的問題 | 主要資料 |
| --- | --- | --- |
| Portfolio | 現在實際持有什麼、資金與風險如何 | `portfolio_stocks`、績效／資金／部位風險 snapshots |
| Watchlist | 尚未持有但想追蹤什麼 | `watchlist_stocks`、行情、技術訊號、Pro+ 分數 |
| Trade Journal | 過去實際下了哪些單、為何進出、事後檢討什麼 | 未在 V3-1.6 建表；未來應以獨立 orders／trades／journal migration 建立 |

`war_room_decisions` 是系統建議歷史，不是實際成交紀錄；`strategy_validation_results` 是策略樣本驗證，也不是個人交易損益。未來 Trade Journal 不應用這兩張表替代。

## 戰情室首頁六大區資料來源

1. **市場燈號**：`market_snapshots` + `market_breadth_snapshots` + 最新 `war_room_snapshots`。
2. **V8.5 核心評分**：`v85_pro_plus_scores` + `technical_signals` + `strategy_patterns`。
3. **持股戰情中心**：`portfolio_stocks` + `stock_snapshots` + `portfolio_performance_snapshots` + `position_risk_snapshots`。
4. **風報比排行**：Pro+ 風報分項 + `capital_management_snapshots` + 停損／回撤資料。
5. **主升段候選池**：`watchlist_stocks` + `technical_signals` + `strategy_patterns` + `strategy_validation_results`。
6. **今日禁碰股**：技術弱勢訊號 + 市場廣度 + Pro+ 風險旗標 + `position_risk_snapshots`。

Composer 將上述來源固定在同一 `input_cutoff_at`，產生 `war_room_items`，再把總體行動與摘要寫入 `war_room_decisions`。首頁仍只讀已發布 snapshot，不在每張卡片各自查詢最新列。

## 技術共振引擎資料流

```text
stock_snapshots + market_snapshots + market_breadth_snapshots
                         ↓ normalize by trading date
                  technical_signals
                         ↓ match signal combinations
                   strategy_patterns
                         ↓ combine regime / industry / risk
                v85_pro_plus_scores
                         ↓ publish
            war_room_items + war_room_decisions
```

同一 symbol、日期、時間與來源只能有一筆技術訊號。訊號計算必須使用該 `record_time` 當下可取得的資料，避免偷看未來。共振分數屬模型推論；均線位置、突破與量價條件屬可重算事實，兩者用 `is_model_inference` 區分。

## 策略驗證與學習引擎資料流

```text
published signal / decision
          ↓ freeze signal date, entry rule and strategy name
observe prices after 1d / 5d / 20d
          ↓
strategy_validation_results
          ↓ aggregate by regime + industry + signal combination
strategy_patterns (new dated version)
          ↓
next model run uses only patterns available before its cutoff
```

- `validation_date` 不得早於 `signal_date`，交易日位移需使用交易所日曆而非日曆日。
- 成功定義、進場價規則、除權息與交易成本調整必須由 strategy version 固定；改規則時建立新 strategy name/version，不覆寫舊結果。
- `strategy_patterns` 每次重算新增一個帶日期／時間的統計版本，不更新歷史版本來改變當時判斷。
- 訓練、調參與評估期間必須分離，避免 win rate 因同一批樣本反覆調參而失真。

## 資料保存策略

資料保存遵循 [Storage Policy](./storage-policy.md)。資料庫刪除工作不包含在 V3-1.6 migration；正式清理前先建立月度彙總、備份與可重跑的 retention job。

### 永久保存

- `portfolio_stocks`、`watchlist_stocks` 的目前狀態與未來的異動稽核紀錄。
- `v85_model_runs`、`v85_scores`、`v85_pro_plus_scores`：模型可追溯性。
- `strategy_patterns`、`strategy_validation_results`：策略學習與防止倖存者偏差。
- `war_room_snapshots`、`war_room_items`、`war_room_decisions`：當時看見的資料與決策歷史。
- 每月最後一筆與每年最後一筆 portfolio／capital performance 彙總。
- 未來 Trade Journal 的訂單、成交、費用與檢討紀錄。

「永久」表示產品資料生命週期內保留，仍需備份、封存與刪除政策，不表示無限制保留個資或 Storage 大檔。

### 線上只保留 12 個月

- `technical_signals` 的每日明細。
- `market_breadth_snapshots` 的盤中／每日明細。
- `portfolio_performance_snapshots` 的日內與每日明細；月末／年末彙總永久保存。
- `capital_management_snapshots` 的日內與每日明細；月末／年末彙總永久保存。
- `position_risk_snapshots` 的日內與每日明細。
- 高容量 `stock_snapshots` 明細；若回測需要更長期間，先轉入分區表或冷資料倉儲再從主庫清除。

清理以 `record_date` 為準，採「先彙總／封存、驗證筆數與雜湊、再分批刪除」。任何仍被稽核事件或未完成策略驗證引用的資料都應延後刪除。

## Migration 與安全邊界

套用順序固定為 `schema.sql` → `v85_pro_plus_schema.sql` → `v85_pro_plus_schema_v2.sql`。V3-1.6 依需求不啟用 RLS，但 migration 撤銷 `anon` 與 `authenticated` 權限，避免 PostgREST 直接存取。正式接上任何 client 前，仍需另開安全 migration，逐表決定 RLS 或專用 private schema；不得在前端加入 service-role key。

