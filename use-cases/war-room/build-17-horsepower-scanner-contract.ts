/**
 * 17 Horsepower Technical Scanner Contract — FIXTURE-ONLY, DETERMINISTIC SPEC
 *
 * A pure, deterministic, fixture-only specification of the "17 馬力多頭強度模型"
 * (17-horsepower bullish-strength model). It scores how many of 17 reference lines the
 * close sits above (1 horsepower each, 0–17 total), derives a level / transition signals
 * / pullback sweet-spot / 扣三低 setup / candidate tag, and outputs sample stocks.
 *
 * 定位（重要）：17 馬力是**多頭強度評分器**，不是單獨買進訊號、不是交易指令、不是自動下單、
 * 不是正式行情切換。未來需搭配扣三低、量縮拉回、KDJ、MACD、風報比、停損區一起使用。
 *
 * This builder is PURE: NO fetch, NO real network, NO Supabase, NO env read, NO clock
 * read (generatedAt is passed in or a fixed string), NO DB write, NO API route, NO
 * broker API, NO buy/sell command, NO auto order, NO production data switch. It only
 * DECLARES fixture data + deterministic derivations.
 *
 * See: docs/technical-scanner-17-horsepower.md
 */

export type HorsepowerGroup = "shortCost" | "dailyMA" | "weekly" | "monthly";

export type HorsepowerLineName =
  | "shortCost1" | "shortCost2" | "shortCost3" | "shortCost4" | "shortCost5"
  | "MA5" | "MA10" | "MA20" | "MA30" | "MA60" | "MA120"
  | "weeklyTurn" | "weeklyFastLine" | "weeklySlowLine"
  | "monthlyTurn" | "monthlyFastLine" | "monthlySlowLine";

export type HorsepowerLevel = "強多主升段" | "多方轉強" | "多空交戰" | "偏弱" | "空方";
export type CandidateTag = "主升段" | "逢低候選" | "觀察" | "排除";

// v1.1 — Allen 17-Line Power Score.
export type PowerRating =
  | "弱勢空方" | "偏空整理" | "初步翻多" | "轉強觀察" | "多頭攻擊" | "多方全勝";
export type DataStatus = "confirmed_close" | "intraday_estimated";

/** Per-group pass / available / ratio. If available === 0, ratio is 0 (資料不足). */
export interface HorsepowerGroupScore {
  passed: number;
  available: number;
  ratio: number;
}

export interface HorsepowerGroupWeights {
  shortCost: 25;
  dailyMA: 30;
  weekly: 25;
  monthly: 20;
}

/** One reference line. value === null means the line is unavailable (e.g. 60-min K missing). */
export interface HorsepowerLine {
  name: HorsepowerLineName;
  group: HorsepowerGroup;
  value: number | null;
}

export interface HorsepowerPullbackInputs {
  closeNearSupport: boolean; // close 拉回貼近 MA10 / MA20 / 前波突破帶
  volumeContraction: boolean; // 量縮
  riskRewardAcceptable: boolean; // 風報比可接受
}

export interface KoSanDiInputs {
  recentThreeLowsRising: boolean; // 近三個轉折低點墊高
  pullbackVolumeContracts: boolean; // 拉回量縮
  closeRecoversShortMA: boolean; // 收復短均
  kdjJTurnsUp: boolean; // KDJ 的 J 值翻揚
  macdHistogramImproves: boolean; // MACD 柱狀圖轉佳
}

export interface HorsepowerSampleInput {
  symbol: string;
  name: string;
  close: number;
  previousHorsepowerScore: number;
  lines: HorsepowerLine[];
  pullback: HorsepowerPullbackInputs;
  koSanDi: KoSanDiInputs;
  // v1.1 observation inputs (fixture-only).
  volumeRatio20: number; // 當日量 / 20 日均量
  volumePercentile60: number; // 60 日量能百分位 0～1
  bias20: number; // 對 MA20 乖離率（%）
  bias20Percentile120: number; // 120 日內乖離百分位 0～1
  dataStatus: DataStatus;
}

export interface HorsepowerStock {
  symbol: string;
  name: string;
  close: number;
  horsepowerScore: number;
  previousHorsepowerScore: number;
  horsepowerChange: number;
  horsepowerAcceleration: number;
  horsepowerLevel: HorsepowerLevel;
  availableLines: number;
  unavailableLines: number;
  reliabilityNote: string;
  firstBullTurn: boolean;
  strongBullConfirm: boolean;
  pullbackSweetSpot: boolean;
  deteriorationAlert: boolean;
  bearTurn: boolean;
  koSanDiSetup: boolean;
  riskNote: string;
  candidateTag: CandidateTag;
  lines: HorsepowerLine[];

  // v1.1 — power ratio + weighted power + group scores + observation filters.
  maxAvailable: number;
  powerRatio: number;
  previousPowerRatio: number;
  weightedPower: number; // 0～100
  shortCostScore: HorsepowerGroupScore;
  dailyMAScore: HorsepowerGroupScore;
  weeklyScore: HorsepowerGroupScore;
  monthlyScore: HorsepowerGroupScore;
  nearestSupport: number | null;
  nearestPressure: number | null;
  volumeRatio20: number;
  volumePercentile60: number;
  isVolumeConfirmed: boolean;
  bias20: number;
  bias20Percentile120: number;
  isOverheated: boolean;
  dataStatus: DataStatus;
  powerRating: PowerRating;
  effectiveAttack: boolean;
  strongButOverheated: boolean;
  notTradeAdvice: true;
  notEntrySignal: true;
}

export interface Scanner17HorsepowerContract {
  contractVersion: "SCANNER_17_HORSEPOWER";
  modelVersion: "V1_1";
  modelName: "Allen 17-Line Power Score v1.1";
  mode: "SPEC_FIXTURE_ONLY_NO_NETWORK";
  generatedAt: string;
  decision: "FIXTURE_ONLY_SPEC";

  scannerType: "BULLISH_STRENGTH_SCORER";
  totalLines: 17;
  groupWeights: HorsepowerGroupWeights;

  // Positioning — this model is NOT a trade signal / command / order / switch.
  isBuySignal: false;
  isTradeCommand: false;
  isAutoOrder: false;

  // Red-line flags (all false / locked).
  realNetworkUsed: false;
  liveFetchPerformed: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  apiRouteCreated: false;
  brokerApiUsed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionDataSwitched: false;
  productionTradingReady: false;

  levelBands: Array<{ level: HorsepowerLevel; min: number; max: number }>;
  stocks: HorsepowerStock[];
  safetyLabels: string[];
}

export interface Build17HorsepowerScannerContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

const LEVEL_BANDS: Array<{ level: HorsepowerLevel; min: number; max: number }> = [
  { level: "強多主升段", min: 16, max: 17 },
  { level: "多方轉強", min: 13, max: 15 },
  { level: "多空交戰", min: 10, max: 12 },
  { level: "偏弱", min: 6, max: 9 },
  { level: "空方", min: 0, max: 5 },
];

function levelFor(score: number): HorsepowerLevel {
  for (const b of LEVEL_BANDS) if (score >= b.min && score <= b.max) return b.level;
  return "空方";
}

const GROUP_WEIGHTS: HorsepowerGroupWeights = { shortCost: 25, dailyMA: 30, weekly: 25, monthly: 20 };

/** powerRating 由 powerRatio 判讀（依序）。 */
function powerRatingFor(powerRatio: number): PowerRating {
  if (powerRatio <= 5 / 17) return "弱勢空方";
  if (powerRatio <= 8 / 17) return "偏空整理";
  if (powerRatio <= 10 / 17) return "初步翻多";
  if (powerRatio <= 12 / 17) return "轉強觀察";
  if (powerRatio <= 16 / 17) return "多頭攻擊";
  return "多方全勝";
}

/** 單組 group score：passed / available / ratio（available=0 時 ratio=0）。 */
function groupScore(lines: HorsepowerLine[], group: HorsepowerGroup, close: number): HorsepowerGroupScore {
  const groupLines = lines.filter((l) => l.group === group);
  const available = groupLines.filter((l) => l.value !== null).length;
  const passed = groupLines.filter((l) => l.value !== null && close >= (l.value as number)).length;
  const ratio = available > 0 ? passed / available : 0;
  return { passed, available, ratio };
}

/** Deterministic derivation of one stock from its fixture inputs. */
function deriveStock(input: HorsepowerSampleInput): HorsepowerStock {
  const { close, lines } = input;
  // close above an available line = 1 horsepower; below = 0; unavailable never counts.
  const availableLines = lines.filter((l) => l.value !== null).length;
  const unavailableLines = lines.length - availableLines;
  const horsepowerScore = lines.filter((l) => l.value !== null && close >= (l.value as number)).length;

  const previousHorsepowerScore = input.previousHorsepowerScore;
  const horsepowerChange = horsepowerScore - previousHorsepowerScore;
  const horsepowerAcceleration = horsepowerChange;
  const horsepowerLevel = levelFor(horsepowerScore);

  // v1.1 — ratio + weighted power over group ratios.
  const maxAvailable = availableLines;
  const powerRatio = maxAvailable > 0 ? horsepowerScore / maxAvailable : 0;
  const previousPowerRatio = maxAvailable > 0 ? previousHorsepowerScore / maxAvailable : 0;
  const shortCostScore = groupScore(lines, "shortCost", close);
  const dailyMAScore = groupScore(lines, "dailyMA", close);
  const weeklyScore = groupScore(lines, "weekly", close);
  const monthlyScore = groupScore(lines, "monthly", close);
  const weightedPower =
    shortCostScore.ratio * GROUP_WEIGHTS.shortCost +
    dailyMAScore.ratio * GROUP_WEIGHTS.dailyMA +
    weeklyScore.ratio * GROUP_WEIGHTS.weekly +
    monthlyScore.ratio * GROUP_WEIGHTS.monthly;

  // nearest support = 收盤下方最近的可用線；nearest pressure = 收盤上方最近的可用線。
  const values = lines.filter((l) => l.value !== null).map((l) => l.value as number);
  const below = values.filter((v) => v <= close);
  const above = values.filter((v) => v > close);
  const nearestSupport = below.length > 0 ? Math.max(...below) : null;
  const nearestPressure = above.length > 0 ? Math.min(...above) : null;

  // 量能確認與過熱濾網（觀察條件，非買賣指令）。
  const isVolumeConfirmed = input.volumeRatio20 >= 1.2 || input.volumePercentile60 >= 0.7;
  const isOverheated = input.bias20Percentile120 >= 0.9;

  const groupInsufficient =
    shortCostScore.available === 0 ||
    dailyMAScore.available === 0 ||
    weeklyScore.available === 0 ||
    monthlyScore.available === 0;
  const reliabilityNote =
    unavailableLines > 0 || groupInsufficient
      ? `有 ${unavailableLines} 條線資料缺失（例如 60 分 K 缺失時，短線成本群標示為 unavailable 不可用；該組 ratio 記為 0），分數與加權僅供參考，不可默默算作通過。`
      : "";

  const firstBullTurn = previousHorsepowerScore <= 11 && horsepowerScore >= 13;
  const strongBullConfirm = horsepowerScore >= 15;
  // v1.1 — 單日下降 >= 3，或由 >=11/17 跌破 11/17（比例輔助判斷）。
  const deteriorationAlert =
    horsepowerChange <= -3 || (previousPowerRatio >= 11 / 17 && powerRatio < 11 / 17);
  const bearTurn = horsepowerScore <= 8;

  const powerRating = powerRatingFor(powerRatio);
  const effectiveAttack =
    previousPowerRatio <= 12 / 17 && powerRatio >= 13 / 17 && isVolumeConfirmed && !isOverheated;
  const strongButOverheated = powerRatio >= 13 / 17 && isOverheated;

  const pullbackSweetSpot =
    horsepowerScore >= 13 &&
    input.pullback.closeNearSupport &&
    input.pullback.volumeContraction &&
    !deteriorationAlert &&
    input.pullback.riskRewardAcceptable;

  const koSanDiSetup =
    input.koSanDi.recentThreeLowsRising &&
    input.koSanDi.pullbackVolumeContracts &&
    input.koSanDi.closeRecoversShortMA &&
    input.koSanDi.kdjJTurnsUp &&
    input.koSanDi.macdHistogramImproves &&
    horsepowerScore >= 13;

  let candidateTag: CandidateTag;
  if (deteriorationAlert || horsepowerScore <= 11) candidateTag = "排除";
  else if (pullbackSweetSpot) candidateTag = "逢低候選";
  else if (strongBullConfirm) candidateTag = "主升段";
  else candidateTag = "觀察";

  const riskNote =
    "停損區參考：跌破 MA20 或前波低點即出場；風報比需 >= 2；此為觀察／候選參考，非買賣指令、非自動下單。";

  return {
    symbol: input.symbol,
    name: input.name,
    close,
    horsepowerScore,
    previousHorsepowerScore,
    horsepowerChange,
    horsepowerAcceleration,
    horsepowerLevel,
    availableLines,
    unavailableLines,
    reliabilityNote,
    firstBullTurn,
    strongBullConfirm,
    pullbackSweetSpot,
    deteriorationAlert,
    bearTurn,
    koSanDiSetup,
    riskNote,
    candidateTag,
    lines,

    maxAvailable,
    powerRatio,
    previousPowerRatio,
    weightedPower,
    shortCostScore,
    dailyMAScore,
    weeklyScore,
    monthlyScore,
    nearestSupport,
    nearestPressure,
    volumeRatio20: input.volumeRatio20,
    volumePercentile60: input.volumePercentile60,
    isVolumeConfirmed,
    bias20: input.bias20,
    bias20Percentile120: input.bias20Percentile120,
    isOverheated,
    dataStatus: input.dataStatus,
    powerRating,
    effectiveAttack,
    strongButOverheated,
    notTradeAdvice: true,
    notEntrySignal: true,
  };
}

/** Build a line array from a compact spec; value null → unavailable. */
function line(name: HorsepowerLineName, group: HorsepowerGroup, value: number | null): HorsepowerLine {
  return { name, group, value };
}

// ---------------------------------------------------------------------------
// Fixture sample inputs (deterministic; NOT real recommendations)
// ---------------------------------------------------------------------------

const SAMPLE_INPUTS: HorsepowerSampleInput[] = [
  // 1) 強多主升段 — close above all 17 lines → score 17.
  {
    symbol: "8001",
    name: "樣本強多股（fixture）",
    close: 210,
    previousHorsepowerScore: 16,
    lines: [
      line("shortCost1", "shortCost", 150), line("shortCost2", "shortCost", 155),
      line("shortCost3", "shortCost", 160), line("shortCost4", "shortCost", 165),
      line("shortCost5", "shortCost", 170),
      line("MA5", "dailyMA", 190), line("MA10", "dailyMA", 185), line("MA20", "dailyMA", 180),
      line("MA30", "dailyMA", 175), line("MA60", "dailyMA", 170), line("MA120", "dailyMA", 160),
      line("weeklyTurn", "weekly", 170), line("weeklyFastLine", "weekly", 180), line("weeklySlowLine", "weekly", 165),
      line("monthlyTurn", "monthly", 160), line("monthlyFastLine", "monthly", 170), line("monthlySlowLine", "monthly", 150),
    ],
    pullback: { closeNearSupport: false, volumeContraction: false, riskRewardAcceptable: false },
    koSanDi: { recentThreeLowsRising: true, pullbackVolumeContracts: false, closeRecoversShortMA: true, kdjJTurnsUp: true, macdHistogramImproves: true },
    volumeRatio20: 1.5, volumePercentile60: 0.82, bias20: 15, bias20Percentile120: 0.95, dataStatus: "confirmed_close",
  },
  // 2) 多方轉強逢低候選 — close above 14 lines / below 3 → score 14; pullback sweet-spot.
  {
    symbol: "8002",
    name: "樣本逢低候選股（fixture）",
    close: 100,
    previousHorsepowerScore: 11,
    lines: [
      line("shortCost1", "shortCost", 90), line("shortCost2", "shortCost", 92),
      line("shortCost3", "shortCost", 94), line("shortCost4", "shortCost", 96),
      line("shortCost5", "shortCost", 98),
      line("MA5", "dailyMA", 99), line("MA10", "dailyMA", 98), line("MA20", "dailyMA", 97),
      line("MA30", "dailyMA", 96), line("MA60", "dailyMA", 95), line("MA120", "dailyMA", 88),
      line("weeklyTurn", "weekly", 99), line("weeklyFastLine", "weekly", 101), line("weeklySlowLine", "weekly", 97),
      line("monthlyTurn", "monthly", 100), line("monthlyFastLine", "monthly", 103), line("monthlySlowLine", "monthly", 102),
    ],
    pullback: { closeNearSupport: true, volumeContraction: true, riskRewardAcceptable: true },
    koSanDi: { recentThreeLowsRising: true, pullbackVolumeContracts: true, closeRecoversShortMA: true, kdjJTurnsUp: true, macdHistogramImproves: true },
    volumeRatio20: 1.3, volumePercentile60: 0.55, bias20: 6, bias20Percentile120: 0.6, dataStatus: "intraday_estimated",
  },
  // 3) 轉弱排除 — 60-min missing → shortCost 5 匹 unavailable; score 8 of 12; deterioration.
  {
    symbol: "8003",
    name: "樣本轉弱股（fixture）",
    close: 48,
    previousHorsepowerScore: 12,
    lines: [
      line("shortCost1", "shortCost", null), line("shortCost2", "shortCost", null),
      line("shortCost3", "shortCost", null), line("shortCost4", "shortCost", null),
      line("shortCost5", "shortCost", null),
      line("MA5", "dailyMA", 50), line("MA10", "dailyMA", 49), line("MA20", "dailyMA", 47),
      line("MA30", "dailyMA", 46), line("MA60", "dailyMA", 45), line("MA120", "dailyMA", 40),
      line("weeklyTurn", "weekly", 44), line("weeklyFastLine", "weekly", 47), line("weeklySlowLine", "weekly", 42),
      line("monthlyTurn", "monthly", 47), line("monthlyFastLine", "monthly", 50), line("monthlySlowLine", "monthly", 49),
    ],
    pullback: { closeNearSupport: false, volumeContraction: false, riskRewardAcceptable: false },
    koSanDi: { recentThreeLowsRising: false, pullbackVolumeContracts: false, closeRecoversShortMA: false, kdjJTurnsUp: false, macdHistogramImproves: false },
    volumeRatio20: 0.8, volumePercentile60: 0.3, bias20: -5, bias20Percentile120: 0.2, dataStatus: "confirmed_close",
  },
];

/**
 * Builds the 17-horsepower scanner contract. Reads no clock / env / network; derives
 * every field deterministically from the fixture inputs. This is a spec, not a signal.
 */
export function build17HorsepowerScannerContract(
  input: Build17HorsepowerScannerContractInput = {},
): Scanner17HorsepowerContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const stocks = SAMPLE_INPUTS.map(deriveStock);

  return {
    contractVersion: "SCANNER_17_HORSEPOWER",
    modelVersion: "V1_1",
    modelName: "Allen 17-Line Power Score v1.1",
    mode: "SPEC_FIXTURE_ONLY_NO_NETWORK",
    generatedAt,
    decision: "FIXTURE_ONLY_SPEC",

    scannerType: "BULLISH_STRENGTH_SCORER",
    totalLines: 17,
    groupWeights: GROUP_WEIGHTS,

    isBuySignal: false,
    isTradeCommand: false,
    isAutoOrder: false,

    realNetworkUsed: false,
    liveFetchPerformed: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    apiRouteCreated: false,
    brokerApiUsed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionDataSwitched: false,
    productionTradingReady: false,

    levelBands: LEVEL_BANDS,
    stocks,

    safetyLabels: [
      "17 Horsepower Technical Scanner",
      "SPEC_FIXTURE_ONLY_NO_NETWORK",
      "bullish-strength scorer, not a buy signal",
      "not a trade command, not auto order, not production switch",
      "扣三低 / 走多逢低候選股 future integration",
      "0–17 horsepower; unavailable lines never count as pass",
      "no real network / no live fetch / no Supabase / no env read",
      "no DB write / no API route / no broker API",
      "no buy/sell command / no auto order / no production data switch",
      "使用者可見 UI 一律繁體中文；技術 key 保留英文需附繁中說明",
    ],
  };
}
