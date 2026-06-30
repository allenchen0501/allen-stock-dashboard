# Phase 2b — Shadow Comparison UI Shell

本文件定義 **fixture-only / disabled-real-data** 的 **Phase 2b Shadow Comparison UI Shell**：讓使用者可以在 /system/safety 看到未來 shadow comparison 的畫面結構，但 real quote candidate **固定為 DisabledRealQuoteProvider**，不得連線。

這一版只新增 UI component、fixture-only view model、pure function、validator、docs；**不建立任何真正 runtime connection**。mode = INTERFACE_ONLY_NOT_CONNECTED、decision = NO_GO、operationalUseAllowed = false。no fetch、no env read、no Supabase connection、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、no broker API、not PRODUCTION_READY。不翻任何 manual sign-off / staging connection / production switch 旗標。

---

## A. 結構

- view model：`use-cases/war-room/build-shadow-quote-comparison-view-model.ts`（`buildShadowQuoteComparisonViewModel`），以 Phase 2 locked contract + DisabledRealQuoteProvider 組出畫面所需欄位；real quote candidate 為 disabled snapshot（isRealData=false、verificationStatus=DISABLED）。
- component：`components/war-room/shadow-quote-comparison-card.tsx`（`ShadowQuoteComparisonCard`），純展示 shell，掛在 `/system/safety`。

---

## B. UI 顯示

- 標題：**Phase 2b Shadow Comparison UI Shell**。
- fixture quote（default）與 real quote candidate（DISABLED / not connected）並排。
- real quote candidate status = DISABLED、mode = INTERFACE_ONLY_NOT_CONNECTED、decision = NO_GO。
- price difference / missingRealQuote / staleDetected / conflictDetected / downgradeReason（real quote disabled 時 price difference 為「—」、missingRealQuote=true）。
- 旗標列：operationalUseAllowed=false、realDataConnected=false、fetchPerformed=false、envReadPerformed=false、supabaseConnected=false、apiRouteCreated=false、portfolioApiSwitched=false、productionReady=false、mapsToV67V68V69=true。

shell 明確標示：This is UI shell only · Real quote is disabled · Fixture remains default · No trading decision · No buy/sell command · No auto order · Not production ready。

---

## C. Validator

`scripts/validate-phase-2b-shadow-comparison-ui-shell.ts`（`npm run test:phase-2b-shadow-comparison-ui-shell`）檢查：component / view model / doc / package script 存在、UI 文字含 Phase 2b 標題與 DISABLED / NO_GO / INTERFACE_ONLY_NOT_CONNECTED 與所有旗標 literal（operationalUseAllowed=false … productionReady=false、mapsToV67V68V69=true）、UI 不含 affirmative 下單 / 自動交易 token、view model decision=NO_GO / mode=INTERFACE_ONLY_NOT_CONNECTED / realQuoteCandidateStatus=DISABLED / 所有 connection 旗標 false、safety page 有掛上卡片；並掃描 component + view model 禁止 token（含 broker / placeorder / autoorder / PRODUCTION_READY），確認未新增 API route。

> DisabledRealQuoteProvider 的 getQuote 不 fetch；本卡片只讀 view model（fixture + disabled snapshot），不連線、不讀 env、不接真實行情。

---

## D. Safety Boundary

- INTERFACE_ONLY_NOT_CONNECTED；NO_GO；fixture remains default；shadow mode 仍 non-operational。
- no fetch、no env read、no Supabase connection、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、no broker API。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。
- 受 V73 Safety Chain CI Guard 間接保護（Phase 2 locked contract 已在 chain 內；本 shell 不改變任何旗標）。

---

## E. Future

未來若要讓 real quote candidate 真的有資料，需先通過 Phase 2 exit criteria（owner 同意啟用 shadow runtime + CI 綠燈 + runtime PR scope 核准 + 預設仍 fixture + shadow non-operational + service role absence check）。在那之前，real quote candidate 永遠是 DisabledRealQuoteProvider，本卡片只是 UI 結構預覽。
