# Intraday Holding Defense Runtime Spec

本文件定義 Allen Stock Dashboard 的 **Intraday Holding Defense Runtime Spec**（盤中持股防守 runtime 治理規格）。
V30 規範未來盤中持股防守 runtime 的行為：intraday defense states、trigger rules、cooldown / dedup、
data quality downgrade、no-DANGER guard、dry-run / no-write / kill switch readiness。

**本階段（V30）是 spec-only / contract-only。雖然名稱包含 runtime，但本輪不得建立 runtime implementation。
新增文件、use-case contract、checker、README、package.json。
不接真資料、不建立 quote polling / scheduler / webhook / broker connector / exchange connector、
不連 Supabase、不讀 env、不新增 API route、不新增 UI、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Holding Defense Tracker API Contract](./holding-defense-tracker-api-contract.md)、
[Runtime Data Pipeline Spec](./runtime-data-pipeline-spec.md)、
[Holding Defense Tracker UI Integration](./holding-defense-tracker-ui-integration.md)、
[Position Strategy Plan Spec](./position-strategy-plan-spec.md)、
[Dynamic Opportunity Pool & Price Verification Spec](./dynamic-opportunity-price-verification-spec.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Intraday Holding Defense Runtime Spec。
- 目的在於規範未來盤中持股防守 runtime 的行為。
- V30 是 spec-only / contract-only。
- V30 不接真資料。
- V30 不建立 quote polling。
- V30 不建立 scheduler。
- V30 不建立 webhook。
- V30 不建立 broker connector。
- V30 不建立 exchange connector。
- V30 不連 Supabase。
- V30 不讀 env key。
- V30 不新增 API route。
- V30 不新增 UI。
- V30 不寫資料。
- V30 不產生買賣指令。
- V30 不自動下單。

---

## B. Relationship to Previous Versions

- V24 定義 Position Strategy Plan 與 Holding Defense Plan。
- V25 定義 priceVerified / PriceVerificationStatus 與 HOLDING_PRIORITY_POOL。
- V26 將 Position Strategy fixture 串進 War Room。
- V27 建立 Holding Defense Tracker API Contract。
- V28 定義 Runtime Data Pipeline governance。
- V29 將 Holding Defense Tracker fixture API 接進 holdings page。
- V30 定義盤中防守 runtime 規格。
- V30 不建立 runtime。
- V31 / V32 才能在 dry-run / no-write 條件下進入 pilot。

---

## C. Core Philosophy

盤中持股防守不是自動賣出系統。

它的任務是：

- 偵測持股是否接近防守區
- 偵測防守區是否被跌破
- 偵測策略失效觀察價是否被觸發
- 偵測獲利是否快速回吐
- 偵測短線急跌
- 偵測趨勢是否破壞
- 偵測來源是否 stale / fallback-only / source conflict
- 產生觀察狀態與警示等級
- 套用 cooldown / dedup 避免重複警報
- 永遠保持 notTradeAdvice = true

它不是：

- 不是自動交易系統
- 不是自動下單系統
- 不是自動停損系統
- 不是必賣提示
- 不是放空建議
- 不是保證獲利模型

---

## D. Intraday Runtime Inputs

未來 runtime input 應包含：

- holding positions
- costBasis
- currentPrice
- previousClose
- intradayHigh
- intradayLow
- lastPrice
- bidPrice
- askPrice
- volume
- averageVolume
- defenseZone
- invalidLevel
- profitProtectionZone
- takeProfitZone
- riskReduceZone
- exitObservationZone
- priceVerified
- priceVerificationStatus
- sourcePriority
- freshnessStatus
- sourceConflictStatus
- dataQualityStatus
- marketStatus
- sectorStatus
- timestamp
- sourceTimestamp
- priceCheckedAt

本輪只定義 input shape，不建立資料來源。

---

## E. Intraday Defense States

定義以下 states（對應 contract 的 `IntradayHoldingDefenseState`）。

### INTRADAY_NORMAL

盤中狀態正常，未接近防守區，仍為觀察狀態。

### DEFENSE_ZONE_APPROACHING

接近防守區，提高追蹤優先級。

### DEFENSE_ZONE_BREACHED

跌破防守區，但仍不是自動出場。

### INVALID_LEVEL_APPROACHING

接近策略失效觀察價，提高警示。

### INVALID_LEVEL_BREACHED

跌破策略失效觀察價，INVALID_LEVEL_BREACHED 不是自動停損。

### PROFIT_GIVEBACK_WARNING

獲利快速回吐觀察，不是強制出場。

### RISK_REDUCTION_WATCH

風險升高觀察，不是賣出指令。

### FAST_DROP_WARNING

短線急跌觀察，FAST_DROP_WARNING 不是賣出指令。

### TREND_BREAK_WARNING

趨勢破壞觀察，趨勢破壞警示不是賣出指令。

### PRICE_NOT_VERIFIED

價格未驗證，不得輸出精準觀察區間。

### STALE_DATA

資料過舊，不得觸發 DANGER。

### SOURCE_CONFLICT

來源衝突，必須降級。

### FALLBACK_ONLY

只有 fallback 資料，不得觸發 DANGER。

### DATA_INSUFFICIENT

資料不足，不得輸出高信心結論。

安全語言：

- DEFENSE_ZONE_BREACHED 不是自動出場。
- INVALID_LEVEL_BREACHED 不是自動停損。
- PROFIT_GIVEBACK_WARNING 不是強制出場。
- RISK_REDUCTION_WATCH 不是賣出指令。
- FAST_DROP_WARNING 不是賣出指令。

---

## F. Intraday Alert Levels

定義（對應 contract 的 `IntradayHoldingDefenseAlertLevel`）：

- `INFO`
- `WATCH`
- `WARNING`
- `DANGER`
- `DATA_INSUFFICIENT`

規則：

- INFO：一般狀態。
- WATCH：接近防守區或轉弱條件。
- WARNING：防守區破壞、趨勢轉弱或價格驗證降級。
- DANGER：只允許在 verified / fresh / no source conflict 的資料下使用。
- DATA_INSUFFICIENT：資料不足或驗證失敗。

明確限制：

- fallback-only data 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。
- priceVerified = false 不得觸發 DANGER。
- DATA_INSUFFICIENT 不得觸發 DANGER。

---

## G. Trigger Rules

### Defense Zone Approach

條件：currentPrice 接近 defenseZone；priceVerified = true；freshnessStatus = FRESH / DELAYED；
sourceConflictStatus = NO_CONFLICT / MINOR_DIFFERENCE。

輸出：DEFENSE_ZONE_APPROACHING、WATCH。

### Defense Zone Breach

條件：currentPrice 跌破 defenseZone；priceVerified = true；freshnessStatus = FRESH；
sourceConflictStatus = NO_CONFLICT；volume confirms weakness。

輸出：DEFENSE_ZONE_BREACHED、WARNING 或 DANGER。

但：若 data stale / fallback-only / source conflict，只能 WARNING 或 DATA_INSUFFICIENT，不得 DANGER。

### Invalid Level Breach

條件：currentPrice 跌破 invalidLevel；priceVerified = true；freshnessStatus = FRESH；
sourceConflictStatus = NO_CONFLICT；trendBreak confirmed。

輸出：INVALID_LEVEL_BREACHED、WARNING 或 DANGER。

安全語言：invalidLevel 不是自動停損價；INVALID_LEVEL_BREACHED 不是自動停損。

### Profit Giveback Warning

條件：unrealizedProfitLossPercent 從高點回落；drawdownFromPeakPercent 超過門檻；price loses short MA；
volume expands on weakness。

輸出：PROFIT_GIVEBACK_WARNING、WATCH / WARNING。

安全語言：獲利保護觀察不是賣出指令；takeProfitZone 不是賣出價。

### Fast Drop Warning

條件：short interval price drop exceeds threshold；intradayLow breaks reference support；
abnormal volume expansion。

輸出：FAST_DROP_WARNING、WARNING。

限制：若 priceVerified = false，不得 DANGER；若 stale data，不得 DANGER。

### Trend Break Warning

條件：price loses 5MA / 10MA / 20MA；MACD histogram weakens；KD turns down from high level；
sector weakens；market turns WARNING / DANGER。

輸出：TREND_BREAK_WARNING、WATCH / WARNING。

安全語言：趨勢破壞警示不是賣出指令。

---

## H. Cooldown Rules

- 同一 stockId、同一 defense state，在 cooldown window 內不得重複發出相同 alert。
- DANGER alert 也必須 dedup。
- cooldown 不得遮蔽 data quality downgrade。
- cooldown 不得遮蔽 recovery condition。
- cooldown window 必須可設定。
- default cooldown window 必須保守。
- fixture / spec 階段不得真的排程。

---

## I. Dedup Rules

dedup key：

- stockId
- trackerState
- alertLevel
- priceVerificationStatus
- defenseZone
- invalidLevel
- timestamp bucket
- sourcePriority

dedup output 應包含：

- dedupKey
- duplicateSuppressed
- cooldownRemainingSeconds
- lastAlertState
- nextAllowedAlertAt

V30 只定義欄位，不建立儲存或排程。

---

## J. Recovery Rules

recovery condition：

- 重新站回 defenseZone
- 重新站回 invalidLevel
- 量縮止跌
- priceVerified restored
- stale data refreshed
- source conflict resolved
- market alert downgraded
- sector weakness resolved

輸出：recoveryCondition、waitForReclaimCondition、alertDowngradeReason、nextObservation。

---

## K. Data Quality Downgrade Rules

- priceVerified = false → DATA_INSUFFICIENT / PRICE_NOT_VERIFIED
- STALE → STALE_DATA
- SOURCE_CONFLICT → SOURCE_CONFLICT
- FALLBACK_ONLY → FALLBACK_ONLY
- NOT_COVERED → DATA_INSUFFICIENT
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- priceVerified = false 時不得輸出精準價位
- highConfidenceConclusionAllowed 必須 false

---

## L. Output Rules

未來 intraday defense alert item 必須包含：

- alertId
- stockId
- stockName
- intradayState
- alertLevel
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
- dedupKey
- duplicateSuppressed
- cooldownRemainingSeconds
- nextAllowedAlertAt
- warnings
- missingDataFields
- notExitSignal
- notTradeAdvice
- highConfidenceConclusionAllowed
- requestPerformed
- supabaseConnected
- productionWritePerformed

如果 priceVerified = false：

- currentPrice 可為 null
- all precise zones 必須為 null
- alertLevel 不得為 DANGER
- highConfidenceConclusionAllowed 必須 false

---

## M. Runtime Readiness Gate

真正 runtime pilot 前必須確認（對應 contract 的 `IntradayHoldingDefenseRuntimeReadinessChecklist`）：

- source authorization reviewed
- rate limit reviewed
- market session handling defined
- timestamp normalization defined
- price freshness window defined
- source conflict threshold defined
- fallback downgrade defined
- no-DANGER guard defined
- cooldown window defined
- dedup storage strategy defined
- dry-run mode defined
- no-write guard defined
- audit log shape defined
- kill switch defined
- rollback plan defined
- notTradeAdvice always true
- buySellCommandGenerationBlocked = true

---

## N. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Intraday Holding Defense Runtime 不是自動交易系統
- V30 不接真資料
- V30 不建立 runtime
- V30 不寫資料
- 防守區是防守觀察，不是自動出場
- invalidLevel 不是自動停損價
- takeProfitZone 不是賣出價
- 風險降低觀察不是賣出指令
- 趨勢破壞警示不是賣出指令
- FAST_DROP_WARNING 不是賣出指令
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- 資料不足就顯示資料不足

---

## O. Future Implementation Gate

### V31 Runtime Pilot

- 先接低風險官方 / 授權資料源
- 僅做 price verification 與 data quality
- 預設 dry-run
- 不寫 production data
- 不產生買賣指令

### V32 Intraday Holding Defense Runtime

- 盤中持股追蹤
- cooldown / dedup
- fallback-only 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
