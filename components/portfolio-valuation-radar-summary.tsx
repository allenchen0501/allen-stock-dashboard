import Link from "next/link";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { buildPortfolioValuationSummaryContract } from "@/use-cases/portfolio/build-valuation-summary-contract";
import { SectionCard } from "@/components/ui/section-card";
import type {
  PortfolioActionSignal,
  PortfolioValuationDataQualityStatus,
  PortfolioValuationSummaryItem,
  PortfolioValuationTier,
} from "@/use-cases/portfolio/valuation-summary-contract";

// ---------------------------------------------------------------------------
// Display label helpers
// ---------------------------------------------------------------------------

function tierLabel(tier: PortfolioValuationTier): string {
  return tier === "資料不足" ? "公式未啟用" : tier;
}

function qualityLabel(status: PortfolioValuationDataQualityStatus): string {
  if (status === "WARNING") return "合約階段";
  if (status === "FAIL") return "FAIL";
  return "PASS";
}

function signalLabel(signal: PortfolioActionSignal): string {
  return signal === "資料不足" ? "等待資料" : signal;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatChip({
  label,
  value,
  dim,
}: {
  label: string;
  value: number;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-line bg-white/[0.015] px-3 py-2.5">
      <span
        className={`font-mono text-[18px] font-bold leading-none ${dim ? "text-slate-600" : "text-slate-300"}`}
      >
        {value}
      </span>
      <span className="text-[8px] text-slate-600">{label}</span>
    </div>
  );
}

function StockPreviewRow({ item }: { item: PortfolioValuationSummaryItem }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-2 last:border-0">
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate text-[12px] font-semibold text-slate-200">
          {item.stockName}
        </span>
        <span className="shrink-0 font-mono text-[9px] text-slate-500">
          {item.stockId} · {item.market}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="rounded bg-slate-700/40 px-1.5 py-0.5 text-[9px] text-slate-500">
          {tierLabel(item.valuationTier)}
        </span>
        <span className="rounded-full bg-amber/10 px-1.5 py-0.5 text-[9px] text-amber">
          {qualityLabel(item.dataQualityStatus)}
        </span>
        <span className="rounded-full bg-slate-700/30 px-1.5 py-0.5 text-[9px] text-slate-500">
          {signalLabel(item.actionSignal)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PortfolioValuationRadarSummary() {
  const { data } = buildPortfolioValuationSummaryContract();
  const preview = data.slice(0, 5);

  const stats = {
    total: data.length,
    dataInsufficient: data.filter((d) => d.valuationTier === "資料不足").length,
    warning: data.filter((d) => d.dataQualityStatus === "WARNING").length,
    formulaActive: data.filter((d) => d.valuationTier !== "資料不足").length,
  };

  return (
    <SectionCard
      title="持股估值雷達摘要"
      eyebrow="Portfolio valuation · Dashboard preview"
      action={
        <div className="flex items-center gap-1.5 rounded-full border border-amber/20 bg-amber/[0.04] px-3 py-1.5 text-[9px] font-semibold text-amber">
          <ScanLine size={11} />
          V17C Preview
        </div>
      }
    >
      {/* V17C notice + compact status bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line bg-slate-900/40 px-5 py-2 sm:px-6">
        <p className="text-[9px] text-slate-500">
          V17C Dashboard preview：目前仍為 spec-only contract data。
        </p>
        <p className="font-mono text-[9px] text-slate-600">
          spec_only · mock_or_contract · Supabase disabled · Write false
        </p>
      </div>

      <div className="space-y-4 px-5 py-4 sm:px-6">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatChip label="合約階段" value={stats.total} />
          <StatChip
            label="資料不足"
            value={stats.dataInsufficient}
            dim={stats.dataInsufficient === 0}
          />
          <StatChip label="WARNING" value={stats.warning} dim={stats.warning === 0} />
          <StatChip
            label="公式啟用"
            value={stats.formulaActive}
            dim={stats.formulaActive === 0}
          />
        </div>

        {/* Stock preview list */}
        <div>
          {data.length === 0 ? (
            <p className="py-3 text-[10px] text-slate-600">暫無持股資料。</p>
          ) : (
            <div>
              {preview.map((item) => (
                <StockPreviewRow key={item.stockId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-end border-t border-line pt-3">
          <Link
            href="/holdings"
            className="flex items-center gap-1 text-[10px] font-semibold text-positive transition-opacity hover:opacity-80"
          >
            查看完整持股估值雷達
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}
