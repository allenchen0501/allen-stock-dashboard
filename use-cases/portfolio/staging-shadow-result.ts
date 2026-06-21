import type { ShadowDifferenceCode } from "./types";

export type StagingShadowStatus = "PASS" | "WARNING" | "FAIL";
export type StagingParityStatus = StagingShadowStatus | "NOT_RUN";

export type StagingShadowIssueCode =
  | ShadowDifferenceCode
  | "MISSING_DATA"
  | "EMPTY_PORTFOLIO"
  | "RLS_BLOCKED"
  | "VALIDATION_FAILED"
  | "REPOSITORY_ERROR";

export interface StagingShadowIssue {
  code: StagingShadowIssueCode;
  severity: "WARNING" | "FAIL";
  message: string;
  symbol?: string;
}

/**
 * Metadata-only result. `source` and `fallback_used` guarantee that staging
 * rows never become the primary Portfolio response in V3-6.
 */
export interface StagingShadowResult {
  mode: "shadow";
  source: "hardcoded";
  status: StagingShadowStatus;
  issues: StagingShadowIssue[];
  parity_status: StagingParityStatus;
  fallback_used: true;
  decision_allowed: boolean;
  data_warning: string | null;
}
