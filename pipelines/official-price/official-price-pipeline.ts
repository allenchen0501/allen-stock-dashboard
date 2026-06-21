import {
  normalizeOfficialPriceQuote,
  type OfficialPriceQuoteInput,
} from "./official-price-normalizer";
import { evaluateOfficialPriceQuality } from "./official-price-quality-gate";
import type { OfficialPricePipelineResult } from "./official-price-result";

export interface OfficialPricePipelineInput {
  official_quote: OfficialPriceQuoteInput;
  fallback_quote: OfficialPriceQuoteInput;
}

/** Pure pipeline: no reader, transport, persistence, clock, or inferred values. */
export function runOfficialPricePipeline(
  input: OfficialPricePipelineInput,
): OfficialPricePipelineResult {
  const official = normalizeOfficialPriceQuote(input.official_quote);
  const fallback = normalizeOfficialPriceQuote(input.fallback_quote);
  const quality = evaluateOfficialPriceQuality(official, fallback);

  return {
    symbol: official.symbol,
    close_price: official.close_price,
    record_date: official.record_date,
    record_time: official.record_time,
    source_name: official.source_name,
    validation_status: quality.status,
    data_warning: quality.status !== "PASS",
    decision_allowed: quality.status === "PASS",
    issues: quality.issues.map((issue) => ({ ...issue })),
  };
}
