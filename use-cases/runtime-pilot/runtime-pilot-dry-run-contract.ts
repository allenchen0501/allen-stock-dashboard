/**
 * Runtime Pilot Dry-Run Contract — V35
 *
 * Read-model TypeScript contract for the FUTURE Runtime Pilot dry-run behaviour.
 * This file contains TYPES + a few static safety CONSTANTS ONLY. It declares no
 * runtime, performs no fetch, imports no Supabase client, reads no environment
 * keys, calls Date.now on nothing, and writes no data.
 *
 * Although the name contains "Dry-Run", V35 is spec-only / contract-only: it
 * only describes the dry-run lifecycle, input boundary, price-verification,
 * alert projection, audit event, no-write proof, kill switch and rollback shape
 * that a future dry-run must satisfy. A dry-run is read-only / no-write: it can
 * NEVER generate buy/sell commands, NEVER auto-order, and NEVER write production
 * data. It must respect the V33 readiness gates and the kill switch.
 *
 * Concrete source names (TWSE / TPEx / Yahoo / FinMind / TradingView /
 * yfinance-like) live in the docs as governance notes, never in this contract.
 *
 * See: docs/runtime-pilot-dry-run-spec.md
 * See: docs/runtime-pilot-readiness-checklist.md
 * See: docs/runtime-data-pipeline-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type RuntimePilotDryRunLifecycleState =
  | "DRY_RUN_NOT_ALLOWED"
  | "DRY_RUN_READY_FOR_REVIEW"
  | "DRY_RUN_ALLOWED"
  | "DRY_RUN_INITIALIZING"
  | "DRY_RUN_OBSERVING"
  | "DRY_RUN_DATA_QUALITY_BLOCKED"
  | "DRY_RUN_SOURCE_CONFLICT_BLOCKED"
  | "DRY_RUN_STALE_DATA_BLOCKED"
  | "DRY_RUN_FALLBACK_ONLY_BLOCKED"
  | "DRY_RUN_STOPPED_BY_KILL_SWITCH"
  | "DRY_RUN_ROLLBACK_REQUIRED"
  | "DRY_RUN_COMPLETED_WITH_NO_WRITE";

export type RuntimePilotDryRunRuntimeMode = "dry_run_spec" | "dry_run" | "disabled";

export type RuntimePilotDryRunSourceMode =
  | "spec_only"
  | "fixture"
  | "authorized_source_pending"
  | "not_available";

export type RuntimePilotDryRunProofStatus = "PASS" | "BLOCKED" | "FAILED" | "NOT_REVIEWED";

export type RuntimePilotDryRunReadinessDecision =
  | "GO_DRY_RUN"
  | "NO_GO"
  | "BLOCKED"
  | "READY_FOR_REVIEW"
  | "DATA_INSUFFICIENT";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface RuntimePilotDryRunSourceDescriptor {
  sourceDescriptorId: string;
  sourceMode: RuntimePilotDryRunSourceMode;
  sourceAuthorizationStatus: string;
  sourcePriority: string;
  sourceTimestamp: string | null;
  sourceFreshnessWindowSeconds: number | null;
  sourceLegalStatusReviewed: boolean;
  sourceRateLimitReviewed: boolean;
  sourceProvenanceRecorded: boolean;
  requestPerformed: false;
}

export interface RuntimePilotDryRunQuoteSnapshot {
  snapshotId: string;
  stockId: string;
  stockName: string;
  currentPrice: number | null;
  previousClose: number | null;
  intradayHigh: number | null;
  intradayLow: number | null;
  volumeRatio: number | null;
  marketSessionStatus: string | null;
  sourceDescriptorId: string;
  priceVerified: boolean;
  requestPerformed: false;
}

export interface RuntimePilotDryRunPriceVerification {
  priceVerified: boolean;
  priceVerificationStatus: string;
  freshnessStatus: string;
  sourceConflictStatus: string;
  dataQualityStatus: string;
  highConfidenceConclusionAllowed: false;
  requiredVerification: string[];
  missingDataFields: string[];
  precisePriceZoneAllowed: false;
  noDangerGuardApplied: true;
}

export interface RuntimePilotDryRunAlertProjection {
  alertProjectionId: string;
  stockId: string;
  stockName: string;
  projectedState: string;
  projectedAlertLevel: string;
  triggerType: string;
  priceVerified: boolean;
  freshnessStatus: string;
  sourceConflictStatus: string;
  sourcePriority: string;
  dataQualityStatus: string;
  noDangerGuardApplied: boolean;
  downgradeReason: string | null;
  notExitSignal: true;
  notTradeAdvice: true;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionWriteRequested: false;
}

export interface RuntimePilotDryRunAuditEvent {
  auditEventId: string;
  generatedAt: string;
  lifecycleState: RuntimePilotDryRunLifecycleState;
  sourceDescriptorId: string;
  stockId: string;
  readinessDecision: RuntimePilotDryRunReadinessDecision;
  priceVerificationStatus: string;
  freshnessStatus: string;
  sourceConflictStatus: string;
  dataQualityStatus: string;
  projectedAlertLevel: string;
  noWriteProofId: string;
  killSwitchChecked: boolean;
  rollbackRequired: boolean;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
}

export interface RuntimePilotDryRunNoWriteProof {
  proofId: string;
  generatedAt: string;
  writeAttempted: false;
  productionWritePerformed: false;
  databaseWritePerformed: false;
  externalOrderPerformed: false;
  supabaseConnected: false;
  blockedWriteOperations: string[];
  evidenceLabels: string[];
  proofStatus: RuntimePilotDryRunProofStatus;
}

export interface RuntimePilotDryRunKillSwitch {
  killSwitchId: string;
  enabled: boolean;
  checkedAt: string | null;
  affectedRuntime: string;
  stopReason: string | null;
  requiresManualReview: true;
  dryRunCanContinue: boolean;
}

export interface RuntimePilotDryRunRollback {
  rollbackId: string;
  rollbackRequired: boolean;
  rollbackReason: string | null;
  rollbackTrigger: string;
  affectedFeature: string;
  rollbackStatus: string;
  manualReviewRequired: true;
}

export interface RuntimePilotDryRunBundle {
  contractVersion: "V35";
  sourceMode: RuntimePilotDryRunSourceMode;
  runtimeMode: RuntimePilotDryRunRuntimeMode;
  generatedAt: string;
  lifecycleState: RuntimePilotDryRunLifecycleState;
  readinessDecision: RuntimePilotDryRunReadinessDecision;
  dryRunAllowed: boolean;
  sourceDescriptor: RuntimePilotDryRunSourceDescriptor;
  quoteSnapshot: RuntimePilotDryRunQuoteSnapshot;
  priceVerification: RuntimePilotDryRunPriceVerification;
  alertProjection: RuntimePilotDryRunAlertProjection;
  auditEvent: RuntimePilotDryRunAuditEvent;
  noWriteProof: RuntimePilotDryRunNoWriteProof;
  killSwitch: RuntimePilotDryRunKillSwitch;
  rollback: RuntimePilotDryRunRollback;
  safetyLabels: string[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const RUNTIME_PILOT_DRY_RUN_CONTRACT_VERSION = "V35" as const;

/**
 * All twelve dry-run lifecycle states, in canonical order. Default is
 * DRY_RUN_NOT_ALLOWED; DRY_RUN_COMPLETED_WITH_NO_WRITE is the only success.
 */
export const RUNTIME_PILOT_DRY_RUN_ALLOWED_LIFECYCLE_STATES: readonly RuntimePilotDryRunLifecycleState[] = [
  "DRY_RUN_NOT_ALLOWED",
  "DRY_RUN_READY_FOR_REVIEW",
  "DRY_RUN_ALLOWED",
  "DRY_RUN_INITIALIZING",
  "DRY_RUN_OBSERVING",
  "DRY_RUN_DATA_QUALITY_BLOCKED",
  "DRY_RUN_SOURCE_CONFLICT_BLOCKED",
  "DRY_RUN_STALE_DATA_BLOCKED",
  "DRY_RUN_FALLBACK_ONLY_BLOCKED",
  "DRY_RUN_STOPPED_BY_KILL_SWITCH",
  "DRY_RUN_ROLLBACK_REQUIRED",
  "DRY_RUN_COMPLETED_WITH_NO_WRITE",
] as const;

export const RUNTIME_PILOT_DRY_RUN_ALLOWED_RUNTIME_MODES: readonly RuntimePilotDryRunRuntimeMode[] = [
  "dry_run_spec",
  "dry_run",
  "disabled",
] as const;

export const RUNTIME_PILOT_DRY_RUN_ALLOWED_SOURCE_MODES: readonly RuntimePilotDryRunSourceMode[] = [
  "spec_only",
  "fixture",
  "authorized_source_pending",
  "not_available",
] as const;

/**
 * Canonical safety labels. Every Runtime Pilot dry-run surface must keep these
 * negations intact.
 */
export const RUNTIME_PILOT_DRY_RUN_SAFETY_LABELS = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "Runtime Pilot Dry-Run Spec 不是自動交易系統",
  "V35 不接真資料",
  "V35 不建立 runtime",
  "V35 不寫資料",
  "Dry-run 不是 production",
  "Dry-run 不代表可寫資料",
  "Dry-run 不代表產生買賣指令",
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
 * any Runtime Pilot dry-run surface. Spec vocabulary such as runtime / pilot /
 * dry-run / source / alert / audit / rollback / kill switch is NOT banned.
 */
export const RUNTIME_PILOT_DRY_RUN_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
