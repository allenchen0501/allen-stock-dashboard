import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { PageHeading } from "@/components/dashboard/page-heading";
import { CoreScore } from "@/components/dashboard/core-score";
import { PortfolioValuationRadar } from "@/components/portfolio-valuation-radar";
import { HoldingDefenseTracker } from "@/components/holding-defense-tracker";

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
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_410px]">
        <HoldingsTable full />
        <CoreScore />
      </div>
    </div>
  );
}
