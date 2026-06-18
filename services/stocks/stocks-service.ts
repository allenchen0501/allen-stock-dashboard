import type {
  ApiResult,
  FundamentalSnapshot,
  PaginatedData,
  PriceCandle,
  StockHistoryQuery,
  StockProfile,
  StockQuote,
  StockSearchItem,
  StockSearchQuery,
} from "@/types/api";
import type { ServiceOptions } from "../service-options";

/** 個股即時、歷史與基本面資料的統一入口。 */
export interface StocksService {
  getQuote(symbol: string, options?: ServiceOptions): Promise<ApiResult<StockQuote>>;
  getQuotes(symbols: string[], options?: ServiceOptions): Promise<ApiResult<StockQuote[]>>;
  getProfile(symbol: string, options?: ServiceOptions): Promise<ApiResult<StockProfile>>;
  getHistory(query: StockHistoryQuery, options?: ServiceOptions): Promise<ApiResult<PriceCandle[]>>;
  getFundamentals(symbol: string, options?: ServiceOptions): Promise<ApiResult<FundamentalSnapshot>>;
  search(query: StockSearchQuery, options?: ServiceOptions): Promise<ApiResult<PaginatedData<StockSearchItem>>>;
}
