import { ArrowUp, BrainCircuit, CheckCircle2, CircleDot, Radar } from "lucide-react";

const dimensions = [
  { label: "趨勢動能", value: 91 },
  { label: "籌碼結構", value: 84 },
  { label: "量價關係", value: 88 },
  { label: "市場環境", value: 78 },
];

export function CoreScore() {
  return (
    <section className="panel-shell flex min-h-[332px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-5 sm:px-6">
        <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Quant model</p><h2 className="text-[16px] font-semibold text-white">V8.5 核心評分</h2></div>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-positive/10 text-positive"><BrainCircuit size={17} /></div>
      </div>
      <div className="grid flex-1 sm:grid-cols-[155px_1fr]">
        <div className="flex flex-col items-center justify-center border-b border-line p-5 sm:border-b-0 sm:border-r">
          <div className="relative grid h-28 w-28 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#20262e" strokeWidth="7" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#18d39e" strokeWidth="7" strokeLinecap="round" strokeDasharray="327" strokeDashoffset="46" />
            </svg>
            <div className="text-center"><p className="font-mono text-[33px] font-semibold leading-none text-white">86</p><p className="mt-1 text-[9px] text-slate-600">綜合分</p></div>
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-3 py-1 text-[10px] font-semibold text-positive"><CheckCircle2 size={11} />強勢區間</span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="space-y-4">
            {dimensions.map((dimension) => (
              <div key={dimension.label}>
                <div className="mb-1.5 flex justify-between text-[10px]"><span className="text-slate-500">{dimension.label}</span><span className="font-mono font-semibold text-slate-300">{dimension.value}</span></div>
                <div className="h-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gradient-to-r from-positive/60 to-positive" style={{ width: `${dimension.value}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-positive/10 bg-positive/[0.04] px-3 py-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-positive/10 text-positive"><Radar size={14} /></div>
            <div className="flex-1"><p className="text-[10px] font-medium text-slate-300">模型信心度 89%</p><p className="mt-0.5 text-[9px] text-slate-600">維持多方策略配置</p></div>
            <ArrowUp size={13} className="text-positive" />
          </div>
        </div>
      </div>
    </section>
  );
}
