/**
 * Portfolio Production Readiness Checker — V12
 *
 * Fixture-only, local file-system check. Does NOT:
 *   - connect to Supabase
 *   - read environment keys
 *   - make any HTTP request
 *   - read or write real Portfolio data
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

interface ReadinessSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
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
    label: "Seed example shape",
    rel: "supabase/seeds/portfolio_staging_seed.example.sql",
  },
  {
    label: "Portfolio switch strategy",
    rel: "docs/portfolio-switch-strategy.md",
  },
  {
    label: "Portfolio staging shadow",
    rel: "docs/portfolio-staging-shadow.md",
  },
  {
    label: "Portfolio seed validation",
    rel: "docs/portfolio-seed-validation.md",
  },
];

function checkRequiredFiles(): CheckResult {
  const missing: string[] = [];
  for (const { label, rel } of REQUIRED_FILES) {
    if (!fileExists(resolve(rel))) {
      missing.push(`Missing: ${rel} (${label})`);
    }
  }
  if (missing.length > 0) {
    return { name: "required_files", status: "FAIL", details: missing };
  }
  return {
    name: "required_files",
    status: "PASS",
    details: [`All ${REQUIRED_FILES.length} required files present.`],
  };
}

// ---------------------------------------------------------------------------
// Gate 2: RLS SQL shape
// ---------------------------------------------------------------------------

function checkRlsSql(): CheckResult {
  const filePath = resolve("supabase/v85_portfolio_rls.sql");
  const sql = readFile(filePath);
  if (!sql) {
    return {
      name: "rls_sql_shape",
      status: "FAIL",
      details: ["Cannot read supabase/v85_portfolio_rls.sql."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  // Must contain enable row level security
  if (/enable\s+row\s+level\s+security/i.test(sql)) {
    details.push("PASS  enable row level security: present.");
  } else {
    issues.push("FAIL  enable row level security: NOT found.");
  }

  // Must NOT contain using (true) — overly permissive policy
  if (/\busing\s*\(\s*true\s*\)/i.test(sql)) {
    issues.push("FAIL  using (true) found — overly permissive policy detected.");
  } else {
    details.push("PASS  using (true): not present.");
  }

  // Must NOT contain anon allow policy (create policy ... to anon)
  if (/create\s+policy\b[^;]+\bto\s+anon\b/i.test(sql)) {
    issues.push("FAIL  Anon allow policy detected (create policy ... to anon).");
  } else {
    details.push("PASS  No anon allow policy found.");
  }

  // Must have owner-scoped concept: owner_id or auth.uid()
  const hasOwnerId = /\bowner_id\b/i.test(sql);
  const hasAuthUid = /\bauth\.uid\(\)/i.test(sql);
  if (hasOwnerId && hasAuthUid) {
    details.push("PASS  owner_id and auth.uid() both present.");
  } else if (hasOwnerId || hasAuthUid) {
    details.push(
      `WARNING  Partial owner scope: owner_id=${String(hasOwnerId)}, auth.uid()=${String(hasAuthUid)}.`,
    );
  } else {
    issues.push(
      "FAIL  No owner_id or auth.uid() found — owner scope is missing.",
    );
  }

  // Must avoid hard delete policy: check that no delete policy is created
  // and that the file explicitly drops or prohibits the delete policy
  const hasDeletePolicy = /create\s+policy\b[^;]+\bfor\s+delete\b/i.test(sql);
  const dropsDeletePolicy =
    /drop\s+policy\s+if\s+exists\s+\w+_delete\b/i.test(sql);
  const deleteMentionedForbidden =
    /hard.?delete\b.*\bdenied\b|\bdenied\b.*\bhard.?delete\b|\bsoft\s+delete\b/i.test(
      sql,
    );

  if (hasDeletePolicy) {
    issues.push("FAIL  Hard delete policy (FOR DELETE) found — forbidden.");
  } else if (dropsDeletePolicy || deleteMentionedForbidden) {
    details.push(
      "PASS  Hard delete policy absent; drop/prohibition of delete policy confirmed.",
    );
  } else {
    details.push(
      "PASS  No hard delete policy found (FOR DELETE not present).",
    );
  }

  const status: CheckStatus =
    issues.length > 0 ? "FAIL" : "PASS";
  return {
    name: "rls_sql_shape",
    status,
    details: [...details, ...issues],
  };
}

// ---------------------------------------------------------------------------
// Gate 3: Seed example shape
// ---------------------------------------------------------------------------

function checkSeedExample(): CheckResult {
  const filePath = resolve(
    "supabase/seeds/portfolio_staging_seed.example.sql",
  );
  const sql = readFile(filePath);
  if (!sql) {
    return {
      name: "seed_example_shape",
      status: "FAIL",
      details: ["Cannot read portfolio_staging_seed.example.sql."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  // Must be staging/example/rollback guarded
  const isShapeOnly =
    /SHAPE.?ONLY|EXAMPLE|staging/i.test(sql) &&
    /\brollback\s*;/i.test(sql);
  if (isShapeOnly) {
    details.push("PASS  Shape-only example with rollback guard confirmed.");
  } else {
    issues.push(
      "FAIL  Not clearly marked as shape-only example or missing rollback;",
    );
  }

  // Must NOT contain real personal data / obvious real owner IDs (no INSERT VALUES with UUIDs)
  const hasInsertValues =
    /insert\s+into\s+portfolio_stocks\b/i.test(sql) ||
    /\bvalues\s*\(\s*'[0-9a-f]{8}-[0-9a-f]{4}-/i.test(sql);
  if (hasInsertValues) {
    issues.push(
      "FAIL  Real INSERT or UUID values found — seed example must remain empty.",
    );
  } else {
    details.push(
      "PASS  No INSERT INTO portfolio_stocks or real UUID values detected.",
    );
  }

  // Must contain is_active
  if (/\bis_active\b/i.test(sql)) {
    details.push("PASS  is_active column present.");
  } else {
    issues.push("FAIL  is_active column missing.");
  }

  // Must contain symbol and market_type shape
  const hasSymbol = /\bsymbol\b/i.test(sql);
  const hasMarketType = /\bmarket_type\b/i.test(sql);
  if (hasSymbol && hasMarketType) {
    details.push("PASS  symbol and market_type shape present.");
  } else {
    issues.push(
      `FAIL  symbol=${String(hasSymbol)}, market_type=${String(hasMarketType)} — one or both missing.`,
    );
  }

  // Must have rollback at end (safety net)
  if (/\brollback\s*;/i.test(sql)) {
    details.push("PASS  rollback; present.");
  } else {
    issues.push("FAIL  rollback; missing — example must be rollback guarded.");
  }

  const status: CheckStatus =
    issues.length > 0 ? "FAIL" : "PASS";
  return {
    name: "seed_example_shape",
    status,
    details: [...details, ...issues],
  };
}

// ---------------------------------------------------------------------------
// Gate 4: Portfolio switch docs
// ---------------------------------------------------------------------------

function checkSwitchDocs(): CheckResult {
  const filePath = resolve("docs/portfolio-switch-strategy.md");
  const doc = readFile(filePath);
  if (!doc) {
    return {
      name: "switch_docs",
      status: "FAIL",
      details: ["Cannot read docs/portfolio-switch-strategy.md."],
    };
  }

  const details: string[] = [];
  const issues: string[] = [];

  // Must mention hardcoded / shadow / supabase
  const hasHardcoded = /\bhardcoded\b/i.test(doc);
  const hasShadow = /\bshadow\b/i.test(doc);
  const hasSupabase = /\bsupabase\b/i.test(doc);
  if (hasHardcoded && hasShadow && hasSupabase) {
    details.push(
      "PASS  hardcoded / shadow / supabase modes all documented.",
    );
  } else {
    issues.push(
      `FAIL  Mode coverage: hardcoded=${String(hasHardcoded)}, shadow=${String(hasShadow)}, supabase=${String(hasSupabase)}.`,
    );
  }

  // Must mention fallback
  if (/\bfallback\b/i.test(doc)) {
    details.push("PASS  fallback documented.");
  } else {
    issues.push("FAIL  fallback not mentioned.");
  }

  // Must mention empty Supabase result not overriding hardcoded
  const hasEmptyProtection =
    /empty\b.*(?:hardcoded|fallback)|(?:hardcoded|fallback).*\bempty\b|empty.*Supabase|Supabase.*empty/i.test(
      doc,
    );
  if (hasEmptyProtection) {
    details.push(
      "PASS  Empty Supabase result / hardcoded protection documented.",
    );
  } else {
    issues.push(
      "FAIL  No explicit documentation that empty Supabase result must not override hardcoded.",
    );
  }

  // Must mention rollback
  if (/\brollback\b/i.test(doc)) {
    details.push("PASS  rollback documented.");
  } else {
    issues.push("FAIL  rollback not mentioned.");
  }

  const status: CheckStatus =
    issues.length > 0 ? "FAIL" : "PASS";
  return {
    name: "switch_docs",
    status,
    details: [...details, ...issues],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fileCheck = checkRequiredFiles();
const rlsCheck = checkRlsSql();
const seedCheck = checkSeedExample();
const docsCheck = checkSwitchDocs();

const allChecks: CheckResult[] = [fileCheck, rlsCheck, seedCheck, docsCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: ReadinessSummary = {
  status: overallStatus,
  checked_files: REQUIRED_FILES.map((f) => f.rel),
  gates: {
    required_files: fileCheck.status,
    rls_sql_shape: rlsCheck.status,
    seed_example_shape: seedCheck.status,
    switch_docs: docsCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
