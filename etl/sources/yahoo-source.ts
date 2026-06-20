import type {
  ETLSource,
  ETLSourceBatch,
  ETLSourceRecord,
} from "../core/etl-job";

export interface YahooRawPayload {
  yahoo_symbol: string;
  fields: Record<string, unknown>;
}

export type YahooSourceRecord = ETLSourceRecord<YahooRawPayload>;

export class YahooSource implements ETLSource<YahooSourceRecord> {
  readonly source_name = "yahoo-finance-fallback";
  readonly source_type = "market_api" as const;
  readonly source_confidence = 70;
  readonly capabilities = [
    "global_market_snapshots",
    "taiwan_intraday_fallback",
  ] as const;

  /** Foundation-only no-op. Yahoo never supplies the Portfolio membership list. */
  async collect(): Promise<ETLSourceBatch<YahooSourceRecord>> {
    return {
      source_name: this.source_name,
      records: [],
      warnings: [
        {
          code: "FOUNDATION_ONLY",
          message: "Yahoo fallback collection is not implemented in V3-4.6.",
        },
      ],
      errors: [],
      collected_at: null,
    };
  }
}
