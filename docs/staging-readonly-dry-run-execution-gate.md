# Staging Read-only Dry-run Execution Gate

本文件定義 Allen Stock Dashboard 的 **Staging Read-only Dry-run Execution Gate**：未來「什麼條件全部滿足後，才允許真正執行 staging read-only dry-run」的 execution gate。它是 execution gate，不是 execution 本身。

**本階段（V58）是 execution gate，not actual dry-run execution；是 spec-only，not actual connection。本輪不把 manualSignoffCompleted / manualSignoffEvidenceProvided / stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed / actualDryRunExecuted 設為 true；不實際連線、不執行 dry-run；不是 manual sign-off instance；不是 staging Supabase 實作；不是 production 真實資料上線；不是 actual shadow runner runtime；不讀 env；不建立 Supabase client；不是 DB read/write implementation。**

相關文件：V44–V57 全部 staging / shadow-runner spec、evidence、checklist、gate、sign-off 與 plan 文件。

---

## A. Scope

- V58 是 Staging Read-only Dry-run Execution Gate。
- V58 是 execution gate，不是 actual dry-run execution。
- V58 是 spec-only，不是 actual connection。
- V58 不把 manualSignoffCompleted 設為 true。
- V58 不把 manualSignoffEvidenceProvided 設為 true。
- V58 不把 stagingConnectionAllowed 設為 true。
- V58 不把 stagingConnectionReviewAllowed 設為 true。
- V58 不把 stagingDryRunExecutionAllowed 設為 true。
- V58 不把 actualDryRunExecuted 設為 true。
- V58 不是新功能。
- V58 不新增 UI。
- V58 不新增 API route。
- V58 不連 staging Supabase。
- V58 不接 production Supabase。
- V58 不讀 Supabase env key。
- V58 不寫 staging。
- V58 不寫 production。
- V58 不新增 SQL migration。
- V58 不建立 Supabase client。
- V58 不建立 actual shadow runner runtime。
- V58 不執行 actual shadow runner。
- V58 不切換 /api/portfolio。
- V58 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V58 不接真實行情。
- V58 不產生買賣指令。
- V58 不自動下單。

---

## B. Gate State Flags

- V57 dry-run plan exists but execution remains blocked。
- V56 manual sign-off evidence spec exists but evidence remains not provided。
- dryRunExecutionGateDefined = true。
- v57DryRunPlanExists = true；v56ManualSignoffSpecExists = true；v55ConnectionReviewGateExists = true。
- actualDryRunExecuted = false；actualConnectionImplemented = false；actualConnectionAttempted = false。
- manualSignoffRequired = true；manualSignoffCompleted = false；manualSignoffEvidenceProvided = false。
- manualSignerIdentityVerified = false；manualSignerHasAuthority = false。
- stagingConnectionAllowed = false；stagingConnectionReviewAllowed = false；stagingDryRunExecutionAllowed = false。
- productionReadinessAllowed = false。
- serviceRoleAllowedInAppRuntime = false；anonRoleAllowed = false；dashboardReadonlyRoleRequired = true。
- readOnlySelectOnlyRequired = true；writeOperationsBlocked = true；shadowOnlyRequired = true。
- killSwitchDefaultEnabled = true；portfolioApiMustRemainHardcoded = true。

---

## C. Gate Item Shape

每個 gate item 至少包含：`gateItemId`、`category`、`title`、`requiredBeforeDryRunExecution`、`requiredEvidence`、
`expectedState`、`actualState`、`status`、`blocksDryRunExecution`、`blocksActualConnection`、
`blocksProductionReadiness`、`manualReviewRequired`、`failureAction`、`notes`。

允許的 category：MANUAL_SIGNOFF、EVIDENCE_REQUIREMENTS、SUPABASE_PROJECT、ENVIRONMENT_VARIABLES、RLS_POLICY、
ROLE_ACCESS、READ_ONLY_OPERATION、SHADOW_ONLY、KILL_SWITCH、ROLLBACK、PORTFOLIO_SOURCE_MODE、API_ROUTE_SAFETY、
DATA_SOURCE_SAFETY、TRADING_SAFETY、FINAL_GO_NO_GO。

允許的 status：PASS、FAIL、WARNING、NOT_PROVIDED、NOT_REVIEWED、BLOCKED。

gate items 至少 20 個（本實作 26 個），覆蓋全部 15 個 category。因 manual sign-off evidence 尚未提供，需提供之 item status 為 NOT_PROVIDED / NOT_REVIEWED / BLOCKED。

---

## D. Rules

- manualSignoffRequired 必須 true；manualSignoffCompleted / manualSignoffEvidenceProvided 必須 false。
- actualDryRunExecuted / actualConnectionImplemented / actualConnectionAttempted 必須 false。
- stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed 必須 false。
- productionReadinessAllowed 必須 false。
- decision 預設 NO_GO。
- 因 sign-off evidence 尚未提供，不得讓任何 dry-run execution allowed。
- 所有 blocksDryRunExecution = true 且 status 不是 PASS 的 item 必須讓 decision = NO_GO。
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

- Staging Read-only Dry-run Execution Gate
- execution gate
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
- V57 dry-run plan exists but execution remains blocked
- V56 manual sign-off evidence spec exists but evidence remains not provided
- manualSignoffRequired = true
- manualSignoffCompleted = false
- manualSignoffEvidenceProvided = false
- stagingConnectionAllowed = false
- stagingConnectionReviewAllowed = false
- stagingDryRunExecutionAllowed = false
- actualDryRunExecuted = false
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

- `decision` 預設 NO_GO（manual sign-off evidence 尚未提供；多數 gate item BLOCKED / NOT_PROVIDED / NOT_REVIEWED）。
- 允許 NO_GO / READY_FOR_REVIEW / BLOCKED / NOT_REVIEWED。
- decision 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。
- 即使部分 gate item PASS，只要任一 blocksDryRunExecution item 非 PASS，stagingDryRunExecutionAllowed 仍 false、decision 仍 NO_GO。

---

## H. Future Gate

下一階段才是 **V59 Manual Sign-off Evidence Instance** 或 **V59 Staging Read-only Dry-run Execution Evidence**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
