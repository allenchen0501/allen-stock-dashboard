# Free Data Connector Contract

V3-6.5 建立免費資料 connector 的型別、離線 fixtures 與驗證契約。所有 transport 固定 disabled，不包含 endpoint、credential 或真實 request；V7 前只能用 fixtures 執行 normalize／validate。

## 來源角色

### TWSE

- 上市股票官方收盤價與成交量的 Priority 1 來源。
- `source_confidence = 100`、`source_type = official_exchange`。
- 本階段只定義 TWSE OpenAPI adapter shape，不連線。

### TPEx

- 上櫃股票官方收盤價與成交量的 Priority 1 來源。
- `source_confidence = 100`、`source_type = official_exchange`。
- 本階段只定義 TPEx OpenAPI adapter shape，不連線。

### Yahoo

- 美股與全球市場的免費來源，以及台股官方資料缺失時的輔助／fallback。
- `source_confidence = 70`、`source_type = market_api`。
- 台股不得只依 Yahoo 產生決策；必須與 TWSE／TPEx 官方來源比對。

## 資料流規則

```text
Server-side connector
  -> normalize
  -> Data Quality validation
  -> official/fallback comparison
  -> ETL / staging storage
  -> Repository / API / War Room
```

瀏覽器與 UI 不得直接抓外部資料。Connector 只能存在 server-side ETL／provider composition root，API key 或來源 credential 不得出現在前端 bundle。

## V3-6.5 禁用條件

`fetchQuotes()` 固定回傳 `status = disabled` 與 `CONNECTOR_DISABLED`，沒有任何 transport implementation。Fixtures 使用 `FIXTURE-*` symbols 與固定假值，不得寫入 Supabase或當成正式行情。

V7 才可在確認官方使用條款、rate limit、timeout、retry、cache、Data Quality 與監控後啟用真實 request；啟用需另行審核，不能只修改 status 常數。
