# Position Strategy Fixture Adapters

本文件定義 Allen Stock Dashboard 的 **Position Strategy Fixture Adapters**（持股策略計畫 fixture 介接層）。
V26 把 V24 Position Strategy Plan 與 V25 Dynamic Opportunity Pool / Price Verification 用 fixture-only
sample 串起來，並讓既有 War Room read model 與 War Room UI 顯示 Position Strategy Plan 範例。

**本階段（V26）只新增 fixture adapter、文件、checker、改 War Room contract / fixture bundle / builder /
既有 War Room Dashboard component、README、package.json。
不新增新的 API route、不新增新的 UI component 檔案、不接真資料、不連 Supabase、不發外部 request、
不讀 env、不新增 SQL migration、不建立 runtime scanner、不建立 price verification runtime、
不建立 Holding Defense Tracker API、不寫入資料、不產生買賣指令、不自動下單。**

相關文件：
[Position Strategy Plan Spec](./position-strategy-plan-spec.md)、
[Dynamic Opportunity Pool & Price Verification Spec](./dynamic-opportunity-price-verification-spec.md)、
[War Room Read Model Contract](./war-room-read-model-contract.md)、
[War Room Engine Fixture Adapters](./war-room-engine-fixture-adapters.md)、
[War Room UI Polish](./war-room-ui-polish.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Position Strategy Fixture Adapters。
- V26 目標是把 V24 Position Strategy Plan 與 V25 Dynamic Opportunity Pool / Price Verification 用 fixture-only sample 串起來。
- Fixture adapters 只產生 deterministic sample data。
- Fixture adapters 不是即時資料。
- Fixture adapters 不是真實行情。
- Fixture adapters 不是投資建議。
- Fixture adapters 不接 Supabase。
- Fixture adapters 不發外部 request。
- Fixture adapters 不建立 Holding Defense Tracker API。
- Fixture adapters 不建立 runtime。
- Fixture adapters 不產生買賣指令。
- Fixture adapters 只用於 UI shape validation 與產品體驗預覽。
- fixture data 不是即時資料。
- fixture data 不是投資建議。

---

## B. Fixture Scope

V26 fixture 必須提供：

1. Entry Observation Plan
2. Holding Defense Plan
3. Profit Protection Plan
4. Risk Reduction Plan
5. No Touch Plan
6. Data Insufficient Plan
7. Price Verification sample states
8. Opportunity Pool classification sample states
9. War Room read model integration
10. War Room UI card display

明確邊界：

- V26 只做 fixture。
- V26 不接真資料。
- V26 不驗證真實價格。
- V26 不建立 scanner。
- V26 不建立 tracker API。
- V26 不寫 Supabase。
- V26 不產生買賣指令。

---

## C. Fixture Plan Types

六種 fixture plan（對應 V24 `PositionStrategyPlanType`）。

### ENTRY_OBSERVATION

用於展示：進場觀察區、轉強確認條件、策略失效觀察價、不追價區、觀察目標區、riskRewardRatio、priceVerified = true。

安全語言：

- 進場觀察區不是買進價。
- 策略失效觀察價不是自動停損價。
- 觀察目標區不是目標價。
- notEntrySignal = true
- notTradeAdvice = true

### HOLDING_DEFENSE

用於展示：防守區、holdingImpact、trendBreakWarning、shortAttackRisk、riskReduceObservation、waitForReclaimCondition。

安全語言：

- 防守區是防守觀察，不是自動出場。
- 風險降低觀察不是賣出指令。
- notExitSignal = true
- notTradeAdvice = true

### PROFIT_PROTECTION

用於展示：profitProtectionZone、takeProfitZone、riskReduceZone、trailingDefenseLevel、holdingActionState。

安全語言：

- takeProfitZone 不是賣出價。
- Profit Protection 不是強制出場。
- holdingActionState 是狀態，不是買賣指令。
- notExitSignal = true
- notTradeAdvice = true

### RISK_REDUCTION

用於展示：exitObservationZone、riskReduceCondition、trendInvalidationReason、waitForReclaimCondition。

安全語言：

- 出場觀察區不是賣出價。
- 風險降低觀察不是賣出指令。
- notExitSignal = true
- notTradeAdvice = true

### NO_TOUCH

用於展示：noTouchReason、requiredRecoveryCondition、noTouchDurationHint。

安全語言：

- No Touch 是風控提醒，不是賣出指令。
- 禁碰不是放空建議。
- notExitSignal = true
- notTradeAdvice = true

### DATA_INSUFFICIENT

用於展示：priceVerified = false、PRICE_NOT_VERIFIED、SOURCE_CONFLICT、STALE_DATA、FALLBACK_ONLY、NOT_COVERED、missingDataFields、requiredVerification。

安全語言：

- priceVerified = false 時不得輸出精準價位。
- fallback-only data 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- 資料不足就顯示資料不足。

---

## D. War Room Integration

V26 會把 Position Strategy Plan fixture data 加入 War Room read model。

新增 War Room output fields：

- positionStrategyPlans
- entryObservationPlans
- holdingDefensePlans
- profitProtectionPlans
- riskReductionPlans
- positionNoTouchPlans
- positionDataInsufficientPlans
- positionStrategyFixtureVersion

War Room 仍是 read model。War Room 不直接創造策略計畫。War Room 只整合 Position Strategy Fixture Adapter 的輸出。

---

## E. UI Display Rules

War Room UI 應顯示：Position Strategy Plans、Entry Observation、Holding Defense、Profit Protection、
Risk Reduction、No Touch、Data Insufficient、priceVerified、priceVerificationStatus、dataQualityStatus、
holdingImpact、takeProfitZone、notEntrySignal、notExitSignal、notTradeAdvice、highConfidenceConclusionAllowed。

UI labels 必須使用：

- 進場觀察區，不是買進價
- 策略失效觀察價，不是自動停損價
- 觀察目標區，不是目標價
- takeProfitZone 不是賣出價
- 出場觀察區不是賣出價
- 風險降低觀察不是賣出指令
- No Touch 是風控提醒，不是賣出指令

UI 不得顯示「強力買進 / 必買 / 必賣 / 立即進場 / 立即出場 / 自動下單 / 保證獲利」等指令字眼，
除非在「不是 / 不等於 / 不得」否定語境中。

---

## F. Price Verification Fixture States

至少要展示：VERIFIED、NOT_VERIFIED、STALE、SOURCE_CONFLICT、FALLBACK_ONLY、NOT_COVERED。

規則：

- VERIFIED 可以有 sample price zones，但必須標示 fixture only。
- NOT_VERIFIED 不得有 precise price zones。
- STALE 不得觸發 DANGER。
- SOURCE_CONFLICT 不得輸出高信心結論。
- FALLBACK_ONLY 不得觸發 DANGER。
- NOT_COVERED 只能資料不足。
- 所有 sample 都不得是即時價格。
- 所有 sample price 都必須標示 sample / fixture / illustrative。

> 對應 V25 `OpportunityPriceVerificationStatus` 與 V24 `PositionStrategyDataQualityStatus`
> （含 PRICE_NOT_VERIFIED / SOURCE_CONFLICT / STALE_DATA）。

---

## G. Opportunity Pool Fixture States

至少要展示：MAIN_UPTREND_POOL、BREAKOUT_PREP_POOL、HOLDING_PRIORITY_POOL、DAILY_WATCH_POOL、
LOW_COVERAGE_POOL、NO_TOUCH_POOL、DATA_INSUFFICIENT_POOL。

V24 `PositionStrategyPlan` 沒有直接的 poolType 欄位，因此 V26 不修改 V24 contract，
改用 `setupTags` / `observationSummary` / `warnings` 表示 fixture classification。

---

## H. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- fixture data 不是即時資料
- fixture data 不是投資建議
- 進場觀察區不是買進價
- 策略失效觀察價不是自動停損價
- 觀察目標區不是目標價
- takeProfitZone 不是賣出價
- 出場觀察區不是賣出價
- 風險降低觀察不是賣出指令
- No Touch 是風控提醒，不是賣出指令
- 主升段候選不是買進清單
- 飆股預備隊不是追價清單
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- 資料不足就顯示資料不足

---

## I. Future Implementation Gate

### V27 Holding Defense Tracker API Contract

- 持股即時防守 API contract
- 成本 / 現價 / 損益 / 防守區 / 失效觀察 / 獲利保護
- 不接 runtime

### V28 Runtime Data Pipeline Spec

- 官方 / 授權 / fallback source validation
- stale guard
- priceVerified
- source conflict downgrade

### V29 Runtime Pilot

- 先接低風險官方 / 授權資料源
- 僅做價格驗證與資料品質
- 不產生買賣指令
