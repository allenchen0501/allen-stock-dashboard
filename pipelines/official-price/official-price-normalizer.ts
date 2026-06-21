export interface OfficialPriceQuoteInput {
  symbol?: string | null;
  close_price?: number | null;
  price?: number | null;
  record_date?: string | null;
  record_time?: string | null;
  source_name?: string | null;
}

export interface NormalizedOfficialPriceQuote {
  symbol: string;
  close_price: number | null;
  record_date: string;
  record_time: string;
  source_name: string;
}

function cleanText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function closePrice(input: OfficialPriceQuoteInput): number | null {
  const value =
    input.close_price !== undefined ? input.close_price : input.price;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Maps known field names only; missing values stay empty/null and are never inferred. */
export function normalizeOfficialPriceQuote(
  input: OfficialPriceQuoteInput,
): NormalizedOfficialPriceQuote {
  return {
    symbol: cleanText(input.symbol),
    close_price: closePrice(input),
    record_date: cleanText(input.record_date),
    record_time: cleanText(input.record_time),
    source_name: cleanText(input.source_name),
  };
}
