# Official Price Validation Pipeline

V8 將 TWSE／TPEx official quote 與 Yahoo fallback quote 統一轉成 fail-closed validation result。本 pipeline 是純函式：不 import connector reader／transport、不發 request、不寫 Supabase，也不接 UI 或 `/api/portfolio`。

## 資料流

```text
official quote + Yahoo fallback quote
  -> field-only normalizer
  -> required field gate
  -> symbol/date alignment
  -> close price difference comparison
  -> OfficialPricePipelineResult
```

Normalizer 只接受已知欄位 `symbol / close_price|price / record_date / record_time / source_name`，只做 trim 與有限數字檢查。缺值保持空字串或 null；禁止用 server time、fallback price 或其他來源補 official data。

## 必要欄位

Official 與 fallback 都必須包含：

- symbol
- valid positive close price
- valid `YYYY-MM-DD` record date
- valid record time
- source name

Official source 必須為 `twse-openapi` 或 `tpex-openapi`；fallback 必須為 `yahoo-finance`。Symbol 或 record date 不一致時無法安全比較，結果為 FAIL。

## Status

| 條件 | validation_status | data_warning | decision_allowed |
| --- | --- | --- | --- |
| 必要欄位完整且價差 ≤ 1% | PASS | false | true |
| 必要欄位完整且價差 > 1% | WARNING | true | false |
| 缺欄位、格式錯誤、來源／symbol／日期不一致 | FAIL | true | false |

價差計算以 official close 為分母：`abs(official - fallback) / official`。Fallback 只參與比較，永遠不覆蓋 output 的 close、date、time 或 source。

## 輸出契約

Result 固定包含 symbol、close_price、record_date、record_time、source_name、validation_status、data_warning、decision_allowed 與 issues。Issues 保留 code、severity、source role、field 與 message，不包含 key 或敏感持股資料。

V8 尚未把 pipeline 串到 runtime reader、API、ETL 或 database。下一階段必須先建立 War Room input contract，明確限制只有 PASS 可成為主要決策資料。
