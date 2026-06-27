# Real Quote Source Conflict Resolution Policy

本文件定義 V67 Real Quote Source Conflict Resolution Policy：spec-only / deterministic contract，用來描述未來多個授權來源同時提供同一欄位時，系統如何處理來源衝突、缺值、延遲、時間戳不一致、優先權、降級與禁止操作狀態。

本版仍是 fixture-only / deterministic conflict resolution / validator / optional UI health card。V67 是 source conflict resolution policy，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

policyMode = SPEC_ONLY_NOT_CONNECTED：所有候選值 isAuthorized=false、isConnected=false、operationalUseAllowed=false；resolution 永遠 degraded、永遠不允許 operational use。

---

## A. Layer（延伸 V66）

multiple source candidate values → deterministic conflict policy → selected source / degraded status / blocked operational use

source priority 直接使用 V66 sourceCandidates 的 conflictPriorityRank，不另外亂寫一份。

---

## B. Types

新增型別（`real-quote-source-conflict-resolution-policy-contract.ts`）：

- QuoteSourceCandidateValue：sourceName、fieldName、valueKind、valuePreview、valueTimestamp、isAvailable、isStale、isAuthorized = false、isConnected = false、sourcePriorityRank、verificationStatus、operationalUseAllowed = false。
- QuoteSourceConflictRule：ruleName、appliesToFieldCategory、primarySourcePriority、staleDataBehavior、missingDataBehavior、timestampMismatchBehavior、valueMismatchBehavior、unauthorizedSourceBehavior、notConnectedSourceBehavior、conflictOutcome、operationalUseAllowed = false。
- QuoteSourceConflictResolutionResult：fieldName、conflictDetected、selectedSourceName、selectedValuePreview、rejectedSourceNames、degradedStatus、resolutionReason、verificationStatus、operationalUseAllowed = false、requiresManualReview = true、manualSignoffRequired = true、manualSignoffCompleted = false、productionSwitchAllowed = false。
- QuoteSourceConflictResolutionPolicy。
- QuoteSourceConflictResolutionValidation。

---

## C. Pure functions

`real-quote-source-conflict-resolution-engine.ts`：

1. rankSourceCandidateValues(values, sourceCandidates)：依 V66 conflictPriorityRank 排序。
2. detectQuoteSourceConflict(values)：偵測 missing data、stale data、timestamp mismatch、value mismatch、unauthorized source、not connected source。
3. resolveQuoteSourceConflict(values, policy)：deterministic 解析，輸出 degraded result，operationalUseAllowed 永遠 false。
4. buildConflictResolutionResult(fieldName, values, policy)：包裝成單一欄位的 result。

無副作用、無 I/O、不連線、不讀 env、不 fetch、不讀時鐘、不寫資料。

---

## D. Conflict behavior

- missing data：缺值即排除該來源；全缺則 BLOCKED_MISSING_DATA。
- stale data：stale 超時即排除；僅剩 stale 則 BLOCKED_STALE_DATA。
- timestamp mismatch：時間戳不一致即標示衝突。
- value mismatch：數值不一致即標示衝突，依 conflictPriorityRank 取較高優先。
- unauthorized source：未授權來源不得採用（spec 全部未授權）。
- not connected source：未連線來源不得採用（spec 全部未連線）→ BLOCKED_NOT_CONNECTED。

conflictOutcome：輸出 degraded result，operationalUseAllowed false，requires manual review。

---

## E. Validator

Validator（`scripts/validate-real-quote-source-conflict-resolution-policy.ts`）檢查：contractVersion = V67、specName 含 Real Quote Source Conflict Resolution Policy、policyMode = SPEC_ONLY_NOT_CONNECTED、decision READY_FOR_UI_REVIEW 或 NO_GO、V66 sourceCandidates 全部有 conflictPriorityRank、sampleCandidateValues 的 sourceName 都存在於 V66 sourceCandidates、fieldName 都存在於 V66 fieldCatalogItems、rankSourceCandidateValues 依 conflictPriorityRank 排序、detectQuoteSourceConflict 能偵測上述六種衝突、resolveQuoteSourceConflict 不得允許 operationalUseAllowed=true、所有 sampleResolutionResults operationalUseAllowed false、manualSignoffRequired true、manualSignoffCompleted false、productionSwitchAllowed false、realDataConnected / runtimeCreated / apiRouteCreated / envReadPerformed / fetchPerformed / supabaseConnected / databaseWritePerformed / portfolioApiSwitched / productionReady 全 false，且不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## F. UI

- `/system/safety` 新增 Real Quote Source Conflict Resolution Policy card，顯示 contractVersion V67、policyMode SPEC_ONLY_NOT_CONNECTED、conflictRules count、sampleResolutionResults count、all operationalUseAllowed false、manualSignoffCompleted false、productionSwitchAllowed false、realDataConnected false、fetchPerformed false、supabaseConnected false。
- `/holdings` 候選池加一行：「Conflict policy: SPEC_ONLY_NOT_CONNECTED」「多來源衝突解析尚未接真實資料，fixture 區間不可作為正式操作依據」。

---

## G. Safety Boundary

- SPEC_ONLY_NOT_CONNECTED；deterministic conflict resolution。
- operationalUseAllowed false；manualSignoffRequired true；manualSignoffCompleted false；productionSwitchAllowed false。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## H. Future

未來來源被授權、連線、manual sign-off 完成、staging read-only review 通過、shadow comparison 一致後，conflict policy 才會以真實多來源值運作；在那之前一律 SPEC_ONLY_NOT_CONNECTED，多來源衝突解析尚未接真實資料，fixture 區間不可作為正式操作依據。
