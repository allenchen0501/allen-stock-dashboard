# Dynamic Opportunity Pool & Price Verification Spec

本文件定義 Allen Stock Dashboard 的 **Dynamic Opportunity Pool & Price Verification Spec**
（動態機會池與價格驗證規格）。V25 把 Allen 之前 V9 規格中好的部分——主升段觀察池、飆股預備隊、
禁碰池、主流產業池、A/B/C/D 股票處理等級與價格驗證規則——正式整合進目前 V24 架構，
為 Position Strategy Plan 提供 `priceVerified` 與 pool classification。

**本階段（V25）只新增 `docs/dynamic-opportunity-price-verification-spec.md`、
`use-cases/opportunity-pool/dynamic-opportunity-pool-contract.ts`、checker、README、package.json。
不接真資料、不連 Supabase、不新增 API route、不新增 UI、不建立 runtime scanner、
不建立 price verification runtime、不發外部 request、不讀 env、不新增 SQL migration、
不寫入資料、不產生買賣指令、不自動下單。**

相關文件：
[Position Strategy Plan Spec](./position-strategy-plan-spec.md)、
[Technical + Risk Reward Strategy Spec](./technical-risk-reward-strategy-spec.md)、
[Intraday Risk Crisis Alert Spec](./intraday-risk-crisis-alert-spec.md)、
[Institutional Research Center Spec](./institutional-research-center-spec.md)、
[War Room Read Model Contract](./war-room-read-model-contract.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Dynamic Opportunity Pool & Price Verification Spec。
- 目的不是固定追蹤少數股票，而是每日動態找出符合主升段、技術轉強、籌碼轉強、基本面支撐、高風報比的股票。
- 本規格整合 V9 的好處，但不取代目前 V24 架構。
- 本階段為 spec-only。
- 不接真資料。
- 不連 Supabase。
- 不新增 API route。
- 不新增 UI。
- 不建立 runtime scanner。
- 不建立 price verification runtime。
- 不產生買賣指令。
- 不自動下單。

---

## B. Core Philosophy

Allen Stock Dashboard 追蹤的是「條件」，不是固定股票。

股票會變。主流會變。條件才具有持續性。

系統目標是：

- 自動搜尋高風報比機會
- 自動建立主升段觀察池
- 自動建立飆股預備隊
- 自動建立禁碰池
- 自動建立主流產業池
- 自動驗證價格
- 自動標示資料品質
- 自動降級 stale / fallback / source conflict
- 為 Position Strategy Plan 提供 priceVerified 與 pool classification

但系統不是（以下皆為否定語義）：

- 不是自動交易系統
- 不是自動下單系統
- 不直接產生買賣指令
- 不是保證獲利模型

---

## C. Pool Types

定義以下八個池（對應 contract 的 `DynamicOpportunityPoolType`）：

1. `MAIN_UPTREND_POOL`
2. `BREAKOUT_PREP_POOL`
3. `HOLDING_PRIORITY_POOL`
4. `DAILY_WATCH_POOL`
5. `LOW_COVERAGE_POOL`
6. `NO_TOUCH_POOL`
7. `SECTOR_ROTATION_POOL`
8. `DATA_INSUFFICIENT_POOL`

### MAIN_UPTREND_POOL

主升段觀察池。每日動態篩選符合基本面、技術面、籌碼面與風報比條件的股票。

### BREAKOUT_PREP_POOL

飆股預備隊。用於即將突破、即將爆量、即將主升但尚未確認的股票。

### HOLDING_PRIORITY_POOL

持股優先監控池。使用者實際持有之股票，最高優先追蹤與價格驗證。

### DAILY_WATCH_POOL

當日觀察池。使用者臨時詢問或當日市場異動股票。

### LOW_COVERAGE_POOL

低覆蓋池。冷門股、興櫃股、資料不足、流動性不足、來源不足的股票。

### NO_TOUCH_POOL

禁碰池。高風險、不適合追蹤或需要避開的股票。

### SECTOR_ROTATION_POOL

主流產業池。追蹤 AI、ASIC、光通訊、CPO、PCB、HBM、記憶體、機器人、低軌衛星等資金輪動。

### DATA_INSUFFICIENT_POOL

資料不足池。價格未驗證、來源衝突、資料過舊、資料欄位缺漏時使用。

---

## D. A/B/C/D Processing Tiers

定義 A/B/C/D 股票處理等級（對應 contract 的 `OpportunityProcessingTier`）。

### A 級：Dynamic Main Uptrend Candidate（`A_MAIN_UPTREND`）

來源：

- 基本面
- 技術面
- 籌碼面
- 風報比
- 產業輪動

條件符合即列入。條件不符合即移除。每日重算。

可進入：

- MAIN_UPTREND_POOL
- BREAKOUT_PREP_POOL
- SECTOR_ROTATION_POOL

注意：A 級不是買進清單。A 級只是高優先研究與價格驗證候選。

### B 級：Holding Priority（`B_HOLDING_PRIORITY`）

使用者實際持有股票。

規則：

- 最高優先價格驗證
- 最高優先風險追蹤
- 盤前 / 盤中 / 盤後均優先更新
- 對接未來 Holding Defense Tracker API

注意：B 級不是續抱指令。B 級只是持股優先監控等級。

### C 級：Daily Watch（`C_DAILY_WATCH`）

使用者臨時詢問、當日市場強勢股、新聞異動股。

規則：

- 先主動驗證價格
- 驗證成功才可輸出精準觀察區
- 驗證失敗只能輸出條件式方向分析
- 若無資料才要求使用者提供圖片或更多資料

### D 級：Low Coverage / Special Case（`D_LOW_COVERAGE`）

冷門股、興櫃股、低流動性、資料不足、特殊個股。

規則：

- 若驗證失敗，禁止輸出精準價位
- 禁止輸出 entryObservationZone / invalidLevel / targetObservationZone / riskRewardRatio
- 僅能輸出方向性分析
- 必須標示 DATA_INSUFFICIENT / NOT_COVERED / PRICE_NOT_VERIFIED

---

## E. Price Verification Source Priority

正式資料源優先順序（對應 contract 的 `PriceSourcePriority`，僅為規劃說明，本階段不接 runtime）：

1. TWSE / TPEx official or licensed feed → `OFFICIAL_OR_LICENSED`
2. Broker API / authorized quote provider → `BROKER_OR_AUTHORIZED`
3. Validated secondary source：Yahoo / FinMind / TradingView / yfinance-like → `VALIDATED_SECONDARY`
4. Fallback cache → `FALLBACK_CACHE` / manual verified source → `MANUAL_VERIFIED`
5. 無任何來源 → `NOT_AVAILABLE`

規則：

- official / licensed source 優先於 secondary source。
- secondary source 不得單獨產生高信心結論。
- fallback-only data 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- source conflict 時降級為 WARNING / DATA_INSUFFICIENT。
- Yahoo 不得作為唯一正式來源。
- priceSource 必須被記錄。
- priceCheckedAt 必須被記錄。
- priceFreshness 必須被記錄。
- sourceConfidence 必須被記錄。
- 資料不足就顯示資料不足。

> 註：Yahoo / FinMind / TradingView / yfinance-like 一律歸類為 `VALIDATED_SECONDARY`（次級來源），
> 只能驗證輔助，不能單獨成為正式唯一來源，也不能單獨產生高信心結論。

---

## F. Price Verification Rules

定義 `priceVerified` 判定規則，對應 contract 的 `OpportunityPriceVerificationStatus`（即 `PriceVerificationStatus` 語義）。

### VERIFIED

條件：

- 官方 / 授權 / 已驗證 secondary source 成功
- priceCheckedAt 未過期
- source conflict 未發生
- market session 合理
- priceFreshness 合格

允許：

- 輸出精準 entryObservationZone
- 輸出 defenseZone
- 輸出 invalidLevel
- 輸出 takeProfitZone
- 輸出 targetObservationZone
- 輸出 riskRewardRatio

### NOT_VERIFIED

條件：

- 無法取得價格
- 價格來源不可用
- 查詢失敗
- 使用者未提供足夠資料

限制：

- 不得輸出精準價位
- 不得輸出 riskRewardRatio
- 只能輸出條件式方向分析

### STALE

條件：

- priceCheckedAt 過期
- 資料非當前 session
- cache 超過允許時間

限制：

- 不得觸發 DANGER
- 不得輸出高信心結論
- 精準價位需降級

### SOURCE_CONFLICT

條件：

- 多來源價格差異超過容許範圍
- 成交價 / bid / ask / last price 不一致且無法合理解釋
- official source 與 secondary source 衝突

限制：

- 降級為 WARNING / DATA_INSUFFICIENT
- 不得輸出高信心結論
- 不得觸發 DANGER

### FALLBACK_ONLY

條件：

- 只有 cache / fallback / manual data
- 沒有 official / licensed / validated secondary source

限制：

- 不得觸發 DANGER
- 不得輸出高信心結論
- 不得輸出精準價位，除非明確標示 fallback-only 並降級為 observation only

### NOT_COVERED

條件：

- 興櫃 / 冷門 / 特殊個股
- 系統無資料源覆蓋
- 股票代號無法確認

限制：

- 只能輸出方向性分析
- 不得輸出精準價位
- 不得輸出 riskRewardRatio

---

## G. Main Uptrend Screening Logic

定義主升段觀察池（MAIN_UPTREND_POOL）篩選邏輯。

### 第一層：基本面

條件：

- 近三個月營收 MoM > 0
- 近三個月營收 YoY > 15%
- 基本面資料來源明確
- 若營收資料不足，降級 DATA_INSUFFICIENT

### 第二層：法人 / 籌碼

條件：

- 近 20 日法人累積買超
- 外資連買
- 投信連買
- 主力建倉
- 籌碼轉強
- 若籌碼來源不足，降級 WARNING / DATA_INSUFFICIENT

### 第三層：技術面（至少符合三項）

- KD / KDJ 低檔改善
- MACD histogram 收斂或翻紅
- 5MA / 10MA / 20MA 改善
- 站回月線
- 扣三低
- 量縮回測
- 爆量轉強
- 支撐區明確

### 第四層：風報比

- 風險控制 <= 5%
- 預估獲利觀察空間 >= 15%
- riskRewardRatio >= 1:3
- priceVerified = true
- supportZone / invalidLevel / targetObservationZone 皆可驗證

安全語言：

- riskRewardRatio 是觀察參考，不是獲利保證。
- 主升段候選不是買進清單。
- 高風報比不是買進指令。

---

## H. Breakout Prep Pool Logic

飆股預備隊（BREAKOUT_PREP_POOL）條件：

- 即將突破壓力
- 即將爆量
- 量縮後轉強
- KD / MACD 提前改善
- 族群資金流入
- 法人 / 主力籌碼轉強
- priceVerified = true 或 WARNING

輸出：

- breakoutSetupReason
- confirmationCondition
- noChaseZone
- invalidLevel
- dataQualityStatus

安全語言：

- 飆股預備隊不是追價清單。
- breakout setup 不是買進訊號。
- noChaseZone 不是放空建議。

---

## I. No Touch Pool Logic

禁碰池（NO_TOUCH_POOL）條件：

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
- requiredRecoveryCondition
- noTouchDurationHint
- notExitSignal
- notTradeAdvice

安全語言：

- 禁碰池是風控提醒，不是賣出指令。
- No Touch 不是放空建議。

---

## J. Sector Rotation Pool Logic

主流產業池（SECTOR_ROTATION_POOL）：

- AI
- ASIC
- 光通訊
- CPO
- PCB
- HBM
- 記憶體
- 機器人
- 低軌衛星
- 散熱 / 液冷
- CoWoS
- 高速傳輸

判斷條件：

- 族群漲幅
- 族群成交量
- 族群上漲家數
- 族群龍頭強度
- 法人買超集中度
- 新聞 / 法說 / 產業催化
- 主流產業資金輪動

輸出：

- sectorName
- sectorStatus
- rotationStrength
- leadingStocks
- riskWarnings
- dataQualityStatus

安全語言：

- 主流產業池不是買進清單。
- 族群轉強仍需價格驗證與個股風報比確認。

---

## K. Dynamic Pool Output Rules

每一個 pool item（`DynamicOpportunityPoolItem`）必須包含：

- stockId
- stockName
- poolType
- processingTier
- priceVerified
- priceVerificationStatus
- priceSource
- priceCheckedAt
- priceFreshness
- dataQualityStatus
- sourceConfidence
- screeningScore
- screeningReasons
- warningReasons
- missingDataFields
- notEntrySignal
- notExitSignal
- notTradeAdvice

若 `priceVerified = false`：

- entryObservationZone 必須為 null
- invalidLevel 必須為 null
- targetObservationZone 必須為 null
- riskRewardRatio 必須為 null
- isPrecisePriceAllowed = false

對應 contract 的精準價位 gate：`entryObservationZoneAllowed`、`invalidLevelAllowed`、
`targetObservationZoneAllowed`、`riskRewardCalculationAllowed` 在 `priceVerified = false` 時皆必須為 false。

---

## L. War Room Integration

War Room 七大區塊未來接入 Dynamic Opportunity Pool。

### marketStatusLight

加入：

- sectorRotationStatus
- dynamicOpportunityCount
- noTouchCount

### realtimeAlerts

加入：

- priceVerificationDowngrade
- sourceConflictAlert
- staleDataAlert

### portfolioRiskRadar

接入：

- HOLDING_PRIORITY_POOL
- B 級持股優先監控

### researchTopPicks

接入：

- MAIN_UPTREND_POOL research-qualified candidates
- 但 TOP5 Research 不等於 Entry Observation Plan

### technicalRiskRewardCandidates

接入：

- MAIN_UPTREND_POOL
- BREAKOUT_PREP_POOL
- high riskRewardRatio candidates

### avoidList

接入：

- NO_TOUCH_POOL
- DATA_INSUFFICIENT_POOL
- source conflict / stale / fail items

### nextObservationPoints

加入：

- 等待價格驗證
- 等待 source conflict 解決
- 等待 stale data 更新
- 等待站回
- 等待量縮
- 等待 10:30 結構確認
- 等待防守區確認
- 等待警報降級

**War Room 仍是 read model**，不直接創造 pool item，只整合 Dynamic Opportunity Pool Engine 的輸出。

---

## M. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 主升段候選不是買進清單
- 飆股預備隊不是追價清單
- 禁碰池是風控提醒，不是賣出指令
- 主流產業池不是買進清單
- 高風報比不是買進指令
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 時降級為 WARNING / DATA_INSUFFICIENT
- 資料不足就顯示資料不足

---

## N. Future Implementation Gate

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

### V29 Runtime Pilot

- 先接低風險官方 / 授權資料源
- 僅做價格驗證與資料品質
- 不產生買賣指令
