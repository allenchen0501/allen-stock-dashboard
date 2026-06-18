import type {
  ApiFailure,
  ApiMetadata,
  ApiResult,
  MarketBreadth,
  MarketCalendarDay,
  MarketData,
  MarketDataProvider,
  MarketIndex,
  MarketMovers,
  MarketRegion,
  MarketSnapshot,
  ProviderCapabilities,
  ProviderHealth,
  RequestContext,
  TradingSession,
} from "@/types/api";
import type { ServiceOptions } from "@/services/service-options";
import type { MarketCalendarQuery, MarketService } from "../market-service";

const YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";

const INDEX_DEFINITIONS = [
  { symbol: "^TWII", name: "台股加權指數", region: "TW", currency: "TWD" },
  { symbol: "^IXIC", name: "NASDAQ", region: "US", currency: "USD" },
  { symbol: "^SOX", name: "SOX", region: "US", currency: "USD" },
] as const;

type IndexDefinition = (typeof INDEX_DEFINITIONS)[number];
type Fetcher = typeof fetch;

interface YahooTradingPeriod {
  start?: number;
  end?: number;
  timezone?: string;
}

interface YahooChartMeta {
  symbol?: string;
  currency?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketTime?: number;
  exchangeTimezoneName?: string;
  currentTradingPeriod?: {
    pre?: YahooTradingPeriod;
    regular?: YahooTradingPeriod;
    post?: YahooTradingPeriod;
  };
}

interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{ close?: Array<number | null> }>;
  };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: { code?: string; description?: string } | null;
  };
}

interface FetchedIndex {
  index: MarketIndex;
  session: TradingSession;
}

export interface YahooMarketProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  /** Yahoo 無法使用時，可注入 TWSE 或其他 MarketService。 */
  fallback?: MarketService;
}

/**
 * Yahoo Finance 市場資料 adapter。
 *
 * 這個 class 僅供 server-side 使用；請勿在 Client Component 直接呼叫，
 * 以免 Yahoo endpoint 暴露於瀏覽器並受到 CORS 或頻率限制影響。
 */
export class YahooMarketProvider implements MarketService, MarketDataProvider {
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
  private readonly fallback?: MarketService;
  private readonly sessions = new Map<MarketRegion, TradingSession>();
  private lastMarketData?: MarketData;

  constructor(options: YahooMarketProviderOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.fallback = options.fallback;
  }

  async getMarketData(options: ServiceOptions = {}): Promise<ApiResult<MarketData>> {
    const startedAt = Date.now();

    try {
      const results = await Promise.allSettled(
        INDEX_DEFINITIONS.map((definition) => this.fetchIndex(definition, options)),
      );

      const fetched = results
        .filter((result): result is PromiseFulfilledResult<FetchedIndex> => result.status === "fulfilled")
        .map((result) => result.value);
      const warnings = results
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => this.errorMessage(result.reason));

      for (const item of fetched) {
        this.sessions.set(item.index.region, item.session);
      }

      let indices = fetched.map((item) => item.index);
      const missingSymbols = INDEX_DEFINITIONS
        .map((definition) => definition.symbol)
        .filter((symbol) => !indices.some((index) => index.symbol === symbol));

      if (missingSymbols.length > 0 && this.lastMarketData) {
        const cachedIndices = this.lastMarketData.indices.filter((index) => missingSymbols.includes(index.symbol as IndexDefinition["symbol"]));
        indices = [...indices, ...cachedIndices];
        if (cachedIndices.length > 0) warnings.push(`使用上次成功資料補足：${cachedIndices.map((item) => item.symbol).join(", ")}`);
      }

      if (indices.length === 0) {
        return await this.marketDataFallback(options, warnings, startedAt);
      }

      const data: MarketData = {
        source: this.id,
        indices: this.sortIndices(indices),
        updatedAt: new Date().toISOString(),
      };

      this.lastMarketData = data;

      return {
        ok: true,
        data,
        meta: this.metadata(startedAt, false, warnings),
      };
    } catch (error) {
      return await this.marketDataFallback(options, [this.errorMessage(error)], startedAt);
    }
  }

  async getSnapshot(
    region: MarketRegion,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<MarketSnapshot>> {
    const serviceOptions = options as ServiceOptions;
    const marketData = await this.getMarketData(serviceOptions);

    if (!marketData.ok) return marketData;

    const relevantIndices = region === "GLOBAL"
      ? marketData.data.indices
      : marketData.data.indices.filter((index) => index.region === region);
    const averageChange = relevantIndices.length > 0
      ? relevantIndices.reduce((sum, index) => sum + index.changePercent, 0) / relevantIndices.length
      : 0;
    const bias = averageChange > 0.2 ? "bullish" : averageChange < -0.2 ? "bearish" : "neutral";

    const snapshot: MarketSnapshot = {
      ...marketData.data,
      region,
      session: this.resolveSession(region),
      breadth: this.emptyBreadth(region),
      bias,
      score: Math.round(Math.max(0, Math.min(100, 50 + averageChange * 10))),
    };

    return {
      ok: true,
      data: snapshot,
      meta: {
        ...marketData.meta,
        warnings: [
          ...(marketData.meta.warnings ?? []),
          "Yahoo chart endpoint 不提供市場廣度；breadth 暫以空值回傳。",
        ],
      },
    };
  }

  async getBreadth(
    region: MarketRegion,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<MarketBreadth>> {
    const serviceOptions = options as ServiceOptions;
    if (this.canFallback(serviceOptions)) {
      try {
        return await this.fallback!.getBreadth(region, serviceOptions);
      } catch (error) {
        return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
      }
    }
    return this.failure("UPSTREAM_UNAVAILABLE", "Yahoo chart endpoint 不提供市場上漲／下跌家數。", false);
  }

  async getMovers(
    region: MarketRegion,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<MarketMovers>> {
    const serviceOptions = options as ServiceOptions;
    if (this.canFallback(serviceOptions)) {
      try {
        return await this.fallback!.getMovers(region, serviceOptions);
      } catch (error) {
        return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
      }
    }
    return this.failure("UPSTREAM_UNAVAILABLE", "Yahoo chart endpoint 不提供完整市場排行。", false);
  }

  async getTradingSession(
    region: MarketRegion,
    options: ServiceOptions | RequestContext = {},
  ): Promise<ApiResult<TradingSession>> {
    const serviceOptions = options as ServiceOptions;
    const result = await this.getMarketData(serviceOptions);
    if (result.ok) {
      return {
        ok: true,
        data: this.resolveSession(region),
        meta: result.meta,
      };
    }

    if (this.canFallback(serviceOptions)) {
      try {
        return await this.fallback!.getTradingSession(region, serviceOptions);
      } catch (error) {
        return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
      }
    }
    return result;
  }

  getSession(
    region: MarketRegion,
    context?: RequestContext,
  ): Promise<ApiResult<TradingSession>> {
    return this.getTradingSession(region, context);
  }

  getCalendar(
    query: MarketCalendarQuery,
    options?: ServiceOptions,
  ): Promise<ApiResult<MarketCalendarDay[]>>;
  getCalendar(
    from: string,
    to: string,
    context?: RequestContext,
  ): Promise<ApiResult<MarketCalendarDay[]>>;
  async getCalendar(
    queryOrFrom: MarketCalendarQuery | string,
    toOrOptions?: string | ServiceOptions,
    context: RequestContext = {},
  ): Promise<ApiResult<MarketCalendarDay[]>> {
    const query: MarketCalendarQuery = typeof queryOrFrom === "string"
      ? { region: "GLOBAL", from: queryOrFrom, to: toOrOptions as string }
      : queryOrFrom;
    const options = (typeof toOrOptions === "string" ? context : toOrOptions ?? {}) as ServiceOptions;

    if (this.canFallback(options)) {
      try {
        return await this.fallback!.getCalendar(query, options);
      } catch (error) {
        return this.failure("UPSTREAM_UNAVAILABLE", this.errorMessage(error), true);
      }
    }
    return this.failure("UPSTREAM_UNAVAILABLE", "Yahoo chart endpoint 不提供可靠的交易所行事曆。", false);
  }

  async healthCheck(context: RequestContext = {}): Promise<ProviderHealth> {
    try {
      await this.fetchIndex(INDEX_DEFINITIONS[0], { ...context, forceRefresh: true });
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

  private async fetchIndex(
    definition: IndexDefinition,
    context: RequestContext,
  ): Promise<FetchedIndex> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const abort = () => controller.abort();
    context.signal?.addEventListener("abort", abort, { once: true });

    try {
      const url = new URL(`${YAHOO_CHART_ENDPOINT}/${encodeURIComponent(definition.symbol)}`);
      url.searchParams.set("interval", "1d");
      url.searchParams.set("range", "5d");
      url.searchParams.set("includePrePost", "true");

      const response = await this.fetcher(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; AllenStockDashboard/2.2)",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Yahoo ${definition.symbol} 回應 HTTP ${response.status}`);
      }

      const payload = await response.json() as YahooChartResponse;
      if (payload.chart?.error) {
        throw new Error(payload.chart.error.description ?? payload.chart.error.code ?? "Yahoo 回傳未知錯誤");
      }

      const result = payload.chart?.result?.[0];
      const meta = result?.meta;
      if (!result || !meta) throw new Error(`Yahoo ${definition.symbol} 缺少 chart result`);

      const closes = result.indicators?.quote?.[0]?.close?.filter((value): value is number => typeof value === "number") ?? [];
      const value = meta.regularMarketPrice ?? closes.at(-1);
      const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? closes.at(-2);
      if (typeof value !== "number" || typeof previousClose !== "number") {
        throw new Error(`Yahoo ${definition.symbol} 缺少價格欄位`);
      }

      const change = value - previousClose;
      const marketTime = meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1_000).toISOString()
        : new Date().toISOString();

      return {
        index: {
          symbol: definition.symbol,
          name: definition.name,
          region: definition.region,
          currency: definition.currency,
          value,
          previousClose,
          change,
          changePercent: previousClose === 0 ? 0 : (change / previousClose) * 100,
          marketTime,
          isDelayed: true,
        },
        session: this.sessionFromMeta(definition.region, meta),
      };
    } finally {
      clearTimeout(timeout);
      context.signal?.removeEventListener("abort", abort);
    }
  }

  private sessionFromMeta(region: MarketRegion, meta: YahooChartMeta): TradingSession {
    const periods = meta.currentTradingPeriod;
    const now = Date.now() / 1_000;
    const inPeriod = (period?: YahooTradingPeriod) =>
      typeof period?.start === "number" && typeof period.end === "number" && now >= period.start && now < period.end;

    const status = inPeriod(periods?.regular)
      ? "open"
      : inPeriod(periods?.pre)
        ? "pre-market"
        : inPeriod(periods?.post)
          ? "after-hours"
          : "closed";

    return {
      region,
      status,
      timezone: meta.exchangeTimezoneName ?? periods?.regular?.timezone ?? "UTC",
      opensAt: periods?.regular?.start ? new Date(periods.regular.start * 1_000).toISOString() : undefined,
      closesAt: periods?.regular?.end ? new Date(periods.regular.end * 1_000).toISOString() : undefined,
    };
  }

  private resolveSession(region: MarketRegion): TradingSession {
    if (region !== "GLOBAL") {
      return this.sessions.get(region) ?? this.closedSession(region);
    }

    const sessions = [...this.sessions.values()];
    const active = sessions.find((session) => session.status === "open")
      ?? sessions.find((session) => session.status === "pre-market" || session.status === "after-hours");

    return active
      ? { ...active, region: "GLOBAL" }
      : this.closedSession("GLOBAL");
  }

  private async marketDataFallback(
    options: ServiceOptions,
    warnings: string[],
    startedAt: number,
  ): Promise<ApiResult<MarketData>> {
    if (this.lastMarketData) {
      return {
        ok: true,
        data: this.lastMarketData,
        meta: this.metadata(startedAt, true, [...warnings, "Yahoo 無法使用，回傳上次成功資料。"]),
      };
    }

    if (this.canFallback(options)) {
      try {
        const fallbackResult = await this.fallback!.getSnapshot("GLOBAL", options);
        if (fallbackResult.ok) {
          return {
            ok: true,
            data: {
              source: fallbackResult.data.source,
              indices: fallbackResult.data.indices,
              updatedAt: fallbackResult.data.updatedAt,
            },
            meta: {
              ...fallbackResult.meta,
              warnings: [...warnings, ...(fallbackResult.meta.warnings ?? []), "已切換至 fallback MarketService。"],
            },
          };
        }
      } catch (error) {
        warnings.push(`Fallback 失敗：${this.errorMessage(error)}`);
      }
    }

    return this.failure("UPSTREAM_UNAVAILABLE", warnings.join("；") || "Yahoo Finance 暫時無法使用。", true);
  }

  private metadata(startedAt: number, cached: boolean, warnings: string[] = []): ApiMetadata {
    return {
      source: this.id,
      fetchedAt: new Date().toISOString(),
      cached,
      latencyMs: Date.now() - startedAt,
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

  private emptyBreadth(region: MarketRegion): MarketBreadth {
    return { region, advancers: 0, decliners: 0, unchanged: 0 };
  }

  private closedSession(region: MarketRegion): TradingSession {
    return { region, status: "closed", timezone: region === "TW" ? "Asia/Taipei" : "America/New_York" };
  }

  private canFallback(options: ServiceOptions): boolean {
    return Boolean(this.fallback && options.allowFallback !== false);
  }

  private sortIndices(indices: MarketIndex[]): MarketIndex[] {
    return [...indices].sort(
      (left, right) => INDEX_DEFINITIONS.findIndex((item) => item.symbol === left.symbol)
        - INDEX_DEFINITIONS.findIndex((item) => item.symbol === right.symbol),
    );
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.name === "AbortError" ? "Yahoo Finance 請求逾時或已取消" : error.message;
    }
    return "Yahoo Finance 發生未知錯誤";
  }
}
