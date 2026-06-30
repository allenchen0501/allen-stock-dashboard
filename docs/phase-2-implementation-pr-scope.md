# Phase 2 — Implementation PR Scope & Locked Interface Contract

本文件定義 **spec-only / code-interface-only** 的 Phase 2 implementation PR scope：先定義 Phase 2 implementation 會新增哪些型別、interface、disabled provider、shadow comparison contract 與 validator，但**仍不得真正連線**。

這一版可以新增 TypeScript 型別與 pure functions，但**不得新增任何真正 runtime connection**。contractVersion = PHASE_2_LOCKED_INTERFACE、mode = INTERFACE_ONLY_NOT_CONNECTED、decision = NO_GO。

**嚴格禁止**：不連 Supabase、不讀 env value、不 fetch、不 axios、不寫 DB、不接真實行情、不新增真正 API route、不切 /api/portfolio、不接 broker API、不產生買賣指令、不自動下單、不標記 PRODUCTION_READY、不翻 manual sign-off / staging connection / production switch 旗標。

---

## 1. 新增的型別 / interface

`use-cases/war-room/phase-2-locked-real-quote-contract.ts`：

- **RealDataMode**：`fixture`（default）/ `shadow` / `real-readonly`。
- **RealQuoteProviderId**：`yahoo` / `twse` / `tpex` / `mixed-public` / `disabled`。
- **RealQuoteProviderStatus**：`DISABLED` / `PLANNED` / `SHADOW_ONLY` / `REAL_READONLY_LOCKED`。
- **ReadonlyQuoteSnapshot**：symbol / market / sourceName / sourceProvider / price / open / high / low / previousClose / volume / sourceTimestamp / receivedAt / isRealData / isStale / verificationStatus / operationalUseAllowed=false。
- **QuoteProvider**：providerId / providerName / status / supports / getQuote(symbol): Promise&lt;ReadonlyQuoteSnapshot&gt;。
- **ShadowQuoteComparison**：symbol / fixtureQuote / realQuoteCandidate / priceDifference / priceDifferencePercent / timestampDifferenceSeconds / conflictDetected / staleDetected / missingRealQuote / downgradeReason / mapsToV67V68V69=true / operationalUseAllowed=false。
- **Phase2LockedImplementationContract**：contractVersion / mode / decision / defaultRealDataMode=fixture / shadowModeAllowed=false / realReadonlyAllowed=false / 全部 connection 旗標 false。

---

## 2. Disabled provider

`use-cases/war-room/phase-2-disabled-real-quote-provider.ts`：

- **DisabledRealQuoteProvider**（`buildDisabledRealQuoteProvider()`）：implements QuoteProvider，status=DISABLED。
- getQuote **不得 fetch**：以 `Promise.resolve(...)` 回傳 disabled / not connected snapshot，不做任何網路呼叫。
- disabled snapshot：isRealData=false、operationalUseAllowed=false、price 等數值為 null、verificationStatus=DISABLED。

> 本階段唯一可被實例化的 provider 就是 disabled provider；yahoo / twse / tpex / mixed-public 僅列在 catalog 為 PLANNED，**沒有實作、沒有連線**。**no broker provider、no order provider、no auto order。**

---

## 3. Pure functions

`build-phase-2-locked-implementation-contract.ts`：

1. `buildDisabledRealQuoteProvider()`（in provider file）。
2. `buildDisabledQuoteSnapshot(symbol, providerId)`（in provider file）。
3. `buildShadowQuoteComparison(fixtureQuote, realQuoteCandidate)`：fixture vs real 並排比較；real candidate 為 disabled 時 missingRealQuote=true、downgradeReason 映射回 V67/V68/V69；operationalUseAllowed=false。
4. `buildPhase2LockedImplementationContract()`：組裝 locked contract（NO_GO / interface-only）。
5. `validatePhase2LockedImplementationContract(contract)`：驗證所有 lock 不變量。

無副作用、無 I/O、不連線、不讀 env value、不 fetch、不寫資料。

---

## 4. Validator

`scripts/validate-phase-2-locked-implementation.ts`（`npm run test:phase-2-locked-implementation`）檢查：contractVersion = PHASE_2_LOCKED_INTERFACE、mode = INTERFACE_ONLY_NOT_CONNECTED、decision = NO_GO、defaultRealDataMode = fixture、shadowModeAllowed=false、realReadonlyAllowed=false、realDataConnected / fetchPerformed / envReadPerformed / supabaseConnected / apiRouteCreated / portfolioApiSwitched / buySellCommandGenerated / autoOrderRequested / productionReady 全 false、DisabledRealQuoteProvider status=DISABLED 且 getQuote 不 fetch、disabled snapshot isRealData=false 且 operationalUseAllowed=false、ShadowQuoteComparison operationalUseAllowed=false 且 mapsToV67V68V69=true；並掃描新檔案禁止 token（含 broker / placeorder / PRODUCTION_READY），確認未新增 API route。

---

## 5. Env switch（語義保留，本階段不讀值）

- `REAL_DATA_MODE`：**fixture default**；shadow / real-readonly 本階段 locked。
- `REAL_QUOTE_PROVIDER`：yahoo / twse / tpex / mixed-public（僅 catalog，未連線）。
- `NEXT_PUBLIC_REAL_DATA_ENABLED`：false（kill switch off）。
- `SUPABASE_URL` / `SUPABASE_READONLY_ANON_KEY`：名稱存在但本階段不讀值；**no service role key**。

---

## 6. Explicit forbidden list

- no fetch、no env read、no Supabase connection、no real market data、no API route、no /api/portfolio switch、no buy/sell command、no auto order、no broker API、no service role key、not PRODUCTION_READY。

---

## 7. Exit criteria（從 locked interface 進到實際 dry-run 實作）

- owner reconfirms（明確同意啟用 shadow runtime）。
- `test:safety-chain` + GitHub Actions Safety Chain 綠燈。
- dry-run runtime PR scope 再次核准。
- runtime flags 預設仍 fixture（REAL_DATA_MODE=fixture、NEXT_PUBLIC_REAL_DATA_ENABLED=false）。
- shadow mode 仍 non-operational。
- service role absence check included。

---

## 8. 仍鎖定狀態（本版只新增 interface，未連線）

- contractVersion = PHASE_2_LOCKED_INTERFACE；mode = INTERFACE_ONLY_NOT_CONNECTED；decision = NO_GO。
- defaultRealDataMode = fixture；shadow mode still locked；real-readonly still locked。
- 未連 Supabase、未讀 env value、未 fetch、未接真實行情、未新增真正 API route、未接 broker API；V60–V74 safety chain 不受影響。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）；不翻任何 manual sign-off / staging connection / production switch 旗標。
