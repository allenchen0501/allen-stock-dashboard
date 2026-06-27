import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { CoreScore } from "@/components/dashboard/core-score";
import { PortfolioValuationRadar } from "@/components/portfolio-valuation-radar";
import { HoldingDefenseTracker } from "@/components/holding-defense-tracker";
import { IntradayDefenseTracker } from "@/components/intraday-defense-tracker";
import { RuntimePilotReadiness } from "@/components/runtime-pilot-readiness";
import { RuntimePilotMonitoring } from "@/components/runtime-pilot-monitoring";
import { FirstAuthorizedSourceDryRunMonitoring } from "@/components/first-authorized-source-dry-run-monitoring";
import { ShadowRunnerDryRunMonitoring } from "@/components/shadow-runner-dry-run-monitoring";
import { WarRoomOperationalLayout } from "@/components/war-room/war-room-operational-layout";

// V60: `/holdings` is Allen's operational war-room home. The first screen is the
// Allen War Room Operational Layout (status bar, summary, session view, Actual
// Positions / Fixed Watchlist / System Candidates). The engineering / safety
// monitoring panels are moved away from the primary trading view into a bottom
// collapsible「系統安全監控 / Engineering Safety」section (full page: /system/safety).
// Data is still fixture/mock safe mode — labeled, not operational data.

export default function HoldingsPage() {
  return (
    <div className="page-wrap">
      {/* First screen: operational war room */}
      <WarRoomOperationalLayout />

      {/* Operational fixture panels (valuation / defense) */}
      <div className="mt-5">
        <PortfolioValuationRadar />
      </div>
      <div className="mt-5">
        <HoldingDefenseTracker />
      </div>
      <div className="mt-5">
        <IntradayDefenseTracker />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_410px]">
        <HoldingsTable full />
        <CoreScore />
      </div>

      {/* Engineering safety moved away from primary trading view (collapsed). */}
      <details className="mt-8 rounded-xl border border-line bg-slate-900/30 p-4">
        <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          系統安全監控 / Engineering Safety（工程用，非操作依據；完整頁面：/system/safety）
        </summary>
        <div className="mt-4 space-y-5">
          <RuntimePilotReadiness />
          <RuntimePilotMonitoring />
          <FirstAuthorizedSourceDryRunMonitoring />
          <ShadowRunnerDryRunMonitoring />
        </div>
      </details>
    </div>
  );
}
