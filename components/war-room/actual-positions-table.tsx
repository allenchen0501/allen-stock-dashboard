import type { WarRoomActualPosition } from "@/use-cases/war-room/allen-war-room-data-taxonomy-contract";

// ---------------------------------------------------------------------------
// Actual Positions Table — V60
//
// CORE table: ONLY Allen's actually-entered holdings. Watchlist / system
// candidates must NEVER appear here. PnL is shown ONLY when shares + averageCost
// are known; otherwise the row shows「持股資料待補」and no fabricated PnL /
// position size. No fetch, no Supabase, no env, no DB.
// ---------------------------------------------------------------------------

function cell(value: string | number | null, fallback = "持股資料待補"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function ActualPositionsTable({ positions }: { positions: WarRoomActualPosition[] }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          我的實際持股 · Actual Positions
        </h2>
        <p className="mt-1 text-[10px] text-slate-500">
          actual positions are entered holdings only。沒有股數與成本不得計算損益（no fake PnL / no fake position size）。
        </p>
      </div>
      <div className="overflow-x-auto px-2 py-3 sm:px-4">
        <table className="w-full min-w-[860px] border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-line text-left text-slate-500">
              <th className="px-2 py-1.5">股票</th>
              <th className="px-2 py-1.5">股數</th>
              <th className="px-2 py-1.5">均價</th>
              <th className="px-2 py-1.5">最新有效價</th>
              <th className="px-2 py-1.5">市值</th>
              <th className="px-2 py-1.5">未實現損益</th>
              <th className="px-2 py-1.5">防守線</th>
              <th className="px-2 py-1.5">停損區</th>
              <th className="px-2 py-1.5">加碼區</th>
              <th className="px-2 py-1.5">目標區</th>
              <th className="px-2 py-1.5">風報比</th>
              <th className="px-2 py-1.5">今日動作</th>
              <th className="px-2 py-1.5">驗證狀態</th>
            </tr>
          </thead>
          <tbody className="font-mono text-slate-300">
            {positions.map((p) => (
              <tr key={p.stockId} className="border-b border-line/40 last:border-0">
                <td className="px-2 py-1.5 text-slate-100">{p.symbol} {p.name}</td>
                <td className="px-2 py-1.5">{p.sharesKnown ? cell(p.shares) : "持股資料待補"}</td>
                <td className="px-2 py-1.5">{p.averageCostKnown ? cell(p.averageCost) : "持股資料待補"}</td>
                <td className="px-2 py-1.5">{p.latestPriceValid ? cell(p.latestPrice) : "真實報價未接入"}</td>
                <td className="px-2 py-1.5">{p.pnlComputable ? cell(p.marketValue) : "不可計算損益"}</td>
                <td className="px-2 py-1.5">{p.pnlComputable ? cell(p.unrealizedPnl) : "不可計算損益"}</td>
                <td className="px-2 py-1.5">{cell(p.defenseLine)}</td>
                <td className="px-2 py-1.5">{cell(p.stopLossZone)}</td>
                <td className="px-2 py-1.5">{cell(p.addOnZone)}</td>
                <td className="px-2 py-1.5">{cell(p.targetZone)}</td>
                <td className="px-2 py-1.5">{cell(p.riskReward)}</td>
                <td className="px-2 py-1.5 text-amber">{p.todayAction}</td>
                <td className="px-2 py-1.5">{p.dataVerificationStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-5 pb-4 text-[10px] leading-5 text-slate-500 sm:px-6">
        4966 譜瑞 / 2743 山富：Allen 已表示進場，但 repo 無股數與成本，標示「持股資料待補」，
        等待 broker / user input / Supabase staging data，不假算損益。
      </p>
    </section>
  );
}
