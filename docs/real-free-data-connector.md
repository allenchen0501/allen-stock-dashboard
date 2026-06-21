# Real Free Data Connector

V7 建立第一階段 server-side TWSE／TPEx 官方唯讀能力。它不接 API route、不寫 Supabase、不改 Portfolio mode，也不建立排程。

## 預設 disabled

HTTP transport 同時檢查 server runtime、official host allowlist 與環境開關。只有 server 明確設定以下值才可能發出 request：

```text
CONNECTOR_HTTP_ENABLED=true
```

未設定、空白、其他值、browser runtime 或 constructor disabled mode 都回傳 `CONNECTOR_DISABLED`。預設測試只執行 fixtures，不會連外。

## 官方讀取來源

- TWSE：`openapi.twse.com.tw` 上市股票官方日收盤資料。
- TPEx：`www.tpex.org.tw` 上櫃股票官方日收盤資料。
- Transport 只允許 HTTPS GET、JSON、10 秒 timeout 與 `no-store`。
- Reader 僅 normalize 成 `NormalizedQuoteRecord`，不寫入 database。

Endpoint 與 payload 欄位必須在 V7.5 staging runtime test 再核對。官方 payload 若沒有交易日期、時間、價格或來源，validator 必須 FAIL，不得用 server 當下時間冒充市場資料時間。

## Official vs Yahoo

TWSE／TPEx 是台股 official primary，Yahoo 只作 fallback comparison：

- 完整且價差不超過 1%：PASS。
- 價差大於 1%：WARNING，官方仍為 primary，不可自動產生交易決策。
- 缺 symbol、price、record date、record time 或 source：FAIL。

## Server-only boundary

前端、React component 與 browser 不得 import reader 或 transport，也不得直接抓官方網站。未來 composition root 必須位於 server-side ETL／runtime job，並在 normalize、Data Quality 與 rate limit 後才提供下游使用。

## 測試

```bash
npm run test:official-connectors
```

預設輸出 fixture 的 source、date、time、PASS／WARNING／FAIL 與 data warning，並確認 readers 為 disabled。只有人工明確設定環境開關後，測試入口才會執行 TWSE／TPEx live read；V7 一般 build 驗證不得啟用該開關。
