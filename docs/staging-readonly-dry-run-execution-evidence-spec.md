# Staging Read-only Dry-run Execution Evidence Spec

本文件定義 Allen Stock Dashboard 的 **Staging Read-only Dry-run Execution Evidence Spec**：未來真的執行 staging read-only dry-run 之後，應收集哪些 execution evidence（read-only probe、no-write proof、RLS select-only、role、fixture vs staging shadow comparison、mismatch、stale / empty / error fallback、kill switch、rollback、no `/api/portfolio` switch、no real market data、no buy/sell / auto order…）。

**本階段（V59）是 execution evidence structure，not execution evidence instance；是 spec-only，not actual dry-run execution / not actual connection。本輪不把 actualDryRunExecuted / actualDryRunEvidenceProvided / manualSignoffCompleted / manualSignoffEvidenceProvided / stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed 設為 true；不實際連線、不執行 dry-run；不是 manual sign-off instance；不是 staging Supabase 實作；不是 production 真實資料上線；不是 actual shadow runner runtime；不讀 env；不建立 Supabase client；不是 DB read/write implementation。**

相關文件：V44–V58 全部 staging / shadow-runner spec、evidence、checklist、gate、sign-off 與 plan 文件。

---

## A. Scope

- V59 是 Staging Read-only Dry-run Execution Evidence Spec。
- V59 是 execution evidence structure，不是 execution evidence instance。
- V59 是 spec-only，不是 actual dry-run execution。
- V59 是 spec-only，不是 actual connection。
- V59 不把 actualDryRunExecuted 設為 true。
- V59 不把 actualDryRunEvidenceProvided 設為 true。
- V59 不把 manualSignoffCompleted 設為 true。
- V59 不把 manualSignoffEvidenceProvided 設為 true。
- V59 不把 stagingConnectionAllowed 設為 true。
- V59 不把 stagingConnectionReviewAllowed 設為 true。
- V59 不把 stagingDryRunExecutionAllowed 設為 true。
- V59 不是新功能。
- V59 不新增 UI。
- V59 不新增 API route。
- V59 不連 staging Supabase。
- V59 不接 production Supabase。
- V59 不讀 Supabase env key。
- V59 不寫 staging。
- V59 不寫 production。
- V59 不新增 SQL migration。
- V59 不建立 Supabase client。
- V59 不建立 actual shadow runner runtime。
- V59 不執行 actual shadow runner。
- V59 不切換 /api/portfolio。
- V59 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V59 不接真實行情。
- V59 不產生買賣指令。
- V59 不自動下單。

---

## B. Gate State Flags

- V58 execution gate exists but execution remains blocked。
- V57 dry-run plan exists but execution remains blocked。
- dryRunExecutionEvidenceSpecDefined = true。
- actualDryRunExecuted = false；actualDryRunEvidenceProvided = false。
- actualConnectionImplemented = false；actualConnectionAttempted = false。
- manualSignoffRequired = true；manualSignoffCompleted = false；manualSignoffEvidenceProvided = false。
- stagingConnectionAllowed = false；stagingConnectionReviewAllowed = false；stagingDryRunExecutionAllowed = false。
- productionReadinessAllowed = false。
- serviceRoleAllowedInAppRuntime = false；anonRoleAllowed = false；dashboardReadonlyRoleRequired = true。
- readOnlySelectOnlyRequired = true；writeOperationsBlocked = true；shadowOnlyRequired = true。
- killSwitchDefaultEnabled = true；portfolioApiMustRemainHardcoded = true。

---

## C. Evidence Item Shape

每個 evidence item 至少包含：`evidenceItemId`、`category`、`title`、`requiredEvidence`、`acceptedEvidenceFormat`、
`expectedState`、`providedState`、`status`、`requiredAfterDryRunExecution`、`blocksEvidenceAcceptance`、
`blocksProductionReadiness`、`manualReviewRequired`、`failureAction`、`notes`。

允許的 category：EXECUTION_IDENTITY、MANUAL_SIGNOFF、READ_ONLY_PROBE、NO_WRITE_PROOF、RLS_POLICY、ROLE_ACCESS、
SHADOW_COMPARISON、MISMATCH_CLASSIFICATION、STALE_EMPTY_ERROR_FALLBACK、KILL_SWITCH、ROLLBACK、PORTFOLIO_SOURCE_MODE、
API_ROUTE_SAFETY、DATA_SOURCE_SAFETY、TRADING_SAFETY、FINAL_REVIEW。

允許的 status：NOT_PROVIDED、NOT_REVIEWED、BLOCKED、PASS、FAIL、WARNING。

evidence items 至少 20 個（本實作 24 個），覆蓋全部 16 個 category。因 actual dry-run 尚未執行，需收集之 item status 為 NOT_PROVIDED / NOT_REVIEWED / BLOCKED。

---

## D. Rules

- actualDryRunExecuted / actualDryRunEvidenceProvided 必須 false。
- manualSignoffRequired 必須 true；manualSignoffCompleted / manualSignoffEvidenceProvided 必須 false。
- stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed 必須 false。
- productionReadinessAllowed 必須 false。
- decision 預設 NO_GO。
- evidence item 可以是 NOT_PROVIDED / NOT_REVIEWED / BLOCKED，因為這版只是 spec。
- 所有 requiredAfterDryRunExecution=true 且 status 不是 PASS 的 item 必須 blocksEvidenceAcceptance=true。
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

- Staging Read-only Dry-run Execution Evidence Spec
- execution evidence structure
- not execution evidence instance
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
- V58 execution gate exists but execution remains blocked
- V57 dry-run plan exists but execution remains blocked
- manualSignoffRequired = true
- manualSignoffCompleted = false
- manualSignoffEvidenceProvided = false
- actualDryRunExecuted = false
- actualDryRunEvidenceProvided = false
- stagingConnectionAllowed = false
- stagingConnectionReviewAllowed = false
- stagingDryRunExecutionAllowed = false
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

- `decision` 預設 NO_GO（actual dry-run 尚未執行；多數 evidence item NOT_PROVIDED / BLOCKED）。
- 允許 NO_GO / READY_FOR_REVIEW / BLOCKED / NOT_REVIEWED。
- decision 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## H. Future Gate

下一階段才是 **V60 Manual Sign-off Evidence Instance** 或 **V60 Staging Read-only Dry-run Execution Evidence Instance**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
