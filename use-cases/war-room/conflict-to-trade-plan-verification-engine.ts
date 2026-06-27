/**
 * Conflict Resolution to Trade Plan Verification Downgrade Engine — V68
 *
 * Pure, deterministic mapping functions. NO side effects, NO I/O. They turn a V67
 * conflict resolution result into a V63 trade-plan verification status + display mode
 * + visibility, always observation-only and operational-use-BLOCKED. VERIFIED is
 * never produced (future-only).
 */

import type { CandidateTradePlan } from "./structured-candidate-trade-plan-contract";
import type { QuoteSourceConflictResolutionResult } from "./real-quote-source-conflict-resolution-policy-contract";
import type {
  TradePlanDisplayMode,
  TradePlanVerificationDowngradeResult,
  TradePlanVerificationDowngradeRule,
  TradePlanVerificationStatus,
} from "./conflict-to-trade-plan-verification-contract";

/** Normalized conflict signal derived from a V67 resolution result. */
export function deriveSourceResolutionStatus(result: QuoteSourceConflictResolutionResult): string {
  switch (result.degradedStatus) {
    case "BLOCKED_MISSING_DATA":
      return "MISSING_DATA";
    case "BLOCKED_STALE_DATA":
      return "STALE_DATA";
    case "BLOCKED_UNAUTHORIZED":
      return "UNAUTHORIZED_SOURCE";
    case "BLOCKED_NOT_CONNECTED":
      return result.conflictDetected ? "SOURCE_CONFLICT" : "NOT_CONNECTED";
    case "DEGRADED_FIXTURE_ONLY":
      return "FIXTURE_ONLY";
    default:
      return "MANUAL_REVIEW_REQUIRED";
  }
}

/**
 * Maps a conflict resolution result to a trade plan verification status. Never
 * returns VERIFIED — while fixture-only, a conflict / not-connected source can only
 * downgrade.
 */
export function mapConflictResultToVerificationStatus(
  result: QuoteSourceConflictResolutionResult,
): TradePlanVerificationStatus {
  switch (result.degradedStatus) {
    case "BLOCKED_MISSING_DATA":
      return "MISSING_DATA";
    case "BLOCKED_STALE_DATA":
      return "STALE_DATA";
    case "BLOCKED_UNAUTHORIZED":
      return "UNAUTHORIZED_SOURCE";
    case "BLOCKED_NOT_CONNECTED":
      return result.conflictDetected ? "SOURCE_CONFLICT" : "NOT_CONNECTED";
    case "DEGRADED_FIXTURE_ONLY":
      return "FIXTURE_ONLY";
    default:
      return "MANUAL_REVIEW_REQUIRED";
  }
}

/**
 * Maps a conflict resolution result to a trade plan display mode. Blocked modes hide
 * the operational levels; not-connected fixture stays visible with a warning.
 */
export function mapConflictResultToDisplayMode(
  result: QuoteSourceConflictResolutionResult,
): TradePlanDisplayMode {
  switch (result.degradedStatus) {
    case "BLOCKED_MISSING_DATA":
      return "SHOW_BLOCKED_MISSING_DATA";
    case "BLOCKED_STALE_DATA":
      return "SHOW_BLOCKED_STALE_DATA";
    case "BLOCKED_UNAUTHORIZED":
      return "SHOW_BLOCKED_UNAUTHORIZED";
    case "BLOCKED_NOT_CONNECTED":
      return result.conflictDetected ? "SHOW_BLOCKED_CONFLICT" : "SHOW_FIXTURE_WITH_WARNING";
    case "DEGRADED_FIXTURE_ONLY":
      return "SHOW_FIXTURE_WITH_WARNING";
    default:
      return "SHOW_OBSERVATION_ONLY";
  }
}

/** Which operational levels stay visible for a given display mode. */
function visibilityFor(mode: TradePlanDisplayMode): {
  buyZoneVisible: boolean;
  targetZoneVisible: boolean;
  riskRewardVisible: boolean;
} {
  switch (mode) {
    case "SHOW_FIXTURE_WITH_WARNING":
    case "SHOW_OBSERVATION_ONLY":
      return { buyZoneVisible: true, targetZoneVisible: true, riskRewardVisible: true };
    case "SHOW_BLOCKED_CONFLICT":
    case "SHOW_BLOCKED_MISSING_DATA":
    case "SHOW_BLOCKED_STALE_DATA":
    case "SHOW_BLOCKED_UNAUTHORIZED":
      return { buyZoneVisible: false, targetZoneVisible: false, riskRewardVisible: false };
    case "HIDE_OPERATIONAL_LEVELS":
    default:
      return { buyZoneVisible: false, targetZoneVisible: false, riskRewardVisible: false };
  }
}

/**
 * Builds a deterministic downgrade result for a trade plan + conflict result. The
 * optional rules provide reason text; if a rule matches the signal its reasonText is
 * used. operationalUseAllowed stays false; observationOnly true; manual review/sign-off
 * required and not completed.
 */
export function buildTradePlanDowngradeResult(
  tradePlan: Pick<CandidateTradePlan, "symbol" | "name">,
  conflictResult: QuoteSourceConflictResolutionResult,
  rules: TradePlanVerificationDowngradeRule[] = [],
): TradePlanVerificationDowngradeResult {
  const sourceResolutionStatus = deriveSourceResolutionStatus(conflictResult);
  const tradePlanVerificationStatus = mapConflictResultToVerificationStatus(conflictResult);
  const tradePlanDisplayMode = mapConflictResultToDisplayMode(conflictResult);
  const visibility = visibilityFor(tradePlanDisplayMode);
  const matchedRule = rules.find((r) => r.conflictSignal === sourceResolutionStatus);

  const reasonText =
    matchedRule?.reasonText ??
    `來源解析為 ${sourceResolutionStatus}（${conflictResult.degradedStatus}）：` +
      `trade plan 降級為 ${tradePlanVerificationStatus} / ${tradePlanDisplayMode}，` +
      `承接區降級為觀察，不可作為正式操作依據。`;

  return {
    symbol: tradePlan.symbol,
    name: tradePlan.name,
    sourceConflictFieldName: conflictResult.fieldName,
    conflictDetected: conflictResult.conflictDetected,
    sourceResolutionStatus,
    tradePlanVerificationStatus,
    tradePlanDisplayMode,
    buyZoneVisible: visibility.buyZoneVisible,
    targetZoneVisible: visibility.targetZoneVisible,
    riskRewardVisible: visibility.riskRewardVisible,
    observationOnly: true,
    operationalUseAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    requiresManualReview: true,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    productionSwitchAllowed: false,
    reasonText,
  };
}

/**
 * Validates the consistency of a set of downgrade results: no VERIFIED while
 * fixture-only, conflict never VERIFIED, all observation-only / blocked, and display
 * mode consistent with the conflict signal.
 */
export function validateTradePlanDowngradeConsistency(
  results: TradePlanVerificationDowngradeResult[],
): {
  noVerifiedInSamples: boolean;
  conflictNeverVerified: boolean;
  allOperationalUseFalse: boolean;
  allObservationOnlyTrue: boolean;
  allBuySellCommandFalse: boolean;
  allAutoOrderFalse: boolean;
  allManualSignoffRequired: boolean;
  allManualSignoffNotCompleted: boolean;
  allProductionSwitchDisallowed: boolean;
  missingDisplayModeConsistent: boolean;
  staleDisplayModeConsistent: boolean;
  unauthorizedDisplayModeConsistent: boolean;
  conflictDisplayModeConsistent: boolean;
} {
  const has = (s: string, kw: string): boolean => s.toLowerCase().includes(kw);
  const missingOk = (m: TradePlanDisplayMode): boolean => m === "SHOW_BLOCKED_MISSING_DATA" || m === "HIDE_OPERATIONAL_LEVELS";
  const staleOk = (m: TradePlanDisplayMode): boolean => m === "SHOW_BLOCKED_STALE_DATA" || m === "SHOW_OBSERVATION_ONLY";
  const unauthorizedOk = (m: TradePlanDisplayMode): boolean => m === "SHOW_BLOCKED_UNAUTHORIZED" || m === "HIDE_OPERATIONAL_LEVELS";
  const conflictOk = (m: TradePlanDisplayMode): boolean => m === "SHOW_BLOCKED_CONFLICT" || m === "SHOW_OBSERVATION_ONLY";

  return {
    noVerifiedInSamples: results.every((r) => r.tradePlanVerificationStatus !== "VERIFIED"),
    conflictNeverVerified: results.every((r) => !r.conflictDetected || r.tradePlanVerificationStatus !== "VERIFIED"),
    allOperationalUseFalse: results.every((r) => r.operationalUseAllowed === false),
    allObservationOnlyTrue: results.every((r) => r.observationOnly === true),
    allBuySellCommandFalse: results.every((r) => r.buySellCommandGenerated === false),
    allAutoOrderFalse: results.every((r) => r.autoOrderRequested === false),
    allManualSignoffRequired: results.every((r) => r.manualSignoffRequired === true),
    allManualSignoffNotCompleted: results.every((r) => r.manualSignoffCompleted === false),
    allProductionSwitchDisallowed: results.every((r) => r.productionSwitchAllowed === false),
    missingDisplayModeConsistent: results.every((r) => !has(r.sourceResolutionStatus, "missing") || missingOk(r.tradePlanDisplayMode)),
    staleDisplayModeConsistent: results.every((r) => !has(r.sourceResolutionStatus, "stale") || staleOk(r.tradePlanDisplayMode)),
    unauthorizedDisplayModeConsistent: results.every((r) => !has(r.sourceResolutionStatus, "unauthorized") || unauthorizedOk(r.tradePlanDisplayMode)),
    conflictDisplayModeConsistent: results.every((r) => !has(r.sourceResolutionStatus, "conflict") || conflictOk(r.tradePlanDisplayMode)),
  };
}
