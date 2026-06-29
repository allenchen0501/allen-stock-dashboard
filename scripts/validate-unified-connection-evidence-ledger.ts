/**
 * Unified Connection Evidence Ledger Validator — V70
 *
 * Static + pure-function check. Imports the ledger builder and proves the 20 pending
 * evidence items exist, everything is PENDING / not provided / not accepted / not
 * attached, categories aggregate correctly, dependencies resolve, and the decision is
 * NO_GO. It does NOT start a server, make any HTTP request, connect to Supabase, read
 * env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * builder code files (NOT the doc).
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-unified-connection-evidence-ledger-contract") as typeof import("../use-cases/war-room/build-unified-connection-evidence-ledger-contract");
const { buildUnifiedConnectionEvidenceLedgerContract } = builderModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface LedgerSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  evidence_item_count: number;
  pending_count: number;
  completed_count: number;
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

const DOC_REL = "docs/unified-connection-evidence-ledger.md";
const CONTRACT_REL = "use-cases/war-room/unified-connection-evidence-ledger-contract.ts";
const BUILDER_REL = "use-cases/war-room/build-unified-connection-evidence-ledger-contract.ts";
const POOLS_REL = "components/war-room/daily-candidate-pools.tsx";
const LAYOUT_REL = "components/war-room/war-room-operational-layout.tsx";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

const REQUIRED_IDS = [
  "OWNER_MANUAL_SIGNOFF",
  "SOURCE_AUTHORIZATION_YAHOO",
  "SOURCE_AUTHORIZATION_TWSE",
  "SOURCE_AUTHORIZATION_TPEX",
  "SOURCE_AUTHORIZATION_GOODINFO",
  "SOURCE_AUTHORIZATION_BROKER_IMPORT",
  "STAGING_SUPABASE_PROJECT_CONFIRMATION",
  "STAGING_READONLY_ROLE_CONFIRMATION",
  "RLS_SELECT_ONLY_CONFIRMATION",
  "SERVICE_ROLE_NOT_IN_APP_RUNTIME",
  "WRITE_OPERATION_BLOCK_CONFIRMATION",
  "API_ROUTE_NO_SWITCH_CONFIRMATION",
  "REAL_QUOTE_MAPPING_REVIEW",
  "SOURCE_CONFLICT_POLICY_REVIEW",
  "TRADE_PLAN_DOWNGRADE_UI_REVIEW",
  "SHADOW_COMPARISON_PLAN",
  "SHADOW_COMPARISON_RESULT_PENDING",
  "ROLLBACK_RUNBOOK",
  "KILL_SWITCH_CONFIRMATION",
  "PRODUCTION_SWITCH_FINAL_APPROVAL",
];
const KNOWN_VERSIONS = ["V64", "V65", "V66", "V67", "V68", "V69"];

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Ledger doc (new)", rel: DOC_REL },
    { label: "Ledger contract (new)", rel: CONTRACT_REL },
    { label: "Ledger builder (new)", rel: BUILDER_REL },
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
  "V70",
  "Unified Connection Evidence Ledger",
  "SPEC_ONLY_PENDING_EVIDENCE",
  "NO_GO",
  ...REQUIRED_IDS,
  "evidenceStatus PENDING",
  "evidenceProvided false",
  "evidenceAccepted false",
  "actualEvidenceAttached false",
  "stagingConnectionAllowed false",
  "realQuoteConnectionAllowed false",
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
  "UnifiedConnectionEvidenceItem",
  "UnifiedConnectionEvidenceCategory",
  "UnifiedConnectionEvidenceLedger",
  "UnifiedConnectionEvidenceDependency",
  "UnifiedConnectionEvidenceLedgerValidation",
  "evidenceProvided: false",
  "evidenceAccepted: false",
  "manualReviewRequired: true",
  "manualSignoffCompleted: false",
  "allowedPlaceholder: true",
  "actualEvidenceAttached: false",
  'decision: "NO_GO"',
];

// ---------------------------------------------------------------------------
// Gate 4: Ledger checks
// ---------------------------------------------------------------------------

function checkLedger(): { result: CheckResult; decision: string; itemCount: number; pending: number; completed: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const ledger = buildUnifiedConnectionEvidenceLedgerContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", ledger.contractVersion, "V70");
  if (ledger.specName.includes("Unified Connection Evidence Ledger")) details.push("PASS  specName contains ledger name.");
  else issues.push("FAIL  specName must contain Unified Connection Evidence Ledger.");
  expectEq("ledgerMode", ledger.ledgerMode, "SPEC_ONLY_PENDING_EVIDENCE");
  expectEq("decision", ledger.decision, "NO_GO");
  if ((ledger.decision as string) === "PRODUCTION_READY" || (ledger.decision as string) === "READY_FOR_UI_REVIEW")
    issues.push("FAIL  decision must be NO_GO (pending evidence).");

  // Ledger-level flags.
  const rec = ledger as unknown as Record<string, unknown>;
  const falseFlags = [
    "stagingConnectionAllowed", "realQuoteConnectionAllowed", "productionSwitchAllowed", "manualSignoffCompleted",
    "actualEvidenceAttached", "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed",
    "fetchPerformed", "supabaseConnected", "databaseWritePerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) expectEq(f, rec[f], false);

  // 20 required items present.
  const ids = new Set(ledger.evidenceItems.map((i) => i.evidenceId));
  for (const id of REQUIRED_IDS) {
    if (ids.has(id)) details.push(`PASS  evidence item ${id} present.`);
    else issues.push(`FAIL  evidence item ${id} missing.`);
  }
  if (ledger.evidenceItems.length >= 20) details.push(`PASS  evidence item count = ${ledger.evidenceItems.length} (>= 20).`);
  else issues.push(`FAIL  expected >= 20 evidence items, got ${ledger.evidenceItems.length}.`);

  // Per-item invariants.
  const knownVersions = new Set(KNOWN_VERSIONS);
  let pendingOk = true, providedOk = true, acceptedOk = true, attachedOk = true, versionsOk = true, contractsOk = true;
  for (const i of ledger.evidenceItems) {
    if (i.evidenceStatus !== "PENDING") pendingOk = false;
    if (i.evidenceProvided !== false) providedOk = false;
    if (i.evidenceAccepted !== false) acceptedOk = false;
    if (i.actualEvidenceAttached !== false) attachedOk = false;
    if (!(i.requiredByVersions.length > 0 && i.requiredByVersions.some((v) => knownVersions.has(v)))) versionsOk = false;
    if (i.sourceContracts.length === 0) contractsOk = false;
  }
  const flag = (label: string, ok: boolean): void => { if (ok) details.push(`PASS  ${label}.`); else issues.push(`FAIL  ${label} — failed.`); };
  flag("all evidenceStatus PENDING", pendingOk);
  flag("all evidenceProvided false", providedOk);
  flag("all evidenceAccepted false", acceptedOk);
  flag("all actualEvidenceAttached false", attachedOk);
  flag("all requiredByVersions reference V64–V69", versionsOk);
  flag("all sourceContracts non-empty", contractsOk);

  // Categories.
  let catPendingOk = true, catCompletedOk = true, catAggOk = true;
  for (const c of ledger.evidenceCategories) {
    if (!(c.categoryStatus === "PENDING" && c.pendingCount > 0)) catPendingOk = false;
    if (c.completedCount !== 0) catCompletedOk = false;
    const actual = ledger.evidenceItems.filter((i) => i.category === c.categoryId).length;
    if (!(c.itemCount === actual && c.pendingCount === actual)) catAggOk = false;
  }
  flag("all categories pendingCount > 0", catPendingOk);
  flag("all categories completedCount = 0", catCompletedOk);
  flag("categories aggregate item counts correctly", catAggOk);

  // Dependencies reference existing items.
  const depOk = ledger.dependencies.every((d) => ids.has(d.fromEvidenceId) && ids.has(d.toEvidenceId));
  flag("dependencies reference existing evidenceId", depOk);
  if (ledger.dependencies.length > 0) details.push(`PASS  dependency count = ${ledger.dependencies.length}.`);
  else issues.push("FAIL  expected at least one dependency.");

  // Builder self-validation.
  if (ledger.validation.valid) details.push("PASS  ledger.validation.valid === true.");
  else issues.push("FAIL  ledger.validation.valid must be true.");

  const pending = ledger.evidenceCategories.reduce((s, c) => s + c.pendingCount, 0);
  const completed = ledger.evidenceCategories.reduce((s, c) => s + c.completedCount, 0);
  flag("completedCount aggregate = 0", completed === 0);

  return {
    result: { name: "ledger_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: ledger.decision,
    itemCount: ledger.evidenceItems.length,
    pending,
    completed,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  for (const term of ["Connection evidence ledger", "NO_GO", "真實行情與 staging 連線仍需人工 evidence，不可作為正式操作依據"]) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI contains "${term}".`);
    else issues.push(`FAIL  daily pools UI must contain "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Unified Connection Evidence Ledger", "ledgerMode", "actualEvidenceAttached"]) {
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

  for (const rel of [CONTRACT_REL, BUILDER_REL]) {
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
    "app/api/portfolio/evidence-ledger/route.ts",
    "app/api/evidence-ledger/route.ts",
    "supabase/evidence_ledger.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V70.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/downgraded-trade-plan-ui-behavior-contract.ts",
    "use-cases/war-room/conflict-to-trade-plan-verification-contract.ts",
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
  '"test:unified-connection-evidence-ledger": "node --require ./scripts/register-typescript.cjs ./scripts/validate-unified-connection-evidence-ledger.ts"',
];

const README_TERMS: string[] = [
  "V70",
  "Unified Connection Evidence Ledger",
  "docs/unified-connection-evidence-ledger.md",
  "use-cases/war-room/unified-connection-evidence-ledger-contract.ts",
  "npm run test:unified-connection-evidence-ledger",
  "SPEC_ONLY_PENDING_EVIDENCE",
  "NO_GO",
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
const { result: ledgerCheck, decision, itemCount, pending, completed } = checkLedger();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  ledgerCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: LedgerSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, BUILDER_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    ledger_checks: ledgerCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  evidence_item_count: itemCount,
  pending_count: pending,
  completed_count: completed,
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
