# Allen Stock Dashboard

以 Next.js、TypeScript 與 Tailwind CSS 製作的個人台股戰情室，包含市場燈號、持股戰情、V8.5 核心評分、風報比、主升段候選與今日禁碰股。

目前版本為 V3-3.6 Free Data ETL Pipeline Architecture：資料庫、Supabase Client、Repository、Data Quality 與免費公開資料源 ETL 規格已建立；部分畫面仍使用 mock data。V3-3.6 只有架構文件，尚未建立 Python ETL、爬蟲、排程或切換任何既有資料流。

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
- `services/`：market、stocks、indices service 與 provider adapter。
- `lib/api/`：HTTP client、cache、設定與 provider registry。
- `lib/data-quality/`：資料品質型別、規則、雙來源比較與決策門檻。
- `lib/supabase/`：browser singleton、server factory 與統一 exports。
- `lib/types/`：資料庫 row 與 repository input 型別。
- `repositories/`：資料存取介面、Supabase skeleton 與統一 exports。
- `types/`：UI 與 API 契約。
- `supabase/`：V3-1 基礎 schema、V3-1.5 Pro+ schema、V3-1.6 補強 schema 與套用說明。
- `docs/`：資料庫、資料保存、介面用語、技術框架與戰情室架構規範。

## 版本紀錄

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
