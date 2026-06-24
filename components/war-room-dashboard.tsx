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
