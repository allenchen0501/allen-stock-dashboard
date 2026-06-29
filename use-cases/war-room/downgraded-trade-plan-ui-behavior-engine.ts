/**
 * Downgraded Trade Plan UI Behavior Engine — V69
 *
 * Pure, deterministic functions that turn a V68 downgrade result into the /holdings
 * card UI state: which zones are visible, the warning to show, and the
 * (non-imperative) action label. NO side effects, NO I/O. Never connects, fetches,
 * reads env, reads a clock, or writes data. Every UI state is observation-only and
 * operationalUseAllowed = false; nothing is a buy/sell command.
 */

import type { CandidateTradePlan } from "./structured-candidate-trade-plan-contract";
import type {
  TradePlanDisplayMode,
  TradePlanVerificationDowngradeResult,
} from "./conflict-to-trade-plan-verification-contract";
import {
  DOWNGRADED_TRADE_PLAN_NOT_A_COMMAND_PHRASE,
  DOWNGRADED_TRADE_PLAN_NOT_OPERATIONAL_PHRASE,
} from "./downgraded-trade-plan-ui-behavior-contract";
import type {
  DowngradedTradePlanUiState,
  DowngradedTradePlanUiVisibility,
  DowngradedTradePlanUiWarning,
  DowngradedTradePlanWarningLevel,
} from "./downgraded-trade-plan-ui-behavior-contract";

/**
 * Resolves which zones / warnings are visible for a downgrade result, keyed by the
 * V68 display mode. HIDE_OPERATIONAL_LEVELS and every blocked mode hide the levels.
 */
export function resolveTradePlanVisibility(
  downgradeResult: TradePlanVerificationDowngradeResult,
): DowngradedTradePlanUiVisibility {
  const mode = downgradeResult.tradePlanDisplayMode;
  const base: DowngradedTradePlanUiVisibility = {
    showBuyZone: false,
    showTargetZone: false,
    showRiskReward: false,
    showFixtureWarning: false,
    showConflictWarning: false,
    showMissingDataWarning: false,
    showStaleDataWarning: false,
    showUnauthorizedWarning: false,
    showManualReviewWarning: downgradeResult.tradePlanVerificationStatus === "MANUAL_REVIEW_REQUIRED",
    hideOperationalLevels: false,
  };

  switch (mode) {
    case "SHOW_FIXTURE_WITH_WARNING":
      return { ...base, showBuyZone: true, showTargetZone: true, showRiskReward: true, showFixtureWarning: true };
    case "SHOW_OBSERVATION_ONLY":
      return { ...base, showBuyZone: true, showTargetZone: true, showRiskReward: true, showFixtureWarning: true };
    case "SHOW_BLOCKED_CONFLICT":
      return { ...base, showConflictWarning: true };
    case "SHOW_BLOCKED_MISSING_DATA":
      return { ...base, showMissingDataWarning: true };
    case "SHOW_BLOCKED_STALE_DATA":
      return { ...base, showStaleDataWarning: true };
    case "SHOW_BLOCKED_UNAUTHORIZED":
      return { ...base, showUnauthorizedWarning: true };
    case "HIDE_OPERATIONAL_LEVELS":
    default:
      return { ...base, hideOperationalLevels: true };
  }
}

/** Action label per display mode — never an imperative buy/sell phrase. */
function actionLabelFor(mode: TradePlanDisplayMode): string {
  switch (mode) {
    case "SHOW_FIXTURE_WITH_WARNING":
      return "觀察";
    case "SHOW_OBSERVATION_ONLY":
      return "等待資料確認";
    case "SHOW_BLOCKED_CONFLICT":
      return "資料衝突，禁止操作";
    case "SHOW_BLOCKED_MISSING_DATA":
      return "資料不足，等待";
    case "SHOW_BLOCKED_STALE_DATA":
      return "資料過期，等待更新";
    case "SHOW_BLOCKED_UNAUTHORIZED":
      return "來源未授權，禁止操作";
    case "HIDE_OPERATIONAL_LEVELS":
    default:
      return "隱藏操作區間";
  }
}

/** Resolves the warning (level + title + message) for a downgrade result. */
export function resolveTradePlanWarning(
  downgradeResult: TradePlanVerificationDowngradeResult,
): DowngradedTradePlanUiWarning {
  const mode = downgradeResult.tradePlanDisplayMode;
  const tail = `（observation only；${DOWNGRADED_TRADE_PLAN_NOT_OPERATIONAL_PHRASE}；${DOWNGRADED_TRADE_PLAN_NOT_A_COMMAND_PHRASE}）`;

  let warningLevel: DowngradedTradePlanWarningLevel = "info";
  let warningTitle = "";
  switch (mode) {
    case "SHOW_FIXTURE_WITH_WARNING":
      warningLevel = "info";
      warningTitle = "fixture/mock warning";
      break;
    case "SHOW_OBSERVATION_ONLY":
      warningLevel = "info";
      warningTitle = "僅供觀察 observation only";
      break;
    case "SHOW_BLOCKED_CONFLICT":
      warningLevel = "danger";
      warningTitle = "來源衝突 source conflict";
      break;
    case "SHOW_BLOCKED_MISSING_DATA":
      warningLevel = "warning";
      warningTitle = "資料不足 missing data";
      break;
    case "SHOW_BLOCKED_STALE_DATA":
      warningLevel = "warning";
      warningTitle = "資料過期 stale data";
      break;
    case "SHOW_BLOCKED_UNAUTHORIZED":
      warningLevel = "danger";
      warningTitle = "來源未授權 unauthorized source";
      break;
    case "HIDE_OPERATIONAL_LEVELS":
    default:
      warningLevel = "danger";
      warningTitle = "操作區間已隱藏 hidden";
      break;
  }

  const warningMessage = `${warningTitle}：此為 fixture/mock 區間，${DOWNGRADED_TRADE_PLAN_NOT_OPERATIONAL_PHRASE}${tail}`;
  const userFacingExplanation = downgradeResult.reasonText;

  return {
    warningLevel,
    warningTitle,
    warningMessage,
    userFacingExplanation,
    operationalUseAllowed: false,
  };
}

/**
 * Builds the full downgraded trade plan UI state from a V63 trade plan + a V68
 * downgrade result. Display text is drawn from the trade plan only when visible;
 * otherwise a "hidden / blocked" placeholder is shown.
 */
export function buildDowngradedTradePlanUiState(
  tradePlan: Pick<CandidateTradePlan, "symbol" | "name" | "buyZone" | "riskReward">,
  downgradeResult: TradePlanVerificationDowngradeResult,
): DowngradedTradePlanUiState {
  const visibility = resolveTradePlanVisibility(downgradeResult);
  const warning = resolveTradePlanWarning(downgradeResult);
  const mode = downgradeResult.tradePlanDisplayMode;

  const buyZoneVisible = visibility.showBuyZone && !visibility.hideOperationalLevels;
  const targetZoneVisible = visibility.showTargetZone && !visibility.hideOperationalLevels;
  const riskRewardVisible = visibility.showRiskReward && !visibility.hideOperationalLevels;

  const blocked = "（已隱藏 / 降級：不可作為正式操作依據）";
  const buyZoneDisplayText = buyZoneVisible
    ? `${tradePlan.buyZone.lower}–${tradePlan.buyZone.upper} ${tradePlan.buyZone.currency}（觀察用）`
    : blocked;
  const targetZoneDisplayText = targetZoneVisible
    ? `${tradePlan.riskReward.targetLower}–${tradePlan.riskReward.targetUpper}（觀察，非正式目標價）`
    : blocked;
  const riskRewardDisplayText = riskRewardVisible
    ? `${tradePlan.riskReward.rewardRiskRatio}（不可操作）`
    : blocked;

  const blockedReason =
    mode === "SHOW_FIXTURE_WITH_WARNING" || mode === "SHOW_OBSERVATION_ONLY"
      ? ""
      : `${warning.warningTitle}：${downgradeResult.sourceResolutionStatus}`;

  return {
    symbol: tradePlan.symbol,
    name: tradePlan.name,
    tradePlanVerificationStatus: downgradeResult.tradePlanVerificationStatus,
    tradePlanDisplayMode: mode,
    observationOnly: true,
    operationalUseAllowed: false,
    buyZoneVisible,
    targetZoneVisible,
    riskRewardVisible,
    buyZoneDisplayText,
    targetZoneDisplayText,
    riskRewardDisplayText,
    warningLevel: warning.warningLevel,
    warningTitle: warning.warningTitle,
    warningMessage: warning.warningMessage,
    blockedReason,
    actionLabel: actionLabelFor(mode),
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    manualSignoffRequired: true,
    manualSignoffCompleted: false,
    productionSwitchAllowed: false,
    sourceDowngradeReason: downgradeResult.reasonText,
    visibility,
    warning,
  };
}

/** Validates one UI state against the V69 behavior rules. */
export function validateDowngradedTradePlanUiState(uiState: DowngradedTradePlanUiState): {
  observationOnlyTrue: boolean;
  operationalUseFalse: boolean;
  buySellCommandFalse: boolean;
  autoOrderFalse: boolean;
  manualSignoffRequiredTrue: boolean;
  manualSignoffCompletedFalse: boolean;
  productionSwitchDisallowed: boolean;
  hideModeHidesLevels: boolean;
  warningConsistentWithMode: boolean;
  warningMessageNotOperational: boolean;
  valid: boolean;
} {
  const v = uiState.visibility;
  const mode = uiState.tradePlanDisplayMode;

  const observationOnlyTrue = uiState.observationOnly === true;
  const operationalUseFalse = uiState.operationalUseAllowed === false;
  const buySellCommandFalse = uiState.buySellCommandGenerated === false;
  const autoOrderFalse = uiState.autoOrderRequested === false;
  const manualSignoffRequiredTrue = uiState.manualSignoffRequired === true;
  const manualSignoffCompletedFalse = uiState.manualSignoffCompleted === false;
  const productionSwitchDisallowed = uiState.productionSwitchAllowed === false;
  const hideModeHidesLevels =
    mode !== "HIDE_OPERATIONAL_LEVELS" ||
    (uiState.buyZoneVisible === false && uiState.targetZoneVisible === false && uiState.riskRewardVisible === false);
  const warningConsistentWithMode =
    (mode !== "SHOW_BLOCKED_CONFLICT" || v.showConflictWarning) &&
    (mode !== "SHOW_BLOCKED_MISSING_DATA" || v.showMissingDataWarning) &&
    (mode !== "SHOW_BLOCKED_STALE_DATA" || v.showStaleDataWarning) &&
    (mode !== "SHOW_BLOCKED_UNAUTHORIZED" || v.showUnauthorizedWarning);
  const warningMessageNotOperational = uiState.warningMessage.includes(DOWNGRADED_TRADE_PLAN_NOT_OPERATIONAL_PHRASE);

  const valid =
    observationOnlyTrue &&
    operationalUseFalse &&
    buySellCommandFalse &&
    autoOrderFalse &&
    manualSignoffRequiredTrue &&
    manualSignoffCompletedFalse &&
    productionSwitchDisallowed &&
    hideModeHidesLevels &&
    warningConsistentWithMode &&
    warningMessageNotOperational;

  return {
    observationOnlyTrue,
    operationalUseFalse,
    buySellCommandFalse,
    autoOrderFalse,
    manualSignoffRequiredTrue,
    manualSignoffCompletedFalse,
    productionSwitchDisallowed,
    hideModeHidesLevels,
    warningConsistentWithMode,
    warningMessageNotOperational,
    valid,
  };
}
