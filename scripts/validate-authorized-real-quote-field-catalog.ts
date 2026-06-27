/**
 * Authorized Real Quote Field Catalog Validator — V66
 *
 * Static + pure-function check. Imports the catalog builder + the V65 mapping
 * builder and proves the catalog covers every V65 expectedRealField, every
 * acceptableSource resolves to a known source candidate, and every source /
 * boundary flag stays NOT_CONNECTED / spec-only. It does NOT start a server, make
 * any HTTP request, connect to Supabase, read env keys, build a runtime, or write
 * data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * builder code files (NOT the doc). The safety FLAG `autoOrderRequested` legitimately
 * contains "autoorder", so autoorder / placeorder are not scanned in those files.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const catalogBuilderModule = require("../use-cases/war-room/build-authorized-real-quote-field-catalog-contract") as typeof import("../use-cases/war-room/build-authorized-real-quote-field-catalog-contract");
const mappingBuilderModule = require("../use-cases/war-room/build-descriptor-to-real-quote-mapping-contract") as typeof import("../use-cases/war-room/build-descriptor-to-real-quote-mapping-contract");

const { buildAuthorizedRealQuoteFieldCatalogContract } = catalogBuilderModule;
const { buildDescriptorToRealQuoteMappingContract } = mappingBuilderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface CatalogSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  source_candidate_count: number;
  field_catalog_item_count: number;
  covers_all_v65_expected_fields: boolean;
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

const DOC_REL = "docs/authorized-real-quote-field-catalog.md";
const CONTRACT_REL = "use-cases/war-room/authorized-real-quote-field-catalog-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-authorized-real-quote-field-catalog-contract.ts";
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
    { label: "Field catalog doc (new)", rel: DOC_REL },
    { label: "Field catalog contract (new)", rel: CONTRACT_REL },
    { label: "Field catalog builder (new)", rel: BUILDER_REL },
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
  "V66",
  "Authorized Real Quote Field Catalog & Source Boundary",
  "SPEC_ONLY_NOT_CONNECTED",
  "NOT_CONNECTED",
  "NOT_AUTHORIZED",
  "PENDING_MANUAL_REVIEW",
  "Yahoo Finance Taiwan candidate",
  "TWSE official candidate",
  "TPEx official candidate",
  "Goodinfo candidate",
  "Supabase staging read-only candidate",
  "Broker import candidate",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "stagingReadOnlyRequired true",
  "stagingReadOnlyConnected false",
  "shadowComparisonRequired true",
  "shadowComparisonCompleted false",
  "productionSwitchAllowed false",
  "serviceRoleAllowedInAppRuntime false",
  "writeOperationsAllowed false",
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
  "AuthorizedRealQuoteSourceCandidate",
  "AuthorizedRealQuoteFieldCatalogItem",
  "AuthorizedRealQuoteFieldCatalog",
  "AuthorizedRealQuoteSourceBoundary",
  "AuthorizedRealQuoteFieldCatalogValidation",
  "runtimeEnabled: false",
  "fetchAllowed: false",
  "envRequired: false",
  "apiRouteCreated: false",
  "supabaseConnected: false",
  "operationalUseAllowed: false",
  "serviceRoleAllowedInAppRuntime: false",
  "writeOperationsAllowed: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Catalog consistency
// ---------------------------------------------------------------------------

function checkCatalog(): { result: CheckResult; decision: string; sourceCount: number; itemCount: number; covers: boolean } {
  const details: string[] = [];
  const issues: string[] = [];

  const catalog = buildAuthorizedRealQuoteFieldCatalogContract({ generatedAt: FIXED_TS });
  const mapping = buildDescriptorToRealQuoteMappingContract({ generatedAt: FIXED_TS });

  if (catalog.contractVersion === "V66") details.push('PASS  contractVersion === "V66".');
  else issues.push(`FAIL  contractVersion === ${JSON.stringify(catalog.contractVersion)}.`);
  if (catalog.specName.includes("Authorized Real Quote Field Catalog & Source Boundary")) details.push("PASS  specName contains the catalog name.");
  else issues.push("FAIL  specName must contain Authorized Real Quote Field Catalog & Source Boundary.");
  if (catalog.sourceCatalogMode === "SPEC_ONLY_NOT_CONNECTED") details.push("PASS  sourceCatalogMode SPEC_ONLY_NOT_CONNECTED.");
  else issues.push("FAIL  sourceCatalogMode must be SPEC_ONLY_NOT_CONNECTED.");
  if (catalog.decision === "READY_FOR_UI_REVIEW" || catalog.decision === "NO_GO") details.push(`PASS  decision === ${catalog.decision}.`);
  else issues.push(`FAIL  decision === ${JSON.stringify(catalog.decision)}.`);
  if ((catalog.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');

  // Coverage: every V65 expectedRealField fieldName has a catalog item.
  const v65FieldNames = new Set(mapping.mappingItems.flatMap((m) => m.expectedRealFields.map((f) => f.fieldName)));
  const catalogFieldNames = new Set(catalog.fieldCatalogItems.map((i) => i.fieldName));
  for (const name of v65FieldNames) {
    if (catalogFieldNames.has(name)) details.push(`PASS  V65 expectedRealField "${name}" covered by a catalog item.`);
    else issues.push(`FAIL  V65 expectedRealField "${name}" not covered by any catalog item.`);
  }
  if (catalog.coversAllV65ExpectedFields) details.push("PASS  coversAllV65ExpectedFields === true.");
  else issues.push("FAIL  coversAllV65ExpectedFields must be true.");

  // Source candidates: all NOT_CONNECTED / runtime off / fetch off / op off / not authorized-connected.
  const knownSources = new Set(catalog.sourceCandidates.map((s) => s.sourceName));
  for (const s of catalog.sourceCandidates) {
    const tag = s.sourceName;
    if (s.connectionStatus === "NOT_CONNECTED") details.push(`PASS  [${tag}] connectionStatus NOT_CONNECTED.`); else issues.push(`FAIL  [${tag}] connectionStatus must be NOT_CONNECTED.`);
    if (s.authorizationStatus === "NOT_AUTHORIZED" || s.authorizationStatus === "PENDING_MANUAL_REVIEW") details.push(`PASS  [${tag}] authorizationStatus ${s.authorizationStatus}.`); else issues.push(`FAIL  [${tag}] authorizationStatus must be NOT_AUTHORIZED or PENDING_MANUAL_REVIEW.`);
    if (s.runtimeEnabled === false) details.push(`PASS  [${tag}] runtimeEnabled false.`); else issues.push(`FAIL  [${tag}] runtimeEnabled must be false.`);
    if (s.fetchAllowed === false) details.push(`PASS  [${tag}] fetchAllowed false.`); else issues.push(`FAIL  [${tag}] fetchAllowed must be false.`);
    if (s.operationalUseAllowed === false) details.push(`PASS  [${tag}] operationalUseAllowed false.`); else issues.push(`FAIL  [${tag}] operationalUseAllowed must be false.`);
    if (s.envReadPerformed === false && s.apiRouteCreated === false && s.supabaseConnected === false) details.push(`PASS  [${tag}] env/apiRoute/supabase all false.`); else issues.push(`FAIL  [${tag}] env/apiRoute/supabase must all be false.`);
  }

  // Field catalog items: non-empty acceptableSources, all known, currentStatus, flags.
  for (const item of catalog.fieldCatalogItems) {
    const tag = item.fieldName;
    if (item.acceptableSources.length > 0) details.push(`PASS  [${tag}] has acceptableSources.`); else issues.push(`FAIL  [${tag}] must have at least one acceptableSource.`);
    const unknown = item.acceptableSources.filter((s) => !knownSources.has(s));
    if (unknown.length === 0) details.push(`PASS  [${tag}] all acceptableSources resolve to a source candidate.`); else issues.push(`FAIL  [${tag}] unknown acceptableSources: ${unknown.join(", ")}.`);
    if (knownSources.has(item.preferredSourceName)) details.push(`PASS  [${tag}] preferredSourceName resolves.`); else issues.push(`FAIL  [${tag}] preferredSourceName must resolve to a source candidate.`);
    if (item.currentStatus === "SPEC_DEFINED_NOT_CONNECTED") details.push(`PASS  [${tag}] currentStatus SPEC_DEFINED_NOT_CONNECTED.`); else issues.push(`FAIL  [${tag}] currentStatus must be SPEC_DEFINED_NOT_CONNECTED.`);
    if (item.manualSignoffRequired === true && item.manualSignoffCompleted === false) details.push(`PASS  [${tag}] manual sign-off required/not-completed.`); else issues.push(`FAIL  [${tag}] manualSignoffRequired true + manualSignoffCompleted false expected.`);
    if (item.stagingReadOnlyRequired === true && item.stagingReadOnlyConnected === false) details.push(`PASS  [${tag}] staging read-only required/not-connected.`); else issues.push(`FAIL  [${tag}] stagingReadOnlyRequired true + stagingReadOnlyConnected false expected.`);
    if (item.shadowComparisonRequired === true && item.shadowComparisonCompleted === false) details.push(`PASS  [${tag}] shadow comparison required/not-completed.`); else issues.push(`FAIL  [${tag}] shadowComparisonRequired true + shadowComparisonCompleted false expected.`);
    if (item.productionSwitchAllowed === false && item.operationalUseAllowed === false) details.push(`PASS  [${tag}] production/operational disallowed.`); else issues.push(`FAIL  [${tag}] productionSwitchAllowed + operationalUseAllowed must be false.`);
  }

  // Self-validations.
  if (catalog.allValid) details.push("PASS  catalog.allValid === true.");
  else issues.push("FAIL  catalog.allValid must be true.");

  return {
    result: { name: "catalog_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: catalog.decision,
    sourceCount: catalog.sourceCandidates.length,
    itemCount: catalog.fieldCatalogItems.length,
    covers: catalog.coversAllV65ExpectedFields,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: Source boundary + catalog-level flags
// ---------------------------------------------------------------------------

function checkBoundaryAndFlags(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const catalog = buildAuthorizedRealQuoteFieldCatalogContract({ generatedAt: FIXED_TS });

  const sb = catalog.sourceBoundary as unknown as Record<string, unknown>;
  const boundaryTrue = ["manualSignoffRequired", "stagingReadOnlyRequired", "shadowComparisonRequired"];
  const boundaryFalse = [
    "manualSignoffCompleted", "stagingReadOnlyConnected", "shadowComparisonCompleted", "productionSwitchAllowed",
    "serviceRoleAllowedInAppRuntime", "writeOperationsAllowed", "buySellCommandGenerated", "autoOrderRequested",
  ];
  for (const f of boundaryTrue) {
    if (sb[f] === true) details.push(`PASS  sourceBoundary.${f} === true.`);
    else issues.push(`FAIL  sourceBoundary.${f} must be true.`);
  }
  for (const f of boundaryFalse) {
    if (sb[f] === false) details.push(`PASS  sourceBoundary.${f} === false.`);
    else issues.push(`FAIL  sourceBoundary.${f} must be false.`);
  }

  const rec = catalog as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed", "fetchPerformed",
    "supabaseConnected", "databaseWritePerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) {
    if (rec[f] === false) details.push(`PASS  ${f} === false.`);
    else issues.push(`FAIL  ${f} === ${JSON.stringify(rec[f])}, expected false.`);
  }

  return { name: "boundary_and_flags", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  for (const term of ["Authorized source catalog", "SPEC_ONLY_NOT_CONNECTED", "尚未授權任何真實行情來源，fixture 區間不可作為正式操作依據"]) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI contains "${term}".`);
    else issues.push(`FAIL  daily pools UI must contain "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Authorized Real Quote Field Catalog", "sourceCatalogMode", "NOT_CONNECTED"]) {
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

  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const stripped = stripComments(body);
    const lower = stripped.toLowerCase();
    for (const token of SPEC_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
    if (stripped.includes("PRODUCTION_READY")) issues.push(`FAIL  Forbidden "PRODUCTION_READY" present in ${rel}.`);
    else details.push(`PASS  No "PRODUCTION_READY" in ${rel}.`);
  }

  const forbiddenArtifacts = [
    "app/api/portfolio/real-quote-source/route.ts",
    "app/api/real-quote-source/route.ts",
    "app/api/authorized-source/route.ts",
    "supabase/authorized_real_quote_source.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V66.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/descriptor-to-real-quote-mapping-contract.ts",
    "use-cases/war-room/build-descriptor-to-real-quote-mapping-contract.ts",
    "use-cases/war-room/candidate-price-level-fixture-source-contract.ts",
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
  '"test:authorized-real-quote-field-catalog": "node --require ./scripts/register-typescript.cjs ./scripts/validate-authorized-real-quote-field-catalog.ts"',
];

const README_TERMS: string[] = [
  "V66",
  "Authorized Real Quote Field Catalog & Source Boundary",
  "docs/authorized-real-quote-field-catalog.md",
  "use-cases/war-room/authorized-real-quote-field-catalog-contract.ts",
  "npm run test:authorized-real-quote-field-catalog",
  "SPEC_ONLY_NOT_CONNECTED",
  "PENDING_MANUAL_REVIEW",
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
const { result: catalogCheck, decision, sourceCount, itemCount, covers } = checkCatalog();
const boundaryCheck = checkBoundaryAndFlags();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  catalogCheck,
  boundaryCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: CatalogSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    catalog_checks: catalogCheck.status,
    boundary_and_flags: boundaryCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  source_candidate_count: sourceCount,
  field_catalog_item_count: itemCount,
  covers_all_v65_expected_fields: covers,
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
