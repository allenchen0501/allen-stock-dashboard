/**
 * Structured Candidate Trade Plan Contract Builder — V63
 *
 * Pure deterministic builder. For each actionable (non-AVOID) V62 candidate it
 * produces a STRUCTURED trade plan (buy zone / risk-reward / entry strategy) and a
 * self-validation record proving the structure is internally consistent and stays
 * within fixture/mock safe mode.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no /api/portfolio switch; no buy/sell command; no auto order
 */

import { buildAllenScoreScoringModelContract } from "./build-allen-score-scoring-model-contract";
import type { AllenScoreCandidate } from "./allen-score-scoring-model-contract";
import { assignCandidatePool, gradeCandidate, scoreCandidate } from "./allen-score-scoring-engine";
import type { AllenScoreEngineGrade } from "./allen-score-scoring-engine";
import {
  STRUCTURED_CANDIDATE_TRADE_PLAN_CONTRACT_NAME,
  STRUCTURED_CANDIDATE_TRADE_PLAN_SAFETY_LABELS,
  TRADE_PLAN_FORBIDDEN_COMMAND_PHRASES,
  TRADE_PLAN_RATIO_TOLERANCE,
} from "./structured-candidate-trade-plan-contract";
import type {
  CandidateTradePlan,
  CandidateTradePlanValidation,
  StructuredBuyZone,
  StructuredCandidateTradePlanBundle,
  StructuredEntryStrategy,
  StructuredRiskReward,
  TradePlanConfidence,
} from "./structured-candidate-trade-plan-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStructuredCandidateTradePlanContractInput {
  generatedAt?: string;
}

interface PriceLevels {
  buyLower: number;
  buyUpper: number;
  stopLower: number;
  stopUpper: number;
  targetLower: number;
  targetUpper: number;
  basis: string;
  confidence: TradePlanConfidence;
}

/** Deterministic fixture price levels keyed by candidate symbol (TWD). */
const PRICE_LEVELS: Record<string, PriceLevels> = {
  A100: { buyLower: 100, buyUpper: 105, stopLower: 94, stopUpper: 98, targetLower: 112, targetUpper: 120, basis: "回測 5MA 承接區（fixture）", confidence: "medium" },
  A101: { buyLower: 50, buyUpper: 53, stopLower: 46, stopUpper: 48.5, targetLower: 58, targetUpper: 64, basis: "回測 10MA 承接區（fixture）", confidence: "medium" },
  B200: { buyLower: 200, buyUpper: 210, stopLower: 188, stopUpper: 196, targetLower: 224, targetUpper: 240, basis: "回測季線承接區（fixture）", confidence: "low" },
  C300: { buyLower: 75, buyUpper: 78, stopLower: 70, stopUpper: 73.5, targetLower: 83, targetUpper: 88, basis: "型態待完成，暫估承接區（fixture）", confidence: "low" },
};

function round(value: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(value * f) / f;
}

function buildBuyZone(levels: PriceLevels): StructuredBuyZone {
  return {
    lower: levels.buyLower,
    upper: levels.buyUpper,
    currency: "TWD",
    basis: levels.basis,
    confidence: levels.confidence,
    sourceType: "fixture_mock",
    operationalUseAllowed: false,
  };
}

function buildRiskReward(levels: PriceLevels): StructuredRiskReward {
  // Reference entry = mid of the buy zone. Risk to the nearest defense (stopUpper),
  // reward to the nearest target (targetLower); both as percent of the reference.
  const entry = (levels.buyLower + levels.buyUpper) / 2;
  const downsideRiskPercent = round(((entry - levels.stopUpper) / entry) * 100, 2);
  const upsideRewardPercent = round(((levels.targetLower - entry) / entry) * 100, 2);
  const rewardRiskRatio = round(upsideRewardPercent / downsideRiskPercent, 1);
  return {
    stopLossLower: levels.stopLower,
    stopLossUpper: levels.stopUpper,
    targetLower: levels.targetLower,
    targetUpper: levels.targetUpper,
    downsideRiskPercent,
    upsideRewardPercent,
    rewardRiskRatio,
    sourceType: "fixture_mock",
    operationalUseAllowed: false,
  };
}

function buildEntryStrategy(c: AllenScoreCandidate): StructuredEntryStrategy {
  return {
    triggerConditionText: `若${c.confirmationCondition}，於承接區出現量縮止穩訊號時列入觀察（觀察用，非買賣指令）。`,
    invalidationConditionText: `${c.invalidationCondition}（失效/防守條件）。`,
    observationOnlyText: "本區間為 fixture/mock 觀察策略，不是正式操作依據、不是買賣指令。",
    sizingHintText: "部位配置僅供觀察推演；無實際股數與成本，不計算損益。",
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };
}

function buildPlan(c: AllenScoreCandidate, levels: PriceLevels): CandidateTradePlan {
  const allenScore = scoreCandidate({
    technicalScore: c.technicalScore,
    fundamentalScore: c.fundamentalScore,
    chipScore: c.chipScore,
    etfFlowScore: c.etfFlowScore,
    marketSentimentScore: c.marketSentimentScore,
  });
  const grade = gradeCandidate(allenScore);
  const pool = assignCandidatePool(grade);
  return {
    symbol: c.symbol,
    name: c.name,
    grade,
    allenScore,
    pool,
    buyZone: buildBuyZone(levels),
    riskReward: buildRiskReward(levels),
    entryStrategy: buildEntryStrategy(c),
    isPosition: false,
    pnlComputable: false,
    fixtureOnly: true,
  };
}

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isImperativeBuy(text: string): boolean {
  const lower = text.toLowerCase();
  return TRADE_PLAN_FORBIDDEN_COMMAND_PHRASES.some((p) => text.includes(p) || lower.includes(p.toLowerCase()));
}

function validatePlan(plan: CandidateTradePlan, candidate: AllenScoreCandidate | undefined): CandidateTradePlanValidation {
  const { buyZone, riskReward, entryStrategy } = plan;

  const buyZoneOrdered = buyZone.lower <= buyZone.upper;
  const stopBelowBuyZone = riskReward.stopLossUpper < buyZone.lower;
  const targetAboveBuyZone = riskReward.targetLower > buyZone.upper;
  const downsideRiskPositive = riskReward.downsideRiskPercent > 0;
  const upsideRewardPositive = riskReward.upsideRewardPercent > 0;
  const rewardRiskRatioPositive = riskReward.rewardRiskRatio > 0;

  const derived = riskReward.downsideRiskPercent > 0
    ? riskReward.upsideRewardPercent / riskReward.downsideRiskPercent
    : Number.NaN;
  const rewardRiskRatioDerivable =
    Number.isFinite(derived) && Math.abs(derived - riskReward.rewardRiskRatio) <= TRADE_PLAN_RATIO_TOLERANCE;

  const sourceTypeFixtureMock = buyZone.sourceType === "fixture_mock" && riskReward.sourceType === "fixture_mock";
  const operationalUseDisallowed = buyZone.operationalUseAllowed === false && riskReward.operationalUseAllowed === false;
  const isNotPosition = plan.isPosition === false;
  const pnlNotComputable = plan.pnlComputable === false;
  const noShares = !hasOwn(plan, "shares");
  const noCostBasis = !hasOwn(plan, "costBasis") && !hasOwn(plan, "averageCost");
  const noBuySellCommand = entryStrategy.buySellCommandGenerated === false;
  const noAutoOrder = entryStrategy.autoOrderRequested === false;
  const triggerNotImperativeBuy = !isImperativeBuy(entryStrategy.triggerConditionText);
  const observationNotOperational =
    !isImperativeBuy(entryStrategy.observationOnlyText) && entryStrategy.observationOnlyText.includes("不是正式操作依據");

  // Consistency with the V62 engine candidate.
  let matchesV62Candidate = false;
  if (candidate) {
    const candTotal = scoreCandidate({
      technicalScore: candidate.technicalScore,
      fundamentalScore: candidate.fundamentalScore,
      chipScore: candidate.chipScore,
      etfFlowScore: candidate.etfFlowScore,
      marketSentimentScore: candidate.marketSentimentScore,
    });
    const candGrade: AllenScoreEngineGrade = gradeCandidate(candTotal);
    matchesV62Candidate =
      plan.allenScore === candTotal &&
      plan.grade === candGrade &&
      plan.pool === assignCandidatePool(candGrade);
  }

  const valid =
    buyZoneOrdered &&
    stopBelowBuyZone &&
    targetAboveBuyZone &&
    downsideRiskPositive &&
    upsideRewardPositive &&
    rewardRiskRatioPositive &&
    rewardRiskRatioDerivable &&
    sourceTypeFixtureMock &&
    operationalUseDisallowed &&
    isNotPosition &&
    pnlNotComputable &&
    noShares &&
    noCostBasis &&
    noBuySellCommand &&
    noAutoOrder &&
    triggerNotImperativeBuy &&
    observationNotOperational &&
    matchesV62Candidate;

  return {
    symbol: plan.symbol,
    buyZoneOrdered,
    stopBelowBuyZone,
    targetAboveBuyZone,
    downsideRiskPositive,
    upsideRewardPositive,
    rewardRiskRatioPositive,
    rewardRiskRatioDerivable,
    sourceTypeFixtureMock,
    operationalUseDisallowed,
    isNotPosition,
    pnlNotComputable,
    noShares,
    noCostBasis,
    noBuySellCommand,
    noAutoOrder,
    triggerNotImperativeBuy,
    observationNotOperational,
    matchesV62Candidate,
    valid,
  };
}

/**
 * Builds the structured candidate trade plan bundle for all actionable (non-AVOID)
 * V62 candidates. Reads no clock, no env, no network — only re-derives structured
 * plans from the V61/V62 fixture candidates and self-validates them.
 */
export function buildStructuredCandidateTradePlanContract(
  input: BuildStructuredCandidateTradePlanContractInput = {},
): StructuredCandidateTradePlanBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const model = buildAllenScoreScoringModelContract({ generatedAt });
  const candidates = model.dailyPools.flatMap((p) => p.candidates);
  const bySymbol = new Map(candidates.map((c) => [c.symbol, c] as const));

  const tradePlans: CandidateTradePlan[] = [];
  for (const c of candidates) {
    const levels = PRICE_LEVELS[c.symbol];
    if (!levels) continue; // AVOID / 禁碰 candidates get no actionable trade plan.
    tradePlans.push(buildPlan(c, levels));
  }

  const validations = tradePlans.map((plan) => validatePlan(plan, bySymbol.get(plan.symbol)));
  const allValid = validations.every((v) => v.valid);

  return {
    contractVersion: "V63",
    contractName: STRUCTURED_CANDIDATE_TRADE_PLAN_CONTRACT_NAME,
    generatedAt,
    decision: allValid ? "READY_FOR_UI_REVIEW" : "NO_GO",

    tradePlans,
    validations,
    allValid,

    fixtureOnly: true,
    operationalUseAllowed: false,
    systemCandidateIsNotPosition: true,
    noFakePnlAllowed: true,
    realDataConnected: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionTradingReady: false,

    safetyLabels: [...STRUCTURED_CANDIDATE_TRADE_PLAN_SAFETY_LABELS],
  };
}
