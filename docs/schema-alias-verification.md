# Schema Alias Verification

## 目的

Schema alias contract 將官方 payload 欄位對應到 `symbol`、`close_price`、`volume`、`record_date`、`record_time` 與 `source_name` 等 canonical 欄位。Contract 只記錄證據狀態，不會自動選擇 alias、修正欄位或放寬 validation。

實作位置：`connectors/evidence/schema-alias-contract.ts`。

## Alias 狀態

| 狀態 | 定義 | 是否可視為已核准 |
| --- | --- | --- |
| `configured_candidate` | reader 已設定此名稱，但 evidence 未記錄實際命中 key | 否 |
| `attempted_not_resolved` | 已在目前時間 alias set 中嘗試，runtime 仍無值 | 否 |
| `candidate_unverified` | 合理的待查名稱，尚未在 raw payload field list 中確認 | 否 |

所有 alias 預設 `approved: false`。核准必須有來源、endpoint 版本、field-name-only descriptor、schema hash 與欄位語意的人工審查紀錄，不能只依名稱相似度決定。

## record_time Alias Contract

目前 `Time`、`time`、`TradeTime`、`資料時間` 未產生值。下列名稱列為待人工確認候選：

- `record_time`
- `update_time`
- `trade_time`
- `data_time`
- `timestamp`

候選欄位必須代表官方資料的交易或資料更新時間，且格式與時區可被明確解釋。HTTP request time、response time、檔案建立時間及執行機器目前時間都不是 record time alias。

若 raw payload 沒有合格欄位：

```text
record_time = null
validation_status = FAIL
issue = MISSING_RECORD_TIME
```

此規則維持 fail closed，不得猜值。

## 人工驗證流程

1. 由人工明確啟用 runtime test，且每來源只執行允許的低頻 request。
2. 在本機查看 payload 的欄位名稱與資料型別；不要將真實 raw payload commit。
3. 對照 canonical field，記錄實際命中的 raw key、endpoint、schema hash 與欄位語意。
4. 確認日期、時間格式及時區；資訊不足時維持未核准。
5. 由人工核准 alias 後，另案修改 reader mapping 並執行 fixtures、build 與 runtime evidence。
6. schema hash 改變時重新驗證，不得自動沿用或修正 mapping。

## Source-specific 注意事項

- TWSE 與 TPEx 必須各自核准，不可因其中一方使用某欄位就推定另一方相同。
- `source_name` 目前由 server-side adapter 提供，不是對 raw payload 欄位的推測。
- volume 未包含在本次 Runtime Evidence 的必要欄位判定中，故維持 `not_evaluated`，不改變既有 validation policy。
- 本 contract 不發 request、不寫 Supabase，也不影響 Dashboard 或 API。
