# Staging Read-only Adapter Spec

本文件定義 Allen Stock Dashboard 的 **Staging Read-only Adapter Spec**（未來 staging read-only adapter 的介面規格、回傳型別、source-neutral mapping，以及 fallback / downgrade / kill switch 規則）。
V47 把這份 adapter 規格收斂成 spec-only contract、pure deterministic builder、validator 與本文件。

**本階段（V47）只定義未來 staging read-only adapter 的介面規格。本輪不實際連 Supabase、不讀 env、不新增 API route、不新增 UI、不新增 SQL migration、不修改現有 production routes、不切換 /api/portfolio、不建立 runtime、不寫 DB。
這一版不是 staging Supabase 實作；不是 production 真實資料上線；不是建立實際 Supabase client；不是實際 connection review。**

相關文件：
[Staging Supabase Read-only Safety Gate](./staging-supabase-readonly-safety-gate.md)、
[Staging Supabase RLS Manual Matrix](./staging-supabase-rls-manual-matrix.md)、
[Staging Supabase Schema Mapping Spec](./staging-supabase-schema-mapping-spec.md)。

---

## A. Purpose

- V47 是 staging read-only adapter spec。
- V47 不是正式真實資料上線。
- V47 定義未來唯讀讀取 staging Supabase 時，adapter 的方法形狀、回傳型別、與現有 fixture/contract 欄位的對映，以及 empty / stale / error 的降級規則。
- staging Supabase 僅為 planned；本輪不連任何 Supabase。
- read-only：adapter spec 只能描述未來 read-only interface，不得建立實際 client。
- fixture/mock UI 仍維持現狀。
- V44 / V45 / V46 仍是前置安全門。

---

## B. Scope Boundary

- V47 不連 staging Supabase。
- V47 不接 production Supabase。
- V47 不讀 Supabase env key。
- V47 不寫 staging。
- V47 不寫 production。
- V47 不新增 SQL migration。
- V47 不建立實際 Supabase client。
- V47 不建立實際 adapter runtime。
- V47 不切換 /api/portfolio。
- V47 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V47 不新增 API route。
- V47 不新增 UI。
- V47 不接真實行情。
- V47 不產生買賣指令。
- V47 不自動下單。

---

## C. Adapter Method Shape

至少包含以下 staging read-only adapter method specs：

- `getPortfolioStocksReadOnly`（portfolio_stocks）
- `getWatchlistStocksReadOnly`（watchlist_stocks）
- `getMarketSnapshotsReadOnly`（market_snapshots）
- `getStockSnapshotsReadOnly`（stock_snapshots）
- `getV85ScoresReadOnly`（v85_scores）

每個 method spec 至少包含：

- `methodName`
- `tableName`
- `readOnly`
- `allowedOperation`
- `inputShape`
- `outputShape`
- `mappedContractFields`
- `fallbackBehavior`
- `emptyResultBehavior`
- `staleResultBehavior`
- `errorResultBehavior`
- `killSwitchBehavior`
- `sourceModeRequirement`
- `appRouteImpact`
- `verificationStatus`
- `blocksRelease`
- `notes`

允許的 allowedOperation：select_only。
允許的 fallbackBehavior：FALLBACK_TO_HARDCODED、FALLBACK_TO_FIXTURE_CONTRACT、RETURN_DATA_INSUFFICIENT。
允許的 emptyResultBehavior：DO_NOT_OVERRIDE_HARDCODED、RETURN_DATA_INSUFFICIENT。
允許的 staleResultBehavior：DOWNGRADE_TO_STALE、DO_NOT_OVERRIDE_HARDCODED、RETURN_DATA_INSUFFICIENT。
允許的 errorResultBehavior：FALLBACK_TO_HARDCODED、RETURN_DATA_INSUFFICIENT、BLOCK_ADAPTER。
允許的 killSwitchBehavior：BLOCK_STAGING_ADAPTER、FORCE_HARDCODED_MODE。
允許的 sourceModeRequirement：PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED、STAGING_MODE_NOT_ENABLED、MANUAL_SIGNOFF_REQUIRED。
允許的 appRouteImpact：NO_ROUTE_CHANGE、NO_API_SWITCH、INTERNAL_SPEC_ONLY。
允許的 verificationStatus：NOT_REVIEWED、PASS、FAIL、BLOCKED。

---

## D. Policy Expectations

- readOnly 必須全部 true。
- allowedOperation 必須全部 select_only。
- sourceModeRequirement 必須明確要求 PORTFOLIO_SOURCE_MODE 維持 hardcoded 或 staging mode not enabled。
- appRouteImpact 必須全部 NO_ROUTE_CHANGE / NO_API_SWITCH / INTERNAL_SPEC_ONLY。
- empty result 不得覆蓋 hardcoded。
- stale result 不得覆蓋 hardcoded。
- error result 不得覆蓋 hardcoded，必須 fallback 或 block。
- kill switch 預設必須能阻斷 staging adapter。
- mappedContractFields 對 app-used method 不得為空。
- stagingSupabaseConnected = false 時，decision 不得是 GO 或 PRODUCTION_READY。
- 若任何 method readOnly = false，decision 必須 NO_GO。
- 若任何 method allowedOperation 不是 select_only，decision 必須 NO_GO。
- 若任何 fallback/empty/stale/error 行為允許覆蓋 hardcoded，decision 必須 NO_GO。
- /api/portfolio 不得切換到 staging adapter。
- production Supabase 不得出現在 adapter target。
- service_role 不得被 app runtime 使用。
- adapter spec 只能描述未來 read-only interface，不得建立實際 client。

---

## E. Source Mode & Override Guards

- **PORTFOLIO_SOURCE_MODE must remain hardcoded**。
- **empty result must not override hardcoded**。
- **stale result must not override hardcoded**。
- **error result must not override hardcoded**。
- **kill switch must be able to block staging adapter**。
- emptyResultCanOverrideHardcoded = false。
- staleResultCanOverrideHardcoded = false。
- errorResultCanOverrideHardcoded = false。
- killSwitchDefaultEnabled = true。

---

## F. Safety Language

- Staging Read-only Adapter Spec
- staging read-only adapter
- read-only
- not production trading system
- no real market data
- no Supabase connection
- no env key
- no write
- no staging write
- no production write
- no SQL migration
- no api switch
- no buy/sell command
- no auto order
- PORTFOLIO_SOURCE_MODE must remain hardcoded
- empty result must not override hardcoded
- stale result must not override hardcoded
- error result must not override hardcoded
- kill switch must be able to block staging adapter
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## G. Decision

- `decision` 預設 READY_FOR_REVIEW（所有 method 皆 read-only select_only、且 empty / stale / error 不覆蓋 hardcoded）。
- 允許 READY_FOR_REVIEW / NO_GO / BLOCKED / NOT_REVIEWED。
- V47 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## H. Future Gate

下一階段才是 **V48 Staging Read-only Connection Review** 或 **V48 Fixture vs Staging Shadow Comparison Spec**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
