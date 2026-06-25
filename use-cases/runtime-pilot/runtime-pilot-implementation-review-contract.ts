/**
 * Runtime Pilot Implementation Review Contract — V38
 *
 * Read-model TypeScript contract for the FINAL implementation review gate BEFORE
 * a first authorized-source dry-run may be implemented. This file contains TYPES
 * + a few static safety CONSTANTS ONLY. It declares no runtime, performs no
 * fetch, imports no Supabase client, reads no environment keys, calls Date.now
 * on nothing, and writes no data.
 *
 * V38 is spec-only / contract-only: it only describes the review items, severity,
 * status, go/no-go decision, authorized-source preflight, implementation
 * boundary and audit / rollback / kill-switch review shape that must be signed
 * off before V39. Even when the decision is GO, V39 stays dry-run / no-write: it
 * can NEVER generate buy/sell commands, NEVER auto-order, and NEVER write
 * production data. Manual sign-off is required and starts incomplete.
 *
 * Concrete source names (TWSE / TPEx / Yahoo / FinMind / TradingView /
 * yfinance-like) live in the docs as governance notes, never in this contract.
 *
 * See: docs/runtime-pilot-implementation-review.md
 * See: docs/runtime-pilot-dry-run-spec.md
 * See: docs/runtime-pilot-readiness-checklist.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type RuntimePilotImplementationReviewItemId =
  | "REVIEW_SOURCE_AUTHORIZATION"
  | "REVIEW_SOURCE_LEGAL_STATUS"
  | "REVIEW_RATE_LIMIT_POLICY"
  | "REVIEW_MARKET_SESSION_HANDLING"
  | "REVIEW_TIMESTAMP_NORMALIZATION"
  | "REVIEW_STALE_GUARD"
  | "REVIEW_SOURCE_CONFLICT_THRESHOLD"
  | "REVIEW_FALLBACK_DOWNGRADE"
  | "REVIEW_NO_DANGER_GUARD"
  | "REVIEW_DRY_RUN_DEFAULT"
  | "REVIEW_NO_WRITE_ENFORCEMENT"
  | "REVIEW_AUDIT_LOG_SHAPE"
  | "REVIEW_ROLLBACK_PLAN"
  | "REVIEW_KILL_SWITCH"
  | "REVIEW_MONITORING_VISIBILITY"
  | "REVIEW_NO_BUY_SELL_COMMAND"
  | "REVIEW_NO_AUTO_ORDER"
  | "REVIEW_PRODUCTION_WRITE_BLOCKED"
  | "REVIEW_MANUAL_SIGN_OFF"
  | "REVIEW_DEPLOYMENT_ROLLBACK";

export type RuntimePilotImplementationReviewSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type RuntimePilotImplementationReviewStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "BLOCKED"
  | "NOT_REVIEWED"
  | "NOT_APPLICABLE";

export type RuntimePilotImplementationDecision =
  | "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN"
  | "NO_GO"
  | "BLOCKED"
  | "READY_FOR_REVIEW"
  | "DATA_INSUFFICIENT";

export type RuntimePilotImplementationFeatureArea =
  | "SOURCE_PREFLIGHT"
  | "RUNTIME_DRY_RUN"
  | "PRICE_VERIFICATION"
  | "ALERT_PROJECTION"
  | "AUDIT_LOG"
  | "ROLLBACK"
  | "KILL_SWITCH"
  | "MONITORING_UI"
  | "DEPLOYMENT";

// ---------------------------------------------------------------------------
// Review item
// ---------------------------------------------------------------------------

export interface RuntimePilotImplementationReviewItem {
  itemId: RuntimePilotImplementationReviewItemId;
  itemLabel: string;
  severity: RuntimePilotImplementationReviewSeverity;
  status: RuntimePilotImplementationReviewStatus;
  featureArea: RuntimePilotImplementationFeatureArea;
  passed: boolean;
  blockingReason: string | null;
  warningReason: string | null;
  requiredEvidence: string[];
  missingEvidence: string[];
  reviewerRequired: boolean;
  reviewerName: string | null;
  reviewedAt: string | null;
  nextRequiredAction: string | null;
  ownerHint: string | null;
}

// ---------------------------------------------------------------------------
// Decision summary
// ---------------------------------------------------------------------------

export interface RuntimePilotImplementationDecisionSummary {
  decision: RuntimePilotImplementationDecision;
  criticalItemCount: number;
  criticalItemPassedCount: number;
  blockedItemCount: number;
  notReviewedItemCount: number;
  warningItemCount: number;
  allCriticalItemsPassed: boolean;
  manualSignOffRequired: true;
  manualSignOffCompleted: false;
  dryRunOnly: true;
  noWriteModeRequired: true;
  productionWriteAllowed: false;
  buySellCommandGenerationBlocked: true;
  autoOrderBlocked: true;
  notTradeAdviceAlwaysTrue: true;
  decisionReason: string;
}

// ---------------------------------------------------------------------------
// Authorized source preflight review
// ---------------------------------------------------------------------------

export interface RuntimePilotAuthorizedSourcePreflightReview {
  sourceDescriptorId: string;
  authorizationEvidence: string | null;
  legalStatusEvidence: string | null;
  rateLimitEvidence: string | null;
  sourcePriorityEvidence: string | null;
  sourceTimestampEvidence: string | null;
  freshnessWindowEvidence: string | null;
  conflictThresholdEvidence: string | null;
  fallbackDowngradeEvidence: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewStatus: RuntimePilotImplementationReviewStatus;
}

// ---------------------------------------------------------------------------
// Implementation boundary
// ---------------------------------------------------------------------------

export interface RuntimePilotImplementationBoundary {
  dryRunOnly: true;
  readOnly: true;
  noWrite: true;
  noProductionWrite: true;
  noBuySellCommand: true;
  noAutoOrder: true;
  noDirectTradingAction: true;
  highConfidenceConclusionBlockedWhenDataInsufficient: true;
  dangerBlockedWhenPriceNotVerified: true;
  dangerBlockedWhenStale: true;
  dangerBlockedWhenSourceConflict: true;
  dangerBlockedWhenFallbackOnly: true;
}

// ---------------------------------------------------------------------------
// Audit / rollback / kill-switch review
// ---------------------------------------------------------------------------

export interface RuntimePilotImplementationAuditReview {
  auditEventShapePresent: boolean;
  includesNoWriteProofId: boolean;
  includesKillSwitchChecked: boolean;
  includesRollbackRequired: boolean;
  recordsRequestPerformed: boolean;
  recordsSupabaseConnected: boolean;
  recordsProductionWritePerformed: boolean;
  recordsBuySellCommandGenerated: boolean;
  recordsAutoOrderRequested: boolean;
}

export interface RuntimePilotImplementationRollbackReview {
  rollbackIdReviewed: boolean;
  rollbackRequiredReviewed: boolean;
  rollbackReasonReviewed: boolean;
  rollbackTriggerReviewed: boolean;
  affectedFeatureReviewed: boolean;
  rollbackStatusReviewed: boolean;
  manualReviewRequiredReviewed: boolean;
}

export interface RuntimePilotImplementationKillSwitchReview {
  killSwitchIdReviewed: boolean;
  enabledReviewed: boolean;
  checkedAtReviewed: boolean;
  affectedRuntimeReviewed: boolean;
  stopReasonReviewed: boolean;
  requiresManualReviewReviewed: boolean;
  dryRunCanContinueReviewed: boolean;
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

export interface RuntimePilotImplementationReviewBundle {
  contractVersion: "V38";
  sourceMode: "spec_only";
  generatedAt: string;
  reviewItems: RuntimePilotImplementationReviewItem[];
  decisionSummary: RuntimePilotImplementationDecisionSummary;
  authorizedSourcePreflight: RuntimePilotAuthorizedSourcePreflightReview;
  implementationBoundary: RuntimePilotImplementationBoundary;
  auditReview: RuntimePilotImplementationAuditReview;
  rollbackReview: RuntimePilotImplementationRollbackReview;
  killSwitchReview: RuntimePilotImplementationKillSwitchReview;
  safetyLabels: string[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const RUNTIME_PILOT_IMPLEMENTATION_REVIEW_CONTRACT_VERSION = "V38" as const;

/**
 * All twenty implementation review items, in canonical order.
 */
export const RUNTIME_PILOT_IMPLEMENTATION_REVIEW_ALLOWED_ITEMS: readonly RuntimePilotImplementationReviewItemId[] = [
  "REVIEW_SOURCE_AUTHORIZATION",
  "REVIEW_SOURCE_LEGAL_STATUS",
  "REVIEW_RATE_LIMIT_POLICY",
  "REVIEW_MARKET_SESSION_HANDLING",
  "REVIEW_TIMESTAMP_NORMALIZATION",
  "REVIEW_STALE_GUARD",
  "REVIEW_SOURCE_CONFLICT_THRESHOLD",
  "REVIEW_FALLBACK_DOWNGRADE",
  "REVIEW_NO_DANGER_GUARD",
  "REVIEW_DRY_RUN_DEFAULT",
  "REVIEW_NO_WRITE_ENFORCEMENT",
  "REVIEW_AUDIT_LOG_SHAPE",
  "REVIEW_ROLLBACK_PLAN",
  "REVIEW_KILL_SWITCH",
  "REVIEW_MONITORING_VISIBILITY",
  "REVIEW_NO_BUY_SELL_COMMAND",
  "REVIEW_NO_AUTO_ORDER",
  "REVIEW_PRODUCTION_WRITE_BLOCKED",
  "REVIEW_MANUAL_SIGN_OFF",
  "REVIEW_DEPLOYMENT_ROLLBACK",
] as const;

/**
 * The critical review items. If any of these is not PASS, the decision must be
 * NO_GO.
 */
export const RUNTIME_PILOT_IMPLEMENTATION_REVIEW_CRITICAL_ITEMS: readonly RuntimePilotImplementationReviewItemId[] = [
  "REVIEW_SOURCE_AUTHORIZATION",
  "REVIEW_NO_WRITE_ENFORCEMENT",
  "REVIEW_KILL_SWITCH",
  "REVIEW_NO_BUY_SELL_COMMAND",
  "REVIEW_NO_AUTO_ORDER",
  "REVIEW_PRODUCTION_WRITE_BLOCKED",
  "REVIEW_MANUAL_SIGN_OFF",
] as const;

export const RUNTIME_PILOT_IMPLEMENTATION_REVIEW_ALLOWED_DECISIONS: readonly RuntimePilotImplementationDecision[] = [
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
  "NO_GO",
  "BLOCKED",
  "READY_FOR_REVIEW",
  "DATA_INSUFFICIENT",
] as const;

/**
 * Canonical safety labels. Every implementation-review surface must keep these
 * negations intact.
 */
export const RUNTIME_PILOT_IMPLEMENTATION_REVIEW_SAFETY_LABELS = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "Runtime Pilot Implementation Review 不是自動交易系統",
  "V38 不接真資料",
  "V38 不建立 runtime",
  "V38 不寫資料",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表可寫資料",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表產生買賣指令",
  "production write 一律 BLOCKED",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "priceVerified = false 時不得輸出精準價位",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any implementation-review surface. Spec vocabulary such as runtime / pilot /
 * review / source / audit / rollback / kill switch is NOT banned.
 */
export const RUNTIME_PILOT_IMPLEMENTATION_REVIEW_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
