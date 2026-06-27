/**
 * Allen Score Scoring Model Contract Builder — V61
 *
 * Pure deterministic builder. Returns the Allen Score 100 scoring model + daily
 * candidate pool bundle. Sample scores are FIXTURE-ONLY and must be labeled;
 * fixture/mock score is not operational data. System candidates are NOT positions
 * (isPosition=false), and never compute holding PnL (pnlComputable=false).
 *
 * Allen Score = 100 = Technical 30 + Fundamental 25 + Chip 25 + ETF Flow 10 +
 * Market Sentiment 10. Daily grades: A (>=80) / B (70-79) / C (60-69) / Avoid (<60).
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no /api/portfolio switch; no buy/sell command; no auto order
 */

import {
  ALLEN_SCORE_ETF_FLOW_SYMBOLS,
  ALLEN_SCORE_SAFETY_LABELS,
} from "./allen-score-scoring-model-contract";
import type {
  AllenScoreCandidate,
  AllenScoreCategory,
  AllenScoreDailyPool,
  AllenScoreGrade,
  AllenScorePoolDefinition,
  AllenScoreScoringModelBundle,
} from "./allen-score-scoring-model-contract";
import { gradeCandidate, scoreCandidate } from "./allen-score-scoring-engine";
import type { AllenScoreEngineGrade } from "./allen-score-scoring-engine";

/** Canonical engine grade → V61 grade enum. */
const ENGINE_TO_ALLEN_GRADE: Record<AllenScoreEngineGrade, AllenScoreGrade> = {
  A: "A_MAIN_UPTREND",
  B: "B_OBSERVE",
  C: "C_WAIT",
  AVOID: "AVOID",
};

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const FX = "fixture／mock score：目前非真實分數，不可作為正式操作依據";

export interface BuildAllenScoreScoringModelContractInput {
  generatedAt?: string;
}

// ---------------------------------------------------------------------------
// Score categories (weights sum to 100)
// ---------------------------------------------------------------------------

function buildCategories(): AllenScoreCategory[] {
  return [
    {
      categoryId: "TECHNICAL",
      name: "技術面 Technical Score",
      weight: 30,
      subFactors: ["KD", "KDJ", "MACD", "moving averages 均線", "扣三低 / 扣抵條件"],
      judgementNotes: [
        "KDJ 值夠低",
        "KD 低檔黃金交叉",
        "K 值上彎",
        "J 值轉強",
        "MACD 翻紅",
        "OSC 負轉正",
        "DIF 上彎",
        "柱狀體放大",
        "站回 5MA / 10MA / 20MA",
        "5MA 上穿 10MA",
        "均線糾結後向上發散",
        "扣三低",
        "扣低即將上彎",
        "扣抵低檔形成",
        "前低不破",
        "月線不破",
        "季線支撐",
        "箱型突破",
        "突破前高",
        "突破大量平台",
        "突破下降壓力線",
        "突破後回測不破",
        "量縮回測 5 / 10 / 20 日線",
        "放量突破",
        "價漲量增",
        "價跌量縮",
        "爆量長黑避開",
        "主升段偵測",
        "飆股預備隊",
      ],
    },
    {
      categoryId: "FUNDAMENTAL",
      name: "基本面 Fundamental Score",
      weight: 25,
      subFactors: ["營收", "EPS", "毛利率", "法人預估"],
      judgementNotes: [
        "營收是否年增 / 月增",
        "EPS 是否改善",
        "毛利率是否回升",
        "法人是否上修預估",
        "產業是否進入成長週期",
      ],
    },
    {
      categoryId: "CHIP",
      name: "籌碼面 Chip Score",
      weight: 25,
      subFactors: ["外資", "投信", "主力", "大戶持股"],
      judgementNotes: [
        "外資是否回補",
        "投信是否連買",
        "主力是否買超",
        "大戶持股是否增加",
        "散戶是否下降",
        "籌碼是否集中",
        "分點買盤是否穩定",
        "法人低檔建倉",
        "避免散戶追高盤",
      ],
    },
    {
      categoryId: "ETF_FLOW",
      name: "ETF 資金流 ETF Flow Score",
      weight: 10,
      subFactors: [...ALLEN_SCORE_ETF_FLOW_SYMBOLS, "是否同步買進"],
      judgementNotes: [
        "00981A 是否買進",
        "00991A 是否買進",
        "00403A 是否買進",
        "是否同步買進同一產業 / 同一權重股",
        "是否形成被動資金推升",
        "是否對候選股有資金加成",
      ],
    },
    {
      categoryId: "MARKET_SENTIMENT",
      name: "市場情緒 Market Sentiment Score",
      weight: 10,
      subFactors: ["Put / Call", "VIX", "散戶小台", "外資期貨"],
      judgementNotes: [
        "是否適合積極做多",
        "大盤是否有系統性風險",
        "散戶是否過熱",
        "外資期貨偏多或偏空",
        "VIX 是否升高",
        "Put / Call 是否過度樂觀或恐慌",
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Pool definitions (grading rules)
// ---------------------------------------------------------------------------

function buildPoolDefinitions(): AllenScorePoolDefinition[] {
  return [
    {
      poolId: "A_MAIN_UPTREND_POOL",
      grade: "A_MAIN_UPTREND",
      title: "A 級主升段池",
      scoreMin: 80,
      scoreMax: null,
      rule: "80 分以上；A 級不等於立刻追價，仍需承接區與確認條件。",
    },
    {
      poolId: "B_OBSERVE_POOL",
      grade: "B_OBSERVE",
      title: "B 級觀察池",
      scoreMin: 70,
      scoreMax: 79,
      rule: "70–79 分；觀察與等待回測。",
    },
    {
      poolId: "C_WAIT_POOL",
      grade: "C_WAIT",
      title: "C 級等待池",
      scoreMin: 60,
      scoreMax: 69,
      rule: "60–69 分；等待，不追。",
    },
    {
      poolId: "AVOID_POOL",
      grade: "AVOID",
      title: "禁碰池",
      scoreMin: 0,
      scoreMax: 59,
      rule: "60 分以下；不得低接、不得追價。",
    },
  ];
}

// ---------------------------------------------------------------------------
// Fixture-only sample candidates
// ---------------------------------------------------------------------------

function candidate(
  c: Omit<
    AllenScoreCandidate,
    "isPosition" | "pnlComputable" | "dataSource" | "verificationStatus" | "allenScore" | "grade"
  > & {
    verificationStatus: AllenScoreCandidate["verificationStatus"];
  },
): AllenScoreCandidate {
  // allenScore + grade are DERIVED deterministically by the V62 scoring engine —
  // never hand-filled — so total == sub-score sum and grade always matches score.
  const allenScore = scoreCandidate({
    technicalScore: c.technicalScore,
    fundamentalScore: c.fundamentalScore,
    chipScore: c.chipScore,
    etfFlowScore: c.etfFlowScore,
    marketSentimentScore: c.marketSentimentScore,
  });
  const grade = ENGINE_TO_ALLEN_GRADE[gradeCandidate(allenScore)];
  return {
    ...c,
    allenScore,
    grade,
    dataSource: "fixture / mock_or_contract",
    isPosition: false,
    pnlComputable: false,
  };
}

function buildDailyPools(generatedAt: string): AllenScoreDailyPool[] {
  const aCandidates: AllenScoreCandidate[] = [
    candidate({
      stockId: "A100",
      symbol: "A100",
      name: "A 級 sample 甲",
      technicalScore: 27,
      fundamentalScore: 22,
      chipScore: 22,
      etfFlowScore: 9,
      marketSentimentScore: 8,
      candidateReason: "主升段偵測：KD 低檔黃金交叉 + MACD 翻紅 + 法人低檔建倉（fixture）",
      technicalTriggers: ["KD 低檔黃金交叉", "MACD 翻紅", "站回 5MA / 10MA / 20MA", "突破前高", "放量突破"],
      pullbackBuyZone: "回測 5 日線承接區（fixture）",
      confirmationCondition: "帶量站穩前高並回測不破",
      invalidationCondition: "跌破承接區或月線即失效",
      riskRewardRatio: "1 : 3（fixture）",
      suggestedAction: "SCALE_IN_ON_CONFIRMATION",
      dataTimestamp: generatedAt,
      verificationStatus: "FIXTURE_ONLY",
    }),
    candidate({
      stockId: "A101",
      symbol: "A101",
      name: "A 級 sample 乙",
      technicalScore: 25,
      fundamentalScore: 20,
      chipScore: 21,
      etfFlowScore: 8,
      marketSentimentScore: 8,
      candidateReason: "均線糾結後向上發散 + 投信連買 + ETF 同步買進（fixture）",
      technicalTriggers: ["均線糾結後向上發散", "5MA 上穿 10MA", "突破大量平台", "價漲量增"],
      pullbackBuyZone: "回測 10 日線承接區（fixture）",
      confirmationCondition: "回測 10 日線不破並轉強",
      invalidationCondition: "量能背離或跌破 10 日線即失效",
      riskRewardRatio: "1 : 2.5（fixture）",
      suggestedAction: "SCALE_IN_ON_CONFIRMATION",
      dataTimestamp: generatedAt,
      verificationStatus: "FIXTURE_ONLY",
    }),
  ];

  const bCandidates: AllenScoreCandidate[] = [
    candidate({
      stockId: "B200",
      symbol: "B200",
      name: "B 級 sample 丙",
      technicalScore: 22,
      fundamentalScore: 18,
      chipScore: 18,
      etfFlowScore: 7,
      marketSentimentScore: 7,
      candidateReason: "扣低即將上彎 + 營收年增，等待回測（fixture）",
      technicalTriggers: ["扣三低", "扣低即將上彎", "季線支撐", "量縮回測 5 / 10 / 20 日線"],
      pullbackBuyZone: "回測季線承接區（fixture）",
      confirmationCondition: "守住季線並出現低檔黃金交叉",
      invalidationCondition: "跌破季線即觀察轉弱",
      riskRewardRatio: "1 : 2（fixture）",
      suggestedAction: "WAIT_PULLBACK",
      dataTimestamp: generatedAt,
      verificationStatus: "FIXTURE_ONLY",
    }),
  ];

  const cCandidates: AllenScoreCandidate[] = [
    candidate({
      stockId: "C300",
      symbol: "C300",
      name: "C 級 sample 丁",
      technicalScore: 18,
      fundamentalScore: 16,
      chipScore: 15,
      etfFlowScore: 6,
      marketSentimentScore: 6,
      candidateReason: "型態整理中、籌碼尚未集中，等待不追（fixture）",
      technicalTriggers: ["前低不破", "月線不破", "價跌量縮"],
      pullbackBuyZone: "等待型態完成，暫無明確承接區（fixture）",
      confirmationCondition: "出現箱型突破與放量突破再評估",
      invalidationCondition: "跌破前低即降評",
      riskRewardRatio: "1 : 1.5（fixture）",
      suggestedAction: "WAIT_PULLBACK",
      dataTimestamp: generatedAt,
      verificationStatus: "FIXTURE_ONLY",
    }),
  ];

  const avoidCandidates: AllenScoreCandidate[] = [
    candidate({
      stockId: "Z900",
      symbol: "Z900",
      name: "禁碰 sample 戊",
      technicalScore: 12,
      fundamentalScore: 10,
      chipScore: 10,
      etfFlowScore: 4,
      marketSentimentScore: 4,
      candidateReason: "爆量長黑、籌碼鬆動、追高風險（fixture）",
      technicalTriggers: ["爆量長黑避開", "跌破月線", "散戶追高盤"],
      pullbackBuyZone: "禁碰池：不得低接（fixture）",
      confirmationCondition: "無；禁碰池不提供進場條件",
      invalidationCondition: "維持破線即續列禁碰",
      riskRewardRatio: "風報比不足（fixture）",
      suggestedAction: "AVOID",
      dataTimestamp: generatedAt,
      verificationStatus: "FIXTURE_ONLY",
    }),
  ];

  return [
    { poolId: "A_MAIN_UPTREND_POOL", grade: "A_MAIN_UPTREND", title: "A 級主升段池", candidates: aCandidates },
    { poolId: "B_OBSERVE_POOL", grade: "B_OBSERVE", title: "B 級觀察池", candidates: bCandidates },
    { poolId: "C_WAIT_POOL", grade: "C_WAIT", title: "C 級等待池", candidates: cCandidates },
    { poolId: "AVOID_POOL", grade: "AVOID", title: "禁碰池", candidates: avoidCandidates },
  ];
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic Allen Score 100 scoring model + daily candidate pool
 * bundle. All timestamps come from `input.generatedAt` (or a fixed fallback);
 * no clock is read. All sample candidates are fixture-only, not positions.
 */
export function buildAllenScoreScoringModelContract(
  input: BuildAllenScoreScoringModelContractInput = {},
): AllenScoreScoringModelBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const categories = buildCategories();
  const poolDefinitions = buildPoolDefinitions();
  const dailyPools = buildDailyPools(generatedAt);

  return {
    contractVersion: "V61",
    scoringModelName: "Allen Score 100",
    generatedAt,
    decision: "READY_FOR_UI_REVIEW",

    totalScore: 100,
    technicalWeight: 30,
    fundamentalWeight: 25,
    chipWeight: 25,
    etfFlowWeight: 10,
    marketSentimentWeight: 10,
    scoreWeightsSum: 100,

    aGradeThreshold: 80,
    bGradeMin: 70,
    bGradeMax: 79,
    cGradeMin: 60,
    cGradeMax: 69,
    avoidBelow: 60,

    categories,
    poolDefinitions,
    dailyPools,

    systemCandidateIsNotPosition: true,
    watchlistIsNotPosition: true,
    opportunityPoolIsNotPosition: true,
    actualPositionRequiresSharesAndCostForPnl: true,
    noFakePnlAllowed: true,
    sampleScoreIsFixtureOnly: true,
    mockDataMustBeLabeled: true,
    fixtureDataMustBeLabeled: true,
    realDataConnected: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionTradingReady: false,

    safetyLabels: [...ALLEN_SCORE_SAFETY_LABELS, FX],
  };
}
