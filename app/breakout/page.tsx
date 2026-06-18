import { BreakoutPool } from "@/components/dashboard/breakout-pool";
import { PageHeading } from "@/components/dashboard/page-heading";
import { MarketSignal } from "@/components/dashboard/market-signal";

export default function BreakoutPage() {
  return <div className="page-wrap"><PageHeading eyebrow="Momentum radar" title="主升段候選池" description="從趨勢、量能與籌碼三個維度辨識進入加速段的強勢股票，聚焦最值得追蹤的交易節奏。" /><div className="mb-5"><BreakoutPool full /></div><MarketSignal /></div>;
}
