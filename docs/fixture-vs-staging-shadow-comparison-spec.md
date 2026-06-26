# Fixture vs Staging Shadow Comparison Spec

本文件定義 Allen Stock Dashboard 的 **Fixture vs Staging Shadow Comparison Spec**（未來把現有 fixture/hardcoded 與 planned staging read-only adapter 做欄位級 shadow 比對的規格：比對欄位、容差、資料新鮮度判斷，以及 fallback / downgrade / kill switch 規則）。
V48 把這份 shadow comparison 規格收斂成 spec-only contract、pure deterministic builder、validator 與本文件。

**本階段（V48）只定義未來 shadow comparison 的比對規格。本輪不實際連 Supabase、不讀 env、不新增 API route、不新增 UI、不新增 SQL migration、不修改現有 production routes、不切換 /api/portfolio、不建立 runtime、不寫 DB。
這一版不是 staging Supabase 實作；不是 production 真實資料上線；不是實際 connection review；不是實際 shadow runner。**

相關文件：
[Staging Supabase Read-only Safety Gate](./staging-supabase-readonly-safety-gate.md)、
[Staging Supabase RLS Manual Matrix](./staging-supabase-rls-manual-matrix.md)、
[Staging Supabase Schema Mapping Spec](./staging-supabase-schema-mapping-spec.md)、
[Staging Read-only Adapter Spec](./staging-readonly-adapter-spec.md)。

---

## A. Purpose

- V48 是 fixture vs staging shadow comparison spec。
- V48 不是正式真實資料上線。
- V48 定義未來把 fixture/hardcoded 與 staging read-only adapter 同時取出、逐欄比對的規格，作為「staging 是否與 fixture 一致」的稽核手段。
- fixture/hardcoded 永遠是 source of truth；staging 永遠不得覆蓋。
- staging Supabase 僅為 planned；本輪不連任何 Supabase。
- shadow comparison：comparison spec 只能描述未來 shadow comparison，不得建立實際 runner。
- fixture/mock UI 仍維持現狀。
- V44 / V45 / V46 / V47 仍是前置安全門。

---

## B. Scope Boundary

- V48 不連 staging Supabase。
- V48 不接 production Supabase。
- V48 不讀 Supabase env key。
- V48 不寫 staging。
- V48 不寫 production。
- V48 不新增 SQL migration。
- V48 不建立實際 Supabase client。
- V48 不建立實際 adapter runtime。
- V48 不建立實際 shadow runner。
- V48 不切換 /api/portfolio。
- V48 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V48 不新增 API route。
- V48 不新增 UI。
- V48 不接真實行情。
- V48 不產生買賣指令。
- V48 不自動下單。

---

## C. Comparison Spec Shape

至少包含以下 shadow comparison specs：

- `comparePortfolioStocksFixtureVsStaging`（portfolio_stocks）
- `compareWatchlistStocksFixtureVsStaging`（watchlist_stocks）
- `compareMarketSnapshotsFixtureVsStaging`（market_snapshots）
- `compareStockSnapshotsFixtureVsStaging`（stock_snapshots）
- `compareV85ScoresFixtureVsStaging`（v85_scores）

每個 comparison spec 至少包含：

- `comparisonName`
- `tableName`
- `fixtureSource`
- `stagingSource`
- `comparedFields`
- `numericTolerance`
- `timestampTolerance`
- `freshnessRequirement`
- `mismatchBehavior`
- `emptyFixtureBehavior`
- `emptyStagingBehavior`
- `staleStagingBehavior`
- `errorStagingBehavior`
- `promotionBehavior`
- `persistenceBehavior`
- `killSwitchBehavior`
- `sourceModeRequirement`
- `appRouteImpact`
- `verificationStatus`
- `blocksRelease`
- `notes`

允許的 mismatchBehavior：RECORD_ONLY、FLAG_FOR_MANUAL_REVIEW、DOWNGRADE_CONFIDENCE、BLOCK_PROMOTION。
允許的 emptyFixtureBehavior：BLOCK_COMPARISON、RECORD_DATA_INSUFFICIENT。
允許的 emptyStagingBehavior：DO_NOT_OVERRIDE_FIXTURE、RECORD_DATA_INSUFFICIENT、BLOCK_PROMOTION。
允許的 staleStagingBehavior：DO_NOT_OVERRIDE_FIXTURE、DOWNGRADE_TO_STALE、RECORD_DATA_INSUFFICIENT、BLOCK_PROMOTION。
允許的 errorStagingBehavior：DO_NOT_OVERRIDE_FIXTURE、FALLBACK_TO_FIXTURE、RECORD_DATA_INSUFFICIENT、BLOCK_PROMOTION。
允許的 promotionBehavior：NEVER_PROMOTE_AUTOMATICALLY、MANUAL_SIGNOFF_REQUIRED。
允許的 persistenceBehavior：NO_PERSISTENCE、EVIDENCE_ONLY_NO_DB_WRITE。
允許的 killSwitchBehavior：BLOCK_SHADOW_COMPARISON、FORCE_FIXTURE_MODE。
允許的 sourceModeRequirement：PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED、STAGING_MODE_NOT_ENABLED、MANUAL_SIGNOFF_REQUIRED。
允許的 appRouteImpact：NO_ROUTE_CHANGE、NO_API_SWITCH、INTERNAL_SPEC_ONLY。
允許的 verificationStatus：NOT_REVIEWED、PASS、FAIL、BLOCKED。

---

## D. Policy Expectations

- comparison specs 至少 5 筆，覆蓋 5 tables。
- comparedFields 對每個 comparison 不得為空。
- numericTolerance 必須明確定義，不能空白。
- timestampTolerance 必須明確定義，不能空白。
- fixtureSource 必須是 fixture / hardcoded / mock_or_contract 類來源。
- stagingSource 只能是 planned_staging_readonly_adapter，不得是 production。
- mismatch 只能 record / flag / downgrade / block promotion，不得自動提升 staging。
- empty staging 不得覆蓋 fixture / hardcoded。
- stale staging 不得覆蓋 fixture / hardcoded。
- error staging 不得覆蓋 fixture / hardcoded。
- promotionBehavior 不得自動 promote staging。
- persistenceBehavior 不得寫 DB。
- kill switch 預設必須能阻斷 shadow comparison。
- sourceModeRequirement 必須明確要求 PORTFOLIO_SOURCE_MODE 維持 hardcoded 或 staging mode not enabled。
- appRouteImpact 必須 NO_ROUTE_CHANGE / NO_API_SWITCH / INTERNAL_SPEC_ONLY。
- /api/portfolio 不得切換到 staging shadow result。
- production Supabase 不得出現在 comparison target。
- service_role 不得被 app runtime 使用。
- comparison spec 只能描述未來 shadow comparison，不得建立實際 runner。

---

## E. Source of Truth & Override Guards

- **PORTFOLIO_SOURCE_MODE must remain hardcoded**。
- **fixture/hardcoded must not be overridden by staging**。
- **empty staging result must not override fixture/hardcoded**。
- **stale staging result must not override fixture/hardcoded**。
- **error staging result must not override fixture/hardcoded**。
- **mismatch must not promote staging automatically**。
- **shadow evidence must not be persisted to DB**。
- **kill switch must be able to block shadow comparison**。
- fixtureCanBeOverriddenByStaging = false。
- hardcodedCanBeOverriddenByStaging = false。
- mismatchCanPromoteStaging = false。
- emptyResultCanOverrideHardcoded = false。
- staleResultCanOverrideHardcoded = false。
- errorResultCanOverrideHardcoded = false。
- killSwitchDefaultEnabled = true。

---

## F. Safety Language

- Fixture vs Staging Shadow Comparison Spec
- fixture vs staging shadow comparison
- shadow comparison
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
- fixture/hardcoded must not be overridden by staging
- empty staging result must not override fixture/hardcoded
- stale staging result must not override fixture/hardcoded
- error staging result must not override fixture/hardcoded
- mismatch must not promote staging automatically
- shadow evidence must not be persisted to DB
- kill switch must be able to block shadow comparison
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## G. Decision

- `decision` 預設 READY_FOR_REVIEW（所有 comparison 皆不覆蓋 fixture/hardcoded、不自動 promote、不寫 DB）。
- 允許 READY_FOR_REVIEW / NO_GO / BLOCKED / NOT_REVIEWED。
- V48 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## H. Future Gate

下一階段才是 **V49 Staging Read-only Connection Review** 或 **V49 Shadow Runner Dry-run Spec**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
