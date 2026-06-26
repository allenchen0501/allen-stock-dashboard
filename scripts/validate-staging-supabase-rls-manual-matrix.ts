/**
 * Staging Supabase RLS Manual Matrix Validator — V45
 *
 * Contract / spec-only check. Imports the pure builder + constants and inspects
 * the bundle shape; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, build a runtime, write data, or deploy.
 *
 * Safety scanning is case-insensitive: contract / builder source is lower-cased
 * before scanning forbidden tokens, so @supabase / @Supabase etc. cannot slip
 * through.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/deployment/build-staging-supabase-rls-manual-matrix-contract") as typeof import("../use-cases/deployment/build-staging-supabase-rls-manual-matrix-contract");
const { buildStagingSupabaseRlsManualMatrixContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface MatrixSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  matrix_item_count: number;
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/staging-supabase-rls-manual-matrix.md";
const CONTRACT_REL = "use-cases/deployment/staging-supabase-rls-manual-matrix-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-staging-supabase-rls-manual-matrix-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "RLS matrix doc (new)", rel: DOC_REL },
    { label: "RLS matrix contract (new)", rel: CONTRACT_REL },
    { label: "RLS matrix builder (new)", rel: BUILDER_REL },
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
  "V45",
  "Staging Supabase RLS Manual Matrix",
  "staging Supabase",
  "RLS manual matrix",
  "read-only",
  "not production trading system",
  "no real market data",
  "no Supabase connection",
  "no env key",
  "no write",
  "no staging write",
  "no production write",
  "no SQL migration",
  "no api switch",
  "no buy/sell command",
  "no auto order",
  "using (true)",
  "public read/write",
  "V46",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "StagingSupabaseRlsDeploymentTarget",
  "StagingSupabaseRlsDecision",
  "StagingSupabaseRlsTableName",
  "StagingSupabaseRlsRole",
  "StagingSupabaseRlsOperation",
  "StagingSupabaseRlsExpectedAccess",
  "StagingSupabaseRlsActualAccess",
  "StagingSupabaseRlsVerificationStatus",
  "StagingSupabaseRlsMatrixItem",
  "StagingSupabaseRlsManualMatrixBundle",
  "STAGING_SUPABASE_RLS_MANUAL_MATRIX_CONTRACT_VERSION",
  "STAGING_SUPABASE_RLS_MANUAL_MATRIX_TABLES",
  "STAGING_SUPABASE_RLS_MANUAL_MATRIX_ROLES",
  "STAGING_SUPABASE_RLS_MANUAL_MATRIX_OPERATIONS",
  "STAGING_SUPABASE_RLS_MANUAL_MATRIX_ALLOWED_DECISIONS",
  "STAGING_SUPABASE_RLS_MANUAL_MATRIX_SAFETY_LABELS",
  "STAGING_SUPABASE_RLS_MANUAL_MATRIX_DISALLOWED_TERMS",
  "READY_FOR_REVIEW",
  "NO_GO",
  "ALLOW_READ_ONLY",
  "SERVICE_ROLE_ONLY",
  "NOT_ALLOWED_IN_APP_RUNTIME",
  "NOT_TESTED",
  "stagingSupabasePlanned: true",
  "stagingSupabaseConnected: false",
  "stagingRlsMatrixDefined: true",
  "stagingRlsManuallyVerified: false",
  "stagingReadPerformed: false",
  "stagingWritePerformed: false",
  "productionSupabaseConnected: false",
  "productionWritePerformed: false",
  "databaseWritePerformed: false",
  "requestPerformed: false",
  "envReadPerformed: false",
  "apiRouteCreated: false",
  "uiCreated: false",
  "runtimeCreated: false",
  "sqlMigrationCreated: false",
  "portfolioApiSwitched: false",
  "realMarketDataEnabled: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
];

function checkNoProductionReady(): CheckResult {
  const body = readFile(resolve(CONTRACT_REL));
  if (body == null) {
    return { name: "no_production_ready", status: "FAIL", details: [`FAIL  Cannot read ${CONTRACT_REL}.`] };
  }
  // Strip comments first: an explanatory comment may legitimately reference the
  // token to document that it is intentionally absent from the type.
  if (stripComments(body).includes("PRODUCTION_READY")) {
    return {
      name: "no_production_ready",
      status: "FAIL",
      details: ['FAIL  Forbidden "PRODUCTION_READY" present in contract.'],
    };
  }
  return {
    name: "no_production_ready",
    status: "PASS",
    details: ['PASS  No "PRODUCTION_READY" in contract.'],
  };
}

// ---------------------------------------------------------------------------
// Gate 4: Payload checks (call pure function)
// ---------------------------------------------------------------------------

const EXPECTED_TABLES = [
  "portfolio_stocks",
  "watchlist_stocks",
  "market_snapshots",
  "stock_snapshots",
  "v85_scores",
];
const EXPECTED_ROLES = ["anon", "authenticated", "service_role", "dashboard_readonly_app"];
const EXPECTED_OPERATIONS = ["select", "insert", "update", "delete"];

function checkPayload(): { result: CheckResult; matrixCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildStagingSupabaseRlsManualMatrixContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V45");
  expectEq("matrixName", p.matrixName, "Staging Supabase RLS Manual Matrix");
  expectEq("deploymentTarget", p.deploymentTarget, "staging");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);

  if (p.decision === "READY_FOR_REVIEW" || p.decision === "NO_GO") {
    details.push(`PASS  decision = ${p.decision} (allowed).`);
  } else {
    issues.push(`FAIL  decision = ${p.decision}, expected READY_FOR_REVIEW or NO_GO.`);
  }
  if ((p.decision as string) === "PRODUCTION_READY") {
    issues.push('FAIL  decision must never be "PRODUCTION_READY".');
  } else {
    details.push('PASS  decision is not "PRODUCTION_READY".');
  }

  // Frozen safety flags.
  expectEq("stagingSupabasePlanned", p.stagingSupabasePlanned, true);
  expectEq("stagingSupabaseConnected", p.stagingSupabaseConnected, false);
  expectEq("stagingRlsMatrixDefined", p.stagingRlsMatrixDefined, true);
  expectEq("stagingRlsManuallyVerified", p.stagingRlsManuallyVerified, false);
  expectEq("stagingReadPerformed", p.stagingReadPerformed, false);
  expectEq("stagingWritePerformed", p.stagingWritePerformed, false);
  expectEq("productionSupabaseConnected", p.productionSupabaseConnected, false);
  expectEq("productionWritePerformed", p.productionWritePerformed, false);
  expectEq("databaseWritePerformed", p.databaseWritePerformed, false);
  expectEq("requestPerformed", p.requestPerformed, false);
  expectEq("envReadPerformed", p.envReadPerformed, false);
  expectEq("apiRouteCreated", p.apiRouteCreated, false);
  expectEq("uiCreated", p.uiCreated, false);
  expectEq("runtimeCreated", p.runtimeCreated, false);
  expectEq("sqlMigrationCreated", p.sqlMigrationCreated, false);
  expectEq("portfolioApiSwitched", p.portfolioApiSwitched, false);
  expectEq("realMarketDataEnabled", p.realMarketDataEnabled, false);
  expectEq("buySellCommandGenerated", p.buySellCommandGenerated, false);
  expectEq("autoOrderRequested", p.autoOrderRequested, false);

  // Matrix count + coverage.
  const items = p.matrixItems;
  if (items.length >= 80) {
    details.push(`PASS  matrixItems.length = ${items.length} (>= 80).`);
  } else {
    issues.push(`FAIL  matrixItems.length = ${items.length}, expected >= 80.`);
  }

  for (const t of EXPECTED_TABLES) {
    if (items.some((i) => i.tableName === t)) details.push(`PASS  matrix covers table ${t}.`);
    else issues.push(`FAIL  matrix missing table ${t}.`);
  }
  for (const r of EXPECTED_ROLES) {
    if (items.some((i) => i.role === r)) details.push(`PASS  matrix covers role ${r}.`);
    else issues.push(`FAIL  matrix missing role ${r}.`);
  }
  for (const o of EXPECTED_OPERATIONS) {
    if (items.some((i) => i.operation === o)) details.push(`PASS  matrix covers operation ${o}.`);
    else issues.push(`FAIL  matrix missing operation ${o}.`);
  }

  // Per-item policy expectations.
  const writeOps = new Set(["insert", "update", "delete"]);
  let policyOk = true;
  for (const i of items) {
    if (i.actualAccess !== "NOT_TESTED") { policyOk = false; issues.push(`FAIL  ${i.tableName}/${i.role}/${i.operation} actualAccess != NOT_TESTED.`); }
    if (i.verificationStatus !== "NOT_REVIEWED") { policyOk = false; issues.push(`FAIL  ${i.tableName}/${i.role}/${i.operation} verificationStatus != NOT_REVIEWED.`); }

    if (i.role === "anon") {
      if (i.expectedAccess !== "DENY") { policyOk = false; issues.push(`FAIL  anon/${i.tableName}/${i.operation} expectedAccess must be DENY.`); }
    } else if (i.role === "authenticated" || i.role === "dashboard_readonly_app") {
      if (i.operation === "select") {
        if (i.expectedAccess !== "ALLOW_READ_ONLY") { policyOk = false; issues.push(`FAIL  ${i.role}/${i.tableName}/select expectedAccess must be ALLOW_READ_ONLY.`); }
      } else if (i.expectedAccess !== "DENY") {
        policyOk = false; issues.push(`FAIL  ${i.role}/${i.tableName}/${i.operation} expectedAccess must be DENY.`);
      }
    } else if (i.role === "service_role") {
      if (i.expectedAccess !== "SERVICE_ROLE_ONLY" && i.expectedAccess !== "NOT_ALLOWED_IN_APP_RUNTIME") {
        policyOk = false; issues.push(`FAIL  service_role/${i.tableName}/${i.operation} expectedAccess must be SERVICE_ROLE_ONLY or NOT_ALLOWED_IN_APP_RUNTIME.`);
      }
    }

    // Write operation must never be ALLOW_READ_ONLY.
    if (writeOps.has(i.operation) && i.expectedAccess === "ALLOW_READ_ONLY") {
      policyOk = false; issues.push(`FAIL  ${i.tableName}/${i.role}/${i.operation} write op must not be ALLOW_READ_ONLY.`);
    }
  }
  if (policyOk) details.push("PASS  All matrix items satisfy policy expectations.");

  for (const label of ["no buy/sell command", "no Supabase connection", "RLS manual matrix"]) {
    if (p.safetyLabels.includes(label)) details.push(`PASS  safetyLabels includes "${label}".`);
    else issues.push(`FAIL  safetyLabels must include "${label}".`);
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { result: { name: "payload_checks", status, details: [...details, ...issues] }, matrixCount: items.length };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:staging-supabase-rls-manual-matrix": "node --require ./scripts/register-typescript.cjs ./scripts/validate-staging-supabase-rls-manual-matrix.ts"',
];

const README_TERMS: string[] = [
  "V45",
  "Staging Supabase RLS Manual Matrix",
  "docs/staging-supabase-rls-manual-matrix.md",
  "use-cases/deployment/staging-supabase-rls-manual-matrix-contract.ts",
  "use-cases/deployment/build-staging-supabase-rls-manual-matrix-contract.ts",
  "npm run test:staging-supabase-rls-manual-matrix",
  "staging Supabase",
  "read-only",
  "fixture/mock UI 仍維持現狀",
  "V46",
];

// ---------------------------------------------------------------------------
// Gate 6: Safety checks (case-insensitive forbidden token scan)
// ---------------------------------------------------------------------------

const FORBIDDEN_TOKENS = [
  "fetch(",
  "axios",
  "@supabase",
  "createclient",
  "process.env",
  "date.now",
  "new date(",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) {
      issues.push(`FAIL  Cannot read ${rel}.`);
      continue;
    }
    const lower = stripComments(body).toLowerCase();
    for (const token of FORBIDDEN_TOKENS) {
      if (lower.includes(token)) {
        issues.push(`FAIL  Forbidden "${token}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${token}" in ${rel} code.`);
      }
    }
  }

  const forbiddenArtifacts = [
    "app/api/portfolio/staging-supabase-rls-manual-matrix/route.ts",
    "components/staging-supabase-rls-manual-matrix.tsx",
    "supabase/staging_supabase_rls_manual_matrix.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V45.`);
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

const docBody = readFile(resolve(DOC_REL));
const contractBody = readFile(resolve(CONTRACT_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const contractCheck = checkTerms("contract_checks", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const noProdReadyCheck = checkNoProductionReady();
const { result: payloadCheck, matrixCount } = checkPayload();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  noProdReadyCheck,
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

const summary: MatrixSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
    no_production_ready: noProdReadyCheck.status,
    payload_checks: payloadCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  matrix_item_count: matrixCount,
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
  deploy_performed: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
