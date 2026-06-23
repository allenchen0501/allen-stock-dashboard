# Portfolio Valuation Summary API

本文件定義 `/api/portfolio/valuation-summary` 在 V16 的 spec-only endpoint 規格、
response shape、保守預設值與進入 V17 的 promotion gate。

**V16 本階段為 spec-only。endpoint 回傳 `mock_or_contract` 資料。
不連 Supabase、不讀 secret env、不寫資料、不新增 SQL migration、
不新增 `stock_valuation_snapshots`、不產生買賣指令。**

相關文件：
[Portfolio Valuation Radar Spec](./portfolio-valuation-radar-spec.md)、
[Portfolio API Switch Guard](./portfolio-api-switch-guard.md)、
[Schema Boundary Decisions](./schema-boundary-decisions.md)、
[Portfolio Production Readiness](./portfolio-production-readiness.md)。

---

## A. Purpose

V16 的目的是將 V15 定義的 Portfolio Valuation Summary API contract 從純規格轉換為
可呼叫的 Next.js Route Handler，同時建立 TypeScript 型別、spec-only mock builder
與 `valuationTier` / `actionSignal` pure function skeletons。

本階段完成後：

- Allen 可以在本地 `npm run dev` 後呼叫 `GET /api/portfolio/valuation-summary`，
  取得結構正確的 spec-only response，驗證 API contract shape。
- TypeScript 型別已定義，後續接真實資料源時只需替換 builder，不需重新設計 shape。
- `resolvePortfolioValuationTier()` 與 `resolvePortfolioActionSignal()` skeleton 已就緒，
  保守地回傳 `資料不足` 直到 valuation formula 文件化。

明確排除的事項：

- **不正式接真實資料**：`price`、`ttmEPS`、`estimatedEPS` 等欄位均為 `null`。
- **不連 Supabase**：不建立 Supabase client，不讀取任何 Supabase env key。
- **不新增 SQL migration**：`stock_valuation_snapshots` 建表條件尚未滿足（見 Section E，
  [Portfolio Valuation Radar Spec](./portfolio-valuation-radar-spec.md)）。
- **不產生買賣指令**：`actionSignal` 不得包含「買進」或「賣出」；只提供決策輔助。
- **不修改 UI / components**：本階段只新增 backend contract 與 API route。

---

## B. Endpoint Contract

| 項目 | 值 |
|---|---|
| Method | `GET` |
| Route | `/api/portfolio/valuation-summary` |
| Runtime | `nodejs` |
| Cache | `no-store`（避免 spec-only mock 被 CDN 或瀏覽器快取誤認為即時資料） |
| Source mode | `spec_only` |
| Response source | `mock_or_contract` |
| Supabase connected | `false`（V16 永遠為 false） |
| Request performed | `false`（V16 永遠為 false） |
| Production write | `false`（V16 永遠為 false） |
| SQL migration created | `false` |
| stock_valuation_snapshots created | `false` |

---

## C. Response Shape

### 完整型別定義

```typescript
type PortfolioValuationMarket = "TWSE" | "TPEx" | "NASDAQ" | "NYSE";

type PortfolioValuationTier =
  | "特價" | "便宜" | "合理" | "昂貴" | "瘋狂" | "資料不足";

type PortfolioActionSignal =
  | "觀察" | "可分批" | "續抱" | "減碼觀察" | "避開" | "資料不足";

type PortfolioValuationDataQualityStatus = "PASS" | "WARNING" | "FAIL";

type PortfolioValuationSummaryItem = {
  stockId: string;
  stockName: string;
  market: PortfolioValuationMarket;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  valuationTier: PortfolioValuationTier;
  valuationReason: string | null;
  avgCost: number | null;
  quantity: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPercent: number | null;
  positionWeight: number | null;
  ttmEPS: number | null;
  estimatedEPS: number | null;
  forwardPE: number | null;
  fairPrice: number | null;
  cheapPrice: number | null;
  expensivePrice: number | null;
  riskRewardRatio: number | null;
  technicalStatus: string | null;
  capitalFlowStatus: string | null;
  newsSignal: string | null;
  eventRisk: string | null;
  actionSignal: PortfolioActionSignal;
  dataQualityStatus: PortfolioValuationDataQualityStatus;
};

type PortfolioValuationSummaryMetadata = {
  source_mode: "spec_only";
  response_source: "mock_or_contract";
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  model_inference_used: false;
  api_contract_version: "V16";
  sql_migration_created: false;
  stock_valuation_snapshots_created: false;
};

type PortfolioValuationSummaryResponse = {
  data: PortfolioValuationSummaryItem[];
  metadata: PortfolioValuationSummaryMetadata;
};
```

### V16 Response 範例

```json
{
  "data": [
    {
      "stockId": "3019",
      "stockName": "亞洲光學",
      "market": "TWSE",
      "price": null,
      "change": null,
      "changePercent": null,
      "valuationTier": "資料不足",
      "valuationReason": "V16 spec-only contract; valuation formula not enabled.",
      "avgCost": null,
      "quantity": null,
      "unrealizedPnL": null,
      "unrealizedPnLPercent": null,
      "positionWeight": null,
      "ttmEPS": null,
      "estimatedEPS": null,
      "forwardPE": null,
      "fairPrice": null,
      "cheapPrice": null,
      "expensivePrice": null,
      "riskRewardRatio": null,
      "technicalStatus": null,
      "capitalFlowStatus": null,
      "newsSignal": null,
      "eventRisk": null,
      "actionSignal": "資料不足",
      "dataQualityStatus": "WARNING"
    }
  ],
  "metadata": {
    "source_mode": "spec_only",
    "response_source": "mock_or_contract",
    "production_write_performed": false,
    "request_performed": false,
    "supabase_connected": false,
    "model_inference_used": false,
    "api_contract_version": "V16",
    "sql_migration_created": false,
    "stock_valuation_snapshots_created": false
  }
}
```

---

## D. Conservative Defaults

V16 的所有預設值均採保守策略，直到真實資料來源和 valuation formula 就緒為止：

| 欄位 | V16 預設值 | 改變條件 |
|---|---|---|
| `valuationTier` | `"資料不足"` | 官方 price pipeline 穩定 + EPS 來源審核通過 + formula 文件化 |
| `actionSignal` | `"資料不足"` | `valuationTier` 有效 + `dataQualityStatus === "PASS"` |
| `dataQualityStatus` | `"WARNING"` | 真實資料源通過 quality gate |
| `price` | `null` | TWSE/TPEx OpenAPI pipeline 打通 |
| `ttmEPS` | `null` | MOPS 財報資料整合 |
| `estimatedEPS` | `null` | 合法估算來源審核通過且標記 `is_model_inference` |
| `avgCost` / `quantity` | `null` | Supabase RLS gates 通過，`portfolio_stocks` 切換到真實資料 |

### 永久約束

- **缺少 EPS / PE / 價格 / 公式前不得給估值結論**：`valuationTier` 必須顯示 `資料不足`。
- **特價不等於可立即買進**：即使 `valuationTier === "特價"`，仍需技術面、籌碼面、事件風險確認。
- **不得出現買進 / 賣出指令**：`actionSignal` 的所有可能值均不包含「買進」或「賣出」。
- **`resolvePortfolioActionSignal()` 不得觸發自動交易**：結果只作 Allen 個人決策輔助。
- **WARNING / FAIL 資料品質不得輸出 `可分批`**：`dataQualityStatus !== 'PASS'` 時，
  `actionSignal` 必須為 `資料不足`。

---

## Formula Status

V18-alt 新增 [`docs/portfolio-valuation-formula.md`](./portfolio-valuation-formula.md)，
文件化未來估值公式方法論。但 API 行為**完全不變**：

- `/api/portfolio/valuation-summary` 目前仍**不執行估值公式**。
- `valuationTier` 預設仍是 `資料不足`。
- `actionSignal` 預設仍是 `資料不足`。
- V18-alt 只是文件化公式，**不改 API 行為**：source mode 仍為 `spec_only`、
  response source 仍為 `mock_or_contract`、所有估值欄位仍為 `null`。
- 公式正式實作將在 V19（valuation formula skeleton）才開始，且需通過
  [Portfolio Valuation Formula](./portfolio-valuation-formula.md) Section J 的 promotion gate。

Formula Status 摘要（plain-text，供 checker 與快速比對）：valuationTier 預設仍是 資料不足；
actionSignal 預設仍是 資料不足；V18-alt 不改 API 行為。

---

## E. Promotion Gate to V17

進入 V17（Portfolio Valuation Summary 真實資料接入）前，以下條件**全部**必須通過：

- [ ] **`test:portfolio-valuation-summary-api` PASS**：4 gates（required files、
  contract shape、metadata、pure functions）全部 PASS。
- [ ] **TypeScript build 無 error**：`npm run build` 在 V16 修改後通過。
- [ ] **Allen 確認 endpoint shape**：`PortfolioValuationSummaryItem` 所有欄位名稱、
  型別、nullability 已由 Allen 確認，不需再改動 contract。
- [ ] **Allen 確認是否接前端 UI**：確認下一步是：
  (a) 先接前端 UI 顯示 spec-only data，或
  (b) 先接真實 price pipeline，再接 UI。
- [ ] **valuation formula 文件化**：`cheapPrice / fairPrice / expensivePrice` 的計算公式
  （PE 分位基準、EPS 選擇邏輯）已寫入 docs，不得僅靠口頭確認。
- [ ] **不建表方案仍接受**：Allen 確認繼續以 `v85_pro_plus_scores` + `technical_signals`
  + `war_room_items` 為短期資料來源，不建立 `stock_valuation_snapshots`。
- [ ] **若要接真實資料，需另立版本並經 staging gates**：
  任何連接 Supabase 或讀取真實持股的版本必須另立版本號，
  且需通過 V13 staging RLS validation 等價的 gates。
- [ ] **所有既有 tests 通過**：V11–V16 的 checker 均 PASS（`test:portfolio-shadow`、
  `test:portfolio-seed-shape`、`test:portfolio-production-readiness`、
  `test:portfolio-staging-rls`、`test:portfolio-api-switch-guard`、
  `test:portfolio-valuation-radar-spec`、`test:portfolio-valuation-summary-api`）。
