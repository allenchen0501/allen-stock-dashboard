# Portfolio Valuation Radar UI — V17A

## A. Purpose

The `PortfolioValuationRadar` Server Component is a V17A UI shell that renders the `portfolio.valuationSummary` API contract fields as a 15-column stock table on the `/holdings` page.

This stage establishes **layout and field placement only**. No valuation formula is active. All estimation-related cells display `資料不足` or `—`. The component directly calls `buildPortfolioValuationSummaryContract()` — no HTTP fetch, no Supabase, no environment key reads.

Goals:

1. Confirm that all 15 column slots have a display treatment at the UI level.
2. Confirm that metadata badges (`source_mode`, `response_source`, `api_contract_version`, `supabase_connected`, `production_write_performed`, `stock_valuation_snapshots_created`) are visible.
3. Confirm that the spec-only notice and safety notice render correctly.
4. Provide a stable placeholder that V18 can attach real data to without UI restructuring.

---

## B. Page Placement

File: [`app/holdings/page.tsx`](../app/holdings/page.tsx)

```tsx
<div className="page-wrap">
  <PageHeading ... />
  <div className="grid gap-5 xl:grid-cols-[1fr_410px]">
    <HoldingsTable full />
    <CoreScore />
  </div>
  <div className="mt-5">
    <PortfolioValuationRadar />
  </div>
</div>
```

Position: below the `HoldingsTable` + `CoreScore` grid, full-width. The existing `HoldingsTable` and `CoreScore` must not be removed or rearranged.

---

## C. Display Rules

### C1. Metadata badges

The component renders six metadata key-value pairs in a flex row above the table:

| Key | V17A value |
|---|---|
| `source_mode` | `spec_only` |
| `response_source` | `mock_or_contract` |
| `api_contract_version` | `V16` |
| `supabase_connected` | `false` |
| `production_write_performed` | `false` |
| `stock_valuation_snapshots_created` | `false` |

### C2. Spec-only notice bar

An amber notice bar renders between the metadata row and the table:

> Spec-only UI shell：目前僅顯示合約資料與資料不足狀態，尚未啟用估值公式。所有估值欄位（forwardPE、fairPrice、cheapPrice、expensivePrice）均待公式確認後才會啟用。

### C3. Table columns (15 total)

| # | Column | V17A Treatment |
|---|---|---|
| 1 | 持股 | stockName + stockId (hardcoded 5 stocks) |
| 2 | 市場 | market (TWSE / TPEx / NASDAQ / NYSE) |
| 3 | 現價 | price — shows `—` when null |
| 4 | 漲跌幅 | changePercent% — shows `—` when null |
| 5 | 估值層級 | ValuationTierCell — badge + `估值公式尚未啟用` sub-text |
| 6 | 平均成本 | avgCost — shows `—` when null |
| 7 | 未實現損益 | unrealizedPnL — shows `—` when null |
| 8 | 損益率 | unrealizedPnLPercent% — shows `—` when null |
| 9 | 風報比 | riskRewardRatio — shows `—` when null |
| 10 | 技術訊號 | technicalStatus — shows `—` when null |
| 11 | 籌碼訊號 | capitalFlowStatus — shows `—` when null |
| 12 | 新聞訊號 | newsSignal — shows `—` when null |
| 13 | 事件風險 | eventRisk — shows `—` when null |
| 14 | 操作訊號 | ActionSignalCell — grey badge when `資料不足` |
| 15 | 資料狀態 | DataQualityCell — amber `資料合約階段` badge when WARNING |

### C4. Valuation reason footer

Renders `data[0].valuationReason` (V17A value: `"V16 spec-only contract; valuation formula not enabled."`) below the table.

### C5. Safety notice

A fixed-format footer block containing:

> 本區塊為 V17A UI shell，僅用於確認資料欄位與畫面配置；不構成投資建議，也不會自動產生買賣指令。

---

## D. Safety Rules

| Rule | Enforcement |
|---|---|
| No Supabase connection | Component is a pure Server Component; calls only `buildPortfolioValuationSummaryContract()` |
| No env key reads | No `process.env` access in component or builder |
| No SQL migration | `sql_migration_created: false` in metadata |
| No `stock_valuation_snapshots` | `stock_valuation_snapshots_created: false` in metadata |
| No buy/sell signals | `actionSignal` limited to `觀察 / 可分批 / 續抱 / 減碼觀察 / 避開 / 資料不足`; V17A only outputs `資料不足` |
| No forbidden words | Source must not contain: 推薦買進、買進、賣出、強力買進、立即進場、出場、停損價、目標價 |
| Existing page preserved | `HoldingsTable` and `CoreScore` must remain unchanged |

---

## E. Promotion Gate to V17B / V18

Before attaching real price or valuation data, ALL of the following must be satisfied:

1. `resolvePortfolioValuationTier()` formula implemented and tested with real EPS / price data.
2. `resolvePortfolioActionSignal()` logic reviewed and confirmed to not produce forbidden words.
3. `dataQualityStatus` pipeline defined (source of truth for PASS / WARNING / FAIL).
4. At least one stock with `valuationTier !== "資料不足"` validated in a staging fixture.
5. All 15 columns confirmed to display non-null values for at least one stock in a test dataset.
6. Checker script `validate-portfolio-valuation-radar-ui.ts` continues to PASS with any new data.
7. No real `avgCost`, `quantity`, or `owner_id` committed to Git.
8. `PORTFOLIO_SOURCE_MODE` default remains `hardcoded`.
