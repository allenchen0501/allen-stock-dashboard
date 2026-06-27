import type { WarRoomDataVerificationState } from "@/use-cases/war-room/allen-war-room-data-taxonomy-contract";

// ---------------------------------------------------------------------------
// Data Verification Banner — V60
//
// Presentational. Shows data date / time / source / verification status. When the
// data layer is fixture/mock, it loudly states「目前非真實資料，不可作為操作依據」.
// No fetch, no Supabase, no env, no DB.
// ---------------------------------------------------------------------------

export function DataVerificationBanner({ state }: { state: WarRoomDataVerificationState }) {
  return (
    <div className="rounded-xl border border-amber/25 bg-amber/[0.05] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
          資料驗證狀態 · Data Verification
        </span>
        <span className="rounded-full border border-amber/30 bg-amber/[0.08] px-2.5 py-1 text-[9px] font-semibold text-amber">
          {state.verificationStatus}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] text-slate-400 sm:grid-cols-3">
        <span>資料日期 data date：{state.dataDate}</span>
        <span>資料時間 data time：{state.dataTime}</span>
        <span>資料來源 data source：{state.dataSource}</span>
      </div>
      <p className="mt-2 text-[11px] font-semibold text-negative">
        ⚠ {state.notOperationalDataWarning}（fixture/mock）。final website must use real data before operational use。
      </p>
    </div>
  );
}
