# Staging Supabase Portfolio Shadow

V3-6 建立 repository-driven staging shadow orchestration，但不建立 Supabase client、不加入 key，也不修改 `/api/portfolio`。它只產生比對 metadata，主 Portfolio data 永遠保留 hardcoded。

## 流程

```text
Future staging composition root
  -> authenticated PortfolioRepository
  -> getActivePortfolioStocks()
  -> staging row validation
  -> hardcoded fixture parity comparison
  -> StagingShadowResult metadata
  -> hardcoded API data remains unchanged
```

`StagingSupabasePortfolioShadow` 只依賴 `PortfolioRepository.getActivePortfolioStocks()` 介面。V3-6 沒有實例化 `SupabasePortfolioRepository`，因此不會連線或發送 request。未來只有 server-side staging composition root 可以注入通過 RLS 的 repository。

## Hardcoded vs Supabase active rows

1. Repository 必須只回傳 `is_active = true` rows。
2. 每列先驗證 id、symbol、name、market、position type、quantity 與 cost shape。
3. 只將 id、symbol、name、market、is_active 放進 parity comparison；owner、成本與股數不進 report。
4. 使用 V3-4.8 hardcoded fixture 比對 duplicate、missing、extra、market 與 name。
5. `PASS` 才有 `decision_allowed = true`；`WARNING` 與 `FAIL` 都禁止切換。

結果的 `source` 固定為 `hardcoded`、`fallback_used` 固定為 true。這兩個欄位是 V3-6 的不變條件，不代表 Supabase 可成為 response source。

## Fail-closed 規則

- RLS／permission error：`status = FAIL`、`parity_status = NOT_RUN`、issue `RLS_BLOCKED`。
- Repository 沒有回傳 array：issue `MISSING_DATA`。
- Active Portfolio 為空：issue `EMPTY_PORTFOLIO`。
- Inactive、空 identity、無效 quantity／cost 或 position type：issue `VALIDATION_FAILED`。
- Duplicate、missing、extra 或 market mismatch：parity `FAIL`。
- Name mismatch：`WARNING`，只供調查，仍不可切換。

所有失敗都產生 `data_warning` 並保留 hardcoded fallback。錯誤訊息不輸出 token、owner、成本或股數。

## 為何不能影響主資料

Shadow 的用途是觀測與驗證，不是提供 Portfolio response。若 staging 空資料、RLS 設定錯誤或 seed 有問題時直接覆蓋主資料，前端會把持股誤判為空或錯誤。因此 V3-6 result contract 完全不包含 Portfolio data，API 也不匯入此 use case。
