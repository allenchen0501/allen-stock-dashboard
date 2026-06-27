/**
 * Real Quote Source Conflict Resolution Engine — V67
 *
 * Pure, deterministic conflict-resolution functions. NO side effects, NO I/O. These
 * never connect to Supabase, never read env, never fetch, never read a clock, never
 * write data. They only turn a set of candidate values into a ranking, a conflict
 * detection, and a degraded (operational-use-BLOCKED) resolution result.
 *
 * In spec mode every candidate value is isAuthorized=false / isConnected=false, so
 * resolution always degrades and NEVER produces operationalUseAllowed=true.
 */

import type { AuthorizedRealQuoteSourceCandidate } from "./authorized-real-quote-field-catalog-contract";
import type {
  QuoteSourceCandidateValue,
  QuoteSourceConflictDetection,
  QuoteSourceConflictResolutionResult,
  QuoteSourceConflictRule,
} from "./real-quote-source-conflict-resolution-policy-contract";

/** Minimal policy context the engine needs (kept structural to avoid cycles). */
export interface ConflictPolicyContext {
  conflictRules: QuoteSourceConflictRule[];
}

/**
 * Returns the candidate values sorted by source priority. Priority is taken from the
 * V66 source candidates (sourceName → conflictPriorityRank); a value whose source is
 * unknown falls back to its own sourcePriorityRank, then to the end. Ties break by
 * sourceName for determinism. Does not mutate the input.
 */
export function rankSourceCandidateValues(
  values: QuoteSourceCandidateValue[],
  sourceCandidates: AuthorizedRealQuoteSourceCandidate[],
): QuoteSourceCandidateValue[] {
  const rankByName = new Map(sourceCandidates.map((s) => [s.sourceName, s.conflictPriorityRank] as const));
  return [...values].sort((a, b) => {
    const ra = rankByName.get(a.sourceName) ?? a.sourcePriorityRank ?? Number.MAX_SAFE_INTEGER;
    const rb = rankByName.get(b.sourceName) ?? b.sourcePriorityRank ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.sourceName.localeCompare(b.sourceName);
  });
}

/**
 * Detects the kinds of conflict present across the candidate values: missing data,
 * stale data, timestamp mismatch, value mismatch, unauthorized source, not-connected
 * source. conflictDetected is true if any kind is present.
 */
export function detectQuoteSourceConflict(values: QuoteSourceCandidateValue[]): QuoteSourceConflictDetection {
  const available = values.filter((v) => v.isAvailable);
  const hasMissingData = values.some((v) => !v.isAvailable);
  const hasStaleData = values.some((v) => v.isStale);
  const hasTimestampMismatch = new Set(available.map((v) => v.valueTimestamp)).size > 1;
  const hasValueMismatch = new Set(available.map((v) => v.valuePreview)).size > 1;
  const hasUnauthorizedSource = values.some((v) => v.isAuthorized === false);
  const hasNotConnectedSource = values.some((v) => v.isConnected === false);
  const conflictDetected =
    hasMissingData ||
    hasStaleData ||
    hasTimestampMismatch ||
    hasValueMismatch ||
    hasUnauthorizedSource ||
    hasNotConnectedSource;
  return {
    hasMissingData,
    hasStaleData,
    hasTimestampMismatch,
    hasValueMismatch,
    hasUnauthorizedSource,
    hasNotConnectedSource,
    conflictDetected,
  };
}

function sortByOwnRank(values: QuoteSourceCandidateValue[]): QuoteSourceCandidateValue[] {
  return [...values].sort((a, b) => {
    if (a.sourcePriorityRank !== b.sourcePriorityRank) return a.sourcePriorityRank - b.sourcePriorityRank;
    return a.sourceName.localeCompare(b.sourceName);
  });
}

/**
 * Resolves a conflict deterministically and returns a DEGRADED result. The "selected"
 * source is the highest-priority available, non-stale candidate (spec-only — a
 * would-be choice), but because spec sources are never connected/authorized the
 * degraded status BLOCKS operational use. operationalUseAllowed is ALWAYS false.
 */
export function resolveQuoteSourceConflict(
  values: QuoteSourceCandidateValue[],
  policy: ConflictPolicyContext,
): QuoteSourceConflictResolutionResult {
  const fieldName = values[0]?.fieldName ?? "(unknown)";
  const detection = detectQuoteSourceConflict(values);
  const sorted = sortByOwnRank(values);
  const usable = sorted.filter((v) => v.isAvailable && !v.isStale);
  const selected = usable[0] ?? sorted[0];

  let degradedStatus: QuoteSourceConflictResolutionResult["degradedStatus"];
  if (!selected) degradedStatus = "BLOCKED_MISSING_DATA";
  else if (selected.isConnected === false) degradedStatus = "BLOCKED_NOT_CONNECTED";
  else if (selected.isAuthorized === false) degradedStatus = "BLOCKED_UNAUTHORIZED";
  else if (selected.isStale) degradedStatus = "BLOCKED_STALE_DATA";
  else degradedStatus = "DEGRADED_FIXTURE_ONLY";

  const selectedSourceName = selected ? selected.sourceName : "(none)";
  const selectedValuePreview = selected ? selected.valuePreview : "(none)";
  const rejectedSourceNames = sorted.filter((v) => v !== selected).map((v) => v.sourceName);

  const ruleNote = policy.conflictRules.length > 0 ? `（policy rules: ${policy.conflictRules.length}）` : "";
  const resolutionReason =
    `多來源依 conflictPriorityRank 排序後，最高優先候選為 ${selectedSourceName}，` +
    `但來源未連線 / 未授權，降級為 ${degradedStatus}，不可作為正式操作依據${ruleNote}。` +
    (detection.conflictDetected ? "（偵測到來源衝突）" : "");

  return {
    fieldName,
    conflictDetected: detection.conflictDetected,
    selectedSourceName,
    selectedValuePreview,
    rejectedSourceNames,
    degradedStatus,
    resolutionReason,
    verificationStatus: "NOT_CONNECTED",
    operationalUseAllowed: false,
    requiresManualReview: true,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    productionSwitchAllowed: false,
  };
}

/**
 * Convenience wrapper: builds a resolution result for a named field from its
 * candidate values. operationalUseAllowed stays false; manual review/sign-off
 * required and not completed.
 */
export function buildConflictResolutionResult(
  fieldName: string,
  values: QuoteSourceCandidateValue[],
  policy: ConflictPolicyContext,
): QuoteSourceConflictResolutionResult {
  const scoped = values.filter((v) => v.fieldName === fieldName);
  const result = resolveQuoteSourceConflict(scoped.length > 0 ? scoped : values, policy);
  return { ...result, fieldName };
}
