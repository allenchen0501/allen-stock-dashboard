# Limited Live Fetch Dry-run Implementation

本文件描述 **limited live fetch dry-run implementation**：在唯一的 approved provider 檔案內，加入受限的、唯讀的、shadow-only 的 live fetch dry-run 能力。

> 本版**不是**正式 real quote connection、**不是** production data switch、**不是** Supabase connection、**不是** `/api/portfolio` switch、**不是** trading signal、**不是**下單、**不是**自動交易。

Owner 明確同意文字：

> 我同意進行 limited live fetch dry-run implementation，僅限 approved provider、shadow-only、default fixture、不切 /api/portfolio、不下單、不自動交易。

---

## A. Scope

- **approved provider only**：唯一允許出現受限 fetch 的檔案是
  `services/market-data/twse-tpex-verification-provider.ts`。其他檔案不得新增 fetch / axios / network code。
- **first symbol 3019 only**（亞光）。其他 symbol 一律 fallback 到 disabled scaffold candidate。
- **endpoint channel tse_3019.tw only**。
- Endpoint template（public，read-only）：
  `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_3019.tw&json=1&delay=0`

---

## B. Network constraints

- **GET only**（no POST / PUT / PATCH / DELETE）
- **timeout 3000ms**（AbortController）
- **maxRetries 0**（single attempt, no retry loop）
- one symbol per dry-run
- no cookies / credentials / auth header
- public endpoint only
- response schema validation required
- field allowlist required（只允許 `c / z / o / h / l / y / v / tlong`）
- **fallback to disabled scaffold candidate** on any failure（timeout、非 2xx、JSON parse error、schema / field error）

---

## C. Behavior

- `buildTwseTpexVerificationProviderScaffold().getReadonlyQuoteCandidate(symbol)` 預設
  `dryRunLiveFetch=false` → 回 scaffold candidate，**不做任何 network call**。app 預設不會 live fetch。
- 只有明確傳入 `{ dryRunLiveFetch: true }` 且 `symbol === "3019"` 才會委派到
  `getTwseTpexLimitedLiveFetchCandidate("3019")`。
- `getTwseTpexLimitedLiveFetchCandidate(symbol)` 永不 throw；任何失敗都 fallback。
- `isConnected` 只代表 source fetch 成功，**不代表 operational、不代表 production ready**。

---

## D. Safety boundary

- shadow-only
- default fixture（defaultRealDataMode 仍為 fixture）
- operationalUseAllowed=false
- buySellCommandGenerated=false
- autoOrderRequested=false
- productionReady=false
- no /api/portfolio switch
- no API route
- no Supabase
- no @supabase / no createClient
- no process.env
- no DB write
- no broker API
- no buy/sell command
- no auto order
- not production ready

---

## E. Commands

- `npm run test:limited-live-fetch-dry-run-implementation`：靜態驗證 implementation
  （只在 approved provider 出現 fetch、受限 shape、fallback、non-operational）。
- `npm run smoke:limited-live-fetch:3019`：**manual smoke script only**。手動執行真的抓 3019；
  失敗則顯示 fallback candidate，不影響 build / validator。

---

## F. Not in safety chain yet

本版的 implementation validator 與 smoke script **尚未**併入 `npm run test:safety-chain`。
manual smoke script 永遠不得列入 safety chain。implementation validator 需經 owner review 後，
在後續 "Limited Live Fetch Dry-run Implementation Safety Chain Integration" 才會單獨併入。

（現有的 `test:limited-live-fetch-dry-run-pr-scope` 與 `test:staging-shadow-runtime-scaffold`
已更新：approved provider 檔案 `fetch(` 被豁免，但其他 forbidden token 仍照舊強制，且其他檔案仍不得 fetch。）
