import { createHash } from "node:crypto";
import type { HttpTransportResult } from "../transports/http-transport";
import type { ConnectorSourceName, NormalizedQuoteRecord } from "../types";
import type {
  RuntimeEvidence,
  RuntimeEvidenceIssue,
  RuntimeEvidenceValidationStatus,
} from "./runtime-evidence";

export interface RuntimeEvidenceRecorderInput {
  source_name: ConnectorSourceName;
  symbol: string;
  transport: HttpTransportResult<unknown>;
  raw_payload: unknown;
  record: NormalizedQuoteRecord | null;
  validation_status: RuntimeEvidenceValidationStatus;
  issues: readonly RuntimeEvidenceIssue[];
}

function schemaDescriptor(value: unknown, depth = 0): unknown {
  if (depth > 8) return "depth_limit";
  if (value === null) return "null";
  if (Array.isArray(value)) {
    const representative = value.find((item) => item !== null);
    return {
      type: "array",
      item: representative === undefined
        ? "empty"
        : schemaDescriptor(representative, depth + 1),
    };
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, schemaDescriptor(record[key], depth + 1)]),
    );
  }
  return typeof value;
}

export function createRuntimeSchemaHash(payload: unknown): string | null {
  if (payload === null || payload === undefined) return null;
  const descriptor = JSON.stringify(schemaDescriptor(payload));
  return `sha256:${createHash("sha256").update(descriptor).digest("hex")}`;
}

function latencyMs(requestTime: string, responseTime: string | null): number | null {
  if (!responseTime) return null;
  const start = Date.parse(requestTime);
  const end = Date.parse(responseTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return end - start;
}

/** Returns evidence for stdout only. It performs no file or database write. */
export function recordRuntimeEvidence(
  input: RuntimeEvidenceRecorderInput,
): RuntimeEvidence {
  return {
    source_name: input.source_name,
    symbol: input.symbol,
    request_time: input.transport.requestedAt,
    response_time: input.transport.completedAt,
    latency_ms: latencyMs(
      input.transport.requestedAt,
      input.transport.completedAt,
    ),
    http_status: input.transport.httpStatus,
    schema_hash: createRuntimeSchemaHash(input.raw_payload),
    record_date: input.record?.record_date ?? "",
    record_time: input.record?.record_time ?? "",
    validation_status: input.validation_status,
    issues: input.issues.map((issue) => ({ ...issue })),
  };
}
