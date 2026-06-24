# Position Strategy Plan Spec

本文件定義 Allen Stock Dashboard 的 **Position Strategy Plan**（條件式策略觀察計畫規格）。
V24 把技術指標、估值、研究、持股狀態、即時警報，整理成正式 contract，並轉成條件式策略觀察計畫。

**本階段（V24）只新增 `docs/position-strategy-plan-spec.md`、
`use-cases/position-strategy/position-strategy-plan-contract.ts`、checker、README、package.json。
不接真資料、不連 Supabase、不新增 API route、不新增 UI、不建立 Holding Defense Tracker API、
不建立 runtime、不發外部 request、不讀 env、不新增 SQL migration、不寫入資料、不產生買賣指令、不自動下單。**

相關文件：
[Technical + Risk Reward Strategy Spec](./technical-risk-reward-strategy-spec.md)、
[Intraday Risk Crisis Alert Spec](./intraday-risk-crisis-alert-spec.md)、
[Portfolio Valuation Radar Spec](./portfolio-valuation-radar-spec.md)、
[War Room Read Model Contract](./war-room-read-model-contract.md)、
[War Room Intelligence Architecture](./war-room-intelligence-architecture.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Position Strategy Plan。
- 目的不是只展示技術指標，而是把技術指標、估值、研究、持股狀態、即時警報轉成條件式策略觀察計畫。
- Position Strategy Plan 是決策輔助，不是自動交易系統。
- 本階段為 spec-only。
- 不接真資料。
- 不連 Supabase。
- 不新增 API route。
- 不新增 UI。
- 不建立 Holding Defense Tracker API。
- 不建立 runtime。
- 不產生買賣指令。
- 不自動下單。

> 重要範圍註記：**V24 只定義 Holding Defense Plan** 的資料合約與語義，不建立持股即時追蹤 API、
> 不讀持股資料、不計算真實即時損益。**真正的 Holding Defense Tracker API 留到 V27。**

---

## B. Core Philosophy

Allen Stock Dashboard 的最終輸出不只是：

- KD
- KDJ
- MACD
- MA
- volume
- support
- resistance
- riskRewardRatio

而是條件式策略觀察計畫：

- 進場觀察區
- 轉強確認條件
- 策略失效觀察價
- 防守區
- 獲利保護區
- 風險降低觀察
- 出場觀察區
- 不追價區
- 禁碰 / No Touch

核心原則：

- 技術指標必須轉成價格區 + 條件，不能只給一個指標數字。
- 價格區必須建立在 `priceVerified = true` 的前提下。
- `priceVerified = false` 時，不得輸出精準價位。
- `dataQualityStatus = FAIL` 時，不得輸出高信心結論。
- `highConfidenceConclusionAllowed = false` 時，只能輸出條件式觀察。
- Position Strategy Plan 不等於自動交易。
- Position Strategy Plan 不等於買賣指令。

---

## C. Plan Types

Position Strategy Plan 定義六種 plan 類型（對應 contract 的 `PositionStrategyPlanType`）：

1. `ENTRY_OBSERVATION`
2. `HOLDING_DEFENSE`
3. `PROFIT_PROTECTION`
4. `RISK_REDUCTION`
5. `NO_TOUCH`
6. `DATA_INSUFFICIENT`

### ENTRY_OBSERVATION

用於還沒持有、正在找承接機會的股票。

應輸出：

- entryObservationZone
- entryTriggerCondition
- confirmationCondition
- noChaseZone
- invalidLevel
- targetObservationZone
- riskRewardRatio
- notEntrySignal
- notTradeAdvice

### HOLDING_DEFENSE

用於實際持股的防守策略計畫。
注意：**V24 只定義 Holding Defense Plan**，不建立 Holding Defense Tracker API；
**真正的 Holding Defense Tracker API 留到 V27。**

應輸出：

- costBasis
- currentPrice
- unrealizedProfitLossPercent
- defenseZone
- invalidLevel
- trendBreakWarning
- shortAttackRisk
- supportBreakStatus
- maBreakStatus
- volumeBreakdownStatus
- intradayAlertLevel
- holdingImpact
- riskReduceObservation
- notExitSignal
- notTradeAdvice

### PROFIT_PROTECTION

用於已有獲利的持股，避免獲利回吐。

應輸出：

- profitProtectionZone
- takeProfitZone
- riskReduceZone
- trailingDefenseLevel
- trendWeakeningReason
- holdingActionState
- notExitSignal
- notTradeAdvice

### RISK_REDUCTION

用於走空風險升高時。

應輸出：

- exitObservationZone
- riskReduceCondition
- trendInvalidationReason
- waitForReclaimCondition
- notExitSignal
- notTradeAdvice

### NO_TOUCH

用於禁碰池 / 避開清單。

應輸出：

- noTouchReason
- sourceEngine
- dataQualityStatus
- notExitSignal
- notTradeAdvice

### DATA_INSUFFICIENT

用於資料不足、價格未驗證、來源衝突、冷門股 / 興櫃股 / fallback-only data。

應輸出：

- unavailableReason
- missingDataFields
- requiredVerification
- notEntrySignal
- notExitSignal
- notTradeAdvice

---

## D. Price Verification Dependency

Position Strategy Plan 依賴價格驗證。

未來正式資料源優先順序（僅為規劃說明，本階段不接 runtime）：

1. TWSE / TPEx official or licensed feed
2. Broker API / authorized quote provider
3. Validated secondary source：Yahoo / FinMind / TradingView / yfinance-like
4. Fallback cache / manual verified source

規則：

- `priceVerified = true` 才可輸出精準 zone。
- `priceVerified = false` 不得輸出精準價位。
- fallback-only data 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- source conflict 時降級為 WARNING / DATA_INSUFFICIENT。
- Yahoo 不得作為唯一正式來源。
- priceSource 必須被記錄。
- priceCheckedAt 必須被記錄。
- confidenceScore 必須受資料品質影響。
- 資料不足就顯示資料不足。

對應 contract 欄位：`priceVerified`、`priceVerificationStatus`（`PriceVerificationStatus`：
VERIFIED / NOT_VERIFIED / STALE / SOURCE_CONFLICT / FALLBACK_ONLY / NOT_COVERED）、
`priceSource`、`priceCheckedAt`，以及每個 `PriceZone` 的 `isPrecisePriceAllowed`。

---

## E. Entry Observation Logic

進場觀察邏輯，用於 `ENTRY_OBSERVATION` plan。

條件來源：

- KD / KDJ 低檔改善
- MACD histogram 收斂或翻紅
- 5MA / 10MA / 20MA 改善
- 站回月線
- 扣三低
- 量縮回測
- 爆量轉強
- 支撐區明確
- 風報比 >= 1:3
- 大盤不是 DANGER
- 族群沒有同步轉弱
- priceVerified = true

輸出：

- entryObservationZone
- confirmationCondition
- invalidLevel
- targetObservationZone
- noChaseZone
- riskRewardRatio
- riskRewardGrade

安全規則：

- 進場觀察區不是買進價。
- 策略失效觀察價不是自動停損價。
- 觀察目標區不是目標價。
- 不追價區不是放空建議。
- notEntrySignal = true
- notTradeAdvice = true

---

## F. Holding Defense Logic

持股防守邏輯，用於 `HOLDING_DEFENSE` plan，用於使用者實際持股，最高優先追蹤。
注意：**V24 只定義 Holding Defense Plan** 的資料合約與語義，不建立即時追蹤 API、不讀持股資料、
不計算即時損益。**真正的 Holding Defense Tracker API 留到 V27。**

條件來源：

- costBasis
- currentPrice
- unrealizedProfitLossPercent
- defenseZone
- 5MA / 10MA / 20MA
- 日 200MA
- 週 30MA
- MACD histogram 轉弱
- KD 高檔轉弱
- 放量破底
- 跌破前波低點
- 族群同步轉弱
- 大盤 intraday WARNING / DANGER
- 被動賣壓放大
- 持股從獲利轉接近成本

輸出：

- holdingState
- holdingImpact
- defenseZone
- invalidLevel
- profitProtectionZone
- trendBreakWarning
- shortAttackRisk
- riskReduceObservation
- waitForReclaimCondition

安全規則：

- 防守區是防守觀察，不是自動出場。
- 策略失效觀察價不是自動停損價。
- 風險降低觀察不是賣出指令。
- notExitSignal = true
- notTradeAdvice = true

---

## G. Profit Protection Logic

獲利保護邏輯，用於 `PROFIT_PROTECTION` plan。

目的：避免持股從獲利變小賺，甚至變虧損。

觸發條件：

- 高檔爆量不漲
- 價漲量縮
- KD 高檔轉弱
- MACD histogram 連續縮小
- 跌破 5MA / 10MA
- 跌破前一根大量低點
- 族群龍頭轉弱
- 大盤急跌
- 法人 / 主力籌碼轉賣
- profitLossPercent 從高點明顯回落

輸出：

- profitProtectionZone
- takeProfitZone
- trailingDefenseLevel
- riskReduceZone
- trendWeakeningReason
- holdingActionState

`holdingActionState` 可為（對應 contract 的 `HoldingActionState`）：

- 續抱觀察
- 獲利保護觀察
- 風險降低觀察
- 危險觀察
- 資料不足

安全規則：

- holdingActionState 是狀態，不是買賣指令。
- Profit Protection 不是強制出場。
- takeProfitZone 是分批獲利保護觀察區，takeProfitZone 不是賣出價。
- notExitSignal = true
- notTradeAdvice = true

---

## H. Risk Reduction / Exit Observation Logic

走空風險降低邏輯，用於 `RISK_REDUCTION` plan。
它不是單一停損價，而是：價格位置 + 技術條件 + 量價確認 + 大盤 / 族群背景。

觸發條件：

- 跌破 invalidLevel
- 跌破週 30MA
- 跌破日 200MA
- 跌破前波低點
- 放量跌破支撐
- 技術反彈量價背離
- MACD 翻空
- KD 高檔轉弱
- 族群同步破線
- intraday DANGER active
- Research 顯示需求惡化
- Valuation 過熱且技術破線

輸出：

- exitObservationZone
- riskReduceCondition
- trendInvalidationReason
- waitForReclaimCondition

安全規則：

- 出場觀察區不是賣出價。
- 風險降低觀察不是賣出指令。
- notExitSignal = true
- notTradeAdvice = true

---

## I. No Touch Logic

禁碰 / 避開邏輯，用於 `NO_TOUCH` plan。

條件：

- 營收轉弱
- 法人持續賣超
- MACD 翻空
- 跌破季線
- 放量破底
- 量價背離
- 主力出貨
- 族群同步轉弱
- riskRewardRatio < 2
- supportZone 不明確
- dataQualityStatus = FAIL
- source conflict unresolved
- stale data
- intraday DANGER active

輸出：

- noTouchReason
- noTouchDurationHint
- requiredRecoveryCondition
- notExitSignal
- notTradeAdvice

安全規則：

- No Touch 是風控提醒，不是賣出指令。
- 禁碰不是放空建議。
- notExitSignal = true
- notTradeAdvice = true

---

## J. War Room Integration

說明未來 War Room 七大區塊如何接 Position Strategy Plan 的輸出。

### portfolioRiskRadar

加入：

- Holding Defense Plan
- Profit Protection Plan
- riskReduceObservation
- holdingState
- holdingImpact

### technicalRiskRewardCandidates

加入：

- Entry Observation Plan
- entryObservationZone
- confirmationCondition
- invalidLevel
- riskRewardRatio
- noChaseZone

### realtimeAlerts

加入：

- holdingImpact
- defenseZoneBreak
- trendBreakWarning
- shortAttackRisk

### avoidList

加入：

- No Touch Plan
- riskReduceObservation
- requiredRecoveryCondition

### nextObservationPoints

加入：

- 等待站回
- 等待量縮
- 等待 10:30 結構確認
- 等待價格驗證
- 等待防守區確認
- 等待警報降級
- 等待營收 / 法說 / 法人資料補齊

**War Room 仍是 read model**，不直接創造策略計畫，只整合 Position Strategy Plan Engine 的輸出。

---

## K. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 進場觀察區不是買進價
- 策略失效觀察價不是自動停損價
- 觀察目標區不是目標價
- 出場觀察區不是賣出價
- takeProfitZone 不是賣出價
- 風險降低觀察不是賣出指令
- 禁碰不是放空建議
- No Touch 是風控提醒，不是賣出指令
- 資料不足就顯示資料不足
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER

---

## L. Future Implementation Gate

### V25 Dynamic Opportunity Pool & Price Verification Spec

- A/B/C/D 股票處理等級
- 主升段觀察池
- 飆股預備隊
- 禁碰池
- 主流產業池
- 價格驗證規則

### V26 Position Strategy Fixture Adapters

- fixture-only plan sample
- War Room UI 顯示 Entry / Defense / Profit Protection examples
- 不接真資料

### V27 Holding Defense Tracker API Contract

- 持股即時防守 API contract
- 成本 / 現價 / 損益 / 防守區 / 失效觀察 / 獲利保護
- 不接 runtime

### V28 Runtime Data Pipeline Spec

- 官方 / 授權 / fallback source validation
- stale guard
- priceVerified
- source conflict downgrade
