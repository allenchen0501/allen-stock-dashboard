import { Activity, ArrowUpRight, Info } from "lucide-react";
import { marketSpark } from "@/lib/mock-data";
import { Sparkline } from "@/components/ui/sparkline";

export function MarketSignal() {
  return (
    <section className="panel-shell relative min-h-[332px] overflow-hidden p-5 sm:p-6">
      <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-positive/[0.055] blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Market regime</p>
          <h2 className="text-[16px] font-semibold text-white">今日多空燈號</h2>
        </div>
        <button className="grid h-7 w-7 place-items-center rounded-full border border-line text-slate-600"><Info size={13} /></button>
      </div>

      <div className="relative mt-6 grid items-center gap-6 sm:grid-cols-[200px_1fr]">
        <div className="relative mx-auto h-[184px] w-[184px]">
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_220deg,#18d39e_0deg,#6ee7c3_235deg,#20262e_235deg,#20262e_360deg)] p-[9px] shadow-[0_0_35px_rgba(24,211,158,0.11)]">
            <div className="grid h-full w-full place-items-center rounded-full bg-[#090d12] ring-1 ring-inset ring-white/[0.03]">
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-1.5 text-positive"><Activity size={14} /><span className="text-[10px] font-bold tracking-[0.16em]">偏多</span></div>
                <p className="font-mono text-[42px] font-semibold leading-none tracking-[-0.06em] text-white">72</p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-slate-600">Bull score / 100</p>
              </div>
            </div>
          </div>
          <span className="absolute bottom-[9px] left-3 h-2 w-2 rounded-full bg-positive shadow-[0_0_10px_#18d39e]" />
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between border-b border-line pb-4">
            <div>
              <p className="text-[10px] text-slate-600">V8.5 多方動能</p>
              <p className="mt-1 flex items-center gap-1 font-mono text-[20px] font-semibold text-positive">+8.6% <ArrowUpRight size={15} /></p>
            </div>
            <div className="text-right"><p className="text-[10px] text-slate-600">近 20 日</p><p className="mt-1 text-[11px] text-slate-400">強於 82% 交易日</p></div>
          </div>
          <Sparkline data={marketSpark} className="h-[66px] w-full" id="market" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[{label:"趨勢",value:"多頭",color:"text-positive"},{label:"量能",value:"放大",color:"text-positive"},{label:"籌碼",value:"中性",color:"text-amber"}].map((item) => (
              <div key={item.label} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2.5">
                <p className="text-[9px] text-slate-600">{item.label}</p><p className={`mt-1 text-[11px] font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
