/**
 * Phase 2b Shadow Comparison UI Shell Validator — fixture-only, disabled real data
 *
 * Static + pure-function check. Imports the shadow comparison view model and inspects
 * the UI shell component, proving the real quote candidate is DISABLED and everything
 * stays NO_GO / interface-only / not connected. It does NOT start a server, make any
 * HTTP request, connect to Supabase, read env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new view model /
 * component code files (NOT the doc).
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const vmModule = require("../use-cases/war-room/build-shadow-quote-comparison-view-model") as typeof import("../use-cases/war-room/build-shadow-quote-comparison-view-model");
const { buildShadowQuoteComparisonViewModel } = vmModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface ShellSummary {
  status: CheckStatus;
  checked_files: string[];
  gates: Record<string, CheckStatus>;
  decision: string;
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

const COMPONENT_REL = "components/war-room/shadow-quote-comparison-card.tsx";
const VM_REL = "use-cases/war-room/build-shadow-quote-comparison-view-model.ts";
const DOC_REL = "docs/phase-2b-shadow-comparison-ui-shell.md";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Shadow comparison UI component (new)", rel: COMPONENT_REL },
    { label: "Shadow comparison view model (new)", rel: VM_REL },
    { label: "Phase 2b doc (new)", rel: DOC_REL },
    { label: "System safety page (modified)", rel: SAFETY_PAGE_REL },
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
// Gate 2: UI required literals (component)
// ---------------------------------------------------------------------------

const UI_REQUIRED: string[] = [
  "Phase 2b Shadow Comparison UI Shell",
  "DISABLED",
  "NO_GO",
  "INTERFACE_ONLY_NOT_CONNECTED",
  "operationalUseAllowed=false",
  "realDataConnected=false",
  "fetchPerformed=false",
  "envReadPerformed=false",
  "supabaseConnected=false",
  "apiRouteCreated=false",
  "portfolioApiSwitched=false",
  "productionReady=false",
  "mapsToV67V68V69=true",
  "fixture quote",
  "real quote candidate",
  "This is UI shell only",
  "Real quote is disabled",
  "Fixture remains default",
  "No trading decision",
  "No buy/sell command",
  "No auto order",
  "Not production ready",
];

// UI must NOT contain affirmative trade commands (the "No buy/sell command" warning is
// a negation and is allowed; we only forbid the imperative / enabled forms).
const UI_FORBIDDEN_AFFIRMATIVE: string[] = [
  "placeorder",
  "autoorder",
  "下單",
  "掛單",
  "市價買",
  "buy now",
  "sell now",
  "buysellcommandgenerated: true",
  "autoorderrequested: true",
];

function checkUiForbidden(body: string | null): CheckResult {
  if (body == null) return { name: "ui_forbidden", status: "FAIL", details: ["FAIL  Cannot read component."] };
  const details: string[] = [];
  const issues: string[] = [];
  const lower = body.toLowerCase();
  for (const token of UI_FORBIDDEN_AFFIRMATIVE) {
    if (lower.includes(token)) issues.push(`FAIL  Forbidden affirmative command "${token}" present in component.`);
    else details.push(`PASS  No affirmative command "${token}" in component.`);
  }
  return { name: "ui_forbidden", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 3: View model checks
// ---------------------------------------------------------------------------

function checkViewModel(): { result: CheckResult; decision: string } {
  const details: string[] = [];
  const issues: string[] = [];

  const vm = buildShadowQuoteComparisonViewModel({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("title", vm.title, "Phase 2b Shadow Comparison UI Shell");
  expectEq("mode", vm.mode, "INTERFACE_ONLY_NOT_CONNECTED");
  expectEq("decision", vm.decision, "NO_GO");
  expectEq("defaultRealDataMode", vm.defaultRealDataMode, "fixture");
  expectEq("realQuoteCandidateStatus", vm.realQuoteCandidateStatus, "DISABLED");
  expectEq("realQuoteCandidate.isRealData", vm.realQuoteCandidate.isRealData, false);
  expectEq("realQuoteCandidate.verificationStatus", vm.realQuoteCandidate.verificationStatus, "DISABLED");

  const rec = vm as unknown as Record<string, unknown>;
  const falseFlags = [
    "operationalUseAllowed", "realDataConnected", "fetchPerformed", "envReadPerformed", "supabaseConnected",
    "apiRouteCreated", "portfolioApiSwitched", "productionReady",
  ];
  for (const f of falseFlags) expectEq(f, rec[f], false);
  expectEq("mapsToV67V68V69", vm.mapsToV67V68V69, true);
  expectEq("missingRealQuote", vm.missingRealQuote, true);

  const requiredNotes = [
    "This is UI shell only", "Real quote is disabled", "Fixture remains default", "No trading decision",
    "No buy/sell command", "No auto order", "Not production ready",
  ];
  for (const n of requiredNotes) {
    if (vm.shellNotes.includes(n)) details.push(`PASS  shellNotes contains "${n}".`);
    else issues.push(`FAIL  shellNotes must contain "${n}".`);
  }

  return { result: { name: "view_model_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] }, decision: vm.decision };
}

// ---------------------------------------------------------------------------
// Gate 4: Safety page mounts the card
// ---------------------------------------------------------------------------

function checkMounted(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const tag of ["ShadowQuoteComparisonCard", "buildShadowQuoteComparisonViewModel"]) {
    if (safety && safety.includes(tag)) details.push(`PASS  /system/safety references ${tag}.`);
    else issues.push(`FAIL  /system/safety must reference ${tag}.`);
  }
  return { name: "mounted", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 5: Safety (forbidden token scan + protected files + no API route)
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
  "placeorder",
  "autoorder",
  "broker",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of [COMPONENT_REL, VM_REL]) {
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
    "app/api/portfolio/real-quote/route.ts",
    "app/api/shadow-comparison/route.ts",
    "supabase/shadow_comparison.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in Phase 2b (UI shell only).`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "use-cases/war-room/phase-2-locked-real-quote-contract.ts",
    "use-cases/war-room/phase-2-disabled-real-quote-provider.ts",
  ];
  for (const rel of protectedFiles) {
    if (fileExists(resolve(rel))) details.push(`PASS  ${rel} still present.`);
    else issues.push(`FAIL  ${rel} missing — must exist.`);
  }

  return { name: "safety", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: package.json + doc
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:phase-2b-shadow-comparison-ui-shell": "node --require ./scripts/register-typescript.cjs ./scripts/validate-phase-2b-shadow-comparison-ui-shell.ts"',
];

const DOC_TERMS: string[] = [
  "Phase 2b Shadow Comparison UI Shell",
  "INTERFACE_ONLY_NOT_CONNECTED",
  "NO_GO",
  "DisabledRealQuoteProvider",
  "no fetch",
  "no env read",
  "no Supabase connection",
  "no real market data",
  "no API route",
  "no /api/portfolio switch",
  "no buy/sell command",
  "no auto order",
  "no broker API",
  "not PRODUCTION_READY",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const componentBody = readFile(resolve(COMPONENT_REL));
const docBody = readFile(resolve(DOC_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const uiCheck = checkTerms("ui_required", componentBody, COMPONENT_REL, UI_REQUIRED);
const uiForbiddenCheck = checkUiForbidden(componentBody);
const { result: vmCheck, decision } = checkViewModel();
const mountedCheck = checkMounted();
const docCheck = checkTerms("doc_phrases", docBody, DOC_REL, DOC_TERMS);
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  uiCheck,
  uiForbiddenCheck,
  vmCheck,
  mountedCheck,
  docCheck,
  pkgCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: ShellSummary = {
  status: overallStatus,
  checked_files: [COMPONENT_REL, VM_REL, DOC_REL, SAFETY_PAGE_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    ui_required: uiCheck.status,
    ui_forbidden: uiForbiddenCheck.status,
    view_model_checks: vmCheck.status,
    mounted: mountedCheck.status,
    doc_phrases: docCheck.status,
    package_checks: pkgCheck.status,
    safety: safetyCheck.status,
  },
  decision,
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
