import Link from "next/link";
import { ArrowUpRight, ChevronRight, WalletCards } from "lucide-react";
import { holdings } from "@/lib/mock-data";
import { SectionCard } from "@/components/ui/section-card";
import { Sparkline } from "@/components/ui/sparkline";

export function HoldingsTable({ full = false }: { full?: boolean }) {
  const rows = full ? holdings : holdings.slice(0, 4);
  return (
    <SectionCard
      title="持股戰情中心"
      eyebrow="Portfolio command"
      action={<Link href="/holdings" className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 transition hover:text-positive">查看全部 <ChevronRight size={13} /></Link>}
    >
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        {[{label:"總資產",value:"NT$ 3,842,680",sub:"+12.8%",up:true},{label:"今日損益",value:"+NT$ 36,420",sub:"+0.96%",up:true},{label:"未實現損益",value:"+NT$ 428,310",sub:"本月 +6.3%",up:true},{label:"資金水位",value:"82%",sub:"現金 18%",up:false}].map((item) => (
          <div key={item.label} className="bg-panel px-5 py-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">{item.label}</p>
            <p className="mt-1.5 font-mono text-[14px] font-semibold text-slate-100">{item.value}</p>
            <p className={`mt-1 text-[9px] ${item.up ? "text-positive" : "text-slate-500"}`}>{item.sub}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead><tr className="h-10 border-b border-line text-[9px] uppercase tracking-[0.12em] text-slate-600"><th className="pl-5 font-semibold sm:pl-6">持股</th><th className="font-semibold">現價</th><th className="font-semibold">漲跌幅</th><th className="font-semibold">持股損益</th><th className="font-semibold">走勢</th><th className="font-semibold">V8.5</th><th className="font-semibold">策略</th></tr></thead>
          <tbody>
            {rows.map((stock) => (
              <tr key={stock.symbol} className="group h-[65px] border-b border-line/70 transition-colors last:border-0 hover:bg-white/[0.02]">
                <td className="pl-5 sm:pl-6"><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-md border border-line bg-white/[0.02] text-[9px] font-bold text-slate-400">{stock.symbol.slice(0,2)}</div><div><p className="text-[12px] font-semibold text-slate-200">{stock.name}</p><p className="mt-0.5 font-mono text-[9px] text-slate-600">{stock.symbol} · {stock.weight}%</p></div></div></td>
                <td className="font-mono text-[11px] font-semibold text-slate-300">{stock.price.toLocaleString()}</td>
                <td className={`font-mono text-[11px] ${stock.change >= 0 ? "text-positive" : "text-negative"}`}>{stock.change >= 0 ? "+" : ""}{stock.change}%</td>
                <td><p className={`font-mono text-[11px] ${stock.pnl >= 0 ? "text-positive" : "text-negative"}`}>{stock.pnl >= 0 ? "+" : ""}{stock.pnl}%</p></td>
                <td><Sparkline data={stock.spark} positive={stock.spark.at(-1)! >= stock.spark[0]} className="h-8 w-20" id={`hold-${stock.symbol}`} /></td>
                <td><span className={`inline-flex min-w-8 justify-center rounded px-2 py-1 font-mono text-[10px] font-bold ${stock.score >= 85 ? "bg-positive/10 text-positive" : stock.score >= 75 ? "bg-amber/10 text-amber" : "bg-negative/10 text-negative"}`}>{stock.score}</span></td>
                <td><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold ${stock.signal === "加碼" ? "bg-positive/10 text-positive" : stock.signal === "減碼" ? "bg-negative/10 text-negative" : "bg-slate-700/30 text-slate-400"}`}>{stock.signal === "加碼" && <ArrowUpRight size={10} />}{stock.signal}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
