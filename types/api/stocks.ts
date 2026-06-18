import type {
  CurrencyCode,
  DateRange,
  ExchangeCode,
  MarketRegion,
  PaginationParams,
} from "./common";

export interface StockIdentity {
  symbol: string;
  name: string;
  exchange: ExchangeCode;
  region: MarketRegion;
  currency: CurrencyCode;
}

export interface StockQuote extends StockIdentity {
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  /** 成交值；Yahoo chart 無此欄位時以現價 × 成交量估算。 */
  turnover: number;
  turnoverEstimated: boolean;
  marketTime: string;
  isDelayed: boolean;
}

export interface PortfolioStock extends StockIdentity {
  /** Yahoo Finance 查詢使用的完整代號，例如 3019.TW。 */
  yahooSymbol: string;
  watchOrder: number;
}

export interface StockSnapshot {
  stock: PortfolioStock;
  quote: StockQuote;
  updatedAt: string;
}

export interface StockProfile extends StockIdentity {
  industry?: string;
  sector?: string;
  website?: string;
  description?: string;
  listedAt?: string;
  sharesOutstanding?: number;
}

export interface PriceCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type PriceInterval = "1m" | "5m" | "15m" | "30m" | "1h" | "1d" | "1wk" | "1mo";

export interface StockHistoryQuery extends DateRange {
  symbol: string;
  interval: PriceInterval;
  adjusted?: boolean;
}

export interface StockSearchQuery extends PaginationParams {
  keyword: string;
  region?: MarketRegion;
  exchange?: ExchangeCode;
}

export interface StockSearchItem extends StockIdentity {
  type: "equity" | "etf" | "warrant" | "other";
}

export interface FundamentalSnapshot {
  symbol: string;
  fiscalPeriod: string;
  eps?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  revenueGrowth?: number;
  grossMargin?: number;
  operatingMargin?: number;
  returnOnEquity?: number;
}
