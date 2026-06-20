# Free Data ETL Pipeline Architecture

V3-3.6 定義 Allen Stock Dashboard 的免費資料 ETL 邊界。這一階段只有架構與規格，不建立 Python 專案、爬蟲、排程、資料表或真實資料連線。

## 核心資料流

```text
Free Data Sources
        ↓
Python ETL
        ↓
Data Quality Layer
        ↓
Supabase
        ↓
Repository Layer
        ↓
API Layer
        ↓
War Room Engine
        ↓
Dashboard
```

依賴只能往下。每一層有單一責任，失敗時保留最後一份已驗證資料，不得讓未驗證的上游 payload 越級進入戰情室。

## 層級責任

### Free Data Sources

第一階段只允許 TWSE OpenAPI、TPEx OpenAPI、TWSE ISIN、MOPS、Yahoo Finance 與低頻 twstock。GitHub Taiwan-Stocks 只供閱讀 K 線、三大法人與 ETL 流程設計，不是資料來源，不能複製其資料進正式資料庫。

禁止 FinLab 付費方案、CMoney API、Goodinfo 付費資料、券商付費 API，以及任何需要授權金鑰的商業資料源。若免費來源日後改成需付費或需商業 key，pipeline 必須停止使用並重新審核，不得把 key 偷放進前端或 repository。

### Python ETL

未來的 Python ETL 負責 collect、normalize、deduplicate 與 load：

1. 收集來源回應並保存 run metadata，不直接信任欄位名稱。
2. 正規化 symbol、市場、交易日、`Asia/Taipei` 時間、價格幣別與成交量單位。
3. 保留 `source_name`、`source_type`、`source_confidence`、來源時間與抓取時間。
4. 以 deterministic key 去重，確保相同工作可安全重跑。
5. 只把通過 Data Quality gate 的資料送入正式 Supabase table。

ETL 不計算 UI 文案、不直接呼叫 React／Next.js，也不發布買賣建議。

### Data Quality Layer

每筆數值先映射成 V3-3.5 的 `DataQualityRecord`，接受完整性、新鮮度、模型推論標記與雙來源比對：

- `valid`：可進入正式資料表與後續決策流程。
- `stale`：只可作 reference；不得成為今日買賣建議主依據。
- `suspicious`：隔離並等待重試、第二來源或人工確認。
- `invalid`：拒絕載入正式資料表並記錄 issue。

台股價格差異大於 1%、成交量差異大於 5% 時不可自動進入 War Room Engine。

### Supabase

Supabase 保存已正規化、可追溯的結構化資料與 ETL run metadata。正式 load 應使用 transaction／upsert、既有 unique key 與明確 migration；不在 ETL runtime 臨時建表，也不把原始大型檔案塞進 JSONB。

V3-3.6 不新增 service-role key。未來排程憑證必須只存在 server-side secret store，權限需限制為 ETL 所需 table；browser anon key 不可用來執行批次載入。

### Repository、API 與 War Room

Repository 只讀寫 Supabase，不抓外部網站。API 只呼叫 application service／repository，不直接拼 SQL，也不把來源 payload 傳給 UI。War Room Engine 只接收已通過品質驗證、帶資料截止時間的資料集，並發布可追溯 report/snapshot。

## 前端禁止直接抓外部網站

Dashboard、Client Component 與 browser code 不得直接呼叫 TWSE、TPEx、ISIN、MOPS、Yahoo 或 twstock，原因包括：

- 無法集中處理 rate limit、重試、格式改版與來源封鎖。
- 容易產生 CORS、時區、單位與不同使用者畫面不一致。
- 無法保證每張卡片使用相同資料截止時間。
- 會繞過 Data Quality Layer、歷史保存、source lineage 與決策 gate。

前端只能讀取本專案 API 或 server-rendered view model。即使外部 endpoint 公開，也不能當成 browser 直連授權。

## 目標資料集與用途

以下名稱是 V3-3.6 的 logical target。只有標示「既有」者目前已有 schema；其餘必須等後續 migration 才能 load。

| 資料集／資料表 | 狀態 | 用途 |
| --- | --- | --- |
| `stock_master` | 規劃中 | 由 ISIN 建立 symbol、名稱、市場、產業與 active 狀態的股票主檔 |
| `daily_prices` | 規劃中 | 官方日 K／收盤價、開高低收、成交量與調整資訊的長期事實表 |
| `stock_snapshots` | 既有 | 個股指定日期／來源的價格、漲跌、成交量與成交值快照 |
| `market_snapshots` | 既有 | 台股／全球指數、風險模式與市場分數快照 |
| `chip_snapshots` | 規劃中 | 三大法人、融資融券與籌碼變化 |
| `monthly_revenue_snapshots` | 規劃中 | MOPS 月營收、月增／年增與公告時間 |
| `fundamental_snapshots` | 規劃中 | 財報期間、損益、資產負債、現金流與衍生基本面指標 |
| `technical_snapshots` | 規劃中 | 從 validated prices 計算的均線、量價與技術指標快照；不取代既有 `technical_signals` |
| `strategy_backtests` | 規劃中 | 策略版本、樣本區間、參數與回測統計，禁止混入未來資料 |
| `prediction_validations` | 規劃中 | 預測／訊號在後續交易日的實際結果；與既有 `strategy_validation_results` 需在 migration 前釐清邊界 |
| `v85_scores` | 既有 | V8.5 七分項、總分與評級；只讀取已驗證的上游資料 |
| `war_room_reports` | 規劃中 | 戰情室報告內容、版本、截止時間與發布狀態；不取代既有 snapshot/items read model |

## 標準資料信封

每一個 ETL output 至少保留：

- 業務鍵：symbol／market／record date／資料種類。
- 數值與單位：價格幣別、成交量單位、百分比採 0～100。
- 來源：source name/type/confidence、source timestamp、fetched timestamp。
- 品質：status、issues、是否 single-source、是否 model inference。
- 執行：ETL run ID、parser version、raw checksum、loaded timestamp。

不得用 ETL 抓取時間冒充來源交易時間，也不得把缺值補成 0。

## Idempotency 與發布

- Stock master：`(symbol, market_type)`。
- 日價：`(symbol, trade_date, source_name)`。
- 市場快照：沿用既有 `(snapshot_date, source)`。
- 個股快照：沿用既有 `(symbol, snapshot_date, source)`。
- 月營收：未來建議 `(symbol, revenue_year, revenue_month, source_name)`。

每個 job 先寫 staging／run result，完成筆數、唯一鍵、品質比例與 checksum 驗證後才 publish。新 run 失敗時不覆蓋上一份已發布資料；部分成功必須明確標記，不得偽裝完整成功。

## 失敗處理與可觀測性

每次 ETL run 記錄來源、排程時間、開始／結束時間、抓取／解析／有效／隔離／載入筆數、重試次數與錯誤摘要。至少監控：來源格式改版、零筆資料、筆數異常、官方與輔助來源偏差、連續 stale、同一 unique key 衝突，以及 War Room 必要資料集未完成。

ETL 全部失敗時，API 與 Dashboard 只能顯示上一份成功資料及其時間；War Room Engine 不得把舊資料重新標成今日資料。

