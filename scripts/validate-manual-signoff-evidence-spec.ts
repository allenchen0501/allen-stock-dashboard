/**
 * Manual Sign-off Evidence Spec Validator — V56
 *
 * Contract / spec-only check. Imports the pure builder + constants and inspects
 * the evidence spec bundle; it does NOT start a Next.js server, make any HTTP
 * request, connect to Supabase, read env keys, build a runtime, or write data.
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

const builderModule = require("../use-cases/deployment/build-manual-signoff-evidence-spec-contract") as typeof import("../use-cases/deployment/build-manual-signoff-evidence-spec-contract");
const { buildManualSignoffEvidenceSpecContract } = builderModule;

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
  evidence_item_count: number;
  evidence_categories_covered: number;
  decision: string;
  manual_signoff_required: boolean;
  manual_signoff_completed: boolean;
  manual_signoff_evidence_provided: boolean;
  manual_signer_identity_verified: boolean;
  manual_signer_has_authority: boolean;
  staging_connection_allowed: boolean;
  staging_connection_review_allowed: boolean;
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

const DOC_REL = "docs/manual-signoff-evidence-spec.md";
const CONTRACT_REL = "use-cases/deployment/manual-signoff-evidence-spec-contract.ts";
const BUILDER_REL = "use-cases/deployment/build-manual-signoff-evidence-spec-contract.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Evidence spec doc (new)", rel: DOC_REL },
    { label: "Evidence spec contract (new)", rel: CONTRACT_REL },
    { label: "Evidence spec builder (new)", rel: BUILDER_REL },
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
  "V56",
  "Manual Sign-off Evidence Spec",
  "sign-off evidence structure",
  "not actual sign-off",
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
  "V55 connection review gate exists but decision remains NO_GO",
  "manualSignoffRequired = true",
  "manualSignoffCompleted = false",
  "manualSignoffEvidenceProvided = false",
  "manualSignerIdentityVerified = false",
  "manualSignerHasAuthority = false",
  "stagingConnectionAllowed = false",
  "stagingConnectionReviewAllowed = false",
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
  "V57 Manual Sign-off Evidence Instance",
  "V57 Staging Read-only Connection Dry-run Plan",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract checks
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "ManualSignoffEvidenceDeploymentTarget",
  "ManualSignoffEvidenceDecision",
  "ManualSignoffEvidenceCategory",
  "ManualSignoffEvidenceStatus",
  "ManualSignoffEvidenceRequirementItem",
  "ManualSignoffEvidenceSpecBundle",
  "MANUAL_SIGNOFF_EVIDENCE_SPEC_CONTRACT_VERSION",
  "MANUAL_SIGNOFF_EVIDENCE_SPEC_CATEGORIES",
  "MANUAL_SIGNOFF_EVIDENCE_SPEC_ALLOWED_DECISIONS",
  "MANUAL_SIGNOFF_EVIDENCE_SPEC_SAFETY_LABELS",
  "MANUAL_SIGNOFF_EVIDENCE_SPEC_DISALLOWED_TERMS",
  "NO_GO",
  "READY_FOR_REVIEW",
  "manualSignoffEvidenceSpecDefined: true",
  "actualManualSignoffPerformed: false",
  "manualSignoffRequired: true",
  "manualSignoffCompleted: false",
  "manualSignoffEvidenceProvided: false",
  "manualSignerIdentityVerified: false",
  "manualSignerHasAuthority: false",
  "v55ConnectionReviewGatePassed: true",
  'v55Decision: "NO_GO"',
  "stagingConnectionAllowed: false",
  "stagingConnectionReviewAllowed: false",
  "actualConnectionImplemented: false",
  "actualConnectionAttempted: false",
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
  "fixtureCanBeOverriddenByStaging: false",
  "hardcodedCanBeOverriddenByStaging: false",
  "mismatchCanPromoteStaging: false",
  "dryRunCanPromoteStaging: false",
  "emptyResultCanOverrideHardcoded: false",
  "staleResultCanOverrideHardcoded: false",
  "errorResultCanOverrideHardcoded: false",
  "serviceRoleAllowedInAppRuntime: false",
  "anonRoleAllowed: false",
  "dashboardReadonlyRoleRequired: true",
  "readOnlySelectOnlyRequired: true",
  "writeOperationsBlocked: true",
  "shadowOnlyRequired: true",
  "portfolioApiMustRemainHardcoded: true",
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

const EXPECTED_CATEGORIES = [
  "SIGNER_IDENTITY", "SIGNER_AUTHORITY", "V55_GATE", "SUPABASE_PROJECT_IDENTITY", "STAGING_URL_VERIFICATION",
  "ENVIRONMENT_SECRET_HANDLING", "ROLE_ACCESS", "RLS_SELECT_ONLY", "WRITE_BLOCKING", "SHADOW_ONLY",
  "PORTFOLIO_SOURCE_MODE", "KILL_SWITCH", "ROLLBACK_PLAN", "DATA_SOURCE_SAFETY", "TRADING_SAFETY", "PRODUCTION_READINESS",
];

function checkPayload(): { result: CheckResult; itemCount: number; categoriesCovered: number; decision: string } {
  const details: string[] = [];
  const issues: string[] = [];

  const p = buildManualSignoffEvidenceSpecContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", p.contractVersion, "V56");
  expectEq("specName", p.specName, "Manual Sign-off Evidence Spec");
  expectEq("deploymentTarget", p.deploymentTarget, "staging");
  expectEq("generatedAt", p.generatedAt, FIXED_TS);
  expectEq("decision", p.decision, "NO_GO");
  if ((p.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');
  else details.push('PASS  decision is not "PRODUCTION_READY".');
  expectEq("v55Decision", p.v55Decision, "NO_GO");

  const trueFlags = [
    "manualSignoffEvidenceSpecDefined", "manualSignoffRequired", "v55ConnectionReviewGatePassed", "killSwitchDefaultEnabled",
    "dashboardReadonlyRoleRequired", "readOnlySelectOnlyRequired", "writeOperationsBlocked", "shadowOnlyRequired",
    "portfolioApiMustRemainHardcoded",
  ] as const;
  const falseFlags = [
    "actualManualSignoffPerformed", "manualSignoffCompleted", "manualSignoffEvidenceProvided", "manualSignerIdentityVerified",
    "manualSignerHasAuthority", "stagingConnectionAllowed", "stagingConnectionReviewAllowed", "actualConnectionImplemented",
    "actualConnectionAttempted", "productionReadinessAllowed", "stagingSupabaseConnected", "stagingReadPerformed",
    "stagingWritePerformed", "productionSupabaseConnected", "productionWritePerformed", "envReadPerformed",
    "databaseWritePerformed", "requestPerformed", "apiRouteCreated", "uiCreated", "sqlMigrationCreated", "runtimeCreated",
    "shadowRunnerRuntimeCreated", "shadowRunnerExecuted", "shadowComparisonPerformed", "shadowResultPersisted",
    "portfolioApiSwitched", "portfolioSourceModeChanged", "realMarketDataEnabled", "buySellCommandGenerated",
    "autoOrderRequested", "fixtureCanBeOverriddenByStaging", "hardcodedCanBeOverriddenByStaging", "mismatchCanPromoteStaging",
    "dryRunCanPromoteStaging", "emptyResultCanOverrideHardcoded", "staleResultCanOverrideHardcoded",
    "errorResultCanOverrideHardcoded", "serviceRoleAllowedInAppRuntime", "anonRoleAllowed",
  ] as const;
  const rec = p as unknown as Record<string, unknown>;
  for (const f of trueFlags) expectEq(f, rec[f], true);
  for (const f of falseFlags) expectEq(f, rec[f], false);

  const items = p.evidenceRequirementItems;
  if (items.length >= 20) details.push(`PASS  evidenceRequirementItems.length = ${items.length} (>= 20).`);
  else issues.push(`FAIL  evidenceRequirementItems.length = ${items.length}, expected >= 20.`);

  const coveredCats = new Set(items.map((i) => i.category));
  for (const c of EXPECTED_CATEGORIES) {
    if (coveredCats.has(c as never)) details.push(`PASS  category covered: ${c}.`);
    else issues.push(`FAIL  category not covered: ${c}.`);
  }

  // Per-item policy.
  let policyOk = true;
  for (const i of items) {
    const id = i.evidenceId;
    if (!i.requiredEvidence || i.requiredEvidence.length === 0) { policyOk = false; issues.push(`FAIL  ${id} requiredEvidence empty.`); }
    if (!i.acceptedEvidenceFormat || i.acceptedEvidenceFormat.length === 0) { policyOk = false; issues.push(`FAIL  ${id} acceptedEvidenceFormat empty.`); }
    if (!i.expectedState || i.expectedState.length === 0) { policyOk = false; issues.push(`FAIL  ${id} expectedState empty.`); }
    if (!i.providedState || i.providedState.length === 0) { policyOk = false; issues.push(`FAIL  ${id} providedState empty.`); }
    for (const b of ["requiredBeforeManualSignoff", "requiredBeforeConnectionReview", "requiredBeforeActualConnection", "blocksManualSignoff", "blocksConnectionReview", "blocksActualConnection", "blocksProductionReadiness", "manualReviewRequired"] as const) {
      if (typeof i[b] !== "boolean") { policyOk = false; issues.push(`FAIL  ${id} ${b} not boolean.`); }
    }
    if (i.requiredBeforeManualSignoff && i.status !== "PASS" && !i.blocksManualSignoff) {
      policyOk = false; issues.push(`FAIL  ${id} requiredBeforeManualSignoff non-PASS must blocksManualSignoff=true.`);
    }
  }
  if (policyOk) details.push("PASS  All evidence items satisfy policy expectations.");

  if (p.decision !== "NO_GO") issues.push(`FAIL  decision must be NO_GO while sign-off incomplete (got ${p.decision}).`);
  else details.push("PASS  decision is NO_GO (sign-off incomplete).");

  for (const label of ["no buy/sell command", "no Supabase connection", "Manual Sign-off Evidence Spec"]) {
    if (p.safetyLabels.includes(label)) details.push(`PASS  safetyLabels includes "${label}".`);
    else issues.push(`FAIL  safetyLabels must include "${label}".`);
  }

  return {
    result: { name: "payload_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    itemCount: items.length,
    categoriesCovered: coveredCats.size,
    decision: p.decision,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: package.json + README checks
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:manual-signoff-evidence-spec": "node --require ./scripts/register-typescript.cjs ./scripts/validate-manual-signoff-evidence-spec.ts"',
];

const README_TERMS: string[] = [
  "V56",
  "Manual Sign-off Evidence Spec",
  "docs/manual-signoff-evidence-spec.md",
  "use-cases/deployment/manual-signoff-evidence-spec-contract.ts",
  "use-cases/deployment/build-manual-signoff-evidence-spec-contract.ts",
  "npm run test:manual-signoff-evidence-spec",
  "manualSignoffCompleted = false",
  "manualSignoffEvidenceProvided = false",
  "stagingConnectionAllowed = false",
  "V57 Manual Sign-off Evidence Instance",
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
    "app/api/portfolio/manual-signoff-evidence/route.ts",
    "components/manual-signoff-evidence.tsx",
    "supabase/manual_signoff_evidence.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V56.`);
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
const { result: payloadCheck, itemCount, categoriesCovered, decision } = checkPayload();
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

const p = buildManualSignoffEvidenceSpecContract({ generatedAt: FIXED_TS });

const summary: EvidenceSummary = {
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
  evidence_item_count: itemCount,
  evidence_categories_covered: categoriesCovered,
  decision,
  manual_signoff_required: p.manualSignoffRequired,
  manual_signoff_completed: p.manualSignoffCompleted,
  manual_signoff_evidence_provided: p.manualSignoffEvidenceProvided,
  manual_signer_identity_verified: p.manualSignerIdentityVerified,
  manual_signer_has_authority: p.manualSignerHasAuthority,
  staging_connection_allowed: p.stagingConnectionAllowed,
  staging_connection_review_allowed: p.stagingConnectionReviewAllowed,
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
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
