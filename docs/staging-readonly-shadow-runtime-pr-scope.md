# Staging Read-only Shadow Runtime — PR Scope (scope-only, not implemented)

本文件**只定義「下一步 runtime implementation 的 PR scope 與安全邊界」**：列出未來若要啟用 shadow runtime 會新增 / 修改哪些檔案、介面、provider、validator、UI 狀態與 rollback 流程。

**這一版仍然不得真正實作 runtime、不得連線、不得 fetch、不得讀 env、不得接真實行情。** 本 PR 只新增此文件，不改 runtime、不改 API、不連資料。對應 Phase 2 Locked Interface（PHASE_2_LOCKED_INTERFACE）與 Phase 2b Shadow Comparison UI Shell（real quote candidate 固定 DISABLED）。

---

## 1. Scope goal

- **define implementation scope only**（只定義範圍）。
- **no runtime execution**（不執行 runtime）。
- **no connection**（不連線）。
- **no fetch**（不 fetch / no axios）。
- **no env read**（不讀 env value）。
- **no production switch**（不切 production、不切 /api/portfolio）。

本文件是「未來 PR 的藍圖」，不是該 PR 本身；任何實作都需另一次 owner 明確同意（見第 7 節）。

---

## 2. Proposed implementation files for future runtime PR（尚未建立）

以下檔案為**未來** runtime PR 才會新增，本版**不建立**：

- `services/market-data/public-quote-provider.types.ts` — read-only public quote provider 型別（沿用 Phase 2 `QuoteProvider` / `ReadonlyQuoteSnapshot` 形狀）。
- `services/market-data/yahoo-readonly-provider.ts` — Yahoo read-only provider（唯一「未來」可含受限 network code 的位置之一）。
- `services/market-data/twse-tpex-verification-provider.ts` — TWSE / TPEx 官方查核層 provider（read-only）。
- `use-cases/war-room/build-shadow-runtime-comparison.ts` — 以真實 candidate vs fixture 做 shadow 比對的 runtime builder（仍 non-operational）。
- `scripts/validate-staging-shadow-runtime.ts` — 未來 runtime PR 的 validator（含第 6 節檢查）。
- `docs/staging-readonly-shadow-runtime.md` — 未來 runtime 的實作說明文件。

> 本版**沒有**建立上述任何檔案；它們只是 scope 清單。`services/market-data/` 目錄在本版不存在。

---

## 3. Future env semantics（語義保留，本版不讀值）

- `REAL_DATA_MODE=fixture` **remains default**（預設永遠 fixture；缺值 / 未知值 fail-safe 回 fixture）。
- `REAL_DATA_MODE=shadow` **allowed only after explicit approval**（僅在 owner 明確核准後才允許）。
- `REAL_DATA_MODE=real-readonly` **remains locked**（本階段與下一版仍鎖定）。
- `NEXT_PUBLIC_REAL_DATA_ENABLED=false` **remains kill switch default**（kill switch 預設關閉）。
- `REAL_QUOTE_PROVIDER=mixed-public` **planned**（規劃以官方為主、Yahoo 備援的公開來源）。
- `SUPABASE_URL` name exists but **runtime use still gated**（名稱存在但 runtime 使用仍受 gate 管制）。
- `SUPABASE_READONLY_ANON_KEY` name exists but **runtime use still gated**。
- **service role key forbidden**（app runtime 永遠禁用 service role key）。

---

## 4. Future provider rules

- **Yahoo read-only candidate**（第一順位公開來源，read-only）。
- **TWSE / TPEx official verification layer**（官方查核層，與 Yahoo 對照）。
- **Goodinfo not first real-time provider**（不作為第一即時來源）。
- **no broker provider**（不接任何券商 / broker provider）。
- **no order provider**（不接任何下單 provider）。
- **no auto order**（不自動下單）。
- **provider must return read-only snapshot only**（provider 只能回傳 read-only snapshot；不得有寫入 / 下單 / 操作能力）。

---

## 5. Future shadow runtime behavior

- **fixture remains primary**（fixture 永遠是主來源）。
- **real quote candidate shown only as comparison**（真實 candidate 只作並排比較）。
- **shadow result cannot generate trading action**（shadow 結果不得產生任何交易動作）。
- **operationalUseAllowed=false**。
- **buySellCommandGenerated=false**。
- **autoOrderRequested=false**。
- **maps conflicts to V67 / V68 / V69 downgrade logic**（衝突 / 過期 / 缺值映射回既有降級鏈：SOURCE_CONFLICT / STALE_DATA / MISSING_DATA → SHOW_BLOCKED_*；observation only）。

---

## 6. Future validator requirements（未來 `validate-staging-shadow-runtime.ts` 必含）

- **service role absence check**（確認 app runtime 不含 service role key）。
- **no DB write check**（無 insert / upsert / update / delete）。
- **no API route switch check**（未切換真實 API route）。
- **no /api/portfolio switch check**。
- **no productionReady check**（productionReady 仍 false）。
- **no order / broker / auto order check**（無下單 / 券商 / 自動交易能力）。
- **only approved read-only provider files may contain limited network code in future runtime PR**（只有被核准的 read-only provider 檔案在未來 runtime PR 才可含受限 network code）。
- **this current PR must contain no network code**（本版 PR 不得含任何 network code）。

---

## 7. Required approval before actual runtime implementation

實際開始 runtime 實作前，須**同時**滿足：

1. **owner reconfirms**：owner 明確說「進行 staging read-only shadow runtime implementation」。
2. **PR scope approved**：本文件所列 scope 被核准（哪些檔案、哪些介面）。
3. **test:safety-chain green**。
4. **GitHub Actions green**（Safety Chain workflow）。
5. **default remains fixture**（REAL_DATA_MODE 預設仍 fixture）。
6. **kill switch remains false**（NEXT_PUBLIC_REAL_DATA_ENABLED 預設仍 false）。
7. **production switch remains blocked**（productionSwitchAllowed 仍 false、不切 /api/portfolio）。

在上述齊備且 owner 逐項放行前，**不建立任何連線、provider 實作或 network code**，也不翻任何 manual sign-off / staging connection / production switch 旗標。

---

## 8. Explicit forbidden list for this scope-only PR

本版（scope-only）一律禁止：

- no Supabase connection
- no env read
- no fetch
- no axios
- no real market data
- no API route
- no /api/portfolio switch
- no DB write
- no buy/sell command
- no auto order
- no broker API
- not PRODUCTION_READY

---

## 9. 仍鎖定狀態（本文件未改變任何東西）

- Phase 2 decision = NO_GO；mode = INTERFACE_ONLY_NOT_CONNECTED。
- Phase 2b real quote candidate status = DISABLED；operationalUseAllowed = false。
- test:safety-chain（15 checks）與 GitHub Actions Safety Chain 仍是必過；本版未改任何 runtime / API / 資料連線、未讀 env、未 fetch、未接真實行情。
- 下一步需 owner 明確指示「進行 staging read-only shadow runtime implementation」並滿足第 7 節 approval，我才會著手；屆時仍只先建立被核准的 read-only provider scaffold，真正連線需再一次明確同意。
