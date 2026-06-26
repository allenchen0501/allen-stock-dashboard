/**
 * Staging Supabase Schema Mapping Spec Validator — V46
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

const builderModule = require("../use-cases/deployment/build-staging-supabase-schema-mapping-spec-contract") as typeof import("../use-cases/deployment/build-staging-supabase-schema-mapping-spec-contract");
const { buildStagingSupabaseSchemaMappingSpecContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface MappingSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  schema_mapping_item_count: number;
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

const DOC_REL = "docs/staging-supabase-schema-mapping-spec.md";
const CONTRACT_REL = "use-cases/deployment/staging-supabase-schema-mapping-spec-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-staging-supabase-schema-mapping-spec-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Schema mapping doc (new)", rel: DOC_REL },
    { label: "Schema mapping contract (new)", rel: CONTRACT_REL },
    { label: "Schema mapping builder (new)", rel: BUILDER_REL },
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
  "V46",
  "Staging Supabase Schema Mapping Spec",
  "staging Supabase",
  "schema mapping",
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
  "fixture/mock UI",
  "V47",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "StagingSupabaseSchemaMappingDeploymentTarget",
  "StagingSupabaseSchemaMappingDecision",
  "StagingSupabaseSchemaMappingTableName",
  "StagingSupabaseSchemaMappingExpectedType",
  "StagingSupabaseSchemaMappingAppUsage",
  "StagingSupabaseSchemaMappingFreshnessRequirement",
  "StagingSupabaseSchemaMappingSourceOfTruth",
  "StagingSupabaseSchemaMappingPiiRisk",
  "StagingSupabaseSchemaMappingVerificationStatus",
  "StagingSupabaseSchemaMappingItem",
  "StagingSupabaseSchemaMappingSpecBundle",
  "STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_CONTRACT_VERSION",
  "STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_TABLES",
  "STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_ALLOWED_DECISIONS",
  "STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_SAFETY_LABELS",
  "STAGING_SUPABASE_SCHEMA_MAPPING_SPEC_DISALLOWED_TERMS",
  "READY_FOR_REVIEW",
  "NO_GO",
  "appWriteAllowed: false",
  "stagingSupabasePlanned: true",
  "stagingSupabaseConnected: false",
  "stagingSchemaMappingDefined: true",
  "stagingSchemaManuallyVerified: false",
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

const DOMAIN_USAGES = new Set([
  "portfolio_position",
  "watchlist_item",
  "market_snapshot",
  "stock_snapshot",
  "scoring_snapshot",
]);

const FRESHNESS_REQUIRED_PATTERN = /(price|score|volume|snapshot_at|calculated_at|change_percent|market_value)/;

function checkPayload(): { result: CheckResult; itemCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildStagingSupabaseSchemaMappingSpecContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) {
      details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    } else {
      issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
    }
  };

  expectEq("contractVersion", p.contractVersion, "V46");
  expectEq("specName", p.specName, "Staging Supabase Schema Mapping Spec");
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
  expectEq("stagingSchemaMappingDefined", p.stagingSchemaMappingDefined, true);
  expectEq("stagingSchemaManuallyVerified", p.stagingSchemaManuallyVerified, false);
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

  const items = p.schemaMappingItems;
  if (items.length >= 30) {
    details.push(`PASS  schemaMappingItems.length = ${items.length} (>= 30).`);
  } else {
    issues.push(`FAIL  schemaMappingItems.length = ${items.length}, expected >= 30.`);
  }

  // 5 tables covered + per-table id/created_at/updated_at + >= 3 domain fields.
  for (const t of EXPECTED_TABLES) {
    const cols = items.filter((i) => i.tableName === t);
    if (cols.length === 0) {
      issues.push(`FAIL  schema mapping missing table ${t}.`);
      continue;
    }
    details.push(`PASS  schema mapping covers table ${t} (${cols.length} cols).`);
    const names = new Set(cols.map((c) => c.columnName));
    for (const req of ["id", "created_at", "updated_at"]) {
      if (!names.has(req)) issues.push(`FAIL  table ${t} missing column ${req}.`);
    }
    const domainCount = cols.filter((c) => DOMAIN_USAGES.has(c.appUsage)).length;
    if (domainCount >= 3) {
      details.push(`PASS  table ${t} has ${domainCount} domain fields (>= 3).`);
    } else {
      issues.push(`FAIL  table ${t} has ${domainCount} domain fields, expected >= 3.`);
    }
  }

  // Per-item policy expectations.
  let policyOk = true;
  for (const i of items) {
    if (i.appWriteAllowed as boolean) { policyOk = false; issues.push(`FAIL  ${i.tableName}.${i.columnName} appWriteAllowed must be false.`); }
    if (i.verificationStatus !== "NOT_REVIEWED") { policyOk = false; issues.push(`FAIL  ${i.tableName}.${i.columnName} verificationStatus must be NOT_REVIEWED.`); }
    if (i.expectedType === "unknown" && !(i.blocksRelease || /manual review/i.test(i.notes))) {
      policyOk = false; issues.push(`FAIL  ${i.tableName}.${i.columnName} unknown type must blocksRelease=true or notes manual review.`);
    }
    if (i.piiRisk === "high" && !i.blocksRelease) {
      policyOk = false; issues.push(`FAIL  ${i.tableName}.${i.columnName} high PII must blocksRelease=true.`);
    }
    if (DOMAIN_USAGES.has(i.appUsage) && i.mappedContractFields.length === 0) {
      policyOk = false; issues.push(`FAIL  ${i.tableName}.${i.columnName} app-used column must have mappedContractFields.`);
    }
    if (FRESHNESS_REQUIRED_PATTERN.test(i.columnName) && (!i.freshnessRequirement || i.freshnessRequirement.length === 0)) {
      policyOk = false; issues.push(`FAIL  ${i.tableName}.${i.columnName} price/score/volume/timestamp must have freshnessRequirement.`);
    }
    // production Supabase must never be a mapping target.
    if (/production/i.test(i.sourceOfTruth) || i.mappedContractFields.some((f) => /production/i.test(f))) {
      policyOk = false; issues.push(`FAIL  ${i.tableName}.${i.columnName} must not target production Supabase.`);
    }
  }
  if (policyOk) details.push("PASS  All schema mapping items satisfy policy expectations.");

  for (const label of ["no buy/sell command", "no Supabase connection", "schema mapping"]) {
    if (p.safetyLabels.includes(label)) details.push(`PASS  safetyLabels includes "${label}".`);
    else issues.push(`FAIL  safetyLabels must include "${label}".`);
  }

  const status: CheckStatus = issues.length > 0 ? "FAIL" : "PASS";
  return { result: { name: "payload_checks", status, details: [...details, ...issues] }, itemCount: items.length };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:staging-supabase-schema-mapping-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-staging-supabase-schema-mapping-spec.ts"',
];

const README_TERMS: string[] = [
  "V46",
  "Staging Supabase Schema Mapping Spec",
  "docs/staging-supabase-schema-mapping-spec.md",
  "use-cases/deployment/staging-supabase-schema-mapping-spec-contract.ts",
  "use-cases/deployment/build-staging-supabase-schema-mapping-spec-contract.ts",
  "npm run test:staging-supabase-schema-mapping-spec",
  "staging Supabase",
  "schema mapping",
  "read-only",
  "fixture/mock UI 仍維持現狀",
  "V47",
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
    "app/api/portfolio/staging-supabase-schema-mapping-spec/route.ts",
    "components/staging-supabase-schema-mapping-spec.tsx",
    "supabase/staging_supabase_schema_mapping_spec.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) {
      issues.push(`FAIL  Artifact ${rel} must not exist in V46.`);
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
const { result: payloadCheck, itemCount } = checkPayload();
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

const summary: MappingSummary = {
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
  schema_mapping_item_count: itemCount,
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
