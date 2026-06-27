# Descriptor-to-Real Quote Mapping Readiness Matrix

本文件定義 V65 Descriptor-to-Real Quote Mapping Readiness Matrix：spec-only / deterministic contract，用來描述未來真實行情欄位如何對應到 V64 的 fixture descriptor 欄位，再如何流入 V63 structured trade plan。

本版仍是 fixture-only / deterministic contract / validator / optional UI health card。V65 是 mapping readiness matrix，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

---

## A. Three-layer data flow

futureRealQuoteField → CandidatePriceLevelDescriptor field → CandidateTradePlan field

- real.lastPrice / real.closePrice / reference.close → descriptor.buyZoneLower / buyZoneUpper → tradePlan.buyZone.lower / upper
- real.lowPrice / supportLevel → descriptor.stopLossLower / stopLossUpper → tradePlan.riskReward.stopLossLower / stopLossUpper
- real.highPrice / resistanceLevel / targetModelOutput → descriptor.targetLower / targetUpper → tradePlan.riskReward.targetLower / targetUpper

目前每一層的 sourceType 仍是 fixture_mock，未來層級為 real_quote_pending；realMappingStatus 永遠是 NOT_CONNECTED，mappingReadiness 永遠是 SPEC_DEFINED_NOT_CONNECTED。

---

## B. Types

新增型別（`use-cases/war-room/descriptor-to-real-quote-mapping-contract.ts`）：

- RealQuoteExpectedField：fieldName、fieldCategory、required、acceptableSources、dataFreshnessRequirement、validationRule、missingDataBehavior、conflictBehavior、operationalUseAllowed = false。
- DescriptorFieldMapping：descriptorFieldName、descriptorFieldType、currentSourceType = "fixture_mock"、futureSourceType = "real_quote_pending"、mappedExpectedRealFields、fallbackBehavior、manualReviewRequired = true。
- TradePlanFieldMapping：tradePlanFieldName、derivedFromDescriptorField、deterministicTransform、transformRuntimeEnabled = false、operationalUseAllowed = false。
- DescriptorToRealQuoteMappingItem。
- DescriptorToRealQuoteMappingMatrix。
- DescriptorToRealQuoteMappingReadinessValidation。

---

## C. Mapping Item

每筆 DescriptorToRealQuoteMappingItem 包含：symbol、name、descriptorAvailable = true、tradePlanAvailable = true、realQuoteConnected = false、realMappingStatus = "NOT_CONNECTED"、mappingReadiness = "SPEC_DEFINED_NOT_CONNECTED"、expectedRealFields、descriptorFieldMappings、tradePlanFieldMappings、requiredEvidenceBeforeConnection、manualSignoffRequired = true、manualSignoffCompleted = false、stagingReadOnlyRequired = true、stagingReadOnlyConnected = false、shadowComparisonRequired = true、shadowComparisonCompleted = false、productionSwitchAllowed = false、operationalUseAllowed = false、generatedBuySellCommand = false、autoOrderRequested = false。

---

## D. Validator

Validator（`scripts/validate-descriptor-to-real-quote-mapping.ts`）檢查：

- contractVersion = V65；specName 含 Descriptor-to-Real Quote Mapping Readiness Matrix。
- 每個 V64 descriptor 都有一筆 mapping item；每個 V63 trade plan 都有一筆 mapping item；descriptor / trade plan / mapping symbol 完全一致。
- realQuoteConnected false、realMappingStatus NOT_CONNECTED、mappingReadiness SPEC_DEFINED_NOT_CONNECTED。
- manualSignoffRequired true、manualSignoffCompleted false。
- stagingReadOnlyRequired true、stagingReadOnlyConnected false。
- shadowComparisonRequired true、shadowComparisonCompleted false。
- productionSwitchAllowed false、operationalUseAllowed false、generatedBuySellCommand false、autoOrderRequested false。
- expectedRealFields / descriptorFieldMappings / tradePlanFieldMappings 不可為空。
- 每個 descriptorFieldMapping 必須能對應到 V64 descriptor 欄位；每個 tradePlanFieldMapping 必須能對應到 V63 trade plan 欄位。
- 不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## E. UI

- `/system/safety` 新增 Descriptor-to-Real Quote Mapping Readiness card，顯示 contractVersion V65、realMappingStatus NOT_CONNECTED、mappingReadiness SPEC_DEFINED_NOT_CONNECTED、realQuoteConnected false、stagingReadOnlyConnected false、shadowComparisonCompleted false、productionSwitchAllowed false、operationalUseAllowed false。
- `/holdings` candidate / trade plan 區塊加一行：「Real quote mapping: SPEC_DEFINED_NOT_CONNECTED」「尚未連真實行情，fixture 區間不可作為正式操作依據」。

---

## F. Safety Boundary

- fixture-only；deterministic contract；sourceType fixture_mock；futureSourceType real_quote_pending；realMappingStatus NOT_CONNECTED；mappingReadiness SPEC_DEFINED_NOT_CONNECTED。
- manualSignoffRequired true；manualSignoffCompleted false；stagingReadOnlyRequired true；stagingReadOnlyConnected false；shadowComparisonRequired true；shadowComparisonCompleted false；productionSwitchAllowed false；operationalUseAllowed false。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## G. Future

未來真實行情來源被授權、manual sign-off 完成、staging read-only 連線且 review 通過、shadow comparison 完成且一致後，才可考慮把 mappingReadiness 從 SPEC_DEFINED_NOT_CONNECTED 往前推進；在那之前一律 NOT_CONNECTED，fixture 區間不可作為正式操作依據。
