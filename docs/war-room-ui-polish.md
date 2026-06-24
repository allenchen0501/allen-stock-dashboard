# War Room UI Polish

本文件定義 Allen Stock Dashboard 的 **War Room UI Polish**（戰情室 UI 打磨規格）。
V23 在 V22 fixture-only sample output 基礎上，提升戰情室 UI 的可讀性、資訊密度與安全提示層級。

**本階段（V23）只修改 `components/war-room-dashboard.tsx`、新增本文件、新增 checker、更新 README、更新 package.json。
不新增新的 API route、不新增新的 UI component、不改 `/api/war-room` route、不改 builder / fixture adapter、
不接真資料、不連 Supabase、不發外部 request、不讀 env、不新增 SQL migration、不實作 runtime、
不寫入資料、不產生買賣指令。**

相關文件：
[War Room API Contract](./war-room-api-contract.md)、
[War Room UI Integration](./war-room-ui-integration.md)、
[War Room Engine Fixture Adapters](./war-room-engine-fixture-adapters.md)、
[War Room Read Model Contract](./war-room-read-model-contract.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 War Room UI Polish。
- V23 目標是提升戰情室 UI 可讀性、資訊密度與行動版體驗。
- 本輪不改 API contract。
- 本輪不改 fixture adapter。
- 本輪不接真資料。
- 本輪不連 Supabase。
- 本輪不產生買賣指令。
- UI 仍然只讀 `/api/war-room`。
- fixture data 不是即時資料。
- fixture data 不是投資建議。

---

## B. UI Polish Goals

V23 改善項目：

1. **四模式切換更直覺**：每個 mode 附加用途 subtitle，active mode 更明顯。
2. **狀態燈更清楚**：Header 第一屏即顯示 marketStatus / primaryAlertLevel / overallStatus / highConfidenceConclusionAllowed。
3. **七大 sections 層級更分明**：每張 section card 顯示完整 sourceEngine / fallbackUsed / warnings / notes / unavailableReason。
4. **fixture / 非即時資料標示更明顯**：Header badge 常駐顯示 `fixture only · 非即時資料 · not trade advice`。
5. **sourceSummary 與 dataQualitySummary 更容易閱讀**：改用 compact card list 呈現。
6. **fixture items 更像戰情室資訊卡**：每種 item 各有自己的 card component，顯示最重要欄位。
7. **空狀態與資料不足狀態更清楚**：明確顯示 contract-only empty state，不顯示假資料。
8. **手機版不要太難讀**：section cards 單欄，mode switcher 可換行，item cards 不要過寬。
9. **不使用過度表格化**：改用 card list，避免大型 table。
10. **不新增 chart library**：純 Tailwind CSS，不引入 recharts / chart.js / victory / nivo / echarts / d3。

---

## C. Above-the-Fold Layout

第一屏必須顯示：

- Allen Stock War Room 標題
- mode switcher（PREMARKET / INTRADAY / POSTMARKET / REALTIME_ALERT）
- marketStatus
- primaryAlertLevel
- overallStatus（dataQualitySummary.overallStatus）
- highConfidenceConclusionAllowed（必須明顯標示 = false）
- responseSource（= mock_or_contract）
- sourceMode（= fixture）
- fixtureAdapterVersion（= V22）
- generatedAt
- 安全提示 badge：fixture only · 非即時資料 · not trade advice

**第一屏不得顯示任何買賣建議。**

---

## D. Mode Switcher Polish

四模式定義：

- **盤前 PREMARKET**：今日研究 / 技術候選 / 觀察點
- **盤中 INTRADAY**：即時警報 / 持股 / 廣度
- **盤後 POSTMARKET**：收盤結構 / 歸因 / 明日觀察
- **即時 REALTIME_ALERT**：警報中心 / cooldown / dedup

UI 要求：

- active mode 有明顯 style（border / background 不同）。
- 每個 mode button 有 subtitle（用途說明）。
- loading 時保留上一個 mode 的視覺 context。
- error 時顯示安全 fallback，不因 error 顯示假資料。

---

## E. Seven Sections Polish

七大 sections 必須仍顯示（不可隱藏任何 section，包含 unavailable）：

- `marketStatusLight`
- `realtimeAlerts`
- `portfolioRiskRadar`
- `researchTopPicks`
- `technicalRiskRewardCandidates`
- `avoidList`
- `nextObservationPoints`

每張 section card 顯示：

- title
- sectionId
- sourceEngine
- available（true / 資料不足）
- dataQualityStatus（badge，不得美化成 PASS）
- fallbackUsed（降級提示）
- unavailableReason（不得隱藏，有就顯示）
- warnings（醒目但不恐慌）
- notes

---

## F. Fixture Items Polish

六大 item sections：

1. **持股風險 Radar Items**（portfolioRiskItems）
2. **Research TOP Picks**（researchTopPickItems）
3. **Technical + Risk Reward Candidates**（technicalCandidateItems）
4. **Intraday Alert Items**（intradayAlertItems）
5. **Avoid / No Touch Items**（avoidItems）
6. **Next Observation Points**（observationPoints）

每個 section 顯示 count；若 array empty 顯示 contract-only empty state；若非空以 card list 顯示。

每張 item card 顯示最重要欄位，若數值為 null 顯示「資料不足」或「fixture 未填值」。

若 item 含 `notEntrySignal` / `notTradeAdvice` / `notExitSignal`，必須顯示安全標籤。

---

## G. Source Summary Polish

`sourceSummary` 顯示四大引擎：

- Portfolio Valuation Engine
- Institutional Research Center
- Technical + Risk Reward Strategy Engine
- Intraday Risk Crisis Alert Engine

每個 source 顯示：

- status（不得美化成 PASS）
- fallbackUsed（降級提示）
- requestPerformed = false
- supabaseConnected = false
- productionWritePerformed = false
- LICENSE_REQUIRED 不得隱藏

---

## H. Data Quality Summary Polish

`dataQualitySummary` 必須顯示：

- overallStatus
- passCount
- warningCount
- failCount
- dataInsufficientCount
- licenseRequiredCount
- highConfidenceConclusionAllowed

`highConfidenceConclusionAllowed = false` 必須明顯標示：「目前不可輸出高信心結論」。
不得顯示強烈操作語句。

---

## I. Mobile-Friendly Polish

- section cards 在手機版單欄（sm 以上可兩欄）。
- mode switcher 可換行（flex-wrap）。
- text 不要過小（item card body text ≥ 9px）。
- item cards 不要過寬（grid-cols-2 max on wider screens）。
- 避免大型表格。
- 保留 spacing。
- 支援窄螢幕閱讀（single column 手機底線）。

---

## J. Safety Language

UI 必須明確顯示下列安全語句：

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- fixture data 不是即時資料
- fixture data 不是投資建議
- Research Rating 不等於 actionSignal
- TOP5 Research 不等於 TOP5 Entry
- TOP5 Technical Candidates 不等於買進清單
- Valuation Tier 不等於 actionSignal
- Intraday Alert 不等於出場
- observationPrice 不是買進價
- invalidLevel 不是自動停損價
- targetZone 不是目標價
- 資料不足就顯示資料不足

---

## K. Future Implementation Gate

### V24 Runtime Data Pipeline Spec

- 規劃官方 / 授權 / fallback source validation。
- 不直接接 runtime。
- stale guard / source priority spec。

### V25 Runtime Pilot

- 僅接一個低風險公開資料源。
- 需要 stale guard / source validation。

### V26 Intraday Alert Runtime

- 1-minute quote polling。
- cooldown / dedup。
- fallback-only 不得觸發 DANGER。

### V27 Push Notification

- Telegram / LINE / Email。
- 只在 alert governance 測試完成後啟用。
