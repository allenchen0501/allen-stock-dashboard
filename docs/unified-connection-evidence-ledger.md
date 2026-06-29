# Unified Connection Evidence Ledger

本文件定義 V70 Unified Connection Evidence Ledger：把 V64 / V65 / V66 / V67 / V68 / V69 分散描述的 evidence requirements 收斂成單一真相表，追蹤未來接 staging read-only / real quote / shadow comparison / production switch 前必須完成哪些人工 evidence。

本版仍是 spec-only / deterministic contract / validator / optional UI health card。V70 是 unified evidence ledger，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

ledgerMode = SPEC_ONLY_PENDING_EVIDENCE，decision = NO_GO（pending evidence ledger，尚不可連線）。stagingConnectionAllowed false、realQuoteConnectionAllowed false、productionSwitchAllowed false、manualSignoffCompleted false、actualEvidenceAttached false。

---

## A. Types

新增型別（`unified-connection-evidence-ledger-contract.ts`）：UnifiedConnectionEvidenceItem、UnifiedConnectionEvidenceCategory、UnifiedConnectionEvidenceLedger、UnifiedConnectionEvidenceDependency、UnifiedConnectionEvidenceLedgerValidation。

---

## B. Evidence items（20）

所有 item 目前 evidenceStatus PENDING、evidenceProvided false、evidenceAccepted false、actualEvidenceAttached false：

1. OWNER_MANUAL_SIGNOFF
2. SOURCE_AUTHORIZATION_YAHOO
3. SOURCE_AUTHORIZATION_TWSE
4. SOURCE_AUTHORIZATION_TPEX
5. SOURCE_AUTHORIZATION_GOODINFO
6. SOURCE_AUTHORIZATION_BROKER_IMPORT
7. STAGING_SUPABASE_PROJECT_CONFIRMATION
8. STAGING_READONLY_ROLE_CONFIRMATION
9. RLS_SELECT_ONLY_CONFIRMATION
10. SERVICE_ROLE_NOT_IN_APP_RUNTIME
11. WRITE_OPERATION_BLOCK_CONFIRMATION
12. API_ROUTE_NO_SWITCH_CONFIRMATION
13. REAL_QUOTE_MAPPING_REVIEW
14. SOURCE_CONFLICT_POLICY_REVIEW
15. TRADE_PLAN_DOWNGRADE_UI_REVIEW
16. SHADOW_COMPARISON_PLAN
17. SHADOW_COMPARISON_RESULT_PENDING
18. ROLLBACK_RUNBOOK
19. KILL_SWITCH_CONFIRMATION
20. PRODUCTION_SWITCH_FINAL_APPROVAL

每個 item：evidenceId、category、title、description、requiredBeforeStage、requiredByVersions（至少引用 V64–V69 其中之一）、sourceContracts（非空）、ownerRole、evidenceStatus = PENDING、evidenceProvided = false、evidenceAccepted = false、manualReviewRequired = true、manualSignoffRequired、manualSignoffCompleted = false、blocksStagingConnection、blocksRealQuoteConnection、blocksProductionSwitch、riskIfMissing、allowedPlaceholder = true、actualEvidenceAttached = false。

---

## C. Categories & dependencies

categories 依 categoryId 聚合 item，completedCount = 0、pendingCount = itemCount、categoryStatus = PENDING。dependencies 描述 evidence 之間的 PREREQUISITE / BLOCKS 關係，皆引用存在的 evidenceId。

---

## D. Validator

Validator（`scripts/validate-unified-connection-evidence-ledger.ts`）檢查：contractVersion = V70、specName 含 Unified Connection Evidence Ledger、ledgerMode = SPEC_ONLY_PENDING_EVIDENCE、decision = NO_GO、stagingConnectionAllowed / realQuoteConnectionAllowed / productionSwitchAllowed / manualSignoffCompleted / actualEvidenceAttached / realDataConnected / runtimeCreated / apiRouteCreated / envReadPerformed / fetchPerformed / supabaseConnected / databaseWritePerformed / portfolioApiSwitched / productionReady 全 false、20 個 required evidence items 全存在、all evidenceStatus PENDING、all evidenceProvided false、all evidenceAccepted false、all actualEvidenceAttached false、all categories pendingCount > 0、completedCount = 0、categories 正確聚合 item counts、requiredByVersions 引用 V64–V69、sourceContracts 非空、dependencies 引用存在 evidenceId，並 no item allows production switch / real quote connection / staging connection（皆未 accepted）；不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## E. UI

- `/system/safety` 新增 Unified Connection Evidence Ledger card（contractVersion V70、ledgerMode SPEC_ONLY_PENDING_EVIDENCE、decision NO_GO、evidenceItems count、pendingCount、completedCount 0、stagingConnectionAllowed false、realQuoteConnectionAllowed false、productionSwitchAllowed false、manualSignoffCompleted false、actualEvidenceAttached false、productionReady false）。
- `/holdings` 候選池加一行：「Connection evidence ledger: NO_GO / PENDING」「真實行情與 staging 連線仍需人工 evidence，不可作為正式操作依據」。

---

## F. Safety Boundary

- SPEC_ONLY_PENDING_EVIDENCE；decision NO_GO。
- evidenceStatus PENDING；evidenceProvided false；evidenceAccepted false；actualEvidenceAttached false。
- stagingConnectionAllowed false；realQuoteConnectionAllowed false；productionSwitchAllowed false；manualSignoffCompleted false。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## G. Future

未來每完成一項人工 evidence，才把該 item 從 PENDING 往前推進並附上 actual evidence；只有當所有 blocker 清除、manual sign-off 完成、shadow comparison 一致後，才可能逐步解鎖 staging read-only → real quote → production switch。在那之前一律 NO_GO，真實行情與 staging 連線仍需人工 evidence，不可作為正式操作依據。
