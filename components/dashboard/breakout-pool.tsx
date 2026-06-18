import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { breakoutCandidates } from "@/lib/mock-data";
import { SectionCard } from "@/components/ui/section-card";
import { Sparkline } from "@/components/ui/sparkline";

export function BreakoutPool({ full = false }: { full?: boolean }) {
  const rows = full ? breakoutCandidates : breakoutCandidates.slice(0, 4);
  return (
    <SectionCard title="主升段候選池" eyebrow="Momentum breakout" action={<Link href="/breakout" className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-positive">候選清單 <ChevronRight size={13} /></Link>}>
      <div className={`grid gap-px bg-line ${full ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2"}`}>
        {rows.map((stock, index) => (
          <div key={stock.symbol} className="group relative min-h-[146px] bg-panel p-4 transition-colors hover:bg-[#0c1218]">
            {index === 0 && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-negative/10 px-2 py-1 text-[8px] font-bold text-negative"><Flame size={9} />HOT</span>}
            <div className="flex items-start justify-between"><div><p className="text-[12px] font-semibold text-slate-200">{stock.name}</p><p className="mt-0.5 font-mono text-[9px] text-slate-600">{stock.symbol}</p></div>{index !== 0 && <span className="rounded bg-positive/10 px-2 py-1 font-mono text-[9px] font-bold text-positive">{stock.score}</span>}</div>
            <div className="mt-3 flex items-end justify-between"><div><p className="font-mono text-[15px] font-semibold text-white">{stock.price.toLocaleString()}</p><p className="mt-1 font-mono text-[10px] text-positive">+{stock.change}%</p></div><Sparkline data={stock.spark} className="h-9 w-24" id={`pool-${stock.symbol}`} /></div>
            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-2.5 text-[9px]"><span className="text-slate-500">{stock.stage}</span><span className="text-slate-600">量 {stock.volume}x</span></div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
