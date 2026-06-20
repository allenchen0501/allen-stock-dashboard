# Portfolio Switch Strategy

Portfolio 切換分成 Migration、Validation、Switch 三個階段。V3-4.5 不修改 `/api/portfolio`，也不套用 RLS migration；目前 production path 與 hardcoded list 維持不變。

## V3-4：Migration

完成內容：

- `PortfolioRepository.getActivePortfolioStocks()` 作為未來名單來源。
- `GetActivePortfolioUseCase`、mapper 與 Data Quality integration path。
- hardcoded 五檔清單 audit。
- `daily_prices`／`stock_snapshots` primary 與 Yahoo fallback pricing port。

V3-4 只證明 application path 可以成立，沒有 database seed、API composition 或真實切換。

## V3-4.5：Validation

本階段建立 switch 前 gates：

- Priority 1／2／3 資料源與 PASS／WARNING／FAIL。
- `data_warning` 與禁止方向性建議政策。
- 每個戰情室輸出的 official price validation contract。
- Portfolio／Watchlist fail-closed RLS 草稿。
- feature flag、shadow comparison 與 rollback 規格。

### RLS blocker

`v85_portfolio_rls.sql` 使用 `owner_id = auth.uid()`，沒有 anon policy。現在沒有登入／authenticated session，因此目前 server anon client 套用後也讀不到資料。這是刻意的安全阻擋：V3-5 必須先核准 owner identity 與 owner backfill，再在 staging 套用；不能為了讓 API 可讀而新增 `using (true)` 的 anon policy。

草稿只授權 owner select／insert／update，不提供 hard delete policy；移除 Portfolio／Watchlist 必須沿用 `is_active = false` 的 soft delete。

現有 unique constraints 仍是 single-owner 設計：Portfolio `(symbol, market)`、Watchlist `(symbol)`。若未來支援多 owner，需先以獨立 migration 改成包含 `owner_id` 的 unique key。

## V3-5：Switch

只有以下 gates 全部通過才可切換：

1. 五檔 hardcoded symbol 與 database active rows set parity 100%。
2. cost price、shares、position type 由權威持倉資料人工確認。
3. 身份模型、owner_id backfill、RLS 與 anon deny 在 staging 驗證。
4. Repository active-only、permission、empty、duplicate、timeout tests 通過。
5. Portfolio mapper 與 invalid／suspicious／stale tests 通過。
6. Official price validation contract 與 data warning 可由 API 完整傳遞。
7. Shadow mode 連續多個交易日無 symbol／market mismatch，且失敗率在核准門檻內。
8. Rollback 已演練，不需修改或刪除資料即可恢復舊 response。

V3-5 只切換 API composition；UI 要不要採用新欄位是後續獨立決策。Yahoo provider 繼續負責行情 fallback，不再負責 Portfolio 名單。

## Feature Flag Strategy

建議使用 server-only `PORTFOLIO_SOURCE_MODE`，不可使用 `NEXT_PUBLIC_`：

| Mode | 行為 | API response |
| --- | --- | --- |
| `hardcoded` | 只跑現有 Yahoo hardcoded path | 現有 response |
| `shadow` | 現有 path 回應；背景執行 database use case 並比較 | 現有 response |
| `supabase` | database active-only path 成為主路徑；Yahoo 只提供 fallback quote | 新 response contract |

Default 必須是 `hardcoded`。未知值、缺少 flag、RLS／configuration error 一律 fail back to hardcoded 並告警，不能在 browser 端切 flag。

Shadow log 只保存 symbol／market set、筆數、quality status、latency 與 mismatch code，不記錄 cost、shares、完整 response、token 或 key。

## Shadow Comparison

每次比較至少檢查：

- symbol／market set 是否一致。
- active row 是否誤含 inactive。
- 名稱與 Yahoo symbol mapping 是否可解析。
- cost／shares 是否為經確認值，且無假 0。
- price source role、record date、quality status 與 warning 是否完整。
- database／hardcoded path 的 timeout、empty 與 partial failure。

Shadow 結果不回傳給 UI、不影響目前 response，也不能觸發交易建議。

## Rollback Strategy

### 觸發條件

- Database empty、RLS permission denied 或 owner mismatch。
- Symbol set mismatch、inactive row 外洩或 cost／shares 異常。
- invalid／suspicious 資料被標成 decision-ready。
- WARNING／FAIL 未附 `data_warning`。
- Error rate、latency 或 stale rate 超過核准門檻。

### 動作

1. 將 server-side mode 改回 `hardcoded`。
2. 停止新 path response，但保留 shadow diagnostic。
3. 不刪除 Portfolio rows、不回滾 seed、不修改 trade history。
4. 記錄 incident、受影響時間與 dataset version。
5. 修正後重新從 shadow 開始，不直接跳回 supabase。

Rollback 不能把 Yahoo 重新定義成永久 Portfolio 名單；它只是 API 服務連續性的暫時回退。

## 上線決策紀錄

切換與 rollback 都應記錄：flag 前後值、操作者、時間、release version、RLS migration version、seed checksum、shadow period、核准者與原因。沒有這份紀錄不得手動切 production。
