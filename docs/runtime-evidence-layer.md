# Runtime Evidence Layer

V10 提供手動 TWSE／TPEx endpoint evidence。它用來確認真實 HTTP 狀態、延遲、payload schema 與 normalized date／time 品質；不是正式 ETL、market feed 或資料庫 writer。

## 啟用條件

預設不連線。只有 server／本機 shell 明確設定以下值才允許 request：

```powershell
$env:CONNECTOR_HTTP_ENABLED = "true"
npm run test:runtime-evidence
```

未設定時命令輸出 disabled、exit 0，且不建立 request。測試完成後立即關閉：

```powershell
Remove-Item Env:CONNECTOR_HTTP_ENABLED
```

## 執行範圍

- TWSE：2330、2455，共用一次官方 request。
- TPEx：4979、5347，共用一次官方 request。
- 每來源最多一次；沒有 retry、polling、cron 或並行重送。

## Evidence

每個 symbol 輸出 source、request／response time、latency、HTTP status、schema hash、record date／time、validation status 與 issues。Recorder 只建立 JavaScript object 並輸出 stdout，不寫檔案、Git 或 Supabase。

Latency 以 transport request／response timestamp 計算。無 response time 時保持 null，不推測 timeout duration。

Schema hash 對 payload 的結構描述做 SHA-256，包含欄名、巢狀型別與陣列代表項，不包含完整行情值。無 payload 時 hash 為 null。

## Validation 與 fail closed

以下情況一律 FAIL：

- HTTP／JSON／timeout／rate-limit 錯誤。
- 找不到白名單 symbol。
- 缺 record date 或 record time。
- 缺有效 close price。
- 缺 source name 或來源角色不符。

缺值保持空字串／null，不得用本機日期、Yahoo price 或前次資料補齊。任一 evidence FAIL 時命令 exit 1。

## 使用限制

- Evidence 不得作為正式 ETL 或交易決策資料。
- 不得寫入 Supabase、cache table、repository 或 Dashboard。
- 不得加入 API key、service role、cron 或 background loop。
- Runtime output 只供人工 endpoint verification；若需保存，應使用 repository 外的受控環境並移除敏感資訊。
