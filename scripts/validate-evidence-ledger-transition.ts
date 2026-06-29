/**
 * Evidence Ledger Transition Validator — V71
 *
 * Static + pure-function check. Imports the transition builder + engine + the V70
 * ledger builder, then proves transitions are preview-only / never mutate the ledger,
 * the recalculated decision stays NO_GO, and every ledger sourceContract resolves to
 * an existing file. It does NOT start a server, make any HTTP request, connect to
 * Supabase, read env keys, build a runtime, or write data.
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

const builderModule = require("../use-cases/war-room/build-evidence-ledger-transition-contract") as typeof import("../use-cases/war-room/build-evidence-ledger-transition-contract");
const engineModule = require("../use-cases/war-room/evidence-ledger-transition-engine") as typeof import("../use-cases/war-room/evidence-ledger-transition-engine");
const ledgerModule = require("../use-cases/war-room/build-unified-connection-evidence-ledger-contract") as typeof import("../use-cases/war-room/build-unified-connection-evidence-ledger-contract");

const { buildEvidenceLedgerTransitionContract } = builderModule;
const { recalculateEvidenceCategories, recalculateLedgerDecision, applyEvidenceTransitionPreview } = engineModule;
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

interface TransitionSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  preview_count: number;
  integrity_count: number;
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

const DOC_REL = "docs/evidence-ledger-transition-engine.md";
const CONTRACT_REL = "use-cases/war-room/evidence-ledger-transition-contract.ts";
const ENGINE_REL = "use-cases/war-room/evidence-ledger-transition-engine.ts";
const BUILDER_REL = "use-cases/war-room/build-evidence-ledger-transition-contract.ts";
const POOLS_REL = "components/war-room/daily-candidate-pools.tsx";
const LAYOUT_REL = "components/war-room/war-room-operational-layout.tsx";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";
const KNOWN_VERSIONS = ["V64", "V65", "V66", "V67", "V68", "V69", "V70"];

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Transition doc (new)", rel: DOC_REL },
    { label: "Transition contract (new)", rel: CONTRACT_REL },
    { label: "Transition engine (new)", rel: ENGINE_REL },
    { label: "Transition builder (new)", rel: BUILDER_REL },
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
  "V71",
  "Evidence Ledger Transition Engine & Source Contract Integrity",
  "SPEC_ONLY_PREVIEW_NOT_CONNECTED",
  "PREVIEW_ONLY",
  "NO_GO",
  "actualLedgerMutated false",
  "ledgerDecisionAfterPreview NO_GO",
  "sourceContractIntegrityItems",
  "sourceContractExists true",
  "stagingConnectionAllowed false",
  "realQuoteConnectionAllowed false",
  "productionSwitchAllowed false",
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
  "EvidenceTransitionInput",
  "EvidenceTransitionResult",
  "EvidenceLedgerRecalculationResult",
  "EvidenceSourceContractIntegrityItem",
  "EvidenceLedgerTransitionContract",
  "EvidenceLedgerTransitionValidation",
  "actualLedgerMutated: false",
  "runtimeEnabled: false",
  "operationalUseAllowed: false",
  'decision: "NO_GO"',
  'ledgerDecisionAfterPreview: "NO_GO"',
  "productionReady: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Transition checks
// ---------------------------------------------------------------------------

function checkTransition(): { result: CheckResult; decision: string; previewCount: number; integrityCount: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const t = buildEvidenceLedgerTransitionContract({ generatedAt: FIXED_TS });
  const ledger = buildUnifiedConnectionEvidenceLedgerContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", t.contractVersion, "V71");
  if (t.specName.includes("Evidence Ledger Transition Engine & Source Contract Integrity")) details.push("PASS  specName contains the spec name.");
  else issues.push("FAIL  specName must contain Evidence Ledger Transition Engine & Source Contract Integrity.");
  expectEq("transitionMode", t.transitionMode, "SPEC_ONLY_PREVIEW_NOT_CONNECTED");
  expectEq("decision", t.decision, "NO_GO");
  expectEq("ledgerDecisionAfterPreview", t.ledgerDecisionAfterPreview, "NO_GO");
  expectEq("actualLedgerMutated", t.actualLedgerMutated, false);

  // Contract-level false flags.
  const rec = t as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed", "fetchPerformed",
    "supabaseConnected", "databaseWritePerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) expectEq(f, rec[f], false);

  // Preview results.
  if (t.transitionPreviewResults.length > 0) details.push(`PASS  transitionPreviewResults non-empty (${t.transitionPreviewResults.length}).`);
  else issues.push("FAIL  transitionPreviewResults must be non-empty.");
  if (t.transitionPreviewResults.every((r) => r.transitionMode === "PREVIEW_ONLY")) details.push("PASS  all preview results PREVIEW_ONLY.");
  else issues.push("FAIL  all preview results must be PREVIEW_ONLY.");
  if (t.transitionPreviewResults.every((r) => r.actualLedgerMutated === false)) details.push("PASS  all preview results actualLedgerMutated false.");
  else issues.push("FAIL  all preview results must have actualLedgerMutated false.");

  // Recalculation correctness (engine direct).
  const recalc = recalculateLedgerDecision(ledger);
  if (recalc.totalEvidenceCount === ledger.evidenceItems.length && recalc.completedCount === 0 && recalc.pendingCount === ledger.evidenceItems.length)
    details.push("PASS  recalculateLedgerDecision counts correct (total/pending/completed).");
  else issues.push("FAIL  recalculateLedgerDecision counts incorrect.");
  if (recalc.decision === "NO_GO") details.push("PASS  recalculateLedgerDecision decision NO_GO.");
  else issues.push("FAIL  recalculateLedgerDecision must return NO_GO.");

  const cats = recalculateEvidenceCategories(ledger);
  const catSum = cats.reduce((s, c) => s + c.itemCount, 0);
  if (catSum === ledger.evidenceItems.length) details.push("PASS  recalculateEvidenceCategories aggregates all items.");
  else issues.push("FAIL  recalculateEvidenceCategories must aggregate all items.");

  // applyEvidenceTransitionPreview never mutates.
  const sample = applyEvidenceTransitionPreview(ledger, {
    evidenceId: "OWNER_MANUAL_SIGNOFF",
    proposedEvidenceStatus: "ACCEPTED_IN_PREVIEW",
    proposedEvidenceProvided: true,
    proposedEvidenceAccepted: true,
    proposedActualEvidenceAttached: false,
    proposedManualSignoffCompleted: false,
    transitionMode: "PREVIEW_ONLY",
    runtimeEnabled: false,
    operationalUseAllowed: false,
  });
  if (sample.actualLedgerMutated === false && sample.transitionMode === "PREVIEW_ONLY") details.push("PASS  applyEvidenceTransitionPreview is preview-only / unmutated.");
  else issues.push("FAIL  applyEvidenceTransitionPreview must be preview-only / unmutated.");
  // Ledger itself unchanged after preview.
  if (ledger.evidenceItems.every((i) => i.evidenceAccepted === false && i.evidenceStatus === "PENDING")) details.push("PASS  ledger items unchanged after preview.");
  else issues.push("FAIL  ledger items must remain PENDING / not accepted after preview.");

  // Source contract integrity.
  const integrity = t.sourceContractIntegrityItems;
  if (integrity.length > 0) details.push(`PASS  sourceContractIntegrityItems non-empty (${integrity.length}).`);
  else issues.push("FAIL  sourceContractIntegrityItems must be non-empty.");

  const allPairs = ledger.evidenceItems.flatMap((i) => i.sourceContracts.map((p) => `${i.evidenceId}::${p}`));
  const covered = new Set(integrity.map((s) => `${s.evidenceId}::${s.sourceContractPath}`));
  if (allPairs.every((p) => covered.has(p))) details.push("PASS  integrity items cover all evidence sourceContracts.");
  else issues.push("FAIL  integrity items must cover all evidence sourceContracts.");

  if (integrity.every((s) => s.sourceContractExists === true)) details.push("PASS  all sourceContractExists true.");
  else issues.push(`FAIL  all sourceContracts must exist. Missing: ${integrity.filter((s) => !s.sourceContractExists).map((s) => s.sourceContractPath).join(", ")}`);
  if (integrity.every((s) => s.sourceContractKind === "contract" || s.sourceContractKind === "doc")) details.push("PASS  all sourceContractKind valid (contract|doc).");
  else issues.push("FAIL  sourceContractKind must be contract or doc.");
  if (integrity.every((s) => s.referencedVersion.split("/").some((v) => KNOWN_VERSIONS.includes(v)))) details.push("PASS  all referencedVersion reference V64–V70.");
  else issues.push("FAIL  referencedVersion must reference one of V64–V70.");

  // Independent file existence cross-check.
  const independentOk = integrity.every((s) => fileExists(resolve(s.sourceContractPath)) === s.sourceContractExists);
  if (independentOk) details.push("PASS  integrity sourceContractExists matches actual filesystem.");
  else issues.push("FAIL  integrity sourceContractExists does not match actual filesystem.");

  // Recalculation result flags.
  const rr = t.recalculationResult as unknown as Record<string, unknown>;
  for (const f of ["stagingConnectionAllowed", "realQuoteConnectionAllowed", "productionSwitchAllowed", "manualSignoffCompleted", "actualEvidenceAttached", "productionReady"]) {
    if (rr[f] === false) details.push(`PASS  recalculationResult.${f} false.`);
    else issues.push(`FAIL  recalculationResult.${f} must be false.`);
  }

  if (t.validation.valid) details.push("PASS  validation.valid === true.");
  else issues.push("FAIL  validation.valid must be true.");

  return {
    result: { name: "transition_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: t.decision,
    previewCount: t.transitionPreviewResults.length,
    integrityCount: integrity.length,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  for (const term of ["Evidence transition engine", "PREVIEW_ONLY", "即使 preview 單項 evidence，真實行情與 staging 連線仍維持鎖定"]) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI contains "${term}".`);
    else issues.push(`FAIL  daily pools UI must contain "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Evidence Ledger Transition Engine", "transitionMode", "actualLedgerMutated"]) {
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
    "app/api/portfolio/evidence-transition/route.ts",
    "app/api/evidence-transition/route.ts",
    "supabase/evidence_transition.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V71.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/unified-connection-evidence-ledger-contract.ts",
    "use-cases/war-room/build-unified-connection-evidence-ledger-contract.ts",
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
  '"test:evidence-ledger-transition": "node --require ./scripts/register-typescript.cjs ./scripts/validate-evidence-ledger-transition.ts"',
];

const README_TERMS: string[] = [
  "V71",
  "Evidence Ledger Transition Engine & Source Contract Integrity",
  "docs/evidence-ledger-transition-engine.md",
  "use-cases/war-room/evidence-ledger-transition-engine.ts",
  "npm run test:evidence-ledger-transition",
  "SPEC_ONLY_PREVIEW_NOT_CONNECTED",
  "actualLedgerMutated false",
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
const { result: transitionCheck, decision, previewCount, integrityCount } = checkTransition();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  transitionCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: TransitionSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, ENGINE_REL, BUILDER_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    transition_checks: transitionCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  preview_count: previewCount,
  integrity_count: integrityCount,
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
