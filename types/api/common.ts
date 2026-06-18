/** 可替換的上游資料來源識別。 */
export type DataSourceId = "mock" | "yahoo-finance" | "twse" | "goodinfo";

export type MarketRegion = "TW" | "US" | "GLOBAL";
export type ExchangeCode = "TWSE" | "TPEx" | "NASDAQ" | "NYSE" | "OTHER";
export type CurrencyCode = "TWD" | "USD";

export interface RequestContext {
  /** 用於追蹤跨服務請求。 */
  requestId?: string;
  /** 呼叫端可主動取消請求。 */
  signal?: AbortSignal;
  /** 強制略過快取。 */
  forceRefresh?: boolean;
}

export interface ApiMetadata {
  source: DataSourceId;
  fetchedAt: string;
  cached: boolean;
  latencyMs?: number;
  warnings?: string[];
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_UNAVAILABLE"
  | "UNAUTHORIZED"
  | "TIMEOUT"
  | "PARSE_ERROR"
  | "UNKNOWN";

export interface ApiErrorDetail {
  code: ApiErrorCode;
  message: string;
  source?: DataSourceId;
  retryable: boolean;
  cause?: unknown;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta: ApiMetadata;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorDetail;
  meta?: Partial<ApiMetadata>;
}

/** 所有 service 對 UI 或 route handler 的統一回傳格式。 */
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export interface DateRange {
  from: string;
  to: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
