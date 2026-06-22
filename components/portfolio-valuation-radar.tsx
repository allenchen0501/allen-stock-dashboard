import { AlertCircle, ShieldAlert, ScanLine } from "lucide-react";
import { buildPortfolioValuationSummaryContract } from "@/use-cases/portfolio/build-valuation-summary-contract";
import { SectionCard } from "@/components/ui/section-card";
import type { PortfolioValuationSummaryItem } from "@/use-cases/portfolio/valuation-summary-contract";

function Dash() {
  return <span className="font-mono text-[11px] text-slate-600">—</span>;
}

function ValuationTierCell({ item }: { item: PortfolioValuationSummaryItem }) {
  if (item.valuationTier === "資料不足") {
    return (
      <div>
        <span className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-semibold bg-slate-700/40 text-slate-500">
          資料不足
        </span>
        <p className="mt-0.5 text-[8px] text-slate-600">估值公式尚未啟用</p>
      </div>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-semibold bg-slate-700/40 text-slate-400">
      {item.valuationTier}
    </span>
  );
}

function ActionSignalCell({ signal }: { signal: PortfolioValuationSummaryItem["actionSignal"] }) {
  if (signal === "資料不足") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold bg-slate-700/30 text-slate-500">
        資料不足
      </span>
    );
  }
  const colorMap: Record<string, string> = {
    "觀察": "bg-slate-700/30 text-slate-400",
    "可分批": "bg-positive/10 text-positive",
    "續抱": "bg-positive/[0.07] text-positive",
    "減碼觀察": "bg-amber/10 text-amber",
    "避開": "bg-negative/10 text-negative",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${colorMap[signal] ?? "bg-slate-700/30 text-slate-400"}`}>
      {signal}
    </span>
  );
}

function DataQualityCell({ status }: { status: PortfolioValuationSummaryItem["dataQualityStatus"] }) {
  if (status === "WARNING") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold bg-amber/10 text-amber">
        資料合約階段
      </span>
    );
  }
  if (status === "PASS") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold bg-positive/10 text-positive">
        PASS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold bg-negative/10 text-negative">
      FAIL
    </span>
  );
}

export function PortfolioValuationRadar() {
  const { data, metadata } = buildPortfolioValuationSummaryContract();

  return (
    <SectionCard
      title="Allen 持股估值雷達"
      eyebrow="Valuation radar · Spec-only UI shell"
      action={
        <div className="flex items-center gap-1.5 rounded-full border border-amber/20 bg-amber/[0.04] px-3 py-1.5 text-[9px] font-semibold text-amber">
          <ScanLine size={11} />
          V17A Shell
        </div>
      }
    >
      {/* Metadata badges */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-b border-line bg-white/[0.01] px-5 py-3 sm:px-6">
        {(
          [
            ["source_mode", metadata.source_mode],
            ["response_source", metadata.response_source],
            ["api_contract_version", metadata.api_contract_version],
            ["supabase_connected", String(metadata.supabase_connected)],
            ["production_write_performed", String(metadata.production_write_performed)],
            ["stock_valuation_snapshots_created", String(metadata.stock_valuation_snapshots_created)],
          ] as const
        ).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1.5 text-[9px] text-slate-600">
            <span className="font-mono">{key}:</span>
            <span className={`font-mono font-semibold ${val === "false" ? "text-slate-500" : val === "spec_only" || val === "mock_or_contract" ? "text-amber" : "text-slate-300"}`}>
              {val}
            </span>
          </span>
        ))}
      </div>

      {/* Spec-only notice */}
      <div className="flex items-start gap-2 border-b border-line bg-amber/[0.025] px-5 py-2.5 sm:px-6">
        <AlertCircle size={11} className="mt-0.5 flex-shrink-0 text-amber" />
        <p className="text-[9px] leading-relaxed text-amber/80">
          Spec-only UI shell：目前僅顯示合約資料與資料不足狀態，尚未啟用估值公式。所有估值欄位（forwardPE、fairPrice、cheapPrice、expensivePrice）均待公式確認後才會啟用。
        </p>
      </div>

      {/* Stock table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left">
          <thead>
            <tr className="h-10 border-b border-line text-[9px] uppercase tracking-[0.12em] text-slate-600">
              <th className="pl-5 font-semibold sm:pl-6">持股</th>
              <th className="font-semibold">市場</th>
              <th className="font-semibold">現價</th>
              <th className="font-semibold">漲跌幅</th>
              <th className="font-semibold">估值層級</th>
              <th className="font-semibold">平均成本</th>
              <th className="font-semibold">未實現損益</th>
              <th className="font-semibold">損益率</th>
              <th className="font-semibold">風報比</th>
              <th className="font-semibold">技術訊號</th>
              <th className="font-semibold">籌碼訊號</th>
              <th className="font-semibold">新聞訊號</th>
              <th className="font-semibold">事件風險</th>
              <th className="font-semibold">操作訊號</th>
              <th className="font-semibold">資料狀態</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.stockId}
                className="group h-[72px] border-b border-line/70 transition-colors last:border-0 hover:bg-white/[0.02]"
              >
                <td className="pl-5 sm:pl-6">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md border border-line bg-white/[0.02] text-[9px] font-bold text-slate-500">
                      {item.stockId.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-200">{item.stockName}</p>
                      <p className="mt-0.5 font-mono text-[9px] text-slate-600">{item.stockId}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="font-mono text-[9px] text-slate-500">{item.market}</span>
                </td>
                <td>{item.price !== null ? <span className="font-mono text-[11px] text-slate-300">{item.price}</span> : <Dash />}</td>
                <td>{item.changePercent !== null ? <span className="font-mono text-[11px]">{item.changePercent}%</span> : <Dash />}</td>
                <td><ValuationTierCell item={item} /></td>
                <td>{item.avgCost !== null ? <span className="font-mono text-[11px] text-slate-300">{item.avgCost}</span> : <Dash />}</td>
                <td>{item.unrealizedPnL !== null ? <span className="font-mono text-[11px]">{item.unrealizedPnL}</span> : <Dash />}</td>
                <td>{item.unrealizedPnLPercent !== null ? <span className="font-mono text-[11px]">{item.unrealizedPnLPercent}%</span> : <Dash />}</td>
                <td>{item.riskRewardRatio !== null ? <span className="font-mono text-[11px] text-slate-300">{item.riskRewardRatio}</span> : <Dash />}</td>
                <td>{item.technicalStatus !== null ? <span className="text-[9px] text-slate-400">{item.technicalStatus}</span> : <Dash />}</td>
                <td>{item.capitalFlowStatus !== null ? <span className="text-[9px] text-slate-400">{item.capitalFlowStatus}</span> : <Dash />}</td>
                <td>{item.newsSignal !== null ? <span className="text-[9px] text-slate-400">{item.newsSignal}</span> : <Dash />}</td>
                <td>{item.eventRisk !== null ? <span className="text-[9px] text-slate-400">{item.eventRisk}</span> : <Dash />}</td>
                <td><ActionSignalCell signal={item.actionSignal} /></td>
                <td><DataQualityCell status={item.dataQualityStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Valuation reason footer */}
      <div className="border-t border-line px-5 py-3 sm:px-6">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-slate-600">估值說明</p>
        <p className="text-[10px] text-slate-500">
          {data[0]?.valuationReason ?? "—"}
        </p>
      </div>

      {/* Safety notice */}
      <div className="border-t border-line px-5 pb-5 pt-3 sm:px-6">
        <div className="flex items-start gap-2 rounded-lg border border-line bg-white/[0.01] px-4 py-3">
          <ShieldAlert size={12} className="mt-0.5 flex-shrink-0 text-slate-600" />
          <p className="text-[9px] leading-relaxed text-slate-600">
            本區塊為 V17A UI shell，僅用於確認資料欄位與畫面配置；不構成投資建議，也不會自動產生買賣指令。
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
