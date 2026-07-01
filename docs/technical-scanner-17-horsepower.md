# 17 Horsepower Technical Scanner（17 馬力多頭強度模型）

## Allen 17-Line Power Score v1.1（定位）

**Allen 17-Line Power Score v1.1** 是「**多週期趨勢強弱篩選器**」（multi-timeframe
trend-strength screener），用來衡量多頭強度並提供未來候選股觀察。定位重點：

- 它**不是完整交易系統**（not a complete trading system）。
- 它**不是買點**、**不是買賣指令**（not a buy point, not a buy/sell instruction）。
- 它**不是自動交易**（not auto trading）。
- **不能宣稱為江江原版公式**（this is an internal fixture model, not the Jiang Jiang original formula）。
- 週線 / 月線的 turn 線只能稱為「**價格動能參考線**」（price-momentum reference line），
  **不可寫成均線斜率保證**（not a moving-average-slope guarantee）。
- **量能確認與過熱濾網是觀察條件，不是買賣指令**（isVolumeConfirmed / isOverheated；
  volume confirmation and overheat filter are observation-only, not buy/sell instructions）。
- 它與既有的 Technical + Risk Reward Strategy Engine、Allen Score 100、Position Strategy Plan
  **並存**，不覆蓋、不取代它們。
- 所有**使用者可見 UI 必須繁體中文**。

v1.1 在原始 `horsepowerScore`（0～17）之上，新增 `powerRatio`、`weightedPower`（0～100）、
group scores（短線成本／日線／週線／月線）、`nearestSupport` / `nearestPressure`、
量能確認（volumeRatio20 / volumePercentile60）、過熱濾網（bias20 / bias20Percentile120）、
`dataStatus`（confirmed_close / intraday_estimated）、`powerRating`、`effectiveAttack`、
`strongButOverheated`，並整合進 War Room read model / UI。仍為 fixture-only、deterministic、
no network、no Supabase、no env、no DB write、no API route、no broker API、no buy/sell command、
no auto order、no production data switch。

---

本版**只做 spec / fixture / validator + War Room fixture-only 整合**：不抓真資料、不做全市場掃描、不產生買賣指令。

## Purpose（用途）

- 用於**判斷多頭強度**（bullish strength）。
- 用於未來**候選股篩選**（candidate screening）。
- 可輔助尋找**主升段、多方轉強、逢低候選股**。
- **不單獨構成買賣指令**、不代表自動交易。

> 定位：17 馬力是**多頭強度評分器**，不是單獨買進訊號、不是交易指令、不是自動下單、不是正式行情切換。
> 未來需搭配**扣三低、量縮拉回、KDJ、MACD、風報比、停損區**一起使用。

## Data Requirements（資料需求，未來）

- daily OHLCV（日 K）
- weekly OHLCV（週 K）
- monthly OHLCV（月 K）
- optional 60-minute OHLCV（選用 60 分 K）
- 若 60 分資料缺失，短線主力成本 5 匹（shortCost1–5）需標示 **unavailable**，
  **不可默默算作通過**。

## Horsepower Lines（17 條線，概念版）

### Short-term cost group：5 lines

- shortCost1 / shortCost2 / shortCost3 / shortCost4 / shortCost5
- 概念上代表短線主力成本／短線籌碼壓力。目前**沒有正式公式**，fixture-only 先保留為可計算欄位，
  未來需明確定義來源與算法。

### Daily MA group：6 lines

- MA5 / MA10 / MA20 / MA30 / MA60 / MA120

### Weekly group：3 lines

- weeklyTurn / weeklyFastLine / weeklySlowLine

### Monthly group：3 lines

- monthlyTurn / monthlyFastLine / monthlySlowLine

合計 **17 lines**。

## Scoring（評分）

- close above line = 1 horsepower（收盤在線之上＝1 匹）
- close below line = 0 horsepower（收盤在線之下＝0 匹）
- total score = 0～17
- **unavailable line 不可默默算作通過**
- contract 必須輸出 `unavailableLines`
- 若 `unavailableLines > 0`，需輸出 `reliabilityNote`（可靠度提醒）

## Interpretation（分數解讀）

- 16～17：強多主升段
- 13～15：多方轉強
- 10～12：多空交戰
- 6～9：偏弱
- 0～5：空方

## Transition Signals（轉折訊號）

- `firstBullTurn`：昨日 <= 11，今日 >= 13
- `strongBullConfirm`：今日 >= 15
- `horsepowerAcceleration`：今日分數 − 昨日分數
- `deteriorationAlert`：單日下降 >= 3，或跌破 11
- `bearTurn`：今日 <= 8

## Pullback Sweet Spot（逢低甜蜜點）

條件：

- `horsepowerScore >= 13`
- close 拉回貼近 MA10 / MA20 / 前波突破帶（close pullback near MA10 / MA20 / previous breakout level）
- 量縮（volume contraction）
- 無 `deteriorationAlert`
- 風報比可接受（risk/reward acceptable）

## Integration with 扣三低（扣三低整合）

**走多逢低候選股**篩選需同時滿足：

- 近三個轉折低點墊高（recent three swing lows are rising）
- 拉回量縮（pullback volume contracts）
- 收盤收復短均（close recovers short MA）
- KDJ 的 J 值翻揚（KDJ J turns upward）
- MACD 柱狀圖轉佳（MACD histogram improves）
- horsepower 維持 `>= 13`（horsepower remains >= 13）

## Output Fields（輸出欄位）

- `symbol`
- `name`
- `close`
- `horsepowerScore`
- `previousHorsepowerScore`
- `horsepowerChange`
- `horsepowerLevel`
- `unavailableLines`
- `reliabilityNote`
- `firstBullTurn`
- `strongBullConfirm`
- `pullbackSweetSpot`
- `deteriorationAlert`
- `bearTurn`
- `riskNote`
- `candidateTag`：主升段 / 逢低候選 / 觀察 / 排除

## UI Language Rule（UI 語言規則）

- 使用者可見 UI 必須**繁體中文**。
- code identifiers may remain English（程式碼／變數／type／key 可用英文）。
- 技術 key 若保留英文，需搭配**繁中說明**。

## Red Lines（本版紅線）

- no real network in this version（本版不打真網路）
- no live fetch（不 live fetch）
- no Supabase
- no process.env
- no DB write
- no API route
- no /api/portfolio switch
- no broker API
- no buy/sell command（不產生買賣指令）
- no auto order（不自動下單）
- no production data switch（不切正式行情資料）

## Samples（fixture）

fixture-only contract（`use-cases/war-room/build-17-horsepower-scanner-contract.ts`）至少輸出 3 檔
sample（非真實推薦，僅示範計算）：

1. **強多主升段** — horsepowerScore 16～17、candidateTag 主升段、strongBullConfirm=true、deteriorationAlert=false。
2. **多方轉強逢低候選** — horsepowerScore 13～15、pullbackSweetSpot=true、candidateTag 逢低候選、deteriorationAlert=false。
3. **轉弱排除** — horsepowerScore <= 11 或 deteriorationAlert=true、candidateTag 排除（並示範 60 分缺失時
   shortCost 5 匹 unavailable + reliabilityNote）。
