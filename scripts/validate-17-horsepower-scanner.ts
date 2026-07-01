/**
 * 17 Horsepower Technical Scanner Validator — static + pure-function check
 *
 * Verifies the fixture-only 17-horsepower scanner contract + spec doc: the contract is
 * deterministic, fixture-only, performs no network / Supabase / env / DB / API / broker /
 * order / production switch, outputs >= 3 sample stocks with valid 0–17 scores and the
 * required signal / candidate fields, and includes the 主升段 / 逢低候選 / 排除 samples.
 * Also confirms the doc carries the 扣三低 / 走多逢低 integration + Traditional Chinese UI
 * rule, this guard stays out of test:safety-chain (which stays 22), and the project
 * handoff summary remains present.
 *
 * Pure static read + in-process builder calls. NO network, NO smoke, NO Supabase, NO env
 * read, NO provider change. Standalone — NOT part of test:safety-chain.
 *
 * Exit 0 → PASS or WARNING
 * Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/war-room/build-17-horsepower-scanner-contract") as typeof import("../use-cases/war-room/build-17-horsepower-scanner-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { build17HorsepowerScannerContract } = contractModule;
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
// Paths + load
// ---------------------------------------------------------------------------

const DOC_REL = "docs/technical-scanner-17-horsepower.md";
const CONTRACT_REL = "use-cases/war-room/build-17-horsepower-scanner-contract.ts";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const doc = readFile(resolve(DOC_REL));
const contractRaw = readFile(resolve(CONTRACT_REL));
const contractStripped = contractRaw == null ? "" : stripComments(contractRaw);
const contractLower = contractStripped.toLowerCase();
const handoff = readFile(resolve(HANDOFF_REL));
const readme = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

// 1–2. Doc + contract exist.
pushCheck("01_doc_exists", [
  { ok: fileExists(resolve(DOC_REL)), pass: "17-horsepower doc exists.", fail: "17-horsepower doc must exist." },
]);
pushCheck("02_contract_exists", [
  { ok: fileExists(resolve(CONTRACT_REL)), pass: "17-horsepower contract exists.", fail: "17-horsepower contract must exist." },
]);

// 3. Deterministic — two builds produce identical output.
const a = build17HorsepowerScannerContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
const b = build17HorsepowerScannerContract({ generatedAt: "2026-06-23T00:00:00.000Z" });
pushCheck("03_deterministic", [
  { ok: JSON.stringify(a) === JSON.stringify(b), pass: "Contract is deterministic (identical repeat build).", fail: "Contract must be deterministic." },
]);

// 4–14. Fixture-only + red-line flags (in-process) + no dangerous source tokens.
const rec = a as unknown as Record<string, unknown>;
pushCheck("04_fixture_only", [
  { ok: a.mode === "SPEC_FIXTURE_ONLY_NO_NETWORK" && a.decision === "FIXTURE_ONLY_SPEC", pass: "Contract mode/decision are fixture-only.", fail: "Contract must be fixture-only." },
]);
const DANGEROUS = ["fetch(", "@supabase", "createclient", "process.env", "insert(", "upsert(", "delete(", ".update(", "/api/", "placeorder", "broker_api"];
function noToken(tok: string): boolean {
  return !contractLower.includes(tok);
}
pushCheck("05_no_real_network", [{ ok: rec.realNetworkUsed === false && rec.liveFetchPerformed === false, pass: "realNetworkUsed / liveFetchPerformed false.", fail: "realNetworkUsed / liveFetchPerformed must be false." }]);
pushCheck("06_no_fetch", [{ ok: noToken("fetch("), pass: "No fetch( in contract.", fail: "Contract must not contain fetch(." }]);
pushCheck("07_no_supabase", [{ ok: noToken("@supabase") && noToken("createclient") && rec.supabaseConnected === false, pass: "No Supabase / createClient.", fail: "Contract must not use Supabase." }]);
pushCheck("08_no_process_env", [{ ok: noToken("process.env") && rec.envReadPerformed === false, pass: "No process.env.", fail: "Contract must not read process.env." }]);
pushCheck("09_no_db_write", [{ ok: noToken("insert(") && noToken("upsert(") && noToken("delete(") && noToken(".update(") && rec.databaseWritePerformed === false, pass: "No DB write.", fail: "Contract must not write DB." }]);
pushCheck("10_no_api_route", [{ ok: noToken("/api/") && rec.apiRouteCreated === false && !fileExists(resolve("app/api/scanner/route.ts")), pass: "No API route.", fail: "Contract must not add an API route." }]);
pushCheck("11_no_broker_api", [{ ok: noToken("broker_api") && rec.brokerApiUsed === false, pass: "No broker API.", fail: "Contract must not use broker API." }]);
pushCheck("12_no_buysell_command", [{ ok: noToken("placeorder") && rec.buySellCommandGenerated === false && rec.isBuySignal === false && rec.isTradeCommand === false, pass: "No buy/sell command.", fail: "Contract must not generate buy/sell command." }]);
pushCheck("13_no_auto_order", [{ ok: rec.autoOrderRequested === false && rec.isAutoOrder === false, pass: "No auto order.", fail: "Contract must not auto order." }]);
pushCheck("14_no_production_switch", [{ ok: rec.productionDataSwitched === false && rec.productionTradingReady === false, pass: "No production data switch / not production trading ready.", fail: "Contract must not switch production data." }]);

// 15. >= 3 sample stocks.
pushCheck("15_min_three_samples", [
  { ok: a.stocks.length >= 3, pass: `Contract has ${a.stocks.length} sample stocks (>= 3).`, fail: `Contract must have >= 3 sample stocks (got ${a.stocks.length}).` },
]);

// 16. Each horsepowerScore is 0–17.
const scoresValid = a.stocks.every((s) => Number.isInteger(s.horsepowerScore) && s.horsepowerScore >= 0 && s.horsepowerScore <= 17);
pushCheck("16_scores_0_17", [
  { ok: scoresValid, pass: "Every horsepowerScore is an integer 0–17.", fail: "Every horsepowerScore must be an integer 0–17." },
]);

// 17–23. Required output fields present on every stock.
const REQUIRED_FIELDS = [
  "firstBullTurn", "strongBullConfirm", "pullbackSweetSpot", "deteriorationAlert",
  "unavailableLines", "reliabilityNote", "candidateTag",
];
const fieldConds = REQUIRED_FIELDS.map((f) => ({
  ok: a.stocks.every((s) => Object.prototype.hasOwnProperty.call(s, f)),
  pass: `Every stock has 「${f}」.`,
  fail: `Every stock must output 「${f}」.`,
}));
pushCheck("17_23_output_fields", fieldConds);

// 24–26. Includes 主升段 / 逢低候選 / 排除 samples.
const tags = new Set(a.stocks.map((s) => s.candidateTag));
pushCheck("24_26_candidate_samples", [
  { ok: tags.has("主升段"), pass: "Includes a 主升段 sample.", fail: "Must include a 主升段 sample." },
  { ok: tags.has("逢低候選"), pass: "Includes a 逢低候選 sample.", fail: "Must include a 逢低候選 sample." },
  { ok: tags.has("排除"), pass: "Includes a 排除 sample.", fail: "Must include a 排除 sample." },
]);

// Extra: unavailable handling is real (a sample with unavailableLines>0 carries a note).
const unavailSample = a.stocks.find((s) => s.unavailableLines > 0);
pushCheck("26b_unavailable_reliability_note", [
  { ok: unavailSample != null, pass: `A sample demonstrates unavailableLines (${unavailSample?.unavailableLines}).`, fail: "A sample must demonstrate unavailableLines > 0." },
  { ok: unavailSample == null || unavailSample.reliabilityNote.length > 0, pass: "unavailableLines>0 carries a reliabilityNote.", fail: "unavailableLines>0 must carry a reliabilityNote." },
  { ok: a.stocks.every((s) => (s.unavailableLines > 0) === (s.reliabilityNote.length > 0)), pass: "reliabilityNote present iff unavailableLines>0.", fail: "reliabilityNote must be present iff unavailableLines>0." },
]);

// 27–29. Doc integration + UI language rule.
function docHas(t: string): boolean {
  return doc != null && doc.includes(t);
}
pushCheck("27_doc_ko_san_di", [
  { ok: docHas("扣三低"), pass: "Doc includes 扣三低 integration.", fail: "Doc must include 扣三低 integration." },
]);
pushCheck("28_doc_zou_duo_pullback", [
  { ok: docHas("走多") && docHas("逢低候選"), pass: "Doc includes 走多 / 逢低候選.", fail: "Doc must include 走多 / 逢低候選." },
]);
pushCheck("29_doc_zh_ui_rule", [
  { ok: docHas("繁體中文"), pass: "Doc includes Traditional Chinese UI rule.", fail: "Doc must include the Traditional Chinese UI rule." },
]);

// 30–31. Standalone + safety-chain unchanged.
let safetyChain = "";
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}
let totalChecks = -1;
try {
  totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-06-23T00:00:00.000Z" }).result.totalChecks;
} catch {
  totalChecks = -1;
}
pushCheck("30_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:17-horsepower-scanner": "node --require ./scripts/register-typescript.cjs ./scripts/validate-17-horsepower-scanner.ts"'), pass: "package.json has test:17-horsepower-scanner.", fail: "package.json must add test:17-horsepower-scanner." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:17-horsepower-scanner"), pass: "17-horsepower guard NOT in test:safety-chain (standalone).", fail: "17-horsepower guard must NOT be in test:safety-chain." },
  { ok: !safetyChain.includes("smoke:limited-live-fetch:3019"), pass: "Smoke script NOT in test:safety-chain.", fail: "Smoke script must NOT be in test:safety-chain." },
]);
pushCheck("31_safety_chain_22", [
  { ok: totalChecks === 22, pass: `Safety chain CI guard remains 22 checks (got ${totalChecks}).`, fail: `Safety chain CI guard must remain 22 checks (got ${totalChecks}).` },
]);

// 32–33. Project handoff summary remains present + completion-report rule.
pushCheck("32_33_handoff_present", [
  { ok: fileExists(resolve(HANDOFF_REL)), pass: "project-handoff-summary.md remains present.", fail: "project-handoff-summary.md must remain present." },
  { ok: handoff != null && handoff.includes("Project Handoff Summary"), pass: "Handoff doc contains Project Handoff Summary.", fail: "Handoff doc must contain Project Handoff Summary." },
  { ok: readme != null && readme.includes("future completed version must include Project Handoff Summary"), pass: "README states every future completed version must include Project Handoff Summary.", fail: "README must state the per-version Project Handoff Summary rule." },
]);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const out = {
  status: overallStatus,
  spec: "SCANNER_17_HORSEPOWER",
  sample_count: a.stocks.length,
  scores: a.stocks.map((s) => ({ symbol: s.symbol, score: s.horsepowerScore, tag: s.candidateTag, unavailable: s.unavailableLines })),
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((c) => [c.name, c.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
};

console.log(JSON.stringify(out, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
