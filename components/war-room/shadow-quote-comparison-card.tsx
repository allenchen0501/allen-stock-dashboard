import type { ShadowQuoteComparisonViewModel } from "@/use-cases/war-room/build-shadow-quote-comparison-view-model";

// ---------------------------------------------------------------------------
// Phase 2b — Shadow Comparison UI Shell (fixture-only, disabled real data)
//
// Presentational shell only. The real quote candidate is fixed to the
// DisabledRealQuoteProvider snapshot — there is NO runtime connection, NO fetch, NO
// Supabase, NO env read, NO API route, NO broker, NO order. decision stays NO_GO,
// mode INTERFACE_ONLY_NOT_CONNECTED, operationalUseAllowed false. This is UI shell
// only; fixture remains default; not production ready.
// ---------------------------------------------------------------------------

function QuoteColumn({ title, quote }: { title: string; quote: ShadowQuoteComparisonViewModel["fixtureQuote"] }) {
  const fmt = (v: number | null): string => (v === null ? "—" : String(v));
  return (
    <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
      <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">{title}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate-100">
        {quote.symbol} · {quote.sourceName}
      </p>
      <div className="mt-1 space-y-0.5 text-[10px] text-slate-400">
        <p>price {fmt(quote.price)} · open {fmt(quote.open)} · high {fmt(quote.high)} · low {fmt(quote.low)}</p>
        <p>prevClose {fmt(quote.previousClose)} · volume {fmt(quote.volume)}</p>
        <p>isRealData {String(quote.isRealData)} · verificationStatus {quote.verificationStatus}</p>
        <p>operationalUseAllowed {String(quote.operationalUseAllowed)}</p>
      </div>
    </div>
  );
}

export function ShadowQuoteComparisonCard({ vm }: { vm: ShadowQuoteComparisonViewModel }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          Phase 2b Shadow Comparison UI Shell
        </h2>
        <p className="mt-1 text-[10px] text-slate-500">
          mode = INTERFACE_ONLY_NOT_CONNECTED · decision = <span className="font-semibold text-negative">NO_GO</span> ·
          real quote candidate status = DISABLED · default mode = {vm.defaultRealDataMode}。
        </p>
        <p className="mt-1 text-[9px] text-amber font-semibold">
          This is UI shell only · Real quote is disabled · Fixture remains default · No trading decision ·
          No buy/sell command · No auto order · Not production ready。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-2">
        <QuoteColumn title="fixture quote（default）" quote={vm.fixtureQuote} />
        <QuoteColumn title="real quote candidate（DISABLED / not connected）" quote={vm.realQuoteCandidate} />
      </div>

      <div className="border-t border-line/60 px-5 py-3 sm:px-6">
        <div className="space-y-0.5 text-[10px] text-slate-400">
          <p>
            <span className="text-slate-500">price difference：</span>
            {vm.priceDifference === null ? "—（real quote disabled）" : `${vm.priceDifference}（${vm.priceDifferencePercent ?? "—"}%）`}
          </p>
          <p>
            <span className="text-slate-500">missingRealQuote：</span>{String(vm.missingRealQuote)} ·{" "}
            <span className="text-slate-500">staleDetected：</span>{String(vm.staleDetected)} ·{" "}
            <span className="text-slate-500">conflictDetected：</span>{String(vm.conflictDetected)}
          </p>
          <p>
            <span className="text-slate-500">downgradeReason：</span>{vm.downgradeReason}
          </p>
        </div>
      </div>

      <div className="border-t border-line/60 px-5 py-3 sm:px-6">
        <p className="text-[9px] text-slate-600">
          operationalUseAllowed=false · realDataConnected=false · fetchPerformed=false · envReadPerformed=false ·
          supabaseConnected=false · apiRouteCreated=false · portfolioApiSwitched=false · productionReady=false ·
          mapsToV67V68V69=true。
        </p>
      </div>
    </section>
  );
}
