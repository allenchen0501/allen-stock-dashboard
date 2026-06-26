/**
 * Shadow Runner Dry-run Production Route Deployment Smoke Evidence — V51.1
 *
 * Code-level deployment-readiness evidence for the V51 route
 * GET /api/portfolio/shadow-runner-dry-run.
 *
 * IMPORTANT: this validator does NOT and CANNOT reach the live production URL or
 * the Vercel dashboard/API. It only proves, from the repository, that:
 *   1. the V51 route file exists and is wired to the V50 builder, and
 *   2. the deterministic responsePayload the route serves is safe (HTTP-200 body).
 * The actual production HTTP check (https://allen-stock-dashboard.vercel.app/...)
 * is a MANUAL step — `productionEndpointCheckedByValidator` is reported false.
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

const builderModule = require("../use-cases/deployment/build-shadow-runner-dry-run-api-contract") as typeof import("../use-cases/deployment/build-shadow-runner-dry-run-api-contract");
const { buildShadowRunnerDryRunApiContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface SmokeEvidenceSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  route_file_present: boolean;
  route_wired_to_v50_builder: boolean;
  local_build_route_registered_note: string;
  expected_production_http_status: 200;
  production_endpoint_checked_by_validator: false;
  redeploy_required: boolean;
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
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

const ROUTE_REL = "app/api/portfolio/shadow-runner-dry-run/route.ts";
const DOC_REL = "docs/shadow-runner-dry-run-production-smoke-evidence.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "V51 route", rel: ROUTE_REL },
    { label: "V51.1 evidence doc (new)", rel: DOC_REL },
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
  "V51.1",
  "Production Route Deployment Smoke Evidence",
  "GET /api/portfolio/shadow-runner-dry-run",
  "production endpoint currently returns 404",
  "Vercel production deployment still shows V50",
  "code is deployment-ready",
  "redeploy main",
  "productionEndpointCheckedByValidator",
  "do not proceed to V52",
  "responseSource must remain mock_or_contract",
  "sourceMode must remain fixture",
  "no Supabase connection",
  "no env key",
];

// ---------------------------------------------------------------------------
// Gate 3: Route wiring
// ---------------------------------------------------------------------------

const ROUTE_TERMS: string[] = [
  "NextResponse",
  "buildShadowRunnerDryRunApiContract",
  "export async function GET",
  "responsePayload",
  '"2026-06-23T00:00:00.000Z"',
  "/api/portfolio/shadow-runner-dry-run",
];

// ---------------------------------------------------------------------------
// Gate 4: Payload (expected production-200 body)
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const rp = buildShadowRunnerDryRunApiContract({ generatedAt: FIXED_TS }).responsePayload;
  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("ok", rp.ok, true);
  expectEq("responseSource", rp.responseSource, "mock_or_contract");
  expectEq("sourceMode", rp.sourceMode, "fixture");
  expectEq("plannedEndpoint", rp.plannedEndpoint, "/api/portfolio/shadow-runner-dry-run");
  expectEq("method", rp.method, "GET");

  const sf = rp.safetyFlags;
  expectEq("safetyFlags.supabaseConnected", sf.supabaseConnected, false);
  expectEq("safetyFlags.stagingSupabaseConnected", sf.stagingSupabaseConnected, false);
  expectEq("safetyFlags.productionSupabaseConnected", sf.productionSupabaseConnected, false);
  expectEq("safetyFlags.envReadPerformed", sf.envReadPerformed, false);
  expectEq("safetyFlags.databaseWritePerformed", sf.databaseWritePerformed, false);
  expectEq("safetyFlags.shadowRunnerExecuted", sf.shadowRunnerExecuted, false);
  expectEq("safetyFlags.shadowResultPersisted", sf.shadowResultPersisted, false);
  expectEq("safetyFlags.portfolioApiSwitched", sf.portfolioApiSwitched, false);
  expectEq("safetyFlags.realMarketDataEnabled", sf.realMarketDataEnabled, false);
  expectEq("safetyFlags.buySellCommandGenerated", sf.buySellCommandGenerated, false);
  expectEq("safetyFlags.autoOrderRequested", sf.autoOrderRequested, false);
  expectEq("safetyFlags.killSwitchDefaultEnabled", sf.killSwitchDefaultEnabled, true);

  return { name: "payload_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:shadow-runner-dry-run-production-smoke-evidence": "node --require ./scripts/register-typescript.cjs ./scripts/validate-shadow-runner-dry-run-production-smoke-evidence.ts"',
];

const README_TERMS: string[] = [
  "V51.1",
  "Production Route Deployment Smoke Evidence",
  "docs/shadow-runner-dry-run-production-smoke-evidence.md",
  "npm run test:shadow-runner-dry-run-production-smoke-evidence",
  "/api/portfolio/shadow-runner-dry-run",
  "redeploy main",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const routeBody = readFile(resolve(ROUTE_REL));
const docBody = readFile(resolve(DOC_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const routeTermCheck = checkTerms("route_wiring", routeBody, ROUTE_REL, ROUTE_TERMS);
const payloadCheck = checkPayload();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);

const allChecks: CheckResult[] = [fileCheck, phraseCheck, routeTermCheck, payloadCheck, pkgCheck, readmeCheck];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const routeWired = routeTermCheck.status === "PASS";

const summary: SmokeEvidenceSummary = {
  status: overallStatus,
  checked_files: [ROUTE_REL, DOC_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    route_wiring: routeTermCheck.status,
    payload_checks: payloadCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  route_file_present: fileExists(resolve(ROUTE_REL)),
  route_wired_to_v50_builder: routeWired,
  local_build_route_registered_note:
    "npm run build registers route as: ƒ /api/portfolio/shadow-runner-dry-run (verify in build output).",
  expected_production_http_status: 200,
  production_endpoint_checked_by_validator: false,
  redeploy_required: true,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
