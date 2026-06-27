/**
 * Allen Score Scoring Model Contract — V61
 *
 * Read-model TypeScript contract for the Allen Score 100 scoring model + daily
 * candidate pools. TYPES + static CONSTANTS ONLY. No runtime, no fetch, no
 * Supabase client, no env reads, no clock reads, no DB writes, no connection.
 *
 * Allen Score = 100 = Technical 30 + Fundamental 25 + Chip 25 + ETF Flow 10 +
 * Market Sentiment 10. Daily grades: A (>=80, 主升段池) / B (70-79, 觀察池) /
 * C (60-69, 等待池) / Avoid (<60, 禁碰池).
 *
 * System candidates are NOT positions. Sample scores are fixture-only and must be
 * labeled; fixture/mock score is not operational data. No fake PnL: a candidate
 * never computes holding PnL (isPosition=false, pnlComputable=false).
 *
 * See: docs/allen-score-scoring-model.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type AllenScoreCategoryId =
  | "TECHNICAL"
  | "FUNDAMENTAL"
  | "CHIP"
  | "ETF_FLOW"
  | "MARKET_SENTIMENT";

export type AllenScoreGrade = "A_MAIN_UPTREND" | "B_OBSERVE" | "C_WAIT" | "AVOID";

export type AllenScorePoolId = "A_MAIN_UPTREND_POOL" | "B_OBSERVE_POOL" | "C_WAIT_POOL" | "AVOID_POOL";

export type AllenScoreSuggestedAction =
  | "OBSERVE"
  | "WAIT_PULLBACK"
  | "SCALE_IN_ON_CONFIRMATION"
  | "AVOID"
  | "DATA_INSUFFICIENT";

export type AllenScoreVerificationStatus =
  | "VERIFIED"
  | "DELAYED"
  | "STALE"
  | "CONFLICT"
  | "FIXTURE_ONLY"
  | "MOCK_ONLY"
  | "INSUFFICIENT_DATA"
  | "NOT_CONNECTED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AllenScoreCategory {
  categoryId: AllenScoreCategoryId;
  name: string;
  weight: number;
  subFactors: string[];
  judgementNotes: string[];
}

export interface AllenScorePoolDefinition {
  poolId: AllenScorePoolId;
  grade: AllenScoreGrade;
  title: string;
  scoreMin: number;
  scoreMax: number | null;
  rule: string;
}

export interface AllenScoreCandidate {
  stockId: string;
  symbol: string;
  name: string;
  allenScore: number;
  grade: AllenScoreGrade;
  technicalScore: number;
  fundamentalScore: number;
  chipScore: number;
  etfFlowScore: number;
  marketSentimentScore: number;
  candidateReason: string;
  technicalTriggers: string[];
  pullbackBuyZone: string;
  confirmationCondition: string;
  invalidationCondition: string;
  riskRewardRatio: string;
  suggestedAction: AllenScoreSuggestedAction;
  dataSource: string;
  dataTimestamp: string;
  verificationStatus: AllenScoreVerificationStatus;
  isPosition: false;
  pnlComputable: false;
}

export interface AllenScoreDailyPool {
  poolId: AllenScorePoolId;
  grade: AllenScoreGrade;
  title: string;
  candidates: AllenScoreCandidate[];
}

export interface AllenScoreScoringModelBundle {
  contractVersion: "V61";
  scoringModelName: "Allen Score 100";
  generatedAt: string;
  decision: "READY_FOR_UI_REVIEW" | "NO_GO";

  totalScore: 100;
  technicalWeight: 30;
  fundamentalWeight: 25;
  chipWeight: 25;
  etfFlowWeight: 10;
  marketSentimentWeight: 10;
  scoreWeightsSum: 100;

  aGradeThreshold: 80;
  bGradeMin: 70;
  bGradeMax: 79;
  cGradeMin: 60;
  cGradeMax: 69;
  avoidBelow: 60;

  categories: AllenScoreCategory[];
  poolDefinitions: AllenScorePoolDefinition[];
  dailyPools: AllenScoreDailyPool[];

  // Locked taxonomy + safety flags.
  systemCandidateIsNotPosition: true;
  watchlistIsNotPosition: true;
  opportunityPoolIsNotPosition: true;
  actualPositionRequiresSharesAndCostForPnl: true;
  noFakePnlAllowed: true;
  sampleScoreIsFixtureOnly: true;
  mockDataMustBeLabeled: true;
  fixtureDataMustBeLabeled: true;
  realDataConnected: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionTradingReady: false;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ALLEN_SCORE_SCORING_MODEL_CONTRACT_VERSION = "V61" as const;

export const ALLEN_SCORE_CATEGORY_IDS: readonly AllenScoreCategoryId[] = [
  "TECHNICAL",
  "FUNDAMENTAL",
  "CHIP",
  "ETF_FLOW",
  "MARKET_SENTIMENT",
] as const;

export const ALLEN_SCORE_GRADES: readonly AllenScoreGrade[] = [
  "A_MAIN_UPTREND",
  "B_OBSERVE",
  "C_WAIT",
  "AVOID",
] as const;

export const ALLEN_SCORE_POOL_IDS: readonly AllenScorePoolId[] = [
  "A_MAIN_UPTREND_POOL",
  "B_OBSERVE_POOL",
  "C_WAIT_POOL",
  "AVOID_POOL",
] as const;

/** ETF flow tracked symbols (active TW equity ETFs). */
export const ALLEN_SCORE_ETF_FLOW_SYMBOLS: readonly string[] = ["00981A", "00991A", "00403A"] as const;

export const ALLEN_SCORE_SAFETY_LABELS = [
  "Allen Score 100",
  "system candidate is not position",
  "可逢低布局不等於已買進",
  "系統候選股不等於持股",
  "no fake PnL",
  "fixture/mock score is not operational data",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
  "A 級不等於立刻追價",
  "禁碰池不得低接、不得追價",
  "不替代投資判斷",
] as const;
