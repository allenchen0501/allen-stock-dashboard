/**
 * 3019 Approved Live Quote Production Manual Smoke Verification Validator — static.
 *
 * Verifies the production manual-smoke evidence: the smoke report (deployment identity,
 * five test cases, no-price-fabrication + safe-UI + not-in-safety-chain statements), the
 * route boundary (3019-only, manual-only, rejects without fetch), the read-only response
 * shape, the War Room UI (manual-only trigger, default page load no fetch, safe states),
 * and that this guard + related validators stay standalone (safety-chain stays 22).
 * approved live-fetch symbols remain exactly ["3019"].
 *
 * NO real network, NO smoke run here, NO Supabase, NO env read, NO provider change.
 * Standalone. Exit 0 → PASS/WARNING, Exit 1 → FAIL.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const contractModule = require("../use-cases/war-room/build-approved-live-quote-3019-mvp-contract") as typeof import("../use-cases/war-room/build-approved-live-quote-3019-mvp-contract");
const providerModule = require("../services/market-data/twse-tpex-verification-provider") as typeof import("../services/market-data/twse-tpex-verification-provider");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const {
  buildApproved3019LiveQuoteMvpContract,
  mapApproved3019LiveQuoteResponse,
  buildApproved3019RejectionResponse,
} = contractModule;
const { buildTwseTpexScaffoldCandidate } = providerModule;
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

// ---------------------------------------------------------------------------
// Paths + bodies
// ---------------------------------------------------------------------------

const REPORT_REL = "docs/approved-live-quote-3019-production-smoke-report.md";
const CONTRACT_REL = "use-cases/war-room/build-approved-live-quote-3019-mvp-contract.ts";
const ROUTE_REL = "app/api/war-room/approved-live-quote/route.ts";
const DASHBOARD_REL = "components/war-room-dashboard.tsx";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const report = readFile(resolve(REPORT_REL)) ?? "";
const contractRaw = readFile(resolve(CONTRACT_REL)) ?? "";
const contractLower = stripComments(contractRaw).toLowerCase();
const routeRaw = readFile(resolve(ROUTE_REL)) ?? "";
const routeLower = stripComments(routeRaw).toLowerCase();
const dashboard = readFile(resolve(DASHBOARD_REL)) ?? "";
const handoff = readFile(resolve(HANDOFF_REL)) ?? "";
const readme = readFile(resolve(README_REL)) ?? "";
const pkgBody = readFile(resolve(PKG_REL));

const runtimeCombinedLower = (stripComments(contractRaw) + "\n" + stripComments(routeRaw) + "\n" + dashboard).toLowerCase();

const contract = buildApproved3019LiveQuoteMvpContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const cc = contract as unknown as Record<string, unknown>;
const fixedNow = (): Date => new Date("2026-07-02T00:00:00.000Z");

const LIVE_CANDIDATE = {
  symbol: "3019", market: "TW", providerId: "mixed-public",
  providerName: "fixture", price: 140, open: 143.5, high: 144.5, low: 140,
  previousClose: 142.5, volume: 3314,
  sourceTimestamp: "2026-07-01T06:30:00.000Z", receivedAt: "2026-07-01T21:24:40.621Z",
  isRealData: true, isConnected: true, isDisabled: false,
  verificationStatus: "LIVE_FETCH_DRY_RUN",
  operationalUseAllowed: false, buySellCommandGenerated: false, autoOrderRequested: false,
} as unknown as Parameters<typeof mapApproved3019LiveQuoteResponse>[0];

const liveResp = mapApproved3019LiveQuoteResponse(LIVE_CANDIDATE, { now: fixedNow });
const fallbackResp = mapApproved3019LiveQuoteResponse(buildTwseTpexScaffoldCandidate("3019"), { now: fixedNow });
const timeoutResp = mapApproved3019LiveQuoteResponse(null, { now: fixedNow, timedOut: true });
const sourceErrResp = mapApproved3019LiveQuoteResponse(null, { now: fixedNow });
const rejectResp = buildApproved3019RejectionResponse({ now: fixedNow, reasonZh: "非核准代號：僅核准 3019（亞光）。" });

function noTok(body: string, t: string): boolean { return !body.includes(t); }

// Extract the war-room useEffect body (page-load fetch) to prove it never fetches the
// approved-live-quote endpoint automatically.
function warRoomEffectBody(): string {
  const start = dashboard.indexOf("useEffect(() => {");
  if (start < 0) return "";
  const end = dashboard.indexOf("[mode]);", start);
  return end < 0 ? dashboard.slice(start) : dashboard.slice(start, end);
}
const effectBody = warRoomEffectBody();

// ---------------------------------------------------------------------------
// 1–12. Smoke report
// ---------------------------------------------------------------------------
pushCheck("01_report_exists", [{ ok: fileExists(resolve(REPORT_REL)), pass: "smoke report exists.", fail: "smoke report must exist." }]);
pushCheck("02_report_commit", [{ ok: report.includes("36a7220"), pass: "report includes commit 36a7220.", fail: "report must include commit 36a7220." }]);
pushCheck("03_report_deployment", [{ ok: report.includes("dpl_FWMFvQd4poKngGWHBsiYTecAXdMx"), pass: "report includes deployment id.", fail: "report must include deployment dpl_FWMFvQd4poKngGWHBsiYTecAXdMx." }]);
pushCheck("04_report_endpoint", [{ ok: report.includes("/api/war-room/approved-live-quote"), pass: "report includes endpoint.", fail: "report must include the endpoint path." }]);
pushCheck("05_report_case1", [{ ok: report.includes("Case 1") && report.includes("symbol=3019&mode=manual"), pass: "report includes Case 1 approved manual request.", fail: "report must include Case 1 approved manual request." }]);
pushCheck("06_report_case2", [{ ok: report.includes("Case 2") && report.includes("symbol=4966"), pass: "report includes Case 2 non-approved symbol rejected.", fail: "report must include Case 2 non-approved symbol rejected." }]);
pushCheck("07_report_case3", [{ ok: report.includes("Case 3"), pass: "report includes Case 3 missing manual mode rejected.", fail: "report must include Case 3 missing manual mode rejected." }]);
pushCheck("08_report_case4", [{ ok: report.includes("Case 4") && report.includes("mode=auto"), pass: "report includes Case 4 auto mode rejected.", fail: "report must include Case 4 auto mode rejected." }]);
pushCheck("09_report_case5", [{ ok: report.includes("Case 5") && report.includes("default page load"), pass: "report includes Case 5 default page load no fetch.", fail: "report must include Case 5 default page load no fetch." }]);
pushCheck("10_report_no_fabrication", [{ ok: report.includes("不得假造價格"), pass: "report states no price fabrication.", fail: "report must state no price fabrication (不得假造價格)." }]);
pushCheck("11_report_safe_ui", [{ ok: report.includes("fallback / timeout / source_error 不得讓 UI 崩潰"), pass: "report states fallback/timeout/source_error must not crash UI.", fail: "report must state fallback/timeout/source_error must not crash UI." }]);
pushCheck("12_report_not_in_chain", [{ ok: report.includes("manual smoke not in safety-chain"), pass: "report states manual smoke not in safety-chain.", fail: "report must state manual smoke not in safety-chain." }]);

// ---------------------------------------------------------------------------
// 13–17. Route boundary
// ---------------------------------------------------------------------------
pushCheck("13_route_exists", [{ ok: fileExists(resolve(ROUTE_REL)), pass: "route exists.", fail: "route must exist." }]);
pushCheck("14_route_symbol_3019", [{ ok: routeRaw.includes("APPROVED_LIVE_QUOTE_SYMBOL") && routeRaw.includes("!==") && routeLower.includes("3019"), pass: "route only allows symbol 3019.", fail: "route must only allow symbol 3019." }]);
pushCheck("15_route_mode_manual", [{ ok: routeRaw.includes("'manual'") || routeRaw.includes('"manual"'), pass: "route requires mode=manual.", fail: "route must require mode=manual." }]);
{
  const idxReject = routeRaw.indexOf("buildApproved3019RejectionResponse");
  const idxFetch = routeRaw.indexOf("getTwseTpexLimitedLiveFetchCandidate");
  pushCheck("16_route_reject_symbol_no_fetch", [
    { ok: idxReject >= 0, pass: "route uses rejection response.", fail: "route must use rejection response for non-approved symbol." },
    { ok: idxReject >= 0 && idxFetch >= 0 && idxReject < idxFetch, pass: "rejection precedes any live fetch (no fetch on reject).", fail: "rejection must precede any live fetch (reject without fetch)." },
    { ok: routeRaw.includes("symbol !== APPROVED_LIVE_QUOTE_SYMBOL"), pass: "route rejects non-approved symbol.", fail: "route must reject non-approved symbol." },
  ]);
}
pushCheck("17_route_reject_mode_no_fetch", [
  { ok: routeRaw.includes("mode !== 'manual'") || routeRaw.includes('mode !== "manual"'), pass: "route rejects non-manual mode.", fail: "route must reject non-manual mode." },
  { ok: rejectResp.requestPerformed === false && rejectResp.quote.price === null, pass: "rejection performs no fetch and has null price.", fail: "rejection must perform no fetch and have null price." },
]);

// ---------------------------------------------------------------------------
// 18–24. Read-only response shape
// ---------------------------------------------------------------------------
pushCheck("18_shape_sourceProvider", [{ ok: liveResp.sourceProvider === "TWSE_TPEX", pass: "response includes sourceProvider=TWSE_TPEX.", fail: "response must include sourceProvider." }]);
pushCheck("19_shape_approvedChannel", [{ ok: liveResp.approvedChannel === "tse_3019.tw", pass: "response includes approvedChannel=tse_3019.tw.", fail: "response must include approvedChannel." }]);
pushCheck("20_shape_sourceTimestamp", [{ ok: "sourceTimestamp" in liveResp.quote && liveResp.quote.sourceTimestamp === "2026-07-01T06:30:00.000Z" && sourceErrResp.quote.sourceTimestamp === null, pass: "quote includes sourceTimestamp (null when unavailable).", fail: "quote must include sourceTimestamp." }]);
pushCheck("21_shape_fetchedAt", [{ ok: typeof liveResp.quote.fetchedAt === "string" && liveResp.quote.fetchedAt.length > 0, pass: "quote includes fetchedAt.", fail: "quote must include fetchedAt." }]);
pushCheck("22_shape_dataStatus", [{ ok: liveResp.dataStatus === "live_verified" && fallbackResp.dataStatus === "fallback" && timeoutResp.dataStatus === "timeout" && sourceErrResp.dataStatus === "source_error" && rejectResp.dataStatus === "not_available", pass: "dataStatus covers all five states.", fail: "dataStatus must be produced correctly for each case." }]);
pushCheck("23_shape_uiStatusZh", [{ ok: typeof liveResp.uiStatusZh === "string" && CJK.test(liveResp.uiStatusZh), pass: "response includes Chinese uiStatusZh.", fail: "response must include Chinese uiStatusZh." }]);
pushCheck("24_shape_safetyNoteZh", [{ ok: liveResp.safetyNoteZh.includes("非買賣建議") && liveResp.safetyNoteZh.includes("非進場訊號") && liveResp.safetyNoteZh.includes("非自動下單"), pass: "response safetyNoteZh states 非買賣建議/非進場訊號/非自動下單.", fail: "response safetyNoteZh must state 非買賣建議/非進場訊號/非自動下單." }]);

// ---------------------------------------------------------------------------
// 25–30. War Room UI
// ---------------------------------------------------------------------------
pushCheck("25_ui_refresh_button", [{ ok: dashboard.includes("手動刷新 3019"), pass: "dashboard includes 手動刷新 3019.", fail: "dashboard must include 手動刷新 3019." }]);
pushCheck("26_ui_no_auto_fetch", [
  { ok: dashboard.includes("onClick={refreshApprovedLiveQuote}"), pass: "live quote fetched only via manual onClick.", fail: "live quote must be fetched only via manual onClick." },
  { ok: effectBody.length > 0 && !effectBody.includes("approved-live-quote"), pass: "page-load useEffect never fetches approved-live-quote.", fail: "page-load useEffect must not fetch approved-live-quote." },
]);
pushCheck("27_ui_states", [
  { ok: dashboard.includes("liveQuoteLoading"), pass: "dashboard has loading state.", fail: "dashboard must have a loading state." },
  { ok: dashboard.includes("liveQuoteError") && dashboard.includes("安全 fallback"), pass: "dashboard has error/fallback state.", fail: "dashboard must have an error/fallback state." },
  { ok: dashboard.includes("liveQuote &&"), pass: "dashboard has success render state.", fail: "dashboard must have a success render state." },
]);
pushCheck("28_ui_not_trade", [{ ok: dashboard.includes("非買賣建議"), pass: "dashboard includes 非買賣建議.", fail: "dashboard must include 非買賣建議." }]);
pushCheck("29_ui_not_entry", [{ ok: dashboard.includes("非進場訊號"), pass: "dashboard includes 非進場訊號.", fail: "dashboard must include 非進場訊號." }]);
pushCheck("30_ui_not_auto", [{ ok: dashboard.includes("非自動下單"), pass: "dashboard includes 非自動下單.", fail: "dashboard must include 非自動下單." }]);

// ---------------------------------------------------------------------------
// 31–32. Approved scope
// ---------------------------------------------------------------------------
pushCheck("31_approved_symbols", [{ ok: arraysEqual(contract.approvedLiveFetchSymbols, ["3019"]), pass: "approvedLiveFetchSymbols exactly [3019].", fail: "approvedLiveFetchSymbols must be exactly [3019]." }]);
pushCheck("32_approved_channels", [{ ok: arraysEqual(contract.approvedChannels, ["tse_3019.tw"]), pass: "approvedChannels exactly [tse_3019.tw].", fail: "approvedChannels must be exactly [tse_3019.tw]." }]);

// ---------------------------------------------------------------------------
// 33–46. Red-line boundary (runtime code, not the report/doc)
// ---------------------------------------------------------------------------
for (const [id, sym] of [["33", "4966"], ["34", "5347"], ["35", "4979"], ["36", "2455"]] as const) {
  pushCheck(`${id}_no_${sym}`, [{ ok: !runtimeCombinedLower.includes(sym), pass: `no ${sym} as approved symbol.`, fail: `must not add ${sym} as an approved symbol.` }]);
}
pushCheck("37_no_yahoo", [{ ok: noTok(contractLower, "yahoo") && noTok(routeLower, "yahoo"), pass: "no Yahoo.", fail: "must not add Yahoo." }]);
pushCheck("38_no_new_provider", [{ ok: routeLower.includes("twse-tpex-verification-provider") && noTok(routeLower, "yahoo-readonly-provider"), pass: "only the approved provider is used.", fail: "must not import another provider." }]);
pushCheck("39_no_supabase", [{ ok: noTok(contractLower, "@supabase") && noTok(contractLower, "createclient") && noTok(routeLower, "@supabase") && noTok(routeLower, "createclient") && cc.supabaseConnected === false, pass: "no Supabase.", fail: "must not use Supabase." }]);
pushCheck("40_no_process_env", [{ ok: noTok(contractLower, "process.env") && noTok(routeLower, "process.env") && cc.envReadPerformed === false, pass: "no process.env.", fail: "must not read process.env." }]);
pushCheck("41_no_db_write", [{ ok: noTok(contractLower, "insert(") && noTok(contractLower, "upsert(") && noTok(contractLower, ".update(") && noTok(routeLower, "insert(") && noTok(routeLower, "upsert(") && noTok(routeLower, ".update(") && cc.databaseWritePerformed === false, pass: "no DB write.", fail: "must not write DB." }]);
pushCheck("42_no_broker", [{ ok: noTok(contractLower, "broker_api") && noTok(contractLower, "brokerapi") && noTok(routeLower, "broker_api") && noTok(routeLower, "brokerapi") && cc.brokerConnected === false, pass: "no broker API.", fail: "must not use broker API." }]);
pushCheck("43_no_buysell", [{ ok: noTok(contractLower, "placeorder") && noTok(routeLower, "placeorder") && cc.buySellCommandGenerated === false, pass: "no buy/sell command.", fail: "must not generate buy/sell command." }]);
pushCheck("44_no_auto_order", [{ ok: cc.autoOrderRequested === false && (rejectResp as unknown as Record<string, unknown>).autoOrderRequested === false && (liveResp as unknown as Record<string, unknown>).autoOrderRequested === false, pass: "no auto order.", fail: "must not auto order." }]);
pushCheck("45_no_production_switch", [{ ok: cc.productionDataSwitchAllowed === false, pass: "no production data switch.", fail: "must not allow production data switch." }]);
pushCheck("46_no_portfolio_switch", [{ ok: cc.portfolioApiSwitched === false && noTok(contractLower, "/api/portfolio") && noTok(routeLower, "/api/portfolio"), pass: "no /api/portfolio switch.", fail: "must not switch /api/portfolio." }]);

// ---------------------------------------------------------------------------
// 47–52. Standalone + chain integrity + handoff
// ---------------------------------------------------------------------------
let safetyChain = "";
try { const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> }); safetyChain = pkg.scripts?.["test:safety-chain"] ?? ""; } catch { safetyChain = ""; }
let totalChecks = -1;
try { totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-02T00:00:00.000Z" }).result.totalChecks; } catch { totalChecks = -1; }

pushCheck("47_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:approved-live-quote-3019-production-smoke": "node --require ./scripts/register-typescript.cjs ./scripts/validate-approved-live-quote-3019-production-smoke.ts"'), pass: "package.json has the script.", fail: "package.json must add the script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:approved-live-quote-3019-production-smoke"), pass: "guard NOT in test:safety-chain.", fail: "guard must NOT be in test:safety-chain." },
]);
pushCheck("48_safety_chain_22", [{ ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` }]);
pushCheck("49_mvp_standalone", [{ ok: !safetyChain.includes("test:approved-live-quote-3019-mvp"), pass: "MVP validator remains standalone.", fail: "MVP validator must remain standalone." }]);
pushCheck("50_cross_module_standalone", [{ ok: !safetyChain.includes("test:cross-module-consistency-governance"), pass: "cross-module governance validator remains standalone.", fail: "cross-module governance validator must remain standalone." }]);
pushCheck("51_handoff_present", [{ ok: fileExists(resolve(HANDOFF_REL)) && handoff.includes("Project Handoff Summary"), pass: "project handoff summary present.", fail: "project handoff summary must remain present." }]);
pushCheck("52_completion_rule", [{ ok: readme.includes("future completed version must include Project Handoff Summary"), pass: "README states the per-version Project Handoff Summary rule.", fail: "README must state the per-version Project Handoff Summary rule." }]);

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
console.log(JSON.stringify({
  status: overallStatus,
  spec: "APPROVED_LIVE_QUOTE_3019_PRODUCTION_SMOKE",
  production_commit: "36a7220",
  production_deployment: "dpl_FWMFvQd4poKngGWHBsiYTecAXdMx",
  approved_symbols: contract.approvedLiveFetchSymbols,
  approved_channels: contract.approvedChannels,
  safety_chain_total_checks: totalChecks,
  live_data_status: liveResp.dataStatus,
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
