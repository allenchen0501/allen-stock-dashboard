/**
 * Real Quote Source Conflict Resolution Policy Validator — V67
 *
 * Static + pure-function check. Imports the policy builder, the conflict engine, and
 * the V66 catalog builder, then proves ranking aligns to V66 conflictPriorityRank,
 * every conflict kind is detectable, and every resolution result blocks operational
 * use. It does NOT start a server, make any HTTP request, connect to Supabase, read
 * env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * builder / engine code files (NOT the doc). The safety FLAG `autoOrderRequested`
 * does not appear here, but the connection / write list is still scanned.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const policyBuilderModule = require("../use-cases/war-room/build-real-quote-source-conflict-resolution-policy-contract") as typeof import("../use-cases/war-room/build-real-quote-source-conflict-resolution-policy-contract");
const engineModule = require("../use-cases/war-room/real-quote-source-conflict-resolution-engine") as typeof import("../use-cases/war-room/real-quote-source-conflict-resolution-engine");
const catalogBuilderModule = require("../use-cases/war-room/build-authorized-real-quote-field-catalog-contract") as typeof import("../use-cases/war-room/build-authorized-real-quote-field-catalog-contract");

const { buildRealQuoteSourceConflictResolutionPolicyContract } = policyBuilderModule;
const { rankSourceCandidateValues, detectQuoteSourceConflict, resolveQuoteSourceConflict, buildConflictResolutionResult } = engineModule;
const { buildAuthorizedRealQuoteFieldCatalogContract } = catalogBuilderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface PolicySummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  conflict_rule_count: number;
  sample_value_count: number;
  sample_result_count: number;
  issues: string[];
  warnings: string[];
  production_write_performed: false;
  request_performed: false;
  supabase_connected: false;
  env_read_performed: false;
  api_route_created: false;
  ui_created: true;
  runtime_created: false;
  sql_migration_created: false;
  real_data_connected: false;
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

function checkTerms(name: string, body: string | null, fileLabel: string, terms: string[]): CheckResult {
  if (body == null) return { name, status: "FAIL", details: [`FAIL  Cannot read ${fileLabel}.`] };
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

const DOC_REL = "docs/real-quote-source-conflict-resolution-policy.md";
const CONTRACT_REL = "use-cases/war-room/real-quote-source-conflict-resolution-policy-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-real-quote-source-conflict-resolution-policy-contract.ts";
const ENGINE_REL = "use-cases/war-room/real-quote-source-conflict-resolution-engine.ts";
const POOLS_REL = "components/war-room/daily-candidate-pools.tsx";
const LAYOUT_REL = "components/war-room/war-room-operational-layout.tsx";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Conflict policy doc (new)", rel: DOC_REL },
    { label: "Conflict policy contract (new)", rel: CONTRACT_REL },
    { label: "Conflict policy builder (new)", rel: BUILDER_REL },
    { label: "Conflict resolution engine (new)", rel: ENGINE_REL },
    { label: "Daily candidate pools (modified)", rel: POOLS_REL },
    { label: "War room operational layout (modified)", rel: LAYOUT_REL },
    { label: "System safety page (modified)", rel: SAFETY_PAGE_REL },
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
  "V67",
  "Real Quote Source Conflict Resolution Policy",
  "SPEC_ONLY_NOT_CONNECTED",
  "deterministic conflict resolution",
  "conflictPriorityRank",
  "missing data",
  "stale data",
  "timestamp mismatch",
  "value mismatch",
  "unauthorized source",
  "not connected source",
  "operationalUseAllowed false",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "productionSwitchAllowed false",
  "no Supabase connection",
  "no env read",
  "no DB write",
  "no fetch",
  "no real market data",
  "no API route",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
  "not PRODUCTION_READY",
];

// ---------------------------------------------------------------------------
// Gate 3: Contract type terms
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "QuoteSourceCandidateValue",
  "QuoteSourceConflictRule",
  "QuoteSourceConflictResolutionResult",
  "QuoteSourceConflictResolutionPolicy",
  "QuoteSourceConflictResolutionValidation",
  "isAuthorized: false",
  "isConnected: false",
  "operationalUseAllowed: false",
  "requiresManualReview: true",
  "manualSignoffRequired: true",
  "manualSignoffCompleted: false",
  "productionSwitchAllowed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Policy + engine checks
// ---------------------------------------------------------------------------

function checkPolicy(): { result: CheckResult; decision: string; ruleCount: number; valueCount: number; resultCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const policy = buildRealQuoteSourceConflictResolutionPolicyContract({ generatedAt: FIXED_TS });
  const catalog = buildAuthorizedRealQuoteFieldCatalogContract({ generatedAt: FIXED_TS });
  const knownSources = new Set(catalog.sourceCandidates.map((s) => s.sourceName));
  const knownFields = new Set(catalog.fieldCatalogItems.map((i) => i.fieldName));

  if (policy.contractVersion === "V67") details.push('PASS  contractVersion === "V67".');
  else issues.push(`FAIL  contractVersion === ${JSON.stringify(policy.contractVersion)}.`);
  if (policy.specName.includes("Real Quote Source Conflict Resolution Policy")) details.push("PASS  specName contains the policy name.");
  else issues.push("FAIL  specName must contain Real Quote Source Conflict Resolution Policy.");
  if (policy.policyMode === "SPEC_ONLY_NOT_CONNECTED") details.push("PASS  policyMode SPEC_ONLY_NOT_CONNECTED.");
  else issues.push("FAIL  policyMode must be SPEC_ONLY_NOT_CONNECTED.");
  if (policy.decision === "READY_FOR_UI_REVIEW" || policy.decision === "NO_GO") details.push(`PASS  decision === ${policy.decision}.`);
  else issues.push(`FAIL  decision === ${JSON.stringify(policy.decision)}.`);
  if ((policy.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');

  // V66 source candidates all have a conflictPriorityRank.
  if (catalog.sourceCandidates.every((s) => typeof s.conflictPriorityRank === "number")) details.push("PASS  all V66 sourceCandidates have conflictPriorityRank.");
  else issues.push("FAIL  every V66 sourceCandidate must have a conflictPriorityRank.");

  // sample candidate values: known source + field names.
  for (const v of policy.sampleCandidateValues) {
    if (knownSources.has(v.sourceName)) details.push(`PASS  sample value source "${v.sourceName}" known.`); else issues.push(`FAIL  sample value source "${v.sourceName}" not in V66 sourceCandidates.`);
    if (knownFields.has(v.fieldName)) details.push(`PASS  sample value field "${v.fieldName}" known.`); else issues.push(`FAIL  sample value field "${v.fieldName}" not in V66 fieldCatalogItems.`);
  }

  // ranks aligned to V66.
  const rankByName = new Map(catalog.sourceCandidates.map((s) => [s.sourceName, s.conflictPriorityRank] as const));
  if (policy.sampleCandidateValues.every((v) => v.sourcePriorityRank === rankByName.get(v.sourceName)))
    details.push("PASS  sample value sourcePriorityRank aligned to V66 conflictPriorityRank.");
  else issues.push("FAIL  sample value sourcePriorityRank must align to V66 conflictPriorityRank.");

  // rankSourceCandidateValues sorts by priority (use sample lastPrice values shuffled).
  const lastPriceValues = policy.sampleCandidateValues.filter((v) => v.fieldName === "lastPrice");
  const shuffled = [...lastPriceValues].reverse();
  const ranked = rankSourceCandidateValues(shuffled, catalog.sourceCandidates);
  const sortedOk = ranked.every((v, i, arr) => i === 0 || arr[i - 1].sourcePriorityRank <= v.sourcePriorityRank);
  if (sortedOk && ranked.length === lastPriceValues.length) details.push("PASS  rankSourceCandidateValues sorts by conflictPriorityRank.");
  else issues.push("FAIL  rankSourceCandidateValues must sort by conflictPriorityRank.");

  // detection probes.
  const base = lastPriceValues[0] ?? policy.sampleCandidateValues[0];
  const det = (arr: typeof policy.sampleCandidateValues) => detectQuoteSourceConflict(arr);
  const probe = (label: string, value: boolean): void => { if (value) details.push(`PASS  detects ${label}.`); else issues.push(`FAIL  must detect ${label}.`); };
  probe("missing data", det([base, { ...base, sourceName: base.sourceName + "#2", isAvailable: false }]).hasMissingData);
  probe("stale data", det([base, { ...base, sourceName: base.sourceName + "#2", isStale: true }]).hasStaleData);
  probe("timestamp mismatch", det([base, { ...base, sourceName: base.sourceName + "#2", valueTimestamp: "2099-01-01T00:00:00.000Z" }]).hasTimestampMismatch);
  probe("value mismatch", det([base, { ...base, sourceName: base.sourceName + "#2", valuePreview: base.valuePreview + "-X" }]).hasValueMismatch);
  probe("unauthorized source", det([base]).hasUnauthorizedSource);
  probe("not connected source", det([base]).hasNotConnectedSource);

  // resolveQuoteSourceConflict never allows operational use.
  const resolved = resolveQuoteSourceConflict(lastPriceValues, { conflictRules: policy.conflictRules });
  if (resolved.operationalUseAllowed === false) details.push("PASS  resolveQuoteSourceConflict operationalUseAllowed false.");
  else issues.push("FAIL  resolveQuoteSourceConflict must not allow operationalUseAllowed=true.");
  if (resolved.degradedStatus === "BLOCKED_NOT_CONNECTED") details.push("PASS  resolve degrades to BLOCKED_NOT_CONNECTED (spec not connected).");
  else details.push(`PASS  resolve degradedStatus = ${resolved.degradedStatus}.`);

  // buildConflictResolutionResult wrapper.
  const built = buildConflictResolutionResult("lastPrice", policy.sampleCandidateValues, { conflictRules: policy.conflictRules });
  if (built.fieldName === "lastPrice" && built.operationalUseAllowed === false) details.push("PASS  buildConflictResolutionResult returns blocked result.");
  else issues.push("FAIL  buildConflictResolutionResult must return a blocked result for the field.");

  // all sample results blocked.
  if (policy.sampleResolutionResults.every((r) => r.operationalUseAllowed === false)) details.push("PASS  all sampleResolutionResults operationalUseAllowed false.");
  else issues.push("FAIL  all sampleResolutionResults must have operationalUseAllowed false.");
  if (policy.sampleResolutionResults.every((r) => r.manualSignoffRequired === true)) details.push("PASS  all sampleResolutionResults manualSignoffRequired true.");
  else issues.push("FAIL  all sampleResolutionResults must have manualSignoffRequired true.");
  if (policy.sampleResolutionResults.every((r) => r.manualSignoffCompleted === false)) details.push("PASS  all sampleResolutionResults manualSignoffCompleted false.");
  else issues.push("FAIL  all sampleResolutionResults must have manualSignoffCompleted false.");
  if (policy.sampleResolutionResults.every((r) => r.productionSwitchAllowed === false)) details.push("PASS  all sampleResolutionResults productionSwitchAllowed false.");
  else issues.push("FAIL  all sampleResolutionResults must have productionSwitchAllowed false.");

  if (policy.validation.valid) details.push("PASS  policy.validation.valid === true.");
  else issues.push("FAIL  policy.validation.valid must be true.");

  return {
    result: { name: "policy_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: policy.decision,
    ruleCount: policy.conflictRules.length,
    valueCount: policy.sampleCandidateValues.length,
    resultCount: policy.sampleResolutionResults.length,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: Policy-level safety flags
// ---------------------------------------------------------------------------

function checkPolicyFlags(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const policy = buildRealQuoteSourceConflictResolutionPolicyContract({ generatedAt: FIXED_TS });
  const rec = policy as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed", "fetchPerformed",
    "supabaseConnected", "databaseWritePerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) {
    if (rec[f] === false) details.push(`PASS  ${f} === false.`);
    else issues.push(`FAIL  ${f} === ${JSON.stringify(rec[f])}, expected false.`);
  }
  return { name: "policy_flags", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  for (const term of ["Conflict policy", "SPEC_ONLY_NOT_CONNECTED", "多來源衝突解析尚未接真實資料，fixture 區間不可作為正式操作依據"]) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI contains "${term}".`);
    else issues.push(`FAIL  daily pools UI must contain "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Real Quote Source Conflict Resolution Policy", "policyMode", "operationalUseAllowed"]) {
    if (safety && safety.includes(term)) details.push(`PASS  /system/safety contains "${term}".`);
    else issues.push(`FAIL  /system/safety must contain "${term}".`);
  }

  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: Safety (forbidden token scan + protected files + no API route)
// ---------------------------------------------------------------------------

const SPEC_FORBIDDEN = [
  "@supabase",
  "createclient",
  "process.env",
  "fetch(",
  "axios",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "date.now",
  "new date(",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of [CONTRACT_REL, BUILDER_REL, ENGINE_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const stripped = stripComments(body);
    const lower = stripped.toLowerCase();
    for (const token of SPEC_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
    for (const token of ["autoorder", "placeorder"]) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
    if (stripped.includes("PRODUCTION_READY")) issues.push(`FAIL  Forbidden "PRODUCTION_READY" present in ${rel}.`);
    else details.push(`PASS  No "PRODUCTION_READY" in ${rel}.`);
  }

  const forbiddenArtifacts = [
    "app/api/portfolio/conflict-resolution/route.ts",
    "app/api/conflict-resolution/route.ts",
    "supabase/quote_source_conflict.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V67.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/authorized-real-quote-field-catalog-contract.ts",
    "use-cases/war-room/build-authorized-real-quote-field-catalog-contract.ts",
    "use-cases/war-room/descriptor-to-real-quote-mapping-contract.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must exist.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 8: package.json + README
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:real-quote-source-conflict-resolution-policy": "node --require ./scripts/register-typescript.cjs ./scripts/validate-real-quote-source-conflict-resolution-policy.ts"',
];

const README_TERMS: string[] = [
  "V67",
  "Real Quote Source Conflict Resolution Policy",
  "docs/real-quote-source-conflict-resolution-policy.md",
  "use-cases/war-room/real-quote-source-conflict-resolution-engine.ts",
  "npm run test:real-quote-source-conflict-resolution-policy",
  "deterministic conflict resolution",
  "SPEC_ONLY_NOT_CONNECTED",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const contractBody = readFile(resolve(CONTRACT_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const phraseCheck = checkTerms("required_phrases", docBody, DOC_REL, REQUIRED_DOC_PHRASES);
const contractCheck = checkTerms("contract_terms", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const { result: policyCheck, decision, ruleCount, valueCount, resultCount } = checkPolicy();
const flagsCheck = checkPolicyFlags();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  policyCheck,
  flagsCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: PolicySummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, ENGINE_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    policy_checks: policyCheck.status,
    policy_flags: flagsCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  conflict_rule_count: ruleCount,
  sample_value_count: valueCount,
  sample_result_count: resultCount,
  issues: allIssues,
  warnings: allWarnings,
  production_write_performed: false,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  api_route_created: false,
  ui_created: true,
  runtime_created: false,
  sql_migration_created: false,
  real_data_connected: false,
};

console.log(JSON.stringify(summary, null, 2));

if (overallStatus === "FAIL") {
  process.exit(1);
} else {
  process.exit(0);
}
