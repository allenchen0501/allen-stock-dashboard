import type { CurrencyCode, DateRange, MarketRegion } from "./common";
import type { PriceCandle, PriceInterval } from "./stocks";

export interface IndexIdentity {
  symbol: string;
  name: string;
  region: MarketRegion;
  currency: CurrencyCode;
}

export interface IndexQuote extends IndexIdentity {
  value: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketTime: string;
  isDelayed: boolean;
}

export interface IndexHistoryQuery extends DateRange {
  symbol: string;
  interval: PriceInterval;
}

export interface IndexHistory {
  index: IndexIdentity;
  candles: PriceCandle[];
}

export interface IndexConstituent {
  indexSymbol: string;
  stockSymbol: string;
  stockName: string;
  weight?: number;
}
