# Storage Policy

本文件定義 V3-1.5 的資料落點、保存期限與存取邊界。核心原則是：可查詢的結構化資料進 PostgreSQL，大型或原始檔進 Supabase Storage，短期加速資料才進快取，瀏覽器不保存投資組合或模型結果的正式副本。

## 資料落點

| 資料 | 正式落點 | 說明 |
| --- | --- | --- |
| 持股、觀察名單、行情快照 | PostgreSQL | 需要約束、索引、關聯與歷史查詢 |
| V8.5 / V8.5 Pro+ 評分 | PostgreSQL | 每次結果必須保留模型版本、計算時間與來源追蹤 |
| 戰情室已發布快照 | PostgreSQL | UI 讀取固定版本，不在請求期間臨時計算 |
| PDF、CSV、JSON 原始匯入、圖表與匯出檔 | 私有 Storage bucket | PostgreSQL 只登錄路徑、雜湊、大小、擁有者與到期日 |
| Provider 短期回應 | 伺服器端快取 | 只用於降低外部請求；不可視為唯一資料來源 |
| UI 偏好 | `localStorage` | 僅限主題、摺疊狀態等非敏感偏好 |

禁止將 service-role key、provider token、完整投資組合、成本、股數、模型證據或簽名 URL 放進 `localStorage`、`sessionStorage`、前端 bundle 或 repository。

## Storage bucket

V3-1.5 使用單一私有 bucket：`war-room-artifacts`。

- `public` 必須維持 `false`。
- 單檔上限 25 MiB。
- 允許格式：PDF、CSV、JSON、PNG、JPEG、WebP。
- 物件路徑：`{environment}/{yyyy}/{mm}/{dd}/{owner-type}/{uuid}-{slug}.{ext}`。
- 檔名只使用小寫英數、連字號與副檔名；顯示名稱放在 metadata，不直接信任上傳檔名。
- 同一物件不得覆寫。新版本使用新 UUID，舊版本依保存規則清除。

`research_artifacts` 是物件登錄表。上傳完成後才新增登錄；刪除採兩階段：先標記 `deleted_at`，背景工作刪除 Storage 物件，最後保留稽核 metadata。

## 存取規則

1. Browser 不直接查詢 Pro+ 資料表，也不直接列舉 bucket。
2. Route Handler 或 server-only service 驗證請求後，才可用伺服器端憑證讀寫。
3. 檔案下載使用短效 signed URL，預設 5 分鐘；回應不得被公開 CDN 長期快取。
4. V3-1.5 不建立 `anon` 或 `authenticated` 的資料表／Storage policy。未來加入 Supabase Auth 時，必須另開 migration，並以最小權限設計 owner 或 tenant 條件。
5. service-role key 只能存在部署平台的 server secret，不得使用 `NEXT_PUBLIC_` 前綴。

## 保存與清除

| 類型 | 預設保存 | 到期動作 |
| --- | --- | --- |
| `raw_import` | 30 天 | 驗證衍生資料後刪除物件 |
| `source_snapshot` | 180 天 | 保留必要雜湊與來源 metadata |
| `research_report` | 365 天 | 到期後依是否仍被發布快照引用決定續留 |
| `chart` | 90 天 | 可由資料重建者直接刪除 |
| `export` | 7 天 | 自動刪除，不作正式備份 |

法規、稽核或除錯需求若要求延長保存，必須在 `expires_at` 記錄明確日期，不得用「永久」作預設值。

## 完整性與失敗處理

- 上傳後計算 SHA-256，與 `research_artifacts.sha256` 一起保存。
- 先寫入暫存路徑、驗證 MIME／大小／雜湊，再移至正式路徑並登錄。
- 資料庫登錄失敗時，清除剛上傳的孤兒物件；Storage 刪除失敗時保留 `deleted_at` 供重試。
- 每日檢查過期物件、孤兒物件與登錄缺檔；清理工作需可重跑並輸出成功／失敗數。
- Storage 不是資料庫備份。PostgreSQL 與 bucket 必須各自納入備份與還原演練。

