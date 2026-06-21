# Portfolio Seed Validation

V3-5.5 提供完全本地、零網路的 seed shape test。它只讀取 repository 中的 shape-only SQL，不連 Supabase、不使用 key。

## 執行方式

```bash
npm run test:portfolio-seed-shape
```

命令沿用既有 TypeScript register，不需安裝 `tsx` 或其他套件。成功時 exit code 為 0；任一規則失敗時列出原因並以 exit code 1 結束。

## 驗證規則

- 15 個 required columns 必須完整且沒有額外欄位。
- 欄名不得重複，檢查不分大小寫。
- 不得出現 TODO、replace-me、全零 UUID、sample、dummy、fake 等 placeholder。
- `market_type` 必須有 CHECK constraint，且只允許 `TWSE / TPEx / NASDAQ / NYSE`。
- `is_active` 必須存在且為 boolean。
- Repository example 不得包含 insert／copy，且必須有 rollback safety。

## 驗證失敗案例

- 遺漏 `owner_id`、`quantity`、`average_cost` 或 `is_active`。
- 同一欄位出現兩次。
- market whitelist 包含未核准值，或缺少 CHECK constraint。
- 放入 placeholder owner、假股票、假成本或假股數。
- 範本包含永久寫入語句或移除 rollback。

## 未來 staging 流程

Shape test 通過後，仍需在 repository 外建立受控 seed manifest，完成人工值驗證、欄位 mapping、transaction dry run、RLS owner isolation 與 hardcoded parity。此測試不驗證真實持股內容，也不能替代 RLS 或 Data Quality gate。
