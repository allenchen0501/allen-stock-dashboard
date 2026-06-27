# Allen War Room Operational Layout & Data Taxonomy

本文件定義 **V60 Allen War Room Operational Layout**：把 `/holdings` 從「工程監控頁」重整成 Allen 真正需要的「台股戰情室操作首頁」，並鎖定核心資料分類（實際持股 / 固定追蹤 / 系統候選 / 機會池 / 禁碰股 / 工程安全）。

**Allen 是 owner and user, not developer。** 進站要看的是盤前該看什麼、盤中該防守什麼、收盤後該檢討什麼、哪些是真正持股、哪些只是追蹤、哪些是系統候選、哪些資料是真實/延遲/fixture/未驗證、今天每檔的建議動作。主交易畫面不應出現大量工程用語（Spec-only / Runtime Pilot / Shadow Runner / NO_GO …），這些移到系統安全監控頁。

**重要：current fixture/mock data is not operational data；final website must use real data before operational use。** 本版只重整 UI 資訊架構，仍 no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order，且不假裝 fixture 是真實資料、不假算持股成本 / 股數 / 損益。

---

## A. User & Goal

- V60 Allen War Room Operational Layout。
- primary user：owner and user, not developer。
- 目標：一進站即看懂盤前 / 盤中 / 收盤後該看的資訊架構。
- current fixture/mock data is not operational data。
- final website must use real data before operational use。

---

## B. Locked Data Taxonomy

1. **Actual Positions（實際持股）**：actual positions are entered holdings only。
   - 必須有 entry record、shares、averageCost 才能算損益：actual position requires shares and average cost before PnL。
   - no fake PnL、no fake position size。
   - 沒有 Allen 實際進場紀錄 / 股數 / 成本者，不得標示為持股、不得進入資產水位。
   - 目前 known user-confirmed but incomplete：4966 譜瑞、2743 山富 —— 標示「持股資料待補」，不假算損益。
2. **Fixed Watchlist（固定追蹤）**：watchlist is not position。池：3019 亞光、4966 譜瑞、5347 世界、4979 華星光、2455 全新。
3. **System Candidates（系統候選）**：system candidate is not position。技術 / 籌碼 / 量價 / 風報比自動產出，不代表已買進。
4. **Opportunity Pool（機會池）**：可逢低布局 / 走多候選，不是持股。
5. **Risk Blocklist（禁碰股 / 高風險股）**：破線 / 量能失控 / 資料延遲 / 風報比不足 / 來源衝突 / 追高風險。
6. **Engineering Safety（工程安全）**：engineering safety moved away from primary trading view。

規則摘要：
- watchlist is not position。
- system candidate is not position。
- actual position requires shares and average cost before PnL。
- 沒有股數與成本不得計算持股損益。

---

## C. `/holdings` Operational Layout

第一屏：Allen 台股戰情室今日戰情總覽。

1. Header / Status Bar：Allen 台股戰情室、市場階段（pre-market / intraday / after-close / US 前 / 休市）、data date、data time、data source、verification status、是否 fixture/mock；若仍 fixture/mock 顯示「目前非真實資料，不可作為操作依據」。
2. 今日總判斷 Summary Cards：今日市場方向 / 實際持股風險 / 今日可操作 / 系統警報。
3. 我的實際持股 Actual Positions Table（核心；不混入追蹤股或候選股）。
4. 固定追蹤池 Fixed Watchlist（標示「追蹤股不等於持股」）。
5. 系統機會池 System Candidates（標示「系統候選股不等於持股」）。
6. 盤前 / 盤中 / 收盤後 session-aware 區塊（pre-market / intraday / after-close）。
7. 工程安全監控移位：Shadow Runner / Runtime Pilot / Safety Boundary / spec-only 面板移到 `/system/safety` 或 `/holdings` 底部 collapsible「系統安全監控 / Engineering Safety」。engineering safety moved away from primary trading view。

---

## D. Session Views

- **pre-market（盤前）**：昨日收盤有效價、今日開盤風險、預設防守策略、可低接觀察股、禁追 / 禁碰股、國際風險提示。
- **intraday（盤中）**：即時價 / 開高低 / 成交量、是否急跌 / 破防守線、是否接近承接區、是否資料延遲、即時警報。
- **after-close（收盤後）**：收盤價 / 漲跌幅 / 成交量、K 線狀態、隔日策略（續抱 / 減碼 / 等回測）、隔日觀察清單。

目前無真實資料，以 placeholder 結構呈現並標示非正式資料。

---

## E. Safety Boundary

- current fixture/mock data is not operational data。
- no Supabase connection。
- no env read。
- no DB write。
- no real market data。
- no /api/portfolio switch。
- no buy/sell command。
- no auto order。
- no fake PnL；no fake position size。
- mock data must be labeled；fixture data must be labeled。
- engineering safety moved away from primary trading view。

---

## F. Decision

- `decision` 預設 READY_FOR_UI_REVIEW（UI 結構就緒，待 review）。
- productionTradingReady = false；realDataConnected = false。
- 永遠不會輸出 production go-live 結論（無 PRODUCTION_READY）。

---

## G. Future

未來真實資料（broker import / Supabase staging read-only / 授權行情）進站後，先填入 Actual Positions 的 shares / averageCost 才可計算損益；fixture/mock 標示移除前不可作為操作依據。
