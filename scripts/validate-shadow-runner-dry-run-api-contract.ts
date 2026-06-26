/**
 * Shadow Runner Dry-run API Contract Validator — V50
 *
 * Contract / spec-only / fixture-only check. Imports the pure builder + constants
 * and inspects the API contract bundle shape; it does NOT start a Next.js server,
 * make any HTTP request, connect to Supabase, read env keys, build a runtime,
 * write data, or add a route.
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

interface ApiContractSummary {
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

const DOC_REL = "docs/shadow-runner-dry-run-api-contract.md";
const CONTRACT_REL = "use-cases/deployment/shadow-runner-dry-run-api-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-shadow-runner-dry-run-api-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "API contract doc (new)", rel: DOC_REL },
    { label: "API contract (new)", rel: CONTRACT_REL },
    { label: "API contract builder (new)", rel: BUILDER_REL },
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
  "V50",
  "Shadow Runner Dry-run API Contract",
  "shadow runner dry-run API contract",
  "planned endpoint is /api/portfolio/shadow-runner-dry-run",
  "not API route implementation",
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
  "responseSource must remain mock_or_contract",
  "sourceMode must remain fixture",
  "PORTFOLIO_SOURCE_MODE",
  "hardcoded",
  "fixture/hardcoded must not be overridden by staging",
  "dry-run evidence must not be persisted to DB",
  "dry-run mismatch must not promote staging",
  "empty / stale / error result must not override hardcoded",
  "kill switch",
  "V51 Shadow Runner Dry-run API Route",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "ShadowRunnerDryRunApiDecision",
  "ShadowRunnerDryRunApiResponseSource",
  "ShadowRunnerDryRunApiSourceMode",
  "ShadowRunnerDryRunApiMethod",
  "ShadowRunnerDryRunApiDryRunBundleShape",
  "ShadowRunnerDryRunApiSafetyFlags",
  "ShadowRunnerDryRunApiResponsePayload",
  "ShadowRunnerDryRunApiContractBundle",
  "SHADOW_RUNNER_DRY_RUN_API_CONTRACT_VERSION",
  "SHADOW_RUNNER_DRY_RUN_API_PLANNED_ENDPOINT",
  "SHADOW_RUNNER_DRY_RUN_API_METHOD",
  "SHADOW_RUNNER_DRY_RUN_API_ALLOWED_DECISIONS",
  "SHADOW_RUNNER_DRY_RUN_API_SAFETY_LABELS",
  "SHADOW_RUNNER_DRY_RUN_API_DISALLOWED_TERMS",
  "READY_FOR_REVIEW",
  "NO_GO",
  "/api/portfolio/shadow-runner-dry-run",
  "mock_or_contract",
  "fixture",
  "routeCreated: false",
  "apiRouteCreated: false",
  "routeImplemented: false",
  "requestPerformed: false",
  "envReadPerformed: false",
  "supabaseConnected: false",
  "stagingSupabaseConnected: false",
  "productionSupabaseConnected: false",
  "stagingReadPerformed: false",
  "stagingWritePerformed: false",
  "productionWritePerformed: false",
  "databaseWritePerformed: false",
  "runtimeCreated: false",
  "shadowRunnerRuntimeCreated: false",
  "shadowRunnerExecuted: false",
  "shadowComparisonPerformed: false",
  "shadowResultPersisted: false",
  "portfolioApiSwitched: false",
  "portfolioSourceModeChanged: false",
  "realMarketDataEnabled: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "killSwitchDefaultEnabled: true",
  "promotionAllowed: false",
  "portfolioApiSwitchAllowed: false",
  "persisted: false",
  "fixtureCanBeOverriddenByStaging: false",
  "hardcodedCanBeOverriddenByStaging: false",
  "mismatchCanPromoteStaging: false",
  "dryRunCanPromoteStaging: false",
  "emptyResultCanOverrideHardcoded: false",
  "staleResultCanOverrideHardcoded: false",
  "errorResultCanOverrideHardcoded: false",
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

const VALID_SOURCE_MODE = new Set(["fixture", "hardcoded", "mock_or_contract"]);
const VALID_RUNNER_MODE = new Set(["dry_run_spec", "spec_only"]);

function checkPayload(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildShadowRunnerDryRunApiContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("apiContractVersion", p.apiContractVersion, "V50");
  expectEq("apiName", p.apiName, "Shadow Runner Dry-run API Contract");
  expectEq("plannedEndpoint", p.plannedEndpoint, "/api/portfolio/shadow-runner-dry-run");
  expectEq("method", p.method, "GET");
  expectEq("responseSource", p.responseSource, "mock_or_contract");
  expectEq("sourceMode", p.sourceMode, "fixture");
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

  // Top-level frozen safety flags.
  const falseFlags = [
    "routeCreated", "apiRouteCreated", "routeImplemented", "requestPerformed", "envReadPerformed",
    "supabaseConnected", "stagingSupabaseConnected", "productionSupabaseConnected", "stagingReadPerformed",
    "stagingWritePerformed", "productionWritePerformed", "databaseWritePerformed", "runtimeCreated",
    "shadowRunnerRuntimeCreated", "shadowRunnerExecuted", "shadowComparisonPerformed", "shadowResultPersisted",
    "portfolioApiSwitched", "portfolioSourceModeChanged", "realMarketDataEnabled", "buySellCommandGenerated",
    "autoOrderRequested", "promotionAllowed", "portfolioApiSwitchAllowed", "persisted",
    "fixtureCanBeOverriddenByStaging", "hardcodedCanBeOverriddenByStaging", "mismatchCanPromoteStaging",
    "dryRunCanPromoteStaging", "emptyResultCanOverrideHardcoded", "staleResultCanOverrideHardcoded",
    "errorResultCanOverrideHardcoded",
  ] as const;
  const pRec = p as unknown as Record<string, unknown>;
  for (const f of falseFlags) {
    expectEq(f, pRec[f], false);
  }
  expectEq("killSwitchDefaultEnabled", p.killSwitchDefaultEnabled, true);

  // Response payload shape.
  const rp = p.responsePayload;
  expectEq("responsePayload.ok", rp.ok, true);
  expectEq("responsePayload.apiContractVersion", rp.apiContractVersion, "V50");
  expectEq("responsePayload.responseSource", rp.responseSource, "mock_or_contract");
  expectEq("responsePayload.sourceMode", rp.sourceMode, "fixture");
  expectEq("responsePayload.plannedEndpoint", rp.plannedEndpoint, "/api/portfolio/shadow-runner-dry-run");
  expectEq("responsePayload.method", rp.method, "GET");
  for (const key of ["dryRunBundle", "evidenceReport", "safetyFlags", "warnings", "nextRequiredActions"] as const) {
    if (key in rp) details.push(`PASS  responsePayload.${key} present.`);
    else issues.push(`FAIL  responsePayload.${key} missing.`);
  }

  // dryRunBundle expectations (V49 semantics).
  const b = rp.dryRunBundle;
  expectEq("dryRunBundle.contractVersion", b.contractVersion, "V49");
  expectEq("dryRunBundle.specName", b.specName, "Shadow Runner Dry-run Spec");
  expectEq("dryRunBundle.runnerMode", b.runnerMode, "dry_run_spec");
  expectEq("dryRunBundle.fixtureToFixtureSelfCheckDefined", b.fixtureToFixtureSelfCheckDefined, true);
  expectEq("dryRunBundle.shadowRunnerRuntimeCreated", b.shadowRunnerRuntimeCreated, false);
  expectEq("dryRunBundle.shadowRunnerExecuted", b.shadowRunnerExecuted, false);
  expectEq("dryRunBundle.fixtureToStagingComparisonPerformed", b.fixtureToStagingComparisonPerformed, false);

  // evidenceReport expectations.
  const r = rp.evidenceReport;
  expectEq("evidenceReport.promotionAllowed", r.promotionAllowed, false);
  expectEq("evidenceReport.portfolioApiSwitchAllowed", r.portfolioApiSwitchAllowed, false);
  expectEq("evidenceReport.persisted", r.persisted, false);
  if (VALID_SOURCE_MODE.has(r.sourceMode)) details.push(`PASS  evidenceReport.sourceMode = ${r.sourceMode}.`);
  else issues.push(`FAIL  evidenceReport.sourceMode invalid: ${r.sourceMode}.`);
  if (VALID_RUNNER_MODE.has(r.runnerMode)) details.push(`PASS  evidenceReport.runnerMode = ${r.runnerMode}.`);
  else issues.push(`FAIL  evidenceReport.runnerMode invalid: ${r.runnerMode}.`);
  for (const f of ["passCount", "mismatchCount", "dataInsufficientCount", "staleCount", "errorCount", "blockedCount"] as const) {
    if (typeof r[f] === "number") details.push(`PASS  evidenceReport.${f} present.`);
    else issues.push(`FAIL  evidenceReport.${f} must be a number.`);
  }

  // safetyFlags expectations (all false except killSwitchDefaultEnabled).
  const sf = rp.safetyFlags as unknown as Record<string, unknown>;
  for (const f of falseFlags) {
    if (f in sf) expectEq(`safetyFlags.${f}`, sf[f], false);
  }
  expectEq("safetyFlags.killSwitchDefaultEnabled", rp.safetyFlags.killSwitchDefaultEnabled, true);

  for (const label of ["no buy/sell command", "no Supabase connection", "shadow runner dry-run API contract"]) {
    if (p.safetyLabels.includes(label)) details.push(`PASS  safetyLabels includes "${label}".`);
    else issues.push(`FAIL  safetyLabels must include "${label}".`);
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { name: "payload_checks", status, details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:shadow-runner-dry-run-api-contract": "node --require ./scripts/register-typescript.cjs ./scripts/validate-shadow-runner-dry-run-api-contract.ts"',
];

const README_TERMS: string[] = [
  "V50",
  "Shadow Runner Dry-run API Contract",
  "docs/shadow-runner-dry-run-api-contract.md",
  "use-cases/deployment/shadow-runner-dry-run-api-contract.ts",
  "use-cases/deployment/build-shadow-runner-dry-run-api-contract.ts",
  "npm run test:shadow-runner-dry-run-api-contract",
  "/api/portfolio/shadow-runner-dry-run",
  "mock_or_contract",
  "fixture",
  "PORTFOLIO_SOURCE_MODE",
  "hardcoded",
  "fixture/mock UI 仍維持現狀",
  "V51 Shadow Runner Dry-run API Route",
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
    // V51 sanctioned the fixture-only API route
    // app/api/portfolio/shadow-runner-dry-run/route.ts — after V51, the route's
    // existence is validated by the V51 route checker
    // (validate-shadow-runner-dry-run-api-route.ts), while the V50 contract flags
    // (routeCreated / apiRouteCreated / routeImplemented) remain false and the V50
    // doc still represents "contract only, not route implementation". No
    // Supabase / env / DB-write / promotion / api-switch safety flag is relaxed.
    "components/shadow-runner-dry-run-api-contract.tsx",
    "supabase/shadow_runner_dry_run_api_contract.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V50.`);
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

const summary: ApiContractSummary = {
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
