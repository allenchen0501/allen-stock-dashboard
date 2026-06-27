/**
 * Conflict Resolution to Trade Plan Verification Downgrade Matrix Contract — V68
 *
 * Read-model TypeScript contract describing — spec-only — how a V67 conflict
 * resolution result downgrades a V63 CandidateTradePlan: its verificationStatus, UI
 * display mode, which operational levels stay visible, and why. TYPES + static
 * CONSTANTS ONLY.
 *
 * This is a MATRIX, not a connection. No runtime, no fetch, no Supabase client, no
 * env reads, no clock reads, no DB writes, no API route. Every downgrade result stays
 * observationOnly = true, operationalUseAllowed = false. VERIFIED is FUTURE-ONLY: it
 * is never used as an active sample status while fixture-only.
 *
 * Layer described (extends V67):
 *   QuoteSourceConflictResolutionResult → TradePlanVerificationDowngrade →
 *   CandidateTradePlan UI state → observation only / blocked / hidden / stale / conflict
 *
 * See: docs/conflict-to-trade-plan-verification.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type TradePlanVerificationStatus =
  | "FIXTURE_ONLY"
  | "NOT_CONNECTED"
  | "SOURCE_CONFLICT"
  | "STALE_DATA"
  | "MISSING_DATA"
  | "UNAUTHORIZED_SOURCE"
  | "MANUAL_REVIEW_REQUIRED"
  | "OBSERVATION_ONLY"
  | "BLOCKED"
  // FUTURE-ONLY — never used as an active sample status while fixture-only.
  | "VERIFIED";

export type TradePlanDisplayMode =
  | "SHOW_FIXTURE_WITH_WARNING"
  | "SHOW_OBSERVATION_ONLY"
  | "SHOW_BLOCKED_CONFLICT"
  | "SHOW_BLOCKED_MISSING_DATA"
  | "SHOW_BLOCKED_STALE_DATA"
  | "SHOW_BLOCKED_UNAUTHORIZED"
  | "HIDE_OPERATIONAL_LEVELS";

export type ConflictMatrixMode = "SPEC_ONLY_NOT_CONNECTED";

// ---------------------------------------------------------------------------
// Rule + result
// ---------------------------------------------------------------------------

export interface TradePlanVerificationDowngradeRule {
  ruleName: string;
  conflictSignal: string;
  targetVerificationStatus: TradePlanVerificationStatus;
  targetDisplayMode: TradePlanDisplayMode;
  operationalUseAllowed: false;
  buyZoneVisible: boolean;
  targetZoneVisible: boolean;
  riskRewardVisible: boolean;
  requiresManualReview: true;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  reasonText: string;
}

export interface TradePlanVerificationDowngradeResult {
  symbol: string;
  name: string;
  sourceConflictFieldName: string;
  conflictDetected: boolean;
  sourceResolutionStatus: string;
  tradePlanVerificationStatus: TradePlanVerificationStatus;
  tradePlanDisplayMode: TradePlanDisplayMode;
  buyZoneVisible: boolean;
  targetZoneVisible: boolean;
  riskRewardVisible: boolean;
  observationOnly: true;
  operationalUseAllowed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  requiresManualReview: true;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  productionSwitchAllowed: false;
  reasonText: string;
}

// ---------------------------------------------------------------------------
// Validation + matrix
// ---------------------------------------------------------------------------

export interface ConflictToTradePlanVerificationValidation {
  everyConflictResultHasDowngrade: boolean;
  everyDowngradeMapsToTradePlan: boolean;
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
  valid: boolean;
}

export interface ConflictToTradePlanVerificationMatrix {
  contractVersion: "V68";
  specName: "Conflict Resolution to Trade Plan Verification Downgrade Matrix";
  matrixMode: ConflictMatrixMode;
  generatedAt: string;
  decision: "READY_FOR_UI_REVIEW" | "NO_GO";

  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  fetchPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  productionReady: false;

  downgradeRules: TradePlanVerificationDowngradeRule[];
  sampleDowngradeResults: TradePlanVerificationDowngradeResult[];
  validation: ConflictToTradePlanVerificationValidation;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CONFLICT_TO_TRADE_PLAN_VERIFICATION_CONTRACT_VERSION = "V68" as const;

export const CONFLICT_TO_TRADE_PLAN_VERIFICATION_SPEC_NAME =
  "Conflict Resolution to Trade Plan Verification Downgrade Matrix" as const;

export const CONFLICT_TO_TRADE_PLAN_VERIFICATION_SAFETY_LABELS = [
  "Conflict Resolution to Trade Plan Verification Downgrade Matrix",
  "SPEC_ONLY_NOT_CONNECTED",
  "TradePlanVerificationStatus",
  "TradePlanDisplayMode",
  "SOURCE_CONFLICT",
  "STALE_DATA",
  "MISSING_DATA",
  "UNAUTHORIZED_SOURCE",
  "MANUAL_REVIEW_REQUIRED",
  "OBSERVATION_ONLY",
  "BLOCKED",
  "VERIFIED future-only",
  "observation only",
  "operationalUseAllowed false",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "productionSwitchAllowed false",
  "來源衝突或缺值時，承接區會降級為觀察，不可作為正式操作依據",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no fetch",
  "no real market data",
  "no API route",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
] as const;
