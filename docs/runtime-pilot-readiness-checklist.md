# Runtime Pilot Readiness Checklist

本文件定義 Allen Stock Dashboard 的 **Runtime Pilot Readiness Checklist**（真正 Runtime Pilot 前的 go / no-go gate）。
V33 把 V28 / V30 已點名、但尚未正式化的「pilot 啟動前就緒門檻」收斂成正式 checklist + contract，
作為 V34 Runtime Pilot 啟動前可稽核的最後 gate。

**本階段（V33）是 spec-only / contract-only。本輪不得建立 Runtime Pilot。新增文件、use-case contract、
pure spec builder、checker、README、package.json。不接真資料、不建立 runtime、不建立 quote polling /
scheduler / webhook / broker connector / exchange connector、不連 Supabase、不讀 env、不新增 API route、
不新增 UI、不寫資料、不產生買賣指令、不自動下單。**

相關文件：
[Runtime Data Pipeline Spec](./runtime-data-pipeline-spec.md)、
[Intraday Holding Defense Runtime Spec](./intraday-holding-defense-runtime-spec.md)、
[Intraday Defense Fixture API](./intraday-defense-fixture-api.md)、
[Intraday Defense UI Integration](./intraday-defense-ui-integration.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Runtime Pilot Readiness Checklist。
- V33 目標是定義真正 Runtime Pilot 前的 go / no-go gate。
- V33 是 spec-only / contract-only。
- V33 不接真資料。
- V33 不建立 runtime。
- V33 不建立 quote polling。
- V33 不建立 scheduler。
- V33 不建立 webhook。
- V33 不建立 broker connector。
- V33 不建立 exchange connector。
- V33 不連 Supabase。
- V33 不讀 env key。
- V33 不新增 API route。
- V33 不新增 UI。
- V33 不寫資料。
- V33 不產生買賣指令。
- V33 不自動下單。

---

## B. Relationship to Previous Versions

- V28 定義 Runtime Data Pipeline governance。
- V30 定義 Intraday Holding Defense Runtime Spec。
- V31 建立 Intraday Defense Fixture API。
- V32 建立 Intraday Defense UI Integration。
- V33 定義 Runtime Pilot readiness gate。
- V33 不建立 Runtime Pilot。
- V34 才能在 readiness 全綠後進入 Runtime Pilot dry-run。

---

## C. Core Principle

Runtime Pilot 不得因為 UI 已經完成就直接啟動。

必須先確認：

- source authorization
- source legal status
- rate limit
- market session
- timestamp normalization
- stale guard
- source conflict threshold
- fallback downgrade
- no-DANGER guard
- dry-run
- no-write
- audit log
- rollback
- kill switch
- no buy/sell command generation

若任何 critical gate 未通過，runtime pilot 必須 NO_GO。

---

## D. Readiness Gates

定義以下 18 個 gates（對應 contract 的 `RuntimePilotReadinessGateId`）：

1. `SOURCE_AUTHORIZATION`：確認資料源授權；未授權不得啟動。
2. `SOURCE_LEGAL_STATUS`：確認資料源合法狀態。
3. `RATE_LIMIT_POLICY`：定義速率限制政策。
4. `MARKET_SESSION_HANDLING`：定義市場時段處理。
5. `TIMESTAMP_NORMALIZATION`：定義時間戳正規化。
6. `STALE_GUARD`：定義 stale guard，stale 不得 DANGER。
7. `SOURCE_CONFLICT_THRESHOLD`：定義來源衝突門檻。
8. `FALLBACK_DOWNGRADE`：定義 fallback 降級，fallback-only 不得 DANGER。
9. `NO_DANGER_GUARD`：確認 fallback / stale / conflict 不得觸發 DANGER。
10. `DRY_RUN_MODE`：確認 dry-run 為預設。
11. `NO_WRITE_GUARD`：確認 no-write 為預設。
12. `AUDIT_LOG_SHAPE`：確認 audit log 結構。
13. `ROLLBACK_PLAN`：確認 rollback 計畫。
14. `KILL_SWITCH`：確認 kill switch 可手動啟用。
15. `ALERT_SAFETY`：確認警報安全（cooldown / dedup / audit）。
16. `BUY_SELL_COMMAND_BLOCK`：確認買賣指令封鎖。
17. `NOT_TRADE_ADVICE`：確認 notTradeAdvice always true。
18. `PRODUCTION_WRITE_BLOCKED`：確認 production write 一律 BLOCKED。

---

## E. Gate Severity

severity（對應 contract 的 `RuntimePilotGateSeverity`）：

- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`

規則：

- CRITICAL 未通過 → NO_GO。
- HIGH 未通過 → NO_GO 或 BLOCKED。
- MEDIUM 未通過 → WARNING，但不得進 production write。
- LOW 未通過 → WARNING。
- BUY_SELL_COMMAND_BLOCK、NO_WRITE_GUARD、KILL_SWITCH、SOURCE_AUTHORIZATION、STALE_GUARD、NO_DANGER_GUARD 必須是 CRITICAL。

---

## F. Gate Status

status（對應 contract 的 `RuntimePilotGateStatus`）：

- `PASS`
- `WARNING`
- `FAIL`
- `BLOCKED`
- `NOT_REVIEWED`
- `NOT_APPLICABLE`

規則：

- PASS 才能視為完成。
- WARNING 仍需記錄。
- FAIL / BLOCKED / NOT_REVIEWED 不得進 Runtime Pilot。
- NOT_APPLICABLE 必須有 reason。

---

## G. Go / No-Go Decision

decision（對應 contract 的 `RuntimePilotDecision`）：

- `GO_DRY_RUN`
- `NO_GO`
- `BLOCKED`
- `READY_FOR_REVIEW`
- `DATA_INSUFFICIENT`

規則：

- 只有所有 CRITICAL gates PASS，且 no-write / dry-run / kill switch / audit log 都 PASS，才能 GO_DRY_RUN。
- 任何 CRITICAL gate FAIL / BLOCKED / NOT_REVIEWED → NO_GO。
- source authorization 未確認 → NO_GO。
- no-write 未確認 → NO_GO。
- kill switch 未確認 → NO_GO。
- buy/sell command blocking 未確認 → NO_GO。
- production write 一律 BLOCKED。
- GO_DRY_RUN 不是 production。
- GO_DRY_RUN 不代表可寫資料。
- GO_DRY_RUN 不代表產生買賣指令。

---

## H. Source Readiness

- source authorization reviewed
- source legal status reviewed
- source rate limit reviewed
- source priority assigned
- source provenance recorded
- source timestamp available
- source freshness window defined
- source conflict threshold defined
- source fallback behavior defined

明確邊界：

- 未確認授權不得啟動 Runtime Pilot。
- secondary source 不得作為唯一正式來源。
- fallback-only data 不得觸發 DANGER。
- stale data 不得觸發 DANGER。
- source conflict 不得觸發 DANGER。

---

## I. Data Quality Readiness

- priceVerified output defined
- priceVerificationStatus output defined
- freshnessStatus output defined
- sourceConflictStatus output defined
- dataQualityStatus output defined
- highConfidenceConclusionAllowed rules defined
- precise price zone rule defined
- priceVerified = false 時不得輸出精準價位
- DATA_INSUFFICIENT 必須顯示資料不足

---

## J. Alert Safety Readiness

- fallback-only data 不得觸發 DANGER
- stale data 不得觸發 DANGER
- source conflict 不得觸發 DANGER
- priceVerified = false 不得觸發 DANGER
- DATA_INSUFFICIENT 不得觸發 DANGER
- DANGER 也不是買賣指令
- DANGER 必須 cooldown / dedup
- DANGER 必須 audit log
- DANGER 不得自動下單

---

## K. Runtime Operation Readiness

- dry-run mode must be default
- no-write mode must be default
- productionWriteAllowed must be false
- requestPerformed must be traceable
- supabaseConnected must be traceable
- productionWritePerformed must be traceable
- no scheduler until approved
- no polling until approved
- no webhook until approved
- no production write until approved

---

## L. Audit / Rollback / Kill Switch

Audit log shape 至少包含（對應 contract 的 `RuntimePilotAuditLogShape`）：

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

Rollback plan 至少包含（`RuntimePilotRollbackPlanShape`）：

- rollbackId
- rollbackReason
- affectedFeature
- rollbackTrigger
- rollbackOwner
- rollbackStatus

Kill switch 至少包含（`RuntimePilotKillSwitchShape`）：

- killSwitchId
- enabled
- reason
- affectedRuntime
- activatedAt
- deactivatedAt
- owner
- requiresManualReview

---

## M. Safety Language

- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- Runtime Pilot Readiness Checklist 不是自動交易系統
- V33 不接真資料
- V33 不建立 runtime
- V33 不寫資料
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

## N. Future Implementation Gate

### V34 Runtime Pilot Dry-Run

- 只能在 all critical gates PASS 後開始。
- 只能 dry-run。
- 不寫 production data。
- 不產生買賣指令。
- 不自動下單。

### V35 Runtime Pilot UI / Monitoring

- 顯示 runtime pilot 狀態。
- 顯示 audit log。
- 顯示 NO_GO / GO_DRY_RUN。
- 仍不得寫 production data。
