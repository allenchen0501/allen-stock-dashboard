/**
 * Allen 17-Line Power Score v1.1 Validator — static + pure-function check (fixture-only).
 *
 * Verifies the v1.1 upgrade of the 17-horsepower scanner contract (powerRatio, weighted
 * power, group scores, volume confirmation, overheat filter, dataStatus, powerRating,
 * effectiveAttack / strongButOverheated, ratio-based deteriorationAlert, safety labels),
 * the doc positioning statements, the War Room read-model / UI integration, and that the
 * whole thing stays fixture-only / standalone / off the safety chain (which stays 22).
 *
 * NO network, NO smoke, NO Supabase, NO env read, NO provider change. Standalone.
 *
 * Exit 0 → PASS or WARNING, Exit 1 → FAIL
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/war-room/build-17-horsepower-scanner-contract") as typeof import("../use-cases/war-room/build-17-horsepower-scanner-contract");
const readModelModule = require("../use-cases/war-room/build-war-room-read-model-contract") as typeof import("../use-cases/war-room/build-war-room-read-model-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { build17HorsepowerScannerContract } = contractModule;
const { buildWarRoomReadModelContract } = readModelModule;
const { buildSafetyChainCiGuardContract } = guardModule;

type CheckStatus = "PASS" | "WARNING" | "FAIL";
interface CheckResult { name: string; status: CheckStatus; details: string[]; }

function resolve(...parts: string[]): string { return path.resolve(process.cwd(), ...parts); }
function readFile(p: string): string | null { try { return fs.readFileSync(p, "utf8"); } catch { return null; } }
function fileExists(p: string): boolean { try { return fs.statSync(p).isFile(); } catch { return false; } }
function stripComments(s: string): string { return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); }
function combineStatus(a: CheckStatus[]): CheckStatus { if (a.some((s) => s === "FAIL")) return "FAIL"; if (a.some((s) => s === "WARNING")) return "WARNING"; return "PASS"; }

const checks: CheckResult[] = [];
function pushCheck(name: string, conditions: Array<{ ok: boolean; pass: string; fail: string }>): void {
  const details: string[] = [];
  let status: CheckStatus = "PASS";
  for (const c of conditions) {
    if (c.ok) details.push(`PASS  ${c.pass}`);
    else { details.push(`FAIL  ${c.fail}`); status = "FAIL"; }
  }
  checks.push({ name, status, details });
}
function every<T>(arr: T[], f: (x: T) => boolean): boolean { return arr.every(f); }
function has(obj: unknown, key: string): boolean { return obj != null && Object.prototype.hasOwnProperty.call(obj, key); }
const approx = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------------------
const DOC_REL = "docs/technical-scanner-17-horsepower.md";
const CONTRACT_REL = "use-cases/war-room/build-17-horsepower-scanner-contract.ts";
const DASHBOARD_REL = "components/war-room-dashboard.tsx";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const PKG_REL = "package.json";

const doc = readFile(resolve(DOC_REL)) ?? "";
const contractRaw = readFile(resolve(CONTRACT_REL)) ?? "";
const contractLower = stripComments(contractRaw).toLowerCase();
const dashboard = readFile(resolve(DASHBOARD_REL)) ?? "";
const pkgBody = readFile(resolve(PKG_REL));

const c = build17HorsepowerScannerContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const stocks = c.stocks;

// 1. modelVersion V1_1.
pushCheck("01_model_version", [{ ok: (c as unknown as Record<string, unknown>).modelVersion === "V1_1", pass: "modelVersion === V1_1.", fail: "modelVersion must be V1_1." }]);

// 2–5. maxAvailable / powerRatio / previousPowerRatio / weightedPower present.
pushCheck("02_maxAvailable", [{ ok: every(stocks, (s) => has(s, "maxAvailable")), pass: "every stock has maxAvailable.", fail: "every stock must have maxAvailable." }]);
pushCheck("03_powerRatio", [{ ok: every(stocks, (s) => has(s, "powerRatio")), pass: "every stock has powerRatio.", fail: "every stock must have powerRatio." }]);
pushCheck("04_previousPowerRatio", [{ ok: every(stocks, (s) => has(s, "previousPowerRatio")), pass: "every stock has previousPowerRatio.", fail: "every stock must have previousPowerRatio." }]);
pushCheck("05_weightedPower", [{ ok: every(stocks, (s) => has(s, "weightedPower")), pass: "every stock has weightedPower.", fail: "every stock must have weightedPower." }]);

// 6. powerRatio = horsepowerScore / maxAvailable.
pushCheck("06_powerRatio_formula", [{ ok: every(stocks, (s) => s.maxAvailable > 0 && approx(s.powerRatio, s.horsepowerScore / s.maxAvailable)), pass: "powerRatio === horsepowerScore / maxAvailable.", fail: "powerRatio must equal horsepowerScore / maxAvailable." }]);

// 7. weightedPower in 0..100.
pushCheck("07_weightedPower_range", [{ ok: every(stocks, (s) => s.weightedPower >= 0 && s.weightedPower <= 100 + 1e-9), pass: "weightedPower within 0..100.", fail: "weightedPower must be within 0..100." }]);

// 8–9. groupWeights present + sum 100.
const gw = (c as unknown as Record<string, unknown>).groupWeights as Record<string, number> | undefined;
pushCheck("08_groupWeights", [{ ok: gw != null, pass: "groupWeights present.", fail: "groupWeights must exist." }]);
pushCheck("09_groupWeights_sum_100", [{ ok: gw != null && (gw.shortCost + gw.dailyMA + gw.weekly + gw.monthly) === 100, pass: "groupWeights sum to 100.", fail: "groupWeights must sum to 100." }]);

// 10–14. group scores present + shape.
for (const [id, key] of [["10", "shortCostScore"], ["11", "dailyMAScore"], ["12", "weeklyScore"], ["13", "monthlyScore"]] as const) {
  pushCheck(`${id}_${key}`, [{ ok: every(stocks, (s) => has(s, key)), pass: `every stock has ${key}.`, fail: `every stock must have ${key}.` }]);
}
pushCheck("14_group_score_shape", [{
  ok: every(stocks, (s) => [s.shortCostScore, s.dailyMAScore, s.weeklyScore, s.monthlyScore].every((g) => has(g, "passed") && has(g, "available") && has(g, "ratio"))),
  pass: "every group score has passed / available / ratio.",
  fail: "group scores must have passed / available / ratio.",
}]);

// 15–16. nearestSupport / nearestPressure.
pushCheck("15_nearestSupport", [{ ok: every(stocks, (s) => has(s, "nearestSupport")), pass: "every stock has nearestSupport.", fail: "every stock must have nearestSupport." }]);
pushCheck("16_nearestPressure", [{ ok: every(stocks, (s) => has(s, "nearestPressure")), pass: "every stock has nearestPressure.", fail: "every stock must have nearestPressure." }]);

// 17–20. volume fields + rule.
pushCheck("17_volumeRatio20", [{ ok: every(stocks, (s) => has(s, "volumeRatio20")), pass: "every stock has volumeRatio20.", fail: "every stock must have volumeRatio20." }]);
pushCheck("18_volumePercentile60", [{ ok: every(stocks, (s) => has(s, "volumePercentile60")), pass: "every stock has volumePercentile60.", fail: "every stock must have volumePercentile60." }]);
pushCheck("19_isVolumeConfirmed", [{ ok: every(stocks, (s) => has(s, "isVolumeConfirmed")), pass: "every stock has isVolumeConfirmed.", fail: "every stock must have isVolumeConfirmed." }]);
pushCheck("20_isVolumeConfirmed_rule", [{ ok: every(stocks, (s) => s.isVolumeConfirmed === (s.volumeRatio20 >= 1.2 || s.volumePercentile60 >= 0.7)), pass: "isVolumeConfirmed rule correct.", fail: "isVolumeConfirmed must equal volumeRatio20>=1.2 || volumePercentile60>=0.7." }]);

// 21–24. bias fields + rule.
pushCheck("21_bias20", [{ ok: every(stocks, (s) => has(s, "bias20")), pass: "every stock has bias20.", fail: "every stock must have bias20." }]);
pushCheck("22_bias20Percentile120", [{ ok: every(stocks, (s) => has(s, "bias20Percentile120")), pass: "every stock has bias20Percentile120.", fail: "every stock must have bias20Percentile120." }]);
pushCheck("23_isOverheated", [{ ok: every(stocks, (s) => has(s, "isOverheated")), pass: "every stock has isOverheated.", fail: "every stock must have isOverheated." }]);
pushCheck("24_isOverheated_rule", [{ ok: every(stocks, (s) => s.isOverheated === (s.bias20Percentile120 >= 0.9)), pass: "isOverheated rule correct.", fail: "isOverheated must equal bias20Percentile120>=0.9." }]);

// 25–27. dataStatus + both variants.
pushCheck("25_dataStatus", [{ ok: every(stocks, (s) => has(s, "dataStatus")), pass: "every stock has dataStatus.", fail: "every stock must have dataStatus." }]);
pushCheck("26_confirmed_close", [{ ok: stocks.some((s) => s.dataStatus === "confirmed_close"), pass: "at least one confirmed_close.", fail: "must include a confirmed_close." }]);
pushCheck("27_intraday_estimated", [{ ok: stocks.some((s) => s.dataStatus === "intraday_estimated"), pass: "at least one intraday_estimated.", fail: "must include an intraday_estimated." }]);

// 28–32. powerRating / effectiveAttack / strongButOverheated + rules.
pushCheck("28_powerRating", [{ ok: every(stocks, (s) => has(s, "powerRating")), pass: "every stock has powerRating.", fail: "every stock must have powerRating." }]);
pushCheck("29_effectiveAttack", [{ ok: every(stocks, (s) => has(s, "effectiveAttack")), pass: "every stock has effectiveAttack.", fail: "every stock must have effectiveAttack." }]);
pushCheck("30_effectiveAttack_rule", [{ ok: every(stocks, (s) => s.effectiveAttack === (s.previousPowerRatio <= 12 / 17 && s.powerRatio >= 13 / 17 && s.isVolumeConfirmed && !s.isOverheated)), pass: "effectiveAttack rule correct.", fail: "effectiveAttack rule must match spec." }]);
pushCheck("31_strongButOverheated", [{ ok: every(stocks, (s) => has(s, "strongButOverheated")), pass: "every stock has strongButOverheated.", fail: "every stock must have strongButOverheated." }]);
pushCheck("32_strongButOverheated_rule", [{ ok: every(stocks, (s) => s.strongButOverheated === (s.powerRatio >= 13 / 17 && s.isOverheated)), pass: "strongButOverheated rule correct.", fail: "strongButOverheated rule must match spec." }]);

// 33. deteriorationAlert new ratio rule.
pushCheck("33_deterioration_ratio_rule", [{ ok: every(stocks, (s) => s.deteriorationAlert === (s.horsepowerChange <= -3 || (s.previousPowerRatio >= 11 / 17 && s.powerRatio < 11 / 17))), pass: "deteriorationAlert uses the new ratio rule.", fail: "deteriorationAlert must use the new ratio rule." }]);

// 34–35. unavailable + reliabilityNote.
pushCheck("34_has_unavailable", [{ ok: stocks.some((s) => s.unavailableLines > 0), pass: "at least one stock has unavailableLines > 0.", fail: "at least one stock must have unavailableLines > 0." }]);
pushCheck("35_reliability_note", [{ ok: every(stocks, (s) => (s.unavailableLines > 0 ? s.reliabilityNote.length > 0 : true)), pass: "unavailableLines>0 → reliabilityNote non-empty.", fail: "unavailableLines>0 must carry a non-empty reliabilityNote." }]);

// 36–37. safety labels per stock.
pushCheck("36_notTradeAdvice", [{ ok: every(stocks, (s) => (s as unknown as Record<string, unknown>).notTradeAdvice === true), pass: "every stock has notTradeAdvice=true.", fail: "every stock must have notTradeAdvice=true." }]);
pushCheck("37_notEntrySignal", [{ ok: every(stocks, (s) => (s as unknown as Record<string, unknown>).notEntrySignal === true), pass: "every stock has notEntrySignal=true.", fail: "every stock must have notEntrySignal=true." }]);

// 38–44. doc positioning statements.
const DOC_STATEMENTS: Array<[string, string]> = [
  ["38", "Allen 17-Line Power Score v1.1"],
  ["39", "多週期趨勢強弱篩選器"],
  ["40", "不是完整交易系統"],
  ["41", "不是買賣指令"],
  ["42", "江江原版公式"],
  ["43", "價格動能參考線"],
  ["44", "量能確認與過熱濾網"],
];
for (const [id, term] of DOC_STATEMENTS) {
  pushCheck(`${id}_doc_${term}`, [{ ok: doc.includes(term), pass: `doc includes 「${term}」.`, fail: `doc must include 「${term}」.` }]);
}

// 45–47. War Room read model integration.
const rm = buildWarRoomReadModelContract({ mode: "PREMARKET", generatedAt: "2026-07-01T00:00:00.000Z" }) as unknown as Record<string, unknown>;
pushCheck("45_readmodel_items", [{ ok: Array.isArray(rm.horsepowerScannerItems) && (rm.horsepowerScannerItems as unknown[]).length > 0, pass: "read model includes horsepowerScannerItems.", fail: "read model must include horsepowerScannerItems." }]);
pushCheck("46_readmodel_summary", [{ ok: rm.horsepowerScannerSummary != null, pass: "read model includes horsepowerScannerSummary.", fail: "read model must include horsepowerScannerSummary." }]);
pushCheck("47_readmodel_fixture_version", [{ ok: rm.horsepowerScannerFixtureVersion === "V1_1", pass: "read model includes horsepowerScannerFixtureVersion V1_1.", fail: "read model must include horsepowerScannerFixtureVersion V1_1." }]);

// 48–50. War Room dashboard strings.
pushCheck("48_dashboard_title", [{ ok: dashboard.includes("17線馬力分數"), pass: "dashboard includes 17線馬力分數.", fail: "dashboard must include 17線馬力分數." }]);
pushCheck("49_dashboard_not_trade", [{ ok: dashboard.includes("非買賣建議"), pass: "dashboard includes 非買賣建議.", fail: "dashboard must include 非買賣建議." }]);
pushCheck("50_dashboard_not_entry", [{ ok: dashboard.includes("非進場訊號"), pass: "dashboard includes 非進場訊號.", fail: "dashboard must include 非進場訊號." }]);

// 51–59. red-line source scan + contract flags.
const rc = c as unknown as Record<string, unknown>;
function noTok(t: string): boolean { return !contractLower.includes(t); }
pushCheck("51_no_fetch", [{ ok: noTok("fetch(") && rc.realNetworkUsed === false && rc.liveFetchPerformed === false, pass: "no fetch / no real network.", fail: "must not fetch." }]);
pushCheck("52_no_supabase", [{ ok: noTok("@supabase") && noTok("createclient") && rc.supabaseConnected === false, pass: "no Supabase.", fail: "must not use Supabase." }]);
pushCheck("53_no_process_env", [{ ok: noTok("process.env") && rc.envReadPerformed === false, pass: "no process.env.", fail: "must not read process.env." }]);
pushCheck("54_no_db_write", [{ ok: noTok("insert(") && noTok("upsert(") && noTok("delete(") && noTok(".update(") && rc.databaseWritePerformed === false, pass: "no DB write.", fail: "must not write DB." }]);
pushCheck("55_no_api_route", [{ ok: noTok("/api/") && rc.apiRouteCreated === false && !fileExists(resolve("app/api/17-horsepower/route.ts")), pass: "no new API route.", fail: "must not add an API route." }]);
pushCheck("56_no_broker_api", [{ ok: noTok("broker_api") && rc.brokerApiUsed === false, pass: "no broker API.", fail: "must not use broker API." }]);
pushCheck("57_no_buysell", [{ ok: noTok("placeorder") && rc.buySellCommandGenerated === false && rc.isBuySignal === false && rc.isTradeCommand === false, pass: "no buy/sell command.", fail: "must not generate buy/sell command." }]);
pushCheck("58_no_auto_order", [{ ok: rc.autoOrderRequested === false && rc.isAutoOrder === false, pass: "no auto order.", fail: "must not auto order." }]);
pushCheck("59_no_production_switch", [{ ok: rc.productionDataSwitched === false && rc.productionTradingReady === false, pass: "no production data switch.", fail: "must not switch production data." }]);

// 60–62. standalone + safety-chain unchanged.
let safetyChain = "";
try { const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> }); safetyChain = pkg.scripts?.["test:safety-chain"] ?? ""; } catch { safetyChain = ""; }
let totalChecks = -1;
try { totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-01T00:00:00.000Z" }).result.totalChecks; } catch { totalChecks = -1; }
pushCheck("60_script_standalone", [{ ok: pkgBody != null && pkgBody.includes('"test:17-horsepower-scanner": "node --require ./scripts/register-typescript.cjs ./scripts/validate-17-horsepower-scanner.ts"'), pass: "package.json has test:17-horsepower-scanner.", fail: "package.json must have test:17-horsepower-scanner." }]);
pushCheck("61_not_in_safety_chain", [{ ok: safetyChain.length > 0 && !safetyChain.includes("test:17-horsepower-scanner"), pass: "17-horsepower guard NOT in test:safety-chain.", fail: "17-horsepower guard must NOT be in test:safety-chain." }]);
pushCheck("62_safety_chain_22", [{ ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` }]);

// Extra sanity — scores still 0..17, candidate tags cover 主升段/逢低候選/排除, handoff present.
pushCheck("63_scores_0_17", [{ ok: every(stocks, (s) => Number.isInteger(s.horsepowerScore) && s.horsepowerScore >= 0 && s.horsepowerScore <= 17), pass: "horsepowerScore 0..17 retained.", fail: "horsepowerScore must stay 0..17." }]);
const tags = new Set(stocks.map((s) => s.candidateTag));
pushCheck("64_candidate_tags", [{ ok: tags.has("主升段") && tags.has("逢低候選") && tags.has("排除"), pass: "candidate tags include 主升段 / 逢低候選 / 排除.", fail: "candidate tags must include 主升段 / 逢低候選 / 排除." }]);
pushCheck("65_handoff_present", [{ ok: fileExists(resolve(HANDOFF_REL)) && (readFile(resolve(HANDOFF_REL)) ?? "").includes("Project Handoff Summary"), pass: "project handoff summary present.", fail: "project handoff summary must remain present." }]);

// ---------------------------------------------------------------------------
const overallStatus = combineStatus(checks.map((c2) => c2.status));
const issues = checks.flatMap((c2) => c2.details.filter((d) => d.startsWith("FAIL")));
console.log(JSON.stringify({
  status: overallStatus,
  spec: "ALLEN_17_LINE_POWER_SCORE_V1_1",
  model_version: (c as unknown as Record<string, unknown>).modelVersion,
  stocks: stocks.map((s) => ({ symbol: s.symbol, score: s.horsepowerScore, powerRatio: Number(s.powerRatio.toFixed(3)), weightedPower: Number(s.weightedPower.toFixed(1)), rating: s.powerRating, tag: s.candidateTag, dataStatus: s.dataStatus, effectiveAttack: s.effectiveAttack, strongButOverheated: s.strongButOverheated })),
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((c2) => c2.status === "PASS").length,
  failed_checks: checks.filter((c2) => c2.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((c2) => [c2.name, c2.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
}, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
