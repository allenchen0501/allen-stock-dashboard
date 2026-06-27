/**
 * Conflict to Trade Plan Verification Downgrade Validator — V68
 *
 * Static + pure-function check. Imports the downgrade matrix builder, the engine, the
 * V67 policy builder, and the V63 trade plan builder, then proves every conflict
 * result downgrades a trade plan, no sample uses VERIFIED, and every result is
 * observation-only / operational-use-blocked. It does NOT start a server, make any
 * HTTP request, connect to Supabase, read env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * engine / builder code files (NOT the doc). The safety FLAG `autoOrderRequested`
 * legitimately contains "autoorder", so autoorder / placeorder are not scanned there.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const matrixBuilderModule = require("../use-cases/war-room/build-conflict-to-trade-plan-verification-contract") as typeof import("../use-cases/war-room/build-conflict-to-trade-plan-verification-contract");
const engineModule = require("../use-cases/war-room/conflict-to-trade-plan-verification-engine") as typeof import("../use-cases/war-room/conflict-to-trade-plan-verification-engine");
const policyBuilderModule = require("../use-cases/war-room/build-real-quote-source-conflict-resolution-policy-contract") as typeof import("../use-cases/war-room/build-real-quote-source-conflict-resolution-policy-contract");
const tradePlanBuilderModule = require("../use-cases/war-room/build-structured-candidate-trade-plan-contract") as typeof import("../use-cases/war-room/build-structured-candidate-trade-plan-contract");

const { buildConflictToTradePlanVerificationContract } = matrixBuilderModule;
const { mapConflictResultToVerificationStatus, mapConflictResultToDisplayMode, buildTradePlanDowngradeResult } = engineModule;
const { buildRealQuoteSourceConflictResolutionPolicyContract } = policyBuilderModule;
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
  downgrade_rule_count: number;
  sample_downgrade_count: number;
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

const DOC_REL = "docs/conflict-to-trade-plan-verification.md";
const CONTRACT_REL = "use-cases/war-room/conflict-to-trade-plan-verification-contract.ts";
const ENGINE_REL = "use-cases/war-room/conflict-to-trade-plan-verification-engine.ts";
const BUILDER_REL = "use-cases/war-room/build-conflict-to-trade-plan-verification-contract.ts";
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
    { label: "Downgrade matrix doc (new)", rel: DOC_REL },
    { label: "Downgrade matrix contract (new)", rel: CONTRACT_REL },
    { label: "Downgrade engine (new)", rel: ENGINE_REL },
    { label: "Downgrade matrix builder (new)", rel: BUILDER_REL },
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
  "V68",
  "Conflict Resolution to Trade Plan Verification Downgrade Matrix",
  "SPEC_ONLY_NOT_CONNECTED",
  "TradePlanVerificationStatus",
  "TradePlanDisplayMode",
  "SOURCE_CONFLICT",
  "STALE_DATA",
  "MISSING_DATA",
  "UNAUTHORIZED_SOURCE",
  "MANUAL_REVIEW_REQUIRED",
  "OBSERVATION_ONLY",
  "BLOCKED",
  "VERIFIED future-only",
  "observation only",
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
  "TradePlanVerificationStatus",
  "TradePlanDisplayMode",
  "TradePlanVerificationDowngradeRule",
  "TradePlanVerificationDowngradeResult",
  "ConflictToTradePlanVerificationMatrix",
  "ConflictToTradePlanVerificationValidation",
  "observationOnly: true",
  "operationalUseAllowed: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "manualSignoffRequired: true",
  "manualSignoffCompleted: false",
  "productionSwitchAllowed: false",
  "VERIFIED",
];

// ---------------------------------------------------------------------------
// Gate 4: Matrix checks
// ---------------------------------------------------------------------------

function checkMatrix(): { result: CheckResult; decision: string; ruleCount: number; sampleCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const matrix = buildConflictToTradePlanVerificationContract({ generatedAt: FIXED_TS });
  const policy = buildRealQuoteSourceConflictResolutionPolicyContract({ generatedAt: FIXED_TS });
  const model = buildStructuredCandidateTradePlanContract({ generatedAt: FIXED_TS });
  const planSymbols = new Set(model.tradePlans.map((p) => p.symbol));

  if (matrix.contractVersion === "V68") details.push('PASS  contractVersion === "V68".');
  else issues.push(`FAIL  contractVersion === ${JSON.stringify(matrix.contractVersion)}.`);
  if (matrix.specName.includes("Conflict Resolution to Trade Plan Verification Downgrade Matrix")) details.push("PASS  specName contains the matrix name.");
  else issues.push("FAIL  specName must contain the matrix name.");
  if (matrix.matrixMode === "SPEC_ONLY_NOT_CONNECTED") details.push("PASS  matrixMode SPEC_ONLY_NOT_CONNECTED.");
  else issues.push("FAIL  matrixMode must be SPEC_ONLY_NOT_CONNECTED.");
  if (matrix.decision === "READY_FOR_UI_REVIEW" || matrix.decision === "NO_GO") details.push(`PASS  decision === ${matrix.decision}.`);
  else issues.push(`FAIL  decision === ${JSON.stringify(matrix.decision)}.`);
  if ((matrix.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');

  // Every V67 sample resolution result has a downgrade.
  if (matrix.sampleDowngradeResults.length >= policy.sampleResolutionResults.length && matrix.sampleDowngradeResults.length > 0)
    details.push(`PASS  every V67 sample resolution result has a downgrade (${matrix.sampleDowngradeResults.length} >= ${policy.sampleResolutionResults.length}).`);
  else issues.push("FAIL  every V67 sample resolution result must have a downgrade result.");

  // Every downgrade maps to a V63 trade plan.
  for (const r of matrix.sampleDowngradeResults) {
    if (planSymbols.has(r.symbol)) details.push(`PASS  downgrade ${r.symbol} maps to a V63 trade plan.`);
    else issues.push(`FAIL  downgrade ${r.symbol} does not map to a V63 trade plan.`);
  }

  // No VERIFIED in samples; conflict never VERIFIED.
  if (matrix.sampleDowngradeResults.every((r) => r.tradePlanVerificationStatus !== "VERIFIED")) details.push("PASS  no sample uses VERIFIED.");
  else issues.push("FAIL  sample downgrade results must not use VERIFIED (future-only).");
  if (matrix.sampleDowngradeResults.every((r) => !r.conflictDetected || r.tradePlanVerificationStatus !== "VERIFIED")) details.push("PASS  conflictDetected never VERIFIED.");
  else issues.push("FAIL  conflictDetected must never be VERIFIED.");

  // Per-result flags.
  const allTrue = (pred: (r: typeof matrix.sampleDowngradeResults[number]) => boolean): boolean => matrix.sampleDowngradeResults.every(pred);
  const flagCheck = (label: string, ok: boolean): void => { if (ok) details.push(`PASS  ${label}.`); else issues.push(`FAIL  ${label} — failed.`); };
  flagCheck("all operationalUseAllowed false", allTrue((r) => r.operationalUseAllowed === false));
  flagCheck("all observationOnly true", allTrue((r) => r.observationOnly === true));
  flagCheck("all buySellCommandGenerated false", allTrue((r) => r.buySellCommandGenerated === false));
  flagCheck("all autoOrderRequested false", allTrue((r) => r.autoOrderRequested === false));
  flagCheck("all manualSignoffRequired true", allTrue((r) => r.manualSignoffRequired === true));
  flagCheck("all manualSignoffCompleted false", allTrue((r) => r.manualSignoffCompleted === false));
  flagCheck("all productionSwitchAllowed false", allTrue((r) => r.productionSwitchAllowed === false));

  // Conditional display-mode consistency (signal substring → allowed modes).
  const has = (s: string, kw: string): boolean => s.toLowerCase().includes(kw);
  const missingOk = allTrue((r) => !has(r.sourceResolutionStatus, "missing") || r.tradePlanDisplayMode === "SHOW_BLOCKED_MISSING_DATA" || r.tradePlanDisplayMode === "HIDE_OPERATIONAL_LEVELS");
  const staleOk = allTrue((r) => !has(r.sourceResolutionStatus, "stale") || r.tradePlanDisplayMode === "SHOW_BLOCKED_STALE_DATA" || r.tradePlanDisplayMode === "SHOW_OBSERVATION_ONLY");
  const unauthorizedOk = allTrue((r) => !has(r.sourceResolutionStatus, "unauthorized") || r.tradePlanDisplayMode === "SHOW_BLOCKED_UNAUTHORIZED" || r.tradePlanDisplayMode === "HIDE_OPERATIONAL_LEVELS");
  const conflictOk = allTrue((r) => !has(r.sourceResolutionStatus, "conflict") || r.tradePlanDisplayMode === "SHOW_BLOCKED_CONFLICT" || r.tradePlanDisplayMode === "SHOW_OBSERVATION_ONLY");
  flagCheck("missing display mode consistent", missingOk);
  flagCheck("stale display mode consistent", staleOk);
  flagCheck("unauthorized display mode consistent", unauthorizedOk);
  flagCheck("conflict display mode consistent", conflictOk);

  // Coverage: at least one of each scenario present (so the conditionals are non-vacuous).
  const statuses = matrix.sampleDowngradeResults.map((r) => r.sourceResolutionStatus.toLowerCase());
  for (const kw of ["missing", "stale", "unauthorized", "conflict"]) {
    if (statuses.some((s) => s.includes(kw))) details.push(`PASS  sample covers "${kw}" signal.`);
    else issues.push(`FAIL  sample must cover "${kw}" signal.`);
  }

  // Engine: mapping never returns VERIFIED; conflict → blocked conflict mode.
  const synthetic = {
    fieldName: "lastPrice",
    conflictDetected: true,
    selectedSourceName: "x",
    selectedValuePreview: "y",
    rejectedSourceNames: [],
    degradedStatus: "BLOCKED_NOT_CONNECTED" as const,
    resolutionReason: "r",
    verificationStatus: "NOT_CONNECTED",
    operationalUseAllowed: false as const,
    requiresManualReview: true as const,
    manualSignoffRequired: true as const,
    manualSignoffCompleted: false as const,
    productionSwitchAllowed: false as const,
  };
  if (mapConflictResultToVerificationStatus(synthetic) !== "VERIFIED") details.push("PASS  mapConflictResultToVerificationStatus never VERIFIED for conflict.");
  else issues.push("FAIL  mapConflictResultToVerificationStatus must not return VERIFIED for conflict.");
  if (mapConflictResultToDisplayMode(synthetic) === "SHOW_BLOCKED_CONFLICT") details.push("PASS  mapConflictResultToDisplayMode → SHOW_BLOCKED_CONFLICT for conflict.");
  else issues.push("FAIL  mapConflictResultToDisplayMode must map conflict to SHOW_BLOCKED_CONFLICT.");
  const built = buildTradePlanDowngradeResult({ symbol: "A100", name: "甲" }, synthetic, matrix.downgradeRules);
  if (built.operationalUseAllowed === false && built.observationOnly === true) details.push("PASS  buildTradePlanDowngradeResult returns observation-only blocked result.");
  else issues.push("FAIL  buildTradePlanDowngradeResult must return an observation-only blocked result.");

  if (matrix.validation.valid) details.push("PASS  matrix.validation.valid === true.");
  else issues.push("FAIL  matrix.validation.valid must be true.");

  return {
    result: { name: "matrix_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: matrix.decision,
    ruleCount: matrix.downgradeRules.length,
    sampleCount: matrix.sampleDowngradeResults.length,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: Matrix-level safety flags
// ---------------------------------------------------------------------------

function checkMatrixFlags(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const matrix = buildConflictToTradePlanVerificationContract({ generatedAt: FIXED_TS });
  const rec = matrix as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed", "fetchPerformed",
    "supabaseConnected", "databaseWritePerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) {
    if (rec[f] === false) details.push(`PASS  ${f} === false.`);
    else issues.push(`FAIL  ${f} === ${JSON.stringify(rec[f])}, expected false.`);
  }
  return { name: "matrix_flags", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  for (const term of ["Trade plan verification", "SPEC_ONLY_NOT_CONNECTED", "來源衝突或缺值時，承接區會降級為觀察，不可作為正式操作依據"]) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI contains "${term}".`);
    else issues.push(`FAIL  daily pools UI must contain "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Conflict to Trade Plan Verification Downgrade", "matrixMode", "observationOnly"]) {
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

  for (const rel of [CONTRACT_REL, ENGINE_REL, BUILDER_REL]) {
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
    "app/api/portfolio/trade-plan-verification/route.ts",
    "app/api/trade-plan-verification/route.ts",
    "supabase/trade_plan_verification.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V68.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/real-quote-source-conflict-resolution-policy-contract.ts",
    "use-cases/war-room/build-real-quote-source-conflict-resolution-policy-contract.ts",
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
  '"test:conflict-to-trade-plan-verification": "node --require ./scripts/register-typescript.cjs ./scripts/validate-conflict-to-trade-plan-verification.ts"',
];

const README_TERMS: string[] = [
  "V68",
  "Conflict Resolution to Trade Plan Verification Downgrade Matrix",
  "docs/conflict-to-trade-plan-verification.md",
  "use-cases/war-room/conflict-to-trade-plan-verification-engine.ts",
  "npm run test:conflict-to-trade-plan-verification",
  "VERIFIED future-only",
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
const { result: matrixCheck, decision, ruleCount, sampleCount } = checkMatrix();
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
  checked_files: [DOC_REL, CONTRACT_REL, ENGINE_REL, BUILDER_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
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
  downgrade_rule_count: ruleCount,
  sample_downgrade_count: sampleCount,
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
