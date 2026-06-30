/**
 * Limited Live Fetch — Offline Timeout / Abort Boundary Validator
 *
 * Mocks globalThis.fetch (NEVER touches the real network) and proves the limited live
 * fetch entry function falls back safely when the request times out / aborts. To stay
 * deterministic and fast, the provider's 3000ms abort `setTimeout` is faked to fire on a
 * microtask (so the AbortController actually aborts WITHOUT waiting), and a signal-aware
 * mock fetch rejects with an AbortError when aborted. A second case rejects immediately
 * with an AbortError. Both must yield a safe, non-operational scaffold candidate.
 *
 * The fetch + setTimeout patches are restored afterward. No manual smoke, no provider
 * runtime change. Standalone — NOT part of test:safety-chain (which remains 21 checks).
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const providerModule = require("../services/market-data/twse-tpex-verification-provider") as typeof import("../services/market-data/twse-tpex-verification-provider");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { getTwseTpexLimitedLiveFetchCandidate, LIMITED_LIVE_FETCH_TIMEOUT_MS } = providerModule;
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
// Fixed inputs + abort helpers
// ---------------------------------------------------------------------------

const FIXED_NOW_ISO = "2026-06-30T00:00:00.000Z";
const fixedNow = (): Date => new Date(FIXED_NOW_ISO);

function abortError(): Error {
  const e = new Error("The operation was aborted.");
  e.name = "AbortError";
  return e;
}

// ---------------------------------------------------------------------------
// Patch harness (fetch + the provider's 3000ms abort setTimeout)
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;

interface FetchCall {
  url: string;
  method: string;
}
let fetchCalls: FetchCall[] = [];
let realNetworkUsed = false;

/** Fire the provider's 3000ms abort timer on a microtask (no real wait). */
function installFakeAbortTimer(): void {
  (globalThis as { setTimeout: unknown }).setTimeout = ((fn: (...a: unknown[]) => void, ms?: number, ...rest: unknown[]) => {
    const id = (originalSetTimeout as (f: (...a: unknown[]) => void, m?: number, ...r: unknown[]) => unknown)(fn, ms, ...rest);
    if (ms === LIMITED_LIVE_FETCH_TIMEOUT_MS) {
      // Fire the abort callback immediately (deterministic timeout), but keep the real
      // timer id so the provider's clearTimeout(timer) in finally still works.
      queueMicrotask(() => {
        try {
          fn();
        } catch {
          /* abort is idempotent */
        }
      });
    }
    return id;
  });
}

/** Mock fetch that hangs until the AbortController signal aborts, then rejects. */
function installAbortAwareFetch(): void {
  fetchCalls = [];
  (globalThis as { fetch: unknown }).fetch = (input: unknown, init?: { method?: string; signal?: AbortSignal }) => {
    const url = typeof input === "string" ? input : String((input as { url?: string })?.url ?? input);
    fetchCalls.push({ url, method: (init?.method ?? "GET").toUpperCase() });
    if (!url.toLowerCase().includes("tse_3019.tw")) realNetworkUsed = true;
    return new Promise((_resolve, reject) => {
      const signal = init?.signal;
      if (signal) {
        if (signal.aborted) {
          reject(abortError());
          return;
        }
        signal.addEventListener("abort", () => reject(abortError()), { once: true });
      }
      // Otherwise never resolves — the simulated hang; the abort will reject it.
    });
  };
}

/** Mock fetch that rejects immediately with an AbortError (no timer needed). */
function installImmediateAbortFetch(): void {
  fetchCalls = [];
  (globalThis as { fetch: unknown }).fetch = (input: unknown, init?: { method?: string }) => {
    const url = typeof input === "string" ? input : String((input as { url?: string })?.url ?? input);
    fetchCalls.push({ url, method: (init?.method ?? "GET").toUpperCase() });
    if (!url.toLowerCase().includes("tse_3019.tw")) realNetworkUsed = true;
    return Promise.reject(abortError());
  };
}

function restoreAll(): void {
  (globalThis as { fetch: unknown }).fetch = originalFetch;
  (globalThis as { setTimeout: unknown }).setTimeout = originalSetTimeout;
}

function isSafeFallback(c: Record<string, unknown>): boolean {
  return (
    c.symbol === "3019" &&
    c.isRealData === false &&
    c.isConnected === false &&
    c.isDisabled === true &&
    c.operationalUseAllowed === false &&
    c.buySellCommandGenerated === false &&
    c.autoOrderRequested === false &&
    c.receivedAt === FIXED_NOW_ISO
  );
}

// ---------------------------------------------------------------------------
// Static safety boundary (provider scan + package composition)
// ---------------------------------------------------------------------------

const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const PKG_REL = "package.json";
const DOC_REL = "docs/limited-live-fetch-timeout-boundary.md";

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
    { ok: providerLower.includes("abortcontroller"), pass: "Provider uses AbortController for timeout.", fail: "Provider must use AbortController for the timeout." },
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
    "app/api/timeout/route.ts",
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
    { ok: safetyChain.includes("test:limited-live-fetch-default-no-fetch-boundary"), pass: "Default no-fetch boundary validator IS in safety chain.", fail: "Default no-fetch boundary validator must remain in safety chain." },
    { ok: !safetyChain.includes("test:limited-live-fetch-safety-chain-inventory"), pass: "Inventory validator NOT in safety chain.", fail: "Inventory validator must NOT be in safety chain." },
    // This validator is now part of the safety chain (Timeout Boundary Safety Chain Integration).
    { ok: safetyChain.includes("test:limited-live-fetch-timeout-boundary"), pass: "Timeout validator IS in safety chain.", fail: "Timeout validator must be in safety chain." },
  ]);

  let totalChecks = -1;
  try {
    totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" }).result.totalChecks;
  } catch {
    totalChecks = -1;
  }
  pushCheck("14_safety_chain_22", [
    { ok: totalChecks === 22, pass: `Safety chain CI guard has 22 checks (got ${totalChecks}).`, fail: `Safety chain CI guard must have 22 checks (got ${totalChecks}).` },
  ]);

  pushCheck("15_doc_and_script", [
    { ok: fileExists(resolve(DOC_REL)), pass: "Timeout boundary doc exists.", fail: "Timeout boundary doc must exist." },
    { ok: pkgBody != null && pkgBody.includes('"test:limited-live-fetch-timeout-boundary": "node --require ./scripts/register-typescript.cjs ./scripts/validate-limited-live-fetch-timeout-boundary.ts"'), pass: "package.json has the timeout boundary script.", fail: "package.json must add the timeout boundary script." },
  ]);

  pushCheck("16_provider_runtime_unchanged", [
    { ok: providerStripped.includes("export async function getTwseTpexLimitedLiveFetchCandidate"), pass: "Provider entry function unchanged (still exported).", fail: "Provider entry function must remain unchanged." },
    { ok: providerStripped.includes("buildTwseTpexScaffoldCandidate"), pass: "Provider retains scaffold fallback.", fail: "Provider must retain scaffold fallback." },
  ]);
}

// ---------------------------------------------------------------------------
// Async timeout cases (offline, mocked fetch + faked abort timer)
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  // 1) Real abort path: faked 3000ms timer fires → AbortController aborts → fetch rejects.
  installFakeAbortTimer();
  installAbortAwareFetch();
  const aborted = (await getTwseTpexLimitedLiveFetchCandidate("3019", { dryRunLiveFetch: true, now: fixedNow })) as unknown as Record<string, unknown>;
  const abortedCalls = [...fetchCalls];
  pushCheck("01_timeout_abort_safe_fallback", [
    { ok: abortedCalls.length === 1, pass: `fetch attempted once before abort (${abortedCalls.length}).`, fail: `fetch must be attempted once (got ${abortedCalls.length}).` },
    { ok: abortedCalls.length === 1 && abortedCalls[0].url.includes("ex_ch=tse_3019.tw"), pass: "Request targeted approved channel tse_3019.tw.", fail: "Request must target approved channel tse_3019.tw." },
    { ok: abortedCalls.length === 1 && abortedCalls[0].method === "GET", pass: "Request method is GET.", fail: "Request method must be GET." },
    { ok: isSafeFallback(aborted), pass: "Timeout/abort → safe disabled non-operational candidate (deterministic receivedAt).", fail: `Timeout/abort must return a safe fallback: ${JSON.stringify(aborted)}.` },
  ]);

  // 2) Immediate AbortError reject (defensive: catch path).
  installImmediateAbortFetch();
  const immediate = (await getTwseTpexLimitedLiveFetchCandidate("3019", { dryRunLiveFetch: true, now: fixedNow })) as unknown as Record<string, unknown>;
  pushCheck("02_immediate_abort_safe_fallback", [
    { ok: fetchCalls.length === 1, pass: "fetch attempted once before immediate AbortError.", fail: `fetch must be attempted once (got ${fetchCalls.length}).` },
    { ok: isSafeFallback(immediate), pass: "Immediate AbortError → safe disabled non-operational candidate.", fail: `Immediate AbortError must return a safe fallback: ${JSON.stringify(immediate)}.` },
  ]);

  // Restore + assert no real network and patches restored.
  restoreAll();
  pushCheck("03_restore_no_real_network", [
    { ok: realNetworkUsed === false, pass: "No real network request was made (mock only).", fail: "A non-approved (real) network URL was requested." },
    { ok: globalThis.fetch === originalFetch, pass: "globalThis.fetch restored to the original.", fail: "globalThis.fetch must be restored after the test." },
    { ok: globalThis.setTimeout === originalSetTimeout, pass: "globalThis.setTimeout restored to the original.", fail: "globalThis.setTimeout must be restored after the test." },
  ]);

  runStaticChecks();

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const overallStatus = combineStatus(checks.map((c) => c.status));
  const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

  const summary = {
    status: overallStatus,
    spec: "LIMITED_LIVE_FETCH_TIMEOUT_BOUNDARY",
    fixed_now: FIXED_NOW_ISO,
    real_network_used: realNetworkUsed,
    fetch_restored: globalThis.fetch === originalFetch,
    set_timeout_restored: globalThis.setTimeout === originalSetTimeout,
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
  restoreAll();
  console.log(JSON.stringify({ status: "FAIL", error: String(err) }, null, 2));
  process.exit(1);
});
