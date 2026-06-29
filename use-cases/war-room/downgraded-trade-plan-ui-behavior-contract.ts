/**
 * Downgraded Trade Plan UI Behavior Contract — V69
 *
 * Read-model TypeScript contract describing — spec-only — how a V68 trade plan
 * downgrade result drives the /holdings candidate / structured trade plan CARD: which
 * zones are visible, what warning shows, and the (non-imperative) action label.
 * TYPES + static CONSTANTS ONLY.
 *
 * This is UI BEHAVIOR over fixture data, not a connection. No runtime, no fetch, no
 * Supabase client, no env reads, no clock reads, no DB writes, no API route. Every
 * UI state stays observationOnly = true, operationalUseAllowed = false; nothing is a
 * buy/sell command. behaviorMode is FIXTURE_ONLY_NOT_CONNECTED.
 *
 * Layer described (extends V68):
 *   TradePlanVerificationDowngradeResult → V69 UI behavior → CandidateTradePlan card
 *   display state
 *
 * See: docs/downgraded-trade-plan-ui-behavior.md
 */

import type {
  TradePlanDisplayMode,
  TradePlanVerificationStatus,
} from "./conflict-to-trade-plan-verification-contract";

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type DowngradedTradePlanWarningLevel = "info" | "warning" | "danger";
export type DowngradedTradePlanBehaviorMode = "FIXTURE_ONLY_NOT_CONNECTED";

// ---------------------------------------------------------------------------
// Visibility + warning
// ---------------------------------------------------------------------------

export interface DowngradedTradePlanUiVisibility {
  showBuyZone: boolean;
  showTargetZone: boolean;
  showRiskReward: boolean;
  showFixtureWarning: boolean;
  showConflictWarning: boolean;
  showMissingDataWarning: boolean;
  showStaleDataWarning: boolean;
  showUnauthorizedWarning: boolean;
  showManualReviewWarning: boolean;
  hideOperationalLevels: boolean;
}

export interface DowngradedTradePlanUiWarning {
  warningLevel: DowngradedTradePlanWarningLevel;
  warningTitle: string;
  warningMessage: string;
  userFacingExplanation: string;
  operationalUseAllowed: false;
}

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------

export interface DowngradedTradePlanUiState {
  symbol: string;
  name: string;
  tradePlanVerificationStatus: TradePlanVerificationStatus;
  tradePlanDisplayMode: TradePlanDisplayMode;
  observationOnly: true;
  operationalUseAllowed: false;
  buyZoneVisible: boolean;
  targetZoneVisible: boolean;
  riskRewardVisible: boolean;
  buyZoneDisplayText: string;
  targetZoneDisplayText: string;
  riskRewardDisplayText: string;
  warningLevel: DowngradedTradePlanWarningLevel;
  warningTitle: string;
  warningMessage: string;
  blockedReason: string;
  actionLabel: string;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  manualSignoffRequired: true;
  manualSignoffCompleted: false;
  productionSwitchAllowed: false;
  sourceDowngradeReason: string;
  visibility: DowngradedTradePlanUiVisibility;
  warning: DowngradedTradePlanUiWarning;
}

// ---------------------------------------------------------------------------
// Validation + contract
// ---------------------------------------------------------------------------

export interface DowngradedTradePlanUiBehaviorValidation {
  everyDowngradeHasUiState: boolean;
  everyUiStateMapsToTradePlan: boolean;
  allObservationOnlyTrue: boolean;
  allOperationalUseFalse: boolean;
  allBuySellCommandFalse: boolean;
  allAutoOrderFalse: boolean;
  allManualSignoffRequired: boolean;
  allManualSignoffNotCompleted: boolean;
  allProductionSwitchDisallowed: boolean;
  hideModeHidesAllLevels: boolean;
  conflictShowsConflictWarning: boolean;
  missingShowsMissingWarning: boolean;
  staleShowsStaleWarning: boolean;
  unauthorizedShowsUnauthorizedWarning: boolean;
  actionLabelsNonImperative: boolean;
  warningMessagesStateNotOperational: boolean;
  valid: boolean;
}

export interface DowngradedTradePlanUiBehaviorContract {
  contractVersion: "V69";
  specName: "Downgraded Trade Plan UI Behavior";
  behaviorMode: DowngradedTradePlanBehaviorMode;
  generatedAt: string;
  decision: "READY_FOR_UI_REVIEW" | "NO_GO";

  realDataConnected: false;
  runtimeCreated: false;
  apiRouteCreated: false;
  envReadPerformed: false;
  fetchPerformed: false;
  supabaseConnected: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  productionReady: false;

  uiStates: DowngradedTradePlanUiState[];
  validation: DowngradedTradePlanUiBehaviorValidation;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DOWNGRADED_TRADE_PLAN_UI_BEHAVIOR_CONTRACT_VERSION = "V69" as const;

export const DOWNGRADED_TRADE_PLAN_UI_BEHAVIOR_SPEC_NAME = "Downgraded Trade Plan UI Behavior" as const;

/** actionLabel must never contain these imperative buy/sell phrases. */
export const DOWNGRADED_TRADE_PLAN_FORBIDDEN_ACTION_PHRASES = [
  "買進",
  "進場",
  "加碼",
  "buy",
  "buy now",
  "enter",
  "add position",
] as const;

/** Every warning message must state this (not operational). */
export const DOWNGRADED_TRADE_PLAN_NOT_OPERATIONAL_PHRASE = "不可作為正式操作依據" as const;

export const DOWNGRADED_TRADE_PLAN_NOT_A_COMMAND_PHRASE = "這不是買賣指令" as const;

export const DOWNGRADED_TRADE_PLAN_UI_BEHAVIOR_SAFETY_LABELS = [
  "Downgraded Trade Plan UI Behavior",
  "FIXTURE_ONLY_NOT_CONNECTED",
  "SHOW_FIXTURE_WITH_WARNING",
  "SHOW_OBSERVATION_ONLY",
  "SHOW_BLOCKED_CONFLICT",
  "SHOW_BLOCKED_MISSING_DATA",
  "SHOW_BLOCKED_STALE_DATA",
  "SHOW_BLOCKED_UNAUTHORIZED",
  "HIDE_OPERATIONAL_LEVELS",
  "observation only",
  "operationalUseAllowed false",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "productionSwitchAllowed false",
  "this is not a buy/sell command",
  "fixture/mock warning",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no fetch",
  "no real market data",
  "no API route",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
] as const;
