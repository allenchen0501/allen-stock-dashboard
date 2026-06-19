# Supabase Client Layer

V3-2 建立 Supabase JavaScript client 的連線基礎，但不改變目前資料流。UI、`/api/portfolio`、Yahoo provider 與 mock data 仍維持原狀；本階段也不建立登入、cookies、Repository 或任何資料查詢。

## 檔案責任

### `lib/supabase/client.ts`

提供 browser-side client：

- `createBrowserSupabaseClient()`：明確建立新的 client。
- `getSupabaseBrowserClient()`：在 browser runtime 共用 singleton，避免每次互動重複建立。
- 只讀取 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- V3-2 沒有登入系統，因此停用 session persistence、token refresh 與 URL session detection。

未來 Client Component 若需要公開、受 RLS 保護的資料，可以直接從 `@/lib/supabase/client` 匯入。V3-2 不應為了測試連線而把現有 UI 改接資料庫。

### `lib/supabase/server.ts`

提供 `createServerSupabaseClient()` factory，供未來 Route Handler、Server Component、Server Action 或 Repository 在每次 request 建立 client。

- 使用相同的 public URL 與 anon key。
- 不保存 Auth session，也不使用 cookies。
- 在 browser 呼叫會立即拒絕。
- 不含 service-role key；資料可否讀寫完全取決於 PostgreSQL grants 與 RLS。

### `lib/supabase/index.ts`

統一匯出 browser 與 server helpers。實務上仍建議依執行環境使用明確路徑：browser 匯入 `@/lib/supabase/client`，server 匯入 `@/lib/supabase/server`，讓 code review 能直接辨識執行邊界。

## 環境設定

複製範例並填入自己的 Supabase project 設定：

```bash
cp .env.local.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`.env.local` 已由 `.gitignore` 的 `.env*.local` 規則排除。範例檔只保留空值，不提交實際 project URL 或 key。

`NEXT_PUBLIC_SUPABASE_ANON_KEY` 會出現在 browser bundle；它是 public client credential，不是繞過授權的秘密。所有可從 browser 存取的資料仍必須使用正確的 grants 與 RLS。service-role key 可以繞過 RLS，絕對不得放入 `NEXT_PUBLIC_*`、Client Component、browser storage、log 或 repository。

## 使用方式

Browser-side 範例（V3-2 尚未接入 UI）：

```ts
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = getSupabaseBrowserClient();
```

Server-side 範例（V3-2 尚未接入 route）：

```ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabase = createServerSupabaseClient();
```

環境變數採 lazy validation：只有實際建立 client 時才要求設定，因此在尚未接入資料流的 V3-2，沒有 `.env.local` 仍可完成 build；開始整合時若缺值，會回報明確錯誤。

## 現階段邊界

- `/api/portfolio` 仍使用 `YahooStockProvider`，沒有改成 Supabase。
- Yahoo provider 內的 hardcoded stocks 暫時保留，列為 V3-3 後續技術債。
- UI 與 mock data 不變。
- 不產生 Supabase database types，不建立 repository，不執行 query。
- 不建立 Auth、登入頁、session middleware 或使用者資料表。
- 不使用 service-role key。

部分既有表依階段規劃尚未啟用 RLS，V3-1.6 表則撤銷了 browser roles。這代表「client 已能建立」不等於「browser 已可安全直接查表」。在正式資料流前必須逐表完成 grants／RLS 檢查。

## V3-3：Repository Layer

下一階段應：

1. 建立 `PortfolioRepository` 介面，讓 API 不依賴 Supabase SDK 型別。
2. 建立 server-only Supabase repository，先讀 `portfolio_stocks`，再依需求組合最新行情／績效。
3. 產生或維護 Database types，集中處理 snake_case 到 domain model 的 mapping。
4. 定義 not-found、configuration、permission 與 database error 的統一結果。
5. 先用 repository tests 驗證排序、active filter、decimal mapping 與空資料，再決定 `/api/portfolio` 的切換策略。
6. 切換前完成目標資料表的 grants／RLS migration；不允許用 service-role key 解決 browser 權限問題。

V3-3 仍應先保留 Yahoo 行情 provider；Repository 負責 portfolio 設定與持久化，provider 負責外部即時行情，兩者不應混成同一層。

