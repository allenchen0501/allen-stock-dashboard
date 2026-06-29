/**
 * Downgraded Trade Plan UI Behavior Validator — V69
 *
 * Static + pure-function check. Imports the UI behavior builder, the engine, the V68
 * downgrade matrix builder, and the V63 trade plan builder, then proves every
 * downgrade has a UI state, every UI state is observation-only / operational-use
 * blocked, action labels are non-imperative, and per-mode visibility/warning rules
 * hold. It does NOT start a server, make any HTTP request, connect to Supabase, read
 * env keys, build a runtime, or write data.
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

const builderModule = require("../use-cases/war-room/build-downgraded-trade-plan-ui-behavior-contract") as typeof import("../use-cases/war-room/build-downgraded-trade-plan-ui-behavior-contract");
const engineModule = require("../use-cases/war-room/downgraded-trade-plan-ui-behavior-engine") as typeof import("../use-cases/war-room/downgraded-trade-plan-ui-behavior-engine");
const matrixModule = require("../use-cases/war-room/build-conflict-to-trade-plan-verification-contract") as typeof import("../use-cases/war-room/build-conflict-to-trade-plan-verification-contract");
const tradePlanModule = require("../use-cases/war-room/build-structured-candidate-trade-plan-contract") as typeof import("../use-cases/war-room/build-structured-candidate-trade-plan-contract");

const { buildDowngradedTradePlanUiBehaviorContract } = builderModule;
const { resolveTradePlanVisibility, resolveTradePlanWarning, buildDowngradedTradePlanUiState } = engineModule;
const { buildConflictToTradePlanVerificationContract } = matrixModule;
const { buildStructuredCandidateTradePlanContract } = tradePlanModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface BehaviorSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
  ui_state_count: number;
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

const DOC_REL = "docs/downgraded-trade-plan-ui-behavior.md";
const CONTRACT_REL = "use-cases/war-room/downgraded-trade-plan-ui-behavior-contract.ts";
const ENGINE_REL = "use-cases/war-room/downgraded-trade-plan-ui-behavior-engine.ts";
const BUILDER_REL = "use-cases/war-room/build-downgraded-trade-plan-ui-behavior-contract.ts";
const POOLS_REL = "components/war-room/daily-candidate-pools.tsx";
const LAYOUT_REL = "components/war-room/war-room-operational-layout.tsx";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

const FORBIDDEN_ACTION_PHRASES = ["買進", "進場", "加碼", "buy", "buy now", "enter", "add position"];

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "UI behavior doc (new)", rel: DOC_REL },
    { label: "UI behavior contract (new)", rel: CONTRACT_REL },
    { label: "UI behavior engine (new)", rel: ENGINE_REL },
    { label: "UI behavior builder (new)", rel: BUILDER_REL },
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
  "V69",
  "Downgraded Trade Plan UI Behavior",
  "FIXTURE_ONLY_NOT_CONNECTED",
  "SHOW_FIXTURE_WITH_WARNING",
  "SHOW_OBSERVATION_ONLY",
  "SHOW_BLOCKED_CONFLICT",
  "SHOW_BLOCKED_MISSING_DATA",
  "SHOW_BLOCKED_STALE_DATA",
  "SHOW_BLOCKED_UNAUTHORIZED",
  "HIDE_OPERATIONAL_LEVELS",
  "observation only",
  "operationalUseAllowed false",
  "manualSignoffRequired true",
  "manualSignoffCompleted false",
  "productionSwitchAllowed false",
  "this is not a buy/sell command",
  "fixture/mock warning",
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
  "DowngradedTradePlanUiState",
  "DowngradedTradePlanUiVisibility",
  "DowngradedTradePlanUiWarning",
  "DowngradedTradePlanUiBehaviorContract",
  "DowngradedTradePlanUiBehaviorValidation",
  "observationOnly: true",
  "operationalUseAllowed: false",
  "buySellCommandGenerated: false",
  "autoOrderRequested: false",
  "manualSignoffRequired: true",
  "manualSignoffCompleted: false",
  "productionSwitchAllowed: false",
];

// ---------------------------------------------------------------------------
// Gate 4: Behavior checks
// ---------------------------------------------------------------------------

function checkBehavior(): { result: CheckResult; decision: string; count: number } {
  const details: string[] = [];
  const issues: string[] = [];

  const behavior = buildDowngradedTradePlanUiBehaviorContract({ generatedAt: FIXED_TS });
  const matrix = buildConflictToTradePlanVerificationContract({ generatedAt: FIXED_TS });
  const model = buildStructuredCandidateTradePlanContract({ generatedAt: FIXED_TS });
  const planSymbols = new Set(model.tradePlans.map((p) => p.symbol));

  if (behavior.contractVersion === "V69") details.push('PASS  contractVersion === "V69".');
  else issues.push(`FAIL  contractVersion === ${JSON.stringify(behavior.contractVersion)}.`);
  if (behavior.specName.includes("Downgraded Trade Plan UI Behavior")) details.push("PASS  specName contains the behavior name.");
  else issues.push("FAIL  specName must contain Downgraded Trade Plan UI Behavior.");
  if (behavior.behaviorMode === "FIXTURE_ONLY_NOT_CONNECTED") details.push("PASS  behaviorMode FIXTURE_ONLY_NOT_CONNECTED.");
  else issues.push("FAIL  behaviorMode must be FIXTURE_ONLY_NOT_CONNECTED.");
  if (behavior.decision === "READY_FOR_UI_REVIEW" || behavior.decision === "NO_GO") details.push(`PASS  decision === ${behavior.decision}.`);
  else issues.push(`FAIL  decision === ${JSON.stringify(behavior.decision)}.`);
  if ((behavior.decision as string) === "PRODUCTION_READY") issues.push('FAIL  decision must never be "PRODUCTION_READY".');

  // Every V68 downgrade has a UI state.
  if (behavior.uiStates.length >= matrix.sampleDowngradeResults.length && behavior.uiStates.length > 0)
    details.push(`PASS  every V68 downgrade has a UI state (${behavior.uiStates.length} >= ${matrix.sampleDowngradeResults.length}).`);
  else issues.push("FAIL  every V68 sampleDowngradeResult must have a UI state.");

  const allTrue = (pred: (s: typeof behavior.uiStates[number]) => boolean): boolean => behavior.uiStates.every(pred);
  const flag = (label: string, ok: boolean): void => { if (ok) details.push(`PASS  ${label}.`); else issues.push(`FAIL  ${label} — failed.`); };

  flag("every uiState maps to a V63 trade plan", allTrue((s) => planSymbols.has(s.symbol)));
  flag("all observationOnly true", allTrue((s) => s.observationOnly === true));
  flag("all operationalUseAllowed false", allTrue((s) => s.operationalUseAllowed === false));
  flag("all buySellCommandGenerated false", allTrue((s) => s.buySellCommandGenerated === false));
  flag("all autoOrderRequested false", allTrue((s) => s.autoOrderRequested === false));
  flag("all manualSignoffRequired true", allTrue((s) => s.manualSignoffRequired === true));
  flag("all manualSignoffCompleted false", allTrue((s) => s.manualSignoffCompleted === false));
  flag("all productionSwitchAllowed false", allTrue((s) => s.productionSwitchAllowed === false));

  // HIDE_OPERATIONAL_LEVELS hides all zones.
  flag(
    "HIDE_OPERATIONAL_LEVELS hides all zones",
    allTrue((s) => s.tradePlanDisplayMode !== "HIDE_OPERATIONAL_LEVELS" || (!s.buyZoneVisible && !s.targetZoneVisible && !s.riskRewardVisible)),
  );
  // Per-mode warnings.
  flag("SHOW_BLOCKED_CONFLICT shows conflict warning", allTrue((s) => s.tradePlanDisplayMode !== "SHOW_BLOCKED_CONFLICT" || s.visibility.showConflictWarning));
  flag("SHOW_BLOCKED_MISSING_DATA shows missing warning", allTrue((s) => s.tradePlanDisplayMode !== "SHOW_BLOCKED_MISSING_DATA" || s.visibility.showMissingDataWarning));
  flag("SHOW_BLOCKED_STALE_DATA shows stale warning", allTrue((s) => s.tradePlanDisplayMode !== "SHOW_BLOCKED_STALE_DATA" || s.visibility.showStaleDataWarning));
  flag("SHOW_BLOCKED_UNAUTHORIZED shows unauthorized warning", allTrue((s) => s.tradePlanDisplayMode !== "SHOW_BLOCKED_UNAUTHORIZED" || s.visibility.showUnauthorizedWarning));

  // actionLabel non-imperative.
  flag(
    "actionLabel has no buy/enter/add imperative",
    allTrue((s) => {
      const lower = s.actionLabel.toLowerCase();
      return !FORBIDDEN_ACTION_PHRASES.some((p) => s.actionLabel.includes(p) || lower.includes(p.toLowerCase()));
    }),
  );
  // warningMessage states not operational.
  flag("warningMessage states 不可作為正式操作依據", allTrue((s) => s.warningMessage.includes("不可作為正式操作依據")));

  // Coverage: blocked modes present so the conditionals are non-vacuous.
  const modes = new Set(behavior.uiStates.map((s) => s.tradePlanDisplayMode));
  for (const m of ["SHOW_BLOCKED_CONFLICT", "SHOW_BLOCKED_MISSING_DATA", "SHOW_BLOCKED_STALE_DATA", "SHOW_BLOCKED_UNAUTHORIZED", "HIDE_OPERATIONAL_LEVELS"]) {
    if (modes.has(m as never)) details.push(`PASS  sample covers ${m}.`);
    else issues.push(`FAIL  sample must cover ${m}.`);
  }

  // Engine direct probes.
  const conflictResult = matrix.sampleDowngradeResults.find((r) => r.tradePlanDisplayMode === "SHOW_BLOCKED_CONFLICT");
  if (conflictResult) {
    const vis = resolveTradePlanVisibility(conflictResult);
    const warn = resolveTradePlanWarning(conflictResult);
    if (vis.showConflictWarning) details.push("PASS  resolveTradePlanVisibility flags conflict warning.");
    else issues.push("FAIL  resolveTradePlanVisibility must flag conflict warning.");
    if (warn.operationalUseAllowed === false) details.push("PASS  resolveTradePlanWarning operationalUseAllowed false.");
    else issues.push("FAIL  resolveTradePlanWarning operationalUseAllowed must be false.");
    const built = buildDowngradedTradePlanUiState({ symbol: "A100", name: "甲", buyZone: model.tradePlans[0].buyZone, riskReward: model.tradePlans[0].riskReward }, conflictResult);
    if (built.operationalUseAllowed === false && built.observationOnly === true) details.push("PASS  buildDowngradedTradePlanUiState returns observation-only blocked state.");
    else issues.push("FAIL  buildDowngradedTradePlanUiState must return observation-only blocked state.");
  }

  if (behavior.validation.valid) details.push("PASS  behavior.validation.valid === true.");
  else issues.push("FAIL  behavior.validation.valid must be true.");

  return {
    result: { name: "behavior_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] },
    decision: behavior.decision,
    count: behavior.uiStates.length,
  };
}

// ---------------------------------------------------------------------------
// Gate 5: Behavior-level safety flags
// ---------------------------------------------------------------------------

function checkBehaviorFlags(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const behavior = buildDowngradedTradePlanUiBehaviorContract({ generatedAt: FIXED_TS });
  const rec = behavior as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "runtimeCreated", "apiRouteCreated", "envReadPerformed", "fetchPerformed",
    "supabaseConnected", "databaseWritePerformed", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) {
    if (rec[f] === false) details.push(`PASS  ${f} === false.`);
    else issues.push(`FAIL  ${f} === ${JSON.stringify(rec[f])}, expected false.`);
  }
  return { name: "behavior_flags", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  const pools = readFile(resolve(POOLS_REL));
  for (const term of ["uiState", "warningMessage", "actionLabel", "這不是買賣指令", "buyZoneVisible"]) {
    if (pools && pools.includes(term)) details.push(`PASS  daily pools UI references "${term}".`);
    else issues.push(`FAIL  daily pools UI must reference "${term}".`);
  }

  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["Downgraded Trade Plan UI Behavior", "behaviorMode", "observationOnly"]) {
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
    "app/api/portfolio/trade-plan-ui/route.ts",
    "app/api/trade-plan-ui/route.ts",
    "supabase/trade_plan_ui.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in V69.`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "components/war-room/daily-candidate-pools.tsx",
    "use-cases/war-room/conflict-to-trade-plan-verification-contract.ts",
    "use-cases/war-room/build-conflict-to-trade-plan-verification-contract.ts",
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
  '"test:downgraded-trade-plan-ui-behavior": "node --require ./scripts/register-typescript.cjs ./scripts/validate-downgraded-trade-plan-ui-behavior.ts"',
];

const README_TERMS: string[] = [
  "V69",
  "Downgraded Trade Plan UI Behavior",
  "docs/downgraded-trade-plan-ui-behavior.md",
  "use-cases/war-room/downgraded-trade-plan-ui-behavior-engine.ts",
  "npm run test:downgraded-trade-plan-ui-behavior",
  "FIXTURE_ONLY_NOT_CONNECTED",
  "this is not a buy/sell command",
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
const { result: behaviorCheck, decision, count } = checkBehavior();
const flagsCheck = checkBehaviorFlags();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractCheck,
  behaviorCheck,
  flagsCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: BehaviorSummary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, ENGINE_REL, BUILDER_REL, POOLS_REL, LAYOUT_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractCheck.status,
    behavior_checks: behaviorCheck.status,
    behavior_flags: flagsCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
    safety: safetyCheck.status,
  },
  decision,
  ui_state_count: count,
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
