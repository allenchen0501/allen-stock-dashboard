# ETL Write Layer

V9 建立 staging-only ETL write contract，但所有模式都維持 no-write。它只把 War Room gate 結果轉成 planned operations、quarantine payload 與 audit metadata，不 import Supabase client、repository 或 transport。

## 三種模式

### disabled

- 預設安全模式。
- 不產生 planned operations，`write_performed = false`。
- 仍可在記憶體內產生 quarantine 與 audit counts，供本地驗證。

### dry_run

- 合法 primary inputs 轉為 `dry_run_only` planned upserts。
- 不呼叫 database、不產生 SQL、不修改 staging table。
- 用來檢查 payload、target、idempotency 與 quarantine 分流。

### staging

- V9 僅為 `staging_skeleton_only`。
- 產生與未來 staging writer 相同的 operation contract，但固定 `write_performed = false`、written count = 0。
- 不接受 Supabase client，也沒有 executor implementation。

## Primary-only gate

只有同時符合以下條件的 `primary_inputs` 能進 planned operations：

- eligibility 為 primary。
- validation status 為 PASS。
- `decision_allowed = true`、`data_warning = false`。
- symbol、close price、record date／time 與 source 完整。
- data frequency 非空。

契約不一致的 primary 會進 quarantine，不能因位於 primary array 就繞過驗證。

## Quarantine

- `reference_inputs`：reason `REFERENCE_INPUT`。
- `rejected_inputs`：reason `REJECTED_INPUT`。
- 無效 primary：reason `INVALID_PRIMARY_INPUT`。
- 重複 natural key：reason `DUPLICATE_PRIMARY_INPUT`。

Payload 保留 validation status、eligibility、issues、data warning、source 與 record date，不包含 API key、owner、持股成本或交易建議。V9 quarantine 只存在回傳結果，沒有寫入任何 table。

## Idempotency key

Natural key 固定為：

```text
symbol + record_date + source_name + data_frequency
```

欄位經 trim 與大小寫 normalization 後，以 SHA-256 產生 key。相同 key 在同一批只保留第一筆 planned operation，後續資料進 quarantine。未來 database 仍需 unique constraint，不能只依賴 application memory。

## Rollback 與 audit

V9 沒有實際 write，因此 `rollback_required = false`。Audit 固定保存 run、mode、target、requested／evaluated time、三類 input counts、eligible、planned、quarantine 與 written count 0。

未來啟用 staging executor 前，必須補齊 transaction、unique constraint、database-side upsert、partial failure、rollback rehearsal 與可追溯 writer identity；預設仍應 disabled。
