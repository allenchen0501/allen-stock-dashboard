# Allen Score Scoring Model & Candidate Pools

本文件定義 V61 Allen Score Scoring Model & Candidate Pools：把 Allen 指定的 100 分評分模組正式寫進專案架構，並把 System Candidates 升級成依 Allen Score 每日產出的候選池架構。

本版仍是 deterministic contract + UI structure + validator。fixture/mock score is not operational data。no Supabase connection、no env read、no DB write、no real market data、no /api/portfolio switch、no buy/sell command、no auto order。system candidate is not position；可逢低布局不等於已買進；no fake PnL（沒有實際進場股數與成本，不得計算持股損益）。

---

## A. Scoring Model

Allen Score 100 = 100 分，五大模組：

1. Technical Score 30（技術面 30 分）
2. Fundamental Score 25（基本面 25 分）
3. Chip Score 25（籌碼面 25 分）
4. ETF Flow Score 10（ETF 資金流 10 分）
5. Market Sentiment Score 10（市場情緒 10 分）

總分必須 = 100（weights sum to 100）。

---

## B. Technical Score 30（技術面）

至少包含：KD、KDJ、MACD、moving averages（均線）、扣三低 / 扣抵條件。

技術條件（technical triggers）：

- KDJ 值夠低
- KD 低檔黃金交叉
- K 值上彎
- J 值轉強
- MACD 翻紅
- OSC 負轉正
- DIF 上彎
- 柱狀體放大
- 站回 5MA / 10MA / 20MA
- 5MA 上穿 10MA
- 均線糾結後向上發散
- 扣三低
- 扣低即將上彎
- 扣抵低檔形成
- 前低不破
- 月線不破
- 季線支撐
- 箱型突破
- 突破前高
- 突破大量平台
- 突破下降壓力線
- 突破後回測不破
- 量縮回測 5 / 10 / 20 日線
- 放量突破
- 價漲量增
- 價跌量縮
- 爆量長黑避開
- 主升段偵測
- 飆股預備隊

---

## C. Fundamental Score 25（基本面）

至少包含：營收、EPS、毛利率、法人預估。

判斷重點：

- 營收是否年增 / 月增
- EPS 是否改善
- 毛利率是否回升
- 法人是否上修預估
- 產業是否進入成長週期

---

## D. Chip Score 25（籌碼面）

至少包含：外資、投信、主力、大戶持股。

判斷重點：

- 外資是否回補
- 投信是否連買
- 主力是否買超
- 大戶持股是否增加
- 散戶是否下降
- 籌碼是否集中
- 分點買盤是否穩定
- 法人低檔建倉
- 避免散戶追高盤

---

## E. ETF Flow Score 10（ETF 資金流）

至少包含：00981A、00991A、00403A、是否同步買進。

判斷重點：

- 00981A 是否買進
- 00991A 是否買進
- 00403A 是否買進
- 是否同步買進同一產業 / 同一權重股
- 是否形成被動資金推升
- 是否對候選股有資金加成

---

## F. Market Sentiment Score 10（市場情緒）

至少包含：Put / Call、VIX、散戶小台、外資期貨。

判斷重點：

- 是否適合積極做多
- 大盤是否有系統性風險
- 散戶是否過熱
- 外資期貨偏多或偏空
- VIX 是否升高
- Put / Call 是否過度樂觀或恐慌

---

## G. Daily Grade Pools

每日分級輸出：

- A 級主升段池：80 分以上（A >= 80）
- B 級觀察池：70–79 分（B 70–79）
- C 級等待池：60–69 分（C 60–69）
- 禁碰池：60 分以下（Avoid < 60）

規則：

- A 級不等於立刻追價，仍需承接區與確認條件。
- B 級是觀察與等待回測。
- C 級是等待，不追。
- 禁碰池不得低接、不得追價。
- system candidate is not position（系統候選股不等於持股）。
- 可逢低布局股不等於已買進。
- 沒有實際進場股數與成本，不得計算持股損益（no fake PnL）。

---

## H. Candidate Output Fields

System Candidate 每檔輸出欄位：stockId、symbol、name、allenScore、grade、technicalScore、fundamentalScore、chipScore、etfFlowScore、marketSentimentScore、candidateReason、technicalTriggers、pullbackBuyZone、confirmationCondition、invalidationCondition、riskRewardRatio、suggestedAction、dataSource、dataTimestamp、verificationStatus、isPosition = false、pnlComputable = false。

UI 每檔候選股顯示：候選原因、技術觸發、承接區、確認條件、失效條件、風報比、今日建議、資料來源、資料時間、驗證狀態。

---

## I. Safety Boundary

- fixture/mock score is not operational data。
- no Supabase connection。
- no env read。
- no DB write。
- no real market data。
- no /api/portfolio switch。
- no buy/sell command。
- no auto order。
- no fake PnL。
- system candidate is not position。
- 可逢低布局不等於已買進。
- sample score is fixture-only；mock data must be labeled；fixture data must be labeled。

---

## J. Decision

- decision 預設 READY_FOR_UI_REVIEW（評分模型與候選池 UI 結構就緒，待 review），或 NO_GO。
- productionTradingReady = false；realDataConnected = false；supabaseConnected = false。
- 永遠不輸出 production go-live 結論。

---

## K. Future

未來真實資料接入後，Allen Score 才能以真實技術 / 基本 / 籌碼 / ETF / 情緒資料計算；在 fixture/mock 標示移除前，分數不可作為正式操作依據，候選股不可當持股。
