# Portfolio Shadow Test

V3-4.9 將 V3-4.8 deterministic Shadow Runner 包裝成可重複執行的本地測試命令。測試只讀取 fixtures，不讀 Supabase、不發送 request，也不切換 `/api/portfolio`。

## 執行方式

在專案根目錄執行：

```bash
npm run test:portfolio-shadow
```

專案未安裝 `tsx`。此命令使用既有的 `typescript` 編譯器與本地 register helper 執行 TypeScript，不需安裝新套件，也不會在 workspace 產生編譯輸出。

## 驗證內容

測試固定執行七種 fixtures：

| Scenario | 預期結果 |
| --- | --- |
| `exact_match` | `PASS` |
| `name_mismatch` | `WARNING` |
| `market_mismatch` | `FAIL` |
| `duplicate` | `FAIL` |
| `inactive_leakage` | `FAIL` |
| `missing_symbol` | `FAIL` |
| `extra_symbol` | `FAIL` |

- `PASS`：Portfolio identity 完全一致，`decision_allowed = true`。
- `WARNING`：identity 一致但名稱不同，`decision_allowed = false`。
- `FAIL`：存在 market、duplicate、inactive、missing 或 extra 問題，`decision_allowed = false`。

測試同時確認每個 scenario 的 actual status 符合 expected status，以及 `decision_allowed` 僅在有效 `PASS` 時成立。

## Exit code 與 V3-5 gate

- `suite_passed = true` 且 decision contract 正確：exit code `0`。
- 任一 scenario 結果不符或 decision contract 錯誤：exit code `1`，阻擋 V3-5 switch。

V3-5 切換 `/api/portfolio` 前必須通過此測試。Fixture suite 通過只代表本地 contract 正常；實際 Database Portfolio snapshot 仍必須通過 staging parity、Data Quality、RLS、feature flag 與 rollback gates。
