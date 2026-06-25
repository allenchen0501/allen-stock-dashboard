/**
 * First Authorized Source Dry-Run Contract Builder — V39
 *
 * Pure builder. Returns a deterministic spec_only first-authorized-source
 * dry-run bundle. Default decision is NO_GO: manual sign-off has not been
 * completed and source authorization has not been reviewed, so a single-source
 * dry-run may not be implemented yet.
 *
 * This is NOT a runtime and connects to NO source. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; production writes are always BLOCKED
 *   - No buy/sell commands; no auto orders
 */

import {
  FIRST_AUTHORIZED_SOURCE_DRY_RUN_SAFETY_LABELS,
} from "./first-authorized-source-dry-run-contract";
import type {
  FirstAuthorizedSourceAlertProjection,
  FirstAuthorizedSourceAuditEvent,
  FirstAuthorizedSourceConnectorShape,
  FirstAuthorizedSourceDryRunBundle,
  FirstAuthorizedSourceKillSwitch,
  FirstAuthorizedSourceNoWriteProof,
  FirstAuthorizedSourcePreflight,
  FirstAuthorizedSourcePriceVerificationGate,
  FirstAuthorizedSourceQuoteSnapshot,
  FirstAuthorizedSourceRollback,
} from "./first-authorized-source-dry-run-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const FX = "dry-run spec sample｜非即時資料｜不是投資建議";

export interface BuildFirstAuthorizedSourceDryRunContractInput {
  generatedAt?: string;
}

/**
 * Builds a deterministic, spec_only first-authorized-source dry-run bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildFirstAuthorizedSourceDryRunContract(
  input: BuildFirstAuthorizedSourceDryRunContractInput = {},
): FirstAuthorizedSourceDryRunBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const preflight: FirstAuthorizedSourcePreflight = {
    sourceDescriptorId: "fas-source-sample",
    sourceCategory: "MANUAL_REVIEW_REQUIRED",
    authorizationStatus: "NOT_REVIEWED",
    legalStatus: "NOT_REVIEWED",
    authorizationEvidence: null,
    legalStatusEvidence: null,
    rateLimitEvidence: null,
    timestampEvidence: null,
    freshnessWindowEvidence: null,
    conflictThresholdEvidence: null,
    fallbackDowngradeEvidence: null,
    reviewerName: null,
    reviewedAt: null,
    manualSignOffCompleted: false,
    preflightDecision: "NO_GO",
  };

  const connectorShape: FirstAuthorizedSourceConnectorShape = {
    connectorId: "fas-connector-sample",
    sourceDescriptorId: preflight.sourceDescriptorId,
    sourceCategory: preflight.sourceCategory,
    sourcePriority: "NOT_AVAILABLE",
    requestMode: "disabled",
    requestPerformed: false,
    rawResponseStored: false,
    normalizedSnapshotProduced: false,
    rateLimitPolicyApplied: false,
    marketSessionChecked: false,
    timestampNormalized: false,
    productionWritePerformed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };

  const quoteSnapshot: FirstAuthorizedSourceQuoteSnapshot = {
    snapshotId: "fas-snapshot-sample",
    stockId: "0000",
    stockName: `spec sample（${FX}）`,
    sourceDescriptorId: preflight.sourceDescriptorId,
    normalizedAt: null,
    sourceTimestamp: null,
    marketSessionStatus: null,
    currentPrice: null,
    previousClose: null,
    intradayHigh: null,
    intradayLow: null,
    volumeRatio: null,
    priceVerified: false,
    missingDataFields: ["currentPrice", "sourceTimestamp"],
    requestPerformed: false,
  };

  const priceVerification: FirstAuthorizedSourcePriceVerificationGate = {
    verificationId: "fas-verification-sample",
    priceVerified: false,
    priceVerificationStatus: "NOT_VERIFIED",
    freshnessStatus: "UNKNOWN",
    sourceConflictStatus: "DATA_INSUFFICIENT",
    dataQualityStatus: "DATA_INSUFFICIENT",
    sourcePriority: "NOT_AVAILABLE",
    noDangerGuardApplied: true,
    highConfidenceConclusionAllowed: false,
    precisePriceZoneAllowed: false,
    requiredVerification: ["source authorization", "official / authorized price feed"],
    missingDataFields: ["currentPrice", "sourceTimestamp"],
    downgradeReason: `priceVerified = false，降級為資料不足（${FX}）。`,
  };

  const alertProjection: FirstAuthorizedSourceAlertProjection = {
    alertProjectionId: "fas-projection-sample",
    projectedState: "DATA_INSUFFICIENT",
    projectedAlertLevel: "DATA_INSUFFICIENT",
    triggerType: "DATA_QUALITY_DOWNGRADE",
    dataQualityStatus: "DATA_INSUFFICIENT",
    noDangerGuardApplied: true,
    downgradeReason: `priceVerified = false 時不得輸出精準價位（${FX}）。`,
    notExitSignal: true,
    notTradeAdvice: true,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionWriteRequested: false,
  };

  const noWriteProof: FirstAuthorizedSourceNoWriteProof = {
    proofId: "fas-nowrite-proof-sample",
    writeAttempted: false,
    databaseWritePerformed: false,
    productionWritePerformed: false,
    externalOrderPerformed: false,
    supabaseConnected: false,
    blockedWriteOperations: ["production write", "supabase write", "external order"],
    proofStatus: "BLOCKED",
  };

  const auditEvent: FirstAuthorizedSourceAuditEvent = {
    auditEventId: "fas-audit-sample",
    generatedAt,
    sourceDescriptorId: preflight.sourceDescriptorId,
    connectorId: connectorShape.connectorId,
    snapshotId: quoteSnapshot.snapshotId,
    verificationId: priceVerification.verificationId,
    alertProjectionId: alertProjection.alertProjectionId,
    preflightDecision: preflight.preflightDecision,
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };

  const killSwitch: FirstAuthorizedSourceKillSwitch = {
    killSwitchId: "fas-killswitch-sample",
    enabled: false,
    checkedAt: generatedAt,
    // Kill switch not yet reviewed, so dry-run cannot continue.
    dryRunCanContinue: false,
    requiresManualReview: true,
  };

  const rollback: FirstAuthorizedSourceRollback = {
    rollbackId: "fas-rollback-sample",
    rollbackRequired: false,
    rollbackReason: null,
    rollbackStatus: "NOT_READY",
    manualReviewRequired: true,
  };

  return {
    contractVersion: "V39",
    sourceMode: "spec_only",
    generatedAt,
    decision: "NO_GO",
    dryRunAllowed: false,
    preflight,
    connectorShape,
    quoteSnapshot,
    priceVerification,
    alertProjection,
    auditEvent,
    noWriteProof,
    killSwitch,
    rollback,
    safetyLabels: [...FIRST_AUTHORIZED_SOURCE_DRY_RUN_SAFETY_LABELS],
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
