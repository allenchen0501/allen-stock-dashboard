# Runtime Evidence Baseline

Baseline 用來回答「目前官方 payload schema 是否仍與人工核准版本一致」。它只保存 schema metadata 與 alias 決策，不保存完整行情回傳。

## Baseline 狀態

V10.5 不預填任何 approved hash。TWSE／TPEx baseline 均維持 pending，直到操作者完成一次受控 runtime verification、核對官方欄位語意並取得 reviewer 核准。

建議記錄欄位：

- source name
- `sha256:` schema hash
- baseline version
- approved timestamp
- 經核准的 canonical field → payload aliases
- reviewer／變更單識別碼（不得包含個資）

## Schema hash

Schema hash 由 payload 結構描述產生，反映欄名、巢狀型別與陣列代表項。Hash 不證明數值正確，但可快速偵測欄位新增、移除或型別變更。

首次核准流程：

1. 手動執行一次 runtime evidence。
2. 確認 HTTP、必要欄位與 source 全部 PASS。
3. 人工比對官方文件與最小必要 payload shape。
4. 由 reviewer 核准 hash、aliases 與 baseline version。
5. 只記錄核准後的 metadata；raw payload 留在 repository 外並依保存政策移除。

## Alias 核准

每個 canonical field（symbol、close price、volume、record date、record time）都必須列出實際官方欄位名稱、型別與語意依據。Reader 中已有的 alias 在首次 verification 前都視為候選，不等於 baseline 已核准。

發生 schema drift 時不得自動接受新 alias。必須新增 failing fixture、修改 parser、通過 build／tests，並完成 code review 後才能更新 baseline version。

## 禁止內容

- 不得包含 Supabase、交易所或任何服務的 API key、token、cookie、authorization header。
- 不得包含姓名、帳號、owner ID、IP、個人持股或其他個人資料。
- 不得 commit 真實 evidence raw payload、完整全市場回傳或本機 runtime log。
- 不得把 hash mismatch 當作自動 migration 或 parser 修正授權。

`ApprovedSchemaBaseline` 只是一個 contract；V10.5 沒有 baseline database、檔案 writer 或自動更新流程。
