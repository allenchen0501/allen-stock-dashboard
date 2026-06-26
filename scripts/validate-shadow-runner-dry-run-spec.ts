/**
 * Shadow Runner Dry-run Spec Validator — V49
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

const builderModule = require("../use-cases/deployment/build-shadow-runner-dry-run-spec-contract") as typeof import("../use-cases/deployment/build-shadow-runner-dry-run-spec-contract");
const { buildShadowRunnerDryRunSpecContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface RunnerSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  runner_step_spec_count: number;
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

const DOC_REL = "docs/shadow-runner-dry-run-spec.md";
const CONTRACT_REL = "use-cases/deployment/shadow-runner-dry-run-spec-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-shadow-runner-dry-run-spec-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Shadow runner dry-run doc (new)", rel: DOC_REL },
    { label: "Shadow runner dry-run contract (new)", rel: CONTRACT_REL },
    { label: "Shadow runner dry-run builder (new)", rel: BUILDER_REL },
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
  "V49",
  "Shadow Runner Dry-run Spec",
  "shadow runner dry-run",
  "fixture-to-fixture self-check",
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
  "PORTFOLIO_SOURCE_MODE",
  "hardcoded",
  "dry-run must not connect to staging",
  "dry-run evidence must not be persisted to DB",
  "dry-run mismatch must not promote staging",
  "empty / stale / error result must not override fixture/hardcoded",
  "kill switch",
  "V50",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "ShadowRunnerDryRunDeploymentTarget",
  "ShadowRunnerDryRunDecision",
  "ShadowRunnerDryRunExecutionMode",
  "ShadowRunnerDryRunInputSource",
  "ShadowRunnerDryRunOutputArtifact",
  "ShadowRunnerDryRunFailureBehavior",
  "ShadowRunnerDryRunKillSwitchBehavior",
  "ShadowRunnerDryRunStepSpec",
  "ShadowRunnerDryRunEvidenceReportShape",
  "ShadowRunnerDryRunSpecBundle",
  "SHADOW_RUNNER_DRY_RUN_SPEC_CONTRACT_VERSION",
  "SHADOW_RUNNER_DRY_RUN_SPEC_STEP_NAMES",
  "SHADOW_RUNNER_DRY_RUN_SPEC_ALLOWED_DECISIONS",
  "SHADOW_RUNNER_DRY_RUN_SPEC_SAFETY_LABELS",
  "SHADOW_RUNNER_DRY_RUN_SPEC_DISALLOWED_TERMS",
  "READY_FOR_REVIEW",
  "NO_GO",
  "FIXTURE_TO_FIXTURE_DRY_RUN_ONLY",
  "shadowRunnerDryRunSpecDefined: true",
  "shadowRunnerRuntimeCreated: false",
  "shadowRunnerExecuted: false",
  "fixtureToFixtureSelfCheckDefined: true",
  "fixtureToStagingComparisonPerformed: false",
  "stagingSupabasePlanned: true",
  "stagingSupabaseConnected: false",
  "stagingReadPerformed: false",
  "stagingWritePerformed: false",
  "shadowComparisonPerformed: false",
  "shadowResultPersisted: false",
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
  "portfolioSourceModeChanged: false",
  "realMarketDataEnabled: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "killSwitchDefaultEnabled: true",
  "fixtureCanBeOverriddenByStaging: false",
  "hardcodedCanBeOverriddenByStaging: false",
  "mismatchCanPromoteStaging: false",
  "dryRunCanPromoteStaging: false",
  "emptyResultCanOverrideHardcoded: false",
  "staleResultCanOverrideHardcoded: false",
  "errorResultCanOverrideHardcoded: false",
  "promotionAllowed: false",
  "portfolioApiSwitchAllowed: false",
  "persisted: false",
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

const EXPECTED_STEPS = [
  "loadFixtureBaseline",
  "runFixtureToFixtureSelfCheck",
  "calculateShadowComparisonEvidence",
  "classifyMismatchAndDataInsufficient",
  "evaluateKillSwitchAndPromotionGuard",
  "buildShadowDryRunReport",
];

const VALID_EXECUTION_MODE = new Set(["SPEC_ONLY", "FIXTURE_TO_FIXTURE_DRY_RUN_ONLY", "NO_RUNTIME_CREATED"]);
const VALID_SOURCE_MODE = new Set(["hardcoded", "fixture", "mock_or_contract"]);
const VALID_RUNNER_MODE = new Set(["dry_run_spec", "spec_only"]);

function checkPayload(): { result: CheckResult; stepCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildShadowRunnerDryRunSpecContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V49");
  expectEq("specName", p.specName, "Shadow Runner Dry-run Spec");
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
  expectEq("shadowRunnerDryRunSpecDefined", p.shadowRunnerDryRunSpecDefined, true);
  expectEq("shadowRunnerRuntimeCreated", p.shadowRunnerRuntimeCreated, false);
  expectEq("shadowRunnerExecuted", p.shadowRunnerExecuted, false);
  expectEq("fixtureToFixtureSelfCheckDefined", p.fixtureToFixtureSelfCheckDefined, true);
  expectEq("fixtureToStagingComparisonPerformed", p.fixtureToStagingComparisonPerformed, false);
  expectEq("stagingSupabasePlanned", p.stagingSupabasePlanned, true);
  expectEq("stagingSupabaseConnected", p.stagingSupabaseConnected, false);
  expectEq("stagingReadPerformed", p.stagingReadPerformed, false);
  expectEq("stagingWritePerformed", p.stagingWritePerformed, false);
  expectEq("shadowComparisonPerformed", p.shadowComparisonPerformed, false);
  expectEq("shadowResultPersisted", p.shadowResultPersisted, false);
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
  expectEq("portfolioSourceModeChanged", p.portfolioSourceModeChanged, false);
  expectEq("realMarketDataEnabled", p.realMarketDataEnabled, false);
  expectEq("buySellCommandGenerated", p.buySellCommandGenerated, false);
  expectEq("autoOrderRequested", p.autoOrderRequested, false);
  expectEq("killSwitchDefaultEnabled", p.killSwitchDefaultEnabled, true);
  expectEq("fixtureCanBeOverriddenByStaging", p.fixtureCanBeOverriddenByStaging, false);
  expectEq("hardcodedCanBeOverriddenByStaging", p.hardcodedCanBeOverriddenByStaging, false);
  expectEq("mismatchCanPromoteStaging", p.mismatchCanPromoteStaging, false);
  expectEq("dryRunCanPromoteStaging", p.dryRunCanPromoteStaging, false);
  expectEq("emptyResultCanOverrideHardcoded", p.emptyResultCanOverrideHardcoded, false);
  expectEq("staleResultCanOverrideHardcoded", p.staleResultCanOverrideHardcoded, false);
  expectEq("errorResultCanOverrideHardcoded", p.errorResultCanOverrideHardcoded, false);

  const steps = p.runnerStepSpecs;
  if (steps.length >= 6) {
    details.push(`PASS  runnerStepSpecs.length = ${steps.length} (>= 6).`);
  } else {
    issues.push(`FAIL  runnerStepSpecs.length = ${steps.length}, expected >= 6.`);
  }

  for (const name of EXPECTED_STEPS) {
    if (steps.some((s) => s.stepName === name)) details.push(`PASS  runner includes step ${name}.`);
    else issues.push(`FAIL  runner missing step ${name}.`);
  }

  // Per-step policy expectations.
  let policyOk = true;
  for (const s of steps) {
    const id = s.stepName;
    if (s.requiresSupabase as boolean) { policyOk = false; issues.push(`FAIL  ${id} requiresSupabase must be false.`); }
    if (s.requiresEnv as boolean) { policyOk = false; issues.push(`FAIL  ${id} requiresEnv must be false.`); }
    if (s.performsExternalRequest as boolean) { policyOk = false; issues.push(`FAIL  ${id} performsExternalRequest must be false.`); }
    if (s.performsDbWrite as boolean) { policyOk = false; issues.push(`FAIL  ${id} performsDbWrite must be false.`); }
    if (s.canPromoteStaging as boolean) { policyOk = false; issues.push(`FAIL  ${id} canPromoteStaging must be false.`); }
    if (s.canSwitchPortfolioApi as boolean) { policyOk = false; issues.push(`FAIL  ${id} canSwitchPortfolioApi must be false.`); }
    if (!VALID_EXECUTION_MODE.has(s.executionMode)) { policyOk = false; issues.push(`FAIL  ${id} executionMode invalid.`); }
    if (s.verificationStatus !== "NOT_REVIEWED") { policyOk = false; issues.push(`FAIL  ${id} verificationStatus must be NOT_REVIEWED.`); }
  }
  if (policyOk) details.push("PASS  All runner step specs satisfy policy expectations.");

  // Evidence report shape expectations.
  const r = p.evidenceReportShape;
  expectEq("evidenceReportShape.promotionAllowed", r.promotionAllowed, false);
  expectEq("evidenceReportShape.portfolioApiSwitchAllowed", r.portfolioApiSwitchAllowed, false);
  expectEq("evidenceReportShape.persisted", r.persisted, false);
  if (VALID_SOURCE_MODE.has(r.sourceMode)) details.push(`PASS  evidenceReportShape.sourceMode = ${r.sourceMode}.`);
  else issues.push(`FAIL  evidenceReportShape.sourceMode invalid: ${r.sourceMode}.`);
  if (VALID_RUNNER_MODE.has(r.runnerMode)) details.push(`PASS  evidenceReportShape.runnerMode = ${r.runnerMode}.`);
  else issues.push(`FAIL  evidenceReportShape.runnerMode invalid: ${r.runnerMode}.`);
  for (const f of ["passCount", "mismatchCount", "dataInsufficientCount", "staleCount", "errorCount", "blockedCount"] as const) {
    if (typeof r[f] === "number") details.push(`PASS  evidenceReportShape.${f} present.`);
    else issues.push(`FAIL  evidenceReportShape.${f} must be a number.`);
  }

  for (const label of ["no buy/sell command", "no Supabase connection", "fixture-to-fixture self-check"]) {
    if (p.safetyLabels.includes(label)) details.push(`PASS  safetyLabels includes "${label}".`);
    else issues.push(`FAIL  safetyLabels must include "${label}".`);
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { result: { name: "payload_checks", status, details: [...details, ...issues] }, stepCount: steps.length };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:shadow-runner-dry-run-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-shadow-runner-dry-run-spec.ts"',
];

const README_TERMS: string[] = [
  "V49",
  "Shadow Runner Dry-run Spec",
  "docs/shadow-runner-dry-run-spec.md",
  "use-cases/deployment/shadow-runner-dry-run-spec-contract.ts",
  "use-cases/deployment/build-shadow-runner-dry-run-spec-contract.ts",
  "npm run test:shadow-runner-dry-run-spec",
  "shadow runner dry-run",
  "fixture-to-fixture self-check",
  "PORTFOLIO_SOURCE_MODE",
  "hardcoded",
  "fixture/mock UI 仍維持現狀",
  "V50",
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
    "app/api/portfolio/shadow-runner-dry-run-spec/route.ts",
    "components/shadow-runner-dry-run-spec.tsx",
    "supabase/shadow_runner_dry_run_spec.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V49.`);
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
const { result: payloadCheck, stepCount } = checkPayload();
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

const summary: RunnerSummary = {
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
  runner_step_spec_count: stepCount,
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
