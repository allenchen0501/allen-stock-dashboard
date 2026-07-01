/**
 * Cross-Module Consistency & Candidate Ranking Governance Contract — FIXTURE-ONLY.
 *
 * A pure, deterministic, fixture-only governance / consistency layer that detects when
 * the existing modules (Allen Score 100, Technical + Risk Reward Strategy Engine,
 * Position Strategy Plan, 扣三低 Scanner, Allen 17-Line Power Score v1.1, Watchlist 17
 * Horsepower Candidate Matrix) reach conflicting conclusions on the SAME stock, and
 * decides candidate-ranking governance (hard gates + weighted observation, spec-only).
 *
 * 定位：這是 governance / consistency layer，不是正式行情掃描、不是 real quote validation、
 * 不是交易訊號、不是買賣建議、不是下單、不是自動交易；不取代任何既有模組。
 *
 * PURE: NO fetch, NO real network, NO Supabase, NO env read, NO clock read (generatedAt
 * passed in or fixed), NO DB write, NO API route, NO broker API, NO buy/sell command, NO
 * auto order, NO production data switch. approvedLiveFetchSymbols remain ["3019"].
 *
 * See: docs/cross-module-consistency-ranking-governance.md
 */

export type AllenLikeSignal = "strong" | "watch" | "weak" | "avoid" | "data_insufficient";
export type TechnicalRiskRewardSignal = "qualified" | "watch" | "unqualified" | "data_insufficient";
export type KouSanDiSignal = "pass" | "waiting" | "fail" | "data_insufficient";
export type PositionStrategySignal =
  | "entry_observation" | "holding_defense" | "risk_reduction" | "no_touch" | "data_insufficient";
export type ConflictLevel = "none" | "warning" | "critical";
export type HardGateStatus = "pass" | "downgraded" | "excluded" | "data_insufficient";

export interface CrossModuleSignalSummary {
  symbol: string;
  nameZh: string;

  allenScoreSignal: AllenLikeSignal;
  seventeenLineSignal: AllenLikeSignal;
  technicalRiskRewardSignal: TechnicalRiskRewardSignal;
  kouSanDiSignal: KouSanDiSignal;
  positionStrategySignal: PositionStrategySignal;

  conflictLevel: ConflictLevel;
  conflictReasons: string[];

  hardGateStatus: HardGateStatus;
  rankingEligible: boolean;
  downgradedBy: string[];

  finalObservationLabelZh: string;
  safetyNoteZh: string;

  notTradeAdvice: true;
  notEntrySignal: true;
  notAutoOrder: true;
}

export interface CrossModuleConsistencyGovernanceContract {
  governanceVersion: "V1";
  generatedAt: string;
  liveFetchBoundary: {
    approvedProvider: "TWSE_TPEX";
    approvedLiveFetchSymbols: readonly ["3019"];
    approvedChannels: readonly ["tse_3019.tw"];
    defaultRuntimeFetchAllowed: false;
    productionDataSwitchAllowed: false;
  };
  items: CrossModuleSignalSummary[];
  summary: {
    totalCount: number;
    noConflictCount: number;
    warningConflictCount: number;
    criticalConflictCount: number;
    rankingEligibleCount: number;
    excludedCount: number;
    dataInsufficientCount: number;
  };
  riskRewardGovernance: {
    gradeMode: "continuous_range";
    setupWinRateRequiredForExpectedValue: true;
    expectedValueRankingAllowed: false;
  };
  technicalScoreCollinearityGuard: {
    enabledAsSpec: true;
    recalculatesAllenScoreNow: false;
    groupCaps: {
      deduction: 5;
      shortMATrend: 7;
      momentum: 8;
      volumePrice: 5;
      supportPattern: 5;
    };
  };
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
  safetyLabels: string[];
}

export interface BuildCrossModuleConsistencyGovernanceContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-07-01T00:00:00.000Z";

type SignalInput = Pick<
  CrossModuleSignalSummary,
  "symbol" | "nameZh" | "allenScoreSignal" | "seventeenLineSignal" | "technicalRiskRewardSignal" | "kouSanDiSignal" | "positionStrategySignal"
>;

const SAFETY_NOTE =
  "此為跨模組觀察摘要，非買賣建議、非進場訊號、非自動下單；最終決策一律由使用者手動判斷。";

/** Deterministic governance derivation for one stock (rules in priority order). */
function deriveItem(input: SignalInput): CrossModuleSignalSummary {
  const seventeenWeak = input.seventeenLineSignal === "weak" || input.seventeenLineSignal === "avoid";
  const seventeenStrong = input.seventeenLineSignal === "strong";
  const allenA = input.allenScoreSignal === "strong";

  let conflictLevel: ConflictLevel = "none";
  let hardGateStatus: HardGateStatus = "pass";
  let rankingEligible = false;
  const conflictReasons: string[] = [];
  const downgradedBy: string[] = [];
  let finalObservationLabelZh: string;

  if (input.positionStrategySignal === "no_touch") {
    // Rule 6 / 2 — No Touch overrides every high score.
    conflictLevel = "critical";
    hardGateStatus = "excluded";
    rankingEligible = false;
    downgradedBy.push("positionStrategy:no_touch");
    conflictReasons.push("Position Strategy = No Touch，禁碰優先，凌駕其他所有高分訊號（A 級 / 高馬力 / 高風報比皆不得覆蓋）。");
    finalObservationLabelZh = "禁碰優先";
  } else if (seventeenStrong && input.technicalRiskRewardSignal === "data_insufficient") {
    // Rule 3 — trend strong but technical data insufficient.
    conflictLevel = "warning";
    hardGateStatus = "data_insufficient";
    rankingEligible = false;
    downgradedBy.push("technicalRiskReward:data_insufficient");
    conflictReasons.push("17 線趨勢強（>= 13/17），但 Technical + Risk Reward 資料不足（DATA_INSUFFICIENT），暫不升級排序。");
    finalObservationLabelZh = "趨勢強但資料不足";
  } else if (allenA && seventeenWeak) {
    // Rule 1 — Allen A but 17-line weak.
    conflictLevel = "warning";
    hardGateStatus = "downgraded";
    rankingEligible = false;
    downgradedBy.push("crossModule:allenA_vs_17weak");
    conflictReasons.push("Allen Score A 級主升段池，但 17 線馬力偏弱（<= 8/17），方向分歧，暫不升級。");
    finalObservationLabelZh = "訊號分歧，暫不升級";
  } else if (input.kouSanDiSignal === "pass" && seventeenWeak) {
    // Rule 4 — 扣三低 pass but 17-line weak.
    conflictLevel = "warning";
    hardGateStatus = "downgraded";
    rankingEligible = false;
    downgradedBy.push("crossModule:koSanDi_vs_17weak");
    conflictReasons.push("扣三低通過，但 17 線馬力偏弱（<= 8/17），趨勢尚未確認。");
    finalObservationLabelZh = "扣三低通過但趨勢未確認";
  } else if (seventeenStrong && input.kouSanDiSignal === "pass" && input.technicalRiskRewardSignal === "qualified") {
    // Rule 5 — aligned strong.
    conflictLevel = "none";
    hardGateStatus = "pass";
    rankingEligible = true;
    conflictReasons.push("17 線趨勢強、扣三低通過、Technical + Risk Reward 合格，趨勢與拉回條件一致。");
    finalObservationLabelZh = "趨勢與拉回條件一致";
  } else {
    const anyInsufficient =
      input.technicalRiskRewardSignal === "data_insufficient" ||
      input.positionStrategySignal === "data_insufficient" ||
      input.allenScoreSignal === "data_insufficient";
    conflictLevel = "none";
    hardGateStatus = anyInsufficient ? "data_insufficient" : "pass";
    rankingEligible = false;
    finalObservationLabelZh = "資料尚不足以升級，維持觀察";
  }

  return {
    ...input,
    conflictLevel,
    conflictReasons,
    hardGateStatus,
    rankingEligible,
    downgradedBy,
    finalObservationLabelZh,
    safetyNoteZh: SAFETY_NOTE,
    notTradeAdvice: true,
    notEntrySignal: true,
    notAutoOrder: true,
  };
}

const SAMPLE_INPUTS: SignalInput[] = [
  // 1) aligned strong → none / rankingEligible true.
  {
    symbol: "8101", nameZh: "樣本一致多頭股（fixture）",
    allenScoreSignal: "strong", seventeenLineSignal: "strong",
    technicalRiskRewardSignal: "qualified", kouSanDiSignal: "pass", positionStrategySignal: "entry_observation",
  },
  // 2) Allen A but 17-line weak → warning.
  {
    symbol: "8102", nameZh: "樣本高分但弱勢股（fixture）",
    allenScoreSignal: "strong", seventeenLineSignal: "weak",
    technicalRiskRewardSignal: "watch", kouSanDiSignal: "waiting", positionStrategySignal: "entry_observation",
  },
  // 3) Allen A but No Touch → critical / excluded.
  {
    symbol: "8103", nameZh: "樣本高分但禁碰股（fixture）",
    allenScoreSignal: "strong", seventeenLineSignal: "strong",
    technicalRiskRewardSignal: "qualified", kouSanDiSignal: "pass", positionStrategySignal: "no_touch",
  },
  // 4) 17-line strong but Technical + RR DATA_INSUFFICIENT → warning / data_insufficient.
  {
    symbol: "8104", nameZh: "樣本趨勢強但資料不足股（fixture）",
    allenScoreSignal: "watch", seventeenLineSignal: "strong",
    technicalRiskRewardSignal: "data_insufficient", kouSanDiSignal: "waiting", positionStrategySignal: "data_insufficient",
  },
  // 5) 扣三低 pass but 17-line weak → warning.
  {
    symbol: "8105", nameZh: "樣本扣三低過但趨勢未確認股（fixture）",
    allenScoreSignal: "watch", seventeenLineSignal: "weak",
    technicalRiskRewardSignal: "watch", kouSanDiSignal: "pass", positionStrategySignal: "holding_defense",
  },
];

/**
 * Builds the fixture-only cross-module consistency governance contract. Reads no clock /
 * env / network; derives every governance field deterministically. Spec, not a signal.
 */
export function buildCrossModuleConsistencyGovernanceContract(
  input: BuildCrossModuleConsistencyGovernanceContractInput = {},
): CrossModuleConsistencyGovernanceContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const items = SAMPLE_INPUTS.map(deriveItem);

  return {
    governanceVersion: "V1",
    generatedAt,
    liveFetchBoundary: {
      approvedProvider: "TWSE_TPEX",
      approvedLiveFetchSymbols: ["3019"],
      approvedChannels: ["tse_3019.tw"],
      defaultRuntimeFetchAllowed: false,
      productionDataSwitchAllowed: false,
    },
    items,
    summary: {
      totalCount: items.length,
      noConflictCount: items.filter((i) => i.conflictLevel === "none").length,
      warningConflictCount: items.filter((i) => i.conflictLevel === "warning").length,
      criticalConflictCount: items.filter((i) => i.conflictLevel === "critical").length,
      rankingEligibleCount: items.filter((i) => i.rankingEligible).length,
      excludedCount: items.filter((i) => i.hardGateStatus === "excluded").length,
      dataInsufficientCount: items.filter((i) => i.hardGateStatus === "data_insufficient").length,
    },
    riskRewardGovernance: {
      gradeMode: "continuous_range",
      setupWinRateRequiredForExpectedValue: true,
      expectedValueRankingAllowed: false,
    },
    technicalScoreCollinearityGuard: {
      enabledAsSpec: true,
      recalculatesAllenScoreNow: false,
      groupCaps: { deduction: 5, shortMATrend: 7, momentum: 8, volumePrice: 5, supportPattern: 5 },
    },
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
    safetyLabels: [
      "Cross-Module Consistency & Candidate Ranking Governance",
      "governance / consistency layer, not real quote scan",
      "not a trade signal, not buy/sell instruction, not auto order",
      "No Touch overrides high scores",
      "riskRewardRatio is not win rate; expected-value ranking not allowed until setupWinRate/backtest",
      "does not replace Allen Score / Technical+RR / Position Strategy / 扣三低 / 17-Line Power Score",
      "approved live-fetch symbols remain 3019 only",
      "no real network / no live fetch / no Supabase / no env read",
      "no DB write / no API route / no broker API",
      "no buy/sell command / no auto order / no production data switch",
      "使用者可見 UI 一律繁體中文",
    ],
  };
}
