# ETL Dry Run Integration

V9.5 用固定 fixtures 串接完整 no-write 路徑：Official Price Pipeline → War Room Input Gate → ETL Write Gate。Runner 不 import official reader、HTTP transport、Supabase client 或 repository。

## 執行方式

```bash
npm run test:etl-dry-run
```

測試固定建立一筆 PASS、一筆 WARNING 與一筆 FAIL，不讀環境行情、不發 request、不寫檔案或 database。

## 資料流

```text
fixed official + Yahoo fixtures
  -> Official Price Pipeline
     PASS / WARNING / FAIL
  -> War Room Input Gate
     primary / reference / rejected
  -> ETL Write Gate (dry_run)
     planned operations / quarantine
```

- PASS：進 `primary_inputs`，可建立一筆 `dry_run_only` planned upsert。
- WARNING：進 `reference_inputs`，必須 quarantine，禁止 planned write。
- FAIL：進 `rejected_inputs`，必須 quarantine，禁止 planned write。

## 安全斷言

Runner 會以 symbol 反向檢查 planned operations。任何 reference／rejected symbol 出現在 planned payload 時立即 exit 1；WARNING 或 FAIL 因此不能靠陣列錯置進入 write plan。

以下條件也會 exit 1：

- Pipeline 未產生預期 PASS／WARNING／FAIL。
- Planned count 與 primary count 不一致。
- Reference 或 rejected 缺少 quarantine payload。
- `written_count` 不等於 0。
- `write_performed` 不等於 false。

## 輸出

成功時輸出 primary、reference、rejected、planned operations、quarantine、written counts 與 audit summary。`written_count` 在 V9.5 必須永遠為 0；audit 的 target 只是 contract 名稱，不代表 table 已建立或寫入。

V10 前必須持續通過此測試。未來即使加入 staging executor，也不得刪除 fixture-only integration gate；真實 writer 應另有明確開關、transaction、database constraints 與 rollback tests。
