/**
 * Runtime Pilot Dry-Run Contract Builder — V35
 *
 * Pure builder. Returns a deterministic spec_only RuntimePilotDryRunBundle that
 * describes the dry-run behaviour shape. Default lifecycle is DRY_RUN_NOT_ALLOWED
 * and readinessDecision is NO_GO: dry-run is not yet allowed, never writes, never
 * generates buy/sell commands, never auto-orders.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; production writes are always BLOCKED
 *   - No buy/sell commands; no auto orders
 */

import {
  RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS,
} from "./runtime-pilot-dry-run-contract";
import type {
  RuntimePilotDryRunAlertProjection,
  RuntimePilotDryRunAuditEvent,
  RuntimePilotDryRunBundle,
  RuntimePilotDryRunKillSwitch,
  RuntimePilotDryRunNoWriteProof,
  RuntimePilotDryRunPriceVerification,
  RuntimePilotDryRunQuoteSnapshot,
  RuntimePilotDryRunRollback,
  RuntimePilotDryRunSourceDescriptor,
} from "./runtime-pilot-dry-run-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";
const FX = "dry-run spec sample｜非即時資料｜不是投資建議";

export interface BuildRuntimePilotDryRunContractInput {
  generatedAt?: string;
}

/**
 * Builds a deterministic, spec_only Runtime Pilot dry-run bundle. All timestamps
 * come from `input.generatedAt` (or a fixed fallback string); no clock is read.
 */
export function buildRuntimePilotDryRunContract(
  input: BuildRuntimePilotDryRunContractInput = {},
): RuntimePilotDryRunBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const sourceDescriptor: RuntimePilotDryRunSourceDescriptor = {
    sourceDescriptorId: "dry-run-source-sample",
    sourceMode: "spec_only",
    sourceAuthorizationStatus: "NOT_REVIEWED",
    sourcePriority: "NOT_AVAILABLE",
    sourceTimestamp: null,
    sourceFreshnessWindowSeconds: null,
    sourceLegalStatusReviewed: false,
    sourceRateLimitReviewed: false,
    sourceProvenanceRecorded: false,
    requestPerformed: false,
  };

  const quoteSnapshot: RuntimePilotDryRunQuoteSnapshot = {
    snapshotId: "dry-run-snapshot-sample",
    stockId: "0000",
    stockName: `spec sample（${FX}）`,
    currentPrice: null,
    previousClose: null,
    intradayHigh: null,
    intradayLow: null,
    volumeRatio: null,
    marketSessionStatus: null,
    sourceDescriptorId: sourceDescriptor.sourceDescriptorId,
    priceVerified: false,
    requestPerformed: false,
  };

  const priceVerification: RuntimePilotDryRunPriceVerification = {
    priceVerified: false,
    priceVerificationStatus: "NOT_VERIFIED",
    freshnessStatus: "UNKNOWN",
    sourceConflictStatus: "DATA_INSUFFICIENT",
    dataQualityStatus: "DATA_INSUFFICIENT",
    highConfidenceConclusionAllowed: false,
    requiredVerification: ["source authorization", "official / licensed price feed"],
    missingDataFields: ["currentPrice", "sourceTimestamp"],
    precisePriceZoneAllowed: false,
    noDangerGuardApplied: true,
  };

  const noWriteProof: RuntimePilotDryRunNoWriteProof = {
    proofId: "dry-run-nowrite-proof-sample",
    generatedAt,
    writeAttempted: false,
    productionWritePerformed: false,
    databaseWritePerformed: false,
    externalOrderPerformed: false,
    supabaseConnected: false,
    blockedWriteOperations: ["production write", "supabase write", "external order"],
    evidenceLabels: ["no-write spec proof", "production write 一律 BLOCKED"],
    proofStatus: "BLOCKED",
  };

  const alertProjection: RuntimePilotDryRunAlertProjection = {
    alertProjectionId: "dry-run-projection-sample",
    stockId: quoteSnapshot.stockId,
    stockName: quoteSnapshot.stockName,
    projectedState: "DATA_INSUFFICIENT",
    projectedAlertLevel: "DATA_INSUFFICIENT",
    triggerType: "DATA_QUALITY_DOWNGRADE",
    priceVerified: false,
    freshnessStatus: "UNKNOWN",
    sourceConflictStatus: "DATA_INSUFFICIENT",
    sourcePriority: "NOT_AVAILABLE",
    dataQualityStatus: "DATA_INSUFFICIENT",
    noDangerGuardApplied: true,
    downgradeReason: `priceVerified = false，降級為資料不足（${FX}）。`,
    notExitSignal: true,
    notTradeAdvice: true,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionWriteRequested: false,
  };

  const auditEvent: RuntimePilotDryRunAuditEvent = {
    auditEventId: "dry-run-audit-sample",
    generatedAt,
    lifecycleState: "DRY_RUN_NOT_ALLOWED",
    sourceDescriptorId: sourceDescriptor.sourceDescriptorId,
    stockId: quoteSnapshot.stockId,
    readinessDecision: "NO_GO",
    priceVerificationStatus: priceVerification.priceVerificationStatus,
    freshnessStatus: priceVerification.freshnessStatus,
    sourceConflictStatus: priceVerification.sourceConflictStatus,
    dataQualityStatus: priceVerification.dataQualityStatus,
    projectedAlertLevel: alertProjection.projectedAlertLevel,
    noWriteProofId: noWriteProof.proofId,
    killSwitchChecked: true,
    rollbackRequired: false,
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
  };

  const killSwitch: RuntimePilotDryRunKillSwitch = {
    killSwitchId: "dry-run-killswitch-sample",
    enabled: false,
    checkedAt: generatedAt,
    affectedRuntime: "RUNTIME_DATA_PIPELINE",
    stopReason: null,
    requiresManualReview: true,
    // Kill switch is not yet reviewed, so dry-run cannot continue.
    dryRunCanContinue: false,
  };

  const rollback: RuntimePilotDryRunRollback = {
    rollbackId: "dry-run-rollback-sample",
    rollbackRequired: false,
    rollbackReason: null,
    rollbackTrigger: "any CRITICAL gate FAIL / BLOCKED during dry-run",
    affectedFeature: "RUNTIME_DATA_PIPELINE",
    rollbackStatus: "NOT_READY",
    manualReviewRequired: true,
  };

  return {
    contractVersion: "V35",
    sourceMode: "spec_only",
    runtimeMode: "dry_run_spec",
    generatedAt,
    lifecycleState: "DRY_RUN_NOT_ALLOWED",
    readinessDecision: "NO_GO",
    dryRunAllowed: false,
    sourceDescriptor,
    quoteSnapshot,
    priceVerification,
    alertProjection,
    auditEvent,
    noWriteProof,
    killSwitch,
    rollback,
    safetyLabels: [...RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS],
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
