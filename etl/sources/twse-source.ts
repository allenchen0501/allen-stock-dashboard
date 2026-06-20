import type {
  ETLSource,
  ETLSourceBatch,
  ETLSourceRecord,
} from "../core/etl-job";

export interface TwseRawPayload {
  dataset: string;
  fields: Record<string, unknown>;
}

export type TwseSourceRecord = ETLSourceRecord<TwseRawPayload>;

export class TwseSource implements ETLSource<TwseSourceRecord> {
  readonly source_name = "twse-openapi";
  readonly source_type = "official_exchange" as const;
  readonly source_confidence = 100;
  readonly capabilities = [
    "daily_prices",
    "market_snapshots",
    "chip_snapshots",
  ] as const;

  /** Foundation-only no-op. V3-4.6 never performs a network request. */
  async collect(): Promise<ETLSourceBatch<TwseSourceRecord>> {
    return {
      source_name: this.source_name,
      records: [],
      warnings: [
        {
          code: "FOUNDATION_ONLY",
          message: "TWSE collection is not implemented in V3-4.6.",
        },
      ],
      errors: [],
      collected_at: null,
    };
  }
}
