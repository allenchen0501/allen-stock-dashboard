# Limited Live Fetch Dry-run PR Scope (scope-only, no network code added)

本文件**只定義下一階段「有限 live fetch dry-run」的 scope 與安全邊界**，並新增一支 scope validator。

**這一版仍然不得真的 live fetch、不得新增 network code、不得讀 env、不得連 Supabase、不得切 /api/portfolio。** 本 PR 只新增此文件與 validator，未修改 `services/market-data/` 任何 provider runtime file、未新增任何 fetch / network code。

---

## 1. Scope goal

- **define limited live fetch dry-run scope only**（只定義範圍）。
- **no runtime execution** in this PR（本 PR 不執行 runtime）。
- **no network code in this PR**（本 PR 不含 network code）。
- **no env read** in this PR（本 PR 不讀 env）。
- **no Supabase connection** in this PR（本 PR 不連 Supabase）。
- **no production switch**（不切 production、不切 /api/portfolio）。

本文件是「未來 PR 的藍圖」；任何實際 live fetch 都需另一次 owner 明確同意（見第 8 節）。

---

## 2. First approved candidate source proposal

- **Primary candidate：TWSE / TPEx official public read-only quote endpoint**（上市 TWSE、上櫃 TPEx 官方公開 read-only 報價端點，作為第一個 live fetch 候選）。
- **Yahoo remains future candidate, not first implementation**（Yahoo 仍是未來候選，不是第一版實作）。
- **Goodinfo not used for first live fetch**（Goodinfo 不用於第一次 live fetch）。
- **broker API permanently forbidden**（券商 / broker API 永久禁止；不接、不下單）。

---

## 3. Candidate symbol universe for first dry-run

第一次 dry-run 的候選股池：

- 3019 亞光
- 4966 譜瑞
- 5347 世界
- 4979 華星光
- 2455 全新
- 2743 山富

> dry-run may start with one symbol only before expanding（可先只跑一檔，驗證穩定後再擴大）。

---

## 4. Future implementation boundaries

- **Only one provider file may contain limited network code after explicit owner approval**（owner 明確同意後，只有單一被核准的 provider 檔案可含受限 network code）。
- **No network code outside approved provider file**（被核准檔案以外不得有任何 network code）。
- No API route。
- No /api/portfolio switch。
- No DB write。
- No Supabase。
- No service role。
- No broker。
- No buy/sell command。
- No auto order。
- Not production ready。

---

## 5. Future runtime constraints

- **default remains fixture**（預設永遠 fixture；缺值 / 失敗 fail-safe 回 fixture）。
- **live fetch allowed only in shadow comparison path**（live fetch 只能在 shadow 並排比較路徑，不取代 fixture、不可操作）。
- operationalUseAllowed=false。
- buySellCommandGenerated=false。
- autoOrderRequested=false。
- productionReady=false。
- source timestamp required（sourceTimestamp 必填）。
- fetchedAt required（fetchedAt 必填）。
- sourceName required（sourceName 必填）。
- verificationStatus required（verificationStatus 必填）。
- stale detection required（過期偵測必做）。
- conflict detection required（衝突偵測必做）。
- **fallback to disabled scaffold candidate on any failure**（任何失敗一律 fallback 回 disabled scaffold candidate）。

---

## 6. Future network safety

- timeout required（必設逾時）。
- max retries = 0 or 1（最多重試 0 或 1 次）。
- rate limit required（必設速率限制）。
- no cookies。
- no auth header。
- no credentialed request。
- public endpoint only（只打公開端點）。
- no write method。
- **GET only**。
- **no POST / PUT / PATCH / DELETE**。
- response schema validation required（回應需做 schema 驗證）。
- field allowlist required（只取 allowlist 欄位）。

---

## 7. Future validator requirements（未來 live fetch PR 的 validator 必含）

- confirm only approved provider has fetch（只有被核准 provider 可含 fetch）。
- confirm no process.env。
- confirm no Supabase。
- confirm no API route。
- confirm no /api/portfolio switch。
- confirm productionReady=false。
- confirm operationalUseAllowed=false。
- confirm no buy/sell command。
- confirm no auto order。
- confirm no broker API。
- confirm service role forbidden。
- confirm fallback path exists（fallback 路徑存在）。

---

## 8. Required owner approval before actual limited live fetch

實際開始 limited live fetch 前，須**同時**滿足：

1. owner must explicitly say：
   > 「我同意進行 limited live fetch dry-run implementation，僅限 approved provider、shadow-only、default fixture、不切 /api/portfolio、不下單、不自動交易。」
2. CI green（`npm run test:safety-chain`）。
3. GitHub Actions green（Safety Chain workflow）。
4. provider endpoint listed（明列要打的端點 URL）。
5. timeout / rate-limit / fallback listed（明列逾時、速率限制、fallback 行為）。
6. no production switch。

在上述齊備且 owner 逐項放行前，**不建立任何 network code、不 live fetch、不讀 env、不連 Supabase**，也不翻任何 manual sign-off / staging connection / production switch 旗標。

---

## 9. Explicit forbidden list for this scope-only PR

本版（scope-only）一律禁止：

- no fetch
- no axios
- no process.env
- no Supabase
- no createClient
- no DB write
- no API route
- no /api/portfolio switch
- no real market data
- no broker API
- no buy/sell command
- no auto order
- not PRODUCTION_READY

---

## 10. 仍鎖定狀態（本文件未改變任何東西）

- staging shadow runtime scaffold 維持 decision = NO_GO、mode = SCAFFOLD_ONLY_NOT_CONNECTED、liveFetchAllowed = false、serviceRoleForbidden = true。
- `services/market-data/` provider 維持 scaffold-only / NOT_CONNECTED；本 PR 未加任何 fetch / network code。
- test:safety-chain（16 checks）與 GitHub Actions Safety Chain 仍是必過。
- 下一步需 owner 明確說出第 8 節同意文字並滿足條件，才會開始 limited live fetch implementation；屆時仍只在被核准的單一 provider 檔案內加受限 network code，shadow-only、default fixture、不下單。
