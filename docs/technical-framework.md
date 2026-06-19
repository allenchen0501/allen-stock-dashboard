# Technical Framework

V3-1.5 延續 Next.js App Router、TypeScript 與 Tailwind CSS，新增 Supabase 的可追溯資料層與 V8.5 Pro+ 戰情室讀取模型。本階段是架構與 schema 基線，不代表所有 UI 已切換成正式資料。

## 分層

```text
UI (app/, components/)
        ↓
Server Components / Route Handlers
        ↓
Application services (services/)
        ↓
Provider adapters + repositories
        ↓
Yahoo / TWSE / other providers    Supabase PostgreSQL / Storage
        ↓
V8.5 Pro+ calculation and publisher
        ↓
Published war-room read model
```

依賴只能往下：component 不呼叫外部 provider、不持有 Supabase service-role key，也不自行拼資料庫欄位。Provider 負責來源差異，service 負責使用案例與 fallback，repository 負責持久化，publisher 將完成的結果一次發布給 UI。

## 現有基線

- `app/`：App Router 頁面與 `/api/market`、`/api/portfolio` Route Handlers。
- `components/`：純顯示與互動元件；目前部分卡片仍使用 `lib/mock-data.ts`。
- `types/api/`：provider、request context、成功／失敗結果等跨層契約。
- `lib/api/`：HTTP client、短期 cache、設定與 provider registry。
- `services/`：market、stocks、indices 使用案例與 Yahoo adapter。
- `supabase/schema.sql`：V3-1 基礎持股、觀察、行情與 V8.5 表。
- `supabase/v85_pro_plus_schema.sql`：V3-1.5 additive schema、私有 artifact bucket 與戰情室 read model。

## 資料流程

1. 排程或手動工作建立 `v85_model_runs`，固定 `input_cutoff_at`。
2. Provider 取得市場與個股資料；service 正規化單位、代號、日期與錯誤。
3. Repository 以既有唯一鍵 upsert 快照，保留來源與最後成功資料。
4. V8.5 Pro+ 計算七個分項、總分、信心度、資料完整度、論點與風險旗標。
5. Publisher 在同一個資料庫 transaction 內建立 `war_room_snapshots` 與 `war_room_items`，驗證完整後才改為 `published`。
6. UI 只讀最後一個已發布快照；新批次失敗不會破壞上一個可用版本。

## 契約與錯誤

- 金額與分數在資料庫使用 `numeric`；API 若轉成 JavaScript number，必須在 mapper 明確處理精度。
- 日期欄位使用 `YYYY-MM-DD`，時間使用 UTC ISO 8601；UI 最後才轉成 `Asia/Taipei`。
- Service 回傳統一的 `ApiResult<T>`，包含來源、取得時間、cache 與 warnings。
- `partial` 是可發布與否的業務決定，不得默默當作完整成功。
- Provider 原始 payload 不直接穿透至 UI；區塊專屬擴充才放入受控的 JSONB `payload`。

## 安全邊界

- Browser 只呼叫同站 Route Handler 或讀 Server Component 已取得的資料。
- service-role key、provider token 與 signed URL 產生邏輯只存在 server-only 模組。
- V3-1.5 Pro+ 表啟用 RLS 並撤銷 `anon`、`authenticated` 權限；目前不提供前端直連。
- 外部輸入先驗證 symbol、日期範圍、枚舉、檔案 MIME 與大小。
- Log 不記錄 secret、完整持股成本或 signed URL；以 request/run ID 串接追蹤。

## 快取與新鮮度

- Provider cache 用於降載；資料庫快照是跨程序的正式歷史。
- 戰情室 read model 是 UI 的一致性邊界，不在每張卡片各自抓取不同時間資料。
- 回應需提供 `data_cutoff_at` 或等價 metadata。超過各來源容許時效時，顯示 stale 狀態並保留最後成功資料。
- Cache key 必須包含 provider、資產、區域、interval、range 與會影響輸出的參數。

## 驗證門檻

每次變更至少執行 `npm run build`。新增資料流程時，另需涵蓋 mapper、fallback、唯一鍵 upsert、部分失敗、重複發布與時區邊界測試。Schema 先在全新 Supabase 專案套用 `schema.sql` 再套用 Pro+ schema，並重跑第二次確認 idempotency。

