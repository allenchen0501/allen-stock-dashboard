/**
 * Staging Read-only Connection Dry-run Plan Validator — V57
 *
 * Contract / spec-only check. Imports the pure builder + constants and inspects
 * the plan bundle; it does NOT start a Next.js server, make any HTTP request,
 * connect to Supabase, read env keys, build a runtime, or write data.
 *
 * Safety scanning is case-insensitive: contract / builder source is lower-cased
 * before scanning forbidden tokens.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/deployment/build-staging-readonly-connection-dry-run-plan-contract") as typeof import("../use-cases/deployment/build-staging-readonly-connection-dry-run-plan-contract");
const { buildStagingReadonlyConnectionDryRunPlanContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface PlanSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  plan_step_count: number;
  plan_phases_covered: number;
  decision: string;
  manual_signoff_required: boolean;
  manual_signoff_completed: boolean;
  manual_signoff_evidence_provided: boolean;
  staging_connection_allowed: boolean;
  staging_connection_review_allowed: boolean;
  staging_dry_run_execution_allowed: boolean;
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
  actual_dry_run_executed: false;
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
    if (body.includes(term)) details.push(`PASS  "${term}" present in ${fileLabel}.`);
    else issues.push(`FAIL  "${term}" not found in ${fileLabel}.`);
  }
  return { name, status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DOC_REL = "docs/staging-readonly-connection-dry-run-plan.md";
const CONTRACT_REL = "use-cases/deployment/staging-readonly-connection-dry-run-plan-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-staging-readonly-connection-dry-run-plan-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Dry-run plan doc (new)", rel: DOC_REL },
    { label: "Dry-run plan contract (new)", rel: CONTRACT_REL },
    { label: "Dry-run plan builder (new)", rel: BUILDER_REL },
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
  "V57",
  "Staging Read-only Connection Dry-run Plan",
  "dry-run plan",
  "not actual dry-run execution",
  "not actual connection",
  "not production trading system",
  "no real market data",
  "no Supabase connection",
  "no env key",
  "no DB write",
  "no staging write",
  "no production write",
  "no SQL migration",
  "no api switch",
  "no buy/sell command",
  "no auto order",
  "V56 manual sign-off evidence spec exists but evidence remains not provided",
  "V55 connection review gate exists but decision remains NO_GO",
  "manualSignoffRequired = true",
  "manualSignoffCompleted = false",
  "manualSignoffEvidenceProvided = false",
  "stagingConnectionAllowed = false",
  "stagingConnectionReviewAllowed = false",
  "stagingDryRunExecutionAllowed = false",
  "actualConnectionImplemented = false",
  "actualConnectionAttempted = false",
  "productionReadinessAllowed = false",
  "serviceRoleAllowedInAppRuntime = false",
  "dashboardReadonlyRoleRequired = true",
  "readOnlySelectOnlyRequired = true",
  "writeOperationsBlocked = true",
  "shadowOnlyRequired = true",
  "PORTFOLIO_SOURCE_MODE",
  "hardcoded",
  "/api/portfolio must not be switched",
  "fixture/hardcoded must not be overridden by staging",
  "mismatch must not promote staging",
  "empty / stale / error result must not override hardcoded",
  "kill switch",
  "V58 Manual Sign-off Evidence Instance",
  "V58 Staging Read-only Dry-run Execution Gate",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "StagingReadonlyDryRunPlanDeploymentTarget",
  "StagingReadonlyDryRunPlanDecision",
  "StagingReadonlyDryRunPlanPhase",
  "StagingReadonlyDryRunPlanExecutionMode",
  "StagingReadonlyDryRunPlanAllowedOperation",
  "StagingReadonlyDryRunPlanStatus",
  "StagingReadonlyDryRunPlanStep",
  "StagingReadonlyDryRunPlanBundle",
  "STAGING_READONLY_DRY_RUN_PLAN_CONTRACT_VERSION",
  "STAGING_READONLY_DRY_RUN_PLAN_PHASES",
  "STAGING_READONLY_DRY_RUN_PLAN_ALLOWED_DECISIONS",
  "STAGING_READONLY_DRY_RUN_PLAN_SAFETY_LABELS",
  "STAGING_READONLY_DRY_RUN_PLAN_DISALLOWED_TERMS",
  "NO_GO",
  "READY_FOR_REVIEW",
  "dryRunPlanDefined: true",
  "actualDryRunExecuted: false",
  "actualConnectionImplemented: false",
  "actualConnectionAttempted: false",
  "manualSignoffRequired: true",
  "manualSignoffCompleted: false",
  "manualSignoffEvidenceProvided: false",
  "v56ManualSignoffSpecExists: true",
  "v55ConnectionReviewGateExists: true",
  'v55Decision: "NO_GO"',
  "stagingConnectionAllowed: false",
  "stagingConnectionReviewAllowed: false",
  "stagingDryRunExecutionAllowed: false",
  "productionReadinessAllowed: false",
  "stagingSupabaseConnected: false",
  "stagingReadPerformed: false",
  "stagingWritePerformed: false",
  "productionSupabaseConnected: false",
  "productionWritePerformed: false",
  "envReadPerformed: false",
  "databaseWritePerformed: false",
  "requestPerformed: false",
  "apiRouteCreated: false",
  "uiCreated: false",
  "sqlMigrationCreated: false",
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
  "serviceRoleAllowedInAppRuntime: false",
  "anonRoleAllowed: false",
  "dashboardReadonlyRoleRequired: true",
  "readOnlySelectOnlyRequired: true",
  "writeOperationsBlocked: true",
  "shadowOnlyRequired: true",
  "portfolioApiMustRemainHardcoded: true",
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
  if (stripComments(body).includes("PRODUCTION_READY")) {
    return { name: "no_production_ready", status: "FAIL", details: ['FAIL  Forbidden "PRODUCTION_READY" present in contract.'] };
  }
  return { name: "no_production_ready", status: "PASS", details: ['PASS  No "PRODUCTION_READY" in contract.'] };
}

// ---------------------------------------------------------------------------
// Gate 4: Payload checks (call pure function)
// ---------------------------------------------------------------------------

const EXPECTED_PHASES = [
  "PRECHECK", "MANUAL_SIGNOFF", "ENVIRONMENT_REVIEW", "RLS_REVIEW", "ROLE_REVIEW", "DRY_RUN_PREPARATION",
  "READ_ONLY_PROBE_PLAN", "SHADOW_COMPARISON_PLAN", "ERROR_HANDLING", "KILL_SWITCH", "ROLLBACK", "EVIDENCE_CAPTURE",
  "FINAL_GO_NO_GO",
];

const VALID_ALLOWED_OP = new Set([
  "DOCUMENT_REVIEW_ONLY", "MANUAL_DASHBOARD_REVIEW_ONLY", "SELECT_ONLY_FUTURE_PLAN", "INTERNAL_FIXTURE_ONLY", "NO_OPERATION",
]);

function checkPayload(): { result: CheckResult; stepCount: number; phasesCovered: number; decision: string } {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildStagingReadonlyConnectionDryRunPlanContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", p.contractVersion, "V57");
  expectEq("planName", p.planName, "Staging Read-only Connection Dry-run Plan");
  expectEq("deploymentTarget", p.deploymentTarget, "staging");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);
  expectEq("decision", p.decision, "NO_GO");
  if ((p.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');
  else details.push('PASS  decision is not "PRODUCTION_READY".');
  expectEq("v55Decision", p.v55Decision, "NO_GO");

  const trueFlags = [
    "dryRunPlanDefined", "manualSignoffRequired", "v56ManualSignoffSpecExists", "v55ConnectionReviewGateExists",
    "killSwitchDefaultEnabled", "dashboardReadonlyRoleRequired", "readOnlySelectOnlyRequired", "writeOperationsBlocked",
    "shadowOnlyRequired", "portfolioApiMustRemainHardcoded",
  ] as const;
  const falseFlags = [
    "actualDryRunExecuted", "actualConnectionImplemented", "actualConnectionAttempted", "manualSignoffCompleted",
    "manualSignoffEvidenceProvided", "stagingConnectionAllowed", "stagingConnectionReviewAllowed",
    "stagingDryRunExecutionAllowed", "productionReadinessAllowed", "stagingSupabaseConnected", "stagingReadPerformed",
    "stagingWritePerformed", "productionSupabaseConnected", "productionWritePerformed", "envReadPerformed",
    "databaseWritePerformed", "requestPerformed", "apiRouteCreated", "uiCreated", "sqlMigrationCreated", "runtimeCreated",
    "shadowRunnerRuntimeCreated", "shadowRunnerExecuted", "shadowComparisonPerformed", "shadowResultPersisted",
    "portfolioApiSwitched", "portfolioSourceModeChanged", "realMarketDataEnabled", "buySellCommandGenerated",
    "autoOrderRequested", "serviceRoleAllowedInAppRuntime", "anonRoleAllowed", "fixtureCanBeOverriddenByStaging",
    "hardcodedCanBeOverriddenByStaging", "mismatchCanPromoteStaging", "dryRunCanPromoteStaging",
    "emptyResultCanOverrideHardcoded", "staleResultCanOverrideHardcoded", "errorResultCanOverrideHardcoded",
  ] as const;
  const rec = p as unknown as Record<string, unknown>;
  for (const f of trueFlags) expectEq(f, rec[f], true);
  for (const f of falseFlags) expectEq(f, rec[f], false);

  const steps = p.planSteps;
  if (steps.length >= 20) details.push(`PASS  planSteps.length = ${steps.length} (>= 20).`);
  else issues.push(`FAIL  planSteps.length = ${steps.length}, expected >= 20.`);

  const coveredPhases = new Set(steps.map((s) => s.phase));
  for (const ph of EXPECTED_PHASES) {
    if (coveredPhases.has(ph as never)) details.push(`PASS  phase covered: ${ph}.`);
    else issues.push(`FAIL  phase not covered: ${ph}.`);
  }

  // Per-step policy.
  let policyOk = true;
  for (const s of steps) {
    const id = s.stepId;
    if (!s.requiredBeforeStep || s.requiredBeforeStep.length === 0) { policyOk = false; issues.push(`FAIL  ${id} requiredBeforeStep empty.`); }
    if (!s.expectedInput || s.expectedInput.length === 0) { policyOk = false; issues.push(`FAIL  ${id} expectedInput empty.`); }
    if (!s.expectedOutput || s.expectedOutput.length === 0) { policyOk = false; issues.push(`FAIL  ${id} expectedOutput empty.`); }
    if (!VALID_ALLOWED_OP.has(s.allowedOperation)) { policyOk = false; issues.push(`FAIL  ${id} allowedOperation invalid.`); }
    if (!s.forbiddenOperation || s.forbiddenOperation.length === 0) { policyOk = false; issues.push(`FAIL  ${id} forbiddenOperation empty.`); }
    if (!s.killSwitchBehavior || s.killSwitchBehavior.length === 0) { policyOk = false; issues.push(`FAIL  ${id} killSwitchBehavior empty.`); }
    if (!s.rollbackBehavior || s.rollbackBehavior.length === 0) { policyOk = false; issues.push(`FAIL  ${id} rollbackBehavior empty.`); }
    if (!s.evidenceToCapture || s.evidenceToCapture.length === 0) { policyOk = false; issues.push(`FAIL  ${id} evidenceToCapture empty.`); }
    for (const b of ["blocksDryRunExecution", "blocksActualConnection", "blocksProductionReadiness", "manualReviewRequired"] as const) {
      if (typeof s[b] !== "boolean") { policyOk = false; issues.push(`FAIL  ${id} ${b} not boolean.`); }
    }
  }
  if (policyOk) details.push("PASS  All plan steps satisfy policy expectations.");

  if (p.decision !== "NO_GO") issues.push(`FAIL  decision must be NO_GO while sign-off incomplete (got ${p.decision}).`);
  else details.push("PASS  decision is NO_GO (sign-off incomplete).");

  for (const label of ["no buy/sell command", "no Supabase connection", "Staging Read-only Connection Dry-run Plan"]) {
    if (p.safetyLabels.includes(label)) details.push(`PASS  safetyLabels includes "${label}".`);
    else issues.push(`FAIL  safetyLabels must include "${label}".`);
  }

  return {
    result: { name: "payload_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    stepCount: steps.length,
    phasesCovered: coveredPhases.size,
    decision: p.decision,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:staging-readonly-connection-dry-run-plan": "node --require ./scripts/register-typescript.cjs ./scripts/validate-staging-readonly-connection-dry-run-plan.ts"',
];

const README_TERMS: string[] = [
  "V57",
  "Staging Read-only Connection Dry-run Plan",
  "docs/staging-readonly-connection-dry-run-plan.md",
  "use-cases/deployment/staging-readonly-connection-dry-run-plan-contract.ts",
  "use-cases/deployment/build-staging-readonly-connection-dry-run-plan-contract.ts",
  "npm run test:staging-readonly-connection-dry-run-plan",
  "manualSignoffCompleted = false",
  "stagingConnectionAllowed = false",
  "stagingDryRunExecutionAllowed = false",
  "V58 Manual Sign-off Evidence Instance",
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
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" found in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel} code.`);
    }
  }

  const forbiddenArtifacts = [
    "app/api/portfolio/staging-readonly-connection-dry-run-plan/route.ts",
    "components/staging-readonly-connection-dry-run-plan.tsx",
    "supabase/staging_readonly_connection_dry_run_plan.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V57.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/api/war-room/route.ts",
    "app/api/portfolio/holding-defense/route.ts",
    "app/api/portfolio/intraday-defense/route.ts",
    "app/api/portfolio/runtime-pilot-dry-run/route.ts",
    "app/api/portfolio/first-authorized-source-dry-run/route.ts",
    "app/api/portfolio/shadow-runner-dry-run/route.ts",
    "components/runtime-pilot-monitoring.tsx",
    "components/first-authorized-source-dry-run-monitoring.tsx",
    "components/shadow-runner-dry-run-monitoring.tsx",
    "repositories/portfolio-repository.ts",
    "services/stocks/providers/yahoo-stock-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must not be modified or deleted.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
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
const { result: payloadCheck, stepCount, phasesCovered, decision } = checkPayload();
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

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const p = buildStagingReadonlyConnectionDryRunPlanContract({ generatedAt: FIXED_TS });

const summary: PlanSummary = {
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
  plan_step_count: stepCount,
  plan_phases_covered: phasesCovered,
  decision,
  manual_signoff_required: p.manualSignoffRequired,
  manual_signoff_completed: p.manualSignoffCompleted,
  manual_signoff_evidence_provided: p.manualSignoffEvidenceProvided,
  staging_connection_allowed: p.stagingConnectionAllowed,
  staging_connection_review_allowed: p.stagingConnectionReviewAllowed,
  staging_dry_run_execution_allowed: p.stagingDryRunExecutionAllowed,
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
  actual_dry_run_executed: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
