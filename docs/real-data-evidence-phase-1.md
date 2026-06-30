# Real Data Evidence Phase 1 — Staging Read-only Evidence Intake Plan

本文件整理進入真實行情 **read-only dry-run** 前，使用者（Allen，owner and user）需要提供的**非敏感** evidence 清單與操作步驟。

本文件**只是計畫**，不接真實資料、不讀 env、不連 Supabase、不 fetch、不新增 API route、不切 /api/portfolio、不產生買賣指令、不自動下單、不標記 production ready。對應 V70 Unified Connection Evidence Ledger 的 20 項 evidence，本階段先收斂出「使用者實際要交付什麼」。

> ⚠️ 安全提醒：本階段所有交付物都是**名稱 / 文字描述 / 遮蔽參考**，絕對不要貼任何密鑰或值。

---

## 1. 目前狀態（Current State）

- V74 completed（GitHub Actions Safety Chain workflow 已上線）。
- fixture/mock safe mode（目前畫面與分數全部為 fixture/mock，不可作為正式操作依據）。
- productionReady = false。
- realDataConnected = false。
- stagingConnectionAllowed = false。
- manualSignoffCompleted = false、actualEvidenceAttached = false（V70 ledger 全部 PENDING）。
- V60–V73 safety chain 全綠、`npm run test:safety-chain` 通過、CI guard 已接 GitHub Actions。

---

## 2. 下一階段目標（Next Phase Goal）

- staging read-only real quote dry-run（只在 staging、只讀）。
- **read-only only**：只讀取報價 / 持股，不寫任何資料。
- **no order execution**：不執行任何下單。
- **no broker trading API**：本階段完全不接券商下單 API。
- **no auto order**：不自動下單、不產生買賣指令。
- 目的：先驗證「真實報價讀進來」與「fixture 對照（shadow comparison）」一致，仍維持 fixture 為預設、真實資料僅供比對標示。

---

## 3. 使用者需要提供的 Evidence（非敏感）

請以**文字 / 名稱 / 遮蔽參考**提供，逐項對應 V70 ledger：

| # | Evidence | 形式（只給這些，不給值） | 對應 V70 item |
|---|----------|--------------------------|----------------|
| 1 | Owner manual sign-off wording | 一句你本人同意「進入 staging read-only dry-run」的簽核文字 + 日期 | OWNER_MANUAL_SIGNOFF |
| 2 | Preferred real quote source | 從 Yahoo / TWSE / TPEx / Goodinfo 中指定優先序（例如 TWSE 優先、Yahoo 備援） | SOURCE_AUTHORIZATION_* |
| 3 | Supabase staging project reference | staging 專案的**遮蔽**參考（例如 `proj_****abcd`），不要 URL、不要 key | STAGING_SUPABASE_PROJECT_CONFIRMATION |
| 4 | Vercel env variable **names only** | 只列環境變數**名稱**（例如 `SUPABASE_URL`、`SUPABASE_ANON_KEY`），**不要值** | API_ROUTE_NO_SWITCH_CONFIRMATION |
| 5 | Read-only role confirmation | 一句確認 dashboard 使用 read-only role 的文字 | STAGING_READONLY_ROLE_CONFIRMATION |
| 6 | RLS select-only confirmation | 一句確認 RLS 僅允許 select（無 insert/update/delete）的文字 | RLS_SELECT_ONLY_CONFIRMATION |
| 7 | Write operation blocked confirmation | 一句確認所有寫入被阻擋的文字 | WRITE_OPERATION_BLOCK_CONFIRMATION |
| 8 | Rollback plan | 一段「出錯時如何 30 秒內退回 fixture」的步驟描述 | ROLLBACK_RUNBOOK |
| 9 | Kill switch plan | 一段「如何立即停用真實報價、退回 fixture」的描述 | KILL_SWITCH_CONFIRMATION |
| 10 | Shadow comparison approval | 一句同意「先做 fixture vs real 並排比對、不直接切換」的文字 | SHADOW_COMPARISON_PLAN / RESULT |

---

## 4. 明確禁止（Do NOT）

- **do not paste secrets**（不要貼任何密鑰 / token / 連線字串值）。
- **do not paste service role key**（不要貼 Supabase service role key）。
- **do not paste broker API key**（不要貼券商 API key）。
- **do not connect production**（不要連 production Supabase / 不要動 production 資料）。
- **do not enable write**（不要開任何寫入權限）。
- **do not enable buy/sell command**（不要啟用買賣指令）。
- **do not enable auto order**（不要啟用自動下單）。

只要看到要你貼「值 / key / token / 連線字串」的步驟，一律停下來——本階段不需要任何密鑰。

---

## 5. 建議第一階段資料源（Recommended Source Order）

- **public quote source first**：先用公開報價來源（Yahoo / TWSE / TPEx / Goodinfo）做 read-only 報價，風險最低、不需密鑰即可驗證對照。
- **Supabase holdings second**：第二步才考慮 staging Supabase read-only 讀「持股結構」（仍只讀、仍遮蔽、仍 select-only）。
- **broker API never in this phase**：本階段**完全不接**券商交易 API（不讀、不接、不下單）。

---

## 6. 下一步 Checklist

- **Step 1：確認資料源** — 指定 public quote source 優先序（Yahoo / TWSE / TPEx / Goodinfo），確認本階段不接 broker API。
- **Step 2：準備 staging read-only** — 準備 staging Supabase 專案的遮蔽參考 + read-only role + RLS select-only + write-blocked 三項確認文字。
- **Step 3：準備 env names only** — 列出需要的環境變數**名稱清單**（不含值），供下一版規劃 mapping，不在本階段填入。
- **Step 4：人工簽核** — 提供 owner manual sign-off wording（同意進入 staging read-only dry-run）+ rollback / kill switch / shadow comparison 同意文字。
- **Step 5：進入下一版 staging read-only dry-run implementation** — 待以上 evidence 齊備且你逐項確認後，下一版才開始規劃實作（仍 read-only、仍 shadow、仍不下單）。

---

## 7. 收到 Evidence 後的處理原則

- 我會把你提供的**非敏感** evidence 對應回 V70 ledger 的 PENDING 項目，並在下一版以 spec/checklist 形式記錄「哪些 evidence 已備、哪些仍缺」。
- 在所有 blocker 解除前，`decision` 仍維持 **NO_GO**、`productionReady` 仍 **false**、`stagingConnectionAllowed` 仍 **false**。
- 我**不會**自行翻 manual sign-off / staging connection / production switch 任何旗標；翻旗標永遠需要你本人明確指示，且需有對應 evidence。
