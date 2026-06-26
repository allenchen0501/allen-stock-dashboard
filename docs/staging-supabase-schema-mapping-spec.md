# Staging Supabase Schema Mapping Spec

本文件定義 Allen Stock Dashboard 的 **Staging Supabase Schema Mapping Spec**（app 期望的 staging Supabase schema 對映：table × column → 型別 / nullable / app 用途 / fixture+contract 對映 / 新鮮度 / source-of-truth / PII）。
V46 把這份 schema mapping 收斂成 spec-only contract、pure deterministic builder、validator 與本文件。

**本階段（V46）只定義 app 期望的 staging Supabase schema 對映。本輪不實際連 Supabase、不讀 env、不新增 API route、不新增 UI、不新增 SQL migration、不修改現有 production routes、不切換 /api/portfolio、不建立 runtime、不寫 DB。
這一版不是 staging Supabase 實作；不是 production 真實資料上線；不是建立實際 SQL migration；不是實際 schema introspection。**

相關文件：
[Staging Supabase RLS Manual Matrix](./staging-supabase-rls-manual-matrix.md)、
[Staging Supabase Read-only Safety Gate](./staging-supabase-readonly-safety-gate.md)、
[Production Alias Safety Smoke Test Evidence](./production-alias-safety-smoke-test-evidence.md)。

---

## A. Purpose

- V46 是 staging Supabase schema mapping spec。
- V46 不是正式真實資料上線。
- V46 定義 app 期望從未來 staging Supabase 讀到的 schema 對映，供人工逐項驗證。
- staging Supabase 僅為 planned；本輪不連任何 Supabase。
- read-only：schema mapping 只能作為 read-only planning，不得建立 migration。
- fixture/mock UI 仍維持現狀。
- V45 Staging Supabase RLS Manual Matrix 仍是前置安全門。

---

## B. Scope Boundary

- V46 不連 staging Supabase。
- V46 不接 production Supabase。
- V46 不讀 Supabase env key。
- V46 不寫 staging。
- V46 不寫 production。
- V46 不新增 SQL migration。
- V46 不建立實際 schema。
- V46 不建立實際 RLS policy。
- V46 不切換 /api/portfolio。
- V46 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V46 不新增 API route。
- V46 不新增 UI。
- V46 不接真實行情。
- V46 不產生買賣指令。
- V46 不自動下單。

---

## C. Schema Mapping Item Shape

每個 schema mapping item 至少包含：

- `tableName`
- `columnName`
- `expectedType`
- `nullable`
- `isPrimaryKey`
- `isForeignKey`
- `appReadAllowed`
- `appWriteAllowed`
- `appUsage`
- `mappedFixtureFields`
- `mappedContractFields`
- `freshnessRequirement`
- `sourceOfTruth`
- `piiRisk`
- `verificationStatus`
- `blocksRelease`
- `notes`

允許的 expectedType：uuid、text、integer、numeric、boolean、timestamptz、date、jsonb、enum、unknown。
允許的 appUsage：portfolio_position、watchlist_item、market_snapshot、stock_snapshot、scoring_snapshot、runtime_metadata、audit_only、not_used_by_app。
允許的 freshnessRequirement：manual_review_required、latest_trading_day_required、intraday_optional、not_realtime、fixture_only_until_authorized。
允許的 sourceOfTruth：staging_supabase_schema_spec、existing_supabase_schema_sql、fixture_contract_mapping、manual_review_required。
允許的 piiRisk：none、low、medium、high。
允許的 verificationStatus：NOT_REVIEWED、PASS、FAIL、BLOCKED。

---

## D. Covered Tables

schema mapping 至少涵蓋以下五張表，每張表至少包含 `id`、`created_at`、`updated_at` 與至少 3 個 app domain 欄位，整體 schemaMappingItems 至少 30 筆：

1. **portfolio_stocks**：id、symbol、name、quantity、avg_cost、latest_price、market_value、unrealized_pnl、created_at、updated_at
2. **watchlist_stocks**：id、symbol、name、watch_reason、priority、is_active、created_at、updated_at
3. **market_snapshots**：id、market_code、market_name、index_price、change_percent、snapshot_at、source_label、created_at、updated_at
4. **stock_snapshots**：id、symbol、price、change_percent、volume、snapshot_at、source_label、created_at、updated_at
5. **v85_scores**：id、symbol、score、grade、technical_score、chip_score、risk_score、calculated_at、created_at、updated_at

欄位命名以 repo 內既有 `supabase/schema.sql` 與 fixture contract 命名風格為準；實際型別與欄位仍需人工複核。

---

## E. Policy Expectations

- 所有 appWriteAllowed 必須 false。
- appReadAllowed 可 true，但僅限 read-only planning。
- 所有 verificationStatus 預設 NOT_REVIEWED。
- 若 stagingSchemaManuallyVerified = false，decision 不得是 GO 或 PRODUCTION_READY。
- 若任何 appWriteAllowed = true，decision 必須 NO_GO。
- 若任何 PII risk = high，blocksRelease 必須 true。
- app 不得依賴 service_role。
- schema mapping 只能作為 read-only planning，不得建立 migration。
- 若欄位型別是 unknown，blocksRelease 必須 true 或 notes 必須標示 manual review required。
- 若欄位是價格、成交量、分數、時間戳，freshnessRequirement 不得空白。
- 若欄位會用於持股、防守、風報比、戰情室分數，mappedContractFields 不得空陣列。
- production Supabase 不得出現在 mapping target。
- /api/portfolio 不得切換到 staging Supabase。

---

## F. Safety Language

- Staging Supabase Schema Mapping Spec
- staging Supabase
- schema mapping
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
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## G. Decision

- `decision` 預設 READY_FOR_REVIEW（所有 appWriteAllowed 皆 false 且尚未人工驗證）。
- 允許 READY_FOR_REVIEW / NO_GO / BLOCKED / NOT_REVIEWED。
- V46 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## H. Future Gate

下一階段才是 **V47 Staging Supabase Read-only Connection Review** 或 **V47 Staging Read-only Adapter Spec**。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
