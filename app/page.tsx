import { ArrowUpRight, Clock3, Radio } from "lucide-react";
import { AvoidList } from "@/components/dashboard/avoid-list";
import { BreakoutPool } from "@/components/dashboard/breakout-pool";
import { CoreScore } from "@/components/dashboard/core-score";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { MarketSignal } from "@/components/dashboard/market-signal";
import { PageHeading } from "@/components/dashboard/page-heading";
import { RiskRanking } from "@/components/dashboard/risk-ranking";
import { PortfolioValuationRadarSummary } from "@/components/portfolio-valuation-radar-summary";
import { WarRoomDashboard } from "@/components/war-room-dashboard";

export default function DashboardPage() {
  return (
    <div className="page-wrap">
      <PageHeading eyebrow="Command center / 09:42:18" title="早安，Allen。市場正在為你說話。" description="盤勢偏多，資金聚焦 AI 伺服器與先進製程。V8.5 模型偵測到 4 檔主升段候選，今日建議維持 80% 左右持股水位。" />

      <div className="mb-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <MarketSignal />
        <CoreScore />
      </div>

      <div className="mb-5"><HoldingsTable /></div>

      <div className="mb-5">
        <WarRoomDashboard />
      </div>

      <div className="mb-5">
        <PortfolioValuationRadarSummary />
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <RiskRanking />
        <BreakoutPool />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <AvoidList />
        <section className="panel-shell relative min-h-[298px] overflow-hidden p-6">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Allen AI brief</p><h2 className="text-[16px] font-semibold text-white">今日操盤摘要</h2></div>
              <span className="inline-flex items-center gap-2 rounded-full border border-positive/15 bg-positive/[0.05] px-3 py-1.5 text-[9px] font-semibold text-positive"><Radio size={11} />即時生成</span>
            </div>
            <blockquote className="my-7 max-w-2xl text-[14px] font-medium leading-7 text-slate-300 sm:text-[16px]">「指數量價結構健康，短線關鍵在 <span className="text-positive">22,380</span> 支撐。AI 供應鏈強勢股可續抱，但高檔爆量族群避免追價。」</blockquote>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
              <div className="flex items-center gap-2 text-[9px] text-slate-600"><Clock3 size={12} /><span>最後更新 09:42</span><span className="h-2 w-px bg-line" /><span>分析 1,842 檔股票</span></div>
              <button className="flex items-center gap-1.5 text-[10px] font-semibold text-positive">閱讀完整晨報 <ArrowUpRight size={13} /></button>
            </div>
          </div>
        </section>
      </div>
      <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-line py-5 text-[9px] text-slate-700 sm:flex-row"><span>ALLEN STOCK DASHBOARD · V8.5 MODEL</span><span>資料僅供研究參考，不構成投資建議</span></footer>
    </div>
  );
}
