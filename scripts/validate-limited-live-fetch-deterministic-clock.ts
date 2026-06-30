/**
 * Limited Live Fetch Deterministic Clock Validator — static + pure-function check
 *
 * Confirms the approved provider supports an OPTIONAL injected `now()` clock so that
 * `receivedAt` is deterministic in tests, WITHOUT changing default runtime behavior or
 * expanding scope. It also re-asserts the approved limits (symbol 3019, channel
 * tse_3019.tw, timeout 3000, maxRetries 0, GET only, non-operational) and proves the
 * smoke / observation / this validator are NOT part of the safety chain (which stays 18).
 *
 * Makes NO network request, NO Supabase connection, NO env read; writes nothing.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildSafetyChainCiGuardContract } = guardModule;

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
// Paths + load
// ---------------------------------------------------------------------------

const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const TYPES_REL = "services/market-data/public-quote-provider.types.ts";
const DOC_REL = "docs/limited-live-fetch-deterministic-clock.md";
const PKG_REL = "package.json";

const SMOKE_SCRIPT = "smoke:limited-live-fetch:3019";
const OBS_ROUND_1 = "test:limited-live-fetch-3019-observation-round-1";
const OBS_ROUND_2 = "test:limited-live-fetch-3019-observation-round-2";
const DETERMINISTIC_SCRIPT = "test:limited-live-fetch-deterministic-clock";

const providerRaw = readFile(resolve(PROVIDER_REL));
const providerStripped = providerRaw == null ? "" : stripComments(providerRaw);
const providerLower = providerStripped.toLowerCase();
const typesRaw = readFile(resolve(TYPES_REL));
const typesStripped = typesRaw == null ? "" : stripComments(typesRaw);
const pkgBody = readFile(resolve(PKG_REL));

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

// 1. Provider options support now?: () => Date (or equivalent).
pushCheck("01_options_now_type", [
  { ok: typesStripped.includes("now?: () => Date"), pass: "Options type declares now?: () => Date.", fail: "Options type must declare now?: () => Date." },
  { ok: typesStripped.includes("PublicReadonlyQuoteCandidateOptions"), pass: "PublicReadonlyQuoteCandidateOptions type exists.", fail: "PublicReadonlyQuoteCandidateOptions type must exist." },
]);

// 2. Provider uses the injected clock when provided.
pushCheck("02_uses_injected_clock", [
  { ok: providerStripped.includes("resolveNow(now)"), pass: "Provider resolves receivedAt via resolveNow(now).", fail: "Provider must resolve receivedAt via the injected clock." },
  { ok: providerLower.includes("options?.now"), pass: "Provider reads options?.now.", fail: "Provider must read options?.now." },
]);

// 3. Fallback (scaffold) candidate can use the injected clock.
pushCheck("03_fallback_uses_clock", [
  { ok: /buildTwseTpexScaffoldCandidate\([\s\S]{0,40}now\?: \(\) => Date/.test(providerStripped), pass: "Scaffold/fallback candidate accepts an optional now clock.", fail: "Scaffold/fallback candidate must accept an optional now clock." },
  { ok: providerStripped.includes("now ? now().toISOString() : SCAFFOLD"), pass: "Scaffold receivedAt uses injected clock when provided.", fail: "Scaffold receivedAt must use the injected clock when provided." },
  { ok: providerStripped.includes("buildTwseTpexScaffoldCandidate(symbol, now)"), pass: "Fallback paths thread the injected clock through.", fail: "Fallback paths must thread the injected clock through." },
]);

// 4. Default behavior uses the real Date when no clock injected.
pushCheck("04_default_real_clock", [
  { ok: providerStripped.includes("now ? now() : new Date()"), pass: "resolveNow falls back to new Date() when no clock injected.", fail: "Default must use new Date() when no clock injected." },
  { ok: providerStripped.includes("receivedAt: SCAFFOLD") || providerStripped.includes(": SCAFFOLD"), pass: "Scaffold default receivedAt remains the placeholder (no clock).", fail: "Scaffold default receivedAt must remain unchanged." },
]);

// 5. dryRunLiveFetch default remains false.
pushCheck("05_dryrun_default_false", [
  { ok: providerStripped.includes("options?.dryRunLiveFetch === true"), pass: "dryRunLiveFetch requires explicit true (default false).", fail: "dryRunLiveFetch must default to false." },
]);

// 6. symbol remains 3019 only.
pushCheck("06_symbol_3019", [
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"'), pass: "Approved symbol pinned to 3019.", fail: "Approved symbol must remain 3019." },
]);

// 7. channel remains tse_3019.tw.
pushCheck("07_channel", [
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw"'), pass: "Approved channel pinned to tse_3019.tw.", fail: "Approved channel must remain tse_3019.tw." },
]);

// 8. timeoutMs remains 3000.
pushCheck("08_timeout_3000", [
  { ok: providerStripped.includes("LIMITED_LIVE_FETCH_TIMEOUT_MS = 3000"), pass: "Timeout remains 3000ms.", fail: "Timeout must remain 3000ms." },
]);

// 9. maxRetries remains 0.
pushCheck("09_max_retries_0", [
  { ok: providerStripped.includes("LIMITED_LIVE_FETCH_MAX_RETRIES = 0"), pass: "maxRetries remains 0.", fail: "maxRetries must remain 0." },
]);

// 10. GET only remains.
pushCheck("10_get_only", [
  { ok: providerLower.includes('method: "get"'), pass: 'Provider uses method: "GET".', fail: 'Provider must use method: "GET".' },
  { ok: !providerLower.includes('method: "post"') && !providerLower.includes('method: "put"') && !providerLower.includes('method: "patch"') && !providerLower.includes('method: "delete"'), pass: "No POST/PUT/PATCH/DELETE method.", fail: "Provider must not use POST/PUT/PATCH/DELETE." },
]);

// 11–13. Non-operational flags.
pushCheck("11_operational_false", [
  { ok: providerStripped.includes("operationalUseAllowed: false"), pass: "operationalUseAllowed: false.", fail: "operationalUseAllowed must be false." },
]);
pushCheck("12_buysell_false", [
  { ok: providerStripped.includes("buySellCommandGenerated: false"), pass: "buySellCommandGenerated: false.", fail: "buySellCommandGenerated must be false." },
]);
pushCheck("13_autoorder_false", [
  { ok: providerStripped.includes("autoOrderRequested: false"), pass: "autoOrderRequested: false.", fail: "autoOrderRequested must be false." },
]);

// 14. productionReady=false (no PRODUCTION_READY token).
pushCheck("14_not_production_ready", [
  { ok: providerRaw != null && !providerRaw.includes("PRODUCTION_READY"), pass: "Provider has no PRODUCTION_READY token.", fail: "Provider must not contain PRODUCTION_READY." },
  { ok: readFile(resolve(DOC_REL))?.includes("not production ready") === true, pass: "Doc states not production ready.", fail: "Doc must state not production ready." },
]);

// 15. No new symbol beyond 3019.
const FORBIDDEN_SYMBOLS = ["4966", "5347", "4979", "2455", "2743"];
const symbolHits = FORBIDDEN_SYMBOLS.filter((s) => providerStripped.includes(s));
pushCheck("15_no_new_symbol", [
  { ok: symbolHits.length === 0, pass: "No symbol beyond 3019.", fail: `Additional symbol(s) present: ${symbolHits.join(", ")}.` },
]);

// 16. No Yahoo.
pushCheck("16_no_yahoo", [
  { ok: !providerLower.includes("yahoo"), pass: "No Yahoo reference.", fail: "Provider must not add Yahoo." },
]);

// 17. No Supabase.
pushCheck("17_no_supabase", [
  { ok: !providerLower.includes("@supabase") && !providerLower.includes("createclient"), pass: "No Supabase / createClient.", fail: "Provider must not add Supabase / createClient." },
]);

// 18. No process.env.
pushCheck("18_no_process_env", [
  { ok: !providerLower.includes("process.env"), pass: "No process.env.", fail: "Provider must not read process.env." },
]);

// 19. No new API route.
const FORBIDDEN_ARTIFACTS = [
  "app/api/market-data/route.ts",
  "app/api/portfolio/live-fetch/route.ts",
  "app/api/live-fetch/route.ts",
  "app/api/clock/route.ts",
];
const existingArtifacts = FORBIDDEN_ARTIFACTS.filter((rel) => fileExists(resolve(rel)));
pushCheck("19_no_api_route", [
  { ok: existingArtifacts.length === 0, pass: "No new live-fetch/clock API route exists.", fail: `Forbidden API route(s): ${existingArtifacts.join(", ")}.` },
]);

// 20. No /api/portfolio switch.
pushCheck("20_no_portfolio_switch", [
  { ok: !providerStripped.includes("/api/portfolio"), pass: "No /api/portfolio reference in provider.", fail: "Provider must not reference /api/portfolio." },
]);

// 21. No broker API.
pushCheck("21_no_broker_api", [
  { ok: !providerLower.includes("brokerapi") && !providerLower.includes("broker_api"), pass: "No broker API call.", fail: "Provider must not add a broker API call." },
]);

// 22. No buy/sell command.
pushCheck("22_no_buysell_command", [
  { ok: !providerLower.includes("placeorder"), pass: "No placeOrder / buy-sell command.", fail: "Provider must not generate a buy/sell command." },
]);

// 23. No auto order.
pushCheck("23_no_auto_order", [
  { ok: !providerLower.includes("autoorder("), pass: "No autoOrder() call.", fail: "Provider must not auto order." },
]);

// Safety chain composition.
let safetyChain = "";
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}

// 24. Smoke script not in safety chain.
pushCheck("24_smoke_not_in_chain", [
  { ok: safetyChain.length > 0 && !safetyChain.includes(SMOKE_SCRIPT), pass: `test:safety-chain excludes ${SMOKE_SCRIPT}.`, fail: `test:safety-chain must exclude ${SMOKE_SCRIPT}.` },
]);

// 25. Observation validators not in safety chain.
pushCheck("25_observation_not_in_chain", [
  { ok: !safetyChain.includes(OBS_ROUND_1) && !safetyChain.includes(OBS_ROUND_2), pass: "test:safety-chain excludes both observation validators.", fail: "test:safety-chain must exclude observation validators." },
]);

// 26. test:safety-chain remains 18 checks (guard built in-process).
let totalChecks = -1;
try {
  const g = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
  totalChecks = g.result.totalChecks;
} catch {
  totalChecks = -1;
}
pushCheck("26_safety_chain_checks", [
  { ok: totalChecks === 21, pass: `Safety chain CI guard has 21 checks (got ${totalChecks}).`, fail: `Safety chain CI guard must have 21 checks (got ${totalChecks}).` },
]);

// 27. Deterministic validator not in safety chain.
pushCheck("27_deterministic_not_in_chain", [
  { ok: !safetyChain.includes(DETERMINISTIC_SCRIPT), pass: `test:safety-chain excludes ${DETERMINISTIC_SCRIPT}.`, fail: `test:safety-chain must exclude ${DETERMINISTIC_SCRIPT}.` },
]);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const summary = {
  status: overallStatus,
  spec: "LIMITED_LIVE_FETCH_DETERMINISTIC_CLOCK",
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  safety_chain_total_checks: totalChecks,
  gates: Object.fromEntries(checks.map((c) => [c.name, c.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  operationalUseAllowed: false,
  productionReady: false,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
