/**
 * Portfolio Staging RLS Validation Checker — V13
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - connect to Supabase
 *   - read environment keys
 *   - make any HTTP request
 *   - read or write real Portfolio data
 *   - switch /api/portfolio
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

// export {} isolates this file as a TypeScript module, preventing global const
// collisions with other script files that also use the CJS require() pattern.
export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface StagingRlsSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_switch_performed: false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolve(...parts: string[]): string {
  return path.resolve(process.cwd(), ...parts);
}

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function combineStatus(statuses: CheckStatus[]): CheckStatus {
  if (statuses.some((s) => s === "FAIL")) return "FAIL";
  if (statuses.some((s) => s === "WARNING")) return "WARNING";
  return "PASS";
}

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

const REQUIRED_FILES: Array<{ label: string; rel: string }> = [
  { label: "RLS migration draft", rel: "supabase/v85_portfolio_rls.sql" },
  {
    label: "Staging RLS validation doc (new)",
    rel: "docs/portfolio-staging-rls-validation.md",
  },
  {
    label: "Portfolio production readiness",
    rel: "docs/portfolio-production-readiness.md",
  },
  {
    label: "RLS validation checklist",
    rel: "docs/rls-validation-checklist.md",
  },
  {
    label: "Portfolio staging shadow",
    rel: "docs/portfolio-staging-shadow.md",
  },
  {
    label: "Portfolio switch strategy",
    rel: "docs/portfolio-switch-strategy.md",
  },
];

function checkRequiredFiles(): CheckResult {
  const missing: string[] = [];
  for (const { label, rel } of REQUIRED_FILES) {
    if (!fileExists(resolve(rel))) {
      missing.push(`FAIL  Missing: ${rel} (${label})`);
    }
  }
  if (missing.length > 0) {
    return { name: "required_files", status: "FAIL", details: missing };
  }
  return {
    name: "required_files",
    status: "PASS",
    details: [`PASS  All ${REQUIRED_FILES.length} required files present.`],
  };
}

// ---------------------------------------------------------------------------
// Gate 2: RLS SQL safety shape
// ---------------------------------------------------------------------------

function checkRlsSqlSafety(): CheckResult {
  const filePath = resolve("supabase/v85_portfolio_rls.sql");
  const sql = readFile(filePath);
  if (!sql) {
    return {
      name: "rls_sql_safety",
      status: "FAIL",
      details: ["FAIL  Cannot read supabase/v85_portfolio_rls.sql."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  // Must contain: enable row level security
  if (/enable\s+row\s+level\s+security/i.test(sql)) {
    details.push("PASS  enable row level security: present.");
  } else {
    issues.push("FAIL  enable row level security: NOT found.");
  }

  // Must contain: auth.uid() or owner_id
  const hasAuthUid = /\bauth\.uid\(\)/i.test(sql);
  const hasOwnerId = /\bowner_id\b/i.test(sql);
  if (hasAuthUid && hasOwnerId) {
    details.push("PASS  auth.uid() and owner_id both present.");
  } else if (hasAuthUid || hasOwnerId) {
    details.push(
      `WARNING  Partial owner scope: auth.uid()=${String(hasAuthUid)}, owner_id=${String(hasOwnerId)}.`,
    );
  } else {
    issues.push(
      "FAIL  Neither auth.uid() nor owner_id found — owner scope missing.",
    );
  }

  // Must contain: is_active (referenced in index or policy)
  if (/\bis_active\b/i.test(sql)) {
    details.push("PASS  is_active referenced.");
  } else {
    issues.push("FAIL  is_active not referenced in RLS SQL.");
  }

  // Must contain: revoke or explicit grants control
  if (/\brevoke\b/i.test(sql)) {
    details.push("PASS  revoke statement present (grants control confirmed).");
  } else {
    issues.push(
      "FAIL  No revoke statement found — grants control may be missing.",
    );
  }

  // Must contain: update policy
  if (/create\s+policy\b[^;]+\bfor\s+update\b/i.test(sql)) {
    details.push("PASS  update policy present.");
  } else {
    issues.push("FAIL  No update policy (FOR UPDATE) found.");
  }

  // Must NOT contain: using (true)
  if (/\busing\s*\(\s*true\s*\)/i.test(sql)) {
    issues.push("FAIL  using (true) found — overly permissive policy detected.");
  } else {
    details.push("PASS  using (true): not present.");
  }

  // Must NOT contain: to anon (in a create policy context)
  if (/create\s+policy\b[^;]+\bto\s+anon\b/i.test(sql)) {
    issues.push("FAIL  Anon allow policy detected (create policy ... to anon).");
  } else {
    details.push("PASS  No anon allow policy found.");
  }

  // Must NOT contain: delete policy allowing hard delete
  if (/create\s+policy\b[^;]+\bfor\s+delete\b/i.test(sql)) {
    issues.push(
      "FAIL  Hard delete policy (FOR DELETE) found — must use soft delete only.",
    );
  } else {
    details.push("PASS  No hard delete policy (FOR DELETE) found.");
  }

  // Must NOT contain: production seed insert
  if (/insert\s+into\s+portfolio_stocks\b/i.test(sql)) {
    issues.push(
      "FAIL  Production seed INSERT INTO portfolio_stocks detected in RLS SQL.",
    );
  } else {
    details.push("PASS  No production seed INSERT found in RLS SQL.");
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "rls_sql_safety", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 3: New doc completeness
// ---------------------------------------------------------------------------

const NEW_DOC_REQUIRED_TERMS: Array<{ term: RegExp; label: string }> = [
  { term: /isolated\s+staging\s+project/i, label: "isolated staging project" },
  { term: /anon\s+deny|anon.*\bdeny\b|\bdeny\b.*anon/i, label: "anon deny" },
  { term: /\bowner\s+[ab]\b/i, label: "Owner A / Owner B" },
  { term: /\bservice\s+role\b/i, label: "service role" },
  { term: /hard\s+delete\s+deny|hard\s+delete.*\bdeny\b|\bdeny\b.*hard\s+delete/i, label: "hard delete deny" },
  { term: /\bsoft\s+delete\b/i, label: "soft delete" },
  { term: /inactive\s+rows?\s+leakage|leakage.*inactive/i, label: "inactive rows leakage" },
  { term: /\brollback\b/i, label: "rollback" },
  { term: /V14\s+promotion|promotion\s+gate/i, label: "V14 promotion gate" },
  {
    term: /production.*write|not.*production.*data|no.*production.*seed|不.*production|production.*不|production project/i,
    label: "no production write",
  },
  {
    term: /not.*switch.*api|no.*api.*switch|api.*not.*switch|不切換.*api|api.*不切/i,
    label: "no API switch",
  },
];

function checkNewDocCompleteness(): CheckResult {
  const filePath = resolve("docs/portfolio-staging-rls-validation.md");
  const doc = readFile(filePath);
  if (!doc) {
    return {
      name: "new_doc_completeness",
      status: "FAIL",
      details: ["FAIL  Cannot read docs/portfolio-staging-rls-validation.md."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  for (const { term, label } of NEW_DOC_REQUIRED_TERMS) {
    if (term.test(doc)) {
      details.push(`PASS  "${label}" present in staging RLS validation doc.`);
    } else {
      issues.push(`FAIL  "${label}" not found in docs/portfolio-staging-rls-validation.md.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return {
    name: "new_doc_completeness",
    status,
    details: [...details, ...issues],
  };
}

// ---------------------------------------------------------------------------
// Gate 4: Existing readiness alignment
// ---------------------------------------------------------------------------

const READINESS_GATES: Array<{ term: RegExp; label: string }> = [
  { term: /schema\s+gate/i, label: "Schema gate" },
  { term: /seed\s+gate/i, label: "Seed gate" },
  { term: /rls\s*[/\/]?\s*grants?\s+gate/i, label: "RLS / Grants gate" },
  { term: /shadow\s+parity\s+gate/i, label: "Shadow parity gate" },
  { term: /api\s+switch\s+gate/i, label: "API switch gate" },
  { term: /rollback\s+gate/i, label: "Rollback gate" },
];

function checkReadinessAlignment(): CheckResult {
  const filePath = resolve("docs/portfolio-production-readiness.md");
  const doc = readFile(filePath);
  if (!doc) {
    return {
      name: "readiness_alignment",
      status: "FAIL",
      details: [
        "FAIL  Cannot read docs/portfolio-production-readiness.md.",
      ],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  for (const { term, label } of READINESS_GATES) {
    if (term.test(doc)) {
      details.push(
        `PASS  "${label}" present in portfolio-production-readiness.md.`,
      );
    } else {
      issues.push(
        `FAIL  "${label}" not found in docs/portfolio-production-readiness.md.`,
      );
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return {
    name: "readiness_alignment",
    status,
    details: [...details, ...issues],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fileCheck = checkRequiredFiles();
const rlsCheck = checkRlsSqlSafety();
const docCheck = checkNewDocCompleteness();
const alignCheck = checkReadinessAlignment();

const allChecks: CheckResult[] = [fileCheck, rlsCheck, docCheck, alignCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: StagingRlsSummary = {
  status: overallStatus,
  checked_files: REQUIRED_FILES.map((f) => f.rel),
  gates: {
    required_files: fileCheck.status,
    rls_sql_safety: rlsCheck.status,
    new_doc_completeness: docCheck.status,
    readiness_alignment: alignCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_switch_performed: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
