/**
 * Shadow Runner Dry-run Monitoring UI Production Evidence Validator — V53
 *
 * Repo-local deterministic evidence check. It does NOT and MUST NOT fetch the
 * external production URL or the Vercel dashboard/API. It only confirms, from the
 * repository, that the evidence doc records the externally-confirmed production
 * facts, and that the V52 monitoring component + holdings-page integration +
 * V51 route are still present and safe.
 *
 * It does NOT start a Next.js server, make any HTTP request, connect to Supabase,
 * read env keys, build a runtime, or write data.
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

interface EvidenceSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_deployment_commit: string;
  production_endpoint_checked_by_validator: false;
  component_present_and_safe: boolean;
  mounted_in_holdings_page: boolean;
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_route_created: false;
  ui_created: false;
  runtime_created: false;
  sql_migration_created: false;
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

function checkTerms(
  name: string,
  body: string | null,
  fileLabel: string,
  terms: string[],
): CheckResult {
  if (body == null) {
    return { name, status: "FAIL", details: [`FAIL  Cannot read ${fileLabel}.`] };
  }
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

const DOC_REL = "docs/shadow-runner-dry-run-monitoring-ui-production-evidence.md";
const VALIDATOR_REL = "scripts/validate-shadow-runner-dry-run-monitoring-ui-production-evidence.ts";
const COMPONENT_REL = "components/shadow-runner-dry-run-monitoring.tsx";
const PAGE_REL = "app/holdings/page.tsx";
const ROUTE_REL = "app/api/portfolio/shadow-runner-dry-run/route.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const PRODUCTION_COMMIT = "740e16ba16cbd85ecb9cacc58d9d0c918e297560";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "V53 evidence doc (new)", rel: DOC_REL },
    { label: "V53 evidence validator (new)", rel: VALIDATOR_REL },
    { label: "V52 monitoring component", rel: COMPONENT_REL },
    { label: "Holdings page", rel: PAGE_REL },
    { label: "V51 route", rel: ROUTE_REL },
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
// Gate 2: Required evidence doc phrases
// ---------------------------------------------------------------------------

const REQUIRED_DOC_PHRASES: string[] = [
  "V53",
  "Shadow Runner Dry-run Monitoring UI Production Evidence",
  "production deployment commit",
  "740e16ba16cbd85ecb9cacc58d9d0c918e297560",
  "production deployment state = READY",
  "production /holdings status = 200 OK",
  "production /holdings matched path = /holdings",
  "Shadow Runner Dry-run Monitoring",
  "/api/portfolio/shadow-runner-dry-run",
  "fixture-only",
  "mock_or_contract",
  "dry-run evidence only",
  "no Supabase connection",
  "no env key",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no auto order",
  "V50 contract flags retained false",
  "V51.1 production smoke verified endpoint 200",
  "client component may show loading in server HTML before hydration",
  "hydration data is sourced only from internal endpoint",
  "V54",
];

// ---------------------------------------------------------------------------
// Gate 3: Component still present + required terms
// ---------------------------------------------------------------------------

const COMPONENT_TERMS: string[] = [
  '"use client"',
  "useEffect",
  "useState",
  'fetch("/api/portfolio/shadow-runner-dry-run")',
  "Shadow Runner Dry-run Monitoring",
  "responseSource",
  "sourceMode",
  "evidenceReport",
  "safetyFlags",
  "warnings",
  "nextRequiredActions",
  "V50 contract flags retained false",
];

// ---------------------------------------------------------------------------
// Gate 4: Component forbidden tokens + no external URL
// ---------------------------------------------------------------------------

const COMPONENT_FORBIDDEN: string[] = [
  "@supabase",
  "createclient",
  "process.env",
  "axios",
  "new date(",
  "date.now",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "yahoo",
  "twse",
  "goodinfo",
  "investing",
  "pchome",
  "scheduler",
  "webhook",
  "crawler",
];

const EXTERNAL_FETCH_TOKENS: string[] = [
  'fetch("https://',
  "fetch('https://",
  'fetch("http://',
  "fetch('http://",
];

function checkComponentForbidden(): CheckResult {
  const body = readFile(resolve(COMPONENT_REL));
  if (body == null) {
    return { name: "component_forbidden", status: "FAIL", details: [`FAIL  Cannot read ${COMPONENT_REL}.`] };
  }
  const lower = body.toLowerCase();
  const details: string[] = [];
  const issues: string[] = [];
  for (const token of COMPONENT_FORBIDDEN) {
    if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${COMPONENT_REL}.`);
    else details.push(`PASS  No "${token}" in ${COMPONENT_REL}.`);
  }
  for (const token of EXTERNAL_FETCH_TOKENS) {
    if (lower.includes(token.toLowerCase())) issues.push(`FAIL  External fetch "${token}" present in ${COMPONENT_REL}.`);
    else details.push(`PASS  No external fetch "${token}" in ${COMPONENT_REL}.`);
  }
  return { name: "component_forbidden", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: Holdings page integration
// ---------------------------------------------------------------------------

function checkPageIntegration(): { result: CheckResult; mounted: boolean } {
  const body = readFile(resolve(PAGE_REL));
  if (body == null) {
    return { result: { name: "page_integration", status: "FAIL", details: [`FAIL  Cannot read ${PAGE_REL}.`] }, mounted: false };
  }
  const details: string[] = [];
  const issues: string[] = [];
  if (body.includes("ShadowRunnerDryRunMonitoring")) details.push("PASS  ShadowRunnerDryRunMonitoring referenced.");
  else issues.push("FAIL  ShadowRunnerDryRunMonitoring not referenced in holdings page.");
  if (body.includes("components/shadow-runner-dry-run-monitoring")) details.push("PASS  holdings page imports component module.");
  else issues.push("FAIL  holdings page does not import components/shadow-runner-dry-run-monitoring.");
  if (body.includes("<ShadowRunnerDryRunMonitoring")) details.push("PASS  <ShadowRunnerDryRunMonitoring /> rendered.");
  else issues.push("FAIL  <ShadowRunnerDryRunMonitoring /> not rendered in holdings page.");
  const mounted = issues.length === 0;
  return { result: { name: "page_integration", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] }, mounted };
}

// ---------------------------------------------------------------------------
// Gate 6: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:shadow-runner-dry-run-monitoring-ui-production-evidence": "node --require ./scripts/register-typescript.cjs ./scripts/validate-shadow-runner-dry-run-monitoring-ui-production-evidence.ts"',
];

const README_TERMS: string[] = [
  "V53",
  "Shadow Runner Dry-run Monitoring UI Production Evidence",
  "docs/shadow-runner-dry-run-monitoring-ui-production-evidence.md",
  "npm run test:shadow-runner-dry-run-monitoring-ui-production-evidence",
  "740e16ba16cbd85ecb9cacc58d9d0c918e297560",
  "V54",
];

// ---------------------------------------------------------------------------
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const forbiddenArtifacts = [
    "supabase/shadow_runner_dry_run_monitoring_ui_production_evidence.sql",
    "app/api/portfolio/shadow-runner-dry-run-monitoring-evidence/route.ts",
    "components/shadow-runner-dry-run-monitoring-production-evidence.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V53.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
    "app/api/portfolio/first-authorized-source-dry-run/route.ts",
    "app/api/portfolio/shadow-runner-dry-run/route.ts",
    "components/runtime-pilot-monitoring.tsx",
    "components/first-authorized-source-dry-run-monitoring.tsx",
    "components/shadow-runner-dry-run-monitoring.tsx",
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must not be modified or deleted.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const componentBody = readFile(resolve(COMPONENT_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const componentTermCheck = checkTerms("component_terms", componentBody, COMPONENT_REL, COMPONENT_TERMS);
const componentForbiddenCheck = checkComponentForbidden();
const { result: pageCheck, mounted } = checkPageIntegration();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  componentTermCheck,
  componentForbiddenCheck,
  pageCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: EvidenceSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, VALIDATOR_REL, COMPONENT_REL, PAGE_REL, ROUTE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    component_terms: componentTermCheck.status,
    component_forbidden: componentForbiddenCheck.status,
    page_integration: pageCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_deployment_commit: PRODUCTION_COMMIT,
  production_endpoint_checked_by_validator: false,
  component_present_and_safe: componentTermCheck.status === "PASS" && componentForbiddenCheck.status === "PASS",
  mounted_in_holdings_page: mounted,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_route_created: false,
  ui_created: false,
  runtime_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
