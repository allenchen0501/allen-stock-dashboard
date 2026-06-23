# War Room API Contract

本文件定義 Allen Stock Dashboard 的 **War Room API Contract**（戰情室 API 合約）。
本規格定義 `/api/war-room` 的合約輸出，型別對齊 `WarRoomIntelligenceSnapshot`，
供未來 V21 War Room UI Integration 使用。

**本階段（V20）只提供 `mock_or_contract` response。
不接真資料、不連 Supabase、不讀 env、不發 request、不實作 runtime、
不新增 SQL migration、不新增 UI component、不寫入資料、不產生買賣指令。**

相關文件：
[War Room Read Model Contract](./war-room-read-model-contract.md)、
[War Room Intelligence Architecture](./war-room-intelligence-architecture.md)、
[Portfolio Valuation Summary API](./portfolio-valuation-summary-api.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 War Room API Contract。
- API 目標是提供 `/api/war-room` 合約輸出。
- API 輸出型別必須對齊 `WarRoomIntelligenceSnapshot`。
- 本階段只提供 `mock_or_contract` response。
- 本階段不接真資料、不連 Supabase、不讀 env、不發 request。
- 本 API 是未來 War Room UI 的穩定取數介面。
- 本 API 不產生買賣指令。

---

## B. Endpoint

```text
GET /api/war-room
```

Query parameters：

- `mode`
  - `PREMARKET`
  - `INTRADAY`
  - `POSTMARKET`
  - `REALTIME_ALERT`

預設：

```text
mode=PREMARKET
```

若 mode invalid：

- 不 throw server error。
- 回傳 `PREMARKET`。
- metadata / warnings 標示 invalid mode fallback。
- `dataQualitySummary.overallStatus` 可為 WARNING。

---

## C. Response Contract

Response 必須包含：

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
- `portfolioRiskItems`
- `researchTopPickItems`
- `technicalCandidateItems`
- `intradayAlertItems`
- `avoidItems`
- `observationPoints`
- `sourceSummary`
- `dataQualitySummary`
- `requestPerformed`
- `supabaseConnected`
- `productionWritePerformed`
- `apiContractVersion`
- `responseSource`
- `sourceMode`

固定 metadata：

- `apiContractVersion = V20`
- `responseSource = mock_or_contract`
- `sourceMode = spec_only`

---

## D. Mode Behavior

### PREMARKET

- `marketStatus` 可為 DATA_INSUFFICIENT。
- `primaryAlertLevel` 可為 DATA_INSUFFICIENT。
- 顯示研究 TOP5 section availability。
- 顯示 technical candidates section availability。
- 不產生追價或盤前交易建議。

### INTRADAY

- 顯示 realtimeAlerts section availability。
- 顯示 portfolioRiskRadar section availability。
- 若無 runtime data，保持 DATA_INSUFFICIENT。
- 不把警報當出場指令。

### POSTMARKET

- 顯示今日回顧 section availability。
- 顯示 nextObservationPoints。
- 不事後硬補理由。

### REALTIME_ALERT

- 聚焦 realtimeAlerts。
- 若無 runtime alert data，`alertLevel = DATA_INSUFFICIENT`。
- stale / fallback-only 不得觸發 DANGER。

---

## E. Source Mode Policy

`sourceMode` 可選值：

- `spec_only`
- `fixture`
- `runtime_candidate`

V20 只能使用：

```text
spec_only
```

- 不得使用 runtime_candidate。
- 不得 fetch。
- 不得讀 env。
- 不得連 Supabase。
- 不得查 Yahoo / FinMind / FactSet / TradingView / broker。

---

## F. Data Quality Policy

- V20 因為沒有真資料，`overallStatus` 預設 DATA_INSUFFICIENT 或 WARNING。
- `highConfidenceConclusionAllowed` 必須為 false。
- 所有 section 不得宣稱 PASS，除非是 contract integrity。
- DATA_INSUFFICIENT 必須直接顯示，不得隱藏。
- LICENSE_REQUIRED 只可出現在 Research 相關來源摘要。
- War Room API 不得自行升級資料品質。
- `fallbackUsed` 若為 true，必須顯示 warning。

---

## G. Safety Boundary

- 不自動下單。
- 不產生買賣指令。
- 不替代投資判斷。
- War Room API 不得成為資料權威。
- Research Rating 不等於 actionSignal。
- TOP5 Research 不等於 TOP5 Entry。
- TOP5 Technical Candidates 不等於買進清單。
- Valuation Tier 不等於 actionSignal。
- Intraday Alert 不等於出場。
- stale data 不得觸發 DANGER。
- fallback-only data 不得觸發 DANGER。
- 資料不足就顯示資料不足。

---

## H. UI Consumer Contract

V21 UI 未來讀取 API 時只能：

- 顯示七大 section availability。
- 顯示 warning / unavailableReason。
- 顯示 DATA_INSUFFICIENT。
- 顯示 sourceSummary。
- 顯示 dataQualitySummary。
- 顯示 notEntrySignal / notTradeAdvice / notExitSignal。

不得：

- 把 observationPrice 標示為買進價。
- 把 invalidLevel 標示為自動停損價。
- 把 targetZone 標示為目標價。
- 把 TOP5 Research 當買進排行。
- 把 alertLevel 當交易指令。

---

## I. Future Implementation Gate

### V21 War Room UI Integration
- 首頁顯示七大區塊。
- 支援盤前 / 盤中 / 盤後 / 即時模式。
- 只讀 `/api/war-room`。

### V22 Engine Fixture Adapters
- 建立 fixture-only adapters。
- 不接 runtime。

### V23 Runtime Data Pipeline
- 接官方 / 授權 / fallback 資料。
- 需 source validation。

### V24 Push Notification
- 僅限 Intraday Alert。
- 需 cooldown / dedup。
