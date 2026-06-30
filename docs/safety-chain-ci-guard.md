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
- test:phase-2b-shadow-comparison-ui-shell（Phase 2b Shadow Comparison UI Shell；expectedDecision NO_GO、mode INTERFACE_ONLY_NOT_CONNECTED、real quote candidate status DISABLED）
- test:staging-shadow-runtime-scaffold（Staging Shadow Runtime Scaffold；expectedDecision NO_GO、mode SCAFFOLD_ONLY_NOT_CONNECTED、liveFetchAllowed/envReadAllowed/supabaseConnectionAllowed/portfolioApiSwitchAllowed/productionReady false、serviceRoleForbidden true）
- test:limited-live-fetch-dry-run-pr-scope（Limited Live Fetch Dry-run PR Scope；expectedDecision NO_GO、mode SCOPE_ONLY_NO_NETWORK_CODE、networkCodeAdded/liveFetchAllowed/envReadPerformed/supabaseConnected/apiRouteCreated/portfolioApiSwitched/productionReady false、ownerApprovalReceived false）
- test:limited-live-fetch-dry-run-implementation（Limited Live Fetch Dry-run Implementation；expectedDecision LIVE_FETCH_DRY_RUN_NON_OPERATIONAL、mode LIMITED_LIVE_FETCH_DRY_RUN_SHADOW_ONLY、approvedProviderOnly true、approvedProvider TWSE_TPEX、symbol 3019、channel tse_3019.tw、timeoutMs 3000、maxRetries 0、httpMethod GET、fallbackDisabledScaffoldCandidate true、defaultRealDataMode fixture、shadowOnly true、operationalUseAllowed/portfolioApiSwitchAllowed/productionReady/brokerApiAllowed/buySellCommandGenerated/autoOrderRequested false）
- test:limited-live-fetch-golden-snapshot（Golden Snapshot Validator for Limited Live Fetch；expectedDecision OFFLINE_DETERMINISTIC_SNAPSHOT_OK、mode OFFLINE_DETERMINISTIC_PARSER_SNAPSHOT；**offline deterministic parser validation** — 包含 success snapshot / baseline fallback snapshot / 12-case offline fallback matrix + 2 optional-field safety cases；fixed now 2026-06-30T00:00:00.000Z；offline=true、deterministic=true、parserSnapshot=true、liveFetchPerformed=false、smokeInvoked=false、smokeManualOnly=true、productionDataSwitchAllowed=false、operationalUseAllowed/productionReady false；symbol 3019、channel tse_3019.tw、timeoutMs 3000、maxRetries 0）
- test:limited-live-fetch-mock-fetch-boundary（Mock Fetch Boundary Validator for Limited Live Fetch；expectedDecision OFFLINE_DETERMINISTIC_BOUNDARY_OK、mode OFFLINE_DETERMINISTIC_REQUEST_BOUNDARY；**offline deterministic request boundary validation** — monkey-patch globalThis.fetch（mock fetch only，**不打真網路**），success case 斷言 fetch 只呼叫一次、URL 僅含 approved channel tse_3019.tw、method GET；unsupported symbol / fetch error / malformed response 皆 safe fallback；offline=true、deterministic=true、mockFetchOnly=true、realNetworkUsed=false、fetchMockRestored=true、liveFetchPerformed=false、smokeInvoked=false、smokeManualOnly=true、productionDataSwitchAllowed=false、operationalUseAllowed/productionReady false；symbol 3019、channel tse_3019.tw、timeoutMs 3000、maxRetries 0）
- test:limited-live-fetch-default-no-fetch-boundary（Default No-Fetch Boundary Validator for Limited Live Fetch；expectedDecision OFFLINE_DETERMINISTIC_DEFAULT_NO_FETCH_OK、mode OFFLINE_DETERMINISTIC_DEFAULT_RUNTIME_PATH；**offline deterministic default runtime path validation** — spy globalThis.fetch，驗證 default runtime path（`getReadonlyQuoteCandidate("3019")` 無 options、明確 `dryRunLiveFetch=false`、unsupported symbol）皆 **default path fetch call count = 0 / dryRunLiveFetch=false fetch call count = 0**、回 safe scaffold/disabled/non-operational candidate；offline=true、deterministic=true、defaultRuntimePath=true、dryRunLiveFetchDefault=false、realNetworkUsed=false、fetchMockRestored=true、liveFetchPerformed=false、smokeInvoked=false、smokeManualOnly=true、productionDataSwitchAllowed=false、operationalUseAllowed/productionReady false；symbol 3019、channel tse_3019.tw、timeoutMs 3000、maxRetries 0）

> 自 Default No-Fetch Safety Chain Integration 起，guard 共覆蓋 **21** 支 check（V60–V72 + Phase 2 locked implementation + Phase 2b shadow comparison UI shell + Staging Shadow Runtime Scaffold + Limited Live Fetch Dry-run PR Scope + Limited Live Fetch Dry-run Implementation + Golden Snapshot Validator for Limited Live Fetch + Mock Fetch Boundary Validator for Limited Live Fetch + Default No-Fetch Boundary Validator for Limited Live Fetch）。
>
> Default no-fetch boundary 是 **offline deterministic default runtime path validation**：spy globalThis.fetch，驗證**沒有明確 dryRunLiveFetch=true 時 default runtime path 不打任何網路**（default path fetch call count = 0、dryRunLiveFetch=false fetch call count = 0），測試後還原 fetch；**不打真網路、不跑 smoke、no production data switch**。
>
> Golden snapshot 是 **offline deterministic parser validation**：只驅動已 export 的 pure parser，包含 success snapshot / fallback snapshot / fallback matrix；**不打 live fetch、不跑 smoke、no production data switch**。
>
> Mock fetch boundary 是 **offline deterministic request boundary validation**：攔截 globalThis.fetch（mock 回固定 TWSE response，**不打真網路**），驗證 request 僅打 approved channel、method GET，以及 unsupported symbol / fetch error / malformed response 安全 fallback；測試後還原 fetch；**不打 live fetch、不跑 smoke、no production data switch**。
>
> **manual smoke script `smoke:limited-live-fetch:3019` 永遠不納入 CI guard / safety chain。** 它只能手動執行；失敗只顯示 fallback disabled scaffold candidate，不得作為 CI 條件，guard validator 會明確檢查 `test:safety-chain` 與 CHAIN_SPECS 都不含此 smoke script。observation validators 與 deterministic clock validator 維持 standalone，本版不新增進 safety-chain。

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
