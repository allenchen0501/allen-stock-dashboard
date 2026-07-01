# Project Handoff Summary

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
