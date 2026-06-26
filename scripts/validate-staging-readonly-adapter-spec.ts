/**
 * Staging Read-only Adapter Spec Validator — V47
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

const builderModule = require("../use-cases/deployment/build-staging-readonly-adapter-spec-contract") as typeof import("../use-cases/deployment/build-staging-readonly-adapter-spec-contract");
const { buildStagingReadonlyAdapterSpecContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface AdapterSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  adapter_method_spec_count: number;
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

const DOC_REL = "docs/staging-readonly-adapter-spec.md";
const CONTRACT_REL = "use-cases/deployment/staging-readonly-adapter-spec-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-staging-readonly-adapter-spec-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Adapter spec doc (new)", rel: DOC_REL },
    { label: "Adapter spec contract (new)", rel: CONTRACT_REL },
    { label: "Adapter spec builder (new)", rel: BUILDER_REL },
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
  "V47",
  "Staging Read-only Adapter Spec",
  "staging read-only adapter",
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
  "PORTFOLIO_SOURCE_MODE",
  "hardcoded",
  "empty result must not override hardcoded",
  "stale result must not override hardcoded",
  "error result must not override hardcoded",
  "kill switch",
  "V48",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "StagingReadonlyAdapterDeploymentTarget",
  "StagingReadonlyAdapterDecision",
  "StagingReadonlyAdapterTableName",
  "StagingReadonlyAdapterAllowedOperation",
  "StagingReadonlyAdapterFallbackBehavior",
  "StagingReadonlyAdapterEmptyResultBehavior",
  "StagingReadonlyAdapterStaleResultBehavior",
  "StagingReadonlyAdapterErrorResultBehavior",
  "StagingReadonlyAdapterKillSwitchBehavior",
  "StagingReadonlyAdapterSourceModeRequirement",
  "StagingReadonlyAdapterAppRouteImpact",
  "StagingReadonlyAdapterMethodSpec",
  "StagingReadonlyAdapterSpecBundle",
  "STAGING_READONLY_ADAPTER_SPEC_CONTRACT_VERSION",
  "STAGING_READONLY_ADAPTER_SPEC_TABLES",
  "STAGING_READONLY_ADAPTER_SPEC_ALLOWED_DECISIONS",
  "STAGING_READONLY_ADAPTER_SPEC_SAFETY_LABELS",
  "STAGING_READONLY_ADAPTER_SPEC_DISALLOWED_TERMS",
  "READY_FOR_REVIEW",
  "NO_GO",
  "select_only",
  "stagingSupabasePlanned: true",
  "stagingAdapterSpecDefined: true",
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
  "portfolioSourceModeChanged: false",
  "realMarketDataEnabled: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "killSwitchDefaultEnabled: true",
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

const EXPECTED_TABLES = [
  "portfolio_stocks",
  "watchlist_stocks",
  "market_snapshots",
  "stock_snapshots",
  "v85_scores",
];

const VALID_FALLBACK = new Set(["FALLBACK_TO_HARDCODED", "FALLBACK_TO_FIXTURE_CONTRACT", "RETURN_DATA_INSUFFICIENT"]);
const VALID_EMPTY = new Set(["DO_NOT_OVERRIDE_HARDCODED", "RETURN_DATA_INSUFFICIENT"]);
const VALID_STALE = new Set(["DOWNGRADE_TO_STALE", "DO_NOT_OVERRIDE_HARDCODED", "RETURN_DATA_INSUFFICIENT"]);
const VALID_ERROR = new Set(["FALLBACK_TO_HARDCODED", "RETURN_DATA_INSUFFICIENT", "BLOCK_ADAPTER"]);
const VALID_KILL = new Set(["BLOCK_STAGING_ADAPTER", "FORCE_HARDCODED_MODE"]);
const VALID_SOURCE_MODE = new Set([
  "PORTFOLIO_SOURCE_MODE_MUST_REMAIN_HARDCODED",
  "STAGING_MODE_NOT_ENABLED",
  "MANUAL_SIGNOFF_REQUIRED",
]);
const VALID_ROUTE_IMPACT = new Set(["NO_ROUTE_CHANGE", "NO_API_SWITCH", "INTERNAL_SPEC_ONLY"]);

function checkPayload(): { result: CheckResult; methodCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildStagingReadonlyAdapterSpecContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V47");
  expectEq("specName", p.specName, "Staging Read-only Adapter Spec");
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
  expectEq("stagingAdapterSpecDefined", p.stagingAdapterSpecDefined, true);
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
  expectEq("portfolioSourceModeChanged", p.portfolioSourceModeChanged, false);
  expectEq("realMarketDataEnabled", p.realMarketDataEnabled, false);
  expectEq("buySellCommandGenerated", p.buySellCommandGenerated, false);
  expectEq("autoOrderRequested", p.autoOrderRequested, false);
  expectEq("killSwitchDefaultEnabled", p.killSwitchDefaultEnabled, true);
  expectEq("emptyResultCanOverrideHardcoded", p.emptyResultCanOverrideHardcoded, false);
  expectEq("staleResultCanOverrideHardcoded", p.staleResultCanOverrideHardcoded, false);
  expectEq("errorResultCanOverrideHardcoded", p.errorResultCanOverrideHardcoded, false);

  const methods = p.adapterMethodSpecs;
  if (methods.length >= 5) {
    details.push(`PASS  adapterMethodSpecs.length = ${methods.length} (>= 5).`);
  } else {
    issues.push(`FAIL  adapterMethodSpecs.length = ${methods.length}, expected >= 5.`);
  }

  for (const t of EXPECTED_TABLES) {
    if (methods.some((m) => m.tableName === t)) details.push(`PASS  adapter covers table ${t}.`);
    else issues.push(`FAIL  adapter missing table ${t}.`);
  }

  // Per-method policy expectations.
  let policyOk = true;
  for (const m of methods) {
    const id = m.methodName;
    if ((m.readOnly as boolean) !== true) { policyOk = false; issues.push(`FAIL  ${id} readOnly must be true.`); }
    if (m.allowedOperation !== "select_only") { policyOk = false; issues.push(`FAIL  ${id} allowedOperation must be select_only.`); }
    if (m.mappedContractFields.length === 0) { policyOk = false; issues.push(`FAIL  ${id} mappedContractFields must not be empty.`); }
    if (!VALID_FALLBACK.has(m.fallbackBehavior)) { policyOk = false; issues.push(`FAIL  ${id} fallbackBehavior must not override hardcoded.`); }
    if (!VALID_EMPTY.has(m.emptyResultBehavior)) { policyOk = false; issues.push(`FAIL  ${id} emptyResultBehavior invalid.`); }
    if (!VALID_STALE.has(m.staleResultBehavior)) { policyOk = false; issues.push(`FAIL  ${id} staleResultBehavior invalid.`); }
    if (!VALID_ERROR.has(m.errorResultBehavior)) { policyOk = false; issues.push(`FAIL  ${id} errorResultBehavior invalid.`); }
    if (!VALID_KILL.has(m.killSwitchBehavior)) { policyOk = false; issues.push(`FAIL  ${id} killSwitchBehavior invalid.`); }
    if (!VALID_SOURCE_MODE.has(m.sourceModeRequirement)) { policyOk = false; issues.push(`FAIL  ${id} sourceModeRequirement invalid.`); }
    if (!VALID_ROUTE_IMPACT.has(m.appRouteImpact)) { policyOk = false; issues.push(`FAIL  ${id} appRouteImpact invalid.`); }
    if (m.verificationStatus !== "NOT_REVIEWED") { policyOk = false; issues.push(`FAIL  ${id} verificationStatus must be NOT_REVIEWED.`); }
  }
  if (policyOk) details.push("PASS  All adapter method specs satisfy policy expectations.");

  for (const label of ["no buy/sell command", "no Supabase connection", "staging read-only adapter"]) {
    if (p.safetyLabels.includes(label)) details.push(`PASS  safetyLabels includes "${label}".`);
    else issues.push(`FAIL  safetyLabels must include "${label}".`);
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { result: { name: "payload_checks", status, details: [...details, ...issues] }, methodCount: methods.length };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:staging-readonly-adapter-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-staging-readonly-adapter-spec.ts"',
];

const README_TERMS: string[] = [
  "V47",
  "Staging Read-only Adapter Spec",
  "docs/staging-readonly-adapter-spec.md",
  "use-cases/deployment/staging-readonly-adapter-spec-contract.ts",
  "use-cases/deployment/build-staging-readonly-adapter-spec-contract.ts",
  "npm run test:staging-readonly-adapter-spec",
  "staging read-only adapter",
  "read-only",
  "PORTFOLIO_SOURCE_MODE",
  "hardcoded",
  "fixture/mock UI 仍維持現狀",
  "V48",
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
    "app/api/portfolio/staging-readonly-adapter-spec/route.ts",
    "components/staging-readonly-adapter-spec.tsx",
    "supabase/staging_readonly_adapter_spec.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V47.`);
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
const { result: payloadCheck, methodCount } = checkPayload();
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

const summary: AdapterSummary = {
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
  adapter_method_spec_count: methodCount,
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
