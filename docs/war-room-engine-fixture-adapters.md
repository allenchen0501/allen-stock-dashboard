# War Room Engine Fixture Adapters

本文件定義 Allen Stock Dashboard 的 **War Room Engine Fixture Adapters**（戰情室引擎 fixture 介接層）。
V22 讓 `/api/war-room` 從 spec-only 空陣列升級為 fixture-only sample output，
目的只是在 UI 上看到完整資料形狀，**不代表真實行情、真實法人研究、真實技術訊號或真實警報**。

**本階段（V22）只新增 fixture-only adapter、修改 builder、文件、checker、README、package.json。
不新增新的 API route、不新增新的 UI、不接真資料、不連 Supabase、不發外部 request、不讀 env、
不新增 SQL migration、不實作 runtime、不寫入資料、不產生買賣指令。**

相關文件：
[War Room API Contract](./war-room-api-contract.md)、
[War Room UI Integration](./war-room-ui-integration.md)、
[War Room Read Model Contract](./war-room-read-model-contract.md)、
[War Room Intelligence Architecture](./war-room-intelligence-architecture.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 War Room Engine Fixture Adapters。
- V22 目標是讓 War Room UI 顯示非空範例資料。
- Fixture adapters 只產生 contract sample data。
- Fixture adapters 不接真實行情。
- Fixture adapters 不接法人資料。
- Fixture adapters 不接技術指標 runtime。
- Fixture adapters 不接 Supabase。
- Fixture adapters 不產生買賣指令。
- Fixture adapters 只用於 UI shape validation 與產品體驗預覽。

---

## B. Fixture Data Policy

- fixture data 不是即時資料。
- fixture data 不是歷史真實資料。
- fixture data 不是法人研究結論。
- fixture data 不是技術訊號。
- fixture data 不是警報推播。
- fixture data 不是投資建議。
- fixture data 不得被標示為 PASS。
- fixture data 預設 `dataQualityStatus = WARNING` 或 `DATA_INSUFFICIENT`。
- `highConfidenceConclusionAllowed` 必須為 false。
- 若使用真實股票代號作為展示（例如 3019 / 4966 / 2743），必須標示 fixture only，不可標示為真實價格或真實建議。
- 不得填入看似真實的即時價格、目標價、EPS、法人評等。
- 數值若非必要，應填 null。
- 若為展示數值，必須標示 sample / illustrative / fixture。

---

## C. Fixture Adapter Scope

四大引擎 fixture scope：

1. **Portfolio Valuation Fixture** — sourceEngine：Portfolio Valuation Engine；output：`portfolioRiskItems`；safety flags：dataQualityStatus 不得 PASS；fixture-only。
2. **Research Top Picks Fixture** — sourceEngine：Institutional Research Center；output：`researchTopPickItems`；`notEntrySignal = true`；targetPrice 一律 `LICENSE_REQUIRED`；fixture-only。
3. **Technical + Risk Reward Fixture** — sourceEngine：Technical + Risk Reward Strategy Engine；output：`technicalCandidateItems`；`notEntrySignal / notTradeAdvice = true`；fixture-only。
4. **Intraday Alert Fixture** — sourceEngine：Intraday Risk Crisis Alert Engine；output：`intradayAlertItems`；alertLevel 不得 DANGER；`sourceName = "Fixture only"`；fixture-only。

另需建立：

1. **Avoid List Fixture** — output：`avoidItems`；`notExitSignal / notTradeAdvice = true`；風控提醒，不是賣出指令。
2. **Observation Points Fixture** — output：`observationPoints`；`notTradeAdvice = true`；只寫觀察，不寫操作。
3. **Source Summary Fixture** — output：`sourceSummary`；四大引擎；status 不得 PASS。
4. **Data Quality Summary Fixture** — output：`dataQualitySummary`；`highConfidenceConclusionAllowed = false`。

每個 fixture 必須說明 sourceEngine、output array、safety flags、`notEntrySignal` / `notTradeAdvice` /
`notExitSignal`、dataQualityStatus 與 fixture-only limitation。

---

## D. War Room Mode-Specific Fixtures

### PREMARKET
應提供：`researchTopPickItems` 非空、`technicalCandidateItems` 非空、`observationPoints` 非空、
`sourceSummary` 非空；sections available 但標示 fixture / WARNING。

### INTRADAY
應提供：`intradayAlertItems` 非空、`portfolioRiskItems` 非空、`avoidItems` 可非空、
`observationPoints` 非空；`realtimeAlerts` section available。

### POSTMARKET
應提供：`observationPoints` 非空、`avoidItems` 可非空、`portfolioRiskItems` 可非空；
notes 強調盤後回顧仍為 fixture。

### REALTIME_ALERT
應提供：`intradayAlertItems` 非空、`realtimeAlerts` section available；
`primaryAlertLevel` 可為 WATCH 或 WARNING，但**不得為 DANGER**；
stale / fallback-only 不得觸發 DANGER。

> 實作備註：為了讓所有模式都能完整驗證 UI 形狀，本輪 fixture bundle 在每個模式都回傳完整非空陣列，
> 模式差異反映在 section notes 與 `primaryAlertLevel`；任何模式皆不產生 DANGER。

---

## E. Section Availability Fixture Rules

七大 sections：`marketStatusLight`、`realtimeAlerts`、`portfolioRiskRadar`、`researchTopPicks`、
`technicalRiskRewardCandidates`、`avoidList`、`nextObservationPoints`。

每個 section 在 V22 可 `available = true`，但必須：

- `dataQualityStatus` 不得為 PASS。
- `fallbackUsed` 可為 true。
- `warnings` 必須包含 fixture-only warning。
- `notes` 必須包含 not trade advice。
- `unavailableReason` 可為 null，但要有 warnings。
- 不得產生高信心結論。

---

## F. Source Summary Fixture Rules

`sourceSummary` 必須包含四大引擎：Portfolio Valuation Engine、Institutional Research Center、
Technical + Risk Reward Strategy Engine、Intraday Risk Crisis Alert Engine。

每個 source：`requestPerformed = false`、`supabaseConnected = false`、`productionWritePerformed = false`、
`fallbackUsed = true or false`、`status = WARNING / DATA_INSUFFICIENT / LICENSE_REQUIRED`（不得為 PASS）。

---

## G. Data Quality Summary Fixture Rules

`dataQualitySummary` 必須：`overallStatus = WARNING or DATA_INSUFFICIENT`、
`highConfidenceConclusionAllowed = false`、`passCount = 0`、`warningCount >= 1`、
`dataInsufficientCount >= 1`、`licenseRequiredCount` 可 `>= 0`；不得輸出高信心結論。

---

## H. Safety Language

- 不自動下單。
- 不產生買賣指令。
- 不替代投資判斷。
- fixture data 不是即時資料。
- fixture data 不是投資建議。
- Research Rating 不等於 actionSignal。
- TOP5 Research 不等於 TOP5 Entry。
- TOP5 Technical Candidates 不等於買進清單。
- Valuation Tier 不等於 actionSignal。
- Intraday Alert 不等於出場。
- observationPrice 不是買進價。
- invalidLevel 不是自動停損價。
- targetZone 不是目標價。
- 資料不足就顯示資料不足。

---

## I. Future Implementation Gate

### V23 Runtime Data Pipeline Spec
- 規劃官方 / 授權 / fallback source validation。
- 不直接接 runtime。

### V24 War Room Runtime Pilot
- 只接一個低風險公開資料源。
- 需要 source validation / stale guard。

### V25 Intraday Alert Runtime
- 1-minute quote polling。
- cooldown / dedup。
- no DANGER from fallback-only data。

### V26 Push Notification
- Telegram / LINE / Email。
- only after alert governance is tested。
