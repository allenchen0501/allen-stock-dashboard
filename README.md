# Allen Stock Dashboard

以 Next.js、TypeScript 與 Tailwind CSS 製作的個人台股戰情室，包含市場燈號、持股戰情、V8.5 核心評分、風報比、主升段候選與今日禁碰股。

目前版本為 V3-5.5 Staging Portfolio Seed & RLS Validation：已建立零資料 seed contract、local shape test、RLS checklist 與 staging shadow 流程。API 仍維持 hardcoded，未連接真實 Supabase 或放入持股資料。

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
- `repositories/`：資料存取介面、Supabase skeleton 與統一 exports。
- `use-cases/portfolio/`：active Portfolio orchestration、估值 mapping、品質 gate 與 migration audit。
- `types/`：UI 與 API 契約。
- `supabase/`：V3-1 基礎 schema、V3-1.5 Pro+ schema、V3-1.6 補強 schema 與套用說明。
- `docs/`：資料庫、資料保存、介面用語、技術框架與戰情室架構規範。

## 版本紀錄

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
- [Storage Policy](docs/storage-policy.md)
- [UI Language Rule](docs/ui-language-rule.md)
- [Technical Framework](docs/technical-framework.md)
- [War Room Architecture](docs/war-room-architecture.md)
- [Supabase Setup](supabase/README.md)

## 資料與安全

Browser 不應持有 Supabase service-role key 或 provider token。V8.5 Pro+ 資料表與私有 Storage bucket 由伺服器端工作存取，UI 只讀已發布的戰情室快照。環境變數檔、API key、signed URL 與真實持股資料不得提交至 repository。

## 免責聲明

資料與模型結果僅供研究參考，不構成投資建議。
