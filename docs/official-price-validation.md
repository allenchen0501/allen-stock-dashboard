# Official Price Validation

所有戰情室輸出都必須攜帶官方價格校驗區塊。區塊不可因資料缺失而省略；無法校驗時仍要輸出 null value、FAIL 與 `data_warning`，讓下游知道決策被阻擋。

## 必要欄位

```json
{
  "official_price_validation": {
    "symbol": "3019",
    "market": "TWSE",
    "close_price": 123.45,
    "currency": "TWD",
    "price_role": "official_close",
    "record_date": "YYYY-MM-DD",
    "record_time": "HH:mm:ss",
    "source_name": "TWSE OpenAPI",
    "source_priority": 1,
    "comparison_source": "Yahoo Finance",
    "difference_percent": 0.2,
    "validation_result": "PASS",
    "validated_at": "ISO-8601 timestamp",
    "data_warning": null
  }
}
```

所有戰情室 Portfolio、候選股、禁碰股、風報比與 AI summary 的 underlying instrument 都必須能追溯到這個 contract。

## 收盤價定義

- 台灣上市：TWSE 對應交易日 official close。
- 台灣上櫃：TPEx 對應交易日 official close。
- Yahoo 台股價格只能是 auxiliary／fallback，不能標成 `official_close`。
- 盤中值使用 `price_role = intraday_reference`，不得填入 official close 欄位後宣稱收盤完成。
- 盤前使用上一交易日官方收盤時，`price_role = previous_official_close`，`record_date` 必須保留上一交易日；不得改成今天。

若停牌、無成交、除權息或交易所提供特殊註記，不能自動補前收；應保留官方狀態並由 validator 決定 WARNING／FAIL。

## 資料日期

`record_date` 是來源所描述的交易日，不是 ETL 抓取日、API 回應日或 War Room 產生日。`record_time` 是來源時間；另以 `validated_at` 記錄校驗時間。所有時間判斷採 `Asia/Taipei`，全球資料需先保存原交易所 session 再轉換顯示時區。

## 資料來源

每筆輸出至少包含 source name 與 priority。台股 official close 的 source 必須和 market 對應：TWSE symbol 不可用 TPEx 值，TPEx symbol 不可用 TWSE 值。ISIN 可校驗 symbol／market active 狀態，但不可校驗價格。

Secondary source 缺失時，`comparison_source` 與 `difference_percent` 應為 null，validation 至多 WARNING；不可填 0 表示一致。

## 校驗結果

### PASS

- Official source、symbol／market、交易日、數值與單位完整。
- Data Quality 為 valid。
- Secondary comparison 可用，且差異未超過門檻。

### WARNING

- Official value 有效但 comparison 暫時不可用。
- 使用 previous official close、stale 或未完成 session 的 reference。
- 只有 auxiliary source 可用。

### FAIL

- 無 official source、日期／來源缺失、market mismatch。
- Data Quality 為 invalid／suspicious。
- 價格差異超過 1%、數值不合法或 timestamp 異常。

只有 PASS 可以作方向性決策輸入。WARNING 只能 reference；FAIL 必須阻擋。詳細文字限制遵循 [Data Warning Policy](./data-warning-policy.md)。

## War Room 發布 gate

Report composer 在 publish 前逐一檢查 `official_price_validation`：

1. 所有涉及方向性輸出的標的必須為 PASS。
2. 任一標的 WARNING 時，該標的只可 reference，移除方向性建議。
3. 任一標的 FAIL 時，阻擋該標的進決策清單；若市場基準 FAIL，整份 War Room report 不發布新版本。
4. 已發布 report 不因後續資料更正無聲改寫；建立新版本並保留前後 validation metadata。
