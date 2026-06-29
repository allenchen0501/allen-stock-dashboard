# Downgraded Trade Plan UI Behavior

本文件定義 V69 Downgraded Trade Plan UI Behavior：把 V68 downgrade matrix 真正反映到 /holdings 的 candidate / structured trade plan UI 行為。當 downgrade result 顯示 SOURCE_CONFLICT、STALE_DATA、MISSING_DATA、UNAUTHORIZED_SOURCE、MANUAL_REVIEW_REQUIRED、OBSERVATION_ONLY 或 BLOCKED 時，UI 依 TradePlanDisplayMode 決定承接區、目標區、風報比與提示文字如何呈現。

本版仍是 fixture-only / deterministic UI behavior / validator。V69 是 downgrade matrix → UI behavior，不是 real quote connection、不是 Supabase connection、不是 staging dry-run execution、不是 production trading readiness。no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

behaviorMode = FIXTURE_ONLY_NOT_CONNECTED。每個 UI state observation only、operationalUseAllowed false、this is not a buy/sell command。

---

## A. Data flow

TradePlanVerificationDowngradeResult → V69 UI behavior → CandidateTradePlan card display state

---

## B. Types

新增型別（`downgraded-trade-plan-ui-behavior-contract.ts`）：DowngradedTradePlanUiState、DowngradedTradePlanUiVisibility、DowngradedTradePlanUiWarning、DowngradedTradePlanUiBehaviorContract、DowngradedTradePlanUiBehaviorValidation。

## C. Pure functions

`downgraded-trade-plan-ui-behavior-engine.ts`：buildDowngradedTradePlanUiState(tradePlan, downgradeResult)、resolveTradePlanVisibility(downgradeResult)、resolveTradePlanWarning(downgradeResult)、validateDowngradedTradePlanUiState(uiState)。無副作用、無 I/O、不連線、不讀 env、不 fetch、不讀時鐘、不寫資料。

---

## D. UI behavior 規則（依 TradePlanDisplayMode）

- SHOW_FIXTURE_WITH_WARNING：buyZone / targetZone / riskReward 可見，必須顯示 fixture/mock warning，actionLabel =「觀察」。
- SHOW_OBSERVATION_ONLY：zones 可見但加 observation only warning、不顯示為正式目標價、標示不可操作，actionLabel =「等待資料確認」。
- SHOW_BLOCKED_CONFLICT：必須 showConflictWarning，operationalUseAllowed false，actionLabel =「資料衝突，禁止操作」，不得任何買進語氣。
- SHOW_BLOCKED_MISSING_DATA：必須 showMissingDataWarning，可隱藏 zones，actionLabel =「資料不足，等待」。
- SHOW_BLOCKED_STALE_DATA：必須 showStaleDataWarning，actionLabel =「資料過期，等待更新」。
- SHOW_BLOCKED_UNAUTHORIZED：必須 showUnauthorizedWarning，actionLabel =「來源未授權，禁止操作」。
- HIDE_OPERATIONAL_LEVELS：buyZoneVisible / targetZoneVisible / riskRewardVisible 全 false，hideOperationalLevels true，actionLabel =「隱藏操作區間」。

所有 actionLabel 不得包含買進 / 進場 / 加碼 / buy / buy now / enter / add position。所有 warningMessage 必須明確說不可作為正式操作依據。

---

## E. Validator

Validator（`scripts/validate-downgraded-trade-plan-ui-behavior.ts`）檢查：contractVersion = V69、specName 含 Downgraded Trade Plan UI Behavior、behaviorMode = FIXTURE_ONLY_NOT_CONNECTED、decision READY_FOR_UI_REVIEW 或 NO_GO、每個 V68 sampleDowngradeResult 都有 uiState、每個 uiState 對應一個 V63 CandidateTradePlan、observationOnly 全 true、operationalUseAllowed / buySellCommandGenerated / autoOrderRequested 全 false、manualSignoffRequired 全 true、manualSignoffCompleted 全 false、productionSwitchAllowed 全 false、HIDE_OPERATIONAL_LEVELS 隱藏所有 zones、SHOW_BLOCKED_CONFLICT/MISSING/STALE/UNAUTHORIZED 顯示對應 warning、actionLabel 無買進語氣、warningMessage 含不可作為正式操作依據，並 realDataConnected / runtimeCreated / apiRouteCreated / envReadPerformed / fetchPerformed / supabaseConnected / databaseWritePerformed / portfolioApiSwitched / productionReady 全 false；不得新增 API route、不得連 Supabase、不得讀 env、不得寫 DB、不得 fetch / axios、不得接真實行情、不得切 /api/portfolio、不得標記 PRODUCTION_READY。

---

## F. UI

- `/holdings` daily candidate pools / structured trade plan card 依 uiState 顯示或隱藏 buy zone / target zone / risk reward，顯示 warningTitle / warningMessage / actionLabel / observationOnly / operationalUseAllowed=false / 這不是買賣指令（this is not a buy/sell command）。
- `/system/safety` 新增 Downgraded Trade Plan UI Behavior card（contractVersion V69、behaviorMode FIXTURE_ONLY_NOT_CONNECTED、uiStates count、all operationalUseAllowed false、all observationOnly true、all manualSignoffCompleted false、productionSwitchAllowed false、realDataConnected false、fetchPerformed false、supabaseConnected false）。

---

## G. Safety Boundary

- FIXTURE_ONLY_NOT_CONNECTED；observation only；operationalUseAllowed false；this is not a buy/sell command；fixture/mock warning。
- manualSignoffRequired true；manualSignoffCompleted false；productionSwitchAllowed false。
- no Supabase connection、no env read、no DB write、no fetch、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## H. Future

未來來源連線、授權、manual sign-off 完成、staging read-only review 通過、shadow comparison 一致後，trade plan card 才可能脫離 downgrade 顯示；在那之前一律 fixture-only，承接區依降級狀態觀察或隱藏，不可作為正式操作依據。
