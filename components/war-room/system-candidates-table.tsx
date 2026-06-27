import type { WarRoomSystemCandidate } from "@/use-cases/war-room/allen-war-room-data-taxonomy-contract";

// ---------------------------------------------------------------------------
// System Candidates Table — V60
//
// System-screened opportunities (technical / chips / risk-reward). 系統候選股不等於持股
// (system candidate is not position). Never shown in actual position PnL / asset
// level / position risk. No fetch, no Supabase, no env, no DB.
// ---------------------------------------------------------------------------

export function SystemCandidatesTable({ candidates }: { candidates: WarRoomSystemCandidate[] }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          系統機會池 · System Candidates
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-amber">系統候選股不等於持股（system candidate is not position）。</p>
      </div>
      <div className="overflow-x-auto px-2 py-3 sm:px-4">
        <table className="w-full min-w-[860px] border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-line text-left text-slate-500">
              <th className="px-2 py-1.5">股票</th>
              <th className="px-2 py-1.5">候選原因</th>
              <th className="px-2 py-1.5">技術條件</th>
              <th className="px-2 py-1.5">風報比狀態</th>
              <th className="px-2 py-1.5">逢低布局區</th>
              <th className="px-2 py-1.5">確認條件</th>
              <th className="px-2 py-1.5">失效條件</th>
              <th className="px-2 py-1.5">今日建議</th>
              <th className="px-2 py-1.5">資料狀態</th>
            </tr>
          </thead>
          <tbody className="font-mono text-slate-300">
            {candidates.map((c) => (
              <tr key={c.stockId} className="border-b border-line/40 last:border-0">
                <td className="px-2 py-1.5 text-slate-100">{c.symbol} {c.name}</td>
                <td className="px-2 py-1.5">{c.candidateReason}</td>
                <td className="px-2 py-1.5">{c.technicalCondition}</td>
                <td className="px-2 py-1.5">{c.riskRewardStatus}</td>
                <td className="px-2 py-1.5">{c.lowEntryZone}</td>
                <td className="px-2 py-1.5">{c.confirmCondition}</td>
                <td className="px-2 py-1.5">{c.invalidationCondition}</td>
                <td className="px-2 py-1.5 text-amber">{c.todayAction}</td>
                <td className="px-2 py-1.5">{c.dataVerificationStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
