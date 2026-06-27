# Trade Plan Fixture Source Descriptor & Mapping Boundary

本文件定義 V64 Trade Plan Fixture Source Descriptor & Mapping Boundary：把 V63 structured trade plan 用的 fixture price levels（原本散落在 V63 builder 內的 PRICE_LEVELS）抽成獨立的 fixture source descriptor contract，並建立 future real quote mapping boundary。

本版仍是 fixture-only / deterministic contract / validator / UI structure。V64 是 fixture source descriptor + mapping boundary，不是 real-data mapping、不是 Supabase connection、不是 production trading readiness。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。

---

## A. Types

新增型別（`use-cases/war-room/candidate-price-level-fixture-source-contract.ts`）：

- CandidatePriceLevelFixtureSource
- CandidatePriceLevelDescriptor（Candidate Price Level Descriptor）
- CandidatePriceLevelMappingBoundary（Mapping Boundary）
- CandidatePriceLevelFixtureSourceBundle
- CandidatePriceLevelFixtureSourceValidation

---

## B. Candidate Price Level Descriptor

每個 descriptor 必須包含：symbol、name、sourceType = "fixture_mock"、sourceLabel、sourceDescription、fixtureAsOfText、currency = "TWD"、buyZoneLower、buyZoneUpper、stopLossLower、stopLossUpper、targetLower、targetUpper、confidence、operationalUseAllowed = false、realMappingStatus = "NOT_CONNECTED"、futureRealSourceAllowed = false、generatedBuySellCommand = false、autoOrderRequested = false。

descriptor 是 structured trade plan 承接區 / 失效防守區 / 目標觀察區的價位來源（fixture_mock），realMappingStatus 永遠是 NOT_CONNECTED。

---

## C. Mapping Boundary

CandidatePriceLevelMappingBoundary 必須包含：realSourceCandidateName、expectedRealFields、mappingNotConnectedReason、requiredEvidenceBeforeConnection、manualSignoffRequired = true、manualSignoffCompleted = false、stagingReadOnlyRequired = true、productionSwitchAllowed = false。

未來若要以真實報價取代 fixture，必須先跨過此 boundary：完成 manual sign-off（manualSignoffRequired true、manualSignoffCompleted false）、通過 staging read-only review（stagingReadOnlyRequired true），且 productionSwitchAllowed false 維持不變。本版不翻任何旗標。

---

## D. Builder & Boundary

Builder（`build-candidate-price-level-fixture-source-contract.ts`）：

- 擁有 canonical fixture price level descriptors（single source of truth）。
- V63 builder 不再散落手寫 PRICE_LEVELS，改由 descriptor 取得價位。
- 每個 V63 trade plan 都能找到對應 descriptor，且 descriptor 與 trade plan 的價位完全一致。
- 不改變 V63 CandidateTradePlan 對外型別與 UI 使用方式。

---

## E. Validator

Validator（`scripts/validate-candidate-price-level-fixture-source.ts`）檢查：

- 每個 V63 trade plan 都有 descriptor。
- 每個 descriptor 都對應 existing candidate symbol。
- descriptor 與 V63 trade plan 價位完全一致。
- sourceType 必須是 fixture_mock。
- realMappingStatus 必須是 NOT_CONNECTED。
- operationalUseAllowed 必須是 false（operationalUseAllowed false）。
- futureRealSourceAllowed 必須是 false（futureRealSourceAllowed false）。
- productionSwitchAllowed 必須是 false（productionSwitchAllowed false）。
- manualSignoffRequired 必須是 true（manualSignoffRequired true）。
- manualSignoffCompleted 必須是 false（manualSignoffCompleted false）。
- stagingReadOnlyRequired 必須是 true（stagingReadOnlyRequired true）。
- generatedBuySellCommand 必須是 false。
- autoOrderRequested 必須是 false。
- 不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## F. UI

- daily candidate pools / trade plan 區塊加上 fixture source descriptor 標示。
- 明確顯示 realMappingStatus = NOT_CONNECTED。
- 明確顯示「未連真實報價」。
- 明確顯示「fixture 區間不可作為正式操作依據」。
- `/system/safety` 增加 spec-only mapping boundary health card。

---

## G. Safety Boundary

- fixture-only；deterministic contract；sourceType fixture_mock；realMappingStatus NOT_CONNECTED。
- operationalUseAllowed false；futureRealSourceAllowed false；productionSwitchAllowed false。
- manualSignoffRequired true；manualSignoffCompleted false；stagingReadOnlyRequired true。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## H. Future

未來真實報價來源被授權、manual sign-off 完成、staging read-only review 通過、fixture vs real shadow comparison 一致後，才可考慮跨過 mapping boundary；在那之前 descriptor 一律 fixture_mock、realMappingStatus NOT_CONNECTED，fixture 區間不可作為正式操作依據。
