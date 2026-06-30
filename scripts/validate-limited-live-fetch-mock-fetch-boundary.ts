/**
 * Limited Live Fetch — Offline Mock Fetch Boundary Validator
 *
 * Monkey-patches globalThis.fetch with a canned mock (NEVER touches the real network),
 * drives the real entry function `getTwseTpexLimitedLiveFetchCandidate` with a fixed
 * clock, and asserts: the request only ever targets the approved channel tse_3019.tw via
 * GET; a successful response yields the golden candidate; an unsupported symbol never
 * fetches; fetch errors and malformed responses fall back safely. The mock is restored
 * afterward. No manual smoke, no provider runtime change.
 *
 * Standalone — NOT part of test:safety-chain (which remains 19 checks).
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const providerModule = require("../services/market-data/twse-tpex-verification-provider") as typeof import("../services/market-data/twse-tpex-verification-provider");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { getTwseTpexLimitedLiveFetchCandidate } = providerModule;
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
const TLONG_MS = Date.UTC(2026, 5, 30, 6, 30, 0);
const EXPECTED_SOURCE_TS = new Date(TLONG_MS).toISOString(); // 2026-06-30T06:30:00.000Z

const SUCCESS_BODY = {
  msgArray: [
    {
      ch: "tse_3019.tw",
      c: "3019",
      n: "亞光",
      z: "142.5",
      o: "140.5",
      h: "142.5",
      l: "139.5",
      y: "138",
      v: "3010",
      d: "20260630",
      t: "14:30:00",
      tlong: String(TLONG_MS),
    },
  ],
  rtcode: "0000",
};

// ---------------------------------------------------------------------------
// Fetch mock harness (NO real network)
// ---------------------------------------------------------------------------

interface FetchCall {
  url: string;
  method: string;
}

const originalFetch = globalThis.fetch;
let fetchCalls: FetchCall[] = [];
let realNetworkUsed = false;

type MockHandler = (url: string, init: unknown) => Promise<unknown>;

function installMock(handler: MockHandler): void {
  fetchCalls = [];
  (globalThis as { fetch: unknown }).fetch = (input: unknown, init?: { method?: string }) => {
    const url = typeof input === "string" ? input : String((input as { url?: string })?.url ?? input);
    fetchCalls.push({ url, method: (init?.method ?? "GET").toUpperCase() });
    return handler(url, init);
  };
}

function restoreFetch(): void {
  (globalThis as { fetch: unknown }).fetch = originalFetch;
}

function okResponse(body: unknown): Promise<unknown> {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
}

function urlIsApprovedOnly(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("tse_3019.tw") &&
    !lower.includes("yahoo") &&
    !lower.includes("supabase") &&
    !lower.includes("broker") &&
    !lower.includes("/api/portfolio")
  );
}

// ---------------------------------------------------------------------------
// Static safety boundary (provider scan + package composition)
// ---------------------------------------------------------------------------

const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const PKG_REL = "package.json";
const DOC_REL = "docs/limited-live-fetch-mock-fetch-boundary.md";

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
    "app/api/mock-fetch/route.ts",
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
    // This validator is now part of the safety chain (Mock Fetch Boundary Safety Chain Integration).
    { ok: safetyChain.includes("test:limited-live-fetch-mock-fetch-boundary"), pass: "Mock fetch validator IS in safety chain.", fail: "Mock fetch validator must be in safety chain." },
  ]);

  let totalChecks = -1;
  try {
    totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" }).result.totalChecks;
  } catch {
    totalChecks = -1;
  }
  pushCheck("14_safety_chain_20", [
    { ok: totalChecks === 20, pass: `Safety chain CI guard has 20 checks (got ${totalChecks}).`, fail: `Safety chain CI guard must have 20 checks (got ${totalChecks}).` },
  ]);

  pushCheck("15_doc_and_script", [
    { ok: fileExists(resolve(DOC_REL)), pass: "Mock fetch boundary doc exists.", fail: "Mock fetch boundary doc must exist." },
    { ok: pkgBody != null && pkgBody.includes('"test:limited-live-fetch-mock-fetch-boundary": "node --require ./scripts/register-typescript.cjs ./scripts/validate-limited-live-fetch-mock-fetch-boundary.ts"'), pass: "package.json has the mock fetch boundary script.", fail: "package.json must add the mock fetch boundary script." },
  ]);

  pushCheck("16_provider_runtime_unchanged", [
    { ok: providerStripped.includes("export async function getTwseTpexLimitedLiveFetchCandidate"), pass: "Provider entry function unchanged (still exported).", fail: "Provider entry function must remain unchanged." },
    { ok: providerStripped.includes("buildTwseTpexScaffoldCandidate"), pass: "Provider retains scaffold fallback.", fail: "Provider must retain scaffold fallback." },
  ]);
}

// ---------------------------------------------------------------------------
// Async boundary cases (offline, mocked fetch)
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  // 1) Success case — approved channel GET, golden candidate.
  installMock((url) => {
    if (!urlIsApprovedOnly(url)) realNetworkUsed = true;
    return okResponse(SUCCESS_BODY);
  });
  const success = (await getTwseTpexLimitedLiveFetchCandidate("3019", { now: fixedNow })) as unknown as Record<string, unknown>;
  const successCalls = [...fetchCalls];

  pushCheck("01_success_request_boundary", [
    { ok: successCalls.length === 1, pass: `fetch called exactly once (${successCalls.length}).`, fail: `fetch must be called exactly once (got ${successCalls.length}).` },
    { ok: successCalls.length === 1 && successCalls[0].url.includes("ex_ch=tse_3019.tw"), pass: "Request targets approved channel tse_3019.tw.", fail: "Request must target approved channel tse_3019.tw." },
    { ok: successCalls.length === 1 && urlIsApprovedOnly(successCalls[0].url), pass: "Request URL has no Yahoo / Supabase / broker / /api/portfolio.", fail: "Request URL must not contain Yahoo / Supabase / broker / /api/portfolio." },
    { ok: successCalls.length === 1 && successCalls[0].method === "GET", pass: "Request method is GET.", fail: "Request method must be GET." },
  ]);

  pushCheck("02_success_candidate", [
    { ok: success.symbol === "3019", pass: "success.symbol === 3019.", fail: `success.symbol must be 3019 (got ${JSON.stringify(success.symbol)}).` },
    { ok: success.price === 142.5, pass: "success.price === 142.5.", fail: `success.price must be 142.5 (got ${JSON.stringify(success.price)}).` },
    { ok: success.sourceTimestamp === EXPECTED_SOURCE_TS, pass: `success.sourceTimestamp === ${EXPECTED_SOURCE_TS}.`, fail: `success.sourceTimestamp must be ${EXPECTED_SOURCE_TS} (got ${JSON.stringify(success.sourceTimestamp)}).` },
    { ok: success.receivedAt === FIXED_NOW_ISO, pass: `success.receivedAt === ${FIXED_NOW_ISO}.`, fail: `success.receivedAt must be ${FIXED_NOW_ISO} (got ${JSON.stringify(success.receivedAt)}).` },
    { ok: success.verificationStatus === "LIVE_FETCH_DRY_RUN", pass: "success.verificationStatus === LIVE_FETCH_DRY_RUN.", fail: "success.verificationStatus must be LIVE_FETCH_DRY_RUN." },
    { ok: success.isRealData === true, pass: "success.isRealData === true.", fail: "success.isRealData must be true." },
    { ok: success.isConnected === true, pass: "success.isConnected === true.", fail: "success.isConnected must be true." },
    { ok: success.isDisabled === false, pass: "success.isDisabled === false.", fail: "success.isDisabled must be false." },
    { ok: success.operationalUseAllowed === false, pass: "success.operationalUseAllowed === false.", fail: "success.operationalUseAllowed must be false." },
    { ok: success.buySellCommandGenerated === false, pass: "success.buySellCommandGenerated === false.", fail: "success.buySellCommandGenerated must be false." },
    { ok: success.autoOrderRequested === false, pass: "success.autoOrderRequested === false.", fail: "success.autoOrderRequested must be false." },
  ]);

  // 2) Unsupported symbol — must NOT fetch, safe non-operational fallback.
  installMock((url) => {
    if (!urlIsApprovedOnly(url)) realNetworkUsed = true;
    return okResponse(SUCCESS_BODY);
  });
  const unsupported = (await getTwseTpexLimitedLiveFetchCandidate("9999", { now: fixedNow })) as unknown as Record<string, unknown>;
  pushCheck("03_unsupported_symbol_boundary", [
    { ok: fetchCalls.length === 0, pass: "Unsupported symbol does NOT trigger fetch.", fail: `Unsupported symbol must not fetch (got ${fetchCalls.length} call(s)).` },
    { ok: unsupported.isRealData === false && unsupported.isConnected === false && unsupported.isDisabled === true, pass: "Unsupported symbol → safe disabled candidate.", fail: "Unsupported symbol must return a safe disabled candidate." },
    { ok: unsupported.operationalUseAllowed === false && unsupported.buySellCommandGenerated === false && unsupported.autoOrderRequested === false, pass: "Unsupported symbol stays non-operational.", fail: "Unsupported symbol must stay non-operational." },
  ]);

  // 3) Fetch error — safe fallback.
  installMock(() => Promise.reject(new Error("mock network error")));
  const errored = (await getTwseTpexLimitedLiveFetchCandidate("3019", { now: fixedNow })) as unknown as Record<string, unknown>;
  pushCheck("04_fetch_error_boundary", [
    { ok: fetchCalls.length === 1, pass: "fetch attempted once before error fallback.", fail: `fetch must be attempted once (got ${fetchCalls.length}).` },
    { ok: errored.isRealData === false && errored.isConnected === false && errored.isDisabled === true, pass: "Fetch error → safe disabled candidate.", fail: "Fetch error must return a safe disabled candidate." },
    { ok: errored.receivedAt === FIXED_NOW_ISO, pass: "Fetch error fallback uses deterministic receivedAt.", fail: "Fetch error fallback must use deterministic receivedAt." },
    { ok: errored.operationalUseAllowed === false && errored.buySellCommandGenerated === false && errored.autoOrderRequested === false, pass: "Fetch error candidate non-operational.", fail: "Fetch error candidate must be non-operational." },
  ]);

  // 4) Malformed response (missing msgArray) — safe fallback.
  installMock(() => okResponse({ rtcode: "0000", garbage: true }));
  const malformed = (await getTwseTpexLimitedLiveFetchCandidate("3019", { now: fixedNow })) as unknown as Record<string, unknown>;
  pushCheck("05_malformed_response_boundary", [
    { ok: fetchCalls.length === 1, pass: "fetch called once for malformed-response case.", fail: `fetch must be called once (got ${fetchCalls.length}).` },
    { ok: malformed.isRealData === false && malformed.isConnected === false && malformed.isDisabled === true, pass: "Malformed response → safe disabled candidate.", fail: "Malformed response must return a safe disabled candidate." },
    { ok: malformed.operationalUseAllowed === false && malformed.buySellCommandGenerated === false && malformed.autoOrderRequested === false, pass: "Malformed response candidate non-operational.", fail: "Malformed response candidate must be non-operational." },
  ]);

  // 4b) Bad JSON (json() throws) — safe fallback.
  installMock(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error("bad json")) }));
  const badJson = (await getTwseTpexLimitedLiveFetchCandidate("3019", { now: fixedNow })) as unknown as Record<string, unknown>;
  pushCheck("06_bad_json_boundary", [
    { ok: badJson.isRealData === false && badJson.isDisabled === true, pass: "Bad JSON → safe disabled candidate.", fail: "Bad JSON must return a safe disabled candidate." },
    { ok: badJson.operationalUseAllowed === false && badJson.buySellCommandGenerated === false && badJson.autoOrderRequested === false, pass: "Bad JSON candidate non-operational.", fail: "Bad JSON candidate must be non-operational." },
  ]);

  // Restore fetch + assert no real network.
  restoreFetch();
  pushCheck("07_mock_restored_no_real_network", [
    { ok: realNetworkUsed === false, pass: "No real network request was made (mock only).", fail: "A non-approved (real) network URL was requested." },
    { ok: globalThis.fetch === originalFetch, pass: "globalThis.fetch restored to the original.", fail: "globalThis.fetch must be restored after the test." },
    { ok: typeof originalFetch === "function" || originalFetch === undefined, pass: "Original fetch captured for restore.", fail: "Original fetch must be captured." },
  ]);

  runStaticChecks();

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const overallStatus = combineStatus(checks.map((c) => c.status));
  const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

  const summary = {
    status: overallStatus,
    spec: "LIMITED_LIVE_FETCH_MOCK_FETCH_BOUNDARY",
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
