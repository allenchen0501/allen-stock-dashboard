/**
 * Intraday Alert Contract — V18F
 *
 * Read-model TypeScript contract for the Intraday Risk Crisis Alert system.
 * This file contains TYPES ONLY. It declares no runtime, performs no fetch,
 * imports no Supabase client, and reads no environment keys.
 *
 * The Intraday Alert Engine is an event-driven alert layer. It does not own
 * data, does not compute valuation formulas, does not produce technical scores,
 * does not produce institutional ratings, and does not produce buy/sell commands.
 *
 * See: docs/intraday-risk-crisis-alert-spec.md
 * See: docs/war-room-intelligence-architecture.md
 */

export type IntradayAlertLevel =
  | "INFO"
  | "WATCH"
  | "WARNING"
  | "DANGER"
  | "DATA_INSUFFICIENT";

export type IntradayAlertType =
  | "MARKET_CRASH"
  | "MARKET_SURGE"
  | "HOLDING_CRASH"
  | "HOLDING_SURGE"
  | "SUPPORT_BREAK"
  | "RESISTANCE_BREAK"
  | "VOLUME_ANOMALY"
  | "BREADTH_DIVERGENCE"
  | "SECTOR_WEAKNESS"
  | "SECTOR_SURGE_DIVERGENCE";

export type IntradayAlertScope =
  | "MARKET"
  | "HOLDING"
  | "WATCHLIST"
  | "SECTOR";

export type IntradayAlertDataQualityStatus =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "DATA_INSUFFICIENT";

/**
 * A single intraday alert payload. Describes one event-driven alert triggered
 * by market or holding price action. Never writes, never requests, never
 * connects to Supabase in spec_only or fixture modes.
 *
 * Safety invariants:
 * - suggestedObservation must not contain explicit buy/sell commands.
 * - requestPerformed, supabaseConnected, productionWritePerformed are false
 *   in spec_only and fixture sourceMode.
 * - DANGER alertLevel requires dataQualityStatus === 'PASS' and multi-source
 *   confirmation. fallback-only data cannot trigger DANGER.
 * - stale data cannot trigger DANGER.
 */
export interface IntradayAlertPayload {
  alertId: string;
  createdAt: string;
  marketSession: "PRE_MARKET" | "INTRADAY" | "POST_MARKET" | "CLOSED";
  alertLevel: IntradayAlertLevel;
  alertType: IntradayAlertType;
  scope: IntradayAlertScope;
  symbol: string | null;
  stockName: string | null;
  sectorName: string | null;
  marketIndex: string | null;
  currentPrice: number | null;
  currentIndex: number | null;
  changePoints: number | null;
  changePercent: number | null;
  windowMinutes: number | null;
  triggerReason: string;
  impactSummary: string;
  holdingImpact: string | null;
  suggestedObservation: string;
  dataQualityStatus: IntradayAlertDataQualityStatus;
  sourceMode: "spec_only" | "fixture" | "runtime_candidate";
  sourceName: string | null;
  requestPerformed: boolean;
  supabaseConnected: boolean;
  productionWritePerformed: boolean;
}
