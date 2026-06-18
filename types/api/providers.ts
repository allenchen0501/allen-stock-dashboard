import type { ApiResult, DataSourceId, MarketRegion, PaginatedData, RequestContext } from "./common";
import type { IndexConstituent, IndexHistory, IndexHistoryQuery, IndexQuote } from "./indices";
import type { MarketBreadth, MarketCalendarDay, MarketMovers, MarketSnapshot, TradingSession } from "./market";
import type {
  FundamentalSnapshot,
  PriceCandle,
  StockHistoryQuery,
  StockProfile,
  StockQuote,
  StockSearchItem,
  StockSearchQuery,
} from "./stocks";

export interface ProviderCapabilities {
  quotes: boolean;
  historicalPrices: boolean;
  fundamentals: boolean;
  marketBreadth: boolean;
  indexConstituents: boolean;
  realtime: boolean;
}

export interface ProviderHealth {
  source: DataSourceId;
  available: boolean;
  checkedAt: string;
  message?: string;
}

export interface DataProvider {
  readonly id: DataSourceId;
  readonly capabilities: ProviderCapabilities;
  healthCheck(context?: RequestContext): Promise<ProviderHealth>;
}

/** Yahoo Finance、TWSE 與 Goodinfo adapter 需實作的股票資料契約。 */
export interface StockDataProvider extends DataProvider {
  getQuote(symbol: string, context?: RequestContext): Promise<ApiResult<StockQuote>>;
  getQuotes(symbols: string[], context?: RequestContext): Promise<ApiResult<StockQuote[]>>;
  getProfile(symbol: string, context?: RequestContext): Promise<ApiResult<StockProfile>>;
  getHistory(query: StockHistoryQuery, context?: RequestContext): Promise<ApiResult<PriceCandle[]>>;
  getFundamentals(symbol: string, context?: RequestContext): Promise<ApiResult<FundamentalSnapshot>>;
  search(query: StockSearchQuery, context?: RequestContext): Promise<ApiResult<PaginatedData<StockSearchItem>>>;
}

export interface MarketDataProvider extends DataProvider {
  getSnapshot(region: MarketRegion, context?: RequestContext): Promise<ApiResult<MarketSnapshot>>;
  getBreadth(region: MarketRegion, context?: RequestContext): Promise<ApiResult<MarketBreadth>>;
  getMovers(region: MarketRegion, context?: RequestContext): Promise<ApiResult<MarketMovers>>;
  getSession(region: MarketRegion, context?: RequestContext): Promise<ApiResult<TradingSession>>;
  getCalendar(from: string, to: string, context?: RequestContext): Promise<ApiResult<MarketCalendarDay[]>>;
}

export interface IndexDataProvider extends DataProvider {
  getIndexQuote(symbol: string, context?: RequestContext): Promise<ApiResult<IndexQuote>>;
  getIndexQuotes(symbols: string[], context?: RequestContext): Promise<ApiResult<IndexQuote[]>>;
  getIndexHistory(query: IndexHistoryQuery, context?: RequestContext): Promise<ApiResult<IndexHistory>>;
  getConstituents(symbol: string, context?: RequestContext): Promise<ApiResult<IndexConstituent[]>>;
}
