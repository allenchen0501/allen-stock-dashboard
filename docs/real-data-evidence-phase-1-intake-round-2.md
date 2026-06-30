# Real Data Evidence Phase 1 — Intake Record (Round 2)

本文件記錄 owner（Allen）第二輪補件，補齊 [Round 1](real-data-evidence-phase-1-intake.md) 中 INCOMPLETE 的 Step 2 / Step 3 與 Step 4 的 rollback / kill switch 具體步驟。

**重要：本文件只是人工 intake 紀錄，不翻任何旗標。** V70 ledger 全部 item 仍 PENDING、decision 仍 NO_GO、productionReady=false、realDataConnected=false、stagingConnectionAllowed=false、manualSignoffCompleted=false。實際接入需「下一版實作審查 + 你最終逐項確認」，且永遠由你明確指示。

---

## A. Step 2 — Supabase staging（WORDING COMPLETE ✅）

- staging project ref：`proj_****____`（遮蔽，未含完整值 ✅）。
- readonly role：**已確認** —— 只能 select，不能 insert/update/delete。
- RLS select-only：**已確認** —— 只允許 select。
- write-blocked：**已確認** —— insert/update/delete 會被拒絕。

對應 V70 ledger：`STAGING_SUPABASE_PROJECT_CONFIRMATION` / `STAGING_READONLY_ROLE_CONFIRMATION` / `RLS_SELECT_ONLY_CONFIRMATION` / `WRITE_OPERATION_BLOCK_CONFIRMATION` —— **owner 確認文字已收到（wording complete）**；contract 旗標仍 PENDING（待下一版實作審查時逐項驗證後才處理）。

---

## B. Step 3 — Vercel env 名稱（NAMES COMPLETE ✅，無值）

只提供名稱，未提供任何值 ✅：

| env 名稱 | 用途（規劃用，本階段不讀取） |
|---|---|
| `REAL_DATA_MODE` | 全域開關：fixture / real（預設 fixture） |
| `REAL_QUOTE_PROVIDER` | 報價來源選擇（Yahoo / TWSE / TPEx） |
| `NEXT_PUBLIC_REAL_DATA_ENABLED` | 前端是否顯示 real（kill switch 用） |
| `SUPABASE_URL` | staging 專案 URL（名稱，值不在此） |
| `SUPABASE_READONLY_ANON_KEY` | read-only anon key 名稱（值不在此） |

對應 V70 ledger：`API_ROUTE_NO_SWITCH_CONFIRMATION` —— env **名稱清單已收到**；本階段不填值、不讀取、不切 /api/portfolio；contract 旗標仍 PENDING。

> 註：`SUPABASE_READONLY_ANON_KEY` 為 read-only anon key（非 service role）。下一版實作時須確認 app runtime **不使用 service role**（對應 `SERVICE_ROLE_NOT_IN_APP_RUNTIME`，仍 PENDING）。

---

## C. Step 4 補件 — Rollback / Kill switch / Shadow（STEPS RECEIVED ✅）

- **rollback**：若資料異常，將 `REAL_DATA_MODE` 切回 `fixture`，網站回到 mock safe mode。
- **kill switch**：若來源衝突或延遲異常，將 `NEXT_PUBLIC_REAL_DATA_ENABLED` 關閉。
- **shadow comparison**：同意先讓 fixture 與 real quote 並排比較，不直接切正式。

對應 V70 ledger：`ROLLBACK_RUNBOOK` / `KILL_SWITCH_CONFIRMATION` / `SHADOW_COMPARISON_PLAN` —— **具體步驟與同意已收到**；contract 旗標仍 PENDING。

---

## D. Evidence 齊備度（人工盤點，非旗標）

| V70 ledger item | 本輪狀態（人工紀錄） |
|---|---|
| OWNER_MANUAL_SIGNOFF | sign-off 文字已收到（Round 1） |
| SOURCE_AUTHORIZATION_YAHOO / TWSE / TPEX | 來源偏好已表態；授權條款文字可後補 |
| SOURCE_AUTHORIZATION_GOODINFO / BROKER_IMPORT | 本階段不使用 |
| STAGING_SUPABASE_PROJECT_CONFIRMATION | 遮蔽 ref + 確認文字已收到 |
| STAGING_READONLY_ROLE_CONFIRMATION | 已確認文字已收到 |
| RLS_SELECT_ONLY_CONFIRMATION | 已確認文字已收到 |
| WRITE_OPERATION_BLOCK_CONFIRMATION | 已確認文字已收到 |
| SERVICE_ROLE_NOT_IN_APP_RUNTIME | 待下一版實作審查確認（read-only anon key 已表明） |
| API_ROUTE_NO_SWITCH_CONFIRMATION | env 名稱已收到；本階段不切換 |
| REAL_QUOTE_MAPPING_REVIEW | 待下一版規劃 |
| SOURCE_CONFLICT_POLICY_REVIEW | 已有 V67 spec，待下一版 review |
| TRADE_PLAN_DOWNGRADE_UI_REVIEW | 已有 V68/V69 spec，待下一版 review |
| SHADOW_COMPARISON_PLAN | 同意已收到 |
| SHADOW_COMPARISON_RESULT_PENDING | 待實際 dry-run 後才有結果 |
| ROLLBACK_RUNBOOK | 步驟已收到 |
| KILL_SWITCH_CONFIRMATION | 步驟已收到 |
| PRODUCTION_SWITCH_FINAL_APPROVAL | 不在本階段（本階段只做 read-only dry-run，不切 production） |

**結論：第一階段（staging read-only dry-run）所需的非敏感 evidence wording 大致齊備**；尚需在「下一版實作」中實際驗證（service role 未用於 runtime、shadow 比對結果），這些屬於 dry-run 執行後才會產生的 evidence。

---

## E. 仍鎖定狀態（完全未變）

- decision = NO_GO；productionReady = false；realDataConnected = false；stagingConnectionAllowed = false；manualSignoffCompleted = false。
- V60–V74 safety chain 不受影響；未改 runtime、未改 API、未連 Supabase、未讀 env、未 fetch、未接真實行情。
- 禁止事項維持：no broker API、no order execution、no auto order、no write、no production switch。

---

## F. 下一步（需你明確指示才動）

evidence wording 已足以規劃下一版。下一版（仍 spec/實作但維持安全）會是：

**Phase 2 — Staging Read-only Real Quote Dry-run Implementation Plan**，內容預計：

1. 定義 `REAL_DATA_MODE` / `REAL_QUOTE_PROVIDER` / `NEXT_PUBLIC_REAL_DATA_ENABLED` 的開關語義（預設 fixture，real 僅供 shadow 並排）。
2. 規劃 read-only quote adapter 介面（先 public quote：Yahoo + TWSE/TPEx；Supabase read-only 第二步）。
3. 規劃 fixture vs real **shadow comparison** 呈現（並排、不切換）。
4. rollback / kill switch 對應到上述 env 開關。
5. 仍 **no order / no broker API / no auto order / no write / no production switch**；仍由 safety chain guard 守護。

> 我**不會自行**開始實作或翻任何旗標。請回覆「進行 Phase 2 implementation plan（仍不連線、仍不下單）」我才會著手；屆時也只先出 plan/spec，實際連線需要再一次你的明確同意。
