# Cross-Module Consistency & Candidate Ranking Governance

跨模組一致性檢查與候選排序治理規格（**fixture-only**）。

## Purpose

- 定義**跨模組一致性檢查**（Cross-Module Consistency）。
- 定義**候選排序治理層**（Candidate Ranking Governance）。
- 解決 Allen Score 100、Allen 17-Line Power Score、Technical + Risk Reward、扣三低、Position Strategy
  對同一檔股票**互相矛盾**的問題。
- 本版 **fixture-only**。
- **不代表正式行情掃描**、**不代表交易訊號**、**不代表買賣建議**、**不代表自動交易**。

> 定位：這是 governance / consistency layer，**不取代**任何既有模組（Allen Score 100、
> Technical + Risk Reward Strategy Engine、Position Strategy Plan、Allen 17-Line Power Score、
> 扣三低 Scanner）。

## Problem Statement

目前多套模組可能對**同一檔股票**產生不同方向結論。沒有治理層時，使用者可能誤讀高分訊號。

| 模組 | 可能結論 |
|---|---|
| Allen Score 100 | A 級主升段池 |
| 17-Line Power Score | 弱勢空方 |
| Technical + Risk Reward | DATA_INSUFFICIENT |
| Position Strategy | No Touch |

## Input Modules

- Allen Score 100
- Technical + Risk Reward Strategy Engine
- Position Strategy Plan
- 扣三低 Scanner
- Allen 17-Line Power Score v1.1
- Watchlist 17 Horsepower Candidate Matrix

---

# Cross-Module Signal Summary

每檔股票的治理輸出（`CrossModuleSignalSummary`）：

```ts
{
  symbol: string;
  nameZh: string;
  allenScoreSignal: "strong" | "watch" | "weak" | "avoid" | "data_insufficient";
  seventeenLineSignal: "strong" | "watch" | "weak" | "avoid" | "data_insufficient";
  technicalRiskRewardSignal: "qualified" | "watch" | "unqualified" | "data_insufficient";
  kouSanDiSignal: "pass" | "waiting" | "fail" | "data_insufficient";
  positionStrategySignal: "entry_observation" | "holding_defense" | "risk_reduction" | "no_touch" | "data_insufficient";
  conflictLevel: "none" | "warning" | "critical";
  conflictReasons: string[];
  hardGateStatus: "pass" | "downgraded" | "excluded" | "data_insufficient";
  rankingEligible: boolean;
  downgradedBy: string[];
  finalObservationLabelZh: string;
  safetyNoteZh: string;
  notTradeAdvice: true;
  notEntrySignal: true;
  notAutoOrder: true;
}
```

---

# Cross-Module Conflict Rules

1. Allen Score A 級，但 17-Line Power Score `<= 8/17` → `conflictLevel = warning`（或 critical）；
   `finalObservationLabelZh = 訊號分歧，暫不升級`。
2. Allen Score A 級，但 Position Strategy = No Touch → `conflictLevel = critical`；
   `hardGateStatus = excluded`；`finalObservationLabelZh = 禁碰優先`。
3. 17-Line Power Score `>= 13/17`，但 Technical + Risk Reward = DATA_INSUFFICIENT →
   `conflictLevel = warning`；`rankingEligible = false`；`finalObservationLabelZh = 趨勢強但資料不足`。
4. 扣三低通過，但 17-Line Power Score `<= 8/17` → `conflictLevel = warning`；
   `finalObservationLabelZh = 扣三低通過但趨勢未確認`。
5. 17-Line Power Score `>= 13/17` 且 扣三低通過 且 Technical + Risk Reward qualified →
   `conflictLevel = none`；`rankingEligible = true`；`finalObservationLabelZh = 趨勢與拉回條件一致`。
6. **Position Strategy = No Touch 時，必須凌駕其他所有高分訊號**（No Touch overrides high scores）：
   任何 A 級 / 高馬力 / 高風報比都不得覆蓋 No Touch。

---

# Candidate Ranking Governance

候選排序拆成兩層。

## 第一層：Hard Gates

以下條件不通過時，**不得升級為高信心候選**：

- Position Strategy = No Touch
- marketStatus = DANGER
- dataQualityStatus = FAIL
- supportZone 缺失
- invalidLevel 缺失
- crossModule `conflictLevel = critical`

## 第二層：Weighted Observation Score

僅對**通過 hard gates** 的股票計算。建議權重（fixture-only）：

- trendStrengthScore：30（可來自 17-Line Power Score v1.1 的 powerRatio / weightedPower）
- technicalSetupScore：25（可來自 KD / KDJ / MACD / MA / 扣三低 group）
- riskStructureScore：20（可包含 riskRewardRatio，但**不得單獨主導排序**）
- volumePriceScore：15（可來自量縮回測 / 放量突破 / volume confirmation）
- researchValuationBonus：10（**只能加分，不得取代技術風控**）

規則：沒有 setupWinRate 前，riskRewardRatio 只能是**結構參考**，不是期望值排序。

---

# Risk Reward Governance

連續分級（continuous range）規則：

```
< 2.0      → UNQUALIFIED
2.0–2.99   → QUALIFIED
3.0–3.99   → GOOD
>= 4.0     → EXCELLENT
```

- **風報比不是勝率**（riskRewardRatio is not win rate）。
- 高風報比**不代表期望值為正**。
- 沒有 `setupWinRate` / historical hit rate 前，`riskRewardRatio` **不得單獨作為排序主因**。

未來欄位：

```ts
{
  setupWinRate: number | null;
  expectedValueStatus: "unavailable" | "fixture_only" | "ready_for_backtest";
  expectedValueRankingAllowed: false;
}
```

---

# Technical Score Collinearity Guard

先建立 spec，**不直接重算 Allen Score 100**（recalculatesAllenScoreNow = false）。

Technical Score 30 未來應拆成群組上限：

```
扣抵 / 扣三低群組（deduction）：5
短均線 / 趨勢群組（shortMATrend）：7
KD / KDJ / MACD 動能群組（momentum）：8
量價群組（volumePrice）：5
支撐壓力 / 型態群組（supportPattern）：5
合計 30
```

- 同一群組內多個高度相關 trigger **不可線性灌分**。
- MACD 翻紅 / OSC 負轉正 / DIF 上彎 / 柱狀體放大屬**同一動能群組**。
- 扣三低 / 扣低即將上彎 / 扣抵低檔形成屬**同一扣抵群組**。
- 站回 5MA / 10MA / 20MA、5MA 上穿 10MA、均線糾結後向上發散屬**短均線趨勢群組**。

---

# Backtest / Calibration Boundary

目前所有門檻都是**未回測校準的 heuristic thresholds**，包含：

- Allen Score 80 / 70 / 60
- 17-Line Power Score 13/17、8/17
- riskRewardRatio 2 / 3 / 4
- technical setup weights

在 historical K-line contract 與 backtest validator 完成前：

- **不得宣稱有統計勝率**（no statistical win rate yet）。
- 不得宣稱分級有機率意義。
- 不得把「A 級 / 多頭攻擊 / 主升段」等字樣呈現為進場訊號。
- UI 必須保留 observation-only / **not buy/sell instruction**（not trade advice）safety label。

---

# War Room Integration

本版最小幅度整合到 War Room fixture read-model：`crossModuleConsistencyItems`、
`crossModuleConsistencySummary`、`crossModuleConsistencyFixtureVersion`。War Room UI 新增
繁中「跨模組一致性」區塊，每檔顯示各模組 signal、conflictLevel、hardGateStatus、rankingEligible、
finalObservationLabelZh、safetyNoteZh，並標示**非買賣建議 / 非進場訊號 / 非自動下單**。
UI user-visible text 一律繁體中文。

---

# Red Lines

- no real network / no live fetch / no new approved live-fetch symbol（approved live-fetch symbols remain 3019 only）
- no Yahoo / no API route / no /api/portfolio switch / no Supabase / no process.env / no DB write
- no broker API / no buy/sell command / no auto order / no production data switch
- do not modify safety-chain composition; standalone validator only.
