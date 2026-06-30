/**
 * Safety Chain CI Guard Contract Builder — V73
 *
 * Pure deterministic builder. Invokes every V60–V72 chain builder IN-PROCESS (no
 * child process, no spawn), confirms each reports its locked decision, and scans each
 * bundle for any forbidden safety flag flipped to true. Produces one critical check
 * per chain script + an aggregate result.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - Manual sign-off / staging / real quote / production switch flags never flipped
 */

import { buildAllenWarRoomOperationalLayoutContract } from "./build-allen-war-room-operational-layout-contract";
import { buildAllenScoreScoringModelContract } from "./build-allen-score-scoring-model-contract";
import { buildAllenScoreDeterministicScoringEngineContract } from "./build-allen-score-deterministic-scoring-engine-contract";
import { buildStructuredCandidateTradePlanContract } from "./build-structured-candidate-trade-plan-contract";
import { buildCandidatePriceLevelFixtureSourceContract } from "./build-candidate-price-level-fixture-source-contract";
import { buildDescriptorToRealQuoteMappingContract } from "./build-descriptor-to-real-quote-mapping-contract";
import { buildAuthorizedRealQuoteFieldCatalogContract } from "./build-authorized-real-quote-field-catalog-contract";
import { buildRealQuoteSourceConflictResolutionPolicyContract } from "./build-real-quote-source-conflict-resolution-policy-contract";
import { buildConflictToTradePlanVerificationContract } from "./build-conflict-to-trade-plan-verification-contract";
import { buildDowngradedTradePlanUiBehaviorContract } from "./build-downgraded-trade-plan-ui-behavior-contract";
import { buildUnifiedConnectionEvidenceLedgerContract } from "./build-unified-connection-evidence-ledger-contract";
import { buildEvidenceLedgerTransitionContract } from "./build-evidence-ledger-transition-contract";
import { buildLedgerIntegrityRollupContract } from "./build-ledger-integrity-rollup-contract";
import { buildPhase2LockedImplementationContract } from "./build-phase-2-locked-implementation-contract";
import { buildShadowQuoteComparisonViewModel } from "./build-shadow-quote-comparison-view-model";
import { buildStagingShadowRuntimeContract } from "./build-shadow-runtime-comparison";
import { buildLimitedLiveFetchScopeContract } from "./build-limited-live-fetch-scope-contract";
import { buildLimitedLiveFetchImplementationContract } from "./build-limited-live-fetch-implementation-contract";
import {
  SAFETY_CHAIN_CI_GUARD_FORBIDDEN_TRUE_FLAGS,
  SAFETY_CHAIN_CI_GUARD_SAFETY_LABELS,
  SAFETY_CHAIN_CI_GUARD_SPEC_NAME,
} from "./safety-chain-ci-guard-contract";
import type {
  SafetyChainCiGuardCheck,
  SafetyChainCiGuardContract,
  SafetyChainCiGuardResult,
  SafetyChainCiGuardValidation,
} from "./safety-chain-ci-guard-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildSafetyChainCiGuardContractInput {
  generatedAt?: string;
}

interface ChainSpec {
  checkId: string;
  sourceVersion: string;
  sourceScript: string;
  sourceContract: string;
  expectedDecision: string;
  expectedMode: string;
  guardCategory: string;
  build: (input: { generatedAt: string }) => unknown;
}

function spec(
  sourceVersion: string,
  sourceScript: string,
  sourceContract: string,
  expectedDecision: string,
  expectedMode: string,
  guardCategory: string,
  build: (input: { generatedAt: string }) => unknown,
): ChainSpec {
  return {
    checkId: `GUARD_${sourceVersion}`,
    sourceVersion,
    sourceScript,
    sourceContract,
    expectedDecision,
    expectedMode,
    guardCategory,
    build,
  };
}

const CHAIN_SPECS: ChainSpec[] = [
  spec("V60", "test:allen-war-room-operational-layout", "build-allen-war-room-operational-layout-contract.ts", "READY_FOR_UI_REVIEW", "fixture/mock safe mode", "OPERATIONAL_LAYOUT", buildAllenWarRoomOperationalLayoutContract),
  spec("V61", "test:allen-score-scoring-model", "build-allen-score-scoring-model-contract.ts", "READY_FOR_UI_REVIEW", "fixture/mock safe mode", "SCORING", buildAllenScoreScoringModelContract),
  spec("V62", "test:allen-score-deterministic-scoring-engine", "build-allen-score-deterministic-scoring-engine-contract.ts", "READY_FOR_UI_REVIEW", "fixture/mock safe mode", "SCORING", buildAllenScoreDeterministicScoringEngineContract),
  spec("V63", "test:structured-candidate-trade-plan", "build-structured-candidate-trade-plan-contract.ts", "READY_FOR_UI_REVIEW", "fixture/mock safe mode", "TRADE_PLAN", buildStructuredCandidateTradePlanContract),
  spec("V64", "test:candidate-price-level-fixture-source", "build-candidate-price-level-fixture-source-contract.ts", "READY_FOR_UI_REVIEW", "NOT_CONNECTED", "SOURCE", buildCandidatePriceLevelFixtureSourceContract),
  spec("V65", "test:descriptor-to-real-quote-mapping", "build-descriptor-to-real-quote-mapping-contract.ts", "READY_FOR_UI_REVIEW", "SPEC_DEFINED_NOT_CONNECTED", "MAPPING", buildDescriptorToRealQuoteMappingContract),
  spec("V66", "test:authorized-real-quote-field-catalog", "build-authorized-real-quote-field-catalog-contract.ts", "READY_FOR_UI_REVIEW", "SPEC_ONLY_NOT_CONNECTED", "SOURCE", buildAuthorizedRealQuoteFieldCatalogContract),
  spec("V67", "test:real-quote-source-conflict-resolution-policy", "build-real-quote-source-conflict-resolution-policy-contract.ts", "READY_FOR_UI_REVIEW", "SPEC_ONLY_NOT_CONNECTED", "CONFLICT", buildRealQuoteSourceConflictResolutionPolicyContract),
  spec("V68", "test:conflict-to-trade-plan-verification", "build-conflict-to-trade-plan-verification-contract.ts", "READY_FOR_UI_REVIEW", "SPEC_ONLY_NOT_CONNECTED", "DOWNGRADE", buildConflictToTradePlanVerificationContract),
  spec("V69", "test:downgraded-trade-plan-ui-behavior", "build-downgraded-trade-plan-ui-behavior-contract.ts", "READY_FOR_UI_REVIEW", "FIXTURE_ONLY_NOT_CONNECTED", "UI_BEHAVIOR", buildDowngradedTradePlanUiBehaviorContract),
  spec("V70", "test:unified-connection-evidence-ledger", "build-unified-connection-evidence-ledger-contract.ts", "NO_GO", "SPEC_ONLY_PENDING_EVIDENCE", "EVIDENCE", buildUnifiedConnectionEvidenceLedgerContract),
  spec("V71", "test:evidence-ledger-transition", "build-evidence-ledger-transition-contract.ts", "NO_GO", "SPEC_ONLY_PREVIEW_NOT_CONNECTED", "EVIDENCE", buildEvidenceLedgerTransitionContract),
  spec("V72", "test:ledger-integrity-rollup", "build-ledger-integrity-rollup-contract.ts", "NO_GO", "SPEC_ONLY_SAFETY_GATE", "ROLLUP", buildLedgerIntegrityRollupContract),
  spec("PHASE2", "test:phase-2-locked-implementation", "build-phase-2-locked-implementation-contract.ts", "NO_GO", "INTERFACE_ONLY_NOT_CONNECTED", "REAL_QUOTE_INTERFACE", buildPhase2LockedImplementationContract),
  spec("PHASE2B", "test:phase-2b-shadow-comparison-ui-shell", "build-shadow-quote-comparison-view-model.ts", "NO_GO", "INTERFACE_ONLY_NOT_CONNECTED", "SHADOW_UI_SHELL", buildShadowQuoteComparisonViewModel),
  spec("SHADOW_RUNTIME_SCAFFOLD", "test:staging-shadow-runtime-scaffold", "build-shadow-runtime-comparison.ts", "NO_GO", "SCAFFOLD_ONLY_NOT_CONNECTED", "MARKET_DATA_SCAFFOLD", buildStagingShadowRuntimeContract),
  spec("LIMITED_LIVE_FETCH_SCOPE", "test:limited-live-fetch-dry-run-pr-scope", "build-limited-live-fetch-scope-contract.ts", "NO_GO", "SCOPE_ONLY_NO_NETWORK_CODE", "LIVE_FETCH_SCOPE", buildLimitedLiveFetchScopeContract),
  spec("LIMITED_LIVE_FETCH_IMPLEMENTATION", "test:limited-live-fetch-dry-run-implementation", "build-limited-live-fetch-implementation-contract.ts", "LIVE_FETCH_DRY_RUN_NON_OPERATIONAL", "LIMITED_LIVE_FETCH_DRY_RUN_SHADOW_ONLY", "LIVE_FETCH_IMPLEMENTATION", buildLimitedLiveFetchImplementationContract),
];

function decisionOf(bundle: unknown): string {
  if (bundle != null && typeof bundle === "object" && "decision" in (bundle as Record<string, unknown>)) {
    return String((bundle as Record<string, unknown>).decision);
  }
  return "(none)";
}

/** Returns the first forbidden flag found set to true in the serialized bundle. */
function forbiddenTrueFlag(json: string): string | null {
  for (const flag of SAFETY_CHAIN_CI_GUARD_FORBIDDEN_TRUE_FLAGS) {
    if (json.includes(`"${flag}":true`)) return flag;
  }
  return null;
}

/**
 * Builds the safety chain CI guard. Reads no clock, no env, no network — only invokes
 * each chain builder in-process and inspects the returned bundles. The guard's own
 * decision is READY_FOR_CI_GUARD (not production ready).
 */
export function buildSafetyChainCiGuardContract(
  input: BuildSafetyChainCiGuardContractInput = {},
): SafetyChainCiGuardContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const checks: SafetyChainCiGuardCheck[] = [];
  let allRuntimeFlagsFalse = true;
  let allOperationalUseBlocked = true;
  let productionSwitchStillBlocked = true;
  let allNoGoLocksPreserved = true;

  for (const s of CHAIN_SPECS) {
    let passed = true;
    let failureReason = "";
    try {
      const bundle = s.build({ generatedAt });
      const json = JSON.stringify(bundle);
      const actualDecision = decisionOf(bundle);

      if (actualDecision !== s.expectedDecision) {
        passed = false;
        failureReason = `decision ${actualDecision} !== expected ${s.expectedDecision}`;
      }
      const flag = forbiddenTrueFlag(json);
      if (flag) {
        passed = false;
        failureReason = failureReason ? `${failureReason}; forbidden flag "${flag}":true` : `forbidden flag "${flag}":true`;
        allRuntimeFlagsFalse = false;
      }
      if (json.includes('"operationalUseAllowed":true')) allOperationalUseBlocked = false;
      if (json.includes('"productionSwitchAllowed":true') || json.includes('"productionReady":true') || json.includes('"productionTradingReady":true')) {
        productionSwitchStillBlocked = false;
      }
      if (s.expectedDecision === "NO_GO" && actualDecision !== "NO_GO") allNoGoLocksPreserved = false;
    } catch (e) {
      passed = false;
      failureReason = `builder threw: ${String(e)}`;
    }

    checks.push({
      checkId: s.checkId,
      sourceVersion: s.sourceVersion,
      sourceScript: s.sourceScript,
      sourceContract: s.sourceContract,
      expectedDecision: s.expectedDecision,
      expectedMode: s.expectedMode,
      requiredStatus: "PASS",
      guardCategory: s.guardCategory,
      critical: true,
      passed,
      failureReason,
    });
  }

  const passedChecks = checks.filter((c) => c.passed).length;
  const failedChecks = checks.length - passedChecks;
  const criticalFailedChecks = checks.filter((c) => c.critical && !c.passed).length;
  const allCriticalPassed = criticalFailedChecks === 0;

  const result: SafetyChainCiGuardResult = {
    totalChecks: checks.length,
    passedChecks,
    failedChecks,
    criticalFailedChecks,
    allCriticalPassed,
    allNoGoLocksPreserved,
    allRuntimeFlagsFalse,
    allOperationalUseBlocked,
    productionSwitchStillBlocked,
    decision: allCriticalPassed ? "READY_FOR_CI_GUARD" : "NO_GO",
  };

  const requiredScripts = CHAIN_SPECS.map((s) => s.sourceScript);
  const scriptSet = new Set(checks.map((c) => c.sourceScript));

  const validation: SafetyChainCiGuardValidation = {
    checksNonEmpty: checks.length > 0,
    coversV60ToV72Scripts: requiredScripts.every((s) => scriptSet.has(s)),
    allChecksCritical: checks.every((c) => c.critical === true),
    allChecksPassed: checks.every((c) => c.passed === true),
    noFailedChecks: failedChecks === 0,
    noCriticalFailures: criticalFailedChecks === 0,
    allCriticalPassed,
    allNoGoLocksPreserved,
    allRuntimeFlagsFalse,
    allOperationalUseBlocked,
    productionSwitchStillBlocked,
    decisionReadyForCiGuard: result.decision === "READY_FOR_CI_GUARD",
    valid: false,
  };
  validation.valid = Object.entries(validation).every(([k, v]) => k === "valid" || v === true);

  return {
    contractVersion: "V73",
    specName: SAFETY_CHAIN_CI_GUARD_SPEC_NAME,
    guardMode: "SPEC_ONLY_CI_GUARD",
    generatedAt,
    decision: validation.valid ? "READY_FOR_CI_GUARD" : "NO_GO",

    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    fetchPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    productionReady: false,

    checks,
    result,
    validation,

    safetyLabels: [...SAFETY_CHAIN_CI_GUARD_SAFETY_LABELS],
  };
}
