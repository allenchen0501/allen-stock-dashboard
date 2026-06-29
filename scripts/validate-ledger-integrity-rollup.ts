/**
 * Ledger Integrity Rollup Validator — V72
 *
 * Static + pure-function check. Imports the rollup builder + engine + the V70 ledger
 * and V71 transition builders, then proves the rollup is spec-only / NO_GO, every
 * rollup item's source contract exists, and the required safety-gate blockers are all
 * present and unresolved. It does NOT start a server, make any HTTP request, connect
 * to Supabase, read env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * engine / builder code files (NOT the doc).
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-ledger-integrity-rollup-contract") as typeof import("../use-cases/war-room/build-ledger-integrity-rollup-contract");
const ledgerModule = require("../use-cases/war-room/build-unified-connection-evidence-ledger-contract") as typeof import("../use-cases/war-room/build-unified-connection-evidence-ledger-contract");

const { buildLedgerIntegrityRollupContract } = builderModule;
const { buildUnifiedConnectionEvidenceLedgerContract } = ledgerModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface RollupSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  rollup_item_count: number;
  blocker_count: number;
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

const DOC_REL = "docs/ledger-integrity-rollup.md";
const CONTRACT_REL = "use-cases/war-room/ledger-integrity-rollup-contract.ts";
const ENGINE_REL = "use-cases/war-room/ledger-integrity-rollup-engine.ts";
const BUILDER_REL = "use-cases/war-room/build-ledger-integrity-rollup-contract.ts";
const POOLS_REL = "components/war-room/daily-candidate-pools.tsx";
const LAYOUT_REL = "components/war-room/war-room-operational-layout.tsx";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";
const REQUIRED_BLOCKER_TYPES = ["MANUAL_SIGNOFF_PENDING", "EVIDENCE_PENDING", "STAGING_LOCKED", "REAL_QUOTE_LOCKED", "PRODUCTION_SWITCH_LOCKED"];

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Rollup doc (new)", rel: DOC_REL },
    { label: "Rollup contract (new)", rel: CONTRACT_REL },
    { label: "Rollup engine (new)", rel: ENGINE_REL },
    { label: "Rollup builder (new)", rel: BUILDER_REL },
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
  "V72",
  "Ledger Integrity Rollup & Safety Gate Dashboard",
  "SPEC_ONLY_SAFETY_GATE",
  "NO_GO",
  "HEALTHY_SPEC_ONLY",
  "PENDING_EVIDENCE",
  "BLOCKED_NO_GO",
  "PREVIEW_ONLY_LOCKED",
  "PRODUCTION_LOCKED",
  "sourceIntegrityOk true",
  "allSourceContractsExist true",
  "allEvidencePending true",
  "allTransitionsPreviewOnly true",
  "actualLedgerMutated false",
  "stagingConnectionAllowed false",
  "realQuoteConnectionAllowed false",
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
  "LedgerIntegrityHealthStatus",
  "LedgerIntegrityRollupItem",
  "LedgerSafetyGateBlocker",
  "LedgerIntegrityRollup",
  "LedgerIntegrityRollupValidation",
  "operationalUseAllowed: false",
  "manualReviewRequired: true",
  "resolved: false",
  'decision: "NO_GO"',
  "actualLedgerMutated: false",
  "sourceIntegrityOk: true",
];

// ---------------------------------------------------------------------------
// Gate 4: Rollup checks
// ---------------------------------------------------------------------------

function checkRollup(): { result: CheckResult; decision: string; itemCount: number; blockerCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const r = buildLedgerIntegrityRollupContract({ generatedAt: FIXED_TS });
  const ledger = buildUnifiedConnectionEvidenceLedgerContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", r.contractVersion, "V72");
  if (r.specName.includes("Ledger Integrity Rollup & Safety Gate Dashboard")) details.push("PASS  specName contains spec name.");
  else issues.push("FAIL  specName must contain Ledger Integrity Rollup & Safety Gate Dashboard.");
  expectEq("rollupMode", r.rollupMode, "SPEC_ONLY_SAFETY_GATE");
  expectEq("decision", r.decision, "NO_GO");
  expectEq("ledgerDecision", r.ledgerDecision, "NO_GO");
  expectEq("transitionDecision", r.transitionDecision, "NO_GO");

  // True facts.
  const rec = r as unknown as Record<string, unknown>;
  for (const f of ["sourceIntegrityOk", "allSourceContractsExist", "allEvidencePending", "allTransitionsPreviewOnly"]) {
    expectEq(f, rec[f], true);
  }
  // False flags.
  const falseFlags = [
    "actualLedgerMutated", "stagingConnectionAllowed", "realQuoteConnectionAllowed", "productionSwitchAllowed",
    "operationalUseAllowed", "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed",
    "fetchPerformed", "supabaseConnected", "databaseWritePerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) expectEq(f, rec[f], false);

  // Rollup items.
  if (r.rollupItems.length > 0) details.push(`PASS  rollupItems non-empty (${r.rollupItems.length}).`);
  else issues.push("FAIL  rollupItems must be non-empty.");
  const ledgerIds = new Set(ledger.evidenceItems.map((i) => i.evidenceId));
  if (r.rollupItems.length === ledger.evidenceItems.length || r.rollupItems.every((i) => ledgerIds.has(i.itemId)))
    details.push("PASS  rollupItems cover V70 evidence items.");
  else issues.push("FAIL  rollupItems must cover V70 evidence items or V71 integrity items.");
  if (r.rollupItems.every((i) => i.sourceContractExists === true)) details.push("PASS  all rollupItem sourceContractExists true.");
  else issues.push("FAIL  every rollupItem must have sourceContractExists true.");
  if (r.rollupItems.every((i) => i.operationalUseAllowed === false)) details.push("PASS  all rollupItem operationalUseAllowed false.");
  else issues.push("FAIL  every rollupItem must have operationalUseAllowed false.");

  // Safety gate blockers.
  if (r.safetyGateBlockers.length > 0) details.push(`PASS  safetyGateBlockers non-empty (${r.safetyGateBlockers.length}).`);
  else issues.push("FAIL  safetyGateBlockers must be non-empty.");
  if (r.safetyGateBlockers.every((b) => b.resolved === false)) details.push("PASS  all blockers resolved false.");
  else issues.push("FAIL  every blocker must have resolved false.");
  const types = new Set(r.safetyGateBlockers.map((b) => b.blockerType));
  for (const t of REQUIRED_BLOCKER_TYPES) {
    if (types.has(t as never)) details.push(`PASS  blockerType ${t} present.`);
    else issues.push(`FAIL  blockerType ${t} missing.`);
  }

  if (r.validation.valid) details.push("PASS  validation.valid === true.");
  else issues.push("FAIL  validation.valid must be true.");

  return {
    result: { name: "rollup_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: r.decision,
    itemCount: r.rollupItems.length,
    blockerCount: r.safetyGateBlockers.length,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  for (const term of ["Ledger integrity rollup", "SPEC_ONLY_SAFETY_GATE", "source contracts 完整，但 evidence 全部 pending，真實行情仍鎖定"]) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI contains "${term}".`);
    else issues.push(`FAIL  daily pools UI must contain "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Ledger Integrity Rollup", "rollupMode", "safetyGateBlockers"]) {
    if (safety && safety.includes(term)) details.push(`PASS  /system/safety contains "${term}".`);
    else issues.push(`FAIL  /system/safety must contain "${term}".`);
  }

  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: Safety (forbidden token scan + protected files + no API route)
// ---------------------------------------------------------------------------

const FORBIDDEN = [
  "@supabase",
  "createclient",
  "process.env",
  "fetch(",
  "axios",
  "insert(",
  "upsert(",
  "update(",
  "delete(",
  "autoorder",
  "placeorder",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of [CONTRACT_REL, ENGINE_REL, BUILDER_REL]) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const stripped = stripComments(body);
    const lower = stripped.toLowerCase();
    for (const token of FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Forbidden "${token}" present in ${rel}.`);
      else details.push(`PASS  No "${token}" in ${rel}.`);
    }
    if (stripped.includes("PRODUCTION_READY")) issues.push(`FAIL  Forbidden "PRODUCTION_READY" present in ${rel}.`);
    else details.push(`PASS  No "PRODUCTION_READY" in ${rel}.`);
  }

  const forbiddenArtifacts = [
    "app/api/portfolio/ledger-rollup/route.ts",
    "app/api/ledger-rollup/route.ts",
    "supabase/ledger_rollup.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V72.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/evidence-ledger-transition-contract.ts",
    "use-cases/war-room/unified-connection-evidence-ledger-contract.ts",
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
  '"test:ledger-integrity-rollup": "node --require ./scripts/register-typescript.cjs ./scripts/validate-ledger-integrity-rollup.ts"',
];

const README_TERMS: string[] = [
  "V72",
  "Ledger Integrity Rollup & Safety Gate Dashboard",
  "docs/ledger-integrity-rollup.md",
  "use-cases/war-room/ledger-integrity-rollup-engine.ts",
  "npm run test:ledger-integrity-rollup",
  "SPEC_ONLY_SAFETY_GATE",
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
const { result: rollupCheck, decision, itemCount, blockerCount } = checkRollup();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  rollupCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: RollupSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, ENGINE_REL, BUILDER_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    rollup_checks: rollupCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  rollup_item_count: itemCount,
  blocker_count: blockerCount,
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
