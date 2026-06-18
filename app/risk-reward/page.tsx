import { PageHeading } from "@/components/dashboard/page-heading";
import { RiskRanking } from "@/components/dashboard/risk-ranking";
import { BreakoutPool } from "@/components/dashboard/breakout-pool";

export default function RiskRewardPage() {
  return <div className="page-wrap"><PageHeading eyebrow="Risk intelligence" title="風報比中心" description="以進場、停損與目標價計算潛在報酬，優先鎖定下檔可控、上檔空間充足的交易機會。" /><div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]"><RiskRanking full /><BreakoutPool full /></div></div>;
}
