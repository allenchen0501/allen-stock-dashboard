# ETL Source Plan

V3-3.6 第一階段只規劃免費、公開且不需要商業授權 key 的來源。下表的 confidence 是初始政策值，用於 lineage 與 Data Quality 判斷；除官方來源外，需依實際穩定度與比對結果調整，不能把 confidence 當成免驗證通行證。

| 來源 | 用途 | 建議更新頻率 | 初始 confidence | 主要限制 |
| --- | --- | --- | ---: | --- |
| TWSE OpenAPI | 上市收盤價、大盤、三大法人、融資融券、官方校驗 | 交易日盤後 14:30～15:30；籌碼 20:00 補抓 | 100 | endpoint／欄位可能改版；不同資料集公布時間不一致；需依交易日曆判斷 |
| TPEx OpenAPI | 上櫃收盤價、法人、融資融券 | 交易日盤後 14:30～15:30；籌碼 20:00 補抓 | 100 | 上櫃代號與上市市場不可混用；公布時間與欄位需個別驗證 |
| TWSE ISIN | 建立／更新 `stock_master`：symbol、stock name、market type、industry、active | 每週完整同步；交易日做差異檢查 | 100 | HTML／表格格式可能變更；不是即時行情；下市／轉市場需保留歷史而非硬刪 |
| MOPS | 月營收、財報、重大訊息 | 每日 20:00；公告期可追加低頻重試 | 100 | 民國年／西元年、合併／個別報表與更正公告需正規化；不可高頻抓取 |
| Yahoo Finance | 美股、SOX、NASDAQ、DOW、VIX、Brent、WTI、黃金、DXY；台股輔助校驗 | 全球市場 23:00；台股只在指定工作低頻比對 | 全球 80／台股 70 | 非台股官方來源；symbol mapping、時區、延遲與 adjusted/unadjusted price 需驗證；遵守使用條款與合理頻率 |
| twstock | 台股盤中低頻驗證 | 最多使用 12:00 盤中快照或人工診斷 | 60 | 不得高頻輪詢；資料仍需與官方來源校驗；套件／上游格式可能變更 |

## 各來源輸出規格

### TWSE／TPEx OpenAPI

每個 dataset 使用獨立 parser 與 schema version，不能用同一 mapper 猜測所有欄位。價格與成交量需保留原始單位，再轉成 dashboard 標準單位；法人與融資融券以交易日為業務日期。官方資料仍須驗證空值、重複列、日期與筆數，confidence 100 不等於永不出錯。

### TWSE ISIN

ISIN 只負責 stock master，不提供日價。同步流程採 upsert：新代號新增、名稱／產業／市場異動留 audit、來源清單消失的代號先標待確認，連續多次缺席或官方狀態確認後才設 `is_active = false`。

### MOPS

月營收按公司與年月唯一；更正公告建立新 ingestion version 並更新 current view，不刪除舊值。財報必須標示 fiscal year、quarter、合併／個別、幣別與公告時間。重大訊息保存原始公告識別與摘要，不由 ETL 直接生成交易建議。

### Yahoo Finance

全球 symbol mapping 必須集中維護，例如指數、期貨、匯率與商品不可只靠字串前綴判斷。台股 Yahoo 值只能作第二來源；若 TWSE／TPEx 尚未取得，不得把 Yahoo 單一來源包裝成官方收盤價。

### twstock

只用於盤中低頻 sanity check 或故障診斷，不作歷史主資料源、官方收盤價或高頻 feed。每次使用仍需記錄 source timestamp、fetched timestamp 與 data quality status。

## GitHub Taiwan-Stocks 的邊界

GitHub Taiwan-Stocks 只可參考：

- K 線處理流程。
- 三大法人抓取／正規化流程。
- ETL job、重試與資料分層設計。

不得直接照搬 repository 內的資料、快照、憑證、排程或無法確認授權／來源的檔案。任何採用的設計概念都需依本專案 schema、Data Quality contract 與來源條款重新實作。

## 禁止來源

- FinLab 付費方案。
- CMoney API。
- Goodinfo 付費資料。
- 券商付費 API。
- 任何需要授權金鑰的商業資料源。

新增來源前必須完成：是否免費公開、是否允許自動化存取、頻率限制、欄位與單位、資料保存權利、source confidence、fallback 角色與停止使用條件的書面審核。

