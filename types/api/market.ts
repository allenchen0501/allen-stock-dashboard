import type { CurrencyCode, DataSourceId, MarketRegion } from "./common";
import type { StockQuote } from "./stocks";

export type TradingSessionStatus = "pre-market" | "open" | "closed" | "after-hours" | "holiday";
export type MarketBias = "bullish" | "neutral" | "bearish";

export interface TradingSession {
  region: MarketRegion;
  status: TradingSessionStatus;
  timezone: string;
  opensAt?: string;
  closesAt?: string;
  nextOpenAt?: string;
}

export interface MarketBreadth {
  region: MarketRegion;
  advancers: number;
  decliners: number;
  unchanged: number;
  limitUp?: number;
  limitDown?: number;
  totalVolume?: number;
  totalTurnover?: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  region: MarketRegion;
  currency: CurrencyCode;
  value: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketTime: string;
  isDelayed: boolean;
}

export interface MarketData {
  source: DataSourceId;
  indices: MarketIndex[];
  updatedAt: string;
}

export interface MarketSnapshot extends MarketData {
  region: MarketRegion;
  session: TradingSession;
  breadth: MarketBreadth;
  bias: MarketBias;
  score?: number;
}

export interface MarketMovers {
  gainers: StockQuote[];
  losers: StockQuote[];
  mostActive: StockQuote[];
}

export interface MarketCalendarDay {
  date: string;
  region: MarketRegion;
  isTradingDay: boolean;
  note?: string;
}
