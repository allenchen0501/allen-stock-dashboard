# Official Connector Runtime Test

V7.5 提供本機或隔離 staging 的手動 TWSE／TPEx runtime test。它不是正式 ETL，不接 API、不寫 Supabase，也不會排程執行。

## 預設行為

未設定 `CONNECTOR_HTTP_ENABLED=true` 時，命令只輸出 `disabled` 並以 exit code 0 結束。它不建立 reader request，也不嘗試連線。

## 手動啟用

PowerShell：

```powershell
$env:CONNECTOR_HTTP_ENABLED = "true"
npm run test:official-connectors:runtime
```

預設只測試白名單：

- TWSE：2330、2455
- TPEx：4979、5347

也可縮小範圍：

```powershell
npm run test:official-connectors:runtime -- 2330 4979
```

不在白名單、重複或超量 symbols 會在 request 前被拒絕。每次執行對有指定 symbol 的市場最多讀取一次；沒有輪詢、分頁迴圈或自動 retry。

## 輸出與判定

每檔輸出 symbol、source_name、record_date、record_time、close_price、volume、status、data_warning 與 issues。缺 record、日期、時間、有效價格、來源或成交量一律 FAIL，欄位保持空白／null，不得以本機時間、昨日價格或其他來源猜值。

## 關閉

測試完成後立即移除開關：

```powershell
Remove-Item Env:CONNECTOR_HTTP_ENABLED
```

也可將值設為 `false`。下一次執行應只輸出 disabled。

## 安全與 rate limit

- 僅能在 server-side 本機或 staging 手動執行。
- 禁止 cron、watch mode、高頻輪詢、並行重跑或 IP rotation。
- 不得把 runtime output 寫入 Supabase，亦不得加入 key 或 service role。
- Runtime test 只驗證 endpoint／payload／normalization；不能充當正式 ETL、cache、market feed 或交易決策來源。
- 遇到 429、timeout、欄位改版或空資料立即停止，關閉開關後再調查。
