# 3019 Approved Live Quote Manual-Refresh MVP

3019 核准真實報價手動刷新 MVP。

## Purpose

- 建立第一檔核准真實報價 MVP（read-only real quote MVP）。
- 只限 3019（亞光）。
- 只限 TWSE_TPEX provider。
- 只限 approved channel `tse_3019.tw`。
- 只允許手動刷新（manual refresh only）。
- 不代表 production data switch。
- 不代表 `/api/portfolio` switch。
- 不代表交易訊號。
- 不代表買賣建議。
- 不代表自動下單。

這是既有 limited live fetch dry-run 的最小前台整合：把已核准的 3019 唯讀報價，接到 War Room
的「手動刷新」按鈕上顯示，讓 owner 可以在需要時手動看一次真實報價。它不是正式行情全切、不是
自動交易、不是完整交易系統。

## Default Behavior

- 預設 War Room page load 不打真實行情：頁面載入只讀取既有 fixture-only 的 `/api/war-room`
  合約端點，不會自動呼叫真實報價端點。
- 只有 user manual refresh（按下「手動刷新 3019」）才允許一次 3019 read-only quote request。
- manual refresh **不是自動交易**：每次都由使用者手動觸發，系統不會自動、不會定時、不會背景
  重複抓取。
- manual refresh **不是 broker action**：只讀取公開行情，不連接任何 broker，不下單、不改單、
  不查詢帳戶。
- 任何失敗（timeout / source_error / 未連線）都回退到安全狀態，`dataStatus` 顯示 fallback /
  timeout / source_error / not_available，price 一律為 `null`，**不假造價格**。

## API

- Route：`app/api/war-room/approved-live-quote/route.ts`
- Method：`GET /api/war-room/approved-live-quote?symbol=3019&mode=manual`
- 只接受 `symbol=3019` 且 `mode=manual`；其他 symbol / mode 一律 reject（不 fetch，
  `requestPerformed=false`，`dataStatus=not_available`）。
- 真正的唯讀 live fetch 沿用既有 approved provider
  `services/market-data/twse-tpex-verification-provider.ts`
  （`getTwseTpexLimitedLiveFetchCandidate`，GET only、timeout 3000ms、maxRetries 0、
  approved channel `tse_3019.tw`、field allowlist、schema validation、任何失敗 fallback）。

### Response shape

```
{
  mvpVersion: "V1";
  symbol: "3019";
  nameZh: "亞光";
  sourceProvider: "TWSE_TPEX";
  approvedChannel: "tse_3019.tw";
  fetchMode: "manual_refresh_only";
  dryRunLiveFetch: true;
  quote: {
    price, previousClose, open, high, low, volume,
    change, changePercent,
    sourceTimestamp: string | null,   // 不可取得時為 null，不假造
    fetchedAt: string
  };
  dataStatus: "live_verified" | "fallback" | "timeout" | "source_error" | "not_available";
  uiStatusZh: string;      // 繁體中文
  sourceNoteZh: string;    // 資料來源 + 手動刷新
  safetyNoteZh: string;    // 非買賣建議、非進場訊號、非自動下單
  requestPerformed: boolean;
  supabaseConnected: false;
  productionWritePerformed: false;
  brokerConnected: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  notTradeAdvice: true;
  notEntrySignal: true;
}
```

- `price` 若不可取得，必須為 `null`，不得假造價格。
- `sourceTimestamp` 若不可取得，必須為 `null`。
- `uiStatusZh` 必須繁中。
- `sourceNoteZh` 必須列資料來源與手動刷新。
- `safetyNoteZh` 必須明確寫「非買賣建議、非進場訊號、非自動下單」。

## Live Fetch Boundary

- approved live-fetch symbols remain exactly `["3019"]`.
- non-3019 symbols are rejected.
- no Yahoo.
- no new provider.
- no new TPEx channel（僅 `tse_3019.tw`）。
- no Supabase.
- no process.env.
- no DB write.
- no broker API.
- no buy/sell command.
- no auto order.
- no production data switch.
- no `/api/portfolio` switch.

## UI Language Rule

- user-visible UI must be Traditional Chinese（區塊標題「3019 核准真實報價」、按鈕「手動刷新
  3019」、狀態、資料來源、安全標籤皆繁中）。
- code identifiers may remain English（type / key / enum / route path 仍英文）。
- dataStatus must have Traditional Chinese display text：`live_verified`→「真實報價已驗證」、
  `fallback`→「已降級為備援（fixture／未連線）」、`timeout`→「連線逾時，顯示資料不足」、
  `source_error`→「資料來源錯誤，顯示資料不足」、`not_available`→「資料不足」。
- UI 明確標示：非買賣建議 / 非進場訊號 / 非自動下單。
- fetch 失敗或 timeout 不得讓 UI 崩潰，顯示 fallback / 資料不足。

## Manual Smoke

- 可選擇性執行 `npm run smoke:limited-live-fetch:3019`（既有 smoke）。
- smoke 必須標示為 **manual smoke**，不得納入 safety-chain。
- 若 smoke 失敗，不得假造價格，只能回報 fallback / timeout / source_error。

## Future Allowed Direction

- after MVP review, owner may approve core 5 read-only expansion。
- 4966 / 5347 / 4979 / 2455 require separate owner approval（本版不新增，仍只有 3019）。
- historical K-line contract remains separate。
- backtest remains separate。
- portfolio switch remains separate。

## Red Lines

- 不新增 approved live-fetch symbol；approved live-fetch symbols 必須仍只有 3019。
- 不標記 production trading ready、不翻 manual sign-off / staging connection / production
  switch 旗標、不修改 safety-chain 組成、本版 validator 不納入 safety-chain。
- This MVP is read-only：not a production data switch, not a `/api/portfolio` switch, not a
  Supabase runtime, not a trade signal, not buy/sell advice, not an order, not auto trading.
