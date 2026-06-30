/**
 * Phase 2 Locked Implementation Validator — INTERFACE ONLY, NOT CONNECTED
 *
 * Static + pure-function check. Imports the locked-interface builder, the disabled
 * provider, and the shadow comparison, then proves everything stays interface-only /
 * NO_GO / not connected, the disabled provider performs no fetch, and the sample
 * shadow comparison is non-operational. It does NOT start a server, make any HTTP
 * request, connect to Supabase, read env keys, build a runtime, or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new contract /
 * provider / builder code files (NOT the doc). The contract carries the
 * `autoOrderRequested` flag (substring "autoorder"), so autoorder is not scanned in
 * those files; broker / placeorder ARE scanned.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-phase-2-locked-implementation-contract") as typeof import("../use-cases/war-room/build-phase-2-locked-implementation-contract");
const providerModule = require("../use-cases/war-room/phase-2-disabled-real-quote-provider") as typeof import("../use-cases/war-room/phase-2-disabled-real-quote-provider");

const { buildPhase2LockedImplementationContract, buildShadowQuoteComparison } = builderModule;
const { buildDisabledRealQuoteProvider, buildDisabledQuoteSnapshot } = providerModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface Phase2Summary {
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

const DOC_REL = "docs/phase-2-implementation-pr-scope.md";
const CONTRACT_REL = "use-cases/war-room/phase-2-locked-real-quote-contract.ts";
const PROVIDER_REL = "use-cases/war-room/phase-2-disabled-real-quote-provider.ts";
const BUILDER_REL = "use-cases/war-room/build-phase-2-locked-implementation-contract.ts";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "PR scope doc (new)", rel: DOC_REL },
    { label: "Locked contract (new)", rel: CONTRACT_REL },
    { label: "Disabled provider (new)", rel: PROVIDER_REL },
    { label: "Contract builder (new)", rel: BUILDER_REL },
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
  "Phase 2",
  "Implementation PR Scope",
  "PHASE_2_LOCKED_INTERFACE",
  "INTERFACE_ONLY_NOT_CONNECTED",
  "NO_GO",
  "fixture default",
  "shadow mode still locked",
  "real-readonly still locked",
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
// Gate 3: Contract type terms
// ---------------------------------------------------------------------------

const CONTRACT_TERMS: string[] = [
  "RealDataMode",
  "RealQuoteProviderId",
  "RealQuoteProviderStatus",
  "ReadonlyQuoteSnapshot",
  "QuoteProvider",
  "ShadowQuoteComparison",
  "Phase2LockedImplementationContract",
  "operationalUseAllowed: false",
  "shadowModeAllowed: false",
  "realReadonlyAllowed: false",
  "mapsToV67V68V69: true",
  '"fixture" | "shadow" | "real-readonly"',
];

// ---------------------------------------------------------------------------
// Gate 4: Contract / provider / shadow checks
// ---------------------------------------------------------------------------

function checkContract(): { result: CheckResult; decision: string } {
  const details: string[] = [];
  const issues: string[] = [];

  const c = buildPhase2LockedImplementationContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", c.contractVersion, "PHASE_2_LOCKED_INTERFACE");
  expectEq("mode", c.mode, "INTERFACE_ONLY_NOT_CONNECTED");
  expectEq("decision", c.decision, "NO_GO");
  expectEq("defaultRealDataMode", c.defaultRealDataMode, "fixture");
  expectEq("shadowModeAllowed", c.shadowModeAllowed, false);
  expectEq("realReadonlyAllowed", c.realReadonlyAllowed, false);

  const rec = c as unknown as Record<string, unknown>;
  const falseFlags = [
    "realDataConnected", "fetchPerformed", "envReadPerformed", "supabaseConnected", "apiRouteCreated",
    "portfolioApiSwitched", "buySellCommandGenerated", "autoOrderRequested", "productionReady",
  ];
  for (const f of falseFlags) expectEq(f, rec[f], false);

  // Disabled provider.
  const provider = buildDisabledRealQuoteProvider();
  expectEq("disabledProvider.status", provider.status, "DISABLED");
  expectEq("disabledProvider.providerId", provider.providerId, "disabled");
  if (typeof provider.getQuote === "function") details.push("PASS  disabledProvider.getQuote is a function.");
  else issues.push("FAIL  disabledProvider.getQuote must be a function.");

  // Disabled snapshot.
  const snap = buildDisabledQuoteSnapshot("2330", "disabled");
  expectEq("disabledSnapshot.isRealData", snap.isRealData, false);
  expectEq("disabledSnapshot.operationalUseAllowed", snap.operationalUseAllowed, false);
  expectEq("disabledSnapshot.price", snap.price, null);
  expectEq("disabledSnapshot.verificationStatus", snap.verificationStatus, "DISABLED");

  // Shadow comparison (fixture vs disabled real candidate → missing/blocked, non-operational).
  const sc = c.sampleShadowComparison;
  expectEq("shadow.operationalUseAllowed", sc.operationalUseAllowed, false);
  expectEq("shadow.mapsToV67V68V69", sc.mapsToV67V68V69, true);
  expectEq("shadow.missingRealQuote", sc.missingRealQuote, true);
  // Re-derive independently.
  const sc2 = buildShadowQuoteComparison(sc.fixtureQuote, snap);
  if (sc2.operationalUseAllowed === false && sc2.missingRealQuote === true && sc2.mapsToV67V68V69 === true)
    details.push("PASS  buildShadowQuoteComparison(disabled) is non-operational / missing / maps to downgrade.");
  else issues.push("FAIL  buildShadowQuoteComparison(disabled) must be non-operational / missing / mapped.");

  if (c.validation.valid) details.push("PASS  validation.valid === true.");
  else issues.push("FAIL  validation.valid must be true.");

  return { result: { name: "contract_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] }, decision: c.decision };
}

// ---------------------------------------------------------------------------
// Gate 5: UI checks
// ---------------------------------------------------------------------------

function checkUi(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  const safety = readFile(resolve(SAFETY_PAGE_REL));
  for (const term of ["PHASE_2_LOCKED_INTERFACE", "INTERFACE_ONLY_NOT_CONNECTED", "DisabledRealQuoteProvider"]) {
    if (safety && safety.includes(term)) details.push(`PASS  /system/safety contains "${term}".`);
    else issues.push(`FAIL  /system/safety must contain "${term}".`);
  }
  return { name: "ui_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 6: Safety (forbidden token scan + protected files + no API route)
// ---------------------------------------------------------------------------

// The contract carries `autoOrderRequested` (substring "autoorder"), so autoorder is
// not scanned here; broker / placeorder ARE scanned.
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
  "broker",
  "placeorder",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of [CONTRACT_REL, PROVIDER_REL, BUILDER_REL]) {
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

  // No new API route / SQL migration / real quote runtime in this phase.
  const forbiddenArtifacts = [
    "app/api/portfolio/real-quote/route.ts",
    "app/api/real-quote/route.ts",
    "supabase/real_quote.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in Phase 2 (interface only).`);
    else details.push(`PASS  ${rel} does not exist (correct).`);
  }

  const protectedFiles = [
    "app/holdings/page.tsx",
    "app/system/safety/page.tsx",
    "use-cases/war-room/build-safety-chain-ci-guard-contract.ts",
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
  '"test:phase-2-locked-implementation": "node --require ./scripts/register-typescript.cjs ./scripts/validate-phase-2-locked-implementation.ts"',
];

const README_TERMS: string[] = [
  "Phase 2",
  "PHASE_2_LOCKED_INTERFACE",
  "docs/phase-2-implementation-pr-scope.md",
  "use-cases/war-room/phase-2-locked-real-quote-contract.ts",
  "npm run test:phase-2-locked-implementation",
  "INTERFACE_ONLY_NOT_CONNECTED",
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
const contractTermsCheck = checkTerms("contract_terms", contractBody, CONTRACT_REL, CONTRACT_TERMS);
const { result: contractCheck, decision } = checkContract();
const uiCheck = checkUi();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);
const safetyCheck = checkSafety();

const allChecks: CheckResult[] = [
  fileCheck,
  phraseCheck,
  contractTermsCheck,
  contractCheck,
  uiCheck,
  pkgCheck,
  readmeCheck,
  safetyCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: Phase2Summary = {
  status: overallStatus,
  checked_files: [DOC_REL, CONTRACT_REL, PROVIDER_REL, BUILDER_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    required_phrases: phraseCheck.status,
    contract_terms: contractTermsCheck.status,
    contract_checks: contractCheck.status,
    ui_checks: uiCheck.status,
    package_checks: pkgCheck.status,
    readme_checks: readmeCheck.status,
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
