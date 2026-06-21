import type { WarRoomInput } from "../../war-room/input";

export type EtlQuarantineReason =
  | "REFERENCE_INPUT"
  | "REJECTED_INPUT"
  | "INVALID_PRIMARY_INPUT"
  | "DUPLICATE_PRIMARY_INPUT";

export interface EtlQuarantineIssue {
  code: string;
  severity: "WARNING" | "FAIL";
  message: string;
}

export interface EtlQuarantinePayload {
  symbol: string;
  validation_status: WarRoomInput["validation_status"];
  eligibility: WarRoomInput["eligibility"];
  reason: EtlQuarantineReason;
  data_warning: boolean;
  source_name: string;
  record_date: string;
  issues: EtlQuarantineIssue[];
  quarantined_at: string;
}

export function createEtlQuarantinePayload(
  input: WarRoomInput,
  reason: EtlQuarantineReason,
  quarantinedAt: string,
  additionalIssues: readonly EtlQuarantineIssue[] = [],
): EtlQuarantinePayload {
  return {
    symbol: input.symbol,
    validation_status: input.validation_status,
    eligibility: input.eligibility,
    reason,
    data_warning: true,
    source_name: input.source_name,
    record_date: input.record_date,
    issues: [
      ...input.issues.map((issue) => ({
        code: issue.code,
        severity: issue.severity,
        message: issue.message,
      })),
      ...additionalIssues.map((issue) => ({ ...issue })),
    ],
    quarantined_at: quarantinedAt,
  };
}
