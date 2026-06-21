import { createHash } from "node:crypto";

export interface EtlIdempotencyKeyInput {
  symbol: string;
  record_date: string;
  source_name: string;
  data_frequency: string;
}

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required for idempotency.`);
  return normalized;
}

/** Stable SHA-256 over the four approved natural-key fields. */
export function createEtlIdempotencyKey(
  input: EtlIdempotencyKeyInput,
): string {
  const canonical = [
    required(input.symbol, "symbol").toUpperCase(),
    required(input.record_date, "record_date"),
    required(input.source_name, "source_name").toLowerCase(),
    required(input.data_frequency, "data_frequency").toLowerCase(),
  ].join("|");

  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}
