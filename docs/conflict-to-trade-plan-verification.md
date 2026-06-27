# Conflict Resolution to Trade Plan Verification Downgrade Matrix

本文件定義 V68 Conflict Resolution to Trade Plan Verification Downgrade Matrix：spec-only / deterministic contract，描述 V67 conflict resolution result 如何回寫或影響 V63 CandidateTradePlan 的 verificationStatus、UI display mode、operational block reason、observation-only 狀態與 trade plan visibility。

本版仍是 fixture-only / deterministic / validator / optional UI health card。V68 是 conflict result → trade plan verification / downgrade matrix，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

matrixMode = SPEC_ONLY_NOT_CONNECTED。VERIFIED future-only：目前 sample result 不得使用 VERIFIED。

---

## A. Data flow

QuoteSourceConflictResolutionResult → TradePlanVerificationDowngrade → CandidateTradePlan UI state → observation only / blocked / hidden / stale / conflict

---

## B. Types

新增型別（`conflict-to-trade-plan-verification-contract.ts`）：

- TradePlanVerificationStatus（enum：FIXTURE_ONLY、NOT_CONNECTED、SOURCE_CONFLICT、STALE_DATA、MISSING_DATA、UNAUTHORIZED_SOURCE、MANUAL_REVIEW_REQUIRED、OBSERVATION_ONLY、BLOCKED、VERIFIED）。VERIFIED future-only，不可在目前 sample 使用。
- TradePlanDisplayMode（enum：SHOW_FIXTURE_WITH_WARNING、SHOW_OBSERVATION_ONLY、SHOW_BLOCKED_CONFLICT、SHOW_BLOCKED_MISSING_DATA、SHOW_BLOCKED_STALE_DATA、SHOW_BLOCKED_UNAUTHORIZED、HIDE_OPERATIONAL_LEVELS）。
- TradePlanVerificationDowngradeRule。
- TradePlanVerificationDowngradeResult。
- ConflictToTradePlanVerificationMatrix。
- ConflictToTradePlanVerificationValidation。

---

## C. Pure functions

`conflict-to-trade-plan-verification-engine.ts`：

1. mapConflictResultToVerificationStatus(result)：依 degradedStatus 對應 TradePlanVerificationStatus（永不回傳 VERIFIED）。
2. mapConflictResultToDisplayMode(result)：依 degradedStatus 對應 TradePlanDisplayMode。
3. buildTradePlanDowngradeResult(tradePlan, conflictResult, rules)：產生單筆 downgrade result（observation only、operationalUseAllowed false）。
4. validateTradePlanDowngradeConsistency(results)：檢查 VERIFIED 不在 sample、display mode 與 signal 一致。

無副作用、無 I/O、不連線、不讀 env、不 fetch、不讀時鐘、不寫資料。

---

## D. Downgrade behavior

- missing data → MISSING_DATA / SHOW_BLOCKED_MISSING_DATA（隱藏 operational levels）。
- stale data → STALE_DATA / SHOW_BLOCKED_STALE_DATA。
- unauthorized source → UNAUTHORIZED_SOURCE / SHOW_BLOCKED_UNAUTHORIZED。
- source conflict → SOURCE_CONFLICT / SHOW_BLOCKED_CONFLICT。
- not connected（未偵測額外衝突）→ NOT_CONNECTED / SHOW_FIXTURE_WITH_WARNING（observation only）。

所有 downgrade result：observation only、operationalUseAllowed false、buySellCommandGenerated false、autoOrderRequested false、requiresManualReview true、manualSignoffRequired true、manualSignoffCompleted false、productionSwitchAllowed false。

---

## E. Validator

Validator（`scripts/validate-conflict-to-trade-plan-verification.ts`）檢查：contractVersion = V68、specName 含 Conflict Resolution to Trade Plan Verification Downgrade Matrix、matrixMode = SPEC_ONLY_NOT_CONNECTED、decision READY_FOR_UI_REVIEW 或 NO_GO、V67 sampleResolutionResults 每筆都有對應 downgrade、每個 downgrade result 對應一個 V63 CandidateTradePlan、conflictDetected 時 verificationStatus 不得 VERIFIED、目前 sample 不得使用 VERIFIED、operationalUseAllowed 全 false、observationOnly 全 true、buySellCommandGenerated / autoOrderRequested 全 false、manualSignoffRequired 全 true、manualSignoffCompleted 全 false、productionSwitchAllowed 全 false，以及 sourceResolutionStatus 含 missing / stale / unauthorized / conflict 時 displayMode 一致，並 realDataConnected / runtimeCreated / apiRouteCreated / envReadPerformed / fetchPerformed / supabaseConnected / databaseWritePerformed / portfolioApiSwitched / productionReady 全 false；不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## F. UI

- `/system/safety` 新增 Conflict to Trade Plan Verification Downgrade card，顯示 contractVersion V68、matrixMode SPEC_ONLY_NOT_CONNECTED、downgradeRules count、sampleDowngradeResults count、all operationalUseAllowed false、all observationOnly true、all manualSignoffCompleted false、productionSwitchAllowed false、realDataConnected false、fetchPerformed false、supabaseConnected false。
- `/holdings` 候選池加一行：「Trade plan verification: SPEC_ONLY_NOT_CONNECTED」「來源衝突或缺值時，承接區會降級為觀察，不可作為正式操作依據」。

---

## G. Safety Boundary

- SPEC_ONLY_NOT_CONNECTED；observation only；operationalUseAllowed false。
- manualSignoffRequired true；manualSignoffCompleted false；productionSwitchAllowed false。
- VERIFIED future-only（目前 sample 不使用）。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## H. Future

未來來源連線、授權、manual sign-off 完成、staging read-only review 通過、shadow comparison 一致後，trade plan 才可能從 downgrade 狀態回到 VERIFIED；在那之前一律降級，來源衝突或缺值時承接區降級為觀察，不可作為正式操作依據。
