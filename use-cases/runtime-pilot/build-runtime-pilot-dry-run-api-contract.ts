/**
 * Runtime Pilot Dry-Run API Contract Builder — V36
 *
 * Pure builder. Wraps the V35 Runtime Pilot dry-run bundle into a fixture-only
 * mock_or_contract API response for GET /api/portfolio/runtime-pilot-dry-run.
 * The dry-run bundle is sourced from the V35 pure builder (never duplicated /
 * faked), and the summary is derived from that bundle.
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

import { buildRuntimePilotDryRunContract } from "./build-runtime-pilot-dry-run-contract";
import type { RuntimePilotDryRunBundle } from "./runtime-pilot-dry-run-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

const API_SAFETY_LABELS: string[] = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "Runtime Pilot Dry-Run API 不是自動交易系統",
  "fixture data 不是即時資料",
  "V36 不接真資料",
  "V36 不建立 runtime",
  "V36 不寫資料",
  "Dry-run API 不是 production",
  "Dry-run API 不代表可寫資料",
  "Dry-run API 不代表產生買賣指令",
  "production write 一律 BLOCKED",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "priceVerified = false 時不得輸出精準價位",
  "資料不足就顯示資料不足",
];

export interface RuntimePilotDryRunApiSummary {
  lifecycleState: string;
  readinessDecision: string;
  dryRunAllowed: false;
  priceVerified: false;
  highConfidenceConclusionAllowed: false;
  precisePriceZoneAllowed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionWriteRequested: false;
  writeAttempted: false;
  databaseWritePerformed: false;
  externalOrderPerformed: false;
  productionWritePerformed: false;
  supabaseConnected: false;
  killSwitchEnabled: boolean;
  dryRunCanContinue: boolean;
  rollbackRequired: boolean;
  noWriteProofStatus: string;
}

export interface RuntimePilotDryRunApiResponse {
  apiContractVersion: "V36";
  responseSource: "mock_or_contract";
  sourceMode: "fixture";
  runtimeMode: "dry_run_spec";
  generatedAt: string;
  fixtureVersion: "V36";
  dryRunBundle: RuntimePilotDryRunBundle;
  summary: RuntimePilotDryRunApiSummary;
  safetyLabels: string[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

export interface BuildRuntimePilotDryRunApiContractInput {
  generatedAt?: string;
}

/**
 * Builds a deterministic, fixture-only Runtime Pilot Dry-Run API response. The
 * dry-run bundle comes from the V35 pure builder; the summary is derived from
 * it. All timestamps come from `input.generatedAt` (or a fixed fallback string);
 * no clock is read.
 */
export function buildRuntimePilotDryRunApiContract(
  input: BuildRuntimePilotDryRunApiContractInput = {},
): RuntimePilotDryRunApiResponse {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  // dryRunBundle MUST come from the V35 pure builder (never faked / bypassed).
  const dryRunBundle = buildRuntimePilotDryRunContract({ generatedAt });

  // summary is derived strictly from the bundle's read-only invariants.
  const summary: RuntimePilotDryRunApiSummary = {
    lifecycleState: dryRunBundle.lifecycleState,
    readinessDecision: dryRunBundle.readinessDecision,
    dryRunAllowed: false,
    priceVerified: false,
    highConfidenceConclusionAllowed: false,
    precisePriceZoneAllowed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionWriteRequested: false,
    writeAttempted: false,
    databaseWritePerformed: false,
    externalOrderPerformed: false,
    productionWritePerformed: false,
    supabaseConnected: false,
    killSwitchEnabled: dryRunBundle.killSwitch.enabled,
    dryRunCanContinue: dryRunBundle.killSwitch.dryRunCanContinue,
    rollbackRequired: dryRunBundle.rollback.rollbackRequired,
    noWriteProofStatus: dryRunBundle.noWriteProof.proofStatus,
  };

  return {
    apiContractVersion: "V36",
    responseSource: "mock_or_contract",
    sourceMode: "fixture",
    runtimeMode: "dry_run_spec",
    generatedAt,
    fixtureVersion: "V36",
    dryRunBundle,
    summary,
    safetyLabels: [...API_SAFETY_LABELS, ...dryRunBundle.safetyLabels],
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
