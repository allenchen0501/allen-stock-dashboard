# System Safety UI Language Guard

## Purpose

確保 `/system/safety` 安全頁與其直接前台元件的**使用者可見 UI 維持繁體中文**，避免後續改版又把
頁面標題、卡片標題、狀態、警示、描述改回英文。此 guard 為純靜態檢查的 standalone validator。

## Rules

- **code identifiers may remain English** — 程式碼、檔名、變數、type、script、contract、
  validator、enum、JSON key、commit message 可使用英文。
- **user-visible UI must be Traditional Chinese** — page title / section title / card title /
  button / label / status / warning / description / dashboard text / safety page display text /
  analysis conclusion 一律繁體中文，不得只出現英文。
- **allowed technical tokens** — 可保留必要技術縮寫 / 狀態碼 / contract key（例如
  API、CI、JSON、Supabase、TWSE、TPEx、mock、fixture、NO_GO、READY_FOR_CI_GUARD、
  operationalUseAllowed、productionSwitchAllowed），但必須在同段落或鄰近文字有繁中說明。
- **disallowed pure-English UI titles** — 例如 `Engineering Safety`、
  `Allen Score Engine / Trade Plan Consistency`、`Descriptor-to-Real Quote Mapping Readiness`、
  `Authorized Real Quote Field Catalog`、`Real Quote Source Conflict Resolution Policy`、
  `Timeout Boundary Validator`、`Mock Fetch Boundary`、`Default No-Fetch Boundary` 不得作為
  純英文標題出現（若保留英文技術名，需以「繁中（English 技術名）」並列、繁中為主）。
- **no direct true / false display** — UI 不得直接顯示 `true` / `false`；以 `zhBool()`
  轉成繁中（是／否、允許／禁止、已完成／未完成…），底層 contract key 不更動。

## Scope checked

- `app/system/safety/page.tsx`
- `components/war-room/shadow-quote-comparison-card.tsx`
- `components/runtime-pilot-readiness.tsx`
- `components/runtime-pilot-monitoring.tsx`
- `components/first-authorized-source-dry-run-monitoring.tsx`
- `components/shadow-runner-dry-run-monitoring.tsx`

## What the validator asserts

1. 安全頁與 5 個前台元件存在。
2. page heading 含 `工程安全監控` / `系統安全監控`，且頁面含必要繁中關鍵詞（安全鏈、黃金快照、
   模擬請求、預設不請求、逾時、中止、人工簽核、正式切換、不可作為正式操作依據…）。
3. 頁面所有 `<h2>` 標題皆含中文（無純英文標題）；已移除的純英文標題不得復現。
4. monitoring 元件的 h2 標題以**繁中為主**，英文技術名只能在括號內並列。
5. shadow comparison card 保留繁中警示語（此卡僅為介面外殼 / 無買賣指令…）。
6. 頁面 + card 不得以 `{String(…)}` 直接顯示布林，需用 `zhBool()`；頁面不得出現 `>true<` / `>false<`。
7. 允許的技術 token（operationalUseAllowed、NO_GO、READY_FOR_CI_GUARD、productionReady）在頁面
   皆伴隨繁中說明。
8. safety-chain 仍 22 checks；本 guard 與 smoke script 皆不在 `test:safety-chain`。
9. provider runtime 未修改、無新增 symbol / Yahoo / API route / /api/portfolio switch /
   Supabase / process.env / broker API / 買賣指令 / 自動下單。

## Boundaries

- **validator remains standalone initially** — `test:system-safety-ui-language` 不納入
  `npm run test:safety-chain`。
- **safety-chain remains 22 checks** — 本版不更動 safety-chain 組成。
- **no runtime / no fetch / no smoke** — 純靜態讀檔，不打網路、不跑 smoke、不改 provider runtime。

## Monitoring components boolean readouts

monitoring 元件（runtime-pilot-readiness / monitoring、first-authorized-source-dry-run-monitoring、
shadow-runner-dry-run-monitoring）內部技術讀數已逐欄位人工分類並繁中化：

- **boolean readouts are localized** — 布林讀數改以 `zhBool()`（是／否、允許／禁止、需要／不需要、
  已啟用／未啟用…）呈現；通用列渲染 `KV` 改用 `zhDisplay()`（布林→繁中、其餘保留原值）。不再直接顯示
  `true` / `false`。
- **numeric readouts remain numeric** — 數字讀數（例如 criticalGateCount 等計數）保留 `String(number)`，
  不轉成 zhBool。
- **status-code readouts may remain technical but require Chinese explanation** — 狀態碼 / id /
  enum / 時間戳（例如 sourceId、stockId、beforeStatus、afterStatus、activatedAt、lifecycleState、
  readinessDecision）保留技術值，但旁邊加繁中說明。
- **no direct true / false UI display** — guard 以 `05b_monitoring_no_raw_boolean` 檢查 4 個
  monitoring 元件：必須使用 `zhBool()`、不得殘留 `String(<boolean>)`、不得出現字面 `true` / `false`。
