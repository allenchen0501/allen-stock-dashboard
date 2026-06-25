# Intraday Defense Fixture API

本文件定義 Allen Stock Dashboard 的 **Intraday Defense Fixture API**（盤中防守 fixture-only API）。
V31 把 V30 Intraday Holding Defense Runtime contract 轉成 fixture-only API
（`GET /api/portfolio/intraday-defense`），讓未來 UI 可以先看見盤中防守警報卡的資料 shape。

**本階段（V31）是 mock_or_contract / fixture-only / internal endpoint only。新增 pure fixture builder、
API route、文件、checker、README、package.json。不接真資料、不建立 runtime、不建立 quote polling /
scheduler / webhook / broker connector / exchange connector、不連 Supabase、不讀 env、不新增 UI、
不修改 War Room / Holding Defense API route / Holding Defense UI、不新增 SQL migration、
不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Intraday Holding Defense Runtime Spec](./intraday-holding-defense-runtime-spec.md)、
[Holding Defense Tracker API Contract](./holding-defense-tracker-api-contract.md)、
[Runtime Data Pipeline Spec](./runtime-data-pipeline-spec.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Intraday Defense Fixture API。
- V31 目標是把 V30 intraday defense runtime contract 轉成 fixture-only API。
- 本階段是 mock_or_contract。
- 本階段不接真資料。
- 本階段不建立 runtime。
- 本階段不建立 quote polling。
- 本階段不建立 scheduler。
- 本階段不建立 webhook。
- 本階段不建立 broker connector。
- 本階段不建立 exchange connector。
- 本階段不連 Supabase。
- 本階段不讀 env key。
- 本階段不新增 UI。
- 本階段不寫資料。
- 本階段不產生買賣指令。
- 本階段不自動下單。

---

## B. API Endpoint

定義 endpoint：`GET /api/portfolio/intraday-defense`

- 只允許 GET。
- 回傳 mock_or_contract / fixture-only payload。
- 不讀真實持股。
- 不讀即時行情。
- 不讀 Supabase。
- 不讀 env key。
- 不發外部 request。
- 不寫資料。
- 不產生買賣指令。

---

## C. Relationship to Previous Versions

- V30 定義 Intraday Holding Defense Runtime Spec。
- V31 只建立 fixture-only API。
- V31 不建立 runtime。
- V31 不接真資料。
- V31 不新增 UI。
- V31 不改 Holding Defense Tracker API。
- V31 不改 Holding Defense Tracker UI。
- 後續 V32 才可做 Intraday Defense UI Integration。
- 後續 V33 才可討論 Runtime Pilot。

---

## D. Fixture Data Rules

fixture payload 必須包含以下 states：

- INTRADAY_NORMAL
- DEFENSE_ZONE_APPROACHING
- DEFENSE_ZONE_BREACHED
- INVALID_LEVEL_APPROACHING 或 INVALID_LEVEL_BREACHED
- PROFIT_GIVEBACK_WARNING
- RISK_REDUCTION_WATCH
- FAST_DROP_WARNING
- TREND_BREAK_WARNING
- PRICE_NOT_VERIFIED
- STALE_DATA
- SOURCE_CONFLICT
- FALLBACK_ONLY
- DATA_INSUFFICIENT

fixture payload 必須包含以下欄位：

- cooldown
- dedup
- duplicateSuppressed
- cooldownRemainingSeconds
- nextAllowedAlertAt
- blocksDangerWhenFallbackOnly
- blocksDangerWhenStale
- blocksDangerWhenSourceConflict
- priceVerified
- priceVerificationStatus
- freshnessStatus
- sourceConflictStatus
- dataQualityStatus
- sourcePriority
- takeProfitZone
- notExitSignal
- notTradeAdvice
- highConfidenceConclusionAllowed

---

## E. No-DANGER Guard

- priceVerified = false 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- fallback-only data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。
- DATA_INSUFFICIENT 不得觸發 DANGER。
- DANGER 只可出現在 verified / fresh / no conflict 的 fixture sample。
- 即使 DANGER 出現，也不是買賣指令。

---

## F. Output Shape

API response 必須包含：

- contractVersion
- apiContractVersion
- responseSource
- sourceMode
- runtimeMode
- generatedAt
- fixtureVersion
- alerts
- summary
- triggerRules
- cooldownPolicy
- runtimeReadinessChecklist
- requestPerformed
- supabaseConnected
- productionWritePerformed

每筆 alert 必須符合 V30 `IntradayHoldingDefenseAlertItem`。

summary 必須至少包含：

- totalAlerts
- infoCount
- watchCount
- warningCount
- dangerCount
- dataInsufficientCount
- priceNotVerifiedCount
- staleDataCount
- sourceConflictCount
- fallbackOnlyCount
- duplicateSuppressedCount
- highConfidenceConclusionAllowed

---

## G. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Intraday Defense Fixture API 不是自動交易系統
- fixture data 不是即時資料
- fixture data 不是投資建議
- 防守區是防守觀察，不是自動出場
- invalidLevel 不是自動停損價
- takeProfitZone 不是賣出價
- 風險降低觀察不是賣出指令
- FAST_DROP_WARNING 不是賣出指令
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- DATA_INSUFFICIENT 不得觸發 DANGER
- 資料不足就顯示資料不足

---

## H. Future Implementation Gate

### V32 Intraday Defense UI Integration

- 把 `/api/portfolio/intraday-defense` 接到 UI。
- 顯示盤中防守警報卡。
- 仍 fixture-only。
- 不接真資料。

### V33 Runtime Pilot

- 先接低風險官方 / 授權資料源。
- 僅做 price verification 與 data quality。
- 預設 dry-run。
- 不寫 production data。
- 不產生買賣指令。
