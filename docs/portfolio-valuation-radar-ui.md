# Portfolio Valuation Radar UI — V17A / V17B

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

## F. V17B — Compact Radar Card Layout

V17B 將 V17A 的寬表 UI polish 成一眼決策型的 compact card layout，並將模組上移至 holdings 頁主要決策區。

### F1. 頁面位置變更

V17A 位置：`HoldingsTable + CoreScore` grid **下方**。

V17B 位置：`HoldingsTable + CoreScore` grid **上方**（緊接在 `PageHeading` 之後）：

```tsx
<div className="page-wrap">
  <PageHeading ... />
  <div className="mt-5">
    <PortfolioValuationRadar />          {/* ← 上移到決策區 */}
  </div>
  <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_410px]">
    <HoldingsTable full />
    <CoreScore />
  </div>
</div>
```

### F2. Summary Cards（4 張）

位於 SectionCard 頂部，以 2×1（mobile）/ 4×1（desktop）grid 排列：

| Card | 計算方式 | V17B 預期值 |
|---|---|---|
| 合約階段檔數 | `data.length` | 5 |
| 資料不足檔數 | `data.filter(d => d.valuationTier === "資料不足").length` | 5 |
| 公式啟用檔數 | `data.filter(d => d.valuationTier !== "資料不足").length` | 0 |
| WARNING 檔數 | `data.filter(d => d.dataQualityStatus === "WARNING").length` | 5 |

所有數值由 `data` 即時計算，不得寫死。

### F3. Compact Metadata Status Bar

將 V17A 的六個獨立 badge 收斂成單行 status bar：

```
V17B Shell｜spec_only｜mock_or_contract｜Supabase disabled｜Write false｜Valuation table not created
```

### F4. Compact Radar Card Grid

每檔股票以獨立 card 呈現，不再使用 `<table>` 作為主視覺。

Layout：
- **Mobile**：1 欄
- **Desktop (md)**：2 欄
- **Desktop (xl)**：3 欄

每張 card 包含：

**Primary（主要）**：stockName、stockId、market、ValuationTierBadge、ActionSignalBadge、DataQualityBadge、估值公式尚未啟用 sub-label（tier = 資料不足 時）

**Secondary（次要，2-col 欄位格）**：現價、漲跌幅、平均成本、未實現損益、損益率、風報比、技術訊號、籌碼訊號、新聞訊號、事件風險

**Null 顯示**：`—`

**Signal 顯示規則**：
- `valuationTier = 資料不足` → badge 顯示「資料不足」，sub-label 顯示「估值公式尚未啟用」
- `actionSignal = 資料不足` → badge 顯示「等待資料」
- `dataQualityStatus = WARNING` → badge 顯示「資料合約階段」

### F5. Safety Notice（精簡版）

> V17B UI shell：僅用於確認資料欄位與畫面配置；不構成投資建議，不會自動產生買賣指令。

### F6. V17B 安全規則

| Rule | V17B 狀態 |
|---|---|
| 未連 Supabase | ✓ status bar 顯示「Supabase disabled」 |
| 未讀 env key | ✓ 無 `process.env` 存取 |
| 未新增 SQL migration | ✓ metadata `sql_migration_created: false` |
| 未建 `stock_valuation_snapshots` | ✓ metadata `stock_valuation_snapshots_created: false` |
| 不產生買賣指令 | ✓ 無 推薦買進、強力買進、立即進場、明確買進、明確賣出、停損價、目標價 |
| 不使用 `<table>` 作為主視覺 | ✓ 改為 compact card grid |
| HoldingsTable / CoreScore 保留 | ✓ |

---

## G. Promotion Gate to V17C / V18（V17B 原版 — 已達成）

V17C 已完成以下確認：

- [x] `test:portfolio-valuation-radar-ui` PASS（5 gates）
- [x] build PASS
- [x] Allen 確認 compact card layout 可讀
- [x] Allen 選擇 V17C：把 radar 掛到 Dashboard 首頁

---

## H. V17C — Dashboard Integration

V17C 將 Portfolio Valuation Radar 的精簡摘要版掛到 Dashboard 首頁（`app/page.tsx`）。

### H1. 新增 Component

`components/portfolio-valuation-radar-summary.tsx`

- Server Component（無 "use client"）
- 直接呼叫 `buildPortfolioValuationSummaryContract()`
- 不 fetch、不連 Supabase、不讀 env key、不寫資料

### H2. Dashboard 頁面位置

```tsx
// app/page.tsx
<div className="mb-5"><HoldingsTable /></div>

<div className="mb-5">
  <PortfolioValuationRadarSummary />    {/* ← V17C 新增，HoldingsTable 之後 */}
</div>

<div className="mb-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
  <RiskRanking />
  <BreakoutPool />
</div>
```

### H3. Summary Component 顯示內容

| 區塊 | 內容 |
|---|---|
| 標題 | `持股估值雷達摘要` |
| 副標 / 提示 | `V17C Dashboard preview：目前仍為 spec-only contract data。` |
| Compact Status Bar | `spec_only · mock_or_contract · Supabase disabled · Write false` |
| Summary Stats（4 個） | 合約階段檔數 / 資料不足檔數 / WARNING 檔數 / 公式啟用檔數 |
| Preview List（前 5 檔） | stockName + stockId + market + 估值層級 + 資料狀態 + 操作訊號 |
| CTA Link | `查看完整持股估值雷達` → `/holdings` |

Display mapping：
- `valuationTier = 資料不足` → 顯示「公式未啟用」
- `dataQualityStatus = WARNING` → 顯示「合約階段」
- `actionSignal = 資料不足` → 顯示「等待資料」

### H4. V17C 安全規則

| Rule | V17C 狀態 |
|---|---|
| 未連 Supabase | ✓ |
| 未讀 env key | ✓ |
| 未新增 SQL migration | ✓ |
| 未建 `stock_valuation_snapshots` | ✓ |
| 不產生買賣指令 | ✓ 無 推薦買進、強力買進、立即進場、明確買進、明確賣出、停損價、目標價 |
| Holdings 完整 Radar 保留 | ✓ `PortfolioValuationRadar` 仍在 `app/holdings/page.tsx` |
| Dashboard 只顯示 compact preview | ✓ 不搬完整 card grid |

---

## I. Promotion Gate to V18

進入 V18 前，ALL 必須通過：

1. `test:portfolio-valuation-radar-dashboard` PASS（4 gates）。
2. `test:portfolio-valuation-radar-ui` PASS（5 gates）。
3. `npm run build` PASS。
4. Allen 確認 Dashboard summary 位置與資訊密度合適。
5. Allen 選擇下一步：
   - **V18**：接入官方 price pipeline（TWSE/TPEx OpenAPI），enriching `price` / `changePercent`，讓 summary card 現價欄位顯示真實數值。
   - **V18-alt**：先完成 valuation formula 文件化（`cheapPrice / fairPrice / expensivePrice` 計算邏輯寫入 `docs/portfolio-valuation-radar-spec.md`）。
6. 若接真實資料（price / EPS），需保持 data quality gate（`dataQualityStatus` pipeline 定義）。
7. 若接真實持股（`avgCost` / `quantity`）：需 Supabase staging RLS gates 通過。
8. `PORTFOLIO_SOURCE_MODE` 預設仍為 `hardcoded`。
9. 不得新增 `stock_valuation_snapshots`（建表條件尚未滿足）。
