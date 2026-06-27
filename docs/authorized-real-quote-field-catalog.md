# Authorized Real Quote Field Catalog & Source Boundary

本文件定義 V66 Authorized Real Quote Field Catalog & Source Boundary：spec-only / deterministic contract，用來描述 V65 expectedRealFields 未來允許從哪些資料來源取得、目前授權狀態、連線狀態、缺資料行為、來源衝突行為，以及進入 staging read-only / shadow comparison 前需要哪些 evidence。

本版仍是 fixture-only / deterministic contract / validator / optional UI health card。V66 是 authorized source catalog / source boundary，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

整個 catalog 模式為 SPEC_ONLY_NOT_CONNECTED：所有來源 connectionStatus = NOT_CONNECTED、authorizationStatus = NOT_AUTHORIZED 或 PENDING_MANUAL_REVIEW。

---

## A. Layer（延伸 V65）

expectedRealField → authorized source candidate → authorization status → connection status → evidence requirement → mapping readiness

---

## B. Types

新增型別（`use-cases/war-room/authorized-real-quote-field-catalog-contract.ts`）：

- AuthorizedRealQuoteSourceCandidate
- AuthorizedRealQuoteFieldCatalogItem
- AuthorizedRealQuoteFieldCatalog
- AuthorizedRealQuoteSourceBoundary
- AuthorizedRealQuoteFieldCatalogValidation

---

## C. Source candidates

sourceCandidates 為候選來源 catalog，全部 NOT_CONNECTED / NOT_AUTHORIZED 或 PENDING_MANUAL_REVIEW：

- Yahoo Finance Taiwan candidate
- TWSE official candidate
- TPEx official candidate
- Goodinfo candidate
- Supabase staging read-only candidate
- Broker import candidate

每個 candidate：sourceName、sourceType、sourceRole、authorizationStatus（NOT_AUTHORIZED / PENDING_MANUAL_REVIEW）、connectionStatus = NOT_CONNECTED、runtimeEnabled = false、fetchAllowed = false、envRequired = false、envReadPerformed = false、apiRouteRequired = false、apiRouteCreated = false、supabaseRequired = false、supabaseConnected = false、operationalUseAllowed = false、evidenceRequiredBeforeUse、conflictPriorityRank、notes。

注意：這些只是候選來源 catalog。不得真的連線。不得 fetch。不得讀 env。不得使用任何 API key。不得建立 API route。

---

## D. Field catalog items

fieldCatalogItems 覆蓋 V65 expectedRealFields 實際使用到的欄位，並包含 operational metadata：lastPrice、closePrice、openPrice、highPrice、lowPrice、volume、referenceClose、supportLevel、resistanceLevel、targetModelOutput、dataTimestamp、dataSource、verificationStatus。

每個 item：fieldName、fieldCategory、required、mappedV65ExpectedFieldNames、acceptableSources、preferredSourceName、fallbackSourceNames、currentStatus = SPEC_DEFINED_NOT_CONNECTED、dataFreshnessRequirement、validationRule、missingDataBehavior、conflictBehavior、manualReviewRequired = true、manualSignoffRequired = true、manualSignoffCompleted = false、stagingReadOnlyRequired = true、stagingReadOnlyConnected = false、shadowComparisonRequired = true、shadowComparisonCompleted = false、productionSwitchAllowed = false、operationalUseAllowed = false。每個 acceptableSource 都必須能在 sourceCandidates 找到。

---

## E. Source boundary

AuthorizedRealQuoteSourceBoundary：manualSignoffRequired = true、manualSignoffCompleted = false、stagingReadOnlyRequired = true、stagingReadOnlyConnected = false、shadowComparisonRequired = true、shadowComparisonCompleted = false、productionSwitchAllowed = false、serviceRoleAllowedInAppRuntime = false、writeOperationsAllowed = false、buySellCommandGenerated = false、autoOrderRequested = false。

---

## F. Validator

Validator（`scripts/validate-authorized-real-quote-field-catalog.ts`）檢查：contractVersion = V66、specName 含 Authorized Real Quote Field Catalog & Source Boundary、sourceCatalogMode = SPEC_ONLY_NOT_CONNECTED、decision READY_FOR_UI_REVIEW 或 NO_GO、V65 expectedRealFields 的 fieldName 都有 fieldCatalogItem 覆蓋、每個 fieldCatalogItem 至少有一個 acceptableSources、每個 acceptableSource 都能在 sourceCandidates 找到、每個 sourceCandidate connectionStatus = NOT_CONNECTED、runtimeEnabled false、fetchAllowed false、operationalUseAllowed false、每個 fieldCatalogItem currentStatus = SPEC_DEFINED_NOT_CONNECTED，以及 manualSignoffRequired true、manualSignoffCompleted false、stagingReadOnlyRequired true、stagingReadOnlyConnected false、shadowComparisonRequired true、shadowComparisonCompleted false、productionSwitchAllowed false、serviceRoleAllowedInAppRuntime false、writeOperationsAllowed false、buySellCommandGenerated false、autoOrderRequested false、realDataConnected false、runtimeCreated false、apiRouteCreated false、envReadPerformed false、fetchPerformed false、supabaseConnected false、databaseWritePerformed false、portfolioApiSwitched false、productionReady false，且不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## G. UI

- `/system/safety` 新增 Authorized Real Quote Field Catalog card，顯示 contractVersion V66、sourceCatalogMode SPEC_ONLY_NOT_CONNECTED、sourceCandidates count、fieldCatalogItems count、all sources NOT_CONNECTED、all runtimeEnabled false、all fetchAllowed false、manualSignoffCompleted false、stagingReadOnlyConnected false、shadowComparisonCompleted false、productionSwitchAllowed false、operationalUseAllowed false。
- `/holdings` 候選池加一行：「Authorized source catalog: SPEC_ONLY_NOT_CONNECTED」「尚未授權任何真實行情來源，fixture 區間不可作為正式操作依據」。

---

## H. Safety Boundary

- SPEC_ONLY_NOT_CONNECTED；所有來源 NOT_CONNECTED；NOT_AUTHORIZED 或 PENDING_MANUAL_REVIEW。
- manualSignoffRequired true；manualSignoffCompleted false；stagingReadOnlyRequired true；stagingReadOnlyConnected false；shadowComparisonRequired true；shadowComparisonCompleted false；productionSwitchAllowed false；serviceRoleAllowedInAppRuntime false；writeOperationsAllowed false。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## I. Future

未來某個來源被授權、manual sign-off 完成、staging read-only 連線且 review 通過、shadow comparison 完成且一致後，才可考慮把該來源從 NOT_AUTHORIZED / PENDING_MANUAL_REVIEW 往前推進；在那之前一律 SPEC_ONLY_NOT_CONNECTED，尚未授權任何真實行情來源，fixture 區間不可作為正式操作依據。
