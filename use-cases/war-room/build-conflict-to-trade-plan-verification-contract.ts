/**
 * Conflict Resolution to Trade Plan Verification Downgrade Matrix Builder — V68
 *
 * Pure deterministic builder. Pairs every V67 conflict resolution result (plus a few
 * synthetic signal scenarios) with a V63 trade plan and produces a downgrade result
 * via the pure engine, then self-validates. Everything stays observation-only and
 * operational-use-BLOCKED; VERIFIED is never used (future-only).
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - operationalUseAllowed never true; sign-off / production flags never flipped
 */

import { buildRealQuoteSourceConflictResolutionPolicyContract } from "./build-real-quote-source-conflict-resolution-policy-contract";
import type { QuoteSourceConflictResolutionResult, QuoteSourceDegradedStatus } from "./real-quote-source-conflict-resolution-policy-contract";
import { buildStructuredCandidateTradePlanContract } from "./build-structured-candidate-trade-plan-contract";
import type { CandidateTradePlan } from "./structured-candidate-trade-plan-contract";
import {
  buildTradePlanDowngradeResult,
  validateTradePlanDowngradeConsistency,
} from "./conflict-to-trade-plan-verification-engine";
import {
  CONFLICT_TO_TRADE_PLAN_VERIFICATION_SAFETY_LABELS,
  CONFLICT_TO_TRADE_PLAN_VERIFICATION_SPEC_NAME,
} from "./conflict-to-trade-plan-verification-contract";
import type {
  ConflictToTradePlanVerificationMatrix,
  ConflictToTradePlanVerificationValidation,
  TradePlanVerificationDowngradeResult,
  TradePlanVerificationDowngradeRule,
} from "./conflict-to-trade-plan-verification-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildConflictToTradePlanVerificationContractInput {
  generatedAt?: string;
}

function syntheticResult(
  fieldName: string,
  degradedStatus: QuoteSourceDegradedStatus,
  conflictDetected: boolean,
): QuoteSourceConflictResolutionResult {
  return {
    fieldName,
    conflictDetected,
    selectedSourceName: "(spec) highest-priority candidate",
    selectedValuePreview: "(fixture)",
    rejectedSourceNames: [],
    degradedStatus,
    resolutionReason: `synthetic ${degradedStatus} scenario（spec-only，未連線）`,
    verificationStatus: "NOT_CONNECTED",
    operationalUseAllowed: false,
    requiresManualReview: true,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    productionSwitchAllowed: false,
  };
}

function buildDowngradeRules(): TradePlanVerificationDowngradeRule[] {
  const common = {
    operationalUseAllowed: false as const,
    requiresManualReview: true as const,
    manualSignoffRequired: true as const,
    manualSignoffCompleted: false as const,
  };
  const blocked = { buyZoneVisible: false, targetZoneVisible: false, riskRewardVisible: false };
  return [
    {
      ruleName: "missing-data-downgrade",
      conflictSignal: "MISSING_DATA",
      targetVerificationStatus: "MISSING_DATA",
      targetDisplayMode: "SHOW_BLOCKED_MISSING_DATA",
      ...blocked,
      ...common,
      reasonText: "缺值：承接區 / 目標區 / 風報比隱藏，trade plan 降級為 MISSING_DATA，不可作為正式操作依據。",
    },
    {
      ruleName: "stale-data-downgrade",
      conflictSignal: "STALE_DATA",
      targetVerificationStatus: "STALE_DATA",
      targetDisplayMode: "SHOW_BLOCKED_STALE_DATA",
      ...blocked,
      ...common,
      reasonText: "資料延遲：trade plan 降級為 STALE_DATA，承接區降級為觀察，不可作為正式操作依據。",
    },
    {
      ruleName: "unauthorized-source-downgrade",
      conflictSignal: "UNAUTHORIZED_SOURCE",
      targetVerificationStatus: "UNAUTHORIZED_SOURCE",
      targetDisplayMode: "SHOW_BLOCKED_UNAUTHORIZED",
      ...blocked,
      ...common,
      reasonText: "未授權來源：operational levels 隱藏，trade plan 降級為 UNAUTHORIZED_SOURCE，不可作為正式操作依據。",
    },
    {
      ruleName: "source-conflict-downgrade",
      conflictSignal: "SOURCE_CONFLICT",
      targetVerificationStatus: "SOURCE_CONFLICT",
      targetDisplayMode: "SHOW_BLOCKED_CONFLICT",
      ...blocked,
      ...common,
      reasonText: "來源衝突：trade plan 降級為 SOURCE_CONFLICT，承接區降級為觀察，不可作為正式操作依據。",
    },
    {
      ruleName: "not-connected-downgrade",
      conflictSignal: "NOT_CONNECTED",
      targetVerificationStatus: "NOT_CONNECTED",
      targetDisplayMode: "SHOW_FIXTURE_WITH_WARNING",
      buyZoneVisible: true,
      targetZoneVisible: true,
      riskRewardVisible: true,
      ...common,
      reasonText: "未連真實行情：顯示 fixture 並標示警告，observation only，不可作為正式操作依據。",
    },
  ];
}

/**
 * Builds the conflict-to-trade-plan verification downgrade matrix. Reads no clock, no
 * env, no network — only the V67 conflict results + V63 trade plans + pure engine.
 */
export function buildConflictToTradePlanVerificationContract(
  input: BuildConflictToTradePlanVerificationContractInput = {},
): ConflictToTradePlanVerificationMatrix {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const policy = buildRealQuoteSourceConflictResolutionPolicyContract({ generatedAt });
  const model = buildStructuredCandidateTradePlanContract({ generatedAt });
  const tradePlans = model.tradePlans;
  const fallbackPlan: Pick<CandidateTradePlan, "symbol" | "name"> = tradePlans[0] ?? { symbol: "A100", name: "A 級 sample 甲" };

  const downgradeRules = buildDowngradeRules();

  const planAt = (i: number): Pick<CandidateTradePlan, "symbol" | "name"> => tradePlans[i] ?? fallbackPlan;

  const sampleDowngradeResults: TradePlanVerificationDowngradeResult[] = [];

  // 1) One downgrade per V67 sample resolution result (mapped to trade plans by index).
  policy.sampleResolutionResults.forEach((result, i) => {
    sampleDowngradeResults.push(buildTradePlanDowngradeResult(planAt(i), result, downgradeRules));
  });

  // 2) Synthetic scenarios to exercise the full matrix (missing / stale / unauthorized).
  sampleDowngradeResults.push(
    buildTradePlanDowngradeResult(planAt(2), syntheticResult("lastPrice", "BLOCKED_MISSING_DATA", true), downgradeRules),
  );
  sampleDowngradeResults.push(
    buildTradePlanDowngradeResult(planAt(3), syntheticResult("lowPrice", "BLOCKED_STALE_DATA", true), downgradeRules),
  );
  sampleDowngradeResults.push(
    buildTradePlanDowngradeResult(planAt(0), syntheticResult("highPrice", "BLOCKED_UNAUTHORIZED", true), downgradeRules),
  );

  const c = validateTradePlanDowngradeConsistency(sampleDowngradeResults);

  // Coverage checks against V67 + V63.
  const everyConflictResultHasDowngrade = policy.sampleResolutionResults.length <= sampleDowngradeResults.length;
  const planSymbols = new Set(tradePlans.map((p) => p.symbol));
  const everyDowngradeMapsToTradePlan = sampleDowngradeResults.every((r) => planSymbols.has(r.symbol));

  const validation: ConflictToTradePlanVerificationValidation = {
    everyConflictResultHasDowngrade,
    everyDowngradeMapsToTradePlan,
    noVerifiedInSamples: c.noVerifiedInSamples,
    conflictNeverVerified: c.conflictNeverVerified,
    allOperationalUseFalse: c.allOperationalUseFalse,
    allObservationOnlyTrue: c.allObservationOnlyTrue,
    allBuySellCommandFalse: c.allBuySellCommandFalse,
    allAutoOrderFalse: c.allAutoOrderFalse,
    allManualSignoffRequired: c.allManualSignoffRequired,
    allManualSignoffNotCompleted: c.allManualSignoffNotCompleted,
    allProductionSwitchDisallowed: c.allProductionSwitchDisallowed,
    missingDisplayModeConsistent: c.missingDisplayModeConsistent,
    staleDisplayModeConsistent: c.staleDisplayModeConsistent,
    unauthorizedDisplayModeConsistent: c.unauthorizedDisplayModeConsistent,
    conflictDisplayModeConsistent: c.conflictDisplayModeConsistent,
    valid: false,
  };
  validation.valid = Object.entries(validation).every(([k, v]) => k === "valid" || v === true);

  return {
    contractVersion: "V68",
    specName: CONFLICT_TO_TRADE_PLAN_VERIFICATION_SPEC_NAME,
    matrixMode: "SPEC_ONLY_NOT_CONNECTED",
    generatedAt,
    decision: validation.valid ? "READY_FOR_UI_REVIEW" : "NO_GO",

    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    fetchPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    productionReady: false,

    downgradeRules,
    sampleDowngradeResults,
    validation,

    safetyLabels: [...CONFLICT_TO_TRADE_PLAN_VERIFICATION_SAFETY_LABELS],
  };
}
