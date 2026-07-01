/**
 * 3019 Approved Live Quote Production Endpoint Case Evidence Validator — static.
 *
 * Verifies the production endpoint case-evidence backfill: the smoke report's
 * "Production Endpoint Case Evidence" section (production URL, Cases A–D with actual
 * response summaries, evidence-conclusion safety statements), the route boundary
 * (3019-only, EXPLICIT manual-only, rejects without fetch, rejection reasonZh), the
 * read-only response shape, the War Room UI (manual-only trigger, default page load no
 * fetch), and that this guard + related validators stay standalone (safety-chain stays 22).
 * approved live-fetch symbols remain exactly ["3019"].
 *
 * NO real network here (evidence lives in the report), NO smoke run, NO Supabase, NO env
 * read, NO provider change. Standalone. Exit 0 → PASS/WARNING, Exit 1 → FAIL.
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
  sourceTimestamp: "2026-07-01T06:30:00.000Z", receivedAt: "2026-07-01T21:40:19.450Z",
  isRealData: true, isConnected: true, isDisabled: false,
  verificationStatus: "LIVE_FETCH_DRY_RUN",
  operationalUseAllowed: false, buySellCommandGenerated: false, autoOrderRequested: false,
} as unknown as Parameters<typeof mapApproved3019LiveQuoteResponse>[0];

const liveResp = mapApproved3019LiveQuoteResponse(LIVE_CANDIDATE, { now: fixedNow });
const fallbackResp = mapApproved3019LiveQuoteResponse(buildTwseTpexScaffoldCandidate("3019"), { now: fixedNow });
const sourceErrResp = mapApproved3019LiveQuoteResponse(null, { now: fixedNow });
const rejectResp = buildApproved3019RejectionResponse({ now: fixedNow, reasonZh: "非核准代號：僅核准 3019（亞光）。" });

function noTok(body: string, t: string): boolean { return !body.includes(t); }

// Text of one "### Case X" section, up to the next "### " / "## " header.
function caseSection(letter: string): string {
  const start = report.indexOf(`### Case ${letter}`);
  if (start < 0) return "";
  const rest = report.slice(start + 3);
  const nextIdx = rest.search(/\n#{2,3} /);
  return nextIdx < 0 ? rest : rest.slice(0, nextIdx);
}

function warRoomEffectBody(): string {
  const start = dashboard.indexOf("useEffect(() => {");
  if (start < 0) return "";
  const end = dashboard.indexOf("[mode]);", start);
  return end < 0 ? dashboard.slice(start) : dashboard.slice(start, end);
}
const effectBody = warRoomEffectBody();

// ---------------------------------------------------------------------------
// 1–18. Report evidence
// ---------------------------------------------------------------------------
pushCheck("01_report_exists", [{ ok: fileExists(resolve(REPORT_REL)), pass: "smoke report exists.", fail: "smoke report must exist." }]);
pushCheck("02_report_section", [{ ok: report.includes("Production Endpoint Case Evidence"), pass: "report includes Production Endpoint Case Evidence.", fail: "report must include Production Endpoint Case Evidence." }]);
pushCheck("03_report_prod_url", [{ ok: report.includes("https://allen-stock-dashboard.vercel.app"), pass: "report includes production URL.", fail: "report must include the production URL." }]);
pushCheck("04_case_a", [{ ok: report.includes("Case A") && report.includes("symbol=3019&mode=manual"), pass: "report includes Case A approved manual request.", fail: "report must include Case A approved manual request." }]);
pushCheck("05_case_b", [{ ok: report.includes("Case B") && report.includes("symbol=4966"), pass: "report includes Case B non-approved rejected.", fail: "report must include Case B non-approved rejected." }]);
pushCheck("06_case_c", [{ ok: report.includes("Case C"), pass: "report includes Case C missing manual mode.", fail: "report must include Case C missing manual mode." }]);
pushCheck("07_case_d", [{ ok: report.includes("Case D") && report.includes("mode=auto"), pass: "report includes Case D auto mode rejected.", fail: "report must include Case D auto mode rejected." }]);
pushCheck("08_case_a_summary", [{ ok: caseSection("A").includes("http status") && caseSection("A").includes("live_verified"), pass: "Case A records actual response summary.", fail: "Case A must record actual response summary." }]);
pushCheck("09_case_b_summary", [{ ok: caseSection("B").includes("http status") && caseSection("B").includes("requestPerformed：false"), pass: "Case B records actual response summary.", fail: "Case B must record actual response summary." }]);
pushCheck("10_case_c_summary", [{ ok: caseSection("C").includes("http status"), pass: "Case C records actual response summary.", fail: "Case C must record actual response summary." }]);
pushCheck("11_case_d_summary", [{ ok: caseSection("D").includes("http status") && caseSection("D").includes("requestPerformed：false"), pass: "Case D records actual response summary.", fail: "Case D must record actual response summary." }]);
pushCheck("12_no_fabrication", [{ ok: report.includes("不得假造價格") || report.includes("no price fabrication"), pass: "report states no price fabrication.", fail: "report must state no price fabrication." }]);
pushCheck("13_symbols_3019", [{ ok: report.includes('approved live-fetch symbols remain exactly ["3019"]'), pass: "report states approvedLiveFetchSymbols exactly [3019].", fail: "report must state approvedLiveFetchSymbols exactly [3019]." }]);
pushCheck("14_not_in_chain", [{ ok: report.includes("manual endpoint verification is not in safety-chain"), pass: "report states manual endpoint verification not in safety-chain.", fail: "report must state manual endpoint verification not in safety-chain." }]);
pushCheck("15_not_prod_switch", [{ ok: report.includes("this is not production data switch"), pass: "report states not production data switch.", fail: "report must state not production data switch." }]);
pushCheck("16_not_portfolio", [{ ok: report.includes("this is not /api/portfolio switch"), pass: "report states not /api/portfolio switch.", fail: "report must state not /api/portfolio switch." }]);
pushCheck("17_not_trading_signal", [{ ok: report.includes("this is not a trading signal"), pass: "report states not a trading signal.", fail: "report must state not a trading signal." }]);
pushCheck("18_not_auto_order", [{ ok: report.includes("this is not auto order"), pass: "report states not auto order.", fail: "report must state not auto order." }]);

// ---------------------------------------------------------------------------
// 19–24. Route boundary
// ---------------------------------------------------------------------------
pushCheck("19_route_exists", [{ ok: fileExists(resolve(ROUTE_REL)), pass: "route exists.", fail: "route must exist." }]);
pushCheck("20_route_symbol_3019", [{ ok: routeRaw.includes("APPROVED_LIVE_QUOTE_SYMBOL") && routeRaw.includes("symbol !== APPROVED_LIVE_QUOTE_SYMBOL"), pass: "route only allows symbol 3019.", fail: "route must only allow symbol 3019." }]);
pushCheck("21_route_mode_manual_explicit", [
  { ok: routeRaw.includes("searchParams.get('mode')"), pass: "route reads mode from query.", fail: "route must read mode from query." },
  { ok: routeRaw.includes("mode !== 'manual'"), pass: "route requires mode=manual.", fail: "route must require mode=manual." },
  { ok: !routeRaw.includes("get('mode') ?? 'manual'"), pass: "route does NOT default a missing mode to manual.", fail: "route must not default a missing mode to manual (must reject)." },
]);
{
  const idxReject = routeRaw.indexOf("buildApproved3019RejectionResponse");
  const idxFetch = routeRaw.indexOf("getTwseTpexLimitedLiveFetchCandidate");
  pushCheck("22_route_reject_symbol_no_fetch", [
    { ok: idxReject >= 0 && idxFetch >= 0 && idxReject < idxFetch, pass: "symbol rejection precedes any fetch (no fetch on reject).", fail: "symbol rejection must precede any fetch." },
  ]);
}
pushCheck("23_route_reject_mode_no_fetch", [
  { ok: routeRaw.includes("mode !== 'manual'"), pass: "route rejects non-manual mode.", fail: "route must reject non-manual mode." },
  { ok: rejectResp.requestPerformed === false && rejectResp.quote.price === null, pass: "rejection performs no fetch and has null price.", fail: "rejection must perform no fetch and have null price." },
]);
pushCheck("24_route_reason_zh", [{ ok: routeRaw.includes("reasonZh") && CJK.test(routeRaw), pass: "route includes reasonZh for rejected requests.", fail: "route must include reasonZh for rejected requests." }]);

// ---------------------------------------------------------------------------
// 25–31. Response shape
// ---------------------------------------------------------------------------
pushCheck("25_shape_sourceProvider", [{ ok: liveResp.sourceProvider === "TWSE_TPEX", pass: "response includes sourceProvider.", fail: "response must include sourceProvider." }]);
pushCheck("26_shape_approvedChannel", [{ ok: liveResp.approvedChannel === "tse_3019.tw", pass: "response includes approvedChannel.", fail: "response must include approvedChannel." }]);
pushCheck("27_shape_sourceTimestamp", [{ ok: "sourceTimestamp" in liveResp.quote && liveResp.quote.sourceTimestamp === "2026-07-01T06:30:00.000Z" && sourceErrResp.quote.sourceTimestamp === null, pass: "quote includes sourceTimestamp (null when unavailable).", fail: "quote must include sourceTimestamp." }]);
pushCheck("28_shape_fetchedAt", [{ ok: typeof liveResp.quote.fetchedAt === "string" && liveResp.quote.fetchedAt.length > 0, pass: "quote includes fetchedAt.", fail: "quote must include fetchedAt." }]);
pushCheck("29_shape_dataStatus", [{ ok: liveResp.dataStatus === "live_verified" && fallbackResp.dataStatus === "fallback" && rejectResp.dataStatus === "not_available", pass: "dataStatus produced correctly.", fail: "dataStatus must be produced correctly." }]);
pushCheck("30_shape_uiStatusZh", [{ ok: typeof liveResp.uiStatusZh === "string" && CJK.test(liveResp.uiStatusZh), pass: "response includes Chinese uiStatusZh.", fail: "response must include Chinese uiStatusZh." }]);
pushCheck("31_shape_safetyNoteZh", [{ ok: liveResp.safetyNoteZh.includes("非買賣建議") && liveResp.safetyNoteZh.includes("非進場訊號") && liveResp.safetyNoteZh.includes("非自動下單"), pass: "response safetyNoteZh states the three negations.", fail: "response safetyNoteZh must state the three negations." }]);

// ---------------------------------------------------------------------------
// 32–33. War Room UI
// ---------------------------------------------------------------------------
pushCheck("32_ui_refresh_button", [{ ok: dashboard.includes("手動刷新 3019"), pass: "dashboard includes 手動刷新 3019.", fail: "dashboard must include 手動刷新 3019." }]);
pushCheck("33_ui_no_auto_fetch", [
  { ok: dashboard.includes("onClick={refreshApprovedLiveQuote}"), pass: "live quote fetched only via manual onClick.", fail: "live quote must be fetched only via manual onClick." },
  { ok: effectBody.length > 0 && !effectBody.includes("approved-live-quote"), pass: "page-load useEffect never fetches approved-live-quote.", fail: "page-load useEffect must not fetch approved-live-quote." },
]);

// ---------------------------------------------------------------------------
// 34–49. Approved scope + red lines
// ---------------------------------------------------------------------------
pushCheck("34_approved_symbols", [{ ok: arraysEqual(contract.approvedLiveFetchSymbols, ["3019"]), pass: "approvedLiveFetchSymbols exactly [3019].", fail: "approvedLiveFetchSymbols must be exactly [3019]." }]);
pushCheck("35_approved_channels", [{ ok: arraysEqual(contract.approvedChannels, ["tse_3019.tw"]), pass: "approvedChannels exactly [tse_3019.tw].", fail: "approvedChannels must be exactly [tse_3019.tw]." }]);
for (const [id, sym] of [["36", "4966"], ["37", "5347"], ["38", "4979"], ["39", "2455"]] as const) {
  pushCheck(`${id}_no_${sym}`, [{ ok: !runtimeCombinedLower.includes(sym), pass: `no ${sym} as approved symbol.`, fail: `must not add ${sym} as an approved symbol.` }]);
}
pushCheck("40_no_yahoo", [{ ok: noTok(contractLower, "yahoo") && noTok(routeLower, "yahoo"), pass: "no Yahoo.", fail: "must not add Yahoo." }]);
pushCheck("41_no_new_provider", [{ ok: routeLower.includes("twse-tpex-verification-provider") && noTok(routeLower, "yahoo-readonly-provider"), pass: "only the approved provider is used.", fail: "must not import another provider." }]);
pushCheck("42_no_supabase", [{ ok: noTok(contractLower, "@supabase") && noTok(contractLower, "createclient") && noTok(routeLower, "@supabase") && noTok(routeLower, "createclient") && cc.supabaseConnected === false, pass: "no Supabase.", fail: "must not use Supabase." }]);
pushCheck("43_no_process_env", [{ ok: noTok(contractLower, "process.env") && noTok(routeLower, "process.env") && cc.envReadPerformed === false, pass: "no process.env.", fail: "must not read process.env." }]);
pushCheck("44_no_db_write", [{ ok: noTok(contractLower, "insert(") && noTok(contractLower, "upsert(") && noTok(contractLower, ".update(") && noTok(routeLower, "insert(") && noTok(routeLower, "upsert(") && noTok(routeLower, ".update(") && cc.databaseWritePerformed === false, pass: "no DB write.", fail: "must not write DB." }]);
pushCheck("45_no_broker", [{ ok: noTok(contractLower, "broker_api") && noTok(contractLower, "brokerapi") && noTok(routeLower, "broker_api") && noTok(routeLower, "brokerapi") && cc.brokerConnected === false, pass: "no broker API.", fail: "must not use broker API." }]);
pushCheck("46_no_buysell", [{ ok: noTok(contractLower, "placeorder") && noTok(routeLower, "placeorder") && cc.buySellCommandGenerated === false, pass: "no buy/sell command.", fail: "must not generate buy/sell command." }]);
pushCheck("47_no_auto_order", [{ ok: cc.autoOrderRequested === false && (liveResp as unknown as Record<string, unknown>).autoOrderRequested === false, pass: "no auto order.", fail: "must not auto order." }]);
pushCheck("48_no_production_switch", [{ ok: cc.productionDataSwitchAllowed === false, pass: "no production data switch.", fail: "must not allow production data switch." }]);
pushCheck("49_no_portfolio_switch", [{ ok: cc.portfolioApiSwitched === false && noTok(contractLower, "/api/portfolio") && noTok(routeLower, "/api/portfolio"), pass: "no /api/portfolio switch.", fail: "must not switch /api/portfolio." }]);

// ---------------------------------------------------------------------------
// 50–55. Standalone + chain integrity + handoff
// ---------------------------------------------------------------------------
let safetyChain = "";
try { const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> }); safetyChain = pkg.scripts?.["test:safety-chain"] ?? ""; } catch { safetyChain = ""; }
let totalChecks = -1;
try { totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-02T00:00:00.000Z" }).result.totalChecks; } catch { totalChecks = -1; }

pushCheck("50_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:approved-live-quote-3019-production-endpoint-cases": "node --require ./scripts/register-typescript.cjs ./scripts/validate-approved-live-quote-3019-production-endpoint-cases.ts"'), pass: "package.json has the script.", fail: "package.json must add the script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:approved-live-quote-3019-production-endpoint-cases"), pass: "guard NOT in test:safety-chain.", fail: "guard must NOT be in test:safety-chain." },
]);
pushCheck("51_safety_chain_22", [{ ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` }]);
pushCheck("52_prod_smoke_standalone", [{ ok: !safetyChain.includes("test:approved-live-quote-3019-production-smoke"), pass: "production-smoke validator remains standalone.", fail: "production-smoke validator must remain standalone." }]);
pushCheck("53_mvp_standalone", [{ ok: !safetyChain.includes("test:approved-live-quote-3019-mvp"), pass: "MVP validator remains standalone.", fail: "MVP validator must remain standalone." }]);
pushCheck("54_handoff_present", [{ ok: fileExists(resolve(HANDOFF_REL)) && handoff.includes("Project Handoff Summary"), pass: "project handoff summary present.", fail: "project handoff summary must remain present." }]);
pushCheck("55_completion_rule", [{ ok: readme.includes("future completed version must include Project Handoff Summary"), pass: "README states the per-version Project Handoff Summary rule.", fail: "README must state the per-version Project Handoff Summary rule." }]);

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
console.log(JSON.stringify({
  status: overallStatus,
  spec: "APPROVED_LIVE_QUOTE_3019_PRODUCTION_ENDPOINT_CASES",
  production_commit: "dea7f4e",
  production_deployment: "dpl_H4sZ3WRCNuGsqtDREP6JgubrQUuc",
  approved_symbols: contract.approvedLiveFetchSymbols,
  approved_channels: contract.approvedChannels,
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
