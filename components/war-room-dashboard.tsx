"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// War Room Dashboard — V23 UI Polish
//
// Reads ONLY the internal /api/war-room?mode=<MODE> contract endpoint. Does NOT
// import buildWarRoomReadModelContract, does NOT import any engine runtime
// builder, does NOT fetch any external URL, does NOT connect to Supabase, and
// does NOT produce buy/sell commands.
//
// V23 polish adds:
//   - Richer header with above-the-fold metadata (sourceMode, fixtureAdapterVersion,
//     mock_or_contract, highConfidenceConclusionAllowed=false)
//   - Mode buttons with subtitle for each mode
//   - Compact summary cards (market status / alert / data quality / confidence gate)
//   - Seven section cards with full warnings / notes / fallback indicators
//   - Per-item typed card lists for all 6 aggregate arrays
//   - Typed safety labels on every card (observationPrice / invalidLevel / targetZone)
//   - Source summary compact card list
//   - Data quality summary with confidence gate warning block
//   - Safety footer always rendered
//
// Historical note:
//   前版 sourceMode = spec_only（V21），V22 升級為 fixture（fixtureAdapterVersion = V22）。
//   responseSource = mock_or_contract（唯讀合約，不寫入資料）。
// ---------------------------------------------------------------------------

const MODES = ["PREMARKET", "INTRADAY", "POSTMARKET", "REALTIME_ALERT"] as const;
type WarRoomModeValue = (typeof MODES)[number];

const MODE_LABEL: Record<WarRoomModeValue, string> = {
  PREMARKET: "盤前",
  INTRADAY: "盤中",
  POSTMARKET: "盤後",
  REALTIME_ALERT: "即時",
};

const MODE_SUBTITLE: Record<WarRoomModeValue, string> = {
  PREMARKET: "今日研究 / 技術候選 / 觀察點",
  INTRADAY: "即時警報 / 持股 / 廣度",
  POSTMARKET: "收盤結構 / 歸因 / 明日觀察",
  REALTIME_ALERT: "警報中心 / cooldown / dedup",
};

// ---------------------------------------------------------------------------
// UI types — no runtime builder import; shape mirrors /api/war-room response
// ---------------------------------------------------------------------------

interface UiSection {
  sectionId: string;
  title: string;
  sourceEngine: string;
  available: boolean;
  dataQualityStatus: string;
  fallbackUsed: boolean;
  unavailableReason: string | null;
  warnings: string[];
  notes: string[];
}

interface UiSourceSummary {
  sourceName: string;
  sourceEngine: string;
  status: string;
  fallbackUsed: boolean;
  requestPerformed: boolean;
  supabaseConnected: boolean;
  productionWritePerformed: boolean;
}

interface UiDataQualitySummary {
  overallStatus: string;
  passCount: number;
  warningCount: number;
  failCount: number;
  dataInsufficientCount: number;
  licenseRequiredCount: number;
  highConfidenceConclusionAllowed: boolean;
}

interface UiPortfolioRiskItem {
  stockId: string;
  stockName: string;
  valuationTier: string | null;
  alertLevel: string;
  holdingImpact: string | null;
  observationSummary: string;
  dataQualityStatus: string;
}

interface UiResearchStock {
  stockId: string;
  stockName: string;
  researchRating: string;
  totalResearchScore: number | null;
  aiBenefitLevel: string;
  aiSupplyChainTags: string[];
}

interface UiResearchTopPick {
  rank: number;
  stock: UiResearchStock;
  rankingReason: string;
  notEntrySignal: boolean;
}

interface UiRiskReward {
  observationPrice: number | null;
  supportZoneLow: number | null;
  supportZoneHigh: number | null;
  invalidLevel: number | null;
  targetZoneLow: number | null;
  targetZoneHigh: number | null;
  riskRewardRatio: number | null;
  riskRewardGrade: string;
  dataQualityStatus: string;
}

interface UiSetup {
  setupTags: string[];
  dataQualityStatus: string;
}

interface UiTechnicalCandidate {
  rank: number;
  stockId: string;
  stockName: string;
  setup: UiSetup;
  riskReward: UiRiskReward;
  decisionBoundary: string;
  observationSummary: string;
  notEntrySignal: boolean;
  notTradeAdvice: boolean;
}

interface UiIntradayAlert {
  alertId: string;
  alertLevel: string;
  alertType: string;
  scope: string;
  symbol: string | null;
  stockName: string | null;
  sectorName: string | null;
  triggerReason: string;
  impactSummary: string;
  suggestedObservation: string;
  dataQualityStatus: string;
  sourceName: string;
}

interface UiAvoidItem {
  stockId: string | null;
  stockName: string | null;
  reason: string;
  sourceEngine: string;
  dataQualityStatus: string;
  notExitSignal: boolean;
  notTradeAdvice: boolean;
}

interface UiObservationPoint {
  pointId: string;
  title: string;
  sourceEngine: string;
  observation: string;
  waitFor: string | null;
  dataQualityStatus: string;
  notTradeAdvice: boolean;
}

// V26: Position Strategy Plan fixture types (shape mirrors PositionStrategyPlan).
interface UiPriceZone {
  zoneLabel: string;
  low: number | null;
  high: number | null;
  priceVerified: boolean;
  priceVerificationStatus: string;
  isPrecisePriceAllowed: boolean;
  safetyLabel: string;
}

interface UiPositionPlan {
  planId: string;
  stockId: string;
  stockName: string;
  planType: string;
  priceVerified: boolean;
  priceVerificationStatus: string;
  dataQualityStatus: string;
  currentPrice: number | null;
  costBasis: number | null;
  unrealizedProfitLossPercent: number | null;
  entryObservationZone: UiPriceZone | null;
  noChaseZone: UiPriceZone | null;
  defenseZone: UiPriceZone | null;
  invalidLevel: UiPriceZone | null;
  profitProtectionZone: UiPriceZone | null;
  takeProfitZone: UiPriceZone | null;
  riskReduceZone: UiPriceZone | null;
  exitObservationZone: UiPriceZone | null;
  targetObservationZone: UiPriceZone | null;
  riskRewardRatio: number | null;
  riskRewardGrade: string;
  holdingState: string;
  holdingActionState: string | null;
  holdingImpact: string | null;
  confirmationCondition: string | null;
  trendBreakWarning: string | null;
  shortAttackRisk: string | null;
  riskReduceObservation: string | null;
  waitForReclaimCondition: string | null;
  trendInvalidationReason: string | null;
  noTouchReason: string | null;
  requiredRecoveryCondition: string | null;
  noTouchDurationHint: string | null;
  unavailableReason: string | null;
  missingDataFields: string[];
  requiredVerification: string[];
  setupTags: string[];
  warnings: string[];
  observationSummary: string;
  notEntrySignal: boolean;
  notExitSignal: boolean;
  notTradeAdvice: boolean;
  highConfidenceConclusionAllowed: boolean;
}

interface UiHorsepowerGroupScore {
  passed: number;
  available: number;
  ratio: number;
}

interface UiHorsepowerStock {
  symbol: string;
  name: string;
  close: number;
  horsepowerScore: number;
  maxAvailable: number;
  powerRatio: number;
  weightedPower: number;
  powerRating: string;
  shortCostScore: UiHorsepowerGroupScore;
  dailyMAScore: UiHorsepowerGroupScore;
  weeklyScore: UiHorsepowerGroupScore;
  monthlyScore: UiHorsepowerGroupScore;
  nearestSupport: number | null;
  nearestPressure: number | null;
  isVolumeConfirmed: boolean;
  isOverheated: boolean;
  dataStatus: string;
  candidateTag: string;
  reliabilityNote: string;
  notTradeAdvice: boolean;
  notEntrySignal: boolean;
}

interface UiHorsepowerSummary {
  fixtureVersion: string;
  modelName: string;
  totalStocks: number;
  effectiveAttackCount: number;
  strongButOverheatedCount: number;
  overheatedCount: number;
}

interface UiCrossModuleItem {
  symbol: string;
  nameZh: string;
  allenScoreSignal: string;
  seventeenLineSignal: string;
  technicalRiskRewardSignal: string;
  kouSanDiSignal: string;
  positionStrategySignal: string;
  conflictLevel: string;
  hardGateStatus: string;
  rankingEligible: boolean;
  finalObservationLabelZh: string;
  safetyNoteZh: string;
}

// 3019 Approved Live Quote Manual-Refresh MVP — read-only response shape.
interface UiApproved3019Quote {
  price: number | null;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  change: number | null;
  changePercent: number | null;
  sourceTimestamp: string | null;
  fetchedAt: string;
}

interface UiApproved3019Response {
  symbol: string;
  nameZh: string;
  sourceProvider: string;
  approvedChannel: string;
  fetchMode: string;
  quote: UiApproved3019Quote;
  dataStatus: string;
  uiStatusZh: string;
  sourceNoteZh: string;
  safetyNoteZh: string;
  requestPerformed: boolean;
}

interface UiSnapshot {
  snapshotId: string;
  generatedAt: string;
  warRoomMode: string;
  marketStatus: string;
  primaryAlertLevel: string;
  marketStatusLight: UiSection;
  realtimeAlerts: UiSection;
  portfolioRiskRadar: UiSection;
  researchTopPicks: UiSection;
  technicalRiskRewardCandidates: UiSection;
  avoidList: UiSection;
  nextObservationPoints: UiSection;
  portfolioRiskItems: UiPortfolioRiskItem[];
  researchTopPickItems: UiResearchTopPick[];
  technicalCandidateItems: UiTechnicalCandidate[];
  intradayAlertItems: UiIntradayAlert[];
  avoidItems: UiAvoidItem[];
  observationPoints: UiObservationPoint[];
  sourceSummary: UiSourceSummary[];
  dataQualitySummary: UiDataQualitySummary;
  apiContractVersion: string;
  responseSource: string;
  sourceMode: string;
  fixtureAdapterVersion: string;
  // V26: Position Strategy Plan fixture integration.
  positionStrategyPlans: UiPositionPlan[];
  entryObservationPlans: UiPositionPlan[];
  holdingDefensePlans: UiPositionPlan[];
  profitProtectionPlans: UiPositionPlan[];
  riskReductionPlans: UiPositionPlan[];
  positionNoTouchPlans: UiPositionPlan[];
  positionDataInsufficientPlans: UiPositionPlan[];
  positionStrategyFixtureVersion: string;
  // Allen 17-Line Power Score v1.1 fixture-only scanner.
  horsepowerScannerItems: UiHorsepowerStock[];
  horsepowerScannerSummary: UiHorsepowerSummary;
  horsepowerScannerFixtureVersion: string;
  // Cross-Module Consistency & Candidate Ranking Governance.
  crossModuleConsistencyItems: UiCrossModuleItem[];
  crossModuleConsistencyFixtureVersion: string;
}

/** conflictLevel code → 繁中顯示。 */
function conflictLevelZh(level: string): string {
  if (level === "none") return "無衝突";
  if (level === "warning") return "訊號分歧";
  if (level === "critical") return "嚴重衝突";
  return level;
}

/** hardGateStatus code → 繁中顯示。 */
function hardGateStatusZh(status: string): string {
  if (status === "pass") return "通過";
  if (status === "downgraded") return "降級";
  if (status === "excluded") return "禁碰排除";
  if (status === "data_insufficient") return "資料不足";
  return status;
}

/** dataStatus code → 繁中顯示。 */
function dataStatusZh(status: string): string {
  if (status === "confirmed_close") return "已確認收盤";
  if (status === "intraday_estimated") return "盤中估算";
  return status;
}

/** Approved live quote dataStatus → tone class. */
function liveQuoteTone(status: string): string {
  if (status === "live_verified") return "text-positive bg-positive/10 border-positive/20";
  if (status === "not_available" || status === "fallback")
    return "text-slate-400 bg-slate-700/30 border-slate-600";
  return "text-amber bg-amber/10 border-amber/20"; // timeout / source_error
}

/** number | null → 繁中「資料不足」placeholder（不假造數值）。 */
function nzShow(value: number | null): string {
  return value === null ? "資料不足" : String(value);
}

// ---------------------------------------------------------------------------
// Tone helpers
// ---------------------------------------------------------------------------

function alertTone(level: string): string {
  switch (level) {
    case "INFO":
      return "text-slate-400 bg-slate-700/30 border-slate-700";
    case "WATCH":
      return "text-sky-400 bg-sky-400/10 border-sky-400/20";
    case "WARNING":
      return "text-amber bg-amber/10 border-amber/20";
    case "DANGER":
      return "text-negative bg-negative/10 border-negative/20";
    case "PASS":
    case "BULLISH":
      return "text-positive bg-positive/10 border-positive/20";
    default:
      return "text-slate-500 bg-white/[0.03] border-line";
  }
}

function qualityTone(status: string): string {
  switch (status) {
    case "PASS":
      return "text-positive bg-positive/10 border-positive/20";
    case "WARNING":
      return "text-amber bg-amber/10 border-amber/20";
    case "FAIL":
    case "DANGER":
      return "text-negative bg-negative/10 border-negative/20";
    case "LICENSE_REQUIRED":
      return "text-purple-400 bg-purple-400/10 border-purple-400/20";
    case "DATA_INSUFFICIENT":
      return "text-slate-400 bg-slate-700/30 border-slate-600";
    default:
      return "text-slate-500 bg-white/[0.03] border-line";
  }
}

// ---------------------------------------------------------------------------
// Shared micro-components
// ---------------------------------------------------------------------------

function Badge({ value, tone }: { value: string; tone: string }) {
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${tone}`}>
      {value}
    </span>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-white/[0.015] px-3 py-2">
      <span className="text-[8px] uppercase tracking-[0.15em] text-slate-600">{label}</span>
      <span className={`break-all font-mono text-[10px] font-semibold ${tone ?? "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Section availability card
// ---------------------------------------------------------------------------

function SectionCardView({ section }: { section: UiSection }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-white/[0.012] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-100">{section.title}</p>
          <p className="mt-0.5 font-mono text-[9px] leading-4 text-slate-600">{section.sectionId}</p>
          <p className="break-words font-mono text-[9px] leading-4 text-slate-600">
            {section.sourceEngine}
          </p>
        </div>
        <Badge value={section.dataQualityStatus} tone={qualityTone(section.dataQualityStatus)} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
        <span
          className={`rounded px-1.5 py-0.5 ${
            section.available
              ? "bg-positive/10 text-positive"
              : "bg-slate-700/30 text-slate-500"
          }`}
        >
          {section.available ? "available" : "資料不足"}
        </span>
        {section.fallbackUsed && (
          <span className="rounded bg-amber/10 px-1.5 py-0.5 text-amber">降級 fallback</span>
        )}
      </div>

      {section.unavailableReason && (
        <p className="text-[10px] leading-5 text-slate-500">{section.unavailableReason}</p>
      )}

      {section.warnings.length > 0 && (
        <ul className="space-y-0.5 text-[10px] text-amber">
          {section.warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}

      {section.notes.length > 0 && (
        <ul className="space-y-0.5 text-[10px] text-slate-500">
          {section.notes.map((n, i) => (
            <li key={i}>· {n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Portfolio Risk Item card
// ---------------------------------------------------------------------------

function PortfolioRiskCard({ item }: { item: UiPortfolioRiskItem }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-white/[0.008] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] text-slate-400">{item.stockId}</span>
          <span className="ml-1.5 text-[11px] font-semibold text-slate-200">{item.stockName}</span>
        </div>
        <Badge value={item.alertLevel} tone={alertTone(item.alertLevel)} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[9px]">
        <span className="text-slate-600">估值：{item.valuationTier ?? "資料不足"}</span>
        <Badge value={item.dataQualityStatus} tone={qualityTone(item.dataQualityStatus)} />
      </div>
      {item.holdingImpact && (
        <p className="text-[10px] leading-5 text-slate-400">{item.holdingImpact}</p>
      )}
      <p className="break-words text-[9px] leading-5 text-slate-600">{item.observationSummary}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Research TOP Pick card
// ---------------------------------------------------------------------------

function ResearchTopPickCard({ item }: { item: UiResearchTopPick }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-white/[0.008] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-slate-500">#{item.rank}</span>
            <span className="font-mono text-[10px] text-slate-400">{item.stock.stockId}</span>
            <span className="text-[11px] font-semibold text-slate-200">{item.stock.stockName}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px]">
            <Badge value={item.stock.researchRating} tone={qualityTone(item.stock.researchRating)} />
            <span className="text-slate-600">
              評分：
              {item.stock.totalResearchScore != null ? item.stock.totalResearchScore : "資料不足"}
            </span>
          </div>
        </div>
        {item.notEntrySignal && (
          <span className="shrink-0 rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">
            notEntrySignal
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 text-[8px]">
        <span className="text-slate-600">AI 受益：{item.stock.aiBenefitLevel}</span>
        {item.stock.aiSupplyChainTags.slice(0, 2).map((t, i) => (
          <span key={i} className="rounded bg-white/[0.02] px-1 py-0.5 text-slate-500">
            {t}
          </span>
        ))}
      </div>
      <p className="break-words text-[9px] leading-5 text-slate-600">{item.rankingReason}</p>
      <p className="text-[8px] text-amber">TOP5 Research 不等於 TOP5 Entry；不是買點。</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Technical + Risk Reward Candidate card
// ---------------------------------------------------------------------------

function TechnicalCandidateCard({ item }: { item: UiTechnicalCandidate }) {
  const rr = item.riskReward;
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-white/[0.008] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-slate-500">#{item.rank}</span>
            <span className="font-mono text-[10px] text-slate-400">{item.stockId}</span>
            <span className="text-[11px] font-semibold text-slate-200">{item.stockName}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px]">
            <Badge value={rr.riskRewardGrade} tone={qualityTone(rr.riskRewardGrade)} />
            <span className="text-slate-600">
              風報比：
              {rr.riskRewardRatio != null ? `1:${rr.riskRewardRatio}` : "資料不足"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {item.notEntrySignal && (
            <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">
              notEntrySignal
            </span>
          )}
          {item.notTradeAdvice && (
            <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">
              notTradeAdvice
            </span>
          )}
        </div>
      </div>

      {/* Price zone labels — safety-labeled, never presented as trade prices */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
        <span className="text-slate-600">
          觀察價，不是買進價：{rr.observationPrice ?? "資料不足"}
        </span>
        <span className="text-slate-600">
          失效觀察價，不是自動停損價：{rr.invalidLevel ?? "資料不足"}
        </span>
        <span className="text-slate-600">支撐低：{rr.supportZoneLow ?? "資料不足"}</span>
        <span className="text-slate-600">支撐高：{rr.supportZoneHigh ?? "資料不足"}</span>
        <span className="text-slate-600">
          觀察目標區，不是目標價 低：{rr.targetZoneLow ?? "資料不足"}
        </span>
        <span className="text-slate-600">
          觀察目標區，不是目標價 高：{rr.targetZoneHigh ?? "資料不足"}
        </span>
      </div>

      {item.setup.setupTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.setup.setupTags.map((t, i) => (
            <span key={i} className="rounded bg-white/[0.02] px-1.5 py-0.5 text-[8px] text-slate-500">
              {t}
            </span>
          ))}
        </div>
      )}
      <p className="break-words text-[9px] leading-5 text-slate-600">{item.observationSummary}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intraday Alert card
// ---------------------------------------------------------------------------

function IntradayAlertCard({ item }: { item: UiIntradayAlert }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-white/[0.008] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge value={item.alertLevel} tone={alertTone(item.alertLevel)} />
            <span className="text-[10px] font-semibold text-slate-200">{item.alertType}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] text-slate-500">
            <span>scope：{item.scope}</span>
            {item.symbol && <span>· {item.symbol}</span>}
            {item.stockName && <span>{item.stockName}</span>}
            {item.sectorName && <span>· {item.sectorName}</span>}
          </div>
        </div>
        <Badge value={item.dataQualityStatus} tone={qualityTone(item.dataQualityStatus)} />
      </div>
      <p className="text-[9px] leading-5 text-slate-400">{item.triggerReason}</p>
      <p className="text-[9px] leading-5 text-slate-500">{item.impactSummary}</p>
      <p className="text-[9px] leading-5 text-slate-400">觀察：{item.suggestedObservation}</p>
      <div className="flex items-center justify-between text-[8px]">
        <span className="text-slate-600">source：{item.sourceName}</span>
        <span className="text-amber">Intraday Alert 不等於出場；不是買賣指令。</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avoid / No Touch card
// ---------------------------------------------------------------------------

function AvoidItemCard({ item }: { item: UiAvoidItem }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-negative/10 bg-white/[0.008] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          {item.stockId || item.stockName ? (
            <div className="flex items-center gap-2">
              {item.stockId && (
                <span className="font-mono text-[10px] text-slate-400">{item.stockId}</span>
              )}
              {item.stockName && (
                <span className="text-[11px] font-semibold text-slate-200">{item.stockName}</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-slate-500">整體市場 / 無特定股</span>
          )}
          <div className="mt-1 flex gap-1.5">
            {item.notExitSignal && (
              <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">
                notExitSignal
              </span>
            )}
            {item.notTradeAdvice && (
              <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">
                notTradeAdvice
              </span>
            )}
          </div>
        </div>
        <Badge value={item.dataQualityStatus} tone={qualityTone(item.dataQualityStatus)} />
      </div>
      <p className="break-words text-[9px] leading-5 text-slate-400">{item.reason}</p>
      <div className="flex items-center justify-between text-[8px]">
        <span className="text-slate-600">{item.sourceEngine}</span>
        <span className="text-slate-500">Avoid / No Touch 是風控提醒，不是賣出指令。</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Observation Point card
// ---------------------------------------------------------------------------

function ObservationPointCard({ item }: { item: UiObservationPoint }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-white/[0.008] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-200">{item.title}</p>
          <p className="font-mono text-[9px] text-slate-600">{item.sourceEngine}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge value={item.dataQualityStatus} tone={qualityTone(item.dataQualityStatus)} />
          {item.notTradeAdvice && (
            <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">
              notTradeAdvice
            </span>
          )}
        </div>
      </div>
      <p className="text-[10px] leading-5 text-slate-300">{item.observation}</p>
      {item.waitFor && (
        <p className="text-[9px] leading-5 text-slate-500">等待：{item.waitFor}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Position Strategy Plan card (V26)
// ---------------------------------------------------------------------------

const PLAN_TYPE_LABEL: Record<string, string> = {
  ENTRY_OBSERVATION: "進場觀察",
  HOLDING_DEFENSE: "持股防守",
  PROFIT_PROTECTION: "獲利保護",
  RISK_REDUCTION: "風險降低",
  NO_TOUCH: "禁碰 / No Touch",
  DATA_INSUFFICIENT: "資料不足",
};

// One labelled price zone row. When the zone is null or precise price is not
// allowed, shows the safe "資料不足 / 未允許精準價位" placeholder instead.
function ZoneLine({ label, zone }: { label: string; zone: UiPriceZone | null }) {
  const showPrice = zone != null && zone.isPrecisePriceAllowed && zone.low != null;
  return (
    <div className="flex items-center justify-between gap-2 text-[9px]">
      <span className="text-slate-600">{label}</span>
      <span className="font-mono text-slate-400">
        {showPrice
          ? `${zone!.low}${zone!.high != null && zone!.high !== zone!.low ? `–${zone!.high}` : ""}`
          : "資料不足 / 未允許精準價位"}
      </span>
    </div>
  );
}

function PositionPlanCard({ plan }: { plan: UiPositionPlan }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-white/[0.008] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">{plan.stockId}</span>
            <span className="text-[11px] font-semibold text-slate-200">{plan.stockName}</span>
          </div>
          <p className="mt-0.5 font-mono text-[8px] text-slate-600">
            {PLAN_TYPE_LABEL[plan.planType] ?? plan.planType} · {plan.planType}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge value={plan.dataQualityStatus} tone={qualityTone(plan.dataQualityStatus)} />
          <span
            className={`rounded px-1.5 py-0.5 text-[8px] ${
              plan.priceVerified ? "bg-positive/10 text-positive" : "bg-amber/10 text-amber"
            }`}
          >
            {plan.priceVerificationStatus}
          </span>
        </div>
      </div>

      {/* Holding context */}
      {(plan.costBasis != null || plan.currentPrice != null) && (
        <div className="flex flex-wrap gap-2 text-[9px] text-slate-500">
          <span>成本 costBasis：{plan.costBasis ?? "資料不足"}</span>
          <span>現價 currentPrice：{plan.currentPrice ?? "資料不足"}</span>
          {plan.unrealizedProfitLossPercent != null && (
            <span
              className={plan.unrealizedProfitLossPercent >= 0 ? "text-positive" : "text-negative"}
            >
              未實現損益：{plan.unrealizedProfitLossPercent}%
            </span>
          )}
        </div>
      )}

      {/* Price zones — every label encodes the negation/safety meaning */}
      <div className="space-y-0.5">
        {plan.entryObservationZone && (
          <ZoneLine label="進場觀察區，不是買進價" zone={plan.entryObservationZone} />
        )}
        {plan.noChaseZone && <ZoneLine label="不追價區，不是放空建議" zone={plan.noChaseZone} />}
        {plan.defenseZone && (
          <ZoneLine label="防守區，是防守觀察不是自動出場" zone={plan.defenseZone} />
        )}
        {plan.invalidLevel && (
          <ZoneLine label="策略失效觀察價，不是自動停損價" zone={plan.invalidLevel} />
        )}
        {plan.profitProtectionZone && (
          <ZoneLine label="獲利保護觀察區，不是賣出價" zone={plan.profitProtectionZone} />
        )}
        {plan.takeProfitZone && (
          <ZoneLine label="takeProfitZone 不是賣出價" zone={plan.takeProfitZone} />
        )}
        {plan.riskReduceZone && (
          <ZoneLine label="風險降低觀察不是賣出指令" zone={plan.riskReduceZone} />
        )}
        {plan.exitObservationZone && (
          <ZoneLine label="出場觀察區不是賣出價" zone={plan.exitObservationZone} />
        )}
        {plan.targetObservationZone && (
          <ZoneLine label="觀察目標區，不是目標價" zone={plan.targetObservationZone} />
        )}
      </div>

      {/* Risk/reward + holding state */}
      <div className="flex flex-wrap items-center gap-2 text-[9px]">
        {plan.riskRewardRatio != null ? (
          <span className="text-slate-500">風報比 1:{plan.riskRewardRatio}</span>
        ) : (
          <span className="text-slate-600">風報比：資料不足</span>
        )}
        <Badge value={plan.riskRewardGrade} tone={qualityTone(plan.riskRewardGrade)} />
        <span className="text-slate-600">holdingState：{plan.holdingState}</span>
        {plan.holdingActionState && (
          <span className="text-amber">{plan.holdingActionState}</span>
        )}
      </div>

      {plan.holdingImpact && (
        <p className="text-[9px] leading-5 text-slate-400">holdingImpact：{plan.holdingImpact}</p>
      )}
      {plan.trendBreakWarning && (
        <p className="text-[9px] leading-5 text-amber">⚠ {plan.trendBreakWarning}</p>
      )}
      {plan.riskReduceObservation && (
        <p className="text-[9px] leading-5 text-slate-500">{plan.riskReduceObservation}</p>
      )}
      {plan.noTouchReason && (
        <p className="text-[9px] leading-5 text-slate-400">禁碰原因：{plan.noTouchReason}</p>
      )}
      {plan.unavailableReason && (
        <p className="text-[9px] leading-5 text-slate-500">{plan.unavailableReason}</p>
      )}
      {plan.missingDataFields.length > 0 && (
        <p className="text-[8px] text-slate-600">缺漏欄位：{plan.missingDataFields.join("、")}</p>
      )}

      {plan.setupTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {plan.setupTags.map((t, i) => (
            <span key={i} className="rounded bg-white/[0.02] px-1.5 py-0.5 text-[8px] text-slate-500">
              {t}
            </span>
          ))}
        </div>
      )}

      <p className="break-words text-[8px] leading-4 text-slate-600">{plan.observationSummary}</p>

      <div className="flex flex-wrap gap-1">
        {plan.notEntrySignal && (
          <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">notEntrySignal</span>
        )}
        {plan.notExitSignal && (
          <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">notExitSignal</span>
        )}
        {plan.notTradeAdvice && (
          <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[8px] text-amber">notTradeAdvice</span>
        )}
        <span className="rounded bg-white/[0.02] px-1.5 py-0.5 text-[8px] text-slate-600">
          highConfidenceConclusionAllowed={String(plan.highConfidenceConclusionAllowed)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source Summary card
// ---------------------------------------------------------------------------

function SourceSummaryCard({ s }: { s: UiSourceSummary }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-white/[0.008] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="break-words text-[10px] font-semibold text-slate-200">{s.sourceName}</p>
          <p className="font-mono text-[8px] text-slate-600">{s.sourceEngine}</p>
        </div>
        <Badge value={s.status} tone={qualityTone(s.status)} />
      </div>
      <div className="flex flex-wrap gap-2 font-mono text-[8px]">
        <span className={s.fallbackUsed ? "text-amber" : "text-slate-600"}>
          fallback：{String(s.fallbackUsed)}
        </span>
        <span className="text-slate-600">req：{String(s.requestPerformed)}</span>
        <span className="text-slate-600">supabase：{String(s.supabaseConnected)}</span>
        <span className="text-slate-600">write：{String(s.productionWritePerformed)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WarRoomDashboard() {
  const [mode, setMode] = useState<WarRoomModeValue>("PREMARKET");
  const [snapshot, setSnapshot] = useState<UiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3019 Approved Live Quote — manual refresh only. NEVER fetched on page load; only when
  // the user presses 手動刷新 3019. Read-only; no auto/interval/background fetch.
  const [liveQuote, setLiveQuote] = useState<UiApproved3019Response | null>(null);
  const [liveQuoteLoading, setLiveQuoteLoading] = useState(false);
  const [liveQuoteError, setLiveQuoteError] = useState<string | null>(null);

  const refreshApprovedLiveQuote = () => {
    setLiveQuoteLoading(true);
    setLiveQuoteError(null);
    // Read-only approved endpoint; only symbol 3019 / mode manual is honored server-side.
    fetch(`/api/war-room/approved-live-quote?symbol=3019&mode=manual`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setLiveQuote(json as UiApproved3019Response);
        setLiveQuoteLoading(false);
      })
      .catch((err: unknown) => {
        // Fetch failure / timeout must not crash the UI — show safe fallback text.
        setLiveQuoteError(String(err));
        setLiveQuoteLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Only the internal contract endpoint is ever fetched here.
    fetch(`/api/war-room?mode=${mode}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setSnapshot(json as UiSnapshot);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const sections: UiSection[] = snapshot
    ? [
        snapshot.marketStatusLight,
        snapshot.realtimeAlerts,
        snapshot.portfolioRiskRadar,
        snapshot.researchTopPicks,
        snapshot.technicalRiskRewardCandidates,
        snapshot.avoidList,
        snapshot.nextObservationPoints,
      ]
    : [];

  const dq = snapshot?.dataQualitySummary;

  return (
    <section className="panel-shell overflow-hidden">
      {/* ================================================================== */}
      {/* Header — Allen Stock War Room                                       */}
      {/* ================================================================== */}
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Allen Stock War Room · /api/war-room
            </p>
            <h2 className="text-[16px] font-semibold tracking-wide text-slate-100">
              {MODE_LABEL[mode]}&nbsp;
              <span className="font-mono text-[13px] text-slate-400">{mode}</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-amber/20 bg-amber/[0.06] px-2.5 py-1 text-[8px] font-semibold text-amber">
              fixture only · 非即時資料 · not trade advice
            </span>
            <span className="rounded-full border border-line bg-white/[0.02] px-2.5 py-1 font-mono text-[8px] text-slate-500">
              responseSource = mock_or_contract
            </span>
          </div>
        </div>

        {/* Quick-status row — always above the fold */}
        {snapshot && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px]">
            <span className="text-slate-600">市場：</span>
            <Badge value={snapshot.marketStatus} tone={alertTone(snapshot.marketStatus)} />
            <span className="text-slate-600">主警報：</span>
            <Badge value={snapshot.primaryAlertLevel} tone={alertTone(snapshot.primaryAlertLevel)} />
            <span className="text-slate-600">資料品質：</span>
            {dq && <Badge value={dq.overallStatus} tone={qualityTone(dq.overallStatus)} />}
            {dq && !dq.highConfidenceConclusionAllowed && (
              <span className="rounded-full border border-amber/20 bg-amber/[0.04] px-2 py-0.5 text-[8px] font-semibold text-amber">
                highConfidenceConclusionAllowed = false
              </span>
            )}
            <span className="ml-auto font-mono text-[8px] text-slate-700">
              {snapshot.generatedAt.slice(0, 19).replace("T", " ")}
            </span>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* Mode Switcher                                                        */}
      {/* ================================================================== */}
      <div className="flex flex-wrap gap-2 border-b border-line bg-slate-900/40 px-5 py-3 sm:px-6">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex flex-col rounded-xl border px-3 py-2 text-left transition-colors ${
              mode === m
                ? "border-positive/30 bg-positive/10"
                : "border-line bg-white/[0.015] hover:border-slate-600"
            }`}
          >
            <span
              className={`text-[10px] font-bold ${mode === m ? "text-positive" : "text-slate-300"}`}
            >
              {MODE_LABEL[m]}
              <span className="ml-1.5 font-mono text-[8px] opacity-60">{m}</span>
            </span>
            <span className="mt-0.5 text-[8px] text-slate-600">{MODE_SUBTITLE[m]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        {/* Loading */}
        {loading && (
          <p className="py-8 text-center text-[11px] text-slate-500">載入戰情室資料中…</p>
        )}

        {/* Error — safe fallback, no fake data */}
        {!loading && error && (
          <div className="rounded-xl border border-negative/20 bg-negative/[0.05] p-4">
            <p className="text-[11px] font-semibold text-negative">無法載入 /api/war-room</p>
            <p className="mt-1 text-[10px] text-slate-500">
              已套用安全 fallback，不顯示任何假資料。錯誤：{error}
            </p>
          </div>
        )}

        {!loading && !error && snapshot && (
          <>
            {/* ============================================================ */}
            {/* Summary Cards — above-the-fold metadata                       */}
            {/* ============================================================ */}
            <div>
              <SectionLabel label="狀態總覽" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <Pill
                  label="Market Status"
                  value={snapshot.marketStatus}
                  tone={alertTone(snapshot.marketStatus).split(" ")[0]}
                />
                <Pill
                  label="Alert Level"
                  value={snapshot.primaryAlertLevel}
                  tone={alertTone(snapshot.primaryAlertLevel).split(" ")[0]}
                />
                {dq && (
                  <Pill
                    label="Data Quality"
                    value={dq.overallStatus}
                    tone={qualityTone(dq.overallStatus).split(" ")[0]}
                  />
                )}
                <Pill
                  label="Confidence Gate"
                  value={dq ? (dq.highConfidenceConclusionAllowed ? "ALLOWED" : "BLOCKED") : "—"}
                  tone={dq?.highConfidenceConclusionAllowed ? "text-positive" : "text-amber"}
                />
                <Pill label="Source Mode" value={snapshot.sourceMode} />
                <Pill label="Fixture Version" value={snapshot.fixtureAdapterVersion ?? "—"} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Pill label="apiContractVersion" value={snapshot.apiContractVersion} />
                <Pill label="responseSource" value={snapshot.responseSource} />
                <Pill label="warRoomMode" value={snapshot.warRoomMode} />
                <Pill label="snapshotId" value={snapshot.snapshotId.slice(0, 32)} />
              </div>
              {dq && !dq.highConfidenceConclusionAllowed && (
                <p className="mt-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[10px] text-amber">
                  ⚠ 目前不可輸出高信心結論 — 資料不足就顯示資料不足。
                </p>
              )}
            </div>

            {/* ============================================================ */}
            {/* Seven Section Cards                                            */}
            {/* ============================================================ */}
            <div>
              <SectionLabel label="七大區塊 (Seven Sections)" />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {sections.map((section) => (
                  <SectionCardView key={section.sectionId} section={section} />
                ))}
              </div>
            </div>

            {/* ============================================================ */}
            {/* Portfolio Risk Items                                           */}
            {/* ============================================================ */}
            <div>
              <SectionLabel
                label={`持股風險 Radar Items (${snapshot.portfolioRiskItems.length})`}
              />
              {snapshot.portfolioRiskItems.length === 0 ? (
                <p className="text-[10px] text-slate-600">
                  contract-only 空狀態：portfolioRiskItems 尚無 fixture data。
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {snapshot.portfolioRiskItems.map((item, i) => (
                    <PortfolioRiskCard key={item.stockId ?? i} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* Research TOP Picks                                             */}
            {/* ============================================================ */}
            <div>
              <SectionLabel
                label={`Research TOP Picks (${snapshot.researchTopPickItems.length})`}
              />
              <p className="mb-2 text-[9px] text-amber">
                TOP5 Research 不等於 TOP5 Entry；notEntrySignal = true；研究面排序，不是買點。
              </p>
              {snapshot.researchTopPickItems.length === 0 ? (
                <p className="text-[10px] text-slate-600">
                  contract-only 空狀態：researchTopPickItems 尚無 fixture data。
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {snapshot.researchTopPickItems.map((item, i) => (
                    <ResearchTopPickCard key={item.rank ?? i} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* Technical + Risk Reward Candidates                            */}
            {/* ============================================================ */}
            <div>
              <SectionLabel
                label={`Technical + Risk Reward Candidates (${snapshot.technicalCandidateItems.length})`}
              />
              <p className="mb-2 text-[9px] text-amber">
                TOP5 Technical Candidates 不等於買進清單；notEntrySignal / notTradeAdvice = true。
              </p>
              {snapshot.technicalCandidateItems.length === 0 ? (
                <p className="text-[10px] text-slate-600">
                  contract-only 空狀態：technicalCandidateItems 尚無 fixture data。
                </p>
              ) : (
                <div className="grid gap-2 xl:grid-cols-2">
                  {snapshot.technicalCandidateItems.map((item, i) => (
                    <TechnicalCandidateCard key={item.stockId ?? i} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* Intraday Alert Items                                           */}
            {/* ============================================================ */}
            <div>
              <SectionLabel
                label={`Intraday Alert Items (${snapshot.intradayAlertItems.length})`}
              />
              <p className="mb-2 text-[9px] text-amber">
                Intraday Alert 不等於出場；不是買賣指令；不自動下單。
              </p>
              {snapshot.intradayAlertItems.length === 0 ? (
                <p className="text-[10px] text-slate-600">
                  contract-only 空狀態：intradayAlertItems 尚無 fixture data。
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {snapshot.intradayAlertItems.map((item, i) => (
                    <IntradayAlertCard key={item.alertId ?? i} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* Avoid / No Touch Items                                         */}
            {/* ============================================================ */}
            <div>
              <SectionLabel label={`Avoid / No Touch Items (${snapshot.avoidItems.length})`} />
              <p className="mb-2 text-[9px] text-amber">
                Avoid / No Touch 是風控提醒，不是賣出指令；不產生買賣指令。
              </p>
              {snapshot.avoidItems.length === 0 ? (
                <p className="text-[10px] text-slate-600">
                  contract-only 空狀態：avoidItems 尚無 fixture data。
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {snapshot.avoidItems.map((item, i) => (
                    <AvoidItemCard key={item.stockId ?? `avoid-${i}`} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* Next Observation Points                                        */}
            {/* ============================================================ */}
            <div>
              <SectionLabel
                label={`Next Observation Points (${snapshot.observationPoints.length})`}
              />
              {snapshot.observationPoints.length === 0 ? (
                <p className="text-[10px] text-slate-600">
                  contract-only 空狀態：observationPoints 尚無 fixture data。
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {snapshot.observationPoints.map((item, i) => (
                    <ObservationPointCard key={item.pointId ?? i} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* 17線馬力分數（Allen 17-Line Power Score v1.1）                  */}
            {/* ============================================================ */}
            {snapshot.horsepowerScannerItems && snapshot.horsepowerScannerItems.length > 0 ? (
              <div>
                <SectionLabel
                  label={`17線馬力分數（Allen 17-Line Power Score v1.1）（${snapshot.horsepowerScannerItems.length}）`}
                />
                <div className="mb-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[9px] leading-5 text-amber">
                  多週期趨勢強弱篩選器；fixture data 不是即時資料；非買賣建議、非進場訊號、不自動下單；量能確認與過熱濾網僅為觀察條件。
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {snapshot.horsepowerScannerItems.map((hp, i) => (
                    <div
                      key={hp.symbol ?? i}
                      className="rounded-xl border border-line bg-white/[0.012] px-3 py-2 text-[10px] text-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">
                          {hp.symbol}｜{hp.name}
                        </span>
                        <span className="text-slate-400">收盤 {hp.close}</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[9px] text-slate-400">
                        <span>原始馬力：{hp.horsepowerScore} / 17</span>
                        <span>可用線數：{hp.horsepowerScore} / {hp.maxAvailable}</span>
                        <span>強度比例：{(hp.powerRatio * 100).toFixed(1)}%</span>
                        <span>加權馬力：{hp.weightedPower.toFixed(1)} / 100</span>
                        <span>強度判讀：{hp.powerRating}</span>
                        <span>候選標籤：{hp.candidateTag}</span>
                        <span>短線成本：{hp.shortCostScore.passed}/{hp.shortCostScore.available}</span>
                        <span>日線：{hp.dailyMAScore.passed}/{hp.dailyMAScore.available}</span>
                        <span>週線：{hp.weeklyScore.passed}/{hp.weeklyScore.available}</span>
                        <span>月線：{hp.monthlyScore.passed}/{hp.monthlyScore.available}</span>
                        <span>最近支撐：{hp.nearestSupport ?? "—"}</span>
                        <span>最近壓力：{hp.nearestPressure ?? "—"}</span>
                        <span>量能狀態：{hp.isVolumeConfirmed ? "量能確認" : "量能未確認"}</span>
                        <span>過熱狀態：{hp.isOverheated ? "過熱" : "未過熱"}</span>
                        <span>資料狀態：{dataStatusZh(hp.dataStatus)}</span>
                        <span>安全標籤：非買賣建議 / 非進場訊號</span>
                      </div>
                      {hp.reliabilityNote ? (
                        <p className="mt-1 text-[9px] text-amber">資料可靠度提醒：{hp.reliabilityNote}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ============================================================ */}
            {/* 跨模組一致性（Cross-Module Consistency Governance）            */}
            {/* ============================================================ */}
            {snapshot.crossModuleConsistencyItems && snapshot.crossModuleConsistencyItems.length > 0 ? (
              <div>
                <SectionLabel
                  label={`跨模組一致性（Cross-Module Consistency Governance）（${snapshot.crossModuleConsistencyItems.length}）`}
                />
                <div className="mb-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[9px] leading-5 text-amber">
                  一致性 / 治理層；偵測 Allen Score、17線馬力、Technical + RR、扣三低、Position Strategy 之間的矛盾；
                  fixture data 不是即時資料；非買賣建議、非進場訊號、非自動下單；Position Strategy「禁碰」凌駕所有高分訊號。
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {snapshot.crossModuleConsistencyItems.map((cm, i) => (
                    <div
                      key={cm.symbol ?? i}
                      className="rounded-xl border border-line bg-white/[0.012] px-3 py-2 text-[10px] text-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">
                          {cm.symbol}｜{cm.nameZh}
                        </span>
                        <span className="text-slate-400">
                          {conflictLevelZh(cm.conflictLevel)}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-1 gap-y-0.5 font-mono text-[9px] text-slate-400">
                        <span>Allen Score：{cm.allenScoreSignal}</span>
                        <span>17線馬力：{cm.seventeenLineSignal}</span>
                        <span>Technical + RR：{cm.technicalRiskRewardSignal}</span>
                        <span>扣三低：{cm.kouSanDiSignal}</span>
                        <span>Position Strategy：{cm.positionStrategySignal}</span>
                        <span>衝突等級：{conflictLevelZh(cm.conflictLevel)}</span>
                        <span>硬門檻：{hardGateStatusZh(cm.hardGateStatus)}</span>
                        <span>可排序：{cm.rankingEligible ? "是" : "否"}</span>
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-slate-100">
                        最終觀察標籤：{cm.finalObservationLabelZh}
                      </p>
                      <p className="mt-0.5 text-[9px] text-slate-500">{cm.safetyNoteZh}</p>
                      <p className="mt-0.5 text-[9px] text-amber">安全標籤：非買賣建議 / 非進場訊號 / 非自動下單</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ============================================================ */}
            {/* 3019 核准真實報價（Approved Live Quote · 手動刷新 MVP）        */}
            {/* ============================================================ */}
            <div>
              <SectionLabel label="3019 核准真實報價（Approved Live Quote · 手動刷新）" />
              <div className="mb-2 rounded-lg border border-sky-400/15 bg-sky-400/[0.03] px-3 py-2 text-[9px] leading-5 text-sky-300">
                唯讀真實報價 MVP，只限 3019（亞光）、只限核准頻道 tse_3019.tw；預設頁面載入不抓真實行情，
                僅在按下「手動刷新 3019」時取得一次；非買賣建議、非進場訊號、非自動下單；手動刷新不等於交易。
              </div>

              <button
                type="button"
                onClick={refreshApprovedLiveQuote}
                disabled={liveQuoteLoading}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                  liveQuoteLoading
                    ? "cursor-not-allowed border-line bg-white/[0.02] text-slate-500"
                    : "border-sky-400/30 bg-sky-400/10 text-sky-300 hover:border-sky-400/50"
                }`}
              >
                {liveQuoteLoading ? "刷新中…（讀取真實報價）" : "手動刷新 3019"}
              </button>

              {/* Fetch failure / timeout — safe fallback, no fake data, no crash. */}
              {liveQuoteError && (
                <div className="mt-2 rounded-lg border border-amber/20 bg-amber/[0.05] p-3">
                  <p className="text-[10px] font-semibold text-amber">無法取得 3019 真實報價</p>
                  <p className="mt-1 text-[9px] text-slate-500">
                    已套用安全 fallback，顯示資料不足，不顯示任何假資料。錯誤：{liveQuoteError}
                  </p>
                </div>
              )}

              {liveQuote && (
                <div className="mt-2 rounded-xl border border-line bg-white/[0.012] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-slate-100">
                      {liveQuote.symbol}｜{liveQuote.nameZh}
                    </span>
                    <Badge value={liveQuote.uiStatusZh} tone={liveQuoteTone(liveQuote.dataStatus)} />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-300 sm:grid-cols-3">
                    <span>價格：{nzShow(liveQuote.quote.price)}</span>
                    <span>前收：{nzShow(liveQuote.quote.previousClose)}</span>
                    <span
                      className={
                        liveQuote.quote.change === null
                          ? "text-slate-400"
                          : liveQuote.quote.change >= 0
                            ? "text-positive"
                            : "text-negative"
                      }
                    >
                      漲跌：{nzShow(liveQuote.quote.change)}
                    </span>
                    <span>開盤：{nzShow(liveQuote.quote.open)}</span>
                    <span>最高：{nzShow(liveQuote.quote.high)}</span>
                    <span>最低：{nzShow(liveQuote.quote.low)}</span>
                    <span>成交量：{nzShow(liveQuote.quote.volume)}</span>
                    <span
                      className={
                        liveQuote.quote.changePercent === null
                          ? "text-slate-400"
                          : liveQuote.quote.changePercent >= 0
                            ? "text-positive"
                            : "text-negative"
                      }
                    >
                      漲跌幅：
                      {liveQuote.quote.changePercent === null
                        ? "資料不足"
                        : `${liveQuote.quote.changePercent}%`}
                    </span>
                    <span>資料狀態：{liveQuote.uiStatusZh}</span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-y-0.5 text-[9px] text-slate-500 sm:grid-cols-2">
                    <span>資料來源：{liveQuote.sourceProvider}（{liveQuote.approvedChannel}）</span>
                    <span>刷新模式：{liveQuote.fetchMode}</span>
                    <span>來源時間 sourceTimestamp：{liveQuote.quote.sourceTimestamp ?? "資料不足"}</span>
                    <span>抓取時間 fetchedAt：{liveQuote.quote.fetchedAt}</span>
                  </div>

                  <p className="mt-2 text-[9px] text-slate-500">{liveQuote.sourceNoteZh}</p>
                  <p className="mt-0.5 text-[9px] text-amber">
                    安全標籤：非買賣建議 / 非進場訊號 / 非自動下單（{liveQuote.safetyNoteZh}）
                  </p>
                </div>
              )}

              {!liveQuote && !liveQuoteError && !liveQuoteLoading && (
                <p className="mt-2 text-[10px] text-slate-600">
                  尚未刷新：預設不抓真實行情。按「手動刷新 3019」取得一次唯讀真實報價。
                </p>
              )}
            </div>

            {/* ============================================================ */}
            {/* Position Strategy Plans (V26)                                  */}
            {/* ============================================================ */}
            <div>
              <SectionLabel
                label={`Position Strategy Plans (${snapshot.positionStrategyPlans.length})`}
              />
              <div className="mb-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[9px] leading-5 text-amber">
                fixture data 不是即時資料；fixture data 不是投資建議；不自動下單；不產生買賣指令；不替代投資判斷。
                <span className="ml-1 font-mono text-slate-500">
                  positionStrategyFixtureVersion = {snapshot.positionStrategyFixtureVersion}
                </span>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <Pill label="Entry" value={String(snapshot.entryObservationPlans.length)} />
                <Pill label="Holding Defense" value={String(snapshot.holdingDefensePlans.length)} />
                <Pill label="Profit Protection" value={String(snapshot.profitProtectionPlans.length)} />
                <Pill label="Risk Reduction" value={String(snapshot.riskReductionPlans.length)} />
                <Pill label="No Touch" value={String(snapshot.positionNoTouchPlans.length)} />
                <Pill
                  label="Data Insufficient"
                  value={String(snapshot.positionDataInsufficientPlans.length)}
                />
              </div>

              {[
                { label: "Entry Observation Plans", plans: snapshot.entryObservationPlans },
                { label: "Holding Defense Plans", plans: snapshot.holdingDefensePlans },
                { label: "Profit Protection Plans", plans: snapshot.profitProtectionPlans },
                { label: "Risk Reduction Plans", plans: snapshot.riskReductionPlans },
                { label: "No Touch Plans", plans: snapshot.positionNoTouchPlans },
                { label: "Data Insufficient Plans", plans: snapshot.positionDataInsufficientPlans },
              ].map((grp) => (
                <div key={grp.label} className="mb-3">
                  <p className="mb-1.5 text-[10px] font-semibold text-slate-300">
                    {grp.label} ({grp.plans.length})
                  </p>
                  {grp.plans.length === 0 ? (
                    <p className="text-[10px] text-slate-600">
                      contract-only 空狀態：尚無 fixture data。
                    </p>
                  ) : (
                    <div className="grid gap-2 xl:grid-cols-2">
                      {grp.plans.map((p, i) => (
                        <PositionPlanCard key={p.planId ?? i} plan={p} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <p className="text-[9px] leading-5 text-slate-500">
                進場觀察區，不是買進價；策略失效觀察價，不是自動停損價；觀察目標區，不是目標價；
                takeProfitZone 不是賣出價；出場觀察區不是賣出價；風險降低觀察不是賣出指令；
                No Touch 是風控提醒，不是賣出指令；資料不足就顯示資料不足。
              </p>
            </div>

            {/* ============================================================ */}
            {/* Source Summary                                                 */}
            {/* ============================================================ */}
            <div>
              <SectionLabel label="Source Summary" />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {snapshot.sourceSummary.map((s) => (
                  <SourceSummaryCard key={s.sourceName} s={s} />
                ))}
              </div>
            </div>

            {/* ============================================================ */}
            {/* Data Quality Summary                                           */}
            {/* ============================================================ */}
            {dq && (
              <div>
                <SectionLabel label="Data Quality Summary" />
                <div className="rounded-xl border border-line bg-white/[0.012] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-200">dataQualitySummary</p>
                    <Badge value={dq.overallStatus} tone={qualityTone(dq.overallStatus)} />
                  </div>
                  <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    <Pill label="PASS" value={String(dq.passCount)} />
                    <Pill label="WARNING" value={String(dq.warningCount)} tone="text-amber" />
                    <Pill label="FAIL" value={String(dq.failCount)} />
                    <Pill label="資料不足" value={String(dq.dataInsufficientCount)} />
                    <Pill label="LICENSE_REQ" value={String(dq.licenseRequiredCount)} />
                    <Pill
                      label="highConfidence"
                      value={dq.highConfidenceConclusionAllowed ? "true" : "false"}
                      tone={dq.highConfidenceConclusionAllowed ? "text-positive" : "text-amber"}
                    />
                  </div>
                  <p className="text-[10px] text-amber">
                    highConfidenceConclusionAllowed = false：目前不可輸出高信心結論。
                    資料不足就顯示資料不足。
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================================================================== */}
        {/* Safety Footer — always rendered                                    */}
        {/* ================================================================== */}
        <div className="rounded-xl border border-line bg-slate-900/40 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Safety Boundary
          </p>
          <div className="grid gap-x-6 gap-y-0.5 text-[10px] leading-5 text-slate-500 sm:grid-cols-2">
            <span>· 不自動下單；不產生買賣指令；不替代投資判斷。</span>
            <span>· fixture data 不是即時資料；fixture data 不是投資建議。</span>
            <span>· Research Rating 不等於 actionSignal。</span>
            <span>· TOP5 Research 不等於 TOP5 Entry。</span>
            <span>· TOP5 Technical Candidates 不等於買進清單。</span>
            <span>· Valuation Tier 不等於 actionSignal。</span>
            <span>· Intraday Alert 不等於出場。</span>
            <span>· 資料不足就顯示資料不足。</span>
          </div>
          <p className="mt-2 font-mono text-[8px] text-slate-700">
            前版 sourceMode = spec_only（V21），V22 升級為 fixture（fixtureAdapterVersion = V22）。
            responseSource = mock_or_contract（唯讀，不寫入資料）。
          </p>
        </div>
      </div>
    </section>
  );
}
