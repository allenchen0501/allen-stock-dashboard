# Repository Layer

V3-3 在 Supabase Client Layer 與應用程式之間加入 Repository Layer。它集中資料表名稱、基本查詢、資料列型別與資料庫錯誤，讓未來 API 依賴 repository contract，而不是直接依賴 Supabase query builder。

本階段只建立介面與 skeleton：沒有 repository instance、沒有真實 query、沒有改動 API／UI，也沒有切換 Yahoo provider 或 mock data。

## 架構

```text
UI / components
       ↓（維持現況）
API routes / server use cases
       ↓（V3-4 才接入）
Repository interfaces
       ↓
Supabase repository skeletons
       ↓
Injected SupabaseClient
       ↓
PostgreSQL tables, grants and RLS
```

### 集中型別

`lib/types/database.ts` 定義資料庫 row 與 create/update input：

- `PortfolioStock`
- `WatchlistStock`
- `TradeJournal`
- `WarRoomDecision`
- `WarRoomReport`
- `PortfolioPerformanceSnapshot`

型別使用資料庫的 snake_case，避免在 repository 內假裝資料已經是 UI view model。從 database row 到 API domain model 的 mapping 應在 V3-4 的 application/use-case 邊界明確完成。

`TradeJournal` 與 `WarRoomReport` 是未來契約；目前 schema 尚無 `trade_journal`、`war_room_reports`。相對應 class 只供編譯與設計，不得在目前應用程式中實例化。

### Base Repository

`BaseRepository<TEntity, TCreate, TUpdate>` 統一：

- `findAll`
- `findById`
- `create`
- `update`
- `delete`

`RepositoryError` 保留 operation 與原始 cause，讓未來 API 可以集中映射為 `NOT_FOUND`、`CONFLICT`、`FORBIDDEN` 或 `DATABASE_ERROR`，而不是把 Supabase error 直接送到 browser。

## 各 Repository 責任

### Portfolio

`SupabasePortfolioRepository` 對應 `portfolio_stocks`，提供 active list、單筆讀取、新增、更新與停用。`delete()` 映射為 `is_active = false`，不硬刪持股設定。

Repository 只保存持股設定；即時價格仍由 Yahoo／其他 market provider 取得。未來 use case 會以 symbol／market 將兩者組合，不應把 Yahoo HTTP request 放進 repository。

### Watchlist

`SupabaseWatchlistRepository` 對應 `watchlist_stocks`。一般清單只讀 active rows，移除同樣採 soft delete，保留未來稽核與恢復空間。

### Trade Journal

`SupabaseTradeJournalRepository` 預留 `trade_journal` 的基本 CRUD 與日期排序。V3-3 沒有新增資料表，因此任何呼叫都會在資料庫端失敗；需等 migration、constraints、indexes、grants 與 RLS 完成後才能啟用。

### War Room

`SupabaseWarRoomRepository` 目前定義最新決策、決策歷史與最新報告：

- `war_room_decisions` 已存在於 V3-1.6。
- `war_room_reports` 尚未存在，只是未來報告聚合 contract。
- V3-1.5 的 `war_room_snapshots`／`war_room_items` 是已發布 read model，與 report 文件不可混為同一張表。

War Room repository 目前只讀，不負責產製模型、發布 snapshot 或生成 AI 摘要。

## Repository 與 API

API 應依賴 interface，並由 server composition root 注入實作：

```ts
async function getPortfolio(repository: PortfolioRepository) {
  return repository.getActivePortfolioStocks();
}
```

Route Handler 不應自行呼叫 `.from("portfolio_stocks")`。這讓 Supabase、測試用 in-memory repository 與未來其他儲存實作可以替換，也避免資料表欄位一路洩漏到 UI。

V3-3 不修改 `/api/portfolio`；它仍呼叫 Yahoo provider 並保留 hardcoded stocks。這是已知技術債，V3-4 需在 repository 有資料、權限與 fallback 驗證後才移除。

## Repository 與 Supabase

- Supabase client 由外部建立並經 constructor 注入；repository 不讀環境變數。
- Skeleton 使用 anon-key client contract，不加入 service-role key。
- Repository 不繞過 grants／RLS，不處理登入或 session。
- 目前尚未生成 Supabase `Database` type，所以 query 結果有集中 type assertion；V3-4 應用 CLI 生成型別取代 assertion。
- PostgreSQL `numeric` 到 JavaScript `number` 的精度政策尚未完成；金額進入正式資料流前需加入 mapper 或 decimal strategy。

## V3-4 Portfolio Migration

建議依序執行：

1. **安全 migration**：確認 `portfolio_stocks` grants／RLS、server anon-key 的讀寫範圍與唯一鍵衝突行為。
2. **Database types**：由實際 schema 生成 Supabase types，讓 repository query 可靜態驗證。
3. **Seed／匯入**：把目前 hardcoded portfolio 設定轉成一次性 seed；先比對 symbol、market、成本、股數與 active 狀態。
4. **Repository tests**：驗證 active filter、soft delete、not found、duplicate symbol/market、decimal mapping 與 permission error。
5. **Application service**：由 PortfolioRepository 讀持股設定，再由 YahooStockProvider 取得即時行情；定義部分行情失敗時的 fallback。
6. **平行比對**：在不影響 UI 的 server 測試中比較 hardcoded 與 database 結果，確認排序與欄位一致。
7. **切換 API**：最後才讓 `/api/portfolio` 使用新的 use case；保留可回退路徑並觀察錯誤率。
8. **清理技術債**：穩定後才移除 hardcoded stocks，不移除 Yahoo provider。

V3-4 仍不應讓 Client Component 直接寫 `portfolio_stocks`。Portfolio migration 是 server-side repository 切換，不是登入系統或 browser CRUD 專案。

