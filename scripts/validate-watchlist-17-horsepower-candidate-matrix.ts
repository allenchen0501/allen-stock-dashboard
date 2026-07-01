/**
 * Watchlist 17 Horsepower Candidate Matrix Validator.
 *
 * Pure static + in-process checks. NO network, NO smoke, NO Supabase, NO env key read,
 * NO provider runtime change. Standalone - NOT part of test:safety-chain.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const matrixModule = require("../use-cases/war-room/build-watchlist-17-horsepower-candidate-matrix-contract") as typeof import("../use-cases/war-room/build-watchlist-17-horsepower-candidate-matrix-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildWatchlist17HorsepowerCandidateMatrixContract } = matrixModule;
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

function tagPriority(tag: string): number {
  if (tag === "主升段") return 1;
  if (tag === "逢低候選") return 2;
  if (tag === "觀察") return 3;
  if (tag === "排除") return 4;
  return 99;
}

const CJK = /[\u4e00-\u9fff]/;
const FORBIDDEN_ACTION_TERMS = ["買進", "賣出", "加碼", "減碼", "自動交易", "自動下單", "下單"];
const CORE_SYMBOLS = ["3019", "4966", "5347", "4979", "2455"];
const EXTENDED_SYMBOLS = ["3450", "3163", "6442", "3363", "2383", "2368", "3491", "2313", "2344", "6239", "8299", "3105"];

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

const DOC_REL = "docs/watchlist-17-horsepower-candidate-matrix.md";
const CONTRACT_REL = "use-cases/war-room/build-watchlist-17-horsepower-candidate-matrix-contract.ts";
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

const matrixA = buildWatchlist17HorsepowerCandidateMatrixContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const matrixB = buildWatchlist17HorsepowerCandidateMatrixContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const candidates = matrixA.candidates;

function docHas(term: string): boolean {
  return doc != null && doc.includes(term);
}

function noContractToken(token: string): boolean {
  return !contractLower.includes(token);
}

pushCheck("01_doc_exists", [
  { ok: fileExists(resolve(DOC_REL)), pass: "candidate matrix doc exists.", fail: "docs/watchlist-17-horsepower-candidate-matrix.md must exist." },
]);
pushCheck("02_contract_exists", [
  { ok: fileExists(resolve(CONTRACT_REL)), pass: "candidate matrix contract exists.", fail: "candidate matrix contract file must exist." },
]);
pushCheck("03_deterministic", [
  { ok: JSON.stringify(matrixA) === JSON.stringify(matrixB), pass: "contract is deterministic.", fail: "contract must be deterministic." },
]);
pushCheck("04_fixture_only", [
  { ok: matrixA.mode === "FIXTURE_ONLY_NO_NETWORK" && matrixA.decision === "OBSERVATION_ONLY_NOT_CONNECTED", pass: "contract is fixture-only observation matrix.", fail: "contract must be fixture-only." },
]);
pushCheck("05_no_real_network", [
  { ok: matrixA.realNetworkUsed === false && matrixA.liveFetchPerformed === false, pass: "realNetworkUsed/liveFetchPerformed false.", fail: "contract must not perform real network or live fetch." },
]);
pushCheck("06_no_fetch", [
  { ok: noContractToken("fetch("), pass: "contract source has no request call.", fail: "contract source must not contain request call." },
]);
pushCheck("07_no_supabase", [
  { ok: noContractToken("@supabase") && noContractToken("createclient") && matrixA.supabaseConnected === false, pass: "no Supabase.", fail: "contract must not use Supabase." },
]);
pushCheck("08_no_process_env", [
  { ok: noContractToken("process.env") && matrixA.envReadPerformed === false, pass: "no process.env.", fail: "contract must not read process.env." },
]);
pushCheck("09_no_db_write", [
  { ok: noContractToken("insert(") && noContractToken("upsert(") && noContractToken("delete(") && noContractToken(".update(") && matrixA.databaseWritePerformed === false, pass: "no DB write.", fail: "contract must not write DB." },
]);
pushCheck("10_no_api_route", [
  { ok: noContractToken("/api/") && matrixA.apiRouteCreated === false && matrixA.portfolioApiSwitched === false, pass: "no API route or portfolio switch.", fail: "contract must not create API route or switch portfolio API." },
]);
pushCheck("11_no_broker_api", [
  { ok: noContractToken("broker_api") && noContractToken("brokerapi(") && matrixA.brokerApiUsed === false, pass: "no broker API.", fail: "contract must not use broker API." },
]);
pushCheck("12_no_buysell_command", [
  { ok: noContractToken("placeorder") && matrixA.buySellCommandGenerated === false, pass: "no buy/sell command.", fail: "contract must not generate buy/sell command." },
]);
pushCheck("13_no_auto_order", [
  { ok: noContractToken("autoorder(") && matrixA.autoOrderRequested === false, pass: "no auto order.", fail: "contract must not auto order." },
]);
pushCheck("14_no_production_switch", [
  { ok: matrixA.productionDataSwitched === false && matrixA.productionTradingReady === false && matrixA.liveFetchBoundary.productionDataSwitchAllowed === false, pass: "no production data switch.", fail: "contract must not switch production data." },
]);
pushCheck("15_live_fetch_boundary_present", [
  { ok: matrixA.liveFetchBoundary != null, pass: "liveFetchBoundary present.", fail: "output must contain liveFetchBoundary." },
]);
pushCheck("16_approved_symbols_exact", [
  { ok: arraysEqual(matrixA.liveFetchBoundary.approvedLiveFetchSymbols, ["3019"]), pass: "approvedLiveFetchSymbols exactly [3019].", fail: "approvedLiveFetchSymbols must be exactly [3019]." },
]);
pushCheck("17_approved_channels_exact", [
  { ok: arraysEqual(matrixA.liveFetchBoundary.approvedChannels, ["tse_3019.tw"]), pass: "approvedChannels exactly [tse_3019.tw].", fail: "approvedChannels must be exactly [tse_3019.tw]." },
]);
pushCheck("18_source_universe_counts", [
  { ok: Number.isInteger(matrixA.sourceUniverse.coreCount), pass: "sourceUniverse.coreCount present.", fail: "sourceUniverse must include coreCount." },
  { ok: Number.isInteger(matrixA.sourceUniverse.extendedCount), pass: "sourceUniverse.extendedCount present.", fail: "sourceUniverse must include extendedCount." },
  { ok: Number.isInteger(matrixA.sourceUniverse.totalCount), pass: "sourceUniverse.totalCount present.", fail: "sourceUniverse must include totalCount." },
  { ok: matrixA.sourceUniverse.totalCount === matrixA.sourceUniverse.coreCount + matrixA.sourceUniverse.extendedCount, pass: "totalCount equals coreCount + extendedCount.", fail: "totalCount must equal coreCount + extendedCount." },
]);
pushCheck("19_candidates_length_total", [
  { ok: candidates.length === matrixA.sourceUniverse.totalCount, pass: "candidates length equals totalCount.", fail: "candidates length must equal totalCount." },
]);
pushCheck("20_core_symbols", CORE_SYMBOLS.map((symbol) => ({
  ok: candidates.some((c) => c.symbol === symbol),
  pass: `candidates include core ${symbol}.`,
  fail: `candidates must include core ${symbol}.`,
})));
pushCheck("21_extended_symbols", EXTENDED_SYMBOLS.map((symbol) => ({
  ok: candidates.some((c) => c.symbol === symbol),
  pass: `candidates include extended ${symbol}.`,
  fail: `candidates must include extended ${symbol}.`,
})));
pushCheck("22_has_main_trend", [
  { ok: candidates.some((c) => c.candidateTag === "主升段"), pass: "candidates include 主升段.", fail: "candidates must include 主升段." },
]);
pushCheck("23_has_pullback_candidate", [
  { ok: candidates.some((c) => c.candidateTag === "逢低候選"), pass: "candidates include 逢低候選.", fail: "candidates must include 逢低候選." },
]);
pushCheck("24_has_watch", [
  { ok: candidates.some((c) => c.candidateTag === "觀察"), pass: "candidates include 觀察.", fail: "candidates must include 觀察." },
]);
pushCheck("25_has_excluded", [
  { ok: candidates.some((c) => c.candidateTag === "排除"), pass: "candidates include 排除.", fail: "candidates must include 排除." },
]);
pushCheck("26_scores_0_17", [
  { ok: candidates.every((c) => Number.isInteger(c.horsepowerScore) && c.horsepowerScore >= 0 && c.horsepowerScore <= 17), pass: "every horsepowerScore is 0-17.", fail: "every horsepowerScore must be 0-17." },
]);
const ranks = candidates.map((c) => c.candidateRank);
pushCheck("27_unique_ranks", [
  { ok: new Set(ranks).size === ranks.length, pass: "every candidateRank is unique.", fail: "candidateRank must be unique." },
]);
pushCheck("28_ranks_start_1", [
  { ok: ranks[0] === 1 && ranks.every((rank, index) => rank === index + 1), pass: "candidateRank starts from 1 and is sequential.", fail: "candidateRank must start from 1 and be sequential." },
]);
pushCheck("29_rank_ordering", [
  {
    ok: candidates.every((candidate, index, arr) => index === 0 || tagPriority(arr[index - 1].candidateTag) <= tagPriority(candidate.candidateTag)),
    pass: "rank ordering follows 主升段 -> 逢低候選 -> 觀察 -> 排除.",
    fail: "rank ordering must follow 主升段 -> 逢低候選 -> 觀察 -> 排除.",
  },
]);
pushCheck("30_no_action_buy", [
  { ok: candidates.every((c) => !c.actionLabelZh.includes("買進")), pass: "no actionLabelZh contains 買進.", fail: "actionLabelZh must not contain 買進." },
]);
pushCheck("31_no_action_sell", [
  { ok: candidates.every((c) => !c.actionLabelZh.includes("賣出")), pass: "no actionLabelZh contains 賣出.", fail: "actionLabelZh must not contain 賣出." },
]);
pushCheck("32_no_action_add", [
  { ok: candidates.every((c) => !c.actionLabelZh.includes("加碼")), pass: "no actionLabelZh contains 加碼.", fail: "actionLabelZh must not contain 加碼." },
]);
pushCheck("33_no_action_auto_trade", [
  { ok: candidates.every((c) => FORBIDDEN_ACTION_TERMS.every((term) => !c.actionLabelZh.includes(term))), pass: "no actionLabelZh contains forbidden execution terms.", fail: "actionLabelZh must not contain execution terms." },
]);
pushCheck("34_risk_note_chinese", [
  { ok: candidates.every((c) => CJK.test(c.riskNoteZh)), pass: "every riskNoteZh contains Traditional Chinese.", fail: "riskNoteZh must contain Traditional Chinese." },
]);
pushCheck("35_doc_ranking_not_instruction", [
  { ok: docHas("ranking is not buy/sell instruction"), pass: "doc states ranking is not buy/sell instruction.", fail: "doc must state ranking is not buy/sell instruction." },
]);
pushCheck("36_doc_ko_san_di", [
  { ok: docHas("柯三弟"), pass: "doc includes 柯三弟.", fail: "doc must include 柯三弟." },
]);
pushCheck("37_doc_pullback_sweet_spot", [
  { ok: docHas("走多回檔甜蜜點"), pass: "doc includes 走多回檔甜蜜點.", fail: "doc must include 走多回檔甜蜜點." },
]);
pushCheck("38_doc_risk_reward", [
  { ok: docHas("risk/reward"), pass: "doc includes risk/reward.", fail: "doc must include risk/reward." },
]);
pushCheck("39_ui_language_rule", [
  { ok: docHas("user-visible UI must be Traditional Chinese"), pass: "doc states UI language rule.", fail: "doc must state user-visible UI must be Traditional Chinese." },
]);

let safetyChain = "";
try {
  const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> });
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}

pushCheck("40_validator_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:watchlist-17-horsepower-candidate-matrix": "node --require ./scripts/register-typescript.cjs ./scripts/validate-watchlist-17-horsepower-candidate-matrix.ts"'), pass: "package.json has matrix validator script.", fail: "package.json must add matrix validator script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:watchlist-17-horsepower-candidate-matrix"), pass: "matrix validator is not in test:safety-chain.", fail: "matrix validator must remain standalone." },
]);
let totalChecks = -1;
try {
  totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-01T00:00:00.000Z" }).result.totalChecks;
} catch {
  totalChecks = -1;
}
pushCheck("41_safety_chain_22", [
  { ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` },
]);
pushCheck("42_watchlist_universe_validator_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:watchlist-universe-tier": "node --require ./scripts/register-typescript.cjs ./scripts/validate-watchlist-universe-tier.ts"'), pass: "watchlist universe validator script remains present.", fail: "watchlist universe validator script must remain present." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:watchlist-universe-tier"), pass: "watchlist universe validator remains standalone.", fail: "watchlist universe validator must remain standalone." },
]);
pushCheck("43_17_horsepower_validator_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:17-horsepower-scanner": "node --require ./scripts/register-typescript.cjs ./scripts/validate-17-horsepower-scanner.ts"'), pass: "17 horsepower validator script remains present.", fail: "17 horsepower validator script must remain present." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:17-horsepower-scanner"), pass: "17 horsepower validator remains standalone.", fail: "17 horsepower validator must remain standalone." },
]);
pushCheck("44_project_handoff_present", [
  { ok: fileExists(resolve(HANDOFF_REL)), pass: "project handoff summary exists.", fail: "project handoff summary must exist." },
  { ok: handoff != null && handoff.includes("Project Handoff Summary"), pass: "handoff contains Project Handoff Summary.", fail: "handoff must contain Project Handoff Summary." },
  { ok: handoff != null && handoff.includes("Watchlist 17 Horsepower Candidate Matrix"), pass: "handoff includes candidate matrix.", fail: "handoff must include candidate matrix." },
]);
pushCheck("45_completion_report_rule", [
  { ok: readme != null && readme.includes("future completed version must include Project Handoff Summary"), pass: "README keeps Project Handoff Summary completion rule.", fail: "README must keep Project Handoff Summary completion rule." },
]);

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));

const out = {
  status: overallStatus,
  spec: "WATCHLIST_17_HORSEPOWER_CANDIDATE_MATRIX",
  source_universe: matrixA.sourceUniverse,
  candidate_count: candidates.length,
  summary: matrixA.summary,
  approved_live_fetch_symbols: matrixA.liveFetchBoundary.approvedLiveFetchSymbols,
  approved_channels: matrixA.liveFetchBoundary.approvedChannels,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  safety_chain_total_checks: totalChecks,
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
