# First Authorized Source Dry-Run Monitoring UI

本文件定義 Allen Stock Dashboard 的 **First Authorized Source Dry-Run Monitoring UI**。
V41 把 V40 First Authorized Source Dry-Run API（`/api/portfolio/first-authorized-source-dry-run`）接進 holdings page，作為 single-source / source-neutral connector shape dry-run 的 monitoring preview。

**本階段（V41）是 UI integration / fixture-only / monitoring preview / internal API only。本輪不接真資料、不建立 runtime、不新增 API route、不連 Supabase、不讀 env、不新增 SQL migration、不寫資料、不產生買賣指令、不自動下單。
component / checker 不得硬寫任何具體資料源名稱（single-source / source-neutral connector shape only）。**

相關文件：
[First Authorized Source Dry-Run API](./first-authorized-source-dry-run-api.md)、
[First Authorized Source Dry-Run Spec](./first-authorized-source-dry-run-spec.md)、
[Runtime Pilot Monitoring UI](./runtime-pilot-monitoring-ui.md)、
[Runtime Pilot Implementation Review](./runtime-pilot-implementation-review.md)。

---

## A. Purpose

- V41 目標是把 V40 First Authorized Source Dry-Run API 視覺化。
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

- UI 只能讀 `/api/portfolio/first-authorized-source-dry-run`。
- UI 不得直接讀 raw market data。
- UI 不得直接 fetch 外部 URL。
- UI 不得讀 Supabase。
- UI 不得讀 env key。
- UI 不得建立 runtime connector。
- UI 顯示的是 first authorized source dry-run monitoring preview，不是真正 runtime 狀態。
- UI 顯示的是 fixture data，不是即時資料。
- UI 顯示的是產品體驗預覽，不是投資建議。
- monitoring preview 不是 runtime 狀態。
- fixture data 不是即時資料。

---

## C. UI Placement

- First Authorized Source Dry-Run Monitoring UI 優先放在 `app/holdings/page.tsx`。
- 建議放在 Runtime Pilot Monitoring UI 下方。
- V41 不修改 War Room read model。
- V41 不修改 V40 API route。
- V41 不新增 API route。

---

## D. UI Sections

UI 至少包含：

1. First Authorized Source Dry-Run Monitoring header
2. Fixture-only warning banner
3. API summary cards
4. Decision / dry-run allowed section
5. Source authorization preflight section
6. Source-neutral connector shape section
7. Quote snapshot normalization section
8. Price verification / data quality section
9. Alert projection section
10. Audit event section
11. No-write proof section
12. Kill switch section
13. Rollback section
14. Safety labels footer

Summary cards 至少顯示：

- decision
- dryRunAllowed
- manualSignOffCompleted
- authorizationStatus
- legalStatus
- sourceCategory
- requestMode
- requestPerformed
- rawResponseStored
- normalizedSnapshotProduced
- priceVerified
- highConfidenceConclusionAllowed
- precisePriceZoneAllowed
- projectedAlertLevel
- buySellCommandGenerated
- autoOrderRequested
- productionWriteRequested
- writeAttempted
- databaseWritePerformed
- externalOrderPerformed
- productionWritePerformed
- supabaseConnected
- dryRunCanContinue
- rollbackRequired
- noWriteProofStatus

---

## E. Required Field Display

UI 必須顯示以下欄位或欄位名：

- apiContractVersion
- responseSource
- sourceMode
- generatedAt
- fixtureVersion
- dryRunBundle
- summary
- contractVersion
- decision
- dryRunAllowed
- preflight
- connectorShape
- quoteSnapshot
- priceVerification
- alertProjection
- auditEvent
- noWriteProof
- killSwitch
- rollback
- safetyLabels

Preflight 顯示：sourceDescriptorId、sourceCategory、authorizationStatus、legalStatus、authorizationEvidence、
legalStatusEvidence、rateLimitEvidence、timestampEvidence、freshnessWindowEvidence、conflictThresholdEvidence、
fallbackDowngradeEvidence、reviewerName、reviewedAt、manualSignOffCompleted、preflightDecision。

Connector shape 顯示：connectorId、sourceDescriptorId、sourceCategory、sourcePriority、requestMode、
requestPerformed、rawResponseStored、normalizedSnapshotProduced、rateLimitPolicyApplied、marketSessionChecked、
timestampNormalized、productionWritePerformed、buySellCommandGenerated、autoOrderRequested。

Quote snapshot 顯示：snapshotId、stockId、stockName、sourceDescriptorId、normalizedAt、sourceTimestamp、
marketSessionStatus、currentPrice、previousClose、intradayHigh、intradayLow、volumeRatio、priceVerified、
missingDataFields、requestPerformed。

Price verification 顯示：verificationId、priceVerified、priceVerificationStatus、freshnessStatus、
sourceConflictStatus、dataQualityStatus、sourcePriority、noDangerGuardApplied、highConfidenceConclusionAllowed、
precisePriceZoneAllowed、requiredVerification、missingDataFields、downgradeReason。

Alert projection 顯示：alertProjectionId、projectedState、projectedAlertLevel、triggerType、dataQualityStatus、
noDangerGuardApplied、downgradeReason、notExitSignal、notTradeAdvice、buySellCommandGenerated、autoOrderRequested、
productionWriteRequested。

Audit event 顯示：auditEventId、generatedAt、sourceDescriptorId、connectorId、snapshotId、verificationId、
alertProjectionId、preflightDecision、requestPerformed、supabaseConnected、productionWritePerformed、
buySellCommandGenerated、autoOrderRequested。

No-write proof 顯示：proofId、writeAttempted、databaseWritePerformed、productionWritePerformed、
externalOrderPerformed、supabaseConnected、blockedWriteOperations、proofStatus。

Kill switch 顯示：killSwitchId、enabled、checkedAt、dryRunCanContinue、requiresManualReview。

Rollback 顯示：rollbackId、rollbackRequired、rollbackReason、rollbackStatus、manualReviewRequired。

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
- First Authorized Source Dry-Run monitoring 不是 production。
- First Authorized Source Dry-Run monitoring 不代表可寫資料。
- First Authorized Source Dry-Run monitoring 不代表產生買賣指令。

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
- First Authorized Source Dry-Run Monitoring UI 不是自動交易系統
- fixture data 不是即時資料
- monitoring preview 不是 runtime 狀態
- V41 不接真資料
- V41 不建立 runtime
- V41 不寫資料
- First Authorized Source Dry-Run monitoring 不是 production
- First Authorized Source Dry-Run monitoring 不代表可寫資料
- First Authorized Source Dry-Run monitoring 不代表產生買賣指令
- production write 一律 BLOCKED
- buySellCommandGenerated 必須 false
- autoOrderRequested 必須 false
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- 資料不足就顯示資料不足

---

## I. Future Implementation Gate

### V42 First Real Authorized Source Review

- 只能在 V38 全部 CRITICAL review items PASS 後討論。
- 只能 dry-run。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。

### V43 First Authorized Source Connector Adapter Spec

- 仍須 source-neutral。
- 仍須 no-write。
- 仍須 no buy-sell command。
- 仍須 no auto-order。
- 仍須 kill switch 可停止。
