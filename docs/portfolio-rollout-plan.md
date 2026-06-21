# Portfolio Rollout Plan

Portfolio rollout 採 contract → fixture shadow → staging shadow → API switch 的漸進流程。V3-4.7 不切 API、不讀 Supabase、不建立 seed，也不修改 Yahoo Provider。

## 階段

### V3-4：Migration path

建立 active-only repository、Portfolio use case、mapper、Data Quality gate 與 hardcoded audit。

### V3-4.5：Security validation

建立 PASS／WARNING／FAIL、warning policy、official price contract、RLS 草稿、feature flag 與 rollback 規範。

### V3-4.6：ETL foundation

建立 no-op source、ETL job/result、pending price validator 與 dry-run Supabase loader。

### V3-4.7：Seed／Shadow contracts

建立 seed manifest schema、mode resolver、identity comparison 與 non-sensitive report。仍無真實 manifest、DB query 或 API integration。

### 建議 V3-4.8：Fixture Shadow Validation

以程式內匿名 fixtures 驗證 parity／difference／report，不讀 production hardcoded module、不接 Supabase。加入 unit tests 與 deterministic clock/context；驗證報告不洩漏敏感欄位。

### 後續 staging shadow

只有 owner identity、RLS、secure seed channel 與 fixture tests 通過後，才可在 staging 讀 active database snapshot做 shadow。Response 仍由 hardcoded path提供。

### V3-5：API Portfolio Switch

連續 shadow period、資料品質、權限、seed、rollback 與 API warning contract 全部核准後，才以 server-side feature flag 切換。UI 切換不包含在同一動作。

## Mode contract

| Mode | V3-4.7 policy | Response |
| --- | --- | --- |
| `hardcoded` | 允許，預設 | hardcoded |
| `shadow` | Contract 允許，但目前無 runner | hardcoded |
| `supabase` | 禁止，resolver 回落 | hardcoded |

`resolvePortfolioMode()` 不讀 `process.env`。未來 composition root 可把 server-only flag value 傳入；browser 不得控制 mode。

## Rollout gates

1. Seed contract 驗證及人工簽核。
2. Owner identity／RLS／anon deny／cross-owner tests。
3. Hardcoded vs database identity parity。
4. Cost、shares、position type secure validation，但不進 shadow report。
5. Data Quality 與 official price validation。
6. Repository、use case、mapper、warning contract tests。
7. Shadow latency／error／empty／permission metrics。
8. Feature flag rollback drill。

任一 gate FAIL 都維持 hardcoded。Warning 必須有人核准且有期限，不能永久豁免。

## Rollout evidence

每次候選 release 保存：contract version、seed checksum、RLS migration version、fixture test result、shadow report IDs、comparison period、difference code distribution、rollback rehearsal 與核准者。Evidence 不含實際成本、股數、owner ID、token 或完整 API response。

## Rollback

- 將 server mode 回復 hardcoded。
- 停止新 response path，保留非敏感 shadow diagnostic。
- 不刪除 database rows、seed audit 或 trade history。
- 修復後從 fixture／shadow 重新開始，不直接恢復 Supabase mode。
- Yahoo 繼續是行情 fallback，不重新成為長期 Portfolio membership source。

## V3-4.7 完成標準

- Types、mode、comparison、report 均為 pure contracts。
- PASS／WARNING／FAIL identity 規則明確。
- Shadow response source 固定 hardcoded。
- 無 Supabase、Yahoo、API、UI 或 service import。
- 無真實 seed、credential、cost／shares log。
- Build 通過。

