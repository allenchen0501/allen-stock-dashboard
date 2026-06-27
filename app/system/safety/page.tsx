import { PageHeading } from "@/components/dashboard/page-heading";
import { RuntimePilotReadiness } from "@/components/runtime-pilot-readiness";
import { RuntimePilotMonitoring } from "@/components/runtime-pilot-monitoring";
import { FirstAuthorizedSourceDryRunMonitoring } from "@/components/first-authorized-source-dry-run-monitoring";
import { ShadowRunnerDryRunMonitoring } from "@/components/shadow-runner-dry-run-monitoring";
import { buildAllenScoreDeterministicScoringEngineContract } from "@/use-cases/war-room/build-allen-score-deterministic-scoring-engine-contract";
import { buildStructuredCandidateTradePlanContract } from "@/use-cases/war-room/build-structured-candidate-trade-plan-contract";
import { buildCandidatePriceLevelFixtureSourceContract } from "@/use-cases/war-room/build-candidate-price-level-fixture-source-contract";
import { buildDescriptorToRealQuoteMappingContract } from "@/use-cases/war-room/build-descriptor-to-real-quote-mapping-contract";
import { buildAuthorizedRealQuoteFieldCatalogContract } from "@/use-cases/war-room/build-authorized-real-quote-field-catalog-contract";

// V60: dedicated engineering / safety monitoring page. The fixture-only spec /
// runtime / shadow-runner monitoring panels live here, moved away from the primary
// trading view (`/holdings`). These existing monitoring components are unchanged —
// only relocated. V63 adds a spec-only Allen Score engine / trade plan consistency
// health card (deterministic, no runtime). Still fixture/mock safe mode: no
// Supabase, no env, no DB, no real market data, no /api/portfolio switch.

export default function SystemSafetyPage() {
  const engine = buildAllenScoreDeterministicScoringEngineContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const tradePlan = buildStructuredCandidateTradePlanContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const fixtureSource = buildCandidatePriceLevelFixtureSourceContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const engineConsistent = Object.values(engine.consistency).every((v) => v === true);
  const validPlans = tradePlan.validations.filter((v) => v.valid).length;
  const validDescriptors = fixtureSource.validations.filter((v) => v.valid).length;
  const mb = fixtureSource.mappingBoundary;
  const mapping = buildDescriptorToRealQuoteMappingContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const mappingItem = mapping.mappingItems[0];
  const validMappings = mapping.validations.filter((v) => v.valid).length;
  const catalog = buildAuthorizedRealQuoteFieldCatalogContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const allSourcesNotConnected = catalog.sourceCandidates.every((s) => s.connectionStatus === "NOT_CONNECTED");
  const allRuntimeDisabled = catalog.sourceCandidates.every((s) => s.runtimeEnabled === false);
  const allFetchDisallowed = catalog.sourceCandidates.every((s) => s.fetchAllowed === false);
  const sb = catalog.sourceBoundary;

  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Engineering Safety"
        title="系統安全監控 / Engineering Safety"
        description="工程安全監控面板（spec-only / fixture-only / mock_or_contract）。此頁為工程用途，非操作交易依據；目前非真實資料，不可作為操作依據。"
      />
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Allen Score Engine / Trade Plan Consistency（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              deterministic / fixture-only。no runtime、no fetch、no Supabase connection、no env read、no DB write。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Scoring engine ({engine.contractVersion})</p>
              <p className={`mt-1 text-[14px] font-semibold ${engineConsistent ? "text-positive" : "text-negative"}`}>
                grade↔score {engineConsistent ? "verified" : "NOT verified"}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Trade plans ({tradePlan.contractVersion})</p>
              <p className={`mt-1 text-[14px] font-semibold ${tradePlan.allValid ? "text-positive" : "text-negative"}`}>
                {validPlans}/{tradePlan.validations.length} valid
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Decision</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-200">{tradePlan.decision}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Mode</p>
              <p className="mt-1 text-[12px] font-semibold text-amber">fixture/mock，不可作為正式操作依據</p>
            </div>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Trade Plan Fixture Source / Mapping Boundary（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              fixture source descriptor + future real quote mapping boundary（{fixtureSource.contractVersion}）。
              deterministic / fixture-only：no runtime、no fetch、no Supabase connection、no env read、no DB write。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Descriptors valid</p>
              <p className={`mt-1 text-[14px] font-semibold ${fixtureSource.allValid ? "text-positive" : "text-negative"}`}>
                {validDescriptors}/{fixtureSource.validations.length}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">realMappingStatus</p>
              <p className="mt-1 text-[14px] font-semibold text-amber">{fixtureSource.source.realMappingStatus}</p>
              <p className="mt-1 text-[9px] text-slate-600">未連真實報價</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Manual sign-off</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                required {String(mb.manualSignoffRequired)} · completed {String(mb.manualSignoffCompleted)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Production switch</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                allowed {String(mb.productionSwitchAllowed)} · staging read-only {String(mb.stagingReadOnlyRequired)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">{mb.mappingNotConnectedReason}</p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Descriptor-to-Real Quote Mapping Readiness（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {mapping.specName}（{mapping.contractVersion}）。deterministic / fixture-only：no runtime、no fetch、
              no Supabase connection、no env read、no DB write、no API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Mapping items valid</p>
              <p className={`mt-1 text-[14px] font-semibold ${mapping.allValid ? "text-positive" : "text-negative"}`}>
                {validMappings}/{mapping.validations.length}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">mappingReadiness</p>
              <p className="mt-1 text-[12px] font-semibold text-amber">{mappingItem?.mappingReadiness}</p>
              <p className="mt-1 text-[9px] text-slate-600">realMappingStatus = {mappingItem?.realMappingStatus}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">realQuote / staging</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                realQuoteConnected {String(mappingItem?.realQuoteConnected)} · stagingReadOnlyConnected{" "}
                {String(mappingItem?.stagingReadOnlyConnected)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">shadow / production / op</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                shadowComparisonCompleted {String(mappingItem?.shadowComparisonCompleted)} · productionSwitchAllowed{" "}
                {String(mappingItem?.productionSwitchAllowed)} · operationalUseAllowed{" "}
                {String(mappingItem?.operationalUseAllowed)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              futureRealQuoteField → CandidatePriceLevelDescriptor field → CandidateTradePlan field（spec-only）；
              尚未連真實行情，fixture 區間不可作為正式操作依據。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Authorized Real Quote Field Catalog（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {catalog.specName}（{catalog.contractVersion}）· sourceCatalogMode = {catalog.sourceCatalogMode}。
              deterministic / fixture-only：no runtime、no fetch、no Supabase connection、no env read、no DB write、no API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Source candidates</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{catalog.sourceCandidates.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allSourcesNotConnected ? "text-positive" : "text-negative"}`}>
                all NOT_CONNECTED {String(allSourcesNotConnected)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Field catalog items</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{catalog.fieldCatalogItems.length}</p>
              <p className="mt-1 text-[9px] text-slate-600">
                runtimeEnabled false {String(allRuntimeDisabled)} · fetchAllowed false {String(allFetchDisallowed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">sign-off / staging / shadow</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                manualSignoffCompleted {String(sb.manualSignoffCompleted)} · stagingReadOnlyConnected{" "}
                {String(sb.stagingReadOnlyConnected)} · shadowComparisonCompleted {String(sb.shadowComparisonCompleted)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production / service role</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                productionSwitchAllowed {String(sb.productionSwitchAllowed)} · serviceRoleAllowedInAppRuntime{" "}
                {String(sb.serviceRoleAllowedInAppRuntime)} · writeOperationsAllowed {String(sb.writeOperationsAllowed)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              尚未授權任何真實行情來源，fixture 區間不可作為正式操作依據（operationalUseAllowed false）。
            </p>
          </div>
        </section>
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
    </div>
  );
}
