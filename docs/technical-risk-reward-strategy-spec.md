# Technical + Risk Reward Strategy Spec

本文件定義 Allen Stock Dashboard 的 **Technical + Risk Reward Strategy Engine**（低檔高風報比技術策略引擎）規格。
本規格是 `docs/war-room-intelligence-architecture.md` 中 Technical Strategy Engine 與 Risk Reward Engine 的細化文件。

**本階段（V18E）只做規格、型別合約與 fixture-only checker。
不接資料、不抓 K 線、不算技術指標、不寫資料、不新增 API route、不新增 UI component、
不連 Supabase、不新增 SQL migration、不寫入資料、不產生買賣指令。**

相關文件：
[War Room Intelligence Architecture](./war-room-intelligence-architecture.md)、
[Institutional Research Center Spec](./institutional-research-center-spec.md)、
[Intraday Risk Crisis Alert Spec](./intraday-risk-crisis-alert-spec.md)、
[Portfolio Valuation Formula](./portfolio-valuation-formula.md)、
[Schema Boundary Decisions](./schema-boundary-decisions.md)。

---

## A. Purpose

- 本文件定義 Allen Stock Dashboard 的 Technical + Risk Reward Strategy Engine。
- 目標是文件化 Allen 的低檔高風報比選股邏輯。
- 本模組回答「哪一些股票具備技術低檔、轉強跡象、支撐明確、風報比合理，值得列入觀察」。
- 本模組不回答「這檔基本面是否優秀」。
- 本模組不取代 Research Center。
- 本模組不取代 Valuation Radar。
- 本模組不取代 Intraday Alert。
- **本模組不得直接產生買點。**
- **本模組不得產生買賣指令。**
- 本階段只做 spec，不接資料、不算指標、不寫資料。

---

## B. Core Boundary

以下為硬約束：

- **Technical Strategy Engine 不假裝基本面良好。**
- Research Center 不直接產生買點。
- Valuation Radar 不直接等於 actionSignal。
- Intraday Alert 不等於買賣指令。
- 估值便宜不等於高風報比。
- **高風報比不等於基本面好。**
- 技術轉強不等於可以追價。
- **KD 低檔不等於買點。**
- **MACD 轉強不等於買點**：MACD 轉強只代表動能改善，不單獨決定買賣。
- 風報比達標只代表觀察價值提升，不代表交易成立。
- `dataQualityStatus 非 PASS` 時必須保守顯示。
- **不自動下單。**
- **不產生買賣指令。**

---

## C. Data Requirements

未來技術策略需要的資料：

- daily OHLCV
- weekly OHLCV
- intraday OHLCV
- moving averages
- KD / KDJ
- MACD
- volume average
- support / resistance
- recent high / recent low
- prior close
- market regime
- sector strength
- cost basis if portfolio holding
- `dataQualityStatus`
- `sourceName`
- `computedAt`

資料品質規定：

- 缺 K 線不得計算技術分數。
- 缺成交量不得判斷爆量或量縮。
- 缺 weekly data 不得判斷週 30MA。
- 缺 support / resistance 不得計算完整風報比。
- 資料源衝突時顯示 `DATA_INSUFFICIENT` 或 `WARNING`。
- 本輪不新增任何資料表，不接資料源。

---

## D. Technical Setup Taxonomy

未來技術 setup 類型（`TechnicalSetupType`）：

| setup key | 用途 | 限制 |
|---|---|---|
| `DEDUCTION_THREE_LOW` | 扣三低：均線扣抵即將扣到低價區，均線壓力可能下降 | 不能單獨作為交易條件 |
| `KD_LOW_TURN_UP` | KD 低檔轉折向上 | 需搭配量價與支撐 |
| `KDJ_LOW_TURN_UP` | KDJ J 值低檔轉強 | 需搭配量價與支撐 |
| `MACD_MOMENTUM_RECOVERY` | MACD 動能收斂 / 改善 | 僅動能，不單獨決定買賣 |
| `MA_RECLAIM` | 站回均線 | 站回不等於買點 |
| `MA_SLOPE_IMPROVEMENT` | 均線斜率改善 | 斜率比單日站上重要，但不單獨成立 |
| `WEEKLY_30MA_SUPPORT` | 週 30MA 波段支撐 | 缺 weekly data 不得判斷 |
| `DAILY_200MA_SUPPORT` | 日 200MA 長期支撐 | 長期參考，不是買點 |
| `VOLUME_CONTRACTION_PULLBACK` | 量縮回測支撐 | 未跌破才有觀察價值 |
| `VOLUME_BREAKOUT` | 爆量轉強突破 | 需搭配壓力區與市場環境 |
| `SUPPORT_RETEST` | 回測支撐 | 支撐區是觀察區，不是買點 |
| `RESISTANCE_BREAKOUT` | 突破壓力 | 需突破確認，不是追價指令 |
| `LOW_BASE_CONSOLIDATION` | 低檔打底盤整 | 需放量轉強才升級觀察 |
| `RISK_REWARD_QUALIFIED` | 風報比達標 | 達標只是觀察條件，不是交易成立 |
| `DATA_INSUFFICIENT` | 資料不足 | 不得輸出高信心結論 |

---

## E. Deduction Three Low / 扣三低 Rule

「扣三低」是 Allen 的技術觀察規則：

- 扣三低是觀察均線扣抵是否即將扣到較低價格區，使均線壓力可能下降。
- 它不能單獨作為交易條件。
- 必須搭配：
  - 價格是否守住支撐區
  - KD / KDJ 是否低檔改善
  - MACD 動能是否收斂
  - 量縮是否健康
  - 大盤與產業是否沒有明顯轉弱
  - 風報比是否達標

未來輸出：

- `deductionStatus`
- `deductionWindowDays`
- `deductionPriceLevel`
- `deductionQuality`
- `deductionWarning`

**扣三低不是買點，只是低檔觀察條件。**

---

## F. KD / KDJ Rule

KD / KDJ 低檔規則：

- K / D 位於低檔區。
- K 上穿 D。
- KDJ J 值從低檔轉強。
- KD 低檔黃金交叉需搭配量價與支撐。
- KD 鈍化時不得過早解讀為轉強。
- 強勢股可能高檔鈍化，不能只用 KD 判斷。

未來輸出：

- `kdZone`
- `kdCrossStatus`
- `kdDivergence`
- `kdSignalQuality`
- `kdWarning`

**KD / KDJ 只是動能與轉折觀察，不是直接交易訊號。**

---

## G. MACD Momentum Rule

MACD 規則：

- MACD 僅判斷動能，不單獨決定買賣。
- 觀察 MACD histogram 是否收斂。
- 觀察 DIF / DEA 是否改善。
- 觀察是否接近 0 軸。
- MACD 在盤整區容易出現假訊號。
- MACD 需搭配 KD / 均線 / 量價 / 大盤環境確認。

未來輸出：

- `macdTrend`
- `macdHistogramDirection`
- `macdZeroAxisStatus`
- `macdSignalQuality`
- `macdWarning`

---

## H. Moving Average Rule

均線規則，需支援：5MA / 10MA / 20MA / 60MA / 日 200MA / 週 30MA。

- 5MA / 10MA / 20MA 觀察短線強弱。
- 60MA 觀察中期趨勢。
- 日 200MA 觀察長期支撐 / 壓力。
- 週 30MA 觀察波段趨勢與大型支撐。
- 站回均線不等於買點。
- 跌破均線不等於必須出場。
- 均線斜率比單日站上更重要。
- 多條均線糾結後放量轉強可列為觀察。

未來輸出：

- `maAlignment`
- `maSlopeStatus`
- `maReclaimStatus`
- `weekly30MAStatus`
- `daily200MAStatus`
- `maSignalQuality`

---

## I. Volume Price Rule

量價規則：

- 量縮回測支撐
- 爆量轉強
- 爆量不漲
- 放量破底
- 價漲量增
- 價跌量增
- 量縮止跌

規定：

- 爆量突破需搭配壓力區與市場環境。
- 放量下跌需提高風險。
- 量縮回測支撐若未跌破，觀察價值提高。
- 量價訊號不能單獨產生買賣指令。

未來輸出：

- `volumePattern`
- `volumeExpansionRatio`
- `volumeDryUpStatus`
- `priceVolumeSignalQuality`
- `volumeWarning`

---

## J. Support / Resistance / Invalid Level Rule

支撐、壓力、invalid level：

- `supportZone`（支撐區）
- `resistanceZone`（壓力區）
- `invalidLevel`
- `observationZone`
- `breakoutConfirmationZone`

規定：

- supportZone 是觀察區，不是買點。
- `invalidLevel` 是策略失效觀察價，不是自動停損指令。
- resistanceZone 是壓力觀察區，不是自動賣出價。
- breakoutConfirmationZone 是突破確認區，不是追價指令。
- 缺支撐區與壓力區時，不得計算完整風報比。

---

## K. Risk Reward Engine

風報比公式：

```text
risk = observationPrice - invalidLevel
reward = targetZone - observationPrice
riskRewardRatio = reward / risk
```

風報比分級：

| riskRewardRatio | grade |
|---|---|
| 1:2 以下 | 不合格（`UNQUALIFIED`） |
| 1:3 | 合格（`QUALIFIED`） |
| 1:4 | 佳（`GOOD`） |
| 1:5 以上 | 優（`EXCELLENT`） |

重要邊界：

- 風報比不是勝率。
- 高風報比不代表一定會漲。
- `observationPrice` 不是買進價。
- `invalidLevel` 不是自動停損價。
- `targetZone` 不是目標價。
- `riskRewardRatio` 只是觀察條件。

未來輸出：

- `observationPrice`
- `supportZone`
- `invalidLevel`
- `targetZone`
- `risk`
- `reward`
- `riskRewardRatio`
- `riskRewardGrade`

---

## L. Candidate Ranking

低檔高風報比候選 TOP5 排序，優先順序：

1. `dataQualityStatus` PASS 優先。
2. market regime 不可為 DANGER。
3. sector strength 不可明顯轉弱。
4. `riskRewardRatio >= 3`。
5. supportZone 明確。
6. `invalidLevel` 明確。
7. KD / KDJ 低檔改善。
8. MACD 動能收斂或改善。
9. 均線斜率改善。
10. 量縮回測或爆量轉強。
11. Research Rating 若可用，作為加分，不作為必要條件。
12. Valuation Tier 若可用，作為加分，不作為必要條件。
13. Intraday Alert 若為 DANGER，候選降級或排除。

重要邊界：

- TOP5 Technical Candidates 不等於 TOP5 Research。
- **TOP5 Technical Candidates 不等於買進清單。**
- 它只代表技術結構與風報比值得觀察。

---

## M. Avoid / No Touch Rules

禁碰 / 避開規則：

- `marketStatus = DANGER`
- `dataQualityStatus = FAIL`
- 放量破底
- 跌破 `invalidLevel` 且未快速站回
- EPS / research data 顯示需求惡化，若可用
- intraday DANGER active
- sector synchronized weakness
- supportZone 不明確
- `riskRewardRatio < 2`
- 技術反彈但量價背離

**Avoid / No Touch 是風控提醒，不是明確賣出指令。**

---

## N. War Room Integration

接到 War Room 的方式：

War Room 首頁只顯示：

- 低檔高風報比候選 TOP5
- 每檔：`setupTags`、`riskRewardRatio`、`supportZone`、`invalidLevel`、`targetZone`、`dataQualityStatus`
- 一句 `observationSummary`
- 是否因市場 / 族群 / 警報降級

邊界：

- War Room 不顯示完整技術細節。
- 完整細節應在未來 Technical Strategy page。
- Technical Engine 不輸出法人評級。
- Technical Engine 不輸出 `actionSignal`。
- Technical Engine 不輸出買賣指令。

---

## O. Safety Boundary

明確安全邊界：

- 不自動下單。
- 不產生買賣指令。
- 不替代投資判斷。
- 技術訊號不是保證。
- 風報比不是勝率。
- 高風報比不等於基本面好。
- KD 低檔不等於買點。
- MACD 轉強不等於買點。
- 支撐區不等於買點。
- `invalidLevel` 不等於自動停損價。
- `targetZone` 不等於目標價。
- TOP5 Technical Candidates 不等於買進清單。
- `dataQualityStatus 非 PASS` 時不輸出高信心結論。

平文摘要（checker 掃描用）：

高風報比不等於基本面好。KD 低檔不等於買點。MACD 轉強不等於買點。TOP5 Technical Candidates 不等於買進清單。不自動下單。不產生買賣指令。dataQualityStatus 非 PASS 時不輸出高信心結論。

---

## P. Future Implementation Gate

未來版本規劃（roadmap 僅為架構規劃，不代表本輪實作）：

### V19 Technical Signal Contract
- 建立 fixture-only pure function。
- 不接 runtime。
- 不查資料。

### V20 Risk Reward Engine Contract
- 建立風報比計算 pure function。
- fixture-only。
- 不輸出買賣指令。

### V21 Technical Candidate Radar UI
- 顯示低檔高風報比候選。
- 不產生交易建議。

### V22 K-line Data Pipeline
- 接 daily / weekly OHLCV。
- source validation。

### V23 Research + Technical Merge
- Research Rating + Technical Setup + Risk Reward 整合。
- 不直接產生買賣指令。
