# Holding Defense Tracker API Contract

本文件定義 Allen Stock Dashboard 的 **Holding Defense Tracker API Contract**（持股即時防守追蹤 API 合約）。
V27 建立持股即時防守追蹤的 API shape，回答「目前持股是否接近防守區、是否跌破策略失效觀察價、
是否進入獲利保護觀察 / 風險降低觀察、是否 priceVerified、是否資料不足 / stale / fallback-only /
source conflict」等問題。

**本階段（V27）是 contract-only / fixture-only。新增 endpoint、contract、pure builder、文件、checker、
README、package.json。不接真資料、不連 Supabase、不建立 runtime quote polling、不建立 scheduler、
不建立 push notification、不新增 UI、不修改 War Room、不發外部 request、不讀 env、不新增 SQL migration、
不寫入資料、不產生買賣指令、不自動下單。**

相關文件：
[Position Strategy Plan Spec](./position-strategy-plan-spec.md)、
[Dynamic Opportunity Pool & Price Verification Spec](./dynamic-opportunity-price-verification-spec.md)、
[Position Strategy Fixture Adapters](./position-strategy-fixture-adapters.md)、
[War Room API Contract](./war-room-api-contract.md)、
[War Room Read Model Contract](./war-room-read-model-contract.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Holding Defense Tracker API Contract。
- V27 目標是建立持股即時防守追蹤的 API shape。
- 本階段是 contract-only / fixture-only。
- 不接真資料。
- 不連 Supabase。
- 不建立 runtime quote polling。
- 不建立 scheduler。
- 不建立 push notification。
- 不新增 UI。
- 不寫資料。
- 不產生買賣指令。
- 不自動下單。

---

## B. API Endpoint

定義 endpoint：`GET /api/portfolio/holding-defense`

- 只允許 GET。
- 回傳 mock_or_contract / fixture-only payload。
- 不讀真實持股。
- 不讀即時行情。
- 不讀 Supabase。
- 不讀 env key。
- 不發外部 request。
- 不寫資料。

---

## C. Relationship to Previous Versions

- V24 定義 Holding Defense Plan 的策略語義。
- V25 定義 HOLDING_PRIORITY_POOL 與 priceVerified / PriceVerificationStatus。
- V26 建立 Position Strategy fixture examples。
- V27 才正式建立 Holding Defense Tracker API Contract。
- V27 不接 runtime。
- V27 不是真正即時追蹤。
- 真正盤中 quote polling / stale guard / source validation 留到 V28 / V29 / V30。

---

## D. Holding Defense Tracker Scope

API 應追蹤：

- costBasis
- currentPrice
- unrealizedProfitLoss
- unrealizedProfitLossPercent
- defenseZone
- invalidLevel
- profitProtectionZone
- takeProfitZone
- riskReduceZone
- exitObservationZone
- holdingImpact
- holdingState
- holdingActionState
- trendBreakWarning
- shortAttackRisk
- supportBreakStatus
- maBreakStatus
- volumeBreakdownStatus
- intradayAlertLevel
- riskReduceObservation
- waitForReclaimCondition
- priceVerified
- priceVerificationStatus
- dataQualityStatus
- sourceMode
- highConfidenceConclusionAllowed

---

## E. Tracker States

對應 contract 的 `HoldingDefenseTrackerState`。

### NORMAL_OBSERVATION

持股狀態正常，未接近防守區，仍為觀察狀態。

### DEFENSE_ZONE_NEAR

接近防守區，需要提高追蹤優先級。

### DEFENSE_ZONE_BROKEN

跌破防守區或策略失效觀察價附近，但仍不是自動出場指令。

### PROFIT_PROTECTION_ACTIVE

已有獲利且出現回吐風險，需要啟動獲利保護觀察。

### RISK_REDUCTION_ACTIVE

趨勢破壞、族群轉弱或量價失衡，需要風險降低觀察。

### DATA_INSUFFICIENT

資料不足，不得輸出高信心結論。

### PRICE_NOT_VERIFIED

價格未驗證，不得輸出精準觀察區間。

### SOURCE_CONFLICT

來源衝突，必須降級為 WARNING / DATA_INSUFFICIENT。

### STALE_DATA

資料過舊，不得觸發 DANGER。

---

## F. Price Verification Rules

- priceVerified = true 才可輸出精準 defenseZone / invalidLevel / takeProfitZone / riskReduceZone。
- priceVerified = false 時不得輸出精準價位。
- fallback-only data 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- source conflict 時降級為 WARNING / DATA_INSUFFICIENT。
- Yahoo / FinMind / yfinance-like 只能 secondary / fallback。
- official / licensed / broker / authorized source 才能成為高信心來源。
- 本階段 API 不會真的驗證價格，只輸出 fixture contract shape。

---

## G. Output Rules

每個 tracker item 必須包含：

- trackerId
- stockId
- stockName
- trackerState
- holdingState
- holdingActionState
- priceVerified
- priceVerificationStatus
- dataQualityStatus
- alertLevel
- costBasis
- currentPrice
- unrealizedProfitLoss
- unrealizedProfitLossPercent
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
- warnings
- missingDataFields
- requiredVerification
- notExitSignal
- notTradeAdvice
- highConfidenceConclusionAllowed

如果 priceVerified = false：

- defenseZone 必須為 null
- invalidLevel 必須為 null
- takeProfitZone 必須為 null
- riskReduceZone 必須為 null
- exitObservationZone 必須為 null
- currentPrice 可為 null
- unrealizedProfitLossPercent 可為 null
- highConfidenceConclusionAllowed 必須為 false

---

## H. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Holding Defense Tracker 不是自動交易系統
- 防守區是防守觀察，不是自動出場
- 策略失效觀察價不是自動停損價
- takeProfitZone 不是賣出價
- 出場觀察區不是賣出價
- 風險降低觀察不是賣出指令
- DATA_INSUFFICIENT 不得輸出高信心結論
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 時降級為 WARNING / DATA_INSUFFICIENT

---

## I. War Room Relationship

- Holding Defense Tracker API 未來會供 War Room 的 portfolioRiskRadar 與 realtimeAlerts 使用。
- V27 不修改 War Room。
- V27 不新增 UI。
- V27 不接 runtime。
- War Room 仍是 read model。
- Holding Defense Tracker API 是未來持股防守資料來源之一。

---

## J. Future Implementation Gate

### V28 Runtime Data Pipeline Spec

- 官方 / 授權 / fallback source validation
- stale guard
- priceVerified
- source conflict downgrade

### V29 Runtime Pilot

- 先接低風險官方 / 授權資料源
- 僅做價格驗證與資料品質
- 不產生買賣指令

### V30 Intraday Holding Defense Runtime

- 盤中持股追蹤
- 急跌 / 防守區 / 趨勢破壞
- cooldown / dedup
- fallback-only 不得觸發 DANGER
