# Structured Candidate Trade Plan

本文件定義 V63 Structured Buy Zone & Risk/Reward Contract：把 candidate 的 pullbackBuyZone / riskRewardRatio / entryStrategy 從字串敘述升級為結構化 deterministic contract，讓候選股的「承接區」、「停損/失效條件」、「目標區」、「風報比」能被 validator 檢查一致性。

本版仍是 fixture-only / deterministic contract / validator / UI structure。V63 是 structured trade plan contract，不是 real-data mapping、不是 Supabase connection、不是 production trading readiness。system candidate is not position；可逢低布局不等於已買進；no fake PnL；pnlComputable false；no shares；no cost basis。no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no auto order。所有區間 sourceType = fixture_mock、operationalUseAllowed = false，決不標記 not PRODUCTION_READY（永遠不輸出 PRODUCTION_READY）。

---

## A. Types

新增型別（`use-cases/war-room/structured-candidate-trade-plan-contract.ts`）：

- StructuredBuyZone
- StructuredRiskReward
- StructuredEntryStrategy
- CandidateTradePlan
- CandidateTradePlanValidation

---

## B. Structured Buy Zone

StructuredBuyZone 包含：lower、upper、currency = "TWD"、basis、confidence、sourceType = "fixture_mock"、operationalUseAllowed = false。

## C. Structured Risk/Reward

StructuredRiskReward 包含：stopLossLower、stopLossUpper、targetLower、targetUpper、downsideRiskPercent、upsideRewardPercent、rewardRiskRatio、sourceType = "fixture_mock"、operationalUseAllowed = false。

## D. Structured Entry Strategy

StructuredEntryStrategy 包含：triggerConditionText、invalidationConditionText、observationOnlyText、sizingHintText、buySellCommandGenerated = false、autoOrderRequested = false。entryStrategy 是 observation only，不是 buy/sell command。

## E. Candidate Trade Plan

CandidateTradePlan 與 V62 candidate 對應：symbol、name、grade、allenScore、pool、buyZone、riskReward、entryStrategy、isPosition = false、pnlComputable = false、fixtureOnly = true。

---

## F. Consistency Gate

Validator / contract 檢查：

- buyZone.lower <= buyZone.upper
- stopLossUpper < buyZone.lower
- targetLower > buyZone.upper
- downsideRiskPercent > 0
- upsideRewardPercent > 0
- rewardRiskRatio > 0
- rewardRiskRatio 應可由 upsideRewardPercent / downsideRiskPercent 推導，允許合理四捨五入
- sourceType 必須是 fixture_mock
- operationalUseAllowed 必須是 false
- isPosition 必須是 false
- pnlComputable false（pnlComputable 必須是 false）
- no shares（不得有 shares）
- no cost basis（不得有 costBasis）
- buySellCommandGenerated 必須是 false
- autoOrderRequested 必須是 false
- 不得把 triggerConditionText 寫成命令式買進（not buy/sell command）
- 不得把 observationOnlyText 寫成正式操作依據（observation only）
- 每個 trade plan 必須對應一個 V62 candidate
- trade plan 的 score / grade / pool 必須與 V62 engine 一致

全部通過 → decision = READY_FOR_UI_REVIEW，否則 NO_GO。

---

## G. UI

UI（每日候選池 + 系統候選池）顯示：候選承接區、失效/防守區、目標觀察區、fixture/mock 區間不可作為正式操作依據、觀察策略，不是買賣指令、system candidate is not position（系統候選股不等於持股）、可逢低布局不等於已買進、無股數/成本，不計算損益。

`/system/safety` 另有 spec-only 的 Allen Score engine / trade plan consistency health 卡片（deterministic，no runtime、no fetch、no 連線）。

---

## H. Safety Boundary

- system candidate is not position；no fake PnL；pnlComputable false；no shares；no cost basis。
- fixture-only；deterministic contract；sourceType fixture_mock；operationalUseAllowed false。
- observation only；not buy/sell command；no auto order。
- no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch。
- 永遠不輸出 PRODUCTION_READY（not PRODUCTION_READY）。

---

## I. Future

未來真實資料接入後，buy zone / risk-reward 才以真實價格與防守線計算；在 fixture/mock 標示移除前，結構化區間不可作為正式操作依據、候選股不可當持股、可逢低布局不等於已買進、不得假算損益。
