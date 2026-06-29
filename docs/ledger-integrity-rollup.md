# Ledger Integrity Rollup & Safety Gate Dashboard

本文件定義 V72 Ledger Integrity Rollup & Safety Gate Dashboard：把 V70 evidence ledger 與 V71 transition / source contract integrity 結果收斂成一個 ledger integrity rollup，並在 /system/safety 顯示成更清楚的安全總覽。

本版仍是 spec-only / deterministic rollup + safety gate dashboard + validator。V72 是 ledger integrity rollup + safety gate dashboard，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。不真的接受任何 production evidence。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

rollupMode = SPEC_ONLY_SAFETY_GATE；decision = NO_GO；ledgerDecision = NO_GO；transitionDecision = NO_GO。

---

## A. Data flow

V70 ledger + V71 transition preview + V71 source contract integrity → V72 ledger integrity rollup → safety gate dashboard

---

## B. Types

新增型別（`ledger-integrity-rollup-contract.ts`）：

- LedgerIntegrityHealthStatus（enum：HEALTHY_SPEC_ONLY、PENDING_EVIDENCE、BLOCKED_NO_GO、MISSING_SOURCE_CONTRACT、PREVIEW_ONLY_LOCKED、PRODUCTION_LOCKED）。
- LedgerIntegrityRollupItem。
- LedgerSafetyGateBlocker。
- LedgerIntegrityRollup。
- LedgerIntegrityRollupValidation。

---

## C. Pure functions

`ledger-integrity-rollup-engine.ts`：buildLedgerIntegrityRollup(ledger, transitionContract)、deriveLedgerHealthStatus(rollupItems)、deriveLedgerSafetyGateBlockers(ledger, transitionContract)、validateLedgerIntegrityRollup(rollup)。無副作用、無 I/O、不連線、不讀 env、不 fetch、不讀時鐘、不寫資料。

---

## D. Rollup items & safety gate blockers

每個 rollupItem 對應一筆 V70 evidence item，合併 V71 source contract integrity（sourceContractExists true）與 transition preview（PREVIEW_ONLY）；healthStatus 依狀態給 PENDING_EVIDENCE / PRODUCTION_LOCKED / MISSING_SOURCE_CONTRACT / BLOCKED_NO_GO（PREVIEW_ONLY_LOCKED / HEALTHY_SPEC_ONLY 為未來狀態）；operationalUseAllowed false、manualReviewRequired true。

safetyGateBlockers 至少包含 blockerType：MANUAL_SIGNOFF_PENDING、EVIDENCE_PENDING、STAGING_LOCKED、REAL_QUOTE_LOCKED、PRODUCTION_SWITCH_LOCKED，每個 resolved false。

---

## E. Validator

Validator（`scripts/validate-ledger-integrity-rollup.ts`）檢查：contractVersion = V72、specName 含 Ledger Integrity Rollup & Safety Gate Dashboard、rollupMode = SPEC_ONLY_SAFETY_GATE、decision / ledgerDecision / transitionDecision = NO_GO、sourceIntegrityOk true、allSourceContractsExist true、allEvidencePending true、allTransitionsPreviewOnly true、actualLedgerMutated false、stagingConnectionAllowed / realQuoteConnectionAllowed / productionSwitchAllowed / operationalUseAllowed / realDataConnected / runtimeCreated / apiRouteCreated / envReadPerformed / fetchPerformed / supabaseConnected / databaseWritePerformed / portfolioApiSwitched / productionReady 全 false、rollupItems 非空且覆蓋 V70 evidenceItems 或 V71 integrity items、每個 rollupItem sourceContractExists true 且 operationalUseAllowed false、safetyGateBlockers 非空、每個 blocker resolved false、必須含 MANUAL_SIGNOFF_PENDING / EVIDENCE_PENDING / STAGING_LOCKED / REAL_QUOTE_LOCKED / PRODUCTION_SWITCH_LOCKED；不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## F. UI

- `/system/safety` 新增 Ledger Integrity Rollup card（contractVersion V72、rollupMode SPEC_ONLY_SAFETY_GATE、decision NO_GO、sourceIntegrityOk true、allSourceContractsExist true、allEvidencePending true、allTransitionsPreviewOnly true、actualLedgerMutated false、safetyGateBlockers count、stagingConnectionAllowed false、realQuoteConnectionAllowed false、productionSwitchAllowed false、productionReady false）。
- `/holdings` 候選池加一行：「Ledger integrity rollup: NO_GO / SPEC_ONLY_SAFETY_GATE」「source contracts 完整，但 evidence 全部 pending，真實行情仍鎖定」。

---

## G. Safety Boundary

- SPEC_ONLY_SAFETY_GATE；decision NO_GO；ledgerDecision NO_GO；transitionDecision NO_GO。
- sourceIntegrityOk true；allSourceContractsExist true；allEvidencePending true；allTransitionsPreviewOnly true；actualLedgerMutated false。
- stagingConnectionAllowed false；realQuoteConnectionAllowed false；productionSwitchAllowed false；operationalUseAllowed false。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## H. Future

未來逐項提供並接受人工 evidence 後，safety gate blockers 才會逐一 resolved；只有所有 blocker 解除、source contracts 完整、shadow comparison 一致並完成 final approval 後，rollup 才可能脫離 NO_GO；在那之前一律 SPEC_ONLY_SAFETY_GATE，source contracts 完整但 evidence 全部 pending，真實行情仍鎖定。
