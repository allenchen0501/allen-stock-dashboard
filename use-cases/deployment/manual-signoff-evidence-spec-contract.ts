/**
 * Manual Sign-off Evidence Spec Contract — V56
 *
 * Read-model TypeScript contract defining the DATA STRUCTURE of the future manual
 * sign-off evidence: required evidence, signer identity/authority, sign-off
 * scope, external verification items, and GO/NO-GO rules. This file contains
 * TYPES + a few static safety CONSTANTS ONLY. It declares no runtime, performs no
 * fetch, imports no Supabase client, reads no environment keys, calls Date.now on
 * nothing, writes no data, and connects to nothing.
 *
 * V56 is the sign-off evidence STRUCTURE, NOT an actual sign-off. No sign-off /
 * connection / review-allowed flag is ever flipped to true here: there is no real
 * human sign-off evidence yet, so manualSignoffCompleted is false,
 * manualSignoffEvidenceProvided is false, manualSignerIdentityVerified is false,
 * manualSignerHasAuthority is false, stagingConnectionAllowed is false,
 * stagingConnectionReviewAllowed is false, and the default decision is NO_GO. The
 * V55 connection review gate exists but its decision remains NO_GO.
 *
 * See: docs/manual-signoff-evidence-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ManualSignoffEvidenceDeploymentTarget = "staging";

// Note: "PRODUCTION_READY" is deliberately NOT a member — V56 can never decide a
// production go-live.
export type ManualSignoffEvidenceDecision =
  | "NO_GO"
  | "READY_FOR_REVIEW"
  | "BLOCKED"
  | "NOT_REVIEWED";

export type ManualSignoffEvidenceV55Decision = "NO_GO";

export type ManualSignoffEvidenceCategory =
  | "SIGNER_IDENTITY"
  | "SIGNER_AUTHORITY"
  | "V55_GATE"
  | "SUPABASE_PROJECT_IDENTITY"
  | "STAGING_URL_VERIFICATION"
  | "ENVIRONMENT_SECRET_HANDLING"
  | "ROLE_ACCESS"
  | "RLS_SELECT_ONLY"
  | "WRITE_BLOCKING"
  | "SHADOW_ONLY"
  | "PORTFOLIO_SOURCE_MODE"
  | "KILL_SWITCH"
  | "ROLLBACK_PLAN"
  | "DATA_SOURCE_SAFETY"
  | "TRADING_SAFETY"
  | "PRODUCTION_READINESS";

export type ManualSignoffEvidenceStatus =
  | "PASS"
  | "FAIL"
  | "WARNING"
  | "NOT_PROVIDED"
  | "NOT_REVIEWED"
  | "BLOCKED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ManualSignoffEvidenceRequirementItem {
  evidenceId: string;
  category: ManualSignoffEvidenceCategory;
  title: string;
  requiredEvidence: string;
  acceptedEvidenceFormat: string;
  expectedState: string;
  providedState: string;
  status: ManualSignoffEvidenceStatus;
  requiredBeforeManualSignoff: boolean;
  requiredBeforeConnectionReview: boolean;
  requiredBeforeActualConnection: boolean;
  blocksManualSignoff: boolean;
  blocksConnectionReview: boolean;
  blocksActualConnection: boolean;
  blocksProductionReadiness: boolean;
  manualReviewRequired: boolean;
  notes: string;
}

export interface ManualSignoffEvidenceSpecBundle {
  contractVersion: "V56";
  specName: "Manual Sign-off Evidence Spec";
  deploymentTarget: "staging";
  generatedAt: string;
  decision: ManualSignoffEvidenceDecision;

  evidenceRequirementItems: ManualSignoffEvidenceRequirementItem[];

  // Frozen top-level safety flags.
  manualSignoffEvidenceSpecDefined: true;
  actualManualSignoffPerformed: false;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  manualSignoffEvidenceProvided: false;
  manualSignerIdentityVerified: false;
  manualSignerHasAuthority: false;
  v55ConnectionReviewGatePassed: true;
  v55Decision: "NO_GO";
  stagingConnectionAllowed: false;
  stagingConnectionReviewAllowed: false;
  actualConnectionImplemented: false;
  actualConnectionAttempted: false;
  productionReadinessAllowed: false;
  stagingSupabaseConnected: false;
  stagingReadPerformed: false;
  stagingWritePerformed: false;
  productionSupabaseConnected: false;
  productionWritePerformed: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  requestPerformed: false;
  apiRouteCreated: false;
  uiCreated: false;
  sqlMigrationCreated: false;
  runtimeCreated: false;
  shadowRunnerRuntimeCreated: false;
  shadowRunnerExecuted: false;
  shadowComparisonPerformed: false;
  shadowResultPersisted: false;
  portfolioApiSwitched: false;
  portfolioSourceModeChanged: false;
  realMarketDataEnabled: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  killSwitchDefaultEnabled: true;
  fixtureCanBeOverriddenByStaging: false;
  hardcodedCanBeOverriddenByStaging: false;
  mismatchCanPromoteStaging: false;
  dryRunCanPromoteStaging: false;
  emptyResultCanOverrideHardcoded: false;
  staleResultCanOverrideHardcoded: false;
  errorResultCanOverrideHardcoded: false;
  serviceRoleAllowedInAppRuntime: false;
  anonRoleAllowed: false;
  dashboardReadonlyRoleRequired: true;
  readOnlySelectOnlyRequired: true;
  writeOperationsBlocked: true;
  shadowOnlyRequired: true;
  portfolioApiMustRemainHardcoded: true;

  futureGate: string;
  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const MANUAL_SIGNOFF_EVIDENCE_SPEC_CONTRACT_VERSION = "V56" as const;

export const MANUAL_SIGNOFF_EVIDENCE_SPEC_DEPLOYMENT_TARGET = "staging" as const;

export const MANUAL_SIGNOFF_EVIDENCE_SPEC_CATEGORIES: readonly ManualSignoffEvidenceCategory[] = [
  "SIGNER_IDENTITY",
  "SIGNER_AUTHORITY",
  "V55_GATE",
  "SUPABASE_PROJECT_IDENTITY",
  "STAGING_URL_VERIFICATION",
  "ENVIRONMENT_SECRET_HANDLING",
  "ROLE_ACCESS",
  "RLS_SELECT_ONLY",
  "WRITE_BLOCKING",
  "SHADOW_ONLY",
  "PORTFOLIO_SOURCE_MODE",
  "KILL_SWITCH",
  "ROLLBACK_PLAN",
  "DATA_SOURCE_SAFETY",
  "TRADING_SAFETY",
  "PRODUCTION_READINESS",
] as const;

export const MANUAL_SIGNOFF_EVIDENCE_SPEC_ALLOWED_DECISIONS: readonly ManualSignoffEvidenceDecision[] = [
  "NO_GO",
  "READY_FOR_REVIEW",
  "BLOCKED",
  "NOT_REVIEWED",
] as const;

/**
 * Canonical safety labels. Every manual sign-off evidence spec surface must keep
 * these negations intact.
 */
export const MANUAL_SIGNOFF_EVIDENCE_SPEC_SAFETY_LABELS = [
  "Manual Sign-off Evidence Spec",
  "sign-off evidence structure",
  "not actual sign-off",
  "not production trading system",
  "no real market data",
  "no Supabase connection",
  "no env key",
  "no DB write",
  "no staging write",
  "no production write",
  "no SQL migration",
  "no api switch",
  "no buy/sell command",
  "no auto order",
  "V55 connection review gate exists but decision remains NO_GO",
  "manualSignoffRequired = true",
  "manualSignoffCompleted = false",
  "manualSignoffEvidenceProvided = false",
  "manualSignerIdentityVerified = false",
  "manualSignerHasAuthority = false",
  "stagingConnectionAllowed = false",
  "stagingConnectionReviewAllowed = false",
  "actualConnectionImplemented = false",
  "actualConnectionAttempted = false",
  "productionReadinessAllowed = false",
  "serviceRoleAllowedInAppRuntime = false",
  "dashboardReadonlyRoleRequired = true",
  "readOnlySelectOnlyRequired = true",
  "writeOperationsBlocked = true",
  "shadowOnlyRequired = true",
  "PORTFOLIO_SOURCE_MODE must remain hardcoded",
  "/api/portfolio must not be switched",
  "fixture/hardcoded must not be overridden by staging",
  "mismatch must not promote staging",
  "empty / stale / error result must not override hardcoded",
  "kill switch must be enabled by default",
  "fixture/mock UI 仍維持現狀",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any manual sign-off evidence spec surface.
 */
export const MANUAL_SIGNOFF_EVIDENCE_SPEC_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
