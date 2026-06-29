# Evidence Ledger Transition Engine & Source Contract Integrity

本文件定義 V71 Evidence Ledger Transition Engine & Source Contract Integrity：描述 V70 evidence ledger 未來如何在人工 evidence 被提供與接受時重新計算狀態（PREVIEW only，不真的變更 ledger），並檢查 V70 ledger item 的 sourceContracts 是否真的指向現有 contract/doc 檔案。

本版仍是 spec-only / deterministic transition engine + source contract integrity validator + UI health card。V71 是 evidence transition preview + source contract integrity，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不真的接受任何 production evidence，不翻任何 manual sign-off / staging connection / production switch 旗標。

transitionMode = SPEC_ONLY_PREVIEW_NOT_CONNECTED；decision = NO_GO；ledgerDecisionAfterPreview NO_GO；actualLedgerMutated false。

---

## A. Data flow

evidence item PENDING → V71 transition preview → category aggregation recalculation → ledger decision recalculation → blockers remain locked unless all required evidence accepted

---

## B. Types

新增型別（`evidence-ledger-transition-contract.ts`）：EvidenceTransitionInput、EvidenceTransitionResult、EvidenceLedgerRecalculationResult、EvidenceSourceContractIntegrityItem、EvidenceLedgerTransitionContract、EvidenceLedgerTransitionValidation。

---

## C. Pure functions

`evidence-ledger-transition-engine.ts`：

1. applyEvidenceTransitionPreview(ledger, input)：產生 preview-only transition result（actualLedgerMutated false）。
2. recalculateEvidenceCategories(ledger)：重新統計 category counts。
3. recalculateLedgerDecision(ledger)：重新計算 total / completed / pending / accepted，未完成全部 evidence 前回 NO_GO。
4. validateEvidenceSourceContractIntegrity(ledger, fileExists)：檢查每個 sourceContract 是否存在（fileExists 由外部注入，保持純函式）。

無副作用、無自身 I/O（file existence 由注入 predicate 提供）、不連線、不讀 env、不 fetch、不讀時鐘、不寫資料。

---

## D. Transition rules

1. V71 只做 preview-only transition result（PREVIEW_ONLY）。
2. V71 不得真的把 V70 ledger 變成 completed。
3. actualLedgerMutated false 永遠成立。
4. 即使 preview 接受單一 evidence，ledger decision 仍 NO_GO，因為 20 項 evidence 不可能全部完成。
5. stagingConnectionAllowed false。
6. realQuoteConnectionAllowed false。
7. productionSwitchAllowed false。
8. productionReady false。
9. 所有 runtime / env / fetch / DB / Supabase 旗標 false。

---

## E. Source contract integrity

每個 evidence item 的 sourceContracts 都展開成 sourceContractIntegrityItems，逐一檢查 sourceContractExists true、sourceContractKind 為 contract 或 doc、referencedVersion 至少包含 V64 / V65 / V66 / V67 / V68 / V69 / V70 其中之一。

---

## F. Validator

Validator（`scripts/validate-evidence-ledger-transition.ts`）檢查：contractVersion = V71、specName 含 Evidence Ledger Transition Engine & Source Contract Integrity、transitionMode = SPEC_ONLY_PREVIEW_NOT_CONNECTED、decision = NO_GO、ledgerDecisionAfterPreview NO_GO、actualLedgerMutated false、transitionPreviewResults 非空且全部 PREVIEW_ONLY / actualLedgerMutated false、recalculate 正確統計 total / pending / completed 且 decision NO_GO、sourceContractIntegrityItems 覆蓋所有 evidence item 的 sourceContracts 且非空、sourceContractExists 全部 true、sourceContractKind 為 contract 或 doc、referencedVersion 含 V64–V70、stagingConnectionAllowed / realQuoteConnectionAllowed / productionSwitchAllowed / manualSignoffCompleted / actualEvidenceAttached / realDataConnected / runtimeCreated / apiRouteCreated / envReadPerformed / fetchPerformed / supabaseConnected / databaseWritePerformed / portfolioApiSwitched / productionReady 全 false；不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## G. UI

- `/system/safety` 新增 Evidence Ledger Transition Engine card（contractVersion V71、transitionMode SPEC_ONLY_PREVIEW_NOT_CONNECTED、decision NO_GO、ledgerDecisionAfterPreview NO_GO、actualLedgerMutated false、transitionPreviewResults count、sourceContractIntegrityItems count、all source contracts exist、stagingConnectionAllowed false、realQuoteConnectionAllowed false、productionSwitchAllowed false、productionReady false）。
- `/holdings` 候選池加一行：「Evidence transition engine: NO_GO / PREVIEW_ONLY」「即使 preview 單項 evidence，真實行情與 staging 連線仍維持鎖定」。

---

## H. Safety Boundary

- SPEC_ONLY_PREVIEW_NOT_CONNECTED；PREVIEW_ONLY；actualLedgerMutated false；ledgerDecisionAfterPreview NO_GO。
- stagingConnectionAllowed false；realQuoteConnectionAllowed false；productionSwitchAllowed false；productionReady false。
- sourceContractExists true（整合 V64–V70 sourceContracts）。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## I. Future

未來真的要把某項 evidence 變成 completed，需在 V70 ledger 實際附上人工 evidence 並通過審查；V71 僅提供 preview 與 integrity 檢查，不會也不能讓 ledger 進入 GO；即使 preview 單項 evidence，真實行情與 staging 連線仍維持鎖定。
