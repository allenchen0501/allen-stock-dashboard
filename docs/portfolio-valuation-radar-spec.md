# Portfolio Valuation Radar Spec

本文件定義 Allen Stock Dashboard V15 的 Portfolio Valuation Radar 產品規格、
API contract proposal、資料來源 mapping、短期不建表方案與長期建表條件。

**本文件為純產品規格（spec-only）。本階段不新增 SQL migration、不新增 API route、
不連 Supabase、不寫入資料、不修改 UI。**

相關文件：
[Schema Boundary Decisions](./schema-boundary-decisions.md)、
[Portfolio API Switch Guard](./portfolio-api-switch-guard.md)、
[Portfolio Production Readiness](./portfolio-production-readiness.md)、
[Portfolio Staging RLS Validation](./portfolio-staging-rls-validation.md)、
[War Room Architecture](./war-room-architecture.md)、
[ETL Data Contract](./etl-data-contract.md)。

---

## A. Purpose

V15 的目的是建立 Allen 個人版 **Portfolio Valuation Radar** 的完整產品規格，
作為後續 API / UI 實作的設計基準。

### 核心原則

- **以 Allen 持股 / 觀察清單為核心**：雷達圖是 Allen 自己的持股健康狀態，不是公開選股平台。
- **可操作但不自動下單**：所有 `actionSignal` 只是決策輔助，不得觸發任何買賣指令。
- **不複製對方資料或後端**：參考其他投資網站的模組化 API 思路，但所有資料來源必須符合
  [ETL Source Plan](./etl-source-plan.md) 的來源審核規則（免費公開、合法抓取）。
- **個人版安全原則**：不做 VIP 等級、不做多會員 billing、不做 search limit，
  但仍保留 `owner_id` owner-scoped design、RLS policy、hardcoded fallback 機制，
  未來若開放多人使用，需重審 auth / RLS / rate limit。
- **不擴表原則**：本階段 `valuationTier` 與 `actionSignal` 均為 spec-only；
  不新增 `stock_valuation_snapshots`，不平行取代 `v85_pro_plus_scores`。

---

## B. Product Modules

### 模組 1：Portfolio Valuation Radar（持股估值雷達）

**目的**：讓 Allen 在一個畫面中回答「我目前的每一檔持股，是否便宜、合理、過熱、可續抱、需避開？」

不只顯示價格，整合以下維度：

| 維度 | 說明 |
|---|---|
| 成本 / 損益 | `avgCost`、`unrealizedPnL`、`unrealizedPnLPercent`、`positionWeight` |
| 估值 | `valuationTier`、`forwardPE`、`fairPrice`、`cheapPrice`、`expensivePrice` |
| 基本面 | `ttmEPS`、`estimatedEPS`、成長率 |
| 風報比 | `riskRewardRatio`（短期引用 `v85_pro_plus_scores.risk_reward_score`） |
| 技術 | `technicalStatus`（短期引用 `technical_signals` 訊號摘要） |
| 籌碼 | `capitalFlowStatus`（短期讀 `v85_pro_plus_scores.chip_score` 分項） |
| 事件風險 | `eventRisk`（來自 `war_room_items` 或未來 events module） |
| 新聞風向 | `newsSignal`（法說、重大公告、券商異動） |
| 行動訊號 | `actionSignal`（純輔助；不得自動下單） |

### 模組 2：Market Temperature（市場溫度計）

**目的**：判斷台股整體是 Risk-On / Neutral / Risk-Off，決定當前持股曝險是否適合。

資料來源：

| 指標 | 來源 |
|---|---|
| 加權指數 / 月線 / 季線 | TWSE OpenAPI（official） |
| 櫃買指數 | TPEx OpenAPI（official） |
| 台指期 / 期貨 OI | 臺灣期交所（official，頻率低頻日結） |
| 外資期貨淨部位 | TWSE 三大法人期貨部位（official） |
| 漲跌家數（Advance / Decline） | TWSE OpenAPI |
| 台幣匯率 | 公開 FX 資料源（待審核） |
| 美股 SOX / Nasdaq | Yahoo Finance（confidence 80，輔助） |
| 市場新聞風向 | 短期 spec-only；未來接 MOPS 重大訊息 |

輸出至少包含：`marketMode`（Risk-On / Neutral / Risk-Off）、`temperatureScore`（0–100）、
`headline`、`dataFreshness`。

### 模組 3：Stock Research Snapshot（個股研究快照）

**目的**：針對單一個股，提供基本面估值快照，作為 `valuationTier` 計算的輸入，
不作為公開投資建議，只作為 Allen 自用的估值 input。

包含：

- EPS（TTM）：`ttmEPS`，來源 MOPS 月營收 / 財報
- 預估 EPS：`estimatedEPS`，來源合法公開資訊（待定），標記 `is_model_inference = true`
- `forwardPE`、`fairPrice`、`cheapPrice`、`expensivePrice`（見 Section F）
- 資料品質：`dataQualityStatus`（PASS / WARNING / FAIL）

重要限制：

- 不公開推薦；不作為市場上的買賣建議。
- 所有 EPS 估算需標記 `is_model_inference` 與 `source_confidence`。
- 若資料不足，顯示 `valuationTier: '資料不足'`，不得補 0 或偽造估算。

### 模組 4：Event Radar（事件雷達）

**目的**：彙整可能影響持股的近期事件，分層顯示，讓 Allen 在開倉 / 續抱前掌握事件風險。

事件分層：

| 層級 | 類型 | 範例 |
|---|---|---|
| stock-level | 單股事件 | 法說會、月營收、財報、券商評等調整、法人異常買賣超 |
| industry-level | 產業事件 | 半導體訂單能見度、供應鏈庫存、產業政策 |
| macro-level | 總經事件 | 聯準會利率決策、非農就業、台灣大選、台美關係 |

短期：以 `war_room_items`（`section = 'market_signal'` 或 `section = 'holdings'` 的 payload）
作為過渡資料源；長期接 MOPS 重大訊息 + 券商評等資料。

### 模組 5：Warm Risk Reminder（風險溫馨提醒）

**目的**：每日一次或每次開盤前，提醒 Allen 當前整體風控狀況，
不放投資雞湯，只放有根據的風險觀察。

範例提醒類型：

- 大盤過熱（`temperatureScore > 80`）→ 建議降低新增部位規模
- 融資風險（`financing_ratio` 接近警戒）→ 提醒部位槓桿
- 匯率風險（台幣大幅貶值）→ 提醒外幣資產影響
- 外資期貨偏空（外資期貨空頭淨部位擴大）→ 提醒市場情緒
- 櫃買轉弱（小型股承壓）→ 提醒中小型持股風險

限制：

- 不得作為「你現在應該賣」的自動指令。
- 提醒來源必須可追溯（標記資料截止時間與來源）。
- 不產生公開投資建議；只限 Allen 個人使用。

---

## C. API Contract Proposal

**本節為 proposal 僅供規格參考，不在本階段建立任何 route。**
未來實作時，所有 route 須符合現有 `ApiResult<T>` 契約（`types/api/`）與 switch guard metadata 格式。

### 建議命名

| 模組 | 建議 API 名稱 |
|---|---|
| 持股估值雷達 | `portfolio.valuationSummary` |
| 市場溫度計 | `market.temperature` |
| 個股研究快照 | `stock.researchSnapshot` |
| 事件雷達 | `events.radar` |
| 風險提醒 | `riskReminders.list` |

### `portfolio.valuationSummary` Response Shape

```typescript
type Market = 'TWSE' | 'TPEx' | 'NASDAQ' | 'NYSE';

type ValuationTier =
  | '特價'
  | '便宜'
  | '合理'
  | '昂貴'
  | '瘋狂'
  | '資料不足';

type ActionSignal =
  | '觀察'
  | '可分批'
  | '續抱'
  | '減碼觀察'
  | '避開'
  | '資料不足';

type DataQualityStatus = 'PASS' | 'WARNING' | 'FAIL';

type PortfolioValuationSummaryItem = {
  stockId: string;
  stockName: string;
  market: Market;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  valuationTier: ValuationTier;
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
  actionSignal: ActionSignal;
  dataQualityStatus: DataQualityStatus;
};

type PortfolioValuationSummaryMetadata = {
  source_mode: 'spec_only';
  response_source: 'mock_or_contract';
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  model_inference_used: false;
};

type PortfolioValuationSummaryResponse = {
  ok: true;
  data: PortfolioValuationSummaryItem[];
  meta: PortfolioValuationSummaryMetadata;
};
```

### `market.temperature` Response Shape（摘要）

```typescript
type MarketMode = 'Risk-On' | 'Neutral' | 'Risk-Off';

type MarketTemperatureResponse = {
  ok: true;
  data: {
    marketMode: MarketMode;
    temperatureScore: number;   // 0–100
    headline: string;
    reasons: string[];
    dataFreshness: string;      // ISO 8601 timestamp
  };
  meta: {
    source_mode: 'spec_only';
    response_source: 'mock_or_contract';
    production_write_performed: false;
    request_performed: false;
    supabase_connected: false;
  };
};
```

### `stock.researchSnapshot` Response Shape（摘要）

```typescript
type StockResearchSnapshotResponse = {
  ok: true;
  data: {
    stockId: string;
    stockName: string;
    market: Market;
    ttmEPS: number | null;
    estimatedEPS: number | null;
    estimatedEPSSource: string | null;
    estimatedEPSIsModelInference: boolean;
    forwardPE: number | null;
    fairPrice: number | null;
    cheapPrice: number | null;
    expensivePrice: number | null;
    valuationTier: ValuationTier;
    dataQualityStatus: DataQualityStatus;
    computedAt: string;
  };
  meta: {
    source_mode: 'spec_only';
    response_source: 'mock_or_contract';
    production_write_performed: false;
    request_performed: false;
    supabase_connected: false;
    model_inference_used: boolean;
  };
};
```

---

## D. Short-Term No-New-Table Plan

依據 [Schema Boundary Decisions](./schema-boundary-decisions.md) V11.7 原則，
**本階段不新增 `stock_valuation_snapshots` 或任何新資料表。**

短期各維度資料來源 mapping：

| 維度 | 短期資料來源 | 說明 |
|---|---|---|
| Portfolio identity（symbol、market、name） | `portfolio_stocks` / hardcoded fallback | owner-scoped，已有 RLS skeleton |
| Current price（`price`、`change`、`changePercent`） | Official price pipeline（TWSE/TPEx OpenAPI） | 目前 pipeline 為 skeleton，短期 spec-only |
| Cost / quantity（`avgCost`、`quantity`） | owner-scoped `portfolio_stocks` | 真實資料需 Supabase RLS gates 通過後才讀 |
| Risk reward ratio（`riskRewardRatio`） | `v85_pro_plus_scores.risk_reward_score` + `score_breakdown` JSONB | 已在 schema；短期讀 Pro+ 分項 |
| Technical status（`technicalStatus`） | `technical_signals` 訊號摘要 | 布林訊號聚合；現無真實資料，短期 spec-only |
| Capital flow（`capitalFlowStatus`） | `v85_pro_plus_scores.chip_score` 分項 | 短期讀 Pro+ chip 分項；長期接 `chip_snapshots` |
| Event / news risk（`eventRisk`、`newsSignal`） | `war_room_items` payload / 未來 events module | 短期人工輸入戰情室；長期接 MOPS |
| Valuation tier（`valuationTier`） | 本階段 spec-only，不落 DB | 需 EPS / PE 資料穩定後才計算並落表 |
| ActionSignal（`actionSignal`） | 本階段 spec-only；顯示決策輔助 | 不得自動觸發買賣指令，不得作為公開投資建議 |

---

## E. Long-Term Table Candidate

**以下為未來可能新增的資料表，現在不建。**
建表條件全部通過後，才可新增 migration。

### `stock_valuation_snapshots`（現在不建）

欄位候選：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | uuid | 主鍵 |
| `stock_id` | text | 個股代號（`symbol`） |
| `stock_name` | text | 股票名稱 |
| `market` | text | `TWSE / TPEx / NASDAQ / NYSE` |
| `price` | numeric | 計算當下的現價 |
| `change` | numeric | 當日漲跌 |
| `change_percent` | numeric | 當日漲跌幅（百分比） |
| `valuation_tier` | text | `特價 / 便宜 / 合理 / 昂貴 / 瘋狂 / 資料不足` |
| `valuation_reason` | text | 估值依據說明 |
| `ttm_eps` | numeric | 近四季 EPS 合計 |
| `estimated_eps` | numeric | 預估 EPS（需標記 `is_model_inference`） |
| `growth_percent` | numeric | YoY EPS 成長率（%） |
| `forward_pe` | numeric | 前瞻本益比（`price / estimatedEPS`） |
| `fair_price` | numeric | 合理價（依本益比區間計算） |
| `cheap_price` | numeric | 便宜價 |
| `expensive_price` | numeric | 昂貴價 |
| `computed_at` | timestamptz | 計算時間（UTC） |
| `source_name` | text | 資料來源（`twse-openapi`、`mops` 等） |
| `source_confidence` | integer | 0–100 |
| `data_quality_status` | text | `PASS / WARNING / FAIL` |

建表條件（全部必須通過才可新增 migration）：

1. 官方 price pipeline（TWSE / TPEx OpenAPI）已穩定且通過 quality gate。
2. EPS / PE / estimated EPS 資料源已審核為合法公開（MOPS 或等值官方來源），且穩定有資料。
3. `valuationTier` 計算公式已文件化（含 PE 分位、歷史 EPS 基準、資料不足判定條件）。
4. `valuationTier` 不與 `v85_pro_plus_scores` 重複保存相同結論；兩者職責已明確分工：
   `v85_pro_plus_scores` 是綜合多因子評分，`stock_valuation_snapshots` 只保存估值快照事實。
5. 至少完成 fixture validation（spec checker 通過，且有模擬的 mock 資料驗證欄位 shape）。
6. **不得只因 UI 或前端展示需要就建表**；建表條件必須從真實資料路徑打通開始，而非 UI 先行。

---

## F. Valuation Tier Semantics

`valuationTier` 是對個股當前價格相對於估算合理價值的位置判斷，不是買賣訊號。

### 特價（极度低估）

- **意義**：現價明顯低於便宜價（例如低於 10 倍本益比下限或歷史低本益比區間），
  市場可能因短期恐慌、事件衝擊或流動性問題而大幅折價。
- **不代表**：可以立即買進。**特價不等於可立即買進**；
  需同時確認籌碼面、技術面未轉壞且無重大事件風險，才有操作價值。
- **Supporting data**：官方收盤價 + EPS（TTM）+ 歷史本益比區間。
- **資料不足時**：顯示 `資料不足`，不得顯示「特價」。

### 便宜（低估）

- **意義**：現價低於合理價，具有安全邊際，但尚未到達歷史极值折價。
- **不代表**：可以不考慮技術或籌碼直接進場。
  **低股價不等於便宜**；低絕對股價但高 PE 不是便宜。
  **便宜但趨勢壞 / 籌碼壞 / 事件風險高時仍需避開**。
- **Supporting data**：EPS（TTM）、`forwardPE`、`cheapPrice` 基準。
- **資料不足時**：顯示 `資料不足`。

### 合理（公平價值附近）

- **意義**：現價落在合理本益比區間內，既不特別便宜也不過熱。
- **不代表**：隨時可買進；仍需看技術面 / 籌碼面 / 事件風險。
- **Supporting data**：`fairPrice` ± 一定幅度（待定義公式）。
- **資料不足時**：顯示 `資料不足`。

### 昂貴（高估）

- **意義**：現價高於估算昂貴價，本益比偏高，存在估值溢價。
- **不代表**：一定要賣；高成長股在特定條件下可接受高 PE。
  **高股價不等於昂貴**；高絕對股價但低 PE 不是昂貴。
- **Supporting data**：`expensivePrice` 基準 + 本益比歷史分位。
- **資料不足時**：顯示 `資料不足`。

### 瘋狂（極度高估）

- **意義**：現價遠高於任何合理估值基準，市場情緒可能過熱，存在顯著修正風險。
- **不代表**：一定會崩；情緒面動能有時能持續一段時間。
- **Supporting data**：本益比 > 歷史高分位 + `expensivePrice` 大幅超越。
- **資料不足時**：顯示 `資料不足`。

### 資料不足

- **意義**：缺少計算 `valuationTier` 所需的必要資料（價格、EPS 或本益比基準任一缺失）。
- **使用時機**：
  - `price` 為 null（官方 pipeline 未取得或 fallback 失敗）。
  - `ttmEPS` 或 `estimatedEPS` 均為 null（EPS 來源缺失）。
  - `dataQualityStatus === 'FAIL'`（資料驗證失敗）。
  - EPS ≤ 0（虧損公司；本益比無意義）。
- **不得補 0 或以假設值計算**；必須明確標示資料不足。

### 重要原則彙整

| 常見誤解 | 正確說明 |
|---|---|
| 高股價 = 昂貴 | 錯誤。昂貴以本益比相對歷史分位判斷，不以絕對股價。 |
| 低股價 = 便宜 | 錯誤。便宜以安全邊際（現價 vs. 估算合理價）判斷。 |
| 特價 = 可立即買進 | 錯誤。特價需同時滿足技術面、籌碼面、事件風險未轉壞。 |
| 便宜 = 低風險 | 錯誤。便宜但趨勢壞 / 籌碼壞 / 事件風險高時仍需避開。 |

---

## G. Personal-Use Scope

Allen Stock Dashboard 目前為 **Allen 個人使用**，以下規則明確定義本版本的範疇邊界：

### 本版本明確不做

- **不做 VIP 等級 / 多會員 billing**：無需付費牆、無需方案差異。
- **不做 search limit**：個人使用量不構成速率問題，無需計費配額。
- **不做多租戶**：資料模型以單一 owner（Allen）為主，所有 `portfolio_stocks` 均屬同一個 `owner_id`。
- **不做公開推薦平台**：所有 `valuationTier` / `actionSignal` 只作 Allen 個人決策輔助，
  不對外發布、不作為投資建議。

### 保留的安全設計（為未來擴展保留選項）

- **`owner_id` owner-scoped design**：`portfolio_stocks` 已有 `owner_id uuid references auth.users(id)`，
  RLS policy 使用 `owner_id = auth.uid()`，架構上已支援多用戶隔離。
- **RLS policy**：`portfolio_stocks` 的 select / insert / update 均受 RLS 保護；
  無 policy 時預設 deny（fail-closed）。
- **Hardcoded fallback**：`PORTFOLIO_SOURCE_MODE` 未設定時預設 `hardcoded`，
  empty Supabase result 不得覆蓋 hardcoded data。

### 未來若開放多人使用，必須重審

- Auth 方式（目前 Supabase Auth，個人用途 JWT 已足夠）。
- RLS policy 是否涵蓋所有新表。
- Rate limit / API quota 機制。
- Billing 邏輯（若有商業化需求）。

---

## H. V16 Promotion Gate

進入 V16（Portfolio Valuation Radar 實作層）前，以下條件**全部**必須通過：

- [ ] **V15 spec checker PASS**：`npm run test:portfolio-valuation-radar-spec` 輸出 `status: "PASS"`。
- [ ] **API contract shape confirmed**：`portfolio.valuationSummary` 的 `PortfolioValuationSummaryItem`
  所有欄位名稱、型別、nullability 已由 Allen 確認。
- [ ] **valuationTier semantics confirmed**：Section F 的六個 tier 定義（含「不代表什麼」）
  已由 Allen 確認，且 `valuationTier` 計算公式草案已文件化。
- [ ] **no-new-table plan accepted**：Allen 確認短期以現有表為資料來源（不建 `stock_valuation_snapshots`），
  並同意建表條件（Section E）。
- [ ] **Allen 確認 Portfolio Valuation Radar 是下一個 UI / API 優先項**：確認優先於
  其他模組（Market Temperature 等）開始實作。
- [ ] **不得在未確認 valuation formula 前新增 SQL migration**：
  `valuationTier` 計算公式（PE 分位基準、`cheapPrice / fairPrice / expensivePrice` 公式）
  必須先文件化，才可建立對應資料表。
- [ ] **TypeScript build 無 error**：`npm run build` 在 V15 修改後通過。
- [ ] **所有既有 tests 通過**：V11–V14 的 checker（`test:portfolio-shadow`、
  `test:portfolio-seed-shape`、`test:portfolio-production-readiness`、
  `test:portfolio-staging-rls`、`test:portfolio-api-switch-guard`）均 PASS。

V16 可以開始實作的事項：

- 建立 `/api/valuation` route（mock / spec-only 回傳）。
- 建立 `PortfolioValuationSummaryItem` TypeScript 型別（不依賴 DB）。
- 建立 `valuationTier` 計算 pure function（fixture-only，可本地測試）。
- 建立 `actionSignal` 決策 pure function（不連 DB，不產生買賣指令）。
- 不在 V16 新增真實 DB schema（除非 Section E 建表條件均已通過）。
