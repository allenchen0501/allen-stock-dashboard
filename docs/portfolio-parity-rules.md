# Portfolio Parity Rules

Portfolio parity 的主鍵是正規化後的 `market:symbol`。Name 是可警告屬性，不是 identity key；cost、shares、owner、行情與報酬不屬於 V3-4.8 shadow report。

## Normalization

- Symbol：trim 後轉大寫。
- Market：trim 後轉大寫，因此 `TPEx` 與 `TPEX` 視為同一 market。
- Name：只 trim，不改寫官方名稱；兩側皆有值且不同時產生 WARNING。
- 空 symbol／market 應由未來 fixture/input validation 擋下，不能正規化成合法 identity。

## Symbol parity

每個 hardcoded symbol 必須在 active database rows 找到相同 symbol。找不到時：

- code：`MISSING_DATABASE_RECORD`
- severity：FAIL
- 阻擋 switch

Symbol 相同但 market 不同不算 symbol＋market parity，改由 market mismatch 處理。

## Market parity

相同 symbol 必須對應相同 market。例：hardcoded `TPEx`、database `TWSE`：

- code：`MARKET_MISMATCH`
- severity：FAIL
- `identity_parity = false`

不得用 Yahoo suffix 自動覆蓋 database market；market 來源應由 stock master／seed contract 確認。

## Duplicate detection

Hardcoded 與 database active rows 各自檢查重複 `market:symbol`：

- `DUPLICATE_HARDCODED_IDENTITY`
- `DUPLICATE_DATABASE_IDENTITY`

兩者皆為 FAIL。Matched count 使用 unique composite keys，不能因 duplicate 重複增加。

## Inactive detection

Active-only Repository 正常不應輸出 inactive row。Shadow input 若包含 `is_active = false`：

- code：`INACTIVE_DATABASE_RECORD`
- severity：FAIL

若該 identity 沒有另一筆 active row，同時會出現 missing active identity。這是兩個不同問題：一個是 query leakage，一個是 active set 不完整。

## Extra symbol detection

Active database identity 不在 hardcoded baseline 時：

- code：`UNEXPECTED_DATABASE_RECORD`
- severity：FAIL

同 symbol 若已有正確 market match，但資料庫另有錯誤 market row，額外 row 仍必須被偵測，不能只看 symbol set。

## Missing symbol detection

Hardcoded identity 不在 active database rows 時：

- code：`MISSING_DATABASE_RECORD`
- severity：FAIL

Inactive row 不可拿來滿足 active parity。

## Name mismatch

Symbol＋market 一致但 trimmed name 不同：

- code：`NAME_MISMATCH`
- severity：WARNING
- `identity_parity = true`
- `decision_allowed = false`

名稱需對照 ISIN／官方主檔人工確認，不可由 Yahoo 名稱直接覆寫。

## 不在本層比較的欄位

- Cost price
- Shares／quantity
- Owner ID
- Position type
- Current price／market value／profit
- RLS permission
- Data Quality status

這些欄位有各自 seed、安全、估值與資料品質 gates。Identity PASS 不代表它們已通過。

