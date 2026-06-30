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
import { buildRealQuoteSourceConflictResolutionPolicyContract } from "@/use-cases/war-room/build-real-quote-source-conflict-resolution-policy-contract";
import { buildConflictToTradePlanVerificationContract } from "@/use-cases/war-room/build-conflict-to-trade-plan-verification-contract";
import { buildDowngradedTradePlanUiBehaviorContract } from "@/use-cases/war-room/build-downgraded-trade-plan-ui-behavior-contract";
import { buildUnifiedConnectionEvidenceLedgerContract } from "@/use-cases/war-room/build-unified-connection-evidence-ledger-contract";
import { buildEvidenceLedgerTransitionContract } from "@/use-cases/war-room/build-evidence-ledger-transition-contract";
import { buildLedgerIntegrityRollupContract } from "@/use-cases/war-room/build-ledger-integrity-rollup-contract";
import { buildSafetyChainCiGuardContract } from "@/use-cases/war-room/build-safety-chain-ci-guard-contract";
import { buildPhase2LockedImplementationContract } from "@/use-cases/war-room/build-phase-2-locked-implementation-contract";
import { buildShadowQuoteComparisonViewModel } from "@/use-cases/war-room/build-shadow-quote-comparison-view-model";
import { ShadowQuoteComparisonCard } from "@/components/war-room/shadow-quote-comparison-card";
import { buildStagingShadowRuntimeContract } from "@/use-cases/war-room/build-shadow-runtime-comparison";
import { buildGoldenSnapshotContract } from "@/use-cases/war-room/build-golden-snapshot-contract";
import { buildMockFetchBoundaryContract } from "@/use-cases/war-room/build-mock-fetch-boundary-contract";
import { buildDefaultNoFetchBoundaryContract } from "@/use-cases/war-room/build-default-no-fetch-boundary-contract";
import { buildTimeoutBoundaryContract } from "@/use-cases/war-room/build-timeout-boundary-contract";

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
  const conflict = buildRealQuoteSourceConflictResolutionPolicyContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const allConflictOpFalse = conflict.sampleResolutionResults.every((r) => r.operationalUseAllowed === false);
  const allConflictSignoffNotDone = conflict.sampleResolutionResults.every((r) => r.manualSignoffCompleted === false);
  const downgrade = buildConflictToTradePlanVerificationContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const allDowngradeOpFalse = downgrade.sampleDowngradeResults.every((r) => r.operationalUseAllowed === false);
  const allDowngradeObservation = downgrade.sampleDowngradeResults.every((r) => r.observationOnly === true);
  const allDowngradeSignoffNotDone = downgrade.sampleDowngradeResults.every((r) => r.manualSignoffCompleted === false);
  const uiBehavior = buildDowngradedTradePlanUiBehaviorContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const allUiOpFalse = uiBehavior.uiStates.every((s) => s.operationalUseAllowed === false);
  const allUiObservation = uiBehavior.uiStates.every((s) => s.observationOnly === true);
  const allUiSignoffNotDone = uiBehavior.uiStates.every((s) => s.manualSignoffCompleted === false);
  const ledger = buildUnifiedConnectionEvidenceLedgerContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const ledgerPendingCount = ledger.evidenceCategories.reduce((sum, c) => sum + c.pendingCount, 0);
  const ledgerCompletedCount = ledger.evidenceCategories.reduce((sum, c) => sum + c.completedCount, 0);
  const transition = buildEvidenceLedgerTransitionContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const allSourceContractsExist = transition.sourceContractIntegrityItems.every((s) => s.sourceContractExists === true);
  const rollup = buildLedgerIntegrityRollupContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const ciGuard = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const phase2 = buildPhase2LockedImplementationContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const shadowVm = buildShadowQuoteComparisonViewModel({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const shadowRuntime = buildStagingShadowRuntimeContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const golden = buildGoldenSnapshotContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const mockBoundary = buildMockFetchBoundaryContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const defaultNoFetch = buildDefaultNoFetchBoundaryContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  const timeoutBoundary = buildTimeoutBoundaryContract({ generatedAt: "2026-06-23T00:00:00.000Z" });

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
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Real Quote Source Conflict Resolution Policy（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {conflict.specName}（{conflict.contractVersion}）· policyMode = {conflict.policyMode}。
              deterministic conflict resolution / fixture-only：no runtime、no fetch、no Supabase connection、no env read、no DB write、no API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Conflict rules</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{conflict.conflictRules.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Sample resolutions</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{conflict.sampleResolutionResults.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allConflictOpFalse ? "text-positive" : "text-negative"}`}>
                operationalUseAllowed false {String(allConflictOpFalse)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">sign-off / production</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                manualSignoffCompleted {String(!allConflictSignoffNotDone ? true : false)} · productionSwitchAllowed{" "}
                {String(conflict.productionReady)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">connection</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                realDataConnected {String(conflict.realDataConnected)} · fetchPerformed {String(conflict.fetchPerformed)} ·
                supabaseConnected {String(conflict.supabaseConnected)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              多來源衝突解析尚未接真實資料，fixture 區間不可作為正式操作依據（degraded / BLOCKED_NOT_CONNECTED）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Conflict to Trade Plan Verification Downgrade（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {downgrade.specName}（{downgrade.contractVersion}）· matrixMode = {downgrade.matrixMode}。
              deterministic / fixture-only：no runtime、no fetch、no Supabase connection、no env read、no DB write、no API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Downgrade rules</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{downgrade.downgradeRules.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Sample downgrades</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{downgrade.sampleDowngradeResults.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allDowngradeObservation ? "text-positive" : "text-negative"}`}>
                observationOnly true {String(allDowngradeObservation)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">operational / sign-off</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                operationalUseAllowed false {String(allDowngradeOpFalse)} · manualSignoffCompleted{" "}
                {String(!allDowngradeSignoffNotDone)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production / connection</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                productionSwitchAllowed {String(downgrade.productionReady)} · realDataConnected{" "}
                {String(downgrade.realDataConnected)} · fetchPerformed {String(downgrade.fetchPerformed)} ·
                supabaseConnected {String(downgrade.supabaseConnected)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              來源衝突或缺值時，承接區會降級為觀察，不可作為正式操作依據（VERIFIED 為 future-only，不在目前 sample 使用）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Downgraded Trade Plan UI Behavior（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {uiBehavior.specName}（{uiBehavior.contractVersion}）· behaviorMode = {uiBehavior.behaviorMode}。
              deterministic / fixture-only：no runtime、no fetch、no Supabase connection、no env read、no DB write、no API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">UI states</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{uiBehavior.uiStates.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allUiObservation ? "text-positive" : "text-negative"}`}>
                observationOnly true {String(allUiObservation)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">operational / sign-off</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                operationalUseAllowed false {String(allUiOpFalse)} · manualSignoffCompleted {String(!allUiSignoffNotDone)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                productionSwitchAllowed {String(uiBehavior.productionReady)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">connection</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                realDataConnected {String(uiBehavior.realDataConnected)} · fetchPerformed {String(uiBehavior.fetchPerformed)} ·
                supabaseConnected {String(uiBehavior.supabaseConnected)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              依 TradePlanDisplayMode 決定承接區 / 目標區 / 風報比顯示或隱藏；這不是買賣指令，不可作為正式操作依據。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Unified Connection Evidence Ledger（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {ledger.specName}（{ledger.contractVersion}）· ledgerMode = {ledger.ledgerMode} · decision ={" "}
              <span className="font-semibold text-negative">{ledger.decision}</span>。
              deterministic / spec-only：no runtime、no fetch、no Supabase connection、no env read、no DB write、no API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Evidence items</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{ledger.evidenceItems.length}</p>
              <p className="mt-1 text-[9px] text-slate-600">pending {ledgerPendingCount} · completed {ledgerCompletedCount}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">connection allowed</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                staging {String(ledger.stagingConnectionAllowed)} · realQuote {String(ledger.realQuoteConnectionAllowed)} ·
                production {String(ledger.productionSwitchAllowed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">sign-off / evidence</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                manualSignoffCompleted {String(ledger.manualSignoffCompleted)} · actualEvidenceAttached{" "}
                {String(ledger.actualEvidenceAttached)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">connection</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                realDataConnected {String(ledger.realDataConnected)} · supabaseConnected {String(ledger.supabaseConnected)} ·
                productionReady {String(ledger.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              真實行情與 staging 連線仍需人工 evidence，不可作為正式操作依據（V64–V69 evidence 收斂為單一 ledger）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Evidence Ledger Transition Engine（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {transition.specName}（{transition.contractVersion}）· transitionMode = {transition.transitionMode} ·
              decision = <span className="font-semibold text-negative">{transition.decision}</span>。
              deterministic / preview-only：no runtime、no fetch、no Supabase connection、no env read、no DB write、no API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Preview results</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{transition.transitionPreviewResults.length}</p>
              <p className="mt-1 text-[9px] text-slate-600">actualLedgerMutated {String(transition.actualLedgerMutated)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Source contract integrity</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{transition.sourceContractIntegrityItems.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allSourceContractsExist ? "text-positive" : "text-negative"}`}>
                all exist {String(allSourceContractsExist)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">ledger after preview</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                ledgerDecisionAfterPreview {transition.ledgerDecisionAfterPreview}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">connection</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                staging {String(transition.recalculationResult.stagingConnectionAllowed)} · realQuote{" "}
                {String(transition.recalculationResult.realQuoteConnectionAllowed)} · production{" "}
                {String(transition.recalculationResult.productionSwitchAllowed)} · productionReady{" "}
                {String(transition.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              即使 preview 單項 evidence，真實行情與 staging 連線仍維持鎖定（actualLedgerMutated false、ledger decision NO_GO）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Ledger Integrity Rollup & Safety Gate（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {rollup.specName}（{rollup.contractVersion}）· rollupMode = {rollup.rollupMode} · decision ={" "}
              <span className="font-semibold text-negative">{rollup.decision}</span>。
              deterministic / spec-only：no runtime、no fetch、no Supabase connection、no env read、no DB write、no API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Rollup items</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{rollup.rollupItems.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${rollup.allSourceContractsExist ? "text-positive" : "text-negative"}`}>
                sourceIntegrityOk {String(rollup.sourceIntegrityOk)} · allSourceContractsExist {String(rollup.allSourceContractsExist)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Safety gate blockers</p>
              <p className="mt-1 text-[14px] font-semibold text-negative">{rollup.safetyGateBlockers.length}</p>
              <p className="mt-1 text-[9px] text-slate-600">allEvidencePending {String(rollup.allEvidencePending)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">preview / mutation</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                allTransitionsPreviewOnly {String(rollup.allTransitionsPreviewOnly)} · actualLedgerMutated{" "}
                {String(rollup.actualLedgerMutated)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">connection</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                staging {String(rollup.stagingConnectionAllowed)} · realQuote {String(rollup.realQuoteConnectionAllowed)} ·
                production {String(rollup.productionSwitchAllowed)} · productionReady {String(rollup.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              source contracts 完整，但 evidence 全部 pending，真實行情仍鎖定（{rollup.safetyGateBlockers.length} 個 safety gate blocker 未解除）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Safety Chain CI Guard（spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {ciGuard.specName}（{ciGuard.contractVersion}）· guardMode = SPEC_ONLY_CI_GUARD · decision ={" "}
              <span className={ciGuard.result.allCriticalPassed ? "font-semibold text-positive" : "font-semibold text-negative"}>
                {ciGuard.decision}
              </span>
              。READY_FOR_UI_REVIEW is not production ready。Phase 2 + Phase 2b + Staging Shadow Runtime Scaffold + Limited Live Fetch Scope + Limited Live Fetch Implementation + Golden Snapshot + Mock Fetch Boundary + Default No-Fetch + Timeout Boundary included（{ciGuard.result.totalChecks} checks）。manual smoke script is NOT part of the safety chain。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">Chain checks</p>
              <p className={`mt-1 text-[14px] font-semibold ${ciGuard.result.allCriticalPassed ? "text-positive" : "text-negative"}`}>
                {ciGuard.result.passedChecks}/{ciGuard.result.totalChecks}
              </p>
              <p className="mt-1 text-[9px] text-slate-600">allCriticalPassed {String(ciGuard.result.allCriticalPassed)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">runtime / no-go locks</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                allRuntimeFlagsFalse {String(ciGuard.result.allRuntimeFlagsFalse)} · allNoGoLocksPreserved{" "}
                {String(ciGuard.result.allNoGoLocksPreserved)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">operational / production</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                allOperationalUseBlocked {String(ciGuard.result.allOperationalUseBlocked)} · productionSwitchStillBlocked{" "}
                {String(ciGuard.result.productionSwitchStillBlocked)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production ready</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">productionReady {String(ciGuard.productionReady)}</p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              一個指令彙總 V60–V72 安全鏈；任何 commit 偷翻 NO_GO / runtime / production switch 旗標即被攔下（npm run test:safety-chain）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Phase 2 Locked Real Quote Interface（interface-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              PHASE_2_LOCKED_INTERFACE · INTERFACE_ONLY_NOT_CONNECTED · decision ={" "}
              <span className="font-semibold text-negative">{phase2.decision}</span>。
              DisabledRealQuoteProvider；real quote interface 已定義但未連線：no fetch、no env read、no Supabase connection、no real market data、no API route、no order-execution source。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">default mode</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{phase2.defaultRealDataMode}</p>
              <p className="mt-1 text-[9px] text-slate-600">
                shadowModeAllowed {String(phase2.shadowModeAllowed)} · realReadonlyAllowed {String(phase2.realReadonlyAllowed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">providers</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                {phase2.providerCatalog.map((p) => `${p.providerId}:${p.status}`).join(" · ")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">connection</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                realDataConnected {String(phase2.realDataConnected)} · fetchPerformed {String(phase2.fetchPerformed)} ·
                supabaseConnected {String(phase2.supabaseConnected)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">sample shadow</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                missingRealQuote {String(phase2.sampleShadowComparison.missingRealQuote)} · operationalUseAllowed{" "}
                {String(phase2.sampleShadowComparison.operationalUseAllowed)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              interface 已鎖定：shadow mode still locked、real-readonly still locked；shadow 衝突 / 缺值映射回 V67 / V68 / V69 降級鏈（observation only）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <ShadowQuoteComparisonCard vm={shadowVm} />
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Staging Shadow Runtime Scaffold（scaffold-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {shadowRuntime.contractVersion} · mode = SCAFFOLD_ONLY_NOT_CONNECTED · decision ={" "}
              <span className="font-semibold text-negative">NO_GO</span>。Yahoo / TWSE / TPEx provider 皆 scaffold-only / NOT_CONNECTED：
              no live fetch、no env read、no Supabase connection、no API route、no order、no broker。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">default mode</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{shadowRuntime.defaultRealDataMode}</p>
              <p className="mt-1 text-[9px] text-slate-600">shadowRuntimeAllowed={String(shadowRuntime.shadowRuntimeAllowed)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">runtime gates</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                liveFetchAllowed={String(shadowRuntime.liveFetchAllowed)} · envReadAllowed={String(shadowRuntime.envReadAllowed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">connection gates</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                supabaseConnectionAllowed={String(shadowRuntime.supabaseConnectionAllowed)} · portfolioApiSwitchAllowed=
                {String(shadowRuntime.portfolioApiSwitchAllowed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                productionReady={String(shadowRuntime.productionReady)} · serviceRoleForbidden=
                {String(shadowRuntime.serviceRoleForbidden)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              scaffold only：providers 不 fetch / 不讀 env / 不連線；下一階段需再次 owner approval 才能 limited live fetch dry-run。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Limited Live Fetch Dry-run（approved provider only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              approvedProvider = TWSE_TPEX · symbol = 3019 · channel = tse_3019.tw · shadow-only。
              此卡為靜態說明，**不會執行 live fetch**：app 預設 dryRunLiveFetch=false。實際 dry-run 僅能由 manual smoke
              script（npm run smoke:limited-live-fetch:3019）觸發。GET only、timeout=3000ms、maxRetries=0、field allowlist、
              任何失敗 fallback disabled scaffold candidate。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">approved provider</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">TWSE_TPEX</p>
              <p className="mt-1 text-[9px] text-slate-600">symbol=3019 · shadowOnly=true</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">default mode</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">fixture</p>
              <p className="mt-1 text-[9px] text-slate-600">app 不會預設 live fetch</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">operational / portfolio</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                operationalUseAllowed=false · portfolioApiSwitchAllowed=false
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">productionReady=false</p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              isConnected 只代表 source fetch 成功，不代表 operational；no Supabase、no env read、no DB write、no API route、
              no broker API、no buy/sell command、no auto order；not production ready。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Golden Snapshot Validator for Limited Live Fetch（offline / deterministic）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {golden.contractVersion} · mode = OFFLINE_DETERMINISTIC_PARSER_SNAPSHOT · 已納入 safety chain（共 {ciGuard.result.totalChecks} checks）。
              offline deterministic parser validation：success snapshot + baseline fallback + {golden.fallbackMatrixCaseCount}-case fallback matrix。
              此卡為靜態說明，**不會執行 live fetch、不跑 smoke、no production switch**。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">offline / deterministic</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                offline={String(golden.offline)} · deterministic={String(golden.deterministic)} · parserSnapshot={String(golden.parserSnapshot)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">live / smoke</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                liveFetchPerformed={String(golden.liveFetchPerformed)} · smokeManualOnly={String(golden.smokeManualOnly)} · smokeInvoked={String(golden.smokeInvoked)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">matrix / scope</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                fallbackMatrix={golden.fallbackMatrixCaseCount} · symbol={golden.symbol} · channel={golden.channel}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                productionDataSwitchAllowed={String(golden.productionDataSwitchAllowed)} · operationalUseAllowed={String(golden.operationalUseAllowed)} · productionReady={String(golden.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              parser success / fallback / fallback matrix 以固定 mock + 注入 clock 驗證，純離線；smoke 永遠 manual only、不在 safety chain。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Mock Fetch Boundary Validator for Limited Live Fetch（offline / mock fetch only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {mockBoundary.contractVersion} · mode = OFFLINE_DETERMINISTIC_REQUEST_BOUNDARY · 已納入 safety chain（共 {ciGuard.result.totalChecks} checks）。
              攔截 globalThis.fetch（mock fetch only），驗證 request 僅打 approved channel tse_3019.tw、method GET，以及 unsupported symbol / fetch error / malformed response 安全 fallback。
              此卡為靜態說明，**no real network、no live fetch、no smoke、no production switch**。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">offline / mock</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                offline={String(mockBoundary.offline)} · mockFetchOnly={String(mockBoundary.mockFetchOnly)} · realNetworkUsed={String(mockBoundary.realNetworkUsed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">fetch / smoke</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                fetchMockRestored={String(mockBoundary.fetchMockRestored)} · liveFetchPerformed={String(mockBoundary.liveFetchPerformed)} · smokeManualOnly={String(mockBoundary.smokeManualOnly)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">boundary cases</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                successCase={String(mockBoundary.fetchCalledOnceForSuccessCase)} · unsupported={String(mockBoundary.unsupportedSymbolSafeFallback)} · error={String(mockBoundary.fetchErrorSafeFallback)} · malformed={String(mockBoundary.malformedResponseSafeFallback)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                productionDataSwitchAllowed={String(mockBoundary.productionDataSwitchAllowed)} · operationalUseAllowed={String(mockBoundary.operationalUseAllowed)} · productionReady={String(mockBoundary.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              request boundary 以攔截 fetch + 注入 clock 驗證，純離線、不打真網路；smoke 永遠 manual only、不在 safety chain。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Default No-Fetch Boundary Validator for Limited Live Fetch（offline / default runtime path）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {defaultNoFetch.contractVersion} · mode = OFFLINE_DETERMINISTIC_DEFAULT_RUNTIME_PATH · 已納入 safety chain（共 {ciGuard.result.totalChecks} checks）。
              spy globalThis.fetch，驗證 default runtime path（無 dryRunLiveFetch=true）的 fetch call count = 0、回 safe scaffold/disabled/non-operational candidate。
              此卡為靜態說明，**no real network、no live fetch、no smoke、no production switch**。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">offline / default path</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                offline={String(defaultNoFetch.offline)} · defaultRuntimePath={String(defaultNoFetch.defaultRuntimePath)} · dryRunLiveFetchDefault={String(defaultNoFetch.dryRunLiveFetchDefault)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">fetch call count</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                defaultPath={defaultNoFetch.defaultPathFetchCallCount} · explicitFalse={defaultNoFetch.explicitDryRunFalseFetchCallCount} · realNetworkUsed={String(defaultNoFetch.realNetworkUsed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">fallback / smoke</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                unsupportedSafeFallback={String(defaultNoFetch.unsupportedSymbolDefaultPathSafeFallback)} · fetchMockRestored={String(defaultNoFetch.fetchMockRestored)} · smokeManualOnly={String(defaultNoFetch.smokeManualOnly)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                productionDataSwitchAllowed={String(defaultNoFetch.productionDataSwitchAllowed)} · operationalUseAllowed={String(defaultNoFetch.operationalUseAllowed)} · productionReady={String(defaultNoFetch.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              default runtime path 以 spy fetch 驗證 0 次 fetch；只有明確 dryRunLiveFetch=true 才會 live fetch（manual smoke only，不在 safety chain）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Timeout Boundary Validator for Limited Live Fetch（offline / timeout abort fallback）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {timeoutBoundary.contractVersion} · mode = OFFLINE_DETERMINISTIC_TIMEOUT_BOUNDARY · 已納入 safety chain（共 {ciGuard.result.totalChecks} checks）。
              mock globalThis.fetch + 假化 3000ms abort timer，驗證 timeout / abort 後安全 fallback、不產生 operational quote。
              此卡為靜態說明，**no real network、no live fetch、no smoke、no production switch**。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">offline / timeout</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                offline={String(timeoutBoundary.offline)} · timeoutBoundary={String(timeoutBoundary.timeoutBoundary)} · timeoutMs={timeoutBoundary.timeoutMs} · maxRetries={timeoutBoundary.maxRetries}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">abort fallback</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                timeoutAbortSafeFallback={String(timeoutBoundary.timeoutAbortSafeFallback)} · receivedAtDeterministic={String(timeoutBoundary.receivedAtDeterministic)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">network / restore</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                realNetworkUsed={String(timeoutBoundary.realNetworkUsed)} · fetchMockRestored={String(timeoutBoundary.fetchMockRestored)} · setTimeoutRestored={String(timeoutBoundary.setTimeoutRestored)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">production</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                productionDataSwitchAllowed={String(timeoutBoundary.productionDataSwitchAllowed)} · operationalUseAllowed={String(timeoutBoundary.operationalUseAllowed)} · productionReady={String(timeoutBoundary.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              timeout / abort 以 mock fetch + 假化 abort timer 驗證（不等真 3000ms、不打真網路）；測後還原 fetch 與 setTimeout；smoke 永遠 manual only、不在 safety chain。
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
