import type {
  ETLSource,
  ETLSourceBatch,
  ETLSourceRecord,
} from "../core/etl-job";

export interface IsinRawPayload {
  stock_name: string;
  market_type: string;
  industry: string | null;
  is_active: boolean;
}

export type IsinSourceRecord = ETLSourceRecord<IsinRawPayload>;

export class IsinSource implements ETLSource<IsinSourceRecord> {
  readonly source_name = "twse-isin";
  readonly source_type = "official_exchange" as const;
  readonly source_confidence = 100;
  readonly capabilities = ["stock_master"] as const;

  /** Foundation-only no-op. V3-4.6 never performs a network request. */
  async collect(): Promise<ETLSourceBatch<IsinSourceRecord>> {
    return {
      source_name: this.source_name,
      records: [],
      warnings: [
        {
          code: "FOUNDATION_ONLY",
          message: "ISIN collection is not implemented in V3-4.6.",
        },
      ],
      errors: [],
      collected_at: null,
    };
  }
}
