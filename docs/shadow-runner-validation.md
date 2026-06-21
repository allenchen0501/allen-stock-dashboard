# Shadow Runner Validation

V3-4.8 以 deterministic fixtures 驗證 V3-4.7 hardcoded／database comparison contract。Runner 不讀 Supabase、不 import Yahoo Provider、不發 request、不寫檔案，也不影響 `/api/portfolio`。

## Deterministic 條件

- Hardcoded fixture 固定五檔：3019、4966、5347、2455、4979。
- Database fixture 使用固定 IDs 與固定 scenario records。
- `compared_at` 固定為 contract timestamp，不使用 `Date.now()`。
- Comparison ID、snapshot ID、scenario 順序與 expected status 固定。
- Runner 不讀環境變數、clock、random、network、database 或 filesystem。

相同程式版本與 scenario 必須產生相同 status、issues、summary 與 counts。

## PASS

條件：

- Hardcoded 與 database active rows 的 symbol＋market 完全一致。
- 無 duplicate、inactive leakage、missing 或 extra identity。
- Name 也一致，沒有 warning。

Runner 輸出：

- `status = PASS`
- `issues = []`
- `identity_parity = true`
- `response_source = hardcoded`
- `decision_allowed = true`

`decision_allowed` 只表示此 scenario 可進入 rollout review，不是交易決策，也不會自動切換 API。

## WARNING

條件：symbol＋market parity 正確，但 name 不同。

Runner 輸出：

- `status = WARNING`
- issue code `NAME_MISMATCH`
- `identity_parity = true`
- `decision_allowed = false`

名稱需人工確認；不能因為 identity parity true 就忽略 warning。

## FAIL

任一情況：

- Market 不同。
- Database duplicate。
- Inactive row leakage。
- Missing symbol。
- Extra symbol。
- 未來新增的其他 fail-severity difference。

Runner 輸出 `status = FAIL`、結構化 issues、`decision_allowed = false`。FAIL 阻擋 Portfolio switch。

## Scenario matrix

| Scenario | Expected | 主要 issue |
| --- | --- | --- |
| `exact_match` | PASS | 無 |
| `name_mismatch` | WARNING | `NAME_MISMATCH` |
| `market_mismatch` | FAIL | `MARKET_MISMATCH` |
| `duplicate` | FAIL | `DUPLICATE_DATABASE_IDENTITY` |
| `inactive_leakage` | FAIL | `INACTIVE_DATABASE_RECORD`／missing active identity |
| `missing_symbol` | FAIL | `MISSING_DATABASE_RECORD` |
| `extra_symbol` | FAIL | `UNEXPECTED_DATABASE_RECORD` |

## Suite 判定

`runPortfolioShadowValidationSuite()` 執行固定七個 scenarios。每個 scenario 的 actual status 必須等於 expected status；七個全部符合時 `suite_passed = true`。

故障 scenario 預期輸出 FAIL，所以「scenario FAIL」不等於「suite failed」。例如 market mismatch 正確輸出 FAIL，代表 validator 行為符合 contract。

## 切換前規則

真實 staging shadow 在任何候選 snapshot 上都必須 PASS，且 seed、RLS、Data Quality、official price、warning 與 rollback gates 也必須通過。Fixture suite PASS 只是允許進入下一階段，不是 V3-5 switch 授權。

V3-4.8 本身沒有 staging snapshot 或真實 database input，所有 response 繼續走 hardcoded path。

