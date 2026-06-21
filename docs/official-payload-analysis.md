# Official Payload Analysis

## V10.7 分析範圍

本文件分析已完成的 V10 Runtime Evidence 結果，不重新呼叫 TWSE 或 TPEx endpoint。已知結果如下：

| 來源 | 測試股票 | HTTP | 已正規化 | 未正規化 | 結果 |
| --- | --- | --- | --- | --- | --- |
| TWSE OpenAPI | 2330、2455 | 200 | symbol、close_price、record_date、source_name | record_time | FAIL：`MISSING_RECORD_TIME` |
| TPEx OpenAPI | 4979、5347 | 200 | symbol、close_price、record_date、source_name | record_time | FAIL：`MISSING_RECORD_TIME` |

`source_name` 是 connector adapter 指派的來源 metadata，不代表官方 payload 內存在同名欄位。Runtime Evidence 沒有把 volume 列為必要欄位，因此本次結果不能據此確認 volume 是否存在。

## 證據限制

V10 evidence 只輸出 `schema_hash`，沒有保存 raw payload、schema descriptor 或命中的 raw key。workspace 也沒有真實 evidence raw payload。因此，本次可以確認 canonical 欄位的正規化結果，但不能從 hash 反推出官方 payload 的完整 raw 欄位名稱，也不能判定同一 alias set 中究竟是哪個 key 命中。

下列名稱是 reader 目前設定的候選 alias，不等於已逐一確認的官方欄位：

| Canonical field | TWSE reader 候選 | TPEx reader 候選 | Runtime 結果 |
| --- | --- | --- | --- |
| symbol | `Code`、`code`、`StockNo`、`證券代號` | `SecuritiesCompanyCode`、`Code`、`code`、`證券代號` | 已成功正規化；實際命中 key 未記錄 |
| close_price | `ClosingPrice`、`Close`、`close`、`收盤價` | `Close`、`ClosingPrice`、`close`、`收盤價` | 已成功正規化；實際命中 key 未記錄 |
| record_date | `Date`、`date`、`TradeDate`、`資料日期` | `Date`、`date`、`TradeDate`、`資料日期` | 已成功正規化；實際命中 key 未記錄 |
| record_time | `Time`、`time`、`TradeTime`、`資料時間` | `Time`、`time`、`TradeTime`、`資料時間` | 未取得值 |

## record_time 判定

目前證據只能確認 `Time`、`time`、`TradeTime`、`資料時間` 這組既有 mapping 沒有產生 `record_time`。現有 evidence 未列出 raw keys，因此無法確認 payload 是否另有 `record_time`、`update_time`、`trade_time`、`data_time` 或 `timestamp`。

在人工核對 raw field-name-only descriptor 前，這五個名稱都只能是候選 alias，不能自動加入正式 mapping。若 payload 確實沒有具備明確交易時間語意的欄位，canonical `record_time` 必須保持 `null`，validation 繼續輸出 FAIL，不得用 request time、response time、目前時間或日期補值。

## 結論

- TWSE 與 TPEx endpoint 均可回應並找到指定 symbol。
- close price 與 record date 已通過目前的正規化路徑。
- record time 在目前 mapping 下不存在於正規化結果。
- 官方 raw 欄位名稱仍需以人工查看的 field-name-only descriptor 核准；schema hash 本身不足以核准 alias。
- V10.7 不調整 reader、normalizer 或 validation policy。
