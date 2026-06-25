# Runtime Pilot Dry-Run Spec

本文件定義 Allen Stock Dashboard 的 **Runtime Pilot Dry-Run Spec**（未來 Runtime Pilot dry-run 行為規格）。
V35 把「啟動 dry-run 後到底做什麼、怎麼驗證價格、怎麼 audit、怎麼證明 no-write、怎麼被 kill switch /
rollback 擋下」收斂成正式 contract，作為 V36 真正接資料前最後一份行為治理文件。

**本階段（V35）是 spec-only / contract-only / dry-run behavior design only。本輪名字包含 Dry-Run，但仍然只是
spec-only，不得真的啟動 runtime。新增文件、use-case contract、pure spec builder、checker、README、package.json。
不接真資料、不建立 runtime、不建立 quote polling / scheduler / webhook / broker connector / exchange connector、
不連 Supabase、不讀 env、不新增 API route、不新增 UI、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Runtime Data Pipeline Spec](./runtime-data-pipeline-spec.md)、
[Runtime Pilot Readiness Checklist](./runtime-pilot-readiness-checklist.md)、
[Runtime Pilot Readiness UI](./runtime-pilot-readiness-ui.md)、
[Intraday Holding Defense Runtime Spec](./intraday-holding-defense-runtime-spec.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Runtime Pilot Dry-Run Spec。
- V35 目標是定義未來 Runtime Pilot dry-run 的行為規格。
- V35 是 spec-only / contract-only。
- V35 不接真資料。
- V35 不建立 runtime。
- V35 不建立 quote polling。
- V35 不建立 scheduler。
- V35 不建立 webhook。
- V35 不建立 broker connector。
- V35 不建立 exchange connector。
- V35 不連 Supabase。
- V35 不讀 env key。
- V35 不新增 API route。
- V35 不新增 UI。
- V35 不寫資料。
- V35 不產生買賣指令。
- V35 不自動下單。

---

## B. Relationship to Previous Versions

- V28 定義 Runtime Data Pipeline governance。
- V30 定義 Intraday Holding Defense Runtime Spec。
- V31 建立 Intraday Defense Fixture API。
- V32 建立 Intraday Defense UI Integration。
- V33 定義 Runtime Pilot Readiness Checklist。
- V34 建立 Runtime Pilot Readiness UI。
- V35 定義 Runtime Pilot Dry-Run Spec。
- V35 不建立 Runtime Pilot。
- V36 才能在 readiness critical gates 全部 PASS 後討論 dry-run implementation。

---

## C. Dry-Run Core Principle

Dry-run 不是 production。

Dry-run 只能：

- read-only
- no-write
- no production write
- no buy/sell command
- no auto order
- no direct trading action
- no high-confidence conclusion when data quality is insufficient
- no DANGER when price is not verified
- no DANGER when stale
- no DANGER when source conflict
- no DANGER when fallback-only

Dry-run 必須：

- respect readiness gates
- respect kill switch
- respect rollback plan
- produce audit events
- produce no-write proof
- produce data quality decision
- produce traceable source metadata
- downgrade when data quality is insufficient

---

## D. Dry-Run Lifecycle

定義 lifecycle states（對應 contract 的 `RuntimePilotDryRunLifecycleState`）：

1. `DRY_RUN_NOT_ALLOWED`
2. `DRY_RUN_READY_FOR_REVIEW`
3. `DRY_RUN_ALLOWED`
4. `DRY_RUN_INITIALIZING`
5. `DRY_RUN_OBSERVING`
6. `DRY_RUN_DATA_QUALITY_BLOCKED`
7. `DRY_RUN_SOURCE_CONFLICT_BLOCKED`
8. `DRY_RUN_STALE_DATA_BLOCKED`
9. `DRY_RUN_FALLBACK_ONLY_BLOCKED`
10. `DRY_RUN_STOPPED_BY_KILL_SWITCH`
11. `DRY_RUN_ROLLBACK_REQUIRED`
12. `DRY_RUN_COMPLETED_WITH_NO_WRITE`

規則：

- default 必須是 DRY_RUN_NOT_ALLOWED。
- readiness 未全綠不得進 DRY_RUN_ALLOWED。
- kill switch enabled 必須停止 dry-run。
- source conflict / stale / fallback-only 必須阻擋 DANGER。
- completed with no write 才是成功 dry-run。
- 任何 lifecycle state 都不得產生買賣指令。

---

## E. Dry-Run Input Boundary

dry-run input shape 來源邊界：

- sourceDescriptor
- sourceAuthorizationStatus
- sourcePriority
- sourceTimestamp
- sourceFreshnessWindow
- rawQuoteSnapshot
- normalizedQuoteSnapshot
- previousClose
- intradayHigh
- intradayLow
- currentPrice
- volumeRatio
- marketSessionStatus
- readinessDecision
- killSwitchState

明確邊界：

- V35 不接任何真實 source。
- V35 不硬寫任何具體資料源 runtime。
- V35 不讀 external API。
- V35 不讀 broker API。
- V35 不讀 exchange API。
- V35 不讀 Supabase。
- V35 不讀 env key。

---

## F. Price Verification Rules

對應 contract 的 `RuntimePilotDryRunPriceVerification`：

- priceVerified
- priceVerificationStatus
- freshnessStatus
- sourceConflictStatus
- sourcePriority
- dataQualityStatus
- highConfidenceConclusionAllowed
- requiredVerification
- missingDataFields

規則：

- priceVerified = false 時不得輸出精準價位。
- priceVerified = false 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- fallback-only data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。
- DATA_INSUFFICIENT 不得觸發 DANGER。
- highConfidenceConclusionAllowed 預設 false。

---

## G. Alert Projection Rules

dry-run alert projection（對應 `RuntimePilotDryRunAlertProjection`）：

- alertProjectionId
- stockId
- stockName
- projectedState
- projectedAlertLevel
- triggerType
- priceVerified
- freshnessStatus
- sourceConflictStatus
- sourcePriority
- dataQualityStatus
- noDangerGuardApplied
- downgradeReason
- notExitSignal
- notTradeAdvice
- buySellCommandGenerated
- autoOrderRequested
- productionWriteRequested

規則：

- buySellCommandGenerated 必須 false。
- autoOrderRequested 必須 false。
- productionWriteRequested 必須 false。
- notExitSignal 必須 true。
- notTradeAdvice 必須 true。
- noDangerGuardApplied 必須可追蹤。
- projection 不是交易指令。
- projection 不是正式投資建議。

---

## H. Audit Event Rules

dry-run audit event（對應 `RuntimePilotDryRunAuditEvent`）：

- auditEventId
- generatedAt
- lifecycleState
- sourceDescriptorId
- stockId
- readinessDecision
- priceVerificationStatus
- freshnessStatus
- sourceConflictStatus
- dataQualityStatus
- projectedAlertLevel
- noWriteProofId
- killSwitchChecked
- rollbackRequired
- requestPerformed
- supabaseConnected
- productionWritePerformed
- buySellCommandGenerated
- autoOrderRequested

規則：

- 每次 dry-run iteration 必須產生 audit event。
- audit event 不得寫 production data。
- V35 不建立任何真正 audit storage。
- V35 只定義 shape。
- requestPerformed = false。
- supabaseConnected = false。
- productionWritePerformed = false。
- buySellCommandGenerated = false。
- autoOrderRequested = false。

---

## I. No-Write Proof Rules

no-write proof（對應 `RuntimePilotDryRunNoWriteProof`）：

- proofId
- generatedAt
- writeAttempted
- productionWritePerformed
- databaseWritePerformed
- externalOrderPerformed
- supabaseConnected
- blockedWriteOperations
- evidenceLabels
- proofStatus

規則：

- writeAttempted 必須 false。
- productionWritePerformed 必須 false。
- databaseWritePerformed 必須 false。
- externalOrderPerformed 必須 false。
- supabaseConnected 必須 false。
- proofStatus 必須是 PASS 或 BLOCKED。
- V35 不建立任何真實 write proof storage。

---

## J. Kill Switch Rules

對應 `RuntimePilotDryRunKillSwitch`：

- killSwitchId
- enabled
- checkedAt
- affectedRuntime
- stopReason
- requiresManualReview
- dryRunCanContinue

規則：

- kill switch enabled → dryRunCanContinue = false。
- kill switch 未確認 → 不得啟動 dry-run。
- kill switch 不是 UI 裝飾，必須是 dry-run gate。
- V35 只定義 shape，不建立真正 kill switch runtime。

---

## K. Rollback Rules

對應 `RuntimePilotDryRunRollback`：

- rollbackId
- rollbackRequired
- rollbackReason
- rollbackTrigger
- affectedFeature
- rollbackStatus
- manualReviewRequired

規則：

- rollback required 時不得繼續 dry-run。
- rollback plan 未確認不得啟動 dry-run。
- V35 只定義 shape，不建立真正 rollback runtime。

---

## L. Dry-Run Output Bundle

output bundle（對應 `RuntimePilotDryRunBundle`）應包含：

- contractVersion
- sourceMode
- runtimeMode
- generatedAt
- lifecycleState
- readinessDecision
- dryRunAllowed
- quoteSnapshot
- priceVerification
- alertProjection
- auditEvent
- noWriteProof
- killSwitch
- rollback
- safetyLabels
- requestPerformed
- supabaseConnected
- productionWritePerformed

預設：

- contractVersion = V35
- sourceMode = spec_only
- runtimeMode = dry_run_spec
- lifecycleState = DRY_RUN_NOT_ALLOWED
- dryRunAllowed = false
- requestPerformed = false
- supabaseConnected = false
- productionWritePerformed = false

---

## M. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Runtime Pilot Dry-Run Spec 不是自動交易系統
- V35 不接真資料
- V35 不建立 runtime
- V35 不寫資料
- Dry-run 不是 production
- Dry-run 不代表可寫資料
- Dry-run 不代表產生買賣指令
- production write 一律 BLOCKED
- buySellCommandGenerated 必須 false
- autoOrderRequested 必須 false
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- priceVerified = false 時不得輸出精準價位
- 資料不足就顯示資料不足

---

## N. Future Implementation Gate

### V36 Runtime Pilot Dry-Run API

- 只能在 V33 readiness critical gates 全部 PASS 後討論。
- 仍只能 dry-run。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。

### V37 Runtime Pilot Monitoring

- 顯示 dry-run lifecycle。
- 顯示 audit event。
- 顯示 no-write proof。
- 顯示 kill switch。
- 仍不得寫 production data。
