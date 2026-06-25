# Runtime Pilot Monitoring UI

本文件定義 Allen Stock Dashboard 的 **Runtime Pilot Monitoring UI**（dry-run 監控視覺化）。
V37 把 V36 `GET /api/portfolio/runtime-pilot-dry-run` 的 fixture-only API 接到 UI，
讓 holdings 頁面顯示 Runtime Pilot Monitoring 卡片（dry-run lifecycle / audit event / no-write proof /
kill switch / rollback）。

**本階段（V37）只新增 UI component（`components/runtime-pilot-monitoring.tsx`）、改 `app/holdings/page.tsx`、
新增文件、checker、README、package.json。只讀內部 API、仍是 fixture-only / monitoring preview。
不接真資料、不建立 runtime、不連 Supabase、不發外部 request、不讀 env、不新增 API route、
不修改 V36 API route / builder、不修改 War Room、不新增 SQL migration、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Runtime Pilot Dry-Run API](./runtime-pilot-dry-run-api.md)、
[Runtime Pilot Dry-Run Spec](./runtime-pilot-dry-run-spec.md)、
[Runtime Pilot Readiness UI](./runtime-pilot-readiness-ui.md)。

---

## A. Purpose

- V37 目標是把 V36 Runtime Pilot Dry-Run API 視覺化。
- 本階段仍是 fixture-only / monitoring preview。
- 本階段不接真資料。
- 本階段不建立 runtime。
- 本階段不新增 API route。
- 本階段不連 Supabase。
- 本階段不讀 env key。
- 本階段不新增 SQL migration。
- 本階段不寫資料。
- 本階段不產生買賣指令。
- 本階段不自動下單。

---

## B. Data Source Boundary

- UI 只能讀 `/api/portfolio/runtime-pilot-dry-run`。
- UI 不得直接讀 raw market data。
- UI 不得直接 fetch 外部 URL。
- UI 不得讀 Supabase。
- UI 不得讀 env key。
- UI 不得建立 runtime connector。
- UI 顯示的是 dry-run monitoring preview，不是真正 runtime 狀態。
- UI 顯示的是 fixture data，不是即時資料。
- UI 顯示的是產品體驗預覽，不是投資建議。
- monitoring preview 不是 runtime 狀態。
- fixture data 不是即時資料。

---

## C. UI Placement

- Runtime Pilot Monitoring UI 優先放在 `app/holdings/page.tsx`。
- 建議放在 Runtime Pilot Readiness UI 下方。
- V37 不修改 War Room read model。
- V37 不修改 V36 API route。
- V37 不新增 API route。

---

## D. UI Sections

UI 至少包含：

1. Runtime Pilot Monitoring header
2. Fixture-only warning banner
3. Dry-run summary cards
4. Lifecycle / decision section
5. Source descriptor section
6. Quote snapshot section
7. Price verification section
8. Alert projection section
9. Audit event section
10. No-write proof section
11. Kill switch section
12. Rollback section
13. Safety labels footer

Summary cards 至少顯示：

- lifecycleState
- readinessDecision
- dryRunAllowed
- priceVerified
- highConfidenceConclusionAllowed
- precisePriceZoneAllowed
- buySellCommandGenerated
- autoOrderRequested
- productionWriteRequested
- writeAttempted
- databaseWritePerformed
- externalOrderPerformed
- productionWritePerformed
- supabaseConnected
- killSwitchEnabled
- dryRunCanContinue
- rollbackRequired
- noWriteProofStatus

---

## E. Required Field Display

UI 必須顯示以下欄位或欄位名：apiContractVersion、responseSource、sourceMode、runtimeMode、generatedAt、
fixtureVersion、dryRunBundle、summary、contractVersion、lifecycleState、readinessDecision、dryRunAllowed、
sourceDescriptor、quoteSnapshot、priceVerification、alertProjection、auditEvent、noWriteProof、killSwitch、
rollback、safetyLabels。

各區段欄位：

- Source descriptor：sourceDescriptorId、sourceAuthorizationStatus、sourcePriority、sourceTimestamp、sourceFreshnessWindowSeconds、sourceLegalStatusReviewed、sourceRateLimitReviewed、sourceProvenanceRecorded、requestPerformed。
- Quote snapshot：snapshotId、stockId、stockName、currentPrice、previousClose、intradayHigh、intradayLow、volumeRatio、marketSessionStatus、sourceDescriptorId、priceVerified、requestPerformed。
- Price verification：priceVerified、priceVerificationStatus、freshnessStatus、sourceConflictStatus、dataQualityStatus、highConfidenceConclusionAllowed、requiredVerification、missingDataFields、precisePriceZoneAllowed、noDangerGuardApplied。
- Alert projection：alertProjectionId、projectedState、projectedAlertLevel、triggerType、noDangerGuardApplied、downgradeReason、notExitSignal、notTradeAdvice、buySellCommandGenerated、autoOrderRequested、productionWriteRequested。
- Audit event：auditEventId、generatedAt、noWriteProofId、killSwitchChecked、rollbackRequired、requestPerformed、supabaseConnected、productionWritePerformed、buySellCommandGenerated、autoOrderRequested。
- No-write proof：proofId、writeAttempted、productionWritePerformed、databaseWritePerformed、externalOrderPerformed、supabaseConnected、blockedWriteOperations、evidenceLabels、proofStatus。
- Kill switch：killSwitchId、enabled、checkedAt、affectedRuntime、stopReason、requiresManualReview、dryRunCanContinue。
- Rollback：rollbackId、rollbackRequired、rollbackReason、rollbackTrigger、affectedFeature、rollbackStatus、manualReviewRequired。

---

## F. No-Write / No-Trade Display Rules

- buySellCommandGenerated 必須 false。
- autoOrderRequested 必須 false。
- productionWriteRequested 必須 false。
- writeAttempted 必須 false。
- productionWritePerformed 必須 false。
- databaseWritePerformed 必須 false。
- externalOrderPerformed 必須 false。
- supabaseConnected 必須 false。
- requestPerformed 必須 false。
- production write 一律 BLOCKED。
- Dry-run monitoring 不是 production。
- Dry-run monitoring 不代表可寫資料。
- Dry-run monitoring 不代表產生買賣指令。

---

## G. Data Quality Display Rules

- priceVerified = false 時不得輸出精準價位。
- priceVerified = false 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- fallback-only data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。
- DATA_INSUFFICIENT 不得觸發 DANGER。
- highConfidenceConclusionAllowed 預設 false。
- noDangerGuardApplied 必須可追蹤。

---

## H. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Runtime Pilot Monitoring UI 不是自動交易系統
- fixture data 不是即時資料
- monitoring preview 不是 runtime 狀態
- V37 不接真資料
- V37 不建立 runtime
- V37 不寫資料
- Dry-run monitoring 不是 production
- Dry-run monitoring 不代表可寫資料
- Dry-run monitoring 不代表產生買賣指令
- production write 一律 BLOCKED
- buySellCommandGenerated 必須 false
- autoOrderRequested 必須 false
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- priceVerified = false 時不得輸出精準價位
- 資料不足就顯示資料不足

---

## I. Future Implementation Gate

### V38 Runtime Pilot Implementation Review

- 只能在 V33 readiness critical gates 全部 PASS 後討論。
- 只能 dry-run。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。

### V39 First Authorized Source Dry-Run

- 僅能接一個低風險官方 / 授權資料源。
- 僅做 price verification 與 data quality。
- 預設 dry-run。
- 不寫 production data。
- 不產生買賣指令。
