# Runtime Pilot Readiness UI

本文件定義 Allen Stock Dashboard 的 **Runtime Pilot Readiness UI**（Runtime Pilot 就緒度視覺化）。
V34 把 V33 Runtime Pilot Readiness Checklist 視覺化，讓 holdings 頁面顯示目前 go / no-go decision、
18 個 readiness gates、critical gates、missing evidence、next required actions、
audit log / rollback / kill switch shape。

**本階段（V34）是 spec-only / fixture-only UI。只新增 server component（`components/runtime-pilot-readiness.tsx`）、
改 `app/holdings/page.tsx`、新增文件、checker、README、package.json。component 直接呼叫 V33 pure builder。
不接真資料、不建立 runtime、不新增 API route、不連 Supabase、不發外部 request、不讀 env、
不新增 SQL migration、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Runtime Pilot Readiness Checklist](./runtime-pilot-readiness-checklist.md)、
[Runtime Data Pipeline Spec](./runtime-data-pipeline-spec.md)、
[Intraday Defense UI Integration](./intraday-defense-ui-integration.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Runtime Pilot Readiness UI。
- V34 目標是把 V33 Runtime Pilot Readiness Checklist 視覺化。
- 本階段是 spec-only / fixture-only UI。
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

## B. Data Boundary

- UI 使用 V33 pure builder 產生 fixture / spec-only payload。
- UI 不得直接讀 raw market data。
- UI 不得直接 fetch 外部 URL。
- UI 不得讀 Supabase。
- UI 不得讀 env key。
- UI 不得建立 runtime connector。
- UI 顯示的是 readiness preview，不是 runtime 狀態。
- UI 顯示的是產品體驗預覽，不是投資建議。
- fixture data 不是即時資料。

---

## C. UI Placement

- Runtime Pilot Readiness UI 優先放在 `app/holdings/page.tsx`。
- 建議放在 Intraday Defense Tracker 下方。
- V34 不修改 War Room read model。
- V34 不修改 Runtime Pilot contract。
- V34 不新增 API route。

---

## D. UI Sections

UI 至少包含：

1. Runtime Pilot Readiness header
2. Spec-only warning banner
3. Decision summary cards
4. Critical gates summary
5. All readiness gates table or cards
6. Missing evidence section
7. Next required actions section
8. Audit log shape preview
9. Rollback plan shape preview
10. Kill switch shape preview
11. Safety labels footer

Decision summary 至少顯示：

- decision
- decisionReason
- criticalGateCount
- criticalGatePassedCount
- blockedGateCount
- notReviewedGateCount
- warningGateCount
- allCriticalGatesPassed
- dryRunModeRequired
- noWriteModeRequired
- productionWriteAllowed
- buySellCommandGenerationBlocked
- notTradeAdviceAlwaysTrue

---

## E. Gate Card Fields

每張 gate card 至少顯示：

- gateId
- gateLabel
- severity
- status
- featureArea
- passed
- blockingReason
- warningReason
- requiredEvidence
- missingEvidence
- nextRequiredAction
- ownerHint

---

## F. Audit / Rollback / Kill Switch Display

Audit log shape：

- auditId
- generatedAt
- sourceId
- stockId
- gateId
- beforeStatus
- afterStatus
- decision
- reason
- requestPerformed
- supabaseConnected
- productionWritePerformed

Rollback plan shape：

- rollbackId
- rollbackReason
- affectedFeature
- rollbackTrigger
- rollbackOwner
- rollbackStatus

Kill switch shape：

- killSwitchId
- enabled
- reason
- affectedRuntime
- activatedAt
- deactivatedAt
- owner
- requiresManualReview

---

## G. Go / No-Go Display Rules

UI 必須清楚標示：

- GO_DRY_RUN 不是 production
- GO_DRY_RUN 不代表可寫資料
- GO_DRY_RUN 不代表產生買賣指令
- NO_GO 代表不得啟動 Runtime Pilot
- production write 一律 BLOCKED
- any critical gate not PASS means no GO_DRY_RUN
- source authorization 未確認不得啟動 Runtime Pilot
- kill switch 未確認不得啟動 Runtime Pilot
- buy/sell command blocking 未確認不得啟動 Runtime Pilot

---

## H. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Runtime Pilot Readiness UI 不是自動交易系統
- fixture data 不是即時資料
- readiness preview 不是 runtime 狀態
- V34 不接真資料
- V34 不建立 runtime
- V34 不寫資料
- GO_DRY_RUN 不是 production
- GO_DRY_RUN 不代表可寫資料
- GO_DRY_RUN 不代表產生買賣指令
- production write 一律 BLOCKED
- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- priceVerified = false 時不得輸出精準價位
- 資料不足就顯示資料不足

---

## I. Future Implementation Gate

### V35 Runtime Pilot Dry-Run

- 只能在 all critical gates PASS 後開始。
- 只能 dry-run。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。

### V36 Runtime Pilot Monitoring

- 顯示 runtime pilot 狀態。
- 顯示 audit log。
- 顯示 NO_GO / GO_DRY_RUN。
- 仍不得寫 production data。
