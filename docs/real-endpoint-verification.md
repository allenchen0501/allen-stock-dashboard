# Real Endpoint Verification

V10.5 定義 TWSE／TPEx 真實 endpoint 的人工驗證流程。Codex、自動化測試、build 與 cron 都不得自行啟用 request；必須由操作者在本機或隔離 staging 明確執行。

## 安全執行與立即關閉

PowerShell 建議使用 `try/finally`，確保測試後移除開關：

```powershell
try {
  $env:CONNECTOR_HTTP_ENABLED = "true"
  npm run test:runtime-evidence
}
finally {
  Remove-Item Env:CONNECTOR_HTTP_ENABLED -ErrorAction SilentlyContinue
}
```

完成後確認：

```powershell
$env:CONNECTOR_HTTP_ENABLED
```

輸出應為空。不得把開關寫入 `.env.local`、部署預設值或 shell profile。

## 檢查 TWSE／TPEx payload

Runtime runner 對 TWSE、TPEx 各發一次 request，並只輸出白名單 symbols 的 evidence。人工檢查：

1. `http_status` 是否為 200，latency 是否合理且沒有 timeout／429。
2. `schema_hash` 是否存在，並與人工核准 baseline 比較。
3. 2330、2455 是否來自 `twse-openapi`；4979、5347 是否來自 `tpex-openapi`。
4. Payload 的 symbol、close、volume、date、time 欄名與型別是否符合 parser aliases。
5. 不保存或 commit 完整 raw payload；只在受控環境短暫檢視必要欄位。

## 必要欄位

每筆 evidence 必須核對：

- `record_date`：確實代表官方行情交易日期，不是 request 當日。
- `record_time`：確實來自官方 payload，不是本機時間。
- `close_price`：有限且大於 0；不得用 Yahoo 或前次價格補入。
- `source_name`：TWSE／TPEx 角色正確，不能只靠 runner 設定推定資料來源。

Runner 不輸出 close price 本身到 evidence contract，但會在 validation 階段檢查；缺值會出現 `MISSING_CLOSE_PRICE`。

## PASS／FAIL

PASS 必須同時符合：HTTP 成功、找到白名單 symbol、schema hash 可計算、日期／時間／價格／來源完整且 parser aliases 經人工確認。

以下任一情況為 FAIL：

- HTTP、JSON、timeout 或 rate-limit 錯誤。
- 找不到 symbol，或必要欄位為空／非法。
- 欄位語意無法證明，例如把公告日期誤認為交易日期。
- Baseline 缺失、hash 無效，或 drift policy 設為 FAIL 且 hash mismatch。

## Schema drift

Hash mismatch 時先停止下游使用，保存非敏感 evidence 摘要並人工比較官方文件／payload shape。不得自動新增 aliases、重新命名欄位、忽略缺值或更新 baseline。

只有確認 drift 合法、補齊 fixtures／parser tests、完成 review 後，才能建立新 baseline version。觀察期可由人工明確設定 mismatch 為 WARNING，但仍不得自動進正式 ETL。

## 為何不得猜值

官方 endpoint 若缺交易日期、時間或收盤價，代表資料契約尚未成立。使用 request time、Yahoo price 或上一交易日資料補值，會把推測偽裝成官方事實，使 War Room、ETL 與 audit 無法辨別來源，因此必須 fail closed。
