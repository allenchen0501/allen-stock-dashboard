/**
 * Runtime Pilot Readiness Contract — V33
 *
 * Read-model TypeScript contract for the Runtime Pilot Readiness Checklist —
 * the final go / no-go gate BEFORE any real runtime pilot is allowed to start.
 * This file contains TYPES + a few static safety CONSTANTS ONLY. It declares no
 * runtime, performs no fetch, imports no Supabase client, reads no environment
 * keys, calls Date.now on nothing, and writes no data.
 *
 * V33 is spec-only / contract-only: it only describes the readiness gates,
 * severity, status, go/no-go decision, audit-log / rollback / kill-switch shape
 * that a future runtime pilot must satisfy. It does NOT connect to any source,
 * does NOT produce buy/sell commands, and production writes are always BLOCKED.
 *
 * Concrete source names (TWSE / TPEx / Yahoo / FinMind / TradingView /
 * yfinance-like) live in the docs as governance notes, never in this contract.
 *
 * See: docs/runtime-pilot-readiness-checklist.md
 * See: docs/runtime-data-pipeline-spec.md
 * See: docs/intraday-holding-defense-runtime-spec.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type RuntimePilotReadinessGateId =
  | "SOURCE_AUTHORIZATION"
  | "SOURCE_LEGAL_STATUS"
  | "RATE_LIMIT_POLICY"
  | "MARKET_SESSION_HANDLING"
  | "TIMESTAMP_NORMALIZATION"
  | "STALE_GUARD"
  | "SOURCE_CONFLICT_THRESHOLD"
  | "FALLBACK_DOWNGRADE"
  | "NO_DANGER_GUARD"
  | "DRY_RUN_MODE"
  | "NO_WRITE_GUARD"
  | "AUDIT_LOG_SHAPE"
  | "ROLLBACK_PLAN"
  | "KILL_SWITCH"
  | "ALERT_SAFETY"
  | "BUY_SELL_COMMAND_BLOCK"
  | "NOT_TRADE_ADVICE"
  | "PRODUCTION_WRITE_BLOCKED";

export type RuntimePilotGateSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type RuntimePilotGateStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "BLOCKED"
  | "NOT_REVIEWED"
  | "NOT_APPLICABLE";

export type RuntimePilotDecision =
  | "GO_DRY_RUN"
  | "NO_GO"
  | "BLOCKED"
  | "READY_FOR_REVIEW"
  | "DATA_INSUFFICIENT";

export type RuntimePilotFeatureArea =
  | "RUNTIME_DATA_PIPELINE"
  | "INTRADAY_HOLDING_DEFENSE"
  | "HOLDING_DEFENSE_TRACKER"
  | "WAR_ROOM"
  | "ALERT_SYSTEM"
  | "DASHBOARD_UI";

// ---------------------------------------------------------------------------
// Readiness gate
// ---------------------------------------------------------------------------

export interface RuntimePilotReadinessGate {
  gateId: RuntimePilotReadinessGateId;
  gateLabel: string;
  severity: RuntimePilotGateSeverity;
  status: RuntimePilotGateStatus;
  featureArea: RuntimePilotFeatureArea;
  passed: boolean;
  blockingReason: string | null;
  warningReason: string | null;
  requiredEvidence: string[];
  missingEvidence: string[];
  nextRequiredAction: string | null;
  ownerHint: string | null;
}

// ---------------------------------------------------------------------------
// Decision summary
// ---------------------------------------------------------------------------

/**
 * Roll-up go/no-go decision. `productionWriteAllowed` is a literal false in V33;
 * dry-run / no-write / buy-sell-block / not-trade-advice are literal-true
 * invariants. Only when every CRITICAL gate is PASS may the decision be
 * GO_DRY_RUN — and even then it is dry-run only, never production.
 */
export interface RuntimePilotReadinessDecisionSummary {
  decision: RuntimePilotDecision;
  criticalGateCount: number;
  criticalGatePassedCount: number;
  blockedGateCount: number;
  notReviewedGateCount: number;
  warningGateCount: number;
  allCriticalGatesPassed: boolean;
  dryRunModeRequired: true;
  noWriteModeRequired: true;
  productionWriteAllowed: false;
  buySellCommandGenerationBlocked: true;
  notTradeAdviceAlwaysTrue: true;
  decisionReason: string;
}

// ---------------------------------------------------------------------------
// Audit / rollback / kill-switch shapes
// ---------------------------------------------------------------------------

export interface RuntimePilotAuditLogShape {
  auditId: string;
  generatedAt: string;
  sourceId: string | null;
  stockId: string | null;
  gateId: RuntimePilotReadinessGateId;
  beforeStatus: RuntimePilotGateStatus | null;
  afterStatus: RuntimePilotGateStatus;
  decision: RuntimePilotDecision;
  reason: string;
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

export interface RuntimePilotRollbackPlanShape {
  rollbackId: string;
  rollbackReason: string;
  affectedFeature: RuntimePilotFeatureArea;
  rollbackTrigger: string;
  rollbackOwner: string;
  rollbackStatus: "READY" | "NOT_READY" | "BLOCKED";
}

export interface RuntimePilotKillSwitchShape {
  killSwitchId: string;
  enabled: boolean;
  reason: string;
  affectedRuntime: RuntimePilotFeatureArea;
  activatedAt: string | null;
  deactivatedAt: string | null;
  owner: string;
  requiresManualReview: true;
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

export interface RuntimePilotReadinessBundle {
  contractVersion: "V33";
  sourceMode: "spec_only";
  generatedAt: string;
  gates: RuntimePilotReadinessGate[];
  decisionSummary: RuntimePilotReadinessDecisionSummary;
  auditLogShape: RuntimePilotAuditLogShape;
  rollbackPlanShape: RuntimePilotRollbackPlanShape;
  killSwitchShape: RuntimePilotKillSwitchShape;
  safetyLabels: string[];
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

// ---------------------------------------------------------------------------
// Safety constants
// ---------------------------------------------------------------------------

export const RUNTIME_PILOT_READINESS_CONTRACT_VERSION = "V33" as const;

/**
 * All eighteen readiness gates, in canonical order.
 */
export const RUNTIME_PILOT_READINESS_ALLOWED_GATES: readonly RuntimePilotReadinessGateId[] = [
  "SOURCE_AUTHORIZATION",
  "SOURCE_LEGAL_STATUS",
  "RATE_LIMIT_POLICY",
  "MARKET_SESSION_HANDLING",
  "TIMESTAMP_NORMALIZATION",
  "STALE_GUARD",
  "SOURCE_CONFLICT_THRESHOLD",
  "FALLBACK_DOWNGRADE",
  "NO_DANGER_GUARD",
  "DRY_RUN_MODE",
  "NO_WRITE_GUARD",
  "AUDIT_LOG_SHAPE",
  "ROLLBACK_PLAN",
  "KILL_SWITCH",
  "ALERT_SAFETY",
  "BUY_SELL_COMMAND_BLOCK",
  "NOT_TRADE_ADVICE",
  "PRODUCTION_WRITE_BLOCKED",
] as const;

/**
 * The critical gates. If any of these is not PASS, the decision must be NO_GO.
 */
export const RUNTIME_PILOT_READINESS_CRITICAL_GATES: readonly RuntimePilotReadinessGateId[] = [
  "SOURCE_AUTHORIZATION",
  "STALE_GUARD",
  "NO_DANGER_GUARD",
  "DRY_RUN_MODE",
  "NO_WRITE_GUARD",
  "KILL_SWITCH",
  "BUY_SELL_COMMAND_BLOCK",
  "PRODUCTION_WRITE_BLOCKED",
] as const;

export const RUNTIME_PILOT_READINESS_ALLOWED_DECISIONS: readonly RuntimePilotDecision[] = [
  "GO_DRY_RUN",
  "NO_GO",
  "BLOCKED",
  "READY_FOR_REVIEW",
  "DATA_INSUFFICIENT",
] as const;

/**
 * Canonical safety labels. Every Runtime Pilot Readiness surface must keep these
 * negations intact.
 */
export const RUNTIME_PILOT_READINESS_SAFETY_LABELS = [
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "Runtime Pilot Readiness Checklist 不是自動交易系統",
  "V33 不接真資料",
  "V33 不建立 runtime",
  "V33 不寫資料",
  "GO_DRY_RUN 不是 production",
  "GO_DRY_RUN 不代表可寫資料",
  "GO_DRY_RUN 不代表產生買賣指令",
  "production write 一律 BLOCKED",
  "fallback-only data 不得觸發 DANGER",
  "stale data 不得觸發 DANGER",
  "source conflict 不得觸發 DANGER",
  "priceVerified = false 時不得輸出精準價位",
  "資料不足就顯示資料不足",
] as const;

/**
 * Imperative trade-command / auto-trading phrases that must NEVER be emitted by
 * any Runtime Pilot Readiness surface. Spec vocabulary such as runtime / pilot /
 * readiness / source / alert / audit / rollback / kill switch is NOT banned.
 */
export const RUNTIME_PILOT_READINESS_DISALLOWED_TERMS = [
  "強力買進",
  "必買",
  "必賣",
  "立即進場",
  "立即出場",
  "自動下單",
  "保證獲利",
  "自動交易",
] as const;
