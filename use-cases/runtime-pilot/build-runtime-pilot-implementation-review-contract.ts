/**
 * Runtime Pilot Implementation Review Contract Builder — V38
 *
 * Pure builder. Returns a deterministic spec_only implementation-review bundle.
 * Default decision is NO_GO: manual sign-off has not been completed and source
 * authorization / kill switch have not been reviewed, so a first authorized-source
 * dry-run may not be implemented yet.
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
  RUNTIME_PILOT_IMPLEMENTATION_REVIEW_CRITICAL_ITEMS,
  RUNTIME_PILOT_IMPLEMENTATION_REVIEW_SAFETY_LABELS,
} from "./runtime-pilot-implementation-review-contract";
import type {
  RuntimePilotAuthorizedSourcePreflightReview,
  RuntimePilotImplementationAuditReview,
  RuntimePilotImplementationBoundary,
  RuntimePilotImplementationDecision,
  RuntimePilotImplementationDecisionSummary,
  RuntimePilotImplementationFeatureArea,
  RuntimePilotImplementationKillSwitchReview,
  RuntimePilotImplementationReviewBundle,
  RuntimePilotImplementationReviewItem,
  RuntimePilotImplementationReviewItemId,
  RuntimePilotImplementationReviewSeverity,
  RuntimePilotImplementationReviewStatus,
  RuntimePilotImplementationRollbackReview,
} from "./runtime-pilot-implementation-review-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildRuntimePilotImplementationReviewContractInput {
  generatedAt?: string;
}

interface ItemSpec {
  itemId: RuntimePilotImplementationReviewItemId;
  itemLabel: string;
  severity: RuntimePilotImplementationReviewSeverity;
  status: RuntimePilotImplementationReviewStatus;
  featureArea: RuntimePilotImplementationFeatureArea;
  requiredEvidence: string[];
  reviewerRequired: boolean;
  nextRequiredAction: string | null;
  ownerHint: string | null;
}

// The spec-defined safety items are PASS; items needing real operational /
// reviewer sign-off (authorization, kill switch, manual sign-off, audit,
// rollback, deployment, etc.) remain NOT_REVIEWED, keeping at least one CRITICAL
// item non-PASS → NO_GO.
const ITEM_SPECS: ItemSpec[] = [
  {
    itemId: "REVIEW_SOURCE_AUTHORIZATION",
    itemLabel: "資料源授權 review",
    severity: "CRITICAL",
    status: "NOT_REVIEWED",
    featureArea: "SOURCE_PREFLIGHT",
    requiredEvidence: ["signed data licence", "authorized provider confirmation"],
    reviewerRequired: true,
    nextRequiredAction: "取得書面授權並由 reviewer 簽核。",
    ownerHint: "data-ops",
  },
  {
    itemId: "REVIEW_SOURCE_LEGAL_STATUS",
    itemLabel: "資料源合法狀態 review",
    severity: "HIGH",
    status: "NOT_REVIEWED",
    featureArea: "SOURCE_PREFLIGHT",
    requiredEvidence: ["legal review note"],
    reviewerRequired: true,
    nextRequiredAction: "完成法務審查。",
    ownerHint: "legal",
  },
  {
    itemId: "REVIEW_RATE_LIMIT_POLICY",
    itemLabel: "速率限制政策 review",
    severity: "MEDIUM",
    status: "NOT_REVIEWED",
    featureArea: "SOURCE_PREFLIGHT",
    requiredEvidence: ["documented rate limit policy"],
    reviewerRequired: false,
    nextRequiredAction: "記錄 rate limit policy。",
    ownerHint: "data-ops",
  },
  {
    itemId: "REVIEW_MARKET_SESSION_HANDLING",
    itemLabel: "市場時段處理 review",
    severity: "HIGH",
    status: "PASS",
    featureArea: "RUNTIME_DRY_RUN",
    requiredEvidence: ["market session window spec"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    itemId: "REVIEW_TIMESTAMP_NORMALIZATION",
    itemLabel: "時間戳正規化 review",
    severity: "HIGH",
    status: "PASS",
    featureArea: "RUNTIME_DRY_RUN",
    requiredEvidence: ["timestamp normalization spec"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    itemId: "REVIEW_STALE_GUARD",
    itemLabel: "stale guard review",
    severity: "HIGH",
    status: "PASS",
    featureArea: "PRICE_VERIFICATION",
    requiredEvidence: ["stale never DANGER spec"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    itemId: "REVIEW_SOURCE_CONFLICT_THRESHOLD",
    itemLabel: "來源衝突門檻 review",
    severity: "HIGH",
    status: "PASS",
    featureArea: "PRICE_VERIFICATION",
    requiredEvidence: ["source conflict threshold spec"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    itemId: "REVIEW_FALLBACK_DOWNGRADE",
    itemLabel: "fallback 降級 review",
    severity: "HIGH",
    status: "PASS",
    featureArea: "PRICE_VERIFICATION",
    requiredEvidence: ["fallback never DANGER spec"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "data-ops",
  },
  {
    itemId: "REVIEW_NO_DANGER_GUARD",
    itemLabel: "no-DANGER guard review",
    severity: "HIGH",
    status: "PASS",
    featureArea: "ALERT_PROJECTION",
    requiredEvidence: ["fallback / stale / conflict never DANGER spec"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "alert-owner",
  },
  {
    itemId: "REVIEW_DRY_RUN_DEFAULT",
    itemLabel: "dry-run default review",
    severity: "HIGH",
    status: "PASS",
    featureArea: "RUNTIME_DRY_RUN",
    requiredEvidence: ["dry-run default spec"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "runtime-owner",
  },
  {
    itemId: "REVIEW_NO_WRITE_ENFORCEMENT",
    itemLabel: "no-write enforcement review",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "RUNTIME_DRY_RUN",
    requiredEvidence: ["no-write default spec", "productionWriteAllowed=false"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "runtime-owner",
  },
  {
    itemId: "REVIEW_AUDIT_LOG_SHAPE",
    itemLabel: "audit log shape review",
    severity: "HIGH",
    status: "NOT_REVIEWED",
    featureArea: "AUDIT_LOG",
    requiredEvidence: ["audit log shape signed off"],
    reviewerRequired: true,
    nextRequiredAction: "確認 audit log 落地實作與保存政策。",
    ownerHint: "runtime-owner",
  },
  {
    itemId: "REVIEW_ROLLBACK_PLAN",
    itemLabel: "rollback plan review",
    severity: "HIGH",
    status: "NOT_REVIEWED",
    featureArea: "ROLLBACK",
    requiredEvidence: ["rollback plan signed off"],
    reviewerRequired: true,
    nextRequiredAction: "確認 rollback owner 與觸發條件。",
    ownerHint: "runtime-owner",
  },
  {
    itemId: "REVIEW_KILL_SWITCH",
    itemLabel: "kill switch review",
    severity: "CRITICAL",
    status: "NOT_REVIEWED",
    featureArea: "KILL_SWITCH",
    requiredEvidence: ["kill switch implemented", "manual review owner"],
    reviewerRequired: true,
    nextRequiredAction: "確認 kill switch 可手動啟用並有 owner。",
    ownerHint: "runtime-owner",
  },
  {
    itemId: "REVIEW_MONITORING_VISIBILITY",
    itemLabel: "monitoring visibility review",
    severity: "MEDIUM",
    status: "PASS",
    featureArea: "MONITORING_UI",
    requiredEvidence: ["monitoring UI shows lifecycle / audit / no-write proof"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "frontend-owner",
  },
  {
    itemId: "REVIEW_NO_BUY_SELL_COMMAND",
    itemLabel: "no buy/sell command review",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "ALERT_PROJECTION",
    requiredEvidence: ["buySellCommandGenerated=false everywhere"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "alert-owner",
  },
  {
    itemId: "REVIEW_NO_AUTO_ORDER",
    itemLabel: "no auto order review",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "ALERT_PROJECTION",
    requiredEvidence: ["autoOrderRequested=false everywhere"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "alert-owner",
  },
  {
    itemId: "REVIEW_PRODUCTION_WRITE_BLOCKED",
    itemLabel: "production write blocked review",
    severity: "CRITICAL",
    status: "PASS",
    featureArea: "RUNTIME_DRY_RUN",
    requiredEvidence: ["productionWriteAllowed=false", "production write 一律 BLOCKED"],
    reviewerRequired: false,
    nextRequiredAction: null,
    ownerHint: "runtime-owner",
  },
  {
    itemId: "REVIEW_MANUAL_SIGN_OFF",
    itemLabel: "manual reviewer sign-off",
    severity: "CRITICAL",
    status: "NOT_REVIEWED",
    featureArea: "DEPLOYMENT",
    requiredEvidence: ["named reviewer sign-off", "review timestamp"],
    reviewerRequired: true,
    nextRequiredAction: "由具名 reviewer 完成簽核。",
    ownerHint: "reviewer",
  },
  {
    itemId: "REVIEW_DEPLOYMENT_ROLLBACK",
    itemLabel: "deployment / rollback checklist review",
    severity: "HIGH",
    status: "NOT_REVIEWED",
    featureArea: "DEPLOYMENT",
    requiredEvidence: ["deployment checklist", "rollback checklist"],
    reviewerRequired: true,
    nextRequiredAction: "確認部署與 rollback checklist。",
    ownerHint: "runtime-owner",
  },
];

/**
 * Builds a deterministic, spec_only implementation review bundle. All timestamps
 * come from `input.generatedAt` (or a fixed fallback string); no clock is read.
 */
export function buildRuntimePilotImplementationReviewContract(
  input: BuildRuntimePilotImplementationReviewContractInput = {},
): RuntimePilotImplementationReviewBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const criticalSet = new Set<string>(RUNTIME_PILOT_IMPLEMENTATION_REVIEW_CRITICAL_ITEMS);

  const reviewItems: RuntimePilotImplementationReviewItem[] = ITEM_SPECS.map((spec) => {
    const passed = spec.status === "PASS";
    return {
      itemId: spec.itemId,
      itemLabel: spec.itemLabel,
      severity: spec.severity,
      status: spec.status,
      featureArea: spec.featureArea,
      passed,
      blockingReason:
        spec.status === "FAIL" || spec.status === "BLOCKED" || spec.status === "NOT_REVIEWED"
          ? `review item "${spec.itemId}" 尚未通過（status=${spec.status}）。`
          : null,
      warningReason: spec.status === "WARNING" ? `review item "${spec.itemId}" 為 WARNING，需記錄。` : null,
      requiredEvidence: spec.requiredEvidence,
      missingEvidence: passed ? [] : spec.requiredEvidence,
      reviewerRequired: spec.reviewerRequired,
      reviewerName: null,
      reviewedAt: null,
      nextRequiredAction: spec.nextRequiredAction,
      ownerHint: spec.ownerHint,
    };
  });

  const criticalItems = reviewItems.filter((i) => criticalSet.has(i.itemId));
  const criticalItemPassedCount = criticalItems.filter((i) => i.status === "PASS").length;
  const allCriticalItemsPassed = criticalItemPassedCount === criticalItems.length;
  const blockedItemCount = reviewItems.filter((i) => i.status === "BLOCKED").length;
  const notReviewedItemCount = reviewItems.filter((i) => i.status === "NOT_REVIEWED").length;
  const warningItemCount = reviewItems.filter((i) => i.status === "WARNING").length;

  // Default decision is NO_GO: manual sign-off has not been completed.
  const decision: RuntimePilotImplementationDecision = "NO_GO";

  const decisionSummary: RuntimePilotImplementationDecisionSummary = {
    decision,
    criticalItemCount: criticalItems.length,
    criticalItemPassedCount,
    blockedItemCount,
    notReviewedItemCount,
    warningItemCount,
    allCriticalItemsPassed,
    manualSignOffRequired: true,
    manualSignOffCompleted: false,
    dryRunOnly: true,
    noWriteModeRequired: true,
    productionWriteAllowed: false,
    buySellCommandGenerationBlocked: true,
    autoOrderBlocked: true,
    notTradeAdviceAlwaysTrue: true,
    decisionReason:
      `${decision}：manual sign-off 未完成，且 source authorization / kill switch / audit / rollback 尚未 review，` +
      `不得 GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN；production write 一律 BLOCKED。`,
  };

  const authorizedSourcePreflight: RuntimePilotAuthorizedSourcePreflightReview = {
    sourceDescriptorId: "impl-review-source-sample",
    authorizationEvidence: null,
    legalStatusEvidence: null,
    rateLimitEvidence: null,
    sourcePriorityEvidence: null,
    sourceTimestampEvidence: null,
    freshnessWindowEvidence: null,
    conflictThresholdEvidence: null,
    fallbackDowngradeEvidence: null,
    reviewerName: null,
    reviewedAt: null,
    reviewStatus: "NOT_REVIEWED",
  };

  const implementationBoundary: RuntimePilotImplementationBoundary = {
    dryRunOnly: true,
    readOnly: true,
    noWrite: true,
    noProductionWrite: true,
    noBuySellCommand: true,
    noAutoOrder: true,
    noDirectTradingAction: true,
    highConfidenceConclusionBlockedWhenDataInsufficient: true,
    dangerBlockedWhenPriceNotVerified: true,
    dangerBlockedWhenStale: true,
    dangerBlockedWhenSourceConflict: true,
    dangerBlockedWhenFallbackOnly: true,
  };

  const auditReview: RuntimePilotImplementationAuditReview = {
    auditEventShapePresent: true,
    includesNoWriteProofId: true,
    includesKillSwitchChecked: true,
    includesRollbackRequired: true,
    recordsRequestPerformed: true,
    recordsSupabaseConnected: true,
    recordsProductionWritePerformed: true,
    recordsBuySellCommandGenerated: true,
    recordsAutoOrderRequested: true,
  };

  const rollbackReview: RuntimePilotImplementationRollbackReview = {
    rollbackIdReviewed: true,
    rollbackRequiredReviewed: true,
    rollbackReasonReviewed: true,
    rollbackTriggerReviewed: true,
    affectedFeatureReviewed: true,
    rollbackStatusReviewed: true,
    manualReviewRequiredReviewed: true,
  };

  const killSwitchReview: RuntimePilotImplementationKillSwitchReview = {
    killSwitchIdReviewed: true,
    enabledReviewed: true,
    checkedAtReviewed: true,
    affectedRuntimeReviewed: true,
    stopReasonReviewed: true,
    requiresManualReviewReviewed: true,
    dryRunCanContinueReviewed: true,
  };

  return {
    contractVersion: "V38",
    sourceMode: "spec_only",
    generatedAt,
    reviewItems,
    decisionSummary,
    authorizedSourcePreflight,
    implementationBoundary,
    auditReview,
    rollbackReview,
    killSwitchReview,
    safetyLabels: [...RUNTIME_PILOT_IMPLEMENTATION_REVIEW_SAFETY_LABELS],
    requestPerformed: false,
    supabaseConnected: false,
    productionWritePerformed: false,
  };
}
