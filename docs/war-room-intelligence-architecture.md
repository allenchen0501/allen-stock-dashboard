# War Room Intelligence Architecture

本文件定義 Allen Stock Dashboard 的 **War Room Intelligence Architecture**（總戰情室智慧架構），
把估值、技術、風報比、法人研究、盤中警報、回檔原因分類整合到一個不重複、可串接、
可在戰情室一眼閱讀的總架構，並依「盤前 / 盤中 / 盤後 / 即時」四種模式切換最該看的資訊。

**本階段（V18C）只做架構規格、read model contract 與 fixture-only checker。
不實作研究中心、不實作技術策略引擎、不實作盤中爬蟲、不實作推播、
不新增 API route、不新增 UI component、不連 Supabase、不新增 SQL migration、
不寫資料、不產生買賣指令。**

相關文件：
[Schema Boundary Decisions](./schema-boundary-decisions.md)、
[Portfolio Valuation Radar Spec](./portfolio-valuation-radar-spec.md)、
[Portfolio Valuation Formula](./portfolio-valuation-formula.md)、
[Portfolio Valuation Summary API](./portfolio-valuation-summary-api.md)、
[Portfolio Valuation Radar UI](./portfolio-valuation-radar-ui.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 War Room Intelligence Architecture。
- 目標是把估值、技術、風報比、法人研究、盤中警報、回檔原因分類整合到戰情室。
- 戰情室只做 read model，不做資料權威（不是 source of truth）。
- 各分析引擎各自負責單一問題，不互相覆蓋、不互相假裝。
- 戰情室依照「盤前 / 盤中 / 盤後 / 即時」切換最該看的資訊。
- 本階段只做架構規格，不接資料、不做 UI、不新增 API、不寫資料。

---

## B. Core Principle

以下原則為整個架構的硬約束：

- **Research Center 不直接產生買點**：法人研究只提供研究事實與評分，不輸出進場點。
- **Technical Strategy Engine 不假裝基本面良好**：技術引擎只談技術 setup 與動能，不評斷基本面。
- **Valuation Radar 不直接等於 actionSignal**：估值層級只是位置判斷，不是操作指令。
- **Intraday Alert 不等於買賣指令**：盤中警報是事件提醒，不是進出場命令。
- **War Room Read Model 不自己創造資料**，只整合已驗證的引擎輸出。
- 資料不足時必須保守顯示（顯示 `資料不足`，不得偽造）。
- `dataQualityStatus 非 PASS` 時，不能升級成高信心結論。
- 所有模組 **不自動下單**。
- 所有模組 **不產生買賣指令**。

---

## C. Current Module Inventory

目前已存在 / 已規格化的模組與狀態：

| # | 模組 | 狀態 |
|---|---|---|
| 1 | Portfolio Valuation Radar | spec-only / UI-only（holdings + dashboard preview），no runtime valuation |
| 2 | Portfolio Valuation Formula | doc-only，no runtime，公式尚未實作 |
| 3 | Portfolio Valuation Summary API Contract | contract-only / spec-only（`mock_or_contract`），no Supabase |
| 4 | Portfolio Radar UI / Dashboard Summary | UI-only，顯示 spec-only contract data |
| 5 | Portfolio API Switch Guard | implemented（guard），預設 hardcoded，no Supabase 連線 |
| 6 | Portfolio Production Readiness | doc-only + fixture checker，no runtime write |
| 7 | Portfolio Staging RLS Validation | doc-only + fixture checker，no Supabase 連線 |
| 8 | Schema Boundary Decisions | doc-only（boundary 決策），no SQL migration |

共同邊界：以上模組目前皆 **no Supabase 連線**、**no SQL migration（除既有 RLS skeleton）**、
**no runtime 估值公式**、**no 買賣指令**。

---

## D. New Capability Inventory

Allen 新增需求中的能力（皆為未來方向，本輪不實作）：

### 1. Institutional Research Center
- **回答什麼**：法人對個股的目標價區間、平均目標價、潛在漲幅、EPS 預估與研究評分。
- **不回答什麼**：盤中即時警報、技術買點、風報比承接區。
- **不能直接產生**：進場點、明確買賣指令。
- **未來輸出方向**：`targetPriceRange`、`avgTargetPrice`、`upsidePercent`、`epsForecast`、`researchScore`、`top5Rank`。

### 2. Research Score Engine
- **回答什麼**：把研究事實量化為八條件研究評分。
- **不回答什麼**：技術 setup、風報比、估值便宜與否。
- **不能直接產生**：買賣指令、進場點。
- **未來輸出方向**：`researchScore`、`scoreBreakdown`、`confidenceLevel`。

### 3. TOP 5 Research Ranking
- **回答什麼**：依研究評分排序出 TOP5 研究名單。
- **不回答什麼**：TOP5 進場名單（TOP5 Research 不等於 TOP5 Entry）。
- **不能直接產生**：買點、出場點。
- **未來輸出方向**：`top5ResearchPicks`（排序 + 理由摘要）。

### 4. Research Card Export 1080x1920
- **回答什麼**：把單檔研究摘要輸出成 1080x1920 手機研究卡。
- **不回答什麼**：即時報價、盤中警報。
- **不能直接產生**：買賣指令。
- **未來輸出方向**：研究卡 render payload（純展示）。

### 5. AI Supply Chain Taxonomy
- **回答什麼**：個股在 AI 供應鏈中的歸屬（族群、上下游、市占）。
- **不回答什麼**：估值便宜與否、技術強弱。
- **不能直接產生**：買賣指令。
- **未來輸出方向**：`supplyChainTags`、`globalShare`、`peers`。

### 6. Pullback Reason Classifier
- **回答什麼**：個股 / 大盤回檔的原因分類與信心等級。
- **不回答什麼**：是否該加碼或出場。
- **不能直接產生**：買賣指令。
- **未來輸出方向**：`pullbackReason`、`confidenceLevel`、`needsConfirmation`。

### 7. Technical Strategy Engine
- **回答什麼**：技術 setup（扣抵、均線、KD / KDJ、MACD 動能、量價）與技術評分。
- **不回答什麼**：基本面好壞、法人評級。
- **不能直接產生**：買賣指令、追價許可。
- **未來輸出方向**：`technicalSetup`、`technicalScore`、`supportZone`、`resistanceZone`、`invalidLevel`。

### 8. Risk Reward Engine
- **回答什麼**：承接區、風報比（1:3 / 1:4 / 1:5）與低檔高風報比候選。
- **不回答什麼**：基本面好壞、法人評級。
- **不能直接產生**：買賣指令。
- **未來輸出方向**：`entryZone`、`riskRewardRatio`、`invalidLevel`、`candidateRank`。

### 9. Intraday Risk Crisis Alert
- **回答什麼**：盤中急跌 / 急漲 / 跌破防守 / 突破壓力等事件警報。
- **不回答什麼**：基本面、法人研究、長線估值。
- **不能直接產生**：明確買賣指令、出場命令。
- **未來輸出方向**：`alertLevel`、`triggerType`、`affectedSymbols`、`cooldownState`。

### 10. War Room Read Model
- **回答什麼**：把上述引擎已驗證輸出整合成「最該注意什麼」。
- **不回答什麼**：任何單一引擎的權威結論（不覆寫引擎）。
- **不能直接產生**：估值公式、技術分數、法人評級、買賣指令。
- **未來輸出方向**：`WarRoomIntelligenceSnapshot`（read-only aggregation）。

---

## E. Duplication Boundary Matrix

避免功能重複的責任邊界表：

| 模組 | 回答的問題 | 不應該做的事 | 輸出給戰情室 |
|---|---|---|---|
| Valuation Engine | 現價相對估值在哪個位置（特價 / 便宜 / 合理 / 昂貴 / 瘋狂 / 資料不足） | 不直接等於 actionSignal、不給買賣指令 | `valuationTier`、估值區間 |
| Research Center | 法人怎麼看（目標價 / EPS / 評級） | 不輸出技術買點、不輸出進場點 | 研究摘要、目標價區間 |
| Research Score Engine | 研究面綜合評分多高 | 不評斷技術、不評斷風報比 | `researchScore`、TOP5 排序 |
| Technical Strategy Engine | 技術 setup / 動能 / 均線位置 | 不假裝基本面良好、不給買賣指令 | `technicalSetup`、`technicalScore` |
| Risk Reward Engine | 承接區與風報比是否夠好 | 不評斷基本面、不給買賣指令 | `entryZone`、`riskRewardRatio` |
| Intraday Alert Engine | 盤中此刻發生什麼事件 | 不等於出場、不給投資建議 | `alertLevel`、`triggerType` |
| Pullback Reason Classifier | 為什麼回檔、信心多高 | 不說可加碼或出場 | `pullbackReason`、`confidenceLevel` |
| War Room Read Model | 現在最該注意什麼 | 不創造資料、不覆寫引擎、不給買賣指令 | 七大區塊聚合 read model |

明確的反重複定義：

- **估值便宜不等於高風報比**：便宜是估值位置，風報比是進場結構，兩者獨立。
- **高風報比不等於基本面好**：風報比只看價格結構，不保證基本面。
- **法人研究評級不等於買點**：研究評級是研究面結論，不是進場訊號。
- **盤中警報不等於出場**：警報是事件提醒，出場是 Allen 的決策。
- **技術轉強不等於可以追價**：技術轉強仍需風報比與大盤 regime 確認。
- **TOP5 Research 不等於 TOP5 Entry**：研究排序與進場排序是兩個名單。
- **War Room 只顯示「最該注意什麼」**，不取代任何引擎的權威。

---

## F. Data Flow Architecture

```text
Data Sources
→ Raw Fact Layer
→ Analysis Engine Layer
→ Score / Alert Layer
→ War Room Read Model
→ Premarket / Intraday / Postmarket / Realtime UI
```

資料由下而上單向流動：下層是事實，上層是聚合；War Room Read Model 永遠在最上層之下，
只讀不寫。

### F1. Data Sources

- TWSE / TPEx official data
- Public Information Observation Station（公開資訊觀測站）
- FinMind
- Yahoo 股市
- broker API
- FactSet / paid consensus data
- company filings（公司財報 / 申報文件）
- earnings call / investor conference materials（法說會 / 法人說明會材料）
- manual verified annotations（人工驗證註記）

來源規則：

- **official source first**：官方資料優先。
- **paid consensus data must be licensed**：付費 consensus 資料必須已授權才可使用。
- **Yahoo / fallback source cannot be sole authority**：Yahoo / fallback 不得作為唯一權威。
- **source conflict → WARNING or DATA_INSUFFICIENT**：來源衝突時降級為 WARNING 或 DATA_INSUFFICIENT。
- **未授權資料不得假裝已取得**：未取得授權的資料不得偽裝為已取得。

### F2. Raw Fact Layer

未來可能的 fact snapshots（**本輪不新增任何 SQL migration，以下只是 future candidates**）：

- `intraday_index_snapshots`
- `intraday_quote_snapshots`
- `market_breadth_snapshots`
- `monthly_revenue_snapshots`
- `eps_forecast_snapshots`
- `broker_consensus_snapshots`
- `technical_indicator_snapshots`
- `chip_snapshots`
- `event_radar_items`
- `supply_chain_tags`

### F3. Analysis Engine Layer

未來分析引擎（各自負責單一問題）：

- Valuation Engine
- Technical Strategy Engine
- Risk Reward Engine
- Research Score Engine
- Pullback Reason Classifier
- Intraday Alert Engine

### F4. War Room Read Model

War Room Read Model 是 **read-only aggregation**。

不得：

- 寫資料
- 改資料
- 自己產生估值公式
- 自己產生技術分數
- 自己產生法人評級
- 自己產生買賣指令

---

## G. War Room Display Zones

戰情室最終 7 個核心區塊：

### 1. 市場狀態燈（marketStatusLight）
- **顯示什麼**：大盤 regime（偏多 / 震盪 / 防守 / 風險）。
- **來源引擎**：Market Temperature / Index breadth。
- **不應顯示**：個股買賣指令。
- **降級**：`dataQualityStatus 非 PASS` 時顯示 `DATA_INSUFFICIENT`，不顯示明確多空結論。

### 2. 即時警報列（realtimeAlerts）
- **顯示什麼**：當下 DANGER / WARNING / WATCH 事件。
- **來源引擎**：Intraday Alert Engine。
- **不應顯示**：出場命令、買賣指令。
- **降級**：fallback-only 資料不得觸發 DANGER，降為 WATCH 或 DATA_INSUFFICIENT。

### 3. 持股風險雷達（portfolioRiskRadar）
- **顯示什麼**：持股估值層級、是否跌破防守、部位風險。
- **來源引擎**：Valuation Engine + Risk Reward Engine + Portfolio。
- **不應顯示**：actionSignal 當買賣指令。
- **降級**：缺價格 / EPS 時顯示 `資料不足`。

### 4. 今日 TOP5 研究名單（researchTopPicks）
- **顯示什麼**：TOP5 研究排序摘要。
- **來源引擎**：Research Score Engine。
- **不應顯示**：TOP5 進場名單（TOP5 Research 不等於 TOP5 Entry）。
- **降級**：研究資料不足時顯示 `資料不足`，不補假排名。

### 5. 低檔高風報比候選（technicalRiskRewardCandidates）
- **顯示什麼**：技術低檔高風報比候選 TOP5。
- **來源引擎**：Technical Strategy Engine + Risk Reward Engine。
- **不應顯示**：追價許可、買賣指令。
- **降級**：技術資料不足時不顯示候選。

### 6. 今日禁碰 / 避開（avoidList）
- **顯示什麼**：今日應避開的個股與原因。
- **來源引擎**：Pullback Reason Classifier + Risk Engine。
- **不應顯示**：明確賣出指令。
- **降級**：原因不明時標註 `資料不足`。

### 7. 下一觀察點（nextObservationPoints）
- **顯示什麼**：等待哪個財報 / 法說 / 營收 / 關鍵價。
- **來源引擎**：Event Radar + Pullback Reason Classifier。
- **不應顯示**：可加碼 / 出場結論。
- **降級**：事件資料不足時顯示觀察待確認。

---

## H. Premarket War Room

盤前戰情室。時間：

```text
08:00～09:00
```

盤前應顯示：

- 昨夜美股 / Nasdaq / SOX / 台積 ADR
- 匯率 / 油價 / 美債 / 重大新聞
- 今日大盤風險等級
- 持股防守價與壓力價
- TOP5 法人研究名單
- 低檔高風報比觀察清單
- 今日事件：法說、除息、營收、財報

盤前最上方輸出：

- 今日模式：偏多 / 震盪 / 防守 / 禁追
- 今日持股重點
- 今日候選重點
- 今日風險重點

盤前 **不得直接輸出買賣指令**。

---

## I. Intraday War Room

盤中戰情室。時間：

```text
09:00～13:30
```

盤中應顯示：

- 即時大盤急跌 / 急漲警報
- 5 分鐘 / 15 分鐘指數變化
- 上漲家數 / 下跌家數
- 持股是否跌破防守區
- 持股是否急漲突破壓力
- AI / 光通 / PCB / 散熱 / CPO 族群強弱
- 權值股護盤但市場廣度不佳

盤中核心目的：

- 防止在錯誤盤勢中追價
- 防止在急跌中誤判
- 提醒風險與觀察點
- **不產生明確買賣指令**

---

## J. Postmarket War Room

盤後戰情室。時間：

```text
13:35～晚上
```

盤後應顯示：

- 今日大盤收盤結構
- 今日產業強弱
- 持股漲跌與原因
- 是否跌破 / 站回關鍵價
- 法人籌碼初步變化
- 今日警報回顧
- 明日觀察清單

盤後核心目的：

- 做歸因
- 區分基本面惡化 vs 籌碼調節
- 更新明日觀察點
- **不產生明確買賣指令**

---

## K. Realtime Alert Center

即時警報中心。必須支援等級：

- DANGER
- WARNING
- WATCH
- INFO
- DATA_INSUFFICIENT

警報治理規則：

- **cooldown**：同一觸發在冷卻時間內不重複發送。
- **dedup**：相同事件去重。
- **same trigger suppression**：同一觸發來源抑制重複警報。
- **only level upgrade can re-alert**：只有等級升高才可重新觸發。
- **stale data cannot trigger DANGER**：過舊資料不得觸發 DANGER。
- **fallback-only data cannot trigger DANGER**：僅 fallback 資料不得觸發 DANGER。

即時警報是 **event-driven**，不等同盤前 / 盤中 / 盤後的定時報告。

---

## L. Institutional Research Center Integration

研究中心如何接進戰情室。

Research Center 負責：

- 法人目標價區間
- 平均目標價
- 潛在漲幅
- 2025E / 2026E / 2027E EPS
- 連續兩個月營收 / YoY / MoM
- AI 供應鏈歸屬
- 全球市占率
- 主要競爭對手
- 法說會摘要
- 八條件研究評分
- TOP5 研究排序
- 1080x1920 手機研究卡輸出

Research Center 不負責：

- 盤中即時警報
- 技術買點
- 風報比承接區
- 明確買賣指令

整合規則：戰情室首頁只顯示 **TOP5 摘要**，不顯示完整一頁一檔報告。
`Research Center 不直接產生買點`；研究評級只作研究面結論。

---

## M. Technical Strategy + Risk Reward Integration

技術策略與風報比如何接進戰情室，包含 Allen 提供的策略概念：

- 扣三低（扣抵三日低點 / 扣抵值轉折）
- KD / KDJ 低檔翻揚
- MACD 只判斷動能，不單獨決定買賣
- 均線斜率
- 5MA / 10MA / 20MA
- 週 30MA
- 日 200MA
- 量縮回測
- 爆量轉強
- 支撐區
- 壓力區
- invalid level（失效價）
- 風報比 1:3 / 1:4 / 1:5
- 技術低檔高風報比候選 TOP5

整合規則：Technical Strategy Engine 只提供 setup / score / risk reward，
**不提供買賣指令**。`Technical Strategy Engine 不假裝基本面良好`。

---

## N. Pullback Reason Classifier Integration

回檔原因分類：

- 純籌碼面調節
- 大盤高檔同步修正
- 法人換股
- 產業短線雜訊
- 基本面降溫
- 需求面轉弱
- 財報風險升高
- 資料不足

戰情室如何顯示：

- 回檔原因摘要
- 信心等級
- 是否需要等待財報 / 法說 / 營收確認
- **不得直接說可加碼或出場**

---

## O. War Room Output Contract

未來 War Room output 欄位（型別定義見
[`use-cases/war-room/war-room-intelligence-contract.ts`](../use-cases/war-room/war-room-intelligence-contract.ts)）：

```ts
warRoomMode:
  | 'PREMARKET'
  | 'INTRADAY'
  | 'POSTMARKET'
  | 'REALTIME_ALERT';

marketStatus:
  | 'BULLISH'
  | 'NEUTRAL'
  | 'DEFENSIVE'
  | 'RISK_OFF'
  | 'DANGER'
  | 'DATA_INSUFFICIENT';

primaryAlertLevel:
  | 'INFO'
  | 'WATCH'
  | 'WARNING'
  | 'DANGER'
  | 'DATA_INSUFFICIENT';

sections:
  marketStatusLight
  realtimeAlerts
  portfolioRiskRadar
  researchTopPicks
  technicalRiskRewardCandidates
  avoidList
  nextObservationPoints
```

此 contract 為 read model only；對應 TypeScript type 已新增於
`use-cases/war-room/war-room-intelligence-contract.ts`，僅描述 read model，不新增 runtime。

---

## P. Promotion Roadmap

後續版本路線（**roadmap 只是架構規劃，不代表本輪實作**）：

- V18D Institutional Research Center Spec
- V18E Technical + Risk Reward Strategy Spec
- V18F Intraday Risk Crisis Alert Spec
- V19 War Room Read Model Contract
- V20 Research API Contract
- V21 Technical Signal Contract
- V22 Intraday Alert Engine Contract
- V23 War Room UI Integration
- V24 1-minute Runtime Pipeline
- V25 Push Notification

---

## Q. Safety Boundary

- **不自動下單**。
- **不產生買賣指令**。
- 不替代投資判斷。
- 不使用未授權資料。
- 資料不足就顯示 `資料不足`。
- `dataQualityStatus 非 PASS` 時不輸出高信心結論。
- fallback data 不得獨立觸發最高等級警報。
- War Room read model 不得成為資料權威。
- Research Center 不得輸出技術買點。
- Technical Engine 不得輸出法人評級。
- Intraday Alert 不得輸出投資建議。
