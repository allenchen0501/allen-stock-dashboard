/**
 * Safety Chain CI Guard Validator — V73
 *
 * Static + pure-function check. Imports the guard builder (which aggregates V60–V72
 * in-process) and proves every chain check passed, all NO_GO / runtime / operational
 * / production-switch locks are preserved, and the guard stays spec-only. It does NOT
 * start a server, make any HTTP request, connect to Supabase, read env keys, build a
 * runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * builder code files (NOT the doc). The builder lists `autoOrderRequested` as a flag
 * name to scan for, so autoorder / placeorder are not scanned in those files.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const phase2Module = require("../use-cases/war-room/build-phase-2-locked-implementation-contract") as typeof import("../use-cases/war-room/build-phase-2-locked-implementation-contract");
const phase2bModule = require("../use-cases/war-room/build-shadow-quote-comparison-view-model") as typeof import("../use-cases/war-room/build-shadow-quote-comparison-view-model");
const scaffoldModule = require("../use-cases/war-room/build-shadow-runtime-comparison") as typeof import("../use-cases/war-room/build-shadow-runtime-comparison");
const scopeModule = require("../use-cases/war-room/build-limited-live-fetch-scope-contract") as typeof import("../use-cases/war-room/build-limited-live-fetch-scope-contract");
const { buildSafetyChainCiGuardContract } = builderModule;
const { buildPhase2LockedImplementationContract } = phase2Module;
const { buildShadowQuoteComparisonViewModel } = phase2bModule;
const { buildStagingShadowRuntimeContract } = scaffoldModule;
const { buildLimitedLiveFetchScopeContract } = scopeModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface GuardSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
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

const DOC_REL = "docs/safety-chain-ci-guard.md";
const CONTRACT_REL = "use-cases/war-room/safety-chain-ci-guard-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-safety-chain-ci-guard-contract.ts";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

const REQUIRED_SCRIPTS = [
  "test:allen-war-room-operational-layout",
  "test:allen-score-scoring-model",
  "test:allen-score-deterministic-scoring-engine",
  "test:structured-candidate-trade-plan",
  "test:candidate-price-level-fixture-source",
  "test:descriptor-to-real-quote-mapping",
  "test:authorized-real-quote-field-catalog",
  "test:real-quote-source-conflict-resolution-policy",
  "test:conflict-to-trade-plan-verification",
  "test:downgraded-trade-plan-ui-behavior",
  "test:unified-connection-evidence-ledger",
  "test:evidence-ledger-transition",
  "test:ledger-integrity-rollup",
  "test:phase-2-locked-implementation",
  "test:phase-2b-shadow-comparison-ui-shell",
  "test:staging-shadow-runtime-scaffold",
  "test:limited-live-fetch-dry-run-pr-scope",
];

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Guard doc (new)", rel: DOC_REL },
    { label: "Guard contract (new)", rel: CONTRACT_REL },
    { label: "Guard builder (new)", rel: BUILDER_REL },
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
  "V73",
  "Safety Chain CI Guard",
  "SPEC_ONLY_CI_GUARD",
  "READY_FOR_CI_GUARD",
  "fixture/mock safe mode",
  "NOT_CONNECTED",
  "SPEC_ONLY_NOT_CONNECTED",
  "SPEC_ONLY_PENDING_EVIDENCE",
  "SPEC_ONLY_PREVIEW_NOT_CONNECTED",
  "SPEC_ONLY_SAFETY_GATE",
  "NO_GO",
  "READY_FOR_UI_REVIEW is not production ready",
  "allRuntimeFlagsFalse true",
  "allOperationalUseBlocked true",
  "productionSwitchStillBlocked true",
  "realDataConnected false",
  "runtimeCreated false",
  "apiRouteCreated false",
  "envReadPerformed false",
  "fetchPerformed false",
  "supabaseConnected false",
  "databaseWritePerformed false",
  "portfolioApiSwitched false",
  "productionReady false",
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
  "SafetyChainCiGuardCheck",
  "SafetyChainCiGuardResult",
  "SafetyChainCiGuardContract",
  "SafetyChainCiGuardValidation",
  "critical: true",
  "productionReady: false",
  "allCriticalPassed",
  "allNoGoLocksPreserved",
  "allRuntimeFlagsFalse",
  "allOperationalUseBlocked",
  "productionSwitchStillBlocked",
];

// ---------------------------------------------------------------------------
// Gate 4: Guard checks
// ---------------------------------------------------------------------------

function checkGuard(): { result: CheckResult; decision: string; total: number; passed: number; failed: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const g = buildSafetyChainCiGuardContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", g.contractVersion, "V73");
  if (g.specName.includes("Safety Chain CI Guard")) details.push("PASS  specName contains Safety Chain CI Guard.");
  else issues.push("FAIL  specName must contain Safety Chain CI Guard.");
  expectEq("guardMode", g.guardMode, "SPEC_ONLY_CI_GUARD");
  expectEq("decision", g.decision, "READY_FOR_CI_GUARD");
  if ((g.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');

  // Contract-level false flags.
  const rec = g as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed", "fetchPerformed",
    "supabaseConnected", "databaseWritePerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) expectEq(f, rec[f], false);

  // Checks.
  if (g.checks.length > 0) details.push(`PASS  checks non-empty (${g.checks.length}).`);
  else issues.push("FAIL  checks must be non-empty.");
  const scriptSet = new Set(g.checks.map((c) => c.sourceScript));
  for (const s of REQUIRED_SCRIPTS) {
    if (scriptSet.has(s)) details.push(`PASS  guard covers ${s}.`);
    else issues.push(`FAIL  guard must cover ${s}.`);
  }
  if (g.checks.every((c) => c.critical === true)) details.push("PASS  all checks critical.");
  else issues.push("FAIL  all checks must be critical.");
  if (g.checks.every((c) => c.passed === true)) details.push("PASS  all checks passed.");
  else issues.push(`FAIL  all checks must pass. Failed: ${g.checks.filter((c) => !c.passed).map((c) => `${c.sourceVersion}:${c.failureReason}`).join("; ")}`);

  // Result aggregate.
  const r = g.result;
  expectEq("result.failedChecks", r.failedChecks, 0);
  expectEq("result.criticalFailedChecks", r.criticalFailedChecks, 0);
  expectEq("result.allCriticalPassed", r.allCriticalPassed, true);
  expectEq("result.allNoGoLocksPreserved", r.allNoGoLocksPreserved, true);
  expectEq("result.allRuntimeFlagsFalse", r.allRuntimeFlagsFalse, true);
  expectEq("result.allOperationalUseBlocked", r.allOperationalUseBlocked, true);
  expectEq("result.productionSwitchStillBlocked", r.productionSwitchStillBlocked, true);
  expectEq("result.decision", r.decision, "READY_FOR_CI_GUARD");

  if (g.validation.valid) details.push("PASS  validation.valid === true.");
  else issues.push("FAIL  validation.valid must be true.");

  // Total checks = 17 (V60–V72 + Phase 2 + Phase 2b + Shadow Runtime Scaffold + Live Fetch Scope) or at least includes the checks.
  const phase2Check = g.checks.find((c) => c.sourceScript === "test:phase-2-locked-implementation");
  const phase2bCheck = g.checks.find((c) => c.sourceScript === "test:phase-2b-shadow-comparison-ui-shell");
  const scaffoldCheck = g.checks.find((c) => c.sourceScript === "test:staging-shadow-runtime-scaffold");
  const scopeCheck = g.checks.find((c) => c.sourceScript === "test:limited-live-fetch-dry-run-pr-scope");
  if (g.checks.length >= 17 || (phase2Check && phase2bCheck && scaffoldCheck && scopeCheck)) details.push(`PASS  totalChecks = ${g.checks.length} (>= 17 / includes Phase 2 + Phase 2b + scaffold + live fetch scope).`);
  else issues.push(`FAIL  totalChecks must be 17 or include all extended checks (got ${g.checks.length}).`);
  if (phase2Check) {
    if (phase2Check.critical === true) details.push("PASS  Phase 2 check critical === true.");
    else issues.push("FAIL  Phase 2 check must be critical.");
    if (phase2Check.passed === true) details.push("PASS  Phase 2 check passed === true.");
    else issues.push(`FAIL  Phase 2 check must pass (${phase2Check.failureReason}).`);
    if (phase2Check.expectedDecision === "NO_GO") details.push("PASS  Phase 2 expectedDecision NO_GO.");
    else issues.push("FAIL  Phase 2 expectedDecision must be NO_GO.");
  } else {
    issues.push("FAIL  guard must include a Phase 2 locked implementation check.");
  }

  // Phase 2 contract itself: decision NO_GO + mode INTERFACE_ONLY_NOT_CONNECTED.
  const phase2 = buildPhase2LockedImplementationContract({ generatedAt: FIXED_TS });
  expectEq("phase2.decision", phase2.decision, "NO_GO");
  expectEq("phase2.mode", phase2.mode, "INTERFACE_ONLY_NOT_CONNECTED");
  expectEq("phase2.productionReady", (phase2 as unknown as Record<string, unknown>).productionReady, false);

  // Phase 2b check present + critical/passed.
  if (phase2bCheck) {
    if (phase2bCheck.critical === true) details.push("PASS  Phase 2b check critical === true.");
    else issues.push("FAIL  Phase 2b check must be critical.");
    if (phase2bCheck.passed === true) details.push("PASS  Phase 2b check passed === true.");
    else issues.push(`FAIL  Phase 2b check must pass (${phase2bCheck.failureReason}).`);
    if (phase2bCheck.expectedDecision === "NO_GO") details.push("PASS  Phase 2b expectedDecision NO_GO.");
    else issues.push("FAIL  Phase 2b expectedDecision must be NO_GO.");
  } else {
    issues.push("FAIL  guard must include a Phase 2b shadow comparison UI shell check.");
  }

  // Phase 2b view model itself: decision NO_GO / mode INTERFACE_ONLY_NOT_CONNECTED /
  // real quote candidate DISABLED / connection flags false.
  const phase2b = buildShadowQuoteComparisonViewModel({ generatedAt: FIXED_TS });
  const p2b = phase2b as unknown as Record<string, unknown>;
  expectEq("phase2b.decision", phase2b.decision, "NO_GO");
  expectEq("phase2b.mode", phase2b.mode, "INTERFACE_ONLY_NOT_CONNECTED");
  expectEq("phase2b.realQuoteCandidateStatus", phase2b.realQuoteCandidateStatus, "DISABLED");
  for (const f of ["realDataConnected", "fetchPerformed", "envReadPerformed", "supabaseConnected", "productionReady"]) {
    expectEq(`phase2b.${f}`, p2b[f], false);
  }

  // Staging Shadow Runtime Scaffold check present + critical/passed.
  if (scaffoldCheck) {
    if (scaffoldCheck.critical === true) details.push("PASS  Scaffold check critical === true.");
    else issues.push("FAIL  Scaffold check must be critical.");
    if (scaffoldCheck.passed === true) details.push("PASS  Scaffold check passed === true.");
    else issues.push(`FAIL  Scaffold check must pass (${scaffoldCheck.failureReason}).`);
    if (scaffoldCheck.expectedDecision === "NO_GO") details.push("PASS  Scaffold expectedDecision NO_GO.");
    else issues.push("FAIL  Scaffold expectedDecision must be NO_GO.");
  } else {
    issues.push("FAIL  guard must include a Staging Shadow Runtime Scaffold check.");
  }

  // Staging Shadow Runtime Scaffold contract itself.
  const scaffold = buildStagingShadowRuntimeContract({ generatedAt: FIXED_TS });
  const sc = scaffold as unknown as Record<string, unknown>;
  expectEq("scaffold.decision", scaffold.decision, "NO_GO");
  expectEq("scaffold.mode", scaffold.mode, "SCAFFOLD_ONLY_NOT_CONNECTED");
  expectEq("scaffold.liveFetchAllowed", sc.liveFetchAllowed, false);
  expectEq("scaffold.envReadAllowed", sc.envReadAllowed, false);
  expectEq("scaffold.supabaseConnectionAllowed", sc.supabaseConnectionAllowed, false);
  expectEq("scaffold.portfolioApiSwitchAllowed", sc.portfolioApiSwitchAllowed, false);
  expectEq("scaffold.productionReady", sc.productionReady, false);
  expectEq("scaffold.serviceRoleForbidden", sc.serviceRoleForbidden, true);

  // Limited Live Fetch Scope check present + critical/passed.
  if (scopeCheck) {
    if (scopeCheck.critical === true) details.push("PASS  Live fetch scope check critical === true.");
    else issues.push("FAIL  Live fetch scope check must be critical.");
    if (scopeCheck.passed === true) details.push("PASS  Live fetch scope check passed === true.");
    else issues.push(`FAIL  Live fetch scope check must pass (${scopeCheck.failureReason}).`);
    if (scopeCheck.expectedDecision === "NO_GO") details.push("PASS  Live fetch scope expectedDecision NO_GO.");
    else issues.push("FAIL  Live fetch scope expectedDecision must be NO_GO.");
  } else {
    issues.push("FAIL  guard must include a Limited Live Fetch Dry-run PR Scope check.");
  }

  // Limited Live Fetch Scope contract itself: no network code, all gates false, NO_GO.
  const scope = buildLimitedLiveFetchScopeContract({ generatedAt: FIXED_TS });
  const sp = scope as unknown as Record<string, unknown>;
  expectEq("scope.decision", scope.decision, "NO_GO");
  expectEq("scope.mode", scope.mode, "SCOPE_ONLY_NO_NETWORK_CODE");
  expectEq("scope.defaultRealDataMode", scope.defaultRealDataMode, "fixture");
  for (const f of [
    "liveFetchAllowed", "networkCodeAdded", "realDataConnected", "envReadPerformed", "supabaseConnected",
    "apiRouteCreated", "portfolioApiSwitched", "databaseWritePerformed", "brokerApiAllowed",
    "buySellCommandGenerated", "autoOrderRequested", "operationalUseAllowed", "productionReady",
  ]) {
    expectEq(`scope.${f}`, sp[f], false);
  }
  expectEq("scope.ownerApprovalRequired", sp.ownerApprovalRequired, true);
  expectEq("scope.ownerApprovalReceived", sp.ownerApprovalReceived, false);

  return {
    result: { name: "guard_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: g.decision,
    total: g.checks.length,
    passed: r.passedChecks,
    failed: r.failedChecks,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Safety Chain CI Guard", "SPEC_ONLY_CI_GUARD", "productionSwitchStillBlocked"]) {
    if (safety && safety.includes(term)) details.push(`PASS  /system/safety contains "${term}".`);
    else issues.push(`FAIL  /system/safety must contain "${term}".`);
  }
  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: Safety (forbidden token scan + protected files + no API route)
// ---------------------------------------------------------------------------

// The builder lists `autoOrderRequested` as a flag name to scan for, so autoorder /
// placeorder are not scanned in these files.
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
    "app/api/portfolio/safety-chain/route.ts",
    "app/api/safety-chain/route.ts",
    "supabase/safety_chain.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V73.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "use-cases/war-room/ledger-integrity-rollup-contract.ts",
    "use-cases/war-room/build-ledger-integrity-rollup-contract.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must exist.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 7: package.json + README
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:safety-chain-ci-guard": "node --require ./scripts/register-typescript.cjs ./scripts/validate-safety-chain-ci-guard.ts"',
  '"test:safety-chain":',
];

const README_TERMS: string[] = [
  "V73",
  "Safety Chain CI Guard",
  "docs/safety-chain-ci-guard.md",
  "use-cases/war-room/build-safety-chain-ci-guard-contract.ts",
  "npm run test:safety-chain-ci-guard",
  "SPEC_ONLY_CI_GUARD",
  "READY_FOR_CI_GUARD",
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
const { result: guardCheck, decision, total, passed, failed } = checkGuard();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  guardCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: GuardSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    guard_checks: guardCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  total_checks: total,
  passed_checks: passed,
  failed_checks: failed,
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
