/**
 * Limited Live Fetch Golden Snapshot Validator — OFFLINE, deterministic
 *
 * Drives the already-exported PURE parser (`parseLimitedLiveFetchResponse`) with a fixed
 * deterministic clock and a fixed TWSE-like mock response. It NEVER performs a live fetch
 * (never calls `getTwseTpexLimitedLiveFetchCandidate`) and never runs the smoke script.
 * It asserts a golden success candidate snapshot AND a golden fallback candidate snapshot,
 * then re-asserts the approved safety boundary and that smoke / this validator are NOT in
 * the safety chain (which stays 18 checks).
 *
 * No network request, no Supabase, no env read, no DB write. Pure functions only.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const providerModule = require("../services/market-data/twse-tpex-verification-provider") as typeof import("../services/market-data/twse-tpex-verification-provider");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { parseLimitedLiveFetchResponse } = providerModule;
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

// tlong is epoch ms. 2026-06-30 14:30:00 Taipei (UTC+8) === 2026-06-30T06:30:00.000Z.
const TLONG_MS = Date.UTC(2026, 5, 30, 6, 30, 0);
const EXPECTED_SOURCE_TS = new Date(TLONG_MS).toISOString(); // 2026-06-30T06:30:00.000Z

// Fixed TWSE-like mock response (success). Parser reads the allowlist fields only;
// ch / n / d / t are present for realism but ignored by the allowlist.
const SUCCESS_MOCK = {
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

// Fallback mock: wrong symbol → parser must fall back to the disabled scaffold candidate.
const FALLBACK_MOCK = {
  msgArray: [
    {
      ch: "tse_3019.tw",
      c: "9999",
      n: "WRONG",
      z: "1.0",
      tlong: String(TLONG_MS),
    },
  ],
  rtcode: "0000",
};

// ---------------------------------------------------------------------------
// Snapshot assertions (OFFLINE — pure parser, deterministic clock)
// ---------------------------------------------------------------------------

const success = parseLimitedLiveFetchResponse("3019", SUCCESS_MOCK, fixedNow);
const sRec = success as unknown as Record<string, unknown>;

function eq(label: string, actual: unknown, expected: unknown): { ok: boolean; pass: string; fail: string } {
  return {
    ok: actual === expected,
    pass: `${label} === ${JSON.stringify(expected)}.`,
    fail: `${label} === ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`,
  };
}

// Success candidate golden snapshot.
pushCheck("01_success_snapshot", [
  eq("success.symbol", sRec.symbol, "3019"),
  eq("success.providerId", sRec.providerId, "mixed-public"),
  { ok: typeof sRec.providerName === "string" && (sRec.providerName as string).includes("TWSE / TPEx"), pass: "success.providerName includes TWSE / TPEx.", fail: `success.providerName must include "TWSE / TPEx" (got ${JSON.stringify(sRec.providerName)}).` },
  eq("success.price", sRec.price, 142.5),
  eq("success.open", sRec.open, 140.5),
  eq("success.high", sRec.high, 142.5),
  eq("success.low", sRec.low, 139.5),
  eq("success.previousClose", sRec.previousClose, 138),
  eq("success.volume", sRec.volume, 3010),
  eq("success.sourceTimestamp", sRec.sourceTimestamp, EXPECTED_SOURCE_TS),
  eq("success.receivedAt", sRec.receivedAt, FIXED_NOW_ISO),
  eq("success.isRealData", sRec.isRealData, true),
  eq("success.isConnected", sRec.isConnected, true),
  eq("success.isDisabled", sRec.isDisabled, false),
  eq("success.verificationStatus", sRec.verificationStatus, "LIVE_FETCH_DRY_RUN"),
  eq("success.operationalUseAllowed", sRec.operationalUseAllowed, false),
  eq("success.buySellCommandGenerated", sRec.buySellCommandGenerated, false),
  eq("success.autoOrderRequested", sRec.autoOrderRequested, false),
]);

// Fallback candidate golden snapshot (wrong symbol → disabled scaffold).
const fallback = parseLimitedLiveFetchResponse("3019", FALLBACK_MOCK, fixedNow);
const fRec = fallback as unknown as Record<string, unknown>;
pushCheck("02_fallback_snapshot", [
  eq("fallback.symbol", fRec.symbol, "3019"),
  eq("fallback.isRealData", fRec.isRealData, false),
  eq("fallback.isConnected", fRec.isConnected, false),
  eq("fallback.isDisabled", fRec.isDisabled, true),
  eq("fallback.receivedAt", fRec.receivedAt, FIXED_NOW_ISO),
  eq("fallback.verificationStatus", fRec.verificationStatus, "SCAFFOLD_ONLY"),
  eq("fallback.operationalUseAllowed", fRec.operationalUseAllowed, false),
  eq("fallback.buySellCommandGenerated", fRec.buySellCommandGenerated, false),
  eq("fallback.autoOrderRequested", fRec.autoOrderRequested, false),
]);

// Determinism: re-run the parser; identical JSON proves snapshot stability.
const successAgain = parseLimitedLiveFetchResponse("3019", SUCCESS_MOCK, fixedNow);
pushCheck("03_deterministic_repeat", [
  { ok: JSON.stringify(successAgain) === JSON.stringify(success), pass: "Repeated parse yields an identical candidate (deterministic).", fail: "Repeated parse must yield an identical candidate." },
]);

// ---------------------------------------------------------------------------
// Offline fallback matrix (malformed / missing / wrong-field responses)
// Pure parser only; fixed clock; never touches the network.
// ---------------------------------------------------------------------------

const VALID_TLONG = String(TLONG_MS);

interface MatrixCase {
  name: string;
  input: unknown;
}

// Cases that MUST fall back to the disabled scaffold candidate (required field
// corrupted / wrong instrument / structurally malformed response).
const FALLBACK_MATRIX: MatrixCase[] = [
  { name: "empty_msgArray", input: { msgArray: [], rtcode: "0000" } },
  { name: "missing_msgArray", input: { rtcode: "0000" } },
  { name: "wrong_symbol_c_9999", input: { msgArray: [{ ch: "tse_3019.tw", c: "9999", z: "142.5", tlong: VALID_TLONG }] } },
  // A wrong channel echoes a non-3019 instrument code; the parser's symbol guard rejects it.
  { name: "wrong_channel_tse_9999", input: { msgArray: [{ ch: "tse_9999.tw", c: "9999", z: "142.5", tlong: VALID_TLONG }] } },
  { name: "missing_price_z", input: { msgArray: [{ ch: "tse_3019.tw", c: "3019", o: "140.5", tlong: VALID_TLONG }] } },
  { name: "invalid_price_dash", input: { msgArray: [{ ch: "tse_3019.tw", c: "3019", z: "-", tlong: VALID_TLONG }] } },
  { name: "non_numeric_price_abc", input: { msgArray: [{ ch: "tse_3019.tw", c: "3019", z: "abc", tlong: VALID_TLONG }] } },
  { name: "missing_tlong", input: { msgArray: [{ ch: "tse_3019.tw", c: "3019", z: "142.5" }] } },
  { name: "invalid_tlong_abc", input: { msgArray: [{ ch: "tse_3019.tw", c: "3019", z: "142.5", tlong: "abc" }] } },
  { name: "malformed_root_null", input: null },
  { name: "malformed_root_array", input: [1, 2, 3] },
  { name: "malformed_entry_not_object", input: { msgArray: ["not-an-object"] } },
];

let fallbackAllSafe = true;
for (const c of FALLBACK_MATRIX) {
  const cand = parseLimitedLiveFetchResponse("3019", c.input, fixedNow) as unknown as Record<string, unknown>;
  const safe =
    cand.symbol === "3019" &&
    cand.isRealData === false &&
    cand.isConnected === false &&
    cand.isDisabled === true &&
    cand.verificationStatus === "SCAFFOLD_ONLY" &&
    cand.operationalUseAllowed === false &&
    cand.buySellCommandGenerated === false &&
    cand.autoOrderRequested === false &&
    cand.receivedAt === FIXED_NOW_ISO;
  if (!safe) fallbackAllSafe = false;
  pushCheck(`matrix_${c.name}`, [
    { ok: safe, pass: `Fallback case "${c.name}" → safe disabled scaffold candidate (deterministic receivedAt).`, fail: `Fallback case "${c.name}" did NOT return a safe disabled scaffold candidate: ${JSON.stringify(cand)}.` },
  ]);
}

pushCheck("matrix_case_count", [
  { ok: FALLBACK_MATRIX.length >= 10, pass: `Fallback matrix has ${FALLBACK_MATRIX.length} cases (>= 10).`, fail: `Fallback matrix must have >= 10 cases (got ${FALLBACK_MATRIX.length}).` },
  { ok: fallbackAllSafe, pass: "Every fallback matrix case returned a safe disabled scaffold candidate.", fail: "Every fallback matrix case must return a safe disabled scaffold candidate." },
]);

// Optional-field cases: `volume` is OPTIONAL in the parser (volume=null is allowed by
// design and is NOT a hard fallback). These must still never produce an operational
// quote — volume corruption stays non-operational with a deterministic receivedAt.
const OPTIONAL_SAFE_MATRIX: MatrixCase[] = [
  { name: "missing_volume", input: { msgArray: [{ ch: "tse_3019.tw", c: "3019", z: "142.5", o: "140.5", h: "142.5", l: "139.5", y: "138", tlong: VALID_TLONG }] } },
  { name: "non_numeric_volume", input: { msgArray: [{ ch: "tse_3019.tw", c: "3019", z: "142.5", o: "140.5", h: "142.5", l: "139.5", y: "138", v: "abc", tlong: VALID_TLONG }] } },
];
for (const c of OPTIONAL_SAFE_MATRIX) {
  const cand = parseLimitedLiveFetchResponse("3019", c.input, fixedNow) as unknown as Record<string, unknown>;
  const safe =
    cand.volume === null &&
    cand.operationalUseAllowed === false &&
    cand.buySellCommandGenerated === false &&
    cand.autoOrderRequested === false &&
    cand.receivedAt === FIXED_NOW_ISO;
  pushCheck(`optional_${c.name}`, [
    { ok: safe, pass: `Optional-field case "${c.name}" → volume=null, non-operational, deterministic receivedAt.`, fail: `Optional-field case "${c.name}" must stay non-operational with volume=null: ${JSON.stringify(cand)}.` },
  ]);
}

// ---------------------------------------------------------------------------
// Safety boundary (static provider scan + guard + package composition)
// ---------------------------------------------------------------------------

const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const PKG_REL = "package.json";
const DOC_REL = "docs/limited-live-fetch-golden-snapshot.md";

const providerRaw = readFile(resolve(PROVIDER_REL));
const providerStripped = providerRaw == null ? "" : stripComments(providerRaw);
const providerLower = providerStripped.toLowerCase();
const pkgBody = readFile(resolve(PKG_REL));

pushCheck("04_provider_scope", [
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"'), pass: "Provider still restricts symbol to 3019.", fail: "Provider must still restrict symbol to 3019." },
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw"'), pass: "Provider still pins channel tse_3019.tw.", fail: "Provider must still pin channel tse_3019.tw." },
  { ok: providerStripped.includes("LIMITED_LIVE_FETCH_TIMEOUT_MS = 3000"), pass: "timeoutMs remains 3000.", fail: "timeoutMs must remain 3000." },
  { ok: providerStripped.includes("LIMITED_LIVE_FETCH_MAX_RETRIES = 0"), pass: "maxRetries remains 0.", fail: "maxRetries must remain 0." },
  { ok: providerLower.includes('method: "get"'), pass: "GET only remains.", fail: "GET only must remain." },
]);

const FORBIDDEN_SYMBOLS = ["4966", "5347", "4979", "2455", "2743"];
pushCheck("05_no_scope_expansion", [
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
  "app/api/golden-snapshot/route.ts",
];
pushCheck("06_no_api_route", [
  { ok: FORBIDDEN_ARTIFACTS.every((rel) => !fileExists(resolve(rel))), pass: "No new API route exists.", fail: "No new API route may be added." },
]);

let safetyChain = "";
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}
pushCheck("07_smoke_and_golden_not_in_chain", [
  { ok: safetyChain.length > 0, pass: "test:safety-chain present.", fail: "test:safety-chain must exist." },
  { ok: !safetyChain.includes("smoke:limited-live-fetch:3019"), pass: "Smoke script NOT in safety chain.", fail: "Smoke script must NOT be in safety chain." },
  { ok: !safetyChain.includes("test:limited-live-fetch-golden-snapshot"), pass: "Golden validator NOT in safety chain.", fail: "Golden validator must NOT be in safety chain." },
]);

let totalChecks = -1;
try {
  totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" }).result.totalChecks;
} catch {
  totalChecks = -1;
}
pushCheck("08_safety_chain_18", [
  { ok: totalChecks === 18, pass: `Safety chain CI guard remains 18 checks (got ${totalChecks}).`, fail: `Safety chain CI guard must remain 18 checks (got ${totalChecks}).` },
]);

pushCheck("09_doc_exists", [
  { ok: fileExists(resolve(DOC_REL)), pass: "Golden snapshot doc exists.", fail: "Golden snapshot doc must exist." },
  { ok: pkgBody != null && pkgBody.includes('"test:limited-live-fetch-golden-snapshot": "node --require ./scripts/register-typescript.cjs ./scripts/validate-limited-live-fetch-golden-snapshot.ts"'), pass: "package.json has the golden snapshot script.", fail: "package.json must add the golden snapshot script." },
]);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const summary = {
  status: overallStatus,
  spec: "LIMITED_LIVE_FETCH_GOLDEN_SNAPSHOT",
  fixed_now: FIXED_NOW_ISO,
  live_fetch_performed: false,
  smoke_invoked: false,
  fallback_matrix_case_count: FALLBACK_MATRIX.length,
  optional_field_case_count: OPTIONAL_SAFE_MATRIX.length,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  safety_chain_total_checks: totalChecks,
  success_candidate: success,
  fallback_candidate: fallback,
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
