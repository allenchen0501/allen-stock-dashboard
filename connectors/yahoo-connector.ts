import {
  createDisabledConnectorResponse,
  normalizeMarket,
  type BaseConnector,
  validateNormalizedQuotes,
} from "./base-connector";
import type {
  ConnectorMarket,
  ConnectorRequestOptions,
  ConnectorResponse,
  ConnectorValidationOptions,
  ConnectorValidationResult,
  NormalizedQuoteRecord,
} from "./types";

export interface YahooRawQuote {
  symbol?: string;
  regular_market_price?: number | null;
  regular_market_volume?: number | null;
  record_date?: string;
  record_time?: string;
  market?: ConnectorMarket;
  currency?: "TWD" | "USD" | null;
}

/** Fallback/global-market skeleton. Never the sole Taiwan decision source. */
export class YahooConnector implements BaseConnector<YahooRawQuote> {
  readonly sourceName = "yahoo-finance" as const;
  readonly timeoutMs = 8_000;
  readonly rateLimitPerMinute = 15;

  async fetchQuotes(
    options: ConnectorRequestOptions,
  ): Promise<ConnectorResponse<YahooRawQuote>> {
    return createDisabledConnectorResponse(this.sourceName, options);
  }

  normalize(records: readonly YahooRawQuote[]): NormalizedQuoteRecord[] {
    return records.map((record) => ({
      symbol: record.symbol?.trim() ?? "",
      market: normalizeMarket(record.market, "GLOBAL"),
      price: record.regular_market_price ?? null,
      volume: record.regular_market_volume ?? null,
      currency: record.currency ?? null,
      record_date: record.record_date ?? "",
      record_time: record.record_time ?? "",
      source_name: this.sourceName,
      source_type: "market_api",
      source_confidence: 70,
      data_frequency:
        record.market === "US" || record.market === "GLOBAL"
          ? "global_snapshot"
          : "delayed_quote",
      is_model_inference: false,
    }));
  }

  validate(
    records: readonly NormalizedQuoteRecord[],
    options: ConnectorValidationOptions = {},
  ): ConnectorValidationResult {
    return validateNormalizedQuotes(records, options);
  }
}
