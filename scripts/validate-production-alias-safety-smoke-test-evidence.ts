/**
 * Production Alias Safety Smoke Test Evidence Validator — V43
 *
 * Contract / spec-only check. Imports the pure builder + constants and inspects
 * the evidence bundle shape; it does NOT start a Next.js server, make any HTTP
 * request, connect to Supabase, read env keys, build a runtime, write data, or
 * trigger a deploy.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/deployment/build-production-alias-safety-smoke-test-evidence-contract") as typeof import("../use-cases/deployment/build-production-alias-safety-smoke-test-evidence-contract");
const { buildProductionAliasSafetySmokeTestEvidenceContract } = builderModule;

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

const DOC_REL = "docs/production-alias-safety-smoke-test-evidence.md";
const CONTRACT_REL = "use-cases/deployment/production-alias-safety-smoke-test-evidence-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-production-alias-safety-smoke-test-evidence-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Evidence doc (new)", rel: DOC_REL },
    { label: "Evidence contract (new)", rel: CONTRACT_REL },
    { label: "Evidence builder (new)", rel: BUILDER_REL },
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
  "V43",
  "Production Alias Safety Smoke Test Evidence",
  "allen-stock-dashboard.vercel.app",
  "fixture/mock safe mode",
  "not production trading system",
  "no real market data",
  "no Supabase",
  "no production write",
  "no buy/sell command",
  "no auto order",
  "V44 Staging Supabase Read-only Safety Gate",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "ProductionAliasSafetySmokeTestDeploymentTarget",
  "ProductionAliasSafetySmokeTestDecision",
  "ProductionAliasSafetySmokeTestEndpointCheck",
  "ProductionAliasSafetySmokeTestRuntimeHealth",
  "ProductionAliasSafetySmokeTestSafetyFlags",
  "ProductionAliasSafetySmokeTestEvidenceBundle",
  "PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_CONTRACT_VERSION",
  "PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_PRODUCTION_ALIAS",
  "PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_ALLOWED_DECISIONS",
  "PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_SAFETY_LABELS",
  "PRODUCTION_ALIAS_SAFETY_SMOKE_TEST_EVIDENCE_DISALLOWED_TERMS",
  "SMOKE_TEST_PASSED",
  "production_alias",
  "allen-stock-dashboard.vercel.app",
  "realMarketDataEnabled: false",
  "supabaseConnected: false",
  "productionWritePerformed: false",
  "databaseWritePerformed: false",
  "requestPerformed: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "portfolioApiSwitched: false",
  "runtimeCreated: false",
  "apiRouteCreated: false",
  "uiCreated: false",
  "sqlMigrationCreated: false",
  "envReadPerformed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Payload checks (call pure function)
// ---------------------------------------------------------------------------

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildProductionAliasSafetySmokeTestEvidenceContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V43");
  expectEq("evidenceName", p.evidenceName, "Production Alias Safety Smoke Test Evidence");
  expectEq("deploymentTarget", p.deploymentTarget, "production_alias");
  expectEq("productionAlias", p.productionAlias, "allen-stock-dashboard.vercel.app");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);
  expectEq("decision", p.decision, "SMOKE_TEST_PASSED");

  expectEq("productionShellAccessible", p.productionShellAccessible, true);
  expectEq("homePageAccessible", p.homePageAccessible, true);
  expectEq("holdingsPageAccessible", p.holdingsPageAccessible, true);
  expectEq("firstAuthorizedSourceDryRunApiAccessible", p.firstAuthorizedSourceDryRunApiAccessible, true);
  expectEq("runtimePilotDryRunApiAccessible", p.runtimePilotDryRunApiAccessible, true);
  expectEq("intradayDefenseApiAccessible", p.intradayDefenseApiAccessible, true);
  expectEq("holdingDefenseApiAccessible", p.holdingDefenseApiAccessible, true);

  expectEq("runtimeErrorFatalFound", p.runtimeErrorFatalFound, false);
  expectEq("runtimeHttp500Found", p.runtimeHttp500Found, false);

  expectEq("sourceMode", p.sourceMode, "fixture");
  expectEq("responseSource", p.responseSource, "mock_or_contract");

  // The full set of safety flags must all be false (both top-level + safetyFlags).
  const falseFlags: Array<keyof typeof p> = [
    "realMarketDataEnabled",
    "supabaseConnected",
    "productionWritePerformed",
    "databaseWritePerformed",
    "requestPerformed",
    "buySellCommandGenerated",
    "autoOrderRequested",
    "portfolioApiSwitched",
    "runtimeCreated",
    "apiRouteCreated",
    "uiCreated",
    "sqlMigrationCreated",
    "envReadPerformed",
  ];
  for (const flag of falseFlags) {
    expectEq(String(flag), p[flag], false);
    expectEq(`safetyFlags.${String(flag)}`, (p.safetyFlags as unknown as Record<string, unknown>)[flag as string], false);
  }

  if (p.endpointChecks.length >= 6) {
    details.push(`PASS  endpointChecks.length = ${p.endpointChecks.length} (>= 6).`);
  } else {
    issues.push(`FAIL  endpointChecks.length = ${p.endpointChecks.length}, expected >= 6.`);
  }

  expectEq("runtimeHealth.observationWindowMinutes", p.runtimeHealth.observationWindowMinutes, 30);

  for (const label of ["不產生買賣指令", "no Supabase", "Production Alias Safety Smoke Test Evidence"]) {
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
  '"test:production-alias-safety-smoke-test-evidence": "node --require ./scripts/register-typescript.cjs ./scripts/validate-production-alias-safety-smoke-test-evidence.ts"',
];

const README_TERMS: string[] = [
  "V43",
  "Production Alias Safety Smoke Test Evidence",
  "docs/production-alias-safety-smoke-test-evidence.md",
  "use-cases/deployment/production-alias-safety-smoke-test-evidence-contract.ts",
  "use-cases/deployment/build-production-alias-safety-smoke-test-evidence-contract.ts",
  "npm run test:production-alias-safety-smoke-test-evidence",
  "allen-stock-dashboard.vercel.app",
  "SMOKE_TEST_PASSED",
  "fixture/mock safe mode",
  "V43 不接真實行情",
  "V43 不連 Supabase",
  "V44 Staging Supabase Read-only Safety Gate",
];

// ---------------------------------------------------------------------------
// Gate 6: Safety checks
// ---------------------------------------------------------------------------

const DB_WRITE_TOKENS = ["insert(", "upsert(", "update(", "delete("];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  // 6a. Contract + builder code: no external request / supabase / env / clock /
  //     DB writes.
  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
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
    ];
    for (const token of forbidden) {
      if (lower.includes(token)) {
        issues.push(`FAIL  Forbidden "${token}" found in ${rel}.`);
      } else {
        details.push(`PASS  No "${token}" in ${rel} code.`);
      }
    }
  }

  // 6b. No new API route / UI component / SQL migration for this evidence round.
  const forbiddenArtifacts = [
    "app/api/portfolio/production-alias-safety-smoke-test-evidence/route.ts",
    "components/production-alias-safety-smoke-test-evidence.tsx",
    "supabase/production_alias_safety_smoke_test_evidence.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V43.`);
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
const payloadCheck = checkPayload();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
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

const summary: EvidenceSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_checks: contractCheck.status,
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
