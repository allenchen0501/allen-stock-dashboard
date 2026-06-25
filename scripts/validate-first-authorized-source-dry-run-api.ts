/**
 * First Authorized Source Dry-Run API Validator — V40
 *
 * Contract / fixture-only check. Imports the pure API builder and inspects the
 * payload shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, build a runtime, or write data.
 *
 * Safety scanning for forbidden runtime tokens (including concrete data-source
 * names) is applied ONLY to code runtime files (API builder / route),
 * comment-stripped. Documentation may legitimately mention "官方 / 授權資料源"
 * as governance notes, so docs are NOT scanned for source tokens.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const apiBuilderModule = require("../use-cases/runtime-pilot/build-first-authorized-source-dry-run-api-contract") as typeof import("../use-cases/runtime-pilot/build-first-authorized-source-dry-run-api-contract");
const { buildFirstAuthorizedSourceDryRunApiContract } = apiBuilderModule;

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

const DOC_REL = "docs/first-authorized-source-dry-run-api.md";
const CONTRACT_REL = "use-cases/runtime-pilot/first-authorized-source-dry-run-contract.ts";
const BUILDER_REL = "use-cases/runtime-pilot/build-first-authorized-source-dry-run-contract.ts";
const API_BUILDER_REL = "use-cases/runtime-pilot/build-first-authorized-source-dry-run-api-contract.ts";
const ROUTE_REL = "app/api/portfolio/first-authorized-source-dry-run/route.ts";
const SPEC_DOC_REL = "docs/first-authorized-source-dry-run-spec.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "First Authorized Source Dry-Run API doc (new)", rel: DOC_REL },
    { label: "First Authorized Source Dry-Run contract", rel: CONTRACT_REL },
    { label: "First Authorized Source Dry-Run builder", rel: BUILDER_REL },
    { label: "First Authorized Source Dry-Run API builder (new)", rel: API_BUILDER_REL },
    { label: "First Authorized Source Dry-Run API route (new)", rel: ROUTE_REL },
    { label: "First Authorized Source Dry-Run Spec doc", rel: SPEC_DOC_REL },
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
  "First Authorized Source Dry-Run API",
  "/api/portfolio/first-authorized-source-dry-run",
  "mock_or_contract",
  "fixture-only",
  "single-source",
  "source-neutral connector shape",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
  "NO_GO",
  "manualSignOffCompleted",
  "priceVerified = false 時不得輸出精準價位",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "production write 一律 BLOCKED",
  "First Authorized Source Dry-Run API 不是 production",
  "First Authorized Source Dry-Run API 不代表可寫資料",
  "First Authorized Source Dry-Run API 不代表產生買賣指令",
  "不自動下單",
  "不產生買賣指令",
  "不替代投資判斷",
  "V40 不接真資料",
  "V40 不建立 runtime",
  "V40 不寫資料",
  "V41 First Authorized Source Dry-Run Monitoring UI",
  "V42 First Real Authorized Source Review",
];

// ---------------------------------------------------------------------------
// Gate 3: API builder checks
// ---------------------------------------------------------------------------

const API_BUILDER_TERMS: string[] = [
  "buildFirstAuthorizedSourceDryRunApiContract",
  "buildFirstAuthorizedSourceDryRunContract",
  "FirstAuthorizedSourceDryRunApiResponse",
  "FirstAuthorizedSourceDryRunApiSummary",
  "apiContractVersion",
  "responseSource",
  "mock_or_contract",
  "fixture",
  "V40",
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
  "buildFirstAuthorizedSourceDryRunApiContract",
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

function checkRouteForbidden(): CheckResult {
  const body = readFile(resolve(ROUTE_REL));
  if (body == null) {
    return { name: "route_forbidden", status: "FAIL", details: [`FAIL  Cannot read ${ROUTE_REL}.`] };
  }
  const lower = stripComments(body).toLowerCase();
  const details: string[] = [];
  const issues: string[] = [];
  for (const token of [...ROUTE_FORBIDDEN, "@supabase", "createclient", "process.env", ...RUNTIME_SOURCE_TOKENS]) {
    if (lower.includes(token.toLowerCase())) {
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

  const p = buildFirstAuthorizedSourceDryRunApiContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("apiContractVersion", p.apiContractVersion, "V40");
  expectEq("responseSource", p.responseSource, "mock_or_contract");
  expectEq("sourceMode", p.sourceMode, "fixture");
  expectEq("fixtureVersion", p.fixtureVersion, "V40");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);

  expectEq("dryRunBundle.contractVersion", p.dryRunBundle.contractVersion, "V39");
  expectEq("dryRunBundle.decision", p.dryRunBundle.decision, "NO_GO");
  expectEq("dryRunBundle.dryRunAllowed", p.dryRunBundle.dryRunAllowed, false);
  expectEq(
    "dryRunBundle.preflight.manualSignOffCompleted",
    p.dryRunBundle.preflight.manualSignOffCompleted,
    false,
  );

  expectEq("summary.decision", p.summary.decision, p.dryRunBundle.decision);
  expectEq("summary.dryRunAllowed", p.summary.dryRunAllowed, false);
  expectEq("summary.manualSignOffCompleted", p.summary.manualSignOffCompleted, false);
  expectEq("summary.requestPerformed", p.summary.requestPerformed, false);
  expectEq("summary.rawResponseStored", p.summary.rawResponseStored, false);
  expectEq("summary.normalizedSnapshotProduced", p.summary.normalizedSnapshotProduced, false);
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

  for (const label of [
    "不產生買賣指令",
    "V40 不接真資料",
    "First Authorized Source Dry-Run API 不是 production",
  ]) {
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
  '"test:first-authorized-source-dry-run-api": "node --require ./scripts/register-typescript.cjs ./scripts/validate-first-authorized-source-dry-run-api.ts"',
];

const README_TERMS: string[] = [
  "V40",
  "First Authorized Source Dry-Run API",
  "docs/first-authorized-source-dry-run-api.md",
  "use-cases/runtime-pilot/build-first-authorized-source-dry-run-api-contract.ts",
  "app/api/portfolio/first-authorized-source-dry-run/route.ts",
  "npm run test:first-authorized-source-dry-run-api",
  "/api/portfolio/first-authorized-source-dry-run",
  "mock_or_contract",
  "fixture-only",
  "single-source",
  "source-neutral connector shape",
  "GO_FIRST_AUTHORIZED_SOURCE_DRY_RUN",
  "NO_GO",
  "manualSignOffCompleted = false",
  "buySellCommandGenerated 必須 false",
  "autoOrderRequested 必須 false",
  "production write 一律 BLOCKED",
  "V40 不接真資料",
  "V40 不建立 runtime",
  "未連 Supabase",
  "未新增 SQL migration",
  "未新增 UI",
  "未寫入資料",
  "未產生買賣指令",
];

// ---------------------------------------------------------------------------
// Gate 7: Safety checks
// ---------------------------------------------------------------------------

const DB_WRITE_TOKENS = ["insert(", "upsert(", "update(", "delete("];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 7a. API builder + route code: no external request / supabase / env / clock /
  //     DB writes / concrete source tokens.
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
    "supabase/first_authorized_source_dry_run_api.sql",
    "components/first-authorized-source-dry-run.tsx",
    "components/first-authorized-source-dry-run-api.tsx",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V40.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7c. No dry-run runtime / poller / scheduler / connector.
  const forbiddenRuntime = [
    "use-cases/runtime-pilot/first-authorized-source-connector.ts",
    "services/runtime-pilot/first-authorized-source-poller.ts",
    "services/runtime-pilot/first-authorized-source-scheduler.ts",
  ];
  for (const rel of forbiddenRuntime) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Runtime ${rel} must not exist in V40.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 7d. Protected layers must still be present (not modified/deleted).
  const protectedFiles = [
    "use-cases/runtime-pilot/first-authorized-source-dry-run-contract.ts",
    "use-cases/runtime-pilot/build-first-authorized-source-dry-run-contract.ts",
    "components/runtime-pilot-monitoring.tsx",
    "app/holdings/page.tsx",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
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
