import type {
  ApiResult,
  IndexConstituent,
  IndexHistory,
  IndexHistoryQuery,
  IndexQuote,
} from "@/types/api";
import type { ServiceOptions } from "../service-options";

/** 台股與海外指數行情的統一入口。 */
export interface IndicesService {
  getQuote(symbol: string, options?: ServiceOptions): Promise<ApiResult<IndexQuote>>;
  getQuotes(symbols: string[], options?: ServiceOptions): Promise<ApiResult<IndexQuote[]>>;
  getHistory(query: IndexHistoryQuery, options?: ServiceOptions): Promise<ApiResult<IndexHistory>>;
  getConstituents(symbol: string, options?: ServiceOptions): Promise<ApiResult<IndexConstituent[]>>;
}
