# Portfolio Shadow Comparison

Shadow comparison 在不改變 `/api/portfolio` response 的前提下，比較 hardcoded Portfolio identity 與未來 database snapshot。V3-4.7 只有 pure contract，不讀 Supabase、不呼叫 Yahoo、不寫 log 或資料庫。

## 輸入

### Hardcoded baseline

只需要：

- `symbol`
- `market`
- 可選 `name`

Baseline 仍由現有 Yahoo Provider 的 hardcoded audit 代表，但 comparison function 不 import provider。

### Database shadow rows

只需要：

- `id`
- `symbol`
- `market`
- 可選 `name`
- `is_active`

不得把 cost price、shares、owner ID、current price 或完整 Portfolio response傳入 shadow report contract。

### Context

- `comparison_id`
- `compared_at`
- `hardcoded_version`
- `database_snapshot_id`

呼叫端必須提供時間與版本，pure function 不自行讀 clock 或環境變數。

## 比較規則

`comparePortfolioShadow()` 先 trim 並大寫 symbol／market，再檢查：

1. Hardcoded 是否有重複 symbol＋market。
2. Database active rows 是否有重複 symbol＋market。
3. Shadow input 是否誤含 inactive row。
4. 每個 hardcoded identity 是否存在 active database exact match。
5. 相同 symbol 的 market 是否不同。
6. Database 是否有 hardcoded baseline 沒有的額外 active identity。
7. Identity 相同但 name 不同時產生 WARNING，不將 name 當主鍵。

## 結果

| Status | 條件 | 行為 |
| --- | --- | --- |
| `pass` | 無 difference | Identity parity 通過，繼續 shadow |
| `warning` | 只有 name mismatch | Identity parity 通過，但需人工確認名稱 |
| `fail` | 缺少／額外／market mismatch／duplicate／inactive leakage | 阻擋 rollout |

`identity_parity` 只代表 symbol＋market 集合；不代表成本、股數、RLS、行情或 API contract 已通過。PASS 也不能自動切換。

## 固定安全行為

- `response_source` 永遠是 `hardcoded`。
- Shadow result 不回傳 UI，不改 API status，不觸發交易建議。
- Report 固定 `contains_sensitive_values = false`。
- Cost／shares 只在 secure seed validation 處理，不進 difference。
- 未知 mode 或被阻擋的 Supabase mode 必須 fail back to hardcoded。

## Report contract

`createPortfolioShadowReport()` 輸出：

- report／comparison version 與時間
- mode = shadow
- response source = hardcoded
- status 與 identity parity
- hardcoded／database／active／matched／warning／failure counts
- 結構化 difference codes
- recommendation：`continue_shadow` 或 `block_rollout`

即使 status PASS，recommendation 仍是 continue shadow，而不是 switch。

## Difference codes

- `DUPLICATE_HARDCODED_IDENTITY`
- `DUPLICATE_DATABASE_IDENTITY`
- `MISSING_DATABASE_RECORD`
- `UNEXPECTED_DATABASE_RECORD`
- `MARKET_MISMATCH`
- `NAME_MISMATCH`
- `INACTIVE_DATABASE_RECORD`

Codes 必須保持穩定，message 只作人類閱讀。監控與 gate 以 code／severity 判斷，不解析自由文字。

## V3-4.8 前置測試

- Exact parity fixture → PASS。
- Name-only mismatch → WARNING 且 identity parity true。
- Missing／extra／wrong market → FAIL。
- Duplicate identity → FAIL。
- Inactive row leakage → FAIL。
- Supabase mode request 在未開 gate時回落 hardcoded。
- Report serialization 不含 cost、shares、owner、key 或 token。

