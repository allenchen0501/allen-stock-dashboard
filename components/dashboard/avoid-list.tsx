import Link from "next/link";
import { AlertOctagon, ChevronRight } from "lucide-react";
import { avoidStocks } from "@/lib/mock-data";
import { SectionCard } from "@/components/ui/section-card";

export function AvoidList({ full = false }: { full?: boolean }) {
  const rows = full ? avoidStocks : avoidStocks.slice(0, 5);
  return (
    <SectionCard title="今日禁碰 TOP5" eyebrow="Risk alert" action={<Link href="/avoid" className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-negative">風險詳情 <ChevronRight size={13} /></Link>}>
      <div className="px-4 py-2 sm:px-5">
        {rows.map((stock) => (
          <div key={stock.symbol} className="grid grid-cols-[27px_1fr_auto] items-center gap-3 border-b border-line/70 py-3 last:border-0">
            <span className="grid h-6 w-6 place-items-center rounded bg-negative/[0.07] font-mono text-[9px] font-bold text-negative">{stock.rank}</span>
            <div><div className="flex items-center gap-2"><p className="text-[11px] font-semibold text-slate-300">{stock.name}</p><span className="font-mono text-[9px] text-slate-600">{stock.symbol}</span></div><p className="mt-1 text-[9px] text-slate-600">{stock.reason}</p></div>
            <div className="text-right"><p className="font-mono text-[11px] text-negative">{stock.change}%</p><p className="mt-1 inline-flex items-center gap-1 text-[8px] font-semibold text-negative/80"><AlertOctagon size={9} />{stock.risk}</p></div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
