# Institutional Research Center Spec

本文件定義 Allen Stock Dashboard 的 **Institutional Research Center**（法人研究中心）規格。
本規格是 `docs/war-room-intelligence-architecture.md` 中 Institutional Research Center / Research Score Engine /
TOP 5 Research Ranking / Research Card Export 1080x1920 等能力的細化文件。

**本階段（V18D）只做規格、型別合約與 fixture-only checker。
不查資料、不寫資料、不產生報告、不產生 PNG / PDF / HTML 卡片、
不新增 API route、不新增 UI component、不連 Supabase、不新增 SQL migration、
不寫入資料、不產生買賣指令。**

相關文件：
[War Room Intelligence Architecture](./war-room-intelligence-architecture.md)、
[Intraday Risk Crisis Alert Spec](./intraday-risk-crisis-alert-spec.md)、
[Portfolio Valuation Formula](./portfolio-valuation-formula.md)、
[Portfolio Valuation Radar Spec](./portfolio-valuation-radar-spec.md)、
[Schema Boundary Decisions](./schema-boundary-decisions.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Institutional Research Center。
- 目標是建立法人研究中心規格，支援股票清單研究、八條件評分、TOP5 排序、手機研究卡輸出。
- 本模組回答「哪些股票值得深入研究」。
- 本模組不回答「現在能不能進場」。
- **Research Center 不直接產生買點。**
- **Research Center 不直接產生買賣指令。**
- 本階段只做 spec，不查資料、不寫資料、不產生報告。

---

## B. Data Licensing Boundary

法人研究資料的授權邊界：

- FactSet、法人共識、券商目標價、券商報告全文屬於授權型或付費資料。
- 未取得授權時，系統必須顯示 `資料不足` 或 `LICENSE_REQUIRED`。
- 不得假裝已取得 FactSet 共識。
- 不得自行推估法人目標價。
- 不得抄錄券商報告全文。
- 不得使用未授權資料作為正式評分依據。
- 若來源未驗證，`dataQualityStatus` 不得為 PASS。
- 所有研究輸出必須標註資料來源與資料日期（`sourceNames` + `asOfDate`）。

資料可用性狀態（`ResearchCoverageStatus`）：

| 狀態 | 說明 |
|---|---|
| `AVAILABLE` | 已取得且通過驗證的資料 |
| `DATA_INSUFFICIENT` | 資料不足，無法判斷 |
| `LICENSE_REQUIRED` | 需授權資料（FactSet / consensus / broker target price）尚未取得 |
| `SOURCE_CONFLICT` | 多來源衝突，需降級 |
| `STALE` | 資料過期，不得作為高信心結論 |
| `NOT_COVERED` | 該標的未被研究覆蓋 |

---

## C. Data Source Candidates

未來可能資料源（依信任順序）：

### Public / official candidates

- TWSE / TPEx
- Public Information Observation Station（公開資訊觀測站）
- monthly revenue open data（月營收公開資料）
- company filings
- investor conference materials
- annual reports
- quarterly financial reports
- public earnings call materials

### Licensed / paid candidates

- FactSet Estimates
- FactSet Consensus
- broker consensus
- institutional reports
- global market share reports

### Fallback / user verified candidates

- manual verified annotations
- user uploaded report metadata
- cached public data
- research notes created by Allen

資料源規則：

- official/public source first for public facts（公開事實以官方來源優先）。
- licensed source required for consensus（共識資料需授權來源）。
- fallback source cannot override official source（fallback 不得覆蓋官方來源）。
- source conflict → WARNING or DATA_INSUFFICIENT。
- no coverage → NOT_COVERED。

---

## D. Research Input Universe

Research Center 可接受的輸入：

- uploaded image list（上傳圖片清單）
- pasted text list（貼上文字清單）
- manual stock list（手動股票清單）
- watchlist（觀察清單）
- portfolio holdings（持股）
- sector basket（族群籃）
- AI supply chain basket（AI 供應鏈籃）

本輪不實作 OCR，不解析圖片，不查資料。輸入只定義型別（`ResearchUniverseInput`），不執行任何抓取。

---

## E. Research Data Contract Fields

未來每檔股票研究資料欄位（對應 `ResearchStockSnapshot`）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `stockId` | string | 股票代碼 |
| `stockName` | string | 股票名稱 |
| `market` | string | 市場別（TWSE / TPEx / …） |
| `latestClose` | number \| null | 最新收盤價 |
| `latestCloseDate` | string \| null | 最新收盤日期 |
| `marketCap` | number \| null | 市值 |
| `targetPriceLow` | number \| null | 法人目標價低標 |
| `targetPriceHigh` | number \| null | 法人目標價高標 |
| `targetPriceAverage` | number \| null | 法人平均目標價 |
| `targetPriceSourceStatus` | ResearchCoverageStatus | 目標價來源狀態 |
| `potentialUpsidePercent` | number \| null | 潛在漲幅 |
| `eps2025E` | number \| null | 2025 EPS 預估 |
| `eps2026E` | number \| null | 2026 EPS 預估 |
| `eps2027E` | number \| null | 2027 EPS 預估 |
| `epsGrowth2026YoY` | number \| null | 2026 EPS 年增率 |
| `epsGrowth2027YoY` | number \| null | 2027 EPS 年增率 |
| `latestMonthlyRevenue` | number \| null | 最新月營收 |
| `previousMonthlyRevenue` | number \| null | 前月營收 |
| `latestMonthlyRevenueYoY` | number \| null | 最新月營收年增率 |
| `latestMonthlyRevenueMoM` | number \| null | 最新月營收月增率 |
| `previousMonthlyRevenueYoY` | number \| null | 前月營收年增率 |
| `previousMonthlyRevenueMoM` | number \| null | 前月營收月增率 |
| `cumulativeRevenue` | number \| null | 累計營收 |
| `cumulativeRevenueYoY` | number \| null | 累計營收年增率 |
| `earningsCallSummary` | string \| null | 法說會摘要 |
| `earningsCallDate` | string \| null | 法說會日期 |
| `aiSupplyChainTags` | AiSupplyChainTag[] | AI 供應鏈標籤 |
| `aiBenefitLevel` | AiBenefitLevel | AI 受惠程度 |
| `industryPosition` | string \| null | 產業地位 |
| `globalMarketShare` | string \| null | 全球市占率 |
| `competitors` | string[] | 主要競爭對手 |
| `pullbackReason` | PullbackReasonType | 回檔原因 |
| `bullishFactors` | string[] | 利多 |
| `riskFactors` | string[] | 風險 |
| `researchScore` | number \| null | 研究總分（`totalResearchScore`） |
| `researchRating` | ResearchRating | 研究評級 |
| `dataQualityStatus` | ResearchDataQualityStatus | 資料品質狀態 |
| `sourceMode` | enum | spec_only / fixture / licensed_runtime_candidate |
| `sourceNames` | string[] | 資料來源名稱 |
| `asOfDate` | string \| null | 資料日期 |

關鍵規定：

- 缺少關鍵資料時，**不得自行補值**，必須填 `null` 或顯示 `資料不足`。
- 任何欄位若來源未授權，對應 `targetPriceSourceStatus` 須為 `LICENSE_REQUIRED`。

---

## F. Eight-Factor Research Score Engine

八條件量化評分（八條件）：

| # | 條件 | factor key |
|---|---|---|
| 1 | 未來 2 年 EPS 持續成長性 | `EPS_GROWTH` |
| 2 | 法人平均目標價與現價之價差空間 | `TARGET_PRICE_UPSIDE` |
| 3 | 最新法說會對未來的展望正向度 | `EARNINGS_CALL_OUTLOOK` |
| 4 | AI 長期大趨勢的直接受惠程度 | `AI_DIRECT_BENEFIT` |
| 5 | 營收與獲利基本面實質支撐力 | `REVENUE_EARNINGS_SUPPORT` |
| 6 | 近期回檔原因是否偏籌碼面而非需求面 | `PULLBACK_NOT_DEMAND_DECAY` |
| 7 | 未來潛在利多是否明顯大於潛在風險 | `UPSIDE_VS_RISK` |
| 8 | 產業龍頭地位或市場寡占優勢 | `INDUSTRY_LEADERSHIP` |

每項評分（星級對應分數）：

- `★★★★★` = 5
- `★★★★☆` = 4
- `★★★☆☆` = 3
- `★★☆☆☆` = 2
- `★☆☆☆☆` = 1
- `資料不足` = 0 or excluded with dataQuality WARNING

總分：

```text
totalResearchScore = sum(8 factors), max 40
```

重要規定：

- 若授權資料不足，例如 FactSet / consensus 不可得，該項不能硬算。
- 第 2 項 `TARGET_PRICE_UPSIDE` 依賴授權目標價，授權不足時該項以 `資料不足` 計，並使整體 `dataQualityStatus` 降為 WARNING。
- 任一 factor 為 `資料不足` 時，必須在 `ResearchFactorScore.dataQualityStatus` 標記，不得偽裝為高分。

---

## G. Research Rating Mapping

研究評級（`ResearchRating`）：

`S+` / `S` / `A+` / `A` / `B` / `C` / `DATA_INSUFFICIENT`

建議 mapping：

| totalResearchScore | researchRating |
|---|---|
| 37～40 | `S+` |
| 34～36 | `S` |
| 30～33 | `A+` |
| 26～29 | `A` |
| 20～25 | `B` |
| 1～19 | `C` |
| 資料不足 | `DATA_INSUFFICIENT` |

重要邊界：

- **Research Rating 不是買賣建議。**
- Research Rating 不等於 `actionSignal`。
- `S+` 不等於可以立即進場。
- `C` 不等於必須出場。

---

## H. TOP5 Research Ranking

TOP5 Ranking 規則，排序優先順序：

1. `dataQualityStatus` 必須至少 WARNING 以上；FAIL 不可入 TOP5。
2. `totalResearchScore` 高者優先。
3. AI direct benefit 高者優先。
4. EPS growth quality 高者優先。
5. target price data 若授權不足，不得作為主排序。
6. `pullbackReason` 若為需求面惡化（`DEMAND_DECAY`），需降級。
7. `riskFactors` 若重大，需降級。
8. `sourceConfidence` 高者優先。

重要邊界：

- **TOP5 Research 不等於 TOP5 Entry。**
- TOP5 Research 只表示值得深入研究。
- TOP5 不得直接產生買點。
- TOP5 不得直接觸發交易動作。

---

## I. Pullback Reason Classification

研究中心內的回檔原因分類，與 V18C Pullback Reason Classifier 對齊（`PullbackReasonType`）：

| 中文 | type key |
|---|---|
| 純籌碼面調節 | `CHIP_ADJUSTMENT` |
| 大盤高檔同步修正 | `MARKET_WIDE_PULLBACK` |
| 法人換股 | `INSTITUTIONAL_ROTATION` |
| 產業短線雜訊 | `SECTOR_NOISE` |
| 基本面降溫 | `FUNDAMENTAL_COOLING` |
| 需求面轉弱 | `DEMAND_DECAY` |
| 財報風險升高 | `EARNINGS_RISK` |
| 資料不足 | `DATA_INSUFFICIENT` |

規定：

- 若沒有營收、法說、訂單、產業資料支撐，**不得宣稱「非基本面惡化」**。
- 回檔原因必須附 `dataQualityStatus`。
- 回檔原因不能直接變成買賣指令。

---

## J. AI Supply Chain Taxonomy

AI 供應鏈分類（`AiSupplyChainTag`）：

- GB200 / GB300（`GB200_GB300`）
- AI Server（`AI_SERVER`）
- ASIC（`ASIC`）
- CPO（`CPO`）
- Optical Communication（`OPTICAL_COMMUNICATION`）
- CoWoS（`COWOS`）
- Advanced Packaging（`ADVANCED_PACKAGING`）
- Liquid Cooling（`LIQUID_COOLING`）
- Thermal Module（`THERMAL_MODULE`）
- High-Speed Transmission（`HIGH_SPEED_TRANSMISSION`）
- PCB（`PCB`）
- CCL（`CCL`）
- Memory（`MEMORY`）
- Robot（`ROBOT`）
- Edge AI（`EDGE_AI`）
- PC / NB AI（`PC_NB_AI`）
- System Integration（`SYSTEM_INTEGRATION`）

benefit level（`AiBenefitLevel`）：

- `DIRECT`
- `INDIRECT`
- `THEMATIC`
- `WEAK`
- `DATA_INSUFFICIENT`

重要邊界：

- AI 題材標籤不等於營收貢獻已確認。
- benefit level 為 `THEMATIC` / `WEAK` 時，不得在研究摘要宣稱已實質受惠。

---

## K. Competitor / Market Share Rules

主要競爭對手與市占率規則：

- `competitors`（主要競爭對手）必須有來源。
- `globalMarketShare`（全球市占率）必須有來源。
- 未有正式來源則顯示 `資料不足`。
- 不得自行捏造全球市占率。
- 不得使用過期市占率作為高信心結論。
- 市占率與產業地位需附 `asOfDate`。

---

## L. 1080x1920 Mobile Research Card Spec

一頁一檔手機研究卡輸出規格（`ResearchCardSpec`）：

- 尺寸：1080 x 1920（`1080x1920`）。
- 比例：手機全螢幕閱讀版（`MOBILE_FULL_SCREEN`）。
- 一頁一檔（`oneStockPerPage`）。
- 白底 / 淺灰科技底色。
- 顯示研究評級。
- 顯示 EPS 預估表。
- 顯示法人目標價區塊。
- 顯示月營收表。
- 顯示法說會展望。
- 顯示 AI 供應鏈受惠程度。
- 顯示回檔原因。
- 顯示利多 / 風險。
- 顯示八條件評分。
- 顯示產業地位與競爭力。
- 顯示資料來源與資料日期。

安全調整（覆蓋原始需求中的投資評等用語）：

- **不得使用「強力買進 / 買進」作為投資評等文字。**
- 請改用 `研究評級：S+ / S / A+ / A / B / C`。
- 不得產生明確買賣指令。

本輪不產生 PNG / PDF / HTML / WeasyPrint output，只做規格。

---

## M. Research Card Visual Tokens

未來研究卡設計 token（保留供 V21 Research Card Export 使用）：

| token | 色碼 |
|---|---|
| background | `#F4F6F9` |
| panel | `#FFFFFF` |
| onyx | `#0F172A` |
| sapphire | `#1E40AF` |
| emerald | `#065F46` |
| purple | `#6B21A8` |
| orange | `#C2410C` |
| danger | `#EF4444` |
| success | `#10B981` |

產業色彩用途：

| 類別 | 色彩 |
|---|---|
| 大市值權值股 | onyx |
| 電子上游 | sapphire |
| 電子中游 | emerald |
| 電子下游 | purple |
| 非電子 | orange |

---

## N. Research Output Contract

未來 research output 型別（詳見 `use-cases/research/research-center-contract.ts`）：

- `ResearchUniverseInput`
- `ResearchCoverageStatus`
- `ResearchDataQualityStatus`
- `ResearchScoreFactor`
- `ResearchRating`
- `AiSupplyChainTag`
- `AiBenefitLevel`
- `PullbackReasonType`
- `ResearchFactorScore`
- `ResearchStockSnapshot`
- `ResearchTopPick`
- `ResearchCardSpec`

所有型別均為 types-only，不放 runtime、不 import Supabase、不 fetch、不讀 env。
`ResearchStockSnapshot` / `ResearchUniverseInput` / `ResearchTopPick` / `ResearchCardSpec` 帶有
`requestPerformed` / `supabaseConnected` / `productionWritePerformed` / `renderPerformed` / `exportPerformed`
等 read-only invariant，spec / fixture 階段恆為 `false`。

---

## O. War Room Integration

接到 War Room 的方式：

War Room 首頁只顯示：

- 今日 TOP5 研究名單
- 每檔研究評級
- 總分
- AI 供應鏈主標籤
- `dataQualityStatus`
- 一句研究摘要

邊界：

- War Room 不顯示完整一頁一檔研究報告。
- 完整報告應在 Research Center page 或未來 Research Card Export。
- Research Center 不輸出盤中警報。
- Research Center 不輸出技術買點。
- Research Center 不輸出 `actionSignal`。

---

## P. Safety Boundary

明確安全邊界：

- 不自動下單。
- 不產生買賣指令。
- 不替代投資判斷。
- 不使用未授權資料。
- **不捏造 FactSet / consensus / broker target price。**
- 資料不足就顯示 `資料不足`。
- 未授權就顯示 `LICENSE_REQUIRED`。
- `dataQualityStatus 非 PASS` 時不輸出高信心結論。
- Research Rating 不等於 `actionSignal`。
- TOP5 Research 不等於 TOP5 Entry。
- Research Center 不直接產生買點。

平文摘要（checker 掃描用）：

Research Rating 不是買賣建議。TOP5 Research 不等於 TOP5 Entry。Research Center 不直接產生買點。不得使用「強力買進 / 買進」。不捏造 FactSet。dataQualityStatus 非 PASS 時不輸出高信心結論。

---

## Q. Future Implementation Gate

未來版本規劃（roadmap 僅為架構規劃，不代表本輪實作）：

### V19 Research API Contract
- 建立 `/api/research/*` contract。
- 仍不查真資料。

### V20 Research Center UI
- 顯示研究中心頁。
- 顯示 TOP5。
- 不產生卡片圖檔。

### V21 Research Card Export Spec / Renderer
- 1080x1920 HTML/CSS or image export。
- 必須先有資料來源與授權檢查。

### V22 Research Data Pipeline
- 公開資料接入。
- 授權資料接入需另外審核。

### V23 Research + Technical Merge
- 研究評級 + 技術低檔 + 風報比整合。
- 不直接產生買賣指令。
