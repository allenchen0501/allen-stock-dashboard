/** JSON value accepted by PostgreSQL json/jsonb columns. */
export type Json =
  | boolean
  | number
  | string
  | null
  | Json[]
  | { [key: string]: Json | undefined };

export type PositionType = "long" | "short";
export type TradeSide = "buy" | "sell";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type WarRoomReportStatus = "draft" | "published" | "archived";

export interface TimestampedRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface SourcedRecord extends TimestampedRecord {
  record_date: string;
  record_time: string;
  source_name: string;
  source_type: string;
  source_confidence: number;
  data_frequency: string;
  is_model_inference: boolean;
}

/** Mirrors public.portfolio_stocks. */
export interface PortfolioStock extends TimestampedRecord {
  symbol: string;
  name: string;
  market: string;
  cost_price: number;
  shares: number;
  position_type: PositionType;
  is_active: boolean;
}

export type CreatePortfolioStockInput = Omit<
  PortfolioStock,
  "id" | "created_at" | "updated_at" | "is_active"
> & {
  is_active?: boolean;
};

export type UpdatePortfolioStockInput = Partial<
  Omit<PortfolioStock, "id" | "created_at" | "updated_at">
>;

/** Mirrors public.watchlist_stocks. */
export interface WatchlistStock extends TimestampedRecord {
  symbol: string;
  name: string;
  sector: string | null;
  industry: string | null;
  tier: string;
  is_active: boolean;
}

export type CreateWatchlistStockInput = Pick<WatchlistStock, "symbol" | "name"> &
  Partial<Pick<WatchlistStock, "sector" | "industry" | "tier" | "is_active">>;

export type UpdateWatchlistStockInput = Partial<
  Omit<WatchlistStock, "id" | "created_at" | "updated_at">
>;

/**
 * Planned row for the future public.trade_journal table.
 * V3-3 defines the contract only; no matching migration exists yet.
 */
export interface TradeJournal extends TimestampedRecord {
  symbol: string;
  market: string;
  trade_date: string;
  trade_time: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fees: number;
  tax: number;
  strategy_name: string | null;
  notes: string | null;
}

export type CreateTradeInput = Omit<
  TradeJournal,
  "id" | "created_at" | "updated_at"
>;

export type UpdateTradeInput = Partial<CreateTradeInput>;

/** Mirrors public.war_room_decisions. */
export interface WarRoomDecision extends SourcedRecord {
  report_type: string;
  decision_date: string;
  decision_time: string;
  market_mode: string;
  suggested_action: string;
  suggested_position_ratio: number;
  top_industries: string[];
  top_symbols: string[];
  avoid_symbols: string[];
  risk_summary: string;
  ai_summary: string;
}

/**
 * Planned row for the future public.war_room_reports table.
 * Kept separate from war_room_snapshots and war_room_decisions.
 */
export interface WarRoomReport extends TimestampedRecord {
  report_type: string;
  report_date: string;
  report_time: string;
  title: string;
  summary: string;
  content: Json;
  status: WarRoomReportStatus;
  published_at: string | null;
}

/** Mirrors public.portfolio_performance_snapshots. */
export interface PortfolioPerformanceSnapshot extends SourcedRecord {
  total_invested_cost: number;
  current_market_value: number;
  realized_profit_loss: number;
  unrealized_profit_loss: number;
  total_profit_loss: number;
  return_rate: number;
  cash_ratio: number;
  position_ratio: number;
}
