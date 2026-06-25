# Intraday Defense UI Integration

本文件定義 Allen Stock Dashboard 的 **Intraday Defense UI Integration**（盤中防守 UI 整合）。
V32 把 V31 `GET /api/portfolio/intraday-defense` 的 fixture-only API 接到 UI，
讓 holdings 頁面顯示盤中防守警報卡。

**本階段（V32）只新增 UI component（`components/intraday-defense-tracker.tsx`）、改 `app/holdings/page.tsx`、
新增文件、checker、README、package.json。只讀內部 API、仍是 fixture-only。
不接真資料、不建立 runtime、不連 Supabase、不發外部 request、不讀 env、不新增 API route、
不修改 Intraday Defense API route、不修改 Holding Defense API route / UI、不修改 War Room、
不新增 SQL migration、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Intraday Defense Fixture API](./intraday-defense-fixture-api.md)、
[Intraday Holding Defense Runtime Spec](./intraday-holding-defense-runtime-spec.md)、
[Holding Defense Tracker UI Integration](./holding-defense-tracker-ui-integration.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Intraday Defense UI Integration。
- V32 目標是把 V31 `/api/portfolio/intraday-defense` fixture-only API 接到 UI。
- 本階段只讀內部 API。
- 本階段仍是 fixture-only。
- 不接真資料。
- 不建立 runtime。
- 不連 Supabase。
- 不新增 API route。
- 不新增 SQL migration。
- 不寫資料。
- 不產生買賣指令。
- 不自動下單。

---

## B. Data Source Boundary

- UI 只能讀 `/api/portfolio/intraday-defense`。
- UI 不得直接讀 raw market data。
- UI 不得直接 fetch 外部 URL。
- UI 不得讀 Supabase。
- UI 不得讀 env key。
- UI 不得建立 runtime connector。
- UI 顯示的是 fixture data，不是即時資料。
- UI 顯示的是產品體驗預覽，不是投資建議。
- fixture data 不是即時資料。
- fixture data 不是投資建議。

---

## C. UI Placement

- Intraday Defense UI 優先放在 `app/holdings/page.tsx`。
- 它是持股頁面的一部分，用於展示盤中防守警報。
- 建議放在 Holding Defense Tracker 下方。
- V32 不修改 War Room read model。
- V32 不修改 War Room builder。
- V32 不修改 Intraday Defense API route。

---

## D. UI Sections

UI 至少包含：

1. Intraday Defense header
2. Fixture-only warning banner
3. Summary cards
4. Alert level distribution
5. Intraday state distribution
6. Intraday alert item cards
7. Cooldown / dedup section
8. Data quality / price verification section
9. Safety labels footer

Summary cards 至少顯示：

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

## E. Alert Item Card Fields

每張 alert card 至少顯示：

- alertId
- stockId
- stockName
- runtimeMode
- intradayState
- alertLevel
- triggerType
- trackerState
- holdingState
- holdingActionState
- priceVerified
- priceVerificationStatus
- freshnessStatus
- sourceConflictStatus
- dataQualityStatus
- sourcePriority
- currentPrice
- intradayHigh
- intradayLow
- previousClose
- volumeRatio
- drawdownFromPeakPercent
- defenseZone
- invalidLevel
- profitProtectionZone
- takeProfitZone
- riskReduceZone
- exitObservationZone
- holdingImpact
- trendBreakWarning
- shortAttackRisk
- riskReduceObservation
- waitForReclaimCondition
- recoveryCondition
- nextObservation
- dedupKey
- duplicateSuppressed
- cooldownRemainingSeconds
- nextAllowedAlertAt
- warnings
- missingDataFields
- requiredVerification
- notExitSignal
- notTradeAdvice
- highConfidenceConclusionAllowed

---

## F. Zone Display Rules

如果 zone 有資料，顯示：

- zoneLabel
- low
- high
- priceVerified
- priceVerificationStatus
- priceSource
- priceCheckedAt
- safetyLabel

如果 zone 為 null，顯示：

- 資料不足 / 未允許精準價位

必須顯示安全語言：

- 防守區是防守觀察，不是自動出場
- invalidLevel 不是自動停損價
- takeProfitZone 不是賣出價
- 風險降低觀察不是賣出指令
- FAST_DROP_WARNING 不是賣出指令
- priceVerified = false 時不得輸出精準價位

---

## G. State Display Rules

State 顯示語言：

- INTRADAY_NORMAL：盤中正常觀察
- DEFENSE_ZONE_APPROACHING：接近防守區
- DEFENSE_ZONE_BREACHED：防守區破壞觀察
- INVALID_LEVEL_APPROACHING：接近策略失效觀察價
- INVALID_LEVEL_BREACHED：策略失效觀察價破壞觀察
- PROFIT_GIVEBACK_WARNING：獲利回吐警示
- RISK_REDUCTION_WATCH：風險降低觀察
- FAST_DROP_WARNING：急跌警示
- TREND_BREAK_WARNING：趨勢破壞警示
- PRICE_NOT_VERIFIED：價格未驗證
- STALE_DATA：資料過舊
- SOURCE_CONFLICT：來源衝突
- FALLBACK_ONLY：fallback-only 資料
- DATA_INSUFFICIENT：資料不足

注意：

- DEFENSE_ZONE_BREACHED 不是自動出場。
- INVALID_LEVEL_BREACHED 不是自動停損。
- RISK_REDUCTION_WATCH 不是賣出指令。
- FAST_DROP_WARNING 不是賣出指令。
- DATA_INSUFFICIENT 不得輸出高信心結論。

---

## H. Cooldown / Dedup Display Rules

UI 必須顯示：

- dedupKey
- duplicateSuppressed
- cooldownRemainingSeconds
- lastAlertState
- nextAllowedAlertAt

說明：

- cooldown 是避免重複警報。
- dedup 是避免同一 stockId / state / level 重複顯示。
- cooldown / dedup 不是交易指令。
- V32 不建立排程。
- V32 不寫入 dedup state。

---

## I. No-DANGER Guard Display Rules

UI 必須顯示：

- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- priceVerified = false 不得觸發 DANGER
- DATA_INSUFFICIENT 不得觸發 DANGER

若 alertLevel = DANGER，UI 必須同時顯示：

- DANGER 不是買賣指令
- DANGER 需要 verified / fresh / no conflict data
- notTradeAdvice = true

---

## J. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Intraday Defense UI 不是自動交易系統
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

## K. Future Implementation Gate

### V33 Runtime Pilot Readiness Checklist

- source authorization
- rate limit
- market session
- timestamp normalization
- stale guard
- source conflict threshold
- fallback downgrade
- dry-run
- no-write
- audit log
- rollback
- kill switch

### V34 Runtime Pilot

- 先接低風險官方 / 授權資料源。
- 僅做 price verification 與 data quality。
- 預設 dry-run。
- 不寫 production data。
- 不產生買賣指令。
