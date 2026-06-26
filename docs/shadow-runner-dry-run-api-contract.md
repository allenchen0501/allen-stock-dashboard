# Shadow Runner Dry-run API Contract

本文件定義 Allen Stock Dashboard 的 **Shadow Runner Dry-run API Contract**（未來 fixture-only shadow runner dry-run API 的 response contract、endpoint shape、safe response flags、evidence payload shape 與 error / fallback 行為）。
V50 把這份 API contract 收斂成 spec-only / fixture-only contract、pure deterministic builder、validator 與本文件。

**本階段（V50）只定義未來 fixture-only API 的 response contract。本輪不實際新增 API route、不連 Supabase、不讀 env、不新增 UI、不新增 SQL migration、不修改現有 production routes、不切換 /api/portfolio、不建立實際 runtime、不寫 DB。
這一版不是 API route implementation；不是 staging Supabase 實作；不是 production 真實資料上線；不是實際 connection review。**

相關文件：
[Shadow Runner Dry-run Spec](./shadow-runner-dry-run-spec.md)、
[Fixture vs Staging Shadow Comparison Spec](./fixture-vs-staging-shadow-comparison-spec.md)、
[Staging Read-only Adapter Spec](./staging-readonly-adapter-spec.md)、
[Staging Supabase Schema Mapping Spec](./staging-supabase-schema-mapping-spec.md)。

---

## A. Purpose

- V50 是 shadow runner dry-run API contract。
- V50 不是 API route implementation。
- V50 不是正式真實資料上線。
- V50 定義未來 fixture-only API 回傳的 response shape，沿用 V49 evidence report 語義，作為 V51 實作 route 的合約基準。
- planned endpoint is /api/portfolio/shadow-runner-dry-run。
- responseSource must remain mock_or_contract。
- sourceMode must remain fixture。
- fixture/mock UI 仍維持現狀。
- V44 / V45 / V46 / V47 / V48 / V49 仍是前置安全門。

---

## B. Scope Boundary

- V50 不新增 API route。
- V50 不連 staging Supabase。
- V50 不接 production Supabase。
- V50 不讀 Supabase env key。
- V50 不寫 staging。
- V50 不寫 production。
- V50 不新增 SQL migration。
- V50 不建立實際 Supabase client。
- V50 不建立實際 adapter runtime。
- V50 不建立實際 shadow runner runtime。
- V50 不執行 shadow runner。
- V50 不切換 /api/portfolio。
- V50 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V50 不新增 UI。
- V50 不接真實行情。
- V50 不產生買賣指令。
- V50 不自動下單。

---

## C. Planned Endpoint

- `plannedEndpoint` = /api/portfolio/shadow-runner-dry-run
- `method` = GET
- `responseSource` = mock_or_contract
- `sourceMode` = fixture
- `apiContractVersion` = V50

規則：

- planned endpoint is /api/portfolio/shadow-runner-dry-run。
- method 必須 GET。
- responseSource must remain mock_or_contract。
- sourceMode must remain fixture。
- routeCreated / apiRouteCreated / routeImplemented 必須 false（API contract 只能描述未來 route response shape，不得新增實際 route）。

---

## D. Response Payload Shape

response payload 至少包含：

- `ok`
- `apiContractVersion`
- `responseSource`
- `sourceMode`
- `plannedEndpoint`
- `method`
- `dryRunBundle`
- `evidenceReport`
- `safetyFlags`
- `warnings`
- `nextRequiredActions`

`dryRunBundle` 至少包含：

- `contractVersion` = "V49"
- `specName` = "Shadow Runner Dry-run Spec"
- `runnerMode` = "dry_run_spec"
- `fixtureToFixtureSelfCheckDefined` = true
- `shadowRunnerRuntimeCreated` = false
- `shadowRunnerExecuted` = false
- `fixtureToStagingComparisonPerformed` = false

`evidenceReport` 至少包含（沿用 V49 語義）：

- `reportVersion`
- `generatedAt`
- `sourceMode`
- `runnerMode`
- `comparedTableCount`
- `comparedFieldCount`
- `passCount`
- `mismatchCount`
- `dataInsufficientCount`
- `staleCount`
- `errorCount`
- `blockedCount`
- `promotionAllowed`
- `portfolioApiSwitchAllowed`
- `persisted`
- `killSwitchTriggered`
- `manualReviewRequired`
- `notes`

`safetyFlags` 至少包含：

- `routeCreated`、`requestPerformed`、`envReadPerformed`、`supabaseConnected`、`stagingSupabaseConnected`、`productionSupabaseConnected`、`databaseWritePerformed`、`shadowRunnerExecuted`、`shadowResultPersisted`、`portfolioApiSwitched`、`portfolioSourceModeChanged`、`realMarketDataEnabled`、`buySellCommandGenerated`、`autoOrderRequested`、`promotionAllowed`、`portfolioApiSwitchAllowed`、`persisted`、`killSwitchDefaultEnabled`、`fixtureCanBeOverriddenByStaging`、`hardcodedCanBeOverriddenByStaging`、`mismatchCanPromoteStaging`、`dryRunCanPromoteStaging`、`emptyResultCanOverrideHardcoded`、`staleResultCanOverrideHardcoded`、`errorResultCanOverrideHardcoded`

---

## E. Policy Expectations

- plannedEndpoint 必須是 /api/portfolio/shadow-runner-dry-run。
- method 必須 GET。
- responseSource 必須 mock_or_contract。
- sourceMode 必須 fixture。
- routeCreated / apiRouteCreated / routeImplemented 必須 false。
- requestPerformed 必須 false。
- envReadPerformed 必須 false。
- supabaseConnected / stagingSupabaseConnected / productionSupabaseConnected 必須 false。
- stagingReadPerformed / stagingWritePerformed / productionWritePerformed / databaseWritePerformed 必須 false。
- shadowRunnerRuntimeCreated / shadowRunnerExecuted / shadowComparisonPerformed / shadowResultPersisted 必須 false。
- promotionAllowed / portfolioApiSwitchAllowed / persisted 必須 false。
- fixture / hardcoded 不得被 staging 覆蓋。
- mismatch 不得 promote staging。
- empty / stale / error 不得覆蓋 hardcoded。
- kill switch 預設必須 enabled。
- /api/portfolio 不得切換到 shadow runner result。
- production Supabase 不得出現在 API target。
- service_role 不得被 app runtime 使用。
- API contract 只能描述未來 route response shape，不得新增實際 route。

---

## F. Source of Truth & Override Guards

- **responseSource must remain mock_or_contract**。
- **sourceMode must remain fixture**。
- **PORTFOLIO_SOURCE_MODE must remain hardcoded**。
- **fixture/hardcoded must not be overridden by staging**。
- **dry-run evidence must not be persisted to DB**。
- **dry-run mismatch must not promote staging**。
- **empty / stale / error result must not override hardcoded**。
- **kill switch must be enabled by default**。

---

## G. Safety Language

- Shadow Runner Dry-run API Contract
- shadow runner dry-run API contract
- planned endpoint is /api/portfolio/shadow-runner-dry-run
- not API route implementation
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
- responseSource must remain mock_or_contract
- sourceMode must remain fixture
- PORTFOLIO_SOURCE_MODE must remain hardcoded
- fixture/hardcoded must not be overridden by staging
- dry-run evidence must not be persisted to DB
- dry-run mismatch must not promote staging
- empty / stale / error result must not override hardcoded
- kill switch must be enabled by default
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## H. Decision

- `decision` 預設 READY_FOR_REVIEW（無 route、無連線、無寫入、無 promote）。
- 允許 READY_FOR_REVIEW / NO_GO / BLOCKED / NOT_REVIEWED。
- V50 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## I. Future Gate

下一階段才是 **V51 Shadow Runner Dry-run API Route**。

- V51 仍必須 fixture-only / mock_or_contract。
- V51 仍 no Supabase / no env / no DB write。
- 仍限 staging planning。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
