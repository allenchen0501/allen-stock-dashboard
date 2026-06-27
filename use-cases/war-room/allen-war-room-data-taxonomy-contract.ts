/**
 * Allen War Room Data Taxonomy Contract — V60
 *
 * Read-model TypeScript contract that LOCKS the operational data taxonomy for the
 * Allen War Room (`/holdings` operational home). This file contains TYPES +
 * static CONSTANTS ONLY. It declares no runtime, performs no fetch, imports no
 * Supabase client, reads no environment keys, writes no data, and connects to
 * nothing.
 *
 * Core taxonomy (locked):
 *   - ACTUAL_POSITION   : Allen has actually entered; only these compute PnL, and
 *                         only when shares + averageCost are known.
 *   - FIXED_WATCHLIST   : tracked, NOT a position.
 *   - SYSTEM_CANDIDATE  : system-screened opportunity, NOT a position.
 *   - OPPORTUNITY_POOL  : low-entry / trend-up candidates, NOT a position.
 *   - RISK_BLOCKLIST    : avoid / high-risk.
 *   - ENGINEERING_SAFETY: engineering / safety panels (moved away from primary view).
 *
 * The current data layer is still fixture/mock safe mode: realDataConnected =
 * false. Fixture/mock data must be labeled and must never be presented as real
 * operational data.
 *
 * See: docs/allen-war-room-operational-layout.md
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type WarRoomDataCategory =
  | "ACTUAL_POSITION"
  | "FIXED_WATCHLIST"
  | "SYSTEM_CANDIDATE"
  | "OPPORTUNITY_POOL"
  | "RISK_BLOCKLIST"
  | "ENGINEERING_SAFETY";

export type WarRoomMarketSession =
  | "PRE_MARKET"
  | "INTRADAY"
  | "AFTER_CLOSE"
  | "US_MARKET_PREVIEW"
  | "CLOSED"
  | "DATA_UNAVAILABLE";

export type WarRoomDataVerificationStatus =
  | "VERIFIED"
  | "DELAYED"
  | "STALE"
  | "CONFLICT"
  | "FIXTURE_ONLY"
  | "MOCK_ONLY"
  | "INSUFFICIENT_DATA"
  | "NOT_CONNECTED";

export type WarRoomTodayAction =
  | "HOLD"
  | "DEFEND"
  | "REDUCE"
  | "ADD_ON_CONFIRMATION"
  | "WATCH_PULLBACK"
  | "WAIT"
  | "AVOID"
  | "DATA_INSUFFICIENT";

export type WarRoomPositionStatus = "entered" | "data_incomplete" | "not_a_position";

export type WarRoomPositionSource = "user_confirmed" | "broker_import_future";

export type WarRoomSummaryTone = "bull" | "neutral" | "weak" | "risk" | "insufficient";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Only ACTUAL_POSITION rows. PnL is computable only when shares + cost known. */
export interface WarRoomActualPosition {
  stockId: string;
  symbol: string;
  name: string;
  category: "ACTUAL_POSITION";
  positionStatus: WarRoomPositionStatus;
  positionSource: WarRoomPositionSource;
  sharesKnown: boolean;
  shares: number | null;
  averageCostKnown: boolean;
  averageCost: number | null;
  entrySource: string | null;
  latestPriceValid: boolean;
  latestPrice: number | null;
  pnlComputable: boolean;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  defenseLine: number | null;
  stopLossZone: string | null;
  addOnZone: string | null;
  targetZone: string | null;
  riskReward: string | null;
  todayAction: WarRoomTodayAction;
  dataVerificationStatus: WarRoomDataVerificationStatus;
  dataNote: string;
}

export interface WarRoomWatchlistItem {
  stockId: string;
  symbol: string;
  name: string;
  category: "FIXED_WATCHLIST";
  isPosition: false;
  latestPriceValid: boolean;
  latestPrice: number | null;
  trend: string;
  technicalStatus: string;
  keySupport: string;
  keyResistance: string;
  accumulationZone: string;
  watchCondition: string;
  todayStatus: string;
  nearEntry: boolean;
  dataVerificationStatus: WarRoomDataVerificationStatus;
  dataNote: string;
}

export interface WarRoomSystemCandidate {
  stockId: string;
  symbol: string;
  name: string;
  category: "SYSTEM_CANDIDATE";
  isPosition: false;
  candidateReason: string;
  technicalCondition: string;
  riskRewardStatus: string;
  lowEntryZone: string;
  confirmCondition: string;
  invalidationCondition: string;
  todayAction: WarRoomTodayAction;
  dataVerificationStatus: WarRoomDataVerificationStatus;
  dataNote: string;
}

export interface WarRoomRiskBlocklistItem {
  stockId: string;
  symbol: string;
  name: string;
  category: "RISK_BLOCKLIST";
  isPosition: false;
  reason: string;
  dataVerificationStatus: WarRoomDataVerificationStatus;
  dataNote: string;
}

export interface WarRoomSummaryCard {
  cardId: string;
  title: string;
  value: string;
  tone: WarRoomSummaryTone;
  note: string;
}

export interface WarRoomSessionSection {
  sectionId: string;
  title: string;
  items: string[];
}

export interface WarRoomSessionStructure {
  session: WarRoomMarketSession;
  title: string;
  sections: WarRoomSessionSection[];
}

export interface WarRoomDataVerificationState {
  dataDate: string;
  dataTime: string;
  dataSource: string;
  verificationStatus: WarRoomDataVerificationStatus;
  isFixtureOrMock: true;
  notOperationalDataWarning: string;
}

export interface AllenWarRoomOperationalLayoutBundle {
  contractVersion: "V60";
  layoutName: "Allen War Room Operational Layout";
  page: "/holdings";
  primaryUserRole: "owner_operator";
  generatedAt: string;
  decision: "READY_FOR_UI_REVIEW" | "NO_GO";

  marketSession: WarRoomMarketSession;
  dataVerification: WarRoomDataVerificationState;
  summaryCards: WarRoomSummaryCard[];
  actualPositions: WarRoomActualPosition[];
  fixedWatchlist: WarRoomWatchlistItem[];
  systemCandidates: WarRoomSystemCandidate[];
  riskBlocklist: WarRoomRiskBlocklistItem[];
  sessionStructures: WarRoomSessionStructure[];

  // Locked taxonomy flags.
  userIsDeveloper: false;
  actualPositionsDefinitionLocked: true;
  watchlistDefinitionLocked: true;
  systemCandidatesDefinitionLocked: true;
  actualPositionRequiresEntryRecord: true;
  actualPositionRequiresSharesAndCostForPnl: true;
  watchlistIsNotPosition: true;
  systemCandidateIsNotPosition: true;
  mockDataMustBeLabeled: true;
  fixtureDataMustBeLabeled: true;
  operationalLayoutDefined: true;
  engineeringSafetyMovedAwayFromPrimaryView: true;
  productionTradingReady: false;

  // Frozen safety flags.
  realDataConnected: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  portfolioApiSwitched: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;

  safetyLabels: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ALLEN_WAR_ROOM_OPERATIONAL_LAYOUT_CONTRACT_VERSION = "V60" as const;

export const ALLEN_WAR_ROOM_DATA_CATEGORIES: readonly WarRoomDataCategory[] = [
  "ACTUAL_POSITION",
  "FIXED_WATCHLIST",
  "SYSTEM_CANDIDATE",
  "OPPORTUNITY_POOL",
  "RISK_BLOCKLIST",
  "ENGINEERING_SAFETY",
] as const;

export const ALLEN_WAR_ROOM_MARKET_SESSIONS: readonly WarRoomMarketSession[] = [
  "PRE_MARKET",
  "INTRADAY",
  "AFTER_CLOSE",
  "US_MARKET_PREVIEW",
  "CLOSED",
  "DATA_UNAVAILABLE",
] as const;

export const ALLEN_WAR_ROOM_VERIFICATION_STATUSES: readonly WarRoomDataVerificationStatus[] = [
  "VERIFIED",
  "DELAYED",
  "STALE",
  "CONFLICT",
  "FIXTURE_ONLY",
  "MOCK_ONLY",
  "INSUFFICIENT_DATA",
  "NOT_CONNECTED",
] as const;

export const ALLEN_WAR_ROOM_TODAY_ACTIONS: readonly WarRoomTodayAction[] = [
  "HOLD",
  "DEFEND",
  "REDUCE",
  "ADD_ON_CONFIRMATION",
  "WATCH_PULLBACK",
  "WAIT",
  "AVOID",
  "DATA_INSUFFICIENT",
] as const;

/** Allen's fixed watchlist symbols (tracked, NOT positions). */
export const ALLEN_WAR_ROOM_FIXED_WATCHLIST_SYMBOLS: readonly string[] = [
  "3019",
  "4966",
  "5347",
  "4979",
  "2455",
] as const;

export const ALLEN_WAR_ROOM_SAFETY_LABELS = [
  "Allen War Room Operational Layout",
  "owner and user, not developer",
  "final website must use real data before operational use",
  "current fixture/mock data is not operational data",
  "actual positions are entered holdings only",
  "watchlist is not position",
  "system candidate is not position",
  "actual position requires shares and average cost before PnL",
  "no fake PnL",
  "no fake position size",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
  "engineering safety moved away from primary trading view",
  "追蹤股不等於持股",
  "系統候選股不等於持股",
  "目前非真實資料，不可作為操作依據",
  "持股資料待補",
  "不替代投資判斷",
] as const;
