import { Download, Plus, RefreshCw } from "lucide-react";

export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2"><span className="h-px w-5 bg-positive" /><p className="text-[9px] font-bold uppercase tracking-[0.22em] text-positive">{eyebrow}</p></div>
        <h1 className="text-[24px] font-semibold tracking-[-0.025em] text-white sm:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-slate-500 sm:text-[12px]">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-3 text-[10px] font-semibold text-slate-400 transition hover:text-white"><RefreshCw size={13} />更新資料</button>
        <button className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-3 text-[10px] font-semibold text-slate-400 transition hover:text-white sm:flex"><Download size={13} />匯出報表</button>
        <button className="flex h-9 items-center gap-2 rounded-lg bg-positive px-3.5 text-[10px] font-bold text-ink transition hover:bg-[#4ee2b8]"><Plus size={13} strokeWidth={2.5} />新增觀察</button>
      </div>
    </div>
  );
}
