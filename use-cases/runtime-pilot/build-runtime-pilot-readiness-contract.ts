/**
 * Runtime Pilot Readiness Contract Builder — V33
 *
 * Pure builder. Returns a deterministic spec_only RuntimePilotReadinessBundle
 * describing the go / no-go gate before a real runtime pilot. Default decision
 * is NO_GO: source authorization / kill switch / rollback / audit log have not
 * been reviewed, so a dry-run pilot is not yet allowed.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes; production writes are always BLOCKED
 *   - No buy/sell commands
 */

import {
  RUNTIME_PILOT_READINESS_CRITICAL_GATES,
  RUNTIME_PILOT_READINESS_SAFETY_LABELS,
} from "./runtime-pilot-readiness-contract";
import type {
  RuntimePilotAuditLogShape,
  RuntimePilotDecision,
  RuntimePilotFeatureArea,
  RuntimePilotGateSeverity,
  RuntimePilotGateStatus,
  RuntimePilotKillSwitchShape,
  RuntimePilotReadinessBundle,
  RuntimePilotReadinessDecisionSummary,
  RuntimePilotReadinessGate,
  RuntimePilotReadinessGateId,
  RuntimePilotRollbackPlanShape,
} from "./runtime-pilot-readiness-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildRuntimePilotReadinessContractInput {
  generatedAt?: string;
}

interface GateSpec {
  gateId: RuntimePilotReadinessGateId;
  gateLabel: string;
  severity: RuntimePilotGateSeverity;
  status: RuntimePilotGateStatus;
  featureArea: RuntimePilotFeatureArea;
  requiredEvidence: string[];
  nextRequiredAction: string | null;
  ownerHint: string | null;
}

// Gate metadata. The spec-defined safety gates are PASS; gates that need real
// operational review (authorization, rate limit, audit, rollback, kill switch)
// remain NOT_REVIEWED, which keeps at least one CRITICAL gate non-PASS → NO_GO.
const GATE_SPECS: GateSpec[] = [
  {
    gateId: "SOURCE_AUTHORIZATION",
    gateLabel: "資料源授權確認",
    severity: "CRITICAL",
    status: "NOT_REVIEWED",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["signed data licence", "authorized provider confirmation"],
    nextRequiredAction: "取得官方 / 授權資料源書面授權後再 review。",
    ownerHint: "data-ops",
  },
  {
    gateId: "SOURCE_LEGAL_STATUS",
    gateLabel: "資料源合法狀態",
    severity: "HIGH",
    status: "NOT_REVIEWED",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["legal review note"],
    nextRequiredAction: "完成法務審查。",
    ownerHint: "legal",
  },
  {
    gateId: "RATE_LIMIT_POLICY",
    gateLabel: "速率限制政策",
    severity: "MEDIUM",
    status: "NOT_REVIEWED",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["documented rate limit policy"],
    nextRequiredAction: "定義並記錄 rate limit。",
    ownerHint: "data-ops",
  },
  {
    gateId: "MARKET_SESSION_HANDLING",
    gateLabel: "市場時段處理",
    severity: "HIGH",
    status: "PASS",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["market session window spec"],
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    gateId: "TIMESTAMP_NORMALIZATION",
    gateLabel: "時間戳正規化",
    severity: "HIGH",
    status: "PASS",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["timestamp normalization spec"],
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    gateId: "STALE_GUARD",
    gateLabel: "stale guard",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["freshness window spec", "stale never DANGER rule"],
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    gateId: "SOURCE_CONFLICT_THRESHOLD",
    gateLabel: "來源衝突門檻",
    severity: "HIGH",
    status: "PASS",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["source conflict threshold spec"],
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    gateId: "FALLBACK_DOWNGRADE",
    gateLabel: "fallback 降級",
    severity: "HIGH",
    status: "PASS",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["fallback downgrade spec", "fallback never DANGER rule"],
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    gateId: "NO_DANGER_GUARD",
    gateLabel: "no-DANGER guard",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "ALERT_SYSTEM",
    requiredEvidence: ["fallback / stale / conflict never DANGER spec"],
    nextRequiredAction: null,
    ownerHint: "alert-owner",
  },
  {
    gateId: "DRY_RUN_MODE",
    gateLabel: "dry-run 模式",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["dry-run default spec"],
    nextRequiredAction: null,
    ownerHint: "runtime-owner",
  },
  {
    gateId: "NO_WRITE_GUARD",
    gateLabel: "no-write guard",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["no-write default spec", "productionWriteAllowed=false"],
    nextRequiredAction: null,
    ownerHint: "runtime-owner",
  },
  {
    gateId: "AUDIT_LOG_SHAPE",
    gateLabel: "audit log 結構",
    severity: "HIGH",
    status: "NOT_REVIEWED",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["audit log shape signed off"],
    nextRequiredAction: "確認 audit log 落地實作與保存政策。",
    ownerHint: "runtime-owner",
  },
  {
    gateId: "ROLLBACK_PLAN",
    gateLabel: "rollback 計畫",
    severity: "HIGH",
    status: "NOT_REVIEWED",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["rollback plan signed off"],
    nextRequiredAction: "確認 rollback owner 與觸發條件。",
    ownerHint: "runtime-owner",
  },
  {
    gateId: "KILL_SWITCH",
    gateLabel: "kill switch",
    severity: "CRITICAL",
    status: "NOT_REVIEWED",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["kill switch implemented", "manual review owner"],
    nextRequiredAction: "確認 kill switch 可手動啟用並有 owner。",
    ownerHint: "runtime-owner",
  },
  {
    gateId: "ALERT_SAFETY",
    gateLabel: "警報安全",
    severity: "HIGH",
    status: "PASS",
    featureArea: "ALERT_SYSTEM",
    requiredEvidence: ["DANGER cooldown / dedup / audit spec"],
    nextRequiredAction: null,
    ownerHint: "alert-owner",
  },
  {
    gateId: "BUY_SELL_COMMAND_BLOCK",
    gateLabel: "買賣指令封鎖",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "ALERT_SYSTEM",
    requiredEvidence: ["buySellCommandGenerationBlocked=true"],
    nextRequiredAction: null,
    ownerHint: "alert-owner",
  },
  {
    gateId: "NOT_TRADE_ADVICE",
    gateLabel: "非投資建議",
    severity: "HIGH",
    status: "PASS",
    featureArea: "ALERT_SYSTEM",
    requiredEvidence: ["notTradeAdvice always true"],
    nextRequiredAction: null,
    ownerHint: "alert-owner",
  },
  {
    gateId: "PRODUCTION_WRITE_BLOCKED",
    gateLabel: "production 寫入封鎖",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "RUNTIME_DATA_PIPELINE",
    requiredEvidence: ["productionWriteAllowed=false", "production write 一律 BLOCKED"],
    nextRequiredAction: null,
    ownerHint: "runtime-owner",
  },
];

/**
 * Builds a deterministic, spec_only Runtime Pilot Readiness bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildRuntimePilotReadinessContract(
  input: BuildRuntimePilotReadinessContractInput = {},
): RuntimePilotReadinessBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const criticalSet = new Set<string>(RUNTIME_PILOT_READINESS_CRITICAL_GATES);

  const gates: RuntimePilotReadinessGate[] = GATE_SPECS.map((spec) => {
    const passed = spec.status === "PASS";
    return {
      gateId: spec.gateId,
      gateLabel: spec.gateLabel,
      severity: spec.severity,
      status: spec.status,
      featureArea: spec.featureArea,
      passed,
      blockingReason:
        spec.status === "FAIL" || spec.status === "BLOCKED" || spec.status === "NOT_REVIEWED"
          ? `gate "${spec.gateId}" 尚未通過（status=${spec.status}）。`
          : null,
      warningReason: spec.status === "WARNING" ? `gate "${spec.gateId}" 為 WARNING，需記錄。` : null,
      requiredEvidence: spec.requiredEvidence,
      missingEvidence: passed ? [] : spec.requiredEvidence,
      nextRequiredAction: spec.nextRequiredAction,
      ownerHint: spec.ownerHint,
    };
  });

  const criticalGates = gates.filter((g) => criticalSet.has(g.gateId));
  const criticalGatePassedCount = criticalGates.filter((g) => g.status === "PASS").length;
  const allCriticalGatesPassed = criticalGatePassedCount === criticalGates.length;
  const blockedGateCount = gates.filter((g) => g.status === "BLOCKED").length;
  const notReviewedGateCount = gates.filter((g) => g.status === "NOT_REVIEWED").length;
  const warningGateCount = gates.filter((g) => g.status === "WARNING").length;

  // Default decision is NO_GO until every CRITICAL gate is PASS.
  const decision: RuntimePilotDecision = allCriticalGatesPassed ? "READY_FOR_REVIEW" : "NO_GO";

  const decisionSummary: RuntimePilotReadinessDecisionSummary = {
    decision,
    criticalGateCount: criticalGates.length,
    criticalGatePassedCount,
    blockedGateCount,
    notReviewedGateCount,
    warningGateCount,
    allCriticalGatesPassed,
    dryRunModeRequired: true,
    noWriteModeRequired: true,
    productionWriteAllowed: false,
    buySellCommandGenerationBlocked: true,
    notTradeAdviceAlwaysTrue: true,
    decisionReason:
      `${decision}：尚未確認 source authorization / kill switch / rollback / audit log，` +
      `不得 GO_DRY_RUN；production write 一律 BLOCKED。`,
  };

  const auditLogShape: RuntimePilotAuditLogShape = {
    auditId: "rp-audit-sample",
    generatedAt,
    sourceId: null,
    stockId: null,
    gateId: "SOURCE_AUTHORIZATION",
    beforeStatus: null,
    afterStatus: "NOT_REVIEWED",
    decision,
    reason: "spec-only sample audit log entry；尚未進入 runtime pilot。",
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };

  const rollbackPlanShape: RuntimePilotRollbackPlanShape = {
    rollbackId: "rp-rollback-sample",
    rollbackReason: "spec-only sample rollback plan；尚未確認 owner 與觸發條件。",
    affectedFeature: "RUNTIME_DATA_PIPELINE",
    rollbackTrigger: "any CRITICAL gate FAIL / BLOCKED during dry-run",
    rollbackOwner: "runtime-owner (TBD)",
    rollbackStatus: "NOT_READY",
  };

  const killSwitchShape: RuntimePilotKillSwitchShape = {
    killSwitchId: "rp-killswitch-sample",
    enabled: false,
    reason: "spec-only sample kill switch；尚未實作與指派 owner。",
    affectedRuntime: "RUNTIME_DATA_PIPELINE",
    activatedAt: null,
    deactivatedAt: null,
    owner: "runtime-owner (TBD)",
    requiresManualReview: true,
  };

  return {
    contractVersion: "V33",
    sourceMode: "spec_only",
    generatedAt,
    gates,
    decisionSummary,
    auditLogShape,
    rollbackPlanShape,
    killSwitchShape,
    safetyLabels: [...RUNTIME_PILOT_READINESS_SAFETY_LABELS],
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
