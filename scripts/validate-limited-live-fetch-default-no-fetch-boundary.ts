/**
 * Limited Live Fetch — Default No-Fetch Boundary Validator
 *
 * Spies on globalThis.fetch (NEVER touches the real network) and proves the DEFAULT
 * runtime path performs NO fetch: `getReadonlyQuoteCandidate(symbol)` with no options
 * (dryRunLiveFetch defaults to false), and the explicit `{ dryRunLiveFetch: false }`
 * path, both yield a safe scaffold/disabled candidate with zero fetch calls — even for
 * the approved symbol 3019. An unsupported symbol likewise never fetches. The fetch spy
 * is restored afterward. No manual smoke, no provider runtime change.
 *
 * Standalone — NOT part of test:safety-chain (which remains 20 checks).
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const providerModule = require("../services/market-data/twse-tpex-verification-provider") as typeof import("../services/market-data/twse-tpex-verification-provider");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildTwseTpexVerificationProviderScaffold } = providerModule;
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

// ---------------------------------------------------------------------------
// Fixed deterministic inputs
// ---------------------------------------------------------------------------

const FIXED_NOW_ISO = "2026-06-30T00:00:00.000Z";
const fixedNow = (): Date => new Date(FIXED_NOW_ISO);

// ---------------------------------------------------------------------------
// Fetch spy (NO real network)
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;
let fetchCallCount = 0;
let realNetworkUsed = false;

function installSpy(): void {
  fetchCallCount = 0;
  (globalThis as { fetch: unknown }).fetch = (..._args: unknown[]) => {
    // The default path must NEVER reach here. If it does, record it and return a benign
    // canned response so we still never touch the real network.
    fetchCallCount += 1;
    realNetworkUsed = true;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  };
}

function restoreFetch(): void {
  (globalThis as { fetch: unknown }).fetch = originalFetch;
}

function isSafeDisabledCandidate(c: Record<string, unknown>): boolean {
  return (
    c.isRealData === false &&
    c.isConnected === false &&
    c.isDisabled === true &&
    c.operationalUseAllowed === false &&
    c.buySellCommandGenerated === false &&
    c.autoOrderRequested === false
  );
}

// ---------------------------------------------------------------------------
// Static safety boundary (provider scan + package composition)
// ---------------------------------------------------------------------------

const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const PKG_REL = "package.json";
const DOC_REL = "docs/limited-live-fetch-default-no-fetch-boundary.md";

const providerRaw = readFile(resolve(PROVIDER_REL));
const providerStripped = providerRaw == null ? "" : stripComments(providerRaw);
const providerLower = providerStripped.toLowerCase();
const pkgBody = readFile(resolve(PKG_REL));

function runStaticChecks(): void {
  pushCheck("10_provider_scope", [
    { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"'), pass: "Provider still restricts symbol to 3019.", fail: "Provider must still restrict symbol to 3019." },
    { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw"'), pass: "Provider still pins channel tse_3019.tw.", fail: "Provider must still pin channel tse_3019.tw." },
    { ok: providerStripped.includes("LIMITED_LIVE_FETCH_TIMEOUT_MS = 3000"), pass: "timeoutMs remains 3000.", fail: "timeoutMs must remain 3000." },
    { ok: providerStripped.includes("LIMITED_LIVE_FETCH_MAX_RETRIES = 0"), pass: "maxRetries remains 0.", fail: "maxRetries must remain 0." },
    { ok: providerLower.includes('method: "get"'), pass: "GET only remains.", fail: "GET only must remain." },
    // The default path must require an explicit opt-in.
    { ok: providerStripped.includes("options?.dryRunLiveFetch === true"), pass: "Default path requires explicit dryRunLiveFetch=true.", fail: "Default path must require explicit dryRunLiveFetch=true." },
  ]);

  const FORBIDDEN_SYMBOLS = ["4966", "5347", "4979", "2455", "2743"];
  pushCheck("11_no_scope_expansion", [
    { ok: FORBIDDEN_SYMBOLS.every((s) => !providerStripped.includes(s)), pass: "No new symbol beyond 3019.", fail: "No symbol beyond 3019 may be added." },
    { ok: !providerLower.includes("yahoo"), pass: "No Yahoo.", fail: "No Yahoo may be added." },
    { ok: !providerLower.includes("@supabase") && !providerLower.includes("createclient"), pass: "No Supabase / createClient.", fail: "No Supabase / createClient." },
    { ok: !providerLower.includes("process.env"), pass: "No process.env.", fail: "No process.env." },
    { ok: !providerStripped.includes("/api/portfolio"), pass: "No /api/portfolio switch.", fail: "No /api/portfolio switch." },
    { ok: !providerLower.includes("brokerapi") && !providerLower.includes("broker_api"), pass: "No broker API.", fail: "No broker API." },
    { ok: !providerLower.includes("placeorder"), pass: "No buy/sell command.", fail: "No buy/sell command." },
    { ok: !providerLower.includes("autoorder("), pass: "No auto order.", fail: "No auto order." },
  ]);

  const FORBIDDEN_ARTIFACTS = [
    "app/api/market-data/route.ts",
    "app/api/portfolio/live-fetch/route.ts",
    "app/api/live-fetch/route.ts",
    "app/api/no-fetch/route.ts",
  ];
  pushCheck("12_no_api_route", [
    { ok: FORBIDDEN_ARTIFACTS.every((rel) => !fileExists(resolve(rel))), pass: "No new API route exists.", fail: "No new API route may be added." },
  ]);

  let safetyChain = "";
  try {
    const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
    safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
  } catch {
    safetyChain = "";
  }
  pushCheck("13_chain_membership", [
    { ok: safetyChain.length > 0, pass: "test:safety-chain present.", fail: "test:safety-chain must exist." },
    { ok: !safetyChain.includes("smoke:limited-live-fetch:3019"), pass: "Smoke script NOT in safety chain.", fail: "Smoke script must NOT be in safety chain." },
    { ok: safetyChain.includes("test:limited-live-fetch-golden-snapshot"), pass: "Golden validator IS in safety chain.", fail: "Golden validator must remain in safety chain." },
    { ok: safetyChain.includes("test:limited-live-fetch-mock-fetch-boundary"), pass: "Mock fetch boundary validator IS in safety chain.", fail: "Mock fetch boundary validator must remain in safety chain." },
    // This validator is now part of the safety chain (Default No-Fetch Safety Chain Integration).
    { ok: safetyChain.includes("test:limited-live-fetch-default-no-fetch-boundary"), pass: "Default no-fetch validator IS in safety chain.", fail: "Default no-fetch validator must be in safety chain." },
  ]);

  let totalChecks = -1;
  try {
    totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" }).result.totalChecks;
  } catch {
    totalChecks = -1;
  }
  pushCheck("14_safety_chain_21", [
    { ok: totalChecks === 21, pass: `Safety chain CI guard has 21 checks (got ${totalChecks}).`, fail: `Safety chain CI guard must have 21 checks (got ${totalChecks}).` },
  ]);

  pushCheck("15_doc_and_script", [
    { ok: fileExists(resolve(DOC_REL)), pass: "Default no-fetch boundary doc exists.", fail: "Default no-fetch boundary doc must exist." },
    { ok: pkgBody != null && pkgBody.includes('"test:limited-live-fetch-default-no-fetch-boundary": "node --require ./scripts/register-typescript.cjs ./scripts/validate-limited-live-fetch-default-no-fetch-boundary.ts"'), pass: "package.json has the default no-fetch script.", fail: "package.json must add the default no-fetch script." },
  ]);

  pushCheck("16_provider_runtime_unchanged", [
    { ok: providerStripped.includes("export function buildTwseTpexVerificationProviderScaffold"), pass: "Provider factory unchanged (still exported).", fail: "Provider factory must remain unchanged." },
    { ok: providerStripped.includes("buildTwseTpexScaffoldCandidate"), pass: "Provider retains scaffold candidate.", fail: "Provider must retain scaffold candidate." },
  ]);
}

// ---------------------------------------------------------------------------
// Async boundary cases (offline, spied fetch — default path must NOT fetch)
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  const provider = buildTwseTpexVerificationProviderScaffold();

  // 1) Default path (no options) — approved symbol 3019 must NOT fetch.
  installSpy();
  const defA = (await provider.getReadonlyQuoteCandidate("3019")) as unknown as Record<string, unknown>;
  const defACalls = fetchCallCount;
  pushCheck("01_default_path_no_fetch", [
    { ok: defACalls === 0, pass: `Default path fetch call count = 0 (got ${defACalls}).`, fail: `Default path must not fetch (got ${defACalls}).` },
    { ok: defA.symbol === "3019", pass: "Default candidate symbol === 3019.", fail: `Default candidate symbol must be 3019 (got ${JSON.stringify(defA.symbol)}).` },
    { ok: isSafeDisabledCandidate(defA), pass: "Default candidate is safe / disabled / non-operational.", fail: `Default candidate must be safe disabled non-operational: ${JSON.stringify(defA)}.` },
  ]);

  // 2) Explicit dryRunLiveFetch=false (+ injected clock) — must NOT fetch.
  installSpy();
  const defB = (await provider.getReadonlyQuoteCandidate("3019", { dryRunLiveFetch: false, now: fixedNow })) as unknown as Record<string, unknown>;
  const defBCalls = fetchCallCount;
  pushCheck("02_explicit_false_no_fetch", [
    { ok: defBCalls === 0, pass: `Explicit dryRunLiveFetch=false fetch call count = 0 (got ${defBCalls}).`, fail: `Explicit dryRunLiveFetch=false must not fetch (got ${defBCalls}).` },
    { ok: isSafeDisabledCandidate(defB), pass: "Explicit-false candidate is safe / disabled / non-operational.", fail: `Explicit-false candidate must be safe disabled non-operational: ${JSON.stringify(defB)}.` },
    { ok: defB.receivedAt === FIXED_NOW_ISO, pass: "Explicit-false candidate uses deterministic receivedAt.", fail: `Explicit-false candidate receivedAt must be ${FIXED_NOW_ISO} (got ${JSON.stringify(defB.receivedAt)}).` },
  ]);

  // 3) Unsupported symbol default path — must NOT fetch, safe fallback.
  installSpy();
  const defC = (await provider.getReadonlyQuoteCandidate("9999", { now: fixedNow })) as unknown as Record<string, unknown>;
  const defCCalls = fetchCallCount;
  pushCheck("03_unsupported_default_no_fetch", [
    { ok: defCCalls === 0, pass: `Unsupported symbol default path fetch call count = 0 (got ${defCCalls}).`, fail: `Unsupported symbol default path must not fetch (got ${defCCalls}).` },
    { ok: isSafeDisabledCandidate(defC), pass: "Unsupported symbol default candidate is safe / disabled / non-operational.", fail: `Unsupported symbol default candidate must be safe disabled non-operational: ${JSON.stringify(defC)}.` },
  ]);

  // Restore + assert no real network.
  restoreFetch();
  pushCheck("04_restore_no_real_network", [
    { ok: realNetworkUsed === false, pass: "No real network request was made (default path never fetched).", fail: "Default path unexpectedly invoked fetch." },
    { ok: globalThis.fetch === originalFetch, pass: "globalThis.fetch restored to the original.", fail: "globalThis.fetch must be restored after the test." },
  ]);

  runStaticChecks();

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const overallStatus = combineStatus(checks.map((c) => c.status));
  const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

  const summary = {
    status: overallStatus,
    spec: "LIMITED_LIVE_FETCH_DEFAULT_NO_FETCH_BOUNDARY",
    fixed_now: FIXED_NOW_ISO,
    real_network_used: realNetworkUsed,
    fetch_restored: globalThis.fetch === originalFetch,
    smoke_invoked: false,
    total_checks: checks.length,
    passed_checks: checks.filter((c) => c.status === "PASS").length,
    failed_checks: checks.filter((c) => c.status === "FAIL").length,
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
}

run().catch((err) => {
  restoreFetch();
  console.log(JSON.stringify({ status: "FAIL", error: String(err) }, null, 2));
  process.exit(1);
});
