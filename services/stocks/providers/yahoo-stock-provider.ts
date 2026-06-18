import type {
  ApiFailure,
  ApiMetadata,
  ApiResult,
  FundamentalSnapshot,
  PaginatedData,
  PortfolioStock,
  PriceCandle,
  ProviderCapabilities,
  ProviderHealth,
  RequestContext,
  StockDataProvider,
  StockHistoryQuery,
  StockProfile,
  StockQuote,
  StockSearchItem,
  StockSearchQuery,
  StockSnapshot,
} from "@/types/api";
import type { ServiceOptions } from "@/services/service-options";
import type { StocksService } from "../stocks-service";

const YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";

export const ALLEN_PORTFOLIO_STOCKS = [
  { symbol: "3019", yahooSymbol: "3019.TW", name: "亞洲光學", exchange: "TWSE", region: "TW", currency: "TWD", watchOrder: 1 },
  { symbol: "4966", yahooSymbol: "4966.TW", name: "譜瑞-KY", exchange: "TWSE", region: "TW", currency: "TWD", watchOrder: 2 },
  { symbol: "5347", yahooSymbol: "5347.TWO", name: "世界", exchange: "TPEx", region: "TW", currency: "TWD", watchOrder: 3 },
  { symbol: "2455", yahooSymbol: "2455.TW", name: "全新", exchange: "TWSE", region: "TW", currency: "TWD", watchOrder: 4 },
  { symbol: "4979", yahooSymbol: "4979.TWO", name: "華星光", exchange: "TPEx", region: "TW", currency: "TWD", watchOrder: 5 },
] as const satisfies readonly PortfolioStock[];

type Fetcher = typeof fetch;

interface YahooQuoteSeries {
  open?: Array<number | null>;
  high?: Array<number | null>;
  low?: Array<number | null>;
  close?: Array<number | null>;
  volume?: Array<number | null>;
}

interface YahooChartMeta {
  symbol?: string;
  currency?: string;
  exchangeName?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
}

interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: { quote?: YahooQuoteSeries[] };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: { code?: string; description?: string } | null;
  };
}

export interface YahooStockProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  /** Yahoo 無法使用時，可注入 Goodinfo、CMoney 或其他 StocksService。 */
  fallback?: StocksService;
}

/** Yahoo Finance 台股行情 adapter，僅供 server-side 呼叫。 */
export class YahooStockProvider implements StocksService, StockDataProvider {
  readonly id = "yahoo-finance" as const;

  readonly capabilities: ProviderCapabilities = {
    quotes: true,
    historicalPrices: true,
    fundamentals: false,
    marketBreadth: false,
    indexConstituents: false,
    realtime: false,
  };

  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly fallback?: StocksService;
  private readonly quoteCache = new Map<string, StockQuote>();

  constructor(options: YahooStockProviderOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.fallback = options.fallback;
  }

  async getPortfolioSnapshots(options: ServiceOptions = {}): Promise<ApiResult<StockSnapshot[]>> {
    const quotesResult = await this.getQuotes(
      ALLEN_PORTFOLIO_STOCKS.map((stock) => stock.symbol),
      options,
    );

    if (!quotesResult.ok) return quotesResult;

    const snapshots = quotesResult.data.map((quote) => ({
      stock: this.resolveStock(quote.symbol),
      quote,
      updatedAt: quote.marketTime,
    }));

    return { ok: true, data: snapshots, meta: quotesResult.meta };
  }

  async getQuote(
    symbol: string,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<StockQuote>> {
    const startedAt = Date.now();
    const serviceOptions = options as ServiceOptions;
    const stock = this.resolveStock(symbol);

    try {
      const result = await this.fetchChart(
        stock.yahooSymbol,
        { interval: "1d", range: "5d", includePrePost: "true" },
        serviceOptions,
      );
      const quote = this.normalizeQuote(stock, result);
      this.quoteCache.set(stock.symbol, quote);

      return { ok: true, data: quote, meta: this.metadata(startedAt) };
    } catch (error) {
      const cached = this.quoteCache.get(stock.symbol);
      if (cached) {
        return {
          ok: true,
          data: cached,
          meta: this.metadata(startedAt, true, [`Yahoo 查詢失敗，${stock.symbol} 使用上次成功資料：${this.errorMessage(error)}`]),
        };
      }

      if (this.canFallback(serviceOptions)) {
        try {
          return await this.fallback!.getQuote(stock.symbol, serviceOptions);
        } catch (fallbackError) {
          return this.failure("UPSTREAM_UNAVAILABLE", `Yahoo：${this.errorMessage(error)}；Fallback：${this.errorMessage(fallbackError)}`, true);
        }
      }

      return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
    }
  }

  async getQuotes(
    symbols: string[],
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<StockQuote[]>> {
    const startedAt = Date.now();
    const results = await Promise.allSettled(symbols.map((symbol) => this.getQuote(symbol, options)));
    const quotes: StockQuote[] = [];
    const warnings: string[] = [];

    for (const result of results) {
      if (result.status === "rejected") {
        warnings.push(this.errorMessage(result.reason));
      } else if (result.value.ok) {
        quotes.push(result.value.data);
        warnings.push(...(result.value.meta.warnings ?? []));
      } else {
        warnings.push(result.value.error.message);
      }
    }

    if (quotes.length === 0) {
      return this.failure("UPSTREAM_UNAVAILABLE", warnings.join("；") || "所有股票行情皆無法取得。", true);
    }

    const order = new Map(symbols.map((symbol, index) => [this.baseSymbol(symbol), index]));
    quotes.sort((left, right) => (order.get(left.symbol) ?? 999) - (order.get(right.symbol) ?? 999));

    return {
      ok: true,
      data: quotes,
      meta: this.metadata(startedAt, false, warnings),
    };
  }

  async getProfile(
    symbol: string,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<StockProfile>> {
    const startedAt = Date.now();
    const serviceOptions = options as ServiceOptions;
    const stock = this.resolveStock(symbol);

    try {
      const result = await this.fetchChart(stock.yahooSymbol, { interval: "1d", range: "1d" }, serviceOptions);
      const meta = result.meta;
      return {
        ok: true,
        data: {
          ...stock,
          name: meta?.longName ?? meta?.shortName ?? stock.name,
        },
        meta: this.metadata(startedAt),
      };
    } catch (error) {
      if (this.canFallback(serviceOptions)) {
        try {
          return await this.fallback!.getProfile(stock.symbol, serviceOptions);
        } catch (fallbackError) {
          return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(fallbackError), true);
        }
      }
      return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
    }
  }

  async getHistory(
    query: StockHistoryQuery,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<PriceCandle[]>> {
    const startedAt = Date.now();
    const serviceOptions = options as ServiceOptions;
    const stock = this.resolveStock(query.symbol);

    try {
      const period1 = Math.floor(new Date(query.from).getTime() / 1_000);
      const period2 = Math.floor(new Date(query.to).getTime() / 1_000) + 86_400;
      if (!Number.isFinite(period1) || !Number.isFinite(period2)) {
        return this.failure("BAD_REQUEST", "歷史資料日期格式不正確。", false);
      }

      const result = await this.fetchChart(
        stock.yahooSymbol,
        { interval: query.interval, period1, period2, events: "history" },
        serviceOptions,
      );
      const candles = this.normalizeCandles(result);

      return { ok: true, data: candles, meta: this.metadata(startedAt) };
    } catch (error) {
      if (this.canFallback(serviceOptions)) {
        try {
          return await this.fallback!.getHistory(query, serviceOptions);
        } catch (fallbackError) {
          return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(fallbackError), true);
        }
      }
      return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
    }
  }

  async getFundamentals(
    symbol: string,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<FundamentalSnapshot>> {
    const serviceOptions = options as ServiceOptions;
    if (this.canFallback(serviceOptions)) {
      try {
        return await this.fallback!.getFundamentals(this.baseSymbol(symbol), serviceOptions);
      } catch (error) {
        return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
      }
    }
    return this.failure("UPSTREAM_UNAVAILABLE", "Yahoo chart endpoint 不提供可靠的台股基本面資料。", false);
  }

  async search(
    query: StockSearchQuery,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<PaginatedData<StockSearchItem>>> {
    const serviceOptions = options as ServiceOptions;
    if (this.canFallback(serviceOptions)) {
      try {
        return await this.fallback!.search(query, serviceOptions);
      } catch (error) {
        return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
      }
    }

    const keyword = query.keyword.trim().toLowerCase();
    const items = ALLEN_PORTFOLIO_STOCKS
      .filter((stock) => stock.symbol.includes(keyword) || stock.name.toLowerCase().includes(keyword))
      .map<StockSearchItem>((stock) => ({ ...stock, type: "equity" }));

    return {
      ok: true,
      data: { items, page: 1, pageSize: items.length, total: items.length },
      meta: this.metadata(Date.now()),
    };
  }

  async healthCheck(context: RequestContext = {}): Promise<ProviderHealth> {
    try {
      const stock = ALLEN_PORTFOLIO_STOCKS[0];
      await this.fetchChart(stock.yahooSymbol, { interval: "1d", range: "1d" }, { ...context, forceRefresh: true });
      return { source: this.id, available: true, checkedAt: new Date().toISOString() };
    } catch (error) {
      return {
        source: this.id,
        available: false,
        checkedAt: new Date().toISOString(),
        message: this.errorMessage(error),
      };
    }
  }

  private async fetchChart(
    yahooSymbol: string,
    params: Record<string, string | number | boolean>,
    context: RequestContext,
  ): Promise<YahooChartResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const abort = () => controller.abort();
    context.signal?.addEventListener("abort", abort, { once: true });

    try {
      const url = new URL(`${YAHOO_CHART_ENDPOINT}/${encodeURIComponent(yahooSymbol)}`);
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

      const response = await this.fetcher(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; AllenStockDashboard/2.3)",
        },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Yahoo ${yahooSymbol} 回應 HTTP ${response.status}`);

      const payload = await response.json() as YahooChartResponse;
      if (payload.chart?.error) {
        throw new Error(payload.chart.error.description ?? payload.chart.error.code ?? "Yahoo 回傳未知錯誤");
      }

      const result = payload.chart?.result?.[0];
      if (!result?.meta) throw new Error(`Yahoo ${yahooSymbol} 缺少 chart result`);
      return result;
    } finally {
      clearTimeout(timeout);
      context.signal?.removeEventListener("abort", abort);
    }
  }

  private normalizeQuote(stock: PortfolioStock, result: YahooChartResult): StockQuote {
    const meta = result.meta!;
    const quote = result.indicators?.quote?.[0];
    const last = Math.max(0, (result.timestamp?.length ?? 1) - 1);
    const closes = quote?.close?.filter((value): value is number => typeof value === "number") ?? [];
    const price = meta.regularMarketPrice ?? closes.at(-1);
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? closes.at(-2);

    if (typeof price !== "number" || typeof previousClose !== "number") {
      throw new Error(`Yahoo ${stock.yahooSymbol} 缺少價格欄位`);
    }

    const volume = meta.regularMarketVolume ?? quote?.volume?.[last] ?? 0;
    const change = price - previousClose;

    return {
      ...stock,
      name: meta.longName ?? meta.shortName ?? stock.name,
      price,
      previousClose,
      change,
      changePercent: previousClose === 0 ? 0 : (change / previousClose) * 100,
      open: quote?.open?.[last] ?? price,
      high: meta.regularMarketDayHigh ?? quote?.high?.[last] ?? price,
      low: meta.regularMarketDayLow ?? quote?.low?.[last] ?? price,
      volume,
      turnover: price * volume,
      turnoverEstimated: true,
      marketTime: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1_000).toISOString()
        : new Date().toISOString(),
      isDelayed: true,
    };
  }

  private normalizeCandles(result: YahooChartResult): PriceCandle[] {
    const quote = result.indicators?.quote?.[0];
    if (!quote || !result.timestamp) return [];

    return result.timestamp.flatMap((timestamp, index) => {
      const open = quote.open?.[index];
      const high = quote.high?.[index];
      const low = quote.low?.[index];
      const close = quote.close?.[index];
      if ([open, high, low, close].some((value) => typeof value !== "number")) return [];

      return [{
        timestamp: new Date(timestamp * 1_000).toISOString(),
        open: open as number,
        high: high as number,
        low: low as number,
        close: close as number,
        volume: quote.volume?.[index] ?? 0,
      }];
    });
  }

  private resolveStock(symbol: string): PortfolioStock {
    const base = this.baseSymbol(symbol);
    const known = ALLEN_PORTFOLIO_STOCKS.find((stock) => stock.symbol === base);
    if (known) return { ...known };

    const isOtc = symbol.toUpperCase().endsWith(".TWO");
    return {
      symbol: base,
      yahooSymbol: symbol.includes(".") ? symbol.toUpperCase() : `${base}.TW`,
      name: base,
      exchange: isOtc ? "TPEx" : "TWSE",
      region: "TW",
      currency: "TWD",
      watchOrder: 999,
    };
  }

  private baseSymbol(symbol: string): string {
    return symbol.trim().toUpperCase().replace(/\.(TW|TWO)$/, "");
  }

  private metadata(startedAt: number, cached = false, warnings: string[] = []): ApiMetadata {
    return {
      source: this.id,
      fetchedAt: new Date().toISOString(),
      cached,
      latencyMs: Math.max(0, Date.now() - startedAt),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private failure<T>(
    code: ApiFailure["error"]["code"],
    message: string,
    retryable: boolean,
  ): ApiResult<T> {
    return {
      ok: false,
      error: { code, message, source: this.id, retryable },
      meta: { source: this.id, fetchedAt: new Date().toISOString(), cached: false },
    };
  }

  private canFallback(options: ServiceOptions): boolean {
    return Boolean(this.fallback && options.allowFallback !== false);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.name === "AbortError" ? "Yahoo Finance 請求逾時或已取消" : error.message;
    }
    return "Yahoo Finance 發生未知錯誤";
  }
}
