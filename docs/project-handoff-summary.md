# Project Handoff Summary

## 3019 Post-Deployment Explicit Manual Mode Verification Handoff Addendum

- 3019 Post-Deployment Explicit Manual Mode Verification：針對已部署的 `ec31db1`
  （deployment `dpl_H4sZ3WRCNuGsqtDREP6JgubrQUuc`，READY）重跑 production URL endpoint case，
  確認 route 收緊為「mode 必須明確 manual」後 production 行為正確（4 case 皆 HTTP 200、未假造）。
- production URL endpoint cases after ec31db1：
  - Case A（3019 + manual）→ **verified**：live_verified、price 140、sourceTimestamp 2026-07-01T06:30:00.000Z、requestPerformed=true。
  - Case B（4966 + manual）→ **rejected without fetch**：not_available、requestPerformed=false、price=null、reasonZh「非核准代號」。
  - Case C（3019 缺 mode）→ **收緊後已拒絕**：not_available、requestPerformed=false、price=null、reasonZh「僅允許手動刷新（mode=manual）」。
  - Case D（3019 + auto）→ **rejected without fetch**：not_available、requestPerformed=false、price=null、reasonZh「僅允許手動刷新（mode=manual）」。
- stale dea7f4e Case C evidence superseded：舊部署缺 mode 仍 fetch（live_verified）的行為，已由 ec31db1 收緊後
  的拒絕行為實測取代。
- no price fabrication；approved live-fetch symbols remain **3019 only**；no /api/portfolio switch、no Supabase、
  no DB write、no broker、no buy/sell command、no auto order、no production data switch、no process.env、no Yahoo、no new provider。
- **未修改 provider runtime**、未擴大股票池。
- Standalone validator：`npm run test:approved-live-quote-3019-post-deployment-explicit-manual`（不納入 safety-chain）；
  safety-chain remains 22 checks。
- 不因 Case A 成功就擴大到 core 5；4966／5347／4979／2455 需個別 owner approval。

## 3019 Production Endpoint Case Evidence Backfill Handoff Addendum

- 3019 Production Endpoint Case Evidence Backfill：直接對 production URL endpoint
  `https://allen-stock-dashboard.vercel.app/api/war-room/approved-live-quote` 實跑 4 個 case（GET），
  把實際回應記錄進 smoke report，deployment 執行當下為 `dpl_H4sZ3WRCNuGsqtDREP6JgubrQUuc`（commit dea7f4e，READY）。
- production URL endpoint cases（4 case 皆 HTTP 200，實測、未假造）：
  - Case A（3019 + manual）→ **verified**：live_verified、price 140、sourceTimestamp 2026-07-01T06:30:00.000Z、requestPerformed=true。
  - Case B（4966 + manual）→ **rejected without fetch**：not_available、requestPerformed=false、price=null、reasonZh「非核准代號」。
  - Case C（3019 缺 mode）→ 舊部署因 `mode ?? 'manual'` 預設而 fetch（如實記錄）；**本版收緊 route 為 mode 必須明確 manual**，缺 mode 改拒絕，收緊後將於下一次 deployment 生效驗證。
  - Case D（3019 + auto）→ **rejected without fetch**：not_available、requestPerformed=false、price=null、reasonZh「僅允許手動刷新」。
- 本版最小幅度收緊 route（`searchParams.get('mode')` 不再 `?? 'manual'`，缺少/非 manual 一律拒絕且不 fetch），
  **未修改 provider runtime**、未擴大股票池；rejection 回傳可辨識 reasonZh。
- no price fabrication；approved live-fetch symbols remain **3019 only**；no /api/portfolio switch、no Supabase、
  no DB write、no broker、no buy/sell command、no auto order、no production data switch、no process.env、no Yahoo、no new provider。
- Standalone validator：`npm run test:approved-live-quote-3019-production-endpoint-cases`（不納入 safety-chain）；
  safety-chain remains 22 checks。endpoint case evidence not in safety-chain。
- 不因 endpoint 測試成功就擴大到 core 5；4966／5347／4979／2455 需個別 owner approval。

## 3019 Approved Live Quote Production Smoke Verification Handoff Addendum

- 3019 Approved Live Quote Production Smoke Verification：驗證 commit `36a7220` /
  deployment `dpl_FWMFvQd4poKngGWHBsiYTecAXdMx` 的 3019 manual-refresh MVP production readiness。
- manual smoke verification：real-network `npm run smoke:limited-live-fetch:3019` 於 2026-07-01
  執行結果 **LIVE_FETCH_OK**（price 140、sourceTimestamp 2026-07-01T06:30:00.000Z，皆真實來源值、
  未假造）；若 source 不可用只回報 fallback／timeout／source_error／not_available，price=null。
- approved request 3019 + manual only：只有 `symbol=3019&mode=manual` 可 fetch。
- non-approved symbols rejected without fetch：`symbol=4966` → `requestPerformed=false`、not_available、
  reason「非核准代號」；`mode=auto`（或任何非 manual）→ `requestPerformed=false`、reason「僅允許手動刷新」。
- default page load no fetch：War Room 頁面 useEffect 只讀 fixture `/api/war-room`，approved-live-quote
  僅由「手動刷新 3019」onClick 觸發。
- fallback / timeout / source_error safe UI：price/sourceTimestamp=null、以「資料不足」安全顯示、UI 不崩潰。
- 本版最小幅度修正 route rejection mapping（拒絕時回傳可辨識 reasonZh），**未修改 provider runtime**、
  未擴大股票池；approved live-fetch symbols remain **3019 only**。
- no /api/portfolio switch、no Supabase、no DB write、no broker、no buy/sell command、no auto order、
  no production data switch、no process.env、no Yahoo、no new provider、no new TPEx channel。
- Standalone validator：`npm run test:approved-live-quote-3019-production-smoke`（不納入 safety-chain）；
  safety-chain remains 22 checks。manual smoke not in safety-chain。
- 不因 smoke 成功就擴大到 core 5；4966／5347／4979／2455 需個別 owner approval。

## 3019 Approved Live Quote Manual-Refresh MVP Handoff Addendum

- 3019 Approved Live Quote Manual-Refresh MVP：新增唯讀真實報價路徑
  `app/api/war-room/approved-live-quote/route.ts`（`GET ?symbol=3019&mode=manual`），沿用既有
  approved provider `twse-tpex-verification-provider`（GET only、timeout 3000ms、maxRetries 0、
  approved channel `tse_3019.tw`、field allowlist、任何失敗 fallback）。
- **read-only、manual-refresh only**：預設 War Room page load 不打真實行情；只有使用者按下
  「手動刷新 3019」才取得一次唯讀報價；無自動 / 定時 / 背景 fetch。
- **default page load no fetch**：dashboard 只有 `onClick={refreshApprovedLiveQuote}` 手動觸發，
  頁面載入僅讀取 fixture-only `/api/war-room`。
- 回應 shape：`mvpVersion/symbol/nameZh/sourceProvider/approvedChannel/fetchMode/dryRunLiveFetch/`
  `quote{price,previousClose,open,high,low,volume,change,changePercent,sourceTimestamp,fetchedAt}/`
  `dataStatus/uiStatusZh/sourceNoteZh/safetyNoteZh/requestPerformed/...`；`price`／`sourceTimestamp`
  不可取得時為 `null`，**不假造價格**；`dataStatus`（live_verified／fallback／timeout／source_error／
  not_available）皆有繁中顯示；非 3019／非 manual 一律 reject（`requestPerformed=false`）。
- approved live-fetch symbols remain **3019 only**；no /api/portfolio switch；no Supabase；
  no DB write；no broker；no buy/sell command；no auto order；no production data switch；
  no process.env；no Yahoo；no new provider；no new TPEx channel。
- War Room UI：新增繁中「3019 核准真實報價」區塊（手動刷新按鈕、loading／success／fallback／error、
  股票代號／名稱／價格／前收／開高低／量／漲跌／漲跌幅／資料來源／sourceTimestamp／fetchedAt／
  dataStatus 繁中／非買賣建議 / 非進場訊號 / 非自動下單）。fetch 失敗 / timeout 不讓 UI 崩潰。
- Standalone validator：`npm run test:approved-live-quote-3019-mvp`（不納入 safety-chain）；
  safety-chain remains 22 checks。可選擇性 `npm run smoke:limited-live-fetch:3019`（manual smoke，
  不納入 safety-chain；失敗只回報 fallback / timeout / source_error，不假造價格）。
- future core 5 read-only expansion（4966／5347／4979／2455）require separate owner approval；
  historical K-line / backtest / portfolio switch remain separate。

## Cross-Module Consistency & Candidate Ranking Governance Handoff Addendum

- Cross-Module Consistency Guard：fixture-only 治理層，偵測 Allen Score 100、Allen 17-Line Power Score、
  Technical + Risk Reward、扣三低、Position Strategy 對同一檔股票的方向矛盾，輸出 conflictLevel /
  hardGateStatus / rankingEligible / 繁中 finalObservationLabelZh / safetyNoteZh。
- Candidate Ranking Governance：候選排序分 Hard Gates（Position No Touch / marketStatus DANGER /
  dataQuality FAIL / supportZone 缺失 / invalidLevel 缺失 / conflict critical）+ Weighted Observation
  Score（trend 30 / technical 25 / risk 20 / volume 15 / research 10）兩層。
- **No Touch overrides high scores**：Position Strategy 禁碰凌駕任何 A 級 / 高馬力 / 高風報比訊號。
- **riskRewardRatio is not win rate**：風報比不是勝率；在 setupWinRate / backtest 完成前，
  expected-value ranking not allowed（expectedValueRankingAllowed=false）。
- Technical Score Collinearity Guard 僅建 spec、不重算 Allen Score 100；目前門檻皆未回測校準、
  不得宣稱統計勝率。
- fixture-only、deterministic、no network、no Supabase、no env、no DB write、no API route、no broker API、
  no buy/sell command、no auto order、no production data switch。
- War Room read-model/UI integration：新增 `crossModuleConsistencyItems` /
  `crossModuleConsistencySummary` / `crossModuleConsistencyFixtureVersion="V1"`，dashboard 新增繁中
  「跨模組一致性」區塊（標示非買賣建議 / 非進場訊號 / 非自動下單）。
- Standalone validator：`npm run test:cross-module-consistency-governance`（不納入 safety-chain）；
  safety-chain remains 22 checks；approved live-fetch symbols remain 3019 only。

## 扣三低 Terminology Hotfix + Allen 17-Line Power Score v1.1 Handoff Addendum

- 扣三低 terminology hotfix：正式術語統一為 **扣三低**；常見錯字一律禁用，且只允許出現在
  `scripts/validate-technical-terminology.ts` 的 forbidden typo list；README、docs、handoff summary、
  contract output、UI 一律使用 扣三低。
- Allen 17-Line Power Score v1.1：既有 17 Horsepower scanner 升級（保留 horsepowerScore 0～17，新增
  powerRatio / weightedPower / group scores / nearestSupport / nearestPressure / 量能確認 / 過熱濾網 /
  dataStatus / powerRating / effectiveAttack / strongButOverheated / notTradeAdvice / notEntrySignal）。
- fixture-only、deterministic、no network、no Supabase、no env、no DB write、no API route、no broker API、
  no buy/sell command、no auto order、no production data switch。
- War Room read-model/UI integration：War Room snapshot 新增 `horsepowerScannerItems` /
  `horsepowerScannerSummary` / `horsepowerScannerFixtureVersion="V1_1"`，dashboard 新增繁中「17線馬力分數」
  區塊（標示非買賣建議 / 非進場訊號 / 已確認收盤 / 盤中估算 / 量能確認 / 過熱 / 資料可靠度提醒）。
- observation-only：多週期趨勢強弱篩選器，不是完整交易系統、不是買點、不是買賣指令、不是自動交易；
  與既有 Technical + Risk Reward Strategy Engine、Allen Score 100、Position Strategy Plan 並存。
- approved live-fetch symbols remain 3019 only；no production data switch。
- future integration with 走多逢低 / risk-reward / historical K-line（需 owner approval + 分階段驗證 + manual sign-off）。
- Standalone validator：`npm run test:17-horsepower-scanner`（不納入 safety-chain）；safety-chain remains 22 checks。

## Technical Terminology Guard + 扣三低 Scanner Spec Handoff Addendum

- Production snapshot provided by owner：production commit `b3ff37d`，production deployment `dpl_KVRF26xY6Hw7q2LxHvdhG3QdqB3Z`，production state READY。
- Safety-chain status：22 checks；本階段不得把 terminology guard 或 扣三低 scanner validator 加入 safety-chain。
- Completed scope：Technical Terminology Guard、扣三低 Scanner Spec、fixture-only contract、standalone validators。
- Correct terminology：扣三低；README、handoff summary 與一般文件統一使用正確術語。
- Scanner samples：扣三低通過、等待確認、排除；all samples are observation-only and not buy/sell instruction。
- Standalone validators：`npm run test:technical-terminology`、`npm run test:kou-san-di-scanner`、`npm run test:watchlist-17-horsepower-candidate-matrix`、`npm run test:project-handoff-summary`。
- Current live-fetch state：approved provider remains `TWSE_TPEX`；approved live-fetch symbols remain exactly `["3019"]`；approved channel remains `tse_3019.tw`。
- Current phase restrictions：no provider runtime change、no live fetch、no Yahoo、no new TPEx channel、no API route、no `/api/portfolio` switch、no Supabase runtime、no env key read、no DB write、no broker API、no buy/sell command、no order command、no auto order、no production trading ready。
- Future allowed direction：future integration with Watchlist 17 Horsepower Candidate Matrix、走多回檔甜蜜點、risk/reward model, scanner UI, and manual user decision after owner approval, staged validation, and manual sign-off。

## Watchlist 17 Horsepower Candidate Matrix Handoff Addendum

- Production snapshot provided by owner：production commit `33aabaf`，production deployment `dpl_EkLsiNE6ChJ92ECc8kuWxEKcXfgv`，production state READY。
- Safety-chain status：22 checks；本階段不得把 candidate matrix validator 加入 safety-chain。
- Completed scope：Watchlist 17 Horsepower Candidate Matrix、fixture-only contract、standalone validator、observation-only candidate ranking。
- Source universe：core + extended universe，共 17 檔；approved live-fetch symbols remain exactly `["3019"]`。
- Candidate tags：主升段、逢低候選、觀察、排除；ranking is observation-only and not a buy/sell instruction。
- Standalone validators：`npm run test:watchlist-17-horsepower-candidate-matrix`、`npm run test:watchlist-universe-tier`、`npm run test:17-horsepower-scanner`、`npm run test:project-handoff-summary`。
- Current live-fetch state：approved provider remains `TWSE_TPEX`；approved channel remains `tse_3019.tw`；no new approved live-fetch symbol。
- Current phase restrictions：no provider runtime change、no live fetch、no Yahoo、no new TPEx channel、no API route、no `/api/portfolio` switch、no Supabase runtime、no env key read、no DB write、no broker API、no buy/sell command、no order command、no auto order、no production trading ready。
- Future allowed direction：future integration with 扣三低、走多回檔甜蜜點、risk/reward model, scanner UI, and manual user decision after owner approval, staged validation, and manual sign-off。

## Watchlist Universe Tier Spec Handoff Addendum

- Production snapshot provided by owner：production commit `e93813a`，production deployment `dpl_ChJGNAyEx7jQ8QDuVMhBRX7WLS8k`，production state READY。
- Safety-chain status：22 checks；本階段不得把 watchlist universe validator 加入 safety-chain。
- Completed scope：Watchlist Universe Tier Spec、Core Universe、Extended Universe、Scanner Universe Plan、fixture-only contract、standalone validator。
- Core Universe：3019、4966、5347、4979、2455。
- Extended Universe：3450、3163、6442、3363、2383、2368、3491、2313、2344、6239、8299、3105。
- Current live-fetch state：approved provider remains `TWSE_TPEX`；approved live-fetch symbols remain exactly `["3019"]`；approved channel remains `tse_3019.tw`。
- Boundary：watchlist universe symbol metadata is allowed；new approved live-fetch symbol is not allowed；universe metadata is not live fetch approval。
- Standalone validators：`npm run test:watchlist-universe-tier`、`npm run test:17-horsepower-scanner`、`npm run test:project-handoff-summary`。
- Future allowed direction：future integration with 17 Horsepower、扣三低、走多回檔甜蜜點、candidate ranking、risk/reward reference, and manual user decision after owner approval, staged validation, and manual sign-off。
- Current phase restrictions：no provider runtime change、no live fetch、no Yahoo、no TPEx new channel、no API route、no `/api/portfolio` switch、no Supabase runtime、no env key read、no DB write、no broker API、no buy/sell command、no auto order、no production trading ready。

本文件是 Allen Stock Dashboard 的最新交接摘要。每一版完成後，完成報告都必須附上一份
Project Handoff Summary（見文末 Required Handoff Rule）。

## Current Production

- production commit：`0cbd450`（Localize monitoring boolean UI readouts）
- production deployment：`dpl_Cmh8B4EN8WaUBezkZbzRRn91Vsi7`（若無法從目前資訊驗證，視為「待外部驗證」）
- production state：READY / 待外部驗證
- safety-chain：22 checks

## Current Scope

- Allen Stock Dashboard
- V74 系列
- personal-use war-room dashboard（個人用戰情室）
- limited live fetch hardening（受限即時抓取的安全強化）
- 3019 only（僅單一股票代號）
- TWSE_TPEX approved provider only（僅授權來源）
- manual smoke only（僅手動 smoke 觸發）
- no production data switch yet（尚未切正式資料）

## Completed Recently

- Timeout Boundary Safety Chain Integration（逾時／中止邊界驗證納入 safety-chain）
- System Safety UI Traditional Chinese Localization（系統安全頁繁中化）
- System Safety UI Language Guard Validator（UI 語言 guard，standalone）
- Monitoring Components Boolean UI Localization（monitoring 元件布林讀數繁中化）
- 17 Horsepower Technical Scanner Spec（17 馬力多頭強度模型：fixture-only contract + standalone validator，
  不納入 safety-chain；未來將與扣三低／走多逢低候選股整合；不抓真資料、不產生買賣指令）

## Current Validators

### In safety-chain（共 22 checks）

- golden snapshot（黃金快照驗證）
- mock fetch boundary（模擬請求邊界驗證）
- default no-fetch boundary（預設不請求邊界驗證）
- timeout boundary（逾時／中止邊界驗證）
- safety-chain CI guard（安全鏈 CI 防護）
- 其他既有 checks（V60–V72 + Phase 2 / 2b + scaffold + live fetch scope / implementation），共 22 checks

### Standalone（不在 safety-chain）

- system safety UI language（系統安全 UI 語言 guard）
- limited-live-fetch safety-chain inventory（安全鏈組成凍結 guard）
- deterministic clock validator（deterministic receivedAt 注入 guard）
- observation round 1 / round 2 validators（3019 觀察記錄 guard）
- project handoff summary（本文件 guard）
- manual smoke script（`smoke:limited-live-fetch:3019`，僅手動、永不納入 CI）

## UI Language Rule

- code identifiers may remain English — 程式碼／檔名／變數／type／script／contract／validator／
  enum／JSON key／commit message 可用英文。
- user-visible UI must be Traditional Chinese — 使用者可見 UI 一律繁體中文。
- necessary technical keys/status codes may remain English with Chinese explanation — 必要技術
  key／狀態碼可保留英文，但需有繁中說明；布林以 `zhBool()` 顯示，不直接顯示 true / false。

## Permanent Red Lines

- ChatGPT / system must not place orders for the user（系統不得替使用者下單）
- no auto trading（不自動交易）
- no automatic execution of buy/sell orders（不自動執行買賣）
- no silent production data switch（不得無聲切正式資料）
- no silent broker API execution（不得無聲執行 broker API）
- no expansion of live-fetch universe without Allen owner approval（未經 Allen 明確 owner approval，
  不擴大正式 live fetch 股票池、不切正式資料、不接 broker API、不切 production data switch）

## Current Phase Restrictions

- no production quote switch yet（目前暫不切正式行情資料）
- no /api/portfolio switch yet（目前暫不切 /api/portfolio）
- no Supabase runtime yet（目前暫不接 Supabase runtime）
- no second live-fetch symbol yet（目前暫不新增第二檔 live fetch symbol）
- no Yahoo / new data source yet（目前暫不新增 Yahoo／新資料源）
- no full-market auto scanner yet（目前暫不做全市場自動掃描）
- no operational buy/sell command（目前暫不產生操作型買賣指令）

## Future Allowed Direction

以下是**未來可以做**的方向，但必須**分階段驗證、經 owner approval、通過驗證與 manual sign-off**
後才能進行；這與「自動交易 / 自動下單」是兩回事：

- real quote validation（自動抓取並驗證真實行情）
- multi-symbol watchlist（多檔 watchlist live fetch）
- core universe（核心股票池 universe）
- technical scanner（技術掃描器）
- 扣三低 scanner（扣三低掃描）
- 走多逢低候選股 scanner（走多逢低候選股篩選）
- candidate ranking（觀察清單／候選股排名）
- risk/reward and stop-loss reference（風報比、停損區、進場觀察區）
- user manual decision（使用者手動決策）

## Required Handoff Rule

Every future completed version must include a Project Handoff Summary in the completion report.

Completion report must include：

- changed files（修改檔案清單）
- added files（新增檔案清單）
- verification results（驗證結果）
- production deployment status（production 部署狀態）
- safety-chain status（safety-chain 狀態）
- permanent red lines（永久紅線）
- current phase restrictions（目前階段性限制）
- Project Handoff Summary（本摘要）
