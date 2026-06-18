import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { riskRewards } from "@/lib/mock-data";
import { SectionCard } from "@/components/ui/section-card";

export function RiskRanking({ full = false }: { full?: boolean }) {
  const rows = full ? riskRewards : riskRewards.slice(0, 4);
  return (
    <SectionCard title="風報比排行" eyebrow="Risk / reward" action={<Link href="/risk-reward" className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-positive">完整排行 <ChevronRight size={13} /></Link>}>
      <div className="px-4 py-2 sm:px-5">
        {rows.map((stock) => (
          <div key={stock.symbol} className="grid grid-cols-[30px_1fr_auto] items-center gap-3 border-b border-line/70 py-3.5 last:border-0">
            <span className={`grid h-6 w-6 place-items-center rounded font-mono text-[9px] font-bold ${stock.rank === 1 ? "bg-amber/15 text-amber" : "bg-white/[0.03] text-slate-600"}`}>{stock.rank.toString().padStart(2,"0")}</span>
            <div><div className="flex items-center gap-2"><p className="text-[11px] font-semibold text-slate-200">{stock.name}</p><span className="font-mono text-[9px] text-slate-600">{stock.symbol}</span></div><div className="mt-1.5 flex items-center gap-2 text-[9px] text-slate-600"><span>進 {stock.entry}</span><span className="h-2 w-px bg-line" /><span>停 {stock.stop}</span><span className="h-2 w-px bg-line" /><span>目 {stock.target}</span></div></div>
            <div className="text-right"><p className="font-mono text-[15px] font-semibold text-positive">{stock.ratio.toFixed(2)}<span className="ml-0.5 text-[9px]">R</span></p><p className="mt-0.5 text-[9px] text-slate-600">評分 {stock.score}</p></div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-line bg-positive/[0.025] px-5 py-3 text-[9px] text-slate-500"><ShieldCheck size={13} className="text-positive" /><span>僅顯示風報比 3.0 以上標的</span></div>
    </SectionCard>
  );
}
