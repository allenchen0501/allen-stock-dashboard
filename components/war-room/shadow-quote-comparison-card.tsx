import type { ShadowQuoteComparisonViewModel } from "@/use-cases/war-room/build-shadow-quote-comparison-view-model";

// ---------------------------------------------------------------------------
// Phase 2b — Shadow Comparison UI Shell (fixture-only, disabled real data)
//
// Presentational shell only. The real quote candidate is fixed to the
// DisabledRealQuoteProvider snapshot — there is NO runtime connection, NO fetch, NO
// Supabase, NO env read, NO API route, NO broker, NO order. decision stays NO_GO,
// mode INTERFACE_ONLY_NOT_CONNECTED, operationalUseAllowed false. This is UI shell
// only; fixture remains default; not production ready.
//
// 前台顯示文字一律繁體中文；保留 PHASE2B validator 需要的技術字串（例如
// NO_GO、INTERFACE_ONLY_NOT_CONNECTED、operationalUseAllowed=false 等）為技術標記。
// ---------------------------------------------------------------------------

/** 將布林值轉成繁中狀態文字，避免前台直接顯示 true / false。 */
function zhBool(value: boolean, trueText = "是", falseText = "否"): string {
  return value ? trueText : falseText;
}

function QuoteColumn({ title, quote }: { title: string; quote: ShadowQuoteComparisonViewModel["fixtureQuote"] }) {
  const fmt = (v: number | null): string => (v === null ? "—" : String(v));
  return (
    <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
      <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">{title}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate-100">
        {quote.symbol} · {quote.sourceName}
      </p>
      <div className="mt-1 space-y-0.5 text-[10px] text-slate-400">
        <p>價格 {fmt(quote.price)} · 開盤 {fmt(quote.open)} · 最高 {fmt(quote.high)} · 最低 {fmt(quote.low)}</p>
        <p>昨收 {fmt(quote.previousClose)} · 成交量 {fmt(quote.volume)}</p>
        <p>是否真實資料 {zhBool(quote.isRealData)} · 驗證狀態 {quote.verificationStatus}</p>
        <p>operationalUseAllowed 操作允許 {zhBool(quote.operationalUseAllowed, "是", "禁止")}</p>
      </div>
    </div>
  );
}

export function ShadowQuoteComparisonCard({ vm }: { vm: ShadowQuoteComparisonViewModel }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          Phase 2b 影子報價比對介面外殼（Phase 2b Shadow Comparison UI Shell）
        </h2>
        <p className="mt-1 text-[10px] text-slate-500">
          模式 mode = INTERFACE_ONLY_NOT_CONNECTED（僅介面、未連線） · 判定 decision = <span className="font-semibold text-negative">NO_GO</span>（不可放行） ·
          真實報價候選狀態 = DISABLED（已停用） · 預設模式 = {vm.defaultRealDataMode}。
        </p>
        <p className="mt-1 text-[9px] text-amber font-semibold">
          此卡僅為介面外殼 · 真實報價已停用 · 預設維持 fixture · 不產生交易決策 · 無買賣指令 · 無自動委託 · 尚未達正式就緒
          （This is UI shell only · Real quote is disabled · Fixture remains default · No trading decision ·
          No buy/sell command · No auto order · Not production ready）。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-2">
        <QuoteColumn title="fixture quote 固定樣本報價（預設）" quote={vm.fixtureQuote} />
        <QuoteColumn title="real quote candidate 真實報價候選（DISABLED 已停用／未連線）" quote={vm.realQuoteCandidate} />
      </div>

      <div className="border-t border-line/60 px-5 py-3 sm:px-6">
        <div className="space-y-0.5 text-[10px] text-slate-400">
          <p>
            <span className="text-slate-500">價差：</span>
            {vm.priceDifference === null ? "—（真實報價已停用）" : `${vm.priceDifference}（${vm.priceDifferencePercent ?? "—"}%）`}
          </p>
          <p>
            <span className="text-slate-500">缺真實報價 missingRealQuote：</span>{zhBool(vm.missingRealQuote)} ·{" "}
            <span className="text-slate-500">偵測到過期 staleDetected：</span>{zhBool(vm.staleDetected)} ·{" "}
            <span className="text-slate-500">偵測到衝突 conflictDetected：</span>{zhBool(vm.conflictDetected)}
          </p>
          <p>
            <span className="text-slate-500">降級原因 downgradeReason：</span>{vm.downgradeReason}
          </p>
        </div>
      </div>

      <div className="border-t border-line/60 px-5 py-3 sm:px-6">
        <p className="text-[9px] text-slate-600">
          技術旗標（皆為安全鎖定狀態）：operationalUseAllowed=false · realDataConnected=false · fetchPerformed=false · envReadPerformed=false ·
          supabaseConnected=false · apiRouteCreated=false · portfolioApiSwitched=false · productionReady=false ·
          mapsToV67V68V69=true。
        </p>
      </div>
    </section>
  );
}
