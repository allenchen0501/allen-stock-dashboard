/**
 * Staging Supabase Read-only Safety Gate Validator — V44
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

const builderModule = require("../use-cases/deployment/build-staging-supabase-readonly-safety-gate-contract") as typeof import("../use-cases/deployment/build-staging-supabase-readonly-safety-gate-contract");
const { buildStagingSupabaseReadonlySafetyGateContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface GateSummary {
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

const DOC_REL = "docs/staging-supabase-readonly-safety-gate.md";
const CONTRACT_REL = "use-cases/deployment/staging-supabase-readonly-safety-gate-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-staging-supabase-readonly-safety-gate-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Safety gate doc (new)", rel: DOC_REL },
    { label: "Safety gate contract (new)", rel: CONTRACT_REL },
    { label: "Safety gate builder (new)", rel: BUILDER_REL },
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
  "V44",
  "Staging Supabase Read-only Safety Gate",
  "staging Supabase",
  "read-only",
  "not production trading system",
  "no real market data",
  "no Supabase connection",
  "no env key",
  "no write",
  "no staging write",
  "no production write",
  "no api switch",
  "no buy/sell command",
  "no auto order",
  "fixture/mock UI 仍維持現狀",
  "V45 Staging Supabase RLS Manual Matrix",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "StagingSupabaseReadonlyDeploymentTarget",
  "StagingSupabaseReadonlyDecision",
  "StagingSupabaseReadonlyGateId",
  "StagingSupabaseReadonlyGate",
  "StagingSupabaseReadonlyStagingBoundary",
  "StagingSupabaseReadonlyReadOnlyBoundary",
  "StagingSupabaseReadonlyProductionIsolationBoundary",
  "StagingSupabaseReadonlyNoWriteProof",
  "StagingSupabaseReadonlyApiSwitchGuard",
  "StagingSupabaseReadonlyRuntimeGuard",
  "StagingSupabaseReadonlyEnvGuard",
  "StagingSupabaseReadonlySafetyGateBundle",
  "STAGING_SUPABASE_READONLY_SAFETY_GATE_CONTRACT_VERSION",
  "STAGING_SUPABASE_READONLY_SAFETY_GATE_ALLOWED_GATES",
  "STAGING_SUPABASE_READONLY_SAFETY_GATE_ALLOWED_DECISIONS",
  "STAGING_SUPABASE_READONLY_SAFETY_GATE_SAFETY_LABELS",
  "STAGING_SUPABASE_READONLY_SAFETY_GATE_DISALLOWED_TERMS",
  "READY_FOR_REVIEW",
  "NO_GO",
  "stagingSupabasePlanned: true",
  "stagingSupabaseConnected: false",
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

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildStagingSupabaseReadonlySafetyGateContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V44");
  expectEq("gateName", p.gateName, "Staging Supabase Read-only Safety Gate");
  expectEq("deploymentTarget", p.deploymentTarget, "staging");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);
  expectEq("decision", p.decision, "READY_FOR_REVIEW");

  if ((p.decision as string) === "PRODUCTION_READY") {
    issues.push('FAIL  decision must never be "PRODUCTION_READY".');
  } else {
    details.push('PASS  decision is not "PRODUCTION_READY".');
  }

  expectEq("stagingSupabasePlanned", p.stagingSupabasePlanned, true);
  expectEq("stagingSupabaseConnected", p.stagingSupabaseConnected, false);
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

  if (p.gates.length >= 9) {
    details.push(`PASS  gates.length = ${p.gates.length} (>= 9).`);
  } else {
    issues.push(`FAIL  gates.length = ${p.gates.length}, expected >= 9.`);
  }

  expectEq("futureGate", p.futureGate, "V45 Staging Supabase RLS Manual Matrix");

  for (const label of ["no buy/sell command", "no Supabase connection", "Staging Supabase Read-only Safety Gate"]) {
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
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:staging-supabase-readonly-safety-gate": "node --require ./scripts/register-typescript.cjs ./scripts/validate-staging-supabase-readonly-safety-gate.ts"',
];

const README_TERMS: string[] = [
  "V44",
  "Staging Supabase Read-only Safety Gate",
  "docs/staging-supabase-readonly-safety-gate.md",
  "use-cases/deployment/staging-supabase-readonly-safety-gate-contract.ts",
  "use-cases/deployment/build-staging-supabase-readonly-safety-gate-contract.ts",
  "npm run test:staging-supabase-readonly-safety-gate",
  "staging Supabase",
  "read-only",
  "fixture/mock UI 仍維持現狀",
  "V45 Staging Supabase RLS Manual Matrix",
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

  // 6a. Contract + builder code: case-insensitive forbidden token scan.
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

  // 6b. No new API route / UI component / SQL migration for this gate round.
  const forbiddenArtifacts = [
    "app/api/portfolio/staging-supabase-readonly-safety-gate/route.ts",
    "components/staging-supabase-readonly-safety-gate.tsx",
    "supabase/staging_supabase_readonly_safety_gate.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V44.`);
    } else {
      details.push(`PASS  ${rel} does not exist (correct).`);
    }
  }

  // 6c. Protected layers must still be present (not modified/deleted).
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
const payloadCheck = checkPayload();
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

const summary: GateSummary = {
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
