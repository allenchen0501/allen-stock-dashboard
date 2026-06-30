# Safety Chain CI Guard

本文件定義 V73 Safety Chain CI Guard：一支 spec-only / deterministic 的 single CI guard，用一個 contract + validator 彙總檢查 V60–V72 全部安全鏈狀態，確保所有既有 validator 都能通過，且任何 commit 都不能偷偷把 NO_GO / false / fixture-only / not connected / no API route / no Supabase / no env / no fetch / no production switch 等安全旗標翻掉。

本版仍是 spec-only / deterministic CI guard contract + validator + package script。V73 是 safety chain CI guard，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。不真的接受任何 production evidence。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

guardMode = SPEC_ONLY_CI_GUARD；decision = READY_FOR_CI_GUARD（代表 guard 本身就緒，並非 production ready）。

---

## A. Data flow

V60–V72 safety chain → single CI guard → one command confirms all gates stay locked

---

## B. Types

新增型別（`safety-chain-ci-guard-contract.ts`）：SafetyChainCiGuardCheck、SafetyChainCiGuardResult、SafetyChainCiGuardContract、SafetyChainCiGuardValidation。

---

## C. Builder

`build-safety-chain-ci-guard-contract.ts` 以 in-process（無 child process、無 spawn）方式呼叫 V60–V72 每一支 builder，確認其 decision 仍維持鎖定值，並掃描每個 bundle 是否有任何安全旗標被翻成 true。每支對應一個 critical check。

CI guard 覆蓋的 scripts（V60–V72）：

- test:allen-war-room-operational-layout
- test:allen-score-scoring-model
- test:allen-score-deterministic-scoring-engine
- test:structured-candidate-trade-plan
- test:candidate-price-level-fixture-source
- test:descriptor-to-real-quote-mapping
- test:authorized-real-quote-field-catalog
- test:real-quote-source-conflict-resolution-policy
- test:conflict-to-trade-plan-verification
- test:downgraded-trade-plan-ui-behavior
- test:unified-connection-evidence-ledger
- test:evidence-ledger-transition
- test:ledger-integrity-rollup
- test:phase-2-locked-implementation（Phase 2 Locked Real Quote Interface；expectedDecision NO_GO、mode INTERFACE_ONLY_NOT_CONNECTED）

> 自 Phase 2 Safety Chain Integration 起，guard 共覆蓋 **14** 支 check（V60–V72 + Phase 2 locked implementation）。

---

## D. Preserved safety states

CI guard 確認以下安全狀態仍被保留：fixture/mock safe mode、NOT_CONNECTED、SPEC_ONLY_NOT_CONNECTED、SPEC_ONLY_PENDING_EVIDENCE、SPEC_ONLY_PREVIEW_NOT_CONNECTED、SPEC_ONLY_SAFETY_GATE、NO_GO；READY_FOR_UI_REVIEW is not production ready（只能用於 UI/spec review）；realDataConnected false、runtimeCreated false、apiRouteCreated false、envReadPerformed false、fetchPerformed false、supabaseConnected false、databaseWritePerformed false、portfolioApiSwitched false、productionReady false、operationalUseAllowed false、productionSwitchAllowed false、buySellCommandGenerated false、autoOrderRequested false；allRuntimeFlagsFalse true、allOperationalUseBlocked true、productionSwitchStillBlocked true。

---

## E. Validator

Validator（`scripts/validate-safety-chain-ci-guard.ts`）檢查：contractVersion = V73、specName 含 Safety Chain CI Guard、guardMode = SPEC_ONLY_CI_GUARD、decision = READY_FOR_CI_GUARD、checks 非空、覆蓋 V60–V72 scripts、每個 check critical=true 且 passed=true、result.failedChecks=0、criticalFailedChecks=0、allCriticalPassed true、allNoGoLocksPreserved true、allRuntimeFlagsFalse true、allOperationalUseBlocked true、productionSwitchStillBlocked true、realDataConnected / runtimeCreated / apiRouteCreated / envReadPerformed / fetchPerformed / supabaseConnected / databaseWritePerformed / portfolioApiSwitched / productionReady 全 false；不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## F. Commands

- `npm run test:safety-chain-ci-guard`：跑 V73 guard validator。
- `npm run test:safety-chain`：依序跑 V60–V72 全部 validator + V73 guard，一個指令確認整條鏈仍鎖定。

---

## G. UI

`/system/safety` 加一張 Safety Chain CI Guard 卡片：contractVersion V73、guardMode SPEC_ONLY_CI_GUARD、allCriticalPassed true、allRuntimeFlagsFalse true、productionSwitchStillBlocked true、productionReady false。

---

## H. Safety Boundary

- SPEC_ONLY_CI_GUARD；READY_FOR_CI_GUARD（READY_FOR_UI_REVIEW is not production ready）。
- allRuntimeFlagsFalse true；allOperationalUseBlocked true；productionSwitchStillBlocked true；productionReady false。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## I. Future

未來每新增一版安全鏈，應把對應 script 加入 guard 的 CHAIN_SPECS 與 test:safety-chain；guard 的角色是防止任何 commit 偷翻安全旗標，本身不連線、不接真實資料、不代表 production ready。
