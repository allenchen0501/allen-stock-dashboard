# Schema Descriptor Verification

## 目的

V11 Schema Descriptor Verification 讓人工在本機或 staging 明確開啟 HTTP 後，檢查 TWSE／TPEx 官方 payload 的欄位名稱與型別。輸出不包含任何 raw value，也不保存 payload、不寫 Supabase、不修改 reader mapping。

每個 descriptor field 僅包含：

- `field_name`
- `field_type`
- `is_present`
- `matched_alias`
- `schema_hash`

`matched_alias` 只進行 V10.7 contract 的完全相同名稱比對。命中候選名稱不等於 mapping 已獲核准。

## 手動執行

此指令預設 disabled。未明確設定開關時會輸出 disabled、結束碼為 0，且不發送 request。

PowerShell 手動流程：

```powershell
$env:CONNECTOR_HTTP_ENABLED = "true"
npm run test:schema-descriptor
Remove-Item Env:CONNECTOR_HTTP_ENABLED
```

每次執行對 TWSE 與 TPEx 各最多發送一次 request，不重試、不輪詢。執行完畢後必須立即移除環境變數；也可關閉目前終端來清除 session-level 設定。

## 判斷 record_time Alias

輸出中的 `record_time_alias_matched` 必須是 `true`，且 `record_time_aliases` 必須列出至少一個 `is_present = true`、`matched_alias = record_time` 的欄位。

若結果為 false：

- verification status 維持 FAIL。
- 不得使用 request time、response time 或目前時間補值。
- 不得依欄位名稱相似度自行 mapping。
- reader 與 validation policy 維持不變。

## Mapping 核准流程

1. 確認來源、endpoint、HTTP status 與 schema hash。
2. 檢查 descriptor 中實際存在的欄位名稱及型別。
3. 確認候選欄位的官方語意、日期格式、時間格式與時區。
4. 留下人工審查紀錄，但不得保存或提交 raw payload values。
5. 只有人工核准後，才能在後續獨立版本修改 alias contract 或 reader mapping。
6. 修改 mapping 後重新執行 fixtures、build 與人工 runtime evidence。

Schema hash 改變時必須重新審查，不得自動修復或沿用舊 mapping。

## 資料安全

- stdout 只允許 descriptor 與 transport／verification metadata。
- 不得將真實 raw payload、API key、個人資料或 portfolio 資料寫入文件或 Git。
- 此工具不是 ETL，不得排程、不得高頻執行、不得寫 Supabase。
- 前端、Dashboard 與 `/api/portfolio` 不得呼叫此工具。
