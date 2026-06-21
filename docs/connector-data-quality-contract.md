# Connector Data Quality Contract

每筆 normalized quote 必須保留來源與時間，先通過 Data Quality Layer 才能進入 ETL、repository 或戰情室。

## 必要欄位

- `symbol`、`market`、`price`、`volume`、`currency`
- `record_date`、`record_time`
- `source_name`、`source_type`、`source_confidence`
- `data_frequency`、`is_model_inference`

TWSE／TPEx official confidence 為 100；Yahoo contract confidence 為 70。Confidence 只描述來源角色，不能覆蓋過期、缺欄位或來源差異。

## Connector 狀態

| Connector result | Data Quality | 處理 |
| --- | --- | --- |
| `PASS` | `valid` | 可進下一個 staging gate |
| `WARNING` | `stale` | 只能參考，必須輸出 `data_warning` |
| `FAIL` | `invalid` 或 `suspicious` | 隔離並禁止決策 |

`decisionAllowed` 只有整批都是 PASS 時才為 true。

## Invalid

- 缺 symbol、price、日期、時間或來源。
- 價格不是有限正數。
- 成交量為負數或非有限數字。
- Market 不符合 connector：TWSE 只能 TWSE、TPEx 只能 TPEx。
- Confidence 不在 0～100，或 inference flag 缺失。

## Suspicious

- 官方與 fallback 價格差異大於 1%。
- 兩來源成交量差異大於 5%。
- Timestamp 超過容許的未來時間。
- 市場代碼、單位或 symbol mapping 出現無法確認的不一致。

Suspicious 不得因 source confidence 高而自動通過。

## Stale

- 今日用途使用非今日資料。
- Quote 超過設定 freshness threshold。
- Delayed Yahoo data 只能作 reference，不得取代官方 close。

## Fixtures

TWSE fixtures 涵蓋正常、缺價格、過期與異常成交量；TPEx 涵蓋正常、缺 symbol、錯誤 market 與過期；Yahoo 涵蓋官方差異 0.5%、1.5%、缺資料與延遲資料。Fixtures 固定且只供本地測試，不得進資料庫。
