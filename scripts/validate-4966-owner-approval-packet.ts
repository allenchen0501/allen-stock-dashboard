/**
 * 4966 Owner Approval Packet & Channel Verification Prep Validator — fixture-only / static.
 *
 * Verifies the 4966 owner-approval packet + channel-verification prep: the docs + contract
 * (deterministic; 4966 stays candidate_only / pending / not approved; approvedChannel null;
 * proposed channel unverified; NOT in approvedLiveFetchSymbols; no endpoint; no War Room
 * button; no smoke executed; no production endpoint called; red-line flags all false), that
 * 4966 / its proposed channel never leaked into any RUNTIME file, that no 4966 endpoint or
 * button exists, that the runtime approved set stays exactly ["3019"], and that this guard
 * + related validators stay standalone (safety-chain stays 22).
 *
 * NO network, NO smoke, NO production endpoint call, NO Supabase, NO env read, NO provider
 * change. Standalone. Exit 0 → PASS/WARNING, Exit 1 → FAIL.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const packetModule = require("../use-cases/war-room/build-4966-owner-approval-packet-contract") as typeof import("../use-cases/war-room/build-4966-owner-approval-packet-contract");
const mvpModule = require("../use-cases/war-room/build-approved-live-quote-3019-mvp-contract") as typeof import("../use-cases/war-room/build-approved-live-quote-3019-mvp-contract");
const core5Module = require("../use-cases/war-room/build-core-5-expansion-approval-contract") as typeof import("../use-cases/war-room/build-core-5-expansion-approval-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildOwner4966ApprovalPacketContract } = packetModule;
const { buildApproved3019LiveQuoteMvpContract } = mvpModule;
const { buildCore5ExpansionApprovalContract } = core5Module;
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

const PACKET_DOC_REL = "docs/4966-owner-approval-packet.md";
const CHANNEL_DOC_REL = "docs/4966-channel-verification-prep.md";
const CONTRACT_REL = "use-cases/war-room/build-4966-owner-approval-packet-contract.ts";
const MVP_CONTRACT_REL = "use-cases/war-room/build-approved-live-quote-3019-mvp-contract.ts";
const ROUTE_REL = "app/api/war-room/approved-live-quote/route.ts";
const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const DASHBOARD_REL = "components/war-room-dashboard.tsx";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const packetDoc = readFile(resolve(PACKET_DOC_REL)) ?? "";
const channelDoc = readFile(resolve(CHANNEL_DOC_REL)) ?? "";
const contractRaw = readFile(resolve(CONTRACT_REL)) ?? "";
const contractLower = stripComments(contractRaw).toLowerCase();
const mvpContractRaw = readFile(resolve(MVP_CONTRACT_REL)) ?? "";
const routeRaw = readFile(resolve(ROUTE_REL)) ?? "";
const providerRaw = readFile(resolve(PROVIDER_REL)) ?? "";
const dashboard = readFile(resolve(DASHBOARD_REL)) ?? "";
const handoff = readFile(resolve(HANDOFF_REL)) ?? "";
const readme = readFile(resolve(README_REL)) ?? "";
const pkgBody = readFile(resolve(PKG_REL));

// RUNTIME files that must NEVER contain 4966 or its proposed channel.
const runtimeCombined = stripComments(mvpContractRaw) + "\n" + stripComments(routeRaw) + "\n" + stripComments(providerRaw) + "\n" + dashboard;

const c = buildOwner4966ApprovalPacketContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const cB = buildOwner4966ApprovalPacketContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const cc = c as unknown as Record<string, unknown>;
const mvp = buildApproved3019LiveQuoteMvpContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const core5 = buildCore5ExpansionApprovalContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const core5_4966 = core5.core5Candidates.find((x) => x.symbol === "4966");

function noTok(body: string, t: string): boolean { return !body.includes(t); }

// ---------------------------------------------------------------------------
// 1–4. Files + determinism
// ---------------------------------------------------------------------------
pushCheck("01_packet_doc_exists", [{ ok: fileExists(resolve(PACKET_DOC_REL)), pass: "owner approval packet doc exists.", fail: "owner approval packet doc must exist." }]);
pushCheck("02_channel_doc_exists", [{ ok: fileExists(resolve(CHANNEL_DOC_REL)), pass: "channel verification prep doc exists.", fail: "channel verification prep doc must exist." }]);
pushCheck("03_contract_exists", [{ ok: fileExists(resolve(CONTRACT_REL)), pass: "packet contract exists.", fail: "packet contract must exist." }]);
pushCheck("04_deterministic", [{ ok: JSON.stringify(c) === JSON.stringify(cB), pass: "contract deterministic.", fail: "contract must be deterministic." }]);

// ---------------------------------------------------------------------------
// 5–16. Doc content
// ---------------------------------------------------------------------------
pushCheck("05_packet_title", [{ ok: packetDoc.includes("4966 Owner Approval Packet"), pass: "packet doc has title.", fail: "packet doc must have the title." }]);
pushCheck("06_packet_symbol_name", [{ ok: packetDoc.includes("4966") && packetDoc.includes("譜瑞"), pass: "packet doc names 4966 譜瑞.", fail: "packet doc must name 4966 譜瑞." }]);
pushCheck("07_packet_current_state", [{ ok: packetDoc.includes('currentApprovedLiveFetchSymbols = ["3019"]'), pass: "packet doc states currentApprovedLiveFetchSymbols = [3019].", fail: "packet doc must state currentApprovedLiveFetchSymbols = [3019]." }]);
pushCheck("08_packet_candidate_only", [{ ok: packetDoc.includes("candidate_only") && packetDoc.includes("pending_owner_approval"), pass: "packet doc marks 4966 candidate_only / pending.", fail: "packet doc must mark 4966 candidate_only / pending." }]);
pushCheck("09_packet_no_endpoint_button", [{ ok: packetDoc.includes("no 4966 live-fetch endpoint") && packetDoc.includes("no 4966 War Room manual refresh button"), pass: "packet doc states no 4966 endpoint / no button.", fail: "packet doc must state no 4966 endpoint / no button." }]);
pushCheck("10_packet_red_lines", [
  { ok: packetDoc.includes('approved live-fetch symbols remain exactly ["3019"]'), pass: "packet doc: approvedLiveFetchSymbols exactly [3019].", fail: "packet doc must state approvedLiveFetchSymbols exactly [3019]." },
  { ok: packetDoc.includes("no /api/portfolio switch"), pass: "packet doc: no /api/portfolio switch.", fail: "packet doc must state no /api/portfolio switch." },
  { ok: packetDoc.includes("no Supabase"), pass: "packet doc: no Supabase.", fail: "packet doc must state no Supabase." },
  { ok: packetDoc.includes("no broker API"), pass: "packet doc: no broker API.", fail: "packet doc must state no broker API." },
  { ok: packetDoc.includes("no auto order"), pass: "packet doc: no auto order.", fail: "packet doc must state no auto order." },
  { ok: packetDoc.includes("no production data switch"), pass: "packet doc: no production data switch.", fail: "packet doc must state no production data switch." },
]);
pushCheck("11_packet_smoke_plan", [{ ok: packetDoc.includes("Future Manual Smoke Plan") && packetDoc.includes("本版"), pass: "packet doc has future manual smoke plan (not executed).", fail: "packet doc must have future manual smoke plan (not executed)." }]);
pushCheck("12_packet_endpoint_cases", [{ ok: packetDoc.includes("Future Production Endpoint Cases") && packetDoc.includes("Case A") && packetDoc.includes("Case B") && packetDoc.includes("Case C") && packetDoc.includes("Case D"), pass: "packet doc has future production endpoint cases A–D.", fail: "packet doc must have future production endpoint cases A–D." }]);
pushCheck("13_packet_checklist", [{ ok: packetDoc.includes("Per-Symbol Required Evidence Checklist"), pass: "packet doc has per-symbol required evidence checklist.", fail: "packet doc must have per-symbol required evidence checklist." }]);
pushCheck("14_packet_schema_statement", [{ ok: packetDoc.includes("Owner Approval Record Schema") && packetDoc.includes("Owner Approval Required Statement"), pass: "packet doc has approval record schema + required statement.", fail: "packet doc must have approval record schema + required statement." }]);
pushCheck("15_packet_next_version", [{ ok: packetDoc.includes("4966 Read-Only Manual-Refresh MVP"), pass: "packet doc names next version.", fail: "packet doc must name the next version." }]);
pushCheck("16_channel_doc", [
  { ok: channelDoc.includes("4966 Channel Verification Prep"), pass: "channel doc has title.", fail: "channel doc must have the title." },
  { ok: channelDoc.includes("proposed_unverified") && channelDoc.includes("tse_4966.tw"), pass: "channel doc marks proposed / unverified channel.", fail: "channel doc must mark proposed / unverified channel." },
  { ok: channelDoc.includes("otc_"), pass: "channel doc mentions tse_/otc_ verification.", fail: "channel doc must mention tse_/otc_ verification." },
  { ok: channelDoc.includes('approvedLiveFetchSymbols = ["3019"]'), pass: "channel doc keeps runtime approvedLiveFetchSymbols = [3019].", fail: "channel doc must keep runtime approvedLiveFetchSymbols = [3019]." },
]);

// ---------------------------------------------------------------------------
// 17–32. Contract content
// ---------------------------------------------------------------------------
pushCheck("17_packet_version", [{ ok: c.packetVersion === "V1", pass: "packetVersion V1.", fail: "packetVersion must be V1." }]);
pushCheck("18_symbol_name", [{ ok: c.symbol === "4966" && c.nameZh === "譜瑞", pass: "symbol 4966 / nameZh 譜瑞.", fail: "symbol/nameZh must be 4966 / 譜瑞." }]);
pushCheck("19_candidate_only", [{ ok: c.candidateStatus === "candidate_only", pass: "candidateStatus candidate_only.", fail: "candidateStatus must be candidate_only." }]);
pushCheck("20_pending", [{ ok: c.approvalStatus === "pending_owner_approval" && c.ownerApproved === false, pass: "pending_owner_approval, ownerApproved false.", fail: "must be pending_owner_approval with ownerApproved false." }]);
pushCheck("21_channel_null", [{ ok: c.approvedChannel === null, pass: "approvedChannel null.", fail: "approvedChannel must be null." }]);
pushCheck("22_channel_proposed", [{ ok: c.channelVerified === false && c.channelStatus === "proposed_unverified" && c.proposedChannel === "tse_4966.tw", pass: "proposed channel unverified (tse_4966.tw).", fail: "proposed channel must be unverified (tse_4966.tw)." }]);
pushCheck("23_not_in_set", [{ ok: c.inApprovedLiveFetchSymbols === false, pass: "4966 NOT in approvedLiveFetchSymbols.", fail: "4966 must NOT be in approvedLiveFetchSymbols." }]);
pushCheck("24_no_endpoint_button", [{ ok: c.hasLiveFetchEndpoint === false && c.hasWarRoomManualRefreshButton === false, pass: "no 4966 endpoint / button.", fail: "must have no 4966 endpoint / button." }]);
pushCheck("25_no_smoke_no_prod", [{ ok: c.manualSmokeExecuted === false && c.productionEndpointTested === false, pass: "no smoke executed / no production endpoint tested.", fail: "must not execute smoke / production endpoint." }]);
pushCheck("26_current_state", [{ ok: arraysEqual(c.currentApprovedState.approvedLiveFetchSymbols, ["3019"]) && arraysEqual(c.currentApprovedState.approvedChannels, ["tse_3019.tw"]) && c.currentApprovedState.approvedProvider === "TWSE_TPEX", pass: "currentApprovedState is 3019 / tse_3019.tw / TWSE_TPEX.", fail: "currentApprovedState must be 3019 / tse_3019.tw / TWSE_TPEX." }]);
pushCheck("27_checklist", [{ ok: c.requiredEvidenceChecklist.length >= 8, pass: `requiredEvidenceChecklist has ${c.requiredEvidenceChecklist.length} items.`, fail: "requiredEvidenceChecklist must have >= 8 items." }]);
pushCheck("28_smoke_plan", [{ ok: c.futureManualSmokePlan.plannedOnly === true && c.futureManualSmokePlan.executed === false && c.futureManualSmokePlan.steps.length >= 3, pass: "future smoke plan is planned-only, not executed.", fail: "future smoke plan must be planned-only, not executed." }]);
pushCheck("29_endpoint_cases", [{ ok: c.futureProductionEndpointCases.length === 4 && c.futureProductionEndpointCases.every((x) => x.executed === false) && arraysEqual(c.futureProductionEndpointCases.map((x) => x.caseId), ["A", "B", "C", "D"]), pass: "4 future endpoint cases A–D, none executed.", fail: "must have 4 future endpoint cases A–D, none executed." }]);
pushCheck("30_record_schema", [{ ok: c.ownerApprovalRecordSchema.recordPopulated === false && c.ownerApprovalRecordSchema.ownerApproved === false && c.ownerApprovalRecordSchema.requiredFields.length >= 5, pass: "owner approval record schema present, unpopulated, not approved.", fail: "owner approval record schema must be present, unpopulated, not approved." }]);
pushCheck("31_statement_next", [{ ok: CJK.test(c.ownerApprovalRequiredStatementZh) && c.nextVersion === "4966 Read-Only Manual-Refresh MVP", pass: "owner statement (繁中) + next version present.", fail: "owner statement + next version must be present." }]);
pushCheck("32_red_line_flags", [{ ok:
  cc.liveFetchSymbolAdded === false && cc.approvedSetExpanded === false && cc.newRuntimeChannelAdded === false &&
  cc.endpointCreatedFor4966 === false && cc.warRoomButtonCreatedFor4966 === false && cc.smokeExecutedFor4966 === false &&
  cc.productionEndpointCalledFor4966 === false && cc.realNetworkUsed === false && cc.supabaseConnected === false &&
  cc.envReadPerformed === false && cc.databaseWritePerformed === false && cc.brokerConnected === false &&
  cc.buySellCommandGenerated === false && cc.autoOrderRequested === false && cc.productionDataSwitched === false &&
  cc.productionTradingReady === false, pass: "all red-line flags false.", fail: "all red-line flags must be false." }]);

// ---------------------------------------------------------------------------
// 33–40. Runtime must NOT expand + contract hygiene + cross-consistency
// ---------------------------------------------------------------------------
pushCheck("33_runtime_mvp_3019", [{ ok: arraysEqual(mvp.approvedLiveFetchSymbols, ["3019"]) && arraysEqual(mvp.approvedChannels, ["tse_3019.tw"]), pass: "runtime MVP contract still 3019 / tse_3019.tw only.", fail: "runtime MVP contract must remain 3019 / tse_3019.tw only." }]);
pushCheck("34_no_4966_in_runtime", [{ ok: !runtimeCombined.includes("4966"), pass: "4966 not leaked into runtime files.", fail: "4966 must not appear in runtime files (provider/route/MVP contract/dashboard)." }]);
pushCheck("35_no_channel_in_runtime", [{ ok: !runtimeCombined.includes("tse_4966") && !runtimeCombined.includes("otc_4966"), pass: "proposed channel not leaked into runtime files.", fail: "proposed channel must not appear in runtime files." }]);
pushCheck("36_no_4966_endpoint_file", [{ ok:
  !fileExists(resolve("app/api/war-room/approved-live-quote-4966/route.ts")) &&
  !fileExists(resolve("app/api/war-room/4966/route.ts")) &&
  !fileExists(resolve("app/api/4966/route.ts")), pass: "no 4966-specific endpoint file exists.", fail: "no 4966-specific endpoint file may exist." }]);
pushCheck("37_no_4966_button", [{ ok: !dashboard.includes("手動刷新 4966") && !dashboard.includes("4966"), pass: "dashboard has no 4966 manual refresh button.", fail: "dashboard must have no 4966 manual refresh button." }]);
pushCheck("38_provider_scope", [{ ok: providerRaw.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"') && providerRaw.includes('LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw"'), pass: "provider still restricts to 3019 / tse_3019.tw.", fail: "provider must still restrict to 3019 / tse_3019.tw." }]);
pushCheck("39_contract_hygiene", [
  { ok: noTok(contractLower, "fetch("), pass: "contract has no fetch(.", fail: "contract must not fetch." },
  { ok: noTok(contractLower, "@supabase") && noTok(contractLower, "createclient") && cc.supabaseConnected === false, pass: "contract has no Supabase.", fail: "contract must not use Supabase." },
  { ok: noTok(contractLower, "process.env") && cc.envReadPerformed === false, pass: "contract has no process.env.", fail: "contract must not read process.env." },
  { ok: noTok(contractLower, "insert(") && noTok(contractLower, "upsert(") && noTok(contractLower, ".update("), pass: "contract has no DB write.", fail: "contract must not write DB." },
  { ok: noTok(contractLower, "broker_api") && noTok(contractLower, "placeorder") && cc.brokerConnected === false, pass: "contract has no broker / order usage.", fail: "contract must not use broker / order." },
  { ok: noTok(contractLower, "yahoo-readonly-provider") && noTok(contractLower, "yahoo.com") && noTok(contractLower, "query1.finance"), pass: "contract has no Yahoo provider/URL.", fail: "contract must not add a Yahoo provider/URL." },
]);
pushCheck("40_core5_consistency", [{ ok: !!core5_4966 && core5_4966.approvalStatus === "pending_owner_approval" && core5_4966.inApprovedLiveFetchSymbols === false, pass: "core-5 spec still lists 4966 pending / not in set.", fail: "core-5 spec must still list 4966 pending / not in set." }]);

// ---------------------------------------------------------------------------
// 41–44. Standalone + chain integrity + docs
// ---------------------------------------------------------------------------
let safetyChain = "";
try { const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> }); safetyChain = pkg.scripts?.["test:safety-chain"] ?? ""; } catch { safetyChain = ""; }
let totalChecks = -1;
try { totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-02T00:00:00.000Z" }).result.totalChecks; } catch { totalChecks = -1; }

pushCheck("41_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:4966-owner-approval-packet": "node --require ./scripts/register-typescript.cjs ./scripts/validate-4966-owner-approval-packet.ts"'), pass: "package.json has the script.", fail: "package.json must add the script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:4966-owner-approval-packet"), pass: "guard NOT in test:safety-chain.", fail: "guard must NOT be in test:safety-chain." },
]);
pushCheck("42_safety_chain_22", [{ ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` }]);
pushCheck("43_related_standalone", [
  { ok: !safetyChain.includes("test:core-5-expansion-approval-spec"), pass: "core-5 validator remains standalone.", fail: "core-5 validator must remain standalone." },
  { ok: !safetyChain.includes("test:approved-live-quote-3019-mvp"), pass: "MVP validator remains standalone.", fail: "MVP validator must remain standalone." },
]);
pushCheck("44_docs", [
  { ok: fileExists(resolve(HANDOFF_REL)) && handoff.includes("Project Handoff Summary"), pass: "project handoff summary present.", fail: "project handoff summary must remain present." },
  { ok: readme.includes("future completed version must include Project Handoff Summary"), pass: "README states the per-version Project Handoff Summary rule.", fail: "README must state the per-version Project Handoff Summary rule." },
  { ok: readme.includes("4966 Owner Approval Packet"), pass: "README documents the 4966 owner approval packet.", fail: "README must document the 4966 owner approval packet." },
]);

const overallStatus = combineStatus(checks.map((x) => x.status));
const issues = checks.flatMap((x) => x.details.filter((d) => d.startsWith("FAIL")));
console.log(JSON.stringify({
  status: overallStatus,
  spec: "OWNER_4966_APPROVAL_PACKET",
  packet_version: c.packetVersion,
  symbol: c.symbol,
  approval_status: c.approvalStatus,
  approved_channel: c.approvedChannel,
  in_approved_set: c.inApprovedLiveFetchSymbols,
  runtime_approved_symbols: mvp.approvedLiveFetchSymbols,
  safety_chain_total_checks: totalChecks,
  total_checks: checks.length,
  passed_checks: checks.filter((x) => x.status === "PASS").length,
  failed_checks: checks.filter((x) => x.status === "FAIL").length,
  gates: Object.fromEntries(checks.map((x) => [x.name, x.status])),
  issues,
  request_performed: false,
  supabase_connected: false,
  env_read_performed: false,
}, null, 2));
process.exit(overallStatus === "FAIL" ? 1 : 0);
