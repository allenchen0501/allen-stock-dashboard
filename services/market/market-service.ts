import type {
  ApiResult,
  MarketBreadth,
  MarketCalendarDay,
  MarketMovers,
  MarketRegion,
  MarketSnapshot,
  TradingSession,
} from "@/types/api";
import type { ServiceOptions } from "../service-options";

export interface MarketCalendarQuery {
  region: MarketRegion;
  from: string;
  to: string;
}

/** 跨資料來源的市場總覽服務。 */
export interface MarketService {
  getSnapshot(region: MarketRegion, options?: ServiceOptions): Promise<ApiResult<MarketSnapshot>>;
  getBreadth(region: MarketRegion, options?: ServiceOptions): Promise<ApiResult<MarketBreadth>>;
  getMovers(region: MarketRegion, options?: ServiceOptions): Promise<ApiResult<MarketMovers>>;
  getTradingSession(region: MarketRegion, options?: ServiceOptions): Promise<ApiResult<TradingSession>>;
  getCalendar(query: MarketCalendarQuery, options?: ServiceOptions): Promise<ApiResult<MarketCalendarDay[]>>;
}
