# Manual Sign-off Evidence Spec

本文件定義 Allen Stock Dashboard 的 **Manual Sign-off Evidence Spec**：未來人工簽核 evidence 的資料結構、必填證據、簽核對象、簽核範圍、外部檢查項目，以及 GO/NO-GO 規則。

**本階段（V56）是 sign-off evidence structure，not actual sign-off。本輪不把 manualSignoffCompleted / manualSignoffEvidenceProvided / stagingConnectionAllowed / stagingConnectionReviewAllowed 設為 true；不實際人工簽核；不是 actual staging connection；不讀 env；不建立 Supabase client；不是 DB read/write implementation。**

相關文件：V44–V55 全部 staging / shadow-runner spec、evidence、checklist 與 gate 文件。

---

## A. Scope

- V56 是 Manual Sign-off Evidence Spec。
- V56 是 sign-off evidence structure，不是 actual sign-off。
- V56 不把 manualSignoffCompleted 設為 true。
- V56 不把 manualSignoffEvidenceProvided 設為 true。
- V56 不把 stagingConnectionAllowed 設為 true。
- V56 不把 stagingConnectionReviewAllowed 設為 true。
- V56 不是新功能。
- V56 不新增 UI。
- V56 不新增 API route。
- V56 不連 staging Supabase。
- V56 不接 production Supabase。
- V56 不讀 Supabase env key。
- V56 不寫 staging。
- V56 不寫 production。
- V56 不新增 SQL migration。
- V56 不建立 Supabase client。
- V56 不建立 actual shadow runner runtime。
- V56 不執行 actual shadow runner。
- V56 不切換 /api/portfolio。
- V56 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V56 不接真實行情。
- V56 不產生買賣指令。
- V56 不自動下單。

---

## B. Gate State Flags

- V55 connection review gate exists but decision remains NO_GO。
- manualSignoffRequired = true。
- manualSignoffCompleted = false。
- manualSignoffEvidenceProvided = false。
- manualSignerIdentityVerified = false。
- manualSignerHasAuthority = false。
- actualManualSignoffPerformed = false。
- stagingConnectionAllowed = false。
- stagingConnectionReviewAllowed = false。
- actualConnectionImplemented = false。
- actualConnectionAttempted = false。
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

## C. Evidence Requirement Item Shape

每個 evidence requirement 至少包含：`evidenceId`、`category`、`title`、`requiredEvidence`、`acceptedEvidenceFormat`、
`expectedState`、`providedState`、`status`、`requiredBeforeManualSignoff`、`requiredBeforeConnectionReview`、
`requiredBeforeActualConnection`、`blocksManualSignoff`、`blocksConnectionReview`、`blocksActualConnection`、
`blocksProductionReadiness`、`manualReviewRequired`、`notes`。

允許的 category：SIGNER_IDENTITY、SIGNER_AUTHORITY、V55_GATE、SUPABASE_PROJECT_IDENTITY、STAGING_URL_VERIFICATION、
ENVIRONMENT_SECRET_HANDLING、ROLE_ACCESS、RLS_SELECT_ONLY、WRITE_BLOCKING、SHADOW_ONLY、PORTFOLIO_SOURCE_MODE、
KILL_SWITCH、ROLLBACK_PLAN、DATA_SOURCE_SAFETY、TRADING_SAFETY、PRODUCTION_READINESS。

允許的 status：PASS、FAIL、WARNING、NOT_PROVIDED、NOT_REVIEWED、BLOCKED。

evidence requirement items 至少 20 個（本實作 25 個），覆蓋全部 16 個 category。因 sign-off evidence 尚未提供，需提供之 item status 為 NOT_PROVIDED。

---

## D. Rules

- manualSignoffRequired 必須 true；manualSignoffCompleted / manualSignoffEvidenceProvided 必須 false。
- manualSignerIdentityVerified / manualSignerHasAuthority / actualManualSignoffPerformed 必須 false。
- stagingConnectionAllowed / stagingConnectionReviewAllowed 必須 false。
- actualConnectionImplemented / actualConnectionAttempted 必須 false。
- productionReadinessAllowed 必須 false。
- v55ConnectionReviewGatePassed 可以 true，但 v55Decision 必須 NO_GO。
- 因 sign-off evidence 尚未提供，decision 預設 NO_GO。
- 所有 requiredBeforeManualSignoff=true 且 status 非 PASS 的 item 必須 blocksManualSignoff=true。
- 所有 blocksConnectionReview=true 且 status 非 PASS 的 item 必須讓 stagingConnectionReviewAllowed=false。
- evidence requirement 可以是 NOT_PROVIDED / NOT_REVIEWED / BLOCKED，因為這版只是 spec。
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

- Manual Sign-off Evidence Spec
- sign-off evidence structure
- not actual sign-off
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
- V55 connection review gate exists but decision remains NO_GO
- manualSignoffRequired = true
- manualSignoffCompleted = false
- manualSignoffEvidenceProvided = false
- manualSignerIdentityVerified = false
- manualSignerHasAuthority = false
- stagingConnectionAllowed = false
- stagingConnectionReviewAllowed = false
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

- `decision` 預設 NO_GO（sign-off evidence 尚未提供；簽核身分 / 權限未驗證）。
- 允許 NO_GO / READY_FOR_REVIEW / BLOCKED / NOT_REVIEWED。
- decision 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。
- 即使未來部分 evidence PASS，仍須由人工提供完整 sign-off evidence 並由有權限者簽核才可能往下。

---

## H. Future Gate

下一階段才是 **V57 Manual Sign-off Evidence Instance** 或 **V57 Staging Read-only Connection Dry-run Plan**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
