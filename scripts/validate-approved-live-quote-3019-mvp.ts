/**
 * 3019 Approved Live Quote Manual-Refresh MVP Validator — fixture-only / static.
 *
 * Verifies the read-only 3019 manual-refresh MVP: the boundary contract (deterministic,
 * approved scope, red-line flags), the read-only response mapper (shape, null-price
 * safety, Traditional-Chinese dataStatus text, timeout/fallback never crashing), the
 * API route + War Room UI integration, and that this guard stays standalone (off the
 * safety chain, which stays 22). Approved live-fetch symbols remain exactly ["3019"].
 *
 * This validator performs NO real network, NO smoke, NO Supabase, NO env read, NO provider
 * runtime change. It only reads files and calls PURE builders/mappers. Standalone.
 * Exit 0 → PASS/WARNING, Exit 1 → FAIL.
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
  approved3019UiStatusZh,
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
// Paths + file bodies
// ---------------------------------------------------------------------------

const DOC_REL = "docs/approved-live-quote-3019-manual-refresh-mvp.md";
const CONTRACT_REL = "use-cases/war-room/build-approved-live-quote-3019-mvp-contract.ts";
const ROUTE_REL = "app/api/war-room/approved-live-quote/route.ts";
const DASHBOARD_REL = "components/war-room-dashboard.tsx";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const doc = readFile(resolve(DOC_REL)) ?? "";
const contractRaw = readFile(resolve(CONTRACT_REL)) ?? "";
const contractLower = stripComments(contractRaw).toLowerCase();
const routeRaw = readFile(resolve(ROUTE_REL)) ?? "";
const routeLower = stripComments(routeRaw).toLowerCase();
const dashboard = readFile(resolve(DASHBOARD_REL)) ?? "";
const handoff = readFile(resolve(HANDOFF_REL)) ?? "";
const readme = readFile(resolve(README_REL)) ?? "";
const pkgBody = readFile(resolve(PKG_REL));

// Combined runtime source (contract + route + dashboard) for scope-expansion scans.
// NOTE: the doc is intentionally excluded — it legitimately names future-approval symbols.
const runtimeCombinedLower = (stripComments(contractRaw) + "\n" + stripComments(routeRaw) + "\n" + dashboard).toLowerCase();

const contract = buildApproved3019LiveQuoteMvpContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const contractB = buildApproved3019LiveQuoteMvpContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const cc = contract as unknown as Record<string, unknown>;

const fixedNow = (): Date => new Date("2026-07-02T00:00:00.000Z");

// Fixture (NOT fetched) live candidate → maps to live_verified.
const LIVE_CANDIDATE = {
  symbol: "3019", market: "TW", providerId: "mixed-public",
  providerName: "fixture", price: 142.5, open: 140.5, high: 143, low: 139.5,
  previousClose: 138, volume: 3010,
  sourceTimestamp: "2026-07-02T06:30:00.000Z", receivedAt: "2026-07-02T06:30:05.000Z",
  isRealData: true, isConnected: true, isDisabled: false,
  verificationStatus: "LIVE_FETCH_DRY_RUN",
  operationalUseAllowed: false, buySellCommandGenerated: false, autoOrderRequested: false,
} as unknown as Parameters<typeof mapApproved3019LiveQuoteResponse>[0];

const liveResp = mapApproved3019LiveQuoteResponse(LIVE_CANDIDATE, { now: fixedNow });
const scaffold = buildTwseTpexScaffoldCandidate("3019");
const fallbackResp = mapApproved3019LiveQuoteResponse(scaffold, { now: fixedNow });
const sourceErrResp = mapApproved3019LiveQuoteResponse(null, { now: fixedNow });
const timeoutResp = mapApproved3019LiveQuoteResponse(null, { now: fixedNow, timedOut: true });
const rejectResp = buildApproved3019RejectionResponse({ now: fixedNow });
const lr = liveResp as unknown as Record<string, unknown>;

function noTok(body: string, t: string): boolean { return !body.includes(t); }

// ---------------------------------------------------------------------------
// 1–3. Files exist
// ---------------------------------------------------------------------------
pushCheck("01_doc_exists", [{ ok: fileExists(resolve(DOC_REL)), pass: "MVP doc exists.", fail: "MVP doc must exist." }]);
pushCheck("02_contract_exists", [{ ok: fileExists(resolve(CONTRACT_REL)), pass: "boundary contract exists.", fail: "boundary contract must exist." }]);
pushCheck("03_route_exists", [{ ok: fileExists(resolve(ROUTE_REL)), pass: "API route exists.", fail: "API route / integration file must exist." }]);

// ---------------------------------------------------------------------------
// 4–8. War Room dashboard strings
// ---------------------------------------------------------------------------
pushCheck("04_dashboard_title", [{ ok: dashboard.includes("3019 核准真實報價"), pass: "dashboard includes 3019 核准真實報價.", fail: "dashboard must include 3019 核准真實報價." }]);
pushCheck("05_dashboard_refresh", [{ ok: dashboard.includes("手動刷新 3019"), pass: "dashboard includes 手動刷新 3019.", fail: "dashboard must include 手動刷新 3019." }]);
pushCheck("06_dashboard_not_trade", [{ ok: dashboard.includes("非買賣建議"), pass: "dashboard includes 非買賣建議.", fail: "dashboard must include 非買賣建議." }]);
pushCheck("07_dashboard_not_entry", [{ ok: dashboard.includes("非進場訊號"), pass: "dashboard includes 非進場訊號.", fail: "dashboard must include 非進場訊號." }]);
pushCheck("08_dashboard_not_auto", [{ ok: dashboard.includes("非自動下單"), pass: "dashboard includes 非自動下單.", fail: "dashboard must include 非自動下單." }]);

// ---------------------------------------------------------------------------
// 9. Default page load fetch disabled
// ---------------------------------------------------------------------------
pushCheck("09_default_no_fetch", [
  { ok: contract.defaultPageLoadFetchAllowed === false, pass: "contract.defaultPageLoadFetchAllowed=false.", fail: "defaultPageLoadFetchAllowed must be false." },
  { ok: doc.includes("預設 War Room page load 不打真實行情"), pass: "doc states default page load does not fetch real quote.", fail: "doc must state default page load does not fetch real quote." },
  { ok: dashboard.includes("onClick={refreshApprovedLiveQuote}"), pass: "live quote fetched only via manual onClick handler.", fail: "live quote must be fetched only via a manual onClick handler." },
]);

// ---------------------------------------------------------------------------
// 10–13. Manual-refresh-only + approved scope + rejection
// ---------------------------------------------------------------------------
pushCheck("10_manual_refresh_only", [{ ok: contract.manualRefreshOnly === true, pass: "manualRefreshOnly=true.", fail: "manualRefreshOnly must be true." }]);
pushCheck("11_approved_symbols", [{ ok: arraysEqual(contract.approvedLiveFetchSymbols, ["3019"]), pass: "approvedLiveFetchSymbols exactly [3019].", fail: "approvedLiveFetchSymbols must be exactly [3019]." }]);
pushCheck("12_approved_channels", [{ ok: arraysEqual(contract.approvedChannels, ["tse_3019.tw"]), pass: "approvedChannels exactly [tse_3019.tw].", fail: "approvedChannels must be exactly [tse_3019.tw]." }]);
pushCheck("13_non_approved_rejected", [
  { ok: contract.nonApprovedSymbolRejected === true, pass: "contract.nonApprovedSymbolRejected=true.", fail: "nonApprovedSymbolRejected must be true." },
  { ok: routeRaw.includes("APPROVED_LIVE_QUOTE_SYMBOL") && routeRaw.includes("!=="), pass: "route rejects non-approved symbol/mode.", fail: "route must reject non-approved symbol/mode." },
  { ok: rejectResp.requestPerformed === false && rejectResp.quote.price === null, pass: "rejection response performs no fetch and has null price.", fail: "rejection response must perform no fetch and have null price." },
]);

// ---------------------------------------------------------------------------
// 14–17. No new approved symbols (contract + route + dashboard only, NOT doc)
// ---------------------------------------------------------------------------
for (const [id, sym] of [["14", "4966"], ["15", "5347"], ["16", "4979"], ["17", "2455"]] as const) {
  pushCheck(`${id}_no_${sym}`, [{ ok: !runtimeCombinedLower.includes(sym), pass: `no ${sym} in runtime code.`, fail: `must not add ${sym} as an approved symbol.` }]);
}

// ---------------------------------------------------------------------------
// 18–27. Red-line boundary (contract + route scans + contract flags)
// ---------------------------------------------------------------------------
pushCheck("18_no_yahoo", [{ ok: noTok(contractLower, "yahoo") && noTok(routeLower, "yahoo"), pass: "no Yahoo.", fail: "must not add Yahoo." }]);
pushCheck("19_no_new_provider", [
  { ok: routeLower.includes("twse-tpex-verification-provider"), pass: "route uses the approved TWSE_TPEX provider.", fail: "route must use the approved TWSE_TPEX provider." },
  { ok: noTok(routeLower, "yahoo-readonly-provider") && noTok(contractLower, "yahoo-readonly-provider"), pass: "no other provider imported.", fail: "must not import another provider." },
]);
pushCheck("20_no_supabase", [{ ok: noTok(contractLower, "@supabase") && noTok(contractLower, "createclient") && noTok(routeLower, "@supabase") && noTok(routeLower, "createclient") && cc.supabaseConnected === false, pass: "no Supabase.", fail: "must not use Supabase." }]);
pushCheck("21_no_process_env", [{ ok: noTok(contractLower, "process.env") && noTok(routeLower, "process.env") && cc.envReadPerformed === false, pass: "no process.env.", fail: "must not read process.env." }]);
pushCheck("22_no_db_write", [{ ok: noTok(contractLower, "insert(") && noTok(contractLower, "upsert(") && noTok(contractLower, "delete(") && noTok(contractLower, ".update(") && noTok(routeLower, "insert(") && noTok(routeLower, "upsert(") && noTok(routeLower, ".update(") && cc.databaseWritePerformed === false, pass: "no DB write.", fail: "must not write DB." }]);
pushCheck("23_no_broker", [{ ok: noTok(contractLower, "broker_api") && noTok(contractLower, "brokerapi") && noTok(routeLower, "broker_api") && noTok(routeLower, "brokerapi") && cc.brokerConnected === false, pass: "no broker API.", fail: "must not use broker API." }]);
pushCheck("24_no_buysell", [{ ok: noTok(contractLower, "placeorder") && noTok(routeLower, "placeorder") && cc.buySellCommandGenerated === false, pass: "no buy/sell command.", fail: "must not generate buy/sell command." }]);
pushCheck("25_no_auto_order", [{ ok: cc.autoOrderRequested === false && (rejectResp as unknown as Record<string, unknown>).autoOrderRequested === false && lr.autoOrderRequested === false, pass: "no auto order.", fail: "must not auto order." }]);
pushCheck("26_no_production_switch", [{ ok: cc.productionDataSwitchAllowed === false, pass: "no production data switch.", fail: "must not allow production data switch." }]);
pushCheck("27_no_portfolio_switch", [{ ok: cc.portfolioApiSwitched === false && noTok(contractLower, "/api/portfolio") && noTok(routeLower, "/api/portfolio"), pass: "no /api/portfolio switch.", fail: "must not switch /api/portfolio." }]);

// ---------------------------------------------------------------------------
// 28–34. Response shape fields
// ---------------------------------------------------------------------------
pushCheck("28_shape_sourceProvider", [{ ok: liveResp.sourceProvider === "TWSE_TPEX", pass: "response includes sourceProvider=TWSE_TPEX.", fail: "response must include sourceProvider." }]);
pushCheck("29_shape_approvedChannel", [{ ok: liveResp.approvedChannel === "tse_3019.tw", pass: "response includes approvedChannel=tse_3019.tw.", fail: "response must include approvedChannel." }]);
pushCheck("30_shape_sourceTimestamp", [{ ok: "sourceTimestamp" in liveResp.quote && liveResp.quote.sourceTimestamp === "2026-07-02T06:30:00.000Z" && sourceErrResp.quote.sourceTimestamp === null, pass: "quote includes sourceTimestamp (null when unavailable).", fail: "quote must include sourceTimestamp." }]);
pushCheck("31_shape_fetchedAt", [{ ok: typeof liveResp.quote.fetchedAt === "string" && liveResp.quote.fetchedAt.length > 0, pass: "quote includes fetchedAt.", fail: "quote must include fetchedAt." }]);
pushCheck("32_shape_dataStatus", [{ ok: liveResp.dataStatus === "live_verified" && fallbackResp.dataStatus === "fallback" && sourceErrResp.dataStatus === "source_error" && timeoutResp.dataStatus === "timeout" && rejectResp.dataStatus === "not_available", pass: "dataStatus covers live_verified/fallback/source_error/timeout/not_available.", fail: "dataStatus must be produced correctly for each case." }]);
pushCheck("33_shape_uiStatusZh", [{ ok: typeof liveResp.uiStatusZh === "string" && CJK.test(liveResp.uiStatusZh), pass: "response includes Chinese uiStatusZh.", fail: "response must include Chinese uiStatusZh." }]);
pushCheck("34_shape_safetyNoteZh", [{ ok: typeof liveResp.safetyNoteZh === "string" && liveResp.safetyNoteZh.includes("非買賣建議") && liveResp.safetyNoteZh.includes("非進場訊號") && liveResp.safetyNoteZh.includes("非自動下單"), pass: "response includes safetyNoteZh with 非買賣建議/非進場訊號/非自動下單.", fail: "response safetyNoteZh must state 非買賣建議/非進場訊號/非自動下單." }]);

// ---------------------------------------------------------------------------
// 35. dataStatus UI text is Traditional Chinese (all 5 statuses)
// ---------------------------------------------------------------------------
const ALL_STATUSES = ["live_verified", "fallback", "timeout", "source_error", "not_available"] as const;
pushCheck("35_dataStatus_chinese", [{ ok: ALL_STATUSES.every((s) => CJK.test(approved3019UiStatusZh(s))), pass: "every dataStatus has Traditional-Chinese UI text.", fail: "every dataStatus must have Traditional-Chinese UI text." }]);

// ---------------------------------------------------------------------------
// 36. Timeout / fallback does not crash UI (null price, no throw)
// ---------------------------------------------------------------------------
pushCheck("36_timeout_fallback_safe", [
  { ok: fallbackResp.quote.price === null && timeoutResp.quote.price === null && sourceErrResp.quote.price === null, pass: "fallback/timeout/source_error have null price (no fake data).", fail: "fallback/timeout/source_error must have null price." },
  { ok: dashboard.includes("liveQuoteError") && dashboard.includes("安全 fallback"), pass: "dashboard renders a safe fallback branch on error.", fail: "dashboard must render a safe fallback branch on error." },
  { ok: fallbackResp.quote.change === null && fallbackResp.quote.changePercent === null, pass: "no change/changePercent fabricated in fallback.", fail: "must not fabricate change/changePercent in fallback." },
]);

// ---------------------------------------------------------------------------
// 37–40. Standalone + safety-chain integrity
// ---------------------------------------------------------------------------
let safetyChain = "";
try { const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> }); safetyChain = pkg.scripts?.["test:safety-chain"] ?? ""; } catch { safetyChain = ""; }
let totalChecks = -1;
try { totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-02T00:00:00.000Z" }).result.totalChecks; } catch { totalChecks = -1; }

pushCheck("37_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:approved-live-quote-3019-mvp": "node --require ./scripts/register-typescript.cjs ./scripts/validate-approved-live-quote-3019-mvp.ts"'), pass: "package.json has the script.", fail: "package.json must add the script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:approved-live-quote-3019-mvp"), pass: "guard NOT in test:safety-chain.", fail: "guard must NOT be in test:safety-chain." },
  { ok: !safetyChain.includes("smoke:limited-live-fetch:3019"), pass: "smoke script NOT in safety-chain.", fail: "smoke script must NOT be in safety-chain." },
]);
pushCheck("38_safety_chain_22", [{ ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` }]);
pushCheck("39_cross_module_standalone", [{ ok: !safetyChain.includes("test:cross-module-consistency-governance"), pass: "cross-module governance validator remains standalone.", fail: "cross-module governance validator must remain standalone." }]);
pushCheck("40_hp_standalone", [{ ok: !safetyChain.includes("test:17-horsepower-scanner"), pass: "17-horsepower validator remains standalone.", fail: "17-horsepower validator must remain standalone." }]);

// ---------------------------------------------------------------------------
// 41–42. Handoff present + completion-report rule
// ---------------------------------------------------------------------------
pushCheck("41_handoff_present", [{ ok: fileExists(resolve(HANDOFF_REL)) && handoff.includes("Project Handoff Summary"), pass: "project handoff summary present.", fail: "project handoff summary must remain present." }]);
pushCheck("42_completion_rule", [{ ok: readme.includes("future completed version must include Project Handoff Summary"), pass: "README states the per-version Project Handoff Summary rule.", fail: "README must state the per-version Project Handoff Summary rule." }]);

// ---------------------------------------------------------------------------
// Deterministic contract (sanity, not counted separately)
// ---------------------------------------------------------------------------
pushCheck("43_deterministic", [{ ok: JSON.stringify(contract) === JSON.stringify(contractB), pass: "boundary contract deterministic.", fail: "boundary contract must be deterministic." }]);

const overallStatus = combineStatus(checks.map((c) => c.status));
const issues = checks.flatMap((c) => c.details.filter((d) => d.startsWith("FAIL")));
console.log(JSON.stringify({
  status: overallStatus,
  spec: "APPROVED_LIVE_QUOTE_3019_MANUAL_REFRESH_MVP",
  mvp_version: contract.mvpVersion,
  approved_symbols: contract.approvedLiveFetchSymbols,
  approved_channels: contract.approvedChannels,
  safety_chain_total_checks: totalChecks,
  live_data_status: liveResp.dataStatus,
  fallback_data_status: fallbackResp.dataStatus,
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
