import { AlertCircle, Database, FileX2, ScanLine, ShieldAlert, Wifi } from "lucide-react";
import { buildPortfolioValuationSummaryContract } from "@/use-cases/portfolio/build-valuation-summary-contract";
import { SectionCard } from "@/components/ui/section-card";
import type {
  PortfolioActionSignal,
  PortfolioValuationDataQualityStatus,
  PortfolioValuationSummaryItem,
  PortfolioValuationTier,
} from "@/use-cases/portfolio/valuation-summary-contract";

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

function Dash() {
  return <span className="font-mono text-[10px] text-slate-600">—</span>;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[9px] text-slate-600">{label}</span>
      <span className="text-right font-mono text-[10px] text-slate-400 truncate">{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

function ValuationTierBadge({ tier }: { tier: PortfolioValuationTier }) {
  if (tier === "資料不足") {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-semibold bg-slate-700/40 text-slate-500">
        資料不足
      </span>
    );
  }
  const colorMap: Record<string, string> = {
    特價: "bg-positive/10 text-positive",
    便宜: "bg-positive/[0.07] text-positive",
    合理: "bg-slate-700/30 text-slate-400",
    昂貴: "bg-amber/10 text-amber",
    瘋狂: "bg-negative/10 text-negative",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-semibold ${colorMap[tier] ?? "bg-slate-700/30 text-slate-400"}`}
    >
      {tier}
    </span>
  );
}

function ActionSignalBadge({ signal }: { signal: PortfolioActionSignal }) {
  if (signal === "資料不足") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold bg-slate-700/30 text-slate-500">
        等待資料
      </span>
    );
  }
  const colorMap: Record<string, string> = {
    觀察: "bg-slate-700/30 text-slate-400",
    可分批: "bg-positive/10 text-positive",
    續抱: "bg-positive/[0.07] text-positive",
    減碼觀察: "bg-amber/10 text-amber",
    避開: "bg-negative/10 text-negative",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${colorMap[signal] ?? "bg-slate-700/30 text-slate-400"}`}
    >
      {signal}
    </span>
  );
}

function DataQualityBadge({ status }: { status: PortfolioValuationDataQualityStatus }) {
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

// ---------------------------------------------------------------------------
// Summary stat card
// ---------------------------------------------------------------------------

function SummaryCard({ label, value, dim }: { label: string; value: number; dim?: boolean }) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-white/[0.015] px-4 py-3">
      <span className={`font-mono text-[22px] font-bold leading-none ${dim ? "text-slate-600" : "text-slate-300"}`}>
        {value}
      </span>
      <span className="mt-1.5 text-[9px] text-slate-600">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual radar card (one per stock)
// ---------------------------------------------------------------------------

function RadarCard({ item }: { item: PortfolioValuationSummaryItem }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-white/[0.02] p-4">
      {/* Identity + quality status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-200">{item.stockName}</p>
          <p className="mt-0.5 font-mono text-[9px] text-slate-500">
            {item.stockId} · {item.market}
          </p>
        </div>
        <DataQualityBadge status={item.dataQualityStatus} />
      </div>

      {/* Tier + signal badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <ValuationTierBadge tier={item.valuationTier} />
        <ActionSignalBadge signal={item.actionSignal} />
      </div>

      {/* 資料不足 sub-labels */}
      {item.valuationTier === "資料不足" && (
        <p className="mt-1 text-[8px] text-slate-600">估值公式尚未啟用</p>
      )}

      {/* Detail fields */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-line/60 pt-3">
        <FieldRow label="現價">{item.price !== null ? item.price : <Dash />}</FieldRow>
        <FieldRow label="漲跌幅">
          {item.changePercent !== null ? `${item.changePercent}%` : <Dash />}
        </FieldRow>
        <FieldRow label="平均成本">{item.avgCost !== null ? item.avgCost : <Dash />}</FieldRow>
        <FieldRow label="未實現損益">
          {item.unrealizedPnL !== null ? item.unrealizedPnL : <Dash />}
        </FieldRow>
        <FieldRow label="損益率">
          {item.unrealizedPnLPercent !== null ? `${item.unrealizedPnLPercent}%` : <Dash />}
        </FieldRow>
        <FieldRow label="風報比">
          {item.riskRewardRatio !== null ? item.riskRewardRatio : <Dash />}
        </FieldRow>
        <FieldRow label="技術訊號">
          {item.technicalStatus !== null ? item.technicalStatus : <Dash />}
        </FieldRow>
        <FieldRow label="籌碼訊號">
          {item.capitalFlowStatus !== null ? item.capitalFlowStatus : <Dash />}
        </FieldRow>
        <FieldRow label="新聞訊號">
          {item.newsSignal !== null ? item.newsSignal : <Dash />}
        </FieldRow>
        <FieldRow label="事件風險">
          {item.eventRisk !== null ? item.eventRisk : <Dash />}
        </FieldRow>
      </div>

      {/* Valuation reason */}
      {item.valuationReason && (
        <p className="mt-2 text-[8px] leading-relaxed text-slate-600">{item.valuationReason}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PortfolioValuationRadar() {
  const { data, metadata } = buildPortfolioValuationSummaryContract();

  const radarSummary = {
    total: data.length,
    dataInsufficient: data.filter((d) => d.valuationTier === "資料不足").length,
    formulaActive: data.filter((d) => d.valuationTier !== "資料不足").length,
    warningCount: data.filter((d) => d.dataQualityStatus === "WARNING").length,
  };

  return (
    <SectionCard
      title="Allen 持股估值雷達"
      eyebrow="Valuation radar · Spec-only"
      action={
        <div className="flex items-center gap-1.5 rounded-full border border-amber/20 bg-amber/[0.04] px-3 py-1.5 text-[9px] font-semibold text-amber">
          <ScanLine size={11} />
          V17B Shell
        </div>
      }
    >
      {/* Compact metadata status bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-slate-900/40 px-5 py-2 text-[9px] text-slate-500 sm:px-6">
        <span className="font-semibold text-amber/80">V17B Shell</span>
        <span className="text-slate-700">·</span>
        <span className="font-mono">spec_only</span>
        <span className="text-slate-700">·</span>
        <span className="font-mono">mock_or_contract</span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1">
          <Wifi size={9} />
          Supabase disabled
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1">
          <Database size={9} />
          Write false
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1">
          <FileX2 size={9} />
          Valuation table not created
        </span>
        <span className="text-slate-700">·</span>
        <span className="font-mono">v={metadata.api_contract_version}</span>
      </div>

      {/* Summary cards */}
      <div className="summaryCards grid grid-cols-2 gap-3 border-b border-line px-5 py-4 sm:grid-cols-4 sm:px-6">
        <SummaryCard label="合約階段檔數" value={radarSummary.total} />
        <SummaryCard
          label="資料不足檔數"
          value={radarSummary.dataInsufficient}
          dim={radarSummary.dataInsufficient === 0}
        />
        <SummaryCard
          label="公式啟用檔數"
          value={radarSummary.formulaActive}
          dim={radarSummary.formulaActive === 0}
        />
        <SummaryCard
          label="WARNING 檔數"
          value={radarSummary.warningCount}
          dim={radarSummary.warningCount === 0}
        />
      </div>

      {/* Spec-only notice */}
      <div className="flex items-start gap-2 border-b border-line bg-amber/[0.025] px-5 py-2.5 sm:px-6">
        <AlertCircle size={11} className="mt-0.5 flex-shrink-0 text-amber" />
        <p className="text-[9px] leading-relaxed text-amber/80">
          Spec-only UI shell：目前為資料合約階段，估值公式尚未啟用。所有估值欄位（forwardPE、fairPrice、cheapPrice、expensivePrice）待公式確認後啟用。
        </p>
      </div>

      {/* Radar card grid (2 col md, 3 col xl) */}
      <div className="valuationCards grid grid-cols-1 gap-4 px-5 py-4 sm:px-6 md:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => (
          <RadarCard key={item.stockId} item={item} />
        ))}
      </div>

      {/* Safety notice */}
      <div className="border-t border-line px-5 pb-5 pt-3 sm:px-6">
        <div className="flex items-start gap-2 rounded-lg border border-line bg-white/[0.01] px-4 py-3">
          <ShieldAlert size={12} className="mt-0.5 flex-shrink-0 text-slate-600" />
          <p className="text-[9px] leading-relaxed text-slate-600">
            V17B UI shell：僅用於確認資料欄位與畫面配置；不構成投資建議，不會自動產生買賣指令。
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
