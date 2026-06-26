/**
 * Shadow Runner Dry-run Monitoring UI Validator — V52
 *
 * Static file check for the client monitoring component
 * components/shadow-runner-dry-run-monitoring.tsx, its doc, the holdings-page
 * integration, README and package.json. It does NOT start a Next.js server, make
 * any HTTP request, connect to Supabase, read env keys, build a runtime, or write
 * data.
 *
 * The component may TYPE-import ShadowRunnerDryRunApiResponsePayload from the V50
 * contract module, but must never import the route, the builder function, a
 * Supabase client, or the Yahoo provider; and may only fetch the internal
 * /api/portfolio/shadow-runner-dry-run endpoint (no external URL).
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

interface MonitoringUiSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  component_fetches_internal_only: boolean;
  mounted_in_holdings_page: boolean;
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_route_created: false;
  ui_created: true;
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
    if (body.includes(term)) {
      details.push(`PASS  "${term}" present in ${fileLabel}.`);
    } else {
      issues.push(`FAIL  "${term}" not found in ${fileLabel}.`);
    }
  }
  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name, status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const COMPONENT_REL = "components/shadow-runner-dry-run-monitoring.tsx";
const DOC_REL = "docs/shadow-runner-dry-run-monitoring-ui.md";
const VALIDATOR_REL = "scripts/validate-shadow-runner-dry-run-monitoring-ui.ts";
const PAGE_REL = "app/holdings/page.tsx";
const ROUTE_REL = "app/api/portfolio/shadow-runner-dry-run/route.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Monitoring component (new)", rel: COMPONENT_REL },
    { label: "Monitoring UI doc (new)", rel: DOC_REL },
    { label: "Monitoring UI validator (new)", rel: VALIDATOR_REL },
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
// Gate 2: Required document phrases
// ---------------------------------------------------------------------------

const REQUIRED_DOC_PHRASES: string[] = [
  "V52",
  "Shadow Runner Dry-run Monitoring UI",
  "internal endpoint /api/portfolio/shadow-runner-dry-run",
  "fixture-only",
  "mock_or_contract",
  "no Supabase connection",
  "no env key",
  "no DB write",
  "no real market data",
  "no /api/portfolio switch",
  "no auto order",
  "dry-run evidence only",
  "V50 contract flags remain false",
  "V51.1 production smoke verified endpoint 200",
  "V53",
];

// ---------------------------------------------------------------------------
// Gate 3: Component required terms
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
// Gate 4: Component forbidden tokens (case-insensitive) + no external URL
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
  // Must only fetch the internal endpoint.
  if (lower.includes("fetch(")) {
    if (lower.includes("/api/portfolio/shadow-runner-dry-run")) {
      details.push("PASS  Component fetch targets internal /api/portfolio/shadow-runner-dry-run.");
    } else {
      issues.push("FAIL  Component fetch does not target internal /api/portfolio/shadow-runner-dry-run.");
    }
  } else {
    issues.push("FAIL  Component does not contain a fetch( call.");
  }
  // Must not import the route file or the builder function.
  if (lower.includes("app/api")) issues.push("FAIL  Component must not import an API route (app/api).");
  else details.push("PASS  Component does not import an API route.");
  if (lower.includes("buildshadowrunnerdryrunapicontract")) {
    issues.push("FAIL  Component must not import the builder function.");
  } else {
    details.push("PASS  Component does not import the builder function.");
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
  '"test:shadow-runner-dry-run-monitoring-ui": "node --require ./scripts/register-typescript.cjs ./scripts/validate-shadow-runner-dry-run-monitoring-ui.ts"',
];

const README_TERMS: string[] = [
  "V52",
  "Shadow Runner Dry-run Monitoring UI",
  "components/shadow-runner-dry-run-monitoring.tsx",
  "docs/shadow-runner-dry-run-monitoring-ui.md",
  "npm run test:shadow-runner-dry-run-monitoring-ui",
  "/api/portfolio/shadow-runner-dry-run",
  "fixture-only",
  "mock_or_contract",
  "V50 contract flags remain false",
  "V53",
];

// ---------------------------------------------------------------------------
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const forbiddenArtifacts = [
    "supabase/shadow_runner_dry_run_monitoring_ui.sql",
    "app/api/portfolio/shadow-runner-dry-run-monitoring/route.ts",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V52.`);
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

const componentBody = readFile(resolve(COMPONENT_REL));
const docBody = readFile(resolve(DOC_REL));
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

const componentFetchesInternalOnly =
  componentForbiddenCheck.status === "PASS";

const summary: MonitoringUiSummary = {
  status: overallStatus,
  checked_files: [COMPONENT_REL, DOC_REL, VALIDATOR_REL, PAGE_REL, ROUTE_REL, README_REL, PKG_REL],
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
  component_fetches_internal_only: componentFetchesInternalOnly,
  mounted_in_holdings_page: mounted,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_route_created: false,
  ui_created: true,
  runtime_created: false,
  sql_migration_created: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
