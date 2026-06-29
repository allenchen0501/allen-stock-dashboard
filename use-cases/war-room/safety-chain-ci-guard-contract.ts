/**
 * Safety Chain CI Guard Contract — V73
 *
 * Read-model TypeScript contract for a single CI guard that aggregates the V60–V72
 * safety chain: it confirms every chain builder still reports its locked decision and
 * that no commit has flipped a NO_GO / fixture-only / not-connected / no-runtime /
 * no-production-switch safety flag to true. TYPES + static CONSTANTS ONLY.
 *
 * This is a GUARD, not a connection. No runtime, no fetch, no Supabase client, no env
 * reads, no clock reads, no DB writes, no API route. The guard's own decision is
 * READY_FOR_CI_GUARD (ready to act as a guard) — which is NOT production ready.
 * Manual sign-off / staging / real quote / production switch flags are NEVER flipped.
 *
 * See: docs/safety-chain-ci-guard.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type SafetyChainGuardMode = "SPEC_ONLY_CI_GUARD";

// ---------------------------------------------------------------------------
// Check + result
// ---------------------------------------------------------------------------

export interface SafetyChainCiGuardCheck {
  checkId: string;
  sourceVersion: string;
  sourceScript: string;
  sourceContract: string;
  expectedDecision: string;
  expectedMode: string;
  requiredStatus: string;
  guardCategory: string;
  critical: true;
  passed: boolean;
  failureReason: string;
}

export interface SafetyChainCiGuardResult {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  criticalFailedChecks: number;
  allCriticalPassed: boolean;
  allNoGoLocksPreserved: boolean;
  allRuntimeFlagsFalse: boolean;
  allOperationalUseBlocked: boolean;
  productionSwitchStillBlocked: boolean;
  decision: string;
}

// ---------------------------------------------------------------------------
// Validation + contract
// ---------------------------------------------------------------------------

export interface SafetyChainCiGuardValidation {
  checksNonEmpty: boolean;
  coversV60ToV72Scripts: boolean;
  allChecksCritical: boolean;
  allChecksPassed: boolean;
  noFailedChecks: boolean;
  noCriticalFailures: boolean;
  allCriticalPassed: boolean;
  allNoGoLocksPreserved: boolean;
  allRuntimeFlagsFalse: boolean;
  allOperationalUseBlocked: boolean;
  productionSwitchStillBlocked: boolean;
  decisionReadyForCiGuard: boolean;
  valid: boolean;
}

export interface SafetyChainCiGuardContract {
  contractVersion: "V73";
  specName: "Safety Chain CI Guard";
  guardMode: SafetyChainGuardMode;
  generatedAt: string;
  decision: "READY_FOR_CI_GUARD" | "NO_GO";

  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  fetchPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  productionReady: false;

  checks: SafetyChainCiGuardCheck[];
  result: SafetyChainCiGuardResult;
  validation: SafetyChainCiGuardValidation;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SAFETY_CHAIN_CI_GUARD_CONTRACT_VERSION = "V73" as const;

export const SAFETY_CHAIN_CI_GUARD_SPEC_NAME = "Safety Chain CI Guard" as const;

/** The 13 safety-chain scripts the guard must cover (V60–V72). */
export const SAFETY_CHAIN_CI_GUARD_REQUIRED_SCRIPTS = [
  "test:allen-war-room-operational-layout",
  "test:allen-score-scoring-model",
  "test:allen-score-deterministic-scoring-engine",
  "test:structured-candidate-trade-plan",
  "test:candidate-price-level-fixture-source",
  "test:descriptor-to-real-quote-mapping",
  "test:authorized-real-quote-field-catalog",
  "test:real-quote-source-conflict-resolution-policy",
  "test:conflict-to-trade-plan-verification",
  "test:downgraded-trade-plan-ui-behavior",
  "test:unified-connection-evidence-ledger",
  "test:evidence-ledger-transition",
  "test:ledger-integrity-rollup",
] as const;

/** Flags that must never be true anywhere in the chain bundles. */
export const SAFETY_CHAIN_CI_GUARD_FORBIDDEN_TRUE_FLAGS = [
  "realDataConnected",
  "runtimeCreated",
  "apiRouteCreated",
  "envReadPerformed",
  "fetchPerformed",
  "supabaseConnected",
  "databaseWritePerformed",
  "portfolioApiSwitched",
  "productionReady",
  "productionTradingReady",
  "operationalUseAllowed",
  "productionSwitchAllowed",
  "buySellCommandGenerated",
  "autoOrderRequested",
] as const;

export const SAFETY_CHAIN_CI_GUARD_SAFETY_LABELS = [
  "Safety Chain CI Guard",
  "SPEC_ONLY_CI_GUARD",
  "READY_FOR_CI_GUARD",
  "fixture/mock safe mode",
  "NOT_CONNECTED",
  "SPEC_ONLY_NOT_CONNECTED",
  "SPEC_ONLY_PENDING_EVIDENCE",
  "SPEC_ONLY_PREVIEW_NOT_CONNECTED",
  "SPEC_ONLY_SAFETY_GATE",
  "NO_GO",
  "READY_FOR_UI_REVIEW is not production ready",
  "allRuntimeFlagsFalse true",
  "allOperationalUseBlocked true",
  "productionSwitchStillBlocked true",
  "realDataConnected false",
  "productionReady false",
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
