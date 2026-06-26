# Staging Read-only Connection Dry-run Plan

本文件定義 Allen Stock Dashboard 的 **Staging Read-only Connection Dry-run Plan**：未來 staging read-only connection dry-run 的步驟、前置條件、人工檢查點、kill switch 中止點、rollback 步驟、錯誤分類，以及 evidence capture plan。

**本階段（V57）是 dry-run plan，not actual dry-run execution；是 spec-only，not actual connection。本輪不把 manualSignoffCompleted / manualSignoffEvidenceProvided / stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed 設為 true；不實際連線；不是 manual sign-off instance；不是 staging Supabase 實作；不是 production 真實資料上線；不是 actual shadow runner runtime；不讀 env；不建立 Supabase client；不是 DB read/write implementation。**

相關文件：V44–V56 全部 staging / shadow-runner spec、evidence、checklist、gate 與 sign-off 文件。

---

## A. Scope

- V57 是 Staging Read-only Connection Dry-run Plan。
- V57 是 dry-run plan，不是 actual dry-run execution。
- V57 是 spec-only，不是 actual connection。
- V57 不把 manualSignoffCompleted 設為 true。
- V57 不把 manualSignoffEvidenceProvided 設為 true。
- V57 不把 stagingConnectionAllowed 設為 true。
- V57 不把 stagingConnectionReviewAllowed 設為 true。
- V57 不把 stagingDryRunExecutionAllowed 設為 true。
- V57 不是新功能。
- V57 不新增 UI。
- V57 不新增 API route。
- V57 不連 staging Supabase。
- V57 不接 production Supabase。
- V57 不讀 Supabase env key。
- V57 不寫 staging。
- V57 不寫 production。
- V57 不新增 SQL migration。
- V57 不建立 Supabase client。
- V57 不建立 actual shadow runner runtime。
- V57 不執行 actual shadow runner。
- V57 不切換 /api/portfolio。
- V57 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V57 不接真實行情。
- V57 不產生買賣指令。
- V57 不自動下單。

---

## B. Gate State Flags

- V56 manual sign-off evidence spec exists but evidence remains not provided。
- V55 connection review gate exists but decision remains NO_GO。
- dryRunPlanDefined = true。
- actualDryRunExecuted = false。
- actualConnectionImplemented = false。
- actualConnectionAttempted = false。
- manualSignoffRequired = true。
- manualSignoffCompleted = false。
- manualSignoffEvidenceProvided = false。
- stagingConnectionAllowed = false。
- stagingConnectionReviewAllowed = false。
- stagingDryRunExecutionAllowed = false。
- productionReadinessAllowed = false。
- serviceRoleAllowedInAppRuntime = false。
- anonRoleAllowed = false。
- dashboardReadonlyRoleRequired = true。
- readOnlySelectOnlyRequired = true。
- writeOperationsBlocked = true。
- shadowOnlyRequired = true。
- killSwitchDefaultEnabled = true。
- portfolioApiMustRemainHardcoded = true。

---

## C. Plan Step Shape

每個 plan step 至少包含：`stepId`、`order`、`phase`、`title`、`objective`、`requiredBeforeStep`、`expectedInput`、
`expectedOutput`、`executionMode`、`allowedOperation`、`forbiddenOperation`、`killSwitchBehavior`、`rollbackBehavior`、
`evidenceToCapture`、`status`、`blocksDryRunExecution`、`blocksActualConnection`、`blocksProductionReadiness`、
`manualReviewRequired`、`notes`。

允許的 phase：PRECHECK、MANUAL_SIGNOFF、ENVIRONMENT_REVIEW、RLS_REVIEW、ROLE_REVIEW、DRY_RUN_PREPARATION、
READ_ONLY_PROBE_PLAN、SHADOW_COMPARISON_PLAN、ERROR_HANDLING、KILL_SWITCH、ROLLBACK、EVIDENCE_CAPTURE、FINAL_GO_NO_GO。

允許的 executionMode：SPEC_ONLY、MANUAL_ONLY、FUTURE_DRY_RUN_ONLY、NO_RUNTIME_CREATED。
允許的 allowedOperation：DOCUMENT_REVIEW_ONLY、MANUAL_DASHBOARD_REVIEW_ONLY、SELECT_ONLY_FUTURE_PLAN、INTERNAL_FIXTURE_ONLY、NO_OPERATION。
允許的 status：PLANNED、NOT_READY、BLOCKED、READY_FOR_REVIEW、PASS、FAIL。

plan steps 至少 20 個（本實作 28 個），覆蓋全部 13 個 phase。因 manual sign-off evidence 尚未提供，多數 step status 為 PLANNED / NOT_READY / BLOCKED。

---

## D. Rules

- manualSignoffRequired 必須 true；manualSignoffCompleted / manualSignoffEvidenceProvided 必須 false。
- actualDryRunExecuted / actualConnectionImplemented / actualConnectionAttempted 必須 false。
- stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed 必須 false。
- productionReadinessAllowed 必須 false。
- decision 預設 NO_GO。
- 因 sign-off evidence 尚未提供，不得讓任何 dry-run execution allowed。
- 可以把 plan readiness 標為 READY_FOR_REVIEW，但不得表示可實際連線。
- 不得出現 PRODUCTION_READY。

---

## E. Future Connection Constraints

- PORTFOLIO_SOURCE_MODE must remain hardcoded。
- /api/portfolio must not be switched。
- fixture/hardcoded must not be overridden by staging。
- mismatch must not promote staging。
- empty / stale / error result must not override hardcoded。
- kill switch must be enabled by default。
- read-only select-only；insert / update / delete 一律 blocked；shadow-only。

---

## F. Safety Language

- Staging Read-only Connection Dry-run Plan
- dry-run plan
- not actual dry-run execution
- not actual connection
- not production trading system
- no real market data
- no Supabase connection
- no env key
- no DB write
- no staging write
- no production write
- no SQL migration
- no api switch
- no buy/sell command
- no auto order
- V56 manual sign-off evidence spec exists but evidence remains not provided
- V55 connection review gate exists but decision remains NO_GO
- manualSignoffRequired = true
- manualSignoffCompleted = false
- manualSignoffEvidenceProvided = false
- stagingConnectionAllowed = false
- stagingConnectionReviewAllowed = false
- stagingDryRunExecutionAllowed = false
- actualConnectionImplemented = false
- actualConnectionAttempted = false
- productionReadinessAllowed = false
- serviceRoleAllowedInAppRuntime = false
- dashboardReadonlyRoleRequired = true
- readOnlySelectOnlyRequired = true
- writeOperationsBlocked = true
- shadowOnlyRequired = true
- PORTFOLIO_SOURCE_MODE must remain hardcoded
- /api/portfolio must not be switched
- fixture/hardcoded must not be overridden by staging
- mismatch must not promote staging
- empty / stale / error result must not override hardcoded
- kill switch must be enabled by default
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## G. Decision

- `decision` 預設 NO_GO（manual sign-off evidence 尚未提供；多數 step BLOCKED / NOT_READY）。
- 允許 NO_GO / READY_FOR_REVIEW / BLOCKED / NOT_REVIEWED。
- decision 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。
- 即使 plan readiness 為 READY_FOR_REVIEW，stagingDryRunExecutionAllowed 仍 false，不代表可實際連線或執行 dry-run。

---

## H. Future Gate

下一階段才是 **V58 Manual Sign-off Evidence Instance** 或 **V58 Staging Read-only Dry-run Execution Gate**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
