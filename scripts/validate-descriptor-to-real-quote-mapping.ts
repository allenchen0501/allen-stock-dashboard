/**
 * Descriptor-to-Real Quote Mapping Readiness Validator — V65
 *
 * Static + pure-function check. Imports the mapping matrix builder, the V64 fixture
 * source builder, and the V63 trade plan builder, then proves every descriptor and
 * every trade plan has exactly one mapping item, that field mappings resolve to real
 * descriptor / trade plan fields, and that everything stays NOT_CONNECTED. It does
 * NOT start a server, make any HTTP request, connect to Supabase, read env keys,
 * build a runtime, or write data.
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

const matrixBuilderModule = require("../use-cases/war-room/build-descriptor-to-real-quote-mapping-contract") as typeof import("../use-cases/war-room/build-descriptor-to-real-quote-mapping-contract");
const sourceBuilderModule = require("../use-cases/war-room/build-candidate-price-level-fixture-source-contract") as typeof import("../use-cases/war-room/build-candidate-price-level-fixture-source-contract");
const tradePlanBuilderModule = require("../use-cases/war-room/build-structured-candidate-trade-plan-contract") as typeof import("../use-cases/war-room/build-structured-candidate-trade-plan-contract");

const { buildDescriptorToRealQuoteMappingContract } = matrixBuilderModule;
const { buildCandidatePriceLevelFixtureSourceContract } = sourceBuilderModule;
const { buildStructuredCandidateTradePlanContract } = tradePlanBuilderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface MatrixSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  mapping_item_count: number;
  descriptor_count: number;
  trade_plan_count: number;
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

const DOC_REL = "docs/descriptor-to-real-quote-mapping-readiness.md";
const CONTRACT_REL = "use-cases/war-room/descriptor-to-real-quote-mapping-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-descriptor-to-real-quote-mapping-contract.ts";
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
    { label: "Mapping readiness doc (new)", rel: DOC_REL },
    { label: "Mapping readiness contract (new)", rel: CONTRACT_REL },
    { label: "Mapping readiness builder (new)", rel: BUILDER_REL },
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
  "V65",
  "Descriptor-to-Real Quote Mapping Readiness Matrix",
  "fixture-only",
  "deterministic contract",
  "fixture_mock",
  "real_quote_pending",
  "NOT_CONNECTED",
  "SPEC_DEFINED_NOT_CONNECTED",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "stagingReadOnlyRequired true",
  "stagingReadOnlyConnected false",
  "shadowComparisonRequired true",
  "shadowComparisonCompleted false",
  "productionSwitchAllowed false",
  "operationalUseAllowed false",
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
  "RealQuoteExpectedField",
  "DescriptorFieldMapping",
  "TradePlanFieldMapping",
  "DescriptorToRealQuoteMappingItem",
  "DescriptorToRealQuoteMappingMatrix",
  "DescriptorToRealQuoteMappingReadinessValidation",
  'futureSourceType: FutureSourceType',
  "manualReviewRequired: true",
  "transformRuntimeEnabled: false",
  "realQuoteConnected: false",
  "mappingReadiness: MappingReadiness",
  "manualSignoffRequired: true",
  "manualSignoffCompleted: false",
  "stagingReadOnlyRequired: true",
  "stagingReadOnlyConnected: false",
  "shadowComparisonRequired: true",
  "shadowComparisonCompleted: false",
  "productionSwitchAllowed: false",
  "operationalUseAllowed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Matrix consistency
// ---------------------------------------------------------------------------

function checkMatrix(): { result: CheckResult; decision: string; itemCount: number; descCount: number; planCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const matrix = buildDescriptorToRealQuoteMappingContract({ generatedAt: FIXED_TS });
  const source = buildCandidatePriceLevelFixtureSourceContract({ generatedAt: FIXED_TS });
  const tradePlan = buildStructuredCandidateTradePlanContract({ generatedAt: FIXED_TS });

  if (matrix.contractVersion === "V65") details.push('PASS  contractVersion === "V65".');
  else issues.push(`FAIL  contractVersion === ${JSON.stringify(matrix.contractVersion)}.`);
  if (matrix.specName.includes("Descriptor-to-Real Quote Mapping Readiness Matrix")) details.push("PASS  specName contains the matrix name.");
  else issues.push("FAIL  specName must contain Descriptor-to-Real Quote Mapping Readiness Matrix.");
  if (matrix.decision === "READY_FOR_UI_REVIEW") details.push("PASS  decision === READY_FOR_UI_REVIEW.");
  else issues.push(`FAIL  decision === ${JSON.stringify(matrix.decision)}.`);
  if ((matrix.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');

  const descriptorSymbols = source.descriptors.map((d) => d.symbol);
  const planSymbols = tradePlan.tradePlans.map((p) => p.symbol);
  const itemBySymbol = new Map(matrix.mappingItems.map((m) => [m.symbol, m] as const));
  const descBySymbol = new Map(source.descriptors.map((d) => [d.symbol, d] as const));
  const planBySymbol = new Map(tradePlan.tradePlans.map((p) => [p.symbol, p] as const));

  // Each descriptor has a mapping item.
  for (const sym of descriptorSymbols) {
    if (itemBySymbol.has(sym)) details.push(`PASS  descriptor ${sym} has a mapping item.`);
    else issues.push(`FAIL  descriptor ${sym} has no mapping item.`);
  }
  // Each trade plan has a mapping item.
  for (const sym of planSymbols) {
    if (itemBySymbol.has(sym)) details.push(`PASS  trade plan ${sym} has a mapping item.`);
    else issues.push(`FAIL  trade plan ${sym} has no mapping item.`);
  }
  // Each mapping item maps to a descriptor + trade plan (symbol consistency).
  for (const item of matrix.mappingItems) {
    if (descBySymbol.has(item.symbol) && planBySymbol.has(item.symbol)) {
      details.push(`PASS  mapping item ${item.symbol} symbol consistent with descriptor + trade plan.`);
    } else issues.push(`FAIL  mapping item ${item.symbol} symbol not consistent with descriptor + trade plan.`);
  }

  const descKeysBySymbol = new Map(
    source.descriptors.map((d) => [d.symbol, new Set(Object.keys(d))] as const),
  );
  const resolvePath = (obj: unknown, dotted: string): boolean => {
    let cursor: unknown = obj;
    for (const key of dotted.split(".")) {
      if (cursor != null && typeof cursor === "object" && key in (cursor as Record<string, unknown>)) {
        cursor = (cursor as Record<string, unknown>)[key];
      } else return false;
    }
    return cursor !== undefined;
  };

  // Per-item flag + non-empty + field-resolution checks.
  for (const item of matrix.mappingItems) {
    const tag = item.symbol;
    const fail = (m: string): void => { issues.push(`FAIL  [${tag}] ${m}`); };
    if (item.realQuoteConnected === false) details.push(`PASS  [${tag}] realQuoteConnected false.`); else fail("realQuoteConnected must be false.");
    if (item.realMappingStatus === "NOT_CONNECTED") details.push(`PASS  [${tag}] realMappingStatus NOT_CONNECTED.`); else fail("realMappingStatus must be NOT_CONNECTED.");
    if (item.mappingReadiness === "SPEC_DEFINED_NOT_CONNECTED") details.push(`PASS  [${tag}] mappingReadiness SPEC_DEFINED_NOT_CONNECTED.`); else fail("mappingReadiness must be SPEC_DEFINED_NOT_CONNECTED.");
    if (item.manualSignoffRequired === true) details.push(`PASS  [${tag}] manualSignoffRequired true.`); else fail("manualSignoffRequired must be true.");
    if (item.manualSignoffCompleted === false) details.push(`PASS  [${tag}] manualSignoffCompleted false.`); else fail("manualSignoffCompleted must be false.");
    if (item.stagingReadOnlyRequired === true) details.push(`PASS  [${tag}] stagingReadOnlyRequired true.`); else fail("stagingReadOnlyRequired must be true.");
    if (item.stagingReadOnlyConnected === false) details.push(`PASS  [${tag}] stagingReadOnlyConnected false.`); else fail("stagingReadOnlyConnected must be false.");
    if (item.shadowComparisonRequired === true) details.push(`PASS  [${tag}] shadowComparisonRequired true.`); else fail("shadowComparisonRequired must be true.");
    if (item.shadowComparisonCompleted === false) details.push(`PASS  [${tag}] shadowComparisonCompleted false.`); else fail("shadowComparisonCompleted must be false.");
    if (item.productionSwitchAllowed === false) details.push(`PASS  [${tag}] productionSwitchAllowed false.`); else fail("productionSwitchAllowed must be false.");
    if (item.operationalUseAllowed === false) details.push(`PASS  [${tag}] operationalUseAllowed false.`); else fail("operationalUseAllowed must be false.");
    if (item.generatedBuySellCommand === false) details.push(`PASS  [${tag}] generatedBuySellCommand false.`); else fail("generatedBuySellCommand must be false.");
    if (item.autoOrderRequested === false) details.push(`PASS  [${tag}] autoOrderRequested false.`); else fail("autoOrderRequested must be false.");
    if (item.expectedRealFields.length > 0) details.push(`PASS  [${tag}] expectedRealFields non-empty.`); else fail("expectedRealFields must be non-empty.");
    if (item.descriptorFieldMappings.length > 0) details.push(`PASS  [${tag}] descriptorFieldMappings non-empty.`); else fail("descriptorFieldMappings must be non-empty.");
    if (item.tradePlanFieldMappings.length > 0) details.push(`PASS  [${tag}] tradePlanFieldMappings non-empty.`); else fail("tradePlanFieldMappings must be non-empty.");

    const descKeys = descKeysBySymbol.get(item.symbol) ?? new Set<string>();
    const plan = planBySymbol.get(item.symbol);
    const descResolves = item.descriptorFieldMappings.every((m) => descKeys.has(m.descriptorFieldName));
    if (descResolves) details.push(`PASS  [${tag}] every descriptorFieldMapping resolves to a V64 descriptor field.`);
    else fail("a descriptorFieldMapping does not resolve to a V64 descriptor field.");
    const planResolves =
      plan != null &&
      item.tradePlanFieldMappings.every(
        (m) => resolvePath(plan, m.tradePlanFieldName) && descKeys.has(m.derivedFromDescriptorField),
      );
    if (planResolves) details.push(`PASS  [${tag}] every tradePlanFieldMapping resolves to a V63 trade plan field.`);
    else fail("a tradePlanFieldMapping does not resolve to a V63 trade plan field.");
  }

  // Builder self-validations all valid.
  if (matrix.allValid) details.push("PASS  matrix.allValid === true.");
  else issues.push("FAIL  matrix.allValid must be true.");
  for (const v of matrix.validations) {
    if (v.valid) details.push(`PASS  [${v.symbol}] mapping validation.valid === true.`);
    else issues.push(`FAIL  [${v.symbol}] mapping validation must be valid.`);
  }

  return {
    result: { name: "matrix_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: matrix.decision,
    itemCount: matrix.mappingItems.length,
    descCount: source.descriptors.length,
    planCount: tradePlan.tradePlans.length,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: Matrix-level safety flags
// ---------------------------------------------------------------------------

function checkMatrixFlags(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const matrix = buildDescriptorToRealQuoteMappingContract({ generatedAt: FIXED_TS });
  const rec = matrix as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed", "supabaseConnected",
    "databaseWritePerformed", "fetchPerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) {
    if (rec[f] === false) details.push(`PASS  ${f} === false.`);
    else issues.push(`FAIL  ${f} === ${JSON.stringify(rec[f])}, expected false.`);
  }
  if (matrix.sourceType === "fixture_mock") details.push("PASS  sourceType fixture_mock.");
  else issues.push("FAIL  sourceType must be fixture_mock.");
  return { name: "matrix_flags", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  for (const term of ["Real quote mapping", "SPEC_DEFINED_NOT_CONNECTED", "尚未連真實行情，fixture 區間不可作為正式操作依據"]) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI contains "${term}".`);
    else issues.push(`FAIL  daily pools UI must contain "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Descriptor-to-Real Quote Mapping Readiness", "mappingReadiness", "realMappingStatus"]) {
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
    "app/api/portfolio/real-quote-mapping/route.ts",
    "app/api/real-quote-mapping/route.ts",
    "app/api/descriptor-mapping/route.ts",
    "supabase/real_quote_mapping.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V65.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/candidate-price-level-fixture-source-contract.ts",
    "use-cases/war-room/build-candidate-price-level-fixture-source-contract.ts",
    "use-cases/war-room/structured-candidate-trade-plan-contract.ts",
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
  '"test:descriptor-to-real-quote-mapping": "node --require ./scripts/register-typescript.cjs ./scripts/validate-descriptor-to-real-quote-mapping.ts"',
];

const README_TERMS: string[] = [
  "V65",
  "Descriptor-to-Real Quote Mapping Readiness Matrix",
  "docs/descriptor-to-real-quote-mapping-readiness.md",
  "use-cases/war-room/descriptor-to-real-quote-mapping-contract.ts",
  "npm run test:descriptor-to-real-quote-mapping",
  "SPEC_DEFINED_NOT_CONNECTED",
  "real_quote_pending",
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
const { result: matrixCheck, decision, itemCount, descCount, planCount } = checkMatrix();
const flagsCheck = checkMatrixFlags();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  matrixCheck,
  flagsCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: MatrixSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    matrix_checks: matrixCheck.status,
    matrix_flags: flagsCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  mapping_item_count: itemCount,
  descriptor_count: descCount,
  trade_plan_count: planCount,
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
