import type {
  ETLSource,
  ETLSourceBatch,
  ETLSourceRecord,
} from "../core/etl-job";

export interface TpexRawPayload {
  dataset: string;
  fields: Record<string, unknown>;
}

export type TpexSourceRecord = ETLSourceRecord<TpexRawPayload>;

export class TpexSource implements ETLSource<TpexSourceRecord> {
  readonly source_name = "tpex-openapi";
  readonly source_type = "official_exchange" as const;
  readonly source_confidence = 100;
  readonly capabilities = ["daily_prices", "chip_snapshots"] as const;

  /** Foundation-only no-op. V3-4.6 never performs a network request. */
  async collect(): Promise<ETLSourceBatch<TpexSourceRecord>> {
    return {
      source_name: this.source_name,
      records: [],
      warnings: [
        {
          code: "FOUNDATION_ONLY",
          message: "TPEx collection is not implemented in V3-4.6.",
        },
      ],
      errors: [],
      collected_at: null,
    };
  }
}
