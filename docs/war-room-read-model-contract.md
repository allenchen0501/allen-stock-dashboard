# War Room Read Model Contract

本文件定義 Allen Stock Dashboard 的 **War Room Read Model Contract**（戰情室 read-only 聚合合約）。
本規格把 Valuation / Research / Technical + Risk Reward / Intraday Alert 四大引擎的已驗證輸出，
正式串接成一致的 read model，供盤前 / 盤中 / 盤後 / 即時警報 UI 使用。

本規格是 `docs/war-room-intelligence-architecture.md` 中 War Room Read Model 的型別細化文件。

**本階段（V19）只做文件、TypeScript type contract 與 fixture-only checker。
不新增 API route、不新增 UI component、不接資料源、不實作 runtime、
不連 Supabase、不新增 SQL migration、不寫入資料、不產生買賣指令。**

相關文件：
[War Room Intelligence Architecture](./war-room-intelligence-architecture.md)、
[Portfolio Valuation Radar Spec](./portfolio-valuation-radar-spec.md)、
[Portfolio Valuation Summary API](./portfolio-valuation-summary-api.md)、
[Institutional Research Center Spec](./institutional-research-center-spec.md)、
[Technical + Risk Reward Strategy Spec](./technical-risk-reward-strategy-spec.md)、
[Intraday Risk Crisis Alert Spec](./intraday-risk-crisis-alert-spec.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 War Room Read Model Contract。
- War Room Read Model 是所有分析引擎的 read-only 聚合層。
- 目標是讓盤前、盤中、盤後、即時警報都有一致輸出。
- War Room 不自己創造資料。
- War Room 不自己計算估值。
- War Room 不自己計算技術指標。
- War Room 不自己查法人資料。
- War Room 不自己升級警報。
- War Room 只整合 Valuation / Research / Technical + Risk Reward / Intraday Alert 的已驗證輸出。
- 本階段只做 contract，不做 API、不做 UI、不接資料。

---

## B. Input Engine Boundaries

War Room Read Model 的四大輸入引擎：

### 1. Portfolio Valuation Engine

- **回答什麼**：現價相對估值在哪個位置（`valuationTier`）與估值理由。
- **不回答什麼**：技術買點、盤中警報、法人評級。
- **輸出給 War Room**：`valuationTier` / `valuationReason` / `dataQualityStatus`。
- **降級**：`dataQualityStatus` 非 PASS 時，portfolioRiskRadar 不得用估值層級推導可操作結論。
- Valuation Engine 只提供 `valuationTier` / `valuationReason` / `dataQuality`，**不提供買賣指令**。

### 2. Institutional Research Center

- **回答什麼**：哪些股票值得深入研究（`researchRating` / TOP5 / AI 供應鏈）。
- **不回答什麼**：現在能不能進場、技術買點、盤中警報。
- **輸出給 War Room**：`researchRating` / `totalResearchScore` / `aiSupplyChainTags` / TOP5 / `dataQualityStatus`。
- **降級**：未授權資料顯示 `LICENSE_REQUIRED`；`dataQualityStatus` 非 PASS 時不得宣稱已取得 FactSet 數值。
- Research Center 只提供 `researchRating` / TOP5 / AI 供應鏈 / `dataQuality`，**不提供買點**。

### 3. Technical + Risk Reward Strategy Engine

- **回答什麼**：技術低檔、轉強跡象、支撐明確、風報比合理的觀察候選。
- **不回答什麼**：基本面是否優秀、法人評級。
- **輸出給 War Room**：`setupTags` / `riskRewardRatio` / `supportZone` / `invalidLevel` / `targetZone` / `decisionBoundary`。
- **降級**：缺支撐壓力或 `dataQualityStatus` 非 PASS 時，候選降級或排除。
- Technical + Risk Reward 只提供 `setupTags` / `riskRewardRatio` / `supportZone` / `invalidLevel` / `targetZone`，**不提供買賣指令**。

### 4. Intraday Risk Crisis Alert Engine

- **回答什麼**：盤中此刻發生什麼事件（`alertLevel` / `alertType` / `triggerReason`）。
- **不回答什麼**：基本面、長線估值、法人研究。
- **輸出給 War Room**：`alertLevel` / `triggerReason` / `suggestedObservation` / cooldown / dedup 狀態。
- **降級**：stale / fallback-only data 不得觸發 DANGER。
- Intraday Alert 只提供 `alertLevel` / `triggerReason` / `suggestedObservation`，**不提供投資建議**。

**War Room 不得把任何單一引擎輸出轉換成 actionSignal。**

---

## C. War Room Modes

四種模式（`WarRoomMode`）：`PREMARKET` / `INTRADAY` / `POSTMARKET` / `REALTIME_ALERT`。

### PREMARKET

重點：

- 今日模式
- 持股防守價 / 壓力價
- TOP5 研究名單
- 低檔高風報比觀察清單
- 今日事件與風險
- 昨夜國際市場摘要

不得：

- 產生買賣指令
- 盤前直接追價判斷

### INTRADAY

重點：

- 大盤急跌 / 急漲
- 持股破線 / 接近防守區
- 上漲家數 / 下跌家數
- 族群強弱
- 技術候選是否被市場風險降級

不得：

- 把警報當出場指令
- 把急漲當追價指令

### POSTMARKET

重點：

- 今日大盤收盤結構
- 產業強弱
- 持股漲跌歸因
- 今日警報回顧
- 明日觀察清單
- 回檔原因分類

不得：

- 事後硬補理由
- 未有資料就宣稱非基本面惡化

### REALTIME_ALERT

重點：

- DANGER / WARNING / WATCH / INFO / DATA_INSUFFICIENT
- 最新 alert payload
- cooldown / dedup 狀態
- 資料來源與時間戳

不得：

- stale data 觸發 DANGER
- fallback-only data 觸發 DANGER
- 無資料升級警報

---

## D. Seven War Room Sections

七大區塊（`WarRoomSectionId`）：

1. `marketStatusLight`
2. `realtimeAlerts`
3. `portfolioRiskRadar`
4. `researchTopPicks`
5. `technicalRiskRewardCandidates`
6. `avoidList`
7. `nextObservationPoints`

每個 section 必須定義以下面向（對應 `WarRoomSectionAvailability`）：

| 面向 | 說明 |
|---|---|
| `sourceEngine` | 來源引擎 |
| `displayPurpose` | 顯示用途 |
| `requiredInputs` | 必要輸入 |
| `fallbackBehavior` | 降級行為 |
| `dataQualityStatus` | 資料品質狀態 |
| `unavailableReason` | 無法顯示原因 |
| `warnings` | 警告列表 |
| 不應顯示什麼 | 各 section 的禁止輸出 |

| sectionId | sourceEngine | displayPurpose | 不應顯示 |
|---|---|---|---|
| `marketStatusLight` | Intraday Alert + breadth + index | 市場環境燈號 | 不顯示買賣指令 |
| `realtimeAlerts` | Intraday Risk Crisis Alert | 即時警報 | 不顯示出場指令 |
| `portfolioRiskRadar` | Valuation + Intraday + Technical refs | 持股風險雷達 | 不顯示停損 / 目標 / 買賣指令 |
| `researchTopPicks` | Institutional Research Center | TOP5 研究名單 | 不顯示買點 / 未授權 FactSet 數值 |
| `technicalRiskRewardCandidates` | Technical + Risk Reward | 低檔高風報比候選 | 不顯示買進價 / 自動停損 / 目標價 |
| `avoidList` | 四引擎綜合 | 禁碰 / 避開提醒 | 不顯示明確賣出指令 |
| `nextObservationPoints` | 各引擎 observationSummary | 下一步觀察點 | 不顯示立即操作 |

---

## E. Read Model Data Quality Policy

- War Room section 的 `dataQualityStatus` 由輸入引擎最低品質決定。
- 任一必要來源 FAIL，section 不得輸出高信心結論。
- `DATA_INSUFFICIENT` 必須保留，不得轉成空白或假資料。
- `LICENSE_REQUIRED` 只能出現在 Research 相關 section。
- `fallbackUsed = true` 時，section 顯示需降級。
- `requestPerformed` / `supabaseConnected` / `productionWritePerformed` 必須明確保留為 `false`。
- War Room 不得自行把 WARNING 升級成 PASS。
- War Room 不得自行把 `DATA_INSUFFICIENT` 改成可操作結論。
- `highConfidenceConclusionAllowed` 僅在所有必要來源 PASS 時為 `true`。

---

## F. Market Status Aggregation

`marketStatus`（`WarRoomMarketStatus`）：
`BULLISH` / `NEUTRAL` / `DEFENSIVE` / `RISK_OFF` / `DANGER` / `DATA_INSUFFICIENT`。

來源：

- Intraday Alert Engine
- market breadth
- index trend
- sector strength
- Research / Technical only as supplementary context

規則：

- Intraday DANGER 可使 `marketStatus` 進入 DANGER。
- fallback-only DANGER 不得直接升級 `marketStatus`。
- Research Rating 高不能讓 `marketStatus` 變 bullish。
- 技術候選多不能讓 `marketStatus` 變 bullish。
- **Market Status 是環境判斷，不是交易指令。**

---

## G. Portfolio Risk Radar Aggregation

來源：Portfolio Valuation Summary、Intraday Alert Engine、Technical + Risk Reward references、Portfolio cost / position if available。

應顯示（對應 `WarRoomPortfolioRiskItem`）：

- `valuationTier`
- `dataQualityStatus`
- approaching defense zone（接近防守區）
- broken support（跌破支撐）
- `alertLevel`
- `holdingImpact`
- `observationSummary`

不得：

- 自行產生停損價
- 自行產生目標價
- 自行產生買賣指令
- 用 `valuationTier` 直接推 actionSignal

---

## H. Research Top Picks Aggregation

來源：Institutional Research Center。

應顯示（對應 `ResearchTopPick`）：

- TOP5 Research
- `researchRating`
- `totalResearchScore`
- `aiSupplyChainTags`
- `dataQualityStatus`
- `rankingReason`
- `notEntrySignal`

不得：

- 把 TOP5 Research 當 TOP5 Entry
- 把 Research Rating 當 actionSignal
- 顯示未授權資料為已取得
- 沒有授權就顯示 FactSet 數值

---

## I. Technical Risk Reward Aggregation

來源：Technical + Risk Reward Strategy Engine。

應顯示（對應 `TechnicalRiskRewardCandidate`）：

- TOP5 Technical Candidates
- `setupTags`
- `riskRewardRatio`
- `supportZone`
- `invalidLevel`
- `targetZone`
- `decisionBoundary`
- `notEntrySignal`
- `notTradeAdvice`

不得：

- 把 `observationPrice` 顯示成買進價
- 把 `invalidLevel` 顯示成自動停損價
- 把 `targetZone` 顯示成目標價
- 把 TOP5 Candidates 當買進清單

---

## J. Intraday Alert Aggregation

來源：Intraday Risk Crisis Alert Engine。

應顯示（對應 `IntradayAlertPayload`）：

- `alertLevel`
- `alertType`
- `triggerReason`
- `impactSummary`
- `suggestedObservation`
- cooldown / dedup 狀態
- `sourceName`
- `dataQualityStatus`

不得：

- War Room 自行升級 `alertLevel`
- stale data 觸發 DANGER
- fallback-only data 觸發 DANGER
- `suggestedObservation` 變成買賣指令

---

## K. Avoid List Aggregation

來源：Intraday Alert Engine、Technical + Risk Reward Engine、Research Center、Valuation Engine。

Avoid / No Touch 條件（對應 `WarRoomAvoidItem`）：

- `marketStatus = DANGER`
- intraday DANGER active
- `dataQualityStatus = FAIL`
- supportZone 不明確
- `riskRewardRatio < 2`
- sector synchronized weakness
- `pullbackReason = DEMAND_DECAY` or `EARNINGS_RISK`
- source conflict unresolved
- stale data

規定：

- Avoid / No Touch 是風控提醒。
- Avoid / No Touch 不是賣出指令（`notExitSignal`）。
- Avoid / No Touch 不代表必須出場。

---

## L. Next Observation Points

來源：各引擎 `observationSummary`、Intraday Alert `suggestedObservation`、Technical invalidation / confirmation zones、Research pending data events。

可顯示（對應 `WarRoomObservationPoint`）：

- 等待 10:30 是否站回
- 等待量縮回測
- 等待站回防守區
- 等待法說
- 等待營收
- 等待資料補齊
- 等待警報降級

不得：

- 寫成立即操作
- 寫成明確買賣指令

---

## M. War Room Snapshot Contract

未來 snapshot 欄位（對應 `WarRoomIntelligenceSnapshot`），至少包含：

- `snapshotId`
- `generatedAt`
- `warRoomMode`
- `marketStatus`
- `primaryAlertLevel`
- `marketStatusLight`
- `realtimeAlerts`
- `portfolioRiskRadar`
- `researchTopPicks`
- `technicalRiskRewardCandidates`
- `avoidList`
- `nextObservationPoints`
- `sourceSummary`
- `dataQualitySummary`
- `requestPerformed`
- `supabaseConnected`
- `productionWritePerformed`

聚合明細陣列：`portfolioRiskItems` / `researchTopPickItems` / `technicalCandidateItems` /
`intradayAlertItems` / `avoidItems` / `observationPoints`。

---

## N. Type Integration Policy

- V19 可以使用 type-only imports。
- 允許從現有 contract 匯入 type。
- 不得 import runtime builder。
- 不得 import Supabase。
- 不得 fetch。
- 不得讀 env。
- 若現有型別名稱不同，必須先讀實際 export 再對齊。
- 不得新增 mock data。

實際使用的 type-only imports：

```ts
import type { ResearchTopPick } from "../research/research-center-contract";
import type { TechnicalRiskRewardCandidate } from "../technical-strategy/technical-risk-reward-contract";
import type { IntradayAlertPayload } from "../intraday-alert/intraday-alert-contract";
```

Portfolio valuation item 以 local read model item（`WarRoomPortfolioRiskItem`）對齊，
不 import runtime builder（例如 `buildPortfolioValuationSummaryContract`）。

---

## O. Safety Boundary

明確安全邊界：

- 不自動下單。
- 不產生買賣指令。
- 不替代投資判斷。
- War Room Read Model 不得成為資料權威。
- Research Rating 不等於 actionSignal。
- TOP5 Research 不等於 TOP5 Entry。
- TOP5 Technical Candidates 不等於買進清單。
- Valuation Tier 不等於 actionSignal。
- Intraday Alert 不等於出場。
- high confidence 需要 PASS dataQuality。
- 資料不足就顯示資料不足。

---

## P. Future Implementation Gate

未來版本規劃（roadmap 僅為架構規劃，不代表本輪實作）：

### V20 War Room API Contract
- 建立 `/api/war-room/*` contract。
- 仍不接真資料。

### V21 War Room UI Integration
- 首頁顯示七大區塊。
- 支援盤前 / 盤中 / 盤後 / 即時模式。

### V22 Engine Fixture Adapters
- 建立 fixture-only adapters。
- 不接 runtime。

### V23 Runtime Data Pipeline
- 接官方 / 授權 / fallback 資料。
- 需 source validation。

### V24 Push Notification
- 僅限 Intraday Alert。
- 需 cooldown / dedup。
