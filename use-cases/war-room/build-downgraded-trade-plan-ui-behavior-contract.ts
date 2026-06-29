/**
 * Downgraded Trade Plan UI Behavior Builder — V69
 *
 * Pure deterministic builder. Turns every V68 downgrade result (plus synthetic
 * scenarios covering the remaining display modes) into a /holdings card UI state via
 * the pure engine, then self-validates. Every UI state is observation-only and
 * operational-use-blocked.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - operationalUseAllowed never true; sign-off / production flags never flipped
 */

import { buildConflictToTradePlanVerificationContract } from "./build-conflict-to-trade-plan-verification-contract";
import type {
  TradePlanDisplayMode,
  TradePlanVerificationDowngradeResult,
  TradePlanVerificationStatus,
} from "./conflict-to-trade-plan-verification-contract";
import { buildStructuredCandidateTradePlanContract } from "./build-structured-candidate-trade-plan-contract";
import type { CandidateTradePlan } from "./structured-candidate-trade-plan-contract";
import {
  buildDowngradedTradePlanUiState,
  validateDowngradedTradePlanUiState,
} from "./downgraded-trade-plan-ui-behavior-engine";
import {
  DOWNGRADED_TRADE_PLAN_FORBIDDEN_ACTION_PHRASES,
  DOWNGRADED_TRADE_PLAN_NOT_OPERATIONAL_PHRASE,
  DOWNGRADED_TRADE_PLAN_UI_BEHAVIOR_SAFETY_LABELS,
  DOWNGRADED_TRADE_PLAN_UI_BEHAVIOR_SPEC_NAME,
} from "./downgraded-trade-plan-ui-behavior-contract";
import type {
  DowngradedTradePlanUiBehaviorContract,
  DowngradedTradePlanUiBehaviorValidation,
  DowngradedTradePlanUiState,
} from "./downgraded-trade-plan-ui-behavior-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildDowngradedTradePlanUiBehaviorContractInput {
  generatedAt?: string;
}

function syntheticDowngrade(
  symbol: string,
  name: string,
  displayMode: TradePlanDisplayMode,
  verificationStatus: TradePlanVerificationStatus,
  buyZoneVisible: boolean,
): TradePlanVerificationDowngradeResult {
  return {
    symbol,
    name,
    sourceConflictFieldName: "lastPrice",
    conflictDetected: false,
    sourceResolutionStatus: verificationStatus,
    tradePlanVerificationStatus: verificationStatus,
    tradePlanDisplayMode: displayMode,
    buyZoneVisible,
    targetZoneVisible: buyZoneVisible,
    riskRewardVisible: buyZoneVisible,
    observationOnly: true,
    operationalUseAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    requiresManualReview: true,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    productionSwitchAllowed: false,
    reasonText: `synthetic ${displayMode} 情境（spec-only，fixture）：${DOWNGRADED_TRADE_PLAN_NOT_OPERATIONAL_PHRASE}。`,
  };
}

/**
 * Builds the downgraded trade plan UI behavior contract. Reads no clock, no env, no
 * network — only the V68 downgrade results + V63 trade plans + pure engine.
 */
export function buildDowngradedTradePlanUiBehaviorContract(
  input: BuildDowngradedTradePlanUiBehaviorContractInput = {},
): DowngradedTradePlanUiBehaviorContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const matrix = buildConflictToTradePlanVerificationContract({ generatedAt });
  const model = buildStructuredCandidateTradePlanContract({ generatedAt });
  const planBySymbol = new Map(model.tradePlans.map((p) => [p.symbol, p] as const));
  const fallbackPlan: CandidateTradePlan = model.tradePlans[0];

  const planFor = (symbol: string): CandidateTradePlan => planBySymbol.get(symbol) ?? fallbackPlan;

  // 1) One UI state per V68 downgrade result.
  const uiStates: DowngradedTradePlanUiState[] = matrix.sampleDowngradeResults.map((dr) =>
    buildDowngradedTradePlanUiState(planFor(dr.symbol), dr),
  );

  // 2) Synthetic scenarios to cover the remaining display modes.
  const firstSymbol = fallbackPlan.symbol;
  const firstName = fallbackPlan.name;
  const synthetics: TradePlanVerificationDowngradeResult[] = [
    syntheticDowngrade(firstSymbol, firstName, "SHOW_FIXTURE_WITH_WARNING", "NOT_CONNECTED", true),
    syntheticDowngrade(firstSymbol, firstName, "SHOW_OBSERVATION_ONLY", "OBSERVATION_ONLY", true),
    syntheticDowngrade(firstSymbol, firstName, "HIDE_OPERATIONAL_LEVELS", "BLOCKED", false),
  ];
  for (const dr of synthetics) {
    uiStates.push(buildDowngradedTradePlanUiState(planFor(dr.symbol), dr));
  }

  // ----- validation -----
  const perState = uiStates.map((s) => validateDowngradedTradePlanUiState(s));
  const everyDowngradeHasUiState = uiStates.length >= matrix.sampleDowngradeResults.length && uiStates.length > 0;
  const everyUiStateMapsToTradePlan = uiStates.every((s) => planBySymbol.has(s.symbol));
  const actionLabelsNonImperative = uiStates.every((s) => {
    const lower = s.actionLabel.toLowerCase();
    return !DOWNGRADED_TRADE_PLAN_FORBIDDEN_ACTION_PHRASES.some((p) => s.actionLabel.includes(p) || lower.includes(p.toLowerCase()));
  });

  const validation: DowngradedTradePlanUiBehaviorValidation = {
    everyDowngradeHasUiState,
    everyUiStateMapsToTradePlan,
    allObservationOnlyTrue: perState.every((v) => v.observationOnlyTrue),
    allOperationalUseFalse: perState.every((v) => v.operationalUseFalse),
    allBuySellCommandFalse: perState.every((v) => v.buySellCommandFalse),
    allAutoOrderFalse: perState.every((v) => v.autoOrderFalse),
    allManualSignoffRequired: perState.every((v) => v.manualSignoffRequiredTrue),
    allManualSignoffNotCompleted: perState.every((v) => v.manualSignoffCompletedFalse),
    allProductionSwitchDisallowed: perState.every((v) => v.productionSwitchDisallowed),
    hideModeHidesAllLevels: perState.every((v) => v.hideModeHidesLevels),
    conflictShowsConflictWarning: uiStates.every((s) => s.tradePlanDisplayMode !== "SHOW_BLOCKED_CONFLICT" || s.visibility.showConflictWarning),
    missingShowsMissingWarning: uiStates.every((s) => s.tradePlanDisplayMode !== "SHOW_BLOCKED_MISSING_DATA" || s.visibility.showMissingDataWarning),
    staleShowsStaleWarning: uiStates.every((s) => s.tradePlanDisplayMode !== "SHOW_BLOCKED_STALE_DATA" || s.visibility.showStaleDataWarning),
    unauthorizedShowsUnauthorizedWarning: uiStates.every((s) => s.tradePlanDisplayMode !== "SHOW_BLOCKED_UNAUTHORIZED" || s.visibility.showUnauthorizedWarning),
    actionLabelsNonImperative,
    warningMessagesStateNotOperational: perState.every((v) => v.warningMessageNotOperational),
    valid: false,
  };
  validation.valid = Object.entries(validation).every(([k, v]) => k === "valid" || v === true);

  return {
    contractVersion: "V69",
    specName: DOWNGRADED_TRADE_PLAN_UI_BEHAVIOR_SPEC_NAME,
    behaviorMode: "FIXTURE_ONLY_NOT_CONNECTED",
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

    uiStates,
    validation,

    safetyLabels: [...DOWNGRADED_TRADE_PLAN_UI_BEHAVIOR_SAFETY_LABELS],
  };
}
