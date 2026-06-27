import type { WarRoomWatchlistItem } from "@/use-cases/war-room/allen-war-room-data-taxonomy-contract";

// ---------------------------------------------------------------------------
// Fixed Watchlist Table — V60
//
// Tracked stocks Allen designated. 追蹤股不等於持股 (watchlist is not position).
// Never shown as a holding unless it ALSO exists in Actual Positions. No fetch,
// no Supabase, no env, no DB.
// ---------------------------------------------------------------------------

export function FixedWatchlistTable({ items }: { items: WarRoomWatchlistItem[] }) {
  return (
    <section className="panel-shell overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
          固定追蹤池 · Fixed Watchlist
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-amber">追蹤股不等於持股（watchlist is not position）。</p>
      </div>
      <div className="overflow-x-auto px-2 py-3 sm:px-4">
        <table className="w-full min-w-[820px] border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-line text-left text-slate-500">
              <th className="px-2 py-1.5">股票</th>
              <th className="px-2 py-1.5">最新有效價</th>
              <th className="px-2 py-1.5">趨勢</th>
              <th className="px-2 py-1.5">技術狀態</th>
              <th className="px-2 py-1.5">關鍵支撐</th>
              <th className="px-2 py-1.5">關鍵壓力</th>
              <th className="px-2 py-1.5">承接區</th>
              <th className="px-2 py-1.5">觀察條件</th>
              <th className="px-2 py-1.5">今日狀態</th>
              <th className="px-2 py-1.5">接近可布局</th>
              <th className="px-2 py-1.5">資料狀態</th>
            </tr>
          </thead>
          <tbody className="font-mono text-slate-300">
            {items.map((w) => (
              <tr key={w.stockId} className="border-b border-line/40 last:border-0">
                <td className="px-2 py-1.5 text-slate-100">{w.symbol} {w.name}</td>
                <td className="px-2 py-1.5">{w.latestPriceValid ? String(w.latestPrice) : "未接入"}</td>
                <td className="px-2 py-1.5">{w.trend}</td>
                <td className="px-2 py-1.5">{w.technicalStatus}</td>
                <td className="px-2 py-1.5">{w.keySupport}</td>
                <td className="px-2 py-1.5">{w.keyResistance}</td>
                <td className="px-2 py-1.5">{w.accumulationZone}</td>
                <td className="px-2 py-1.5">{w.watchCondition}</td>
                <td className="px-2 py-1.5">{w.todayStatus}</td>
                <td className="px-2 py-1.5">{w.nearEntry ? "接近" : "等待"}</td>
                <td className="px-2 py-1.5">{w.dataVerificationStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
