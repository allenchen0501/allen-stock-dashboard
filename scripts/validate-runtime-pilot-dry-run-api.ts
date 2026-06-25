/**
 * Runtime Pilot Dry-Run API Validator — V36
 *
 * Contract / fixture-only check. Imports the pure API builder and inspects the
 * payload shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, or write data.
 *
 * Safety scanning for forbidden runtime tokens is applied ONLY to code runtime
 * files (API builder / route), comment-stripped. Documentation may legitimately
 * mention concrete source names as governance notes, so docs are NOT scanned.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const apiBuilderModule = require("../use-cases/runtime-pilot/build-runtime-pilot-dry-run-api-contract") as typeof import("../use-cases/runtime-pilot/build-runtime-pilot-dry-run-api-contract");
const { buildRuntimePilotDryRunApiContract } = apiBuilderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface DryRunApiSummary {
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

function checkAbsent(
  name: string,
  body: string | null,
  fileLabel: string,
  forbidden: string[],
): CheckResult {
  if (body == null) {
    return { name, status: "FAIL", details: [`FAIL  Cannot read ${fileLabel}.`] };
  }
  const details: string[] = [];
  const issues: string[] = [];
  for (const term of forbidden) {
    if (body.includes(term)) {
      issues.push(`FAIL  Forbidden "${term}" present in ${fileLabel}.`);
    } else {
      details.push(`PASS  No "${term}" in ${fileLabel}.`);
    }
  }
  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name, status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/runtime-pilot-dry-run-api.md";
const CONTRACT_REL = "use-cases/runtime-pilot/runtime-pilot-dry-run-contract.ts";
const BUILDER_REL = "use-cases/runtime-pilot/build-runtime-pilot-dry-run-contract.ts";
const API_BUILDER_REL = "use-cases/runtime-pilot/build-runtime-pilot-dry-run-api-contract.ts";
const ROUTE_REL = "app/api/portfolio/runtime-pilot-dry-run/route.ts";
const SPEC_DOC_REL = "docs/runtime-pilot-dry-run-spec.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Runtime Pilot Dry-Run API doc (new)", rel: DOC_REL },
    { label: "Runtime Pilot Dry-Run contract", rel: CONTRACT_REL },
    { label: "Runtime Pilot Dry-Run builder", rel: BUILDER_REL },
    { label: "Runtime Pilot Dry-Run API builder (new)", rel: API_BUILDER_REL },
    { label: "Runtime Pilot Dry-Run API route (new)", rel: ROUTE_REL },
    { label: "Runtime Pilot Dry-Run Spec doc", rel: SPEC_DOC_REL },
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
  "Runtime Pilot Dry-Run API",
  "/api/portfolio/runtime-pilot-dry-run",
  "mock_or_contract",
  "fixture-only",
  "DRY_RUN_NOT_ALLOWED",
  "DRY_RUN_COMPLETED_WITH_NO_WRITE",
  "dry_run_spec",
  "NO_GO",
  "priceVerified = false 時不得輸出精準價位",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "production write 一律 BLOCKED",
  "Dry-run API 不是 production",
  "Dry-run API 不代表可寫資料",
  "Dry-run API 不代表產生買賣指令",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "V36 不接真資料",
  "V36 不建立 runtime",
  "V36 不寫資料",
  "V37 Runtime Pilot Monitoring UI",
  "V38 Runtime Pilot Dry-Run Implementation Review",
];

// ---------------------------------------------------------------------------
// Gate 3: API builder checks
// ---------------------------------------------------------------------------

const API_BUILDER_TERMS: string[] = [
  "buildRuntimePilotDryRunApiContract",
  "buildRuntimePilotDryRunContract",
  "RuntimePilotDryRunApiResponse",
  "RuntimePilotDryRunApiSummary",
  "apiContractVersion",
  "responseSource",
  "mock_or_contract",
  "fixture",
  "dry_run_spec",
  "V36",
  "dryRunBundle",
  "summary",
  "2026-06-23T00:00:00.000Z",
  "requestPerformed: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
];

const API_BUILDER_FORBIDDEN: string[] = [
  "Date.now",
  "new Date",
  "fetch(",
  "axios",
  "process.env",
  "@supabase",
  "createClient",
];

// ---------------------------------------------------------------------------
// Gate 4: Route checks
// ---------------------------------------------------------------------------

const ROUTE_TERMS: string[] = [
  "GET",
  "NextResponse.json",
  "buildRuntimePilotDryRunApiContract",
  "2026-06-23T00:00:00.000Z",
];

const ROUTE_FORBIDDEN: string[] = [
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "fetch",
  "axios",
  "Date.now",
  "new Date",
];

function checkRouteForbidden(): CheckResult {
  const body = readFile(resolve(ROUTE_REL));
  if (body == null) {
    return { name: "route_forbidden", status: "FAIL", details: [`FAIL  Cannot read ${ROUTE_REL}.`] };
  }
  const lower = stripComments(body).toLowerCase();
  const details: string[] = [];
  const issues: string[] = [];
  for (const token of ROUTE_FORBIDDEN) {
    if (lower.includes(token.toLowerCase())) {
      issues.push(`FAIL  Forbidden "${token}" present in ${ROUTE_REL}.`);
    } else {
      details.push(`PASS  No "${token}" in ${ROUTE_REL}.`);
    }
  }
  for (const token of ["@supabase", "createclient", "process.env"]) {
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
// Gate 5: Payload checks (call pure function)
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildRuntimePilotDryRunApiContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("apiContractVersion", p.apiContractVersion, "V36");
  expectEq("responseSource", p.responseSource, "mock_or_contract");
  expectEq("sourceMode", p.sourceMode, "fixture");
  expectEq("runtimeMode", p.runtimeMode, "dry_run_spec");
  expectEq("fixtureVersion", p.fixtureVersion, "V36");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);

  expectEq("dryRunBundle.contractVersion", p.dryRunBundle.contractVersion, "V35");
  expectEq("dryRunBundle.lifecycleState", p.dryRunBundle.lifecycleState, "DRY_RUN_NOT_ALLOWED");
  expectEq("dryRunBundle.readinessDecision", p.dryRunBundle.readinessDecision, "NO_GO");
  expectEq("dryRunBundle.dryRunAllowed", p.dryRunBundle.dryRunAllowed, false);

  expectEq("summary.lifecycleState", p.summary.lifecycleState, p.dryRunBundle.lifecycleState);
  expectEq("summary.readinessDecision", p.summary.readinessDecision, p.dryRunBundle.readinessDecision);
  expectEq("summary.dryRunAllowed", p.summary.dryRunAllowed, false);
  expectEq("summary.priceVerified", p.summary.priceVerified, false);
  expectEq("summary.highConfidenceConclusionAllowed", p.summary.highConfidenceConclusionAllowed, false);
  expectEq("summary.precisePriceZoneAllowed", p.summary.precisePriceZoneAllowed, false);
  expectEq("summary.buySellCommandGenerated", p.summary.buySellCommandGenerated, false);
  expectEq("summary.autoOrderRequested", p.summary.autoOrderRequested, false);
  expectEq("summary.productionWriteRequested", p.summary.productionWriteRequested, false);
  expectEq("summary.writeAttempted", p.summary.writeAttempted, false);
  expectEq("summary.databaseWritePerformed", p.summary.databaseWritePerformed, false);
  expectEq("summary.externalOrderPerformed", p.summary.externalOrderPerformed, false);
  expectEq("summary.productionWritePerformed", p.summary.productionWritePerformed, false);
  expectEq("summary.supabaseConnected", p.summary.supabaseConnected, false);

  expectEq("requestPerformed", p.requestPerformed, false);
  expectEq("supabaseConnected", p.supabaseConnected, false);
  expectEq("productionWritePerformed", p.productionWritePerformed, false);
  expectEq("dryRunBundle.requestPerformed", p.dryRunBundle.requestPerformed, false);
  expectEq("dryRunBundle.supabaseConnected", p.dryRunBundle.supabaseConnected, false);
  expectEq("dryRunBundle.productionWritePerformed", p.dryRunBundle.productionWritePerformed, false);

  for (const label of ["不產生買賣指令", "V36 不接真資料", "Dry-run API 不是 production"]) {
    if (p.safetyLabels.includes(label)) {
      details.push(`PASS  safetyLabels includes "${label}".`);
    } else {
      issues.push(`FAIL  safetyLabels must include "${label}".`);
    }
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:runtime-pilot-dry-run-api": "node --require ./scripts/register-typescript.cjs ./scripts/validate-runtime-pilot-dry-run-api.ts"',
];

const README_TERMS: string[] = [
  "V36",
  "Runtime Pilot Dry-Run API",
  "docs/runtime-pilot-dry-run-api.md",
  "use-cases/runtime-pilot/build-runtime-pilot-dry-run-api-contract.ts",
  "app/api/portfolio/runtime-pilot-dry-run/route.ts",
  "npm run test:runtime-pilot-dry-run-api",
  "/api/portfolio/runtime-pilot-dry-run",
  "mock_or_contract",
  "fixture-only",
  "DRY_RUN_NOT_ALLOWED",
  "DRY_RUN_COMPLETED_WITH_NO_WRITE",
  "dry_run_spec",
  "NO_GO",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "production write 一律 BLOCKED",
  "V36 不接真資料",
  "V36 不建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 UI",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

const RUNTIME_SOURCE_TOKENS = [
  "twse",
  "tpex",
  "yahoo",
  "finmind",
  "tradingview",
  "yfinance",
  "factset",
  "broker",
];

const DB_WRITE_TOKENS = ["insert(", "upsert(", "update(", "delete("];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 7a. API builder + route code: no external request / supabase / env / clock /
  //     DB writes / source tokens.
  for (const rel of [API_BUILDER_REL, ROUTE_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) {
      issues.push(`FAIL  Cannot read ${rel}.`);
      continue;
    }
    const lower = stripComments(body).toLowerCase();
    const forbidden = [
      "fetch(",
      "axios",
      "@supabase",
      "createclient",
      "process.env",
      "date.now",
      "new date(",
      ...DB_WRITE_TOKENS,
      ...RUNTIME_SOURCE_TOKENS,
    ];
    for (const token of forbidden) {
      if (lower.includes(token)) {
        issues.push(`FAIL  Forbidden "${token}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${token}" in ${rel} code.`);
      }
    }
  }

  // 7b. No new SQL migration / UI component for the dry-run API.
  const forbiddenArtifacts = [
    "supabase/runtime_pilot_dry_run_api.sql",
    "components/runtime-pilot-dry-run.tsx",
    "components/runtime-pilot-dry-run-api.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V36.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7c. No dry-run runtime / poller / scheduler.
  const forbiddenRuntime = [
    "use-cases/runtime-pilot/runtime-pilot-dry-run-runner.ts",
    "services/runtime-pilot/dry-run-poller.ts",
    "services/runtime-pilot/dry-run-scheduler.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V36.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7d. Protected layers must still be present (not modified/deleted).
  const protectedFiles = [
    "use-cases/runtime-pilot/runtime-pilot-dry-run-contract.ts",
    "use-cases/runtime-pilot/build-runtime-pilot-dry-run-contract.ts",
    "components/runtime-pilot-readiness.tsx",
    "app/holdings/page.tsx",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
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

const docBody = readFile(resolve(DOC_REL));
const apiBuilderBody = readFile(resolve(API_BUILDER_REL));
const routeBody = readFile(resolve(ROUTE_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const apiBuilderTermCheck = checkTerms("api_builder_checks", apiBuilderBody, API_BUILDER_REL, API_BUILDER_TERMS);
const apiBuilderForbiddenCheck = checkAbsent(
  "api_builder_no_runtime",
  apiBuilderBody == null ? null : stripComments(apiBuilderBody),
  API_BUILDER_REL,
  API_BUILDER_FORBIDDEN,
);
const routeTermCheck = checkTerms("route_checks", routeBody, ROUTE_REL, ROUTE_TERMS);
const routeForbiddenCheck = checkRouteForbidden();
const payloadCheck = checkPayload();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  apiBuilderTermCheck,
  apiBuilderForbiddenCheck,
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

const summary: DryRunApiSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, API_BUILDER_REL, ROUTE_REL, SPEC_DOC_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    api_builder_checks: apiBuilderTermCheck.status,
    api_builder_no_runtime: apiBuilderForbiddenCheck.status,
    route_checks: routeTermCheck.status,
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
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
