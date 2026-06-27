import { PageHeading } from "@/components/dashboard/page-heading";
import { RuntimePilotReadiness } from "@/components/runtime-pilot-readiness";
import { RuntimePilotMonitoring } from "@/components/runtime-pilot-monitoring";
import { FirstAuthorizedSourceDryRunMonitoring } from "@/components/first-authorized-source-dry-run-monitoring";
import { ShadowRunnerDryRunMonitoring } from "@/components/shadow-runner-dry-run-monitoring";

// V60: dedicated engineering / safety monitoring page. The fixture-only spec /
// runtime / shadow-runner monitoring panels live here, moved away from the primary
// trading view (`/holdings`). These existing monitoring components are unchanged —
// only relocated. Still fixture/mock safe mode: no Supabase, no env, no DB,
// no real market data, no /api/portfolio switch.

export default function SystemSafetyPage() {
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Engineering Safety"
        title="系統安全監控 / Engineering Safety"
        description="工程安全監控面板（spec-only / fixture-only / mock_or_contract）。此頁為工程用途，非操作交易依據；目前非真實資料，不可作為操作依據。"
      />
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
    </div>
  );
}
