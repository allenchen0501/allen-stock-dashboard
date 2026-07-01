/**
 * Watchlist Universe Tier Validator - static + pure-function check.
 *
 * Verifies the fixture-only watchlist universe tier spec, contract, live-fetch boundary,
 * standalone validator placement, safety-chain count, and project handoff rule.
 *
 * Pure static read + in-process builder calls. NO network, NO smoke, NO Supabase,
 * NO env key read, NO provider runtime change. Standalone - NOT part of test:safety-chain.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/war-room/build-watchlist-universe-tier-contract") as typeof import("../use-cases/war-room/build-watchlist-universe-tier-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildWatchlistUniverseTierContract } = contractModule;
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

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
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

const DOC_REL = "docs/watchlist-universe-tier.md";
const CONTRACT_REL = "use-cases/war-room/build-watchlist-universe-tier-contract.ts";
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

const contractA = buildWatchlistUniverseTierContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const contractB = buildWatchlistUniverseTierContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const allStocks = [...contractA.coreUniverse, ...contractA.extendedUniverse];
const non3019 = allStocks.filter((s) => s.symbol !== "3019");

const CORE_SYMBOLS = ["3019", "4966", "5347", "4979", "2455"];
const EXTENDED_SYMBOLS = ["3450", "3163", "6442", "3363", "2383", "2368", "3491", "2313", "2344", "6239", "8299", "3105"];
const CJK = /[\u4e00-\u9fff]/;

function docHas(term: string): boolean {
  return doc != null && doc.includes(term);
}

function noContractToken(token: string): boolean {
  return !contractLower.includes(token);
}

pushCheck("01_doc_exists", [
  { ok: fileExists(resolve(DOC_REL)), pass: "watchlist universe tier doc exists.", fail: "docs/watchlist-universe-tier.md must exist." },
]);

pushCheck("02_contract_exists", [
  { ok: fileExists(resolve(CONTRACT_REL)), pass: "watchlist universe tier contract exists.", fail: "contract file must exist." },
]);

pushCheck("03_deterministic", [
  { ok: JSON.stringify(contractA) === JSON.stringify(contractB), pass: "contract is deterministic.", fail: "contract must be deterministic." },
]);

pushCheck("04_fixture_only", [
  { ok: contractA.mode === "FIXTURE_ONLY_NO_NETWORK" && contractA.decision === "SPEC_ONLY_NOT_CONNECTED", pass: "contract mode is fixture-only.", fail: "contract must be fixture-only." },
]);

pushCheck("05_no_real_network", [
  { ok: contractA.realNetworkUsed === false && contractA.liveFetchPerformed === false, pass: "realNetworkUsed/liveFetchPerformed false.", fail: "contract must not perform real network or live fetch." },
]);

pushCheck("06_no_fetch", [
  { ok: noContractToken("fetch("), pass: "contract source has no request call.", fail: "contract source must not contain request call." },
]);

pushCheck("07_no_supabase", [
  { ok: noContractToken("@supabase") && noContractToken("createclient") && contractA.supabaseConnected === false, pass: "no Supabase usage.", fail: "contract must not use Supabase." },
]);

pushCheck("08_no_process_env", [
  { ok: noContractToken("process.env") && contractA.envReadPerformed === false, pass: "no env key read.", fail: "contract must not read env keys." },
]);

pushCheck("09_no_db_write", [
  { ok: noContractToken("insert(") && noContractToken("upsert(") && noContractToken("delete(") && noContractToken(".update(") && contractA.databaseWritePerformed === false, pass: "no DB write.", fail: "contract must not write DB." },
]);

pushCheck("10_no_api_route", [
  { ok: noContractToken("/api/") && contractA.apiRouteCreated === false, pass: "no API route.", fail: "contract must not create API route." },
]);

pushCheck("11_no_broker_api", [
  { ok: noContractToken("broker_api") && noContractToken("brokerapi(") && contractA.brokerApiUsed === false, pass: "no broker API.", fail: "contract must not use broker API." },
]);

pushCheck("12_no_buysell_command", [
  { ok: noContractToken("placeorder") && contractA.buySellCommandGenerated === false, pass: "no buy/sell command.", fail: "contract must not generate buy/sell command." },
]);

pushCheck("13_no_auto_order", [
  { ok: noContractToken("autoorder(") && contractA.autoOrderRequested === false, pass: "no auto order.", fail: "contract must not auto order." },
]);

pushCheck("14_no_production_switch", [
  { ok: contractA.productionDataSwitched === false && contractA.productionTradingReady === false && contractA.liveFetchBoundary.productionDataSwitchAllowed === false, pass: "no production data switch.", fail: "contract must not switch production data." },
]);

pushCheck("15_live_fetch_boundary_present", [
  { ok: contractA.liveFetchBoundary != null, pass: "liveFetchBoundary present.", fail: "contract must output liveFetchBoundary." },
]);

pushCheck("16_approved_symbols_exact", [
  { ok: arraysEqual(contractA.liveFetchBoundary.approvedLiveFetchSymbols, ["3019"]), pass: "approvedLiveFetchSymbols exactly [3019].", fail: "approvedLiveFetchSymbols must be exactly [3019]." },
]);

pushCheck("17_approved_channels_exact", [
  { ok: arraysEqual(contractA.liveFetchBoundary.approvedChannels, ["tse_3019.tw"]), pass: "approvedChannels exactly [tse_3019.tw].", fail: "approvedChannels must be exactly [tse_3019.tw]." },
]);

pushCheck("18_core_length_5", [
  { ok: contractA.coreUniverse.length === 5, pass: "coreUniverse length is exactly 5.", fail: `coreUniverse length must be 5, got ${contractA.coreUniverse.length}.` },
]);

pushCheck("19_extended_length_12", [
  { ok: contractA.extendedUniverse.length >= 12, pass: "extendedUniverse length is at least 12.", fail: `extendedUniverse length must be at least 12, got ${contractA.extendedUniverse.length}.` },
]);

pushCheck("20_core_symbols", CORE_SYMBOLS.map((symbol) => ({
  ok: contractA.coreUniverse.some((s) => s.symbol === symbol),
  pass: `coreUniverse contains ${symbol}.`,
  fail: `coreUniverse must contain ${symbol}.`,
})));

pushCheck("21_extended_symbols", EXTENDED_SYMBOLS.map((symbol) => ({
  ok: contractA.extendedUniverse.some((s) => s.symbol === symbol),
  pass: `extendedUniverse contains ${symbol}.`,
  fail: `extendedUniverse must contain ${symbol}.`,
})));

pushCheck("22_only_3019_live_fetch_approved", [
  { ok: allStocks.filter((s) => s.liveFetchApproved).map((s) => s.symbol).join(",") === "3019", pass: "only 3019 has liveFetchApproved=true.", fail: "only 3019 may have liveFetchApproved=true." },
]);

pushCheck("23_non_3019_live_fetch_false", [
  { ok: non3019.every((s) => s.liveFetchApproved === false), pass: "all non-3019 liveFetchApproved=false.", fail: "all non-3019 symbols must have liveFetchApproved=false." },
]);

pushCheck("24_non_3019_channel_null", [
  { ok: non3019.every((s) => s.approvedChannel === null), pass: "all non-3019 approvedChannel=null.", fail: "all non-3019 symbols must have approvedChannel=null." },
]);

pushCheck("25_non_3019_status_not_approved", [
  { ok: non3019.every((s) => s.channelStatus === "not_approved" || s.channelStatus === "unresolved"), pass: "all non-3019 channelStatus is not approved.", fail: "all non-3019 channelStatus must be not_approved or unresolved." },
]);

pushCheck("26_all_scanner_eligible", [
  { ok: allStocks.every((s) => s.scannerEligible === true), pass: "all stocks scannerEligible=true.", fail: "all stocks must be scannerEligible=true." },
]);

pushCheck("27_all_namezh_chinese", [
  { ok: allStocks.every((s) => CJK.test(s.nameZh)), pass: "all nameZh values contain Traditional Chinese text.", fail: "all nameZh values must contain Chinese text." },
]);

pushCheck("28_all_notezh_chinese", [
  { ok: allStocks.every((s) => CJK.test(s.noteZh)), pass: "all noteZh values contain Chinese text.", fail: "all noteZh values must contain Chinese text." },
]);

pushCheck("29_doc_universe_metadata_not_approval", [
  { ok: docHas("universe metadata is not live fetch approval"), pass: "doc states universe metadata is not live fetch approval.", fail: "doc must state universe metadata is not live fetch approval." },
]);

pushCheck("30_doc_17_horsepower", [
  { ok: docHas("17 Horsepower"), pass: "doc includes 17 Horsepower.", fail: "doc must include 17 Horsepower." },
]);

pushCheck("31_doc_ko_san_di", [
  { ok: docHas("扣三低"), pass: "doc includes 扣三低.", fail: "doc must include 扣三低." },
]);

pushCheck("32_doc_pullback_sweet_spot", [
  { ok: docHas("走多回檔甜蜜點"), pass: "doc includes 走多回檔甜蜜點.", fail: "doc must include 走多回檔甜蜜點." },
]);

pushCheck("33_doc_scanner_universe_plan", [
  { ok: docHas("Scanner Universe Plan"), pass: "doc includes Scanner Universe Plan.", fail: "doc must include Scanner Universe Plan." },
]);

pushCheck("34_scanner_plan_disabled", [
  { ok: contractA.scannerUniversePlan.enabledNow === false, pass: "scannerUniversePlan.enabledNow=false.", fail: "scannerUniversePlan.enabledNow must be false." },
]);

pushCheck("35_full_market_scan_disabled", [
  { ok: contractA.scannerUniversePlan.fullMarketScanEnabled === false, pass: "fullMarketScanEnabled=false.", fail: "fullMarketScanEnabled must be false." },
]);

pushCheck("36_ui_language_rule", [
  { ok: docHas("user-visible UI must be Traditional Chinese"), pass: "doc states UI language rule.", fail: "doc must state user-visible UI must be Traditional Chinese." },
]);

let safetyChain = "";
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}

pushCheck("37_validator_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:watchlist-universe-tier": "node --require ./scripts/register-typescript.cjs ./scripts/validate-watchlist-universe-tier.ts"'), pass: "package.json has test:watchlist-universe-tier.", fail: "package.json must add test:watchlist-universe-tier." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:watchlist-universe-tier"), pass: "watchlist universe validator is not in test:safety-chain.", fail: "watchlist universe validator must remain standalone." },
]);

let totalChecks = -1;
try {
  totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-01T00:00:00.000Z" }).result.totalChecks;
} catch {
  totalChecks = -1;
}

pushCheck("38_safety_chain_22", [
  { ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` },
]);

pushCheck("39_17_horsepower_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:17-horsepower-scanner": "node --require ./scripts/register-typescript.cjs ./scripts/validate-17-horsepower-scanner.ts"'), pass: "17 horsepower validator script remains present.", fail: "17 horsepower validator script must remain present." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:17-horsepower-scanner"), pass: "17 horsepower validator remains standalone.", fail: "17 horsepower validator must remain standalone." },
]);

pushCheck("40_project_handoff_present", [
  { ok: fileExists(resolve(HANDOFF_REL)), pass: "project handoff summary exists.", fail: "project handoff summary must exist." },
  { ok: handoff != null && handoff.includes("Project Handoff Summary"), pass: "handoff contains Project Handoff Summary.", fail: "handoff must contain Project Handoff Summary." },
  { ok: handoff != null && handoff.includes("Watchlist Universe Tier Spec"), pass: "handoff includes Watchlist Universe Tier Spec.", fail: "handoff must include Watchlist Universe Tier Spec." },
]);

pushCheck("41_completion_report_rule", [
  { ok: readme != null && readme.includes("future completed version must include Project Handoff Summary"), pass: "README keeps Project Handoff Summary completion rule.", fail: "README must keep Project Handoff Summary completion rule." },
]);

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const out = {
  status: overallStatus,
  spec: "WATCHLIST_UNIVERSE_TIER",
  core_symbols: contractA.coreUniverse.map((s) => s.symbol),
  extended_symbols: contractA.extendedUniverse.map((s) => s.symbol),
  approved_live_fetch_symbols: contractA.liveFetchBoundary.approvedLiveFetchSymbols,
  approved_channels: contractA.liveFetchBoundary.approvedChannels,
  scanner_plan_enabled_now: contractA.scannerUniversePlan.enabledNow,
  full_market_scan_enabled: contractA.scannerUniversePlan.fullMarketScanEnabled,
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((c) => [c.name, c.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  production_data_switched: false,
  buy_sell_command_generated: false,
};

console.log(JSON.stringify(out, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
