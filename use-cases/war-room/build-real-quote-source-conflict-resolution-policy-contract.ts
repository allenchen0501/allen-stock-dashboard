/**
 * Real Quote Source Conflict Resolution Policy Builder — V67
 *
 * Pure deterministic builder. Defines the conflict rules, sample candidate values
 * (aligned to the V66 source candidates + field catalog), and the resolved sample
 * results (always operational-use-BLOCKED), then self-validates that the engine
 * ranks by V66 conflictPriorityRank and detects every conflict kind.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - Every candidate value stays NOT connected / NOT authorized; resolution never
 *     allows operational use; sign-off / production flags are NEVER flipped
 */

import { buildAuthorizedRealQuoteFieldCatalogContract } from "./build-authorized-real-quote-field-catalog-contract";
import type { AuthorizedRealQuoteSourceCandidate } from "./authorized-real-quote-field-catalog-contract";
import {
  buildConflictResolutionResult,
  detectQuoteSourceConflict,
  rankSourceCandidateValues,
} from "./real-quote-source-conflict-resolution-engine";
import {
  REAL_QUOTE_SOURCE_CONFLICT_RESOLUTION_POLICY_SAFETY_LABELS,
  REAL_QUOTE_SOURCE_CONFLICT_RESOLUTION_POLICY_SPEC_NAME,
} from "./real-quote-source-conflict-resolution-policy-contract";
import type {
  QuoteSourceCandidateValue,
  QuoteSourceConflictResolutionPolicy,
  QuoteSourceConflictResolutionResult,
  QuoteSourceConflictResolutionValidation,
  QuoteSourceConflictRule,
} from "./real-quote-source-conflict-resolution-policy-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildRealQuoteSourceConflictResolutionPolicyContractInput {
  generatedAt?: string;
}

function rankOf(sourceName: string, sources: AuthorizedRealQuoteSourceCandidate[]): number {
  return sources.find((s) => s.sourceName === sourceName)?.conflictPriorityRank ?? Number.MAX_SAFE_INTEGER;
}

function candidateValue(
  sourceName: string,
  fieldName: string,
  valuePreview: string,
  valueTimestamp: string,
  isAvailable: boolean,
  isStale: boolean,
  sources: AuthorizedRealQuoteSourceCandidate[],
): QuoteSourceCandidateValue {
  return {
    sourceName,
    fieldName,
    valueKind: "price",
    valuePreview,
    valueTimestamp,
    isAvailable,
    isStale,
    isAuthorized: false,
    isConnected: false,
    // Priority is DERIVED from the V66 catalog — never hand-written separately.
    sourcePriorityRank: rankOf(sourceName, sources),
    verificationStatus: "NOT_CONNECTED",
    operationalUseAllowed: false,
  };
}

function buildConflictRules(): QuoteSourceConflictRule[] {
  const common = {
    staleDataBehavior: "stale 超時即排除該來源；若僅剩 stale 則降級 BLOCKED_STALE_DATA",
    missingDataBehavior: "缺值即排除該來源；全缺則 BLOCKED_MISSING_DATA",
    timestampMismatchBehavior: "時間戳不一致即標示衝突，取較高優先且非 stale 者，仍降級",
    valueMismatchBehavior: "數值不一致即標示衝突，依 conflictPriorityRank 取較高優先，仍降級",
    unauthorizedSourceBehavior: "未授權來源不得採用（spec 全部未授權）",
    notConnectedSourceBehavior: "未連線來源不得採用（spec 全部未連線）→ BLOCKED_NOT_CONNECTED",
    conflictOutcome: "輸出 degraded result，operationalUseAllowed=false，requires manual review",
    operationalUseAllowed: false as const,
  };
  return [
    { ruleName: "price-fields-priority", appliesToFieldCategory: "price", primarySourcePriority: 1, ...common },
    { ruleName: "support-resistance-priority", appliesToFieldCategory: "support", primarySourcePriority: 4, ...common },
    { ruleName: "provenance-priority", appliesToFieldCategory: "provenance", primarySourcePriority: 5, ...common },
  ];
}

/**
 * Builds the conflict resolution policy. Reads no clock, no env, no network — only
 * the V66 source candidates / field catalog (for ranks + known names) and the pure
 * engine; everything stays SPEC_ONLY_NOT_CONNECTED and operational-use-blocked.
 */
export function buildRealQuoteSourceConflictResolutionPolicyContract(
  input: BuildRealQuoteSourceConflictResolutionPolicyContractInput = {},
): QuoteSourceConflictResolutionPolicy {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const catalog = buildAuthorizedRealQuoteFieldCatalogContract({ generatedAt });
  const sources = catalog.sourceCandidates;
  const knownSourceNames = new Set(sources.map((s) => s.sourceName));
  const knownFieldNames = new Set(catalog.fieldCatalogItems.map((i) => i.fieldName));

  const TWSE = "TWSE official candidate";
  const TPEX = "TPEx official candidate";
  const YAHOO = "Yahoo Finance Taiwan candidate";
  const GOODINFO = "Goodinfo candidate";

  // Sample candidate values: lastPrice from 3 price sources (value + timestamp
  // mismatch, Yahoo stale), supportLevel from Goodinfo + TWSE (one missing).
  const sampleCandidateValues: QuoteSourceCandidateValue[] = [
    candidateValue(TWSE, "lastPrice", "101.5", "2026-06-23T05:30:00.000Z", true, false, sources),
    candidateValue(TPEX, "lastPrice", "101.4", "2026-06-23T05:29:55.000Z", true, false, sources),
    candidateValue(YAHOO, "lastPrice", "101.0", "2026-06-23T05:20:00.000Z", true, true, sources),
    candidateValue(GOODINFO, "supportLevel", "96.0", "2026-06-23T05:00:00.000Z", true, false, sources),
    candidateValue(TWSE, "supportLevel", "(none)", "2026-06-23T05:00:00.000Z", false, false, sources),
  ];

  const conflictRules = buildConflictRules();
  const policyContext = { conflictRules };

  const sampleResolutionResults: QuoteSourceConflictResolutionResult[] = [
    buildConflictResolutionResult("lastPrice", sampleCandidateValues, policyContext),
    buildConflictResolutionResult("supportLevel", sampleCandidateValues, policyContext),
  ];

  // ----- self validation -----
  const ranked = rankSourceCandidateValues(
    sampleCandidateValues.filter((v) => v.fieldName === "lastPrice"),
    sources,
  );
  const rankSortsByPriority = ranked.every(
    (v, i, arr) => i === 0 || arr[i - 1].sourcePriorityRank <= v.sourcePriorityRank,
  );
  const ranksAlignedToV66 = sampleCandidateValues.every(
    (v) => v.sourcePriorityRank === rankOf(v.sourceName, sources),
  );
  const sampleSourceNamesKnown = sampleCandidateValues.every((v) => knownSourceNames.has(v.sourceName));
  const sampleFieldNamesKnown = sampleCandidateValues.every((v) => knownFieldNames.has(v.fieldName));

  // Detection probes (deterministic synthetic inputs).
  const base = candidateValue(TWSE, "lastPrice", "100", "2026-06-23T05:30:00.000Z", true, false, sources);
  const detectsMissingData = detectQuoteSourceConflict([base, { ...base, sourceName: TPEX, isAvailable: false }]).hasMissingData;
  const detectsStaleData = detectQuoteSourceConflict([base, { ...base, sourceName: TPEX, isStale: true }]).hasStaleData;
  const detectsTimestampMismatch = detectQuoteSourceConflict([base, { ...base, sourceName: TPEX, valueTimestamp: "2026-06-23T05:31:00.000Z" }]).hasTimestampMismatch;
  const detectsValueMismatch = detectQuoteSourceConflict([base, { ...base, sourceName: TPEX, valuePreview: "200" }]).hasValueMismatch;
  const detectsUnauthorizedSource = detectQuoteSourceConflict([base]).hasUnauthorizedSource;
  const detectsNotConnectedSource = detectQuoteSourceConflict([base]).hasNotConnectedSource;

  const allResultsOperationalUseFalse = sampleResolutionResults.every((r) => r.operationalUseAllowed === false);
  const allResultsManualSignoffRequired = sampleResolutionResults.every((r) => r.manualSignoffRequired === true);
  const allResultsManualSignoffNotCompleted = sampleResolutionResults.every((r) => r.manualSignoffCompleted === false);
  const allResultsProductionSwitchDisallowed = sampleResolutionResults.every((r) => r.productionSwitchAllowed === false);

  const validation: QuoteSourceConflictResolutionValidation = {
    ranksAlignedToV66,
    sampleSourceNamesKnown,
    sampleFieldNamesKnown,
    rankSortsByPriority,
    detectsMissingData,
    detectsStaleData,
    detectsTimestampMismatch,
    detectsValueMismatch,
    detectsUnauthorizedSource,
    detectsNotConnectedSource,
    allResultsOperationalUseFalse,
    allResultsManualSignoffRequired,
    allResultsManualSignoffNotCompleted,
    allResultsProductionSwitchDisallowed,
    valid: false,
  };
  validation.valid = Object.entries(validation).every(([k, v]) => k === "valid" || v === true);

  return {
    contractVersion: "V67",
    specName: REAL_QUOTE_SOURCE_CONFLICT_RESOLUTION_POLICY_SPEC_NAME,
    policyMode: "SPEC_ONLY_NOT_CONNECTED",
    sourceCatalogMode: "SPEC_ONLY_NOT_CONNECTED",
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

    conflictRules,
    sampleCandidateValues,
    sampleResolutionResults,
    validation,

    safetyLabels: [...REAL_QUOTE_SOURCE_CONFLICT_RESOLUTION_POLICY_SAFETY_LABELS],
  };
}
