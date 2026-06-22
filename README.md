# Allen Stock Dashboard

以 Next.js、TypeScript 與 Tailwind CSS 製作的個人台股戰情室，包含市場燈號、持股戰情、V8.5 核心評分、風報比、主升段候選與今日禁碰股。

目前版本為 V17B Portfolio Valuation Radar UI Polish：將 V17A 的寬表 UI 改為 compact radar card layout（summary cards + 個股雷達卡 grid），並將 `PortfolioValuationRadar` 上移至 holdings 頁主要決策區（`HoldingsTable` 之前）。本階段未連 Supabase、未讀 secret env、未新增 SQL migration、未新增 `stock_valuation_snapshots`、未寫入資料、不產生買賣指令。

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
- `docs/`：資料庫、資料保存、介面用語、技術框架與戰情室架構規範。

## 版本紀錄

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
