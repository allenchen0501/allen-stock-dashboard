# First Authorized Source Dry-Run Spec

本文件定義 Allen Stock Dashboard 的 **First Authorized Source Dry-Run Spec**（第一個授權資料源 dry-run 的 source-neutral 行為規格）。
V39 把「review 全綠 + 人工簽核後，第一個授權資料源 dry-run 到底怎麼跑」收斂成正式 contract，作為 V40 的前置規格。

**本階段（V39）是 spec-only / contract-only / source-neutral dry-run design only。本輪不得建立真正資料源連線。
新增文件、use-case contract、pure spec builder、checker、README、package.json。
不接真資料、不建立 runtime、不建立 quote polling / scheduler / webhook / connector、不連 Supabase、不讀 env、
不新增 API route、不新增 UI、不寫資料、不產生買賣指令、不自動下單。
contract / builder / checker 不得硬寫任何具體資料源名稱，只能用「官方 / 授權資料源」這種抽象描述與抽象類別。**

相關文件：
[Runtime Data Pipeline Spec](./runtime-data-pipeline-spec.md)、
[Runtime Pilot Readiness Checklist](./runtime-pilot-readiness-checklist.md)、
[Runtime Pilot Dry-Run Spec](./runtime-pilot-dry-run-spec.md)、
[Runtime Pilot Implementation Review](./runtime-pilot-implementation-review.md)、
[Runtime Pilot Monitoring UI](./runtime-pilot-monitoring-ui.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 First Authorized Source Dry-Run Spec。
- V39 目標是定義未來第一個授權資料源 dry-run 的行為規格。
- V39 是 spec-only / contract-only。
- V39 不接真資料。
- V39 不建立 runtime。
- V39 不建立 quote polling。
- V39 不建立 scheduler。
- V39 不建立 webhook。
- V39 不建立 broker connector。
- V39 不建立 exchange connector。
- V39 不連 Supabase。
- V39 不讀 env key。
- V39 不新增 API route。
- V39 不新增 UI。
- V39 不寫資料。
- V39 不產生買賣指令。
- V39 不自動下單。

---

## B. Relationship to Previous Versions

- V33 定義 Runtime Pilot Readiness Checklist。
- V34 建立 Runtime Pilot Readiness UI。
- V35 定義 Runtime Pilot Dry-Run Spec。
- V36 建立 Runtime Pilot Dry-Run API。
- V37 建立 Runtime Pilot Monitoring UI。
- V38 定義 Runtime Pilot Implementation Review。
- V39 定義 First Authorized Source Dry-Run Spec。
- V39 不建立真正資料源連線。
- V40 才可討論 First Authorized Source Dry-Run API。
- 真正接資料必須等 V38 全部 CRITICAL review items PASS 且 manual sign-off 完成。

---

## C. Core Principle

第一個授權資料源 dry-run 仍然不是 production。

即使未來 V40 / V41 進入 dry-run，也只能：

- single-source
- authorized-source only
- dry-run only
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

---

## D. Dry-Run Scope

scope：

- source-neutral connector shape
- source authorization preflight
- source legal status evidence
- source rate limit evidence
- source timestamp availability
- market session handling
- quote snapshot normalization
- price verification
- data quality decision
- alert projection
- audit event
- no-write proof
- kill switch
- rollback

明確邊界：

- 本階段只允許一個授權資料源（single-source）。
- 本階段不得混用多個資料源。
- 本階段不得啟用 production write。
- 本階段不得自動下單。
- 本階段不得產生買賣指令。

---

## E. Source Authorization Preflight

對應 contract 的 `FirstAuthorizedSourcePreflight`：

- sourceDescriptorId
- sourceCategory
- authorizationStatus
- legalStatus
- authorizationEvidence
- legalStatusEvidence
- rateLimitEvidence
- timestampEvidence
- freshnessWindowEvidence
- conflictThresholdEvidence
- fallbackDowngradeEvidence
- reviewerName
- reviewedAt
- manualSignOffCompleted
- preflightDecision

規則：

- authorizationStatus 未 PASS → NO_GO。
- legalStatus 未 PASS → NO_GO。
- rateLimitEvidence 不足 → BLOCKED。
- manualSignOffCompleted = false → NO_GO。
- sourceCategory 必須是抽象類別，不得是具體資料源名稱。
- fallback-only data 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。

---

## F. Source-Neutral Connector Shape

未來 connector 只能輸出 abstract shape（對應 `FirstAuthorizedSourceConnectorShape`）：

- connectorId
- sourceDescriptorId
- sourceCategory
- sourcePriority
- requestMode
- requestPerformed
- rawResponseStored
- normalizedSnapshotProduced
- rateLimitPolicyApplied
- marketSessionChecked
- timestampNormalized
- productionWritePerformed
- buySellCommandGenerated
- autoOrderRequested

規則：

- requestMode 預設 dry_run。
- requestPerformed 在 V39 builder 必須 false。
- rawResponseStored 必須 false。
- productionWritePerformed 必須 false。
- buySellCommandGenerated 必須 false。
- autoOrderRequested 必須 false。
- V39 不建立 connector runtime。

---

## G. Quote Snapshot Normalization

對應 `FirstAuthorizedSourceQuoteSnapshot`：

- snapshotId
- stockId
- stockName
- sourceDescriptorId
- normalizedAt
- sourceTimestamp
- marketSessionStatus
- currentPrice
- previousClose
- intradayHigh
- intradayLow
- volumeRatio
- priceVerified
- missingDataFields
- requestPerformed

規則：

- V39 不產生真實 snapshot。
- currentPrice 預設 null。
- priceVerified 預設 false。
- requestPerformed 預設 false。
- priceVerified = false 時不得輸出精準價位。

---

## H. Price Verification / Data Quality Gate

對應 `FirstAuthorizedSourcePriceVerificationGate`：

- verificationId
- priceVerified
- priceVerificationStatus
- freshnessStatus
- sourceConflictStatus
- dataQualityStatus
- sourcePriority
- noDangerGuardApplied
- highConfidenceConclusionAllowed
- precisePriceZoneAllowed
- requiredVerification
- missingDataFields
- downgradeReason

規則：

- priceVerified = false 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- fallback-only data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。
- DATA_INSUFFICIENT 不得觸發 DANGER。
- highConfidenceConclusionAllowed 預設 false。
- precisePriceZoneAllowed 預設 false。
- noDangerGuardApplied 必須 true。

---

## I. Alert Projection

對應 `FirstAuthorizedSourceAlertProjection`：

- alertProjectionId
- projectedState
- projectedAlertLevel
- triggerType
- dataQualityStatus
- noDangerGuardApplied
- downgradeReason
- notExitSignal
- notTradeAdvice
- buySellCommandGenerated
- autoOrderRequested
- productionWriteRequested

規則：

- projectedAlertLevel 預設 DATA_INSUFFICIENT。
- notExitSignal 必須 true。
- notTradeAdvice 必須 true。
- buySellCommandGenerated 必須 false。
- autoOrderRequested 必須 false。
- productionWriteRequested 必須 false。
- projection 不是交易指令。
- projection 不是正式投資建議。

---

## J. Audit / No-Write / Kill Switch / Rollback

Audit event 至少包含（`FirstAuthorizedSourceAuditEvent`）：auditEventId、generatedAt、sourceDescriptorId、
connectorId、snapshotId、verificationId、alertProjectionId、preflightDecision、requestPerformed、
supabaseConnected、productionWritePerformed、buySellCommandGenerated、autoOrderRequested。

No-write proof 至少包含（`FirstAuthorizedSourceNoWriteProof`）：proofId、writeAttempted、
databaseWritePerformed、productionWritePerformed、externalOrderPerformed、supabaseConnected、
blockedWriteOperations、proofStatus。

Kill switch 至少包含（`FirstAuthorizedSourceKillSwitch`）：killSwitchId、enabled、checkedAt、
dryRunCanContinue、requiresManualReview。

Rollback 至少包含（`FirstAuthorizedSourceRollback`）：rollbackId、rollbackRequired、rollbackReason、
rollbackStatus、manualReviewRequired。

---

## K. Dry-Run Decision

decision（對應 `FirstAuthorizedSourceDryRunDecision`）：

- `GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN`
- `NO_GO`
- `BLOCKED`
- `READY_FOR_REVIEW`
- `DATA_INSUFFICIENT`

規則：

- V39 預設 decision 必須 NO_GO。
- manualSignOffCompleted = false → NO_GO。
- authorizationStatus 未 PASS → NO_GO。
- killSwitch 未確認 → NO_GO。
- no-write proof 未 PASS → NO_GO。
- 任何 CRITICAL preflight 缺失 → NO_GO。
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production。
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表可寫資料。
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表產生買賣指令。

---

## L. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- First Authorized Source Dry-Run Spec 不是自動交易系統
- V39 不接真資料
- V39 不建立 runtime
- V39 不寫資料
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表可寫資料
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表產生買賣指令
- production write 一律 BLOCKED
- buySellCommandGenerated 必須 false
- autoOrderRequested 必須 false
- priceVerified = false 時不得輸出精準價位
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- 資料不足就顯示資料不足

---

## M. Future Implementation Gate

### V40 First Authorized Source Dry-Run API

- 只能回傳 fixture / mock_or_contract payload。
- 不接真資料。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。

### V41 First Authorized Source Dry-Run Monitoring UI

- 顯示 source preflight。
- 顯示 connector shape。
- 顯示 quote snapshot normalization。
- 顯示 price verification / data quality。
- 顯示 no-write proof。
- 仍不得寫 production data。
