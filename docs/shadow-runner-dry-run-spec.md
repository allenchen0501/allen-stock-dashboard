# Shadow Runner Dry-run Spec

本文件定義 Allen Stock Dashboard 的 **Shadow Runner Dry-run Spec**（未來 shadow runner 在 dry-run 模式下的執行語意、evidence report shape、fixture-to-fixture self-check、pass/mismatch/data-insufficient 計數、kill switch 中止點，以及 fallback / downgrade 規則）。
V49 把這份 dry-run 規格收斂成 spec-only contract、pure deterministic builder、validator 與本文件。

**本階段（V49）只定義未來 shadow runner dry-run 的執行語意。本輪不實際連 Supabase、不讀 env、不新增 API route、不新增 UI、不新增 SQL migration、不修改現有 production routes、不切換 /api/portfolio、不建立實際 runtime、不寫 DB。
這一版不是 staging Supabase 實作；不是 production 真實資料上線；不是實際 connection review；不是實際 shadow runner runtime；不是實際讀取 staging。**

相關文件：
[Staging Read-only Adapter Spec](./staging-readonly-adapter-spec.md)、
[Fixture vs Staging Shadow Comparison Spec](./fixture-vs-staging-shadow-comparison-spec.md)、
[Staging Supabase Schema Mapping Spec](./staging-supabase-schema-mapping-spec.md)、
[Staging Supabase Read-only Safety Gate](./staging-supabase-readonly-safety-gate.md)。

---

## A. Purpose

- V49 是 shadow runner dry-run spec。
- V49 不是正式真實資料上線。
- V49 定義未來 shadow runner 在 dry-run 模式下如何依 V48 比對規格逐步執行、但在 dry-run 下完全不連線、用 fixture 對 fixture 自我驗證，並輸出 evidence report 的形狀。
- fixture-to-fixture self-check is shape-only：本輪只定義形狀，不執行。
- staging Supabase 僅為 planned；本輪不連任何 Supabase。
- fixture/mock UI 仍維持現狀。
- V44 / V45 / V46 / V47 / V48 仍是前置安全門。

---

## B. Scope Boundary

- V49 不連 staging Supabase。
- V49 不接 production Supabase。
- V49 不讀 Supabase env key。
- V49 不寫 staging。
- V49 不寫 production。
- V49 不新增 SQL migration。
- V49 不建立實際 Supabase client。
- V49 不建立實際 adapter runtime。
- V49 不建立實際 shadow runner runtime。
- V49 不執行 shadow runner。
- V49 不切換 /api/portfolio。
- V49 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V49 不新增 API route。
- V49 不新增 UI。
- V49 不接真實行情。
- V49 不產生買賣指令。
- V49 不自動下單。

---

## C. Runner Step Shape

至少包含以下 runner step specs（順序）：

1. `loadFixtureBaseline`
2. `runFixtureToFixtureSelfCheck`
3. `calculateShadowComparisonEvidence`
4. `classifyMismatchAndDataInsufficient`
5. `evaluateKillSwitchAndPromotionGuard`
6. `buildShadowDryRunReport`

每個 runner step spec 至少包含：

- `stepName`
- `order`
- `inputSource`
- `outputArtifact`
- `executionMode`
- `requiresSupabase`
- `requiresEnv`
- `performsExternalRequest`
- `performsDbWrite`
- `canPromoteStaging`
- `canSwitchPortfolioApi`
- `failureBehavior`
- `killSwitchBehavior`
- `evidenceFields`
- `verificationStatus`
- `blocksRelease`
- `notes`

允許的 executionMode：SPEC_ONLY、FIXTURE_TO_FIXTURE_DRY_RUN_ONLY、NO_RUNTIME_CREATED。
允許的 inputSource：FIXTURE_BASELINE、MOCK_OR_CONTRACT、PREVIOUS_SPEC_CONTRACT、NO_STAGING_INPUT。
允許的 outputArtifact：EVIDENCE_REPORT_SHAPE_ONLY、COUNTS_ONLY、MANUAL_REVIEW_PAYLOAD_SHAPE、NO_PERSISTENCE_ARTIFACT。
允許的 failureBehavior：RECORD_DATA_INSUFFICIENT、BLOCK_PROMOTION、FORCE_FIXTURE_MODE、REQUIRE_MANUAL_REVIEW。
允許的 killSwitchBehavior：BLOCK_SHADOW_RUNNER、FORCE_FIXTURE_MODE、REQUIRE_MANUAL_SIGNOFF。
允許的 verificationStatus：NOT_REVIEWED、PASS、FAIL、BLOCKED。

---

## D. Evidence Report Shape

evidence report shape 至少包含：

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

規則：

- sourceMode 必須 hardcoded / fixture / mock_or_contract 類語義。
- runnerMode 必須 dry_run_spec / spec_only 類語義。
- promotionAllowed 必須 false。
- portfolioApiSwitchAllowed 必須 false。
- persisted 必須 false。

---

## E. Policy Expectations

- runner step specs 至少 6 筆。
- fixtureToFixtureSelfCheckDefined 必須 true。
- shadowRunnerRuntimeCreated 必須 false。
- shadowRunnerExecuted 必須 false。
- stagingSupabaseConnected / stagingReadPerformed / requestPerformed / envReadPerformed / databaseWritePerformed / shadowResultPersisted 必須 false。
- all steps requiresSupabase / requiresEnv / performsExternalRequest / performsDbWrite / canPromoteStaging / canSwitchPortfolioApi 必須 false。
- evidence report promotionAllowed / portfolioApiSwitchAllowed / persisted 必須 false。
- dry-run 只能做 fixture-to-fixture self-check shape，不得連 staging。
- dry-run mismatch 不得 promote staging。
- dry-run empty/stale/error 不得覆蓋 fixture / hardcoded。
- dry-run evidence 不得寫 DB。
- kill switch 預設必須能阻斷 shadow runner。
- PORTFOLIO_SOURCE_MODE 必須維持 hardcoded。
- /api/portfolio 不得切換到 shadow runner result。
- production Supabase 不得出現在 runner target。
- service_role 不得被 app runtime 使用。
- shadow runner spec 只能描述未來 dry-run 語意，不得建立實際 runner runtime。

---

## F. Source of Truth & Override Guards

- **PORTFOLIO_SOURCE_MODE must remain hardcoded**。
- **fixture-to-fixture self-check is shape-only**。
- **dry-run must not connect to staging**。
- **dry-run evidence must not be persisted to DB**。
- **dry-run mismatch must not promote staging**。
- **empty / stale / error result must not override fixture/hardcoded**。
- **kill switch must be able to block shadow runner**。
- fixtureCanBeOverriddenByStaging = false。
- hardcodedCanBeOverriddenByStaging = false。
- mismatchCanPromoteStaging = false。
- dryRunCanPromoteStaging = false。
- emptyResultCanOverrideHardcoded = false。
- staleResultCanOverrideHardcoded = false。
- errorResultCanOverrideHardcoded = false。
- killSwitchDefaultEnabled = true。

---

## G. Safety Language

- Shadow Runner Dry-run Spec
- shadow runner dry-run
- fixture-to-fixture self-check
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
- fixture-to-fixture self-check is shape-only
- dry-run must not connect to staging
- dry-run evidence must not be persisted to DB
- dry-run mismatch must not promote staging
- empty / stale / error result must not override fixture/hardcoded
- kill switch must be able to block shadow runner
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## H. Decision

- `decision` 預設 READY_FOR_REVIEW（所有 step 皆不連線/不寫 DB/不 promote、evidence report 不允許 promotion/api switch/persist）。
- 允許 READY_FOR_REVIEW / NO_GO / BLOCKED / NOT_REVIEWED。
- V49 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## I. Future Gate

下一階段才是 **V50 Staging Read-only Connection Review** 或 **V50 Shadow Runner Dry-run API Contract**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
