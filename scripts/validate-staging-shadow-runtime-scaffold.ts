/**
 * Staging Shadow Runtime Scaffold Validator — SCAFFOLD ONLY, NOT CONNECTED
 *
 * Static + pure-function check. Imports the scaffold contract + providers and proves
 * everything stays scaffold-only / NO_GO / not connected, the providers perform no
 * fetch, and no runtime token leaked into the scaffold files. It does NOT start a
 * server, make any HTTP request, connect to Supabase, read env keys, build a runtime,
 * or write data.
 *
 * Forbidden-token scanning is case-insensitive and applies to the new scaffold code
 * files (NOT the doc). The contract carries safety FLAG names `serviceRoleForbidden`
 * and `autoOrderRequested` (which contain the substrings "servicerole"/"autoorder"),
 * so those are not blanket-scanned; the dangerous `service_role` env form / placeorder
 * ARE scanned.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const builderModule = require("../use-cases/war-room/build-shadow-runtime-comparison") as typeof import("../use-cases/war-room/build-shadow-runtime-comparison");
const yahooModule = require("../services/market-data/yahoo-readonly-provider") as typeof import("../services/market-data/yahoo-readonly-provider");

const {
  buildStagingShadowRuntimeContract,
  buildYahooReadonlyProviderScaffold,
  buildTwseTpexVerificationProviderScaffold,
  buildScaffoldOnlyQuoteCandidate,
  buildShadowRuntimeComparison,
} = builderModule;
const { buildYahooScaffoldCandidate } = yahooModule;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

interface ScaffoldSummary {
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

const TYPES_REL = "services/market-data/public-quote-provider.types.ts";
const YAHOO_REL = "services/market-data/yahoo-readonly-provider.ts";
const TWSE_REL = "services/market-data/twse-tpex-verification-provider.ts";
const BUILDER_REL = "use-cases/war-room/build-shadow-runtime-comparison.ts";
const DOC_REL = "docs/staging-readonly-shadow-runtime-scaffold.md";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";
const README_REL = "README.md";
const PKG_REL = "package.json";

const SCAFFOLD_FILES = [TYPES_REL, YAHOO_REL, TWSE_REL, BUILDER_REL];
const PROVIDER_FILES = [YAHOO_REL, TWSE_REL];

const FIXED_TS = "2026-06-23T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Gate 1: Required files
// ---------------------------------------------------------------------------

function checkRequiredFiles(): CheckResult {
  const required: Array<{ label: string; rel: string }> = [
    { label: "Provider types (new)", rel: TYPES_REL },
    { label: "Yahoo provider scaffold (new)", rel: YAHOO_REL },
    { label: "TWSE/TPEx provider scaffold (new)", rel: TWSE_REL },
    { label: "Shadow runtime comparison builder (new)", rel: BUILDER_REL },
    { label: "Scaffold doc (new)", rel: DOC_REL },
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
// Gate 2: Contract checks
// ---------------------------------------------------------------------------

function checkContract(): { result: CheckResult; decision: string } {
  const details: string[] = [];
  const issues: string[] = [];

  const c = buildStagingShadowRuntimeContract({ generatedAt: FIXED_TS });

  const expectEq = (label: string, actual: unknown, expected: unknown): void => {
    if (actual === expected) details.push(`PASS  ${label} === ${JSON.stringify(expected)}.`);
    else issues.push(`FAIL  ${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
  };

  expectEq("contractVersion", c.contractVersion, "STAGING_SHADOW_RUNTIME_SCAFFOLD");
  expectEq("mode", c.mode, "SCAFFOLD_ONLY_NOT_CONNECTED");
  expectEq("decision", c.decision, "NO_GO");
  expectEq("defaultRealDataMode", c.defaultRealDataMode, "fixture");
  expectEq("shadowRuntimeAllowed", c.shadowRuntimeAllowed, false);
  expectEq("liveFetchAllowed", c.liveFetchAllowed, false);
  expectEq("envReadAllowed", c.envReadAllowed, false);
  expectEq("supabaseConnectionAllowed", c.supabaseConnectionAllowed, false);
  expectEq("apiRouteAllowed", c.apiRouteAllowed, false);
  expectEq("portfolioApiSwitchAllowed", c.portfolioApiSwitchAllowed, false);
  expectEq("productionReady", c.productionReady, false);
  expectEq("serviceRoleForbidden", c.serviceRoleForbidden, true);
  expectEq("brokerApiAllowed", c.brokerApiAllowed, false);
  expectEq("buySellCommandGenerated", c.buySellCommandGenerated, false);
  expectEq("autoOrderRequested", c.autoOrderRequested, false);

  // Providers scaffold-only / not connected, no order/broker/write capabilities issue.
  const yahoo = buildYahooReadonlyProviderScaffold();
  const twse = buildTwseTpexVerificationProviderScaffold();
  expectEq("yahoo.providerId", yahoo.providerId, "yahoo");
  expectEq("twse.providerId", twse.providerId, "mixed-public");
  for (const [label, p] of [["yahoo", yahoo], ["twse", twse]] as const) {
    if (p.runtimeStatus === "NOT_CONNECTED" || p.runtimeStatus === "SCAFFOLD_ONLY") details.push(`PASS  ${label} provider scaffold-only / not connected.`);
    else issues.push(`FAIL  ${label} provider must be scaffold-only / not connected.`);
    if (typeof p.getReadonlyQuoteCandidate === "function") details.push(`PASS  ${label} provider exposes getReadonlyQuoteCandidate.`);
    else issues.push(`FAIL  ${label} provider must expose getReadonlyQuoteCandidate.`);
    for (const cap of ["NO_ORDER", "NO_BROKER", "NO_WRITE"]) {
      if (p.capabilities.includes(cap as never)) details.push(`PASS  ${label} capability ${cap}.`);
      else issues.push(`FAIL  ${label} must declare capability ${cap}.`);
    }
  }

  // Scaffold candidate: not real data / not connected / not operational / no trading command.
  const cand = buildScaffoldOnlyQuoteCandidate("2330", "yahoo");
  expectEq("candidate.isRealData", cand.isRealData, false);
  expectEq("candidate.isConnected", cand.isConnected, false);
  expectEq("candidate.isDisabled", cand.isDisabled, true);
  expectEq("candidate.operationalUseAllowed", cand.operationalUseAllowed, false);
  expectEq("candidate.buySellCommandGenerated", cand.buySellCommandGenerated, false);
  expectEq("candidate.autoOrderRequested", cand.autoOrderRequested, false);
  const yCand = buildYahooScaffoldCandidate("2330");
  expectEq("yahooCandidate.isRealData", yCand.isRealData, false);

  // Comparison non-operational + maps to downgrade.
  const sc = c.sampleComparison;
  expectEq("comparison.runtimeStatus", sc.runtimeStatus, "SCAFFOLD_ONLY_NOT_CONNECTED");
  expectEq("comparison.decision", sc.decision, "NO_GO");
  expectEq("comparison.liveFetchPerformed", sc.liveFetchPerformed, false);
  expectEq("comparison.envReadPerformed", sc.envReadPerformed, false);
  expectEq("comparison.supabaseConnected", sc.supabaseConnected, false);
  expectEq("comparison.apiRouteCreated", sc.apiRouteCreated, false);
  expectEq("comparison.portfolioApiSwitched", sc.portfolioApiSwitched, false);
  expectEq("comparison.operationalUseAllowed", sc.operationalUseAllowed, false);
  expectEq("comparison.productionReady", sc.productionReady, false);
  expectEq("comparison.mapsToV67V68V69", sc.mapsToV67V68V69, true);
  const sc2 = buildShadowRuntimeComparison(sc.fixtureQuote, yCand);
  if (sc2.operationalUseAllowed === false && sc2.decision === "NO_GO" && sc2.mapsToV67V68V69 === true)
    details.push("PASS  buildShadowRuntimeComparison(scaffold) non-operational / NO_GO / mapped.");
  else issues.push("FAIL  buildShadowRuntimeComparison(scaffold) must be non-operational / NO_GO / mapped.");

  if (c.validation.valid) details.push("PASS  validation.valid === true.");
  else issues.push("FAIL  validation.valid must be true.");

  return { result: { name: "contract_checks", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] }, decision: c.decision };
}

// ---------------------------------------------------------------------------
// Gate 3: Providers do not fetch / read env / connect (source scan)
// ---------------------------------------------------------------------------

const PROVIDER_FORBIDDEN = ["fetch(", "axios", "process.env", "@supabase", "createclient", "service_role"];

function checkProvidersNoNetwork(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];
  for (const rel of PROVIDER_FILES) {
    const body = readFile(resolve(rel));
    if (body == null) { issues.push(`FAIL  Cannot read ${rel}.`); continue; }
    const lower = stripComments(body).toLowerCase();
    for (const token of PROVIDER_FORBIDDEN) {
      if (lower.includes(token)) issues.push(`FAIL  Provider ${rel} must not contain "${token}".`);
      else details.push(`PASS  ${rel} has no "${token}".`);
    }
  }
  return { name: "providers_no_network", status: issues.length > 0 ? "FAIL" : "PASS", details: [...details, ...issues] };
}

// ---------------------------------------------------------------------------
// Gate 4: Safety (forbidden token scan + protected files + no API route)
// ---------------------------------------------------------------------------

// The safety FLAG names `serviceRoleForbidden` / `autoOrderRequested` legitimately
// contain "servicerole" / "autoorder", so those are not blanket-scanned. The
// dangerous `service_role` env form + placeorder ARE scanned.
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
  "service_role",
  "placeorder",
];

function checkSafety(): CheckResult {
  const details: string[] = [];
  const issues: string[] = [];

  for (const rel of SCAFFOLD_FILES) {
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

  // No new API route / SQL migration in this scaffold phase.
  const forbiddenArtifacts = [
    "app/api/portfolio/shadow-runtime/route.ts",
    "app/api/market-data/route.ts",
    "supabase/market_data.sql",
  ];
  for (const rel of forbiddenArtifacts) {
    if (fileExists(resolve(rel))) issues.push(`FAIL  Artifact ${rel} must not exist in scaffold phase.`);
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
// Gate 5: package.json + doc + README
// ---------------------------------------------------------------------------

const PKG_TERMS: string[] = [
  '"test:staging-shadow-runtime-scaffold": "node --require ./scripts/register-typescript.cjs ./scripts/validate-staging-shadow-runtime-scaffold.ts"',
];

const DOC_TERMS: string[] = [
  "scaffold + validator",
  "no live fetch",
  "no env read",
  "no Supabase connection",
  "no API route",
  "no /api/portfolio switch",
  "no real market data",
  "no DB write",
  "no broker API",
  "no buy/sell command",
  "no auto order",
  "not production ready",
  "Yahoo provider is scaffold-only",
  "TWSE / TPEx verification provider is scaffold-only",
  "service role forbidden",
  "default remains fixture",
  "kill switch remains off",
  "shadow runtime still non-operational",
  "SCAFFOLD_ONLY_NOT_CONNECTED",
  "NO_GO",
];

const README_TERMS: string[] = [
  "Staging shadow runtime scaffold",
  "SCAFFOLD_ONLY_NOT_CONNECTED",
  "NO_GO",
  "no live fetch",
  "npm run test:staging-shadow-runtime-scaffold",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docBody = readFile(resolve(DOC_REL));
const readmeBody = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const fileCheck = checkRequiredFiles();
const { result: contractCheck, decision } = checkContract();
const providerNetCheck = checkProvidersNoNetwork();
const safetyCheck = checkSafety();
const pkgCheck = checkTerms("package_checks", pkgBody, PKG_REL, PKG_TERMS);
const docCheck = checkTerms("doc_phrases", docBody, DOC_REL, DOC_TERMS);
const readmeCheck = checkTerms("readme_checks", readmeBody, README_REL, README_TERMS);

const allChecks: CheckResult[] = [
  fileCheck,
  contractCheck,
  providerNetCheck,
  safetyCheck,
  pkgCheck,
  docCheck,
  readmeCheck,
];
const overallStatus = combineStatus(allChecks.map((c) => c.status));

const allIssues: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
const allWarnings: string[] = allChecks.flatMap((c) => c.details.filter((d) => d.startsWith("WARNING")));

const summary: ScaffoldSummary = {
  status: overallStatus,
  checked_files: [TYPES_REL, YAHOO_REL, TWSE_REL, BUILDER_REL, DOC_REL, SAFETY_PAGE_REL, README_REL, PKG_REL],
  gates: {
    required_files: fileCheck.status,
    contract_checks: contractCheck.status,
    providers_no_network: providerNetCheck.status,
    safety: safetyCheck.status,
    package_checks: pkgCheck.status,
    doc_phrases: docCheck.status,
    readme_checks: readmeCheck.status,
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
