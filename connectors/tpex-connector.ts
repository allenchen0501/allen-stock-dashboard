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

export interface TpexRawQuote {
  symbol?: string;
  stock_name?: string;
  closing_price?: number | null;
  trade_volume?: number | null;
  record_date?: string;
  record_time?: string;
  market?: ConnectorMarket;
}

/** Official OTC-equity daily close skeleton. Transport remains disabled. */
export class TpexConnector implements BaseConnector<TpexRawQuote> {
  readonly sourceName = "tpex-openapi" as const;
  readonly timeoutMs = 10_000;
  readonly rateLimitPerMinute = 30;

  async fetchQuotes(
    options: ConnectorRequestOptions,
  ): Promise<ConnectorResponse<TpexRawQuote>> {
    return createDisabledConnectorResponse(this.sourceName, options);
  }

  normalize(records: readonly TpexRawQuote[]): NormalizedQuoteRecord[] {
    return records.map((record) => ({
      symbol: record.symbol?.trim() ?? "",
      market: normalizeMarket(record.market, "TPEx"),
      price: record.closing_price ?? null,
      volume: record.trade_volume ?? null,
      currency: "TWD",
      record_date: record.record_date ?? "",
      record_time: record.record_time ?? "",
      source_name: this.sourceName,
      source_type: "official_exchange",
      source_confidence: 100,
      data_frequency: "daily_close",
      is_model_inference: false,
    }));
  }

  validate(
    records: readonly NormalizedQuoteRecord[],
    options: ConnectorValidationOptions = {},
  ): ConnectorValidationResult {
    return validateNormalizedQuotes(records, {
      ...options,
      expectedMarkets: ["TPEx"],
    });
  }
}
