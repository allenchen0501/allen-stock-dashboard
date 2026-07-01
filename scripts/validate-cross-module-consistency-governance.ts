/**
 * Cross-Module Consistency & Candidate Ranking Governance Validator — fixture-only.
 *
 * Verifies the governance contract (deterministic, fixture-only, red-line flags, the
 * required conflict/hard-gate/ranking scenarios), the spec doc sections, the War Room
 * read-model / UI integration, and that this guard + related scanners stay standalone
 * (off the safety chain, which stays 22).
 *
 * NO network, NO smoke, NO Supabase, NO env read, NO provider change. Standalone.
 * Exit 0 → PASS/WARNING, Exit 1 → FAIL.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const govModule = require("../use-cases/war-room/build-cross-module-consistency-governance-contract") as typeof import("../use-cases/war-room/build-cross-module-consistency-governance-contract");
const readModelModule = require("../use-cases/war-room/build-war-room-read-model-contract") as typeof import("../use-cases/war-room/build-war-room-read-model-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildCrossModuleConsistencyGovernanceContract } = govModule;
const { buildWarRoomReadModelContract } = readModelModule;
const { buildSafetyChainCiGuardContract } = guardModule;

type CheckStatus = "PASS" | "WARNING" | "FAIL";
interface CheckResult { name: string; status: CheckStatus; details: string[]; }

function resolve(...p: string[]): string { return path.resolve(process.cwd(), ...p); }
function readFile(p: string): string | null { try { return fs.readFileSync(p, "utf8"); } catch { return null; } }
function fileExists(p: string): boolean { try { return fs.statSync(p).isFile(); } catch { return false; } }
function stripComments(s: string): string { return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); }
function combineStatus(a: CheckStatus[]): CheckStatus { if (a.some((s) => s === "FAIL")) return "FAIL"; if (a.some((s) => s === "WARNING")) return "WARNING"; return "PASS"; }

const checks: CheckResult[] = [];
function pushCheck(name: string, conds: Array<{ ok: boolean; pass: string; fail: string }>): void {
  const details: string[] = [];
  let status: CheckStatus = "PASS";
  for (const c of conds) { if (c.ok) details.push(`PASS  ${c.pass}`); else { details.push(`FAIL  ${c.fail}`); status = "FAIL"; } }
  checks.push({ name, status, details });
}
const CJK = /[一-鿿]/;
function arraysEqual(a: readonly unknown[], b: readonly unknown[]): boolean { return a.length === b.length && a.every((v, i) => v === b[i]); }

const DOC_REL = "docs/cross-module-consistency-ranking-governance.md";
const CONTRACT_REL = "use-cases/war-room/build-cross-module-consistency-governance-contract.ts";
const DASHBOARD_REL = "components/war-room-dashboard.tsx";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const doc = readFile(resolve(DOC_REL)) ?? "";
const contractRaw = readFile(resolve(CONTRACT_REL)) ?? "";
const contractLower = stripComments(contractRaw).toLowerCase();
const dashboard = readFile(resolve(DASHBOARD_REL)) ?? "";
const handoff = readFile(resolve(HANDOFF_REL)) ?? "";
const readme = readFile(resolve(README_REL)) ?? "";
const pkgBody = readFile(resolve(PKG_REL));

const a = buildCrossModuleConsistencyGovernanceContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const b = buildCrossModuleConsistencyGovernanceContract({ generatedAt: "2026-07-01T00:00:00.000Z" });
const items = a.items;
const rc = a as unknown as Record<string, unknown>;
function noTok(t: string): boolean { return !contractLower.includes(t); }
function every<T>(arr: T[], f: (x: T) => boolean): boolean { return arr.every(f); }

// 1–2.
pushCheck("01_doc_exists", [{ ok: fileExists(resolve(DOC_REL)), pass: "governance doc exists.", fail: "governance doc must exist." }]);
pushCheck("02_contract_exists", [{ ok: fileExists(resolve(CONTRACT_REL)), pass: "governance contract exists.", fail: "governance contract must exist." }]);
// 3.
pushCheck("03_deterministic", [{ ok: JSON.stringify(a) === JSON.stringify(b), pass: "contract deterministic.", fail: "contract must be deterministic." }]);
// 4–14.
pushCheck("04_fixture_only", [{ ok: rc.realNetworkUsed === false && rc.liveFetchPerformed === false && rc.productionTradingReady === false, pass: "fixture-only (no real network / not production ready).", fail: "contract must be fixture-only." }]);
pushCheck("05_no_real_network", [{ ok: rc.realNetworkUsed === false, pass: "realNetworkUsed=false.", fail: "realNetworkUsed must be false." }]);
pushCheck("06_no_fetch", [{ ok: noTok("fetch("), pass: "no fetch(.", fail: "must not fetch." }]);
pushCheck("07_no_supabase", [{ ok: noTok("@supabase") && noTok("createclient") && rc.supabaseConnected === false, pass: "no Supabase.", fail: "must not use Supabase." }]);
pushCheck("08_no_process_env", [{ ok: noTok("process.env") && rc.envReadPerformed === false, pass: "no process.env.", fail: "must not read process.env." }]);
pushCheck("09_no_db_write", [{ ok: noTok("insert(") && noTok("upsert(") && noTok("delete(") && noTok(".update(") && rc.databaseWritePerformed === false, pass: "no DB write.", fail: "must not write DB." }]);
pushCheck("10_no_api_route", [{ ok: noTok("/api/") && rc.apiRouteCreated === false && !fileExists(resolve("app/api/cross-module/route.ts")), pass: "no new API route.", fail: "must not add an API route." }]);
pushCheck("11_no_broker", [{ ok: noTok("broker_api") && rc.brokerApiUsed === false, pass: "no broker API.", fail: "must not use broker API." }]);
pushCheck("12_no_buysell", [{ ok: noTok("placeorder") && rc.buySellCommandGenerated === false, pass: "no buy/sell command.", fail: "must not generate buy/sell command." }]);
pushCheck("13_no_auto_order", [{ ok: rc.autoOrderRequested === false, pass: "no auto order.", fail: "must not auto order." }]);
pushCheck("14_no_production_switch", [{ ok: rc.productionDataSwitched === false && rc.productionTradingReady === false, pass: "no production data switch.", fail: "must not switch production data." }]);
// 15–16.
pushCheck("15_approved_symbols", [{ ok: arraysEqual(a.liveFetchBoundary.approvedLiveFetchSymbols, ["3019"]), pass: "approvedLiveFetchSymbols exactly [3019].", fail: "approvedLiveFetchSymbols must be exactly [3019]." }]);
pushCheck("16_approved_channels", [{ ok: arraysEqual(a.liveFetchBoundary.approvedChannels, ["tse_3019.tw"]), pass: "approvedChannels exactly [tse_3019.tw].", fail: "approvedChannels must be exactly [tse_3019.tw]." }]);
// 17.
pushCheck("17_governance_version", [{ ok: a.governanceVersion === "V1", pass: "governanceVersion V1.", fail: "governanceVersion must be V1." }]);
// 18.
pushCheck("18_items_min_5", [{ ok: items.length >= 5, pass: `items length ${items.length} (>=5).`, fail: `items must be >= 5 (got ${items.length}).` }]);
// 19–24.
pushCheck("19_conflict_none", [{ ok: items.some((i) => i.conflictLevel === "none"), pass: "has conflictLevel none.", fail: "must include conflictLevel none." }]);
pushCheck("20_conflict_warning", [{ ok: items.some((i) => i.conflictLevel === "warning"), pass: "has conflictLevel warning.", fail: "must include conflictLevel warning." }]);
pushCheck("21_conflict_critical", [{ ok: items.some((i) => i.conflictLevel === "critical"), pass: "has conflictLevel critical.", fail: "must include conflictLevel critical." }]);
pushCheck("22_gate_excluded", [{ ok: items.some((i) => i.hardGateStatus === "excluded"), pass: "has hardGateStatus excluded.", fail: "must include hardGateStatus excluded." }]);
pushCheck("23_ranking_true", [{ ok: items.some((i) => i.rankingEligible === true), pass: "has rankingEligible true.", fail: "must include rankingEligible true." }]);
pushCheck("24_ranking_false", [{ ok: items.some((i) => i.rankingEligible === false), pass: "has rankingEligible false.", fail: "must include rankingEligible false." }]);
// 25–29 scenario cases.
const weak = (s: string): boolean => s === "weak" || s === "avoid";
pushCheck("25_allenA_17weak", [{ ok: items.some((i) => i.allenScoreSignal === "strong" && weak(i.seventeenLineSignal)), pass: "has Allen A but 17-line weak case.", fail: "must include Allen A but 17-line weak case." }]);
pushCheck("26_allenA_no_touch", [{ ok: items.some((i) => i.allenScoreSignal === "strong" && i.positionStrategySignal === "no_touch"), pass: "has Allen A but No Touch case.", fail: "must include Allen A but No Touch case." }]);
pushCheck("27_17strong_rr_insufficient", [{ ok: items.some((i) => i.seventeenLineSignal === "strong" && i.technicalRiskRewardSignal === "data_insufficient"), pass: "has 17 strong but Technical+RR DATA_INSUFFICIENT case.", fail: "must include 17 strong but RR data_insufficient case." }]);
pushCheck("28_ksd_pass_17weak", [{ ok: items.some((i) => i.kouSanDiSignal === "pass" && weak(i.seventeenLineSignal)), pass: "has 扣三低 pass but 17-line weak case.", fail: "must include 扣三低 pass but 17-line weak case." }]);
pushCheck("29_aligned_strong", [{ ok: items.some((i) => i.seventeenLineSignal === "strong" && i.kouSanDiSignal === "pass" && i.technicalRiskRewardSignal === "qualified" && i.conflictLevel === "none"), pass: "has aligned strong case.", fail: "must include aligned strong case." }]);
// 30–34.
pushCheck("30_label_chinese", [{ ok: every(items, (i) => CJK.test(i.finalObservationLabelZh)), pass: "every finalObservationLabelZh is Chinese.", fail: "every finalObservationLabelZh must be Chinese." }]);
pushCheck("31_safetyNote_chinese", [{ ok: every(items, (i) => CJK.test(i.safetyNoteZh)), pass: "every safetyNoteZh is Chinese.", fail: "every safetyNoteZh must be Chinese." }]);
pushCheck("32_notTradeAdvice", [{ ok: every(items, (i) => (i as unknown as Record<string, unknown>).notTradeAdvice === true), pass: "every item notTradeAdvice=true.", fail: "every item must have notTradeAdvice=true." }]);
pushCheck("33_notEntrySignal", [{ ok: every(items, (i) => (i as unknown as Record<string, unknown>).notEntrySignal === true), pass: "every item notEntrySignal=true.", fail: "every item must have notEntrySignal=true." }]);
pushCheck("34_notAutoOrder", [{ ok: every(items, (i) => (i as unknown as Record<string, unknown>).notAutoOrder === true), pass: "every item notAutoOrder=true.", fail: "every item must have notAutoOrder=true." }]);
// 35–46 doc phrases.
const DOC_TERMS: Array<[string, string]> = [
  ["35", "Cross-Module Consistency"], ["36", "Candidate Ranking Governance"], ["37", "Hard Gates"],
  ["38", "Weighted Observation Score"], ["39", "Risk Reward Governance"], ["40", "continuous range"],
  ["41", "setupWinRate"], ["42", "expectedValueStatus"], ["43", "Technical Score Collinearity Guard"],
  ["44", "Backtest / Calibration Boundary"], ["45", "no statistical win rate yet"], ["46", "not buy/sell instruction"],
];
for (const [id, term] of DOC_TERMS) pushCheck(`${id}_doc_${term.replace(/[^a-z0-9]/gi, "_")}`, [{ ok: doc.includes(term), pass: `doc includes 「${term}」.`, fail: `doc must include 「${term}」.` }]);
// 47–49 read model.
const rm = buildWarRoomReadModelContract({ mode: "PREMARKET", generatedAt: "2026-07-01T00:00:00.000Z" }) as unknown as Record<string, unknown>;
pushCheck("47_rm_items", [{ ok: Array.isArray(rm.crossModuleConsistencyItems) && (rm.crossModuleConsistencyItems as unknown[]).length > 0, pass: "read model includes crossModuleConsistencyItems.", fail: "read model must include crossModuleConsistencyItems." }]);
pushCheck("48_rm_summary", [{ ok: rm.crossModuleConsistencySummary != null, pass: "read model includes crossModuleConsistencySummary.", fail: "read model must include crossModuleConsistencySummary." }]);
pushCheck("49_rm_fixture_version", [{ ok: rm.crossModuleConsistencyFixtureVersion === "V1", pass: "read model includes crossModuleConsistencyFixtureVersion V1.", fail: "read model must include crossModuleConsistencyFixtureVersion V1." }]);
// 50–53 dashboard strings.
pushCheck("50_dashboard_title", [{ ok: dashboard.includes("跨模組一致性"), pass: "dashboard includes 跨模組一致性.", fail: "dashboard must include 跨模組一致性." }]);
pushCheck("51_dashboard_not_trade", [{ ok: dashboard.includes("非買賣建議"), pass: "dashboard includes 非買賣建議.", fail: "dashboard must include 非買賣建議." }]);
pushCheck("52_dashboard_not_entry", [{ ok: dashboard.includes("非進場訊號"), pass: "dashboard includes 非進場訊號.", fail: "dashboard must include 非進場訊號." }]);
pushCheck("53_dashboard_not_auto", [{ ok: dashboard.includes("非自動下單"), pass: "dashboard includes 非自動下單.", fail: "dashboard must include 非自動下單." }]);
// 54–57 standalone + chain.
let safetyChain = "";
try { const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> }); safetyChain = pkg.scripts?.["test:safety-chain"] ?? ""; } catch { safetyChain = ""; }
let totalChecks = -1;
try { totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-01T00:00:00.000Z" }).result.totalChecks; } catch { totalChecks = -1; }
pushCheck("54_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:cross-module-consistency-governance": "node --require ./scripts/register-typescript.cjs ./scripts/validate-cross-module-consistency-governance.ts"'), pass: "package.json has the script.", fail: "package.json must add the script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:cross-module-consistency-governance"), pass: "guard NOT in test:safety-chain.", fail: "guard must NOT be in test:safety-chain." },
]);
pushCheck("55_safety_chain_22", [{ ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` }]);
pushCheck("56_hp_standalone", [{ ok: !safetyChain.includes("test:17-horsepower-scanner"), pass: "17-horsepower validator remains standalone.", fail: "17-horsepower validator must remain standalone." }]);
pushCheck("57_ksd_standalone", [{ ok: !safetyChain.includes("test:kou-san-di-scanner"), pass: "kou-san-di validator remains standalone.", fail: "kou-san-di validator must remain standalone." }]);
// 58–59 handoff + completion rule.
pushCheck("58_handoff_present", [{ ok: fileExists(resolve(HANDOFF_REL)) && handoff.includes("Project Handoff Summary"), pass: "project handoff summary present.", fail: "project handoff summary must remain present." }]);
pushCheck("59_completion_rule", [{ ok: readme.includes("future completed version must include Project Handoff Summary"), pass: "README states the per-version Project Handoff Summary rule.", fail: "README must state the per-version Project Handoff Summary rule." }]);

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
console.log(JSON.stringify({
  status: overallStatus,
  spec: "CROSS_MODULE_CONSISTENCY_GOVERNANCE",
  governance_version: a.governanceVersion,
  summary: a.summary,
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((c) => c.status === "PASS").length,
  failed_checks: checks.filter((c) => c.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((c) => [c.name, c.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
}, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
