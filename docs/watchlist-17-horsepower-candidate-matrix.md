# Watchlist 17 Horsepower Candidate Matrix

## Purpose

- 整合 Watchlist Universe Tier 與 17 Horsepower 技術掃描規格。
- 建立 fixture-only 候選矩陣，讓核心與延伸觀察名單都有一致的觀察欄位。
- 說明 horsepower 強弱、主升段、回檔候選、觀察、排除的分流方式。
- 本版本不讀取真實行情、不做 real quote validation、不執行 live fetch。
- 本版本不產生買進、賣出、加碼、減碼、自動交易或下單指令。

## Inputs

本矩陣只使用 fixture-only 輸入：

- Watchlist Universe Tier contract
- Core Universe
- Extended Universe
- 17 Horsepower scoring fields
- fixture-only technical snapshots

## Output Candidate Fields

每一筆 candidate 欄位包含：

- symbol
- nameZh
- universeTier
- themeTags
- horsepowerScore
- previousHorsepowerScore
- horsepowerChange
- horsepowerLevel
- firstBullTurn
- strongBullConfirm
- pullbackSweetSpot
- deteriorationAlert
- bearTurn
- candidateTag：主升段 / 逢低候選 / 觀察 / 排除
- candidateRank
- riskNoteZh
- actionLabelZh

## Candidate Tag Rules

### 主升段

- horsepowerScore >= 16
- strongBullConfirm = true
- deteriorationAlert = false

### 逢低候選

- horsepowerScore between 13 and 15
- pullbackSweetSpot = true
- deteriorationAlert = false

### 觀察

- horsepowerScore between 10 and 12
- deteriorationAlert = false
- 或 horsepowerScore >= 13 且 pullbackSweetSpot = false

### 排除

- horsepowerScore <= 9
- 或 deteriorationAlert = true
- 或 bearTurn = true

## Ranking Rules

- 主升段 rank priority highest
- 逢低候選 second
- 觀察 third
- 排除 last
- 同一分類內依 horsepowerScore、horsepowerChange、pullbackSweetSpot 排序
- ranking is informational only
- ranking is not buy/sell instruction

## Live Fetch Boundary

目前邊界固定：

- this matrix uses fixture-only data
- approved live-fetch symbols remain exactly `["3019"]`
- approved live-fetch channel remains exactly `["tse_3019.tw"]`
- universe metadata does not approve live fetch
- non-3019 remains metadata-only
- no runtime fetch
- no production data switch

## UI Language Rule

- user-visible UI must be Traditional Chinese
- code identifiers may remain English
- technical keys may remain English with Chinese explanation
- candidateTag / actionLabelZh / riskNoteZh must be Traditional Chinese

## Future Integration

未來可在 owner approval、staging validation、manual sign-off 後再討論：

- 柯三弟 scanner
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
