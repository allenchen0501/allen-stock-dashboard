/**
 * Kou San Di Scanner Validator.
 *
 * Pure static + in-process checks. NO network, NO smoke, NO Supabase, NO env key read,
 * NO provider runtime change. Standalone - NOT part of test:safety-chain.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const scannerModule = require("../use-cases/war-room/build-kou-san-di-scanner-contract") as typeof import("../use-cases/war-room/build-kou-san-di-scanner-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildKouSanDiScannerContract } = scannerModule;
const { buildSafetyChainCiGuardContract } = guardModule;

type CheckStatus = "PASS" | "FAIL";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string[];
}

const DOC_REL = "docs/technical-scanner-kou-san-di.md";
const CONTRACT_REL = "use-cases/war-room/build-kou-san-di-scanner-contract.ts";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const README_REL = "README.md";
const PKG_REL = "package.json";
const CJK = /[\u4e00-\u9fff]/;
const FORBIDDEN_ACTION_TERMS = ["買進", "賣出", "加碼", "減碼", "自動交易", "自動下單", "下單"];

const checks: CheckResult[] = [];

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

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function pushCheck(name: string, conditions: Array<{ ok: boolean; pass: string; fail: string }>): void {
  const details: string[] = [];
  let status: CheckStatus = "PASS";
  for (const condition of conditions) {
    if (condition.ok) details.push(`PASS  ${condition.pass}`);
    else {
      status = "FAIL";
      details.push(`FAIL  ${condition.fail}`);
    }
  }
  checks.push({ name, status, details });
}

const doc = readFile(resolve(DOC_REL));
const contractRaw = readFile(resolve(CONTRACT_REL));
const contractLower = stripComments(contractRaw ?? "").toLowerCase();
const handoff = readFile(resolve(HANDOFF_REL));
const readme = readFile(resolve(README_REL));
const pkgBody = readFile(resolve(PKG_REL));

const scannerA = buildKouSanDiScannerContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const scannerB = buildKouSanDiScannerContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const samples = scannerA.samples;

function docHas(term: string): boolean {
  return doc != null && doc.includes(term);
}

function noContractToken(term: string): boolean {
  return !contractLower.includes(term);
}

pushCheck("01_doc_exists", [
  { ok: fileExists(resolve(DOC_REL)), pass: "Kou San Di scanner doc exists.", fail: "docs/technical-scanner-kou-san-di.md must exist." },
]);
pushCheck("02_contract_exists", [
  { ok: fileExists(resolve(CONTRACT_REL)), pass: "Kou San Di scanner contract exists.", fail: "contract file must exist." },
]);
pushCheck("03_deterministic", [
  { ok: JSON.stringify(scannerA) === JSON.stringify(scannerB), pass: "contract is deterministic.", fail: "contract must be deterministic." },
]);
pushCheck("04_fixture_only", [
  { ok: scannerA.mode === "FIXTURE_ONLY_NO_NETWORK" && scannerA.decision === "SPEC_ONLY_NOT_CONNECTED", pass: "contract is fixture-only.", fail: "contract must be fixture-only." },
]);
pushCheck("05_no_real_network", [
  { ok: scannerA.realNetworkUsed === false && scannerA.liveFetchPerformed === false, pass: "no real network or live fetch.", fail: "contract must not perform real network or live fetch." },
]);
pushCheck("06_no_fetch", [
  { ok: noContractToken("fetch("), pass: "contract source has no request call.", fail: "contract source must not contain request call." },
]);
pushCheck("07_no_supabase", [
  { ok: noContractToken("@supabase") && noContractToken("createclient") && scannerA.supabaseConnected === false, pass: "no Supabase.", fail: "contract must not use Supabase." },
]);
pushCheck("08_no_process_env", [
  { ok: noContractToken("process.env") && scannerA.envReadPerformed === false, pass: "no process.env.", fail: "contract must not read process.env." },
]);
pushCheck("09_no_db_write", [
  { ok: noContractToken("insert(") && noContractToken("upsert(") && noContractToken("delete(") && noContractToken(".update(") && scannerA.databaseWritePerformed === false, pass: "no DB write.", fail: "contract must not write DB." },
]);
pushCheck("10_no_api_route", [
  { ok: noContractToken("/api/") && scannerA.apiRouteCreated === false && scannerA.portfolioApiSwitched === false, pass: "no API route.", fail: "contract must not create API route." },
]);
pushCheck("11_no_broker_api", [
  { ok: noContractToken("broker_api") && noContractToken("brokerapi(") && scannerA.brokerApiUsed === false, pass: "no broker API.", fail: "contract must not use broker API." },
]);
pushCheck("12_no_buysell_command", [
  { ok: noContractToken("placeorder") && scannerA.buySellCommandGenerated === false, pass: "no buy/sell command.", fail: "contract must not generate buy/sell command." },
]);
pushCheck("13_no_auto_order", [
  { ok: noContractToken("autoorder(") && scannerA.autoOrderRequested === false, pass: "no auto order.", fail: "contract must not auto order." },
]);
pushCheck("14_no_production_switch", [
  { ok: scannerA.productionDataSwitched === false && scannerA.productionTradingReady === false && scannerA.liveFetchBoundary.productionDataSwitchAllowed === false, pass: "no production data switch.", fail: "contract must not switch production data." },
]);
pushCheck("15_terminology_correct", [
  { ok: scannerA.terminology.correctTerm === "扣三低", pass: "correctTerm is 扣三低.", fail: "correctTerm must be 扣三低." },
]);
pushCheck("16_terminology_no_typo_list", [
  { ok: (scannerA.terminology as unknown as Record<string, unknown>).forbiddenTerms === undefined, pass: "terminology output no longer exposes a typo list (typos live only in the terminology guard).", fail: "terminology output must not expose a typo list." },
]);
pushCheck("17_approved_symbols_exact", [
  { ok: arraysEqual(scannerA.liveFetchBoundary.approvedLiveFetchSymbols, ["3019"]), pass: "approvedLiveFetchSymbols exactly [3019].", fail: "approvedLiveFetchSymbols must be exactly [3019]." },
]);
pushCheck("18_approved_channels_exact", [
  { ok: arraysEqual(scannerA.liveFetchBoundary.approvedChannels, ["tse_3019.tw"]), pass: "approvedChannels exactly [tse_3019.tw].", fail: "approvedChannels must be exactly [tse_3019.tw]." },
]);
pushCheck("19_samples_min_three", [
  { ok: samples.length >= 3, pass: "samples length is at least 3.", fail: "samples length must be at least 3." },
]);
pushCheck("20_has_pass", [
  { ok: samples.some((sample) => sample.candidateTag === "扣三低通過"), pass: "samples include 扣三低通過.", fail: "samples must include 扣三低通過." },
]);
pushCheck("21_has_waiting", [
  { ok: samples.some((sample) => sample.candidateTag === "等待確認"), pass: "samples include 等待確認.", fail: "samples must include 等待確認." },
]);
pushCheck("22_has_excluded", [
  { ok: samples.some((sample) => sample.candidateTag === "排除"), pass: "samples include 排除.", fail: "samples must include 排除." },
]);
pushCheck("23_ma_count_range", [
  { ok: samples.every((sample) => Number.isInteger(sample.maDeductionLowCount) && sample.maDeductionLowCount >= 0 && sample.maDeductionLowCount <= 3), pass: "every maDeductionLowCount is 0-3.", fail: "maDeductionLowCount must be 0-3." },
]);
pushCheck("24_ma_pass_rule", [
  { ok: samples.every((sample) => sample.maDeductionLowPass === (sample.maDeductionLowCount >= 3)), pass: "maDeductionLowPass rule is consistent.", fail: "maDeductionLowPass must match maDeductionLowCount >= 3." },
]);
pushCheck("25_kou_san_di_pass_rule", [
  { ok: samples.every((sample) => !sample.kouSanDiPass || sample.candidateTag === "扣三低通過"), pass: "kouSanDiPass implies 扣三低通過.", fail: "kouSanDiPass must imply candidateTag is 扣三低通過." },
]);
pushCheck("26_horsepower_score_range", [
  { ok: samples.every((sample) => Number.isInteger(sample.horsepowerScore) && sample.horsepowerScore >= 0 && sample.horsepowerScore <= 17), pass: "every horsepowerScore is 0-17.", fail: "horsepowerScore must be 0-17." },
]);
pushCheck("27_doc_ma_layer", [
  { ok: docHas("MA Deduction Low Layer"), pass: "doc includes MA Deduction Low Layer.", fail: "doc must include MA Deduction Low Layer." },
]);
pushCheck("28_doc_structure_layer", [
  { ok: docHas("Structure Confirmation Layer"), pass: "doc includes Structure Confirmation Layer.", fail: "doc must include Structure Confirmation Layer." },
]);
pushCheck("29_doc_matrix", [
  { ok: docHas("17 Horsepower Candidate Matrix"), pass: "doc includes 17 Horsepower Candidate Matrix.", fail: "doc must include 17 Horsepower Candidate Matrix." },
]);
pushCheck("30_doc_pullback", [
  { ok: docHas("走多回檔甜蜜點"), pass: "doc includes 走多回檔甜蜜點.", fail: "doc must include 走多回檔甜蜜點." },
]);
pushCheck("31_doc_risk_reward", [
  { ok: docHas("risk/reward"), pass: "doc includes risk/reward.", fail: "doc must include risk/reward." },
]);
pushCheck("32_doc_not_instruction", [
  { ok: docHas("扣三低 is not buy/sell instruction"), pass: "doc states 扣三低 is not buy/sell instruction.", fail: "doc must state 扣三低 is not buy/sell instruction." },
]);
pushCheck("33_36_action_labels_safe", [
  { ok: samples.every((sample) => FORBIDDEN_ACTION_TERMS.every((term) => !sample.actionLabelZh.includes(term))), pass: "actionLabelZh contains no execution terms.", fail: "actionLabelZh must not contain execution terms." },
]);
pushCheck("37_ui_language_rule", [
  { ok: docHas("user-visible UI must be Traditional Chinese"), pass: "doc states UI language rule.", fail: "doc must state UI language rule." },
]);

let safetyChain = "";
try {
  const pkg = JSON.parse(pkgBody ?? "{}") as { scripts?: Record<string, string> };
  safetyChain = pkg.scripts?.["test:safety-chain"] ?? "";
} catch {
  safetyChain = "";
}
let totalChecks = -1;
try {
  totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-01T00:00:00.000Z" }).result.totalChecks;
} catch {
  totalChecks = -1;
}

pushCheck("38_validator_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:kou-san-di-scanner": "node --require ./scripts/register-typescript.cjs ./scripts/validate-kou-san-di-scanner.ts"'), pass: "package.json has kou san di scanner validator script.", fail: "package.json must add kou san di scanner validator script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:kou-san-di-scanner"), pass: "kou san di scanner validator is not in test:safety-chain.", fail: "kou san di scanner validator must remain standalone." },
]);
pushCheck("39_safety_chain_22", [
  { ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` },
]);
pushCheck("40_matrix_validator_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:watchlist-17-horsepower-candidate-matrix": "node --require ./scripts/register-typescript.cjs ./scripts/validate-watchlist-17-horsepower-candidate-matrix.ts"'), pass: "candidate matrix validator remains present.", fail: "candidate matrix validator must remain present." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:watchlist-17-horsepower-candidate-matrix"), pass: "candidate matrix validator remains standalone.", fail: "candidate matrix validator must remain standalone." },
]);
pushCheck("41_handoff_present", [
  { ok: fileExists(resolve(HANDOFF_REL)), pass: "project handoff summary exists.", fail: "project handoff summary must exist." },
  { ok: handoff != null && handoff.includes("Project Handoff Summary"), pass: "handoff contains Project Handoff Summary.", fail: "handoff must contain Project Handoff Summary." },
  { ok: handoff != null && handoff.includes("扣三低"), pass: "handoff includes 扣三低.", fail: "handoff must include 扣三低." },
]);
pushCheck("42_completion_report_rule", [
  { ok: readme != null && readme.includes("future completed version must include Project Handoff Summary"), pass: "README keeps Project Handoff Summary completion rule.", fail: "README must keep Project Handoff Summary completion rule." },
]);

const status: CheckStatus = checks.some((check) => check.status === "FAIL") ? "FAIL" : "PASS";
const issues = checks.flatMap((check) => check.details.filter((line) => line.startsWith("FAIL")));

console.log(JSON.stringify({
  status,
  spec: "KOU_SAN_DI_SCANNER",
  correct_term: scannerA.terminology.correctTerm,
  sample_count: samples.length,
  summary: scannerA.summary,
  approved_live_fetch_symbols: scannerA.liveFetchBoundary.approvedLiveFetchSymbols,
  approved_channels: scannerA.liveFetchBoundary.approvedChannels,
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((check) => check.status === "PASS").length,
  failed_checks: checks.filter((check) => check.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((check) => [check.name, check.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
  production_data_switched: false,
  buy_sell_command_generated: false,
}, null, 2));

process.exit(status === "FAIL" ? 1 : 0);
