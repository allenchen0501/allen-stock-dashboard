# ETL Foundation Layer

V3-4.6 把 V3-3.6 的 ETL architecture 落成 TypeScript contract 與安全 no-op skeleton。本階段不抓資料、不呼叫 API、不寫 Supabase、不建立 cron、不部署，也不改變任何現有資料流。

## 目錄結構

```text
etl/
├─ core/
│  ├─ etl-job.ts
│  └─ etl-result.ts
├─ sources/
│  ├─ twse-source.ts
│  ├─ tpex-source.ts
│  ├─ isin-source.ts
│  └─ yahoo-source.ts
├─ validators/
│  └─ price-validator.ts
├─ loaders/
│  └─ supabase-loader.ts
└─ index.ts
```

## Lifecycle contract

```text
source.collect()
       ↓
ETL job validate(records)
       ↓
Data Quality Layer / price comparison
       ↓
ETL job load(valid records)
       ↓
Supabase loader
       ↓
ETLResult
```

`ETLJob` 統一：

- `job_name`
- `source_name`
- `run()`：未來協調 collect → validate → load。
- `validate()`：把 raw records 分成 valid／rejected 與 issues。
- `load()`：只接收 validated records，回傳 load result。

目前 `ETLJobContext.dry_run` 是 literal `true`，避免 V3-4.6 contract 被誤認為可執行 production load。這一版沒有 concrete ETL job，也沒有任何地方呼叫 `run()`。

## Source skeletons

### TWSE

- Source：`twse-openapi`
- Confidence：100
- 預留：`daily_prices`、`market_snapshots`、`chip_snapshots`

### TPEx

- Source：`tpex-openapi`
- Confidence：100
- 預留：`daily_prices`、`chip_snapshots`

### ISIN

- Source：`twse-isin`
- Confidence：100
- 預留：`stock_master`

### Yahoo fallback

- Source：`yahoo-finance-fallback`
- Confidence：70（台股 fallback 初始政策）
- 預留：全球市場快照與台股盤中 fallback
- 永遠不提供 Portfolio membership list

四個 `collect()` 都只回傳空 records、`FOUNDATION_ONLY` warning 與 `collected_at = null`。檔案中沒有 endpoint、fetch、HTTP client、credential 或 retry loop。

## Price Validator skeleton

`PriceValidator` 固定 official primary 為 TWSE／TPEx，Yahoo 只能是 comparison fallback，並引用 V3-3.5 的 1% price threshold。V3-4.6 不執行實際比較，永遠回傳：

- `status = pending`
- `decision_ready = false`
- V3-4.7 shadow validation warning

這避免 skeleton 在尚未有 source adapters 時輸出假的 PASS。

## Supabase Loader skeleton

`SupabaseLoader` 不 import `@supabase/supabase-js`，不接受 Supabase client，也不讀環境變數。`load()` 只產生 dry-run result：

- `success = true`：表示 no-op 呼叫本身正常完成，不表示資料已載入。
- `skipped = true`
- `loaded_records_count = 0`
- warning code：`DRY_RUN_NO_WRITE`

任何下游判斷 load 成功時必須同時檢查 `success`、`skipped` 與 `loaded_records_count`，不能只看 `success`。

## 與既有層的關係

```text
ETL source skeleton
        ↓
ETL normalized contract
        ↓
V3-3.5 Data Quality Layer
        ↓
Supabase loader port (no-op in V3-4.6)
        ↓
Repository Layer（尚未接入）
```

- ETL 不 import app、components、services 或 repositories。
- Repository 不負責抓外部資料。
- API 不直接執行 ETL。
- Dashboard 不直接呼叫 source。
- Yahoo Provider 維持現況；ETL Yahoo skeleton 是未來 adapter boundary，不取代既有 provider。

## 明確不做

- 不發出 TWSE、TPEx、ISIN 或 Yahoo request。
- 不寫入 Supabase。
- 不建立 table、migration、key 或 login。
- 不建立 cron、scheduler、queue、worker 或 deployment config。
- 不安裝 package。
- 不切換 Portfolio API、UI 或資料來源。

## V3-4.7 Shadow Validation 前置

下一階段若建立 shadow validation，仍應保持 no-write：

1. 先以 fixture／captured sample 測試 parser，不直接接 production schedule。
2. 建立 TWSE／TPEx official 與 Yahoo fallback normalized records。
3. 呼叫既有 Data Quality comparison，輸出 PASS／WARNING／FAIL。
4. Shadow result 只寫 log／artifact 或測試輸出，不更新正式 Supabase table。
5. 驗證 symbol、date、unit、difference threshold 與 zero-record failure。

完成 shadow 分布與錯誤處理後，才另開階段審核真實 connector 與 loader。

