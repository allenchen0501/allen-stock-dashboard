/**
 * Kou San Di Scanner Contract.
 *
 * Fixture-only technical-analysis specification for the 柯三弟 scanner. This is
 * observation-only: no real quote validation, no live fetch, no production data switch,
 * no buy/sell command, and no order command.
 */

export type KouSanDiMaWindow = "MA5" | "MA10" | "MA20";
export type KouSanDiCandidateTag = "柯三弟成立" | "等待確認" | "排除";

export interface KouSanDiDeductionWindow {
  ma: KouSanDiMaWindow;
  deductionPrice: number;
  currentCloseAboveDeduction: boolean;
}

export interface KouSanDiScannerSample {
  symbol: string;
  nameZh: string;
  close: number;
  deductionWindows: KouSanDiDeductionWindow[];
  maDeductionLowCount: number;
  maDeductionLowPass: boolean;
  threeRisingLowsPass: boolean;
  volumeContraction: boolean;
  shortMaRecovery: boolean;
  kdjJTurnUp: boolean;
  macdHistogramImproving: boolean;
  horsepowerScore: number;
  horsepowerFilterPass: boolean;
  deteriorationAlert: boolean;
  bearTurn: boolean;
  kouSanDiPass: boolean;
  candidateTag: KouSanDiCandidateTag;
  riskNoteZh: string;
  actionLabelZh: string;
}

export interface KouSanDiScannerContract {
  scannerVersion: "KOU_SAN_DI_SCANNER_V1";
  generatedAt: string;
  mode: "FIXTURE_ONLY_NO_NETWORK";
  decision: "SPEC_ONLY_NOT_CONNECTED";
  terminology: {
    correctTerm: "柯三弟";
    forbiddenTerms: readonly ["扣三弟", "柯三地", "柯三低"];
  };
  liveFetchBoundary: {
    approvedProvider: "TWSE_TPEX";
    approvedLiveFetchSymbols: readonly ["3019"];
    approvedChannels: readonly ["tse_3019.tw"];
    defaultRuntimeFetchAllowed: false;
    productionDataSwitchAllowed: false;
  };
  samples: KouSanDiScannerSample[];
  summary: {
    passCount: number;
    waitingCount: number;
    excludedCount: number;
  };
  realNetworkUsed: false;
  liveFetchPerformed: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  apiRouteCreated: false;
  portfolioApiSwitched: false;
  brokerApiUsed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionDataSwitched: false;
  productionTradingReady: false;
  safetyLabels: string[];
}

export interface BuildKouSanDiScannerContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-07-01T00:00:00.000Z";

function deductionWindow(
  ma: KouSanDiMaWindow,
  deductionPrice: number,
  close: number,
): KouSanDiDeductionWindow {
  return {
    ma,
    deductionPrice,
    currentCloseAboveDeduction: close > deductionPrice,
  };
}

function deriveSample(input: Omit<KouSanDiScannerSample, "maDeductionLowCount" | "maDeductionLowPass" | "horsepowerFilterPass" | "kouSanDiPass" | "candidateTag">): KouSanDiScannerSample {
  const maDeductionLowCount = input.deductionWindows.filter((item) => item.currentCloseAboveDeduction).length;
  const maDeductionLowPass = maDeductionLowCount >= 3;
  const horsepowerFilterPass = input.horsepowerScore >= 13;
  const basePass =
    maDeductionLowPass &&
    input.threeRisingLowsPass &&
    input.volumeContraction &&
    input.shortMaRecovery &&
    input.kdjJTurnUp &&
    input.macdHistogramImproving &&
    horsepowerFilterPass &&
    !input.deteriorationAlert &&
    !input.bearTurn;

  let candidateTag: KouSanDiCandidateTag = "等待確認";
  if (basePass) candidateTag = "柯三弟成立";
  else if (!maDeductionLowPass || input.deteriorationAlert || input.bearTurn || input.horsepowerScore <= 9) candidateTag = "排除";

  return {
    ...input,
    maDeductionLowCount,
    maDeductionLowPass,
    horsepowerFilterPass,
    kouSanDiPass: basePass,
    candidateTag,
  };
}

export function buildKouSanDiScannerContract(
  input: BuildKouSanDiScannerContractInput = {},
): KouSanDiScannerContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const samples: KouSanDiScannerSample[] = [
    deriveSample({
      symbol: "4966",
      nameZh: "譜瑞-KY",
      close: 960,
      deductionWindows: [
        deductionWindow("MA5", 930, 960),
        deductionWindow("MA10", 918, 960),
        deductionWindow("MA20", 900, 960),
      ],
      threeRisingLowsPass: true,
      volumeContraction: true,
      shortMaRecovery: true,
      kdjJTurnUp: true,
      macdHistogramImproving: true,
      horsepowerScore: 14,
      deteriorationAlert: false,
      bearTurn: false,
      riskNoteZh: "風險提醒：此為觀察規格，仍需人工確認支撐、量價與資料品質。",
      actionLabelZh: "觀察用：條件完整，等待人工確認。",
    }),
    deriveSample({
      symbol: "2455",
      nameZh: "全新",
      close: 168,
      deductionWindows: [
        deductionWindow("MA5", 160, 168),
        deductionWindow("MA10", 162, 168),
        deductionWindow("MA20", 166, 168),
      ],
      threeRisingLowsPass: false,
      volumeContraction: true,
      shortMaRecovery: true,
      kdjJTurnUp: false,
      macdHistogramImproving: true,
      horsepowerScore: 11,
      deteriorationAlert: false,
      bearTurn: false,
      riskNoteZh: "風險提醒：扣抵條件有利，但結構確認尚未完整。",
      actionLabelZh: "觀察用：等待結構確認。",
    }),
    deriveSample({
      symbol: "4979",
      nameZh: "華星光",
      close: 142,
      deductionWindows: [
        deductionWindow("MA5", 150, 142),
        deductionWindow("MA10", 148, 142),
        deductionWindow("MA20", 146, 142),
      ],
      threeRisingLowsPass: false,
      volumeContraction: false,
      shortMaRecovery: false,
      kdjJTurnUp: false,
      macdHistogramImproving: false,
      horsepowerScore: 8,
      deteriorationAlert: true,
      bearTurn: true,
      riskNoteZh: "風險提醒：扣抵與結構皆偏弱，暫不列入主要候選。",
      actionLabelZh: "觀察用：暫列排除，等待結構修復。",
    }),
  ];

  return {
    scannerVersion: "KOU_SAN_DI_SCANNER_V1",
    generatedAt,
    mode: "FIXTURE_ONLY_NO_NETWORK",
    decision: "SPEC_ONLY_NOT_CONNECTED",
    terminology: {
      correctTerm: "柯三弟",
      forbiddenTerms: ["扣三弟", "柯三地", "柯三低"],
    },
    liveFetchBoundary: {
      approvedProvider: "TWSE_TPEX",
      approvedLiveFetchSymbols: ["3019"],
      approvedChannels: ["tse_3019.tw"],
      defaultRuntimeFetchAllowed: false,
      productionDataSwitchAllowed: false,
    },
    samples,
    summary: {
      passCount: samples.filter((item) => item.candidateTag === "柯三弟成立").length,
      waitingCount: samples.filter((item) => item.candidateTag === "等待確認").length,
      excludedCount: samples.filter((item) => item.candidateTag === "排除").length,
    },
    realNetworkUsed: false,
    liveFetchPerformed: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    apiRouteCreated: false,
    portfolioApiSwitched: false,
    brokerApiUsed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionDataSwitched: false,
    productionTradingReady: false,
    safetyLabels: [
      "Technical Terminology Guard",
      "柯三弟 scanner spec",
      "fixture-only technical scanner",
      "approved live-fetch symbols remain 3019 only",
      "not buy/sell instruction",
      "no runtime fetch / no production data switch",
      "no broker API / no order command / no auto order",
    ],
  };
}
