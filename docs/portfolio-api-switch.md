# Portfolio API Switch

V3-5 在 `/api/portfolio` 建立 server-side feature flag 架構。此階段保留既有 Yahoo Provider 與固定 Portfolio；Supabase 只是一條不可覆蓋正式資料的安全 skeleton。

## Feature flag

使用非公開環境變數：

```text
PORTFOLIO_SOURCE_MODE=hardcoded | shadow | supabase
```

不得改成 `NEXT_PUBLIC_` 變數。未設定、空白或無效值一律 fallback `hardcoded`。預設部署不需要新增任何環境變數。

## 三種模式

### hardcoded

- 預設模式。
- Portfolio 名單仍來自既有 hardcoded path。
- Yahoo Provider 保持現況，沒有刪除固定股票。

### shadow

- API `data` 與既有 hardcoded response 完全相同。
- `meta.portfolioMode` 附加 shadow report metadata。
- V3-5 尚未連接 staging Supabase adapter，因此 report 明確標記 `status = not_run`、`decisionAllowed = false`。
- Shadow metadata 不得改變前端主要資料、排序或 HTTP success contract。

### supabase

- 本階段只建立 switch skeleton，不建立 Supabase client、query 或真實 seed。
- API 仍先取得 hardcoded response，並標記 `responseSource = hardcoded` 與 `fallbackApplied = true`。
- Supabase 無資料、repository error、inactive leakage、Data Quality validation fail 或 rollout gate 未通過時，必須 fallback hardcoded。
- 空 Portfolio 永遠不得覆蓋現有資料。

## Supabase rollout gates

正式讓 `responseSource = supabase` 前，至少必須完成：

1. `npm run test:portfolio-shadow` 通過。
2. Staging seed 經人工核對，active symbols 與 hardcoded baseline parity 為 PASS。
3. RLS 已套用並通過 owner isolation、anon deny 與權限測試。
4. Data Quality 為 valid 且 decision-ready；stale、suspicious、invalid 或 unavailable 不可切換。
5. Empty、duplicate、inactive、timeout 與 repository error fallback 測試通過。
6. Feature flag rollback 演練完成。

## Rollback

將 server 環境變數改為：

```text
PORTFOLIO_SOURCE_MODE=hardcoded
```

重新部署或重啟 server 後，API 立即回到 hardcoded path。也可移除變數；resolver 會自動 fallback hardcoded。Rollback 不刪除 database rows、不修改交易紀錄，也不移除 Yahoo Provider。
