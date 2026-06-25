# Runtime Pilot Dry-Run API

本文件定義 Allen Stock Dashboard 的 **Runtime Pilot Dry-Run API**（盤後 dry-run bundle 的 fixture-only API）。
V36 把 V35 Runtime Pilot Dry-Run bundle 包成 fixture-only API（`GET /api/portfolio/runtime-pilot-dry-run`），
讓後續 V37 Runtime Pilot Monitoring UI 可以消費 dry-run bundle。

**本階段（V36）是 fixture API / mock_or_contract / internal endpoint only。新增 API response builder、
API route、文件、checker、README、package.json。不接真資料、不建立 runtime、不建立 quote polling /
scheduler / webhook / broker connector / exchange connector、不連 Supabase、不讀 env、不新增 UI、
不修改 War Room / Holding Defense API route / Intraday Defense API route / Runtime Pilot Readiness UI、
不新增 SQL migration、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Runtime Pilot Dry-Run Spec](./runtime-pilot-dry-run-spec.md)、
[Runtime Pilot Readiness Checklist](./runtime-pilot-readiness-checklist.md)、
[Runtime Pilot Readiness UI](./runtime-pilot-readiness-ui.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Runtime Pilot Dry-Run API。
- V36 目標是把 V35 Runtime Pilot Dry-Run bundle 包成 fixture-only API。
- 本階段是 mock_or_contract。
- 本階段不接真資料。
- 本階段不建立 runtime。
- 本階段不建立 quote polling。
- 本階段不建立 scheduler。
- 本階段不建立 webhook。
- 本階段不建立 broker connector。
- 本階段不建立 exchange connector。
- 本階段不連 Supabase。
- 本階段不讀 env key。
- 本階段不新增 UI。
- 本階段不寫資料。
- 本階段不產生買賣指令。
- 本階段不自動下單。

---

## B. API Endpoint

定義 endpoint：`GET /api/portfolio/runtime-pilot-dry-run`

- 只允許 GET。
- 回傳 mock_or_contract / fixture-only payload。
- 不讀真實行情。
- 不讀真實持股。
- 不讀 Supabase。
- 不讀 env key。
- 不發外部 request。
- 不寫資料。
- 不產生買賣指令。
- 不自動下單。

---

## C. Relationship to Previous Versions

- V33 定義 Runtime Pilot Readiness Checklist。
- V34 建立 Runtime Pilot Readiness UI。
- V35 定義 Runtime Pilot Dry-Run Spec。
- V36 只建立 fixture-only API。
- V36 不建立 runtime。
- V36 不接真資料。
- V36 不新增 UI。
- V37 才可做 Runtime Pilot Monitoring UI。
- 真正接資料的 Runtime Pilot 必須等 readiness critical gates 全部 PASS 且人工簽核完成。

---

## D. Response Shape

API response 必須包含：

- apiContractVersion
- responseSource
- sourceMode
- runtimeMode
- generatedAt
- fixtureVersion
- dryRunBundle
- summary
- safetyLabels
- requestPerformed
- supabaseConnected
- productionWritePerformed

其中：

- apiContractVersion = V36
- responseSource = mock_or_contract
- sourceMode = fixture
- runtimeMode = dry_run_spec
- fixtureVersion = V36
- dryRunBundle.contractVersion = V35
- dryRunBundle.lifecycleState = DRY_RUN_NOT_ALLOWED
- dryRunBundle.readinessDecision = NO_GO
- dryRunBundle.dryRunAllowed = false
- requestPerformed = false
- supabaseConnected = false
- productionWritePerformed = false

summary 至少包含：

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

## E. Required Dry-Run Fields

API 必須能展示或保留：

- sourceDescriptor
- quoteSnapshot
- priceVerification
- alertProjection
- auditEvent
- noWriteProof
- killSwitch
- rollback

必須包含以下欄位語意：

- DRY_RUN_NOT_ALLOWED
- DRY_RUN_COMPLETED_WITH_NO_WRITE
- dry_run_spec
- NO_GO
- priceVerified
- priceVerificationStatus
- freshnessStatus
- sourceConflictStatus
- dataQualityStatus
- noDangerGuardApplied
- buySellCommandGenerated
- autoOrderRequested
- productionWriteRequested
- writeAttempted
- productionWritePerformed
- databaseWritePerformed
- externalOrderPerformed
- supabaseConnected
- requestPerformed

---

## F. No-Write / No-Trade Guard

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
- Dry-run API 不是 production。
- Dry-run API 不代表可寫資料。
- Dry-run API 不代表產生買賣指令。

---

## G. Data Quality Guard

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
- Runtime Pilot Dry-Run API 不是自動交易系統
- fixture data 不是即時資料
- V36 不接真資料
- V36 不建立 runtime
- V36 不寫資料
- Dry-run API 不是 production
- Dry-run API 不代表可寫資料
- Dry-run API 不代表產生買賣指令
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

### V37 Runtime Pilot Monitoring UI

- 讀取 GET /api/portfolio/runtime-pilot-dry-run。
- 顯示 dry-run lifecycle。
- 顯示 audit event。
- 顯示 no-write proof。
- 顯示 kill switch。
- 顯示 rollback。
- 仍不得寫 production data。
- 仍不得產生買賣指令。

### V38 Runtime Pilot Dry-Run Implementation Review

- 只能在 V33 readiness critical gates 全部 PASS 後討論。
- 只能 dry-run。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。
