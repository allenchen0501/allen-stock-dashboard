/**
 * War Room Intelligence Contract — V18C
 *
 * Read-model TypeScript contract for the War Room Intelligence Architecture.
 * This file contains TYPES ONLY. It declares no runtime, performs no fetch,
 * imports no Supabase client, and reads no environment keys.
 *
 * The War Room is a read-only aggregation layer. It does not own data, does not
 * compute valuation formulas, does not produce technical scores, does not
 * produce institutional ratings, and does not produce buy/sell commands.
 *
 * See: docs/war-room-intelligence-architecture.md
 */

export type WarRoomMode =
  | "PREMARKET"
  | "INTRADAY"
  | "POSTMARKET"
  | "REALTIME_ALERT";

export type WarRoomMarketStatus =
  | "BULLISH"
  | "NEUTRAL"
  | "DEFENSIVE"
  | "RISK_OFF"
  | "DANGER"
  | "DATA_INSUFFICIENT";

export type WarRoomAlertLevel =
  | "INFO"
  | "WATCH"
  | "WARNING"
  | "DANGER"
  | "DATA_INSUFFICIENT";

export type WarRoomDataQualityStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "DATA_INSUFFICIENT";

/**
 * Describes whether a single War Room display zone can render, and at what
 * data-quality confidence. When `dataQualityStatus` is not 'PASS', the zone
 * must be degraded — never upgraded to a high-confidence conclusion.
 */
export interface WarRoomSectionAvailability {
  sectionId: string;
  title: string;
  sourceEngine: string;
  available: boolean;
  dataQualityStatus: WarRoomDataQualityStatus;
  fallbackUsed: boolean;
  notes: string[];
}

/**
 * A single read-only War Room snapshot. Aggregates already-verified engine
 * outputs into the seven display zones. Never writes, never requests, never
 * connects to Supabase — enforced by the literal-false flags below.
 */
export interface WarRoomIntelligenceSnapshot {
  snapshotId: string;
  generatedAt: string;
  warRoomMode: WarRoomMode;
  marketStatus: WarRoomMarketStatus;
  primaryAlertLevel: WarRoomAlertLevel;

  // Seven core display zones (see Section G of the architecture doc).
  marketStatusLight: WarRoomSectionAvailability;
  realtimeAlerts: WarRoomSectionAvailability;
  portfolioRiskRadar: WarRoomSectionAvailability;
  researchTopPicks: WarRoomSectionAvailability;
  technicalRiskRewardCandidates: WarRoomSectionAvailability;
  avoidList: WarRoomSectionAvailability;
  nextObservationPoints: WarRoomSectionAvailability;

  // Permanent read-model safety invariants.
  requestPerformed: false;
  supabaseConnected: false;
  productionWritePerformed: false;
}

/**
 * Canonical ordered list of the seven War Room display zones. Useful for UI
 * iteration in future versions; declares no runtime behaviour here.
 */
export const WAR_ROOM_SECTION_IDS = [
  "marketStatusLight",
  "realtimeAlerts",
  "portfolioRiskRadar",
  "researchTopPicks",
  "technicalRiskRewardCandidates",
  "avoidList",
  "nextObservationPoints",
] as const;

export type WarRoomSectionId = (typeof WAR_ROOM_SECTION_IDS)[number];
