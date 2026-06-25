/**
 * First Authorized Source Dry-Run API Contract Builder — V40
 *
 * Pure builder. Wraps the V39 first-authorized-source dry-run bundle into a
 * fixture-only mock_or_contract API response for
 * GET /api/portfolio/first-authorized-source-dry-run. The dry-run bundle is
 * sourced from the V39 pure builder (never duplicated / faked), and the summary
 * is derived strictly from that bundle.
 *
 * This is NOT a runtime and connects to NO source. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; production writes are always BLOCKED
 *   - No buy/sell commands; no auto orders
 *   - No concrete data-source name (source-neutral / single-source only)
 */

import { buildFirstAuthorizedSourceDryRunContract } from "./build-first-authorized-source-dry-run-contract";
import type { FirstAuthorizedSourceDryRunBundle } from "./first-authorized-source-dry-run-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

const API_SAFETY_LABELS: string[] = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "First Authorized Source Dry-Run API 不是自動交易系統",
  "fixture data 不是即時資料",
  "V40 不接真資料",
  "V40 不建立 runtime",
  "V40 不寫資料",
  "First Authorized Source Dry-Run API 不是 production",
  "First Authorized Source Dry-Run API 不代表可寫資料",
  "First Authorized Source Dry-Run API 不代表產生買賣指令",
  "production write 一律 BLOCKED",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "priceVerified = false 時不得輸出精準價位",
  "資料不足就顯示資料不足",
];

export interface FirstAuthorizedSourceDryRunApiSummary {
  decision: string;
  dryRunAllowed: false;
  manualSignOffCompleted: false;
  authorizationStatus: string;
  legalStatus: string;
  sourceCategory: string;
  requestMode: string;
  requestPerformed: false;
  rawResponseStored: false;
  normalizedSnapshotProduced: false;
  priceVerified: false;
  highConfidenceConclusionAllowed: false;
  precisePriceZoneAllowed: false;
  projectedAlertLevel: string;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionWriteRequested: false;
  writeAttempted: false;
  databaseWritePerformed: false;
  externalOrderPerformed: false;
  productionWritePerformed: false;
  supabaseConnected: false;
  dryRunCanContinue: boolean;
  rollbackRequired: boolean;
  noWriteProofStatus: string;
}

export interface FirstAuthorizedSourceDryRunApiResponse {
  apiContractVersion: "V40";
  responseSource: "mock_or_contract";
  sourceMode: "fixture";
  generatedAt: string;
  fixtureVersion: "V40";
  dryRunBundle: FirstAuthorizedSourceDryRunBundle;
  summary: FirstAuthorizedSourceDryRunApiSummary;
  safetyLabels: string[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

export interface BuildFirstAuthorizedSourceDryRunApiContractInput {
  generatedAt?: string;
}

/**
 * Builds a deterministic, fixture-only First Authorized Source Dry-Run API
 * response. The dry-run bundle comes from the V39 pure builder; the summary is
 * derived strictly from it. All timestamps come from `input.generatedAt` (or a
 * fixed fallback string); no clock is read.
 */
export function buildFirstAuthorizedSourceDryRunApiContract(
  input: BuildFirstAuthorizedSourceDryRunApiContractInput = {},
): FirstAuthorizedSourceDryRunApiResponse {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  // dryRunBundle MUST come from the V39 pure builder (never faked / bypassed).
  const dryRunBundle = buildFirstAuthorizedSourceDryRunContract({ generatedAt });

  // summary is derived strictly from the bundle's read-only invariants.
  const summary: FirstAuthorizedSourceDryRunApiSummary = {
    decision: dryRunBundle.decision,
    dryRunAllowed: dryRunBundle.dryRunAllowed,
    manualSignOffCompleted: dryRunBundle.preflight.manualSignOffCompleted,
    authorizationStatus: dryRunBundle.preflight.authorizationStatus,
    legalStatus: dryRunBundle.preflight.legalStatus,
    sourceCategory: dryRunBundle.preflight.sourceCategory,
    requestMode: dryRunBundle.connectorShape.requestMode,
    requestPerformed: dryRunBundle.connectorShape.requestPerformed,
    rawResponseStored: dryRunBundle.connectorShape.rawResponseStored,
    normalizedSnapshotProduced: dryRunBundle.connectorShape.normalizedSnapshotProduced,
    priceVerified: dryRunBundle.quoteSnapshot.priceVerified,
    highConfidenceConclusionAllowed: dryRunBundle.priceVerification.highConfidenceConclusionAllowed,
    precisePriceZoneAllowed: dryRunBundle.priceVerification.precisePriceZoneAllowed,
    projectedAlertLevel: dryRunBundle.alertProjection.projectedAlertLevel,
    buySellCommandGenerated: dryRunBundle.alertProjection.buySellCommandGenerated,
    autoOrderRequested: dryRunBundle.alertProjection.autoOrderRequested,
    productionWriteRequested: dryRunBundle.alertProjection.productionWriteRequested,
    writeAttempted: dryRunBundle.noWriteProof.writeAttempted,
    databaseWritePerformed: dryRunBundle.noWriteProof.databaseWritePerformed,
    externalOrderPerformed: dryRunBundle.noWriteProof.externalOrderPerformed,
    productionWritePerformed: dryRunBundle.noWriteProof.productionWritePerformed,
    supabaseConnected: dryRunBundle.noWriteProof.supabaseConnected,
    dryRunCanContinue: dryRunBundle.killSwitch.dryRunCanContinue,
    rollbackRequired: dryRunBundle.rollback.rollbackRequired,
    noWriteProofStatus: dryRunBundle.noWriteProof.proofStatus,
  };

  return {
    apiContractVersion: "V40",
    responseSource: "mock_or_contract",
    sourceMode: "fixture",
    generatedAt,
    fixtureVersion: "V40",
    dryRunBundle,
    summary,
    safetyLabels: [...API_SAFETY_LABELS, ...dryRunBundle.safetyLabels],
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
