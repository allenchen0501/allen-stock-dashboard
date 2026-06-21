import type { ConnectorSourceName } from "../types";

export type SchemaDriftMismatchPolicy = "WARNING" | "FAIL";
export type SchemaDriftStatus = "PASS" | "WARNING" | "FAIL";

export interface ApprovedSchemaBaseline {
  source_name: ConnectorSourceName;
  schema_hash: string;
  baseline_version: string;
  approved_at: string;
  approved_aliases: Readonly<Record<string, readonly string[]>>;
}

export interface SchemaDriftIssue {
  code:
    | "MISSING_CURRENT_HASH"
    | "MISSING_BASELINE"
    | "INVALID_SCHEMA_HASH"
    | "SOURCE_MISMATCH"
    | "SCHEMA_HASH_MISMATCH";
  severity: "WARNING" | "FAIL";
  message: string;
}

export interface SchemaDriftCheckInput {
  source_name: ConnectorSourceName;
  current_schema_hash: string | null;
  approved_baseline: ApprovedSchemaBaseline | null;
  mismatch_policy?: SchemaDriftMismatchPolicy;
}

export interface SchemaDriftCheckResult {
  source_name: ConnectorSourceName;
  current_schema_hash: string | null;
  approved_schema_hash: string | null;
  baseline_version: string | null;
  status: SchemaDriftStatus;
  matches: boolean;
  auto_fix_applied: false;
  issues: SchemaDriftIssue[];
}

const SCHEMA_HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;

/** Pure comparison only. A mismatch never changes aliases or payload parsing. */
export function checkSchemaDrift(
  input: SchemaDriftCheckInput,
): SchemaDriftCheckResult {
  const issues: SchemaDriftIssue[] = [];
  const baseline = input.approved_baseline;
  const mismatchPolicy = input.mismatch_policy ?? "FAIL";

  if (!input.current_schema_hash) {
    issues.push({
      code: "MISSING_CURRENT_HASH",
      severity: "FAIL",
      message: "Current runtime evidence has no schema hash.",
    });
  } else if (!SCHEMA_HASH_PATTERN.test(input.current_schema_hash)) {
    issues.push({
      code: "INVALID_SCHEMA_HASH",
      severity: "FAIL",
      message: "Current schema hash is not a valid SHA-256 evidence hash.",
    });
  }

  if (!baseline) {
    issues.push({
      code: "MISSING_BASELINE",
      severity: "FAIL",
      message: "No human-approved schema baseline exists for this source.",
    });
  } else {
    if (!SCHEMA_HASH_PATTERN.test(baseline.schema_hash)) {
      issues.push({
        code: "INVALID_SCHEMA_HASH",
        severity: "FAIL",
        message: "Approved baseline schema hash is invalid.",
      });
    }
    if (baseline.source_name !== input.source_name) {
      issues.push({
        code: "SOURCE_MISMATCH",
        severity: "FAIL",
        message: "Approved baseline belongs to a different source.",
      });
    }
  }

  const hashesAreComparable =
    input.current_schema_hash !== null &&
    SCHEMA_HASH_PATTERN.test(input.current_schema_hash) &&
    baseline !== null &&
    SCHEMA_HASH_PATTERN.test(baseline.schema_hash) &&
    baseline.source_name === input.source_name;
  const matches =
    hashesAreComparable && input.current_schema_hash === baseline.schema_hash;

  if (hashesAreComparable && !matches) {
    issues.push({
      code: "SCHEMA_HASH_MISMATCH",
      severity: mismatchPolicy,
      message:
        "Current schema differs from the approved baseline; manual review is required.",
    });
  }

  const status: SchemaDriftStatus = issues.some(
    (issue) => issue.severity === "FAIL",
  )
    ? "FAIL"
    : issues.some((issue) => issue.severity === "WARNING")
      ? "WARNING"
      : matches
        ? "PASS"
        : "FAIL";

  return {
    source_name: input.source_name,
    current_schema_hash: input.current_schema_hash,
    approved_schema_hash: baseline?.schema_hash ?? null,
    baseline_version: baseline?.baseline_version ?? null,
    status,
    matches,
    auto_fix_applied: false,
    issues,
  };
}
