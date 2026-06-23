# Portfolio Valuation Formula

本文件定義 Allen Portfolio Valuation Radar **未來**估值公式的方法論，
作為 `resolvePortfolioValuationTier()` 與相關估值欄位（`cheapPrice / fairPrice / expensivePrice`）
未來實作時的正式依據。

**本階段（V18-alt）只做 formula documentation。
不實作公式、不接真資料、不連 Supabase、不新增 SQL migration、
不新增 `stock_valuation_snapshots`、不修改 UI、不改 API 行為、不產生買賣指令。**

相關文件：
[Portfolio Valuation Radar Spec](./portfolio-valuation-radar-spec.md)、
[Portfolio Valuation Summary API](./portfolio-valuation-summary-api.md)、
[Portfolio Valuation Radar UI](./portfolio-valuation-radar-ui.md)、
[Schema Boundary Decisions](./schema-boundary-decisions.md)。

---

## A. Purpose

本文件的用途：

- 定義 Allen Portfolio Valuation Radar 未來估值公式的方法論。
- 文件化估值區間欄位 `cheapPrice / fairPrice / expensivePrice`（以及 `deepCheapPrice / crazyPrice`）。
- 文件化 `valuationTier` 六層語意（`特價 / 便宜 / 合理 / 昂貴 / 瘋狂 / 資料不足`）。
- 文件化何時必須顯示 `資料不足`。
- 為未來 `resolvePortfolioValuationTier()` 的實作建立可審核、可測試的依據。

本文件明確的邊界：

- **不實作公式**：本輪只寫方法論，不寫任何計算程式碼，也不修改 `use-cases/portfolio/valuation-tier.ts`。
- **不接真資料**：不引入任何真實 price / EPS / PE 資料。
- **不連 Supabase**：不建立 client、不讀 secret env key、不寫入。
- **不新增 SQL migration**：不建立任何 migration 檔案。
- **不新增 `stock_valuation_snapshots`**：建表條件仍未滿足（見 Section I 與
  [Schema Boundary Decisions](./schema-boundary-decisions.md) V11.7）。
- **不改 API 行為**：`/api/portfolio/valuation-summary` 仍維持 spec-only / `mock_or_contract`。
- **不產生買賣指令**：本文件定義的所有價格區間與 tier 均為估值參考，不是交易指令。

### 本輪邊界摘要（plain-text，供 checker 與快速比對）

- 不連 Supabase。
- 不新增 SQL migration。
- 不實作公式。
- 不改 API 行為。
- 不新增 stock_valuation_snapshots。
- 不直接輸出 actionSignal。
- valuationTier 不得直接等於 actionSignal。
- dataQualityStatus 非 PASS 時必須保守。
- 特價 不等於可立即買進。
- 高股價不等於昂貴。
- 低股價不等於便宜。

---

## B. Valuation Inputs

未來估值公式最少需要以下輸入資料：

| 輸入 | 型別 | 說明 |
|---|---|---|
| `price` | number | 官方收盤價 / 即時現價 |
| `ttmEPS` | number | 近四季 EPS 合計（Trailing Twelve Months） |
| `estimatedEPS` | number | 預估 EPS（forward），須標記 `is_model_inference` 與來源 |
| `forwardPE` | number | 前瞻本益比（`price / normalizedEPS`） |
| `historicalPERange` | object | 同一檔股票歷史 PE 分位（`peP10 / peP25 / peP50 / peP75 / peP90`） |
| `industryPERange` | object | 同產業 PE 分位（當個股歷史樣本不足時的次選） |
| `earningsStability` | number/enum | EPS 波動度 / 穩定度指標 |
| `growthRate` | number | YoY EPS 成長率（%） |
| `dataQualityStatus` | enum | `PASS / WARNING / FAIL` |
| `sourceConfidence` | number | 0–100，資料來源可信度 |
| `computedAt` | timestamp | 計算時間（UTC） |

### 輸入層硬規則

- **缺 EPS 不得給估值結論**：`ttmEPS` 與 `estimatedEPS` 同時缺失時，`valuationTier` 必須為 `資料不足`。
- **EPS 為負不得使用一般 PE 估值**：`EPS <= 0` 時，本益比無意義，不得以 PE band 計算 tier，必須改用替代方法或顯示 `資料不足`。
- **EPS 波動過大不得直接用單一年 EPS**：`earningsStability` 顯示高波動時，需採 normalized / mid-cycle earnings，否則 `資料不足`。
- **產業差異過大不得跨產業比較 PE**：不得把 A 產業的 PE band 套到 B 產業。
- **高股價不等於昂貴**：昂貴以本益比相對歷史 / 產業分位判斷，不以絕對股價。
- **低股價不等於便宜**：便宜以安全邊際（現價 vs. 估算合理價）判斷，不以絕對股價。

---

## C. Normalized EPS Policy

未來 `normalizedEPS` 的決策順序（由上而下，第一個成立者勝出）：

1. **優先使用 forward EPS**：若 `estimatedEPS` 合法、來源可信（`sourceConfidence` 足夠）、
   且更新時間有效（非 stale），優先使用 `estimatedEPS` 作為 `normalizedEPS`。
2. **次選 TTM EPS**：若 `estimatedEPS` 不可用，但 `ttmEPS` 穩定（`earningsStability` 通過），
   可使用 `ttmEPS` 作為 `normalizedEPS`。
3. **EPS 不適用 → 資料不足**：若 EPS 為負（`EPS <= 0`）、接近 0、或波動過大，回傳 `資料不足`。
4. **景氣循環股 → normalized earnings**：若產業為高度循環股（`景氣循環股`），
   需使用 normalized / mid-cycle earnings；若無法取得，回傳 `資料不足`。
5. **資料來源衝突 → 保守**：若多個 EPS 來源彼此衝突，回傳 `資料不足` 或將 `dataQualityStatus` 設為 `WARNING`，不得硬算。

本輪不得寫入任何固定公司的 EPS 或估值結果。以上僅為方法論。

---

## D. PE Band Methodology

未來 PE 區間（PE band）方法論：

- **優先使用同一檔股票的歷史 PE 分位數**（`historicalPERange`）。
- **次選同產業 PE 分位數**（`industryPERange`），僅在個股歷史樣本不足時使用。
- **不得跨產業硬套同一 PE**。
- **不得用單一固定 PE 倍數套全部股票**。

至少需要以下歷史 PE 分位數：

| 分位 | 欄位 | 用途 |
|---|---|---|
| 第 10 百分位 | `peP10` | 深度便宜界線（`deepCheapPrice`） |
| 第 25 百分位 | `peP25` | 便宜界線（`cheapPrice`） |
| 第 50 百分位 | `peP50` | 合理中樞（`fairPrice`） |
| 第 75 百分位 | `peP75` | 昂貴界線（`expensivePrice`） |
| 第 90 百分位 | `peP90` | 瘋狂界線（`crazyPrice`） |

### 價格區間公式（未來實作參考）

```text
deepCheapPrice = normalizedEPS * peP10
cheapPrice     = normalizedEPS * peP25
fairPrice      = normalizedEPS * peP50
expensivePrice = normalizedEPS * peP75
crazyPrice     = normalizedEPS * peP90
```

### 價格區間語意（重要）

- `deepCheapPrice` 不是抄底價。
- `cheapPrice` 不是買進價。
- `fairPrice` 不是目標價。
- `expensivePrice` 不是賣出價。
- `crazyPrice` 不是放空價。

以上價格只作為**估值區間參考**，協助 Allen 判斷現價落在估值光譜的哪個位置，
不構成任何交易指令，也不產生買賣指令。

---

## E. Valuation Tier Mapping

六層 `valuationTier`：

1. `特價`
2. `便宜`
3. `合理`
4. `昂貴`
5. `瘋狂`
6. `資料不足`

### 建議 mapping（未來實作參考）

```text
price <= deepCheapPrice                          → 特價
deepCheapPrice < price <= cheapPrice             → 便宜
cheapPrice < price <= fairPrice（或 fairPrice 附近）→ 合理
fairPrice < price <= expensivePrice              → 昂貴
price > expensivePrice（或接近 crazyPrice 以上）   → 瘋狂
資料不足 / EPS 不適用 / PE band 不可信            → 資料不足
```

### Tier 語意補充（每一層都不是交易指令）

- **`特價` 不等於可立即買進**：特價需同時確認技術面、籌碼面未轉壞且無重大事件風險。
- **`便宜` 不等於安全**：便宜但趨勢壞 / 籌碼壞 / 事件風險高時仍需謹慎。
- **`合理` 不等於無風險**：合理價區間仍可能因事件或大盤 regime 反轉而下跌。
- **`昂貴` 不等於必須減碼**：高成長股在特定條件下可接受較高 PE。
- **`瘋狂` 不等於必須出場**：情緒面動能有時能持續一段時間。
- **`資料不足` 是保守狀態，不是錯誤**：缺資料時顯示 `資料不足` 是正確且安全的行為。

---

## F. Data Quality Gate

若以下**任一**條件成立，`valuationTier` 必須為 `資料不足`，
或 `dataQualityStatus` 至少為 `WARNING`：

- 缺 `price`。
- 缺 EPS（`ttmEPS` 與 `estimatedEPS` 均缺）。
- `EPS <= 0`（虧損公司，本益比無意義）。
- PE band 不足（無法取得足夠的 `peP10 / peP25 / peP50 / peP75 / peP90`）。
- historical PE sample 太少（歷史樣本不足以構成可信分位）。
- industry classification 不明（無法判定 `industryPERange`）。
- data source confidence 低（`sourceConfidence` 過低）。
- data timestamp stale（`computedAt` / 來源更新時間過舊）。
- EPS 暴增暴減導致不可比（`earningsStability` 失效）。
- 法說 / 財報重大事件尚未反映於資料。
- 公司處於轉虧轉盈、一次性收益、資產處分、會計重分類等使 EPS 不可比的情境。

**`dataQualityStatus` 非 PASS 時必須保守**：不得在 `WARNING` / `FAIL` 狀態下輸出積極的估值或行動結論。

---

## G. Action Signal Boundary

`actionSignal` 與 `valuationTier` 是兩個獨立的概念，必須明確分離：

- **`valuationTier` 不得直接等於 `actionSignal`**。
- `特價` 不得直接推出 `可分批`。
- `昂貴` 不得直接推出 `減碼觀察`。
- `瘋狂` 不得直接推出 `避開`。

`actionSignal` 在未來實作時，除了 `valuationTier` 之外，必須額外參考：

- 大盤 regime（Risk-On / Neutral / Risk-Off）。
- 技術趨勢。
- 籌碼。
- 事件風險。
- 持股成本。
- 部位比重。
- `dataQualityStatus`。

**`dataQualityStatus` 非 PASS 時，`actionSignal` 必須保守**（趨向 `資料不足` 或 `觀察`）。

本文件同時定義一條輸出層硬規則：估值文件**不直接輸出 actionSignal**；
`actionSignal` 的決策邏輯屬於未來 V19+ 範疇，且本文件不實作之。

### 明確禁止

- 禁止自動產生買賣指令。
- 禁止自動下單。
- 禁止使用「推薦買進 / 明確賣出 / 立即進場」等語意。

---

## H. Industry / Business Model Exceptions

以下情境**不適合**單純 PE 估值，需特別處理：

- EPS 為負（`EPS <= 0`）。
- 高成長但短期獲利低。
- 景氣循環股（`景氣循環股`）。
- 金融股。
- 資產股。
- 生技 / 新藥。
- 一次性處分收益。
- 轉虧轉盈。
- 高折舊 / 高攤銷產業。
- 不同會計政策導致 EPS 不可比。

### 替代估值方式（未來方向，本輪不實作）

| 方法 | 適用情境 |
|---|---|
| `P/B` | 資產股、金融股、淨值導向 |
| `P/S` | 高成長但獲利尚低、營收導向 |
| `EV/EBITDA` | 高折舊 / 高攤銷、資本密集產業 |
| normalized earnings | 景氣循環股、一次性損益調整 |
| peer comparison | 同業相對估值 |
| 暫時顯示資料不足 | 上述方法皆不可信時的保守預設 |

**本輪不得實作任何替代模型**；以上僅為方法論記錄。

---

## I. Formula Implementation Rules for Future Versions

未來若要實作估值公式，必須滿足以下全部條件：

1. 本文件（`docs/portfolio-valuation-formula.md`）存在且 `test:portfolio-valuation-formula-doc` PASS。
2. input data schema 明確（Section B 的所有輸入欄位有正式型別與來源）。
3. dataQuality gate 明確（Section F 的所有條件可程式化檢查）。
4. EPS / PE source 合法且穩定（已通過 ETL source 審核與 quality gate）。
5. formula fixture tests PASS（以 mock 資料驗證 `deepCheapPrice / cheapPrice / fairPrice / expensivePrice / crazyPrice`
   與 `valuationTier` mapping 的正確性）。
6. 不直接輸出買賣指令（公式輸出僅為估值區間與 tier）。
7. **不新增 `stock_valuation_snapshots`**，除非 [Schema Boundary Decisions](./schema-boundary-decisions.md)
   V11.7 的 boundary 建表條件被重新審核並全部通過。
8. 若未來建立 `stock_valuation_snapshots`，需另立 migration version 並重新審核 RLS / grants / boundary。

---

## J. V18 / V19 Promotion Gate

### 進入 V18（official price enrichment）前需

- 本文件 PASS（`test:portfolio-valuation-formula-doc`）。
- `price / change / changePercent` 只作價格 enrichment，**不觸發 `valuationTier`**。
- `dataQualityStatus` 可針對 price source 評估，但**不得直接給估值結論**。
- 仍不連 Supabase、不新增 SQL migration、不產生買賣指令。

### 進入 V19（valuation formula skeleton）前需

- 本文件 PASS。
- valuation formula fixture 確認（Section I 的 fixture tests 設計就緒）。
- Allen 確認 PE band methodology（Section D）。
- negative EPS（`EPS <= 0`）/ cyclical（景氣循環股）/ data insufficient（資料不足）handling 已確認。
- 不新增資料表（不新增 `stock_valuation_snapshots`）。
