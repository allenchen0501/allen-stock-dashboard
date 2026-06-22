# War Room Reports Migration

## V11.6 Schema Gap Fix

`war_room_reports` 的型別（`WarRoomReport`）與 repository 方法（`getLatestWarRoomReport`）
自 V3-3 起即已存在，但缺少對應的實體資料表。
`supabase/v85_war_room_reports.sql` 補齊這個 schema gap。

---

## 戰情室表格分工

| 表格 | 角色 |
|---|---|
| `war_room_reports` | 對外可讀的報告文件，標題、摘要與 jsonb 結構化內容 |
| `war_room_snapshots` | 戰情室畫面 read model，每次可發布的市場快照 |
| `war_room_items` | 快照底下各區塊的排序讀取模型（cascade 刪除） |
| `war_room_decisions` | 決策歷史與稽核紀錄，包含 AI 摘要與行動建議 |

### war_room_reports

- 目的：存放可發布給前端讀取的完整報告文件。
- 與 `war_room_snapshots` 的差異：快照是每個時段的市場即時讀取模型；報告是事後彙整的可讀文件。
- 與 `war_room_decisions` 的差異：決策紀錄保存策略性行動與 AI 推論；報告保存對外呈現的標題、摘要與結構化內容。
- `content` 欄位格式由 `report_type` 決定，不得存入 raw 市場行情、Supabase key 或個資。

---

## 欄位與 TypeScript 型別對應

`WarRoomReport`（`lib/types/database.ts`）繼承 `TimestampedRecord`，**不繼承 `SourcedRecord`**。

因此 `war_room_reports` 資料表**不包含** `SourcedRecord` 欄位：

| 缺少的欄位 | 原因 |
|---|---|
| `record_date` | WarRoomReport 不繼承 SourcedRecord |
| `record_time` | 同上 |
| `source_name` | 同上 |
| `source_type` | 同上 |
| `source_confidence` | 同上 |
| `data_frequency` | 同上 |
| `is_model_inference` | 同上 |

若日後需要追蹤報告來源，應先更新 `WarRoomReport` 型別，再對應更新資料表與 repository，
保持型別與 schema 一致。

---

## 本階段限制

本階段僅補齊 schema gap，以下項目**均未啟用**：

- **不接 UI**：無前端元件讀取 `war_room_reports`。
- **不接 API**：無 route handler 查詢此表。
- **不寫資料**：表格為空，未插入任何列。
- **不改 repository**：`SupabaseWarRoomRepository.getLatestWarRoomReport()` 的程式碼未變動；表格建立後即可直接使用，無需修改。
- **不新增其他候選表**：本次僅建立 `war_room_reports`。

---

## 安全狀態

- RLS 已啟用（fail-closed）。
- 未建立任何 RLS policy，目前所有存取一律 deny。
- `anon` 與 `authenticated` 已 revoke 所有權限。
- Service role 經由 Supabase 的 RLS bypass 機制存取。

**正式接 API 或 UI 前，必須先**：

1. 建立適當的 RLS policy（例如 service role only 或 authenticated 讀取 published 列）。
2. 若需要 authenticated 讀取，補上對應 grant。
3. 在 staging 驗證 policy 效果後再套用至 production。

---

## 套用順序

```
schema.sql
→ v85_pro_plus_schema.sql
→ v85_pro_plus_schema_v2.sql
→ v85_war_room_reports.sql   ← 本次新增
```

本檔案包含前置條件檢查（DO block），若先決資料表不存在將 raise exception，防止亂序套用。
