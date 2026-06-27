# Allen Stock Dashboard

以 Next.js、TypeScript 與 Tailwind CSS 製作的個人台股戰情室，包含市場燈號、持股戰情、V8.5 核心評分、風報比、主升段候選與今日禁碰股。

目前版本為 V63 Structured Buy Zone & Risk/Reward Contract：把 candidate 的 pullbackBuyZone / riskRewardRatio / entryStrategy 從字串敘述升級為結構化 deterministic contract，讓承接區 / 失效防守區 / 目標區 / 風報比可被 validator 檢查一致性。新增 `use-cases/war-room/structured-candidate-trade-plan-contract.ts`（StructuredBuyZone / StructuredRiskReward / StructuredEntryStrategy / CandidateTradePlan / CandidateTradePlanValidation）、`use-cases/war-room/build-structured-candidate-trade-plan-contract.ts`、`docs/structured-candidate-trade-plan.md`、`scripts/validate-structured-candidate-trade-plan.ts`，並在每日候選池顯示結構化承接區 / 失效防守區 / 目標觀察區。validator 檢查 buyZone.lower <= buyZone.upper、stopLossUpper < buyZone.lower、targetLower > buyZone.upper、rewardRiskRatio > 0 且可由 upside/downside 推導、sourceType fixture_mock、operationalUseAllowed false、isPosition false、pnlComputable false、no shares、no cost basis、observation only（not buy/sell command）、每個 trade plan 對應一個 V62 candidate 且 score/grade/pool 與引擎一致。仍是 fixture-only / deterministic contract / validator / UI structure：no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no auto order、not PRODUCTION_READY。`npm run test:structured-candidate-trade-plan`。

V62 Allen Score Deterministic Scoring Engine & Grade Consistency：把 V61 手填的 candidate allenScore / grade / pool assignment 升級為 deterministic pure scoring engine。新增純函式 `scoreCandidate` / `gradeCandidate` / `assignCandidatePool` / `buildCandidateScoringBreakdown`（`use-cases/war-room/allen-score-scoring-engine.ts`），以及 `use-cases/war-room/allen-score-deterministic-scoring-engine-contract.ts`、`use-cases/war-room/build-allen-score-deterministic-scoring-engine-contract.ts`、`docs/allen-score-deterministic-scoring-engine.md`、`scripts/validate-allen-score-deterministic-scoring-engine.ts`，並改寫 V61 builder 使 allenScore / grade 改由引擎推導（totalScore equals sub-score sum、grade must match score、pool must match grade）。`scoreCandidate` 會 reject 超出範圍的分項（technicalScore <= 30 / fundamentalScore <= 25 / chipScore <= 25 / etfFlowScore <= 10 / marketSentimentScore <= 10、>= 0、total 0–100）；gradeCandidate：A >= 80 / B 70–79 / C 60–69 / AVOID < 60；assignCandidatePool：A => A_GRADE_MAIN_UPTREND / B => B_GRADE_WATCHLIST / C => C_GRADE_WAITING / AVOID => RISK_BLOCKLIST。仍是 deterministic pure function + contract + validator + UI structure：system candidate is not position、可逢低布局不等於已買進、no fake PnL、pnlComputable false、fixture/mock score is not operational data、no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order。`npm run test:allen-score-deterministic-scoring-engine`。

V61 Allen Score Scoring Model & Candidate Pools：把 Allen Score 100 評分模組（Technical Score 30 + Fundamental Score 25 + Chip Score 25 + ETF Flow Score 10 + Market Sentiment Score 10 = 100）正式寫進架構，並把 System Candidates 升級成依 Allen Score 每日產出的候選池（A 級主升段池 ≥ 80 / B 級觀察池 70–79 / C 級等待池 60–69 / 禁碰池 < 60）。新增 `docs/allen-score-scoring-model.md`、`use-cases/war-room/allen-score-scoring-model-contract.ts`、`use-cases/war-room/build-allen-score-scoring-model-contract.ts`、`components/war-room/allen-score-summary.tsx`、`components/war-room/daily-candidate-pools.tsx`、`scripts/validate-allen-score-scoring-model.ts`，改寫 `components/war-room/system-candidates-table.tsx`（顯示總分與五大分項）與 `components/war-room/war-room-operational-layout.tsx`（新增 Allen Score 摘要 + Daily Candidate Pools）。仍是 deterministic contract + UI structure + validator：system candidate is not position、可逢低布局不等於已買進、no fake PnL、fixture/mock score is not operational data、no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order。`npm run test:allen-score-scoring-model`。

V60 Allen War Room Operational Layout：新增 `docs/war-room-engine-fixture-adapters.md` 與 fixture-only adapter `use-cases/war-room/war-room-engine-fixture-adapters.ts`，並改寫 `use-cases/war-room/build-war-room-read-model-contract.ts` 使 `/api/war-room` 從 spec-only 空陣列升級為 fixture-only sample output（`sourceMode = fixture`、新增 `fixtureAdapterVersion = V22`，`apiContractVersion` 仍為 V20、`responseSource` 仍為 `mock_or_contract`）。portfolioRiskItems / researchTopPickItems / technicalCandidateItems / intradayAlertItems / avoidItems / observationPoints 變成非空 sample（皆標示 fixture / 非即時資料），`highConfidenceConclusionAllowed` 仍為 false、不產生 DANGER。本階段只新增 fixture adapter 與 checker、改寫 builder，未新增新的 API route、未新增新的 UI、未接資料源、未建立 runtime、未 import runtime builder、未連 Supabase、未發外部 request、未讀 env、未新增 SQL migration、未新增 mock data、未寫入資料、不產生買賣指令、未修改 repositories / services。

## 開始使用

需求：Node.js 20 以上與 npm。

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

正式建置：

```bash
npm run build
npm run start
```

## 專案結構

- `app/`：App Router 頁面與 server route。
- `components/`：戰情室 UI 元件。
- `etl/`：ETL core contracts、no-op sources、validator 與 dry-run loader。
- `services/`：market、stocks、indices service 與 provider adapter。
- `lib/api/`：HTTP client、cache、設定與 provider registry。
- `lib/data-quality/`：資料品質型別、規則、雙來源比較與決策門檻。
- `lib/supabase/`：browser singleton、server factory 與統一 exports。
- `lib/types/`：資料庫 row 與 repository input 型別。
- `pipelines/`：官方行情 normalization、quality gate 與 validation result orchestration。
- `repositories/`：資料存取介面、Supabase skeleton 與統一 exports。
- `use-cases/portfolio/`：active Portfolio orchestration、估值 mapping、品質 gate 與 migration audit。
- `types/`：UI 與 API 契約。
- `war-room/input/`：戰情室 primary、reference、rejected 資料輸入契約與 gate。
- `supabase/`：V3-1 基礎 schema、V3-1.5 Pro+ schema、V3-1.6 補強 schema 與套用說明。
- `docs/`：資料庫、資料保存、介面用語、技術框架、戰情室架構規範、Portfolio Valuation Radar Dashboard 規格（[docs/portfolio-valuation-radar-ui.md](docs/portfolio-valuation-radar-ui.md)）、Portfolio Valuation Formula 方法論（[docs/portfolio-valuation-formula.md](docs/portfolio-valuation-formula.md)）、War Room Intelligence Architecture（[docs/war-room-intelligence-architecture.md](docs/war-room-intelligence-architecture.md)）、Intraday Risk Crisis Alert Spec（[docs/intraday-risk-crisis-alert-spec.md](docs/intraday-risk-crisis-alert-spec.md)）、Institutional Research Center Spec（[docs/institutional-research-center-spec.md](docs/institutional-research-center-spec.md)）、Technical + Risk Reward Strategy Spec（[docs/technical-risk-reward-strategy-spec.md](docs/technical-risk-reward-strategy-spec.md)）、War Room Read Model Contract（[docs/war-room-read-model-contract.md](docs/war-room-read-model-contract.md)）、War Room API Contract（[docs/war-room-api-contract.md](docs/war-room-api-contract.md)）、War Room UI Integration（[docs/war-room-ui-integration.md](docs/war-room-ui-integration.md)）、War Room Engine Fixture Adapters（[docs/war-room-engine-fixture-adapters.md](docs/war-room-engine-fixture-adapters.md)）、War Room UI Polish（[docs/war-room-ui-polish.md](docs/war-room-ui-polish.md)）、Position Strategy Plan Spec（[docs/position-strategy-plan-spec.md](docs/position-strategy-plan-spec.md)）、Dynamic Opportunity Pool & Price Verification Spec（[docs/dynamic-opportunity-price-verification-spec.md](docs/dynamic-opportunity-price-verification-spec.md)）、Position Strategy Fixture Adapters（[docs/position-strategy-fixture-adapters.md](docs/position-strategy-fixture-adapters.md)）、Holding Defense Tracker API Contract（[docs/holding-defense-tracker-api-contract.md](docs/holding-defense-tracker-api-contract.md)）、Runtime Data Pipeline Spec（[docs/runtime-data-pipeline-spec.md](docs/runtime-data-pipeline-spec.md)）、Holding Defense Tracker UI Integration（[docs/holding-defense-tracker-ui-integration.md](docs/holding-defense-tracker-ui-integration.md)）、Intraday Holding Defense Runtime Spec（[docs/intraday-holding-defense-runtime-spec.md](docs/intraday-holding-defense-runtime-spec.md)）、Intraday Defense Fixture API（[docs/intraday-defense-fixture-api.md](docs/intraday-defense-fixture-api.md)）、Intraday Defense UI Integration（[docs/intraday-defense-ui-integration.md](docs/intraday-defense-ui-integration.md)）、Runtime Pilot Readiness Checklist（[docs/runtime-pilot-readiness-checklist.md](docs/runtime-pilot-readiness-checklist.md)）、Runtime Pilot Readiness UI（[docs/runtime-pilot-readiness-ui.md](docs/runtime-pilot-readiness-ui.md)）、Runtime Pilot Dry-Run Spec（[docs/runtime-pilot-dry-run-spec.md](docs/runtime-pilot-dry-run-spec.md)）、Runtime Pilot Dry-Run API（[docs/runtime-pilot-dry-run-api.md](docs/runtime-pilot-dry-run-api.md)）、Runtime Pilot Monitoring UI（[docs/runtime-pilot-monitoring-ui.md](docs/runtime-pilot-monitoring-ui.md)）、Runtime Pilot Implementation Review（[docs/runtime-pilot-implementation-review.md](docs/runtime-pilot-implementation-review.md)）、First Authorized Source Dry-Run Spec（[docs/first-authorized-source-dry-run-spec.md](docs/first-authorized-source-dry-run-spec.md)）、First Authorized Source Dry-Run API（[docs/first-authorized-source-dry-run-api.md](docs/first-authorized-source-dry-run-api.md)）、First Authorized Source Dry-Run Monitoring UI（[docs/first-authorized-source-dry-run-monitoring-ui.md](docs/first-authorized-source-dry-run-monitoring-ui.md)）、Preview Deployment Readiness（[docs/preview-deployment-readiness.md](docs/preview-deployment-readiness.md)）、Production Alias Safety Smoke Test Evidence（[docs/production-alias-safety-smoke-test-evidence.md](docs/production-alias-safety-smoke-test-evidence.md)）、Staging Supabase Read-only Safety Gate（[docs/staging-supabase-readonly-safety-gate.md](docs/staging-supabase-readonly-safety-gate.md)）、Staging Supabase RLS Manual Matrix（[docs/staging-supabase-rls-manual-matrix.md](docs/staging-supabase-rls-manual-matrix.md)）、Staging Supabase Schema Mapping Spec（[docs/staging-supabase-schema-mapping-spec.md](docs/staging-supabase-schema-mapping-spec.md)）、Staging Read-only Adapter Spec（[docs/staging-readonly-adapter-spec.md](docs/staging-readonly-adapter-spec.md)）、Fixture vs Staging Shadow Comparison Spec（[docs/fixture-vs-staging-shadow-comparison-spec.md](docs/fixture-vs-staging-shadow-comparison-spec.md)）、Shadow Runner Dry-run Spec（[docs/shadow-runner-dry-run-spec.md](docs/shadow-runner-dry-run-spec.md)）、Shadow Runner Dry-run API Contract（[docs/shadow-runner-dry-run-api-contract.md](docs/shadow-runner-dry-run-api-contract.md)）、Shadow Runner Dry-run API Route（[docs/shadow-runner-dry-run-api-route.md](docs/shadow-runner-dry-run-api-route.md)）、Production Route Deployment Smoke Evidence（[docs/shadow-runner-dry-run-production-smoke-evidence.md](docs/shadow-runner-dry-run-production-smoke-evidence.md)）、Shadow Runner Dry-run Monitoring UI（[docs/shadow-runner-dry-run-monitoring-ui.md](docs/shadow-runner-dry-run-monitoring-ui.md)）、Shadow Runner Dry-run Monitoring UI Production Evidence（[docs/shadow-runner-dry-run-monitoring-ui-production-evidence.md](docs/shadow-runner-dry-run-monitoring-ui-production-evidence.md)）、Shadow Runner Safety Gate Checklist（[docs/shadow-runner-safety-gate-checklist.md](docs/shadow-runner-safety-gate-checklist.md)）、Staging Read-only Connection Review Gate（[docs/staging-readonly-connection-review-gate.md](docs/staging-readonly-connection-review-gate.md)）、Manual Sign-off Evidence Spec（[docs/manual-signoff-evidence-spec.md](docs/manual-signoff-evidence-spec.md)）、Staging Read-only Connection Dry-run Plan（[docs/staging-readonly-connection-dry-run-plan.md](docs/staging-readonly-connection-dry-run-plan.md)）、Staging Read-only Dry-run Execution Gate（[docs/staging-readonly-dry-run-execution-gate.md](docs/staging-readonly-dry-run-execution-gate.md)）、Staging Read-only Dry-run Execution Evidence Spec（[docs/staging-readonly-dry-run-execution-evidence-spec.md](docs/staging-readonly-dry-run-execution-evidence-spec.md)）、Allen War Room Operational Layout（[docs/allen-war-room-operational-layout.md](docs/allen-war-room-operational-layout.md)）、Allen Score Scoring Model（[docs/allen-score-scoring-model.md](docs/allen-score-scoring-model.md)）、Allen Score Deterministic Scoring Engine（[docs/allen-score-deterministic-scoring-engine.md](docs/allen-score-deterministic-scoring-engine.md)）與 Structured Candidate Trade Plan（[docs/structured-candidate-trade-plan.md](docs/structured-candidate-trade-plan.md)）。
- `use-cases/war-room/`：War Room Intelligence read-model type contract（types-only，無 runtime；V19 起以 type-only import 聚合四大引擎型別）、V20 fixture-only `/api/war-room` builder 與 V22 engine fixture adapters。
- `use-cases/intraday-alert/`：Intraday Alert read-model type contract（types-only，無 runtime）。
- `use-cases/research/`：Institutional Research Center read-model type contract（types-only，無 runtime）。
- `use-cases/technical-strategy/`：Technical + Risk Reward read-model type contract（types-only，無 runtime）。
- `use-cases/position-strategy/`：Position Strategy Plan read-model type contract（types + 靜態安全 constants，無 runtime；把技術指標轉成條件式策略觀察計畫）與 V26 deterministic fixture adapter（`buildPositionStrategyFixtureBundle`）。
- `use-cases/opportunity-pool/`：Dynamic Opportunity Pool & Price Verification read-model type contract（types + 靜態安全 constants，無 runtime；動態池分級與價格驗證語義）。
- `use-cases/holding-defense/`：Holding Defense Tracker API read-model type contract 與 pure builder（contract-only / fixture-only，無 runtime；持股即時防守追蹤 API shape）。
- `use-cases/runtime-data/`：Runtime Data Pipeline governance read-model type contract（types + 靜態安全 constants，無 runtime；source priority / price verification / stale guard / source conflict downgrade / data quality gate / pilot readiness 治理語義）。
- `use-cases/intraday-defense/`：Intraday Holding Defense Runtime governance read-model type contract（types + 靜態安全 constants，無 runtime；盤中防守 states / trigger rules / cooldown / dedup / no-DANGER guard / runtime readiness 治理語義）與 V31 fixture builder（`buildIntradayDefenseFixtureContract`，供 `GET /api/portfolio/intraday-defense`）。
- `use-cases/runtime-pilot/`：Runtime Pilot Readiness Checklist 與 Runtime Pilot Dry-Run read-model type contracts 與 pure spec builders（types + 靜態安全 constants，無 runtime；18 個 readiness gates / severity / status / go-no-go decision / audit / rollback / kill switch shape，以及 dry-run lifecycle / quote snapshot / price verification / alert projection / audit event / no-write proof / kill switch / rollback shape；預設 decision = NO_GO、lifecycleState = DRY_RUN_NOT_ALLOWED、dryRunAllowed = false）。

## 版本紀錄

### V63

Structured Buy Zone & Risk/Reward Contract：

- 把 candidate 的 pullbackBuyZone / riskRewardRatio / entryStrategy 從字串敘述升級成結構化 deterministic contract，讓「承接區」、「停損/失效條件」、「目標區」、「風報比」能被 validator 檢查一致性。本版仍是 fixture-only / deterministic contract / validator / UI structure；**不是 real-data mapping、不是 Supabase connection、不是 production trading readiness。** system candidate is not position、可逢低布局不等於已買進、no fake PnL、pnlComputable false、no shares、no cost basis；no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no auto order、not PRODUCTION_READY。
- 新增 `use-cases/war-room/structured-candidate-trade-plan-contract.ts`：型別 StructuredBuyZone（lower / upper / currency = "TWD" / basis / confidence / sourceType = "fixture_mock" / operationalUseAllowed = false）、StructuredRiskReward（stopLossLower / stopLossUpper / targetLower / targetUpper / downsideRiskPercent / upsideRewardPercent / rewardRiskRatio / sourceType = "fixture_mock" / operationalUseAllowed = false）、StructuredEntryStrategy（triggerConditionText / invalidationConditionText / observationOnlyText / sizingHintText / buySellCommandGenerated = false / autoOrderRequested = false）、CandidateTradePlan（對應 V62 candidate：symbol / name / grade / allenScore / pool / buyZone / riskReward / entryStrategy / isPosition = false / pnlComputable = false / fixtureOnly = true）、CandidateTradePlanValidation 與 bundle/constants。
- 新增 `use-cases/war-room/build-structured-candidate-trade-plan-contract.ts`：pure deterministic builder，對每檔 actionable（非 AVOID）V62 candidate 以固定 fixture 價位產生結構化 buy zone / risk-reward / entry strategy，並自我驗證（buyZone.lower <= buyZone.upper、stopLossUpper < buyZone.lower、targetLower > buyZone.upper、percent > 0、rewardRiskRatio 由 upside/downside 推導、sourceType fixture_mock、operationalUseAllowed false、isPosition false、pnlComputable false、無 shares / cost basis、entry strategy 為 observation only 非命令式買進、score/grade/pool 與 V62 引擎一致）；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀時鐘、不連線、不寫資料。
- 改寫 `use-cases/war-room/build-allen-score-scoring-model-contract.ts`：candidate 的 riskRewardRatio 字串改為與結構化 trade plan 的 rewardRiskRatio 一致（1 : 2.1 / 1 : 2.2，fixture）。
- 改寫 UI：`components/war-room/daily-candidate-pools.tsx`（每檔顯示結構化候選承接區 / 失效防守區 / 目標觀察區 + fixture/mock 區間不可作為正式操作依據、觀察策略不是買賣指令、無股數/成本不計算損益）、`components/war-room/system-candidates-table.tsx`（加註結構化 trade plan 指引）、`components/war-room/war-room-operational-layout.tsx`（import trade plan builder 並傳入候選池），並在 `app/system/safety/page.tsx` 新增 spec-only 的 Allen Score engine / trade plan consistency health 卡片（deterministic，no runtime、no fetch、no 連線）。
- 新增 `scripts/validate-structured-candidate-trade-plan.ts`：9 gates，import builder 與引擎實際呼叫，逐檔驗證上述一致性與安全旗標、每個 trade plan 對應 V62 candidate、UI 仍含承接區 / 失效防守區 / 目標觀察區 / fixture-mock 警告 / 觀察策略非買賣指令 / 系統候選股不等於持股 / 可逢低布局不等於已買進 / 無股數成本不計算損益，並**大小寫不敏感**掃描新 contract/builder 禁止 token 與 PRODUCTION_READY。
- 新增 `npm run test:structured-candidate-trade-plan`。
- 未新增 API route；未連 Supabase；未讀 env；未寫 DB；未接真實行情；未切換 /api/portfolio；未產生買賣指令；未自動下單；未標記 PRODUCTION_READY。

架構文件清單新增：Structured Candidate Trade Plan（[docs/structured-candidate-trade-plan.md](docs/structured-candidate-trade-plan.md)）。

### V62

Allen Score Deterministic Scoring Engine & Grade Consistency：

- 把 V61 目前手填的 candidate allenScore / grade / pool assignment 升級成 deterministic pure scoring engine，確保五大分項加總、總分、grade、candidate pool 完全一致。本版仍是 deterministic pure function + contract + validator + UI structure；**不是 real-data mapping、不是 Supabase connection、不是 production trading readiness。** system candidate is not position、可逢低布局不等於已買進、no fake PnL、pnlComputable false、fixture/mock score is not operational data；no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order。
- 新增 `use-cases/war-room/allen-score-scoring-engine.ts`：四個純函式 `scoreCandidate(subScores)`（驗證分項範圍並回傳 totalScore = 五大分項加總，超範圍時 throw RangeError）、`gradeCandidate(totalScore)`（A >= 80 / B 70–79 / C 60–69 / AVOID < 60）、`assignCandidatePool(grade)`（A => A_GRADE_MAIN_UPTREND / B => B_GRADE_WATCHLIST / C => C_GRADE_WAITING / AVOID => RISK_BLOCKLIST）、`buildCandidateScoringBreakdown(candidate)`（重算 computedTotal / engineGrade / assignedPool 並比對 reportedTotal）；無副作用、無 I/O、不連線、不讀 env、不 fetch、不讀時鐘、不寫資料。
- 新增 `use-cases/war-room/allen-score-deterministic-scoring-engine-contract.ts`：types + 鎖定 constants（AllenScoreDeterministicScoringEngineBundle / AllenScoreScoringConsistency / thresholds / gradePoolMap）；安全旗標以 literal 釘死（realDataConnected / supabaseConnected / envReadPerformed / databaseWritePerformed / portfolioApiSwitched / buySellCommandGenerated / autoOrderRequested / productionTradingReady = false，無 PRODUCTION_READY）。
- 新增 `use-cases/war-room/build-allen-score-deterministic-scoring-engine-contract.ts`：pure deterministic builder，import V61 daily pools，逐檔以引擎重算並驗證 consistency（every candidate total equals sub-score sum / every candidate grade matches score / every candidate pool matches grade / A pool only A grade and score >= 80 / B pool only B grade 70–79 / C pool only C grade 60–69 / risk blocklist only AVOID and score < 60 / no candidate both position and system candidate / pnlComputable false for all system candidates / system candidates have no shares or cost basis / fixture-mock warning visible）；全一致 → decision = READY_FOR_UI_REVIEW，否則 NO_GO；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不連線、不寫資料。
- 改寫 `use-cases/war-room/build-allen-score-scoring-model-contract.ts`：candidate 的 allenScore 改由 `scoreCandidate` 推導、grade 改由 `gradeCandidate` 推導（不再手填），確保總分 = 五大分項加總且 grade 永遠對應分數。
- 改寫 UI：`components/war-room/allen-score-summary.tsx`（顯示 deterministic scoring engine grade↔score 一致性狀態）、`components/war-room/daily-candidate-pools.tsx` 與 `components/war-room/system-candidates-table.tsx`（加註「總分 = 五大分項加總、分級依分數」說明），`components/war-room/war-room-operational-layout.tsx`（import 引擎 builder 並傳入 summary）。
- 新增 `scripts/validate-allen-score-deterministic-scoring-engine.ts`：12 gates，import 引擎與 builder 實際呼叫，驗證四個函式 export、scoreCandidate reject 超範圍分項、gradeCandidate / assignCandidatePool 邊界（A >= 80 / B 70–79 / C 60–69 / AVOID < 60）、所有 candidate total = sub-score sum、grade 對應分數、pool 對應 grade、candidate 不被當持股、pnlComputable false、UI 仍含 Allen Score 100 / A / B / C / 禁碰池 / 系統候選股不等於持股 / 可逢低布局不等於已買進 / fixture-mock 警告，並**大小寫不敏感**掃描純函式檔（full forbidden 含 fetch( / axios / autoorder / placeorder）與 contract/builder（連線/寫入 token）。
- 新增 `npm run test:allen-score-deterministic-scoring-engine`。
- 未新增 API route；未連 Supabase；未讀 env；未寫 DB；未接真實行情；未切換 /api/portfolio；未產生買賣指令；未自動下單；不假裝分數是真實資料；不把候選股當持股；不標記 PRODUCTION_READY。

架構文件清單新增：Allen Score Deterministic Scoring Engine（[docs/allen-score-deterministic-scoring-engine.md](docs/allen-score-deterministic-scoring-engine.md)）。

### V61

Allen Score Scoring Model & Candidate Pools：

- 把 Allen 指定的 Allen Score 100 評分模組正式寫進專案架構，並把 System Candidates 升級成依 Allen Score 每日產出的候選池。本版仍是 deterministic contract + UI structure + validator：**system candidate is not position、可逢低布局不等於已買進、no fake PnL（沒有實際進場股數與成本不得計算持股損益）、fixture/mock score is not operational data。** no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order。
- 新增 `docs/allen-score-scoring-model.md`：定義 Allen Score 100 = Technical Score 30 + Fundamental Score 25 + Chip Score 25 + ETF Flow Score 10 + Market Sentiment Score 10（weights sum to 100）；技術面條件（KD / KDJ / MACD / moving averages / 扣三低 / KD 低檔黃金交叉 / MACD 翻紅 / 站回 5MA / 10MA / 20MA / 均線糾結後向上發散 / 突破前高 / 放量突破 / 主升段偵測 …）、基本面（營收 / EPS / 毛利率 / 法人預估）、籌碼面（外資 / 投信 / 主力 / 大戶持股）、ETF 資金流（00981A / 00991A / 00403A / 是否同步買進）、市場情緒（Put / Call / VIX / 散戶小台 / 外資期貨）；每日分級 A 級主升段池（≥ 80）/ B 級觀察池（70–79）/ C 級等待池（60–69）/ 禁碰池（< 60）；candidate output fields 與 safety boundary。
- 新增 `use-cases/war-room/allen-score-scoring-model-contract.ts`：types + 鎖定 constants（AllenScoreCategoryId / AllenScoreGrade / AllenScorePoolId / AllenScoreSuggestedAction / AllenScoreVerificationStatus、AllenScoreCategory / AllenScorePoolDefinition / AllenScoreCandidate（isPosition: false / pnlComputable: false）/ AllenScoreDailyPool / AllenScoreScoringModelBundle、`ALLEN_SCORE_ETF_FLOW_SYMBOLS = 00981A / 00991A / 00403A`、`ALLEN_SCORE_SAFETY_LABELS`）；安全旗標以 literal 釘死（systemCandidateIsNotPosition / watchlistIsNotPosition / opportunityPoolIsNotPosition / actualPositionRequiresSharesAndCostForPnl / noFakePnlAllowed / sampleScoreIsFixtureOnly / mockDataMustBeLabeled / fixtureDataMustBeLabeled = true，realDataConnected / supabaseConnected / envReadPerformed / databaseWritePerformed / portfolioApiSwitched / buySellCommandGenerated / autoOrderRequested / productionTradingReady = false，無 PRODUCTION_READY）。
- 新增 `use-cases/war-room/build-allen-score-scoring-model-contract.ts`：pure deterministic builder `buildAllenScoreScoringModelContract()`，輸出 contractVersion=V61 / scoringModelName=Allen Score 100 / decision=READY_FOR_UI_REVIEW；totalScore=100、technicalWeight=30 / fundamentalWeight=25 / chipWeight=25 / etfFlowWeight=10 / marketSentimentWeight=10 / scoreWeightsSum=100；aGradeThreshold=80 / bGradeMin=70 / bGradeMax=79 / cGradeMin=60 / cGradeMax=69 / avoidBelow=60；5 大 category（含所有 sub-factors 與 judgement notes）、4 個 pool definitions、daily pools 帶 fixture-only sample candidates（每檔 allenScore = 五大分項加總、isPosition=false、pnlComputable=false、清楚標示 fixture）；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不連 Supabase、不寫資料。
- 新增 UI components：`components/war-room/allen-score-summary.tsx`（Allen Score 100 摘要：五大分項權重 + 分級門檻 + fixture/mock 警告）、`components/war-room/daily-candidate-pools.tsx`（A 級主升段池 / B 級觀察池 / C 級等待池 / 禁碰池，每檔顯示候選原因 / 技術觸發 / 承接區 / 確認條件 / 失效條件 / 風報比 / 今日建議 / 資料來源 / 資料時間 / 驗證狀態）。
- 改寫 `components/war-room/system-candidates-table.tsx`：改為以 Allen Score 呈現，顯示總分與五大分項（technicalScore / fundamentalScore / chipScore / etfFlowScore / marketSentimentScore），維持「系統候選股不等於持股」。
- 改寫 `components/war-room/war-room-operational-layout.tsx`：import `buildAllenScoreScoringModelContract`，第一屏新增 `<AllenScoreSummary />` 與 `<DailyCandidatePools />`，並把 `<SystemCandidatesTable />` 餵入 Allen Score 候選。
- 新增 `scripts/validate-allen-score-scoring-model.ts`：9 gates（required_files / required_phrases / contract_checks / no_production_ready / payload_checks / ui_checks / package_checks / readme_checks / safety），import builder 實際呼叫驗證 weights sum to 100、thresholds（A ≥ 80 / B 70–79 / C 60–69 / Avoid < 60）、每檔 candidate isPosition=false 且 pnlComputable=false 且分項加總=總分、UI 含 Allen Score 100 / A / B / C / 禁碰池 / fixture-mock 警告 / 系統候選股不等於持股 / 可逢低布局不等於已買進，並**大小寫不敏感**掃描新 UI 檔禁止 token（含 fetch( / axios / autoorder / placeorder），contract/builder 掃描連線/寫入 token，確認 protected files 仍存在。
- 新增 `npm run test:allen-score-scoring-model`。
- 未新增 API route；未連 Supabase；未讀 env；未寫 DB；未接真實行情；未切換 /api/portfolio；未產生買賣指令；未自動下單；不假裝分數是真實資料；不把候選股當持股。

架構文件清單新增：Allen Score Scoring Model（[docs/allen-score-scoring-model.md](docs/allen-score-scoring-model.md)）。

### V60

Allen War Room Operational Layout：

- 把 `/holdings` 從工程監控頁重整成 Allen 的「台股戰情室操作首頁」，並鎖定核心資料分類（實際持股 / 固定追蹤 / 系統候選 / 機會池 / 禁碰股 / 工程安全）。Allen 是 **owner and user, not developer**。**current fixture/mock data is not operational data；final website must use real data before operational use。** 本版仍 no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order，且不假裝 fixture 為真實、不假算持股 shares / cost / PnL。
- 新增 `docs/allen-war-room-operational-layout.md`：定義 user & goal、locked data taxonomy（actual positions are entered holdings only / watchlist is not position / system candidate is not position / actual position requires shares and average cost before PnL / no fake PnL / no fake position size）、`/holdings` operational layout（status bar 含 data date / data source / verification status、summary cards、actual positions / fixed watchlist / system candidates、pre-market / intraday / after-close session view、engineering safety moved away from primary trading view）、safety boundary 與 decision。
- 新增 `use-cases/war-room/allen-war-room-data-taxonomy-contract.ts`：types + 鎖定 constants（DataCategory：ACTUAL_POSITION / FIXED_WATCHLIST / SYSTEM_CANDIDATE / OPPORTUNITY_POOL / RISK_BLOCKLIST / ENGINEERING_SAFETY；MarketSession：PRE_MARKET / INTRADAY / AFTER_CLOSE / US_MARKET_PREVIEW / CLOSED / DATA_UNAVAILABLE；VerificationStatus：VERIFIED / DELAYED / STALE / CONFLICT / FIXTURE_ONLY / MOCK_ONLY / INSUFFICIENT_DATA / NOT_CONNECTED；TodayAction：HOLD / DEFEND / REDUCE / ADD_ON_CONFIRMATION / WATCH_PULLBACK / WAIT / AVOID / DATA_INSUFFICIENT），ActualPosition / WatchlistItem（isPosition false）/ SystemCandidate（isPosition false）/ RiskBlocklistItem / SummaryCard / SessionStructure / bundle；鎖定旗標 actualPositionsDefinitionLocked / watchlistDefinitionLocked / systemCandidatesDefinitionLocked / actualPositionRequiresEntryRecord / actualPositionRequiresSharesAndCostForPnl / watchlistIsNotPosition / systemCandidateIsNotPosition / mockDataMustBeLabeled / fixtureDataMustBeLabeled / operationalLayoutDefined / engineeringSafetyMovedAwayFromPrimaryView = true，userIsDeveloper / productionTradingReady / realDataConnected / supabaseConnected / envReadPerformed / databaseWritePerformed / portfolioApiSwitched / buySellCommandGenerated / autoOrderRequested = false（無 PRODUCTION_READY）。
- 新增 `use-cases/war-room/build-allen-war-room-operational-layout-contract.ts`：pure deterministic builder，輸出 contractVersion=V60 / decision=READY_FOR_UI_REVIEW；actual positions 只含 4966 譜瑞、2743 山富 兩筆 user-confirmed but incomplete（sharesKnown / averageCostKnown=false、pnlComputable=false、標示「持股資料待補」、不假算損益）；fixed watchlist = 3019 / 4966 / 5347 / 4979 / 2455；system candidates / risk blocklist 為清楚標示之 fixture sample；4 張 summary cards；3 個 session structures（盤前 / 盤中 / 收盤後）；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不連 Supabase、不寫資料。
- 新增 UI components：`components/war-room/war-room-operational-layout.tsx`（first screen 組裝）、`actual-positions-table.tsx`（核心持股表，無 shares/cost 即顯示「持股資料待補」「不可計算損益」）、`fixed-watchlist-table.tsx`（標示「追蹤股不等於持股」）、`system-candidates-table.tsx`（標示「系統候選股不等於持股」）、`market-session-panel.tsx`（盤前 / 盤中 / 收盤後）、`data-verification-banner.tsx`（顯示 data date / time / source / verification 與「目前非真實資料，不可作為操作依據」）。
- 修改 `app/holdings/page.tsx`：第一屏改為 `<WarRoomOperationalLayout />`；既有工程監控（RuntimePilotReadiness / RuntimePilotMonitoring / FirstAuthorizedSourceDryRunMonitoring / ShadowRunnerDryRunMonitoring）移到頁面底部 collapsible「系統安全監控 / Engineering Safety」（仍保留 import / render，未刪除，只移出第一屏）。
- 新增 `app/system/safety/page.tsx`：專責工程安全監控頁，集中呈現上述既有 monitoring components（僅移動位置，未刪除）。
- 新增 `scripts/validate-allen-war-room-operational-layout.ts`：10 gates（required_files / required_phrases / contract_checks / no_production_ready / payload_checks / ui_checks / safety_relocation / package_checks / readme_checks / safety），驗證鎖定定義、actual≠watchlist≠candidate 角色、無 shares/cost 不算 PnL、三表 + session panel + fixture warning 存在、war room 在工程監控之前（第一屏）、工程監控移入 collapsible / `/system/safety`、既有 monitoring components 仍存在，並**大小寫不敏感**掃描 UI 檔禁止 token（含 autoorder / placeorder）、contract/builder 掃描連線/寫入 token。
- 新增 `npm run test:allen-war-room-operational-layout`。
- 未新增 API route；未連 Supabase；未讀 env；未寫 DB；未接真實行情；未切換 /api/portfolio；未產生買賣指令；未自動下單。

架構文件清單新增：Allen War Room Operational Layout（[docs/allen-war-room-operational-layout.md](docs/allen-war-room-operational-layout.md)）。

### V59

Staging Read-only Dry-run Execution Evidence Spec：

- 新增 `docs/staging-readonly-dry-run-execution-evidence-spec.md`：定義 **Staging Read-only Dry-run Execution Evidence Spec**（A–H 章），即未來真的執行 staging read-only dry-run 後應收集哪些 execution evidence（read-only probe / no-write proof / RLS select-only / role / shadow comparison / mismatch / stale・empty・error fallback / kill switch / rollback / no /api/portfolio switch / no real market data / no buy/sell・auto order）。明確聲明 V59 是 execution evidence structure（not execution evidence instance）、spec-only（not actual dry-run execution / not actual connection）；V58 execution gate exists but execution remains blocked；V57 dry-run plan exists but execution remains blocked；actualDryRunExecuted / actualDryRunEvidenceProvided / manualSignoffCompleted / manualSignoffEvidenceProvided / stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed 全 false；PORTFOLIO_SOURCE_MODE must remain hardcoded；/api/portfolio must not be switched；fixture/hardcoded must not be overridden by staging；mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default。
- 新增 `use-cases/deployment/staging-readonly-dry-run-execution-evidence-spec-contract.ts`：types + 靜態安全 constants only（無 runtime / fetch / axios / @supabase / createClient / process.env / Date.now / new Date / insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 NO_GO / READY_FOR_REVIEW，刻意**不含 PRODUCTION_READY**）/ 16 個 category / status（含 NOT_PROVIDED）/ evidenceItem / bundle，與 `_CONTRACT_VERSION` / `_DEPLOYMENT_TARGET` / `_CATEGORIES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（dryRunExecutionEvidenceSpecDefined / manualSignoffRequired / killSwitchDefaultEnabled / dashboardReadonlyRoleRequired / readOnlySelectOnlyRequired / writeOperationsBlocked / shadowOnlyRequired / portfolioApiMustRemainHardcoded = true，其餘 execution / sign-off / 連線 / 寫入 / promote / override / role 旗標全 false）。
- 新增 `use-cases/deployment/build-staging-readonly-dry-run-execution-evidence-spec-contract.ts`：pure deterministic builder `buildStagingReadonlyDryRunExecutionEvidenceSpecContract()`，產生 **24 個 deterministic evidence items**，覆蓋全部 16 個 category；因 actual dry-run 尚未執行，需收集之 item status 為 NOT_PROVIDED / BLOCKED 且 blocksEvidenceAcceptance=true，故 **decision 預設 NO_GO**、actualDryRunExecuted / actualDryRunEvidenceProvided / stagingDryRunExecutionAllowed / stagingConnectionAllowed / stagingConnectionReviewAllowed 全 false；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不連 Supabase、不發 request、不寫資料、不 import route、不執行 dry-run。
- 新增 `scripts/validate-staging-readonly-dry-run-execution-evidence-spec.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、decision=NO_GO、≥20 items、16 category 全覆蓋、per-item policy（requiredEvidence / acceptedEvidenceFormat / expectedState / providedState / failureAction 非空、各 boolean 旗標、requiredAfterDryRunExecution 非 PASS 必 blocksEvidenceAcceptance=true）、全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected files 仍存在。
- 新增 `npm run test:staging-readonly-dry-run-execution-evidence-spec`。
- Staging Read-only Dry-run Execution Evidence Spec：specName = Staging Read-only Dry-run Execution Evidence Spec；deploymentTarget = staging；decision = NO_GO；execution evidence structure（not execution evidence instance / not actual dry-run execution / not actual connection）；不翻任何 execution / sign-off / connection 旗標。
- V59 不連 staging Supabase；不接 production Supabase；不讀 Supabase env key；不寫 staging / production；不新增 SQL migration；不建立 Supabase client；不建立 actual shadow runner runtime；不執行 actual shadow runner；不切換 /api/portfolio；不建立 quote polling / scheduler / webhook / crawler / connector runtime；不接真實行情。
- 旗標狀態：manualSignoffCompleted = false；manualSignoffEvidenceProvided = false；actualDryRunExecuted = false；actualDryRunEvidenceProvided = false；stagingConnectionAllowed = false；stagingConnectionReviewAllowed = false；stagingDryRunExecutionAllowed = false；productionReadinessAllowed = false。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未執行 actual dry-run；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V60 Manual Sign-off Evidence Instance 或 V60 Staging Read-only Dry-run Execution Evidence Instance。

架構文件清單新增：Staging Read-only Dry-run Execution Evidence Spec（[docs/staging-readonly-dry-run-execution-evidence-spec.md](docs/staging-readonly-dry-run-execution-evidence-spec.md)）。

### V58

Staging Read-only Dry-run Execution Gate：

- 新增 `docs/staging-readonly-dry-run-execution-gate.md`：定義 **Staging Read-only Dry-run Execution Gate**（A–H 章），即未來「什麼條件全部滿足後，才允許真正執行 staging read-only dry-run」的 execution gate（不是 execution 本身）。明確聲明 V58 是 execution gate（not actual dry-run execution）、spec-only（not actual connection）；V57 dry-run plan exists but execution remains blocked；V56 manual sign-off evidence spec exists but evidence remains not provided；manualSignoffCompleted / manualSignoffEvidenceProvided / stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed / actualDryRunExecuted 全 false；PORTFOLIO_SOURCE_MODE must remain hardcoded；/api/portfolio must not be switched；fixture/hardcoded must not be overridden by staging；mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default。
- 新增 `use-cases/deployment/staging-readonly-dry-run-execution-gate-contract.ts`：types + 靜態安全 constants only（無 runtime / fetch / axios / @supabase / createClient / process.env / Date.now / new Date / insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 NO_GO / READY_FOR_REVIEW，刻意**不含 PRODUCTION_READY**）/ 15 個 category / status（含 NOT_PROVIDED）/ gateItem / bundle，與 `_CONTRACT_VERSION` / `_DEPLOYMENT_TARGET` / `_CATEGORIES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（dryRunExecutionGateDefined / v57DryRunPlanExists / v56ManualSignoffSpecExists / v55ConnectionReviewGateExists / manualSignoffRequired / killSwitchDefaultEnabled / dashboardReadonlyRoleRequired / readOnlySelectOnlyRequired / writeOperationsBlocked / shadowOnlyRequired / portfolioApiMustRemainHardcoded = true，其餘 sign-off / signer / 連線 / dry-run-execution / 寫入 / promote / override / role 旗標全 false）。
- 新增 `use-cases/deployment/build-staging-readonly-dry-run-execution-gate-contract.ts`：pure deterministic builder `buildStagingReadonlyDryRunExecutionGateContract()`，產生 **26 個 deterministic gate items**，覆蓋全部 15 個 category；sign-off / evidence / 外部驗證 / final-go-no-go item 為 NOT_PROVIDED / NOT_REVIEWED / BLOCKED 且 blocksDryRunExecution=true，故 **decision 預設 NO_GO**、stagingDryRunExecutionAllowed / stagingConnectionAllowed / stagingConnectionReviewAllowed / actualDryRunExecuted 全 false；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不連 Supabase、不發 request、不寫資料、不 import route、不執行 dry-run。
- 新增 `scripts/validate-staging-readonly-dry-run-execution-gate.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、decision=NO_GO、≥20 items、15 category 全覆蓋、per-item policy（requiredEvidence / expectedState / actualState / failureAction 非空、各 block 旗標為 boolean）、全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected files 仍存在。
- 新增 `npm run test:staging-readonly-dry-run-execution-gate`。
- Staging Read-only Dry-run Execution Gate：gateName = Staging Read-only Dry-run Execution Gate；deploymentTarget = staging；decision = NO_GO；execution gate（not actual dry-run execution / not actual connection）；不翻任何 sign-off / connection / dry-run-execution 旗標。
- 旗標狀態：manualSignoffCompleted = false；manualSignoffEvidenceProvided = false；stagingConnectionAllowed = false；stagingConnectionReviewAllowed = false；stagingDryRunExecutionAllowed = false；actualDryRunExecuted = false；actualConnectionAttempted = false；productionReadinessAllowed = false。
- V58 不連 staging Supabase；不接 production Supabase；不讀 Supabase env key；不寫 staging / production；不新增 SQL migration；不建立 Supabase client；不建立 actual shadow runner runtime；不執行 actual shadow runner；不切換 /api/portfolio；不建立 quote polling / scheduler / webhook / crawler / connector runtime；不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未執行 actual dry-run；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V59 Manual Sign-off Evidence Instance 或 V59 Staging Read-only Dry-run Execution Evidence。

架構文件清單新增：Staging Read-only Dry-run Execution Gate（[docs/staging-readonly-dry-run-execution-gate.md](docs/staging-readonly-dry-run-execution-gate.md)）。

### V57

Staging Read-only Connection Dry-run Plan：

- 新增 `docs/staging-readonly-connection-dry-run-plan.md`：定義 **Staging Read-only Connection Dry-run Plan**（A–H 章），即未來 staging read-only connection dry-run 的步驟、前置條件、人工檢查點、kill switch 中止點、rollback 步驟、錯誤分類與 evidence capture plan。明確聲明 V57 是 dry-run plan（not actual dry-run execution）、spec-only（not actual connection）；V56 manual sign-off evidence spec exists but evidence remains not provided；V55 connection review gate exists but decision remains NO_GO；manualSignoffCompleted / manualSignoffEvidenceProvided / stagingConnectionAllowed / stagingConnectionReviewAllowed / stagingDryRunExecutionAllowed 全 false；PORTFOLIO_SOURCE_MODE must remain hardcoded；/api/portfolio must not be switched；fixture/hardcoded must not be overridden by staging；mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default。
- 新增 `use-cases/deployment/staging-readonly-connection-dry-run-plan-contract.ts`：types + 靜態安全 constants only（無 runtime / fetch / axios / @supabase / createClient / process.env / Date.now / new Date / insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 NO_GO / READY_FOR_REVIEW，刻意**不含 PRODUCTION_READY**）/ v55Decision（固定 NO_GO）/ 13 個 phase / executionMode / allowedOperation / status / planStep / bundle，與 `_CONTRACT_VERSION` / `_DEPLOYMENT_TARGET` / `_PHASES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（dryRunPlanDefined / manualSignoffRequired / v56ManualSignoffSpecExists / v55ConnectionReviewGateExists / killSwitchDefaultEnabled / dashboardReadonlyRoleRequired / readOnlySelectOnlyRequired / writeOperationsBlocked / shadowOnlyRequired / portfolioApiMustRemainHardcoded = true，其餘 dry-run / sign-off / 連線 / 寫入 / promote / override / role 旗標全 false）。
- 新增 `use-cases/deployment/build-staging-readonly-connection-dry-run-plan-contract.ts`：pure deterministic builder `buildStagingReadonlyConnectionDryRunPlanContract()`，產生 **28 個 deterministic plan steps**，覆蓋全部 13 個 phase（PRECHECK / MANUAL_SIGNOFF / ENVIRONMENT_REVIEW / RLS_REVIEW / ROLE_REVIEW / DRY_RUN_PREPARATION / READ_ONLY_PROBE_PLAN / SHADOW_COMPARISON_PLAN / ERROR_HANDLING / KILL_SWITCH / ROLLBACK / EVIDENCE_CAPTURE / FINAL_GO_NO_GO）；manual sign-off / final-go-no-go / 外部驗證 step 為 BLOCKED / NOT_READY，其餘規劃 step 為 PLANNED、不變量 step 為 PASS，故 **decision 預設 NO_GO**、stagingDryRunExecutionAllowed / stagingConnectionAllowed / stagingConnectionReviewAllowed 全 false；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不連 Supabase、不發 request、不寫資料、不 import route、不執行 dry-run。
- 新增 `scripts/validate-staging-readonly-connection-dry-run-plan.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、decision=NO_GO、v55Decision=NO_GO、≥20 steps、13 phase 全覆蓋、per-step policy（requiredBeforeStep / expectedInput / expectedOutput / forbiddenOperation / killSwitchBehavior / rollbackBehavior / evidenceToCapture 非空、allowedOperation 合法、各 block 旗標為 boolean）、全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected files 仍存在。
- 新增 `npm run test:staging-readonly-connection-dry-run-plan`。
- Staging Read-only Connection Dry-run Plan：planName = Staging Read-only Connection Dry-run Plan；deploymentTarget = staging；decision = NO_GO；dry-run plan（not actual dry-run execution / not actual connection）；不翻任何 sign-off / connection / dry-run-execution 旗標。
- 旗標狀態：manualSignoffCompleted = false；stagingConnectionAllowed = false；stagingConnectionReviewAllowed = false；stagingDryRunExecutionAllowed = false；actualConnectionImplemented = false；actualConnectionAttempted = false；productionReadinessAllowed = false。
- V57 不連 staging Supabase；不接 production Supabase；不讀 Supabase env key；不寫 staging / production；不新增 SQL migration；不建立 Supabase client；不建立 actual shadow runner runtime；不執行 actual shadow runner；不切換 /api/portfolio；不建立 quote polling / scheduler / webhook / crawler / connector runtime；不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未執行 actual dry-run；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V58 Manual Sign-off Evidence Instance 或 V58 Staging Read-only Dry-run Execution Gate。

架構文件清單新增：Staging Read-only Connection Dry-run Plan（[docs/staging-readonly-connection-dry-run-plan.md](docs/staging-readonly-connection-dry-run-plan.md)）。

### V56

Manual Sign-off Evidence Spec：

- 新增 `docs/manual-signoff-evidence-spec.md`：定義 **Manual Sign-off Evidence Spec**（A–H 章），即未來人工簽核 evidence 的資料結構、必填證據、簽核對象 / 範圍、外部檢查項目與 GO/NO-GO 規則。明確聲明 V56 是 sign-off evidence structure、not actual sign-off；V55 connection review gate exists but decision remains NO_GO；manualSignoffRequired = true；manualSignoffCompleted = false；manualSignoffEvidenceProvided = false；manualSignerIdentityVerified = false；manualSignerHasAuthority = false；stagingConnectionAllowed = false；stagingConnectionReviewAllowed = false；actualConnectionImplemented = false；actualConnectionAttempted = false；productionReadinessAllowed = false；serviceRoleAllowedInAppRuntime = false；dashboardReadonlyRoleRequired = true；readOnlySelectOnlyRequired = true；writeOperationsBlocked = true；shadowOnlyRequired = true；PORTFOLIO_SOURCE_MODE must remain hardcoded；/api/portfolio must not be switched；fixture/hardcoded must not be overridden by staging；mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default。
- 新增 `use-cases/deployment/manual-signoff-evidence-spec-contract.ts`：types + 靜態安全 constants only（無 runtime / fetch / axios / @supabase / createClient / process.env / Date.now / new Date / insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 NO_GO / READY_FOR_REVIEW，刻意**不含 PRODUCTION_READY**）/ v55Decision（固定 NO_GO）/ 16 個 category / status（含 NOT_PROVIDED）/ evidenceRequirementItem / bundle，與 `_CONTRACT_VERSION` / `_DEPLOYMENT_TARGET` / `_CATEGORIES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（manualSignoffEvidenceSpecDefined / manualSignoffRequired / v55ConnectionReviewGatePassed / killSwitchDefaultEnabled / dashboardReadonlyRoleRequired / readOnlySelectOnlyRequired / writeOperationsBlocked / shadowOnlyRequired / portfolioApiMustRemainHardcoded = true，其餘 sign-off / signer / 連線 / 寫入 / promote / override / role 旗標全 false）。
- 新增 `use-cases/deployment/build-manual-signoff-evidence-spec-contract.ts`：pure deterministic builder `buildManualSignoffEvidenceSpecContract()`，產生 **25 個 deterministic evidence requirement items**，覆蓋全部 16 個 category；尚未提供之 evidence（signer identity / authority、Supabase project identity、staging URL、env secret handling、dashboard_readonly_app role、RLS select-only、write blocking、rollback plan）status=NOT_PROVIDED 且 blocksManualSignoff=true，故 **decision 預設 NO_GO**、manualSignoffCompleted / manualSignoffEvidenceProvided / signer 旗標 / stagingConnectionAllowed / stagingConnectionReviewAllowed 全 false；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不連 Supabase、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-manual-signoff-evidence-spec.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、decision=NO_GO、v55Decision=NO_GO、≥20 items、16 category 全覆蓋、per-item policy（requiredEvidence / acceptedEvidenceFormat / expectedState / providedState 非空、各 block / required 旗標為 boolean、requiredBeforeManualSignoff 非 PASS 必 blocksManualSignoff=true）、全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected files 仍存在。
- 新增 `npm run test:manual-signoff-evidence-spec`。
- Manual Sign-off Evidence Spec：specName = Manual Sign-off Evidence Spec；deploymentTarget = staging；decision = NO_GO；sign-off evidence structure（not actual sign-off）；不翻任何 sign-off / connection / review-allowed 旗標。
- V56 不連 staging Supabase；不接 production Supabase；不讀 Supabase env key；不寫 staging / production；不新增 SQL migration；不建立 Supabase client；不建立 actual shadow runner runtime；不執行 actual shadow runner；不切換 /api/portfolio；不建立 quote polling / scheduler / webhook / crawler / connector runtime；不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V57 Manual Sign-off Evidence Instance 或 V57 Staging Read-only Connection Dry-run Plan。

架構文件清單新增：Manual Sign-off Evidence Spec（[docs/manual-signoff-evidence-spec.md](docs/manual-signoff-evidence-spec.md)）。

### V55

Staging Read-only Connection Review Gate：

- 新增 `docs/staging-readonly-connection-review-gate.md`：定義 **Staging Read-only Connection Review Gate**（A–H 章），即進入未來 staging read-only connection review 的 gate 條件、人工 sign-off 欄位、allowed / blocked 狀態、read-only / shadow-only constraints 與 rollback / kill switch / evidence requirements。明確聲明 V55 是 review gate、not actual connection；V54 checklist passed = true；manualSignoffRequired = true；manualSignoffCompleted = false；manualSignoffEvidenceProvided = false；stagingConnectionAllowed = false；stagingConnectionReviewAllowed = false；actualConnectionImplemented = false；actualConnectionAttempted = false；productionReadinessAllowed = false；serviceRoleAllowedInAppRuntime = false；dashboardReadonlyRoleRequired = true；readOnlySelectOnlyRequired = true；writeOperationsBlocked = true；shadowOnlyRequired = true；PORTFOLIO_SOURCE_MODE must remain hardcoded；/api/portfolio must not be switched；fixture/hardcoded must not be overridden by staging；mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default。
- 新增 `use-cases/deployment/staging-readonly-connection-review-gate-contract.ts`：types + 靜態安全 constants only（無 runtime / fetch / axios / @supabase / createClient / process.env / Date.now / new Date / insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 NO_GO / READY_FOR_REVIEW，刻意**不含 PRODUCTION_READY**）/ 15 個 category / status / requirementItem / bundle，與 `_CONTRACT_VERSION` / `_DEPLOYMENT_TARGET` / `_CATEGORIES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（connectionReviewGateDefined / manualSignoffRequired / v54ChecklistPassed / killSwitchDefaultEnabled / dashboardReadonlyRoleRequired / readOnlySelectOnlyRequired / writeOperationsBlocked / shadowOnlyRequired / portfolioApiMustRemainHardcoded = true，其餘連線 / sign-off / 寫入 / promote / override / role 旗標全 false）。
- 新增 `use-cases/deployment/build-staging-readonly-connection-review-gate-contract.ts`：pure deterministic builder `buildStagingReadonlyConnectionReviewGateContract()`，產生 **31 個 deterministic requirement items**，覆蓋全部 15 個 category（MANUAL_SIGNOFF / V54_CHECKLIST / SUPABASE_PROJECT / ENVIRONMENT_VARIABLES / RLS_POLICY / ROLE_ACCESS / READ_ONLY_OPERATION / SHADOW_ONLY / KILL_SWITCH / PORTFOLIO_SOURCE_MODE / API_ROUTE_SAFETY / UI_SAFETY / DATA_SOURCE_SAFETY / PRODUCTION_READINESS / ROLLBACK_PLAN）；manual signoff item status NOT_REVIEWED / BLOCKED 且 blocksConnectionReview=true，故 **decision 預設 NO_GO**、stagingConnectionAllowed=false、stagingConnectionReviewAllowed=false；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不連 Supabase、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-staging-readonly-connection-review-gate.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、decision=NO_GO、≥20 items、15 category 全覆蓋、per-item policy（boolean 旗標、expectedState/actualState 非空、manual signoff item manualReviewRequired=true 且 status NOT_REVIEWED/BLOCKED）、全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected files 仍存在。
- 新增 `npm run test:staging-readonly-connection-review-gate`。
- Staging Read-only Connection Review Gate：gateName = Staging Read-only Connection Review Gate；deploymentTarget = staging；decision = NO_GO；review gate（not actual connection）；manualSignoffRequired = true / manualSignoffCompleted = false / manualSignoffEvidenceProvided = false；stagingConnectionAllowed = false / stagingConnectionReviewAllowed = false；actualConnectionImplemented = false / actualConnectionAttempted = false；productionReadinessAllowed = false。
- V55 不連 staging Supabase；不接 production Supabase；不讀 Supabase env key；不寫 staging / production；不新增 SQL migration；不建立 Supabase client；不建立 actual shadow runner runtime；不執行 actual shadow runner；不切換 /api/portfolio；不建立 quote polling / scheduler / webhook / crawler / connector runtime；不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V56 Manual Sign-off Evidence 或 V56 Staging Read-only Connection Dry-run Plan。

架構文件清單新增：Staging Read-only Connection Review Gate（[docs/staging-readonly-connection-review-gate.md](docs/staging-readonly-connection-review-gate.md)）。

### V54

Shadow Runner Safety Gate Checklist：

- 新增 `docs/shadow-runner-safety-gate-checklist.md`：定義 **Shadow Runner Safety Gate Checklist**（A–G 章），把 V44～V53 安全不變量收斂成單一、可驗證、可人工 sign-off 的 final checklist，作為進入 **V55 Staging Read-only Connection Review Gate** 前的總閘門。明確聲明 responseSource must remain mock_or_contract、sourceMode must remain fixture、PORTFOLIO_SOURCE_MODE must remain hardcoded、fixture/hardcoded must not be overridden by staging、mismatch must not promote staging、empty / stale / error result must not override hardcoded、kill switch must be enabled by default、manualSignoffRequired = true、manualSignoffCompleted = false、stagingConnectionAllowed = false、production readiness remains blocked；不是新功能 / 不新增 UI / API route / 不連 Supabase / 不讀 env / 不寫 DB / 不新增 SQL migration / 不切換 /api/portfolio / 不接真實行情 / 不產生買賣指令 / 不自動下單。
- 新增 `use-cases/deployment/shadow-runner-safety-gate-checklist-contract.ts`：types + 靜態安全 constants only（無 runtime / fetch / axios / @supabase / createClient / process.env / Date.now / new Date / insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 READY_FOR_REVIEW / NO_GO，刻意**不含 PRODUCTION_READY**）/ 15 個 category / status / checklistItem / bundle，與 `_CONTRACT_VERSION` / `_DEPLOYMENT_TARGET` / `_CATEGORIES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（safetyGateChecklistDefined / manualSignoffRequired / killSwitchDefaultEnabled / productionRouteSmokePassed / monitoringUiProductionEvidencePassed = true，manualSignoffCompleted / stagingConnectionAllowed 及其餘連線 / 寫入 / promote / override 旗標全 false）。
- 新增 `use-cases/deployment/build-shadow-runner-safety-gate-checklist-contract.ts`：pure deterministic builder `buildShadowRunnerSafetyGateChecklistContract()`，產生 **31 個 deterministic checklist items**，覆蓋全部 15 個 category（DEPLOYMENT / ROUTE / MONITORING_UI / SUPABASE_SAFETY / RLS / SCHEMA_MAPPING / ADAPTER / SHADOW_COMPARISON / SHADOW_RUNNER / API_CONTRACT / PRODUCTION_EVIDENCE / DATA_SOURCE / PORTFOLIO_SWITCH / TRADING_SAFETY / MANUAL_SIGNOFF）；evidence item 全 PASS 且 blocksConnectionReview / blocksProductionReadiness=true，manual signoff item status NOT_REVIEWED / BLOCKED、manualReviewRequired=true 且以 manualSignoffCompleted / stagingConnectionAllowed 旗標 gating；decision 預設 READY_FOR_REVIEW（但 stagingConnectionAllowed 仍 false，不代表可接真實資料）；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不連 Supabase、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-shadow-runner-safety-gate-checklist.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、≥18 items、15 category 全覆蓋、per-item policy（requiredEvidence / expectedState / actualState 非空、block 旗標為 boolean、manual signoff item manualReviewRequired=true 且 status NOT_REVIEWED/BLOCKED）、全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected files 仍存在。
- 新增 `npm run test:shadow-runner-safety-gate-checklist`。
- Shadow Runner Safety Gate Checklist：checklistName = Shadow Runner Safety Gate Checklist；deploymentTarget = staging；decision = READY_FOR_REVIEW；staging read-only connection review；final checklist；production route smoke passed = true；monitoring UI production evidence passed = true；manualSignoffRequired = true；manualSignoffCompleted = false；stagingConnectionAllowed = false；production readiness remains blocked。
- V54 不連 staging Supabase；不接 production Supabase；不讀 Supabase env key；不寫 staging / production；不新增 SQL migration；不建立 Supabase client；不建立 actual shadow runner runtime；不執行 actual shadow runner；不切換 /api/portfolio；不建立 quote polling / scheduler / webhook / crawler / connector runtime；不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V55 Staging Read-only Connection Review Gate。

架構文件清單新增：Shadow Runner Safety Gate Checklist（[docs/shadow-runner-safety-gate-checklist.md](docs/shadow-runner-safety-gate-checklist.md)）。

### V53

Shadow Runner Dry-run Monitoring UI Production Evidence：

- 新增 `docs/shadow-runner-dry-run-monitoring-ui-production-evidence.md`：記錄 V52 monitoring UI 已上 production 之 evidence——production deployment commit = `740e16ba16cbd85ecb9cacc58d9d0c918e297560`、deployment state = READY、production /holdings status = 200 OK、matched path = /holdings、`/holdings` HTML 已含 Shadow Runner Dry-run Monitoring 與 `/api/portfolio/shadow-runner-dry-run` 與全部 safety labels（fixture-only / mock_or_contract / dry-run evidence only / no Supabase connection / no env key / no DB write / no real market data / no /api/portfolio switch / no auto order / V50 contract flags retained false / production route verified separately by V51.1 smoke evidence）；並說明 V50 contract flags retained false does not mean production route is missing、V51.1 production smoke verified endpoint 200、client component may show loading in server HTML before hydration、hydration data is sourced only from internal endpoint。本輪不是新功能、不新增 UI / API route、不連 Supabase、不讀 env、不寫 DB、不切換 /api/portfolio、不接真實行情、不產生買賣指令、不自動下單。
- 新增 `scripts/validate-shadow-runner-dry-run-monitoring-ui-production-evidence.ts`：repo-local deterministic evidence checker（8 gates：required_files / required_phrases / component_terms / component_forbidden / page_integration / package_checks / readme_checks / safety），**不 fetch external production URL**（`production_endpoint_checked_by_validator=false`），驗證 evidence doc 記載上述 production 事實、V52 component 仍含 "use client" / useEffect / useState / `fetch("/api/portfolio/shadow-runner-dry-run")` / 必要欄位 / `V50 contract flags retained false`、component 無 forbidden token 與外部 URL fetch、holdings page 仍掛載 ShadowRunnerDryRunMonitoring、V51 route 仍存在、protected files 未被破壞。
- 新增 `npm run test:shadow-runner-dry-run-monitoring-ui-production-evidence`。
- V53 不連 staging Supabase、不接 production Supabase、不讀 Supabase env key、不寫 staging / production、不新增 SQL migration、不建立 Supabase client、不建立 actual shadow runner runtime、不執行 actual shadow runner、不切換 /api/portfolio、不建立 quote polling / scheduler / webhook / crawler / connector runtime、不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V54 Staging Read-only Connection Review Gate 或 V54 Shadow Runner Safety Gate Checklist。

架構文件清單新增：Shadow Runner Dry-run Monitoring UI Production Evidence（[docs/shadow-runner-dry-run-monitoring-ui-production-evidence.md](docs/shadow-runner-dry-run-monitoring-ui-production-evidence.md)）。

### V52

Shadow Runner Dry-run Monitoring UI：

- 新增 `components/shadow-runner-dry-run-monitoring.tsx`：client component（`"use client"` / useEffect / useState），只 `fetch("/api/portfolio/shadow-runner-dry-run")`（internal fixture-only endpoint），type-only import `ShadowRunnerDryRunApiResponsePayload`，視覺化 V50/V51 responsePayload（API summary、evidenceReport、safetyFlags、warnings、nextRequiredActions），含 loading / error / success 三態；error 時顯示「monitoring unavailable / 資料不足」且不 fallback 真實行情、不呼叫外部資料源、不切換資料源。不 import route file、不 import builder、不 import Supabase client、不 import Yahoo provider、不 fetch 外部 URL、不讀 env、不連 Supabase、不寫 DB、不建立 scheduler/webhook/crawler/connector runtime、不切換 /api/portfolio、不產生買賣指令、不自動下單。明確標示 fixture-only / mock_or_contract / no Supabase connection / no env key / no DB write / no real market data / no /api/portfolio switch / no auto order / dry-run evidence only / **V50 contract flags retained false** / production route verified separately by V51.1 smoke evidence。
- 新增 `docs/shadow-runner-dry-run-monitoring-ui.md`：定義 **Shadow Runner Dry-run Monitoring UI**（A–G 章），含 component、displayed fields、UI states、required labels、safety boundary 與 future gate（V53 Shadow Runner Dry-run Monitoring UI Production Evidence / V53 Staging Read-only Connection Review Gate）。
- 新增 `scripts/validate-shadow-runner-dry-run-monitoring-ui.ts`：UI checker（8 gates：required_files / required_phrases / component_terms / component_forbidden / page_integration / package_checks / readme_checks / safety），驗證 component 含 "use client" / useEffect / useState / `fetch("/api/portfolio/shadow-runner-dry-run")` / 必要顯示欄位 / V50 contract flags retained false，**大小寫不敏感**掃描 component 禁止 token（@supabase / createClient / process.env / axios / new Date( / Date.now / insert( / upsert( / update( / delete( / yahoo / twse / goodinfo / investing / pchome / scheduler / webhook / crawler）與外部 URL fetch（fetch("https:// 等），確認 component 不 import route / builder、且 holdings page 已 import 並 render ShadowRunnerDryRunMonitoring。
- 修改 `app/holdings/page.tsx`：import 並於 First Authorized Source Dry-Run Monitoring 下方 render `<ShadowRunnerDryRunMonitoring />`。
- 新增 `npm run test:shadow-runner-dry-run-monitoring-ui`。
- Shadow Runner Dry-run Monitoring UI fetches only internal endpoint /api/portfolio/shadow-runner-dry-run；route responseSource must remain mock_or_contract；sourceMode must remain fixture；fixture-only；mock_or_contract；no Supabase connection；no env key；no DB write；no real market data；no /api/portfolio switch；no auto order；dry-run evidence only；dry-run evidence must not be persisted to DB；dry-run mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default；**V50 contract flags remain false even though V51 route exists**；V51.1 production smoke verified endpoint 200。
- V52 不連 staging Supabase；V52 不接 production Supabase；V52 不讀 Supabase env key；V52 不寫 staging；V52 不寫 production；V52 不新增 SQL migration；V52 不建立 Supabase client；V52 不建立 actual shadow runner runtime；V52 不執行 actual shadow runner；V52 不切換 /api/portfolio；V52 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V52 不接真實行情。
- 新增 1 個 client UI component（掛到持股戰情頁）；未新增 API route；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V53 Shadow Runner Dry-run Monitoring UI Production Evidence 或 V53 Staging Read-only Connection Review Gate。

架構文件清單新增：Shadow Runner Dry-run Monitoring UI（[docs/shadow-runner-dry-run-monitoring-ui.md](docs/shadow-runner-dry-run-monitoring-ui.md)）。

### V51.1

Production Route Deployment Smoke Evidence：

- 背景：V51 commit `3cb112d` 已 push，但 production endpoint `GET https://allen-stock-dashboard.vercel.app/api/portfolio/shadow-runner-dry-run` 目前回 **404**，且 Vercel production deployment 最新仍顯示 V50 commit `e8237be`。本輪以 evidence / docs / validator 釐清「是程式碼問題還是部署管線問題」，**do not proceed to V52**。
- 新增 `docs/shadow-runner-dry-run-production-smoke-evidence.md`：記錄 observed symptom、local code evidence（code is deployment-ready）、likely causes、required manual actions（含 redeploy main）、safety boundary 與 gate。明確聲明本 repo validator 無法連線 production，`productionEndpointCheckedByValidator` = false，production HTTP 檢查為 MANUAL 步驟。
- 新增 `scripts/validate-shadow-runner-dry-run-production-smoke-evidence.ts`：code-level 部署就緒 evidence checker（6 gates：required_files / required_phrases / route_wiring / payload_checks / package_checks / readme_checks），import V50 builder 驗證 route 回傳之 responsePayload 為安全 HTTP-200 body（responseSource=mock_or_contract、sourceMode=fixture、plannedEndpoint、method=GET、全 safetyFlags safe、killSwitchDefaultEnabled=true），並確認 V51 route 檔已 wired 到 V50 builder；輸出 `production_endpoint_checked_by_validator=false`、`redeploy_required=true`、`expected_production_http_status=200`。
- 新增 `npm run test:shadow-runner-dry-run-production-smoke-evidence`。
- 本機證據：`npm run build` route table 出現 `ƒ /api/portfolio/shadow-runner-dry-run`；V51 route checker PASS；V50 builder responsePayload 全欄位符合預期 production 200 body。結論：**code is deployment-ready，404 為 Vercel 部署管線問題**（未觸發 / queued / skipped / alias 釘在舊 commit），需於 Vercel dashboard 確認並 **redeploy main**。
- 本輪未新增 UI、未連 Supabase、未讀 env、未寫 DB、未切換 /api/portfolio、未接真實行情、未產生買賣指令、未自動下單；未修改任何功能程式碼（route / builder / contract 未動）。

架構文件清單新增：Production Route Deployment Smoke Evidence（[docs/shadow-runner-dry-run-production-smoke-evidence.md](docs/shadow-runner-dry-run-production-smoke-evidence.md)）。

### V51

Shadow Runner Dry-run API Route：

- 新增 `app/api/portfolio/shadow-runner-dry-run/route.ts`：本系列**第一個實際 route 檔**，但仍 fixture-only / mock_or_contract。`GET /api/portfolio/shadow-runner-dry-run`，GET only、HTTP status 200、`export const dynamic = "force-dynamic"`、`Cache-Control: no-store`，`import buildShadowRunnerDryRunApiContract`（V50 builder），回傳 `contract.responsePayload`，使用固定 generatedAt `"2026-06-23T00:00:00.000Z"`；不 import @supabase、不 createClient、不 process.env、不 fetch、不 axios、不 Date.now、不 new Date、不寫 DB、不呼叫 Yahoo provider、不接外部行情、不改 /api/portfolio、不建 scheduler/webhook/crawler、不建 UI、route 檔本身不出現 buy/sell/order 字樣。
- 新增 `docs/shadow-runner-dry-run-api-route.md`：定義 **Shadow Runner Dry-run API Route**（A–G 章），說明 route、scope boundary、response、V50 contract flags vs V51 route file、safety language 與 future gate（V52 Shadow Runner Dry-run Monitoring UI / V52 Shadow Runner Dry-run API Evidence Review）。明確聲明 responseSource must remain mock_or_contract、sourceMode must remain fixture、PORTFOLIO_SOURCE_MODE must remain hardcoded、dry-run evidence must not be persisted to DB、dry-run mismatch must not promote staging、empty / stale / error result must not override hardcoded、kill switch must be enabled by default、**V50 contract flags remain false even though V51 route file exists**。
- 新增 `scripts/validate-shadow-runner-dry-run-api-route.ts`：route checker（8 gates：required_files / required_phrases / route_terms / route_forbidden / payload_checks / package_checks / readme_checks / safety），驗證 route 檔含 NextResponse / buildShadowRunnerDryRunApiContract / `export async function GET` / responsePayload / 固定 generatedAt / endpoint，**大小寫不敏感**掃描 route 檔禁止 token（@supabase / createClient / process.env / fetch( / axios / Date.now / new Date( / insert( / upsert( / update( / delete( / yahoo / buy / sell / order），import V50 builder 驗證 responsePayload 安全旗標（responseSource=mock_or_contract、sourceMode=fixture、plannedEndpoint、method=GET、promotionAllowed / portfolioApiSwitchAllowed / persisted / 各 SupabaseConnected / envReadPerformed / databaseWritePerformed / shadowRunnerExecuted / shadowResultPersisted / realMarketDataEnabled / buySellCommandGenerated / autoOrderRequested 全 false、killSwitchDefaultEnabled=true），並確認 V50 contract flags（routeCreated / apiRouteCreated / routeImplemented）remain false、未新增 monitoring UI / SQL migration、protected routes 仍存在。
- 修改 `scripts/validate-shadow-runner-dry-run-api-contract.ts`：將 `app/api/portfolio/shadow-runner-dry-run/route.ts` 從 V50 checker 的 forbiddenArtifacts 解除（after V51, route existence is validated by V51 route checker, while V50 contract flags remain false）；未放寬任何 no Supabase / no env / no DB write / no promotion / no /api/portfolio switch 安全旗標。
- 新增 `npm run test:shadow-runner-dry-run-api-route`。
- Shadow Runner Dry-run API Route 提供 GET /api/portfolio/shadow-runner-dry-run；fixture-only；mock_or_contract；responseSource must remain mock_or_contract；sourceMode must remain fixture；PORTFOLIO_SOURCE_MODE must remain hardcoded；no Supabase connection；no env key；no write / no staging write / no production write；no SQL migration；no api switch；no buy/sell command；no auto order；dry-run evidence must not be persisted to DB；dry-run mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default；V50 contract flags remain false。
- V51 不連 staging Supabase；V51 不接 production Supabase；V51 不讀 Supabase env key；V51 不寫 staging；V51 不寫 production；V51 不新增 SQL migration；V51 不建立 Supabase client；V51 不建立 actual shadow runner runtime；V51 不執行 actual shadow runner；V51 不切換 /api/portfolio；V51 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V51 不接真實行情。
- 新增 1 個 fixture-only API route（GET /api/portfolio/shadow-runner-dry-run）；未新增 UI；未新增 SQL migration；未修改現有 production routes；未連 Supabase；未讀 env；未建立 actual shadow runner runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V52 Shadow Runner Dry-run Monitoring UI 或 V52 Shadow Runner Dry-run API Evidence Review。

架構文件清單新增：Shadow Runner Dry-run API Route（[docs/shadow-runner-dry-run-api-route.md](docs/shadow-runner-dry-run-api-route.md)）。

### V50

Shadow Runner Dry-run API Contract：

- 新增 `docs/shadow-runner-dry-run-api-contract.md`：定義 **Shadow Runner Dry-run API Contract**（A–I 章），即未來 fixture-only shadow runner dry-run API 的 response contract、planned endpoint shape、safe response flags、evidence payload shape 與 error / fallback 行為，含 scope boundary、planned endpoint、response payload shape、policy expectations、source of truth & override guards、safety language、decision 與 future gate（V51 Shadow Runner Dry-run API Route）。明確聲明 V50 是 shadow runner dry-run API contract、不是 API route implementation、不是 staging Supabase 實作、不是 production 真實資料上線、不是實際 connection review；planned endpoint is /api/portfolio/shadow-runner-dry-run；responseSource must remain mock_or_contract；sourceMode must remain fixture；PORTFOLIO_SOURCE_MODE must remain hardcoded；fixture/hardcoded must not be overridden by staging；dry-run evidence must not be persisted to DB；dry-run mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default；fixture/mock UI 仍維持現狀；V44 / V45 / V46 / V47 / V48 / V49 仍是前置安全門。
- 新增 `use-cases/deployment/shadow-runner-dry-run-api-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 axios / 無 @supabase / 無 createClient / 無 process.env / 無 Date.now / 無 new Date / 無 insert/upsert/update/delete / 不寫資料 / type-only import V49 evidence report shape），定義 apiDecision（含 READY_FOR_REVIEW / NO_GO，刻意**不含 PRODUCTION_READY**）/ responseSource(mock_or_contract) / sourceMode(fixture) / method(GET) / dryRunBundleShape / safetyFlags / responsePayload / policyRule / manualCheck / bundle，與 `SHADOW_RUNNER_DRY_RUN_API_CONTRACT_VERSION` / `_PLANNED_ENDPOINT` / `_METHOD` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（killSwitchDefaultEnabled=true，routeCreated / apiRouteCreated / routeImplemented / requestPerformed / envReadPerformed / supabaseConnected / stagingSupabaseConnected / productionSupabaseConnected / stagingReadPerformed / stagingWritePerformed / productionWritePerformed / databaseWritePerformed / runtimeCreated / shadowRunnerRuntimeCreated / shadowRunnerExecuted / shadowComparisonPerformed / shadowResultPersisted / portfolioApiSwitched / portfolioSourceModeChanged / realMarketDataEnabled / buySellCommandGenerated / autoOrderRequested / promotionAllowed / portfolioApiSwitchAllowed / persisted / fixtureCanBeOverriddenByStaging / hardcodedCanBeOverriddenByStaging / mismatchCanPromoteStaging / dryRunCanPromoteStaging / emptyResultCanOverrideHardcoded / staleResultCanOverrideHardcoded / errorResultCanOverrideHardcoded 全 false）。
- 新增 `use-cases/deployment/build-shadow-runner-dry-run-api-contract.ts`：pure deterministic builder `buildShadowRunnerDryRunApiContract()`，`import buildShadowRunnerDryRunSpecContract`（V49 pure builder），把 dryRunBundle 與 evidenceReport 包成 fixture-only / mock_or_contract API response contract（plannedEndpoint=/api/portfolio/shadow-runner-dry-run、method=GET、ok=true、responseSource=mock_or_contract、sourceMode=fixture），dryRunBundle 沿用 V49 語義（contractVersion=V49 / runnerMode=dry_run_spec / fixtureToFixtureSelfCheckDefined=true / shadowRunnerExecuted=false…），evidenceReport 直接取自 V49 builder，safetyFlags 全 safe、含 warnings 與 nextRequiredActions；decision 預設 READY_FOR_REVIEW；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不建立 Supabase client、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-shadow-runner-dry-run-api-contract.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、response payload shape 完整（ok / apiContractVersion / responseSource / sourceMode / plannedEndpoint / method / dryRunBundle / evidenceReport / safetyFlags / warnings / nextRequiredActions）、dryRunBundle 沿用 V49 語義、evidenceReport 期望、頂層與 safetyFlags 全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route（含 `app/api/portfolio/shadow-runner-dry-run/route.ts`）/ component / SQL migration、protected production routes 仍存在。
- 新增 `npm run test:shadow-runner-dry-run-api-contract`。
- Shadow Runner Dry-run API Contract 定義未來 fixture-only API response 合約；apiContractVersion = V50；plannedEndpoint = /api/portfolio/shadow-runner-dry-run；method = GET；responseSource must remain mock_or_contract；sourceMode must remain fixture；not API route implementation；not production trading system；no real market data；no Supabase connection；no env key；no write / no staging write / no production write；no SQL migration；no api switch；no buy/sell command；no auto order；PORTFOLIO_SOURCE_MODE must remain hardcoded；fixture/hardcoded must not be overridden by staging；dry-run evidence must not be persisted to DB；dry-run mismatch must not promote staging；empty / stale / error result must not override hardcoded；kill switch must be enabled by default；fixture/mock UI 仍維持現狀。
- V50 不新增 API route；V50 不連 staging Supabase；V50 不接 production Supabase；V50 不讀 Supabase env key；V50 不寫 staging；V50 不寫 production；V50 不新增 SQL migration；V50 不建立實際 Supabase client；V50 不建立實際 adapter runtime；V50 不建立實際 shadow runner runtime；V50 不執行 shadow runner；V50 不切換 /api/portfolio；V50 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V50 不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未建立 runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V51 Shadow Runner Dry-run API Route（仍 fixture-only / mock_or_contract / no Supabase / no env / no DB write）。

架構文件清單新增：Shadow Runner Dry-run API Contract（[docs/shadow-runner-dry-run-api-contract.md](docs/shadow-runner-dry-run-api-contract.md)）。

### V49

Shadow Runner Dry-run Spec：

- 新增 `docs/shadow-runner-dry-run-spec.md`：定義 **Shadow Runner Dry-run Spec**（A–I 章），即未來 shadow runner 在 dry-run 模式下的執行語意、evidence report shape、fixture-to-fixture self-check、pass/mismatch/data-insufficient 計數、kill switch 中止點與 fallback / downgrade 規則，含 scope boundary、runner step shape、evidence report shape、policy expectations、source of truth & override guards、safety language、decision 與 future gate（V50 Staging Read-only Connection Review / V50 Shadow Runner Dry-run API Contract）。明確聲明 V49 是 shadow runner dry-run spec、不是 staging Supabase 實作、不是 production 真實資料上線、不是實際 connection review、不是實際 shadow runner runtime、不是實際讀取 staging；fixture-to-fixture self-check is shape-only；dry-run must not connect to staging；dry-run evidence must not be persisted to DB；dry-run mismatch must not promote staging；empty / stale / error result must not override fixture/hardcoded；kill switch must be able to block shadow runner；fixture/mock UI 仍維持現狀；V44 / V45 / V46 / V47 / V48 仍是前置安全門。
- 新增 `use-cases/deployment/shadow-runner-dry-run-spec-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 axios / 無 @supabase / 無 createClient / 無 process.env / 無 Date.now / 無 new Date / 無 insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 READY_FOR_REVIEW / NO_GO，刻意**不含 PRODUCTION_READY**）/ executionMode / inputSource / outputArtifact / failureBehavior / killSwitchBehavior / verificationStatus / sourceMode / runnerMode / stepSpec（requiresSupabase / requiresEnv / performsExternalRequest / performsDbWrite / canPromoteStaging / canSwitchPortfolioApi 型別固定 false）/ evidenceReportShape（promotionAllowed / portfolioApiSwitchAllowed / persisted 型別固定 false）/ policyRule / manualCheck / bundle，與 `SHADOW_RUNNER_DRY_RUN_SPEC_CONTRACT_VERSION` / `_STEP_NAMES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（shadowRunnerDryRunSpecDefined / fixtureToFixtureSelfCheckDefined / stagingSupabasePlanned / killSwitchDefaultEnabled = true，其餘 shadowRunnerRuntimeCreated / shadowRunnerExecuted / fixtureToStagingComparisonPerformed / stagingSupabaseConnected / stagingReadPerformed / stagingWritePerformed / shadowComparisonPerformed / shadowResultPersisted / productionSupabaseConnected / productionWritePerformed / databaseWritePerformed / requestPerformed / envReadPerformed / apiRouteCreated / uiCreated / runtimeCreated / sqlMigrationCreated / portfolioApiSwitched / portfolioSourceModeChanged / realMarketDataEnabled / buySellCommandGenerated / autoOrderRequested / fixtureCanBeOverriddenByStaging / hardcodedCanBeOverriddenByStaging / mismatchCanPromoteStaging / dryRunCanPromoteStaging / emptyResultCanOverrideHardcoded / staleResultCanOverrideHardcoded / errorResultCanOverrideHardcoded 全 false）。
- 新增 `use-cases/deployment/build-shadow-runner-dry-run-spec-contract.ts`：pure deterministic builder `buildShadowRunnerDryRunSpecContract()`，產生 **6 個 deterministic runner step specs**（loadFixtureBaseline → runFixtureToFixtureSelfCheck → calculateShadowComparisonEvidence → classifyMismatchAndDataInsufficient → evaluateKillSwitchAndPromotionGuard → buildShadowDryRunReport），全部 executionMode=FIXTURE_TO_FIXTURE_DRY_RUN_ONLY、requiresSupabase / requiresEnv / performsExternalRequest / performsDbWrite / canPromoteStaging / canSwitchPortfolioApi 全 false、killSwitchBehavior=BLOCK_SHADOW_RUNNER、verificationStatus=NOT_REVIEWED；含完整 evidence report shape（sourceMode=fixture、runnerMode=dry_run_spec、各 count 欄位、promotionAllowed / portfolioApiSwitchAllowed / persisted 全 false）；另含 20 條 policyRules 與 5 條 manualChecks；任何 step 需要 Supabase/env/external/DB-write 或可 promote/switch、或 evidence 允許 promotion/api switch/persist → decision=NO_GO，否則 READY_FOR_REVIEW；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不建立 Supabase client、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-shadow-runner-dry-run-spec.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、≥6 runner step specs、6 個指定 step、per-step policy（requiresSupabase / requiresEnv / performsExternalRequest / performsDbWrite / canPromoteStaging / canSwitchPortfolioApi 全 false、executionMode 在允許集合、verificationStatus 全 NOT_REVIEWED）、evidence report shape（promotionAllowed / portfolioApiSwitchAllowed / persisted 全 false、sourceMode / runnerMode 合法、count 欄位皆為數字）、全部安全旗標（含 dryRunCanPromoteStaging / fixtureToFixtureSelfCheckDefined）、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected production routes 仍存在。
- 新增 `npm run test:shadow-runner-dry-run-spec`。
- Shadow Runner Dry-run Spec 定義未來 shadow runner dry-run 執行語意；specName = Shadow Runner Dry-run Spec；deploymentTarget = staging；decision = READY_FOR_REVIEW；shadow runner dry-run；fixture-to-fixture self-check；not production trading system；no real market data；no Supabase connection；no env key；no write / no staging write / no production write；no SQL migration；no api switch；no buy/sell command；no auto order；PORTFOLIO_SOURCE_MODE must remain hardcoded；fixture-to-fixture self-check is shape-only；dry-run must not connect to staging；dry-run evidence must not be persisted to DB；dry-run mismatch must not promote staging；empty / stale / error result must not override fixture/hardcoded；kill switch must be able to block shadow runner；fixture/mock UI 仍維持現狀。
- V49 不連 staging Supabase；V49 不接 production Supabase；V49 不讀 Supabase env key；V49 不寫 staging；V49 不寫 production；V49 不新增 SQL migration；V49 不建立實際 Supabase client；V49 不建立實際 adapter runtime；V49 不建立實際 shadow runner runtime；V49 不執行 shadow runner；V49 不切換 /api/portfolio；V49 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V49 不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未建立 runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V50 Staging Read-only Connection Review 或 V50 Shadow Runner Dry-run API Contract。

架構文件清單新增：Shadow Runner Dry-run Spec（[docs/shadow-runner-dry-run-spec.md](docs/shadow-runner-dry-run-spec.md)）。

### V48

Fixture vs Staging Shadow Comparison Spec：

- 新增 `docs/fixture-vs-staging-shadow-comparison-spec.md`：定義 **Fixture vs Staging Shadow Comparison Spec**（A–H 章），即未來把現有 fixture/hardcoded 與 planned staging read-only adapter 做欄位級 shadow 比對的規格（比對欄位、numericTolerance / timestampTolerance、資料新鮮度、mismatch / empty / stale / error / promotion / persistence / kill switch 行為），含 scope boundary、comparison spec shape、policy expectations、source of truth & override guards、safety language、decision 與 future gate（V49 Staging Read-only Connection Review / V49 Shadow Runner Dry-run Spec）。明確聲明 V48 是 fixture vs staging shadow comparison spec、不是 staging Supabase 實作、不是 production 真實資料上線、不是實際 connection review、不是實際 shadow runner；fixture/hardcoded 為 source of truth、staging 不得覆蓋；mismatch 不得自動 promote；shadow evidence 不得寫 DB；kill switch 可阻斷；fixture/mock UI 仍維持現狀；V44 / V45 / V46 / V47 仍是前置安全門。
- 新增 `use-cases/deployment/fixture-vs-staging-shadow-comparison-spec-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 axios / 無 @supabase / 無 createClient / 無 process.env / 無 Date.now / 無 new Date / 無 insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 READY_FOR_REVIEW / NO_GO，刻意**不含 PRODUCTION_READY**）/ tableName / fixtureSource / stagingSource（planned_staging_readonly_adapter）/ mismatchBehavior / emptyFixtureBehavior / emptyStagingBehavior / staleStagingBehavior / errorStagingBehavior / promotionBehavior / persistenceBehavior / killSwitchBehavior / sourceModeRequirement / appRouteImpact / verificationStatus / comparisonSpec / policyRule / manualCheck / bundle，與 `FIXTURE_VS_STAGING_SHADOW_COMPARISON_SPEC_CONTRACT_VERSION` / `_TABLES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（stagingSupabasePlanned=true、shadowComparisonSpecDefined=true、killSwitchDefaultEnabled=true，其餘 stagingSupabaseConnected / stagingReadPerformed / stagingWritePerformed / shadowComparisonPerformed / shadowResultPersisted / productionSupabaseConnected / productionWritePerformed / databaseWritePerformed / requestPerformed / envReadPerformed / apiRouteCreated / uiCreated / runtimeCreated / sqlMigrationCreated / portfolioApiSwitched / portfolioSourceModeChanged / realMarketDataEnabled / buySellCommandGenerated / autoOrderRequested / fixtureCanBeOverriddenByStaging / hardcodedCanBeOverriddenByStaging / mismatchCanPromoteStaging / emptyResultCanOverrideHardcoded / staleResultCanOverrideHardcoded / errorResultCanOverrideHardcoded 全 false）。
- 新增 `use-cases/deployment/build-fixture-vs-staging-shadow-comparison-spec-contract.ts`：pure deterministic builder `buildFixtureVsStagingShadowComparisonSpecContract()`，產生 **5 個 deterministic comparison specs**（comparePortfolioStocksFixtureVsStaging / compareWatchlistStocksFixtureVsStaging / compareMarketSnapshotsFixtureVsStaging / compareStockSnapshotsFixtureVsStaging / compareV85ScoresFixtureVsStaging），覆蓋 5 張 staging table，全部 fixtureSource=fixture / stagingSource=planned_staging_readonly_adapter、comparedFields 非空、numericTolerance / timestampTolerance 明確、mismatchBehavior=FLAG_FOR_MANUAL_REVIEW、emptyStagingBehavior=DO_NOT_OVERRIDE_FIXTURE、staleStagingBehavior=DO_NOT_OVERRIDE_FIXTURE、errorStagingBehavior=FALLBACK_TO_FIXTURE、promotionBehavior=NEVER_PROMOTE_AUTOMATICALLY、persistenceBehavior=NO_PERSISTENCE、killSwitchBehavior=BLOCK_SHADOW_COMPARISON、sourceModeRequirement=PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED、appRouteImpact=INTERNAL_SPEC_ONLY、verificationStatus=NOT_REVIEWED；另含 18 條 policyRules 與 5 條 manualChecks；任何行為可讓 staging 覆蓋 fixture/hardcoded、自動 promote 或寫 DB → decision=NO_GO，否則 READY_FOR_REVIEW；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不建立 Supabase client、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-fixture-vs-staging-shadow-comparison-spec.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、≥5 comparison specs、5 tables 覆蓋、per-spec policy（comparedFields / numericTolerance / timestampTolerance 非空、fixtureSource 為 fixture/hardcoded/mock_or_contract、stagingSource=planned_staging_readonly_adapter、mismatch/empty/stale/error/promotion/persistence/killSwitch/sourceMode/appRouteImpact 皆在允許集合、verificationStatus 全 NOT_REVIEWED）、全部安全旗標（含 fixture/hardcodedCanBeOverriddenByStaging / mismatchCanPromoteStaging / shadowResultPersisted）、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected production routes 仍存在。
- 新增 `npm run test:fixture-vs-staging-shadow-comparison-spec`。
- Fixture vs Staging Shadow Comparison Spec 定義未來 shadow comparison 規格；specName = Fixture vs Staging Shadow Comparison Spec；deploymentTarget = staging；decision = READY_FOR_REVIEW；shadow comparison；read-only；not production trading system；no real market data；no Supabase connection；no env key；no write / no staging write / no production write；no SQL migration；no api switch；no buy/sell command；no auto order；PORTFOLIO_SOURCE_MODE must remain hardcoded；fixture/hardcoded must not be overridden by staging；empty / stale / error staging result must not override fixture/hardcoded；mismatch must not promote staging automatically；shadow evidence must not be persisted to DB；kill switch must be able to block shadow comparison；production Supabase 不得出現在 comparison target；fixture/mock UI 仍維持現狀。
- V48 不連 staging Supabase；V48 不接 production Supabase；V48 不讀 Supabase env key；V48 不寫 staging；V48 不寫 production；V48 不新增 SQL migration；V48 不建立實際 Supabase client；V48 不建立實際 adapter runtime；V48 不建立實際 shadow runner；V48 不切換 /api/portfolio；V48 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V48 不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未建立 runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V49 Staging Read-only Connection Review 或 V49 Shadow Runner Dry-run Spec。

架構文件清單新增：Fixture vs Staging Shadow Comparison Spec（[docs/fixture-vs-staging-shadow-comparison-spec.md](docs/fixture-vs-staging-shadow-comparison-spec.md)）。

### V47

Staging Read-only Adapter Spec：

- 新增 `docs/staging-readonly-adapter-spec.md`：定義 **Staging Read-only Adapter Spec**（A–H 章），即未來 staging read-only adapter 的介面規格、回傳型別、source-neutral mapping，以及 fallback / downgrade / kill switch 規則，含 scope boundary、adapter method shape、policy expectations、source mode & override guards、safety language、decision 與 future gate（V48 Staging Read-only Connection Review / V48 Fixture vs Staging Shadow Comparison Spec）。明確聲明 V47 是 staging read-only adapter spec、不是 staging Supabase 實作、不是 production 真實資料上線、不是建立實際 Supabase client、不是實際 connection review；PORTFOLIO_SOURCE_MODE must remain hardcoded；empty / stale / error result must not override hardcoded；kill switch must be able to block staging adapter；fixture/mock UI 仍維持現狀；V44 / V45 / V46 仍是前置安全門。
- 新增 `use-cases/deployment/staging-readonly-adapter-spec-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 axios / 無 @supabase / 無 createClient / 無 process.env / 無 Date.now / 無 new Date / 無 insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 READY_FOR_REVIEW / NO_GO，刻意**不含 PRODUCTION_READY**）/ tableName / allowedOperation（select_only）/ fallbackBehavior / emptyResultBehavior / staleResultBehavior / errorResultBehavior / killSwitchBehavior / sourceModeRequirement / appRouteImpact / verificationStatus / methodSpec（readOnly 型別固定 true、allowedOperation 固定 select_only）/ policyRule / manualCheck / bundle，與 `STAGING_READONLY_ADAPTER_SPEC_CONTRACT_VERSION` / `_TABLES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（stagingSupabasePlanned=true、stagingAdapterSpecDefined=true、killSwitchDefaultEnabled=true，其餘 stagingSupabaseConnected / stagingReadPerformed / stagingWritePerformed / productionSupabaseConnected / productionWritePerformed / databaseWritePerformed / requestPerformed / envReadPerformed / apiRouteCreated / uiCreated / runtimeCreated / sqlMigrationCreated / portfolioApiSwitched / portfolioSourceModeChanged / realMarketDataEnabled / buySellCommandGenerated / autoOrderRequested / emptyResultCanOverrideHardcoded / staleResultCanOverrideHardcoded / errorResultCanOverrideHardcoded 全 false）。
- 新增 `use-cases/deployment/build-staging-readonly-adapter-spec-contract.ts`：pure deterministic builder `buildStagingReadonlyAdapterSpecContract()`，產生 **5 個 deterministic adapter method specs**（getPortfolioStocksReadOnly / getWatchlistStocksReadOnly / getMarketSnapshotsReadOnly / getStockSnapshotsReadOnly / getV85ScoresReadOnly），覆蓋 5 張 staging table，全部 readOnly=true / allowedOperation=select_only、mappedContractFields 非空、emptyResultBehavior=DO_NOT_OVERRIDE_HARDCODED、staleResultBehavior=DO_NOT_OVERRIDE_HARDCODED、errorResultBehavior=FALLBACK_TO_HARDCODED、killSwitchBehavior=BLOCK_STAGING_ADAPTER、sourceModeRequirement=PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED、appRouteImpact=INTERNAL_SPEC_ONLY、verificationStatus=NOT_REVIEWED；另含 15 條 policyRules 與 5 條 manualChecks；任何 method 非 read-only/select_only 或任何 empty/stale/error 行為可覆蓋 hardcoded → decision=NO_GO，否則 READY_FOR_REVIEW；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不建立 Supabase client、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-staging-readonly-adapter-spec.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、≥5 method specs、5 tables 覆蓋、per-method policy（readOnly 全 true、allowedOperation 全 select_only、mappedContractFields 非空、fallback/empty/stale/error/killSwitch/sourceMode/appRouteImpact 皆在允許集合、verificationStatus 全 NOT_REVIEWED）、全部安全旗標（含 portfolioSourceModeChanged / killSwitchDefaultEnabled / empty・stale・errorResultCanOverrideHardcoded）、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected production routes 仍存在。
- 新增 `npm run test:staging-readonly-adapter-spec`。
- Staging Read-only Adapter Spec 定義未來 staging read-only adapter 介面；specName = Staging Read-only Adapter Spec；deploymentTarget = staging；decision = READY_FOR_REVIEW；staging read-only adapter；read-only；not production trading system；no real market data；no Supabase connection；no env key；no write / no staging write / no production write；no SQL migration；no api switch；no buy/sell command；no auto order；PORTFOLIO_SOURCE_MODE must remain hardcoded；empty / stale / error result must not override hardcoded；kill switch must be able to block staging adapter；production Supabase 不得出現在 adapter target；fixture/mock UI 仍維持現狀。
- V47 不連 staging Supabase；V47 不接 production Supabase；V47 不讀 Supabase env key；V47 不寫 staging；V47 不寫 production；V47 不新增 SQL migration；V47 不建立實際 Supabase client；V47 不建立實際 adapter runtime；V47 不切換 /api/portfolio；V47 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V47 不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未建立 runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V48 Staging Read-only Connection Review 或 V48 Fixture vs Staging Shadow Comparison Spec。

架構文件清單新增：Staging Read-only Adapter Spec（[docs/staging-readonly-adapter-spec.md](docs/staging-readonly-adapter-spec.md)）。

### V46

Staging Supabase Schema Mapping Spec：

- 新增 `docs/staging-supabase-schema-mapping-spec.md`：定義 **Staging Supabase Schema Mapping Spec**（A–H 章），即 app 期望從未來 staging Supabase 讀到的 schema 對映（table × column → 型別 / nullable / app 用途 / fixture+contract 對映 / 新鮮度 / source-of-truth / PII），含 scope boundary、schema mapping item shape、covered tables、policy expectations、safety language、decision 與 future gate（V47 Staging Supabase Read-only Connection Review / V47 Staging Read-only Adapter Spec）。明確聲明 V46 是 staging Supabase schema mapping spec、不是 staging Supabase 實作、不是 production 真實資料上線、不是建立實際 SQL migration、不是實際 schema introspection；schema mapping 只能作為 read-only planning；fixture/mock UI 仍維持現狀；V45 Staging Supabase RLS Manual Matrix 仍是前置安全門。
- 新增 `use-cases/deployment/staging-supabase-schema-mapping-spec-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 axios / 無 @supabase / 無 createClient / 無 process.env / 無 Date.now / 無 new Date / 無 insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 READY_FOR_REVIEW / NO_GO，刻意**不含 PRODUCTION_READY**）/ tableName / expectedType（uuid / text / integer / numeric / boolean / timestamptz / date / jsonb / enum / unknown）/ appUsage / freshnessRequirement / sourceOfTruth / piiRisk / verificationStatus / schemaMappingItem（appWriteAllowed 型別固定 false）/ policyRule / manualCheck / bundle，與 `STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_CONTRACT_VERSION` / `_TABLES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（stagingSupabasePlanned=true、stagingSchemaMappingDefined=true，其餘 stagingSupabaseConnected / stagingSchemaManuallyVerified / stagingReadPerformed / stagingWritePerformed / productionSupabaseConnected / productionWritePerformed / databaseWritePerformed / requestPerformed / envReadPerformed / apiRouteCreated / uiCreated / runtimeCreated / sqlMigrationCreated / portfolioApiSwitched / realMarketDataEnabled / buySellCommandGenerated / autoOrderRequested 全 false）。
- 新增 `use-cases/deployment/build-staging-supabase-schema-mapping-spec-contract.ts`：pure deterministic builder `buildStagingSupabaseSchemaMappingSpecContract()`，產生 5 張表（portfolio_stocks / watchlist_stocks / market_snapshots / stock_snapshots / v85_scores）共 **47 個 deterministic schema mapping items**，每張表含 id / created_at / updated_at 與 ≥3 個 app domain 欄位；所有 appWriteAllowed=false、verificationStatus=NOT_REVIEWED；價格 / 分數 / 成交量 / 時間戳欄位皆有 freshnessRequirement、domain 欄位皆有 mappedContractFields；另含 12 條 policyRules 與 5 條 manualChecks；任何 appWriteAllowed=true → decision=NO_GO，否則 READY_FOR_REVIEW；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不建立 Supabase client、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-staging-supabase-schema-mapping-spec.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、≥30 items、5 tables 覆蓋、每表 id/created_at/updated_at + ≥3 domain 欄位、per-item policy（appWriteAllowed 全 false、verificationStatus 全 NOT_REVIEWED、unknown type 必 blocksRelease/manual review、high PII 必 blocksRelease、domain 欄位有 mappedContractFields、price/score/volume/timestamp 有 freshnessRequirement、不得指向 production）、全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected production routes 仍存在。
- 新增 `npm run test:staging-supabase-schema-mapping-spec`。
- Staging Supabase Schema Mapping Spec 定義 app 期望的 staging Supabase schema 對映；specName = Staging Supabase Schema Mapping Spec；deploymentTarget = staging；decision = READY_FOR_REVIEW；staging Supabase 僅 planned、stagingSchemaManuallyVerified=false；schema mapping；read-only；not production trading system；no real market data；no Supabase connection；no env key；no write / no staging write / no production write；no SQL migration；no api switch；no buy/sell command；no auto order；production Supabase 不得出現在 mapping target；/api/portfolio 不得切換；fixture/mock UI 仍維持現狀。
- V46 不連 staging Supabase；V46 不接 production Supabase；V46 不讀 Supabase env key；V46 不寫 staging；V46 不寫 production；V46 不新增 SQL migration；V46 不建立實際 schema；V46 不建立實際 RLS policy；V46 不切換 /api/portfolio；V46 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V46 不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未建立 runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V47 Staging Supabase Read-only Connection Review 或 V47 Staging Read-only Adapter Spec。

架構文件清單新增：Staging Supabase Schema Mapping Spec（[docs/staging-supabase-schema-mapping-spec.md](docs/staging-supabase-schema-mapping-spec.md)）。

### V45

Staging Supabase RLS Manual Matrix：

- 新增 `docs/staging-supabase-rls-manual-matrix.md`：定義 **Staging Supabase RLS Manual Matrix**（A–H 章），即未來啟用 staging Supabase read-only 連線前必須人工逐項驗證的 RLS 存取矩陣，含 scope boundary、matrix shape、policy expectations、loose policy guards（`using (true)` / public read/write 一律 NO_GO / BLOCKED）、safety language、decision 與 future gate（V46 Staging Supabase Read-only Connection Review / V46 Staging Supabase Schema Mapping Spec）。明確聲明 V45 是 staging Supabase RLS manual matrix、不是 staging Supabase 實作、不是 production 真實資料上線、不是建立實際 RLS policy migration；fixture/mock UI 仍維持現狀；V44 Staging Supabase Read-only Safety Gate 仍是前置安全門。
- 新增 `use-cases/deployment/staging-supabase-rls-manual-matrix-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 axios / 無 @supabase / 無 createClient / 無 process.env / 無 Date.now / 無 new Date / 無 insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 READY_FOR_REVIEW / NO_GO，刻意**不含 PRODUCTION_READY**）/ tableName / role / operation / expectedAccess（ALLOW_READ_ONLY / DENY / SERVICE_ROLE_ONLY / NOT_ALLOWED_IN_APP_RUNTIME）/ actualAccess（NOT_TESTED）/ verificationStatus / matrixItem / policyRule / manualCheck / bundle，與 `STAGING_SUPABASE_RLS_MANUAL_MATRIX_CONTRACT_VERSION` / `_TABLES` / `_ROLES` / `_OPERATIONS` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（stagingSupabasePlanned=true、stagingRlsMatrixDefined=true，其餘 stagingSupabaseConnected / stagingRlsManuallyVerified / stagingReadPerformed / stagingWritePerformed / productionSupabaseConnected / productionWritePerformed / databaseWritePerformed / requestPerformed / envReadPerformed / apiRouteCreated / uiCreated / runtimeCreated / sqlMigrationCreated / portfolioApiSwitched / realMarketDataEnabled / buySellCommandGenerated / autoOrderRequested 全 false）。
- 新增 `use-cases/deployment/build-staging-supabase-rls-manual-matrix-contract.ts`：pure deterministic builder `buildStagingSupabaseRlsManualMatrixContract()`，產生 5 tables（portfolio_stocks / watchlist_stocks / market_snapshots / stock_snapshots / v85_scores）× 4 roles（anon / authenticated / service_role / dashboard_readonly_app）× 4 operations（select / insert / update / delete）= **80 個 deterministic matrix items**：anon 全 DENY、authenticated 與 dashboard_readonly_app 僅 select=ALLOW_READ_ONLY 其餘 DENY、service_role 全 NOT_ALLOWED_IN_APP_RUNTIME，所有 actualAccess=NOT_TESTED、verificationStatus=NOT_REVIEWED；另含 8 條 policyRules 與 5 條 manualChecks；任何 write 不為 DENY → decision=NO_GO，否則 READY_FOR_REVIEW；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不建立 Supabase client、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-staging-supabase-rls-manual-matrix.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload、≥80 items、5×4×4 覆蓋、每 item policy 期望（含 write op 不得 ALLOW_READ_ONLY、actualAccess 全 NOT_TESTED、verificationStatus 全 NOT_REVIEWED）、全部安全旗標、decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token，並確認未新增 route / component / SQL migration、protected production routes 仍存在。
- 新增 `npm run test:staging-supabase-rls-manual-matrix`。
- Staging Supabase RLS Manual Matrix 定義 RLS 人工驗證矩陣；matrixName = Staging Supabase RLS Manual Matrix；deploymentTarget = staging；decision = READY_FOR_REVIEW；staging Supabase 僅 planned、stagingRlsManuallyVerified=false；RLS manual matrix；read-only；not production trading system；no real market data；no Supabase connection；no env key；no write / no staging write / no production write；no SQL migration；no api switch；no buy/sell command；no auto order；using (true) 與 public read/write 一律 NO_GO / BLOCKED；fixture/mock UI 仍維持現狀。
- V45 不連 staging Supabase；V45 不接 production Supabase；V45 不讀 Supabase env key；V45 不寫 staging；V45 不寫 production；V45 不新增 SQL migration；V45 不建立實際 RLS policy；V45 不切換 /api/portfolio；V45 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V45 不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未建立 runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V46 Staging Supabase Read-only Connection Review 或 V46 Staging Supabase Schema Mapping Spec。

架構文件清單新增：Staging Supabase RLS Manual Matrix（[docs/staging-supabase-rls-manual-matrix.md](docs/staging-supabase-rls-manual-matrix.md)）。

### V44

Staging Supabase Read-only Safety Gate：

- 新增 `docs/staging-supabase-readonly-safety-gate.md`：定義 **Staging Supabase Read-only Safety Gate**（A–J 章），即未來啟用 staging Supabase read-only 整合前必須先通過的前置安全門，含 scope boundary、staging boundary、read-only boundary、production isolation boundary、no-write proof / API switch guard / runtime guard / env guard、rollback / kill switch & manual review checklist、safety language、decision 與 future gate（V45 Staging Supabase RLS Manual Matrix）。明確聲明 V44 是 staging Supabase read-only safety gate、不是 staging Supabase 實作、不是 RLS matrix 實作、不是 production 真實資料上線；fixture/mock UI 仍維持現狀；production alias safety smoke test evidence 仍維持 V43 結論。
- 新增 `use-cases/deployment/staging-supabase-readonly-safety-gate-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 axios / 無 @supabase / 無 createClient / 無 process.env / 無 Date.now / 無 new Date / 無 insert/upsert/update/delete / 不寫資料），定義 deploymentTarget / decision（含 READY_FOR_REVIEW / NO_GO，刻意**不含 PRODUCTION_READY**）/ 9 個 gateId / gate / stagingBoundary / readOnlyBoundary / productionIsolation / noWriteProof / apiSwitchGuard / runtimeGuard / envGuard / rollbackCheck / manualCheck / bundle，與 `STAGING_SUPABASE_READONLY_SAFETY_GATE_CONTRACT_VERSION` / `_DEPLOYMENT_TARGET` / `_ALLOWED_GATES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（stagingSupabasePlanned=true，stagingSupabaseConnected / stagingReadPerformed / stagingWritePerformed / productionSupabaseConnected / productionWritePerformed / databaseWritePerformed / requestPerformed / envReadPerformed / apiRouteCreated / uiCreated / runtimeCreated / sqlMigrationCreated / portfolioApiSwitched / realMarketDataEnabled / buySellCommandGenerated / autoOrderRequested 全 false）。
- 新增 `use-cases/deployment/build-staging-supabase-readonly-safety-gate-contract.ts`：pure deterministic builder `buildStagingSupabaseReadonlySafetyGateContract()`，預設 contractVersion=V44 / gateName=Staging Supabase Read-only Safety Gate / deploymentTarget=staging / decision=READY_FOR_REVIEW，9 個 gates、staging / read-only / production isolation boundary、no-write proof、API switch / runtime / env guard、7 個 rollbackChecks、5 個 manualChecks，futureGate=V45 Staging Supabase RLS Manual Matrix，全部安全旗標固定為安全值；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不建立 Supabase client、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-staging-supabase-readonly-safety-gate.ts`：spec-only checker（8 gates：required_files / required_phrases / contract_checks / no_production_ready / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload 與全部安全旗標、確認 decision 永不為 PRODUCTION_READY，**大小寫不敏感**掃描 contract / builder 禁止 token（fetch( / axios / @supabase / createClient / process.env / Date.now / new Date( / insert( / upsert( / update( / delete( ），並確認未新增 route / component / SQL migration、protected production routes 仍存在。
- 新增 `npm run test:staging-supabase-readonly-safety-gate`。
- Staging Supabase Read-only Safety Gate 定義 staging Supabase read-only 前置安全門；deploymentTarget = staging；decision = READY_FOR_REVIEW；staging Supabase 僅 planned；read-only；not production trading system；no real market data；no Supabase connection；no env key；no write / no staging write / no production write；no api switch；no buy/sell command；no auto order；fixture/mock UI 仍維持現狀。
- V44 不接 production Supabase；V44 不連 staging Supabase；V44 不讀 Supabase env key；V44 不寫 staging；V44 不寫 production；V44 不切換 /api/portfolio；V44 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V44 不讀 env key；V44 不接真實行情。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未建立 runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V45 Staging Supabase RLS Manual Matrix。

架構文件清單新增：Staging Supabase Read-only Safety Gate（[docs/staging-supabase-readonly-safety-gate.md](docs/staging-supabase-readonly-safety-gate.md)）。

### V43

Production Alias Safety Smoke Test Evidence：

- 新增 `docs/production-alias-safety-smoke-test-evidence.md`：記錄針對 production alias `https://allen-stock-dashboard.vercel.app` 已完成的人工 safety smoke test（A–G 章），含 deployment context、manual smoke test evidence、frozen safety flags、scope boundary、safety language 與 future gate（V44 Staging Supabase Read-only Safety Gate）。明確聲明 V43 是 production alias safety smoke test evidence、不是正式真實資料上線；production shell 可展示但資料層仍為 fixture/mock safe mode；allen-stock-dashboard.vercel.app 不是 not production trading system。
- 新增 `use-cases/deployment/production-alias-safety-smoke-test-evidence-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 axios / 無 @supabase / 無 createClient / 無 process.env / 無 Date.now / 無 new Date / 無 insert/upsert/update/delete / 不寫資料），定義 `ProductionAliasSafetySmokeTestDeploymentTarget`、`ProductionAliasSafetySmokeTestDecision`（含 SMOKE_TEST_PASSED）、`ProductionAliasSafetySmokeTestEndpointCheck`、`ProductionAliasSafetySmokeTestRuntimeHealth`、`ProductionAliasSafetySmokeTestSafetyFlags`、`ProductionAliasSafetySmokeTestEvidenceBundle`，與 `PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_CONTRACT_VERSION` / `_PRODUCTION_ALIAS` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全旗標以 literal 型別釘死（realMarketDataEnabled / supabaseConnected / productionWritePerformed / databaseWritePerformed / requestPerformed / buySellCommandGenerated / autoOrderRequested / portfolioApiSwitched / runtimeCreated / apiRouteCreated / uiCreated / sqlMigrationCreated / envReadPerformed 全 false）。
- 新增 `use-cases/deployment/build-production-alias-safety-smoke-test-evidence-contract.ts`：pure deterministic builder `buildProductionAliasSafetySmokeTestEvidenceContract()`，預設 contractVersion=V43 / evidenceName=Production Alias Safety Smoke Test Evidence / deploymentTarget=production_alias / productionAlias=allen-stock-dashboard.vercel.app / decision=SMOKE_TEST_PASSED，6 個 endpointChecks（首頁 / holdings / 4 個 internal API）、runtimeHealth（30 分鐘無 error / fatal / 500）、frozen safetyFlags 全 false；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀系統時間、不讀 env、不建立 Supabase client、不發 request、不寫資料、不 import route。
- 新增 `scripts/validate-production-alias-safety-smoke-test-evidence.ts`：spec-only checker（7 gates：required_files / required_phrases / contract_checks / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload 與所有安全旗標，掃描 contract / builder 禁止 token（fetch( / axios / @supabase / createClient / process.env / Date.now / new Date( / insert( / upsert( / update( / delete( ），並確認未新增 route / component / SQL migration、protected production routes 仍存在。
- 新增 `npm run test:production-alias-safety-smoke-test-evidence`。
- Production Alias Safety Smoke Test Evidence 收斂已完成的人工 production alias 驗證：allen-stock-dashboard.vercel.app 已可開啟、/holdings 已可開啟、4 個 internal API 已可回應 fixture/mock JSON、production runtime 近 30 分鐘無 error / fatal / 500；decision=SMOKE_TEST_PASSED；fixture/mock safe mode；not production trading system；no real market data；no Supabase；no production write；no buy/sell command；no auto order。
- V43 不接真實行情；V43 不連 Supabase；V43 不寫 production；V43 不切換 /api/portfolio；V43 不建立 quote polling / scheduler / webhook / crawler / connector runtime；V43 不讀 env key。
- 未新增 API route；未新增 UI；未新增 SQL migration；未修改現有 production routes；未建立 runtime；未寫 DB；未產生買賣指令；未自動下單。下一階段才是 V44 Staging Supabase Read-only Safety Gate。

架構文件清單新增：Production Alias Safety Smoke Test Evidence（[docs/production-alias-safety-smoke-test-evidence.md](docs/production-alias-safety-smoke-test-evidence.md)）。

### V42

Preview Deployment Readiness：

- 新增 `docs/preview-deployment-readiness.md`：定義 **Preview Deployment Readiness**（A–I 章），把「把這個 fixture-only dashboard 部署成 Preview / Staging 網站」的前置檢查收斂成正式文件，含 deployment target、required pages / routes、required UI sections、pre-deploy commands、manual post-deploy checklist、rollback / redeploy checklist、deployment safety language 與 future gate（V43 Preview Deployment Smoke Test → V44 First Authorized Source Connector Adapter Spec）。
- 新增 `use-cases/deployment/preview-deployment-readiness-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 無 new Date / 不寫資料 / 不 deploy），定義 `PreviewDeploymentTarget` / `PreviewDeploymentProvider` / `PreviewDeploymentDecision`（含 READY_FOR_PREVIEW_DEPLOY / READY_FOR_REVIEW / NO_GO / BLOCKED）/ `PreviewDeploymentReadinessGateId`（17 個）/ `PreviewDeploymentReadinessGate` / `PreviewDeploymentRouteCheck` / `PreviewDeploymentUiCheck` / `PreviewDeploymentManualCheck` / `PreviewDeploymentRollbackCheck` / `PreviewDeploymentReadinessBundle`，與 `PREVIEW_DEPLOYMENT_READINESS_CONTRACT_VERSION` / `_ALLOWED_GATES` / `_ALLOWED_DECISIONS` / `_SAFETY_LABELS`（16）/ `_DISALLOWED_TERMS`（8）；安全旗標以 literal false 型別釘死（productionDataEnabled / runtimeEnabled / externalMarketDataEnabled / supabaseEnabled / databaseWriteEnabled / buySellCommandEnabled / autoOrderEnabled / productionWritePerformed / requestPerformed / supabaseConnected 全 false）。
- 新增 `use-cases/deployment/build-preview-deployment-readiness-contract.ts`：pure builder，預設輸出 contractVersion=V42 / deploymentTarget=preview / deploymentProvider=vercel_or_nextjs_compatible / decision=READY_FOR_REVIEW，17 個 gates、6 個 routeChecks（`/`、`/holdings`、4 個 internal API routes）、6 個 uiChecks（Portfolio Valuation Radar / Holding Defense Tracker / Intraday Defense Tracker / Runtime Pilot Readiness / Runtime Pilot Monitoring / First Authorized Source Dry-Run Monitoring）、9 個 manualChecks、11 個 rollbackChecks，全部 enable 旗標 false；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不讀時鐘、不 fetch、不 Supabase、不 process.env、不寫資料、不 import route。
- 新增 `scripts/validate-preview-deployment-readiness.ts`：spec-only checker（7 gates：required_files / required_phrases / contract_checks / payload_checks / package_checks / readme_checks / safety），import builder 與 constants 實際呼叫驗證 payload，並對 contract / builder 掃描禁止 token（fetch / axios / Supabase / process.env / Date.now / new Date / DB write token）。
- 新增 `npm run test:preview-deployment-readiness`。
- Preview Deployment Readiness 定義 preview / staging deployment 前置檢查；deploymentTarget = preview；deploymentProvider = vercel_or_nextjs_compatible；decision = READY_FOR_REVIEW；定義 route smoke test checklist；定義 holdings page UI checklist；定義 manual post-deploy checklist；定義 rollback / redeploy checklist；preview deployment 不是 production trading system；fixture data 不是即時資料。
- V42 不接真資料；V42 不建立 runtime；V42 不真的執行 Vercel deploy。
- 未連 Supabase；未發外部 request；未讀 env key；未新增 SQL migration；未新增 API route；未新增 UI；未修改 app / components / War Room / 既有 API routes / Runtime Pilot 與 First Authorized Source 既有 component / services / repositories；未新增 mock-data；未寫入資料；未產生買賣指令。

架構文件清單新增：Preview Deployment Readiness（[docs/preview-deployment-readiness.md](docs/preview-deployment-readiness.md)）。

### V41

First Authorized Source Dry-Run Monitoring UI：

- 新增 `docs/first-authorized-source-dry-run-monitoring-ui.md`：定義 **First Authorized Source Dry-Run Monitoring UI**（A–I 章），把 V40 `/api/portfolio/first-authorized-source-dry-run` 視覺化，含 data source boundary、UI placement、UI sections、required field display、no-write / no-trade display rules、data quality display rules、safety language 與 future implementation gate（V42 First Real Authorized Source Review → V43 First Authorized Source Connector Adapter Spec）。維持 single-source / source-neutral connector shape，不硬寫任何具體資料源名稱。
- 新增 `components/first-authorized-source-dry-run-monitoring.tsx`：client component，`useEffect` / `useState`，只 fetch internal API `/api/portfolio/first-authorized-source-dry-run`；type-only import `FirstAuthorizedSourceDryRunApiResponse`，不 import V40 builder function、不 import route、不 fetch 外部 URL、無 axios / Supabase / process.env / Date.now / new Date / DB write token / 具體資料源 token。視覺化 decision / dryRunAllowed / manualSignOffCompleted、source authorization preflight、source-neutral connector shape、quote snapshot normalization、price verification / data quality gate、alert projection、auditEvent、noWriteProof、killSwitch、rollback，並顯示 GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN / NO_GO、production write 一律 BLOCKED、monitoring preview 不是 runtime 狀態、fixture data 不是即時資料。
- 修改 `app/holdings/page.tsx`：`import FirstAuthorizedSourceDryRunMonitoring`，於 Runtime Pilot Monitoring UI 下方渲染 `<FirstAuthorizedSourceDryRunMonitoring />`；未新增 route、未 import route、未 import Supabase、未 fetch 外部 URL。
- 新增 `scripts/validate-first-authorized-source-dry-run-monitoring-ui.ts`：static UI checker（9 gates：required_files / required_phrases / component_checks / component_safety / page_integration / api_route_check / package_checks / readme_checks / safety），驗證 component 只 fetch internal API、不 import builder function / route、無外部 fetch / Supabase / 具體資料源 token，並確認 V40 route / API builder 未被破壞、無新增 API route。
- 新增 `npm run test:first-authorized-source-dry-run-monitoring-ui`。
- First Authorized Source Dry-Run Monitoring UI 將 V40 `/api/portfolio/first-authorized-source-dry-run` 接進 holdings page；顯示 decision / dryRunAllowed；顯示 source authorization preflight；顯示 source-neutral connector shape；顯示 quote snapshot normalization；顯示 price verification / data quality gate；顯示 alert projection；顯示 auditEvent；顯示 noWriteProof；顯示 killSwitch；顯示 rollback；顯示 GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN / NO_GO；顯示 manualSignOffCompleted；顯示 production write 一律 BLOCKED；顯示 monitoring preview 不是 runtime 狀態；顯示 fixture data 不是即時資料。
- monitoring 卡片逐欄渲染 dryRunBundle 各區段：`preflight`、`connectorShape`、`quoteSnapshot`、`priceVerification`、`alertProjection`、`auditEvent`、`noWriteProof`、`killSwitch`、`rollback`，summary 另含 `manualSignOffCompleted`、`authorizationStatus`、`legalStatus`、`sourceCategory`、`requestMode`、`priceVerified`、`noDangerGuardApplied`、`buySellCommandGenerated`、`autoOrderRequested`、`productionWriteRequested` 等旗標（全 false）。
- V41 不接真資料；V41 不建立 runtime；V41 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- 未連 Supabase；未發外部 request；未讀 env key；未新增 SQL migration；未新增 API route；未修改 First Authorized Source Dry-Run API route / API builder；未修改 V39 contract / builder；未修改 Runtime Pilot Monitoring UI；未修改 War Room；未修改 services / repositories；未新增 mock-data；未 import route / builder into component；未寫入資料；未產生買賣指令。

架構文件清單新增：First Authorized Source Dry-Run Monitoring UI（[docs/first-authorized-source-dry-run-monitoring-ui.md](docs/first-authorized-source-dry-run-monitoring-ui.md)）。

### V40

First Authorized Source Dry-Run API：

- 新增 `docs/first-authorized-source-dry-run-api.md`：定義 **First Authorized Source Dry-Run API**（A–I 章），把 V39 dry-run bundle 包成 fixture-only / mock_or_contract / internal endpoint，含 endpoint 定義、response shape、required dry-run fields、no-write / no-trade guard、data quality guard、safety language 與 future implementation gate（V41 First Authorized Source Dry-Run Monitoring UI → V42 First Real Authorized Source Review）。維持 single-source / source-neutral connector shape，不硬寫任何具體資料源名稱。
- 新增 `use-cases/runtime-pilot/build-first-authorized-source-dry-run-api-contract.ts`：pure API builder，`import buildFirstAuthorizedSourceDryRunContract`（V39 pure builder），把 dryRunBundle 包成 fixture-only API response，summary 完全從 dryRunBundle 派生（不另捏假資料）；無 fetch / axios / Supabase / process.env / Date.now / new Date / route import / 寫資料；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`。
- 新增 `app/api/portfolio/first-authorized-source-dry-run/route.ts`：`GET /api/portfolio/first-authorized-source-dry-run`，GET only、`NextResponse.json`、`import buildFirstAuthorizedSourceDryRunApiContract`、`dynamic = 'force-dynamic'`；不讀 request body、不發外部 request、不連 Supabase、不讀 env、不寫資料、不產生買賣指令、不自動下單。
- 新增 `scripts/validate-first-authorized-source-dry-run-api.ts`：fixture-only checker（10 gates：required_files / required_phrases / api_builder_checks / api_builder_no_runtime / route_checks / route_forbidden / payload_checks / package_checks / readme_checks / safety），import API builder 實際呼叫驗證 payload，並對 API builder / route 掃描禁止 token（含 twse / tpex / yahoo / finmind / tradingview / yfinance / factset / broker 與 DB write token）。
- 新增 `npm run test:first-authorized-source-dry-run-api`。
- 同步把 `app/api/portfolio/first-authorized-source-dry-run/route.ts` 從 V39 spec checker 的 forbiddenArtifacts 解除（V40 sanctioned API route），不降低任何 no-Supabase / no-external-request / no-SQL / no-runtime / no-write / no-buy-sell 檢查。
- First Authorized Source Dry-Run API 將 V39 dry-run bundle 轉成 fixture-only API；回傳 mock_or_contract；回傳 NO_GO；回傳 manualSignOffCompleted = false；回傳 source-neutral connector shape；回傳 single-source；回傳 quoteSnapshot；回傳 priceVerification；回傳 alertProjection；回傳 noWriteProof；回傳 killSwitch；回傳 rollback；GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production；buySellCommandGenerated 必須 false；autoOrderRequested 必須 false；production write 一律 BLOCKED。
- V40 不接真資料；V40 不建立 runtime；V40 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- 未連 Supabase；未發外部 request；未讀 env key；未新增 SQL migration；未新增 UI；未修改 app/holdings/page.tsx；未修改 components/；未修改 War Room；未修改 Holding Defense API route；未修改 Intraday Defense API route；未修改 Runtime Pilot Dry-Run API route；未修改 Runtime Pilot Monitoring UI；未修改 services / repositories；未新增 mock-data；未 import route；未寫入資料；未產生買賣指令。

架構文件清單新增：First Authorized Source Dry-Run API（[docs/first-authorized-source-dry-run-api.md](docs/first-authorized-source-dry-run-api.md)）。

### V39

First Authorized Source Dry-Run Spec：

- 新增 `docs/first-authorized-source-dry-run-spec.md`：定義第一個授權資料源 dry-run 的 source-neutral 行為規格（A–M 十三節），含 Core Principle、Dry-Run Scope、Source Authorization Preflight、Source-Neutral Connector Shape、Quote Snapshot Normalization、Price Verification / Data Quality Gate、Alert Projection、Audit / No-Write / Kill Switch / Rollback、Dry-Run Decision、Safety Language 與 Future Implementation Gate（V40 First Authorized Source Dry-Run API → V41 First Authorized Source Dry-Run Monitoring UI）。
- 新增 `use-cases/runtime-pilot/first-authorized-source-dry-run-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 無 new Date / 不寫資料；contract 只用抽象來源類別、不硬寫 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker），定義 `FirstAuthorizedSourceDryRunSourceCategory`（抽象類別）、`FirstAuthorizedSourceDryRunReviewStatus` / `Decision`（含 GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN / NO_GO）/ `RequestMode` / `DataQualityStatus`、`FirstAuthorizedSourcePreflight` / `ConnectorShape` / `QuoteSnapshot` / `PriceVerificationGate` / `AlertProjection` / `AuditEvent` / `NoWriteProof` / `KillSwitch` / `Rollback` / `Bundle`，與 `FIRST_AUTHORIZED_SOURCE_DRY_RUN_CONTRACT_VERSION` / `_ALLOWED_SOURCE_CATEGORIES` / `_ALLOWED_DECISIONS` / `_ALLOWED_REQUEST_MODES` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`；安全不變量以 literal false/true 型別釘死（dryRunAllowed: false、requestPerformed: false、rawResponseStored: false、priceVerified: false、noDangerGuardApplied: true、notExitSignal: true、buySellCommandGenerated: false、autoOrderRequested: false…）。
- 新增 `use-cases/runtime-pilot/build-first-authorized-source-dry-run-contract.ts`：pure spec builder，預設輸出 contractVersion=V39 / sourceMode=spec_only / decision=NO_GO / dryRunAllowed=false / manualSignOffCompleted=false / requestMode=disabled / requestPerformed=false / rawResponseStored=false / normalizedSnapshotProduced=false / priceVerified=false / highConfidenceConclusionAllowed=false / precisePriceZoneAllowed=false / noDangerGuardApplied=true / projectedAlertLevel=DATA_INSUFFICIENT / buySellCommandGenerated / autoOrderRequested / productionWriteRequested / writeAttempted / databaseWritePerformed / productionWritePerformed / externalOrderPerformed / supabaseConnected 全 false、killSwitch.requiresManualReview=true / dryRunCanContinue=false、rollback.manualReviewRequired=true；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不 Date.now、不 new Date、不 fetch、不 Supabase、不 process.env、不寫資料、不接任何資料源。
- 新增 `scripts/validate-first-authorized-source-dry-run-spec.ts`：spec-only checker，11 gates（required_files / required_phrases / contract_checks / builder_checks / builder_no_clock / constant_checks / payload_checks / package_checks / readme_checks / negation_context / safety），import builder 與 constants 實際呼叫驗證 contractVersion=V39、decision=NO_GO、dryRunAllowed=false、preflight.manualSignOffCompleted=false、connector / quoteSnapshot / priceVerification / alertProjection / auditEvent / noWriteProof / killSwitch / rollback 全部安全 flag；safety scan 只對 contract / builder 嚴格掃描（含禁止 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker）。
- 新增 `npm run test:first-authorized-source-dry-run-spec`。
- First Authorized Source Dry-Run Spec 定義第一個授權資料源 dry-run 的 source-neutral behavior；定義 single-source；定義 source-neutral connector shape；定義 source authorization preflight；定義 quote snapshot normalization；定義 price verification / data quality gate；定義 alert projection；定義 audit / no-write proof / kill switch / rollback；預設 NO_GO；manualSignOffCompleted = false；priceVerified = false 時不得輸出精準價位；buySellCommandGenerated 必須 false；autoOrderRequested 必須 false；production write 一律 BLOCKED。
- V39 不接真資料；V39 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler / connector。
- 未連 Supabase；未發外部 request；未讀 env secret；未新增 SQL migration；未新增 API route；未新增 UI；未新增 mock-data；未寫入資料。
- 未修改 app / components / War Room / Holding Defense API route / Intraday Defense API route / Runtime Pilot Dry-Run API route / Runtime Pilot Monitoring UI / services / repositories；未 import route；未產生買賣指令。

架構文件清單新增：First Authorized Source Dry-Run Spec（[docs/first-authorized-source-dry-run-spec.md](docs/first-authorized-source-dry-run-spec.md)）。

### V38

Runtime Pilot Implementation Review：

- 新增 `docs/runtime-pilot-implementation-review.md`：定義接入第一個授權資料源 dry-run 前的最後 implementation gate（A–N 十四節），含 Core Principle、20 個 Implementation Review Items、Review Severity、Review Status、Implementation Decision、Authorized Source Preflight、Implementation Boundary、Audit / Rollback / Kill Switch Review、No-Write / No-Trade Review、Data Quality Review、Safety Language 與 Future Implementation Gate（V39 First Authorized Source Dry-Run Spec → V40 First Authorized Source Dry-Run API）。
- 新增 `use-cases/runtime-pilot/runtime-pilot-implementation-review-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 無 new Date / 不寫資料；contract 不硬寫 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker），定義 `RuntimePilotImplementationReviewItemId`（20 items）、`RuntimePilotImplementationReviewSeverity` / `Status` / `RuntimePilotImplementationDecision`（GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN / NO_GO / BLOCKED / READY_FOR_REVIEW / DATA_INSUFFICIENT）/ `RuntimePilotImplementationFeatureArea` / `RuntimePilotImplementationReviewItem` / `DecisionSummary` / `RuntimePilotAuthorizedSourcePreflightReview` / `RuntimePilotImplementationBoundary` / `RuntimePilotImplementationAuditReview` / `RollbackReview` / `KillSwitchReview` / `Bundle`，與 `RUNTIME_PILOT_IMPLEMENTATION_REVIEW_CONTRACT_VERSION` / `_ALLOWED_ITEMS`（20）/ `_CRITICAL_ITEMS`（7）/ `_ALLOWED_DECISIONS` / `_SAFETY_LABELS` / `_DISALLOWED_TERMS`。
- 新增 `use-cases/runtime-pilot/build-runtime-pilot-implementation-review-contract.ts`：pure spec builder，輸出 20 reviewItems（7 個 CRITICAL）、預設 decision = NO_GO（manual sign-off 未完成、source authorization / kill switch / audit / rollback 尚未 review）、manualSignOffRequired=true / manualSignOffCompleted=false / dryRunOnly=true / noWriteModeRequired=true / productionWriteAllowed=false / buySellCommandGenerationBlocked=true / autoOrderBlocked=true / notTradeAdviceAlwaysTrue=true，authorizedSourcePreflight / implementationBoundary（全 true 不變量）/ auditReview / rollbackReview / killSwitchReview；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不 Date.now、不 new Date、不 fetch、不 Supabase、不 process.env、不寫資料。
- 新增 `scripts/validate-runtime-pilot-implementation-review.ts`：spec-only checker，11 gates（required_files / required_phrases / contract_checks / builder_checks / builder_no_clock / constant_checks / payload_checks / package_checks / readme_checks / negation_context / safety），import builder 與 constants 實際呼叫驗證 contractVersion=V38、reviewItems=20、critical≥7、decision=NO_GO、manualSignOffRequired=true / manualSignOffCompleted=false / dryRunOnly=true / productionWriteAllowed=false / buySellCommandGenerationBlocked=true / autoOrderBlocked=true、implementationBoundary / auditReview / rollbackReview / killSwitchReview 不變量、任一 CRITICAL item 非 PASS 則 decision≠GO；safety scan 只對 contract / builder 嚴格掃描（含禁止 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker）。
- 新增 `npm run test:runtime-pilot-implementation-review`。
- Runtime Pilot Implementation Review 定義真正進入 First Authorized Source Dry-Run 前的 implementation gate；定義 20 個 review items；定義 critical review items（REVIEW_SOURCE_AUTHORIZATION / REVIEW_NO_WRITE_ENFORCEMENT / REVIEW_KILL_SWITCH / REVIEW_NO_BUY_SELL_COMMAND / REVIEW_NO_AUTO_ORDER / REVIEW_PRODUCTION_WRITE_BLOCKED / REVIEW_MANUAL_SIGN_OFF）；定義 authorized source preflight；定義 implementation boundary；定義 audit / rollback / kill switch review；定義 GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN / NO_GO；預設 NO_GO；manualSignOffRequired = true；manualSignOffCompleted = false；production write 一律 BLOCKED。
- V38 不接真資料；V38 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler / broker connector。
- 未連 Supabase；未發外部 request；未讀 env secret；未新增 SQL migration；未新增 API route；未新增 UI；未新增 mock-data；未寫入資料。
- 未修改 app / components / War Room / Holding Defense API route / Intraday Defense API route / Runtime Pilot Dry-Run API route / Runtime Pilot Monitoring UI / services / repositories；未 import route；未產生買賣指令。

架構文件清單新增：Runtime Pilot Implementation Review（[docs/runtime-pilot-implementation-review.md](docs/runtime-pilot-implementation-review.md)）。

### V37

Runtime Pilot Monitoring UI：

- 新增 `docs/runtime-pilot-monitoring-ui.md`：定義 dry-run 監控視覺化（A–I 九節），含 Data Source Boundary（UI 只讀 `/api/portfolio/runtime-pilot-dry-run`、不直接 fetch 外部 URL / Supabase / env / runtime connector、顯示 monitoring preview 不是 runtime 狀態）、UI Placement、UI Sections、Required Field Display、No-Write / No-Trade Display Rules、Data Quality Display Rules、Safety Language 與 Future Implementation Gate（V38 Runtime Pilot Implementation Review → V39 First Authorized Source Dry-Run）。
- 新增 `components/runtime-pilot-monitoring.tsx`：`'use client'` client component，只 `fetch('/api/portfolio/runtime-pilot-dry-run')`（唯一內部端點），type-only import `RuntimePilotDryRunApiResponse`；顯示 loading / error 安全 fallback（error 不顯示假資料）、fixture-only warning banner、dry-run summary cards（apiContractVersion / responseSource / sourceMode / runtimeMode / fixtureVersion / contractVersion + lifecycleState / readinessDecision / dryRunAllowed / priceVerified / highConfidenceConclusionAllowed / precisePriceZoneAllowed / buySellCommandGenerated / autoOrderRequested / productionWriteRequested / writeAttempted / databaseWritePerformed / externalOrderPerformed / productionWritePerformed / supabaseConnected / killSwitchEnabled / dryRunCanContinue / rollbackRequired / noWriteProofStatus）、Source Descriptor / Quote Snapshot / Price Verification / Alert Projection / Audit Event / No-Write Proof / Kill Switch / Rollback 八個 nested 區段、No-Write / No-Trade Guard + safety footer；不 axios、不 Supabase、不 process.env、不 Date.now / new Date、不 import builder / route。
- 修改 `app/holdings/page.tsx`：import 並在 RuntimePilotReadiness 下方渲染 `<RuntimePilotMonitoring />`，未移除既有任何模組。
- 新增 `scripts/validate-runtime-pilot-monitoring-ui.ts`：fixture-only checker，8 gates（required_files / required_phrases / component_checks / component_safety / page_integration / package_checks / readme_checks / safety），驗證 component 含 46 必要字串、只 fetch 內部 `/api/portfolio/runtime-pilot-dry-run`、無 axios / Supabase / process.env / Date.now / new Date / DB write / 外部來源 token / 外部 URL，未 import API builder 函式 / route，holdings page 有 import 並渲染 `<RuntimePilotMonitoring />`。
- 新增 `npm run test:runtime-pilot-monitoring-ui`。
- Runtime Pilot Monitoring UI 將 V36 `/api/portfolio/runtime-pilot-dry-run` 接進 holdings page；顯示 dry-run lifecycle；顯示 summary；顯示 sourceDescriptor；顯示 quoteSnapshot；顯示 priceVerification；顯示 alertProjection；顯示 auditEvent；顯示 noWriteProof；顯示 killSwitch；顯示 rollback；顯示 DRY_RUN_NOT_ALLOWED / dry_run_spec / NO_GO；顯示 production write 一律 BLOCKED；顯示 monitoring preview 不是 runtime 狀態；顯示 fixture data 不是即時資料。
- V37 不接真資料；V37 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler；未連 Supabase；未發外部 request；未讀 env secret。
- 未新增 SQL migration；未新增 API route；未修改 Runtime Pilot Dry-Run API route / builder；未修改 War Room；未新增 mock-data；未寫入資料。
- 未修改 services / repositories；未 import route；未產生買賣指令。

架構文件清單新增：Runtime Pilot Monitoring UI（[docs/runtime-pilot-monitoring-ui.md](docs/runtime-pilot-monitoring-ui.md)）。

### V36

Runtime Pilot Dry-Run API：

- 新增 `docs/runtime-pilot-dry-run-api.md`：定義盤後 dry-run bundle 的 fixture-only API（A–I 九節），含 API Endpoint（`GET /api/portfolio/runtime-pilot-dry-run`）、與 V33/V34/V35 的關係、Response Shape、Required Dry-Run Fields、No-Write / No-Trade Guard、Data Quality Guard、Safety Language 與 Future Implementation Gate（V37 Runtime Pilot Monitoring UI → V38 Runtime Pilot Dry-Run Implementation Review）。
- 新增 `use-cases/runtime-pilot/build-runtime-pilot-dry-run-api-contract.ts`：pure builder，import 並呼叫 V35 `buildRuntimePilotDryRunContract`（dryRunBundle 一律來自 V35 pure builder、不複製假資料繞過），輸出 `RuntimePilotDryRunApiResponse` / `RuntimePilotDryRunApiSummary`；apiContractVersion=V36 / responseSource=mock_or_contract / sourceMode=fixture / runtimeMode=dry_run_spec / fixtureVersion=V36，summary 由 dryRunBundle 派生（lifecycleState=DRY_RUN_NOT_ALLOWED、readinessDecision=NO_GO、dryRunAllowed=false、buySellCommandGenerated / autoOrderRequested / productionWriteRequested / writeAttempted / databaseWritePerformed / externalOrderPerformed / productionWritePerformed / supabaseConnected 全 false），safetyLabels 含 V36 API labels + V35 labels；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不 Date.now、不 new Date、不 fetch、不 axios、不 Supabase、不 process.env、不寫資料。
- 新增 `app/api/portfolio/runtime-pilot-dry-run/route.ts`：`GET /api/portfolio/runtime-pilot-dry-run`，`NextResponse.json` 回傳 builder payload（固定 generatedAt），`dynamic = 'force-dynamic'`、`Cache-Control: no-store`；無 POST/PUT/DELETE/PATCH、不 fetch、不 axios、不 Supabase、不讀 env、不 Date.now、不 new Date。
- 新增 `scripts/validate-runtime-pilot-dry-run-api.ts`：10 gates（required_files / required_phrases / api_builder_checks / api_builder_no_runtime / route_checks / route_forbidden / payload_checks / package_checks / readme_checks / safety），import API builder 實際呼叫驗證 apiContractVersion=V36、responseSource=mock_or_contract、sourceMode=fixture、runtimeMode=dry_run_spec、fixtureVersion=V36、dryRunBundle.contractVersion=V35 / lifecycleState=DRY_RUN_NOT_ALLOWED / readinessDecision=NO_GO / dryRunAllowed=false、summary 全部 no-write / no-trade flag、safetyLabels 含必要 label；safety scan 只對 API builder / route 嚴格掃描（含禁止 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker）。
- 新增 `npm run test:runtime-pilot-dry-run-api`；同步更新 `scripts/validate-runtime-pilot-dry-run-spec.ts`（將 V36 sanctioned 的 `app/api/portfolio/runtime-pilot-dry-run/route.ts` 從 V35 forbidden 清單移除，附說明註解，其餘安全不變）。
- 新增 `GET /api/portfolio/runtime-pilot-dry-run`；Runtime Pilot Dry-Run API 將 V35 dry-run bundle 轉成 fixture-only API；回傳 mock_or_contract；回傳 DRY_RUN_NOT_ALLOWED；回傳 dry_run_spec；回傳 NO_GO；回傳 no-write proof；回傳 audit event；回傳 kill switch；回傳 rollback；DRY_RUN_COMPLETED_WITH_NO_WRITE 為成功狀態語意；buySellCommandGenerated 必須 false；autoOrderRequested 必須 false；production write 一律 BLOCKED。
- V36 不接真資料；V36 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler / broker connector。
- 未連 Supabase；未發外部 request；未讀 env secret；未新增 SQL migration；未新增 UI；未修改 app/holdings/page.tsx / components / War Room / Holding Defense API route / Intraday Defense API route / Runtime Pilot Readiness UI；未新增 mock-data；未寫入資料。
- 未修改 services / repositories；未 import route；未產生買賣指令。

架構文件清單新增：Runtime Pilot Dry-Run API（[docs/runtime-pilot-dry-run-api.md](docs/runtime-pilot-dry-run-api.md)）。

### V35

Runtime Pilot Dry-Run Spec：

- 新增 `docs/runtime-pilot-dry-run-spec.md`：定義未來 Runtime Pilot dry-run 行為規格（A–N 十四節），含 Dry-Run Core Principle、Dry-Run Lifecycle、Input Boundary、Price Verification Rules、Alert Projection Rules、Audit Event Rules、No-Write Proof Rules、Kill Switch Rules、Rollback Rules、Output Bundle、Safety Language 與 Future Implementation Gate（V36 Runtime Pilot Dry-Run API → V37 Runtime Pilot Monitoring）。
- 新增 `use-cases/runtime-pilot/runtime-pilot-dry-run-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 無 new Date / 不寫資料；contract 不硬寫 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker），定義 `RuntimePilotDryRunLifecycleState`（12 states：DRY_RUN_NOT_ALLOWED … DRY_RUN_COMPLETED_WITH_NO_WRITE）、`RuntimePilotDryRunRuntimeMode`（dry_run_spec / dry_run / disabled）、`RuntimePilotDryRunSourceMode`、`RuntimePilotDryRunProofStatus`、`RuntimePilotDryRunReadinessDecision`、`RuntimePilotDryRunSourceDescriptor` / `QuoteSnapshot` / `PriceVerification` / `AlertProjection` / `AuditEvent` / `NoWriteProof` / `KillSwitch` / `Rollback` / `Bundle`，與 `RUNTIME_PILOT_DRY_RUN_CONTRACT_VERSION` / `RUNTIME_PILOT_DRY_RUN_ALLOWED_LIFECYCLE_STATES`（12）/ `RUNTIME_PILOT_DRY_RUN_ALLOWED_RUNTIME_MODES` / `RUNTIME_PILOT_DRY_RUN_ALLOWED_SOURCE_MODES` / `RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS` / `RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS`。
- 新增 `use-cases/runtime-pilot/build-runtime-pilot-dry-run-contract.ts`：pure spec builder，預設輸出 contractVersion=V35 / sourceMode=spec_only / runtimeMode=dry_run_spec / lifecycleState=DRY_RUN_NOT_ALLOWED / readinessDecision=NO_GO / dryRunAllowed=false，priceVerified=false / highConfidenceConclusionAllowed=false / precisePriceZoneAllowed=false / noDangerGuardApplied=true，alertProjection 與 auditEvent 的 buySellCommandGenerated / autoOrderRequested / productionWriteRequested 全 false、notExitSignal / notTradeAdvice 全 true，noWriteProof 的 writeAttempted / productionWritePerformed / databaseWritePerformed / externalOrderPerformed / supabaseConnected 全 false（proofStatus=BLOCKED），killSwitch.requiresManualReview=true / dryRunCanContinue=false、rollback.manualReviewRequired=true；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不 Date.now、不 new Date、不 fetch、不 Supabase、不 process.env、不寫資料。
- 新增 `scripts/validate-runtime-pilot-dry-run-spec.ts`：spec-only checker，11 gates（required_files / required_phrases / contract_checks / builder_checks / builder_no_clock / constant_checks / payload_checks / package_checks / readme_checks / negation_context / safety），import builder 與 constants 實際呼叫驗證 contractVersion=V35、sourceMode=spec_only、runtimeMode=dry_run_spec、lifecycleState=DRY_RUN_NOT_ALLOWED、readinessDecision=NO_GO、dryRunAllowed=false，以及 priceVerification / alertProjection / auditEvent / noWriteProof / killSwitch / rollback 全部安全 flag；safety scan 只對 contract / builder 嚴格掃描（含禁止 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker）。
- 新增 `npm run test:runtime-pilot-dry-run-spec`。
- Runtime Pilot Dry-Run Spec 定義未來 dry-run lifecycle / input / verification / audit / no-write proof / kill switch / rollback；定義 DRY_RUN_NOT_ALLOWED；定義 DRY_RUN_COMPLETED_WITH_NO_WRITE；定義 dry_run_spec；預設 NO_GO；dryRunAllowed = false；priceVerified = false 時不得輸出精準價位；buySellCommandGenerated 必須 false；autoOrderRequested 必須 false；production write 一律 BLOCKED。
- V35 不接真資料；V35 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler / broker connector。
- 未連 Supabase；未發外部 request；未讀 env secret；未新增 SQL migration；未新增 API route；未新增 UI；未新增 mock-data；未寫入資料。
- 未修改 app / components / War Room / Holding Defense API route / Intraday Defense API route / Runtime Pilot Readiness UI / services / repositories；未 import route；未產生買賣指令。

架構文件清單新增：Runtime Pilot Dry-Run Spec（[docs/runtime-pilot-dry-run-spec.md](docs/runtime-pilot-dry-run-spec.md)）。

### V34

Runtime Pilot Readiness UI：

- 新增 `docs/runtime-pilot-readiness-ui.md`：定義 Runtime Pilot 就緒度視覺化（A–I 九節），含 Data Boundary（UI 使用 V33 pure builder 產生 fixture / spec-only payload、不 fetch 外部 URL / Supabase / env / runtime connector、顯示 readiness preview 不是 runtime 狀態）、UI Placement、UI Sections、Gate Card Fields、Audit / Rollback / Kill Switch Display、Go / No-Go Display Rules、Safety Language 與 Future Implementation Gate（V35 Runtime Pilot Dry-Run → V36 Runtime Pilot Monitoring）。
- 新增 `components/runtime-pilot-readiness.tsx`：server component，直接 import 並呼叫 V33 pure builder `buildRuntimePilotReadinessContract({ generatedAt: '2026-06-23T00:00:00.000Z' })`，不 fetch、不 axios、不 Supabase、不 process.env、不 Date.now / new Date、不 import route；顯示 decision summary（decision / decisionReason / criticalGateCount / criticalGatePassedCount / blockedGateCount / notReviewedGateCount / warningGateCount / allCriticalGatesPassed / dryRunModeRequired / noWriteModeRequired / productionWriteAllowed / buySellCommandGenerationBlocked / notTradeAdviceAlwaysTrue）、critical gates、全部 18 個 readiness gates card（gateId / gateLabel / severity / status / featureArea / passed / blockingReason / warningReason / requiredEvidence / missingEvidence / nextRequiredAction / ownerHint）、missing evidence、next required actions、audit log / rollback plan / kill switch shape preview（含 auditId / rollbackId / killSwitchId）、safety footer；明確標示 GO_DRY_RUN 不是 production / 不代表可寫資料 / 不代表產生買賣指令 / NO_GO / production write 一律 BLOCKED。
- 修改 `app/holdings/page.tsx`：import 並在 IntradayDefenseTracker 下方渲染 `<RuntimePilotReadiness />`，未移除既有任何模組。
- 新增 `scripts/validate-runtime-pilot-readiness-ui.ts`：fixture-only checker，9 gates（required_files / required_phrases / component_checks / component_field_checks / component_safety / page_integration / package_checks / readme_checks / safety），驗證 component 含 36 必要字串 + 12 欄位字串、import pure builder、未 import route、無 fetch / axios / Supabase / process.env / Date.now / new Date / DB write / 外部來源 token / 外部 URL，holdings page 有 import 並渲染 `<RuntimePilotReadiness />`。
- 新增 `npm run test:runtime-pilot-readiness-ui`。
- Runtime Pilot Readiness UI 將 V33 readiness checklist 視覺化；顯示 decision summary；顯示 18 個 readiness gates；顯示 critical gates；顯示 missing evidence；顯示 next required actions；顯示 audit log shape；顯示 rollback plan shape；顯示 kill switch shape；顯示 GO_DRY_RUN / NO_GO；顯示 production write 一律 BLOCKED；顯示 readiness preview 不是 runtime 狀態；顯示 fixture data 不是即時資料。
- V34 不接真資料；V34 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler。
- 未連 Supabase；未發外部 request；未讀 env secret；未新增 SQL migration；未新增 API route；未修改既有 API route；未新增 mock-data；未寫入資料。
- 未修改 War Room / V33 contract / V33 builder / services / repositories；未 import route；未產生買賣指令。

架構文件清單新增：Runtime Pilot Readiness UI（[docs/runtime-pilot-readiness-ui.md](docs/runtime-pilot-readiness-ui.md)）。

### V33

Runtime Pilot Readiness Checklist：

- 新增 `docs/runtime-pilot-readiness-checklist.md`：定義真正 Runtime Pilot 前的 go / no-go gate（A–N 十四節），含 Core Principle、Readiness Gates、Gate Severity、Gate Status、Go / No-Go Decision、Source Readiness、Data Quality Readiness、Alert Safety Readiness、Runtime Operation Readiness、Audit / Rollback / Kill Switch、Safety Language 與 Future Implementation Gate（V34 Runtime Pilot Dry-Run → V35 Runtime Pilot UI / Monitoring）。
- 新增 `use-cases/runtime-pilot/runtime-pilot-readiness-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 無 new Date / 不寫資料；contract 不硬寫 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker），定義 `RuntimePilotReadinessGateId`（18 gates：SOURCE_AUTHORIZATION / SOURCE_LEGAL_STATUS / RATE_LIMIT_POLICY / MARKET_SESSION_HANDLING / TIMESTAMP_NORMALIZATION / STALE_GUARD / SOURCE_CONFLICT_THRESHOLD / FALLBACK_DOWNGRADE / NO_DANGER_GUARD / DRY_RUN_MODE / NO_WRITE_GUARD / AUDIT_LOG_SHAPE / ROLLBACK_PLAN / KILL_SWITCH / ALERT_SAFETY / BUY_SELL_COMMAND_BLOCK / NOT_TRADE_ADVICE / PRODUCTION_WRITE_BLOCKED）、`RuntimePilotGateSeverity` / `RuntimePilotGateStatus` / `RuntimePilotDecision`（GO_DRY_RUN / NO_GO / BLOCKED / READY_FOR_REVIEW / DATA_INSUFFICIENT）/ `RuntimePilotFeatureArea` / `RuntimePilotReadinessGate` / `RuntimePilotReadinessDecisionSummary` / `RuntimePilotAuditLogShape` / `RuntimePilotRollbackPlanShape` / `RuntimePilotKillSwitchShape` / `RuntimePilotReadinessBundle`，與 `RUNTIME_PILOT_READINESS_CONTRACT_VERSION` / `RUNTIME_PILOT_READINESS_ALLOWED_GATES`（18）/ `RUNTIME_PILOT_READINESS_CRITICAL_GATES`（8）/ `RUNTIME_PILOT_READINESS_ALLOWED_DECISIONS` / `RUNTIME_PILOT_READINESS_SAFETY_LABELS` / `RUNTIME_PILOT_READINESS_DISALLOWED_TERMS`。
- 新增 `use-cases/runtime-pilot/build-runtime-pilot-readiness-contract.ts`：pure spec builder，輸出 18 gates（8 個 CRITICAL）、預設 decision = NO_GO（尚未確認 source authorization / kill switch / rollback / audit log）、productionWriteAllowed = false / dryRunModeRequired = true / noWriteModeRequired = true / buySellCommandGenerationBlocked = true / notTradeAdviceAlwaysTrue = true、auditLogShape / rollbackPlanShape / killSwitchShape sample；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不 Date.now、不 new Date、不 fetch、不 Supabase、不 process.env、不寫資料。
- 新增 `scripts/validate-runtime-pilot-readiness-checklist.ts`：spec-only checker，11 gates（required_files / required_phrases / contract_checks / builder_checks / builder_no_clock / constant_checks / payload_checks / package_checks / readme_checks / negation_context / safety），import builder 與 constants 實際呼叫驗證 contractVersion=V33、sourceMode=spec_only、gates.length=18、critical≥8、productionWriteAllowed=false、dryRun/noWrite/buySellBlock/notTradeAdvice 為 true、decision≠GO_DRY_RUN、任一 CRITICAL gate 非 PASS 則 decision≠GO_DRY_RUN；safety scan 只對 contract / builder 嚴格掃描（含禁止 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker）。
- 新增 `npm run test:runtime-pilot-readiness-checklist`。
- Runtime Pilot Readiness Checklist 定義 runtime pilot 前的 go / no-go gate；定義 SOURCE_AUTHORIZATION / SOURCE_LEGAL_STATUS / RATE_LIMIT_POLICY / MARKET_SESSION_HANDLING / TIMESTAMP_NORMALIZATION / STALE_GUARD / SOURCE_CONFLICT_THRESHOLD / FALLBACK_DOWNGRADE / NO_DANGER_GUARD / DRY_RUN_MODE / NO_WRITE_GUARD / AUDIT_LOG_SHAPE / ROLLBACK_PLAN / KILL_SWITCH / BUY_SELL_COMMAND_BLOCK / PRODUCTION_WRITE_BLOCKED；定義 GO_DRY_RUN / NO_GO；production write 一律 BLOCKED。
- V33 不接真資料；V33 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler / broker connector。
- 未連 Supabase；未發外部 request；未讀 env secret；未新增 SQL migration；未新增 API route；未新增 UI；未新增 mock-data；未寫入資料。
- 未修改 app / components / War Room / Holding Defense API route / Intraday Defense API route / Holding Defense UI / Intraday Defense UI / services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Runtime Pilot Readiness Checklist（[docs/runtime-pilot-readiness-checklist.md](docs/runtime-pilot-readiness-checklist.md)）。

### V32

Intraday Defense UI Integration：

- 新增 `docs/intraday-defense-ui-integration.md`：定義盤中防守 UI 整合（A–K 十一節），含 Data Source Boundary（UI 只讀 `/api/portfolio/intraday-defense`、不直接 fetch 外部 URL / Supabase / env / runtime connector）、UI Placement、UI Sections、Alert Item Card Fields、Zone Display Rules、State Display Rules、Cooldown / Dedup Display Rules、No-DANGER Guard Display Rules、Safety Language 與 Future Implementation Gate（V33 Runtime Pilot Readiness Checklist → V34 Runtime Pilot）。
- 新增 `components/intraday-defense-tracker.tsx`：`'use client'` client component，只 `fetch('/api/portfolio/intraday-defense')`（唯一內部端點），type-only import `IntradayDefenseFixtureResponse` / `IntradayHoldingDefenseAlertItem`；顯示 loading / error 安全 fallback（error 不顯示假資料）、fixture-only warning banner、summary cards（totalAlerts / infoCount / watchCount / warningCount / dangerCount / dataInsufficientCount / priceNotVerifiedCount / staleDataCount / sourceConflictCount / fallbackOnlyCount / duplicateSuppressedCount / highConfidenceConclusionAllowed）、每張 alert card（alertId / stockId / stockName / runtimeMode / intradayState 14 種狀態中文化 / alertLevel / triggerType / trackerState / holdingState / holdingActionState / priceVerified / priceVerificationStatus / freshnessStatus / sourceConflictStatus / dataQualityStatus / sourcePriority / currentPrice / intradayHigh / intradayLow / previousClose / volumeRatio / drawdownFromPeakPercent / 各 PriceZone / holdingImpact / trendBreakWarning / shortAttackRisk / riskReduceObservation / waitForReclaimCondition / recoveryCondition / nextObservation / dedupKey / duplicateSuppressed / cooldownRemainingSeconds / lastAlertState / nextAllowedAlertAt / warnings / missingDataFields / requiredVerification / notExitSignal / notTradeAdvice / highConfidenceConclusionAllowed）、cooldown / dedup 區、No-DANGER Guard + safety footer；zone 為 null 顯示「資料不足 / 未允許精準價位」；不 axios、不 Supabase、不 process.env、不 Date.now / new Date、不 import builder / route。
- 修改 `app/holdings/page.tsx`：import 並在 HoldingDefenseTracker 下方渲染 `<IntradayDefenseTracker />`，未移除既有任何模組。
- 新增 `scripts/validate-intraday-defense-ui-integration.ts`：fixture-only checker，9 gates（required_files / required_phrases / component_checks / component_field_checks / component_safety / page_integration / package_checks / readme_checks / safety），驗證 component 含 54 必要字串 + 28 欄位字串、只 fetch 內部 `/api/portfolio/intraday-defense`、無 axios / Supabase / process.env / Date.now / new Date / DB write / 外部來源 token / 外部 URL、未 import builder / route，holdings page 有 import 並渲染 `<IntradayDefenseTracker />`。
- 新增 `npm run test:intraday-defense-ui-integration`。
- Intraday Defense UI Integration 將 V31 `/api/portfolio/intraday-defense` 接進 holdings page；顯示 fixture-only 盤中防守警報卡；顯示 INTRADAY_NORMAL / DEFENSE_ZONE_APPROACHING / DEFENSE_ZONE_BREACHED / INVALID_LEVEL_BREACHED / PROFIT_GIVEBACK_WARNING / RISK_REDUCTION_WATCH / FAST_DROP_WARNING / TREND_BREAK_WARNING / PRICE_NOT_VERIFIED / STALE_DATA / SOURCE_CONFLICT / FALLBACK_ONLY / DATA_INSUFFICIENT；顯示 cooldown / dedup；顯示 priceVerified / freshnessStatus / sourceConflictStatus / dataQualityStatus / sourcePriority；顯示 defenseZone / invalidLevel / takeProfitZone / riskReduceZone / exitObservationZone。
- 本階段未接資料源；未建立 runtime；未建立 quote polling / scheduler / webhook / crawler；未連 Supabase；未發外部 request；未讀 env secret。
- 未新增 SQL migration；未新增 API route；未修改 Intraday Defense API route / fixture builder / V30 contract；未修改 Holding Defense API route / UI component；未修改 War Room；未新增 mock-data；未寫入資料。
- 未修改 services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Intraday Defense UI Integration（[docs/intraday-defense-ui-integration.md](docs/intraday-defense-ui-integration.md)）。

### V31

Intraday Defense Fixture API：

- 新增 `docs/intraday-defense-fixture-api.md`：定義盤中防守 fixture-only API（A–H 八節），含 API Endpoint（`GET /api/portfolio/intraday-defense`）、與 V30 的關係、Fixture Data Rules、No-DANGER Guard、Output Shape、Safety Language 與 Future Implementation Gate（V32 Intraday Defense UI Integration → V33 Runtime Pilot）。
- 新增 `use-cases/intraday-defense/build-intraday-defense-fixture-contract.ts`：pure builder（type-only import V30 contract 與 position-strategy `PriceZone`），輸出 `IntradayDefenseFixtureResponse` / `IntradayDefenseFixtureSummary`；mock_or_contract / sourceMode = fixture / runtimeMode = spec_only / contractVersion = apiContractVersion = fixtureVersion = V31；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不 Date.now、不 new Date、不 fetch、不 Supabase、不 process.env、不寫資料。
- 新增 `app/api/portfolio/intraday-defense/route.ts`：`GET /api/portfolio/intraday-defense`，`NextResponse.json` 回傳 builder payload（固定 generatedAt），`dynamic = 'force-dynamic'`、`Cache-Control: no-store`；無 POST/PUT/DELETE/PATCH、不 fetch、不 axios、不 Supabase、不讀 env、不 Date.now、不 new Date。
- 新增 `scripts/validate-intraday-defense-fixture-api.ts`：10 gates（required_files / required_phrases / builder_checks / builder_no_clock / route_checks / route_forbidden / payload_checks / package_checks / readme_checks / safety），import builder 實際呼叫驗證版本三欄 === V31、responseSource=mock_or_contract、sourceMode=fixture、runtimeMode=spec_only、alerts≥10、summary.totalAlerts===alerts.length、每筆 runtimeMode/flags/notExit/notTrade/highConfidence、覆蓋 12 種主要 state、priceVerified=false → zones null + 非 DANGER、STALE / MAJOR_CONFLICT / FALLBACK_CACHE 皆非 DANGER；safety scan 只對 builder / route 嚴格掃描（含禁止 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker）。
- 新增 `npm run test:intraday-defense-fixture-api`；同步更新 `scripts/validate-intraday-holding-defense-runtime-spec.ts`（將 V31 sanctioned 的 `app/api/portfolio/intraday-defense/route.ts` 從 V30 forbidden 清單移除，附說明註解，其餘安全不變）。
- 新增 `GET /api/portfolio/intraday-defense`；Intraday Defense Fixture API 將 V30 contract 轉成 fixture-only API；顯示 INTRADAY_NORMAL / DEFENSE_ZONE_APPROACHING / DEFENSE_ZONE_BREACHED / PROFIT_GIVEBACK_WARNING / RISK_REDUCTION_WATCH / FAST_DROP_WARNING / TREND_BREAK_WARNING / PRICE_NOT_VERIFIED / STALE_DATA / SOURCE_CONFLICT / FALLBACK_ONLY / DATA_INSUFFICIENT；顯示 cooldown / dedup；顯示 fixture data 不是即時資料 / 不是投資建議。
- 本階段未接資料源；未建立 runtime；未建立 quote polling / scheduler / webhook / crawler / broker connector；未連 Supabase；未發外部 request；未讀 env secret。
- 未新增 SQL migration；未新增 UI；未修改 app/holdings/page.tsx；未修改 components / War Room / Holding Defense API route / Holding Defense UI component；未新增 mock-data；未寫入資料。
- 未修改 services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Intraday Defense Fixture API（[docs/intraday-defense-fixture-api.md](docs/intraday-defense-fixture-api.md)）。

### V30

Intraday Holding Defense Runtime Spec：

- 新增 `docs/intraday-holding-defense-runtime-spec.md`：定義未來盤中持股防守 runtime governance（A–O 十五節），含 Core Philosophy、Intraday Runtime Inputs、Intraday Defense States、Intraday Alert Levels、Trigger Rules、Cooldown Rules、Dedup Rules、Recovery Rules、Data Quality Downgrade Rules、Output Rules、Runtime Readiness Gate、Safety Language 與 Future Implementation Gate（V31 Runtime Pilot → V32 Intraday Holding Defense Runtime）。
- 新增 `use-cases/intraday-defense/intraday-holding-defense-runtime-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 無 new Date / 不寫資料；contract 不硬寫 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker 等 runtime source names，改 type-only import runtime-data 與 position-strategy 既有型別），定義 `IntradayHoldingDefenseState`、`IntradayHoldingDefenseAlertLevel`、`IntradayHoldingDefenseRuntimeMode`、`IntradayHoldingDefenseTriggerType`、`IntradayHoldingDefenseCooldownPolicy`、`IntradayHoldingDefenseDedupRecord`、`IntradayHoldingDefenseTriggerRule`、`IntradayHoldingDefenseAlertItem`、`IntradayHoldingDefenseRuntimeReadinessChecklist`、`IntradayHoldingDefenseRuntimeSpecBundle`，與 `INTRADAY_HOLDING_DEFENSE_CONTRACT_VERSION` / `INTRADAY_HOLDING_DEFENSE_ALLOWED_STATES` / `INTRADAY_HOLDING_DEFENSE_ALLOWED_ALERT_LEVELS` / `INTRADAY_HOLDING_DEFENSE_TRIGGER_TYPES` / `INTRADAY_HOLDING_DEFENSE_SAFETY_LABELS` / `INTRADAY_HOLDING_DEFENSE_DISALLOWED_TERMS`。
- Intraday Holding Defense Runtime Spec 定義未來盤中持股防守 runtime governance：定義 INTRADAY_NORMAL / DEFENSE_ZONE_APPROACHING / DEFENSE_ZONE_BREACHED / INVALID_LEVEL_APPROACHING / INVALID_LEVEL_BREACHED / PROFIT_GIVEBACK_WARNING / RISK_REDUCTION_WATCH / FAST_DROP_WARNING / TREND_BREAK_WARNING / PRICE_NOT_VERIFIED / STALE_DATA / SOURCE_CONFLICT / FALLBACK_ONLY / DATA_INSUFFICIENT；定義 cooldown / dedup；定義 no-DANGER guard（fallback-only data 不得觸發 DANGER、stale data 不得觸發 DANGER、source conflict 不得觸發 DANGER）；定義 dry-run / no-write / kill switch / rollback readiness。
- 新增 `scripts/validate-intraday-holding-defense-runtime-spec.ts`：spec-only checker，8 gates（required_files / required_phrases / contract_checks / constant_checks / package_checks / readme_checks / negation_context / safety），import contract constants 驗證版本 V30、states ≥ 14、5 個 alert levels、9 個 trigger types、安全 labels、disallowed terms；negation-context 確保「自動出場 / 自動停損 / 賣出價」只在否定語境；safety scan 只對 contract code file 嚴格掃描（含禁止硬寫 twse/tpex/yahoo/finmind/tradingview/yfinance/factset/broker，不因 docs 治理說明誤判）。
- 新增 `npm run test:intraday-holding-defense-runtime-spec`。
- V30 不接真資料；V30 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler / broker connector。
- 未連 Supabase；未發外部 request；未讀 env secret；未新增 SQL migration；未新增 API route；未新增 UI；未新增 mock-data；未寫入資料。
- 未修改 app / components / War Room / Holding Defense API route / Holding Defense UI component / services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Intraday Holding Defense Runtime Spec（[docs/intraday-holding-defense-runtime-spec.md](docs/intraday-holding-defense-runtime-spec.md)）。

### V29

Holding Defense Tracker UI Integration：

- 新增 `docs/holding-defense-tracker-ui-integration.md`：定義持股防守追蹤 UI 整合（A–I 九節），含 Data Source Boundary（UI 只讀 `/api/portfolio/holding-defense`、不直接 fetch 外部 URL / Supabase / env / runtime connector）、UI Placement、UI Sections、Tracker Item Card Fields、Zone Display Rules、State Display Rules、Safety Language 與 Future Implementation Gate（V30 Runtime Pilot → V31 Intraday Holding Defense Runtime）。
- 新增 `components/holding-defense-tracker.tsx`：`"use client"` client component，只 `fetch('/api/portfolio/holding-defense')`（唯一內部端點），type-only import `HoldingDefenseTrackerResponse` / `HoldingDefenseTrackerItem`；顯示 loading / error 安全 fallback（error 不顯示假資料）、fixture-only warning banner、summary cards（totalHoldings / normalObservationCount / defenseZoneNearCount / defenseZoneBrokenCount / profitProtectionActiveCount / riskReductionActiveCount / dataInsufficientCount / priceNotVerifiedCount / sourceConflictCount / staleDataCount / highConfidenceConclusionAllowed）、每張 tracker card（stockId / stockName / trackerState 九種狀態中文化 / alertLevel / holdingState / holdingActionState / holdingImpact / priceVerified / priceVerificationStatus / dataQualityStatus / 成本 / 現價 / 損益 / peak / drawdown / defenseZone / invalidLevel / profitProtectionZone / takeProfitZone / riskReduceZone / exitObservationZone / trendBreakWarning / shortAttackRisk / support / ma / volume / riskReduceObservation / waitForReclaimCondition / nextObservation / warnings / missingDataFields / requiredVerification / notExitSignal / notTradeAdvice / highConfidenceConclusionAllowed）、zone 為 null 顯示「資料不足 / 未允許精準價位」、safety footer；不 axios、不 Supabase、不 process.env、不 Date.now / new Date、不 import builder / route。
- 修改 `app/holdings/page.tsx`：import 並在 PortfolioValuationRadar 下方渲染 `<HoldingDefenseTracker />`，未移除既有任何模組。
- 新增 `scripts/validate-holding-defense-tracker-ui-integration.ts`：fixture-only checker，9 gates（required_files / required_phrases / component_checks / component_field_checks / component_safety / page_integration / package_checks / readme_checks / safety），驗證 component 含 33 必要字串 + 32 欄位字串、只 fetch 內部 `/api/portfolio/holding-defense`、無 axios / Supabase / process.env / Date.now / new Date / DB write / 外部來源 token / 外部 URL、未 import builder / route，holdings page 有 import 並渲染 `<HoldingDefenseTracker />`。
- 新增 `npm run test:holding-defense-tracker-ui-integration`；同步更新 `scripts/validate-holding-defense-tracker-api-contract.ts`（將 V29 sanctioned 的 `components/holding-defense-tracker.tsx` 從 V27 forbidden 清單移除，附說明註解，其餘安全不變）。
- Holding Defense Tracker UI Integration 將 V27 `/api/portfolio/holding-defense` 接進 holdings page；顯示 fixture-only 持股防守追蹤卡；顯示 NORMAL_OBSERVATION / DEFENSE_ZONE_NEAR / DEFENSE_ZONE_BROKEN / PROFIT_PROTECTION_ACTIVE / RISK_REDUCTION_ACTIVE / DATA_INSUFFICIENT / PRICE_NOT_VERIFIED / SOURCE_CONFLICT / STALE_DATA；顯示 holdingImpact；顯示 takeProfitZone；顯示 priceVerified / priceVerificationStatus / dataQualityStatus。
- 本階段未接資料源；未建立 runtime；未建立 quote polling / scheduler / webhook / crawler；未連 Supabase；未發外部 request；未讀 env secret。
- 未新增 SQL migration；未新增 API route；未修改 Holding Defense API route / contract / builder；未修改 War Room；未新增 mock-data；未寫入資料。
- 未修改 services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Holding Defense Tracker UI Integration（[docs/holding-defense-tracker-ui-integration.md](docs/holding-defense-tracker-ui-integration.md)）。

### V28

Runtime Data Pipeline Spec：

- 新增 `docs/runtime-data-pipeline-spec.md`：定義未來 runtime data pipeline governance（A–N 十四節），含 Core Philosophy、Source Priority、Pipeline Stages、Price Verification Rules、Freshness Guard、Source Conflict Guard、Data Quality Gate、Runtime Readiness Gate、Consumer Integration Rules、Production Write Guard、Safety Language 與 Future Implementation Gate（V29 Runtime Pilot → V30 Intraday Holding Defense Runtime）。
- 新增 `use-cases/runtime-data/runtime-data-pipeline-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 不寫資料；contract 只用 generic source categories，不硬寫 TWSE / TPEx / Yahoo / FinMind / TradingView / yfinance 等 runtime source names），定義 `RuntimeSourcePriority`、`RuntimePipelineStage`、`RuntimePriceVerificationStatus`、`RuntimeFreshnessStatus`、`RuntimeSourceConflictStatus`、`RuntimeDataQualityStatus`、`RuntimeSourceConfidence`、`RuntimeConsumerType`、`RuntimePilotReadinessStatus`、`RuntimeSourcePolicy`、`RuntimePriceVerificationSnapshot`、`RuntimePipelineGuardResult`、`RuntimeConsumerDeliveryRule`、`RuntimePilotReadinessChecklist`、`RuntimeDataPipelineContractBundle`，與 `RUNTIME_DATA_PIPELINE_CONTRACT_VERSION` / `RUNTIME_DATA_PIPELINE_ALLOWED_STAGES` / `RUNTIME_DATA_PIPELINE_SOURCE_PRIORITY` / `RUNTIME_DATA_PIPELINE_DATA_QUALITY_STATUSES` / `RUNTIME_DATA_PIPELINE_SAFETY_LABELS` / `RUNTIME_DATA_PIPELINE_DISALLOWED_TERMS`。
- Runtime Data Pipeline Spec 定義未來 runtime data pipeline governance：定義 source priority、price verification pipeline、stale guard、source conflict downgrade、fallback-only downgrade、data quality gate、production write guard、runtime readiness gate；定義 SOURCE_DISCOVERY / SOURCE_AUTHORIZATION_CHECK / RAW_INGESTION / NORMALIZATION / PRICE_VERIFICATION / FRESHNESS_CHECK / SOURCE_CONFLICT_CHECK / DATA_QUALITY_GATE / READ_MODEL_PROJECTION / CONSUMER_DELIVERY / PRODUCTION_WRITE_BLOCKED；定義 OFFICIAL_OR_LICENSED / BROKER_OR_AUTHORIZED / VALIDATED_SECONDARY / FALLBACK_CACHE / MANUAL_VERIFIED / NOT_AVAILABLE；fallback-only data 不得觸發 DANGER、stale data 不得觸發 DANGER。
- 新增 `scripts/validate-runtime-data-pipeline-spec.ts`：spec-only checker，8 gates（required_files / required_phrases / contract_checks / constant_checks / package_checks / readme_checks / negation_context / safety），import contract constants 驗證版本號 V28、allowed stages ≥ 11、source priority 次序完全正確、9 個 data quality statuses、安全 labels、disallowed terms；safety scan 只對 contract code file 嚴格掃描（含禁止 contract 硬寫 twse/tpex/yahoo/finmind/tradingview/yfinance/factset 等 runtime source token，不因 docs 治理說明誤判）。
- 新增 `npm run test:runtime-data-pipeline-spec`。
- V28 不接真資料；V28 不建立 runtime；本階段未接資料源；未建立 quote polling / scheduler / webhook / crawler。
- 未連 Supabase；未發外部 request；未讀 env secret；未新增 SQL migration；未新增 API route；未新增 UI；未新增 mock-data；未寫入資料。
- 未修改 app / components / War Room / Holding Defense API route / services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Runtime Data Pipeline Spec（[docs/runtime-data-pipeline-spec.md](docs/runtime-data-pipeline-spec.md)）。

### V27

Holding Defense Tracker API Contract：

- 新增 `docs/holding-defense-tracker-api-contract.md`：定義 Holding Defense Tracker API Contract（A–J 十節），含 API Endpoint（`GET /api/portfolio/holding-defense`）、與 V24/V25/V26 的關係、Tracker Scope、九種 Tracker States（NORMAL_OBSERVATION / DEFENSE_ZONE_NEAR / DEFENSE_ZONE_BROKEN / PROFIT_PROTECTION_ACTIVE / RISK_REDUCTION_ACTIVE / DATA_INSUFFICIENT / PRICE_NOT_VERIFIED / SOURCE_CONFLICT / STALE_DATA）、Price Verification Rules、Output Rules、Safety Language、War Room Relationship 與 Future Implementation Gate（V28 Runtime Data Pipeline Spec → V29 Runtime Pilot → V30 Intraday Holding Defense Runtime）。
- 新增 `use-cases/holding-defense/holding-defense-tracker-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 不寫資料），type-only import 自 Position Strategy contract，定義 `HoldingDefenseTrackerState`、`HoldingDefenseAlertLevel`、`HoldingDefenseSourceMode`、`HoldingDefenseTrackerItem`、`HoldingDefenseTrackerSummary`、`HoldingDefenseTrackerResponse`，與 `HOLDING_DEFENSE_TRACKER_CONTRACT_VERSION` / `HOLDING_DEFENSE_TRACKER_API_PATH` / `HOLDING_DEFENSE_TRACKER_ALLOWED_STATES` / `HOLDING_DEFENSE_TRACKER_SAFETY_LABELS` / `HOLDING_DEFENSE_TRACKER_DISALLOWED_TERMS`。
- 新增 `use-cases/holding-defense/build-holding-defense-tracker-contract.ts`：pure builder，import `buildPositionStrategyFixtureBundle`（用 V26 fixture plans 產生 tracker items），輸出 mock_or_contract / fixture-only payload；generatedAt 由 input 傳入或固定 `2026-06-23T00:00:00.000Z`，不 Date.now、不 new Date、不 fetch、不 Supabase、不 process.env、不寫資料；至少 5 筆涵蓋 NORMAL_OBSERVATION / DEFENSE_ZONE_NEAR / PROFIT_PROTECTION_ACTIVE / RISK_REDUCTION_ACTIVE / PRICE_NOT_VERIFIED，priceVerified=false 時 zones 全 null、無 DANGER、highConfidenceConclusionAllowed=false。
- 新增 `app/api/portfolio/holding-defense/route.ts`：`GET /api/portfolio/holding-defense`，`NextResponse.json` 回傳 builder payload（固定 generatedAt），`dynamic = 'force-dynamic'`、`Cache-Control: no-store`；無 POST/PUT/DELETE/PATCH、不 fetch、不 axios、不 Supabase、不讀 env、不 Date.now、不 new Date。
- 新增 `scripts/validate-holding-defense-tracker-api-contract.ts`：12 gates（required_files / required_phrases / contract_checks / builder_checks / builder_no_clock / route_checks / route_forbidden / payload_checks / negation_context / package_checks / readme_checks / safety），import builder 實際呼叫驗證 contractVersion / apiContractVersion / trackerFixtureVersion === V27、responseSource=mock_or_contract、sourceMode=fixture、items≥5、summary.totalHoldings === items.length、每筆三個 read-only flag false / notExitSignal / notTradeAdvice / highConfidence、無 DANGER、五種 state 覆蓋、priceVerified=false → zones null；safety scan 只對 contract / builder / route 嚴格掃描（不因 docs 資料源說明誤判）。
- 新增 `npm run test:holding-defense-tracker-api-contract`。
- 新增 `GET /api/portfolio/holding-defense`；Holding Defense Tracker API Contract 定義持股即時防守追蹤 API shape，定義 NORMAL_OBSERVATION / DEFENSE_ZONE_NEAR / DEFENSE_ZONE_BROKEN / PROFIT_PROTECTION_ACTIVE / RISK_REDUCTION_ACTIVE / DATA_INSUFFICIENT / PRICE_NOT_VERIFIED / SOURCE_CONFLICT / STALE_DATA、holdingImpact、takeProfitZone、priceVerified / PriceVerificationStatus。
- 本階段未接資料源；未建立 runtime；未建立 quote polling / scheduler / push notification；未連 Supabase；未發外部 request；未讀 env secret。
- 未新增 SQL migration；未新增 UI；未修改 War Room；未新增 mock-data；未寫入資料。
- 未修改 services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Holding Defense Tracker API Contract（[docs/holding-defense-tracker-api-contract.md](docs/holding-defense-tracker-api-contract.md)）。

### V26

Position Strategy Fixture Adapters：

- 新增 `docs/position-strategy-fixture-adapters.md`：定義 Position Strategy Fixture Adapters（A–I 九節），把 V24 Position Strategy Plan 與 V25 Dynamic Opportunity Pool / Price Verification 用 fixture-only sample 串起來，含 Fixture Scope、六種 fixture plan、War Room Integration、UI Display Rules、Price Verification Fixture States、Opportunity Pool Fixture States、Safety Language 與 Future Implementation Gate（V27 Holding Defense Tracker API Contract → V28 Runtime Data Pipeline Spec → V29 Runtime Pilot）。
- 新增 `use-cases/position-strategy/position-strategy-fixture-adapters.ts`：deterministic fixture-only adapter，export `buildPositionStrategyFixtureBundle(input)` 與 `BuildPositionStrategyFixtureBundleInput`，產生 6 筆 PositionStrategyPlan（ENTRY_OBSERVATION / HOLDING_DEFENSE / PROFIT_PROTECTION / RISK_REDUCTION / NO_TOUCH / DATA_INSUFFICIENT，sample 股票 3019 亞光 / 4966 譜瑞 / 2743 山富 / 5347 世界 / 2455 全新 / 4979 華星光）；priceVerified=true 才填 sample PriceZone（priceSource = "Fixture sample only"、priceCheckedAt = 由 caller 傳入、safetyLabel 標示 fixture / 非即時資料 / 不是買賣指令），priceVerified=false 時所有 zone 與 riskRewardRatio 皆為 null；所有 generatedAt / priceCheckedAt 由 caller 傳入，不 Date.now、不 new Date、不 fetch、不 Supabase、不 process.env、不 import runtime builder。
- 修改 `use-cases/war-room/war-room-intelligence-contract.ts`：type-only import `PositionStrategyPlan`，於 `WarRoomIntelligenceSnapshot` 新增 positionStrategyPlans / entryObservationPlans / holdingDefensePlans / profitProtectionPlans / riskReductionPlans / positionNoTouchPlans / positionDataInsufficientPlans 與 positionStrategyFixtureVersion = V26（不破壞既有 V19/V20/V22 欄位）。
- 修改 `use-cases/war-room/war-room-engine-fixture-adapters.ts`：import `buildPositionStrategyFixtureBundle`，`buildWarRoomEngineFixtureBundle(mode, generatedAt = FIXTURE_TS)` 將 position strategy plans 併入 `WarRoomEngineFixtureBundle`，保留所有既有 V22 fixture data。
- 修改 `use-cases/war-room/build-war-room-read-model-contract.ts`：把 generatedAt 傳入 fixture bundle，將 position strategy fields 放入 output，新增 positionStrategyFixtureVersion = V26；保留 apiContractVersion = V20、responseSource = mock_or_contract、sourceMode = fixture、fixtureAdapterVersion = V22 與三個 read-only flag false。
- 修改 `components/war-room-dashboard.tsx`（未新增新 UI component 檔案）：新增 Position Strategy Plans 顯示區與 PositionPlanCard，顯示六類 plan 的 count、stockId / stockName / planType / priceVerified / priceVerificationStatus / dataQualityStatus / 成本 / 現價 / 損益 / 各 PriceZone（含 holdingImpact、takeProfitZone）/ riskRewardRatio / holdingState / setupTags / warnings / observationSummary 與 notEntrySignal / notExitSignal / notTradeAdvice / highConfidenceConclusionAllowed；zone 為 null 時顯示「資料不足 / 未允許精準價位」；labels 標示「進場觀察區，不是買進價 / 策略失效觀察價，不是自動停損價 / 觀察目標區，不是目標價 / takeProfitZone 不是賣出價 / 出場觀察區不是賣出價 / 風險降低觀察不是賣出指令 / No Touch 是風控提醒，不是賣出指令 / fixture data 不是即時資料 / fixture data 不是投資建議」；仍只 fetch `/api/war-room`。
- 新增 `scripts/validate-position-strategy-fixture-adapters.ts`：fixture-only checker，7 gates（required_files / required_phrases / adapter_checks / warroom_checks / ui_checks / payload_checks / safety），import `buildPositionStrategyFixtureBundle` 與 `buildWarRoomReadModelContract` 實際呼叫驗證 bundle.contractVersion=V24 / sourceMode=fixture / plans>=6 / 各類 plan>=1 / 每筆 plan 三個 read-only flag false / notTradeAdvice true / highConfidence false、ENTRY notEntrySignal、HOLDING_DEFENSE notExitSignal + holdingImpact、PROFIT_PROTECTION takeProfitZone、NO_TOUCH noTouchReason、DATA_INSUFFICIENT priceVerified false + 全 zone null，並驗證 War Room output 含 positionStrategyFixtureVersion=V26 與六類 plan 非空；safety scan：adapter 嚴格掃 fetch / axios / Supabase / env / Date.now / new Date / DB write / 外部來源 token，War Room code files 掃 fetch / Supabase / env / DB write / 來源 token，component 僅允許內部 `/api/war-room` fetch。
- 新增 `npm run test:position-strategy-fixture-adapters`。
- Position Strategy Fixture Adapters 把 V24 Position Strategy Plan 與 V25 Dynamic Opportunity Pool / Price Verification 串進 War Room；新增 positionStrategyPlans / entryObservationPlans / holdingDefensePlans / profitProtectionPlans / riskReductionPlans / positionNoTouchPlans / positionDataInsufficientPlans 與 positionStrategyFixtureVersion = V26；War Room UI 顯示 Entry / Holding Defense / Profit Protection / Risk Reduction / No Touch / Data Insufficient fixture examples。
- 本階段未接資料源；未建立 runtime；未建立 Holding Defense Tracker API；未連 Supabase；未發外部 request；未讀 env secret。
- 未新增 SQL migration；未新增 API route；未新增新 UI component；未新增 mock-data；未寫入資料。
- 未修改 services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Position Strategy Fixture Adapters（[docs/position-strategy-fixture-adapters.md](docs/position-strategy-fixture-adapters.md)）。

### V25

Dynamic Opportunity Pool & Price Verification Spec：

- 新增 `docs/dynamic-opportunity-price-verification-spec.md`：定義 Dynamic Opportunity Pool & Price Verification（A–N 十四節），把 V9 的主升段觀察池、飆股預備隊、禁碰池、主流產業池納入現有架構，含 Core Philosophy、八個 pool、A/B/C/D 股票處理等級、Price Verification Source Priority、Price Verification Rules、Main Uptrend / Breakout Prep / No Touch / Sector Rotation logic、Dynamic Pool Output Rules、War Room Integration、Safety Language 與 Future Implementation Gate（V26 Position Strategy Fixture Adapters → V27 Holding Defense Tracker API Contract → V28 Runtime Data Pipeline Spec → V29 Runtime Pilot）。
- 新增 `use-cases/opportunity-pool/dynamic-opportunity-pool-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 不寫資料），定義 `DynamicOpportunityPoolType`、`OpportunityProcessingTier`、`OpportunityDataQualityStatus`、`OpportunityPriceVerificationStatus`、`PriceSourcePriority`、`PriceFreshnessStatus`、`SourceConfidenceLevel`、`SectorRotationStatus`、`PriceVerificationRecord`、`DynamicOpportunityPoolItem`、`SectorRotationPoolItem`、`DynamicOpportunityPoolBundle`，與 `DYNAMIC_OPPORTUNITY_CONTRACT_VERSION` / `DYNAMIC_OPPORTUNITY_ALLOWED_POOL_TYPES` / `DYNAMIC_OPPORTUNITY_ALLOWED_PROCESSING_TIERS` / `DYNAMIC_OPPORTUNITY_PRICE_SOURCE_PRIORITY` / `DYNAMIC_OPPORTUNITY_SAFETY_LABELS` / `DYNAMIC_OPPORTUNITY_DISALLOWED_TERMS`。
- Dynamic Opportunity Pool 把 V9 的主升段觀察池、飆股預備隊、禁碰池、主流產業池納入現有架構；定義 MAIN_UPTREND_POOL、BREAKOUT_PREP_POOL、HOLDING_PRIORITY_POOL、DAILY_WATCH_POOL、LOW_COVERAGE_POOL、NO_TOUCH_POOL、SECTOR_ROTATION_POOL、DATA_INSUFFICIENT_POOL；定義 A/B/C/D 股票處理等級；定義 priceVerified / PriceVerificationStatus；定義 official / licensed / secondary / fallback source priority；定義 stale guard；定義 source conflict downgrade。Yahoo / FinMind / TradingView / yfinance-like 一律歸為 VALIDATED_SECONDARY，不得單獨成為唯一正式來源、不得單獨產生高信心結論。
- 新增 `scripts/validate-dynamic-opportunity-price-verification-spec.ts`：spec-only checker，8 gates（required_files / required_phrases / contract_checks / constant_checks / package_checks / readme_checks / negation_context / safety），import contract constants 驗證版本號 V25、pool types >= 8、processing tiers >= 6、price source priority 次序完全正確、安全 labels、disallowed terms，並以 negation-context 確保「買進清單 / 賣出指令 / 買進指令 / 追價清單」與 disallowed 指令詞只在否定語境出現；safety scan 只對 contract code file 嚴格掃描（不因 docs 的資料源優先順序說明誤判）。
- 新增 `npm run test:dynamic-opportunity-price-verification-spec`。
- 本階段未接資料源；未建立 runtime；未建立 scanner runtime；未建立 price verification runtime；未連 Supabase；未發外部 request；未讀 env secret。
- 未新增 SQL migration；未新增 API route；未新增 UI；未新增 mock-data；未寫入資料。
- 未修改 app / components / services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Dynamic Opportunity Pool & Price Verification Spec（[docs/dynamic-opportunity-price-verification-spec.md](docs/dynamic-opportunity-price-verification-spec.md)）。

### V24

Position Strategy Plan Spec：

- 新增 `docs/position-strategy-plan-spec.md`：定義 Position Strategy Plan（A–L 十二節），把 KD / KDJ / MACD / 5MA / 10MA / 20MA / 日 200MA / 週 30MA / 扣三低 / 量縮回測 / 爆量轉強 / 支撐壓力 / 風報比 / 持股成本 / 即時警報 / 族群大盤狀態，轉成條件式策略觀察計畫，含 Core Philosophy、六種 plan、Price Verification Dependency、Entry / Holding Defense / Profit Protection / Risk Reduction / No Touch logic、War Room Integration、Safety Language 與 Future Implementation Gate（V25 Dynamic Opportunity Pool & Price Verification Spec → V26 Position Strategy Fixture Adapters → V27 Holding Defense Tracker API Contract → V28 Runtime Data Pipeline Spec）。
- 新增 `use-cases/position-strategy/position-strategy-plan-contract.ts`：types + 靜態安全 constants only（無 runtime / 無 fetch / 無 Supabase / 無 process.env / 無 Date.now / 不寫資料），定義 `PositionStrategyPlanType`（ENTRY_OBSERVATION / HOLDING_DEFENSE / PROFIT_PROTECTION / RISK_REDUCTION / NO_TOUCH / DATA_INSUFFICIENT）、`PositionStrategyDataQualityStatus`、`PositionStrategySourceMode`、`PriceVerificationStatus`、`PositionStrategyRiskRewardGrade`、`HoldingState`、`HoldingActionState`、`PriceZone`、`PositionStrategyPlan`、`PositionStrategyPlanBundle`，與 `POSITION_STRATEGY_CONTRACT_VERSION` / `POSITION_STRATEGY_SAFETY_LABELS` / `POSITION_STRATEGY_ALLOWED_PLAN_TYPES` / `POSITION_STRATEGY_DISALLOWED_TERMS`。
- Position Strategy Plan 把技術指標轉成條件式策略觀察計畫，新增 ENTRY_OBSERVATION / HOLDING_DEFENSE / PROFIT_PROTECTION / RISK_REDUCTION / NO_TOUCH / DATA_INSUFFICIENT；定義進場觀察區、轉強確認條件、策略失效觀察價、防守區、獲利保護區、takeProfitZone、holdingImpact、風險降低觀察、出場觀察區、不追價區，以及 priceVerified / PriceVerificationStatus。
- 新增 `scripts/validate-position-strategy-plan-spec.ts`：spec-only checker，8 gates（required_files / required_phrases / contract_checks / constant_checks / package_checks / readme_checks / negation_context / safety），import contract constants 實際驗證版本號、六種 plan type、安全 labels、disallowed terms，並以 negation-context 確保「買進價 / 賣出價 / 目標價 / 停損價」只在否定語境出現，safety scan 只對 contract code file 嚴格掃描（不因 docs 的資料源優先順序說明誤判）。
- 新增 `npm run test:position-strategy-plan-spec`。
- 安全標示：**V24 只定義 Holding Defense Plan** 的資料合約與語義，**真正的 Holding Defense Tracker API 留到 V27**（V24 不建立 Holding Defense Tracker API、不讀持股資料、不計算即時損益）。
- 本階段未接資料源；未建立 runtime；未連 Supabase；未發外部 request；未讀 env secret。
- 未新增 SQL migration；未新增 API route；未新增 UI；未新增 mock-data；未寫入資料。
- 未修改 app / components / services / repositories；未 import runtime builder；未產生買賣指令。

架構文件清單新增：Position Strategy Plan Spec（[docs/position-strategy-plan-spec.md](docs/position-strategy-plan-spec.md)）。

### V23

War Room UI Polish：

- 新增 `docs/war-room-ui-polish.md`：定義戰情室 UI 打磨規格（A–K 十一節），含 UI Polish Goals（四模式切換 / 狀態燈 / 七大 sections / fixture 標示 / sourceSummary / dataQualitySummary / fixture items card / 空狀態 / 手機版 / 不新增 chart library）、Above-the-Fold Layout（第一屏必須顯示 Allen Stock War Room / marketStatus / primaryAlertLevel / highConfidenceConclusionAllowed / responseSource / sourceMode / fixtureAdapterVersion / generatedAt / 安全提示 badge）、Mode Switcher Polish（四模式 subtitle）、Seven Sections Polish（完整 section card 含 warnings / notes / fallback / unavailableReason）、Fixture Items Polish（六大 item sections 各自的 card list 規格含安全標籤）、Source Summary / Data Quality Summary Polish、Mobile-Friendly Polish、Safety Language（14 條）與 Future Implementation Gate（V24 Runtime Data Pipeline Spec → V25 Runtime Pilot → V26 Intraday Alert Runtime → V27 Push Notification）。
- 修改 `components/war-room-dashboard.tsx`：V23 UI Polish 重構：新增 `Allen Stock War Room` 標題、mode button 加 subtitle（盤前今日研究/技術候選/觀察點；盤中即時警報/持股/廣度；盤後收盤結構/歸因/明日觀察；即時警報中心/cooldown/dedup）、Header 常駐顯示 `responseSource = mock_or_contract` 與 `fixture only · 非即時資料 · not trade advice` badge；狀態總覽 summary cards 顯示 marketStatus / primaryAlertLevel / overallStatus / `highConfidenceConclusionAllowed = false` / sourceMode / fixtureAdapterVersion / apiContractVersion / responseSource；七大 sections 各自獨立 `SectionCardView` 含 sourceEngine / available / dataQualityStatus badge / fallback 降級提示 / warnings / notes；六大 item sections 各有獨立 card component（`PortfolioRiskCard` / `ResearchTopPickCard` / `TechnicalCandidateCard` / `IntradayAlertCard` / `AvoidItemCard` / `ObservationPointCard`）；`TechnicalCandidateCard` 使用安全標籤（觀察價，不是買進價 / 失效觀察價，不是自動停損價 / 觀察目標區，不是目標價）；`AvoidItemCard` 標示「Avoid / No Touch 是風控提醒，不是賣出指令」；Source Summary 用 `SourceSummaryCard` 顯示 fallback / req / supabase / write flags；Data Quality Summary 顯示全六個 count 欄位與 highConfidenceConclusionAllowed；Safety Footer 永遠顯示、含 `前版 sourceMode = spec_only（V21），V22 升級為 fixture（fixtureAdapterVersion = V22）` 歷史標注；仍只 fetch `/api/war-room`，不 import builder / engine runtime / Supabase。
- 新增 `scripts/validate-war-room-ui-polish.ts`：V23 UI polish checker，4 gates（required_files / required_phrases / component_checks / safety），component 必須含 33 個必要字串（含 `Allen Stock War Room` / `fixtureAdapterVersion` / `mock_or_contract` / `sourceMode` / `highConfidenceConclusionAllowed` / 四模式 / 七 section IDs / 六 item arrays / `觀察價，不是買進價` / `失效觀察價，不是自動停損價` / `觀察目標區，不是目標價` / `不是賣出指令` / `不自動下單` / `不產生買賣指令` / `資料不足`），safety scan 確認 component 無外部 URL / 外部資料源 / Supabase / axios / process.env / runtime builder import，且 fetch 僅指向 `/api/war-room`，package.json 未新增 chart / renderer 套件，protected files 仍存在，API route / builder / fixture adapter 未被修改或刪除。
- 新增 `npm run test:war-room-ui-polish` npm script。
- 改善 War Room header / mode switcher / summary cards / 七大 sections / fixture item card list / source summary / data quality summary / safety footer。
- 強化 fixture / 非即時資料 / mock_or_contract / highConfidenceConclusionAllowed=false / 不產生買賣指令 UI 標示。
- 本階段未新增新的 API route。
- 未新增新的 UI component（只修改現有 `components/war-room-dashboard.tsx`）。
- 未接資料源；未建立 runtime；未連 Supabase；未發外部 request；未讀 env。
- 未新增 SQL migration；未新增 SQL migration；未寫入資料；未修改 repositories / services。
- 不產生買賣指令；未修改 builder / fixture adapter / API route。

架構文件清單新增：War Room UI Polish（[docs/war-room-ui-polish.md](docs/war-room-ui-polish.md)）。

### V22

War Room Engine Fixture Adapters：

- 新增 `docs/war-room-engine-fixture-adapters.md`：定義戰情室引擎 fixture 介接層（A–I 九節），含 Fixture Data Policy（不是即時 / 不是投資建議 / 不得 PASS / highConfidenceConclusionAllowed=false / 真實代號須標 fixture only）、四大引擎 + Avoid / Observation / Source / DataQuality fixture scope、四模式 fixture 差異、Section / Source / Data Quality fixture rules、Safety Language 與 Future Implementation Gate（V23 Runtime Pipeline Spec → V24 Runtime Pilot → V25 Intraday Runtime → V26 Push Notification）。
- 新增 `use-cases/war-room/war-room-engine-fixture-adapters.ts`：deterministic fixture-only adapter，export `buildWarRoomEngineFixtureBundle(mode)` 與 `WarRoomEngineFixtureBundle`，產生非空 sample（portfolioRiskItems≥3 / researchTopPickItems≥3 / technicalCandidateItems≥3 / intradayAlertItems≥2 / avoidItems≥2 / observationPoints≥4 / sourceSummary≥4）；所有 sample 以「fixture / 非即時資料 / not trade advice」標示，研究目標價一律 `LICENSE_REQUIRED`、價格欄位優先 null、alertLevel 不得 DANGER、`notEntrySignal` / `notTradeAdvice` / `notExitSignal` 齊備、`sourceName = "Fixture only"`、dataQualityStatus 不得 PASS；不 fetch、不 axios、不 Supabase、不讀 env、不 Date.now、不 import runtime builder。
- 改寫 `use-cases/war-room/build-war-room-read-model-contract.ts`：import `buildWarRoomEngineFixtureBundle`，sections / items / sourceSummary / dataQualitySummary 改用 fixture bundle，`sourceMode = fixture`、新增 `fixtureAdapterVersion = V22`、`apiContractVersion = V20`、`responseSource = mock_or_contract`、三個 read-only flag 仍為 false、`highConfidenceConclusionAllowed` 仍為 false、invalid mode 仍 fallback PREMARKET、不產生 DANGER。
- 更新 `scripts/validate-war-room-api-contract.ts`：builder term 改為期待 `fixture` / `fixtureAdapterVersion` / `V22`（不再要求 spec_only），payload 斷言 `sourceMode === "fixture"`、`fixtureAdapterVersion === "V22"`、六大聚合陣列達非空門檻、`sourceSummary.length >= 4` 且無 DANGER；其餘安全不變（apiContractVersion=V20 / responseSource=mock_or_contract / flags false / highConfidence false / no runtime / no external fetch）。
- 新增 `scripts/validate-war-room-engine-fixture-adapters.ts`：fixture-only checker，6 gates（required_files / required_phrases / adapter_checks / builder_checks / payload_checks / safety），import builder 實際呼叫驗證 5 種 mode、metadata、非空陣列門檻、無 DANGER、每筆 item 的 notEntrySignal / notTradeAdvice / notExitSignal，並掃描 adapter / builder 不含 fetch / axios / Supabase / env / yahoo / yfinance / finmind / factset / tradingview / broker / twse / tpex / runtime builder / DB write token。
- 新增 `npm run test:war-room-engine-fixture-adapters`；同步 `npm run test:war-room-api-contract`。
- `/api/war-room` 從 spec_only 空陣列升級為 fixture-only sample output；新增 `fixtureAdapterVersion: V22`、`sourceMode = fixture`；六大聚合陣列變成非空 sample。
- 未接資料源；未建立 runtime；未新增新的 API route；未新增新的 UI。
- 未連 Supabase；未讀取 Supabase secret env key；未發外部 request。
- 未新增 SQL migration；未寫入資料；未新增 mock data。
- 不產生買賣指令；未修改 repositories / services。

### V21

War Room UI Integration：

- 新增 `docs/war-room-ui-integration.md`：定義戰情室前端整合（A–J 十節），含 UI Source Policy（唯一資料入口 `/api/war-room`、不直接 import builder、不接外部資料源、不自行提升 dataQualityStatus、不隱藏 unavailable section）、四模式 UI 行為、七大 sections 顯示規則、aggregated items 空陣列 empty-state、sourceSummary / dataQualitySummary 顯示、Safety Language、Visual Design 與 Future Implementation Gate（V22 Engine Fixture Adapters → V23 Runtime Pipeline → V24 Push Notification）。
- 新增 `components/war-room-dashboard.tsx`：`"use client"` client component，只 `fetch('/api/war-room?mode=<MODE>')`（唯一內部端點），支援四模式 button（預設 PREMARKET）、loading / error 安全 fallback（error 不顯示假資料）、顯示 snapshot metadata（apiContractVersion / responseSource / sourceMode / warRoomMode / marketStatus / primaryAlertLevel / generatedAt / snapshotId）、dataQualitySummary（含 highConfidenceConclusionAllowed=false → 「目前不可輸出高信心結論」）、七大 sections（title / sourceEngine / available / dataQualityStatus / fallbackUsed / unavailableReason / warnings / notes）、聚合明細 empty-state、sourceSummary 與 safety boundary；不 import `buildWarRoomReadModelContract`、不 import engine builder、不 fetch 外部 URL、不用 axios、不連 Supabase、不新增 chart library。
- 修改 `app/page.tsx`：在 `HoldingsTable` 之後、`PortfolioValuationRadarSummary` 之前加入 `<WarRoomDashboard />`，不移除既有任何 Dashboard 模組。
- 新增 `scripts/validate-war-room-ui-integration.ts`：fixture-only UI integration checker，5 gates（required_files / required_phrases / component_checks / page_integration / safety），驗證文件含 22 個必要 phrase、component 含 21 個必要字串、app/page.tsx 有 import 並渲染 `<WarRoomDashboard />` 且保留 PortfolioValuationRadarSummary，並掃描 component / page 不含 `https://` / `http://` / twse / yahoo / finmind / factset / tradingview / broker / axios / Supabase / process.env / runtime builder import，且 component fetch 僅指向 `/api/war-room`、package.json 未新增 chart / renderer 套件。
- 新增 `npm run test:war-room-ui-integration` npm script。
- Dashboard 首頁開始讀 `/api/war-room`，支援 PREMARKET / INTRADAY / POSTMARKET / REALTIME_ALERT，顯示七大 War Room sections 與 sourceSummary / dataQualitySummary 與 mock_or_contract / spec_only / DATA_INSUFFICIENT。
- 未接資料源；未建立 runtime；未新增新的 API route。
- 未連 Supabase；未讀取 Supabase secret env key；未 fetch 外部 URL。
- 未新增 SQL migration；未寫入資料；未新增 mock data。
- 不產生買賣指令；未修改 repositories / services。

### V20

War Room API Contract：

- 新增 `docs/war-room-api-contract.md`：定義 `/api/war-room` 合約（A–I 九節），含 Endpoint（`GET /api/war-room`，`mode` query param）、Response Contract（對齊 `WarRoomIntelligenceSnapshot` + `apiContractVersion: V20` / `responseSource: mock_or_contract` / `sourceMode: spec_only`）、四種模式行為、Source Mode Policy（V20 只能 `spec_only`）、Data Quality Policy（`highConfidenceConclusionAllowed` 必為 false）、Safety Boundary、UI Consumer Contract 與 Future Implementation Gate（V21 UI → V22 Fixture Adapters → V23 Runtime Pipeline → V24 Push Notification）。
- 新增 `use-cases/war-room/build-war-room-read-model-contract.ts`：fixture-only pure builder，回傳 `BuildWarRoomReadModelContractOutput`（extends `WarRoomIntelligenceSnapshot`），所有 section 為 DATA_INSUFFICIENT（Research 為 LICENSE_REQUIRED）、聚合 item 陣列為空、四大引擎 sourceSummary 齊備、invalid mode fallback to PREMARKET；不 fetch、不連 Supabase、不讀 env、不 import runtime builder、不寫資料。
- 新增 `app/api/war-room/route.ts`：只允許 GET，讀取 `mode` query param 後呼叫 `buildWarRoomReadModelContract` 並回傳 JSON（`Cache-Control: no-store`）；不連 Supabase、不發 request、不讀 env、不寫資料、不使用 cookies / session / auth。
- 新增 `scripts/validate-war-room-api-contract.ts`：fixture-only API contract checker，6 gates（required_files / required_phrases / builder_checks / route_checks / runtime_safety / payload_shape），import builder 實際呼叫 pure function 驗證 5 種 mode 行為（valid 回傳同 mode、invalid 回傳 PREMARKET）、metadata 常數、read-only flags、七大 section、`sourceSummary.length >= 4` 與聚合陣列，並掃描 route / builder 不含 fetch / Supabase / env / yfinance / Yahoo / FinMind / TradingView / FactSet / runtime builder / DB write token。
- 新增 `npm run test:war-room-api-contract` npm script。
- 建立 `/api/war-room` mock_or_contract API 合約，支援 `mode=PREMARKET|INTRADAY|POSTMARKET|REALTIME_ALERT`，invalid mode fallback to PREMARKET，輸出 `WarRoomIntelligenceSnapshot` + `apiContractVersion: V20`。
- 本階段只新增 `app/api/war-room/route.ts` 這一個 API route，未新增其他 API route。
- 未接資料源；未建立 runtime；未 import runtime builder。
- 未連 Supabase；未發 request；未讀取 Supabase secret env key。
- 未新增 SQL migration；未新增 UI；未新增 mock data；未寫入資料。
- 不產生買賣指令；未修改 repositories / services。

### V19

War Room Read Model Contract：

- 新增 `docs/war-room-read-model-contract.md`：定義戰情室 read-only 聚合合約（A–P 十六節），含：
  - **Purpose**：War Room Read Model 是所有分析引擎的 read-only 聚合層；不創造資料、不算估值、不算技術指標、不查法人資料、不自行升級警報，只整合四大引擎已驗證輸出。
  - **Input Engine Boundaries**：定義 Valuation / Research / Technical + Risk Reward / Intraday Alert 四引擎各自回答什麼、不回答什麼、輸出欄位方向與降級規則；War Room 不得把任何單一引擎輸出轉換成 actionSignal。
  - **War Room Modes**：盤前 / 盤中 / 盤後 / 即時警報四模式各自的重點與禁止事項。
  - **Seven War Room Sections**：marketStatusLight / realtimeAlerts / portfolioRiskRadar / researchTopPicks / technicalRiskRewardCandidates / avoidList / nextObservationPoints，各含 sourceEngine / displayPurpose / fallbackBehavior / unavailableReason / warnings。
  - **Read Model Data Quality Policy**：section dataQualityStatus 由輸入引擎最低品質決定；DATA_INSUFFICIENT / LICENSE_REQUIRED 必須保留；不得自行升級 WARNING→PASS。
  - **各區塊聚合規則**：Market Status / Portfolio Risk Radar / Research Top Picks / Technical Risk Reward / Intraday Alert / Avoid List / Next Observation Points，逐區定義來源、應顯示、不得顯示。
  - **Snapshot Contract / Type Integration Policy / Safety Boundary / Future Implementation Gate**：V20（War Room API Contract）→ V21（UI Integration）→ V22（Engine Fixture Adapters）→ V23（Runtime Data Pipeline）→ V24（Push Notification）。
- 擴充 `use-cases/war-room/war-room-intelligence-contract.ts`：以 type-only import 串接四大引擎型別（`ResearchTopPick` / `TechnicalRiskRewardCandidate` / `IntradayAlertPayload`，portfolio 以 local `WarRoomPortfolioRiskItem` 對齊），保留既有 export，並新增 `WarRoomSourceSummary` / `WarRoomDataQualitySummary` / `WarRoomPortfolioRiskItem` / `WarRoomAvoidItem` / `WarRoomObservationPoint`，擴充 `WarRoomDataQualityStatus`（加入 `LICENSE_REQUIRED`）、`WarRoomSectionAvailability`（加入 `unavailableReason` / `warnings`）與 `WarRoomIntelligenceSnapshot`（加入 6 個聚合 item 陣列 + `sourceSummary` + `dataQualitySummary`）；types-only，不放 runtime、不 import Supabase、不 import runtime builder、不 fetch、不讀 env，保留 `requestPerformed` / `supabaseConnected` / `productionWritePerformed` read-only invariant。
- 新增 `scripts/validate-war-room-read-model-contract.ts`：fixture-only contract 完整性 checker，5 gates（required_files / required_phrases / contract_checks / type_integration / safety），驗證文件含 24 個必要 phrase、contract 含 24 個必要型別 / 欄位、type-only import 對齊三大引擎型別且無 runtime builder import，並掃描 contract 不含 fetch / Supabase / env / yfinance / FinMind / TradingView / FactSet token。
- 新增 `npm run test:war-room-read-model-contract` npm script。
- 將 Valuation / Research / Technical + Risk Reward / Intraday Alert 四大輸入引擎型別串入 War Room Read Model。
- 定義盤前 / 盤中 / 盤後 / 即時四種模式的 read model 輸出與七大 War Room sections、dataQualitySummary / sourceSummary。
- 未新增 API route；未新增 UI；未接資料源；未建立 runtime。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration；未寫入資料；未新增 mock data。
- 不產生買賣指令；未修改 repositories / services。

### V18E

Technical + Risk Reward Strategy Spec：

- 新增 `docs/technical-risk-reward-strategy-spec.md`：定義 Allen Stock Dashboard 低檔高風報比技術策略引擎規格（A–P 十六節），含：
  - **Purpose**：本模組回答「哪一些股票具備技術低檔、轉強跡象、支撐明確、風報比合理，值得列入觀察」，不回答基本面是否優秀；不取代 Research Center / Valuation Radar / Intraday Alert，不直接產生買點、不產生買賣指令。
  - **Core Boundary**：Technical Strategy Engine 不假裝基本面良好、估值便宜不等於高風報比、高風報比不等於基本面好、技術轉強不等於可以追價、KD 低檔不等於買點、MACD 轉強不等於買點。
  - **Data Requirements**：daily / weekly / intraday OHLCV、均線、KD / KDJ、MACD、量能、支撐壓力、market regime、sector strength 等；缺 K 線 / 成交量 / weekly / 支撐壓力時必須降級。
  - **Technical Setup Taxonomy**：15 種 `TechnicalSetupType`（扣三低 / KD / KDJ / MACD / 均線 / 週 30MA / 日 200MA / 量縮回測 / 爆量突破 / 回測支撐 / 突破壓力 / 低檔打底 / 風報比達標 / 資料不足）。
  - **扣三低 / KD / KDJ / MACD / 均線 / 量價 Rules**：逐項定義觀察條件、限制與未來輸出欄位；均線支援 5MA / 10MA / 20MA / 60MA / 日 200MA / 週 30MA。
  - **Support / Resistance / Invalid Level**：supportZone / resistanceZone / invalidLevel / observationZone / breakoutConfirmationZone；皆為觀察區，非買賣價。
  - **Risk Reward Engine**：`risk = observationPrice - invalidLevel`、`reward = targetZone - observationPrice`、`riskRewardRatio = reward / risk`；1:3 合格、1:4 佳、1:5 以上優；風報比不是勝率。
  - **Candidate Ranking**：低檔高風報比候選 TOP5 13 條排序規則；TOP5 Technical Candidates 不等於 TOP5 Research、不等於買進清單。
  - **Avoid / No Touch Rules**：marketStatus DANGER / dataQualityStatus FAIL / 放量破底 / 跌破 invalidLevel / intraday DANGER / 量價背離等禁碰提醒（非賣出指令）。
  - **War Room Integration**：War Room 首頁只顯示候選 TOP5 + setupTags + 風報比 + 支撐 / invalid / target + dataQualityStatus + 一句 observationSummary；不輸出法人評級 / actionSignal / 買賣指令。
  - **Safety Boundary** 與 **Future Implementation Gate**：V19（Technical Signal Contract）→ V20（Risk Reward Engine Contract）→ V21（Technical Candidate Radar UI）→ V22（K-line Data Pipeline）→ V23（Research + Technical Merge）。
- 新增 `use-cases/technical-strategy/technical-risk-reward-contract.ts`：技術策略 + 風報比 read-model TypeScript type contract（`TechnicalSetupType` / `TechnicalDataQualityStatus` / `RiskRewardGrade` / `CandidateDecisionBoundary` / `TechnicalSetupSnapshot` / `RiskRewardSnapshot` / `TechnicalRiskRewardCandidate`），types-only，不放 runtime、不 import Supabase、不 fetch、不讀 env、不算指標，並帶有 `requestPerformed` / `supabaseConnected` / `productionWritePerformed` / `notEntrySignal` / `notTradeAdvice` 等 read-only invariant。
- 新增 `scripts/validate-technical-risk-reward-spec.ts`：fixture-only 規格完整性 checker，5 gates（required_files / required_phrases / contract_checks / architecture_alignment / safety），驗證文件含 27 個必要 phrase、contract 含 23 個必要型別 / 欄位、架構文件對齊 5 個必要 phrase，並掃描 contract 不含 fetch / Supabase / env / yfinance / FinMind / TradingView runtime token。
- 新增 `npm run test:technical-risk-reward-spec` npm script。
- 本階段只定義技術策略 + 風報比規格，未查資料、未算技術指標。
- 未建立 API route；未建立 UI；未建立 technical / K-line runtime。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration；未寫入資料。
- 不產生買賣指令；未修改 repositories / services。

### V18D

Institutional Research Center Spec：

- 新增 `docs/institutional-research-center-spec.md`：定義 Allen Stock Dashboard 法人研究中心規格（A–Q 十七節），含：
  - **Purpose**：本模組回答「哪些股票值得深入研究」，不回答「現在能不能進場」；Research Center 不直接產生買點、不直接產生買賣指令。
  - **Data Licensing Boundary**：FactSet / 法人共識 / 券商目標價 / 券商報告全文屬授權型資料；未授權顯示 `資料不足` 或 `LICENSE_REQUIRED`；不捏造、不推估、不抄錄；資料可用性狀態 `AVAILABLE` / `DATA_INSUFFICIENT` / `LICENSE_REQUIRED` / `SOURCE_CONFLICT` / `STALE` / `NOT_COVERED`。
  - **Data Source Candidates**：public/official（TWSE / TPEx / 公開資訊觀測站 / 月營收 / 法說會材料）→ licensed/paid（FactSet Estimates / Consensus / broker consensus）→ fallback/user verified；fallback 不得覆蓋官方來源。
  - **Research Input Universe**：uploaded image / pasted text / manual list / watchlist / portfolio / sector basket / AI supply chain basket（本輪不實作 OCR、不解析圖片）。
  - **Research Data Contract Fields**：定義 `ResearchStockSnapshot` 全欄位（股價 / 法人目標價 / EPS 預估 / 月營收 / 法說會摘要 / AI 供應鏈 / 全球市占率 / 主要競爭對手 / 回檔原因 / 八條件評分 / 研究評級）；缺資料填 `null` 或 `資料不足`，不自行補值。
  - **Eight-Factor Research Score Engine**：八條件量化評分（EPS 成長 / 目標價空間 / 法說展望 / AI 直接受惠 / 營收獲利支撐 / 回檔非需求面 / 利多大於風險 / 產業龍頭），星級 1～5、總分 `totalResearchScore` max 40；授權不足不得硬算。
  - **Research Rating Mapping**：`S+` / `S` / `A+` / `A` / `B` / `C` / `DATA_INSUFFICIENT`；Research Rating 不是買賣建議、不等於 `actionSignal`。
  - **TOP5 Research Ranking**：dataQualityStatus FAIL 不可入 TOP5；TOP5 Research 不等於 TOP5 Entry。
  - **Pullback Reason Classification**：與 V18C Pullback Reason Classifier 對齊（純籌碼面 / 大盤同步修正 / 法人換股 / 產業雜訊 / 基本面降溫 / 需求面轉弱 / 財報風險 / 資料不足）。
  - **AI Supply Chain Taxonomy**：GB200/GB300 / AI Server / ASIC / CPO / 光通 / CoWoS / 先進封裝 / 液冷 / 散熱 / 高速傳輸 / PCB / CCL / 記憶體 / 機器人 / Edge AI / PC/NB AI / 系統整合；benefit level `DIRECT` / `INDIRECT` / `THEMATIC` / `WEAK` / `DATA_INSUFFICIENT`；AI 題材標籤不等於營收貢獻已確認。
  - **Competitor / Market Share Rules**：competitors / globalMarketShare 必須有來源，不得捏造，需附 `asOfDate`。
  - **1080x1920 Mobile Research Card Spec**：一頁一檔手機研究卡規格；安全調整：不得使用「強力買進 / 買進」，改用研究評級；本輪不產生 PNG / PDF / HTML / WeasyPrint output。
  - **Research Card Visual Tokens**：保留未來設計 token 與產業色彩用途。
  - **War Room Integration**：War Room 首頁只顯示今日 TOP5 研究名單 + 評級 + 總分 + AI 主標籤 + dataQualityStatus + 一句摘要；不輸出盤中警報 / 技術買點 / actionSignal。
  - **Safety Boundary** 與 **Future Implementation Gate**：V19（Research API Contract）→ V20（Research Center UI）→ V21（Research Card Export）→ V22（Research Data Pipeline）→ V23（Research + Technical Merge）。
- 新增 `use-cases/research/research-center-contract.ts`：法人研究中心 read-model TypeScript type contract（`ResearchCoverageStatus` / `ResearchDataQualityStatus` / `ResearchRating` / `ResearchScoreFactor` / `AiSupplyChainTag` / `AiBenefitLevel` / `PullbackReasonType` / `ResearchUniverseInput` / `ResearchFactorScore` / `ResearchStockSnapshot` / `ResearchTopPick` / `ResearchCardSpec`），types-only，不放 runtime、不 import Supabase、不 fetch、不讀 env，並帶有 `requestPerformed` / `supabaseConnected` / `productionWritePerformed` / `renderPerformed` / `exportPerformed` / `notEntrySignal` 等 read-only invariant。
- 新增 `scripts/validate-institutional-research-center-spec.ts`：fixture-only 規格完整性 checker，5 gates（required_files / required_phrases / contract_checks / architecture_alignment / safety），驗證文件含 20 個必要 phrase、contract 含 25 個必要型別 / 欄位、架構文件對齊 5 個必要 phrase，並掃描 contract 不含 fetch / Supabase / env / yfinance / FinMind / FactSet runtime token。
- 新增 `npm run test:institutional-research-center-spec` npm script。
- 本階段只定義法人研究中心規格，未查資料。
- 未建立 API route；未建立 UI；未建立 image / PDF renderer。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration；未寫入資料。
- 不產生買賣指令；未修改 repositories / services。

### V18F

Intraday Risk Crisis Alert Spec：

- 新增 `docs/intraday-risk-crisis-alert-spec.md`：定義 Allen Stock Dashboard 盤中風險危機告警系統規格（Intraday Alert Engine 細化文件），含：
  - **Purpose**：事件驅動型警報，不是定時報告，警報不是買賣指令，不自動下單。
  - **Runtime Limitation**：V18F 不實作 runtime / cron / 推播 / API route / UI。
  - **Data Source Candidates**：資料源優先順序（official → validated secondary → fallback），Yahoo / yfinance-like 不得為唯一正式來源，資料源衝突最多 WARNING。
  - **Alert Scope**：大盤急跌警報 / 大盤急漲警報 / 持股急跌警報 / 持股急漲警報。
  - **Market Crash Alert Rules**：5 分鐘內跌超過 250 點 → WARNING；15 分鐘內跌超過 500 點 → DANGER。
  - **Market Surge Alert Rules**：5 分鐘急拉 250 點 → WARNING；廣度背離提醒。
  - **Holding Crash Alert Rules**：3 分鐘內跌超過 2% → WATCH；5 分鐘內跌超過 3% → WARNING；亞光（3019）160 / 157 / 153；譜瑞（4966）680 / 665 / 652；山富（2743）67 / 65 / 63 防守區。
  - **Holding Surge Alert Rules**：5 分鐘急漲 3% / 爆量突破 / 突破壓力 / 站回前高。
  - **Sector Alert Rules**：族群同步急跌 → WARNING；族群急拉廣度背離提醒；CPO / 光通 / PCB / AI Server / 散熱族群同步轉弱 → 持股風險提高。
  - **Alert Levels**：INFO / WATCH / WARNING / DANGER / DATA_INSUFFICIENT（中文對照：資訊 / 注意 / 警戒 / 危險 / 資料不足）。
  - **Alert Payload Contract**：定義未來 `IntradayAlertPayload` 欄位（詳見 contract 檔）。
  - **Alert Message Format**：中文格式範例（🔴 盤中急跌警報）。
  - **Cooldown / Dedup Rules**：cooldown 5～10 分鐘、alertLevel 升級才重發、stale data 不得觸發 DANGER、fallback-only data 不得獨立觸發 DANGER。
  - **Safety Boundary**：dataQualityStatus 非 PASS 不得升級 DANGER、Yahoo / fallback 單一來源不得觸發最高等級警報、War Room Read Model 不得自行升級警報。
  - **Future Implementation Gate**：V19（Engine Contract）→ V20（UI）→ V21（Runtime Pipeline）→ V22（Push Notification）。
- 新增 `use-cases/intraday-alert/intraday-alert-contract.ts`：Intraday Alert read-model TypeScript type contract（`IntradayAlertLevel` / `IntradayAlertType` / `IntradayAlertScope` / `IntradayAlertDataQualityStatus` / `IntradayAlertPayload`），types-only，不放 runtime、不 import Supabase、不 fetch、不讀 env。
- 新增 `scripts/validate-intraday-risk-alert-spec.ts`：fixture-only 規格完整性 checker，5 gates（required_files / required_phrases / contract_checks / architecture_alignment / safety），驗證文件含 27 個必要 phrase、contract 含 17 個必要型別 / 欄位、架構文件對齊 4 個必要 phrase，並掃描 contract 不含 fetch / Supabase / env / yfinance / FinMind runtime token。
- 新增 `npm run test:intraday-risk-alert-spec` npm script。
- 本階段只定義盤中風險危機告警規格，不接資料源。
- 未新增 API route；未新增 UI；未建立 cron；未建立推播。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration；未寫入資料。
- 不產生買賣指令；未修改 repositories / services。

### V18C

War Room Intelligence Architecture：

- 新增 `docs/war-room-intelligence-architecture.md`：定義 Allen Stock Dashboard 戰情室總架構，整合估值、技術、風報比、法人研究、盤中警報、回檔原因分類，避免功能重複：
  - **Core Principle**：Research Center 不直接產生買點、Technical Strategy Engine 不假裝基本面良好、Valuation Radar 不直接等於 actionSignal、Intraday Alert 不等於買賣指令、War Room Read Model 不自己創造資料。
  - **Module Inventory**：盤點現有 8 個模組（implemented / spec-only / doc-only / contract-only）與 10 個新增能力（Research Center / Research Score / TOP5 Ranking / Research Card 1080x1920 / AI Supply Chain Taxonomy / Pullback Classifier / Technical Strategy / Risk Reward / Intraday Alert / War Room Read Model）。
  - **Duplication Boundary Matrix**：定義「估值便宜不等於高風報比、高風報比不等於基本面好、法人研究評級不等於買點、盤中警報不等於出場、TOP5 Research 不等於 TOP5 Entry」等反重複邊界。
  - **Data Flow Architecture**：Data Sources → Raw Fact Layer → Analysis Engine Layer → Score / Alert Layer → War Room Read Model → Premarket / Intraday / Postmarket / Realtime UI。
  - **四種戰情室模式**：Premarket（08:00～09:00）、Intraday（09:00～13:30）、Postmarket（13:35～晚上）、Realtime Alert Center（DANGER / WARNING / WATCH / INFO / DATA_INSUFFICIENT，含 cooldown / dedup / 只升級可重發 / stale 與 fallback 不得觸發 DANGER）。
  - **整合規格**：Institutional Research Center、Technical Strategy + Risk Reward（扣三低 / KD / KDJ / MACD 動能 / 均線 / 量價 / 風報比 1:3~1:5）、Pullback Reason Classifier。
  - **Promotion Roadmap**：V18D~V25 路線圖（roadmap 只是規劃，不代表本輪實作）。
- 新增 `use-cases/war-room/war-room-intelligence-contract.ts`：read-model TypeScript type contract（`WarRoomMode` / `WarRoomMarketStatus` / `WarRoomAlertLevel` / `WarRoomDataQualityStatus` / `WarRoomSectionAvailability` / `WarRoomIntelligenceSnapshot`），types-only，不放 runtime、不 import Supabase、不 fetch、不讀 env，並帶有 `requestPerformed / supabaseConnected / productionWritePerformed` 永遠為 `false` 的 read-only invariant。
- 新增 `scripts/validate-war-room-intelligence-architecture.ts`：fixture-only 架構完整性 checker，4 gates（required_files / required_phrases / boundary_checks / safety），驗證文件含 29 個必要 phrase、5 個 boundary phrase，並掃描 contract 不含 fetch / Supabase / env / yfinance / FinMind runtime token。
- 新增 `npm run test:war-room-intelligence-architecture` npm script。
- 本階段只定義戰情室總架構與盤前 / 盤中 / 盤後 / 即時四種模式，並劃定各引擎邊界。
- 未新增 API route；未新增 UI；未接資料源；未建立 cron；未建立推播。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration；未寫入資料。
- 不產生買賣指令；未修改 repositories / services。

### V18-alt

Portfolio Valuation Formula Documentation：

- 新增 `docs/portfolio-valuation-formula.md`：文件化 Allen Portfolio Valuation Radar 未來估值公式方法論：
  - **Valuation Inputs**：`price` / `ttmEPS` / `estimatedEPS` / `forwardPE` / `historicalPERange` / `industryPERange` / `earningsStability` / `growthRate` / `dataQualityStatus` / `sourceConfidence` / `computedAt`。
  - **Normalized EPS Policy**：`normalizedEPS` 決策順序（forward EPS → TTM EPS → EPS 為負/接近 0/波動過大回 `資料不足` → 景氣循環股用 normalized earnings → 來源衝突回保守）。
  - **PE Band Methodology**：歷史 PE 分位優先、產業 PE 次選，`peP10 / peP25 / peP50 / peP75 / peP90` 與 `deepCheapPrice / cheapPrice / fairPrice / expensivePrice / crazyPrice` 價格區間公式。
  - **Valuation Tier Mapping**：六層 `特價 / 便宜 / 合理 / 昂貴 / 瘋狂 / 資料不足` 對應規則，含「特價 不等於可立即買進」「高股價不等於昂貴」「低股價不等於便宜」等語意邊界。
  - **Data Quality Gate**：缺 price / 缺 EPS / `EPS <= 0` / PE band 不足等情境必須顯示 `資料不足` 或 `WARNING`。
  - **Action Signal Boundary**：`valuationTier` 不得直接等於 `actionSignal`；明確禁止自動下單與買賣指令。
  - **Industry Exceptions**：景氣循環股、金融股、資產股、生技等改用 `P/B` / `P/S` / `EV/EBITDA` / normalized earnings（本輪不實作）。
- 修改 `docs/portfolio-valuation-radar-spec.md`：新增 `Valuation Formula Reference` 段落，指向 formula 文件，重申未完成公式實作前 `valuationTier` 維持 `資料不足`。
- 修改 `docs/portfolio-valuation-summary-api.md`：新增 `Formula Status` 段落，說明 API 行為不變（仍 spec-only，`valuationTier` / `actionSignal` 預設仍是 `資料不足`）。
- 新增 `scripts/validate-portfolio-valuation-formula-doc.ts`：fixture-only formula documentation checker，5 gates（required_files / formula_required_terms / boundary_alignment / api_doc_alignment / spec_doc_alignment），不啟動 Next server、不發 request、不連 Supabase、不實作公式。
- 新增 `npm run test:portfolio-valuation-formula-doc` npm script。
- 本階段未實作估值公式；`use-cases/portfolio/valuation-tier.ts` 未修改。
- 未改 API 行為（`/api/portfolio/valuation-summary` 仍 spec-only / `mock_or_contract`）。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration。
- 未新增 `stock_valuation_snapshots`（建表條件尚未滿足）。
- 未寫入資料；未提交真實持股（cost / quantity / owner_id）。
- 不產生買賣指令；formula 文件明確禁止「推薦買進 / 明確賣出 / 立即進場」等語意。
- 未修改 UI / components / repositories / services。

### V17C

Portfolio Valuation Radar Dashboard Integration：

- 新增 `components/portfolio-valuation-radar-summary.tsx`：Dashboard 首頁用的精簡摘要 Server Component，直接呼叫 `buildPortfolioValuationSummaryContract()`，不 fetch / 不連 Supabase / 不讀 env key。顯示標題「持股估值雷達摘要」、4 個 summary stat chips（合約階段 / 資料不足 / WARNING / 公式啟用）、前 5 檔股票 preview list（`公式未啟用` / `合約階段` / `等待資料` 狀態標籤）、compact status bar（`spec_only · mock_or_contract · Supabase disabled · Write false`）與 CTA 連結「查看完整持股估值雷達」→ `/holdings`。
- 修改 `app/page.tsx`：在 `HoldingsTable` 之後、`RiskRanking + BreakoutPool` 之前加入 `<PortfolioValuationRadarSummary />`。不移除既有任何 Dashboard 模組。
- 新增 `scripts/validate-portfolio-valuation-radar-dashboard.ts`：fixture-only Dashboard integration checker，4 gates（required_files / dashboard_summary_phrases / integration / safety），驗證 summary component 含 10 個必要文字、不含 7 個禁用短語、dashboard page 有 import 且渲染 PortfolioValuationRadarSummary、holdings page 仍保留完整 PortfolioValuationRadar、CTA 連結指向 `/holdings`、builder metadata 符合安全常數。
- 新增 `npm run test:portfolio-valuation-radar-dashboard` npm script。
- 更新 `docs/portfolio-valuation-radar-ui.md`：新增 V17C Section H（H1–H4）+ V18 Promotion Gate（Section I）。
- Holdings 頁完整 radar（`PortfolioValuationRadar`）完整保留，未移除。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration。
- 未新增 `stock_valuation_snapshots`（建表條件尚未滿足）。
- 未修改 repositories / services / lib/types/database.ts / supabase/*.sql。
- 未寫入資料；未提交真實持股（cost / quantity / owner_id）。
- 不產生買賣指令；summary component source 不含 推薦買進、強力買進、立即進場、明確買進、明確賣出、停損價、目標價。

### V17B

Portfolio Valuation Radar UI Polish：

- 重構 `components/portfolio-valuation-radar.tsx`：從 V17A 的 15 欄寬表改為 compact radar card layout：
  - **Compact Metadata Status Bar**：`V17B Shell｜spec_only｜mock_or_contract｜Supabase disabled｜Write false｜Valuation table not created`，取代原本分散的 6 個 metadata badge。
  - **Summary Cards（4 張）**：合約階段檔數 / 資料不足檔數 / 公式啟用檔數 / WARNING 檔數，全部由 `data` 即時計算，不寫死。
  - **Compact Radar Card Grid**：每檔股票以獨立 card 呈現，desktop 2–3 欄、mobile 單欄；primary 區顯示估值層級、操作訊號、資料狀態；secondary 區顯示現價、漲跌幅、平均成本等詳細欄位。
  - **ActionSignalBadge**：`actionSignal = 資料不足` 顯示「等待資料」。
  - Safety notice 精簡為：「V17B UI shell：僅用於確認資料欄位與畫面配置；不構成投資建議，不會自動產生買賣指令。」
- 修改 `app/holdings/page.tsx`：`PortfolioValuationRadar` 從 grid 底部上移至 `PageHeading` 之後、`HoldingsTable + CoreScore` 之前（主要決策區）。
- 更新 `scripts/validate-portfolio-valuation-radar-ui.ts`：5 gates（required_files / ui_safety_text / layout / holdings_integration / safety_behavior）；新增 layout gate（確認 card grid 概念、無 `<table>` 主視覺、PortfolioValuationRadar 在 JSX 中出現於 HoldingsTable 之前）；forbidden phrase 改為完整短語（推薦買進、強力買進、立即進場、明確買進、明確賣出、停損價、目標價），不再阻擋 safety notice 中的「買賣」二字。
- 更新 `docs/portfolio-valuation-radar-ui.md`：新增 V17B 說明（F1–F6）與 V17C/V18 Promotion Gate。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration。
- 未新增 `stock_valuation_snapshots`（建表條件尚未滿足）。
- 未修改 repositories / services / lib/types/database.ts / supabase/*.sql。
- 未寫入資料；未提交真實持股（cost / quantity / owner_id）。
- 不產生買賣指令；component source 不含 推薦買進、強力買進、立即進場、明確買進、明確賣出、停損價、目標價。

### V17A

Portfolio Valuation Radar UI Shell：

- 新增 `components/portfolio-valuation-radar.tsx`：Server Component，直接呼叫 `buildPortfolioValuationSummaryContract()` 取得 spec-only 合約資料（無 fetch、無 HTTP、無 Supabase）；渲染 metadata badges（`source_mode`、`response_source`、`api_contract_version`、`supabase_connected`、`production_write_performed`、`stock_valuation_snapshots_created`）、spec-only notice bar、15 欄股票表格（持股 / 市場 / 現價 / 漲跌幅 / 估值層級 / 平均成本 / 未實現損益 / 損益率 / 風報比 / 技術訊號 / 籌碼訊號 / 新聞訊號 / 事件風險 / 操作訊號 / 資料狀態）、估值說明 footer 與 safety notice。所有估值欄位顯示 `—` / `資料不足`；估值公式尚未啟用。
- 修改 `app/holdings/page.tsx`：在 `HoldingsTable` + `CoreScore` grid 下方加入 `<PortfolioValuationRadar />`，不移除或重排既有元件。
- 新增 `scripts/validate-portfolio-valuation-radar-ui.ts`：fixture-only UI shell checker，4 gates（required_files / ui_safety_text / holdings_integration / safety_behavior），驗證 component 含有 11 個必要文字、不含 8 個禁用詞彙、holdings page 保留 HoldingsTable 與 CoreScore、builder metadata 均符合安全常數，不啟動 Next server、不發 request、不連 Supabase，輸出 JSON summary。
- 新增 `docs/portfolio-valuation-radar-ui.md`：頁面配置、欄位顯示規則、安全規則與進入 V17B / V18 的 promotion gate。詳見 [docs/portfolio-valuation-radar-ui.md](docs/portfolio-valuation-radar-ui.md)。
- 新增 `npm run test:portfolio-valuation-radar-ui` npm script。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration。
- 未新增 `stock_valuation_snapshots`（建表條件尚未滿足）。
- 未寫入資料；未提交真實持股（cost / quantity / owner_id）。
- 不產生買賣指令；component source 不含 推薦買進、買進、賣出、強力買進、立即進場、出場、停損價、目標價。

### V16

Portfolio Valuation Summary API Contract：

- 新增 `use-cases/portfolio/valuation-summary-contract.ts`：完整 TypeScript contract（`PortfolioValuationTier`、`PortfolioActionSignal`、`PortfolioValuationSummaryItem`、`PortfolioValuationSummaryMetadata`、`PortfolioValuationSummaryResponse`），不依賴 DB 型別或 Supabase。
- 新增 `use-cases/portfolio/build-valuation-summary-contract.ts`：spec-only mock builder `buildPortfolioValuationSummaryContract()`，以 hardcoded 股票 identity 生成 5 筆 spec-only items，所有估值欄位為 `null`，`valuationTier / actionSignal` 預設 `資料不足`，`dataQualityStatus` 預設 `WARNING`，metadata 固定 `source_mode: "spec_only"`。
- 新增 `use-cases/portfolio/valuation-tier.ts`：`resolvePortfolioValuationTier()` 與 `resolvePortfolioActionSignal()` pure function skeletons，V16 保守預設（缺 EPS / price / formula 回 `資料不足`；WARNING / FAIL 品質不得輸出 `可分批`；不輸出買進 / 賣出）。
- 新增 `app/api/portfolio/valuation-summary/route.ts`：`GET /api/portfolio/valuation-summary` spec-only route，`Cache-Control: no-store`，不讀 env key、不建 Supabase client、不產生買賣建議。
- 新增 `scripts/validate-portfolio-valuation-summary-api.ts`：fixture-only checker，4 gates（required files / contract shape / metadata / pure functions），不啟動 Next server、不發 request、不連 Supabase，輸出 JSON summary。
- 新增 `docs/portfolio-valuation-summary-api.md`：endpoint contract、response shape、保守預設說明與 V17 Promotion Gate。
- 新增 `npm run test:portfolio-valuation-summary-api` npm script。
- 本階段仍不連 Supabase；未讀取 Supabase secret env key。
- 未新增 SQL migration。
- 未新增 `stock_valuation_snapshots`（建表條件尚未滿足）。
- 未修改 UI / components / repositories / services。
- 未寫入資料；未提交真實持股（cost / quantity / owner_id）。
- 不產生買賣指令；`actionSignal` 只作 Allen 個人決策輔助。

### V15

Portfolio Valuation Radar Spec：

- 新增 `docs/portfolio-valuation-radar-spec.md`：定義五大模組（Portfolio Valuation Radar、Market Temperature、Stock Research Snapshot、Event Radar、Warm Risk Reminder）、`portfolio.valuationSummary` 完整 TypeScript response shape、`market.temperature` / `stock.researchSnapshot` 摘要 shape、短期不建表方案（`portfolio_stocks` / `v85_pro_plus_scores` / `technical_signals` / `war_room_items` 資料來源 mapping）、長期 `stock_valuation_snapshots` 欄位候選與六大建表條件、`valuationTier` 六層語意（`特價 / 便宜 / 合理 / 昂貴 / 瘋狂 / 資料不足`，含「高股價不等於昂貴」、「低股價不等於便宜」、「特價不等於可立即買進」說明）、個人版 scope 邊界與 V16 Promotion Gate。
- 新增 `scripts/validate-portfolio-valuation-radar-spec.ts`：fixture-only spec completeness checker，3 gates（required files / spec completeness / boundary alignment），25 個 term 驗證，不連 Supabase、不讀 env key、不發 request、不建 API route、不建 SQL migration，輸出 JSON summary。
- 新增 `npm run test:portfolio-valuation-radar-spec` npm script。
- 本階段只做 Portfolio Valuation Radar 產品規格與 API contract 定義。
- 未新增 SQL migration。
- 未新增 `stock_valuation_snapshots`（已定義建表條件但標記「現在不建」）。
- 未新增 API route（`/api/valuation` 為 proposal，V16 才實作）。
- 未修改 UI / components / repositories / services。
- 未連 Supabase；未讀取 Supabase secret env key。
- 未寫入資料；未提交真實持股（cost / quantity / owner_id）。
- 個人版不做 VIP / search limit，但保留 `owner_id` / RLS / hardcoded fallback 設計。

### V14

Portfolio API Switch Guard：

- 新增 `use-cases/portfolio/portfolio-switch-guard.ts`：`buildSwitchGuardMetadata()` pure function，將 `PortfolioModeResolution` 對應為 V14 snake_case switch guard metadata 契約；無 Supabase 依賴、無 env 讀取、無 HTTP。
- 修改 `app/api/portfolio/route.ts`：移除舊版 camelCase metadata 介面（`PortfolioSwitchMetadata`、`PortfolioShadowMetadata`），改用 `PortfolioSwitchGuardMetadata`；`createPortfolioSwitchMetadata()` 委派給 `buildSwitchGuardMetadata()`。`supabase` mode 在 V14 被 guard 攔截，不建立 Supabase client，fallback 到 hardcoded 並標示 `fallback_used: true`。預設行為（`hardcoded`）維持不變。
- 新增 `scripts/validate-portfolio-api-switch-guard.ts`：fixture-only switch guard checker，測試 5 個 scenario（env unset / hardcoded / shadow / supabase / invalid），驗證 metadata 契約，不連 Supabase、不讀 env key、不發 request，輸出 JSON summary。
- 新增 `docs/portfolio-api-switch-guard.md`：定義 source mode contract 表、response metadata 契約（必填與條件欄位）、safety rules（7 條）與進入 V15 的 promotion gate。
- 新增 `npm run test:portfolio-api-switch-guard` npm script。
- 未連 Supabase；未建立 Supabase client；未讀取 Supabase secret env key。
- 未寫入資料；未提交真實持股（cost / quantity / owner_id）。
- 未切換 `/api/portfolio` 為真實 Supabase 路徑；仍以 hardcoded 為預設 source。
- 未新增 SQL migration；未修改 UI、components、repositories 或 services。

### V13

Portfolio Staging RLS Validation：

- 新增 `docs/portfolio-staging-rls-validation.md`：定義 `portfolio_stocks` 在 isolated Supabase staging project 的 RLS / grants / owner-scoped access 驗證計畫，包含 staging 環境需求、人工操作步驟、RLS Test Matrix（anon deny、Owner A/B 隔離、hard delete deny、soft delete、inactive rows leakage）、PASS/FAIL 標準、三層 rollback plan 與進入 V14 的 promotion gate。
- 新增 `scripts/validate-portfolio-staging-rls.ts`：fixture-only 本機 RLS checklist checker，不連 Supabase、不讀 env key、不發 request、不讀寫真實持股，輸出 JSON summary。
- 新增 `npm run test:portfolio-staging-rls` npm script。
- 本階段只做 staging RLS validation layer 文件與驗證腳本。
- 未連 Supabase；未套用 migration 到任何 Supabase project。
- 未寫入資料；未提交真實持股（cost / quantity / owner_id）。
- 未切換 `/api/portfolio`；仍以 hardcoded 為預設 source。
- 未修改 UI、components、repositories、services 或任何既有 `supabase/*.sql`。

### V12

Portfolio Production Readiness：

- 新增 `docs/portfolio-production-readiness.md`：定義正式切換 `portfolio_stocks` 前必須通過的六項 gate（Schema、Seed、RLS/Grants、Shadow Parity、API Switch、Rollback），以及 Allowed/Forbidden actions 與最小上線排序。
- 新增 `scripts/validate-portfolio-production-readiness.ts`：fixture-only 本機 readiness checker，不連 Supabase、不讀 env key、不發 request、不讀寫真實持股，輸出 JSON summary。
- 新增 `npm run test:portfolio-production-readiness` npm script。
- 本階段只做 Portfolio production readiness 文件與驗證腳本。
- 未切換 `/api/portfolio`；仍以 `hardcoded` 為預設 source。
- 未寫入 Supabase，未提交真實持股（cost / quantity / owner_id）。
- 未修改 UI、components、repositories、services 或任何既有 supabase/*.sql。

### V11.7

Schema Boundary Decisions：

- 新增 `docs/schema-boundary-decisions.md`：釐清三組高度重疊資料表的責任邊界（技術訊號 vs 技術原始數值、已持股風險 vs 候選股風報比、個股評分 vs 未來 N 日預測），定義單一權威來源原則、Authoritative Source Rules 表與 Phase 2 建議排序。
- 本階段只做 schema boundary decision，未新增任何 SQL migration。
- 未修改 repository / API / UI / components，未修改 `lib/types/database.ts` 或任何既有 `supabase/*.sql`。
- 明確暫緩 `technical_snapshots` / `risk_reward_snapshots` / `predictions` 建表，除非各自符合文件結論列出的明確條件；候選股短期風報比改用 `v85_pro_plus_scores.risk_reward_score`。
- Phase 2 建議優先打通 `portfolio_stocks` 真實 API（沿用既有 shadow／RLS／rollback gates，不擴表），其後才接 `chip_snapshots`；暫不做 `global_leader_snapshots`。

### V11.6

War Room Reports Migration Fix：

- 新增 `supabase/v85_war_room_reports.sql`：建立 `public.war_room_reports` 實體資料表，補齊自 V3-3 起存在的 schema gap；RLS 啟用（fail-closed），未建立 policy，revoke anon/authenticated。
- 新增 `docs/war-room-reports-migration.md`：說明 war_room_reports 角色、與 war_room_snapshots／war_room_items／war_room_decisions 的分工、欄位差異（WarRoomReport 繼承 TimestampedRecord 非 SourcedRecord）、本階段限制與正式接 API 前必須補 RLS／grants 的要求。
- 未修改 repository、app、components、services 或 API。
- 未寫入資料，未加入 key，未套用至遠端 Supabase。

### V11

新增 Schema Descriptor Verification：

- 新增 `npm run test:schema-descriptor` 人工驗證指令；預設 disabled，僅在 `CONNECTOR_HTTP_ENABLED=true` 時允許 request。
- TWSE 與 TPEx 每來源最多一次 request，不重試、不輪詢、不建立排程。
- Descriptor 僅輸出 field name、field type、present 狀態、matched alias 與 schema hash，不輸出或保存 raw values。
- `record_time` alias 未命中時維持 FAIL，不猜值、不自動修改 mapping。
- 本階段不寫 Supabase、不影響 reader、Dashboard、components 或 API。

### V10.5

新增 Real Endpoint Verification 與 baseline 準備：

- 定義手動開啟／執行／立即關閉 `CONNECTOR_HTTP_ENABLED` 的安全流程。
- 建立 TWSE／TPEx payload、日期、時間、價格、來源與 PASS／FAIL 人工檢查規則。
- 建立 `ApprovedSchemaBaseline` 與 schema hash drift comparison contract。
- Baseline／current hash 缺失或無效一律 FAIL；mismatch 預設 FAIL，可由人工觀察政策設為 WARNING。
- Drift 永遠 `auto_fix_applied = false`，不得自動新增 alias 或更新 baseline。
- Baseline 禁止 key、個資與真實 raw payload；目前 hash 維持 pending，未執行 runtime request。

### V10

新增 Official Connector Runtime Evidence Layer：

- 定義 source、symbol、request／response time、latency、HTTP status、schema hash、資料時間與 validation issues。
- Evidence recorder 只建立 object 並輸出 stdout，不寫檔案、Git 或 Supabase。
- 新增 `npm run test:runtime-evidence`；只有 `CONNECTOR_HTTP_ENABLED=true` 才允許手動 request。
- TWSE 2330／2455 共用一次 request；TPEx 4979／5347 共用一次 request。
- Reader 匯出純 payload normalizer，evidence 使用同一份 response，不額外重送。
- 無日期、時間、有效價格、來源或 matching record 一律 FAIL，禁止猜值。
- Schema hash 只描述 payload 結構，不保存完整市場資料。

### V9.5

新增 fixture-only ETL Dry Run Integration：

- 新增 `npm run test:etl-dry-run`，完整串接 Official Pipeline → War Room Gate → ETL Write Gate。
- 固定建立 PASS／WARNING／FAIL 三種資料，分別流向 primary／reference／rejected。
- 只有 primary 產生 dry-run planned operation；WARNING／FAIL 必須進 quarantine。
- Runner 以 symbol 反向檢查 planned payload，任何 reference／rejected 洩漏立即 exit 1。
- `written_count` 永遠為 0、`write_performed` 永遠為 false，並輸出 audit summary。
- 全流程只使用 fixtures，不發 request、不寫 Supabase、不修改 UI 或 API。

### V9

新增 staging-only ETL Write Layer：

- 定義 disabled、dry_run、staging 三模式；三者均固定 `write_performed = false`。
- 只有通過二次契約檢查的 War Room primary inputs 能產生 planned upsert。
- Reference、rejected、invalid primary 與 duplicate primary 全部進記憶體 quarantine。
- 以 symbol、record date、source 與 data frequency 建立 SHA-256 idempotency key。
- Dry-run 與 staging skeleton 只輸出 planned operations，不 import Supabase client 或 executor。
- Audit 保存 input／planned／quarantine counts，written count 固定為 0、無需 rollback。
- 本階段未修改 UI、API、repositories、services、mock-data 或 War Room 決策內容。

### V8.5

新增 War Room Data Input Contract：

- 定義 WarRoomInput、status、data source 與 decision eligibility。
- PASS 且 `decision_allowed = true`、無 warning 才進 `primary_inputs`。
- WARNING 強制進 `reference_inputs`，只供參考且禁止買賣建議。
- FAIL 強制進 `rejected_inputs`，完全排除決策流程。
- PASS 契約不一致或非 PASS 嘗試開啟 decision 時一律 fail closed 並記錄 issue。
- 統一輸出 data warnings 與 issues；不接 UI、API、Supabase 或網路。

### V8

新增 Official Price Validation Pipeline：

- 統一輸入 TWSE／TPEx official quote 與 Yahoo fallback quote。
- Normalizer 只映射已知欄位，缺日期、時間、價格或來源時保持空值並 FAIL，禁止猜值。
- Official／fallback symbol 與 record date 必須一致，且來源角色必須正確。
- 價差不超過 1% 為 PASS；大於 1% 為 WARNING 並設 `data_warning = true`。
- 只有 PASS 的 `decision_allowed = true`；WARNING／FAIL 均禁止決策。
- Pipeline 不 import reader／transport，不發 request、不寫 Supabase、不修改 API 或 UI。

### V7.5

新增 Official Connector Runtime Test：

- 新增 `npm run test:official-connectors:runtime` 手動測試入口，未啟用開關時輸出 disabled 並 exit 0。
- Runtime symbols 僅允許 2330、2455、4979、5347，拒絕非白名單、重複與超量輸入。
- 每次執行對 TWSE／TPEx 各最多讀取一次，沒有 polling、cron 或自動重跑。
- 每檔輸出 symbol、source、date、time、close、volume、status、warning 與 issues。
- 缺日期、時間、價格、來源或 record 一律 FAIL，禁止猜值。
- 本階段未修改 UI、components、API、repositories、mock-data 或 Yahoo Provider。

### V7

新增 Real Free Data Connector 第一階段：

- 建立 HTTPS official-host allowlist transport，支援 timeout 與 disabled mode。
- HTTP 預設禁止，只有 server 明確設定 `CONNECTOR_HTTP_ENABLED=true` 才允許 request。
- 建立 TWSE 上市與 TPEx 上櫃官方日收盤 price readers，僅 normalize、不寫入資料庫。
- 建立 official vs Yahoo fixture validator：價差大於 1% 為 WARNING，必要欄位缺失為 FAIL。
- 新增 `npm run test:official-connectors`，預設 fixtures-only 並確認 readers disabled。
- 本階段未修改 UI、components、API、repositories、mock-data 或 Yahoo Provider。

### V3-6.5

新增 Free Data Connector Contract Layer：

- 定義 connector source、market、status、request／response、error 與 normalized quote contracts。
- 建立 TWSE 上市官方 close、TPEx 上櫃官方 close 與 Yahoo fallback／global no-request skeletons。
- 三個 connector 的 `fetchQuotes()` 固定 disabled，V7 前只能使用 fixtures。
- 建立正常、缺值、stale、market error、volume anomaly 與 0.5%／1.5% price divergence fixtures。
- 定義 timeout、retry、rate limit、fallback、IP 風險與禁止高頻輪詢規範。
- 串接既有 Data Quality 規則，invalid／suspicious 為 FAIL、stale 為 WARNING。
- 本階段未修改 app、components、API、repositories、mock-data 或 Yahoo Provider。

### V3-6

新增 Staging Supabase Portfolio Shadow 架構：

- 建立注入 `PortfolioRepository.getActivePortfolioStocks()` 的 server-side shadow skeleton，不實例化 Supabase client。
- Staging active rows 與 V3-4.8 hardcoded fixture 執行 identity parity comparison。
- Missing、empty、RLS blocked、repository error 與 validation failure 一律輸出 FAIL。
- Result 包含 mode、source、status、issues、parity、fallback、decision 與 data warning contract。
- `source = hardcoded` 與 `fallback_used = true` 固定不變，Supabase rows 不會成為主 API data。
- 建立 Seed／RLS／Shadow／Data Quality／Rollback 五組 readiness gates。

### V3-5.5

新增 Staging Portfolio Seed & RLS Validation 基礎：

- 建立零資料、temporary table、rollback guarded 的 staging seed shape 範本。
- 新增 `npm run test:portfolio-seed-shape`，驗證 required／duplicate columns、placeholder、market whitelist 與 `is_active`。
- 定義 owner_id、active Portfolio、已賣出 soft delete 與禁止假值規則。
- 建立 authenticated owner、anon deny、cross-owner deny 與禁止 hard delete 的 RLS checklist。
- 定義 staging database snapshot 與 hardcoded baseline 的 PASS／WARNING／FAIL shadow 流程。
- 本階段不切 API、不連 Supabase、不改 UI、components、services 或 Yahoo Provider。

### V3-5

新增 API Portfolio Switch 架構：

- 支援 `PORTFOLIO_SOURCE_MODE=hardcoded | shadow | supabase`，未設定或無效值 fallback hardcoded。
- Shadow mode 保留原有 `data`，只附加 non-decision shadow metadata。
- Supabase mode 本階段為 no-query skeleton，固定 fallback hardcoded，空資料不得覆蓋既有 Portfolio。
- Active Portfolio use case 新增 repository error、empty、inactive 與 Data Quality failure 的 hardcoded fallback contract。
- 正式 Supabase response 必須先通過 Shadow Test、RLS、Data Quality 與 rollback gates。
- 未修改 UI、components、mock-data 或 Yahoo Provider，未加入 key、登入或 service role。

### V3-4.9

新增 Portfolio Shadow Test Contract：

- 新增 `npm run test:portfolio-shadow` 本地測試命令。
- 固定執行 V3-4.8 七種 fixtures，核對 actual 與 expected status。
- 驗證 `decision_allowed` 僅能在有效 PASS scenario 成立。
- Suite 或 decision contract 失敗時以 exit code 1 阻擋後續 switch。
- 專案未安裝 `tsx`；使用既有 `typescript` 執行，不新增套件或編譯產物。
- V3-5 切換 `/api/portfolio` 前必須通過此測試，並另行通過 staging rollout gates。

### V3-4.8

新增 deterministic Shadow Runner Validation：

- 固定 3019、4966、5347、2455、4979 hardcoded identity fixture。
- 建立 exact、名稱不同、market 不同、duplicate、inactive、missing、extra 七種 database scenarios。
- Runner 固定 context／時間／scenario 順序，可重複輸出 PASS／WARNING／FAIL。
- Fixture suite 以 actual status 是否符合 expected status 判定，不把預期 FAIL 誤認為 suite failure。
- `decision_allowed` 只代表可進 rollout review，不是交易決策或 API switch。
- 本階段不接 Supabase、API、Yahoo Provider、UI 或真實 seed。

### V3-4.7

新增 Portfolio Seed／Shadow Contracts：

- 定義 owner、成本、股數、來源、人工確認與 checksum 的 secure seed manifest；不含真實資料。
- 建立 hardcoded 與 database active rows 的 symbol／market identity comparison。
- 定義 PASS／WARNING／FAIL differences，name mismatch 不改變 identity parity。
- Shadow report 不含 cost、shares、owner 或 token，response source 永遠為 hardcoded。
- Mode resolver 預設 hardcoded，未通過 gates 時禁止 Supabase mode。
- 本階段不讀 Supabase、不修改 API、Yahoo Provider、UI 或資料流。

### V3-4.6

新增 ETL Foundation Layer：

- 定義 `job_name`、`source_name`、`run()`、`validate()`、`load()` 的 ETL job contract。
- 統一 success、records count、warnings、errors 與執行時間結果。
- 建立 TWSE、TPEx、ISIN、Yahoo fallback no-op source skeleton。
- 建立 official vs Yahoo 的 pending price validation skeleton。
- 建立完全不依賴 Supabase client、固定 no-write 的 dry-run loader。
- 本階段沒有 request、Supabase write、cron、deployment 或新套件。

### V3-4.5

新增 Data Source & Security Layer：

- 定義 Priority 1 TWSE／TPEx／ISIN、Priority 2 Yahoo、Priority 3 其他免費來源。
- 定義 PASS／WARNING／FAIL 與 `data_warning` 傳遞規則。
- WARNING／FAIL 禁止輸出買進、賣出、加碼、減碼或等價方向性建議。
- 所有戰情室輸出未來必須包含收盤價、資料日期、來源與校驗結果。
- 新增 Portfolio／Watchlist owner-based RLS 草稿；目前不套用且不開放 anon。
- 定義 V3-4 Migration → V3-4.5 Validation → V3-5 Switch、server feature flag 與 rollback。

### V3-4

新增 Portfolio Migration Layer：

- Portfolio 名單的目標來源固定為 `portfolio_stocks where is_active = true`。
- 建立 active-only use case 與未來 `daily_prices`／`stock_snapshots`／Yahoo fallback pricing port。
- 建立 cost basis、market value、未實現損益與報酬率 mapper。
- 串接 Data Quality：invalid／suspicious 禁止決策，stale 僅作 reference。
- 稽核目前 hardcoded `3019`、`4966`、`5347`、`2455`、`4979`，V3-4 保留原樣。
- 本階段不切換 `/api/portfolio`；V3-5 完成 seed、權限、shadow comparison 後才切換。

### V3-3.6

新增 Free Data ETL Pipeline Architecture：

- 定義 Free Data Sources → Python ETL → Data Quality → Supabase → Repository → API → War Room → Dashboard 的單向資料流。
- 第一階段只允許 TWSE、TPEx、TWSE ISIN、MOPS、Yahoo 與低頻 twstock。
- 定義台股／全球資料源優先級、雙來源校驗、fallback 與禁止來源。
- 規劃 08:00、12:00、14:30～15:30、20:00、23:00 工作時段。
- 盤點 stock master、價格、籌碼、營收、基本面、技術、回測、驗證、評分與戰情室目標資料集。
- 本階段未建立實際 ETL 或修改 provider、repository、API、UI。

### V3-3.5

新增 Data Quality Layer：

- 統一每筆行情的 symbol、value、台北日期／時間、來源、可信度與模型推論標記。
- 價格雙來源差異大於 1% 或成交量差異大於 5% 時標記 `suspicious`。
- 區分今日、本週、歷史與過期資料，stale 資料只能作參考。
- `invalid`／`suspicious` 不得進入戰情室決策，只有 `valid` 可作主依據。
- 本階段未修改 provider、API、UI 或資料來源。

### V3-3

新增 Repository Layer：

- 集中定義 Portfolio、Watchlist、Trade Journal、War Room 與績效資料型別。
- 建立 generic CRUD repository contract 與一致的 repository error。
- 建立 Portfolio、Watchlist、Trade Journal、War Room 的 Supabase skeleton。
- 透過 dependency injection 接收 Supabase client，不建立真實連線或切換資料來源。
- 保留 Yahoo provider、hardcoded stocks、既有 API、UI 與 mock data。

### V3-2

新增 Supabase Client Layer：

- 使用 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- 提供 browser-side singleton 與 server-side client factory。
- 不使用 service-role key，不建立登入或 session。
- 尚未接入 UI、`/api/portfolio` 或真實資料流。

### V3-1.6

新增第二版 additive migration，補齊未來 2～3 年所需的：

- 投資績效
- 技術訊號
- 策略組合
- 市場廣度
- 資金管理
- 部位風險
- 策略驗證結果
- 戰情室決策紀錄

本階段只擴充資料庫與文件，未修改 UI、API 或 mock data。

### V3-1.5

新增 V8.5 Pro+ 可追溯評分、模型批次、戰情室發布 read model 與私有 Storage artifact 登錄。

## 架構文件

- [Shadow Runner Validation](docs/shadow-runner-validation.md)
- [Portfolio Parity Rules](docs/portfolio-parity-rules.md)
- [Portfolio Seed Contract](docs/portfolio-seed-contract.md)
- [Portfolio Shadow Comparison](docs/portfolio-shadow-comparison.md)
- [Portfolio Rollout Plan](docs/portfolio-rollout-plan.md)
- [ETL Foundation](docs/etl-foundation.md)
- [ETL Data Contract](docs/etl-data-contract.md)
- [Data Source Validation](docs/data-source-validation.md)
- [Portfolio Switch Strategy](docs/portfolio-switch-strategy.md)
- [Data Warning Policy](docs/data-warning-policy.md)
- [Official Price Validation](docs/official-price-validation.md)
- [Portfolio Migration](docs/portfolio-migration.md)
- [Data Pipeline Architecture](docs/data-pipeline-architecture.md)
- [ETL Source Plan](docs/etl-source-plan.md)
- [Data Source Priority](docs/data-source-priority.md)
- [ETL Schedule Plan](docs/etl-schedule-plan.md)
- [Data Quality Layer](docs/data-quality-layer.md)
- [Repository Layer](docs/repository-layer.md)
- [Supabase Client Layer](docs/supabase-client-layer.md)
- [Database Architecture](docs/database-architecture.md)
- [Schema Boundary Decisions](docs/schema-boundary-decisions.md)
- [Portfolio Valuation Summary API](docs/portfolio-valuation-summary-api.md)
- [Portfolio Valuation Radar Spec](docs/portfolio-valuation-radar-spec.md)
- [Portfolio API Switch Guard](docs/portfolio-api-switch-guard.md)
- [Portfolio Staging RLS Validation](docs/portfolio-staging-rls-validation.md)
- [Portfolio Production Readiness](docs/portfolio-production-readiness.md)
- [Storage Policy](docs/storage-policy.md)
- [UI Language Rule](docs/ui-language-rule.md)
- [Technical Framework](docs/technical-framework.md)
- [War Room Architecture](docs/war-room-architecture.md)
- [Supabase Setup](supabase/README.md)

## 資料與安全

Browser 不應持有 Supabase service-role key 或 provider token。V8.5 Pro+ 資料表與私有 Storage bucket 由伺服器端工作存取，UI 只讀已發布的戰情室快照。環境變數檔、API key、signed URL 與真實持股資料不得提交至 repository。

## 免責聲明

資料與模型結果僅供研究參考，不構成投資建議。
