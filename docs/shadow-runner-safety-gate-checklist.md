# Shadow Runner Safety Gate Checklist

本文件定義 Allen Stock Dashboard 的 **Shadow Runner Safety Gate Checklist**：把 V44～V53 的安全不變量收斂成一份單一、可驗證、可人工 sign-off 的 checklist，作為**進入 V55 Staging Read-only Connection Review 前的最後 final checklist 與總閘門**。

**本階段只新增 checklist contract、pure deterministic builder、validator、文件，並更新 package.json 與 README。本輪不是新功能、不是 UI 改版、不是 API route 改版、不是 staging Supabase 實作、不是 production 真實資料上線、不是 actual staging connection、不是 actual shadow runner runtime。**

只有 V54 checklist 全部 blocking item PASS，且 `manualSignoffRequired = true` 被人工確認（`manualSignoffCompleted` 由 false 改 true）後，下一版才允許進入 **V55 Staging Read-only Connection Review Gate**。

相關文件：V44–V53 全部 staging / shadow-runner spec 與 evidence 文件。

---

## A. Scope

- V54 是 Shadow Runner Safety Gate Checklist。
- V54 是進入 staging read-only connection review 前的最後 checklist。
- V54 不是新功能。
- V54 不新增 UI。
- V54 不新增 API route。
- V54 不連 staging Supabase。
- V54 不接 production Supabase。
- V54 不讀 Supabase env key。
- V54 不寫 staging。
- V54 不寫 production。
- V54 不新增 SQL migration。
- V54 不建立 Supabase client。
- V54 不建立 actual shadow runner runtime。
- V54 不執行 actual shadow runner。
- V54 不切換 /api/portfolio。
- V54 不建立 quote polling / scheduler / webhook / crawler / connector runtime。
- V54 不接真實行情。
- V54 不產生買賣指令。
- V54 不自動下單。

---

## B. Checklist Item Shape

每個 checklist item 至少包含：`itemId`、`category`、`title`、`sourceVersion`、`requiredEvidence`、`expectedState`、
`actualState`、`status`、`blocksConnectionReview`、`blocksProductionReadiness`、`manualReviewRequired`、`notes`。

允許的 category：DEPLOYMENT、ROUTE、MONITORING_UI、SUPABASE_SAFETY、RLS、SCHEMA_MAPPING、ADAPTER、
SHADOW_COMPARISON、SHADOW_RUNNER、API_CONTRACT、PRODUCTION_EVIDENCE、DATA_SOURCE、PORTFOLIO_SWITCH、
TRADING_SAFETY、MANUAL_SIGNOFF。

允許的 status：PASS、FAIL、WARNING、NOT_REVIEWED、BLOCKED。

checklist 至少 18 個 item（本實作 31 個），覆蓋全部 15 個 category。

---

## C. Covered Safety Themes

deployment READY、/holdings 200、monitoring UI mounted、endpoint 200、responseSource = mock_or_contract、
sourceMode = fixture、PORTFOLIO_SOURCE_MODE hardcoded、no staging Supabase connection、no production Supabase
connection、no env key、no DB write、no SQL migration、RLS manual matrix evidence、schema mapping spec evidence、
read-only adapter spec evidence、fixture vs staging shadow comparison override guard、shadow runner dry-run promotion
guard、shadow runner API route fixture-only、monitoring UI internal-only fetch、fixture/hardcoded not overridden by
staging、mismatch not promote staging、empty/stale/error not override hardcoded、kill switch default enabled、
/api/portfolio not switched、real market data not enabled、no buy/sell command、no auto order、manual signoff required、
staging connection review blocked、production readiness blocked。

---

## D. Checklist Rules

- 所有 `blocksConnectionReview = true` 的 item 若 status 不是 PASS，decision 必須 NO_GO。
- 所有 `blocksProductionReadiness = true` 的 item 若 status 不是 PASS，decision 必須 NO_GO。
- `manualSignoffRequired = true`。
- `manualSignoffCompleted = false`。
- `stagingConnectionAllowed = false`。
- production readiness 不得開啟（production readiness remains blocked）。
- checklist 可 READY_FOR_REVIEW，但不得表示可以正式接真實資料。
- 不得出現 PRODUCTION_READY。
- manual signoff item 以 `manualSignoffRequired` / `stagingConnectionAllowed` 旗標 gating，不作為 decision blocker；
  因此 decision 可 READY_FOR_REVIEW，但 `stagingConnectionAllowed` 仍固定 false。

---

## E. Safety Language

- Shadow Runner Safety Gate Checklist
- staging read-only connection review
- final checklist
- not production trading system
- no real market data
- no Supabase connection
- no env key
- no DB write
- no staging write
- no production write
- no SQL migration
- no api switch
- no buy/sell command
- no auto order
- responseSource must remain mock_or_contract
- sourceMode must remain fixture
- PORTFOLIO_SOURCE_MODE must remain hardcoded
- fixture/hardcoded must not be overridden by staging
- mismatch must not promote staging
- empty / stale / error result must not override hardcoded
- kill switch must be enabled by default
- manualSignoffRequired = true
- manualSignoffCompleted = false
- stagingConnectionAllowed = false
- production readiness remains blocked
- production route smoke passed = true
- monitoring UI production evidence passed = true
- fixture/mock UI 仍維持現狀
- 不自動下單
- 不產生買賣指令
- 不替代投資判斷
- 資料不足就顯示資料不足

---

## F. Decision

- `decision` 預設 READY_FOR_REVIEW（所有 blocking evidence item PASS）。
- 允許 READY_FOR_REVIEW / NO_GO / BLOCKED / NOT_REVIEWED。
- READY_FOR_REVIEW 不代表可正式接真實資料；`stagingConnectionAllowed` 仍 false、production readiness remains blocked。
- V54 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## G. Future Gate

下一階段才是 **V55 Staging Read-only Connection Review Gate**（需 V54 全綠且 manual sign-off 完成後才可進入）。

- 仍限 staging。
- 仍限 read-only。
- 仍不寫 production。
- 仍不產生買賣指令。
- 仍不自動下單。
- kill switch 仍須可停止。
