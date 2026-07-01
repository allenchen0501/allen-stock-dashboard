/**
 * 4966 Owner Approval Decision Gate Validator — fixture-only / static.
 *
 * Verifies the 4966 owner-approval decision gate: the doc + contract (deterministic; 4966
 * stays pending; approvalDate null; approvedChannel null; NOT in approvedLiveFetchSymbols;
 * decision states + transitions; required owner phrase + safety-boundary elements; approval
 * text is a TEMPLATE only; gate evaluation stays pending / next version locked; red-line
 * flags all false), that 4966 never leaked into any RUNTIME file, that no 4966 endpoint or
 * button exists, that the runtime approved set stays exactly ["3019"], and that this guard
 * + related validators stay standalone (safety-chain stays 22).
 *
 * NO network, NO smoke, NO production endpoint call, NO Supabase, NO env read, NO provider
 * change. Standalone. Exit 0 → PASS/WARNING, Exit 1 → FAIL.
 */

export {};

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

const gateModule = require("../use-cases/war-room/build-4966-owner-approval-decision-gate-contract") as typeof import("../use-cases/war-room/build-4966-owner-approval-decision-gate-contract");
const packetModule = require("../use-cases/war-room/build-4966-owner-approval-packet-contract") as typeof import("../use-cases/war-room/build-4966-owner-approval-packet-contract");
const core5Module = require("../use-cases/war-room/build-core-5-expansion-approval-contract") as typeof import("../use-cases/war-room/build-core-5-expansion-approval-contract");
const mvpModule = require("../use-cases/war-room/build-approved-live-quote-3019-mvp-contract") as typeof import("../use-cases/war-room/build-approved-live-quote-3019-mvp-contract");
const guardModule = require("../use-cases/war-room/build-safety-chain-ci-guard-contract") as typeof import("../use-cases/war-room/build-safety-chain-ci-guard-contract");
const { buildOwner4966DecisionGateContract } = gateModule;
const { buildOwner4966ApprovalPacketContract } = packetModule;
const { buildCore5ExpansionApprovalContract } = core5Module;
const { buildApproved3019LiveQuoteMvpContract } = mvpModule;
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
  for (const cc of conds) { if (cc.ok) details.push(`PASS  ${cc.pass}`); else { details.push(`FAIL  ${cc.fail}`); status = "FAIL"; } }
  checks.push({ name, status, details });
}
const CJK = /[一-鿿]/;
function arraysEqual(a: readonly unknown[], b: readonly unknown[]): boolean { return a.length === b.length && a.every((v, i) => v === b[i]); }

const DOC_REL = "docs/4966-owner-approval-decision-gate.md";
const CONTRACT_REL = "use-cases/war-room/build-4966-owner-approval-decision-gate-contract.ts";
const MVP_CONTRACT_REL = "use-cases/war-room/build-approved-live-quote-3019-mvp-contract.ts";
const ROUTE_REL = "app/api/war-room/approved-live-quote/route.ts";
const PROVIDER_REL = "services/market-data/twse-tpex-verification-provider.ts";
const DASHBOARD_REL = "components/war-room-dashboard.tsx";
const HANDOFF_REL = "docs/project-handoff-summary.md";
const README_REL = "README.md";
const PKG_REL = "package.json";

const doc = readFile(resolve(DOC_REL)) ?? "";
const contractRaw = readFile(resolve(CONTRACT_REL)) ?? "";
const contractLower = stripComments(contractRaw).toLowerCase();
const mvpContractRaw = readFile(resolve(MVP_CONTRACT_REL)) ?? "";
const routeRaw = readFile(resolve(ROUTE_REL)) ?? "";
const providerRaw = readFile(resolve(PROVIDER_REL)) ?? "";
const dashboard = readFile(resolve(DASHBOARD_REL)) ?? "";
const handoff = readFile(resolve(HANDOFF_REL)) ?? "";
const readme = readFile(resolve(README_REL)) ?? "";
const pkgBody = readFile(resolve(PKG_REL));

const runtimeCombined = stripComments(mvpContractRaw) + "\n" + stripComments(routeRaw) + "\n" + stripComments(providerRaw) + "\n" + dashboard;

const g = buildOwner4966DecisionGateContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const gB = buildOwner4966DecisionGateContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const gg = g as unknown as Record<string, unknown>;
const packet = buildOwner4966ApprovalPacketContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const core5 = buildCore5ExpansionApprovalContract({ generatedAt: "2026-07-02T00:00:00.000Z" });
const core5_4966 = core5.core5Candidates.find((x) => x.symbol === "4966");
const mvp = buildApproved3019LiveQuoteMvpContract({ generatedAt: "2026-07-02T00:00:00.000Z" });

function noTok(body: string, t: string): boolean { return !body.includes(t); }

// ---------------------------------------------------------------------------
// 1–3. Files + determinism
// ---------------------------------------------------------------------------
pushCheck("01_doc_exists", [{ ok: fileExists(resolve(DOC_REL)), pass: "decision gate doc exists.", fail: "decision gate doc must exist." }]);
pushCheck("02_contract_exists", [{ ok: fileExists(resolve(CONTRACT_REL)), pass: "decision gate contract exists.", fail: "decision gate contract must exist." }]);
pushCheck("03_deterministic", [{ ok: JSON.stringify(g) === JSON.stringify(gB), pass: "contract deterministic.", fail: "contract must be deterministic." }]);

// ---------------------------------------------------------------------------
// 4–16. Doc content
// ---------------------------------------------------------------------------
pushCheck("04_doc_title", [{ ok: doc.includes("4966 Owner Approval Decision Gate"), pass: "doc has title.", fail: "doc must have the title." }]);
pushCheck("05_doc_symbol_name", [{ ok: doc.includes("4966") && doc.includes("譜瑞"), pass: "doc names 4966 譜瑞.", fail: "doc must name 4966 譜瑞." }]);
pushCheck("06_doc_current_state", [{ ok: doc.includes('currentApprovedLiveFetchSymbols = ["3019"]'), pass: "doc states currentApprovedLiveFetchSymbols = [3019].", fail: "doc must state currentApprovedLiveFetchSymbols = [3019]." }]);
pushCheck("07_doc_pending", [{ ok: doc.includes("pending_owner_approval") && doc.includes("not approved"), pass: "doc marks 4966 pending / not approved.", fail: "doc must mark 4966 pending / not approved." }]);
pushCheck("08_doc_states", [{ ok: doc.includes("Approval Decision States") && doc.includes("approved") && doc.includes("rejected"), pass: "doc defines pending/approved/rejected states.", fail: "doc must define pending/approved/rejected states." }]);
pushCheck("09_doc_transitions", [{ ok: doc.includes("State Transition Rules"), pass: "doc defines state transition rules.", fail: "doc must define state transition rules." }]);
pushCheck("10_doc_required_phrase", [{ ok: doc.includes("Owner Approval Required Phrase") && doc.includes("Approval Phrase Required Elements"), pass: "doc defines required phrase + elements.", fail: "doc must define required phrase + elements." }]);
pushCheck("11_doc_template_not_approval", [{ ok: doc.includes("Approval Text Template") && doc.includes("NOT YET APPROVED") && doc.includes("templateIsApproval=false"), pass: "doc marks template as not-approval.", fail: "doc must mark template as not-approval." }]);
pushCheck("12_doc_preconditions", [{ ok: doc.includes("Preconditions For Next Version") && doc.includes("channel verification") && doc.includes("per-symbol") && doc.includes("smoke") && doc.includes("production endpoint evidence"), pass: "doc lists next-version preconditions.", fail: "doc must list next-version preconditions." }]);
pushCheck("13_doc_post_approval", [{ ok: doc.includes("Post-Approval Remaining Requirements"), pass: "doc lists post-approval remaining requirements.", fail: "doc must list post-approval remaining requirements." }]);
pushCheck("14_doc_red_lines", [
  { ok: doc.includes('approved live-fetch symbols remain exactly ["3019"]'), pass: "doc: approvedLiveFetchSymbols exactly [3019].", fail: "doc must state approvedLiveFetchSymbols exactly [3019]." },
  { ok: doc.includes("no /api/portfolio switch"), pass: "doc: no /api/portfolio switch.", fail: "doc must state no /api/portfolio switch." },
  { ok: doc.includes("no Supabase"), pass: "doc: no Supabase.", fail: "doc must state no Supabase." },
  { ok: doc.includes("no broker API"), pass: "doc: no broker API.", fail: "doc must state no broker API." },
  { ok: doc.includes("no auto order"), pass: "doc: no auto order.", fail: "doc must state no auto order." },
  { ok: doc.includes("no production data switch"), pass: "doc: no production data switch.", fail: "doc must state no production data switch." },
]);
pushCheck("15_doc_next_version", [{ ok: doc.includes("4966 Read-Only Manual-Refresh MVP"), pass: "doc names next version.", fail: "doc must name the next version." }]);
pushCheck("16_doc_no_footprint", [{ ok: doc.includes("no 4966 live-fetch endpoint") && doc.includes("no 4966 War Room manual refresh button") && doc.includes("no 4966 smoke executed") && doc.includes("no 4966 production endpoint called"), pass: "doc states no endpoint/button/smoke/production this version.", fail: "doc must state no endpoint/button/smoke/production this version." }]);

// ---------------------------------------------------------------------------
// 17–34. Contract content
// ---------------------------------------------------------------------------
pushCheck("17_gate_version", [{ ok: g.gateVersion === "V1", pass: "gateVersion V1.", fail: "gateVersion must be V1." }]);
pushCheck("18_symbol_name", [{ ok: g.symbol === "4966" && g.nameZh === "譜瑞", pass: "symbol 4966 / nameZh 譜瑞.", fail: "symbol/nameZh must be 4966 / 譜瑞." }]);
pushCheck("19_pending", [{ ok: g.currentApprovalStatus === "pending_owner_approval" && g.ownerApprovalReceived === false, pass: "pending_owner_approval, ownerApprovalReceived false.", fail: "must be pending with ownerApprovalReceived false." }]);
pushCheck("20_no_approval_date", [{ ok: g.approvalDate === null && gg.approvalDateFilled === false, pass: "approvalDate null / not filled.", fail: "approvalDate must be null / not filled." }]);
pushCheck("21_no_approved_channel", [{ ok: g.approvedChannel === null && gg.approvedChannelFilled === false, pass: "approvedChannel null / not filled.", fail: "approvedChannel must be null / not filled." }]);
pushCheck("22_not_in_set", [{ ok: g.inApprovedLiveFetchSymbols === false, pass: "4966 NOT in approvedLiveFetchSymbols.", fail: "4966 must NOT be in approvedLiveFetchSymbols." }]);
pushCheck("23_not_approved_flag", [{ ok: gg.approvalStatusChangedToApproved === false, pass: "approvalStatus NOT changed to approved.", fail: "approvalStatus must NOT be changed to approved." }]);
pushCheck("24_current_state", [{ ok: arraysEqual(g.currentApprovedState.approvedLiveFetchSymbols, ["3019"]) && arraysEqual(g.currentApprovedState.approvedChannels, ["tse_3019.tw"]) && g.currentApprovedState.approvedProvider === "TWSE_TPEX", pass: "currentApprovedState is 3019 / tse_3019.tw / TWSE_TPEX.", fail: "currentApprovedState must be 3019 / tse_3019.tw / TWSE_TPEX." }]);
pushCheck("25_decision_states", [{ ok: arraysEqual(g.decisionStates, ["pending_owner_approval", "approved", "rejected"]), pass: "decisionStates pending/approved/rejected.", fail: "decisionStates must be pending/approved/rejected." }]);
pushCheck("26_transitions", [{ ok: g.stateTransitions.length >= 2 && g.stateTransitions.some((t) => t.from === "pending_owner_approval" && t.to === "approved") && g.stateTransitions.some((t) => t.to === "rejected"), pass: "state transitions include pending→approved and →rejected.", fail: "state transitions must include pending→approved and →rejected." }]);
pushCheck("27_required_phrase", [{ ok: CJK.test(g.ownerApprovalRequiredPhrase) && g.ownerApprovalRequiredPhrase.includes("read-only") && g.ownerApprovalRequiredPhrase.includes("manual-refresh-only"), pass: "required phrase present (繁中, read-only, manual-refresh-only).", fail: "required phrase must be present with read-only + manual-refresh-only." }]);
pushCheck("28_phrase_elements", [{ ok: g.approvalPhraseRequiredElements.length >= 4, pass: `approvalPhraseRequiredElements has ${g.approvalPhraseRequiredElements.length} items.`, fail: "approvalPhraseRequiredElements must have >= 4 items." }]);
pushCheck("29_template_not_approval", [{ ok: g.templateIsApproval === false && g.approvalTextTemplate.includes("NOT YET APPROVED"), pass: "approval text is a template only.", fail: "approval text must be a template only." }]);
pushCheck("30_gate_evaluation", [{ ok: g.gateEvaluation.ownerApprovalReceived === false && g.gateEvaluation.resultingStatus === "pending_owner_approval" && g.gateEvaluation.nextVersionUnlocked === false && g.gateEvaluation.allSafetyElementsPresent === false, pass: "gate evaluation stays pending / next version locked.", fail: "gate evaluation must stay pending / next version locked." }]);
pushCheck("31_preconditions", [{ ok: g.preconditionsForNextVersion.length >= 4, pass: `preconditionsForNextVersion has ${g.preconditionsForNextVersion.length} items.`, fail: "preconditionsForNextVersion must have >= 4 items." }]);
pushCheck("32_post_approval", [{ ok: g.postApprovalRemainingRequirements.length >= 4, pass: `postApprovalRemainingRequirements has ${g.postApprovalRemainingRequirements.length} items.`, fail: "postApprovalRemainingRequirements must have >= 4 items." }]);
pushCheck("33_next_locked", [{ ok: g.nextVersion === "4966 Read-Only Manual-Refresh MVP" && g.nextVersionUnlocked === false, pass: "next version named + locked.", fail: "next version must be named + locked." }]);
pushCheck("34_red_line_flags", [{ ok:
  gg.liveFetchSymbolAdded === false && gg.approvedSetExpanded === false && gg.newRuntimeChannelAdded === false &&
  gg.endpointCreatedFor4966 === false && gg.warRoomButtonCreatedFor4966 === false && gg.smokeExecutedFor4966 === false &&
  gg.productionEndpointCalledFor4966 === false && gg.realNetworkUsed === false && gg.supabaseConnected === false &&
  gg.envReadPerformed === false && gg.databaseWritePerformed === false && gg.brokerConnected === false &&
  gg.buySellCommandGenerated === false && gg.autoOrderRequested === false && gg.productionDataSwitched === false &&
  gg.productionTradingReady === false, pass: "all red-line flags false.", fail: "all red-line flags must be false." }]);

// ---------------------------------------------------------------------------
// 35–41. Runtime must NOT expand + hygiene + cross-consistency
// ---------------------------------------------------------------------------
pushCheck("35_runtime_mvp_3019", [{ ok: arraysEqual(mvp.approvedLiveFetchSymbols, ["3019"]) && arraysEqual(mvp.approvedChannels, ["tse_3019.tw"]), pass: "runtime MVP contract still 3019 / tse_3019.tw only.", fail: "runtime MVP contract must remain 3019 / tse_3019.tw only." }]);
pushCheck("36_no_4966_in_runtime", [{ ok: !runtimeCombined.includes("4966"), pass: "4966 not leaked into runtime files.", fail: "4966 must not appear in runtime files (provider/route/MVP contract/dashboard)." }]);
pushCheck("37_no_4966_endpoint_or_button", [
  { ok: !fileExists(resolve("app/api/war-room/approved-live-quote-4966/route.ts")) && !fileExists(resolve("app/api/war-room/4966/route.ts")) && !fileExists(resolve("app/api/4966/route.ts")), pass: "no 4966-specific endpoint file exists.", fail: "no 4966-specific endpoint file may exist." },
  { ok: !dashboard.includes("手動刷新 4966"), pass: "dashboard has no 4966 manual refresh button.", fail: "dashboard must have no 4966 manual refresh button." },
]);
pushCheck("38_provider_scope", [{ ok: providerRaw.includes('LIMITED_LIVE_FETCH_APPROVED_SYMBOL = "3019"') && providerRaw.includes('LIMITED_LIVE_FETCH_APPROVED_CHANNEL = "tse_3019.tw"'), pass: "provider still restricts to 3019 / tse_3019.tw.", fail: "provider must still restrict to 3019 / tse_3019.tw." }]);
pushCheck("39_contract_hygiene", [
  { ok: noTok(contractLower, "fetch("), pass: "contract has no fetch(.", fail: "contract must not fetch." },
  { ok: noTok(contractLower, "@supabase") && noTok(contractLower, "createclient") && gg.supabaseConnected === false, pass: "contract has no Supabase.", fail: "contract must not use Supabase." },
  { ok: noTok(contractLower, "process.env") && gg.envReadPerformed === false, pass: "contract has no process.env.", fail: "contract must not read process.env." },
  { ok: noTok(contractLower, "insert(") && noTok(contractLower, "upsert(") && noTok(contractLower, ".update("), pass: "contract has no DB write.", fail: "contract must not write DB." },
  { ok: noTok(contractLower, "broker_api") && noTok(contractLower, "placeorder") && gg.brokerConnected === false, pass: "contract has no broker / order usage.", fail: "contract must not use broker / order." },
  { ok: noTok(contractLower, "/api/portfolio"), pass: "contract has no /api/portfolio literal.", fail: "contract must not contain /api/portfolio literal." },
  { ok: noTok(contractLower, "yahoo-readonly-provider") && noTok(contractLower, "yahoo.com") && noTok(contractLower, "query1.finance"), pass: "contract has no Yahoo provider/URL.", fail: "contract must not add a Yahoo provider/URL." },
]);
pushCheck("40_cross_consistency", [
  { ok: packet.approvalStatus === "pending_owner_approval" && packet.inApprovedLiveFetchSymbols === false, pass: "packet contract still pending / not in set.", fail: "packet contract must still be pending / not in set." },
  { ok: !!core5_4966 && core5_4966.approvalStatus === "pending_owner_approval" && core5_4966.inApprovedLiveFetchSymbols === false, pass: "core-5 spec still lists 4966 pending / not in set.", fail: "core-5 spec must still list 4966 pending / not in set." },
]);

// ---------------------------------------------------------------------------
// 42–45. Standalone + chain integrity + docs
// ---------------------------------------------------------------------------
let safetyChain = "";
try { const pkg = pkgBody == null ? {} : (JSON.parse(pkgBody) as { scripts?: Record<string, string> }); safetyChain = pkg.scripts?.["test:safety-chain"] ?? ""; } catch { safetyChain = ""; }
let totalChecks = -1;
try { totalChecks = buildSafetyChainCiGuardContract({ generatedAt: "2026-07-02T00:00:00.000Z" }).result.totalChecks; } catch { totalChecks = -1; }

pushCheck("42_standalone", [
  { ok: pkgBody != null && pkgBody.includes('"test:4966-owner-approval-decision-gate": "node --require ./scripts/register-typescript.cjs ./scripts/validate-4966-owner-approval-decision-gate.ts"'), pass: "package.json has the script.", fail: "package.json must add the script." },
  { ok: safetyChain.length > 0 && !safetyChain.includes("test:4966-owner-approval-decision-gate"), pass: "guard NOT in test:safety-chain.", fail: "guard must NOT be in test:safety-chain." },
]);
pushCheck("43_safety_chain_22", [{ ok: totalChecks === 22, pass: `safety-chain remains 22 checks (got ${totalChecks}).`, fail: `safety-chain must remain 22 checks (got ${totalChecks}).` }]);
pushCheck("44_related_standalone", [
  { ok: !safetyChain.includes("test:4966-owner-approval-packet"), pass: "packet validator remains standalone.", fail: "packet validator must remain standalone." },
  { ok: !safetyChain.includes("test:core-5-expansion-approval-spec"), pass: "core-5 validator remains standalone.", fail: "core-5 validator must remain standalone." },
  { ok: !safetyChain.includes("test:approved-live-quote-3019-mvp"), pass: "MVP validator remains standalone.", fail: "MVP validator must remain standalone." },
]);
pushCheck("45_docs", [
  { ok: fileExists(resolve(HANDOFF_REL)) && handoff.includes("Project Handoff Summary"), pass: "project handoff summary present.", fail: "project handoff summary must remain present." },
  { ok: readme.includes("future completed version must include Project Handoff Summary"), pass: "README states the per-version Project Handoff Summary rule.", fail: "README must state the per-version Project Handoff Summary rule." },
  { ok: readme.includes("4966 Owner Approval Decision Gate"), pass: "README documents the 4966 decision gate.", fail: "README must document the 4966 decision gate." },
]);

const overallStatus = combineStatus(checks.map((x) => x.status));
const issues = checks.flatMap((x) => x.details.filter((d) => d.startsWith("FAIL")));
console.log(JSON.stringify({
  status: overallStatus,
  spec: "OWNER_4966_APPROVAL_DECISION_GATE",
  gate_version: g.gateVersion,
  symbol: g.symbol,
  current_approval_status: g.currentApprovalStatus,
  owner_approval_received: g.ownerApprovalReceived,
  next_version_unlocked: g.nextVersionUnlocked,
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
