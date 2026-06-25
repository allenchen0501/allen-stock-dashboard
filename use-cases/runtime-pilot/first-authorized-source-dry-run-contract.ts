/**
 * First Authorized Source Dry-Run Contract — V39
 *
 * Read-model TypeScript contract for the FUTURE first-authorized-source dry-run
 * behaviour. This file contains TYPES + a few static safety CONSTANTS ONLY. It
 * declares no runtime, performs no fetch, imports no Supabase client, reads no
 * environment keys, builds no data-source connector, calls Date.now on nothing,
 * and writes no data.
 *
 * Although the name contains "Authorized Source", V39 is spec-only /
 * contract-only / source-neutral: it only describes the preflight, connector
 * shape, quote-snapshot normalization, price-verification gate, alert
 * projection, audit / no-write proof / kill switch / rollback shape that a
 * future single-source dry-run must satisfy. It connects to NO source, writes NO
 * data, generates NO buy/sell commands, and auto-orders NOTHING.
 *
 * Source governance uses ABSTRACT categories only (OFFICIAL_OR_AUTHORIZED /
 * EXCHANGE_AUTHORIZED / …). No concrete data-source name appears in this
 * contract.
 *
 * See: docs/first-authorized-source-dry-run-spec.md
 * See: docs/runtime-pilot-implementation-review.md
 * See: docs/runtime-pilot-dry-run-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

// Abstract source categories only — never a concrete data-source runtime name.
export type FirstAuthorizedSourceDryRunSourceCategory =
  | "OFFICIAL_OR_AUTHORIZED"
  | "EXCHANGE_AUTHORIZED"
  | "AUTHORIZED_INTERMEDIARY"
  | "VENDOR_AUTHORIZED"
  | "MANUAL_REVIEW_REQUIRED"
  | "NOT_AVAILABLE";

export type FirstAuthorizedSourceDryRunReviewStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "BLOCKED"
  | "NOT_REVIEWED"
  | "NOT_APPLICABLE";

export type FirstAuthorizedSourceDryRunDecision =
  | "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN"
  | "NO_GO"
  | "BLOCKED"
  | "READY_FOR_REVIEW"
  | "DATA_INSUFFICIENT";

export type FirstAuthorizedSourceDryRunRequestMode = "dry_run" | "disabled" | "not_available";

export type FirstAuthorizedSourceDryRunDataQualityStatus =
  | "OK"
  | "WARNING"
  | "DATA_INSUFFICIENT"
  | "STALE_DATA"
  | "SOURCE_CONFLICT"
  | "FALLBACK_ONLY"
  | "NOT_VERIFIED";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface FirstAuthorizedSourcePreflight {
  sourceDescriptorId: string;
  sourceCategory: FirstAuthorizedSourceDryRunSourceCategory;
  authorizationStatus: FirstAuthorizedSourceDryRunReviewStatus;
  legalStatus: FirstAuthorizedSourceDryRunReviewStatus;
  authorizationEvidence: string | null;
  legalStatusEvidence: string | null;
  rateLimitEvidence: string | null;
  timestampEvidence: string | null;
  freshnessWindowEvidence: string | null;
  conflictThresholdEvidence: string | null;
  fallbackDowngradeEvidence: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  manualSignOffCompleted: false;
  preflightDecision: FirstAuthorizedSourceDryRunDecision;
}

export interface FirstAuthorizedSourceConnectorShape {
  connectorId: string;
  sourceDescriptorId: string;
  sourceCategory: FirstAuthorizedSourceDryRunSourceCategory;
  sourcePriority: string;
  requestMode: FirstAuthorizedSourceDryRunRequestMode;
  requestPerformed: false;
  rawResponseStored: false;
  normalizedSnapshotProduced: false;
  rateLimitPolicyApplied: boolean;
  marketSessionChecked: boolean;
  timestampNormalized: boolean;
  productionWritePerformed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
}

export interface FirstAuthorizedSourceQuoteSnapshot {
  snapshotId: string;
  stockId: string;
  stockName: string;
  sourceDescriptorId: string;
  normalizedAt: string | null;
  sourceTimestamp: string | null;
  marketSessionStatus: string | null;
  currentPrice: number | null;
  previousClose: number | null;
  intradayHigh: number | null;
  intradayLow: number | null;
  volumeRatio: number | null;
  priceVerified: false;
  missingDataFields: string[];
  requestPerformed: false;
}

export interface FirstAuthorizedSourcePriceVerificationGate {
  verificationId: string;
  priceVerified: false;
  priceVerificationStatus: string;
  freshnessStatus: string;
  sourceConflictStatus: string;
  dataQualityStatus: FirstAuthorizedSourceDryRunDataQualityStatus;
  sourcePriority: string;
  noDangerGuardApplied: true;
  highConfidenceConclusionAllowed: false;
  precisePriceZoneAllowed: false;
  requiredVerification: string[];
  missingDataFields: string[];
  downgradeReason: string | null;
}

export interface FirstAuthorizedSourceAlertProjection {
  alertProjectionId: string;
  projectedState: string;
  projectedAlertLevel: string;
  triggerType: string;
  dataQualityStatus: FirstAuthorizedSourceDryRunDataQualityStatus;
  noDangerGuardApplied: true;
  downgradeReason: string | null;
  notExitSignal: true;
  notTradeAdvice: true;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionWriteRequested: false;
}

export interface FirstAuthorizedSourceAuditEvent {
  auditEventId: string;
  generatedAt: string;
  sourceDescriptorId: string;
  connectorId: string;
  snapshotId: string;
  verificationId: string;
  alertProjectionId: string;
  preflightDecision: FirstAuthorizedSourceDryRunDecision;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
}

export interface FirstAuthorizedSourceNoWriteProof {
  proofId: string;
  writeAttempted: false;
  databaseWritePerformed: false;
  productionWritePerformed: false;
  externalOrderPerformed: false;
  supabaseConnected: false;
  blockedWriteOperations: string[];
  proofStatus: FirstAuthorizedSourceDryRunReviewStatus;
}

export interface FirstAuthorizedSourceKillSwitch {
  killSwitchId: string;
  enabled: boolean;
  checkedAt: string | null;
  dryRunCanContinue: boolean;
  requiresManualReview: true;
}

export interface FirstAuthorizedSourceRollback {
  rollbackId: string;
  rollbackRequired: boolean;
  rollbackReason: string | null;
  rollbackStatus: string;
  manualReviewRequired: true;
}

export interface FirstAuthorizedSourceDryRunBundle {
  contractVersion: "V39";
  sourceMode: "spec_only";
  generatedAt: string;
  decision: FirstAuthorizedSourceDryRunDecision;
  dryRunAllowed: false;
  preflight: FirstAuthorizedSourcePreflight;
  connectorShape: FirstAuthorizedSourceConnectorShape;
  quoteSnapshot: FirstAuthorizedSourceQuoteSnapshot;
  priceVerification: FirstAuthorizedSourcePriceVerificationGate;
  alertProjection: FirstAuthorizedSourceAlertProjection;
  auditEvent: FirstAuthorizedSourceAuditEvent;
  noWriteProof: FirstAuthorizedSourceNoWriteProof;
  killSwitch: FirstAuthorizedSourceKillSwitch;
  rollback: FirstAuthorizedSourceRollback;
  safetyLabels: string[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const FIRST_AUTHORIZED_SOURCE_DRY_RUN_CONTRACT_VERSION = "V39" as const;

/**
 * Abstract authorized-source categories. Never a concrete data-source name.
 */
export const FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_SOURCE_CATEGORIES: readonly FirstAuthorizedSourceDryRunSourceCategory[] = [
  "OFFICIAL_OR_AUTHORIZED",
  "EXCHANGE_AUTHORIZED",
  "AUTHORIZED_INTERMEDIARY",
  "VENDOR_AUTHORIZED",
  "MANUAL_REVIEW_REQUIRED",
  "NOT_AVAILABLE",
] as const;

export const FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_DECISIONS: readonly FirstAuthorizedSourceDryRunDecision[] = [
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
  "NO_GO",
  "BLOCKED",
  "READY_FOR_REVIEW",
  "DATA_INSUFFICIENT",
] as const;

export const FIRST_AUTHORIZED_SOURCE_DRY_RUN_ALLOWED_REQUEST_MODES: readonly FirstAuthorizedSourceDryRunRequestMode[] = [
  "dry_run",
  "disabled",
  "not_available",
] as const;

/**
 * Canonical safety labels. Every first-authorized-source dry-run surface must
 * keep these negations intact.
 */
export const FIRST_AUTHORIZED_SOURCE_DRY_RUN_SAFETY_LABELS = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "First Authorized Source Dry-Run Spec 不是自動交易系統",
  "V39 不接真資料",
  "V39 不建立 runtime",
  "V39 不寫資料",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不是 production",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表可寫資料",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN 不代表產生買賣指令",
  "production write 一律 BLOCKED",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "priceVerified = false 時不得輸出精準價位",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any first-authorized-source dry-run surface. Spec vocabulary such as runtime /
 * pilot / dry-run / source / connector / audit / rollback is NOT banned.
 */
export const FIRST_AUTHORIZED_SOURCE_DRY_RUN_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
