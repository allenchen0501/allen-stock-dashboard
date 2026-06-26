# Staging Read-only Connection Review Gate

本文件定義 Allen Stock Dashboard 的 **Staging Read-only Connection Review Gate**：進入未來 staging read-only connection review 的 gate 條件、人工 sign-off 欄位、allowed / blocked 狀態、read-only / shadow-only constraints，以及 rollback / kill switch / evidence requirements。

**本階段（V55）是 review gate，not actual connection。本輪只定義 gate；不實際連線、不是 staging Supabase 實作、不是 production 真實資料上線、不是 actual shadow runner runtime、不讀 env、不建立 Supabase client、不是 DB read/write implementation。
目前沒有人工 sign-off evidence，因此 manualSignoffCompleted = false、stagingConnectionAllowed = false、stagingConnectionReviewAllowed = false，預設 decision = NO_GO。**

相關文件：V44–V54 全部 staging / shadow-runner spec、evidence 與 checklist 文件。

---

## A. Scope

- V55 是 Staging Read-only Connection Review Gate。
- V55 是 review gate，不是 actual connection。
- V55 不是新功能。
- V55 不新增 UI。
- V55 不新增 API route。
- V55 不連 staging Supabase。
- V55 不接 production Supabase。
- V55 不讀 Supabase env key。
- V55 不寫 staging。
- V55 不寫 production。
- V55 不新增 SQL migration。
- V55 不建立 Supabase client。
- V55 不建立 actual shadow runner runtime。
- V55 不執行 actual shadow runner。
- V55 不切換 /api/portfolio。
- V55 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V55 不接真實行情。
- V55 不產生買賣指令。
- V55 不自動下單。

---

## B. Gate State Flags

- V54 checklist passed = true。
- manualSignoffRequired = true。
- manualSignoffCompleted = false。
- manualSignoffEvidenceProvided = false。
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

## C. Requirement Item Shape

每個 requirement item 至少包含：`requirementId`、`category`、`title`、`sourceVersion`、
`requiredBeforeConnectionReview`、`requiredBeforeActualConnection`、`expectedState`、`actualState`、`status`、
`blocksConnectionReview`、`blocksActualConnection`、`blocksProductionReadiness`、`manualReviewRequired`、`notes`。

允許的 category：MANUAL_SIGNOFF、V54_CHECKLIST、SUPABASE_PROJECT、ENVIRONMENT_VARIABLES、RLS_POLICY、ROLE_ACCESS、
READ_ONLY_OPERATION、SHADOW_ONLY、KILL_SWITCH、PORTFOLIO_SOURCE_MODE、API_ROUTE_SAFETY、UI_SAFETY、
DATA_SOURCE_SAFETY、PRODUCTION_READINESS、ROLLBACK_PLAN。

允許的 status：PASS、FAIL、WARNING、NOT_REVIEWED、BLOCKED。

requirement items 至少 20 個（本實作 31 個），覆蓋全部 15 個 category。

---

## D. Gate Rules

- manualSignoffRequired 必須 true；manualSignoffCompleted 必須 false；manualSignoffEvidenceProvided 必須 false。
- stagingConnectionAllowed 必須 false；stagingConnectionReviewAllowed 必須 false。
- actualConnectionImplemented 必須 false；actualConnectionAttempted 必須 false。
- productionReadinessAllowed 必須 false。
- 若任何 blocksConnectionReview = true 的 item status 不是 PASS，decision 必須 NO_GO。
- manual signoff item 必須 NOT_REVIEWED 或 BLOCKED。
- 因 manual signoff 未完成，decision 預設 NO_GO。
- v54ChecklistPassed = true，但不得因此允許 connection。
- serviceRoleAllowedInAppRuntime 必須 false；anonRoleAllowed 必須 false；dashboardReadonlyRoleRequired 必須 true。
- readOnlySelectOnlyRequired 必須 true；writeOperationsBlocked 必須 true；shadowOnlyRequired 必須 true。
- portfolioApiMustRemainHardcoded 必須 true；/api/portfolio must not be switched。
- 不得出現 PRODUCTION_READY。

---

## E. Future Connection Constraints (read-only / shadow-only)

未來真正做 connection review / connection 時仍須：

- PORTFOLIO_SOURCE_MODE must remain hardcoded。
- /api/portfolio must not be switched。
- fixture/hardcoded must not be overridden by staging。
- mismatch must not promote staging。
- empty / stale / error result must not override hardcoded。
- kill switch must be enabled by default。
- read-only select-only；insert / update / delete 一律 blocked。
- shadow-only；不寫 staging、不寫 production。

---

## F. Safety Language

- Staging Read-only Connection Review Gate
- review gate
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
- V54 checklist passed = true
- manualSignoffRequired = true
- manualSignoffCompleted = false
- manualSignoffEvidenceProvided = false
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

- `decision` 預設 NO_GO（manual signoff 未完成、manual signoff evidence 未提供）。
- 允許 NO_GO / READY_FOR_REVIEW / BLOCKED / NOT_REVIEWED。
- decision 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。
- 即使未來所有 evidence item PASS，仍須人工提供 sign-off evidence（manualSignoffCompleted true）才可能往下。

---

## H. Future Gate

下一階段才是 **V56 Manual Sign-off Evidence** 或 **V56 Staging Read-only Connection Dry-run Plan**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
