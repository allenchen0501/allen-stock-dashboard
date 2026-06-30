# Staging Read-only Shadow Runtime — Scaffold + Validator

本版是 **scaffold + validator**（依 owner 明確同意：「第一版只做 scaffold + validator，不做 live fetch、不讀 env value、不切 /api/portfolio、不下單、不自動交易」）。

本版只建立 read-only shadow runtime 的型別、provider skeleton、comparison builder、validator 與文件；**沒有任何真正連線**。contractVersion = STAGING_SHADOW_RUNTIME_SCAFFOLD、mode = SCAFFOLD_ONLY_NOT_CONNECTED、decision = NO_GO。

嚴格維持：no live fetch、no env read、no Supabase connection、no API route、no /api/portfolio switch、no real market data、no DB write、no broker API、no buy/sell command、no auto order、not production ready。不翻任何 manual sign-off / staging connection / production switch 旗標。

---

## A. 新增結構

- `services/market-data/public-quote-provider.types.ts` — provider 型別、PublicReadonlyQuoteCandidate、PublicQuoteProvider、ShadowRuntimeComparison、StagingShadowRuntimeContract。
- `services/market-data/yahoo-readonly-provider.ts` — **Yahoo provider is scaffold-only**（getReadonlyQuoteCandidate 不 fetch、不讀 env、不連線；回傳 scaffold-only / not connected candidate）。
- `services/market-data/twse-tpex-verification-provider.ts` — **TWSE / TPEx verification provider is scaffold-only**（同上，official verification layer）。
- `use-cases/war-room/build-shadow-runtime-comparison.ts` — pure functions：buildStagingShadowRuntimeContract / buildScaffoldOnlyQuoteCandidate / buildYahooReadonlyProviderScaffold / buildTwseTpexVerificationProviderScaffold / buildShadowRuntimeComparison / validateStagingShadowRuntimeContract。
- `scripts/validate-staging-shadow-runtime-scaffold.ts` — validator。

---

## B. 安全狀態

- **service role forbidden**（serviceRoleForbidden=true；app runtime 永遠禁用 service role key）。
- **default remains fixture**（defaultRealDataMode=fixture）。
- **kill switch remains off**（NEXT_PUBLIC_REAL_DATA_ENABLED 預設 false；shadowRuntimeAllowed=false）。
- **shadow runtime still non-operational**（comparison operationalUseAllowed=false、decision NO_GO）。
- provider runtimeStatus = NOT_CONNECTED；candidate isRealData=false / isConnected=false / isDisabled=true。
- comparison 衝突 / 缺值映射回 V67 / V68 / V69 降級鏈（mapsToV67V68V69=true、observation only）。

---

## C. Validator（`npm run test:staging-shadow-runtime-scaffold`）

檢查：required files exist、package script exists、contractVersion=STAGING_SHADOW_RUNTIME_SCAFFOLD、mode=SCAFFOLD_ONLY_NOT_CONNECTED、decision=NO_GO、defaultRealDataMode=fixture、shadowRuntimeAllowed/liveFetchAllowed/envReadAllowed/supabaseConnectionAllowed/apiRouteAllowed/portfolioApiSwitchAllowed/productionReady/buySellCommandGenerated/autoOrderRequested/brokerApiAllowed=false、serviceRoleForbidden=true、Yahoo 與 TWSE/TPEx provider scaffold 存在且 NOT_CONNECTED、providers 不 fetch / 不讀 env / 不連 Supabase / 不建 API route / 不寫 DB / 不用 service role / 不產生交易指令、no /api/portfolio switch、no PRODUCTION_READY、no placeOrder、no autoOrder。

> 註：validator 檔案內可含上述 forbidden token 字串清單（用於掃描），本文件可含作為 warning text；但 `services/market-data/` 與 runtime scaffold 檔案不得含 runtime token。安全 FLAG 名稱 serviceRoleForbidden / autoOrderRequested 屬於否定旗標，不算 runtime token。

---

## D. Explicit forbidden（本版）

no Supabase connection、no env read、no fetch、no axios、no real market data、no API route、no /api/portfolio switch、no DB write、no buy/sell command、no auto order、no broker API、not PRODUCTION_READY。

---

## E. 下一階段

**下一階段必須再次 owner approval 才能開始 limited live fetch dry-run。** 屆時也只在被核准的 read-only provider 檔案內加入受限 network code，且仍 default fixture、kill switch off、shadow non-operational、含 service role absence check；真正連線需再一次明確同意。在那之前，所有 provider 維持 scaffold-only / not connected，contract 維持 SCAFFOLD_ONLY_NOT_CONNECTED / NO_GO。
