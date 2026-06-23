"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// War Room Dashboard — V21 UI Integration
//
// Reads ONLY the internal /api/war-room?mode=<MODE> contract endpoint. Does NOT
// import buildWarRoomReadModelContract, does NOT import any engine runtime
// builder, does NOT fetch any external URL, does NOT connect to Supabase, and
// does NOT produce buy/sell commands. The API response is treated as a read
// model: this UI never upgrades dataQualityStatus and never hides an
// unavailable section.
// ---------------------------------------------------------------------------

const MODES = ["PREMARKET", "INTRADAY", "POSTMARKET", "REALTIME_ALERT"] as const;
type WarRoomModeValue = (typeof MODES)[number];

const MODE_LABEL: Record<WarRoomModeValue, string> = {
  PREMARKET: "盤前",
  INTRADAY: "盤中",
  POSTMARKET: "盤後",
  REALTIME_ALERT: "即時警報",
};

// Minimal UI-facing types (no runtime builder import; shape mirrors the
// WarRoomIntelligenceSnapshot contract returned by /api/war-room).
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
  portfolioRiskItems: unknown[];
  researchTopPickItems: unknown[];
  technicalCandidateItems: unknown[];
  intradayAlertItems: unknown[];
  avoidItems: unknown[];
  observationPoints: unknown[];
  sourceSummary: UiSourceSummary[];
  dataQualitySummary: UiDataQualitySummary;
  apiContractVersion: string;
  responseSource: string;
  sourceMode: string;
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function qualityTone(status: string): string {
  switch (status) {
    case "PASS":
      return "text-positive bg-positive/10 border-positive/20";
    case "WARNING":
      return "text-amber bg-amber/10 border-amber/20";
    case "FAIL":
    case "DANGER":
      return "text-negative bg-negative/10 border-negative/20";
    default:
      return "text-slate-400 bg-white/[0.03] border-line";
  }
}

function Pill({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-white/[0.015] px-3 py-2">
      <span className="text-[8px] uppercase tracking-[0.15em] text-slate-600">{label}</span>
      <span className={`font-mono text-[12px] font-semibold ${tone ?? "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

function SectionCardView({ section }: { section: UiSection }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-white/[0.012] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-100">{section.title}</p>
          <p className="mt-0.5 truncate font-mono text-[9px] text-slate-600">
            {section.sectionId} · {section.sourceEngine}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${qualityTone(
            section.dataQualityStatus,
          )}`}
        >
          {section.dataQualityStatus}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
        <span
          className={`rounded px-1.5 py-0.5 ${
            section.available
              ? "bg-positive/10 text-positive"
              : "bg-slate-700/30 text-slate-500"
          }`}
        >
          {section.available ? "available" : "尚未接資料源 / 資料不足"}
        </span>
        {section.fallbackUsed && (
          <span className="rounded bg-amber/10 px-1.5 py-0.5 text-amber">fallbackUsed</span>
        )}
      </div>

      {section.unavailableReason && (
        <p className="text-[10px] leading-5 text-slate-500">{section.unavailableReason}</p>
      )}

      {section.warnings.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-amber">
          {section.warnings.map((w, i) => (
            <li key={i}>{w}</li>
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

  const aggregateGroups = snapshot
    ? [
        { label: "持股風險", count: snapshot.portfolioRiskItems.length },
        { label: "研究 TOP5", count: snapshot.researchTopPickItems.length },
        { label: "技術候選", count: snapshot.technicalCandidateItems.length },
        { label: "盤中警報", count: snapshot.intradayAlertItems.length },
        { label: "禁碰清單", count: snapshot.avoidItems.length },
        { label: "觀察點", count: snapshot.observationPoints.length },
      ]
    : [];

  const dq = snapshot?.dataQualitySummary;

  return (
    <section className="panel-shell overflow-hidden">
      {/* Header */}
      <div className="flex min-h-[66px] flex-wrap items-center justify-between gap-3 border-b border-line/80 px-5 py-3 sm:px-6">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            War Room · /api/war-room
          </p>
          <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
            戰情室 Read Model
          </h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-amber/20 bg-amber/[0.04] px-3 py-1.5 text-[9px] font-semibold text-amber">
          V21 UI · 合約預期 responseSource = mock_or_contract · sourceMode = spec_only
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex flex-wrap gap-2 border-b border-line bg-slate-900/40 px-5 py-3 sm:px-6">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
              mode === m
                ? "border-positive/30 bg-positive/10 text-positive"
                : "border-line bg-white/[0.015] text-slate-400 hover:text-slate-200"
            }`}
          >
            {MODE_LABEL[m]}
            <span className="ml-1 font-mono text-[8px] text-slate-600">{m}</span>
          </button>
        ))}
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {/* Loading / error / content */}
        {loading && (
          <p className="py-6 text-center text-[11px] text-slate-500">載入戰情室合約資料中…</p>
        )}

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
            {/* Snapshot metadata */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Pill label="apiContractVersion" value={snapshot.apiContractVersion} />
              <Pill label="responseSource" value={snapshot.responseSource} />
              <Pill label="sourceMode" value={snapshot.sourceMode} />
              <Pill label="warRoomMode" value={snapshot.warRoomMode} />
              <Pill
                label="marketStatus"
                value={snapshot.marketStatus}
                tone={qualityTone(snapshot.marketStatus).split(" ")[0]}
              />
              <Pill
                label="primaryAlertLevel"
                value={snapshot.primaryAlertLevel}
                tone={qualityTone(snapshot.primaryAlertLevel).split(" ")[0]}
              />
              <Pill label="generatedAt" value={snapshot.generatedAt.slice(0, 19)} />
              <Pill label="snapshotId" value={snapshot.snapshotId} />
            </div>

            {/* dataQualitySummary */}
            {dq && (
              <div className="rounded-xl border border-line bg-white/[0.012] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-200">dataQualitySummary</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${qualityTone(
                      dq.overallStatus,
                    )}`}
                  >
                    {dq.overallStatus}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  <Pill label="PASS" value={String(dq.passCount)} />
                  <Pill label="WARNING" value={String(dq.warningCount)} />
                  <Pill label="FAIL" value={String(dq.failCount)} />
                  <Pill label="資料不足" value={String(dq.dataInsufficientCount)} />
                  <Pill label="LICENSE" value={String(dq.licenseRequiredCount)} />
                  <Pill
                    label="highConfidenceConclusionAllowed"
                    value={dq.highConfidenceConclusionAllowed ? "true" : "false"}
                  />
                </div>
                {!dq.highConfidenceConclusionAllowed && (
                  <p className="mt-2 text-[10px] text-amber">
                    目前不可輸出高信心結論（資料不足就顯示資料不足）。
                  </p>
                )}
              </div>
            )}

            {/* Seven sections */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                七大區塊
              </p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sections.map((section) => (
                  <SectionCardView key={section.sectionId} section={section} />
                ))}
              </div>
            </div>

            {/* Aggregated items empty-state */}
            <div className="rounded-xl border border-line bg-white/[0.012] p-4">
              <p className="mb-2 text-[11px] font-semibold text-slate-200">聚合明細</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {aggregateGroups.map((g) => (
                  <Pill key={g.label} label={g.label} value={String(g.count)} />
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                目前為 contract-only，尚未接 engine fixture adapters；空陣列代表資料不足，不顯示任何假股票 /
                假警報 / 假 TOP5。
              </p>
            </div>

            {/* sourceSummary */}
            <div className="rounded-xl border border-line bg-white/[0.012] p-4">
              <p className="mb-2 text-[11px] font-semibold text-slate-200">sourceSummary</p>
              <div className="space-y-1.5">
                {snapshot.sourceSummary.map((s) => (
                  <div
                    key={s.sourceName}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-1.5 last:border-0"
                  >
                    <span className="text-[11px] text-slate-300">{s.sourceName}</span>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px]">
                      <span
                        className={`rounded border px-1.5 py-0.5 ${qualityTone(s.status)}`}
                      >
                        {s.status}
                      </span>
                      <span className="rounded bg-white/[0.02] px-1.5 py-0.5 text-slate-600">
                        requestPerformed={String(s.requestPerformed)}
                      </span>
                      <span className="rounded bg-white/[0.02] px-1.5 py-0.5 text-slate-600">
                        supabaseConnected={String(s.supabaseConnected)}
                      </span>
                      <span className="rounded bg-white/[0.02] px-1.5 py-0.5 text-slate-600">
                        productionWritePerformed={String(s.productionWritePerformed)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Safety boundary — always shown */}
        <div className="rounded-xl border border-line bg-slate-900/40 p-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Safety boundary
          </p>
          <ul className="space-y-1 text-[10px] leading-5 text-slate-500">
            <li>· 不自動下單；不產生買賣指令；不替代投資判斷。</li>
            <li>· Research Rating 不等於 actionSignal。</li>
            <li>· TOP5 Research 不等於 TOP5 Entry。</li>
            <li>· TOP5 Technical Candidates 不等於買進清單。</li>
            <li>· Valuation Tier 不等於 actionSignal。</li>
            <li>· Intraday Alert 不等於出場。</li>
            <li>· 資料不足就顯示資料不足。</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
