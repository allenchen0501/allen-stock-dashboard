/**
 * Limited Live Fetch Dry-run Implementation Validator — static analysis only
 *
 * Confirms the limited live fetch dry-run was implemented INSIDE the single approved
 * provider file only, with the restricted shape the owner approved: symbol 3019 only,
 * channel tse_3019.tw only, GET only, timeout=3000ms, maxRetries=0, fallback to the
 * disabled scaffold candidate, shadow-only, default fixture, non-operational, not
 * production ready.
 *
 * This validator performs NO network request, NO Supabase connection, NO env read, and
 * writes nothing. It only reads source files from disk and scans them.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

type CheckStatus = "PASS" | "WARNING" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const TYPES_REL = "services/market-data/public-quote-provider.types.ts";
const YAHOO_REL = "services/market-data/yahoo-readonly-provider.ts";
const BUILDER_REL = "use-cases/war-room/build-shadow-runtime-comparison.ts";
const DOC_REL = "docs/limited-live-fetch-dry-run-implementation.md";
const SMOKE_REL = "scripts/run-limited-live-fetch-smoke-3019.ts";
const README_REL = "README.md";
const PKG_REL = "package.json";
const SAFETY_PAGE_REL = "app/system/safety/page.tsx";

// Other market-data scaffold files that must contain NO network code.
const OTHER_MARKET_DATA_FILES = [TYPES_REL, YAHOO_REL, BUILDER_REL];
// App-surface files that must NOT trigger a live fetch by default.
const APP_SURFACE_FILES = [SAFETY_PAGE_REL, "app/holdings/page.tsx", BUILDER_REL];

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

const providerRaw = readFile(resolve(PROVIDER_REL));
const provider = providerRaw == null ? null : providerRaw;
const providerStripped = provider == null ? "" : stripComments(provider);
const providerLower = providerStripped.toLowerCase();
const docBody = readFile(resolve(DOC_REL));
const pkgBody = readFile(resolve(PKG_REL));
const readmeBody = readFile(resolve(README_REL));

const checks: CheckResult[] = [];

function pushCheck(name: string, conditions: Array<{ ok: boolean; pass: string; fail: string }>): void {
  const details: string[] = [];
  let status: CheckStatus = "PASS";
  for (const c of conditions) {
    if (c.ok) details.push(`PASS  ${c.pass}`);
    else {
      details.push(`FAIL  ${c.fail}`);
      status = "FAIL";
    }
  }
  checks.push({ name, status, details });
}

// 1. Only approved provider file contains fetch( (within market-data scope).
const providerHasFetch = providerLower.includes("fetch(");
const otherMarketDataWithFetch = OTHER_MARKET_DATA_FILES.filter((rel) => {
  const b = readFile(resolve(rel));
  return b != null && stripComments(b).toLowerCase().includes("fetch(");
});
pushCheck("01_only_approved_provider_has_fetch", [
  { ok: providerHasFetch, pass: `${PROVIDER_REL} contains fetch( (approved).`, fail: `${PROVIDER_REL} must contain the approved limited fetch(.` },
  { ok: otherMarketDataWithFetch.length === 0, pass: "No other market-data file contains fetch(.", fail: `Other market-data file(s) contain fetch(: ${otherMarketDataWithFetch.join(", ")}.` },
]);

// 2. No other non-validator / non-doc market-data file contains fetch(.
pushCheck("02_no_other_market_data_fetch", [
  { ok: otherMarketDataWithFetch.length === 0, pass: "Market-data scaffold files (types/yahoo/comparison) have no fetch(.", fail: `fetch( leaked into: ${otherMarketDataWithFetch.join(", ")}.` },
]);

// Helper: scan a set of files for a forbidden token (stripped + lowercased).
function scanForbidden(token: string, files: string[]): string[] {
  const hits: string[] = [];
  for (const rel of files) {
    const b = readFile(resolve(rel));
    if (b != null && stripComments(b).toLowerCase().includes(token)) hits.push(rel);
  }
  return hits;
}

const ALL_MARKET_DATA = [PROVIDER_REL, ...OTHER_MARKET_DATA_FILES];

// 3. No axios.
pushCheck("03_no_axios", [
  { ok: scanForbidden("axios", ALL_MARKET_DATA).length === 0, pass: "No axios in market-data files.", fail: `axios present in: ${scanForbidden("axios", ALL_MARKET_DATA).join(", ")}.` },
]);

// 4. No process.env.
pushCheck("04_no_process_env", [
  { ok: scanForbidden("process.env", ALL_MARKET_DATA).length === 0, pass: "No process.env in market-data files.", fail: `process.env present in: ${scanForbidden("process.env", ALL_MARKET_DATA).join(", ")}.` },
]);

// 5. No Supabase.
pushCheck("05_no_supabase", [
  { ok: scanForbidden("@supabase", ALL_MARKET_DATA).length === 0, pass: "No @supabase in market-data files.", fail: `@supabase present in: ${scanForbidden("@supabase", ALL_MARKET_DATA).join(", ")}.` },
]);

// 6. No createClient.
pushCheck("06_no_create_client", [
  { ok: scanForbidden("createclient", ALL_MARKET_DATA).length === 0, pass: "No createClient in market-data files.", fail: `createClient present in: ${scanForbidden("createclient", ALL_MARKET_DATA).join(", ")}.` },
]);

// 7. No service_role / serviceRole. (Only the dangerous env form `service_role` is
// scanned; the scaffold flag name `serviceRoleForbidden` legitimately contains
// "servicerole" and must not be flagged.)
pushCheck("07_no_service_role", [
  { ok: scanForbidden("service_role", ALL_MARKET_DATA).length === 0, pass: "No service_role (env form) in market-data files.", fail: "service_role reference present in market-data files." },
]);

// 8. No API route added.
const FORBIDDEN_ARTIFACTS = [
  "app/api/market-data/route.ts",
  "app/api/portfolio/live-fetch/route.ts",
  "app/api/live-fetch/route.ts",
  "app/api/portfolio/limited-live-fetch/route.ts",
];
const existingArtifacts = FORBIDDEN_ARTIFACTS.filter((rel) => fileExists(resolve(rel)));
pushCheck("08_no_api_route", [
  { ok: existingArtifacts.length === 0, pass: "No new live-fetch API route exists.", fail: `Forbidden API route(s) exist: ${existingArtifacts.join(", ")}.` },
]);

// 9. No /api/portfolio switch. (Scanned in the approved provider only — the scaffold
// types/builder legitimately carry the safety label "no /api/portfolio switch".)
pushCheck("09_no_portfolio_api_switch", [
  { ok: scanForbidden("/api/portfolio", [PROVIDER_REL]).length === 0, pass: "No /api/portfolio reference in the approved provider.", fail: "/api/portfolio present in the approved provider." },
]);

// 10. No DB write.
const DB_WRITE_TOKENS = ["insert(", "upsert(", "delete(", ".update("];
const dbWriteHits = DB_WRITE_TOKENS.flatMap((t) => scanForbidden(t, ALL_MARKET_DATA).map((f) => `${t}@${f}`));
pushCheck("10_no_db_write", [
  { ok: dbWriteHits.length === 0, pass: "No DB write calls in market-data files.", fail: `DB write token(s) present: ${dbWriteHits.join(", ")}.` },
]);

// 11. No broker API. (Only dangerous broker-call forms are scanned; the provider
// legitimately declares the NO_BROKER capability and the scaffold flag name
// `brokerApiAllowed` must not be flagged.)
pushCheck("11_no_broker_api", [
  { ok: scanForbidden("brokerapi", [PROVIDER_REL]).length === 0 && scanForbidden("broker_api", [PROVIDER_REL]).length === 0 && scanForbidden("broker.", [PROVIDER_REL]).length === 0, pass: "No broker API call in the approved provider.", fail: "broker API call present in the approved provider." },
]);

// 12. No placeOrder.
pushCheck("12_no_place_order", [
  { ok: scanForbidden("placeorder", ALL_MARKET_DATA).length === 0, pass: "No placeOrder in market-data files.", fail: "placeOrder present in market-data files." },
]);

// 13. No autoOrder (call form, not the flag autoOrderRequested).
const autoOrderCallHits = scanForbidden("autoorder(", ALL_MARKET_DATA);
pushCheck("13_no_auto_order", [
  { ok: autoOrderCallHits.length === 0, pass: "No autoOrder() call in market-data files.", fail: `autoOrder() present in: ${autoOrderCallHits.join(", ")}.` },
]);

// 14. No PRODUCTION_READY.
const prodReadyHits = ALL_MARKET_DATA.filter((rel) => {
  const b = readFile(resolve(rel));
  return b != null && b.includes("PRODUCTION_READY");
});
pushCheck("14_no_production_ready_token", [
  { ok: prodReadyHits.length === 0, pass: "No PRODUCTION_READY token in market-data files.", fail: `PRODUCTION_READY present in: ${prodReadyHits.join(", ")}.` },
]);

// 15. Provider restricts symbol to 3019.
pushCheck("15_restrict_symbol_3019", [
  { ok: providerStripped.includes('"3019"'), pass: 'Provider references approved symbol "3019".', fail: 'Provider must reference approved symbol "3019".' },
  { ok: providerLower.includes("approved_symbol") && (providerLower.includes("!== limited_live_fetch_approved_symbol") || providerLower.includes("=== limited_live_fetch_approved_symbol")), pass: "Provider guards on the approved symbol constant.", fail: "Provider must guard symbol against the approved-symbol constant." },
]);

// 16. Provider restricts channel to tse_3019.tw.
pushCheck("16_restrict_channel", [
  { ok: providerStripped.includes("tse_3019.tw"), pass: "Provider references approved channel tse_3019.tw.", fail: "Provider must reference approved channel tse_3019.tw." },
]);

// 17. timeout 3000ms exists.
pushCheck("17_timeout_3000", [
  { ok: providerStripped.includes("3000") && providerLower.includes("timeout"), pass: "Provider defines a 3000ms timeout.", fail: "Provider must define a 3000ms timeout." },
  { ok: providerLower.includes("abortcontroller"), pass: "Provider uses AbortController for timeout.", fail: "Provider must use AbortController for the timeout." },
]);

// 18. maxRetries 0 exists.
pushCheck("18_max_retries_0", [
  { ok: providerLower.includes("maxretries=0") || providerLower.includes("max_retries = 0"), pass: "Provider declares maxRetries=0.", fail: "Provider must declare maxRetries=0." },
]);

// 19. GET only exists.
pushCheck("19_get_only", [
  { ok: providerLower.includes('method: "get"'), pass: 'Provider uses method: "GET".', fail: 'Provider must use method: "GET".' },
]);

// 20. No POST / PUT / PATCH / DELETE methods.
const HTTP_WRITE_METHODS = ['method: "post"', 'method: "put"', 'method: "patch"', 'method: "delete"'];
const httpWriteHits = HTTP_WRITE_METHODS.filter((m) => providerLower.includes(m));
pushCheck("20_no_write_methods", [
  { ok: httpWriteHits.length === 0, pass: "No POST/PUT/PATCH/DELETE method in provider.", fail: `Forbidden HTTP method(s) present: ${httpWriteHits.join(", ")}.` },
]);

// 21. Fallback disabled scaffold candidate exists.
const fallbackCount = (providerStripped.match(/buildTwseTpexScaffoldCandidate/g) ?? []).length;
pushCheck("21_fallback_scaffold", [
  { ok: providerLower.includes("catch"), pass: "Provider has a catch fallback path.", fail: "Provider must catch failures and fall back." },
  { ok: fallbackCount >= 3, pass: `Provider falls back to buildTwseTpexScaffoldCandidate (${fallbackCount} uses).`, fail: "Provider must fall back to the disabled scaffold candidate on failure." },
]);

// 22. operationalUseAllowed=false.
pushCheck("22_operational_false", [
  { ok: providerStripped.includes("operationalUseAllowed: false"), pass: "Provider sets operationalUseAllowed: false.", fail: "Provider must set operationalUseAllowed: false." },
]);

// 23. buySellCommandGenerated=false.
pushCheck("23_buysell_false", [
  { ok: providerStripped.includes("buySellCommandGenerated: false"), pass: "Provider sets buySellCommandGenerated: false.", fail: "Provider must set buySellCommandGenerated: false." },
]);

// 24. autoOrderRequested=false.
pushCheck("24_autoorder_false", [
  { ok: providerStripped.includes("autoOrderRequested: false"), pass: "Provider sets autoOrderRequested: false.", fail: "Provider must set autoOrderRequested: false." },
]);

// 25. productionReady=false (no PRODUCTION_READY in provider; doc states it).
pushCheck("25_production_not_ready", [
  { ok: prodReadyHits.length === 0, pass: "No PRODUCTION_READY in market-data files (not production ready).", fail: "Provider must not mark PRODUCTION_READY." },
  { ok: docBody != null && docBody.includes("productionReady=false"), pass: "Doc states productionReady=false.", fail: "Doc must state productionReady=false." },
]);

// 26. Default remains fixture.
pushCheck("26_default_fixture", [
  { ok: providerLower.includes("dryrunlivefetch") && providerStripped.includes("options?.dryRunLiveFetch === true"), pass: "Default path requires explicit dryRunLiveFetch=true; otherwise scaffold.", fail: "Default path must require explicit opt-in (dryRunLiveFetch)." },
  { ok: docBody != null && docBody.includes("default fixture"), pass: "Doc states default fixture.", fail: "Doc must state default fixture." },
]);

// 27. Shadow-only wording exists.
pushCheck("27_shadow_only", [
  { ok: providerLower.includes("shadow-only"), pass: "Provider documents shadow-only.", fail: "Provider must document shadow-only." },
  { ok: docBody != null && docBody.toLowerCase().includes("shadow-only"), pass: "Doc documents shadow-only.", fail: "Doc must document shadow-only." },
]);

// 28. Owner approval text exists in doc.
const OWNER_APPROVAL =
  "我同意進行 limited live fetch dry-run implementation，僅限 approved provider、shadow-only、default fixture、不切 /api/portfolio、不下單、不自動交易。";
pushCheck("28_owner_approval_in_doc", [
  { ok: docBody != null && docBody.includes(OWNER_APPROVAL), pass: "Doc contains the exact owner approval text.", fail: "Doc must contain the exact owner approval text." },
]);

// 29. App does not call live fetch by default.
const appLiveFetchHits: string[] = [];
for (const rel of APP_SURFACE_FILES) {
  const b = readFile(resolve(rel));
  if (b == null) continue;
  const lower = stripComments(b).toLowerCase();
  if (lower.includes("gettwsetpexlimitedlivefetchcandidate") || lower.includes("dryrunlivefetch: true") || lower.includes("dryrunlivefetch:true")) {
    appLiveFetchHits.push(rel);
  }
}
pushCheck("29_app_no_default_live_fetch", [
  { ok: appLiveFetchHits.length === 0, pass: "No app-surface file triggers a live fetch by default.", fail: `App-surface file(s) trigger live fetch: ${appLiveFetchHits.join(", ")}.` },
]);

// 30. Package scripts + required files exist.
const PKG_TEST = '"test:limited-live-fetch-dry-run-implementation": "node --require ./scripts/register-typescript.cjs ./scripts/validate-limited-live-fetch-dry-run-implementation.ts"';
const PKG_SMOKE = '"smoke:limited-live-fetch:3019": "node --require ./scripts/register-typescript.cjs ./scripts/run-limited-live-fetch-smoke-3019.ts"';
pushCheck("30_package_and_files", [
  { ok: pkgBody != null && pkgBody.includes(PKG_TEST), pass: "package.json has test:limited-live-fetch-dry-run-implementation.", fail: "package.json must add test:limited-live-fetch-dry-run-implementation." },
  { ok: pkgBody != null && pkgBody.includes(PKG_SMOKE), pass: "package.json has smoke:limited-live-fetch:3019.", fail: "package.json must add smoke:limited-live-fetch:3019." },
  { ok: fileExists(resolve(DOC_REL)), pass: "Implementation doc exists.", fail: "Implementation doc must exist." },
  { ok: fileExists(resolve(SMOKE_REL)), pass: "Smoke script exists.", fail: "Smoke script must exist." },
  { ok: provider != null, pass: "Approved provider file exists.", fail: "Approved provider file must exist." },
  { ok: readmeBody != null && readmeBody.includes("Limited live fetch dry-run implementation"), pass: "README documents the implementation.", fail: "README must document the implementation." },
]);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const summary = {
  status: overallStatus,
  spec: "LIMITED_LIVE_FETCH_DRY_RUN_IMPLEMENTATION",
  approved_provider: PROVIDER_REL,
  approved_symbol: "3019",
  approved_channel: "tse_3019.tw",
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((c) => [c.name, c.status])),
  issues,
  // Static analysis — this validator itself never connects or writes.
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  db_write_performed: false,
  api_route_created: false,
  operationalUseAllowed: false,
  productionReady: false,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
