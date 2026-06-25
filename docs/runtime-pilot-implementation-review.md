# Runtime Pilot Implementation Review

本文件定義 Allen Stock Dashboard 的 **Runtime Pilot Implementation Review**（接入第一個授權資料源 dry-run 前的最後 implementation gate）。
V38 把「UI / fixture API 完成後，真正動手實作 dry-run runtime 前要 review 什麼、由誰簽核、卡在哪幾個 CRITICAL item」
收斂成正式 contract，作為 V39 First Authorized Source Dry-Run 的啟動條件。

**本階段（V38）是 spec-only / contract-only / implementation review only。本輪不得建立真正 Runtime Pilot。
新增文件、use-case contract、pure spec builder、checker、README、package.json。
不接真資料、不建立 runtime、不建立 quote polling / scheduler / webhook / broker connector / exchange connector、
不連 Supabase、不讀 env、不新增 API route、不新增 UI、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Runtime Pilot Readiness Checklist](./runtime-pilot-readiness-checklist.md)、
[Runtime Pilot Dry-Run Spec](./runtime-pilot-dry-run-spec.md)、
[Runtime Pilot Dry-Run API](./runtime-pilot-dry-run-api.md)、
[Runtime Pilot Monitoring UI](./runtime-pilot-monitoring-ui.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Runtime Pilot Implementation Review。
- V38 目標是定義真正進入第一個授權資料源 dry-run 前的最後 review gate。
- V38 是 spec-only / contract-only。
- V38 不接真資料。
- V38 不建立 runtime。
- V38 不建立 quote polling。
- V38 不建立 scheduler。
- V38 不建立 webhook。
- V38 不建立 broker connector。
- V38 不建立 exchange connector。
- V38 不連 Supabase。
- V38 不讀 env key。
- V38 不新增 API route。
- V38 不新增 UI。
- V38 不寫資料。
- V38 不產生買賣指令。
- V38 不自動下單。

---

## B. Relationship to Previous Versions

- V33 定義 Runtime Pilot Readiness Checklist。
- V34 建立 Runtime Pilot Readiness UI。
- V35 定義 Runtime Pilot Dry-Run Spec。
- V36 建立 Runtime Pilot Dry-Run API。
- V37 建立 Runtime Pilot Monitoring UI。
- V38 定義 Runtime Pilot Implementation Review。
- V38 不建立 Runtime Pilot。
- V39 才可在 review 全部 PASS 後討論 First Authorized Source Dry-Run。
- 真正接資料必須仍然 dry-run / no-write / no buy-sell command。

---

## C. Core Principle

UI 和 fixture API 完成，不代表可以直接接真資料。

進入 V39 前必須確認：

- source authorization
- source legal status
- rate limit policy
- market session handling
- timestamp normalization
- stale guard
- source conflict threshold
- fallback downgrade
- no-DANGER guard
- dry-run default
- no-write enforcement
- audit log
- rollback plan
- kill switch
- manual reviewer sign-off
- no buy/sell command generation

任何 critical review item 未通過，V39 必須 NO_GO。

---

## D. Implementation Review Items

定義以下 20 個 review items（對應 contract 的 `RuntimePilotImplementationReviewItemId`）：

1. `REVIEW_SOURCE_AUTHORIZATION`：確認資料源授權。
2. `REVIEW_SOURCE_LEGAL_STATUS`：確認資料源合法狀態。
3. `REVIEW_RATE_LIMIT_POLICY`：確認速率限制政策。
4. `REVIEW_MARKET_SESSION_HANDLING`：確認市場時段處理。
5. `REVIEW_TIMESTAMP_NORMALIZATION`：確認時間戳正規化。
6. `REVIEW_STALE_GUARD`：確認 stale guard。
7. `REVIEW_SOURCE_CONFLICT_THRESHOLD`：確認來源衝突門檻。
8. `REVIEW_FALLBACK_DOWNGRADE`：確認 fallback 降級。
9. `REVIEW_NO_DANGER_GUARD`：確認 no-DANGER guard。
10. `REVIEW_DRY_RUN_DEFAULT`：確認 dry-run 為預設。
11. `REVIEW_NO_WRITE_ENFORCEMENT`：確認 no-write enforcement。
12. `REVIEW_AUDIT_LOG_SHAPE`：確認 audit log shape。
13. `REVIEW_ROLLBACK_PLAN`：確認 rollback plan。
14. `REVIEW_KILL_SWITCH`：確認 kill switch。
15. `REVIEW_MONITORING_VISIBILITY`：確認 monitoring 可見性。
16. `REVIEW_NO_BUY_SELL_COMMAND`：確認不產生買賣指令。
17. `REVIEW_NO_AUTO_ORDER`：確認不自動下單。
18. `REVIEW_PRODUCTION_WRITE_BLOCKED`：確認 production write 一律 BLOCKED。
19. `REVIEW_MANUAL_SIGN_OFF`：確認具名 reviewer 簽核。
20. `REVIEW_DEPLOYMENT_ROLLBACK`：確認部署 / rollback checklist。

---

## E. Review Severity

severity（對應 contract 的 `RuntimePilotImplementationReviewSeverity`）：

- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`

規則：

- CRITICAL 未通過 → NO_GO。
- HIGH 未通過 → BLOCKED。
- MEDIUM 未通過 → WARNING，但不得進 production write。
- LOW 未通過 → WARNING。
- REVIEW_SOURCE_AUTHORIZATION、REVIEW_NO_WRITE_ENFORCEMENT、REVIEW_KILL_SWITCH、REVIEW_NO_BUY_SELL_COMMAND、REVIEW_NO_AUTO_ORDER、REVIEW_PRODUCTION_WRITE_BLOCKED、REVIEW_MANUAL_SIGN_OFF 必須是 CRITICAL。

---

## F. Review Status

status（對應 contract 的 `RuntimePilotImplementationReviewStatus`）：

- `PASS`
- `WARNING`
- `FAIL`
- `BLOCKED`
- `NOT_REVIEWED`
- `NOT_APPLICABLE`

規則：

- PASS 才能視為完成。
- FAIL / BLOCKED / NOT_REVIEWED 不得進 First Authorized Source Dry-Run。
- NOT_APPLICABLE 必須有 reason。
- manual sign-off 未完成不得 GO_DRY_RUN。

---

## G. Implementation Decision

decision（對應 contract 的 `RuntimePilotImplementationDecision`）：

- `GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN`
- `NO_GO`
- `BLOCKED`
- `READY_FOR_REVIEW`
- `DATA_INSUFFICIENT`

規則：

- 只有所有 CRITICAL review items PASS，且 manual sign-off PASS，才能 GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN。
- 任何 CRITICAL item FAIL / BLOCKED / NOT_REVIEWED → NO_GO。
- source authorization 未確認 → NO_GO。
- no-write 未確認 → NO_GO。
- kill switch 未確認 → NO_GO。
- no buy/sell command blocking 未確認 → NO_GO。
- no auto order 未確認 → NO_GO。
- production write 一律 BLOCKED。
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production。
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表可寫資料。
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表產生買賣指令。

---

## H. Authorized Source Preflight

對應 contract 的 `RuntimePilotAuthorizedSourcePreflightReview`：

- sourceDescriptorId
- authorizationEvidence
- legalStatusEvidence
- rateLimitEvidence
- sourcePriorityEvidence
- sourceTimestampEvidence
- freshnessWindowEvidence
- conflictThresholdEvidence
- fallbackDowngradeEvidence
- reviewerName
- reviewedAt
- reviewStatus

明確邊界：

- 未確認授權不得進入 V39。
- 未確認 legal status 不得進入 V39。
- secondary / fallback source 不得作為唯一正式來源。
- fallback-only data 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。

---

## I. Implementation Boundary

V39 若啟動，仍然只能（對應 contract 的 `RuntimePilotImplementationBoundary`）：

- dry-run
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

## J. Audit / Rollback / Kill Switch Review

Audit review 必須確認（`RuntimePilotImplementationAuditReview`）：

- audit event shape present
- audit event includes noWriteProofId
- audit event includes killSwitchChecked
- audit event includes rollbackRequired
- audit event records requestPerformed
- audit event records supabaseConnected
- audit event records productionWritePerformed
- audit event records buySellCommandGenerated
- audit event records autoOrderRequested

Rollback review 必須確認（`RuntimePilotImplementationRollbackReview`）：

- rollbackId
- rollbackRequired
- rollbackReason
- rollbackTrigger
- affectedFeature
- rollbackStatus
- manualReviewRequired

Kill switch review 必須確認（`RuntimePilotImplementationKillSwitchReview`）：

- killSwitchId
- enabled
- checkedAt
- affectedRuntime
- stopReason
- requiresManualReview
- dryRunCanContinue

---

## K. No-Write / No-Trade Review

- buySellCommandGenerated 必須 false。
- autoOrderRequested 必須 false。
- productionWriteRequested 必須 false。
- writeAttempted 必須 false。
- productionWritePerformed 必須 false。
- databaseWritePerformed 必須 false。
- externalOrderPerformed 必須 false。
- supabaseConnected 必須 false。
- production write 一律 BLOCKED。
- implementation review 不是 production。
- implementation review 不代表可寫資料。
- implementation review 不代表產生買賣指令。

---

## L. Data Quality Review

- priceVerified = false 時不得輸出精準價位。
- priceVerified = false 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- fallback-only data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。
- DATA_INSUFFICIENT 不得觸發 DANGER。
- highConfidenceConclusionAllowed 預設 false。
- noDangerGuardApplied 必須可追蹤。

---

## M. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Runtime Pilot Implementation Review 不是自動交易系統
- V38 不接真資料
- V38 不建立 runtime
- V38 不寫資料
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表可寫資料
- GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表產生買賣指令
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

### V39 First Authorized Source Dry-Run Spec

- 只能在 V38 review critical items 全部 PASS 後討論。
- 只能 dry-run。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。

### V40 First Authorized Source Dry-Run API

- 只能回傳 dry-run / no-write payload。
- 不得寫 production data。
- 不得產生買賣指令。
- 不得自動下單。
