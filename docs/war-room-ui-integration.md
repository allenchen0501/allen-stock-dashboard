# War Room UI Integration

本文件定義 Allen Stock Dashboard 的 **War Room UI Integration**（戰情室前端整合）。
V21 讓 Dashboard 首頁顯示 War Room Read Model，前端只讀 `/api/war-room`，
不直接讀 engine contracts、不直接讀 mock data、不接 Supabase、不接外部資料源。

**本階段（V21）只新增 UI component、Dashboard 整合、fixture-only checker、文件與 README / package.json。
不新增新的 API route、不接真資料、不連 Supabase、不發外部 request、不讀 env、
不新增 SQL migration、不實作 runtime、不產生買賣指令。**

相關文件：
[War Room API Contract](./war-room-api-contract.md)、
[War Room Read Model Contract](./war-room-read-model-contract.md)、
[War Room Intelligence Architecture](./war-room-intelligence-architecture.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 War Room UI Integration。
- V21 目標是讓 Dashboard 首頁顯示 War Room Read Model。
- UI 只讀 `/api/war-room`。
- UI 不直接讀 engine contracts。
- UI 不直接讀 mock data。
- UI 不接 Supabase。
- UI 不接外部資料源。
- UI 不產生買賣指令。
- UI 必須清楚標示 `mock_or_contract`、`spec_only`、`DATA_INSUFFICIENT`。

---

## B. UI Source Policy

- V21 UI 唯一資料入口是 `/api/war-room`。
- UI 不得直接 import `buildWarRoomReadModelContract`。
- UI 不得直接 import research / technical / intraday / valuation engine builder。
- UI 不得 fetch 外部資料源。
- UI 只能把 API 回傳內容視為 read model。
- UI 不得自行提升 dataQualityStatus。
- UI 不得把 unavailable section 隱藏成不存在。
- UI 必須顯示 warnings 與 unavailableReason。

---

## C. War Room Modes UI

UI 必須支援四種模式切換：

- `PREMARKET`：盤前
- `INTRADAY`：盤中
- `POSTMARKET`：盤後
- `REALTIME_ALERT`：即時警報

UI 行為：

- 預設 PREMARKET。
- 點選 mode 後呼叫 `/api/war-room?mode=<MODE>`。
- invalid mode 不由 UI 產生，但 API 有 fallback。
- loading 狀態需顯示。
- error 狀態需顯示安全 fallback。
- 不可因 error 顯示假資料。

---

## D. Seven Sections UI

UI 必須顯示七大 sections：

1. `marketStatusLight`
2. `realtimeAlerts`
3. `portfolioRiskRadar`
4. `researchTopPicks`
5. `technicalRiskRewardCandidates`
6. `avoidList`
7. `nextObservationPoints`

每個 section 至少顯示：`title`、`sourceEngine`、`available`、`dataQualityStatus`、
`fallbackUsed`、`unavailableReason`、`warnings`、`notes`。

若 section unavailable：

- 顯示「資料不足 / 尚未接資料源」。
- 不要隱藏。
- 不要顯示空白卡片。
- 不要產生假資料。

---

## E. Aggregated Items UI

若 API 回傳 array，UI 可顯示：`portfolioRiskItems`、`researchTopPickItems`、
`technicalCandidateItems`、`intradayAlertItems`、`avoidItems`、`observationPoints`。

目前 V20 多數 arrays 可能為空。空陣列時請顯示：

- 目前為 contract-only。
- 尚未接 engine fixture adapters。
- 資料不足就顯示資料不足。

不得自行建立假股票、假警報、假 TOP5。

---

## F. Source Summary UI

必須顯示 `sourceSummary`：`sourceName`、`sourceEngine`、`status`、`fallbackUsed`、
`requestPerformed`、`supabaseConnected`、`productionWritePerformed`。

並清楚標示：

- `requestPerformed = false`
- `supabaseConnected = false`
- `productionWritePerformed = false`
- `sourceMode = spec_only`
- `responseSource = mock_or_contract`

---

## G. Data Quality Summary UI

必須顯示 `dataQualitySummary`：`overallStatus`、`passCount`、`warningCount`、`failCount`、
`dataInsufficientCount`、`licenseRequiredCount`、`highConfidenceConclusionAllowed`。

若 `highConfidenceConclusionAllowed = false`：

- 顯示「目前不可輸出高信心結論」。
- 不得顯示強烈操作語句。

---

## H. Safety Language

UI 必須明確顯示：

- 不自動下單。
- 不產生買賣指令。
- 不替代投資判斷。
- Research Rating 不等於 actionSignal。
- TOP5 Research 不等於 TOP5 Entry。
- TOP5 Technical Candidates 不等於買進清單。
- Valuation Tier 不等於 actionSignal。
- Intraday Alert 不等於出場。
- 資料不足就顯示資料不足。

UI 不得出現「買進 / 賣出 / 停損 / 出場 / 進場 / 追價 / 強力買進 / 必買 / 必賣」等字眼，
除非是在「不是 / 不等於 / 不得」的安全否定語境中。

---

## I. Visual Design

延續目前 dashboard 視覺：dark background、card layout、compact status pills、
clear section cards、readable spacing、mobile-friendly；不過度表格化、不一開始就做
1080x1920 research card、不新增 chart library。

版面層次建議：

- 上方：War Room mode switcher。
- 第二層：marketStatus / primaryAlertLevel / dataQualitySummary summary cards。
- 第三層：七大 sections grid。
- 第四層：sourceSummary / safety boundary。

---

## J. Future Implementation Gate

### V22 Engine Fixture Adapters
- 四大引擎先提供 fixture-only sample data。
- UI 顯示非空內容。
- 不接 runtime。

### V23 Runtime Data Pipeline
- 接官方 / 授權 / fallback 資料。
- source validation。

### V24 Push Notification
- 僅限 Intraday Alert。
- cooldown / dedup。
