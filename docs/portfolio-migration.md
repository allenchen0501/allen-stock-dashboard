# Portfolio Migration Layer

V3-4 建立 Portfolio 從 hardcoded list 遷移至 Supabase `portfolio_stocks` 的 application path，但不切換 `/api/portfolio`、不修改 UI，也不執行真實資料庫查詢。

## 目前問題

`services/stocks/providers/yahoo-stock-provider.ts` 內的 `ALLEN_PORTFOLIO_STOCKS` 同時定義 Portfolio 名單與 Yahoo symbol mapping：

- `3019`
- `4966`
- `5347`
- `2455`
- `4979`

這讓行情 provider 決定「使用者持有什麼」，混合了持倉設定與行情來源責任。新增／移除持股需要改程式並重新部署，也無法保存成本、股數、active 狀態與持股異動。

V3-4 不刪除或修改這份清單。`hardcoded-portfolio-audit.ts` 將位置、代號、目前狀態與 V3-5 切換條件固定為可查核紀錄。

## 正確責任邊界

```text
portfolio_stocks where is_active = true
                  ↓
       PortfolioRepository
                  ↓
   GetActivePortfolioUseCase
           ↙              ↘
daily_prices / snapshots   Yahoo fallback quote
           ↓              ↓
        Data Quality validation
                  ↓
        Portfolio domain model
                  ↓
       /api/portfolio (V3-5)
```

- `portfolio_stocks`：唯一 Portfolio 名單來源，保存 market、cost price、shares、position type 與 active 狀態。
- `watchlist_stocks`：尚未持有但持續觀察的標的；不能混入 Portfolio。
- `trade_journal`：已成交／已賣出交易、費用與檢討；目前仍是 future schema，不得用停用 Portfolio row 取代完整成交歷史。
- Yahoo Finance：只提供盤中輔助行情或 fallback quote，不新增、刪除或排序 Portfolio 名單。

## V3-4 元件

### GetActivePortfolioUseCase

`GetActivePortfolioUseCase` 只呼叫 `PortfolioRepository.getActivePortfolioStocks()`。Repository query 明確使用 `is_active = true`，並按 market／symbol 穩定排序。Use case 再次防禦性過濾 inactive row，避免錯誤實作將停用持股帶入結果。

價格來源透過 `PortfolioPriceSource` port 注入，角色只能是：

- `daily_prices`
- `stock_snapshots`
- `yahoo_fallback`

V3-4 沒有任何 port implementation，也沒有 import Yahoo provider。未注入價格來源時仍可回傳持股設定，但 current price、market value、未實現損益與報酬率都是 `null`，不能用成本價偽裝現價。

### Portfolio Mapper

Mapper 將 database row 轉為 Portfolio domain model：

- `cost_price`：來自 `portfolio_stocks.cost_price`。
- `quantity`：來自 `portfolio_stocks.shares`。
- `cost_basis`：`cost_price × quantity`。
- `market_value`：`current_price × quantity`。
- Long 未實現損益：`(current_price - cost_price) × quantity`。
- Short 未實現損益：`(cost_price - current_price) × quantity`。
- `return_rate`：`unrealized_profit_loss / cost_basis × 100`。

沒有合格 current price 或 cost basis 為 0 時，依賴行情的欄位保留 `null`。目前使用 JavaScript number 並四捨五入到 4 位；正式財務報表若要求更高精度，V3-5 應導入明確 decimal strategy。

### Portfolio Validation

`validatePortfolioQuote()` 串接 V3-3.5 Data Quality Layer：

- `invalid`／`suspicious`：current price 不進 mapper，估值欄位為 `null`，禁止進決策。
- `stale`：可計算 reference valuation，但 `reference_only = true`、`decision_ready = false`。
- `valid`：可作估值；若有 secondary source，必須同時通過 1% 價格差異規則。
- 現價小於或等於 0：Portfolio 層額外標記 `invalid`。

Domain model 保留 source role、source name、quality status 與 issues，後續 API 不得丟失這些欄位後再宣稱 decision-ready。

## 資料遷移缺口

現有 hardcoded list 只有代號、名稱、市場、Yahoo symbol 與顯示順序，沒有可驗證的持股成本與股數。`portfolio_stocks.cost_price`、`shares` 都是 required，因此 V3-5 前必須由 Allen 的權威持倉紀錄補齊；不得自動填 0、1 或 mock value 只為通過 constraint。

建議 seed manifest 至少包含：symbol、name、market、cost price、shares、position type、effective date、source／confirmed by。匯入前逐筆比對 `symbol + market` unique key，匯入後再與 hardcoded 五檔做 set parity；成本與股數另做人工簽核。

## V3-4 明確不做

- 不修改 `/api/portfolio`。
- 不實例化 Supabase repository 或 client。
- 不修改 Yahoo provider 或 hardcoded stocks。
- 不接 daily prices、stock snapshots 或 Yahoo quote adapter。
- 不修改 UI、components 或 mock data。
- 不新增 service-role key、登入或 browser database write。

## V3-5 API Portfolio Switch

建議切換順序：

1. 完成 `portfolio_stocks` grants／RLS，驗證 server client 只能取得預期欄位。
2. 建立經人工確認的 seed manifest，載入五檔 active rows。
3. 加入 Repository contract tests：active-only、stable sort、empty、duplicate、permission error。
4. 建立 `daily_prices`／`stock_snapshots` primary adapter；Yahoo adapter 只標為 `yahoo_fallback`。
5. 測試 mapper 的 long／short、零成本、缺價、stale、suspicious、invalid。
6. 在 API 外做 shadow comparison：database symbols 必須和 hardcoded symbols 完全一致，持續數個交易日比較行情與品質狀態。
7. 為 `/api/portfolio` 加入 composition root，注入 repository、price source 與 use case；保留 feature flag rollback。
8. 先切換 API，觀察錯誤率與空資料；穩定後才在後續版本移除 hardcoded list，Yahoo provider 本身繼續保留。

Rollback 時只能切回舊 API path，不能刪除已匯入 Portfolio 或交易紀錄。

