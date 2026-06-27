import type { WarRoomSessionStructure } from "@/use-cases/war-room/allen-war-room-data-taxonomy-contract";

// ---------------------------------------------------------------------------
// Market Session Panel — V60
//
// Presentational. Session-aware structure for 盤前 (pre-market) / 盤中 (intraday)
// / 收盤後 (after-close). Placeholder structure only — current data is
// fixture/mock and is not operational data. No fetch, no Supabase, no env, no DB.
// ---------------------------------------------------------------------------

export function MarketSessionPanel({ structures }: { structures: WarRoomSessionStructure[] }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          盤前 / 盤中 / 收盤後 模式 · Session View
        </h2>
        <p className="mt-1 text-[10px] text-slate-500">
          pre-market / intraday / after-close 結構預覽；目前非真實資料，不可作為操作依據。
        </p>
      </div>
      <div className="grid gap-3 px-5 py-5 sm:px-6 xl:grid-cols-3">
        {structures.map((s) => (
          <div key={s.session} className="rounded-xl border border-line bg-white/[0.012] p-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {s.title}（{s.session}）
            </p>
            <div className="space-y-2">
              {s.sections.map((sec) => (
                <div key={sec.sectionId}>
                  <p className="text-[10px] font-semibold text-slate-300">{sec.title}</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {sec.items.map((it, i) => (
                      <li key={i} className="text-[10px] leading-5 text-slate-500">· {it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
