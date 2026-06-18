import { Bell, CalendarDays, ChevronDown, Command, Menu, Search } from "lucide-react";
import { marketIndices } from "@/lib/mock-data";

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-line bg-ink/90 px-4 backdrop-blur-xl sm:px-6 lg:ml-[232px] lg:px-8">
        <button className="mr-3 grid h-10 w-10 place-items-center rounded-lg border border-line text-slate-400 lg:hidden"><Menu size={19} /></button>
        <div className="hidden items-center gap-2 text-[12px] text-slate-500 md:flex">
          <CalendarDays size={15} />
          <span>2026 年 6 月 18 日</span>
          <span className="mx-2 h-3 w-px bg-line" />
          <span className="inline-flex items-center gap-2 font-medium text-positive"><span className="h-1.5 w-1.5 rounded-full bg-positive shadow-[0_0_8px_#18d39e]" />台股盤中</span>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden h-9 w-[230px] items-center gap-2 rounded-lg border border-line bg-white/[0.025] px-3 xl:flex">
            <Search size={14} className="text-slate-600" />
            <span className="text-[11px] text-slate-600">搜尋股票代號 / 名稱</span>
            <kbd className="ml-auto flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[9px] text-slate-600"><Command size={9} />K</kbd>
          </div>
          <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-500 transition hover:text-white">
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-negative" />
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-2.5 text-[11px] font-medium text-slate-300">
            <span className="grid h-5 w-5 place-items-center rounded bg-slate-700 text-[8px]">AL</span>
            <span className="hidden sm:inline">Allen</span>
            <ChevronDown size={12} className="text-slate-600" />
          </button>
        </div>
      </header>
      <div className="overflow-hidden border-b border-line bg-[#080c11] lg:ml-[232px]">
        <div className="flex h-9 min-w-max items-center gap-8 px-6 lg:px-8">
          <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">Market pulse <Gauge size={12} /></span>
          {marketIndices.map((index) => (
            <div key={index.name} className="flex items-center gap-2.5 font-mono text-[10px]">
              <span className="text-slate-500">{index.name}</span>
              <span className="font-semibold text-slate-200">{index.value}</span>
              <span className={index.change >= 0 ? "text-positive" : "text-negative"}>{index.change >= 0 ? "+" : ""}{index.change}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
