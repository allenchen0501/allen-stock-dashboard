/**
 * GitHub Actions Safety Chain Workflow Validator — V74
 *
 * Static check of `.github/workflows/safety-chain.yml`: confirms the workflow runs
 * the V73 safety chain + build on push / PR to main with read-only permissions, and
 * that it contains NO secrets / Supabase / Vercel deploy / fetch / service role /
 * write permission / schedule / production switch. It does NOT start a server, make
 * any HTTP request, connect to Supabase, read env keys, build a runtime, or write
 * data.
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

interface WorkflowSummary {
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

const WORKFLOW_REL = ".github/workflows/safety-chain.yml";
const DOC_REL = "docs/github-actions-safety-chain.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Safety chain workflow (new)", rel: WORKFLOW_REL },
    { label: "Workflow doc (new)", rel: DOC_REL },
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
// Gate 2: Required workflow content
// ---------------------------------------------------------------------------

const WORKFLOW_REQUIRED_TERMS: string[] = [
  "name: Safety Chain",
  "push:",
  "pull_request:",
  "branches: [main]",
  "permissions:",
  "contents: read",
  "safety-chain:",
  "runs-on: ubuntu-latest",
  "actions/checkout",
  "actions/setup-node",
  "npm ci",
  "npm run test:safety-chain",
  "npm run build",
];

function checkWorkflowTriggers(body: string | null): CheckResult {
  if (body == null) return { name: "workflow_triggers", status: "FAIL", details: ["FAIL  Cannot read workflow."] };
  const details: string[] = [];
  const issues: string[] = [];
  // push main + pull_request main both present.
  const pushIdx = body.indexOf("push:");
  const prIdx = body.indexOf("pull_request:");
  const branchesCount = (body.match(/branches: \[main\]/g) ?? []).length;
  if (pushIdx >= 0) details.push("PASS  push trigger present.");
  else issues.push("FAIL  workflow must trigger on push.");
  if (prIdx >= 0) details.push("PASS  pull_request trigger present.");
  else issues.push("FAIL  workflow must trigger on pull_request.");
  if (branchesCount >= 2) details.push(`PASS  branches: [main] used for both triggers (${branchesCount}).`);
  else issues.push(`FAIL  branches: [main] must apply to both push and pull_request (found ${branchesCount}).`);
  return { name: "workflow_triggers", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 3: Forbidden workflow content
// ---------------------------------------------------------------------------

const WORKFLOW_FORBIDDEN: string[] = [
  "secrets.",
  "secrets:",
  "supabase",
  "vercel",
  "deploy",
  "curl",
  "wget",
  "fetch",
  "service_role",
  "write-all",
  "contents: write",
  "permissions: write",
  "workflow_dispatch",
  "schedule",
  "/api/portfolio",
  "production_ready",
  "createclient",
  "process.env",
];

function checkWorkflowForbidden(body: string | null): CheckResult {
  if (body == null) return { name: "workflow_forbidden", status: "FAIL", details: ["FAIL  Cannot read workflow."] };
  const details: string[] = [];
  const issues: string[] = [];
  const lower = body.toLowerCase();
  for (const token of WORKFLOW_FORBIDDEN) {
    if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in workflow.`);
    else details.push(`PASS  No "${token}" in workflow.`);
  }
  // PRODUCTION_READY (exact case) must not appear.
  if (body.includes("PRODUCTION_READY")) issues.push('FAIL  Forbidden "PRODUCTION_READY" present in workflow.');
  else details.push('PASS  No "PRODUCTION_READY" in workflow.');
  return { name: "workflow_forbidden", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 4: Doc phrases
// ---------------------------------------------------------------------------

const DOC_REQUIRED_PHRASES: string[] = [
  "V74",
  "GitHub Actions Safety Chain Workflow",
  "Safety Chain",
  "npm run test:safety-chain",
  "npm run build",
  "contents: read",
  "push main",
  "pull_request main",
  "no Supabase secrets",
  "no Vercel deploy",
  "no env read",
  "no DB write",
  "no fetch",
  "no real market data",
  "no API route",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
  "not PRODUCTION_READY",
  "CI guard only",
  "fixture/mock safe mode",
];

// ---------------------------------------------------------------------------
// Gate 5: package.json + README
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:github-actions-safety-chain": "node --require ./scripts/register-typescript.cjs ./scripts/validate-github-actions-safety-chain.ts"',
  '"test:safety-chain":',
];

const README_TERMS: string[] = [
  "V74",
  "GitHub Actions Safety Chain Workflow",
  ".github/workflows/safety-chain.yml",
  "docs/github-actions-safety-chain.md",
  "npm run test:github-actions-safety-chain",
];

// ---------------------------------------------------------------------------
// Gate 6: No forbidden deployment artifacts
// ---------------------------------------------------------------------------

function checkNoDeployArtifacts(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const forbidden = [
    ".github/workflows/deploy.yml",
    ".github/workflows/vercel.yml",
    ".github/workflows/production.yml",
  ];
  for (const rel of forbidden) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Deployment workflow ${rel} must not exist in V74.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }
  return { name: "no_deploy_artifacts", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const workflowBody = readFile(resolve(WORKFLOW_REL));
const docBody = readFile(resolve(DOC_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const workflowContentCheck = checkTerms("workflow_content", workflowBody, WORKFLOW_REL, WORKFLOW_REQUIRED_TERMS);
const triggersCheck = checkWorkflowTriggers(workflowBody);
const forbiddenCheck = checkWorkflowForbidden(workflowBody);
const docCheck = checkTerms("doc_phrases", docBody, DOC_REL, DOC_REQUIRED_PHRASES);
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const deployCheck = checkNoDeployArtifacts();

const allChecks: CheckResult[] = [
  fileCheck,
  workflowContentCheck,
  triggersCheck,
  forbiddenCheck,
  docCheck,
  pkgCheck,
  readmeCheck,
  deployCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: WorkflowSummary = {
  status: overallStatus,
  checked_files: [WORKFLOW_REL, DOC_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    workflow_content: workflowContentCheck.status,
    workflow_triggers: triggersCheck.status,
    workflow_forbidden: forbiddenCheck.status,
    doc_phrases: docCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    no_deploy_artifacts: deployCheck.status,
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
