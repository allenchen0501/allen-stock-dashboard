/**
 * Limited Live Fetch 3019 Observation Round 1 Validator — static analysis only
 *
 * Confirms the observation doc + package script exist, the doc records the approved
 * shadow-only scope and safety interpretation, and that this PR did NOT modify the
 * provider runtime, add a second symbol / Yahoo / API route / Supabase / process.env,
 * or pull the manual smoke script into the safety chain.
 *
 * This validator makes NO network request, NO Supabase connection, NO env read, and
 * writes nothing. It does NOT require a fixed price (price changes between runs).
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

const DOC_REL = "docs/limited-live-fetch-3019-observation-round-1.md";
const PKG_REL = "package.json";
const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const SMOKE_SCRIPT = "smoke:limited-live-fetch:3019";

const docBody = readFile(resolve(DOC_REL));
const pkgBody = readFile(resolve(PKG_REL));
const providerRaw = readFile(resolve(PROVIDER_REL));
const providerStripped = providerRaw == null ? "" : stripComments(providerRaw);
const providerLower = providerStripped.toLowerCase();

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

function docHas(term: string): boolean {
  return docBody != null && docBody.includes(term);
}

// 1. observation doc exists.
pushCheck("01_doc_exists", [
  { ok: fileExists(resolve(DOC_REL)), pass: "Observation doc exists.", fail: "Observation doc must exist." },
]);

// 2. package script exists.
const PKG_SCRIPT = '"test:limited-live-fetch-3019-observation-round-1": "node --require ./scripts/register-typescript.cjs ./scripts/validate-limited-live-fetch-3019-observation-round-1.ts"';
pushCheck("02_package_script", [
  { ok: pkgBody != null && pkgBody.includes(PKG_SCRIPT), pass: "package.json has the observation validator script.", fail: "package.json must add the observation validator script." },
]);

// 3–22. Required doc phrases (price/timestamp NOT required — they vary per run).
const REQUIRED_DOC_PHRASES: Array<[string, string]> = [
  ["03", "Limited Live Fetch 3019 Observation Round 1"],
  ["04", "provider=TWSE_TPEX"],
  ["05", "symbol=3019"],
  ["06", "channel=tse_3019.tw"],
  ["07", "timeoutMs=3000"],
  ["08", "maxRetries=0"],
  ["09", "GET only"],
  ["10", "shadowOnly=true"],
  ["11", "defaultRealDataMode=fixture"],
  ["12", "operationalUseAllowed=false"],
  ["13", "productionReady=false"],
  ["14", "manual smoke only"],
  ["15", "not CI"],
  ["16", "not production data switch"],
  ["17", "quote must not feed trade plan"],
  ["18", "quote must not feed /api/portfolio"],
  ["19", "quote must not generate buy/sell command"],
  ["20", "buySellCommandGenerated=false"],
  ["21", "autoOrderRequested=false"],
  ["22", "fallback path remained available"],
];
for (const [id, phrase] of REQUIRED_DOC_PHRASES) {
  pushCheck(`${id}_doc_phrase`, [
    { ok: docHas(phrase), pass: `Doc contains "${phrase}".`, fail: `Doc must contain "${phrase}".` },
  ]);
}

// 23. No provider runtime files modified by this PR — the provider retains the approved
// shape (3019 / tse_3019.tw / timeout 3000 / maxRetries 0 / fallback / non-operational)
// and gains nothing new. (Static integrity scan; observation is docs-only.)
pushCheck("23_provider_runtime_unchanged", [
  { ok: providerStripped.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"'), pass: "Provider still pins approved symbol 3019.", fail: "Provider must still pin approved symbol 3019." },
  { ok: providerStripped.includes("tse_3019.tw"), pass: "Provider still pins channel tse_3019.tw.", fail: "Provider must still pin channel tse_3019.tw." },
  { ok: providerStripped.includes("LIMITED_LIVE_FETCH_TIMEOUT_MS = 3000"), pass: "Provider still uses timeout 3000ms.", fail: "Provider must still use timeout 3000ms." },
  { ok: providerStripped.includes("LIMITED_LIVE_FETCH_MAX_RETRIES = 0"), pass: "Provider still uses maxRetries 0.", fail: "Provider must still use maxRetries 0." },
  { ok: providerStripped.includes("buildTwseTpexScaffoldCandidate"), pass: "Provider retains fallback scaffold candidate.", fail: "Provider must retain fallback scaffold candidate." },
  { ok: providerStripped.includes("operationalUseAllowed: false"), pass: "Provider keeps operationalUseAllowed: false.", fail: "Provider must keep operationalUseAllowed: false." },
]);

// 24. Smoke script not in test:safety-chain.
let safetyChain = "";
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}
pushCheck("24_smoke_not_in_safety_chain", [
  { ok: safetyChain.length > 0, pass: "test:safety-chain script present.", fail: "test:safety-chain script must exist." },
  { ok: !safetyChain.includes(SMOKE_SCRIPT), pass: `test:safety-chain does NOT include ${SMOKE_SCRIPT}.`, fail: `test:safety-chain must NOT include ${SMOKE_SCRIPT}.` },
]);

// 25. No new symbol beyond 3019 (provider must not reference the future-candidate codes).
const FORBIDDEN_SYMBOLS = ["4966", "5347", "4979", "2455", "2743"];
const symbolHits = FORBIDDEN_SYMBOLS.filter((s) => providerStripped.includes(s));
pushCheck("25_no_new_symbol", [
  { ok: symbolHits.length === 0, pass: "Provider references no symbol beyond 3019.", fail: `Provider references additional symbol(s): ${symbolHits.join(", ")}.` },
]);

// 26. No Yahoo added in the approved provider.
pushCheck("26_no_yahoo", [
  { ok: !providerLower.includes("yahoo"), pass: "Provider adds no Yahoo reference.", fail: "Provider must not add a Yahoo reference." },
]);

// 27. No new API route.
const FORBIDDEN_ARTIFACTS = [
  "app/api/market-data/route.ts",
  "app/api/portfolio/live-fetch/route.ts",
  "app/api/live-fetch/route.ts",
  "app/api/observation/route.ts",
];
const existingArtifacts = FORBIDDEN_ARTIFACTS.filter((rel) => fileExists(resolve(rel)));
pushCheck("27_no_api_route", [
  { ok: existingArtifacts.length === 0, pass: "No new observation/live-fetch API route exists.", fail: `Forbidden API route(s) exist: ${existingArtifacts.join(", ")}.` },
]);

// 28. No Supabase in the approved provider.
pushCheck("28_no_supabase", [
  { ok: !providerLower.includes("@supabase") && !providerLower.includes("createclient"), pass: "Provider has no Supabase / createClient.", fail: "Provider must not add Supabase / createClient." },
]);

// 29. No process.env in the approved provider.
pushCheck("29_no_process_env", [
  { ok: !providerLower.includes("process.env"), pass: "Provider has no process.env.", fail: "Provider must not add process.env." },
]);

// 30. No PRODUCTION_READY in the approved provider or the observation doc.
pushCheck("30_no_production_ready", [
  { ok: providerRaw != null && !providerRaw.includes("PRODUCTION_READY"), pass: "Provider has no PRODUCTION_READY token.", fail: "Provider must not contain PRODUCTION_READY." },
  { ok: docBody != null && !docBody.includes("PRODUCTION_READY"), pass: "Doc has no PRODUCTION_READY token.", fail: "Doc must not contain PRODUCTION_READY." },
]);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const summary = {
  status: overallStatus,
  spec: "LIMITED_LIVE_FETCH_3019_OBSERVATION_ROUND_1",
  doc: DOC_REL,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  price_required: false,
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
