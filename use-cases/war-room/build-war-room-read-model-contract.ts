/**
 * War Room Read Model Contract Builder — V20 (spec-only / mock_or_contract)
 *
 * Pure, fixture-only builder. Returns a WarRoomIntelligenceSnapshot-shaped
 * payload for the /api/war-room contract endpoint.
 *
 * Constraints (enforced by scripts/validate-war-room-api-contract.ts):
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No runtime builder import (no buildPortfolioValuationSummaryContract)
 *   - No data writes (no insert/upsert/update/delete)
 *   - No buy/sell commands
 *
 * Because V20 has no real data source, every section is degraded:
 * dataQualityStatus stays DATA_INSUFFICIENT (LICENSE_REQUIRED for Research),
 * and highConfidenceConclusionAllowed is false.
 */

import type {
  WarRoomAlertLevel,
  WarRoomDataQualityStatus,
  WarRoomDataQualitySummary,
  WarRoomIntelligenceSnapshot,
  WarRoomMarketStatus,
  WarRoomMode,
  WarRoomSectionAvailability,
  WarRoomSectionId,
  WarRoomSourceSummary,
} from "./war-room-intelligence-contract";

export interface BuildWarRoomReadModelContractInput {
  mode?: string | null;
  generatedAt?: string;
}

export interface BuildWarRoomReadModelContractOutput
  extends WarRoomIntelligenceSnapshot {
  apiContractVersion: "V20";
  responseSource: "mock_or_contract";
  sourceMode: "spec_only";
}

const VALID_MODES: readonly WarRoomMode[] = [
  "PREMARKET",
  "INTRADAY",
  "POSTMARKET",
  "REALTIME_ALERT",
];

function normalizeMode(mode: string | null | undefined): {
  warRoomMode: WarRoomMode;
  invalidModeFallback: boolean;
} {
  if (mode != null && (VALID_MODES as readonly string[]).includes(mode)) {
    return { warRoomMode: mode as WarRoomMode, invalidModeFallback: false };
  }
  // Invalid / missing mode never throws — it falls back to PREMARKET.
  return { warRoomMode: "PREMARKET", invalidModeFallback: false };
}

function buildSection(
  sectionId: WarRoomSectionId,
  title: string,
  sourceEngine: string,
  dataQualityStatus: WarRoomDataQualityStatus,
  notes: string[],
): WarRoomSectionAvailability {
  return {
    sectionId,
    title,
    sourceEngine,
    available: false,
    dataQualityStatus,
    fallbackUsed: false,
    unavailableReason:
      "V20 spec-only contract; no runtime data source connected.",
    warnings: [],
    notes,
  };
}

function buildSourceSummary(): WarRoomSourceSummary[] {
  return [
    {
      sourceName: "Portfolio Valuation Engine",
      sourceEngine: "Portfolio Valuation Engine",
      status: "DATA_INSUFFICIENT",
      fallbackUsed: false,
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
    {
      sourceName: "Institutional Research Center",
      sourceEngine: "Institutional Research Center",
      status: "LICENSE_REQUIRED",
      fallbackUsed: false,
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
    {
      sourceName: "Technical + Risk Reward Strategy Engine",
      sourceEngine: "Technical + Risk Reward Strategy Engine",
      status: "DATA_INSUFFICIENT",
      fallbackUsed: false,
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
    {
      sourceName: "Intraday Risk Crisis Alert Engine",
      sourceEngine: "Intraday Risk Crisis Alert Engine",
      status: "DATA_INSUFFICIENT",
      fallbackUsed: false,
      requestPerformed: false,
      supabaseConnected: false,
      productionWritePerformed: false,
    },
  ];
}

function buildDataQualitySummary(
  sources: WarRoomSourceSummary[],
): WarRoomDataQualitySummary {
  const count = (status: WarRoomDataQualityStatus): number =>
    sources.filter((s) => s.status === status).length;

  return {
    overallStatus: "DATA_INSUFFICIENT",
    passCount: count("PASS"),
    warningCount: count("WARNING"),
    failCount: count("FAIL"),
    dataInsufficientCount: count("DATA_INSUFFICIENT"),
    licenseRequiredCount: count("LICENSE_REQUIRED"),
    // V20 has no real data: high-confidence conclusions are never allowed.
    highConfidenceConclusionAllowed: false,
  };
}

/**
 * Builds a spec-only War Room read model snapshot. All item arrays are empty
 * (no runtime data), every section is DATA_INSUFFICIENT, and the read-only
 * invariant flags are literal false.
 */
export function buildWarRoomReadModelContract(
  input: BuildWarRoomReadModelContractInput = {},
): BuildWarRoomReadModelContractOutput {
  const { warRoomMode } = normalizeMode(input.mode);
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  // No real data → market status & primary alert are DATA_INSUFFICIENT.
  const marketStatus: WarRoomMarketStatus = "DATA_INSUFFICIENT";
  const primaryAlertLevel: WarRoomAlertLevel = "DATA_INSUFFICIENT";

  const sourceSummary = buildSourceSummary();
  const dataQualitySummary = buildDataQualitySummary(sourceSummary);

  return {
    snapshotId: `war-room-${warRoomMode}-spec-only`,
    generatedAt,
    warRoomMode,
    marketStatus,
    primaryAlertLevel,

    marketStatusLight: buildSection(
      "marketStatusLight",
      "市場狀態燈號",
      "Intraday Alert + Market Breadth + Index Trend",
      "DATA_INSUFFICIENT",
      ["環境判斷，不是交易指令。"],
    ),
    realtimeAlerts: buildSection(
      "realtimeAlerts",
      "即時警報",
      "Intraday Risk Crisis Alert Engine",
      "DATA_INSUFFICIENT",
      ["警報是事件提醒，不是出場指令。"],
    ),
    portfolioRiskRadar: buildSection(
      "portfolioRiskRadar",
      "持股風險雷達",
      "Portfolio Valuation Engine + Intraday Risk Crisis Alert Engine",
      "DATA_INSUFFICIENT",
      ["不產生停損價、目標價或買賣指令。"],
    ),
    researchTopPicks: buildSection(
      "researchTopPicks",
      "研究 TOP5",
      "Institutional Research Center",
      "LICENSE_REQUIRED",
      ["TOP5 Research 不等於 TOP5 Entry。"],
    ),
    technicalRiskRewardCandidates: buildSection(
      "technicalRiskRewardCandidates",
      "低檔高風報比候選",
      "Technical + Risk Reward Strategy Engine",
      "DATA_INSUFFICIENT",
      ["TOP5 Technical Candidates 不等於買進清單。"],
    ),
    avoidList: buildSection(
      "avoidList",
      "禁碰 / 避開清單",
      "War Room aggregate (four engines)",
      "DATA_INSUFFICIENT",
      ["風控提醒，不是賣出指令。"],
    ),
    nextObservationPoints: buildSection(
      "nextObservationPoints",
      "下一步觀察點",
      "War Room aggregate (observation summaries)",
      "DATA_INSUFFICIENT",
      ["僅供觀察，不寫成立即操作。"],
    ),

    // No runtime data → all converged arrays are empty but present.
    portfolioRiskItems: [],
    researchTopPickItems: [],
    technicalCandidateItems: [],
    intradayAlertItems: [],
    avoidItems: [],
    observationPoints: [],

    sourceSummary,
    dataQualitySummary,

    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,

    apiContractVersion: "V20",
    responseSource: "mock_or_contract",
    sourceMode: "spec_only",
  };
}
