# Portfolio Seed Contract

V3-4.7 只定義 seed manifest contract，不建立真實 seed、不寫入 Supabase，也不套用 RLS。任何包含實際成本、股數或 owner ID 的檔案都不屬於本階段產物。

## 目的

Seed manifest 是把已人工確認的持倉資料轉成 `portfolio_stocks` rows 的一次性輸入契約。它解決現有 hardcoded Portfolio 只有 symbol／name／market、缺少 cost price 與 shares 的問題；不能用 hardcoded Yahoo 設定推算真實持倉。

目前 parity baseline 仍是 `hardcoded-portfolio-audit.ts` 記錄的五個 symbol。這份 audit 只能驗證集合，不能充當 seed。

## Manifest contract

`PortfolioSeedManifest`：

| 欄位 | 規則 |
| --- | --- |
| `contract_version` | 固定 `v3-4.7` |
| `manifest_id` | 唯一、可稽核，不使用檔名當 ID |
| `owner_id` | 必須是已核准的 authenticated owner；V3-4.7 尚未提供 |
| `created_at` | UTC ISO 8601 |
| `source_checksum` | 權威來源檔的 checksum；不可用空字串 |
| `records` | 逐筆 `PortfolioSeedRecord` |

每個 record 必須包含：

- `symbol`
- `name`
- `market`
- `owner_id`
- `cost_price`
- `shares`
- `position_type`
- `is_active`
- `effective_date`
- `source_document_ref`
- `confirmed_by`
- `confirmed_at`

## 驗證規則

1. Record owner ID 必須與 manifest owner ID 完全一致。
2. Active row 的 cost price 與 shares 必須大於 0；不得使用 0、1、mock value 或 Yahoo price 補缺值。
3. Position type 只能是 `long`／`short`。
4. Market 必須經標準化，例如 `TWSE`、`TPEx`；symbol＋market 不可重複。
5. Symbol、name、market 不得空白；effective date 不得晚於 confirmed time 所在日期。
6. `confirmed_by` 必須代表人工核對者，不可填程式名稱。
7. Source document reference 只保存不可逆識別或受控位置；不能把券商帳號、token 或完整報表放進 repository。
8. Seed set 必須和當下核准的 hardcoded baseline 做 parity；任何差異都阻擋 load。
9. RLS owner backfill、anon deny 與 authenticated owner tests 未完成前，不得 load。

## 敏感資料政策

Cost、shares、owner ID 與 source document 都是敏感資料：

- 不寫入 log、shadow report、API warning、client bundle 或 Git repository。
- Review 只顯示 record count、symbol／market set、checksum 與 validation status。
- 錯誤訊息不得回顯整筆 record。
- 真實 manifest 應放在核准的 secret／secure import channel，完成後依保存政策清理。

## Dry-run output

Seed dry run 只允許輸出：manifest ID、contract version、checksum、總筆數、active／inactive 筆數、symbol／market parity、duplicate count、invalid field count 與 PASS／FAIL。不得輸出 cost、shares、owner ID 或 source document content。

## Load 前 gates

- 身份模型已核准，owner ID 可重現。
- `v85_portfolio_rls.sql` 已在 staging 驗證但尚未誤套 production。
- Manifest schema、business rules、checksum 與人工簽核通過。
- Backup／rollback 與 idempotent upsert key 已確認。
- Shadow comparison contract tests 通過。

V3-4.7 不執行上述 load；只把契約固定下來。

