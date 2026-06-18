import { AvoidList } from "@/components/dashboard/avoid-list";
import { PageHeading } from "@/components/dashboard/page-heading";
import { RiskRanking } from "@/components/dashboard/risk-ranking";

export default function AvoidPage() {
  return <div className="page-wrap"><PageHeading eyebrow="Capital protection" title="今日禁碰股" description="辨識技術面轉弱、籌碼鬆動與產業逆風標的。先避開不對稱風險，才有餘裕等真正的機會。" /><div className="grid gap-5 xl:grid-cols-[1fr_1fr]"><AvoidList full /><RiskRanking /></div></div>;
}
