# Real Data Evidence Phase 1 — Intake Record (Round 1)

本文件記錄 owner（Allen）針對 [Real Data Evidence Phase 1](real-data-evidence-phase-1.md) 第一輪提供的**非敏感** evidence，並標示哪些已備、哪些仍待補。

**重要：本文件只是人工 intake 紀錄，不翻任何旗標。** 收到本輪 evidence 後，V70 ledger 全部 item 仍為 PENDING、decision 仍 NO_GO、productionReady=false、realDataConnected=false、stagingConnectionAllowed=false、manualSignoffCompleted=false。任何旗標的翻轉都需要全部 evidence 齊備 + 你逐項最終確認 + 下一版實作審查，且永遠由你明確指示。

---

## A. Step 1 — 資料源（RECEIVED ✅）

- 第一階段使用 **Yahoo + TWSE / TPEx 公開行情**（public quote source first）。
- **不接 broker API、不接券商、不開下單、不開自動交易。**
- 對應建議資料源順序：public quote source first ✅；broker API never in this phase ✅。
- 對應 V70 ledger：`SOURCE_AUTHORIZATION_YAHOO` / `SOURCE_AUTHORIZATION_TWSE` / `SOURCE_AUTHORIZATION_TPEX` —— **來源偏好已表態**，但「授權範圍 / 條款確認」仍待你以文字確認；ledger 維持 PENDING。
- `SOURCE_AUTHORIZATION_GOODINFO` / `SOURCE_AUTHORIZATION_BROKER_IMPORT` —— 本階段**不使用**，維持 PENDING（不啟用）。

狀態：**source preference RECEIVED；source authorization wording 仍 PENDING。**

---

## B. Step 2 — Supabase staging（INCOMPLETE ⏳）

你提供的內容為樣板，尚未填入：

- staging project ref：`__________`（仍空白，待提供**遮蔽**參考，例如 `proj_****abcd`）
- readonly role：「已確認 / 尚未確認」（**尚未擇一**）
- RLS select-only：「已確認 / 尚未確認」（**尚未擇一**）
- write-blocked：「已確認 / 尚未確認」（**尚未擇一**）

對應 V70 ledger：`STAGING_SUPABASE_PROJECT_CONFIRMATION` / `STAGING_READONLY_ROLE_CONFIRMATION` / `RLS_SELECT_ONLY_CONFIRMATION` / `WRITE_OPERATION_BLOCK_CONFIRMATION` / `SERVICE_ROLE_NOT_IN_APP_RUNTIME` —— 全部 **PENDING**。

狀態：**INCOMPLETE。** 待補：遮蔽 project ref + 三項「已確認」明確擇一（read-only role / RLS select-only / write-blocked）。

---

## C. Step 3 — Vercel env 名稱（INCOMPLETE ⏳）

你提供的是範例樣式，非實際名稱：

- `NEXT_PUBLIC_XXXXX`（樣板）
- `SUPABASE_XXXXX`（樣板）
- `REAL_QUOTE_SOURCE_XXXXX`（樣板）

對應 V70 ledger：`API_ROUTE_NO_SWITCH_CONFIRMATION` —— **PENDING**。

狀態：**INCOMPLETE。** 待補：實際**環境變數名稱清單（只給名稱，不給值）**，供下一版規劃 mapping，本階段不填入、不讀取。

---

## D. Step 4 — Owner sign-off（WORDING RECEIVED ✅，未轉為 accepted）

你提供的簽核文字：

- 「我同意進 staging read-only 真實行情 dry-run。」
- 「我同意先做 shadow comparison。」
- 「我同意保留 rollback / kill switch。」
- 「我確認本階段禁止下單、禁止自動交易、禁止券商 API。」

對應 V70 ledger：`OWNER_MANUAL_SIGNOFF` / `SHADOW_COMPARISON_PLAN` / `ROLLBACK_RUNBOOK` / `KILL_SWITCH_CONFIRMATION` —— **簽核文字已收到（wording received）**，但：

- 仍維持 ledger `evidenceProvided=false` / `evidenceAccepted=false` / `manualSignoffCompleted=false`（contract 旗標未動）。
- 原因：sign-off 只是「同意進入 dry-run 階段」，**實際接入仍需 Step 2/3 齊備 + 下一版實作審查**；在那之前不接、不連、不翻旗標。
- rollback plan / kill switch plan 目前是「同意保留」的**意向**，尚缺**具體步驟描述**（出錯時如何 30 秒退回 fixture / 如何即時停用真實報價）——待你補上步驟文字。

狀態：**sign-off WORDING RECEIVED；尚未轉為 accepted；rollback / kill switch 具體步驟仍 PENDING。**

---

## E. 本輪結論 / 仍鎖定狀態

- decision = **NO_GO**（不變）。
- productionReady = false、realDataConnected = false、stagingConnectionAllowed = false、manualSignoffCompleted = false（全部不變）。
- V60–V74 safety chain 不受影響；未改 runtime、未改 API、未連資料、未讀 env、未 fetch。
- 禁止事項全部維持：no broker API、no order execution、no auto order、no write、no production switch。

---

## F. 還缺哪些才能進下一版（staging read-only dry-run implementation 規劃）

1. **Step 2**：staging project **遮蔽** ref + read-only role「已確認」+ RLS select-only「已確認」+ write-blocked「已確認」（三項各擇「已確認」並附一句確認語）。
2. **Step 3**：實際 env **名稱清單**（不含值）。
3. **Step 4 補件**：rollback 具體步驟 + kill switch 具體步驟（各 1–3 行）。

以上補齊後，下一版才會以 spec/checklist 記錄「evidence 齊備度」，並規劃 read-only + shadow comparison 的實作（仍不下單、仍不接 broker、仍以 fixture 為預設）。**任何旗標仍只在你最終逐項確認後、且有對應 evidence 時才會處理，且永遠由你指示。**
