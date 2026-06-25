# Holding Defense Tracker UI Integration

本文件定義 Allen Stock Dashboard 的 **Holding Defense Tracker UI Integration**（持股防守追蹤 UI 整合）。
V29 把 V27 `GET /api/portfolio/holding-defense` 的 fixture-only API 接到 UI，讓 holdings 頁面顯示持股防守追蹤卡。

**本階段（V29）只新增 UI component（`components/holding-defense-tracker.tsx`）、改 `app/holdings/page.tsx`、
新增文件、checker、README、package.json。只讀內部 API、仍是 fixture-only。
不接真資料、不建立 runtime、不連 Supabase、不發外部 request、不讀 env、不新增 API route、
不修改 Holding Defense API route、不修改 War Room、不新增 SQL migration、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Holding Defense Tracker API Contract](./holding-defense-tracker-api-contract.md)、
[Runtime Data Pipeline Spec](./runtime-data-pipeline-spec.md)、
[Position Strategy Plan Spec](./position-strategy-plan-spec.md)、
[War Room UI Polish](./war-room-ui-polish.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Holding Defense Tracker UI Integration。
- V29 目標是把 V27 `/api/portfolio/holding-defense` fixture-only API 接到 UI。
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

- UI 只能讀 `/api/portfolio/holding-defense`。
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

- Holding Defense Tracker 優先放在 `app/holdings/page.tsx`。
- 它是持股頁面的一部分，用於展示持股防守追蹤。
- 若 Dashboard 首頁需要摘要，後續版本可加入 compact summary。
- V29 不修改 War Room read model。
- V29 不修改 War Room builder。
- V29 不修改 Holding Defense API route。

---

## D. UI Sections

UI 至少包含：

1. Holding Defense Tracker header
2. Fixture-only warning banner
3. Summary cards
4. Tracker state distribution
5. Holding defense item cards
6. Data quality / price verification section
7. Safety labels footer

Summary cards 至少顯示：

- totalHoldings
- normalObservationCount
- defenseZoneNearCount
- defenseZoneBrokenCount
- profitProtectionActiveCount
- riskReductionActiveCount
- dataInsufficientCount
- priceNotVerifiedCount
- sourceConflictCount
- staleDataCount
- highConfidenceConclusionAllowed

---

## E. Tracker Item Card Fields

每張 item card 至少顯示：

- stockId
- stockName
- trackerState
- alertLevel
- holdingState
- holdingActionState
- holdingImpact
- priceVerified
- priceVerificationStatus
- dataQualityStatus
- costBasis
- currentPrice
- unrealizedProfitLoss
- unrealizedProfitLossPercent
- peakUnrealizedProfitLossPercent
- drawdownFromPeakPercent
- defenseZone
- invalidLevel
- profitProtectionZone
- takeProfitZone
- riskReduceZone
- exitObservationZone
- trendBreakWarning
- shortAttackRisk
- supportBreakStatus
- maBreakStatus
- volumeBreakdownStatus
- riskReduceObservation
- waitForReclaimCondition
- nextObservation
- warnings
- missingDataFields
- requiredVerification
- notExitSignal
- notTradeAdvice
- highConfidenceConclusionAllowed

---

## F. Zone Display Rules

如果 zone 有資料，顯示：

- label
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
- 策略失效觀察價不是自動停損價
- takeProfitZone 不是賣出價
- 出場觀察區不是賣出價
- 風險降低觀察不是賣出指令
- priceVerified = false 時不得輸出精準價位

---

## G. State Display Rules

State 顯示語言：

- NORMAL_OBSERVATION：正常觀察
- DEFENSE_ZONE_NEAR：接近防守區
- DEFENSE_ZONE_BROKEN：防守區破壞觀察
- PROFIT_PROTECTION_ACTIVE：獲利保護觀察
- RISK_REDUCTION_ACTIVE：風險降低觀察
- DATA_INSUFFICIENT：資料不足
- PRICE_NOT_VERIFIED：價格未驗證
- SOURCE_CONFLICT：來源衝突
- STALE_DATA：資料過舊

注意：

- DEFENSE_ZONE_BROKEN 不是自動出場。
- RISK_REDUCTION_ACTIVE 不是賣出指令。
- PROFIT_PROTECTION_ACTIVE 不是強制出場。
- DATA_INSUFFICIENT 不得輸出高信心結論。

---

## H. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Holding Defense Tracker UI 不是自動交易系統
- fixture data 不是即時資料
- fixture data 不是投資建議
- 防守區是防守觀察，不是自動出場
- 策略失效觀察價不是自動停損價
- takeProfitZone 不是賣出價
- 出場觀察區不是賣出價
- 風險降低觀察不是賣出指令
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 時降級為 WARNING / DATA_INSUFFICIENT
- 資料不足就顯示資料不足

---

## I. Future Implementation Gate

### V30 Runtime Pilot

- 先接低風險官方 / 授權資料源
- 僅做 price verification 與 data quality
- 預設 dry-run
- 不寫 production data
- 不產生買賣指令

### V31 Intraday Holding Defense Runtime

- 盤中持股追蹤
- 急跌 / 防守區 / 趨勢破壞
- cooldown / dedup
- fallback-only 不得觸發 DANGER
- stale data 不得觸發 DANGER
