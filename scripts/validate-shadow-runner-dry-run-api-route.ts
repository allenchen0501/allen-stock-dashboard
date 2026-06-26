/**
 * Shadow Runner Dry-run API Route Validator — V51
 *
 * Static file + contract check for the fixture-only API route
 * GET /api/portfolio/shadow-runner-dry-run. It imports the V50 pure builder to
 * confirm the response payload is still safe; it does NOT start a Next.js server,
 * make any HTTP request, connect to Supabase, read env keys, build a runtime, or
 * write data.
 *
 * Forbidden-token scanning on the route file is case-insensitive and also blocks
 * buy / sell / order / yahoo (the route file must not contain those words, even
 * though the docs may say "no buy/sell command").
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

interface RouteSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_route_created: true;
  ui_created: false;
  runtime_created: false;
  sql_migration_created: false;
  deploy_performed: false;
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
const DOC_REL = "docs/shadow-runner-dry-run-api-route.md";
const VALIDATOR_REL = "scripts/validate-shadow-runner-dry-run-api-route.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "API route (new)", rel: ROUTE_REL },
    { label: "API route doc (new)", rel: DOC_REL },
    { label: "API route validator (new)", rel: VALIDATOR_REL },
    { label: "README", rel: README_REL },
    { label: "package.json", rel: PKG_REL },
  ];

  const details: string[] = [];
  const issues: string[] = [];

  for (const { label, rel } of required) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} present (${label}).`);
    } else {
      issues.push(`FAIL  Missing: ${rel} (${label})`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "required_files", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 2: Required document phrases
// ---------------------------------------------------------------------------

const REQUIRED_DOC_PHRASES: string[] = [
  "V51",
  "Shadow Runner Dry-run API Route",
  "GET /api/portfolio/shadow-runner-dry-run",
  "fixture-only",
  "mock_or_contract",
  "no Supabase connection",
  "no env key",
  "no write",
  "no staging write",
  "no production write",
  "no SQL migration",
  "no api switch",
  "no buy/sell command",
  "no auto order",
  "responseSource must remain mock_or_contract",
  "sourceMode must remain fixture",
  "PORTFOLIO_SOURCE_MODE",
  "hardcoded",
  "dry-run evidence must not be persisted to DB",
  "dry-run mismatch must not promote staging",
  "empty / stale / error result must not override hardcoded",
  "V50 contract flags remain false",
  "V52",
];

// ---------------------------------------------------------------------------
// Gate 3: Route file required terms
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
// Gate 4: Route file forbidden tokens (case-insensitive, raw)
// ---------------------------------------------------------------------------

const ROUTE_FORBIDDEN_TOKENS = [
  "@supabase",
  "createclient",
  "process.env",
  "fetch(",
  "axios",
  "date.now",
  "new date(",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "yahoo",
  "buy",
  "sell",
  "order",
];

function checkRouteForbidden(): CheckResult {
  const body = readFile(resolve(ROUTE_REL));
  if (body == null) {
    return { name: "route_forbidden", status: "FAIL", details: [`FAIL  Cannot read ${ROUTE_REL}.`] };
  }
  const lower = body.toLowerCase();
  const details: string[] = [];
  const issues: string[] = [];
  for (const token of ROUTE_FORBIDDEN_TOKENS) {
    if (lower.includes(token)) {
      issues.push(`FAIL  Forbidden "${token}" present in ${ROUTE_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${ROUTE_REL}.`);
    }
  }
  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "route_forbidden", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: Builder payload import test
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildShadowRunnerDryRunApiContract({ generatedAt: FIXED_TS });
  const rp = p.responsePayload;

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("responsePayload.responseSource", rp.responseSource, "mock_or_contract");
  expectEq("responsePayload.sourceMode", rp.sourceMode, "fixture");
  expectEq("responsePayload.plannedEndpoint", rp.plannedEndpoint, "/api/portfolio/shadow-runner-dry-run");
  expectEq("responsePayload.method", rp.method, "GET");

  const sf = rp.safetyFlags;
  expectEq("safetyFlags.promotionAllowed", sf.promotionAllowed, false);
  expectEq("safetyFlags.portfolioApiSwitchAllowed", sf.portfolioApiSwitchAllowed, false);
  expectEq("safetyFlags.persisted", sf.persisted, false);
  expectEq("safetyFlags.supabaseConnected", sf.supabaseConnected, false);
  expectEq("safetyFlags.stagingSupabaseConnected", sf.stagingSupabaseConnected, false);
  expectEq("safetyFlags.productionSupabaseConnected", sf.productionSupabaseConnected, false);
  expectEq("safetyFlags.envReadPerformed", sf.envReadPerformed, false);
  expectEq("safetyFlags.databaseWritePerformed", sf.databaseWritePerformed, false);
  expectEq("safetyFlags.shadowRunnerExecuted", sf.shadowRunnerExecuted, false);
  expectEq("safetyFlags.shadowResultPersisted", sf.shadowResultPersisted, false);
  expectEq("safetyFlags.realMarketDataEnabled", sf.realMarketDataEnabled, false);
  expectEq("safetyFlags.buySellCommandGenerated", sf.buySellCommandGenerated, false);
  expectEq("safetyFlags.autoOrderRequested", sf.autoOrderRequested, false);
  expectEq("safetyFlags.killSwitchDefaultEnabled", sf.killSwitchDefaultEnabled, true);

  // Top-level V50 contract flags remain false even though the V51 route exists.
  expectEq("routeCreated (contract flag remains false)", p.routeCreated, false);
  expectEq("apiRouteCreated (contract flag remains false)", p.apiRouteCreated, false);
  expectEq("routeImplemented (contract flag remains false)", p.routeImplemented, false);

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:shadow-runner-dry-run-api-route": "node --require ./scripts/register-typescript.cjs ./scripts/validate-shadow-runner-dry-run-api-route.ts"',
];

const README_TERMS: string[] = [
  "V51",
  "Shadow Runner Dry-run API Route",
  "app/api/portfolio/shadow-runner-dry-run/route.ts",
  "docs/shadow-runner-dry-run-api-route.md",
  "npm run test:shadow-runner-dry-run-api-route",
  "/api/portfolio/shadow-runner-dry-run",
  "fixture-only",
  "mock_or_contract",
  "V50 contract flags remain false",
  "V52",
];

// ---------------------------------------------------------------------------
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // No new monitoring UI / SQL migration in this route round.
  const forbiddenArtifacts = [
    "components/shadow-runner-dry-run-monitoring.tsx",
    "supabase/shadow_runner_dry_run.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V51.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
    "app/api/portfolio/first-authorized-source-dry-run/route.ts",
    "components/runtime-pilot-monitoring.tsx",
    "components/first-authorized-source-dry-run-monitoring.tsx",
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) {
      details.push(`PASS  ${rel} still present.`);
    } else {
      issues.push(`FAIL  ${rel} missing — must not be modified or deleted.`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "safety", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const routeBody = readFile(resolve(ROUTE_REL));
const docBody = readFile(resolve(DOC_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const routeTermCheck = checkTerms("route_terms", routeBody, ROUTE_REL, ROUTE_TERMS);
const routeForbiddenCheck = checkRouteForbidden();
const payloadCheck = checkPayload();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  routeTermCheck,
  routeForbiddenCheck,
  payloadCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("FAIL")),
);
const allWarnings: string[] = allChecks.flatMap((c) =>
  c.details.filter((d) => d.startsWith("WARNING")),
);

const summary: RouteSummary = {
  status: overallStatus,
  checked_files: [ROUTE_REL, DOC_REL, VALIDATOR_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    route_terms: routeTermCheck.status,
    route_forbidden: routeForbiddenCheck.status,
    payload_checks: payloadCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_route_created: true,
  ui_created: false,
  runtime_created: false,
  sql_migration_created: false,
  deploy_performed: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
