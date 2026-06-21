import type { ConnectorSourceName } from "../types";

export type RuntimeEvidenceValidationStatus = "PASS" | "WARNING" | "FAIL";

export interface RuntimeEvidenceIssue {
  code: string;
  severity: "WARNING" | "FAIL";
  field?: string;
  message: string;
}

export interface RuntimeEvidence {
  source_name: ConnectorSourceName;
  symbol: string;
  request_time: string;
  response_time: string | null;
  latency_ms: number | null;
  http_status: number | null;
  schema_hash: string | null;
  record_date: string;
  record_time: string;
  validation_status: RuntimeEvidenceValidationStatus;
  issues: RuntimeEvidenceIssue[];
}
