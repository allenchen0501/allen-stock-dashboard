# ETL Data Contract

V3-4.6 contract 用來固定 ETL 各階段交換的最小欄位。它不是 database schema，也不代表 source payload 已可使用。

## ETL source record

`ETLSourceRecord<TPayload>`：

| 欄位 | 型別 | 規則 |
| --- | --- | --- |
| `record_key` | string | deterministic business key，不可用隨機 UUID 取代去重鍵 |
| `symbol` | string/null | 個股資料必填；市場級資料可為 null |
| `record_date` | string | `YYYY-MM-DD`，代表來源業務／交易日 |
| `record_time` | string | 來源時間；台股依 `Asia/Taipei` 解讀 |
| `source_name` | string | 例如 `twse-openapi`、`tpex-openapi` |
| `source_type` | DataSourceType | official exchange、market API 等既有 enum |
| `source_confidence` | number | 0～100；官方初始 100，Yahoo 台股 fallback 70 |
| `is_model_inference` | boolean | 原始來源一律 false；模型資料必須 true |
| `payload` | generic | parser 尚未正規化的 source-specific fields |

ETL 抓取時間不能覆蓋 `record_date`／`record_time`。未來應另存 fetched time、parser version、raw checksum 與 run ID；不能把缺少日期的資料補成今天。

## Source batch

`ETLSourceBatch<TRecord>` 包含 source name、records、warnings、errors 與 `collected_at`。V3-4.6 skeleton 的 `collected_at = null`，表示沒有發生真實 collect。

真實 connector 未來只有在 request 成功、payload 已完整讀取時才能填 collected time。HTTP 200 但零筆、schema mismatch 或日期錯誤不能視為正常空清單。

## Validation batch

`ETLValidationBatch<TRecord>` 分為：

- `valid_records`
- `rejected_records_count`
- `warnings`
- `errors`

只有 valid records 可交給 loader。WARNING 是否可 load 由 dataset policy 決定；`invalid`／`suspicious` 不得進正式 table。價格資料需遵循 official primary + Yahoo fallback 的 1% threshold。

## ETL result

所有 job 結果至少包含：

- `success`
- `records_count`
- `warnings`
- `errors`
- `started_at`
- `finished_at`

時間使用 UTC ISO 8601。`finished_at` 不得早於 `started_at`，records count 不可為負。`success = true` 代表 job orchestration 正常完成；若 loader `skipped = true`，絕對不能宣稱已寫入資料。

## Load result

`ETLLoadResult` 另含：

- `skipped`
- `attempted_records_count`
- `loaded_records_count`
- `target_table`

V3-4.6 固定 `skipped = true`、`loaded_records_count = 0`。未來真實 loader 必須回報 attempted、inserted、updated、rejected，而不是把 input length 當成 loaded count。

## Price validation plan

輸入：

- `official_source`：`twse-openapi` 或 `tpex-openapi`
- `official`：Priority 1 normalized record
- `yahoo_fallback`：可選 Priority 2 record

V3-4.6 只回傳 pending plan。V3-4.7 才可呼叫正式 comparison，並需輸出 primary／secondary value、record date/time、difference ratio、threshold、PASS／WARNING／FAIL 與 issues。沒有 fallback 時 comparison source 必須為 null，不能偽造 0% 差異。

## Payload contract

### Price payload（未來）

至少需要：open、high、low、close、volume、currency、market、session、price basis。成交量需先正規化股／張；adjusted 與 unadjusted price 不可混比。

### Stock master payload

ISIN skeleton 預留：stock name、market type、industry、active。Symbol 位於 envelope；來源清單暫時消失不能立即硬刪，需依 master sync policy 確認。

### Yahoo payload

保留 yahoo symbol 與 source-specific fields。Yahoo 台股只作 fallback，不可從 payload 推導 Portfolio membership，也不可標成 official close。

## Target 與 idempotency（規劃）

| Target | 建議 business key |
| --- | --- |
| `stock_master` | `(symbol, market_type)` |
| `daily_prices` | `(symbol, record_date, source_name)` |
| `stock_snapshots` | `(symbol, snapshot_date, source)` |
| `market_snapshots` | `(snapshot_date, source)` |
| `chip_snapshots` | `(symbol, record_date, source_name)` |

`SupabaseLoadRequest.conflict_keys` 只是 dry-run metadata。真實 upsert 前必須確認 database unique constraint 完全相符；不能由 caller 任意傳入不存在的 conflict key。

## Warning 與 error

`ETLIssue` 包含 code、message、可選 record key 與 details。Details 禁止放 API key、完整 raw credential、signed URL 或敏感 Portfolio 成本／股數。

- Warning：可繼續但需追蹤，例如 fallback 缺失、dry run、optional field 缺失。
- Error：該 record／dataset 不可 load，例如 schema mismatch、日期無效、官方來源零筆。

錯誤訊息必須可聚合，不使用每次都不同的自由文字作唯一識別；code 應保持穩定。

