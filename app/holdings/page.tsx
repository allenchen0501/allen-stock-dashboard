import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { PageHeading } from "@/components/dashboard/page-heading";
import { CoreScore } from "@/components/dashboard/core-score";
import { PortfolioValuationRadar } from "@/components/portfolio-valuation-radar";
import { HoldingDefenseTracker } from "@/components/holding-defense-tracker";
import { IntradayDefenseTracker } from "@/components/intraday-defense-tracker";
import { RuntimePilotReadiness } from "@/components/runtime-pilot-readiness";
import { RuntimePilotMonitoring } from "@/components/runtime-pilot-monitoring";
import { FirstAuthorizedSourceDryRunMonitoring } from "@/components/first-authorized-source-dry-run-monitoring";
import { ShadowRunnerDryRunMonitoring } from "@/components/shadow-runner-dry-run-monitoring";

export default function HoldingsPage() {
  return (
    <div className="page-wrap">
      <PageHeading eyebrow="Portfolio command" title="持股戰情中心" description="集中掌握持倉績效、部位權重與 V8.5 策略信號，讓每一個決策都有清楚依據。" />
      <div className="mt-5">
        <PortfolioValuationRadar />
      </div>
      <div className="mt-5">
        <HoldingDefenseTracker />
      </div>
      <div className="mt-5">
        <IntradayDefenseTracker />
      </div>
      <div className="mt-5">
        <RuntimePilotReadiness />
      </div>
      <div className="mt-5">
        <RuntimePilotMonitoring />
      </div>
      <div className="mt-5">
        <FirstAuthorizedSourceDryRunMonitoring />
      </div>
      <div className="mt-5">
        <ShadowRunnerDryRunMonitoring />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_410px]">
        <HoldingsTable full />
        <CoreScore />
      </div>
    </div>
  );
}
