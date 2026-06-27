/**
 * Candidate Price Level Fixture Source Validator — V64
 *
 * Static + pure-function check. Imports the fixture source builder, the V63
 * structured trade plan builder, and the model builder, then proves every trade
 * plan maps to a descriptor, every descriptor maps to an existing candidate, and
 * the price levels are identical. It does NOT start a Next.js server, make any HTTP
 * request, connect to Supabase, read env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * builder code files (NOT the doc, which legitimately discusses "not
 * PRODUCTION_READY"). The safety FLAG `autoOrderRequested` legitimately contains
 * "autoorder", so autoorder / placeorder are not scanned in those files.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const sourceBuilderModule = require("../use-cases/war-room/build-candidate-price-level-fixture-source-contract") as typeof import("../use-cases/war-room/build-candidate-price-level-fixture-source-contract");
const tradePlanBuilderModule = require("../use-cases/war-room/build-structured-candidate-trade-plan-contract") as typeof import("../use-cases/war-room/build-structured-candidate-trade-plan-contract");
const modelModule = require("../use-cases/war-room/build-allen-score-scoring-model-contract") as typeof import("../use-cases/war-room/build-allen-score-scoring-model-contract");

const { buildCandidatePriceLevelFixtureSourceContract } = sourceBuilderModule;
const { buildStructuredCandidateTradePlanContract } = tradePlanBuilderModule;
const { buildAllenScoreScoringModelContract } = modelModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface SourceSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
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

const DOC_REL = "docs/candidate-price-level-fixture-source.md";
const CONTRACT_REL = "use-cases/war-room/candidate-price-level-fixture-source-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-candidate-price-level-fixture-source-contract.ts";
const TRADE_PLAN_BUILDER_REL = "use-cases/war-room/build-structured-candidate-trade-plan-contract.ts";
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
    { label: "Fixture source doc (new)", rel: DOC_REL },
    { label: "Fixture source contract (new)", rel: CONTRACT_REL },
    { label: "Fixture source builder (new)", rel: BUILDER_REL },
    { label: "Trade plan builder (modified)", rel: TRADE_PLAN_BUILDER_REL },
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
  "V64",
  "Trade Plan Fixture Source Descriptor",
  "Candidate Price Level Descriptor",
  "Mapping Boundary",
  "fixture-only",
  "deterministic contract",
  "fixture_mock",
  "realMappingStatus",
  "NOT_CONNECTED",
  "futureRealSourceAllowed false",
  "operationalUseAllowed false",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "stagingReadOnlyRequired true",
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
  "CandidatePriceLevelFixtureSource",
  "CandidatePriceLevelDescriptor",
  "CandidatePriceLevelMappingBoundary",
  "CandidatePriceLevelFixtureSourceBundle",
  "CandidatePriceLevelFixtureSourceValidation",
  'sourceType: "fixture_mock"',
  'currency: "TWD"',
  "operationalUseAllowed: false",
  'realMappingStatus: RealMappingStatus',
  "futureRealSourceAllowed: false",
  "generatedBuySellCommand: false",
  "autoOrderRequested: false",
  "manualSignoffRequired: true",
  "manualSignoffCompleted: false",
  "stagingReadOnlyRequired: true",
  "productionSwitchAllowed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Consistency (descriptor <-> trade plan price levels)
// ---------------------------------------------------------------------------

function checkConsistency(): { result: CheckResult; decision: string; descriptorCount: number; planCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const source = buildCandidatePriceLevelFixtureSourceContract({ generatedAt: FIXED_TS });
  const tradePlan = buildStructuredCandidateTradePlanContract({ generatedAt: FIXED_TS });
  const model = buildAllenScoreScoringModelContract({ generatedAt: FIXED_TS });
  const candidateSymbols = new Set(model.dailyPools.flatMap((p) => p.candidates).map((c) => c.symbol));

  if (source.contractVersion === "V64") details.push('PASS  contractVersion === "V64".');
  else issues.push(`FAIL  contractVersion === ${JSON.stringify(source.contractVersion)}.`);
  if (source.decision === "READY_FOR_UI_REVIEW") details.push("PASS  decision === READY_FOR_UI_REVIEW.");
  else issues.push(`FAIL  decision === ${JSON.stringify(source.decision)}, expected READY_FOR_UI_REVIEW.`);
  if ((source.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');

  const descBySymbol = new Map(source.descriptors.map((d) => [d.symbol, d] as const));

  // Each descriptor maps to an existing candidate symbol + per-descriptor flags.
  for (const d of source.descriptors) {
    const tag = d.symbol;
    if (candidateSymbols.has(d.symbol)) details.push(`PASS  [${tag}] descriptor maps to existing candidate.`);
    else issues.push(`FAIL  [${tag}] descriptor does not map to an existing candidate.`);
    if (d.sourceType === "fixture_mock") details.push(`PASS  [${tag}] sourceType fixture_mock.`); else issues.push(`FAIL  [${tag}] sourceType must be fixture_mock.`);
    if (d.realMappingStatus === "NOT_CONNECTED") details.push(`PASS  [${tag}] realMappingStatus NOT_CONNECTED.`); else issues.push(`FAIL  [${tag}] realMappingStatus must be NOT_CONNECTED.`);
    if (d.operationalUseAllowed === false) details.push(`PASS  [${tag}] operationalUseAllowed false.`); else issues.push(`FAIL  [${tag}] operationalUseAllowed must be false.`);
    if (d.futureRealSourceAllowed === false) details.push(`PASS  [${tag}] futureRealSourceAllowed false.`); else issues.push(`FAIL  [${tag}] futureRealSourceAllowed must be false.`);
    if (d.generatedBuySellCommand === false) details.push(`PASS  [${tag}] generatedBuySellCommand false.`); else issues.push(`FAIL  [${tag}] generatedBuySellCommand must be false.`);
    if (d.autoOrderRequested === false) details.push(`PASS  [${tag}] autoOrderRequested false.`); else issues.push(`FAIL  [${tag}] autoOrderRequested must be false.`);
    if (d.buyZoneLower <= d.buyZoneUpper) details.push(`PASS  [${tag}] buyZoneLower <= buyZoneUpper.`); else issues.push(`FAIL  [${tag}] buyZoneLower <= buyZoneUpper violated.`);
    if (d.stopLossUpper < d.buyZoneLower) details.push(`PASS  [${tag}] stopLossUpper < buyZoneLower.`); else issues.push(`FAIL  [${tag}] stopLossUpper < buyZoneLower violated.`);
    if (d.targetLower > d.buyZoneUpper) details.push(`PASS  [${tag}] targetLower > buyZoneUpper.`); else issues.push(`FAIL  [${tag}] targetLower > buyZoneUpper violated.`);
  }

  // Each trade plan has a descriptor + identical price levels.
  for (const plan of tradePlan.tradePlans) {
    const tag = plan.symbol;
    const d = descBySymbol.get(plan.symbol);
    if (!d) {
      issues.push(`FAIL  [${tag}] trade plan has no matching descriptor.`);
      continue;
    }
    details.push(`PASS  [${tag}] trade plan has a descriptor.`);
    const priceChecks: Array<[string, number, number]> = [
      ["buyZone.lower", plan.buyZone.lower, d.buyZoneLower],
      ["buyZone.upper", plan.buyZone.upper, d.buyZoneUpper],
      ["stopLossLower", plan.riskReward.stopLossLower, d.stopLossLower],
      ["stopLossUpper", plan.riskReward.stopLossUpper, d.stopLossUpper],
      ["targetLower", plan.riskReward.targetLower, d.targetLower],
      ["targetUpper", plan.riskReward.targetUpper, d.targetUpper],
    ];
    for (const [label, planVal, descVal] of priceChecks) {
      if (planVal === descVal) details.push(`PASS  [${tag}] ${label} matches descriptor (${planVal}).`);
      else issues.push(`FAIL  [${tag}] ${label} = ${planVal} != descriptor ${descVal}.`);
    }
  }

  // Builder self-validations all valid.
  if (source.allValid) details.push("PASS  source.allValid === true.");
  else issues.push("FAIL  source.allValid must be true.");
  for (const v of source.validations) {
    if (v.valid) details.push(`PASS  [${v.symbol}] descriptor validation.valid === true.`);
    else issues.push(`FAIL  [${v.symbol}] descriptor validation must be valid.`);
  }

  return {
    result: { name: "consistency_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: source.decision,
    descriptorCount: source.descriptors.length,
    planCount: tradePlan.tradePlans.length,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: Mapping boundary + safety flags
// ---------------------------------------------------------------------------

function checkBoundaryAndFlags(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const source = buildCandidatePriceLevelFixtureSourceContract({ generatedAt: FIXED_TS });
  const mb = source.mappingBoundary as unknown as Record<string, unknown>;

  const boundaryTrue = ["manualSignoffRequired", "stagingReadOnlyRequired"];
  const boundaryFalse = ["manualSignoffCompleted", "productionSwitchAllowed"];
  for (const f of boundaryTrue) {
    if (mb[f] === true) details.push(`PASS  mappingBoundary.${f} === true.`);
    else issues.push(`FAIL  mappingBoundary.${f} === ${JSON.stringify(mb[f])}, expected true.`);
  }
  for (const f of boundaryFalse) {
    if (mb[f] === false) details.push(`PASS  mappingBoundary.${f} === false.`);
    else issues.push(`FAIL  mappingBoundary.${f} === ${JSON.stringify(mb[f])}, expected false.`);
  }

  const rec = source as unknown as Record<string, unknown>;
  const falseFlags = [
    "operationalUseAllowed", "realDataConnected", "supabaseConnected", "envReadPerformed", "databaseWritePerformed",
    "portfolioApiSwitched", "buySellCommandGenerated", "autoOrderRequested", "productionTradingReady",
  ];
  for (const f of falseFlags) {
    if (rec[f] === false) details.push(`PASS  ${f} === false.`);
    else issues.push(`FAIL  ${f} === ${JSON.stringify(rec[f])}, expected false.`);
  }
  if (rec.fixtureOnly === true) details.push("PASS  fixtureOnly === true.");
  else issues.push(`FAIL  fixtureOnly === ${JSON.stringify(rec.fixtureOnly)}, expected true.`);
  if (source.source.realMappingStatus === "NOT_CONNECTED") details.push("PASS  source.realMappingStatus NOT_CONNECTED.");
  else issues.push("FAIL  source.realMappingStatus must be NOT_CONNECTED.");

  return { name: "boundary_and_flags", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  const poolTerms = ["realMappingStatus", "NOT_CONNECTED", "未連真實報價", "fixture 區間不可作為正式操作依據"];
  for (const term of poolTerms) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI contains "${term}".`);
    else issues.push(`FAIL  daily pools UI must contain "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Mapping Boundary", "realMappingStatus", "未連真實報價"]) {
    if (safety && safety.includes(term)) details.push(`PASS  /system/safety contains "${term}".`);
    else issues.push(`FAIL  /system/safety must contain "${term}".`);
  }

  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: Safety (forbidden token scan + protected files + no API route)
// ---------------------------------------------------------------------------

// new code files: the safety FLAG `autoOrderRequested` legitimately contains
// "autoorder", so autoorder / placeorder are not scanned here.
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

  // No new API route / SQL migration in V64.
  const forbiddenArtifacts = [
    "app/api/portfolio/price-level/route.ts",
    "app/api/price-level/route.ts",
    "app/api/candidate-price-level/route.ts",
    "supabase/candidate_price_level.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V64.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/war-room-operational-layout.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/build-structured-candidate-trade-plan-contract.ts",
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
  '"test:candidate-price-level-fixture-source": "node --require ./scripts/register-typescript.cjs ./scripts/validate-candidate-price-level-fixture-source.ts"',
];

const README_TERMS: string[] = [
  "V64",
  "Trade Plan Fixture Source Descriptor",
  "docs/candidate-price-level-fixture-source.md",
  "use-cases/war-room/candidate-price-level-fixture-source-contract.ts",
  "npm run test:candidate-price-level-fixture-source",
  "realMappingStatus",
  "NOT_CONNECTED",
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
const { result: consistencyCheck, decision, descriptorCount, planCount } = checkConsistency();
const boundaryCheck = checkBoundaryAndFlags();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  consistencyCheck,
  boundaryCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: SourceSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, TRADE_PLAN_BUILDER_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    consistency_checks: consistencyCheck.status,
    boundary_and_flags: boundaryCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  descriptor_count: descriptorCount,
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
