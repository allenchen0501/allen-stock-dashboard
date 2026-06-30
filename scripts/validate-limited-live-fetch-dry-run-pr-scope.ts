/**
 * Limited Live Fetch Dry-run PR Scope Validator — scope-only, no network code
 *
 * Static check. Confirms the scope doc + package script exist and that the runtime /
 * scaffold files still contain NO fetch / axios / process.env / Supabase / API route /
 * /api/portfolio switch / PRODUCTION_READY (i.e., this PR added no network code). It
 * does NOT start a server, make any HTTP request, connect to Supabase, read env keys,
 * build a runtime, or write data.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

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

interface ScopeSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_route_created: false;
  ui_created: false;
  runtime_created: false;
  sql_migration_created: false;
  real_data_connected: false;
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

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function combineStatus(statuses: CheckStatus[]): CheckStatus {
  if (statuses.some((s) => s === "FAIL")) return "FAIL";
  if (statuses.some((s) => s === "WARNING")) return "WARNING";
  return "PASS";
}

function checkTerms(name: string, body: string | null, fileLabel: string, terms: string[]): CheckResult {
  if (body == null) return { name, status: "FAIL", details: [`FAIL  Cannot read ${fileLabel}.`] };
  const details: string[] = [];
  const issues: string[] = [];
  for (const term of terms) {
    if (body.includes(term)) details.push(`PASS  "${term}" present in ${fileLabel}.`);
    else issues.push(`FAIL  "${term}" not found in ${fileLabel}.`);
  }
  return { name, status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/limited-live-fetch-dry-run-pr-scope.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

// Runtime / scaffold files that must NOT contain any network code in this PR.
const RUNTIME_FILES = [
  "services/market-data/public-quote-provider.types.ts",
  "services/market-data/yahoo-readonly-provider.ts",
  "services/market-data/twse-tpex-verification-provider.ts",
  "use-cases/war-room/build-shadow-runtime-comparison.ts",
];

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Scope doc (new)", rel: DOC_REL },
    { label: "README", rel: README_REL },
    { label: "package.json", rel: PKG_REL },
  ];
  const details: string[] = [];
  const issues: string[] = [];
  for (const { label, rel } of required) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} present (${label}).`);
    else issues.push(`FAIL  Missing: ${rel} (${label})`);
  }
  return { name: "required_files", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 2: Required document phrases
// ---------------------------------------------------------------------------

const DOC_REQUIRED: string[] = [
  "Limited Live Fetch Dry-run PR Scope",
  "TWSE",
  "TPEx",
  "Yahoo remains future candidate",
  "broker API permanently forbidden",
  "no runtime execution",
  "no network code in this PR",
  "no env read",
  "no Supabase connection",
  "no /api/portfolio switch",
  "default remains fixture",
  "operationalUseAllowed=false",
  "buySellCommandGenerated=false",
  "autoOrderRequested=false",
  "productionReady=false",
  "timeout required",
  "rate limit required",
  "GET only",
  "no POST / PUT / PATCH / DELETE",
  "fallback to disabled scaffold candidate",
  "我同意進行 limited live fetch dry-run implementation",
];

// ---------------------------------------------------------------------------
// Gate 3: No network code added in runtime files (this PR)
// ---------------------------------------------------------------------------

// Note: scaffold files legitimately carry safety-flag names / labels such as
// `portfolioApiSwitchAllowed` and the label "no /api/portfolio switch", so the bare
// "/api/portfolio" string is NOT scanned here (its absence-as-switch is asserted by
// the scaffold contract flag portfolioApiSwitchAllowed=false). We scan only for the
// dangerous IMPORT / network forms.
const RUNTIME_FORBIDDEN = ["@supabase", "createclient", "process.env", "fetch(", "axios"];

function checkNoNetworkCode(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  for (const rel of RUNTIME_FILES) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const stripped = stripComments(body);
    const lower = stripped.toLowerCase();
    for (const token of RUNTIME_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  "${token}" present in ${rel} (no network code allowed in this PR).`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
    if (stripped.includes("PRODUCTION_READY")) issues.push(`FAIL  "PRODUCTION_READY" present in ${rel}.`);
    else details.push(`PASS  No "PRODUCTION_READY" in ${rel}.`);
  }

  // No new API route / SQL migration in this scope-only PR.
  const forbiddenArtifacts = [
    "app/api/market-data/route.ts",
    "app/api/portfolio/live-fetch/route.ts",
    "app/api/live-fetch/route.ts",
    "supabase/live_fetch.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in scope-only PR.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  return { name: "no_network_code", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 4: package.json + README
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:limited-live-fetch-dry-run-pr-scope": "node --require ./scripts/register-typescript.cjs ./scripts/validate-limited-live-fetch-dry-run-pr-scope.ts"',
];

const README_TERMS: string[] = [
  "Limited live fetch dry-run is scoped only; no network code has been added yet.",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const docCheck = checkTerms("doc_phrases", docBody, DOC_REL, DOC_REQUIRED);
const networkCheck = checkNoNetworkCode();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);

const allChecks: CheckResult[] = [fileCheck, docCheck, networkCheck, pkgCheck, readmeCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: ScopeSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, ...RUNTIME_FILES, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    doc_phrases: docCheck.status,
    no_network_code: networkCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_route_created: false,
  ui_created: false,
  runtime_created: false,
  sql_migration_created: false,
  real_data_connected: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
