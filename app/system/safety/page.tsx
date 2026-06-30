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
// trading view (`/holdings`). The page is engineering-only and fixture/mock safe mode:
// no Supabase, no env, no DB, no real market data, no /api/portfolio switch.
//
// 前台顯示文字一律繁體中文；技術狀態碼 / contract key / mode 代碼（例如
// NOT_CONNECTED、SPEC_ONLY_CI_GUARD、PHASE_2_LOCKED_INTERFACE）保留為技術標記，
// 旁邊以繁中說明。底層 contract key 不更動。

/** 將布林值轉成繁中狀態文字，避免前台直接顯示 true / false。 */
function zhBool(value: boolean, trueText = "是", falseText = "否"): string {
  return value ? trueText : falseText;
}

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
        eyebrow="工程安全監控"
        title="系統安全監控"
        description="工程安全監控面板（spec-only 規格檢查／fixture-only 固定樣本／mock_or_contract）。此頁為工程用途，非操作交易依據；目前非真實資料，不可作為操作依據。"
      />
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Allen 評分引擎／交易計畫一致性（spec-only 規格檢查）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              可重現 / 固定樣本。不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">評分引擎（{engine.contractVersion}）</p>
              <p className={`mt-1 text-[14px] font-semibold ${engineConsistent ? "text-positive" : "text-negative"}`}>
                等級↔分數 {engineConsistent ? "已驗證" : "未通過"}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">交易計畫（{tradePlan.contractVersion}）</p>
              <p className={`mt-1 text-[14px] font-semibold ${tradePlan.allValid ? "text-positive" : "text-negative"}`}>
                {validPlans}/{tradePlan.validations.length} 通過
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">判定</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-200">{tradePlan.decision}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">模式</p>
              <p className="mt-1 text-[12px] font-semibold text-amber">fixture/mock 固定樣本，不可作為正式操作依據</p>
            </div>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              交易計畫 fixture 來源／對應邊界（Mapping Boundary，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              fixture 來源描述欄位 + 未來真實報價對應邊界（{fixtureSource.contractVersion}）。
              可重現 / 固定樣本：不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">描述欄位通過數</p>
              <p className={`mt-1 text-[14px] font-semibold ${fixtureSource.allValid ? "text-positive" : "text-negative"}`}>
                {validDescriptors}/{fixtureSource.validations.length}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">真實對應狀態（realMappingStatus）</p>
              <p className="mt-1 text-[14px] font-semibold text-amber">{fixtureSource.source.realMappingStatus}</p>
              <p className="mt-1 text-[9px] text-slate-600">未連真實報價</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">人工簽核</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                需要 {zhBool(mb.manualSignoffRequired)} · 已完成 {zhBool(mb.manualSignoffCompleted)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式切換</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                允許 {zhBool(mb.productionSwitchAllowed, "是", "禁止")} · staging 唯讀 {zhBool(mb.stagingReadOnlyRequired, "需要", "否")}
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
              描述欄位對應真實報價準備狀態（Descriptor-to-Real Quote Mapping Readiness，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {mapping.specName}（{mapping.contractVersion}）。可重現 / 固定樣本：不啟用 runtime、不 fetch、
              不連 Supabase、不讀 env、不寫 DB、不新增 API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">對應項目通過數</p>
              <p className={`mt-1 text-[14px] font-semibold ${mapping.allValid ? "text-positive" : "text-negative"}`}>
                {validMappings}/{mapping.validations.length}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">對應準備度（mappingReadiness）</p>
              <p className="mt-1 text-[12px] font-semibold text-amber">{mappingItem?.mappingReadiness}</p>
              <p className="mt-1 text-[9px] text-slate-600">真實對應狀態（realMappingStatus）= {mappingItem?.realMappingStatus}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">真實報價／staging</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                真實報價已連線 {zhBool(!!mappingItem?.realQuoteConnected)} · staging 唯讀已連線{" "}
                {zhBool(!!mappingItem?.stagingReadOnlyConnected)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">影子／正式／操作</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                影子比對已完成 {zhBool(!!mappingItem?.shadowComparisonCompleted)} · 正式切換允許{" "}
                {zhBool(!!mappingItem?.productionSwitchAllowed, "是", "禁止")} · operationalUseAllowed 操作允許{" "}
                {zhBool(!!mappingItem?.operationalUseAllowed, "是", "禁止")}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              未來真實報價欄位 → 候選價位描述欄位 → 候選交易計畫欄位（spec-only 規格）；
              尚未連真實行情，fixture 區間不可作為正式操作依據。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              授權真實報價欄位目錄（Authorized Real Quote Field Catalog，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {catalog.specName}（{catalog.contractVersion}）· 來源目錄模式 sourceCatalogMode = {catalog.sourceCatalogMode}。
              可重現 / 固定樣本：不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB、不新增 API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">來源候選</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{catalog.sourceCandidates.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allSourcesNotConnected ? "text-positive" : "text-negative"}`}>
                全部 NOT_CONNECTED 未連線 {zhBool(allSourcesNotConnected)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">欄位目錄項目</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{catalog.fieldCatalogItems.length}</p>
              <p className="mt-1 text-[9px] text-slate-600">
                runtime 未啟用 {zhBool(allRuntimeDisabled)} · fetch 禁止 {zhBool(allFetchDisallowed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">簽核／staging／影子</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                人工簽核完成 {zhBool(sb.manualSignoffCompleted)} · staging 唯讀已連線{" "}
                {zhBool(sb.stagingReadOnlyConnected)} · 影子比對完成 {zhBool(sb.shadowComparisonCompleted)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式／service role</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                正式切換允許 {zhBool(sb.productionSwitchAllowed, "是", "禁止")} · app runtime 用 service role{" "}
                {zhBool(sb.serviceRoleAllowedInAppRuntime, "是", "禁止")} · 寫入操作 {zhBool(sb.writeOperationsAllowed, "是", "禁止")}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              尚未授權任何真實行情來源，fixture 區間不可作為正式操作依據（operationalUseAllowed 操作允許＝否）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              真實報價來源衝突處理規則（Real Quote Source Conflict Resolution Policy，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {conflict.specName}（{conflict.contractVersion}）· 規則模式 policyMode = {conflict.policyMode}。
              可重現衝突處理 / 固定樣本：不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB、不新增 API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">衝突規則</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{conflict.conflictRules.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">範例解析</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{conflict.sampleResolutionResults.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allConflictOpFalse ? "text-positive" : "text-negative"}`}>
                operationalUseAllowed 操作允許＝否 {zhBool(allConflictOpFalse)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">簽核／正式</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                人工簽核完成 {zhBool(!allConflictSignoffNotDone)} · 正式切換允許{" "}
                {zhBool(conflict.productionReady, "是", "禁止")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">連線狀態</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                真實資料已連線 {zhBool(conflict.realDataConnected)} · 已 fetch {zhBool(conflict.fetchPerformed)} ·
                Supabase 已連線 {zhBool(conflict.supabaseConnected)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              多來源衝突解析尚未接真實資料，fixture 區間不可作為正式操作依據（degraded 降級 / BLOCKED_NOT_CONNECTED 未連線）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              衝突對交易計畫的驗證降級（Conflict to Trade Plan Verification Downgrade，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {downgrade.specName}（{downgrade.contractVersion}）· 矩陣模式 matrixMode = {downgrade.matrixMode}。
              可重現 / 固定樣本：不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB、不新增 API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">降級規則</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{downgrade.downgradeRules.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">範例降級</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{downgrade.sampleDowngradeResults.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allDowngradeObservation ? "text-positive" : "text-negative"}`}>
                observationOnly 僅觀察＝是 {zhBool(allDowngradeObservation)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">操作／簽核</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                operationalUseAllowed 操作允許＝否 {zhBool(allDowngradeOpFalse)} · 人工簽核完成{" "}
                {zhBool(!allDowngradeSignoffNotDone)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式／連線</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                正式切換允許 {zhBool(downgrade.productionReady, "是", "禁止")} · 真實資料已連線{" "}
                {zhBool(downgrade.realDataConnected)} · 已 fetch {zhBool(downgrade.fetchPerformed)} ·
                Supabase 已連線 {zhBool(downgrade.supabaseConnected)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              來源衝突或缺值時，承接區會降級為觀察，不可作為正式操作依據（VERIFIED 已驗證為 future-only 未來限定，不在目前 sample 使用）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              降級交易計畫的介面行為（Downgraded Trade Plan UI Behavior，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {uiBehavior.specName}（{uiBehavior.contractVersion}）· 行為模式 behaviorMode = {uiBehavior.behaviorMode}。
              可重現 / 固定樣本：不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB、不新增 API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">介面狀態</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{uiBehavior.uiStates.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allUiObservation ? "text-positive" : "text-negative"}`}>
                observationOnly 僅觀察＝是 {zhBool(allUiObservation)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">操作／簽核</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                operationalUseAllowed 操作允許＝否 {zhBool(allUiOpFalse)} · 人工簽核完成 {zhBool(!allUiSignoffNotDone)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式環境</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                正式切換允許 {zhBool(uiBehavior.productionReady, "是", "禁止")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">連線狀態</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                真實資料已連線 {zhBool(uiBehavior.realDataConnected)} · 已 fetch {zhBool(uiBehavior.fetchPerformed)} ·
                Supabase 已連線 {zhBool(uiBehavior.supabaseConnected)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              依交易計畫顯示模式決定承接區／目標區／風報比顯示或隱藏；這不是買賣指令，不可作為正式操作依據。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              統一連線證據帳本（Unified Connection Evidence Ledger，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {ledger.specName}（{ledger.contractVersion}）· 帳本模式 ledgerMode = {ledger.ledgerMode} · 判定 ={" "}
              <span className="font-semibold text-negative">{ledger.decision}</span>。
              可重現 / 規格檢查：不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB、不新增 API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">證據項目</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{ledger.evidenceItems.length}</p>
              <p className="mt-1 text-[9px] text-slate-600">待處理 {ledgerPendingCount} · 已完成 {ledgerCompletedCount}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">連線允許</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                staging {zhBool(ledger.stagingConnectionAllowed, "允許", "禁止")} · 真實報價 {zhBool(ledger.realQuoteConnectionAllowed, "允許", "禁止")} ·
                正式 {zhBool(ledger.productionSwitchAllowed, "允許", "禁止")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">簽核／證據</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                人工簽核完成 {zhBool(ledger.manualSignoffCompleted)} · actualEvidenceAttached 實際證據已附{" "}
                {zhBool(ledger.actualEvidenceAttached)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">連線狀態</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                真實資料已連線 {zhBool(ledger.realDataConnected)} · Supabase 已連線 {zhBool(ledger.supabaseConnected)} ·
                正式就緒 {zhBool(ledger.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              真實行情與 staging 連線仍需人工證據，不可作為正式操作依據（V64–V69 證據收斂為單一帳本）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              證據帳本狀態轉移引擎（Evidence Ledger Transition Engine，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {transition.specName}（{transition.contractVersion}）· 轉移模式 transitionMode = {transition.transitionMode} ·
              判定 = <span className="font-semibold text-negative">{transition.decision}</span>。
              可重現 / 僅預覽：不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB、不新增 API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">預覽結果</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{transition.transitionPreviewResults.length}</p>
              <p className="mt-1 text-[9px] text-slate-600">actualLedgerMutated 帳本實際變更 {zhBool(transition.actualLedgerMutated)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">來源合約完整性</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{transition.sourceContractIntegrityItems.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${allSourceContractsExist ? "text-positive" : "text-negative"}`}>
                全部存在 {zhBool(allSourceContractsExist)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">預覽後帳本</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                預覽後帳本判定 {transition.ledgerDecisionAfterPreview}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">連線狀態</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                staging {zhBool(transition.recalculationResult.stagingConnectionAllowed, "允許", "禁止")} · 真實報價{" "}
                {zhBool(transition.recalculationResult.realQuoteConnectionAllowed, "允許", "禁止")} · 正式{" "}
                {zhBool(transition.recalculationResult.productionSwitchAllowed, "允許", "禁止")} · 正式就緒{" "}
                {zhBool(transition.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              即使預覽單項證據，真實行情與 staging 連線仍維持鎖定（actualLedgerMutated 帳本實際變更＝否、帳本判定 NO_GO 不可放行）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              帳本完整性彙整與安全閘（Ledger Integrity Rollup & Safety Gate，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {rollup.specName}（{rollup.contractVersion}）· 彙整模式 rollupMode = {rollup.rollupMode} · 判定 ={" "}
              <span className="font-semibold text-negative">{rollup.decision}</span>。
              可重現 / 規格檢查：不啟用 runtime、不 fetch、不連 Supabase、不讀 env、不寫 DB、不新增 API route。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">彙整項目</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{rollup.rollupItems.length}</p>
              <p className={`mt-1 text-[9px] font-semibold ${rollup.allSourceContractsExist ? "text-positive" : "text-negative"}`}>
                來源完整性正常 {zhBool(rollup.sourceIntegrityOk)} · 來源合約全部存在 {zhBool(rollup.allSourceContractsExist)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">安全閘阻擋項（safetyGateBlockers）</p>
              <p className="mt-1 text-[14px] font-semibold text-negative">{rollup.safetyGateBlockers.length}</p>
              <p className="mt-1 text-[9px] text-slate-600">所有證據待處理 {zhBool(rollup.allEvidencePending)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">預覽／變更</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                所有轉移僅預覽 {zhBool(rollup.allTransitionsPreviewOnly)} · actualLedgerMutated 帳本實際變更{" "}
                {zhBool(rollup.actualLedgerMutated)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">連線狀態</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                staging {zhBool(rollup.stagingConnectionAllowed, "允許", "禁止")} · 真實報價 {zhBool(rollup.realQuoteConnectionAllowed, "允許", "禁止")} ·
                正式 {zhBool(rollup.productionSwitchAllowed, "允許", "禁止")} · 正式就緒 {zhBool(rollup.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              來源合約完整，但證據全部待處理，真實行情仍鎖定（{rollup.safetyGateBlockers.length} 個安全閘阻擋項未解除）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              安全鏈 CI 防護（Safety Chain CI Guard，spec-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {ciGuard.specName}（{ciGuard.contractVersion}）· 防護模式 guardMode = SPEC_ONLY_CI_GUARD · 判定 ={" "}
              <span className={ciGuard.result.allCriticalPassed ? "font-semibold text-positive" : "font-semibold text-negative"}>
                {ciGuard.decision}
              </span>
              （CI 防護已就緒，但尚未達正式環境就緒）。涵蓋 Phase 2 + Phase 2b + Staging 影子執行環境鷹架 + 受限即時抓取範圍 + 受限即時抓取實作 + 黃金快照驗證 + 模擬請求邊界驗證 + 預設不請求邊界驗證 + 逾時／中止邊界驗證（共 {ciGuard.result.totalChecks} 項檢查）。手動 smoke script 不納入安全鏈。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">安全鏈檢查</p>
              <p className={`mt-1 text-[14px] font-semibold ${ciGuard.result.allCriticalPassed ? "text-positive" : "text-negative"}`}>
                {ciGuard.result.passedChecks}/{ciGuard.result.totalChecks}
              </p>
              <p className="mt-1 text-[9px] text-slate-600">所有關鍵檢查通過 {zhBool(ciGuard.result.allCriticalPassed)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">runtime／NO_GO 鎖定</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                所有 runtime 旗標為否 {zhBool(ciGuard.result.allRuntimeFlagsFalse)} · 所有 NO_GO 鎖定保留{" "}
                {zhBool(ciGuard.result.allNoGoLocksPreserved)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">操作／正式</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                所有操作使用已封鎖 {zhBool(ciGuard.result.allOperationalUseBlocked)} · productionSwitchStillBlocked 正式切換仍封鎖{" "}
                {zhBool(ciGuard.result.productionSwitchStillBlocked)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式就緒</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">正式就緒 productionReady {zhBool(ciGuard.productionReady)}</p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              一個指令彙總 V60–V72 安全鏈；任何 commit 偷翻 NO_GO（不可放行）／runtime／正式切換旗標即被攔下（npm run test:safety-chain）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              Phase 2 鎖定真實報價介面（interface-only，僅介面未連線）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              PHASE_2_LOCKED_INTERFACE · INTERFACE_ONLY_NOT_CONNECTED · 判定 ={" "}
              <span className="font-semibold text-negative">{phase2.decision}</span>。
              DisabledRealQuoteProvider；真實報價介面已定義但未連線：不 fetch、不讀 env、不連 Supabase、無真實行情、不新增 API route、無下單來源。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">預設模式</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{phase2.defaultRealDataMode}</p>
              <p className="mt-1 text-[9px] text-slate-600">
                影子模式允許 {zhBool(phase2.shadowModeAllowed, "是", "禁止")} · 真實唯讀允許 {zhBool(phase2.realReadonlyAllowed, "是", "禁止")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">報價來源</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                {phase2.providerCatalog.map((p) => `${p.providerId}:${p.status}`).join(" · ")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">連線狀態</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                真實資料已連線 {zhBool(phase2.realDataConnected)} · 已 fetch {zhBool(phase2.fetchPerformed)} ·
                Supabase 已連線 {zhBool(phase2.supabaseConnected)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">影子比對範例</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                缺真實報價 {zhBool(phase2.sampleShadowComparison.missingRealQuote)} · operationalUseAllowed 操作允許{" "}
                {zhBool(phase2.sampleShadowComparison.operationalUseAllowed, "是", "禁止")}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              介面已鎖定：影子模式仍鎖定、真實唯讀仍鎖定；影子衝突／缺值映射回 V67／V68／V69 降級鏈（僅觀察）。
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
              Staging 影子執行環境鷹架（Staging Shadow Runtime Scaffold，scaffold-only）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {shadowRuntime.contractVersion} · 模式 mode = SCAFFOLD_ONLY_NOT_CONNECTED · 判定 ={" "}
              <span className="font-semibold text-negative">NO_GO</span>（不可放行）。Yahoo／TWSE／TPEx 來源皆為鷹架／未連線：
              不 live fetch、不讀 env、不連 Supabase、不新增 API route、不下單、不接券商。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">預設模式</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">{shadowRuntime.defaultRealDataMode}</p>
              <p className="mt-1 text-[9px] text-slate-600">影子執行環境允許 {zhBool(shadowRuntime.shadowRuntimeAllowed, "是", "禁止")}</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">runtime 閘門</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                live fetch 允許 {zhBool(shadowRuntime.liveFetchAllowed, "是", "禁止")} · 讀 env 允許 {zhBool(shadowRuntime.envReadAllowed, "是", "禁止")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">連線閘門</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                Supabase 連線允許 {zhBool(shadowRuntime.supabaseConnectionAllowed, "是", "禁止")} · /api/portfolio 切換允許{" "}
                {zhBool(shadowRuntime.portfolioApiSwitchAllowed, "是", "禁止")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式環境</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                正式就緒 {zhBool(shadowRuntime.productionReady)} · service role 禁止{" "}
                {zhBool(shadowRuntime.serviceRoleForbidden)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              僅鷹架：來源不 fetch／不讀 env／不連線；下一階段需再次 owner 核准才能進行受限即時抓取試運行。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              受限即時抓取試運行（Limited Live Fetch Dry-run，僅授權來源）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              授權來源 = TWSE_TPEX · 股票代號 = 3019 · 頻道 channel = tse_3019.tw · 僅影子。
              此卡為靜態說明，**不會執行 live fetch**：app 預設 dryRunLiveFetch=false。實際試運行僅能由手動 smoke
              script（npm run smoke:limited-live-fetch:3019）觸發。僅 GET、逾時 timeout=3000ms、重試 maxRetries=0、欄位白名單、
              任何失敗即退回 disabled 鷹架候選。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">授權來源</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">TWSE_TPEX</p>
              <p className="mt-1 text-[9px] text-slate-600">代號=3019 · 僅影子=是</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">預設模式</p>
              <p className="mt-1 text-[14px] font-semibold text-slate-100">fixture</p>
              <p className="mt-1 text-[9px] text-slate-600">app 不會預設 live fetch</p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">操作／portfolio</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">
                operationalUseAllowed 操作允許＝否 · /api/portfolio 切換允許＝否
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式環境</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">正式就緒 productionReady＝否</p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              isConnected 只代表來源 fetch 成功，不代表可操作；不連 Supabase、不讀 env、不寫 DB、不新增 API route、
              不接券商 API、不產生買賣指令、不自動下單；尚未達正式就緒。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              受限即時抓取黃金快照驗證（離線／可重現）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {golden.contractVersion} · 模式 mode = OFFLINE_DETERMINISTIC_PARSER_SNAPSHOT · 已納入安全鏈（共 {ciGuard.result.totalChecks} 項檢查）。
              離線可重現的解析器驗證：成功快照 + 基準退回 + {golden.fallbackMatrixCaseCount} 個退回矩陣案例。
              此卡為靜態說明，**不會執行 live fetch、不跑 smoke、不做正式切換**。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">離線／可重現</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                離線 {zhBool(golden.offline)} · 可重現 {zhBool(golden.deterministic)} · 解析器快照 {zhBool(golden.parserSnapshot)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">即時／smoke</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                已執行 live fetch {zhBool(golden.liveFetchPerformed)} · smoke 僅手動 {zhBool(golden.smokeManualOnly)} · 已呼叫 smoke {zhBool(golden.smokeInvoked)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">矩陣／範圍</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                退回矩陣={golden.fallbackMatrixCaseCount} · 代號={golden.symbol} · 頻道={golden.channel}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式環境</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                正式資料切換允許 {zhBool(golden.productionDataSwitchAllowed, "是", "禁止")} · operationalUseAllowed 操作允許 {zhBool(golden.operationalUseAllowed, "是", "禁止")} · 正式就緒 {zhBool(golden.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              解析器的成功／退回／退回矩陣以固定 mock + 注入 clock 驗證，純離線；smoke 永遠僅手動、不在安全鏈。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              受限即時抓取模擬請求邊界驗證（離線／僅模擬請求）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {mockBoundary.contractVersion} · 模式 mode = OFFLINE_DETERMINISTIC_REQUEST_BOUNDARY · 已納入安全鏈（共 {ciGuard.result.totalChecks} 項檢查）。
              攔截 globalThis.fetch（僅模擬請求），驗證 request 僅打授權頻道 tse_3019.tw、僅 GET，以及未授權代號／fetch 錯誤／回應異常皆安全退回。
              此卡為靜態說明，**不打真網路、不執行 live fetch、不跑 smoke、不做正式切換**。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">離線／模擬</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                離線 {zhBool(mockBoundary.offline)} · 僅模擬請求 {zhBool(mockBoundary.mockFetchOnly)} · 使用真網路 {zhBool(mockBoundary.realNetworkUsed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">fetch／smoke</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                fetch mock 已還原 {zhBool(mockBoundary.fetchMockRestored)} · 已執行 live fetch {zhBool(mockBoundary.liveFetchPerformed)} · smoke 僅手動 {zhBool(mockBoundary.smokeManualOnly)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">邊界案例</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                成功案例 {zhBool(mockBoundary.fetchCalledOnceForSuccessCase)} · 未授權代號 {zhBool(mockBoundary.unsupportedSymbolSafeFallback)} · 錯誤 {zhBool(mockBoundary.fetchErrorSafeFallback)} · 異常回應 {zhBool(mockBoundary.malformedResponseSafeFallback)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式環境</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                正式資料切換允許 {zhBool(mockBoundary.productionDataSwitchAllowed, "是", "禁止")} · operationalUseAllowed 操作允許 {zhBool(mockBoundary.operationalUseAllowed, "是", "禁止")} · 正式就緒 {zhBool(mockBoundary.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              請求邊界以攔截 fetch + 注入 clock 驗證，純離線、不打真網路；smoke 永遠僅手動、不在安全鏈。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              受限即時抓取預設不請求邊界驗證(離線／預設執行路徑)
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {defaultNoFetch.contractVersion} · 模式 mode = OFFLINE_DETERMINISTIC_DEFAULT_RUNTIME_PATH · 已納入安全鏈（共 {ciGuard.result.totalChecks} 項檢查）。
              以 spy 監看 globalThis.fetch，驗證預設執行路徑（無 dryRunLiveFetch=true）的 fetch 次數 = 0、回傳安全鷹架／disabled／不可操作候選。
              此卡為靜態說明，**不打真網路、不執行 live fetch、不跑 smoke、不做正式切換**。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">離線／預設路徑</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                離線 {zhBool(defaultNoFetch.offline)} · 預設執行路徑 {zhBool(defaultNoFetch.defaultRuntimePath)} · dryRunLiveFetch 預設 {zhBool(defaultNoFetch.dryRunLiveFetchDefault, "是", "否")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">fetch 次數</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                預設路徑={defaultNoFetch.defaultPathFetchCallCount} · 明確 false={defaultNoFetch.explicitDryRunFalseFetchCallCount} · 使用真網路 {zhBool(defaultNoFetch.realNetworkUsed)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">退回／smoke</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                未授權代號安全退回 {zhBool(defaultNoFetch.unsupportedSymbolDefaultPathSafeFallback)} · fetch mock 已還原 {zhBool(defaultNoFetch.fetchMockRestored)} · smoke 僅手動 {zhBool(defaultNoFetch.smokeManualOnly)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式環境</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                正式資料切換允許 {zhBool(defaultNoFetch.productionDataSwitchAllowed, "是", "禁止")} · operationalUseAllowed 操作允許 {zhBool(defaultNoFetch.operationalUseAllowed, "是", "禁止")} · 正式就緒 {zhBool(defaultNoFetch.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              預設執行路徑以 spy fetch 驗證 0 次 fetch；只有明確 dryRunLiveFetch=true 才會 live fetch（僅手動 smoke，不在安全鏈）。
            </p>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <section className="panel-shell overflow-hidden">
          <div className="border-b border-line/80 px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">
              受限即時抓取逾時／中止邊界驗證（離線／逾時中止後退回）
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {timeoutBoundary.contractVersion} · 模式 mode = OFFLINE_DETERMINISTIC_TIMEOUT_BOUNDARY · 已納入安全鏈（共 {ciGuard.result.totalChecks} 項檢查）。
              以 mock globalThis.fetch + 假化 3000ms 中止計時器，驗證逾時／中止後安全退回、不產生可操作報價。
              此卡為靜態說明，**不打真網路、不執行 live fetch、不跑 smoke、不做正式切換**。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">離線／逾時</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                離線 {zhBool(timeoutBoundary.offline)} · 逾時邊界 {zhBool(timeoutBoundary.timeoutBoundary)} · 逾時 timeoutMs={timeoutBoundary.timeoutMs} · 重試 maxRetries={timeoutBoundary.maxRetries}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">中止退回</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                逾時／中止安全退回 {zhBool(timeoutBoundary.timeoutAbortSafeFallback)} · receivedAt 可重現 {zhBool(timeoutBoundary.receivedAtDeterministic)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">網路／還原</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                使用真網路 {zhBool(timeoutBoundary.realNetworkUsed)} · fetch mock 已還原 {zhBool(timeoutBoundary.fetchMockRestored)} · setTimeout 已還原 {zhBool(timeoutBoundary.setTimeoutRestored)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.012] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">正式環境</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200">
                正式資料切換允許 {zhBool(timeoutBoundary.productionDataSwitchAllowed, "是", "禁止")} · operationalUseAllowed 操作允許 {zhBool(timeoutBoundary.operationalUseAllowed, "是", "禁止")} · 正式就緒 {zhBool(timeoutBoundary.productionReady)}
              </p>
            </div>
          </div>
          <div className="border-t border-line/60 px-5 py-3 sm:px-6">
            <p className="text-[9px] text-slate-600">
              逾時／中止以 mock fetch + 假化中止計時器驗證（不等真 3000ms、不打真網路）；測後還原 fetch 與 setTimeout；smoke 永遠僅手動、不在安全鏈。
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
