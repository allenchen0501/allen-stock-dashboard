# Watchlist Universe Tier

## Purpose

- 建立 Allen Stock Dashboard 的核心與延伸觀察名單 universe。
- 提供未來 17 Horsepower、柯三弟、走多回檔甜蜜點等 scanner 可使用的 fixture-only metadata。
- 本文件只定義股票 metadata 與研究分層。
- 不新增 live fetch symbol。
- 不啟用 live fetch。
- 不切換 production data。
- 不產生買進、賣出、加碼、減碼或自動下單指令。

## Universe Tiers

### Core Universe

核心 universe 固定為目前最重要的 5 檔追蹤標的：

1. 3019 亞光
2. 4966 譜瑞-KY
3. 5347 世界
4. 4979 華星光
5. 2455 全新

### Extended Universe

延伸 universe 是未來研究、觀察與 scanner 候選池，不代表已核准 live fetch：

1. 3450 聯鈞
2. 3163 波若威
3. 6442 光聖
4. 3363 上詮
5. 2383 台光電
6. 2368 金像電
7. 3491 昇達科
8. 2313 華通
9. 2344 華邦電
10. 6239 力成
11. 8299 群聯
12. 3105 穩懋

### Scanner Universe Plan

未來 scanner 可分階段使用本 universe metadata：

- core + extended watchlist scanner
- industry theme scanner
- full-market scanner
- 17 Horsepower scanner
- 柯三弟 scanner
- 走多回檔甜蜜點 scanner
- candidate ranking
- risk/reward reference
- manual user decision

Scanner Universe Plan 目前只是一份研究路線圖；`enabledNow=false`，`fullMarketScanEnabled=false`。任何 scanner 進入 runtime、live fetch 或 production data switch 前，都必須經過 owner approval、staging validation 與 manual sign-off。

## Stock Metadata

每檔股票 metadata 欄位：

- symbol
- nameZh
- marketType: listed / otc / unknown
- universeTier: core / extended
- trackingRole: holding / watchlist / candidate / theme_watch / unknown
- themeTags
- scannerEligible
- liveFetchApproved
- approvedChannel
- channelStatus
- noteZh

## Live Fetch Approval Boundary

目前 live fetch 邊界固定如下：

- 3019 is the only approved live-fetch symbol in the current phase.
- approvedChannel for 3019 remains tse_3019.tw.
- approved live-fetch symbols remain exactly `["3019"]`.
- approved live-fetch channels remain exactly `["tse_3019.tw"]`.
- all non-3019 symbols are universe metadata only.
- non-3019 symbols must have `liveFetchApproved=false`.
- non-3019 `approvedChannel` must be `null`.
- non-3019 `channelStatus` must be `not_approved` or `unresolved`.
- adding symbols to universe does not allow runtime fetch.
- universe metadata is not live fetch approval.

換句話說：watchlist universe symbol metadata is allowed；new approved live-fetch symbol is not allowed.

## Future Scanner Usage

本 universe 可作為以下功能的研究輸入：

- 17 Horsepower Technical Scanner
- 柯三弟 scanner
- 走多回檔甜蜜點 scanner
- candidate ranking
- risk/reward reference
- manual user decision

這些用途只代表未來可研究方向，不代表 production trading ready，也不代表系統可自動產生交易指令。

## UI Language Rule

- user-visible UI must be Traditional Chinese.
- code identifiers may remain English.
- technical keys may remain English with Chinese explanation.

## Red Lines

- no real network in this version
- no live fetch
- no new approved live-fetch symbol
- no Yahoo
- no API route
- no `/api/portfolio` switch
- no Supabase
- no env key read
- no DB write
- no broker API
- no buy/sell command
- no auto order
- no production data switch
