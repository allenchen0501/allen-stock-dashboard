"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ShadowRunnerDryRunApiResponsePayload } from "@/use-cases/deployment/shadow-runner-dry-run-api-contract";

// ---------------------------------------------------------------------------
// Shadow Runner Dry-run Monitoring — V52 UI Integration
//
// Reads ONLY the internal /api/portfolio/shadow-runner-dry-run endpoint (V51
// fixture-only route returning the V50 mock_or_contract responsePayload). It
// does NOT import the route, does NOT import the builder, does NOT fetch any
// external URL, does NOT connect to Supabase, does NOT read env keys, and does
// NOT produce buy/sell commands. The payload is a fixture-only dry-run evidence
// preview — it never writes, never auto-orders, and never switches /api/portfolio.
//
// Note: V50 contract flags retained false (routeCreated / apiRouteCreated /
// routeImplemented) does NOT mean the production route is missing — V51 route is
// live and V51.1 production smoke verified endpoint 200.
// ---------------------------------------------------------------------------

function tone(value: unknown): string {
  if (value === false) return "text-positive";
  if (value === true) return "text-amber";
  return "text-slate-200";
}

function KV({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line/40 py-0.5 text-[9px] last:border-0">
      <span className="font-mono text-slate-600">{label}</span>
      <span className={`break-all font-mono ${tone(value)}`}>{String(value)}</span>
    </div>
  );
}

function Pill({ label, value, tone: t }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-white/[0.015] px-3 py-2">
      <span className="text-[8px] uppercase tracking-[0.15em] text-slate-600">{label}</span>
      <span className={`break-all font-mono text-[10px] font-semibold ${t ?? "text-slate-200"}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.012] p-3">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      {children}
    </div>
  );
}

export function ShadowRunnerDryRunMonitoring() {
  const [payload, setPayload] = useState<ShadowRunnerDryRunApiResponsePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Only the internal fixture-only endpoint is ever fetched here.
    fetch("/api/portfolio/shadow-runner-dry-run")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setPayload(json as ShadowRunnerDryRunApiResponsePayload);
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
  }, []);

  const r = payload?.evidenceReport;
  const s = payload?.safetyFlags;

  return (
    <section className="panel-shell overflow-hidden">
      {/* Header */}
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Shadow Runner Dry-run Monitoring · /api/portfolio/shadow-runner-dry-run
            </p>
            <h2 className="text-[16px] font-semibold tracking-wide text-slate-100">
              影子執行試運行監控（Shadow Runner Dry-run Monitoring）
            </h2>
          </div>
          <span className="rounded-full border border-amber/20 bg-amber/[0.06] px-2.5 py-1 text-[8px] font-semibold text-amber">
            fixture-only · mock_or_contract · dry-run evidence only
          </span>
        </div>
        <p className="mt-2 rounded-lg border border-amber/15 bg-amber/[0.03] px-3 py-2 text-[9px] leading-5 text-amber">
          fixture-only；mock_or_contract；no Supabase connection；no env key；no DB write；no real market data；
          no /api/portfolio switch；no auto order；dry-run evidence only。
          dry-run evidence must not be persisted to DB；dry-run mismatch must not promote staging；
          empty / stale / error result must not override hardcoded；kill switch must be enabled by default。
        </p>
        <p className="mt-1 font-mono text-[8px] text-slate-600">
          V50 contract flags retained false（routeCreated / apiRouteCreated / routeImplemented）—— 這代表 V50 contract
          當時語義，不代表 production route missing；V51 route 已上線、production route verified separately by V51.1
          smoke evidence（endpoint 200）。
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {loading && (
          <p className="py-8 text-center text-[11px] text-slate-500">
            Shadow Runner Dry-run Monitoring loading fixture data...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-negative/20 bg-negative/[0.05] p-4">
            <p className="text-[11px] font-semibold text-negative">
              Shadow Runner Dry-run Monitoring unavailable —— 資料不足
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              未顯示任何真實行情、未切換任何資料源、未呼叫外部資料源。dry-run evidence only。錯誤：{error}
            </p>
          </div>
        )}

        {!loading && !error && payload && r && s && (
          <>
            {/* API summary cards */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                API Summary
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <Pill label="ok" value={String(payload.ok)} tone="text-amber" />
                <Pill label="apiContractVersion" value={payload.apiContractVersion} />
                <Pill label="responseSource" value={payload.responseSource} />
                <Pill label="sourceMode" value={payload.sourceMode} />
                <Pill label="method" value={payload.method} />
                <Pill label="plannedEndpoint" value={payload.plannedEndpoint} />
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {/* Evidence report */}
              <Section title="Evidence Report">
                <KV label="generatedAt" value={r.generatedAt} />
                <KV label="runnerMode" value={r.runnerMode} />
                <KV label="comparedTableCount" value={r.comparedTableCount} />
                <KV label="comparedFieldCount" value={r.comparedFieldCount} />
                <KV label="passCount" value={r.passCount} />
                <KV label="mismatchCount" value={r.mismatchCount} />
                <KV label="dataInsufficientCount" value={r.dataInsufficientCount} />
                <KV label="staleCount" value={r.staleCount} />
                <KV label="errorCount" value={r.errorCount} />
                <KV label="blockedCount" value={r.blockedCount} />
                <KV label="promotionAllowed" value={r.promotionAllowed} />
                <KV label="portfolioApiSwitchAllowed" value={r.portfolioApiSwitchAllowed} />
                <KV label="persisted" value={r.persisted} />
                <KV label="manualReviewRequired" value={r.manualReviewRequired} />
              </Section>

              {/* Safety flags */}
              <Section title="Safety Flags">
                <KV label="supabaseConnected" value={s.supabaseConnected} />
                <KV label="stagingSupabaseConnected" value={s.stagingSupabaseConnected} />
                <KV label="productionSupabaseConnected" value={s.productionSupabaseConnected} />
                <KV label="envReadPerformed" value={s.envReadPerformed} />
                <KV label="databaseWritePerformed" value={s.databaseWritePerformed} />
                <KV label="shadowRunnerExecuted" value={s.shadowRunnerExecuted} />
                <KV label="shadowResultPersisted" value={s.shadowResultPersisted} />
                <KV label="portfolioApiSwitched" value={s.portfolioApiSwitched} />
                <KV label="realMarketDataEnabled" value={s.realMarketDataEnabled} />
                <KV label="buySellCommandGenerated" value={s.buySellCommandGenerated} />
                <KV label="autoOrderRequested" value={s.autoOrderRequested} />
                <KV label="killSwitchDefaultEnabled" value={s.killSwitchDefaultEnabled} />
              </Section>
            </div>

            {/* warnings + nextRequiredActions */}
            <div className="grid gap-3 xl:grid-cols-2">
              <Section title="warnings">
                {payload.warnings.length === 0 ? (
                  <p className="text-[10px] text-slate-600">（無）</p>
                ) : (
                  <ul className="space-y-0.5">
                    {payload.warnings.map((w, i) => (
                      <li key={i} className="text-[10px] leading-5 text-slate-500">· {w}</li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title="nextRequiredActions">
                {payload.nextRequiredActions.length === 0 ? (
                  <p className="text-[10px] text-slate-600">（無）</p>
                ) : (
                  <ul className="space-y-0.5">
                    {payload.nextRequiredActions.map((a, i) => (
                      <li key={i} className="text-[10px] leading-5 text-slate-500">· {a}</li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </>
        )}

        {/* Safety footer — always shown */}
        <div className="rounded-xl border border-line bg-slate-900/40 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Safety Boundary
          </p>
          <div className="grid gap-x-6 gap-y-0.5 text-[10px] leading-5 text-slate-500 sm:grid-cols-2">
            <span>· fixture-only；mock_or_contract；dry-run evidence only。</span>
            <span>· no Supabase connection；no env key；no DB write。</span>
            <span>· no real market data；no /api/portfolio switch；no auto order。</span>
            <span>· V50 contract flags retained false（≠ production route missing）。</span>
            <span>· production route verified separately by V51.1 smoke evidence。</span>
            <span>· kill switch must be enabled by default。</span>
          </div>
        </div>
      </div>
    </section>
  );
}
