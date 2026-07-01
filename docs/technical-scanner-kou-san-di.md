# 柯三弟 Technical Scanner

## Purpose

- 建立「柯三弟」技術分析 scanner 的 fixture-only 規格。
- 作為 future technical scanner 的低風險多頭回檔篩選參考。
- 定義 MA 扣抵低檔層、結構確認層與 17 Horsepower filter 的組合方式。
- 本版本不讀取真實行情、不做 real quote validation、不執行 live fetch。
- 本版本不產生買進、賣出、加碼、減碼、自動交易或下單指令。

## Terminology

本專案統一使用正確術語：柯三弟。

- 正確術語：柯三弟。
- 常見錯字不得出現在 README、handoff summary、UI 文案或一般文件中。
- 程式碼中的 technical keys 可以使用 English，例如 `kouSanDiPass`。

## Working Definition

這是 fixture-only working definition，未來仍需要 Allen owner confirmation 與 staged validation 才能進入 runtime。

柯三弟 working definition 包含兩層：

### MA Deduction Low Layer

用來描述均線扣抵低檔條件：

- selected deduction windows：MA5 / MA10 / MA20
- deduction price = close N trading days ago
- current close above deduction price = 扣抵低檔有利
- 三個 selected windows 都符合時，`maDeductionLowCount=3`
- `maDeductionLowCount >= 3` 時，`maDeductionLowPass=true`

### Structure Confirmation Layer

用來確認結構不是單一均線條件：

- recent three swing lows are rising
- pullback volume contraction
- close recovers short MA
- KDJ J turns upward
- MACD histogram improves
- 17 Horsepower score remains >= 13

MA Deduction Low Layer 是柯三弟的扣抵條件；Structure Confirmation Layer 是避免單一條件誤判的確認層。

## Output Fields

每一筆 scanner output 包含：

- symbol
- nameZh
- close
- deductionWindows
- maDeductionLowCount
- maDeductionLowPass
- threeRisingLowsPass
- volumeContraction
- shortMaRecovery
- kdjJTurnUp
- macdHistogramImproving
- horsepowerScore
- horsepowerFilterPass
- kouSanDiPass
- candidateTag：柯三弟成立 / 等待確認 / 排除
- riskNoteZh
- actionLabelZh

## Candidate Tag Rules

### 柯三弟成立

- maDeductionLowPass = true
- threeRisingLowsPass = true
- volumeContraction = true
- shortMaRecovery = true
- horsepowerFilterPass = true
- deteriorationAlert = false

### 等待確認

- maDeductionLowPass = true
- 部分結構確認條件尚未完整
- 或 horsepowerScore between 10 and 12

### 排除

- maDeductionLowPass = false
- 或 deteriorationAlert = true
- 或 bearTurn = true
- 或 horsepowerScore <= 9

## Integration with 17 Horsepower Candidate Matrix

未來可銜接：

- Watchlist 17 Horsepower Candidate Matrix
- 主升段 / 逢低候選 / 觀察 / 排除
- 柯三弟只作為候選觀察條件之一
- 柯三弟 is not buy/sell instruction

## UI Language Rule

- user-visible UI must be Traditional Chinese
- code identifiers may remain English
- technical keys may remain English with Chinese explanation
- candidateTag / actionLabelZh / riskNoteZh must be Traditional Chinese

## Future Integration

未來可在 owner approval、staging validation、manual sign-off 後討論：

- 走多回檔甜蜜點 scanner
- historical K-line contract
- risk/reward model
- scanner UI
- manual user decision

## Red Lines

- no real network in this version
- no live fetch
- no new approved live-fetch symbol
- no Yahoo
- no API route
- no `/api/portfolio` switch
- no Supabase
- no process.env
- no DB write
- no broker API
- no buy/sell command
- no auto order
- no production data switch
